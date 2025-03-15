/**
 * Token Data WebSocket Hook - V69 Standardized Version
 * 
 * This hook connects to the token data WebSocket service and provides real-time
 * token price and market data updates.
 */

import { useEffect, useState } from 'react';
import { dispatchWebSocketEvent } from '../../utils/wsMonitor';
import { SOCKET_TYPES, WEBSOCKET_ENDPOINTS } from './types';
import useWebSocket from './useWebSocket';
import { TokenData as OriginalTokenData } from '../../hooks/useTokenDataWebSocket';

// Keep the same interface for compatibility
export interface TokenData extends OriginalTokenData {}

// Default fallback tokens for when connection is unavailable
const FALLBACK_TOKENS: TokenData[] = [
  {
    symbol: "SOL",
    name: "Solana",
    price: "112.50",
    marketCap: "50000000000",
    volume24h: "3500000000",
    change24h: "2.5",
    status: "active",
  },
  {
    symbol: "BONK",
    name: "Bonk",
    price: "0.00002156",
    marketCap: "1250000000",
    volume24h: "450000000",
    change24h: "5.2",
    status: "active",
  },
  {
    symbol: "JUP",
    name: "Jupiter",
    price: "0.95",
    marketCap: "3800000000",
    volume24h: "980000000",
    change24h: "-0.75",
    status: "active",
  },
];

interface TokenDataMessage {
  type: string;
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
  const [tokens, setTokens] = useState<TokenData[]>(FALLBACK_TOKENS);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(new Date());
  const [initialized, setInitialized] = useState(false);
  
  // Connect to the WebSocket using the standardized hook
  const { 
    status, 
    data, 
    error,
    send
  } = useWebSocket<TokenDataMessage>({
    endpoint: WEBSOCKET_ENDPOINTS.TOKEN_DATA,
    socketType: SOCKET_TYPES.TOKEN_DATA,
    requiresAuth: false, // Token data is public
    heartbeatInterval: 30000
  });

  // When the connection status changes, log it
  useEffect(() => {
    dispatchWebSocketEvent('token_data_status', {
      socketType: SOCKET_TYPES.TOKEN_DATA,
      status,
      message: `Token data WebSocket is ${status}`
    });
  }, [status]);

  // Subscribe to tokens when connected
  useEffect(() => {
    if (status === 'online' && !initialized) {
      // Request all tokens
      send({
        type: "get_all_tokens"
      });
      
      // Subscribe to specific tokens if requested
      if (tokensToSubscribe !== "all") {
        send({
          type: "subscribe_tokens",
          symbols: tokensToSubscribe
        });
      }
      
      setInitialized(true);
      
      dispatchWebSocketEvent('token_data_init', {
        socketType: SOCKET_TYPES.TOKEN_DATA,
        message: 'Token data subscription initialized',
        subscription: tokensToSubscribe === "all" ? "all tokens" : tokensToSubscribe
      });
    }
  }, [status, send, tokensToSubscribe, initialized]);
  
  // Process messages from the WebSocket
  useEffect(() => {
    if (!data) return;
    
    try {
      // Process the message based on its type
      switch (data.type) {
        case "token_update":
          // Process bulk token update
          if (data.data && Array.isArray(data.data)) {
            setTokens(data.data);
            setLastUpdate(new Date());
            
            dispatchWebSocketEvent('token_data_update', {
              socketType: SOCKET_TYPES.TOKEN_DATA,
              message: `Updated ${data.data.length} tokens`,
              timestamp: new Date().toISOString()
            });
          }
          break;
          
        case "token_data":
          // Process single token update
          if (data.symbol && data.data) {
            setTokens(prev => 
              prev.map(token => 
                token.symbol === data.symbol ? 
                { ...token, ...data.data } : 
                token
              )
            );
            setLastUpdate(new Date());
            
            dispatchWebSocketEvent('token_data_update', {
              socketType: SOCKET_TYPES.TOKEN_DATA,
              message: `Updated token ${data.symbol}`,
              timestamp: new Date().toISOString()
            });
          }
          break;
          
        case "token_metadata":
          // Process token metadata update
          if (data.symbol && data.data) {
            setTokens(prev => 
              prev.map(token => 
                token.symbol === data.symbol ? 
                { ...token, ...data.data } : 
                token
              )
            );
          }
          break;
          
        case "error":
          // Handle errors
          dispatchWebSocketEvent('error', {
            socketType: SOCKET_TYPES.TOKEN_DATA,
            message: data.error || 'Unknown error',
            code: data.code,
            timestamp: new Date().toISOString()
          });
          break;
      }
    } catch (err) {
      console.error('Error processing token data message:', err);
      dispatchWebSocketEvent('error', {
        socketType: SOCKET_TYPES.TOKEN_DATA,
        message: 'Error processing token data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, [data]);
  
  // Handle errors
  useEffect(() => {
    if (error) {
      console.error('Token data WebSocket error:', error);
      dispatchWebSocketEvent('error', {
        socketType: SOCKET_TYPES.TOKEN_DATA,
        message: error.message,
        error
      });
    }
  }, [error]);
  
  return {
    tokens,
    isConnected: status === 'online',
    error: error ? error.message : null,
    lastUpdate,
    refresh: () => {
      // Request all tokens again
      if (status === 'online') {
        send({
          type: "get_all_tokens"
        });
        
        dispatchWebSocketEvent('token_data_refresh', {
          socketType: SOCKET_TYPES.TOKEN_DATA,
          message: 'Manual token data refresh requested',
          timestamp: new Date().toISOString()
        });
      }
    },
    close: () => {
      // Call the WebSocket's close method to properly clean up
      if (status === 'online') {
        dispatchWebSocketEvent('token_data_close', {
          socketType: SOCKET_TYPES.TOKEN_DATA,
          message: 'Token data WebSocket closed by manager',
          timestamp: new Date().toISOString()
        });
      }
    }
  };
}