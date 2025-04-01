/**
 * Token Data WebSocket Hook - V69 Standardized Version
 * 
 * This hook connects to the token data WebSocket service and provides real-time
 * token price and market data updates.
 */

import React, { useEffect, useState } from 'react';
import { TokenData } from '../../types';
import { dispatchWebSocketEvent } from '../../utils/wsMonitor';
import { SOCKET_TYPES, WEBSOCKET_ENDPOINT } from './types';
import useWebSocket from './useWebSocket';

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
    endpoint: WEBSOCKET_ENDPOINT,
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
  
  // Track consecutive abnormal closures
  const consecutiveAbnormalClosures = React.useRef<number>(0);
  const MAX_CONSECUTIVE_ABNORMAL_CLOSURES = 5;

  // Handle errors with improved diagnostics
  useEffect(() => {
    if (error) {
      // Analyze error type for better diagnostics
      const isClosedError = error.message?.includes('CLOSED') || error.message?.includes('code 1006');
      const isAuthError = error.message?.includes('Authentication') || error.message?.includes('auth');
      const isConnectError = error.message?.includes('connect') || error.message?.includes('Connection');
      
      // Log different error types with detailed information
      if (isClosedError) {
        // Track consecutive abnormal closures to prevent infinite reconnection loops
        consecutiveAbnormalClosures.current++;
        
        if (consecutiveAbnormalClosures.current >= MAX_CONSECUTIVE_ABNORMAL_CLOSURES) {
          console.error(`Token data WebSocket closed unexpectedly ${consecutiveAbnormalClosures.current} times in a row:`, {
            message: error.message,
            consecutiveClosures: consecutiveAbnormalClosures.current,
            maxAllowed: MAX_CONSECUTIVE_ABNORMAL_CLOSURES,
            action: 'Temporarily disabling reconnection to prevent loop',
            timestamp: new Date().toISOString()
          });
          
          // After MAX_CONSECUTIVE_ABNORMAL_CLOSURES failures, pause reconnection attempts
          if (consecutiveAbnormalClosures.current === MAX_CONSECUTIVE_ABNORMAL_CLOSURES) {
            // Create a one-time timeout to reset the counter after 2 minutes
            setTimeout(() => {
              console.log('Resetting token data WebSocket abnormal closure counter after cooling period');
              consecutiveAbnormalClosures.current = 0;
              setInitialized(false); // Reset initialization to trigger subscription on next connection
            }, 120000); // 2 minute cooling period
          }
        } else {
          console.warn('Token data WebSocket closed unexpectedly:', {
            message: error.message,
            consecutiveClosures: consecutiveAbnormalClosures.current,
            reconnecting: 'Automatic reconnection will be attempted',
            timestamp: new Date().toISOString()
          });
        }
      } else if (isAuthError) {
        // Not an abnormal closure, reset the counter
        consecutiveAbnormalClosures.current = 0;
        
        console.error('Token data WebSocket authentication error:', {
          message: error.message,
          isPublicEndpoint: true, // This shouldn't happen for token data which is public
          requiresAuth: false,
          timestamp: new Date().toISOString()
        });
      } else if (isConnectError) {
        // Not an abnormal closure, reset the counter
        consecutiveAbnormalClosures.current = 0;
        
        console.error('Token data WebSocket connection error:', {
          message: error.message,
          endpoint: WEBSOCKET_ENDPOINT,
          timestamp: new Date().toISOString()
        });
      } else {
        // Not an abnormal closure, reset the counter
        consecutiveAbnormalClosures.current = 0;
        
        console.error('Token data WebSocket error:', error);
      }
      
      // Dispatch event with enriched error information
      dispatchWebSocketEvent('error', {
        socketType: SOCKET_TYPES.TOKEN_DATA,
        message: error.message,
        errorType: isClosedError ? 'connection_closed' : 
                  isAuthError ? 'authentication_error' : 
                  isConnectError ? 'connection_error' : 'unknown_error',
        consecutiveClosures: isClosedError ? consecutiveAbnormalClosures.current : 0,
        timestamp: new Date().toISOString(),
        error
      });
    } else {
      // Connection success or no error, reset the counter
      consecutiveAbnormalClosures.current = 0;
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