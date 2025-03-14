import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { useWebSocket } from './websocket/useWebSocket';

export interface WalletStatus {
  type: 'created' | 'statusChanged' | 'balanceChanged';
  publicKey: string;
  balance?: number;
  status?: 'active' | 'inactive' | 'locked';
  last_updated: string;
}

export interface WalletTransfer {
  transfer_id: string;
  from: string;
  to: string;
  amount: number;
  status: 'pending' | 'success' | 'failed';
  timestamp: string;
  token?: string;
  error?: string;
}

export interface WalletActivity {
  wallet: string;
  activity_type: 'login' | 'logout' | 'connect' | 'disconnect';
  device_info?: string;
  ip_address?: string;
  location?: string;
  timestamp: string;
}

export function useWalletWebSocket() {
  const [walletStatus, setWalletStatus] = useState<WalletStatus | null>(null);
  const [walletTransfers, setWalletTransfers] = useState<Record<string, WalletTransfer>>({});
  const [walletActivities, setWalletActivities] = useState<WalletActivity[]>([]);
  
  const { user } = useStore();
  const token = user?.jwt || user?.session_token;

  // Initialize WebSocket connection using the new hook
  const {
    isConnected,
    sendMessage,
    disconnect
  } = useWebSocket('wallet', {
    token,
    reconnect: true,
    maxReconnectAttempts: 10,
    onMessage: handleMessage,
    debug: true,
  });

  // Handle incoming messages
  function handleMessage(data: any) {
    switch(data.type) {
      case 'wallet_status':
        setWalletStatus({
          type: data.status_type || 'statusChanged',
          publicKey: data.wallet,
          balance: data.balance,
          status: data.wallet_status,
          last_updated: data.timestamp
        });
        break;
        
      case 'wallet_transfer':
        setWalletTransfers(prev => ({
          ...prev,
          [data.transfer_id]: {
            transfer_id: data.transfer_id,
            from: data.from,
            to: data.to,
            amount: data.amount,
            status: data.status || 'pending',
            timestamp: data.timestamp,
            token: data.token,
            error: data.error
          }
        }));
        break;
        
      case 'wallet_activity':
        setWalletActivities(prev => [
          {
            wallet: data.wallet,
            activity_type: data.activity_type,
            device_info: data.device_info,
            ip_address: data.ip_address,
            location: data.location,
            timestamp: data.timestamp
          },
          ...prev.slice(0, 19) // Keep last 20 activities
        ]);
        break;
    }
  }

  // Request wallet data when connected
  useEffect(() => {
    if (isConnected && user) {
      sendMessage({
        type: 'get_wallet_status',
        wallet: user.wallet_address
      });
    }
  }, [isConnected, user, sendMessage]);

  // Function to initiate a transfer
  const initiateTransfer = useCallback((toWallet: string, amount: number, token?: string) => {
    if (isConnected && user) {
      const transferId = `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      sendMessage({
        type: 'wallet_transfer',
        transfer_id: transferId,
        from: user.wallet_address,
        to: toWallet,
        amount,
        token
      });
      
      return transferId;
    }
    return null;
  }, [isConnected, user, sendMessage]);

  // Get the status of a transfer
  const getTransferStatus = useCallback((transferId: string) => {
    return walletTransfers[transferId] || null;
  }, [walletTransfers]);

  return {
    walletStatus,
    walletTransfers,
    walletActivities,
    isConnected,
    initiateTransfer,
    getTransferStatus,
    close: disconnect
  };
}

export default useWalletWebSocket;