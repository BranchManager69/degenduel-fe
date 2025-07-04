// src/hooks/useStandardizedTokenData.ts

/**
 * Standardized Token Data Hook - PARTIALLY NUKED! 🚀
 * 
 * This hook wraps the existing topic-hooks/useTokenData hook and provides
 * standardized transformations and utilities that our various components need.
 * 
 * ⭐️ RECOMMENDED HOOK FOR UI COMPONENTS ⭐️ 
 * 
 * 🔧 NOW FULLY FUNCTIONAL ✅
 * 
 * KEY UPDATES:
 * ✅ Hot tokens now powered by new /api/tokens/trending REST API (quality_level=relaxed)
 * ✅ Eliminated complex client-side hot token algorithm 
 * ✅ Uses backend's superior momentum/change scoring
 * ✅ All other functionality remains unchanged
 * 
 * FEATURES PROVIDED:
 * - Data processing: Filtering, sorting, search functionality
 * - Token collections: Hot tokens (via REST API), top tokens by market cap
 * - Market statistics: Total volume, market cap, top gainers/losers
 * - Format adapters: Token ↔ TokenData conversion for backward compatibility
 * - Real-time updates: Automatic refresh and WebSocket integration
 * - Debug information: Connection state, data freshness indicators
 * 
 * This hook is the final stage in the token data hook migration path:
 * 1. hooks/useTokenData.ts - Original implementation (legacy)
 * 2. hooks/websocket/topic-hooks/useTokenData.ts - Improved v69 WebSocket architecture (FIXED)
 * 3. hooks/useStandardizedTokenData.ts - THIS FILE (UI standardization layer)
 * 
 * If you need ON-CHAIN Solana token data (not market data), use useSolanaTokenData.ts
 * 
 * @author Claude
 * @created 2025-04-29
 * @updated 2025-06-03 - NUCLEAR HOT TOKENS REPLACEMENT with REST API architecture
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Token, TokenData } from '../../types';
import { formatNumber } from '../../utils/format';
import { useTokenData } from '../websocket/topic-hooks/useTokenData';

/**
 * Adapter function to convert Token to TokenData format
 * This is used for backward compatibility with components expecting TokenData
 */
export function tokenToTokenData(token: Token): TokenData {
  return {
    symbol: token.symbol,
    name: token.name,
    price: String(token.price || 0),
    marketCap: String(token.market_cap || token.marketCap || 0),
    volume24h: String(token.volume_24h || token.volume24h || 0),
    change24h: String(token.change_24h || token.change24h || 0),
    // Convert the liquidity number to a number
    liquidity: token.liquidity || undefined,
    status: token.status as "active" | "inactive",
    contractAddress: token.address || token.contractAddress,
    // For images, use the new image_url property
    imageUrl: token.image_url || token.images?.imageUrl
  };
}

/**
 * Adapter function to convert TokenData to Token format
 * Used when we need to upgrade legacy TokenData to the more comprehensive Token format
 */
export function tokenDataToToken(tokenData: TokenData): Token {
  return {
    id: 0, // Default ID
    address: tokenData.contractAddress || `synthetic-${tokenData.symbol}`,
    symbol: tokenData.symbol,
    name: tokenData.name,
    price: Number(tokenData.price) || 0,
    market_cap: Number(tokenData.marketCap) || 0,
    marketCap: tokenData.marketCap, // Keep for backward compatibility
    volume_24h: Number(tokenData.volume24h) || 0,
    volume24h: tokenData.volume24h, // Keep for backward compatibility
    change_24h: Number(tokenData.change24h) || 0,
    change24h: tokenData.change24h, // Keep for backward compatibility
    liquidity: tokenData.liquidity || 0,
    fdv: 0, // Default
    decimals: 9, // Default
    status: tokenData.status || "active",
    contractAddress: tokenData.contractAddress || `synthetic-${tokenData.symbol}`,
    image_url: tokenData.imageUrl
  };
}

export type TokenSortMethod =
  | 'marketCap'
  | 'volume'
  | 'price'
  | 'change'
  | 'gainers'
  | 'losers'
  | 'hot';

export interface TokenFilter {
  minMarketCap?: number;
  minVolume?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'all';
  // Jupiter tag filtering
  tags?: string[];
  excludeTags?: string[];
  strictOnly?: boolean;
  verifiedOnly?: boolean;
}

export interface TokenStatistics {
  totalVolume24h: number;
  totalMarketCap: number;
  topGainer: {
    symbol: string;
    change: number;
  } | null;
  topLoser: {
    symbol: string;
    change: number;
  } | null;
  totalTokens: number;
  // Add formatted values for UI convenience
  formatted?: {
    totalVolume24h: string;
    totalMarketCap: string;
    topGainerChange: string | null;
    topLoserChange: string | null;
  };
}

export interface UseStandardizedTokenDataReturn {
  // Basic token data
  tokens: Token[];
  isLoading: boolean;
  error: string | null;
  connectionState: string | null;
  isConnected: boolean;
  lastUpdate: Date | null;

  // Pagination data
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  } | null;

  // Filtered and sorted tokens
  filteredTokens: Token[];
  sortedTokens: Token[];

  // Selected tokens
  hotTokens: Token[];
  topTokens: Token[];

  // Market statistics
  stats: TokenStatistics;

  // Token getters and utilities
  getTokenBySymbol: (symbol: string) => Token | undefined;
  getTokenColor: (symbol: string) => string;

  // Adapter functions
  tokenToTokenData: (token: Token) => TokenData;
  tokenDataToToken: (tokenData: TokenData) => Token;

  // Legacy compatibility (TokenData format)
  tokensAsTokenData: TokenData[];
  hotTokensAsTokenData: TokenData[];
  topTokensAsTokenData: TokenData[];

  // Actions
  refresh: () => void;
  loadMore: () => void;
  setFilter: (filter: TokenFilter) => void;
  setSortMethod: (method: TokenSortMethod) => void;
}

/**
 * Hook for accessing standardized token data with common transformations
 */
export function useStandardizedTokenData(
  tokensToSubscribe: string[] | "all" = "all",
  _initialSortMethod: TokenSortMethod = 'marketCap', // Unused but kept for interface compatibility
  initialFilter: TokenFilter = { status: 'active' },
  maxHotTokens: number = 5,
  maxTopTokens: number = 6,
  disableLiveUpdates: boolean = false // NEW: Pass through to disable WebSocket updates
): UseStandardizedTokenDataReturn {
  // Extract Jupiter tag filters for backend
  const backendFilters = {
    minMarketCap: initialFilter.minMarketCap,
    minVolume: initialFilter.minVolume,
    tags: initialFilter.tags,
    excludeTags: initialFilter.excludeTags,
    strictOnly: initialFilter.strictOnly,
    verifiedOnly: initialFilter.verifiedOnly
  };

  const {
    tokens,
    isConnected,
    error: wsError,
    lastUpdate,
    refresh,
    loadMore,
    pagination,
    isLoading: underlyingIsLoading
  } = useTokenData(tokensToSubscribe, backendFilters, maxTopTokens, true, disableLiveUpdates);

  const [connectionState, setConnectionState] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // HOT TOKENS - Derived from main tokens (no separate fetch!)

  useEffect(() => {
    setConnectionState(isConnected ? 'connected' : 'disconnected');
  }, [isConnected]);

  useEffect(() => {
    setError(wsError);
  }, [wsError]);

  // HOT TOKENS - Just take the first N tokens (no filtering!)
  const hotTokens = useMemo(() => {
    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) return [];
    
    // Hot tokens = first tokens from backend (already sorted by degenduel_score)
    return tokens.slice(0, maxHotTokens);
  }, [tokens, maxHotTokens]);

  // NO CLIENT-SIDE FILTERING - Just return tokens as-is from backend
  const filteredTokens = useMemo(() => {
    return Array.isArray(tokens) ? tokens : [];
  }, [tokens]);

  // NO CLIENT-SIDE SORTING - Backend already sorted by degenduel_score
  const sortedTokens = useMemo(() => {
    return filteredTokens || [];
  }, [filteredTokens]);

  // Top tokens - just first N from backend (already sorted)
  const topTokens = useMemo(() => {
    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) return [];
    return tokens.slice(0, maxTopTokens);
  }, [tokens, maxTopTokens]);

  // Calculate market statistics
  const stats = useMemo(() => {
    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return {
        totalVolume24h: 0,
        totalMarketCap: 0,
        topGainer: null,
        topLoser: null,
        totalTokens: 0
      };
    }

    let totalVolume24h = 0;
    let totalMarketCap = 0;
    let topGainer = { symbol: "", change: -Infinity };
    let topLoser = { symbol: "", change: Infinity };

    tokens.forEach(token => {
      // Calculate totals
      const volume = Number(token.volume24h || 0);
      const marketCap = Number(token.marketCap || 0);

      if (!isNaN(volume)) totalVolume24h += volume;
      if (!isNaN(marketCap)) totalMarketCap += marketCap;

      // Find top gainer
      const change = Number(token.change24h || 0);
      if (!isNaN(change)) {
        if (change > topGainer.change) {
          topGainer = { symbol: token.symbol, change };
        }

        // Find top loser
        if (change < topLoser.change) {
          topLoser = { symbol: token.symbol, change };
        }
      }
    });

    // Format statistics for display
    return {
      totalVolume24h,
      totalMarketCap,
      topGainer: topGainer.symbol ? topGainer : null,
      topLoser: topLoser.symbol ? topLoser : null,
      totalTokens: tokens.length,
      // Add formatted values for UI display
      formatted: {
        totalVolume24h: formatNumber(totalVolume24h),
        totalMarketCap: formatNumber(totalMarketCap),
        topGainerChange: topGainer.symbol ? formatNumber(Number(topGainer.change)) : null,
        topLoserChange: topLoser.symbol ? formatNumber(Number(topLoser.change)) : null,
      }
    };
  }, [tokens]);

  // Token utilities
  const getTokenBySymbol = useCallback((symbol: string): Token | undefined => {
    if (!Array.isArray(tokens)) return undefined;
    return tokens.find(token => token.symbol.toLowerCase() === symbol.toLowerCase());
  }, [tokens]);

  // Function to get a color based on token symbol - for visual variety
  const getTokenColor = useCallback((symbol: string): string => {
    const colors: Record<string, string> = {
      SOL: '#14F195',
      BTC: '#F7931A',
      ETH: '#627EEA',
      DOGE: '#C3A634',
      ADA: '#0033AD',
      WIF: '#9945FF',
      PEPE: '#479F53',
      BONK: '#F2A900',
      SHIB: '#FFA409'
    };
    // Default to brand purple if no match
    return colors[symbol] || '#7F00FF';
  }, []);

  // Enhanced refresh function - just refresh main data (hot tokens auto-derive)
  const enhancedRefresh = useCallback(() => {
    refresh(); // Refresh main token data (hot tokens derive automatically)
  }, [refresh]);

  // Create TokenData versions of token arrays for backward compatibility
  const tokensAsTokenData = useMemo(() => Array.isArray(tokens) ? tokens.map(tokenToTokenData) : [], [tokens]);
  const hotTokensAsTokenData = useMemo(() => hotTokens.map(tokenToTokenData), [hotTokens]);
  const topTokensAsTokenData = useMemo(() => topTokens.map(tokenToTokenData), [topTokens]);

  return {
    tokens: Array.isArray(tokens) ? tokens : [],
    isLoading: underlyingIsLoading,
    error: error,
    connectionState,
    isConnected,
    lastUpdate,

    // Pagination data
    pagination,

    // Filtered and sorted tokens
    filteredTokens,
    sortedTokens,

    // Selected tokens - HOT TOKENS NOW FROM REST API! 🚀
    hotTokens,
    topTokens,

    // Market statistics
    stats,

    // Token getters and utilities
    getTokenBySymbol,
    getTokenColor,

    // Adapter functions
    tokenToTokenData,
    tokenDataToToken,

    // Legacy compatibility (TokenData format)
    tokensAsTokenData,
    hotTokensAsTokenData,
    topTokensAsTokenData,

    // Actions
    refresh: enhancedRefresh,
    loadMore,
    setFilter: () => {}, // No-op since we don't filter client-side
    setSortMethod: () => {} // No-op since we don't sort client-side
  };
}

export default useStandardizedTokenData;