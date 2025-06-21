/**
 * useWhaleRoomData Hook - Institutional Analytics for Top Holders 🐋💎
 * 
 * Fetches trending tokens with full quantitative analysis for the Whale Room dashboard
 * Provides hedge fund-level analytics: momentum physics, slippage analysis, alpha/beta, etc.
 * 
 * @author DegenDuel Team
 * @created 2025-06-03
 * @updated 2025-06-03 - Initial implementation with advanced metrics
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useWebSocket } from '../../contexts/UnifiedWebSocketContext';
import { DDExtendedMessageType } from '../../hooks/websocket';

// Enhanced Token interface with all advanced metrics for whale room
export interface WhaleRoomToken {
  // Core token data
  id: number;
  address: string;
  symbol: string;
  name: string;
  price: number;
  change_24h: number;
  market_cap: number;
  liquidity: number;
  volume_24h: number;
  image_url?: string;

  // DegenDuel scoring
  degenduel_score: number;
  trend_rank: number;
  trend_category: '🌅 Early Birds' | '🔥 Heating Up' | '🚀 Moon Mission' | '💎 Hidden Gems';
  momentum_indicator: '🚀' | '📈' | '⚡' | '💎' | '🔥';
  highlight_reason?: string;

  // Timeframe data
  priceChanges?: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  volumes?: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  transactions?: {
    m5: { buys: number; sells: number; };
    h1: { buys: number; sells: number; };
    h6: { buys: number; sells: number; };
    h24: { buys: number; sells: number; };
  };

  // ADVANCED ANALYTICS - The institutional-grade metrics
  advanced_metrics: {
    momentum: {
      velocity: { "1h": number; "6h": number; "24h": number; };
      acceleration: { "1h": number; "6h": number; "24h": number; };
      signal: "ACCELERATING" | "DECELERATING" | "STEADY";
      strength: number; // 1-10 scale
    };

    liquidity_analysis: {
      depth_score: number;
      metrics: {
        total_liquidity: string;
        depth_ratio: number;
        concentration: number;
        volatility: number;
      };
      slippage_estimates: {
        "10k": number;    // Slippage for $10k trade
        "50k": number;    // Slippage for $50k trade  
        "100k": number;   // Slippage for $100k trade
      };
      max_trade_sizes: {
        "0.5%_slippage": number;  // Max trade size for 0.5% slippage
        "1%_slippage": number;    // Max trade size for 1% slippage
        "2%_slippage": number;    // Max trade size for 2% slippage
      };
      quality_rating: "INSTITUTIONAL" | "RETAIL" | "THIN";
    };

    relative_strength: {
      vs_all_tokens: number;      // Performance vs entire crypto market
      vs_top_100: number;         // Performance vs top 100 tokens
      vs_sector: number;          // Performance vs sector peers
      momentum: number;           // Momentum score
      beta: number;               // Market sensitivity (volatility vs market)
      alpha: number;              // Alpha generation vs market
      percentile_rank: number;    // Performance percentile (0-100)
      strength_score: number;     // Overall strength (1-10)
    };

    risk_adjusted: {
      returns: {
        "1h": number;
        "24h": number;
      };
      volatility: {
        "1h": number;
        "24h": number;
      };
      sharpe_ratio: {
        "1h": number;   // Risk-adjusted return (Sharpe ratio)
        "24h": number;
      };
      sortino_ratio: {
        "1h": number;   // Downside deviation adjusted return
        "24h": number;
      };
      risk_rating: "LOW" | "MEDIUM" | "HIGH";
      quality_score: number; // 1-10 risk quality score
    };

    regime: {
      current: "ACCUMULATION" | "DISTRIBUTION" | "TRENDING" | "RANGING" | "BREAKOUT";
      confidence: number;     // 0-1 confidence in regime detection
      trends: {
        price: {
          slope: number;      // Price trend slope
          r_squared: number;  // R-squared of price trend
        };
      };
    };

    divergence: {
      current: number;
      "1h_avg": number;
      "24h_avg": number;
      z_score: number;
      interpretation: "BULLISH" | "BEARISH" | "NEUTRAL";
      confidence: number;
    };

    time_weighted: {
      raw_returns: {
        "5m": number;
        "1h": number;
        "6h": number;
        "24h": string | number;
      };
      weights: {
        "5m": number;
        "1h": number;
        "6h": number;
        "24h": number;
      };
      weighted_score: number;
      consistency: number;
      trend_strength: number;
      momentum_quality: "STRONG" | "MODERATE" | "WEAK";
    };
  };
}

export interface WhaleRoomResponse {
  success: boolean;
  data: WhaleRoomToken[];
  error?: string;
  metadata: {
    generated_at: string;
    algorithm_version: string;
    quality_level: string;
    filters_used: {
      min_liquidity: number;
      min_volume: number;
      min_market_cap: number;
      require_image: boolean;
      max_age_days: number;
      min_change: number | null;
    };
    total_candidates: number;
    total_eligible: number;
    total_after_filters: number;
    requested_limit: number;
    actual_returned: number;
    endpoint_type: string;
  };
}

export interface UseWhaleRoomDataReturn {
  // Data
  tokens: WhaleRoomToken[];
  metadata: WhaleRoomResponse['metadata'] | null;

  // State
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;

  // Actions
  refresh: () => void;

  // Analytics utilities
  getTopPerformers: (count?: number) => WhaleRoomToken[];
  getHighestAlpha: (count?: number) => WhaleRoomToken[];
  getBestLiquidity: (count?: number) => WhaleRoomToken[];
  getMomentumLeaders: (count?: number) => WhaleRoomToken[];
}

export interface WhaleRoomDataOptions {
  limit?: number;           // Number of tokens to fetch (default: 50)
  qualityLevel?: 'strict' | 'relaxed' | 'minimal';  // Quality filter level
  refreshInterval?: number; // Auto-refresh interval in ms (default: 30000)
  minChange?: number;       // Minimum price change filter
}

/**
 * Hook for accessing institutional-grade token analytics for the Whale Room  
 * Fetches trending tokens with full quantitative analysis via WebSocket (real-time)
 * 
 * Now uses unified WebSocket system for 10-second real-time updates instead of REST API
 */
export function useWhaleRoomData(options: WhaleRoomDataOptions = {}): UseWhaleRoomDataReturn {
  const {
    limit = 50,
    qualityLevel = 'strict', // Whale room gets highest quality data
    refreshInterval = 10000, // 10 seconds with WebSocket
    minChange = undefined    // No minimum change filter by default
  } = options;

  // State
  const [tokens, setTokens] = useState<WhaleRoomToken[]>([]);
  const [metadata, setMetadata] = useState<WhaleRoomResponse['metadata'] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Refs
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket connection
  const { isConnected, sendMessage, registerListener } = useWebSocket();

  // Request whale room data via WebSocket
  const requestWhaleRoomData = useCallback(() => {
    if (!isConnected) {
      setError('WebSocket not connected');
      return;
    }

    console.log(`[useWhaleRoomData] Requesting ${limit} tokens (quality: ${qualityLevel}) for Whale Room via WebSocket`);

    const requestId = `whale-room-${Date.now()}`;

    // Send WebSocket request
    sendMessage({
      type: DDExtendedMessageType.REQUEST,
      topic: 'market_data',
      action: 'getWhaleRoomData',
      requestId,
      data: {
        limit,
        qualityLevel,
        includeAdvancedMetrics: true,
        format: 'institutional',
        minChange
      }
    });

    setIsLoading(true);
    setError(null);
  }, [isConnected, sendMessage, limit, qualityLevel, minChange]);

  // Handle WebSocket responses
  useEffect(() => {
    if (!isConnected) return;

    const handleWhaleRoomData = (message: any) => {
      if (message.type === DDExtendedMessageType.DATA &&
        message.topic === 'market_data' &&
        message.action === 'whaleRoomData') {

        if (message.success) {
          console.log(`[useWhaleRoomData] Received ${message.tokens?.length || 0} whale room tokens via WebSocket`);

          setTokens(message.tokens || []);
          setMetadata(message.metadata || null);
          setLastUpdate(new Date());
          setError(null);
        } else {
          setError(message.error || 'Failed to fetch whale room data');
        }
        setIsLoading(false);
      }

      if (message.type === DDExtendedMessageType.ERROR &&
        message.topic === 'market_data') {
        setError(message.error || 'WebSocket error');
        setIsLoading(false);
      }
    };

    // Register listener for whale room data responses
    const unregister = registerListener(
      'whale-room-data-listener',
      [DDExtendedMessageType.DATA, DDExtendedMessageType.ERROR],
      handleWhaleRoomData,
      ['market_data']
    );

    return unregister;
  }, [isConnected, registerListener]);

  // Initial data request when WebSocket connects
  useEffect(() => {
    if (isConnected) {
      requestWhaleRoomData();
    }
  }, [isConnected, requestWhaleRoomData]);

  // Auto-refresh mechanism
  useEffect(() => {
    if (refreshInterval > 0 && isConnected) {
      refreshIntervalRef.current = setInterval(() => {
        requestWhaleRoomData();
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
      };
    }
  }, [refreshInterval, isConnected, requestWhaleRoomData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, []);

  // Manual refresh function
  const refresh = useCallback(() => {
    setIsLoading(true);
    requestWhaleRoomData();
  }, [requestWhaleRoomData]);

  // Analytics utility functions for whale room insights
  const getTopPerformers = useCallback((count: number = 10): WhaleRoomToken[] => {
    return [...tokens]
      .sort((a, b) => b.advanced_metrics.relative_strength.percentile_rank - a.advanced_metrics.relative_strength.percentile_rank)
      .slice(0, count);
  }, [tokens]);

  const getHighestAlpha = useCallback((count: number = 10): WhaleRoomToken[] => {
    return [...tokens]
      .sort((a, b) => b.advanced_metrics.relative_strength.alpha - a.advanced_metrics.relative_strength.alpha)
      .slice(0, count);
  }, [tokens]);

  const getBestLiquidity = useCallback((count: number = 10): WhaleRoomToken[] => {
    return [...tokens]
      .filter(token => token.advanced_metrics.liquidity_analysis.quality_rating === "INSTITUTIONAL")
      .sort((a, b) => a.advanced_metrics.liquidity_analysis.slippage_estimates["100k"] - b.advanced_metrics.liquidity_analysis.slippage_estimates["100k"])
      .slice(0, count);
  }, [tokens]);

  const getMomentumLeaders = useCallback((count: number = 10): WhaleRoomToken[] => {
    return [...tokens]
      .sort((a, b) => b.advanced_metrics.momentum.strength - a.advanced_metrics.momentum.strength)
      .slice(0, count);
  }, [tokens]);

  return {
    // Data
    tokens,
    metadata,

    // State
    isLoading,
    error,
    lastUpdate,

    // Actions
    refresh,

    // Analytics utilities
    getTopPerformers,
    getHighestAlpha,
    getBestLiquidity,
    getMomentumLeaders,
  };
}

export default useWhaleRoomData; 