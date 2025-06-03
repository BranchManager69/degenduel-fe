/**
 * useDegenDuelTop30 Hook
 * 
 * Specialized WebSocket Hook for DegenDuel's Proprietary Top 30 Trending Tokens
 * Uses the enhanced DegenDuel Score™ algorithm for curated, high-energy token list
 * 
 * @author DegenDuel Team
 * @created 2025-01-15
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useWebSocket } from '../../../contexts/UnifiedWebSocketContext';
import { Token } from '../../../types';
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';

// Enhanced Token interface for DegenDuel Top 30
export interface DegenDuelToken extends Token {
  // DegenDuel proprietary data
  degenduel_score: number;
  trend_rank: number;
  trend_category: '🌅 Early Birds' | '🔥 Heating Up' | '🚀 Moon Mission' | '💎 Hidden Gems';
  momentum_indicator: '🚀' | '📈' | '⚡' | '💎' | '🔥';

  // Enhanced frontend data
  sparkline_1h?: number[];
  highlight_reason?: string;

  // Contest integration
  contest_popularity?: number;
  player_sentiment?: number;
  degen_factor?: number;
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
  limit?: number; // Default 30, max 50
  refreshInterval?: number; // Auto-refresh interval in ms
  includeSparklines?: boolean;
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
    degenduel_score: backendToken.degenduel_score || 0,
    trend_rank: backendToken.trend_rank || 0,
    trend_category: backendToken.trend_category || '🔥 Heating Up',
    momentum_indicator: backendToken.momentum_indicator || '📈',
    sparkline_1h: backendToken.sparkline_1h || [],
    highlight_reason: backendToken.highlight_reason || '',
    contest_popularity: backendToken.contest_popularity || 0,
    player_sentiment: backendToken.player_sentiment || 0,
    degen_factor: backendToken.degen_factor || 0
  };
};

/**
 * Hook for accessing DegenDuel's Top 30 trending tokens with proprietary scoring
 */
export function useDegenDuelTop30(options: DegenDuelTop30Options = {}) {
  const {
    limit = 30,
    refreshInterval = 30000, // 30 seconds
    includeSparklines = true
  } = options;

  // State
  const [tokens, setTokens] = useState<DegenDuelToken[]>([]);
  const [metadata, setMetadata] = useState<DegenDuelTop30Response['metadata'] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Refs
  const isLoadingRef = useRef(isLoading);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  isLoadingRef.current = isLoading;

  // Message handler for WebSocket responses
  const handleMessage = useCallback((message: any) => {
    try {
      console.log('[useDegenDuelTop30] Received message:', message);

      // Handle DegenDuel Top 30 responses
      if (message.type === 'DATA' && message.topic === 'market-data' && message.action === 'degenDuelTop30') {
        if (message.data && Array.isArray(message.data)) {
          console.log(`[useDegenDuelTop30] Processing ${message.data.length} trending tokens`);

          const transformedTokens = message.data.map(transformDegenDuelToken);
          setTokens(transformedTokens);
          setMetadata(message.metadata || null);
          setLastUpdate(new Date());
          setIsLoading(false);

          dispatchWebSocketEvent('degenduel_top30_update', {
            socketType: 'market-data',
            message: `Updated ${message.data.length} DegenDuel Top 30 tokens`,
            timestamp: new Date().toISOString(),
            score_range: transformedTokens.length > 0 ?
              `${transformedTokens[transformedTokens.length - 1].degenduel_score.toFixed(1)} - ${transformedTokens[0].degenduel_score.toFixed(1)}` :
              'none'
          });
        }
      }

      // Handle RESPONSE messages for initial data
      else if (message.type === 'RESPONSE' && message.topic === 'market-data' && message.action === 'getDegenDuelTop30') {
        if (message.data && Array.isArray(message.data)) {
          console.log(`[useDegenDuelTop30] Processing ${message.data.length} trending tokens from RESPONSE`);

          const transformedTokens = message.data.map(transformDegenDuelToken);
          setTokens(transformedTokens);
          setMetadata(message.metadata || null);
          setLastUpdate(new Date());
          setIsLoading(false);

          dispatchWebSocketEvent('degenduel_top30_init', {
            socketType: 'market-data',
            message: `Initialized DegenDuel Top 30 with ${message.data.length} tokens`,
            timestamp: new Date().toISOString()
          });
        }
      }

      if (isLoadingRef.current) {
        setIsLoading(false);
      }
    } catch (err) {
      console.error('[useDegenDuelTop30] Error processing message:', err);
      setIsLoading(false);
      dispatchWebSocketEvent('error', {
        socketType: 'market-data',
        message: 'Error processing DegenDuel Top 30 data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, []);

  // Connect to WebSocket
  const ws = useWebSocket();

  // Register message listener
  useEffect(() => {
    const unregister = ws.registerListener(
      'degenduel-top30-hook',
      ['DATA', 'RESPONSE', 'ERROR'] as any[],
      handleMessage,
      ['market-data']
    );
    return unregister;
  }, [handleMessage, ws.registerListener]);

  // Subscribe and request initial data
  useEffect(() => {
    if (ws.isConnected && !initialized) {
      // Subscribe to market-data topic
      ws.subscribe(['market-data']);

      // Request initial DegenDuel Top 30 data
      const requestData = {
        limit,
        includeSparklines,
        algorithm: 'degenduel'
      };

      ws.request('market-data', 'getDegenDuelTop30', requestData);
      setInitialized(true);

      dispatchWebSocketEvent('degenduel_top30_subscribe', {
        socketType: 'market-data',
        message: 'DegenDuel Top 30 subscription initialized',
        options: { limit, includeSparklines }
      });
    }
  }, [ws.isConnected, initialized, limit, includeSparklines, ws.subscribe, ws.request]);

  // Auto-refresh mechanism
  useEffect(() => {
    if (refreshInterval > 0 && ws.isConnected && initialized) {
      refreshIntervalRef.current = setInterval(() => {
        const requestData = {
          limit,
          includeSparklines,
          algorithm: 'degenduel'
        };
        ws.request('market-data', 'getDegenDuelTop30', requestData);
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
      };
    }
  }, [refreshInterval, ws.isConnected, initialized, limit, includeSparklines, ws.request]);

  // Manual refresh function
  const refresh = useCallback(() => {
    setIsLoading(true);

    if (ws.isConnected) {
      const requestData = {
        limit,
        includeSparklines,
        algorithm: 'degenduel'
      };

      ws.request('market-data', 'getDegenDuelTop30', requestData);

      dispatchWebSocketEvent('degenduel_top30_refresh', {
        socketType: 'market-data',
        message: 'Manually refreshing DegenDuel Top 30',
        timestamp: new Date().toISOString()
      });
    } else {
      console.warn('[useDegenDuelTop30] Cannot refresh - WebSocket not connected');
      setIsLoading(false);
    }
  }, [ws.isConnected, ws.request, limit, includeSparklines]);

  // Helper functions
  const getTokensByCategory = useCallback((category: DegenDuelToken['trend_category']) => {
    return tokens.filter(token => token.trend_category === category);
  }, [tokens]);

  const getTopScorers = useCallback((count: number = 5) => {
    return tokens
      .sort((a, b) => b.degenduel_score - a.degenduel_score)
      .slice(0, count);
  }, [tokens]);

  return {
    // Data
    tokens,
    metadata,
    isLoading,
    lastUpdate,
    isConnected: ws.isConnected,
    error: ws.connectionError,

    // Helpers
    getTokensByCategory,
    getTopScorers,

    // Actions
    refresh,

    // Stats for UI
    stats: {
      totalTokens: tokens.length,
      averageScore: tokens.length > 0 ?
        tokens.reduce((sum, token) => sum + token.degenduel_score, 0) / tokens.length : 0,
      topScore: tokens.length > 0 ? Math.max(...tokens.map(t => t.degenduel_score)) : 0,
      categories: {
        earlyBirds: getTokensByCategory('🌅 Early Birds').length,
        heatingUp: getTokensByCategory('🔥 Heating Up').length,
        moonMission: getTokensByCategory('🚀 Moon Mission').length,
        hiddenGems: getTokensByCategory('💎 Hidden Gems').length
      }
    }
  };
} 