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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { API_URL } from '../../config/config';
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
  setFilter: (filter: TokenFilter) => void;
  setSortMethod: (method: TokenSortMethod) => void;
}

/**
 * Hook for accessing standardized token data with common transformations
 */
export function useStandardizedTokenData(
  tokensToSubscribe: string[] | "all" = "all",
  initialSortMethod: TokenSortMethod = 'marketCap',
  initialFilter: TokenFilter = { status: 'active' },
  maxHotTokens: number = 5,
  maxTopTokens: number = 6
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
    isLoading: underlyingIsLoading
  } = useTokenData(tokensToSubscribe, backendFilters);

  const [sortMethod, setSortMethod] = useState<TokenSortMethod>(initialSortMethod);
  const [filter, setFilter] = useState<TokenFilter>(initialFilter);
  const [connectionState, setConnectionState] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // HOT TOKENS STATE - NOW POWERED BY REST API! 🚀
  const [hotTokens, setHotTokens] = useState<Token[]>([]);
  const [hotTokensLoading, setHotTokensLoading] = useState<boolean>(false);
  const [hotTokensError, setHotTokensError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setConnectionState(isConnected ? 'connected' : 'disconnected');
  }, [isConnected]);

  useEffect(() => {
    setError(wsError);
  }, [wsError]);

  // NUCLEAR HOT TOKENS FETCH - REST API POWERED! 🚀
  const fetchHotTokens = useCallback(async () => {
    try {
      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      setHotTokensLoading(true);
      console.log(`[useStandardizedTokenData] Fetching ${maxHotTokens} hot tokens (relaxed quality, 5%+ movers)`);

      // Build URL with parameters for hot tokens: relaxed quality + 5% minimum change
      const url = new URL(`${API_URL}/tokens/trending`);
      url.searchParams.set('quality_level', 'relaxed'); // Relaxed quality for momentum plays
      url.searchParams.set('min_change', '5'); // 5%+ price movement required
      url.searchParams.set('limit', String(maxHotTokens * 2)); // Get more candidates to ensure we have enough

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

      console.log(`[useStandardizedTokenData] Successfully fetched ${data.data.length} hot tokens`);

      // Transform tokens to frontend format and slice to requested amount
      const transformedTokens = data.data
        .map((backendToken: any): Token => ({
          // Core identification
          id: backendToken.id || 0,
          address: backendToken.address || "",
          contractAddress: backendToken.address || "",
          symbol: backendToken.symbol || "",
          name: backendToken.name || "",

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

          // Visual/metadata
          image_url: backendToken.image_url || "",
          header_image_url: backendToken.header_image_url || "",
          color: backendToken.color || "#888888",
          decimals: backendToken.decimals || 9,
          description: backendToken.description,
          tags: backendToken.tags || [],

          // Enhanced timeframe data
          priceChanges: backendToken.priceChanges,
          volumes: backendToken.volumes,
          transactions: backendToken.transactions,
          pairCreatedAt: backendToken.pairCreatedAt,

          // Social links
          socials: {
            twitter: backendToken.socials?.twitter,
            telegram: backendToken.socials?.telegram,
            discord: backendToken.socials?.discord,
            website: backendToken.socials?.website
          },

          // Status
          status: backendToken.is_active === false ? "inactive" : "active",
          websites: backendToken.websites || [],

          // Supply & ranking
          total_supply: backendToken.total_supply,
          priority_score: backendToken.priority_score,
          first_seen_on_jupiter_at: backendToken.first_seen_on_jupiter_at,
        }))
        .slice(0, maxHotTokens);

      setHotTokens(transformedTokens);
      setHotTokensError(null);
      setHotTokensLoading(false);

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('[useStandardizedTokenData] Hot tokens request aborted');
        return;
      }

      console.error('[useStandardizedTokenData] Error fetching hot tokens:', err);
      setHotTokensError(err.message || 'Failed to fetch hot tokens');
      setHotTokensLoading(false);
    }
  }, [maxHotTokens]);

  // Fetch hot tokens when maxHotTokens changes
  useEffect(() => {
    fetchHotTokens();
  }, [fetchHotTokens]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Apply filters
  const filteredTokens = useMemo(() => {
    if (!tokens || tokens.length === 0) return [];

    return tokens.filter((token: Token) => {
      // Filter by status
      if (filter.status && filter.status !== 'all') {
        if (token.status !== filter.status) return false;
      }

      // Filter by search term
      if (filter.search) {
        const searchTerm = filter.search.toLowerCase();
        const matchesSymbol = token.symbol.toLowerCase().includes(searchTerm);
        const matchesName = token.name.toLowerCase().includes(searchTerm);
        if (!matchesSymbol && !matchesName) return false;
      }

      // Filter by minimum market cap
      if (filter.minMarketCap) {
        const marketCap = Number(token.marketCap);
        if (isNaN(marketCap) || marketCap < filter.minMarketCap) return false;
      }

      // Filter by minimum volume
      if (filter.minVolume) {
        const volume = Number(token.volume24h);
        if (isNaN(volume) || volume < filter.minVolume) return false;
      }

      return true;
    });
  }, [tokens, filter]);

  // Apply sorting
  const sortedTokens = useMemo(() => {
    if (!filteredTokens || filteredTokens.length === 0) return [];

    return [...filteredTokens].sort((a, b) => {
      switch (sortMethod) {
        case 'marketCap':
          return Number(b.marketCap) - Number(a.marketCap);

        case 'volume':
          return Number(b.volume24h) - Number(a.volume24h);

        case 'price':
          return Number(b.price) - Number(a.price);

        case 'change':
          return Number(b.change24h) - Number(a.change24h);

        case 'gainers':
          return Number(b.change24h) - Number(a.change24h);

        case 'losers':
          return Number(a.change24h) - Number(b.change24h);

        case 'hot':
          // Hot tokens algorithm: combination of change and volume with emphasis on volatility
          const getHotScore = (token: Token) => {
            const change = Number(token.change24h) || 0;
            const volume = Number(token.volume24h) || 0;
            const absChange = Math.abs(change);
            return (absChange * 10) + (Math.log10(volume) * 2);
          };
          return getHotScore(b) - getHotScore(a);

        default:
          return 0;
      }
    });
  }, [filteredTokens, sortMethod]);

  // Calculate top tokens (by market cap)
  const topTokens = useMemo(() => {
    if (!tokens || tokens.length === 0) return [];

    return [...tokens]
      .sort((a, b) => Number(b.marketCap) - Number(a.marketCap))
      .slice(0, maxTopTokens);
  }, [tokens, maxTopTokens]);

  // Calculate market statistics
  const stats = useMemo(() => {
    if (!tokens || tokens.length === 0) {
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

  // Enhanced refresh function that refreshes both data sources
  const enhancedRefresh = useCallback(() => {
    refresh(); // Refresh main token data
    fetchHotTokens(); // Refresh hot tokens
  }, [refresh, fetchHotTokens]);

  // Create TokenData versions of token arrays for backward compatibility
  const tokensAsTokenData = useMemo(() => tokens.map(tokenToTokenData), [tokens]);
  const hotTokensAsTokenData = useMemo(() => hotTokens.map(tokenToTokenData), [hotTokens]);
  const topTokensAsTokenData = useMemo(() => topTokens.map(tokenToTokenData), [topTokens]);

  return {
    tokens,
    isLoading: underlyingIsLoading || hotTokensLoading,
    error: error || hotTokensError,
    connectionState,
    isConnected,
    lastUpdate,

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
    setFilter,
    setSortMethod
  };
}

export default useStandardizedTokenData;