/**
 * Token Data WebSocket Hook - Unified WebSocket Version
 * 
 * This hook provides the same interface as the original useTokenDataWebSocket hook
 * but uses the unified WebSocket system under the hood instead of creating a separate connection.
 * 
 * IMPORTANT: This is a compatibility layer for smooth transition.
 * New components should use useUnifiedWebSocket directly instead of this hook.
 */

import { useEffect, useState } from 'react';
import { TokenData } from '../../types';
import { dispatchWebSocketEvent } from '../../utils/wsMonitor';
import { SOCKET_TYPES } from './types';
import { useUnifiedWebSocket } from './useUnifiedWebSocket';
import { authDebug } from '../../config/config';

// Default fallback tokens for when connection is unavailable
const FALLBACK_TOKENS: TokenData[] = [
  {
    symbol: "SOL",
    name: "Solana",
    price: "420.69",
    marketCap: "420420069",
    volume24h: "420420069",
    change24h: "42069.69",
    status: "active",
  },
];

interface TokenDataMessage {
  type: string;
  topic?: string; // Added topic property
  symbol?: string;
  symbols?: string[];
  token?: string;
  tokens?: TokenData[];
  data?: any;
  timestamp?: string;
  error?: string;
  code?: string;
  count?: number;
}

export function useTokenDataWebSocket(tokensToSubscribe: string[] | "all" = "all") {
  // Log deprecation warning
  useEffect(() => {
    console.warn(
      "DEPRECATED: useTokenDataWebSocket creates a separate WebSocket connection. " +
      "Please use useUnifiedWebSocket with the 'market-data' topic instead."
    );
    authDebug('useTokenDataWebSocket', 'DEPRECATED: Using compatibility layer');
  }, []);

  const [tokens, setTokens] = useState<TokenData[]>(FALLBACK_TOKENS);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(new Date());
  const [initialized, setInitialized] = useState(false);
  
  // Use the unified WebSocket hook instead of creating a separate connection
  const { 
    isConnected, 
    error: connectionError,
    subscribe,
    request
  } = useUnifiedWebSocket<TokenDataMessage>(
    'token-data-hook', 
    ['DATA', 'ERROR', 'SYSTEM'], 
    (message) => {
      // Process the message based on its type
      try {
        if (message.type === 'DATA' && message.topic === 'market-data') {
          if (message.data && Array.isArray(message.data)) {
            // Bulk token update
            setTokens(message.data);
            setLastUpdate(new Date());
            dispatchWebSocketEvent('token_data_update', {
              socketType: SOCKET_TYPES.TOKEN_DATA,
              message: `Updated ${message.data.length} tokens`,
              timestamp: new Date().toISOString()
            });
          } else if (message.data && message.data.symbol) {
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
              socketType: SOCKET_TYPES.TOKEN_DATA,
              message: `Updated token ${message.data.symbol}`,
              timestamp: new Date().toISOString()
            });
          }
        }
      } catch (err) {
        dispatchWebSocketEvent('error', {
          socketType: SOCKET_TYPES.TOKEN_DATA,
          message: 'Error processing token data',
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }, 
    ['market-data']
  );

  // Initialize subscription on connection
  useEffect(() => {
    if (isConnected && !initialized) {
      // Subscribe to market-data topic
      subscribe(['market-data']);
      
      // Request initial data
      request('market-data', 'getAllTokens');
      
      setInitialized(true);
      dispatchWebSocketEvent('token_data_init', {
        socketType: SOCKET_TYPES.TOKEN_DATA,
        message: 'Token data subscription initialized through unified WebSocket',
        subscription: tokensToSubscribe === "all" ? "all tokens" : tokensToSubscribe
      });
    }
  }, [isConnected, subscribe, request, tokensToSubscribe, initialized]);

  // Provide the same interface as the original hook
  return {
    tokens,
    isConnected,
    error: connectionError,
    lastUpdate,
    refresh: () => {
      // Request all tokens again
      if (isConnected) {
        request('market-data', 'getAllTokens');
        dispatchWebSocketEvent('token_data_refresh', {
          socketType: SOCKET_TYPES.TOKEN_DATA,
          message: 'Manual token data refresh requested',
          timestamp: new Date().toISOString()
        });
      }
    },
    close: () => {
      // No need to close (unified WebSocket manages this)
      dispatchWebSocketEvent('token_data_close', {
        socketType: SOCKET_TYPES.TOKEN_DATA,
        message: 'Token data WebSocket close requested (NOP in unified system)',
        timestamp: new Date().toISOString()
      });
    }
  };
}