/**
 * Wallet WebSocket Hook - V69 Standardized Version
 * 
 * This hook connects to the wallet WebSocket service and provides real-time
 * wallet updates, transfer tracking, and wallet activity monitoring.
 */

import { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { dispatchWebSocketEvent } from '../../utils/wsMonitor';
import { SOCKET_TYPES, WEBSOCKET_ENDPOINT } from './types';
import useWebSocket from './useWebSocket';

interface WalletUpdate {
  type: "WALLET_UPDATED";
  data: {
    type: "created" | "statusChanged" | "balanceChanged";
    publicKey: string;
    balance?: number;
    status?: "active" | "inactive" | "locked";
    timestamp: string;
  };
}

interface TransferStarted {
  type: "TRANSFER_STARTED";
  data: {
    transfer_id: string;
    from: string;
    to: string;
    amount: number;
    token?: string;
    estimated_completion?: string;
    timestamp: string;
  };
}

interface TransferComplete {
  type: "TRANSFER_COMPLETE";
  data: {
    transfer_id: string;
    from: string;
    to: string;
    amount: number;
    status: "success" | "failed";
    final_amount?: number;
    fee?: number;
    error?: string;
    timestamp: string;
  };
}

interface WalletActivity {
  type: "WALLET_ACTIVITY";
  data: {
    wallet: string;
    activity_type: "login" | "logout" | "connect" | "disconnect";
    device_info?: string;
    ip_address?: string;
    location?: string;
    timestamp: string;
  };
}

type WalletMessage = WalletUpdate | TransferStarted | TransferComplete | WalletActivity;

export function useWalletWebSocket() {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { updateWalletStatus, trackTransfer, updateWalletActivity } = useStore();

  // Connect to the WebSocket using the standardized hook
  const { 
    status, 
    data, 
    error,
    connect,
    close
  } = useWebSocket<WalletMessage>({
    endpoint: WEBSOCKET_ENDPOINT,
    socketType: SOCKET_TYPES.WALLET,
    requiresAuth: true, // Wallet WebSocket requires authentication
    heartbeatInterval: 30000
  });

  // When the connection status changes, log it
  useEffect(() => {
    dispatchWebSocketEvent('wallet_status', {
      socketType: SOCKET_TYPES.WALLET,
      status,
      message: `Wallet WebSocket is ${status}`
    });
  }, [status]);

  // Process messages from the WebSocket
  useEffect(() => {
    if (!data) return;
    
    try {
      // Process the message based on its type
      switch (data.type) {
        case "WALLET_UPDATED":
          updateWalletStatus(data.data);
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('wallet_update', {
            socketType: SOCKET_TYPES.WALLET,
            message: `Wallet ${data.data.type} update received`,
            updateType: data.data.type,
            publicKey: data.data.publicKey,
            timestamp: new Date().toISOString()
          });
          break;
          
        case "TRANSFER_STARTED":
          trackTransfer({
            transfer_id: data.data.transfer_id,
            from: data.data.from,
            to: data.data.to,
            amount: data.data.amount,
            token: data.data.token,
            timestamp: data.data.timestamp,
          });
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('transfer_started', {
            socketType: SOCKET_TYPES.WALLET,
            message: `Transfer started: ${data.data.transfer_id}`,
            transferId: data.data.transfer_id,
            timestamp: new Date().toISOString()
          });
          break;
          
        case "TRANSFER_COMPLETE":
          trackTransfer({
            transfer_id: data.data.transfer_id,
            from: data.data.from,
            to: data.data.to,
            amount: data.data.amount,
            status: data.data.status,
            error: data.data.error,
            timestamp: data.data.timestamp,
          });
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('transfer_complete', {
            socketType: SOCKET_TYPES.WALLET,
            message: `Transfer completed: ${data.data.transfer_id}`,
            transferId: data.data.transfer_id,
            status: data.data.status,
            timestamp: new Date().toISOString()
          });
          break;
          
        case "WALLET_ACTIVITY":
          updateWalletActivity(data.data);
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('wallet_activity', {
            socketType: SOCKET_TYPES.WALLET,
            message: `Wallet activity: ${data.data.activity_type}`,
            wallet: data.data.wallet,
            activityType: data.data.activity_type,
            timestamp: new Date().toISOString()
          });
          break;
      }
    } catch (err) {
      console.error('Error processing wallet message:', err);
      dispatchWebSocketEvent('error', {
        socketType: SOCKET_TYPES.WALLET,
        message: 'Error processing wallet data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, [data, updateWalletStatus, trackTransfer, updateWalletActivity]);
  
  // Handle errors
  useEffect(() => {
    if (error) {
      console.error('Wallet WebSocket error:', error);
      dispatchWebSocketEvent('error', {
        socketType: SOCKET_TYPES.WALLET,
        message: error.message,
        error
      });
    }
  }, [error]);
  
  return {
    isConnected: status === 'online',
    error: error ? error.message : null,
    lastUpdate,
    connect,
    close
  };
}