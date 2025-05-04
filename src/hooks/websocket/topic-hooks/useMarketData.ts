/**
 * useMarketData Hook
 * 
 * V69 Standardized WebSocket Hook for Market Data
 * This hook provides real-time updates for global market data from the unified WebSocket system
 * 
 * @author Branch Manager
 * @created 2025-04-10
 */

import { useCallback, useEffect, useState } from 'react';
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';
import { useUnifiedWebSocket } from '../useUnifiedWebSocket';
import { DDExtendedMessageType } from '../types';
import { TopicType } from '../index';

// Define market data interface based on backend API documentation
export interface MarketData {
  timestamp: string;
  globalMarketCap: string;
  btcDominance: string;
  volume24h: string;
  marketSentiment: 'extreme_fear' | 'fear' | 'neutral' | 'greed' | 'extreme_greed' | string;
  trending: string[];
  movers: {
    gainers: Array<{
      symbol: string;
      change24h: string;
    }>;
    losers: Array<{
      symbol: string;
      change24h: string;
    }>;
  };
}

// Default market data for initial state
const DEFAULT_MARKET_DATA: MarketData = {
  timestamp: new Date().toISOString(),
  globalMarketCap: "Loading...",
  btcDominance: "Loading...",
  volume24h: "Loading...",
  marketSentiment: "neutral",
  trending: [],
  movers: {
    gainers: [],
    losers: []
  }
};

// Define the standard structure for market data updates from the server
interface WebSocketMarketMessage {
  type: string; // 'DATA'
  topic: string; // 'market-data'
  subtype: string; // 'market'
  action: string; // 'update'
  data: Partial<MarketData>;
  timestamp: string;
}

/**
 * Hook for accessing global market data with real-time updates
 * Uses the unified WebSocket system
 */
export function useMarketData() {
  // State
  const [marketData, setMarketData] = useState<MarketData>(DEFAULT_MARKET_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Message handler
  const handleMessage = useCallback((message: Partial<WebSocketMarketMessage>) => {
    try {
      // Check if this is a valid market data message
      if (message.type === 'DATA' && 
          message.topic === 'market-data' && 
          message.subtype === 'market' && 
          message.action === 'update' && 
          message.data) {
        
        // Update market data state
        setMarketData(prevData => ({
          ...prevData,
          ...message.data,
          timestamp: message.timestamp || new Date().toISOString()
        }));
        
        // Update status and timestamp
        setIsLoading(false);
        setLastUpdate(new Date());
        
        // Log event for monitoring
        dispatchWebSocketEvent('market_data_update', {
          socketType: TopicType.MARKET_DATA,
          message: 'Received market data from WebSocket',
          timestamp: new Date().toISOString()
        });
      }
      
      // Mark as not loading once we've processed any valid message
      if (isLoading) {
        setIsLoading(false);
      }
    } catch (err) {
      console.error('[MarketData WebSocket] Error processing message:', err);
      dispatchWebSocketEvent('error', {
        socketType: TopicType.MARKET_DATA,
        message: 'Error processing market data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, [isLoading]);

  // Connect to WebSocket
  const ws = useUnifiedWebSocket(
    'market-data-hook',
    [DDExtendedMessageType.DATA, DDExtendedMessageType.ERROR],
    handleMessage,
    [TopicType.MARKET_DATA, TopicType.SYSTEM]
  );

  // Subscribe to market data when connected
  useEffect(() => {
    if (ws.isConnected && isLoading) {
      // Subscribe to market data topic
      ws.subscribe([TopicType.MARKET_DATA]);
      
      // Request initial market data
      ws.request(TopicType.MARKET_DATA, 'GET_MARKET_DATA');
      
      dispatchWebSocketEvent('market_data_subscribe', {
        socketType: TopicType.MARKET_DATA,
        message: 'Subscribing to market data',
        timestamp: new Date().toISOString()
      });
      
      // Set a timeout to reset loading state if we don't get data
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          console.warn('[MarketData WebSocket] Timed out waiting for data');
          setIsLoading(false);
        }
      }, 10000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [ws.isConnected, isLoading, ws.subscribe, ws.request]);

  // Force refresh function
  const refreshMarketData = useCallback(() => {
    setIsLoading(true);
    
    if (ws.isConnected) {
      ws.request(TopicType.MARKET_DATA, 'GET_MARKET_DATA');
      
      dispatchWebSocketEvent('market_data_refresh', {
        socketType: TopicType.MARKET_DATA,
        message: 'Refreshing market data',
        timestamp: new Date().toISOString()
      });
      
      // Set a timeout to reset loading state if we don't get data
      setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
        }
      }, 10000);
    } else {
      console.warn('[MarketData WebSocket] Cannot refresh - WebSocket not connected');
      setIsLoading(false);
    }
  }, [ws.isConnected, ws.request, isLoading]);

  // Return data and helper functions
  return {
    marketData,
    isLoading,
    isConnected: ws.isConnected,
    error: ws.error,
    lastUpdate,
    refreshMarketData
  };
}