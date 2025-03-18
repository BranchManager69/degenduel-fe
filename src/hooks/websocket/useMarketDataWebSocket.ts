/**
 * Market Data WebSocket Hook - V69 Standardized Version
 * 
 * This hook connects to the market data WebSocket service and provides real-time
 * market price, volume, and sentiment data for specified tokens.
 */

import React, { useEffect, useState } from 'react';
import { dispatchWebSocketEvent } from '../../utils/wsMonitor';
import { SOCKET_TYPES, WEBSOCKET_ENDPOINTS } from './types';
import useWebSocket from './useWebSocket';
import { useStore } from '../../store/useStore';

// Data structure for a market price message
interface MarketPrice {
  type: "MARKET_PRICE";
  data: {
    symbol: string;
    price: number;
    change_24h: number;
    volume_24h: number;
    high_24h: number;
    low_24h: number;
    timestamp: string;
  };
}

// Data structure for a market volume message
interface MarketVolume {
  type: "MARKET_VOLUME";
  data: {
    symbol: string;
    volume: number;
    trades_count: number;
    buy_volume: number;
    sell_volume: number;
    interval: "1m" | "5m" | "15m" | "1h" | "4h" | "1d";
    timestamp: string;
  };
}

// Data structure for a market sentiment message
interface MarketSentiment {
  type: "MARKET_SENTIMENT";
  data: {
    symbol: string;
    sentiment_score: number; // -1 to 1
    buy_pressure: number; // 0 to 1
    sell_pressure: number; // 0 to 1
    volume_trend: "increasing" | "decreasing" | "stable";
    timestamp: string;
  };
}

// Data structure for a market data message
type MarketDataMessage = MarketPrice | MarketVolume | MarketSentiment;

export function useMarketDataWebSocket(symbols: string[] = ["SOL", "BULLY", "JUP"]) {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [subscribedSymbols, setSubscribedSymbols] = useState<string[]>(symbols);
  const { updateMarketPrice, updateMarketVolume, updateMarketSentiment } = useStore();

  // Create custom endpoint with symbols as query parameters
  const endpoint = `${WEBSOCKET_ENDPOINTS.MARKET_DATA}`;

  // Connect to the WebSocket using the standardized hook
  const { 
    status, 
    data, 
    error,
    send,
    connect,
    close
  } = useWebSocket<MarketDataMessage>({
    endpoint,
    socketType: SOCKET_TYPES.MARKET_DATA,
    requiresAuth: false, // Market data is public per documentation
    heartbeatInterval: 15000 // 15 second heartbeat for market data
  });

  // When the connection status changes, log it
  useEffect(() => {
    dispatchWebSocketEvent('market_data_status', {
      socketType: SOCKET_TYPES.MARKET_DATA,
      status,
      message: `Market data WebSocket is ${status}`,
      symbols: subscribedSymbols
    });
    
    // Subscribe to symbols when connected
    if (status === 'online' && subscribedSymbols.length > 0) {
      subscribeToSymbols(subscribedSymbols);
    }
  }, [status, subscribedSymbols]);

  // Update subscribed symbols if they change
  useEffect(() => {
    if (JSON.stringify(symbols) !== JSON.stringify(subscribedSymbols)) {
      setSubscribedSymbols(symbols);
      
      // If already connected, update subscriptions
      if (status === 'online') {
        subscribeToSymbols(symbols);
      }
    }
  }, [symbols, status, subscribedSymbols]);

  // Subscribe to market data for specific symbols
  const subscribeToSymbols = (symbolsToSubscribe: string[]) => {
    if (status !== 'online') {
      console.warn('Cannot subscribe to market data: WebSocket not connected');
      return;
    }
    
    send({
      type: 'subscribe',
      symbols: symbolsToSubscribe
    });
    
    dispatchWebSocketEvent('market_data_subscribe', {
      socketType: SOCKET_TYPES.MARKET_DATA,
      message: `Subscribing to market data for ${symbolsToSubscribe.join(', ')}`,
      symbols: symbolsToSubscribe,
      timestamp: new Date().toISOString()
    });
  };

  // Process messages from the WebSocket
  useEffect(() => {
    if (!data) return;
    
    try {
      // Process the message based on its type
      switch (data.type) {
        case "MARKET_PRICE":
          updateMarketPrice(data.data);
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('market_price', {
            socketType: SOCKET_TYPES.MARKET_DATA,
            message: `Market price update for ${data.data.symbol}`,
            symbol: data.data.symbol,
            price: data.data.price,
            change24h: data.data.change_24h,
            timestamp: new Date().toISOString()
          });
          break;
          
        case "MARKET_VOLUME":
          updateMarketVolume(data.data);
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('market_volume', {
            socketType: SOCKET_TYPES.MARKET_DATA,
            message: `Market volume update for ${data.data.symbol}`,
            symbol: data.data.symbol,
            volume: data.data.volume,
            interval: data.data.interval,
            timestamp: new Date().toISOString()
          });
          break;
          
        case "MARKET_SENTIMENT":
          updateMarketSentiment(data.data);
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('market_sentiment', {
            socketType: SOCKET_TYPES.MARKET_DATA,
            message: `Market sentiment update for ${data.data.symbol}`,
            symbol: data.data.symbol,
            sentimentScore: data.data.sentiment_score,
            timestamp: new Date().toISOString()
          });
          break;
      }
    } catch (err) {
      console.error('Error processing market data message:', err);
      dispatchWebSocketEvent('error', {
        socketType: SOCKET_TYPES.MARKET_DATA,
        message: 'Error processing market data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, [data, updateMarketPrice, updateMarketVolume, updateMarketSentiment]);
  
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
          console.error(`Market data WebSocket closed unexpectedly ${consecutiveAbnormalClosures.current} times in a row:`, {
            message: error.message,
            consecutiveClosures: consecutiveAbnormalClosures.current,
            maxAllowed: MAX_CONSECUTIVE_ABNORMAL_CLOSURES,
            action: 'Temporarily disabling reconnection to prevent loop',
            symbols: subscribedSymbols,
            timestamp: new Date().toISOString()
          });
          
          // After MAX_CONSECUTIVE_ABNORMAL_CLOSURES failures, stop trying for a while
          if (consecutiveAbnormalClosures.current === MAX_CONSECUTIVE_ABNORMAL_CLOSURES) {
            // Create a one-time timeout to reset the counter after 2 minutes
            setTimeout(() => {
              console.log('Resetting market data WebSocket abnormal closure counter after cooling period');
              consecutiveAbnormalClosures.current = 0;
              
              // Try connecting again
              connect();
            }, 120000); // 2 minute cooling period
          }
        } else {
          console.warn('Market data WebSocket closed unexpectedly:', {
            message: error.message,
            consecutiveClosures: consecutiveAbnormalClosures.current,
            reconnecting: 'Automatic reconnection will be attempted',
            symbols: subscribedSymbols,
            timestamp: new Date().toISOString()
          });
        }
      } else if (isAuthError) {
        // Not an abnormal closure, reset the counter
        consecutiveAbnormalClosures.current = 0;
        
        console.error('Market data WebSocket authentication error:', {
          message: error.message,
          isPublicEndpoint: true, // This shouldn't happen for market data which is public
          requiresAuth: false,
          timestamp: new Date().toISOString()
        });
      } else if (isConnectError) {
        // Not an abnormal closure, reset the counter
        consecutiveAbnormalClosures.current = 0;
        
        console.error('Market data WebSocket connection error:', {
          message: error.message,
          endpoint,
          timestamp: new Date().toISOString()
        });
      } else {
        // Not an abnormal closure, reset the counter
        consecutiveAbnormalClosures.current = 0;
        
        console.error('Market data WebSocket error:', error);
      }
      
      // Dispatch event with enriched error information
      dispatchWebSocketEvent('error', {
        socketType: SOCKET_TYPES.MARKET_DATA,
        message: error.message,
        errorType: isClosedError ? 'connection_closed' : 
                  isAuthError ? 'authentication_error' : 
                  isConnectError ? 'connection_error' : 'unknown_error',
        consecutiveClosures: isClosedError ? consecutiveAbnormalClosures.current : 0,
        symbols: subscribedSymbols,
        timestamp: new Date().toISOString(),
        error
      });
      
      // For unexpected closing, we could attempt a manual reconnect here if needed
      if (isClosedError && status !== 'connecting' && consecutiveAbnormalClosures.current < MAX_CONSECUTIVE_ABNORMAL_CLOSURES) {
        // The base hook should handle reconnection, but we can log it
        console.log('Connection closed, automatic reconnection will be attempted');
      }
    } else {
      // Connection success or no error, reset the counter
      consecutiveAbnormalClosures.current = 0;
    }
  }, [error, subscribedSymbols, status, endpoint, connect]);
  
  // Method to update symbols subscription
  const updateSymbols = (newSymbols: string[]) => {
    setSubscribedSymbols(newSymbols);
  };
  
  return {
    isConnected: status === 'online',
    error: error ? error.message : null,
    lastUpdate,
    symbols: subscribedSymbols,
    updateSymbols,
    connect,
    close
  };
}