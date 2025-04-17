/**
 * useSolanaBalance Hook
 * 
 * V69 Standardized WebSocket Hook for Solana Balance Data
 * Implements the exact message format defined in the backend documentation
 * 
 * @author Branch Manager
 * @created 2025-04-10
 */

import { useCallback, useEffect, useState } from 'react';
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';
import { useUnifiedWebSocket } from '../useUnifiedWebSocket';
import { MessageType } from '../types';

// Solana balance state
export interface SolanaBalanceState {
  walletAddress?: string;
  balance: number;
  isLoading: boolean;
  lastUpdate: Date | null;
}

// Default state
const DEFAULT_STATE: SolanaBalanceState = {
  walletAddress: undefined,
  balance: 0,
  isLoading: true,
  lastUpdate: null
};

// WebSocket message interface
interface WebSocketSolanaBalanceMessage {
  type: string;
  topic: string;
  balance?: number;
  walletAddress?: string;
  requestId?: string;
  timestamp?: string;
  message?: string;
  code?: number;
}

/**
 * Hook for accessing and managing Solana balance data with real-time updates
 * Uses the unified WebSocket system with the solana_balance topic
 * 
 * @param walletAddress Optional specific wallet address to monitor
 */
export function useSolanaBalance(walletAddress?: string) {
  // State for Solana balance data
  const [state, setState] = useState<SolanaBalanceState>(DEFAULT_STATE);

  // Message handler for WebSocket messages
  const handleMessage = useCallback((message: Partial<WebSocketSolanaBalanceMessage>) => {
    try {
      // Handle Solana balance updates
      if (message.type === 'SOLANA_BALANCE_UPDATE' && message.balance !== undefined) {
        setState(prevState => ({
          ...prevState,
          balance: message.balance || 0,
          isLoading: false,
          lastUpdate: new Date()
        }));
        
        dispatchWebSocketEvent('solana_balance_update', {
          socketType: 'solana_balance',
          message: `Updated Solana balance: ${message.balance}`,
          timestamp: new Date().toISOString()
        });
      }
      
      // Handle subscription confirmations
      else if (message.type === 'SUBSCRIBED' && message.topic === 'solana_balance') {
        console.log(`Successfully subscribed to Solana balance for wallet: ${message.walletAddress}`);
        
        if (message.walletAddress && !state.walletAddress) {
          setState(prevState => ({
            ...prevState,
            walletAddress: message.walletAddress
          }));
        }
      }
      
      // Handle refresh confirmations
      else if (message.type === 'BALANCE_REFRESHED' && message.topic === 'solana_balance') {
        console.log(`Solana balance refreshed for wallet: ${message.walletAddress}`);
      }
      
      // Handle errors
      else if (message.type === 'ERROR') {
        console.error(`Solana Balance WebSocket error: ${message.message} (Code: ${message.code})`);
        
        // Only stop loading if we've been waiting for a while
        if (state.isLoading) {
          setState(prevState => ({
            ...prevState,
            isLoading: false
          }));
        }
        
        dispatchWebSocketEvent('error', {
          socketType: 'solana_balance',
          message: 'Error in Solana balance WebSocket',
          error: message.message || 'Unknown error'
        });
      }
      
    } catch (err) {
      console.error('[Solana Balance WebSocket] Error processing message:', err);
      dispatchWebSocketEvent('error', {
        socketType: 'solana_balance',
        message: 'Error processing Solana balance data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, [state.isLoading, state.walletAddress]);

  // Connect to WebSocket
  const ws = useUnifiedWebSocket(
    'solana-balance-hook',
    [MessageType.DATA, MessageType.ERROR, 'SOLANA_BALANCE_UPDATE', 'SUBSCRIBED', 'BALANCE_REFRESHED', 'ERROR'],
    handleMessage,
    ['solana_balance'] // Use the exact topic name from documentation
  );

  // Subscribe to Solana balance data when connected
  useEffect(() => {
    if (ws.isConnected && state.isLoading) {
      // Set wallet address in state if provided
      if (walletAddress && !state.walletAddress) {
        setState(prevState => ({
          ...prevState,
          walletAddress
        }));
      }
      
      // Subscribe to Solana balance updates
      if (walletAddress) {
        ws.sendMessage({
          type: 'REQUEST',
          topic: 'solana_balance',
          action: 'subscribe',
          walletAddress
        });
      }
      
      dispatchWebSocketEvent('solana_balance_subscribe', {
        socketType: 'solana_balance',
        message: 'Subscribing to Solana balance data',
        timestamp: new Date().toISOString(),
        walletAddress: walletAddress || 'user wallet'
      });
      
      // Set a timeout to reset loading state if we don't get data
      const timeoutId = setTimeout(() => {
        if (state.isLoading) {
          console.warn('[Solana Balance WebSocket] Timed out waiting for data');
          setState(prevState => ({
            ...prevState,
            isLoading: false
          }));
        }
      }, 10000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [ws.isConnected, state.isLoading, walletAddress, state.walletAddress]);

  // Get Solana balance
  const refreshBalance = useCallback(() => {
    if (!ws.isConnected) {
      console.warn('[Solana Balance WebSocket] Cannot refresh - WebSocket not connected');
      return;
    }
    
    setState(prevState => ({
      ...prevState,
      isLoading: true
    }));
    
    // Request Solana balance
    ws.sendMessage({
      type: 'REQUEST',
      topic: 'solana_balance',
      action: 'getBalance',
      walletAddress: walletAddress || state.walletAddress,
      requestId: `refresh-sol-${Date.now()}`
    });
    
    dispatchWebSocketEvent('solana_balance_refresh', {
      socketType: 'solana_balance',
      message: 'Refreshing Solana balance',
      timestamp: new Date().toISOString()
    });
    
    // Set a timeout to reset loading state if we don't get data
    setTimeout(() => {
      setState(prevState => ({
        ...prevState,
        isLoading: false
      }));
    }, 10000);
  }, [ws.isConnected, walletAddress, state.walletAddress]);

  // Unsubscribe from Solana balance updates
  const unsubscribe = useCallback(() => {
    if (!ws.isConnected) {
      console.warn('[Solana Balance WebSocket] Cannot unsubscribe - WebSocket not connected');
      return;
    }
    
    // Unsubscribe from Solana balance updates
    ws.sendMessage({
      type: 'REQUEST',
      topic: 'solana_balance',
      action: 'unsubscribe',
      walletAddress: walletAddress || state.walletAddress
    });
    
    dispatchWebSocketEvent('solana_balance_unsubscribe', {
      socketType: 'solana_balance',
      message: 'Unsubscribing from Solana balance data',
      timestamp: new Date().toISOString()
    });
  }, [ws.isConnected, walletAddress, state.walletAddress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Unsubscribe when component unmounts
      if (ws.isConnected && (walletAddress || state.walletAddress)) {
        unsubscribe();
      }
    };
  }, [ws.isConnected, unsubscribe, walletAddress, state.walletAddress]);

  // Return Solana balance data and helper functions
  return {
    balance: state.balance,
    isLoading: state.isLoading,
    isConnected: ws.isConnected,
    error: ws.error,
    lastUpdate: state.lastUpdate,
    refreshBalance,
    unsubscribe,
    
    // Helper functions
    getFormattedBalance: useCallback((decimals = 4) => {
      return state.balance.toFixed(decimals);
    }, [state.balance])
  };
}