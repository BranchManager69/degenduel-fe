// src/hooks/data/useHotTokensData.ts

/**
 * @deprecated This hook is deprecated and will be removed in a future version.
 * No components are using this hook. Use useStandardizedTokenData instead.
 * 
 * Hook for fetching optimized hot tokens data specifically for ticker display
 * Uses new backend getHotTokens endpoint for maximum performance
 * 
 * This replaces the expensive client-side filtering approach with
 * server-side pre-calculated hot scores and filtering.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUnifiedWebSocket, MessageType } from '../websocket';
import type { Token } from '../../types';

interface HotTokensFilters {
  minMarketCap?: number;
  minVolume?: number;
  minLiquidity?: number;
  onlyActive?: boolean;
  dataFreshness?: number; // seconds
}

interface HotTokensRequest {
  limit: number;
  algorithm: 'hot' | 'trending' | 'volatile' | 'volume';
  filters: HotTokensFilters;
}

interface HotTokensResponse {
  tokens: (Token & { hotScore: number })[];
  meta: {
    totalHotTokens: number;
    algorithm: string;
    generatedAt: string;
    cacheExpiresAt: string;
  };
}

interface UseHotTokensDataOptions {
  limit?: number;
  algorithm?: 'hot' | 'trending' | 'volatile' | 'volume';
  filters?: HotTokensFilters;
  enableSubscription?: boolean;
}

const DEFAULT_FILTERS: HotTokensFilters = {
  minMarketCap: 50000,
  minVolume: 50000,
  minLiquidity: 10000,
  onlyActive: true,
  dataFreshness: 300 // 5 minutes
};

/**
 * @deprecated This hook is deprecated and will be removed in a future version.
 * No components are using this hook. Use useStandardizedTokenData instead.
 */
export const useHotTokensData = (options: UseHotTokensDataOptions = {}) => {
  const {
    limit = 20,
    algorithm = 'hot',
    filters = DEFAULT_FILTERS,
    enableSubscription = true
  } = options;

  const [hotTokens, setHotTokens] = useState<(Token & { hotScore: number })[]>([]);
  const [meta, setMeta] = useState<HotTokensResponse['meta'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Use unified WebSocket for communication
  const subscriptionId = useMemo(() => `hot-tokens-${Math.random().toString(36).substring(2, 9)}`, []);
  
  const {
    isConnected,
    error: wsError,
    request,
    subscribe
  } = useUnifiedWebSocket(
    subscriptionId,
    [MessageType.DATA, MessageType.ERROR],
    (data: HotTokensResponse) => {
      if (!data) return;
      
      // Handle both getHotTokens responses and hotTokensUpdate subscriptions
      if (data.tokens && Array.isArray(data.tokens)) {
        setHotTokens(data.tokens);
        setMeta(data.meta || null);
        setLastUpdate(new Date());
        setIsLoading(false);
        setError(null);
      }
    },
    ['market_data'] // Use underscore format for consistency
  );

  // Request parameters
  const requestParams = useMemo((): HotTokensRequest => ({
    limit,
    algorithm,
    filters: { ...DEFAULT_FILTERS, ...filters }
  }), [limit, algorithm, filters]);

  // Manual refresh function with retry logic
  const refresh = useCallback(async (isRetry = false) => {
    if (!isConnected) {
      setError('WebSocket not connected');
      return;
    }

    try {
      setIsLoading(true);
      if (!isRetry) {
        setError(null);
        setRetryCount(0);
      }
      
      // Request hot tokens using the unified WebSocket request method
      const success = request('market_data', 'getHotTokens', requestParams);
      
      if (!success) {
        throw new Error('Failed to send hot tokens request');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch hot tokens';
      
      // If this is the first attempt and it's a connectivity-related error, retry after 60 seconds
      if (!isRetry && retryCount === 0 && errorMessage.includes('Failed to send')) {
        setRetryCount(1);
        setTimeout(() => {
          refresh(true);
        }, 60000); // 60 seconds
        return; // Don't log error or set error state yet
      }
      
      // Only log error if retry also failed or it's a different type of error
      setError(errorMessage);
      console.error('useHotTokensData: Error fetching hot tokens:', err);
      setIsLoading(false);
    }
  }, [isConnected, request, requestParams, retryCount]);

  // Subscribe to real-time updates
  const subscribeToUpdates = useCallback(() => {
    if (!isConnected || !enableSubscription) return;

    try {
      // Subscribe to the market_data topic for hot tokens updates
      const success = subscribe(['market_data']);
      
      if (!success) {
        console.error('useHotTokensData: Failed to subscribe to hot tokens');
      }
    } catch (err) {
      console.error('useHotTokensData: Error subscribing to hot tokens:', err);
    }
  }, [isConnected, enableSubscription, subscribe]);

  // Handle WebSocket errors
  useEffect(() => {
    if (wsError) {
      setError(wsError);
      setIsLoading(false);
    }
  }, [wsError]);

  // Initial data fetch and subscription setup
  useEffect(() => {
    if (isConnected) {
      refresh();
      if (enableSubscription) {
        subscribeToUpdates();
      }
    }
  }, [isConnected, refresh, subscribeToUpdates, enableSubscription]);

  // Memoized return value
  return useMemo(() => ({
    tokens: hotTokens,
    meta,
    isLoading,
    isConnected,
    lastUpdate,
    error,
    refresh,
    // Computed properties for convenience
    totalCount: meta?.totalHotTokens || 0,
    algorithm: meta?.algorithm || algorithm,
    cacheExpiresAt: meta?.cacheExpiresAt ? new Date(meta.cacheExpiresAt) : null
  }), [
    hotTokens,
    meta,
    isLoading,
    isConnected,
    lastUpdate,
    error,
    refresh,
    algorithm
  ]);
};

/** @deprecated Use useStandardizedTokenData instead */
export default useHotTokensData;