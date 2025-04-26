/**
 * useSolanaBalance Hook
 * 
 * V69 Standardized WebSocket Hook for Solana Balance Data
 * 
 * @author Branch Manager
 * @created 2025-04-10
 * @updated 2025-04-24 - Updated to use v69 wallet topic
 */

import { useCallback, useEffect, useState } from 'react';
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';
import { useUnifiedWebSocket } from '../useUnifiedWebSocket';
import { MessageType } from '../types';
import { TopicType } from '../index';

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

// WebSocket message interface - v69 format
interface WebSocketWalletMessage {
  type: string; // 'DATA'
  topic: string; // 'wallet' or 'wallet-balance'
  data?: {
    wallet_address?: string;
    sol_balance?: number;
  };
  timestamp?: string;
  message?: string;
  code?: number;
}

/**
 * Hook for accessing and managing Solana balance data with real-time updates
 * Uses the unified WebSocket system with the wallet topic
 * 
 * @param walletAddress Optional specific wallet address to monitor
 */
export function useSolanaBalance(walletAddress?: string) {
  // State for Solana balance data
  const [state, setState] = useState<SolanaBalanceState>(DEFAULT_STATE);

  // Message handler for WebSocket messages
  const handleMessage = useCallback((message: Partial<WebSocketWalletMessage>) => {
    try {
      // Handle wallet balance updates via v69 format
      if (message.type === 'DATA' && message.topic === 'wallet-balance' && message.data) {
        const { sol_balance, wallet_address } = message.data;
        
        // Update wallet address if provided
        if (wallet_address && !state.walletAddress) {
          setState(prevState => ({
            ...prevState,
            walletAddress: wallet_address
          }));
        }
        
        // Update Solana balance if provided
        if (sol_balance !== undefined) {
          setState(prevState => ({
            ...prevState,
            balance: sol_balance,
            isLoading: false,
            lastUpdate: new Date()
          }));
          
          dispatchWebSocketEvent('solana_balance_update', {
            socketType: TopicType.WALLET,
            message: `Updated Solana balance: ${sol_balance}`,
            timestamp: new Date().toISOString()
          });
        }
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
          socketType: TopicType.WALLET,
          message: 'Error in Solana balance WebSocket',
          error: message.message || 'Unknown error'
        });
      }
      
    } catch (err) {
      console.error('[Solana Balance WebSocket] Error processing message:', err);
      dispatchWebSocketEvent('error', {
        socketType: TopicType.WALLET,
        message: 'Error processing Solana balance data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, [state.isLoading, state.walletAddress]);

  // Connect to WebSocket
  const ws = useUnifiedWebSocket(
    'solana-balance-hook',
    [MessageType.DATA, MessageType.ERROR],
    handleMessage,
    [TopicType.WALLET, 'wallet-balance', TopicType.SYSTEM] // v69 topics
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
      
      // Subscribe to wallet balance topic
      ws.subscribe([TopicType.WALLET, 'wallet-balance']);
      
      // Request wallet data including Solana balance
      const requestParams = walletAddress ? { walletAddress } : {};
      ws.request(TopicType.WALLET, 'GET_WALLET_DATA', requestParams);
      
      dispatchWebSocketEvent('solana_balance_subscribe', {
        socketType: TopicType.WALLET,
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
  }, [ws.isConnected, state.isLoading, walletAddress, state.walletAddress, ws.subscribe, ws.request]);

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
    
    // Request fresh wallet data
    const requestParams = walletAddress ? { walletAddress } : {};
    ws.request(TopicType.WALLET, 'GET_WALLET_DATA', requestParams);
    
    dispatchWebSocketEvent('solana_balance_refresh', {
      socketType: TopicType.WALLET,
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
  }, [ws.isConnected, walletAddress, ws.request]);

  // Return Solana balance data and helper functions
  return {
    balance: state.balance,
    isLoading: state.isLoading,
    isConnected: ws.isConnected,
    error: ws.error,
    lastUpdate: state.lastUpdate,
    refreshBalance,
    
    // Helper functions
    getFormattedBalance: useCallback((decimals = 4) => {
      return state.balance.toFixed(decimals);
    }, [state.balance])
  };
}