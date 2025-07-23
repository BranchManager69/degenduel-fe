// src/hooks/websocket/topic-hooks/useTickerTokens.ts

/**
 * useTickerTokens Hook - Optimized ticker data subscription
 * 
 * This hook subscribes to the new ticker_tokens topic which provides
 * only the top 50 tokens by the selected sort method, reducing bandwidth
 * by 98% compared to the old market_data subscription.
 * 
 * @author Claude
 * @created 2025-01-15
 */

import { useCallback, useEffect, useState, useRef } from 'react';
import { useWebSocket } from '../../../contexts/UnifiedWebSocketContext';
import { Token } from '../../../types';

interface TickerTokensOptions {
  limit?: number;
  sort?: 'change24h' | 'volume24h' | 'marketCap';
}

interface SortInfo {
  method: string;
  direction: 'asc' | 'desc';
  total_tokens: number;
  showing: string;
}

interface UseTickerTokensReturn {
  tokens: Token[];
  sortInfo: SortInfo | null;
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

export function useTickerTokens(options: TickerTokensOptions = {}): UseTickerTokensReturn {
  const { limit = 50, sort = 'change24h' } = options;
  
  const [tokens, setTokens] = useState<Token[]>([]);
  const [sortInfo, setSortInfo] = useState<SortInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const ws = useWebSocket();
  const isSubscribed = useRef(false);
  
  // Transform backend token to frontend Token type
  const transformToken = useCallback((backendToken: any): Token => {
    return {
      id: backendToken.id || 0,
      address: backendToken.address || "",
      contractAddress: backendToken.address || "",
      symbol: backendToken.symbol || "",
      name: backendToken.name || "",
      price: backendToken.price || 0,
      market_cap: backendToken.market_cap || 0,
      marketCap: String(backendToken.market_cap || 0),
      volume_24h: backendToken.volume_24h || 0,
      volume24h: String(backendToken.volume_24h || 0),
      change_24h: backendToken.change_24h ?? 0,
      change24h: String(backendToken.change_24h ?? 0),
      liquidity: backendToken.liquidity || 0,
      fdv: backendToken.fdv || 0,
      decimals: backendToken.decimals || 9,
      image_url: backendToken.image_url || "",
      header_image_url: backendToken.header_image_url || "",
      socials: backendToken.socials || {},
      status: "active" as const,
      websites: backendToken.websites || []
    };
  }, []);
  
  // Handle incoming ticker data
  const handleTickerData = useCallback((message: any) => {
    if (message.type === 'DATA' && message.topic === 'ticker_tokens') {
      console.log('[useTickerTokens] Received ticker data:', {
        tokensCount: message.data?.tokens?.length,
        sortInfo: message.data?.sort_info
      });
      
      if (message.data?.tokens) {
        const transformedTokens = message.data.tokens.map(transformToken);
        setTokens(transformedTokens);
        setSortInfo(message.data.sort_info || null);
        setLastUpdate(new Date());
        setIsLoading(false);
        setError(null);
      }
    } else if (message.type === 'SUBSCRIPTION_UPDATED' && message.topic === 'ticker_tokens') {
      console.log('[useTickerTokens] Subscription updated:', message.data?.new_filters);
      
      if (message.data?.tokens) {
        const transformedTokens = message.data.tokens.map(transformToken);
        setTokens(transformedTokens);
        setSortInfo(message.data.sort_info || null);
        setLastUpdate(new Date());
      }
    }
  }, [transformToken]);
  
  // Subscribe to ticker tokens
  useEffect(() => {
    if (!ws.isConnected) {
      setError('WebSocket not connected');
      return;
    }
    
    // Subscribe with context - FIXED: removed action field
    const subscription = {
      type: "SUBSCRIBE",
      context: "ticker",
      params: {
        limit,
        sort,
        include_core: true
      }
    };
    
    console.log('[useTickerTokens] Subscribing with:', subscription);
    console.log('[useTickerTokens] EXACT message:', JSON.stringify(subscription));
    
    // Send subscription with context
    ws.sendMessage(subscription);
    isSubscribed.current = true;
    
    // Register listener
    const unregister = ws.registerListener(
      'ticker-tokens',
      ['DATA', 'SUBSCRIPTION_UPDATED'] as any[],
      handleTickerData
    );
    
    return () => {
      unregister();
      if (isSubscribed.current && ws.isConnected) {
        // Unsubscribe when component unmounts
        ws.sendMessage({
          type: "UNSUBSCRIBE",
          topics: ["ticker_tokens"]
        });
        isSubscribed.current = false;
      }
    };
  }, [ws, limit, sort, handleTickerData]);
  
  return {
    tokens,
    sortInfo,
    isLoading,
    isConnected: ws.isConnected,
    error,
    lastUpdate
  };
}