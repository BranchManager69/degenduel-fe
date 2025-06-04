/**
 * useTokenData Hook
 * 
 * WebSocket-First Token Data Hook with Filtered Market Data
 * Uses WebSocket market-data topic for BOTH initial load and real-time updates
 * 
 * 🚀 FIXED TO USE FILTERED WEBSOCKET DATA ✅
 * 
 * KEY ARCHITECTURE DECISIONS:
 * - WebSocket (/api/v69/ws) market-data topic for ALL token data (now filtered server-side)
 * - No more REST API polling - WebSocket provides deduplicated tokens
 * - Server-side filtering eliminates duplicate tokens (require_socials=true)
 * - Real-time updates for all connected clients
 * 
 * PERFORMANCE BENEFITS:
 * ✅ No duplicate tokens (WLFI, PUMP, etc. deduplicated)
 * ✅ Real-time updates via WebSocket
 * ✅ No REST API polling overhead
 * ✅ Consistent data between all components
 * ✅ Server broadcasts updates every 60 seconds
 * 
 * ENDPOINTS USED:
 * - WebSocket /api/v69/ws market-data topic (ALL data + updates)
 * 
 * @author Branch Manager
 * @created 2025-04-10
 * @updated 2025-06-04 - Fixed to use filtered WebSocket data only
 */

import { useCallback, useEffect, useState } from 'react';
import { useWebSocket } from '../../../contexts/UnifiedWebSocketContext';
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

  // Connect to WebSocket
  const ws = useWebSocket();

  // WebSocket handler for ALL token data (initial + updates)
  const handleMarketData = useCallback((message: any) => {
    try {
      if (message.type === 'DATA' && message.topic === 'market-data') {
        if (Array.isArray(message.data)) {
          console.log(`[useTokenData] Received market data for ${message.data.length} tokens (filtered by backend)`);
          
          // Transform and set ALL tokens - backend now filters duplicates!
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
    }
  }, [filters]);

  // Register WebSocket listener for ALL market data
  useEffect(() => {
    const unregister = ws.registerListener(
      'token-data-market-updates',
      ['DATA'] as any[],
      handleMarketData,
      ['market-data']
    );
    return unregister;
  }, [handleMarketData, ws.registerListener]);

  // Subscribe to market-data when connected
  useEffect(() => {
    if (ws.isConnected) {
      console.log('[useTokenData] Subscribing to market-data topic for filtered tokens');
      ws.subscribe(['market-data']);
      
      dispatchWebSocketEvent('token_data_subscribe', {
        socketType: 'market-data',
        message: 'Subscribed to filtered market-data topic',
        timestamp: new Date().toISOString()
      });
    }
  }, [ws.isConnected, ws.subscribe]);

  // Set loading false once we have connection
  useEffect(() => {
    if (ws.isConnected && !hasInitialData) {
      // Give WebSocket a moment to send initial data
      const timer = setTimeout(() => {
        if (!hasInitialData) {
          console.log('[useTokenData] No initial data received, setting loading to false');
          setIsLoading(false);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [ws.isConnected, hasInitialData]);

  // Load more is now a no-op since WebSocket provides all data
  const loadMore = useCallback(() => {
    console.log('[useTokenData] Load more not needed - WebSocket provides all filtered tokens');
  }, []);

  // Refresh just re-subscribes to get latest data
  const refresh = useCallback(() => {
    console.log('[useTokenData] Refreshing by re-subscribing to market-data');
    if (ws.isConnected) {
      // Unsubscribe and resubscribe to trigger fresh data
      ws.unsubscribe(['market-data']);
      setTimeout(() => {
        ws.subscribe(['market-data']);
      }, 100);
    }
  }, [ws]);

  // Return the token data and helper functions
  return {
    tokens,
    isConnected: ws.isConnected,
    error: error || ws.connectionError,
    lastUpdate,
    refresh,
    loadMore,
    pagination: null, // No pagination with WebSocket
    isLoading,
    close: () => {
      // Cleanup function
      ws.unsubscribe(['market-data']);
      dispatchWebSocketEvent('token_data_close', {
        socketType: 'websocket-only',
        message: 'Token data hook cleanup requested',
        timestamp: new Date().toISOString()
      });
    }
  };
}