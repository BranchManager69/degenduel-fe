// src/hooks/useTokenDataWebSocket.ts

import { useCallback, useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { WebSocketHookReturn } from './websocket/types';
import useWebSocket from './websocket/useWebSocket';
 
export type TokenPriceUpdate = {
  symbol: string;
  price: number;
  change_24h: number;
  timestamp: string;
};

export type TokenPriceData = {
  [symbol: string]: {
    price: number;
    change_24h: number;
    lastUpdated: string;
  };
};

export type TokenData = {
  symbol: string;
  name: string;
  price: number;
  change_24h: number;
  change24h?: number; // Alias for change_24h for compatibility
  lastUpdated: string;
  market_cap?: number;
  marketCap?: number; // Alias for market_cap for compatibility
  volume_24h?: number;
  volume24h?: number; // Alias for volume_24h for compatibility
  change5m?: number;
  imageUrl?: string;
};

export function useTokenDataWebSocket(symbols: string[] = []) {
  const [tokenPrices, setTokenPrices] = useState<TokenPriceData>({});
  const { user } = useStore();
  const token = user?.jwt || user?.session_token;

  // Use the new WebSocket hook
  const {
    isConnected,
    sendMessage,
    connect,
    disconnect
  }: WebSocketHookReturn = useWebSocket('token-data', {
    token,
    reconnect: true,
    maxReconnectAttempts: 10,
    onMessage: handleMessage,
    debug: true,
  });

  // Handle incoming messages
  function handleMessage(data: { type: string; [key: string]: any }) {
    // Handle token price updates
    if (data.type === 'token_price_update') {
      // Type safety: ensure all required fields exist before casting
      if ('symbol' in data && 'price' in data && 'change_24h' in data && 'timestamp' in data) {
        const priceUpdate: TokenPriceUpdate = {
          symbol: data.symbol,
          price: data.price,
          change_24h: data.change_24h,
          timestamp: data.timestamp
        };
        handlePriceUpdate(priceUpdate);
      }
    }
  }

  // Handle a token price update
  const handlePriceUpdate = useCallback((data: TokenPriceUpdate) => {
    setTokenPrices(prev => ({
      ...prev,
      [data.symbol]: {
        price: data.price,
        change_24h: data.change_24h,
        lastUpdated: data.timestamp
      }
    }));
  }, []);

  // Request data for specific tokens when connected and symbols change
  useEffect(() => {
    if (isConnected && symbols.length > 0) {
      sendMessage({
        type: 'get_token_prices',
        symbols
      });
    }
  }, [isConnected, symbols, sendMessage]);

  // Subscribe to specific tokens
  const subscribeToToken = useCallback((symbol: string) => {
    if (isConnected) {
      sendMessage({
        type: 'subscribe',
        channel: `token.${symbol}`
      });
    }
  }, [isConnected, sendMessage]);

  // Unsubscribe from specific tokens
  const unsubscribeFromToken = useCallback((symbol: string) => {
    if (isConnected) {
      sendMessage({
        type: 'unsubscribe',
        channel: `token.${symbol}`
      });
    }
  }, [isConnected, sendMessage]);

  // Return the hook's API
  return {
    tokenPrices,
    isConnected,
    subscribeToToken,
    unsubscribeFromToken,
    connect,
    close: disconnect
  };
}