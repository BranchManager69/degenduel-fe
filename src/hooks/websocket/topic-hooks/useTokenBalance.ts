/**
 * useTokenBalance Hook
 * 
 * V69 Standardized WebSocket Hook for Token Balance Data
 * Implements the exact message format defined in the backend documentation
 * 
 * @author Branch Manager
 * @created 2025-04-10
 */

import { useCallback, useEffect, useState } from 'react';
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';
import { useUnifiedWebSocket } from '../useUnifiedWebSocket';
import { MessageType } from '../types';

// Token balance interfaces
export interface TokenBalance {
  address: string;
  symbol: string;
  balance: number;
  value_usd?: number;
}

// Token balance state
export interface TokenBalanceState {
  walletAddress?: string;
  balance: number;
  tokenAddress: string;
  isLoading: boolean;
  lastUpdate: Date | null;
}

// Default state
const DEFAULT_STATE: TokenBalanceState = {
  walletAddress: undefined,
  balance: 0,
  tokenAddress: '',
  isLoading: true,
  lastUpdate: null
};

// WebSocket message interface
interface WebSocketTokenBalanceMessage {
  type: string;
  topic: string;
  balance?: number;
  address?: string;
  walletAddress?: string;
  requestId?: string;
  timestamp?: string;
  message?: string;
  code?: number;
}

/**
 * Hook for accessing and managing token balance data with real-time updates
 * Uses the unified WebSocket system with the token_balance topic
 * 
 * @param walletAddress Optional specific wallet address to monitor
 */
export function useTokenBalance(walletAddress?: string) {
  // State for token balance data
  const [state, setState] = useState<TokenBalanceState>(DEFAULT_STATE);

  // Message handler for WebSocket messages
  const handleMessage = useCallback((message: Partial<WebSocketTokenBalanceMessage>) => {
    try {
      // Handle token balance updates
      if (message.type === 'TOKEN_BALANCE_UPDATE' && message.balance !== undefined) {
        setState(prevState => ({
          ...prevState,
          balance: message.balance || 0,
          isLoading: false,
          lastUpdate: new Date()
        }));
        
        dispatchWebSocketEvent('token_balance_update', {
          socketType: 'token_balance',
          message: `Updated token balance: ${message.balance}`,
          timestamp: new Date().toISOString()
        });
      }
      
      // Handle token address response
      else if (message.type === 'TOKEN_ADDRESS' && message.address) {
        setState(prevState => ({
          ...prevState,
          tokenAddress: message.address || '',
          lastUpdate: new Date()
        }));
        
        dispatchWebSocketEvent('token_address_update', {
          socketType: 'token_balance',
          message: `Got token address: ${message.address}`,
          timestamp: new Date().toISOString()
        });
      }
      
      // Handle subscription confirmations
      else if (message.type === 'SUBSCRIBED' && message.topic === 'token_balance') {
        console.log(`Successfully subscribed to token balance for wallet: ${message.walletAddress}`);
        
        if (message.walletAddress && !state.walletAddress) {
          setState(prevState => ({
            ...prevState,
            walletAddress: message.walletAddress
          }));
        }
      }
      
      // Handle refresh confirmations
      else if (message.type === 'BALANCE_REFRESHED' && message.topic === 'token_balance') {
        console.log(`Token balance refreshed for wallet: ${message.walletAddress}`);
      }
      
      // Handle errors
      else if (message.type === 'ERROR') {
        console.error(`Token Balance WebSocket error: ${message.message} (Code: ${message.code})`);
        
        // Only stop loading if we've been waiting for a while
        if (state.isLoading) {
          setState(prevState => ({
            ...prevState,
            isLoading: false
          }));
        }
        
        dispatchWebSocketEvent('error', {
          socketType: 'token_balance',
          message: 'Error in token balance WebSocket',
          error: message.message || 'Unknown error'
        });
      }
      
    } catch (err) {
      console.error('[Token Balance WebSocket] Error processing message:', err);
      dispatchWebSocketEvent('error', {
        socketType: 'token_balance',
        message: 'Error processing token balance data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, [state.isLoading, state.walletAddress]);

  // Connect to WebSocket
  const ws = useUnifiedWebSocket(
    'token-balance-hook',
    [MessageType.DATA, MessageType.ERROR, 'TOKEN_BALANCE_UPDATE', 'TOKEN_ADDRESS', 'SUBSCRIBED', 'BALANCE_REFRESHED', 'ERROR'],
    handleMessage,
    ['token_balance'] // Use the exact topic name from documentation
  );

  // Subscribe to token balance data when connected
  useEffect(() => {
    if (ws.isConnected && state.isLoading) {
      // Set wallet address in state if provided
      if (walletAddress && !state.walletAddress) {
        setState(prevState => ({
          ...prevState,
          walletAddress
        }));
      }
      
      // Get token address
      ws.sendMessage({
        type: 'REQUEST',
        topic: 'token_balance',
        action: 'getTokenAddress',
        requestId: `token-address-${Date.now()}`
      });
      
      // Subscribe to token balance updates
      if (walletAddress) {
        ws.sendMessage({
          type: 'REQUEST',
          topic: 'token_balance',
          action: 'subscribe',
          walletAddress
        });
      }
      
      dispatchWebSocketEvent('token_balance_subscribe', {
        socketType: 'token_balance',
        message: 'Subscribing to token balance data',
        timestamp: new Date().toISOString(),
        walletAddress: walletAddress || 'user wallet'
      });
      
      // Set a timeout to reset loading state if we don't get data
      const timeoutId = setTimeout(() => {
        if (state.isLoading) {
          console.warn('[Token Balance WebSocket] Timed out waiting for data');
          setState(prevState => ({
            ...prevState,
            isLoading: false
          }));
        }
      }, 10000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [ws.isConnected, state.isLoading, walletAddress, state.walletAddress]);

  // Get token balance
  const refreshBalance = useCallback(() => {
    if (!ws.isConnected) {
      console.warn('[Token Balance WebSocket] Cannot refresh - WebSocket not connected');
      return;
    }
    
    setState(prevState => ({
      ...prevState,
      isLoading: true
    }));
    
    // Request token balance
    ws.sendMessage({
      type: 'REQUEST',
      topic: 'token_balance',
      action: 'getBalance',
      walletAddress: walletAddress || state.walletAddress,
      refresh: true,
      requestId: `refresh-token-${Date.now()}`
    });
    
    dispatchWebSocketEvent('token_balance_refresh', {
      socketType: 'token_balance',
      message: 'Refreshing token balance',
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

  // Unsubscribe from token balance updates
  const unsubscribe = useCallback(() => {
    if (!ws.isConnected) {
      console.warn('[Token Balance WebSocket] Cannot unsubscribe - WebSocket not connected');
      return;
    }
    
    // Unsubscribe from token balance updates
    ws.sendMessage({
      type: 'REQUEST',
      topic: 'token_balance',
      action: 'unsubscribe',
      walletAddress: walletAddress || state.walletAddress
    });
    
    dispatchWebSocketEvent('token_balance_unsubscribe', {
      socketType: 'token_balance',
      message: 'Unsubscribing from token balance data',
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

  // Return token balance data and helper functions
  return {
    balance: state.balance,
    tokenAddress: state.tokenAddress,
    isLoading: state.isLoading,
    isConnected: ws.isConnected,
    error: ws.error,
    lastUpdate: state.lastUpdate,
    refreshBalance,
    unsubscribe,
    
    // Helper function to format display address
    getDisplayAddress: useCallback(() => {
      if (!state.tokenAddress) return '';
      return `${state.tokenAddress.substring(0, 6)}...${state.tokenAddress.substring(state.tokenAddress.length - 4)}`;
    }, [state.tokenAddress])
  };
}