/**
 * useTokenBalance Hook
 * 
 * V69 Standardized WebSocket Hook for Token Balance Data
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

// WebSocket message interface - v69 format
interface WebSocketWalletMessage {
  type: string; // 'DATA'
  topic: string; // 'wallet' or 'wallet-balance'
  data?: {
    wallet_address?: string;
    tokens?: TokenBalance[];
    token_address?: string;
  };
  timestamp?: string;
  message?: string;
  code?: number;
}

/**
 * Hook for accessing and managing token balance data with real-time updates
 * Uses the unified WebSocket system with the wallet topic
 * 
 * @param walletAddress Optional specific wallet address to monitor
 * @param tokenSymbol Optional token symbol to monitor (if not specified, uses main token)
 */
export function useTokenBalance(walletAddress?: string, tokenSymbol = 'DEGEN') {
  // State for token balance data
  const [state, setState] = useState<TokenBalanceState>(DEFAULT_STATE);

  // Message handler for WebSocket messages
  const handleMessage = useCallback((message: Partial<WebSocketWalletMessage>) => {
    try {
      // Handle wallet balance updates via v69 format
      if (message.type === 'DATA' && message.topic === 'wallet-balance' && message.data) {
        const { tokens, wallet_address, token_address } = message.data;
        
        // Update wallet address if provided
        if (wallet_address && !state.walletAddress) {
          setState(prevState => ({
            ...prevState,
            walletAddress: wallet_address
          }));
        }
        
        // Update token address if provided
        if (token_address) {
          setState(prevState => ({
            ...prevState,
            tokenAddress: token_address,
            lastUpdate: new Date()
          }));
          
          dispatchWebSocketEvent('token_address_update', {
            socketType: TopicType.WALLET,
            message: `Got token address: ${token_address}`,
            timestamp: new Date().toISOString()
          });
        }
        
        // Update token balance if tokens provided
        if (tokens && tokens.length > 0) {
          // Find the specific token we're monitoring
          const token = tokens.find(t => t.symbol.toUpperCase() === tokenSymbol.toUpperCase());
          
          if (token) {
            setState(prevState => ({
              ...prevState,
              balance: token.balance,
              tokenAddress: token.address || prevState.tokenAddress,
              isLoading: false,
              lastUpdate: new Date()
            }));
            
            dispatchWebSocketEvent('token_balance_update', {
              socketType: TopicType.WALLET,
              message: `Updated token balance: ${token.balance}`,
              timestamp: new Date().toISOString()
            });
          }
        }
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
          socketType: TopicType.WALLET,
          message: 'Error in token balance WebSocket',
          error: message.message || 'Unknown error'
        });
      }
      
    } catch (err) {
      console.error('[Token Balance WebSocket] Error processing message:', err);
      dispatchWebSocketEvent('error', {
        socketType: TopicType.WALLET,
        message: 'Error processing token balance data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, [state.isLoading, state.walletAddress, tokenSymbol]);

  // Connect to WebSocket
  const ws = useUnifiedWebSocket(
    'token-balance-hook',
    [MessageType.DATA, MessageType.ERROR],
    handleMessage,
    [TopicType.WALLET, 'wallet-balance', TopicType.SYSTEM] // v69 topics
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
      
      // Subscribe to wallet balance topic
      ws.subscribe([TopicType.WALLET, 'wallet-balance']);
      
      // Request wallet data including token balances
      const requestParams = walletAddress ? { walletAddress } : {};
      ws.request(TopicType.WALLET, 'GET_WALLET_DATA', requestParams);
      
      dispatchWebSocketEvent('token_balance_subscribe', {
        socketType: TopicType.WALLET,
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
  }, [ws.isConnected, state.isLoading, walletAddress, state.walletAddress, ws.subscribe, ws.request]);

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
    
    // Request fresh wallet data
    const requestParams = walletAddress ? { walletAddress } : {};
    ws.request(TopicType.WALLET, 'GET_WALLET_DATA', requestParams);
    
    dispatchWebSocketEvent('token_balance_refresh', {
      socketType: TopicType.WALLET,
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
  }, [ws.isConnected, walletAddress, ws.request]);

  // Return token balance data and helper functions
  return {
    balance: state.balance,
    tokenAddress: state.tokenAddress,
    isLoading: state.isLoading,
    isConnected: ws.isConnected,
    error: ws.error,
    lastUpdate: state.lastUpdate,
    refreshBalance,
    
    // Helper function to format display address
    getDisplayAddress: useCallback(() => {
      if (!state.tokenAddress) return '';
      return `${state.tokenAddress.substring(0, 6)}...${state.tokenAddress.substring(state.tokenAddress.length - 4)}`;
    }, [state.tokenAddress])
  };
}