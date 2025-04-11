/**
 * useWallet Hook
 * 
 * V69 Standardized WebSocket Hook for Wallet Data
 * This hook provides real-time updates for wallet transactions and balances
 * Follows the exact message format defined by the backend team
 * 
 * @author Branch Manager
 * @created 2025-04-10
 */

import { useCallback, useEffect, useState } from 'react';
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';
import { useUnifiedWebSocket } from '../useUnifiedWebSocket';
import { MessageType } from '../types';
import { TopicType } from '../index';

// Wallet data interfaces based on backend API documentation
export interface WalletTransaction {
  id: string;
  type: 'send' | 'receive' | 'swap' | 'stake' | 'unstake';
  status: 'pending' | 'confirmed' | 'failed';
  amount: number;
  token: string;
  timestamp: string;
  signature?: string;
  from?: string;
  to?: string;
}

export interface TokenBalance {
  address: string;
  symbol: string;
  balance: number;
  value_usd?: number;
}

export interface WalletBalance {
  wallet_address: string;
  sol_balance: number;
  tokens: TokenBalance[];
}

export interface WalletSettings {
  auto_approve?: boolean;
  spending_limit?: number;
}

export interface WalletState {
  wallet_address?: string;
  transactions: WalletTransaction[];
  balance: WalletBalance | null;
  settings: WalletSettings;
}

// Default wallet state
const DEFAULT_WALLET_STATE: WalletState = {
  wallet_address: undefined,
  transactions: [],
  balance: null,
  settings: {}
};

// Define the standard structure for wallet data updates from the server
// Following the exact format from the backend team
interface WebSocketWalletMessage {
  type: string; // 'DATA'
  topic: string; // 'wallet' or 'wallet-balance'
  subtype?: 'transaction' | 'settings';
  action?: 'initiated' | 'confirmed' | 'failed';
  data: {
    wallet_address?: string;
    transaction?: WalletTransaction;
    settings?: WalletSettings;
    sol_balance?: number;
    tokens?: TokenBalance[];
  };
  timestamp: string;
}

/**
 * Hook for accessing and managing wallet data with real-time updates
 * Uses the unified WebSocket system
 * 
 * @param walletAddress Optional specific wallet address to monitor
 */
export function useWallet(walletAddress?: string) {
  // State for wallet data
  const [walletState, setWalletState] = useState<WalletState>(DEFAULT_WALLET_STATE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Message handler for WebSocket messages
  const handleMessage = useCallback((message: Partial<WebSocketWalletMessage>) => {
    try {
      // Handle wallet transaction updates
      if (message.type === 'DATA' && message.topic === 'wallet' && message.data) {
        if (message.subtype === 'transaction' && message.data.transaction) {
          // Update transaction list
          const transaction = message.data.transaction;
          
          setWalletState(prevState => {
            // Check if transaction already exists
            const existingIndex = prevState.transactions.findIndex(tx => tx.id === transaction.id);
            
            if (existingIndex >= 0) {
              // Update existing transaction
              const updatedTransactions = [...prevState.transactions];
              updatedTransactions[existingIndex] = {
                ...updatedTransactions[existingIndex],
                ...transaction
              };
              
              return {
                ...prevState,
                transactions: updatedTransactions
              };
            } else {
              // Add new transaction
              return {
                ...prevState,
                transactions: [transaction, ...prevState.transactions]
              };
            }
          });
          
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('wallet_transaction_update', {
            socketType: TopicType.WALLET,
            message: `Updated wallet transaction ${transaction.id}`,
            timestamp: new Date().toISOString(),
            transactionType: transaction.type,
            status: transaction.status
          });
        }
        else if (message.subtype === 'settings' && message.data && message.data.settings) {
          // Update wallet settings
          const messageSettings = message.data.settings;
          setWalletState(prevState => ({
            ...prevState,
            settings: {
              ...prevState.settings,
              ...messageSettings
            }
          }));
          
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('wallet_settings_update', {
            socketType: TopicType.WALLET,
            message: 'Updated wallet settings',
            timestamp: new Date().toISOString()
          });
        }
        
        // Update wallet address if provided
        if (message.data && message.data.wallet_address && !walletState.wallet_address) {
          const walletAddress = message.data.wallet_address;
          setWalletState(prevState => ({
            ...prevState,
            wallet_address: walletAddress
          }));
        }
      }
      
      // Handle wallet balance updates
      if (message.type === 'DATA' && message.topic === 'wallet-balance' && message.data) {
        const balanceData = message.data;
        // Create a balance object if we have the required data
        if (balanceData.wallet_address) {
          const walletBalanceData: WalletBalance = {
            wallet_address: balanceData.wallet_address,
            sol_balance: balanceData.sol_balance || 0,
            tokens: balanceData.tokens || []
          };
          
          setWalletState(prevState => ({
            ...prevState,
            balance: walletBalanceData
          }));
          
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('wallet_balance_update', {
            socketType: 'wallet-balance',
            message: 'Updated wallet balance',
            timestamp: new Date().toISOString(),
            walletAddress: balanceData.wallet_address
          });
        }
      }
      
      // Mark as not loading once we've processed any valid message
      if (isLoading) {
        setIsLoading(false);
      }
    } catch (err) {
      console.error('[Wallet WebSocket] Error processing message:', err);
      dispatchWebSocketEvent('error', {
        socketType: TopicType.WALLET,
        message: 'Error processing wallet data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, [isLoading, walletState.wallet_address]);

  // Connect to WebSocket
  const ws = useUnifiedWebSocket(
    'wallet-hook',
    [MessageType.DATA, MessageType.ERROR],
    handleMessage,
    [TopicType.WALLET, 'wallet-balance', TopicType.SYSTEM] // Both wallet and wallet-balance topics
  );

  // Subscribe to wallet data when connected
  useEffect(() => {
    if (ws.isConnected && isLoading) {
      // Subscribe to wallet and wallet-balance topics
      ws.subscribe([TopicType.WALLET, 'wallet-balance']);
      
      // Request initial wallet data
      const requestParams = walletAddress ? { walletAddress } : {};
      ws.request(TopicType.WALLET, 'GET_WALLET_DATA', requestParams);
      
      dispatchWebSocketEvent('wallet_subscribe', {
        socketType: TopicType.WALLET,
        message: 'Subscribing to wallet data',
        timestamp: new Date().toISOString(),
        walletAddress: walletAddress || 'user wallet'
      });
      
      // Set a timeout to reset loading state if we don't get data
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          console.warn('[Wallet WebSocket] Timed out waiting for data');
          setIsLoading(false);
        }
      }, 10000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [ws.isConnected, isLoading, ws.subscribe, ws.request, walletAddress]);

  // Send a transaction
  const sendTransaction = useCallback((params: {
    recipient: string;
    amount: number;
    token: string;
  }) => {
    if (!ws.isConnected) {
      console.warn('[Wallet WebSocket] Cannot send transaction - WebSocket not connected');
      return Promise.reject(new Error('WebSocket not connected'));
    }
    
    return new Promise<string>((resolve, reject) => {
      // The request method returns a boolean indicating if the message was sent
      const requestSent = ws.request(TopicType.WALLET, 'SEND_TRANSACTION', params);
      
      if (requestSent) {
        // Success path - request was sent
        dispatchWebSocketEvent('wallet_send_transaction', {
          socketType: TopicType.WALLET,
          message: `Requested to send ${params.amount} ${params.token} to ${params.recipient}`,
          timestamp: new Date().toISOString()
        });
        
        // For demo purposes, create a transaction ID
        // In a real app, this would come from the server in a response
        const mockTransactionId = `tx-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        
        // Optimistically add transaction to state
        const newTransaction: WalletTransaction = {
          id: mockTransactionId,
          type: 'send',
          status: 'pending',
          amount: params.amount,
          token: params.token,
          timestamp: new Date().toISOString(),
          to: params.recipient
        };
        
        setWalletState(prevState => ({
          ...prevState,
          transactions: [newTransaction, ...prevState.transactions]
        }));
        
        resolve(mockTransactionId);
      } else {
        // Error path - request failed to send
        const errorMessage = 'Failed to send transaction request';
        dispatchWebSocketEvent('error', {
          socketType: TopicType.WALLET,
          message: 'Error sending transaction',
          error: errorMessage
        });
        reject(new Error(errorMessage));
      }
    });
  }, [ws.isConnected, ws.request]);

  // Update wallet settings
  const updateSettings = useCallback((settings: WalletSettings) => {
    if (!ws.isConnected) {
      console.warn('[Wallet WebSocket] Cannot update settings - WebSocket not connected');
      return Promise.reject(new Error('WebSocket not connected'));
    }
    
    return new Promise<void>((resolve, reject) => {
      const requestSent = ws.request(TopicType.WALLET, 'UPDATE_SETTINGS', { settings });
      
      if (requestSent) {
        // Optimistically update settings
        setWalletState(prevState => ({
          ...prevState,
          settings: {
            ...prevState.settings,
            ...settings
          }
        }));
        
        dispatchWebSocketEvent('wallet_settings_update_request', {
          socketType: TopicType.WALLET,
          message: 'Requested wallet settings update',
          timestamp: new Date().toISOString()
        });
        
        resolve();
      } else {
        const errorMessage = 'Failed to send settings update request';
        dispatchWebSocketEvent('error', {
          socketType: TopicType.WALLET,
          message: 'Error updating wallet settings',
          error: errorMessage
        });
        reject(new Error(errorMessage));
      }
    });
  }, [ws.isConnected, ws.request]);

  // Force refresh wallet data
  const refreshWallet = useCallback(() => {
    setIsLoading(true);
    
    if (ws.isConnected) {
      // Request fresh wallet data
      const requestParams = walletAddress ? { walletAddress } : {};
      ws.request(TopicType.WALLET, 'GET_WALLET_DATA', requestParams);
      
      dispatchWebSocketEvent('wallet_refresh', {
        socketType: TopicType.WALLET,
        message: 'Refreshing wallet data',
        timestamp: new Date().toISOString()
      });
      
      // Set a timeout to reset loading state if we don't get data
      setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
        }
      }, 10000);
    } else {
      console.warn('[Wallet WebSocket] Cannot refresh - WebSocket not connected');
      setIsLoading(false);
    }
  }, [ws.isConnected, ws.request, walletAddress, isLoading]);

  // Return wallet data and helper functions
  return {
    transactions: walletState.transactions,
    balance: walletState.balance,
    settings: walletState.settings,
    walletAddress: walletState.wallet_address,
    isLoading,
    isConnected: ws.isConnected,
    error: ws.error,
    lastUpdate,
    sendTransaction,
    updateSettings,
    refreshWallet,
    
    // Helper functions
    getTransaction: useCallback((id: string) => {
      return walletState.transactions.find(tx => tx.id === id) || null;
    }, [walletState.transactions]),
    
    getTokenBalance: useCallback((symbol: string) => {
      if (!walletState.balance) return 0;
      const token = walletState.balance.tokens.find(t => t.symbol === symbol);
      return token ? token.balance : 0;
    }, [walletState.balance])
  };
}