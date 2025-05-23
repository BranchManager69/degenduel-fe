/**
 * useTokenData Hook
 * 
 * V69 Standardized WebSocket Hook for Token Data
 * This hook provides real-time updates for token data from the unified WebSocket system
 * 
 * ⚠️ HOOK MIGRATION GUIDE ⚠️
 * This is the IMPROVED v69 WebSocket implementation for token data.
 * - For basic WebSocket operations: Use this hook directly
 * - For UI components: Use hooks/useStandardizedTokenData.ts which builds on this hook
 * 
 * The complete hook migration path:
 * 1. hooks/useTokenData.ts - Original implementation (legacy)
 * 2. hooks/websocket/topic-hooks/useTokenData.ts - THIS FILE (v69 architecture)
 * 3. hooks/useStandardizedTokenData.ts - UI standardization layer (recommended for components)
 * 
 * @author Branch Manager
 * @created 2025-04-10
 * @updated 2025-04-29 - Added migration guide
 */

import { useCallback, useEffect, useState } from 'react';
import { useWebSocket } from '../../../contexts/UnifiedWebSocketContext';
import { Token } from '../../../types';
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';
import { TopicType } from '../index';
import { DDExtendedMessageType } from '../types';

// Default fallback tokens for when connection is unavailable
const FALLBACK_TOKENS: Token[] = [
  {
    symbol: "SOL",
    name: "Solana",
    price: "420.69",
    marketCap: "420420069",
    volume24h: "420420069", 
    change24h: "42069.69",
    status: "active",
    contractAddress: "So11111111111111111111111111111111111111112",
    liquidity: {
      usd: "69420000",
      base: "420000",
      quote: "69000",
    }
  },
  {
    symbol: "DUEL",
    name: "DegenDuel",
    price: "0.00005",
    marketCap: "9500000",
    volume24h: "7500000", 
    change24h: "52.1",
    status: "active",
    contractAddress: "DoxsC4PpVHiUxCKYeKSkPXVVVSJYzidZZJxW4XCFF2t",
    liquidity: {
      usd: "694200",
      base: "42000",
      quote: "6900",
    }
  },
];

// Define the standard structure for token data updates from the server
// Based on backend team's v69 WebSocket unified system specification
interface WebSocketTokenMessage {
  type: DDExtendedMessageType; // DDExtendedMessageType.DATA
  topic: string; // 'market-data' or 'token-data'
  subtype: string; // 'token'
  action: string; // 'update', 'bulk-update', 'add', 'remove'
  data: any; // Either a single token or an array of tokens
  timestamp: string;
}

/**
 * Hook for accessing and managing token data with real-time updates
 * Uses the unified WebSocket system
 * 
 * @param tokensToSubscribe Optional string array of specific token symbols to subscribe to, or "all" for all tokens
 */
export function useTokenData(tokensToSubscribe: string[] | "all" = "all") {
  // State for token data

  // Using Token interface
  const [tokens, setTokens] = useState<Token[]>(FALLBACK_TOKENS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(new Date());
  const [initialized, setInitialized] = useState(false);

  // Message handler for WebSocket messages
  const handleMessage = useCallback((message: Partial<WebSocketTokenMessage>) => {
    try {
      // Check if this is a valid token data message
      if (message.type === DDExtendedMessageType.DATA && message.topic === 'market-data') {
        // Handle different action types
        if (message.action === 'bulk-update' && Array.isArray(message.data)) {
          // Bulk token update
          setTokens(message.data);
          setLastUpdate(new Date());
          setIsLoading(false);
          
          dispatchWebSocketEvent('token_data_update', {
            socketType: TopicType.TOKEN_DATA,
            message: `Updated ${message.data.length} tokens`,
            timestamp: new Date().toISOString()
          });
        } 
        else if (message.action === 'update' && message.data?.symbol) {
          // Single token update
          setTokens(prev => 
            prev.map(token => 
              token.symbol === message.data.symbol ? 
              { ...token, ...message.data } : 
              token
            )
          );
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('token_data_update', {
            socketType: TopicType.TOKEN_DATA,
            message: `Updated token ${message.data.symbol}`,
            timestamp: new Date().toISOString()
          });
        }
        else if (message.action === 'add' && message.data?.symbol) {
          // Add new token
          setTokens(prev => [...prev, message.data]);
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('token_data_update', {
            socketType: TopicType.TOKEN_DATA,
            message: `Added token ${message.data.symbol}`,
            timestamp: new Date().toISOString()
          });
        }
        else if (message.action === 'remove' && message.data?.symbol) {
          // Remove token
          setTokens(prev => prev.filter(token => token.symbol !== message.data.symbol));
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('token_data_update', {
            socketType: TopicType.TOKEN_DATA,
            message: `Removed token ${message.data.symbol}`,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      // Mark as not loading once we've processed any valid message
      if (isLoading) {
        setIsLoading(false);
      }
    } catch (err) {
      console.error('[TokenData WebSocket] Error processing message:', err);
      dispatchWebSocketEvent('error', {
        socketType: TopicType.TOKEN_DATA,
        message: 'Error processing token data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, [isLoading]);

  // Connect to the unified WebSocket system
  const ws = useWebSocket();

  // Register message listener
  useEffect(() => {
    const unregister = ws.registerListener('token-data-hook', [DDExtendedMessageType.DATA, DDExtendedMessageType.ERROR], handleMessage);
    return unregister;
  }, [handleMessage, ws.registerListener]);

  // Subscribe to token data when the WebSocket is connected
  useEffect(() => {
    console.log('[TokenData] WebSocket state:', { 
      isConnected: ws.isConnected, 
      connectionState: ws.connectionState, 
      initialized, 
      error: ws.connectionError 
    });
    if (ws.isConnected && !initialized) {
      // Subscribe to market-data topic
      ws.subscribe([TopicType.MARKET_DATA, TopicType.TOKEN_DATA]);
      
      // Request initial data
      if (tokensToSubscribe === "all") {
        ws.request(TopicType.MARKET_DATA, 'getAllTokens');
      } else if (Array.isArray(tokensToSubscribe) && tokensToSubscribe.length > 0) {
        ws.request(TopicType.MARKET_DATA, 'getTokens', { symbols: tokensToSubscribe });
      }
      
      setInitialized(true);
      
      dispatchWebSocketEvent('token_data_init', {
        socketType: TopicType.TOKEN_DATA,
        message: 'Token data subscription initialized through unified WebSocket',
        subscription: tokensToSubscribe === "all" ? "all tokens" : tokensToSubscribe
      });
      
      // Set a timeout to reset loading state if we don't get data
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          console.warn('[TokenData WebSocket] Timed out waiting for data');
          setIsLoading(false);
        }
      }, 10000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [ws.isConnected, initialized, tokensToSubscribe, isLoading, ws.subscribe, ws.request]);

  // Force refresh function for token data
  const refresh = useCallback(() => {
    setIsLoading(true);
    
    if (ws.isConnected) {
      // Request fresh token data
      if (tokensToSubscribe === "all") {
        ws.request(TopicType.MARKET_DATA, 'getAllTokens');
      } else if (Array.isArray(tokensToSubscribe) && tokensToSubscribe.length > 0) {
        ws.request(TopicType.MARKET_DATA, 'getTokens', { symbols: tokensToSubscribe });
      }
      
      dispatchWebSocketEvent('token_data_refresh', {
        socketType: TopicType.TOKEN_DATA,
        message: 'Refreshing token data',
        timestamp: new Date().toISOString()
      });
      
      // Set a timeout to reset loading state if we don't get data
      setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
        }
      }, 10000);
    } else {
      console.warn('[TokenData WebSocket] Cannot refresh - WebSocket not connected');
      setIsLoading(false);
    }
  }, [ws.isConnected, ws.request, tokensToSubscribe, isLoading]);

  // Return the token data and helper functions
  // This matches the interface of the legacy useTokenDataWebSocket hook
  return {
    tokens,
    isConnected: ws.isConnected,
    error: ws.connectionError,
    lastUpdate,
    refresh,
    isLoading,
    close: () => {
      // No-op function kept for interface compatibility
      dispatchWebSocketEvent('token_data_close', {
        socketType: TopicType.TOKEN_DATA,
        message: 'Token data WebSocket close requested (NOP in unified system)',
        timestamp: new Date().toISOString()
      });
    }
  };
}