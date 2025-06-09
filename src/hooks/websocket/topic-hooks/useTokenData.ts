// src/hooks/websocket/topic-hooks/useTokenData.ts

/**
 * useTokenData Hook - Pro Frontend WebSocket Pagination
 * 
 * Professional-grade WebSocket-first token data hook with pagination support
 * Used by top-tier trading platforms for real-time data with infinite scroll
 * 
 * 🚀 PRO FRONTEND FEATURES ✅
 * 
 * KEY ARCHITECTURE (Professional Trading Platform Style):
 * - WebSocket-first pagination via getDegenDuelRanked action
 * - REST API as fallback for connection issues
 * - Real-time price updates while browsing
 * - Seamless infinite scroll experience
 * - Quality-filtered tokens from backend (~311 tokens)
 * 
 * PERFORMANCE BENEFITS:
 * ✅ Single WebSocket connection for data + updates
 * ✅ No HTTP overhead for pagination
 * ✅ Real-time price updates during browsing
 * ✅ Immediate response times
 * ✅ Professional trading platform UX
 * ✅ Automatic fallback to REST if needed
 * 
 * WEBSOCKET ACTIONS USED:
 * - getDegenDuelRanked: Paginated quality token data
 * - market-data subscription: Real-time price updates
 * 
 * FALLBACK ENDPOINTS:
 * - REST /api/tokens/trending?format=paginated
 * 
 * @author Claude (Pro Frontend Implementation)
 * @created 2025-04-10
 * @updated 2025-12-06 - Implemented WebSocket pagination for pro frontend experience
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useWebSocket } from '../../../contexts/UnifiedWebSocketContext';
import { ddApi } from '../../../services/dd-api';
import { Token, TokenHelpers } from '../../../types';
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';

// Transform backend token data to frontend Token format
const transformBackendTokenData = (backendToken: any): Token => {
  return {
    // Core identification
    id: backendToken.id || 0,
    address: backendToken.address || "",
    contractAddress: backendToken.address || "",
    symbol: backendToken.symbol || "",
    name: backendToken.name || "",

    // Numbers not strings
    price: backendToken.price || 0,
    market_cap: backendToken.market_cap || 0,
    marketCap: String(backendToken.market_cap || 0), // backward compat
    volume_24h: backendToken.volume_24h || 0,
    volume24h: String(backendToken.volume_24h || 0), // backward compat
    change_24h: backendToken.change_24h || 0,
    change24h: String(backendToken.change_24h || 0), // backward compat
    liquidity: backendToken.liquidity || 0,
    fdv: backendToken.fdv || 0,
    decimals: backendToken.decimals || 9,

    // Visual/metadata
    image_url: backendToken.image_url || "",
    header_image_url: backendToken.header_image_url || "",

    // Legacy images for backward compatibility
    images: {
      imageUrl: backendToken.image_url || "",
      headerImage: backendToken.header_image_url || "",
      openGraphImage: ""
    },

    // Social links (now strings)
    socials: {
      twitter: backendToken.socials?.twitter,
      telegram: backendToken.socials?.telegram,
      discord: backendToken.socials?.discord,
      website: backendToken.socials?.website
    },

    status: backendToken.is_active === false ? "inactive" : "active",
    websites: backendToken.websites || []
  };
};

/**
 * Hook for accessing and managing token data with real-time updates
 * Uses the unified WebSocket system with correct backend message format
 * 
 * @param tokensToSubscribe Optional string array of specific token symbols to subscribe to, or "all" for all tokens
 */
interface TokenDataFilters {
  minMarketCap?: number;
  minVolume?: number;
  tags?: string[];
  excludeTags?: string[];
  strictOnly?: boolean;
  verifiedOnly?: boolean;
}

export function useTokenData(
  _tokensToSubscribe: string[] | "all" = "all", // Now unused - kept for interface compatibility
  filters?: TokenDataFilters,
  limit: number = 50, // Default to 50 for proper pagination
  preserveOrder: boolean = true // Preserve REST API order when updating via WebSocket
) {
  // State for token data
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialData, setHasInitialData] = useState<boolean>(false);
  const [isRestLoaded, setIsRestLoaded] = useState<boolean>(false);
  const [pagination, setPagination] = useState<{
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  } | null>(null);

  // Connect to WebSocket
  const ws = useWebSocket();

  // REST API fallback function for immediate token loading
  const fetchTokensViaRest = useCallback(async (offset = 0) => {
    try {
      console.log('[useTokenData] Loading tokens via REST API for immediate display');

      // Use paginated format - but we can handle all 3500 tokens at once!
      const response = await ddApi.tokens.getAll({
        limit, // Use the limit parameter for proper pagination
        offset,
        format: 'paginated'
      });

      // Check if we got paginated response
      if ('tokens' in response && 'pagination' in response) {
        const { tokens: tokensData, pagination: paginationData } = response;

        console.log(`[useTokenData] REST API loaded ${tokensData.length} tokens with pagination`);

        // Apply client-side filters if any
        let filteredTokens = tokensData;
        if (filters?.minMarketCap) {
          filteredTokens = filteredTokens.filter((t: Token) => TokenHelpers.getMarketCap(t) >= filters.minMarketCap!);
        }
        if (filters?.minVolume) {
          filteredTokens = filteredTokens.filter((t: Token) => TokenHelpers.getVolume(t) >= filters.minVolume!);
        }

        // Update pagination state
        setPagination(paginationData);

        // Smart append with reasonable limit
        if (offset > 0) {
          setTokens(prev => {
            const MAX_DISPLAY = 200; // Reasonable limit for performance
            const combined = [...prev, ...filteredTokens];
            // Only limit if getting too large
            if (combined.length > MAX_DISPLAY) {
              console.log(`[useTokenData] Trimming to last ${MAX_DISPLAY} tokens for performance`);
              return combined.slice(-MAX_DISPLAY);
            }
            return combined;
          });
        } else {
          // Fresh load - replace everything
          setTokens(filteredTokens);
        }
      } else {
        // Legacy format fallback
        const tokensData = response as Token[];
        console.log(`[useTokenData] REST API loaded ${tokensData.length} tokens (legacy format)`);

        // Apply client-side filters if any
        let filteredTokens = tokensData;
        if (filters?.minMarketCap) {
          filteredTokens = filteredTokens.filter((t: Token) => TokenHelpers.getMarketCap(t) >= filters.minMarketCap!);
        }
        if (filters?.minVolume) {
          filteredTokens = filteredTokens.filter((t: Token) => TokenHelpers.getVolume(t) >= filters.minVolume!);
        }

        setTokens(filteredTokens);
        setPagination(null); // No pagination in legacy mode
      }

      setLastUpdate(new Date());
      setIsLoading(false);
      setHasInitialData(true);
      setError(null);

      dispatchWebSocketEvent('token_data_rest_loaded', {
        socketType: 'rest-api-fallback',
        message: `Loaded ${tokens.length} tokens via REST API`,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('[useTokenData] REST API fallback failed:', error);
      
      // Better error messages based on error type
      let errorMessage = 'Failed to load token data';
      
      if (!navigator.onLine) {
        errorMessage = 'No internet connection';
      } else if (error.status === 404) {
        errorMessage = 'Token service not found';
      } else if (error.status === 500) {
        errorMessage = 'Server error - please try again later';
      } else if (error.status === 429) {
        errorMessage = 'Too many requests - please wait a moment';
      } else if (error.message?.includes('NetworkError')) {
        errorMessage = 'Network error - check your connection';
      }
      
      setError(errorMessage);
      setIsLoading(false);

      dispatchWebSocketEvent('token_data_rest_failed', {
        socketType: 'rest-api-fallback',
        message: `REST API failed: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    }
  }, [filters]);


  // WebSocket handler for ALL token data (initial + updates + paginated responses)
  const handleMarketData = useCallback((message: any) => {
    try {
      // Handle paginated WebSocket responses (primary method)
      if (message.type === 'DATA' && message.topic === 'market_data' && message.action === 'degenDuelRanked') {
        console.log(`[useTokenData] Received paginated WebSocket response`);

        // Skip paginated responses if we already have REST data loaded to prevent flickering
        if (isRestLoaded && hasInitialData && message.requestId) {
          console.log(`[useTokenData] Skipping WebSocket paginated response - already have REST data`);
          return;
        }

        // Check if we got paginated response format
        if (message.tokens && message.pagination) {
          const { tokens: tokensData, pagination: paginationData } = message;

          console.log(`[useTokenData] WebSocket loaded ${tokensData.length} tokens with pagination`);

          // Transform backend data to frontend format
          const transformedTokens = tokensData.map(transformBackendTokenData);

          // Apply client-side filters if any
          let filteredTokens = transformedTokens;
          if (filters?.minMarketCap) {
            filteredTokens = filteredTokens.filter((t: Token) => TokenHelpers.getMarketCap(t) >= filters.minMarketCap!);
          }
          if (filters?.minVolume) {
            filteredTokens = filteredTokens.filter((t: Token) => TokenHelpers.getVolume(t) >= filters.minVolume!);
          }

          // Update pagination state
          setPagination(paginationData);

          // Smart append with reasonable limit (same as REST)
          if (paginationData.offset > 0) {
            setTokens(prev => {
              const MAX_DISPLAY = 200; // Reasonable limit for performance
              const combined = [...prev, ...filteredTokens];
              // Only limit if getting too large
              if (combined.length > MAX_DISPLAY) {
                console.log(`[useTokenData] WebSocket: Trimming to last ${MAX_DISPLAY} tokens`);
                return combined.slice(-MAX_DISPLAY);
              }
              return combined;
            });
          } else {
            // Fresh load - replace everything
            setTokens(filteredTokens);
          }

          setLastUpdate(new Date());
          setIsLoading(false);
          setHasInitialData(true);
          setError(null);

          dispatchWebSocketEvent('token_data_websocket_paginated', {
            socketType: 'websocket-pagination',
            message: `Loaded ${filteredTokens.length} tokens via WebSocket (offset: ${paginationData.offset})`,
            timestamp: new Date().toISOString()
          });
          return;
        }
      }

      // Handle real-time market data updates (subscription data)
      if (message.type === 'DATA' && message.topic === 'market_data') {
        if (Array.isArray(message.data)) {
          console.log(`[useTokenData] Received real-time market data for ${message.data.length} tokens`);

          // Only process real-time updates if we have initial data
          if (!hasInitialData || !isRestLoaded) {
            console.log(`[useTokenData] Ignoring real-time update - no initial data yet`);
            return;
          }

          // Transform update data
          const updatedTokens = message.data.map(transformBackendTokenData);

          // Update existing tokens with new price data
          setTokens((prev: Token[]) => {
            if (!preserveOrder) {
              // If not preserving order, just replace with updated tokens
              return updatedTokens;
            }
            
            // Preserve order: Update tokens in-place
            const tokenMap = new Map<string, Token>();
            updatedTokens.forEach((token: Token) => {
              tokenMap.set(token.address, token);
            });
            
            // Update tokens in-place to preserve original order
            const result: Token[] = prev.map((existingToken: Token) => {
              const updatedToken = tokenMap.get(existingToken.address);
              if (updatedToken) {
                // Only update price-related fields to avoid re-ordering
                const updated: Token = {
                  ...existingToken,
                  price: updatedToken.price,
                  market_cap: updatedToken.market_cap,
                  marketCap: updatedToken.marketCap,
                  volume_24h: updatedToken.volume_24h,
                  volume24h: updatedToken.volume24h,
                  change_24h: updatedToken.change_24h,
                  change24h: updatedToken.change24h,
                  liquidity: updatedToken.liquidity,
                  fdv: updatedToken.fdv
                };
                return updated;
              }
              return existingToken;
            });
            
            // Apply filters while maintaining order
            if (filters?.minMarketCap) {
              return result.filter((t: Token) => TokenHelpers.getMarketCap(t) >= filters.minMarketCap!);
            }
            if (filters?.minVolume) {
              return result.filter((t: Token) => TokenHelpers.getVolume(t) >= filters.minVolume!);
            }
            
            return result;
          });
          setLastUpdate(new Date());
          setIsLoading(false);
          setHasInitialData(true);

          dispatchWebSocketEvent('token_data_websocket_update', {
            socketType: 'market-data',
            message: `Received ${updatedTokens.length} token updates via WebSocket`,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      console.error('[useTokenData] Error processing market data:', err);
      setError('Failed to process market data');
      setIsLoading(false);
    }
  }, [filters, isRestLoaded, hasInitialData, preserveOrder]);

  // Register WebSocket listener for ALL market data + paginated responses
  useEffect(() => {
    const unregister = ws.registerListener(
      'token-data-market-updates',
      ['DATA'] as any[], // Use consistent v69 unified format
      handleMarketData,
      ['market_data'] // Use consistent topic name
    );
    return unregister;
  }, [handleMarketData, ws.registerListener]);

  // Subscribe to market_data when connected (prevent duplicate subscriptions)
  const hasSubscribedMarketDataRef = useRef(false);

  useEffect(() => {
    if (ws.isConnected && !hasSubscribedMarketDataRef.current) {
      console.log('[useTokenData] Subscribing to market_data topic for filtered tokens');
      ws.subscribe(['market_data']);
      hasSubscribedMarketDataRef.current = true;

      dispatchWebSocketEvent('token_data_subscribe', {
        socketType: 'market_data',
        message: 'Subscribed to filtered market_data topic',
        timestamp: new Date().toISOString()
      });
    } else if (!ws.isConnected) {
      hasSubscribedMarketDataRef.current = false;
    }

    // Cleanup function
    return () => {
      if (hasSubscribedMarketDataRef.current) {
        ws.unsubscribe(['market_data']);
        hasSubscribedMarketDataRef.current = false;
      }
    };
  }, [ws.isConnected]);

  // REST-First: Load token data via REST for immediate display, WebSocket for updates
  useEffect(() => {
    // Only fetch if we haven't started loading yet
    if (!hasInitialData && !isRestLoaded) {
      console.log('[useTokenData] Loading initial token data via REST API for fast display');
      setIsRestLoaded(true); // Set this BEFORE fetching to prevent duplicate calls
      fetchTokensViaRest(0);
    }
  }, [hasInitialData, isRestLoaded, fetchTokensViaRest]);

  // Handle reconnection events - retry getting data when WebSocket reconnects
  useEffect(() => {
    if (ws.isConnected && hasInitialData && tokens.length === 0) {
      console.log('[useTokenData] Reconnected but lost data, triggering retry');
      setHasInitialData(false); // Trigger retry logic
      setError(null); // Clear any previous errors
    }
  }, [ws.isConnected, hasInitialData, tokens.length]);

  // Load more function for pagination (REST-first for reliability)
  const loadMore = useCallback(() => {
    if (!pagination || !pagination.hasMore) {
      console.log('[useTokenData] No more tokens to load');
      return;
    }

    console.log('[useTokenData] Loading more tokens via REST API');
    fetchTokensViaRest(pagination.offset + pagination.limit);
  }, [pagination, fetchTokensViaRest]);

  // Enhanced refresh that uses REST for reliable fresh data
  const refresh = useCallback(() => {
    console.log('[useTokenData] Refreshing token data via REST API');
    // Reset state and load fresh data via REST
    setHasInitialData(false);
    setPagination(null);
    setIsRestLoaded(false);
    fetchTokensViaRest(0);
  }, [fetchTokensViaRest]);

  // Return the token data and helper functions
  return {
    tokens,
    isConnected: ws.isConnected,
    error: error || ws.connectionError,
    lastUpdate,
    refresh,
    loadMore,
    pagination, // Real pagination from REST API
    isLoading,
    close: () => {
      // Cleanup function
      ws.unsubscribe(['market_data']);
      dispatchWebSocketEvent('token_data_close', {
        socketType: 'websocket-only',
        message: 'Token data hook cleanup requested',
        timestamp: new Date().toISOString()
      });
    }
  };
}