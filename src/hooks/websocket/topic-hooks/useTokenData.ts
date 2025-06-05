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
import { Token } from '../../../types';
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
  filters?: TokenDataFilters
) {
  // State for token data
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialData, setHasInitialData] = useState<boolean>(false);
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

      // Use paginated format for better infinity scroll support
      const response = await ddApi.tokens.getAll({
        limit: 100,
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
          filteredTokens = filteredTokens.filter((t: Token) => t.market_cap >= filters.minMarketCap!);
        }
        if (filters?.minVolume) {
          filteredTokens = filteredTokens.filter((t: Token) => t.volume_24h >= filters.minVolume!);
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
          filteredTokens = filteredTokens.filter((t: Token) => t.market_cap >= filters.minMarketCap!);
        }
        if (filters?.minVolume) {
          filteredTokens = filteredTokens.filter((t: Token) => t.volume_24h >= filters.minVolume!);
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

  // WebSocket pagination function for pro frontend experience
  const fetchTokensViaWebSocket = useCallback(async (offset = 0) => {
    try {
      console.log('[useTokenData] Loading tokens via WebSocket for real-time experience');

      if (!ws.isConnected) {
        console.log('[useTokenData] WebSocket not connected, falling back to REST');
        return fetchTokensViaRest(offset);
      }

      setIsLoading(true);

      // Use WebSocket request for paginated data - professional trading platform style
      const requestId = crypto.randomUUID();
      const success = ws.sendMessage({
        type: 'REQUEST',
        topic: 'market_data',
        action: 'getDegenDuelRanked',
        requestId,
        data: {
          limit: 100,
          offset,
          format: 'paginated'
        }
      });

      if (!success) {
        console.log('[useTokenData] WebSocket send failed, falling back to REST');
        return fetchTokensViaRest(offset);
      }

      console.log(`[useTokenData] WebSocket request sent for offset ${offset}`);

      // The response will be handled by the WebSocket message handler
      // No need to wait here - it's handled asynchronously via registerListener

    } catch (err: any) {
      console.error('[useTokenData] WebSocket pagination failed, falling back to REST:', err);
      return fetchTokensViaRest(offset);
    }
  }, [ws.isConnected, ws.sendMessage, fetchTokensViaRest]);

  // WebSocket handler for ALL token data (initial + updates + paginated responses)
  const handleMarketData = useCallback((message: any) => {
    try {
      // Handle paginated WebSocket responses (primary method)
      if (message.type === 'DATA' && message.topic === 'market_data' && message.action === 'degenDuelRanked') {
        console.log(`[useTokenData] Received paginated WebSocket response`);

        // Check if we got paginated response format
        if (message.tokens && message.pagination) {
          const { tokens: tokensData, pagination: paginationData } = message;

          console.log(`[useTokenData] WebSocket loaded ${tokensData.length} tokens with pagination`);

          // Transform backend data to frontend format
          const transformedTokens = tokensData.map(transformBackendTokenData);

          // Apply client-side filters if any
          let filteredTokens = transformedTokens;
          if (filters?.minMarketCap) {
            filteredTokens = filteredTokens.filter((t: Token) => t.market_cap >= filters.minMarketCap!);
          }
          if (filters?.minVolume) {
            filteredTokens = filteredTokens.filter((t: Token) => t.volume_24h >= filters.minVolume!);
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

          // Transform and set ALL tokens - backend filters duplicates
          const transformedTokens = message.data.map(transformBackendTokenData);

          // Apply client-side filters if any
          let filteredTokens = transformedTokens;
          if (filters?.minMarketCap) {
            filteredTokens = filteredTokens.filter((t: Token) => t.market_cap >= filters.minMarketCap!);
          }
          if (filters?.minVolume) {
            filteredTokens = filteredTokens.filter((t: Token) => t.volume_24h >= filters.minVolume!);
          }

          setTokens(filteredTokens);
          setLastUpdate(new Date());
          setIsLoading(false);
          setHasInitialData(true);

          dispatchWebSocketEvent('token_data_websocket_update', {
            socketType: 'market-data',
            message: `Received ${filteredTokens.length} filtered tokens via WebSocket`,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      console.error('[useTokenData] Error processing market data:', err);
      setError('Failed to process market data');
      setIsLoading(false);
    }
  }, [filters]);

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

  // Pro Frontend: Load token data via WebSocket for real-time experience
  useEffect(() => {
    if (!hasInitialData) {
      console.log('[useTokenData] Loading initial token data via WebSocket (pro frontend approach)');
      fetchTokensViaWebSocket(0);
    }
  }, [hasInitialData, fetchTokensViaWebSocket]);

  // Handle reconnection events - retry getting data when WebSocket reconnects
  useEffect(() => {
    if (ws.isConnected && hasInitialData && tokens.length === 0) {
      console.log('[useTokenData] Reconnected but lost data, triggering retry');
      setHasInitialData(false); // Trigger retry logic
      setError(null); // Clear any previous errors
    }
  }, [ws.isConnected, hasInitialData, tokens.length]);

  // Load more function for pagination (WebSocket-first, pro frontend approach)
  const loadMore = useCallback(() => {
    if (!pagination || !pagination.hasMore) {
      console.log('[useTokenData] No more tokens to load');
      return;
    }

    console.log('[useTokenData] Loading more tokens via WebSocket (pro frontend)');
    fetchTokensViaWebSocket(pagination.offset + pagination.limit);
  }, [pagination, fetchTokensViaWebSocket]);

  // Enhanced refresh that uses WebSocket for pro frontend experience
  const refresh = useCallback(() => {
    console.log('[useTokenData] Refreshing token data (pro frontend approach)');
    if (ws.isConnected) {
      console.log('[useTokenData] Refreshing via WebSocket request');
      // Reset state and load fresh data via WebSocket
      setHasInitialData(false);
      setPagination(null);
      fetchTokensViaWebSocket(0);
    } else {
      console.log('[useTokenData] WebSocket disconnected, refreshing via REST API');
      fetchTokensViaRest(0);
    }
  }, [ws.isConnected, fetchTokensViaWebSocket, fetchTokensViaRest]);

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