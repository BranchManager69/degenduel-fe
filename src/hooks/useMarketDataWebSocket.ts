import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { useWebSocket } from './websocket/useWebSocket';

export interface TokenMarketData {
  symbol: string;
  price: number;
  change_24h: number;
  volume_24h: number;
  high_24h: number;
  low_24h: number;
  last_updated: string;
}

export interface MarketData {
  [symbol: string]: TokenMarketData;
}

export function useMarketDataWebSocket(symbols: string[] = []) {
  const [marketData, setMarketData] = useState<MarketData>({});
  const { user } = useStore();
  const token = user?.jwt || user?.session_token;

  // Initialize WebSocket connection using the new hook
  const {
    isConnected,
    sendMessage,
    subscribe,
    unsubscribe,
    disconnect
  } = useWebSocket('market-data', {
    token,
    reconnect: true,
    maxReconnectAttempts: 10,
    onMessage: handleMessage,
    debug: true,
  });

  // Handle incoming messages
  function handleMessage(data: any) {
    // Handle market price updates
    if (data.type === 'market_price_update') {
      setMarketData(prev => ({
        ...prev,
        [data.symbol]: {
          ...(prev[data.symbol] || {}),
          symbol: data.symbol,
          price: data.price,
          change_24h: data.change_24h,
          volume_24h: data.volume_24h || prev[data.symbol]?.volume_24h || 0,
          high_24h: data.high_24h || prev[data.symbol]?.high_24h || 0,
          low_24h: data.low_24h || prev[data.symbol]?.low_24h || 0,
          last_updated: data.timestamp
        }
      }));
    }
    // Handle bulk market data
    else if (data.type === 'market_data') {
      const newMarketData: MarketData = {};
      
      data.data.forEach((tokenData: any) => {
        newMarketData[tokenData.symbol] = {
          symbol: tokenData.symbol,
          price: tokenData.price,
          change_24h: tokenData.change_24h,
          volume_24h: tokenData.volume_24h || 0,
          high_24h: tokenData.high_24h || 0,
          low_24h: tokenData.low_24h || 0,
          last_updated: data.timestamp
        };
      });
      
      setMarketData(newMarketData);
    }
  }

  // Subscribe to symbols when connected and symbols change
  useEffect(() => {
    if (isConnected && symbols.length > 0) {
      // Request initial data for all symbols
      sendMessage({
        type: 'get_market_data',
        symbols
      });
      
      // Subscribe to updates for each symbol
      symbols.forEach(symbol => {
        subscribe(`market.${symbol}`);
      });
      
      // Return cleanup function to unsubscribe when component unmounts
      // or when symbols change
      return () => {
        symbols.forEach(symbol => {
          unsubscribe(`market.${symbol}`);
        });
      };
    }
  }, [isConnected, symbols, sendMessage, subscribe, unsubscribe]);

  // Function to manually refresh data for specific symbols
  const refreshMarketData = useCallback((symbolsToRefresh: string[] = symbols) => {
    if (isConnected && symbolsToRefresh.length > 0) {
      sendMessage({
        type: 'get_market_data',
        symbols: symbolsToRefresh
      });
      return true;
    }
    return false;
  }, [isConnected, symbols, sendMessage]);

  return {
    marketData,
    isConnected,
    refreshMarketData,
    close: disconnect
  };
}

export default useMarketDataWebSocket;