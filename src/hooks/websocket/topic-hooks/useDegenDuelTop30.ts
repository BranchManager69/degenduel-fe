/**
 * useDegenDuelTop30 Hook - NUKED AND REBUILT! 🚀
 * 
 * Now powered by the new /api/tokens/trending REST API with quality_level=strict
 * Eliminated WebSocket complexity in favor of clean, fast REST calls
 * 
 * @author DegenDuel Team  
 * @created 2025-01-15
 * @updated 2025-06-03 - NUCLEAR REPLACEMENT with REST API architecture
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { API_URL } from '../../../config/config';
import { Token } from '../../../types';

// Clean Token interface for DegenDuel Top 30
export interface DegenDuelToken extends Token {
  // Backend data
  degenduel_score: number;
  
  // Future backend fields (when available)
  sparkline_1h?: number[];
}

export interface DegenDuelTop30Response {
  tokens: DegenDuelToken[];
  metadata: {
    generated_at: string;
    algorithm_version: string;
    total_candidates: number;
    cache_ttl: number;
  };
}

export interface DegenDuelTop30Options {
  limit?: number; // Default 30, max 200
  refreshInterval?: number; // Auto-refresh interval in ms
  includeSparklines?: boolean; // When backend supports it, request sparkline data
}

// Transform backend DegenDuel token data to frontend format
const transformDegenDuelToken = (backendToken: any): DegenDuelToken => {
  const baseToken: Token = {
    // Core identification
    id: backendToken.id || 0,
    address: backendToken.address || "",
    contractAddress: backendToken.address || "", // backward compat
    symbol: backendToken.symbol || "",
    name: backendToken.name || "",

    // Visual/metadata
    image_url: backendToken.image_url || "",
    header_image_url: backendToken.header_image_url || "",
    color: backendToken.color || "#888888",
    decimals: backendToken.decimals || 9,
    description: backendToken.description,
    tags: backendToken.tags || [],

    // Supply & ranking
    total_supply: backendToken.total_supply,
    priority_score: backendToken.priority_score,
    first_seen_on_jupiter_at: backendToken.first_seen_on_jupiter_at,

    // Price data (numbers, not strings!)
    price: backendToken.price || 0,
    change_24h: backendToken.change_24h || 0,
    change24h: String(backendToken.change_24h || 0), // backward compat
    market_cap: backendToken.market_cap || 0,
    marketCap: String(backendToken.market_cap || 0), // backward compat
    fdv: backendToken.fdv || 0,
    liquidity: backendToken.liquidity || 0,
    volume_24h: backendToken.volume_24h || 0,
    volume24h: String(backendToken.volume_24h || 0), // backward compat

    // Enhanced timeframe data
    priceChanges: backendToken.priceChanges,
    volumes: backendToken.volumes,
    transactions: backendToken.transactions,
    pairCreatedAt: backendToken.pairCreatedAt,

    // Social links (now strings)
    socials: {
      twitter: backendToken.socials?.twitter,
      telegram: backendToken.socials?.telegram,
      discord: backendToken.socials?.discord,
      website: backendToken.socials?.website
    },

    // Status
    status: backendToken.is_active === false ? "inactive" : "active",
    websites: backendToken.websites || []
  };

  return {
    ...baseToken,
    degenduel_score: Number(backendToken.degenduel_score || 0),
    sparkline_1h: backendToken.sparkline_1h || []
  };
};

/**
 * Hook for accessing DegenDuel's Top 30 trending tokens with proprietary scoring
 * NOW POWERED BY REST API! 🚀
 */
export function useDegenDuelTop30(options: DegenDuelTop30Options = {}) {
  const {
    limit = 30,
    refreshInterval = 30000, // 30 seconds
    includeSparklines = false // Will be used when backend supports sparklines
  } = options;

  // State
  const [tokens, setTokens] = useState<DegenDuelToken[]>([]);
  const [metadata, setMetadata] = useState<DegenDuelTop30Response['metadata'] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(true); // REST is always "connected"

  // Refs
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch tokens from REST API
  const fetchTokens = useCallback(async () => {
    try {
      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      console.log(`[useDegenDuelTop30] Fetching ${limit} DegenDuel Top tokens`);

      // Build URL with parameters
      // Note: /api/tokens/trending defaults to 'strict' quality when no quality_level is specified
      const url = new URL(`${API_URL}/tokens/trending`);
      url.searchParams.set('limit', String(limit));

      // Add sparklines parameter when backend supports it
      if (includeSparklines) {
        url.searchParams.set('include_sparklines', 'true');
      }

      const response = await fetch(url.toString(), {
        signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'API request failed');
      }

      console.log(`[useDegenDuelTop30] Successfully fetched ${data.data.length} tokens`);

      // Transform tokens to frontend format
      const transformedTokens = data.data.map((token: any) => 
        transformDegenDuelToken(token)
      );

      setTokens(transformedTokens);
      setMetadata(data.metadata || null);
      setLastUpdate(new Date());
      setError(null);
      setIsLoading(false);
      setIsConnected(true);

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('[useDegenDuelTop30] Request aborted');
        return;
      }

      console.error('[useDegenDuelTop30] Error fetching tokens:', err);
      setError(err.message || 'Failed to fetch tokens');
      setIsLoading(false);
      setIsConnected(false);
    }
  }, [limit, includeSparklines]);

  // Initial load
  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  // Auto-refresh mechanism
  useEffect(() => {
    if (refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(fetchTokens, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
      };
    }
  }, [refreshInterval, fetchTokens]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, []);

  // Manual refresh function
  const refresh = useCallback(() => {
    setIsLoading(true);
    fetchTokens();
  }, [fetchTokens]);


  // Memoize expensive stats calculation
  const stats = useMemo(() => {
    if (tokens.length === 0) {
      return {
        totalVolume24h: 0,
        totalMarketCap: 0,
        averageScore: 0,
        topScore: 0
      };
    }

    return {
      totalVolume24h: tokens.reduce((sum, t) => sum + Number(t.volume_24h || 0), 0),
      totalMarketCap: tokens.reduce((sum, t) => sum + Number(t.market_cap || 0), 0),
      averageScore: tokens.reduce((sum, token) => sum + token.degenduel_score, 0) / tokens.length,
      topScore: Math.max(...tokens.map(t => t.degenduel_score))
    };
  }, [tokens]);

  return {
    // Data
    tokens,
    metadata,
    isLoading,
    lastUpdate,
    isConnected,
    error,

    // Actions
    refresh,

    // Stats for UI
    stats
  };
} 