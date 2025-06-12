// src/hooks/websocket/topic-hooks/useWallet.ts

/**
 * useWallet Hook
 * 
 * @description V69 Standardized WebSocket Hook for Wallet Data
 * This hook provides real-time updates for wallet transactions and balances
 * Follows the exact message format defined by the backend team
 * 
 * @author BranchManager69
 * @version 2.0.0
 * @created 2025-04-10
 * @updated 2025-05-05
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWebSocket } from '../../../contexts/UnifiedWebSocketContext';
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';
import { TopicType } from '../index';
import { DDExtendedMessageType } from '../types';

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
        if (message.data && message.data.wallet_address) {
          setWalletState(prevState => {
            // Only update if we don't already have a wallet address
            if (!prevState.wallet_address) {
              return {
                ...prevState,
                wallet_address: message.data!.wallet_address
              };
            }
            return prevState;
          });
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
      setIsLoading(prevLoading => {
        if (prevLoading) {
          return false;
        }
        return prevLoading;
      });
    } catch (err) {
      console.error('[Wallet WebSocket] Error processing message:', err);
      dispatchWebSocketEvent('error', {
        socketType: TopicType.WALLET,
        message: 'Error processing wallet data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, []);

  // Connect to the unified WebSocket system
  const ws = useWebSocket();

  // Register message listener
  useEffect(() => {
    if (ws.registerListener) {
      const unregister = ws.registerListener('wallet-hook', [DDExtendedMessageType.DATA, DDExtendedMessageType.ERROR], handleMessage);
      return unregister;
    }
  }, [ws.registerListener]);

  // Subscribe to wallet data when connected (prevent duplicate subscriptions)
  const hasSubscribedWalletRef = useRef(false);
  const componentId = useMemo(() => `wallet-${Math.random().toString(36).substr(2, 9)}`, []);

  // Add debugging for auth state mismatches (dev only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const debugAuthState = () => {
        console.group('🔍 [Wallet Auth Debug] Current Authentication State');
        console.log('Frontend Auth:', {
          isConnected: ws.isConnected,
          isAuthenticated: ws.isAuthenticated,
          isReadyForSecureInteraction: ws.isReadyForSecureInteraction,
          connectionState: ws.connectionState,
          hasConnectionError: !!ws.connectionError
        });

        // Check if there's a mismatch between frontend and WebSocket auth
        if (ws.isConnected && !ws.isReadyForSecureInteraction) {
          console.warn('🚨 POTENTIAL GHOST AUTH: Connected but not ready for secure interaction');
          console.log('This might indicate the user appears authenticated but WebSocket auth failed');
        }

        console.groupEnd();
      };

      // Debug on state changes
      debugAuthState();
    }
  }, [ws.isConnected, ws.isAuthenticated, ws.isReadyForSecureInteraction, ws.connectionState]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined;

    // Wait for secure interaction readiness instead of just connection
    if (ws.isReadyForSecureInteraction && !hasSubscribedWalletRef.current) {
      console.log('[useWallet] WebSocket ready for secure interaction. Subscribing to wallet data with component ID:', componentId);

      // Subscribe to wallet and wallet-balance topics with component ID
      ws.subscribe([TopicType.WALLET, 'wallet-balance'], componentId);
      hasSubscribedWalletRef.current = true;

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
      timeoutId = setTimeout(() => {
        if (isLoading) {
          console.warn('[Wallet WebSocket] Timed out waiting for data');
          setIsLoading(false);
        }
      }, 30000);
    } else if (!ws.isReadyForSecureInteraction) {
      // Reset subscription flag when not ready for secure interaction
      hasSubscribedWalletRef.current = false;
      console.log('[useWallet] WebSocket not ready for secure interaction, deferring wallet setup.');
    }

    // Cleanup function
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (hasSubscribedWalletRef.current) {
        console.log('[useWallet] Unsubscribing from wallet data with component ID:', componentId);
        ws.unsubscribe([TopicType.WALLET, 'wallet-balance'], componentId);
        hasSubscribedWalletRef.current = false;
      }
    };
  }, [ws.isReadyForSecureInteraction, walletAddress, componentId]);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      console.log('[useWallet] Component unmounting, cleaning up subscriptions for component ID:', componentId);
      ws.cleanupComponent(componentId);
    };
  }, [componentId, ws.cleanupComponent]);

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
    if (!ws.isReadyForSecureInteraction) {
      console.warn('[Wallet WebSocket] Cannot update settings - WebSocket not ready for secure interaction');
      return Promise.reject(new Error('WebSocket not ready for secure interaction'));
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
  }, [ws.isReadyForSecureInteraction, ws.request]);

  // Force refresh wallet data
  const refreshWallet = useCallback(() => {
    setIsLoading(true);

    if (ws.isReadyForSecureInteraction) {
      // Request fresh wallet data
      const requestParams = walletAddress ? { walletAddress } : {};
      ws.request(TopicType.WALLET, 'GET_WALLET_DATA', requestParams);

      dispatchWebSocketEvent('wallet_refresh', {
        socketType: TopicType.WALLET,
        message: 'Refreshing wallet data',
        timestamp: new Date().toISOString()
      });

      // Set a timeout to reset loading state if we don't get data
      const refreshTimeoutId = setTimeout(() => {
        // Only clear loading if still waiting and connection is stable
        if (isLoading && ws.isReadyForSecureInteraction) {
          console.warn('[Wallet WebSocket] Refresh timed out waiting for data');
          setIsLoading(false);
        }
      }, 30000); // Increased from 15000 to 30000 (30 seconds)

      // Return cleanup function for the timeout
      return () => clearTimeout(refreshTimeoutId);
    } else {
      console.warn('[Wallet WebSocket] Cannot refresh - WebSocket not ready for secure interaction');
      setIsLoading(false);
    }
  }, [ws.isReadyForSecureInteraction, ws.request, walletAddress, isLoading]);

  // Return wallet data and helper functions
  return {
    transactions: walletState.transactions,
    balance: walletState.balance,
    settings: walletState.settings,
    walletAddress: walletState.wallet_address,
    isLoading,
    isConnected: ws.isConnected,
    error: ws.connectionError,
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