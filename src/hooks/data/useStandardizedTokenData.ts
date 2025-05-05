// src/hooks/useStandardizedTokenData.ts

/**
 * Standardized Token Data Hook
 * 
 * This hook wraps the existing topic-hooks/useTokenData hook and provides
 * standardized transformations and utilities that our various components need.
 * 
 * ⭐️ RECOMMENDED HOOK FOR UI COMPONENTS ⭐️
 * This is the RECOMMENDED hook for UI components that need token data.
 * It provides consistent:
 * - Data processing
 * - Sorting and filtering
 * - Error handling
 * - Debug information
 * - Market statistics calculation
 * 
 * This hook is the final stage in the token data hook migration path:
 * 1. hooks/useTokenData.ts - Original implementation (legacy)
 * 2. hooks/websocket/topic-hooks/useTokenData.ts - Improved v69 WebSocket architecture
 * 3. hooks/useStandardizedTokenData.ts - THIS FILE (UI standardization layer)
 * 
 * If you need ON-CHAIN Solana token data (not market data), use useSolanaTokenData.ts
 * 
 * @author Claude
 * @created 2025-04-29
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
    price: token.price,
    marketCap: token.marketCap,
    volume24h: token.volume24h,
    change24h: token.change24h,
    // Convert the liquidity object to a number (using USD value)
    liquidity: token.liquidity ? Number(token.liquidity.usd) : undefined,
    status: token.status as "active" | "inactive",
    contractAddress: token.contractAddress,
    // For images, use the first image URL if available
    imageUrl: token.images?.imageUrl
  };
}

/**
 * Adapter function to convert TokenData to Token format
 * Used when we need to upgrade legacy TokenData to the more comprehensive Token format
 */
export function tokenDataToToken(tokenData: TokenData): Token {
  return {
    symbol: tokenData.symbol,
    name: tokenData.name,
    price: tokenData.price,
    marketCap: tokenData.marketCap,
    volume24h: tokenData.volume24h,
    change24h: tokenData.change24h,
    // Create a liquidity object from the number
    liquidity: {
      usd: tokenData.liquidity ? String(tokenData.liquidity) : "0",
      base: "0",
      quote: "0"
    },
    status: tokenData.status || "active",
    contractAddress: tokenData.contractAddress || `synthetic-${tokenData.symbol}`,
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
  // Use the base token data hook
  const { 
    tokens,
    isConnected,
    error: wsError,
    lastUpdate,
    refresh
  } = useTokenData(tokensToSubscribe);
  
  // Local state
  const [isLoading, setIsLoading] = useState(true);
  const [sortMethod, setSortMethod] = useState<TokenSortMethod>(initialSortMethod);
  const [filter, setFilter] = useState<TokenFilter>(initialFilter);
  const [connectionState, setConnectionState] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Set connection state based on isConnected
  useEffect(() => {
    setConnectionState(isConnected ? 'connected' : 'disconnected');
  }, [isConnected]);
  
  // Update error state
  useEffect(() => {
    setError(wsError);
  }, [wsError]);
  
  // Update loading state
  useEffect(() => {
    if (tokens.length > 0) {
      setIsLoading(false);
    }
  }, [tokens]);
  
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
  
  // Calculate hot tokens (most active/volatile)
  const hotTokens = useMemo(() => {
    if (!tokens || tokens.length === 0) return [];
    
    // Filter tokens with volume > 0
    const activeTokens = tokens.filter(token => Number(token.volume24h) > 0);
    
    // Sort by hot score (custom algorithm)
    return [...activeTokens]
      .sort((a, b) => {
        // Hot tokens algorithm: combination of change, volume, and marketcap with emphasis on volatility
        const getHotScore = (token: Token) => {
          const change = Number(token.change24h) || 0;
          const volume = Number(token.volume24h) || 0;
          const marketCap = Number(token.marketCap) || 0;
          const absChange = Math.abs(change);
          // Higher score for tokens with high volatility, decent volume, and reasonable market cap
          return (absChange * 10) + (Math.log10(volume) * 2) + (Math.log10(marketCap) * 0.5);
        };
        return getHotScore(b) - getHotScore(a);
      })
      .slice(0, maxHotTokens);
  }, [tokens, maxHotTokens]);
  
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

  // Create TokenData versions of token arrays for backward compatibility
  const tokensAsTokenData = useMemo(() => tokens.map(tokenToTokenData), [tokens]);
  const hotTokensAsTokenData = useMemo(() => hotTokens.map(tokenToTokenData), [hotTokens]);
  const topTokensAsTokenData = useMemo(() => topTokens.map(tokenToTokenData), [topTokens]);

  return {
    tokens,
    isLoading,
    error,
    connectionState,
    isConnected,
    lastUpdate,
    
    // Filtered and sorted tokens
    filteredTokens,
    sortedTokens,
    
    // Selected tokens
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
    refresh,
    setFilter,
    setSortMethod
  };
}

export default useStandardizedTokenData;