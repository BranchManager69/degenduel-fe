/**
 * useTokenData Hook
 * 
 * V69 Standardized WebSocket Hook for Token Data
 * This hook provides real-time updates for token data from the unified WebSocket system
 * 
 * 🔧 PRODUCTION FIX APPLIED ✅
 * 
 * KEY INSIGHTS DISCOVERED:
 * - Backend uses standard string message types ('DATA', 'RESPONSE') not DDExtendedMessageType enum
 * - Backend expects topic 'market-data' as string, not TopicType.MARKET_DATA constant  
 * - Backend sends structured responses with {type, topic, action, data} format
 * - Real backend token data uses different field names (address vs contractAddress, market_cap vs marketCap, etc.)
 * 
 * CRITICAL FIXES APPLIED:
 * ✅ Removed fake FALLBACK_TOKENS that were masking real data
 * ✅ Updated message type checks to use correct backend format ('DATA' vs DDExtendedMessageType.DATA)
 * ✅ Fixed topic strings to match backend exactly ('market-data' vs TopicType.MARKET_DATA)
 * ✅ Added transformBackendTokenData() to properly map backend fields to frontend Token interface
 * ✅ Updated request format to use correct backend specifications
 * ✅ Added proper handling for both DATA (real-time) and RESPONSE (request) message types
 * 
 * IMPACT:
 * - All components using useStandardizedTokenData now receive REAL market data
 * - UnifiedTicker PRICES view shows actual token prices instead of placeholder data
 * - Consistent data format across entire application
 * - Proper integration with UnifiedWebSocketContext architecture
 * 
 * @author Branch Manager
 * @created 2025-04-10
 * @updated 2025-01-15 - Fixed backend message format integration for production
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useWebSocket } from '../../../contexts/UnifiedWebSocketContext';
import { Token } from '../../../types';
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';

// Transform backend token data to frontend Token format
const transformBackendTokenData = (backendToken: any): Token => {
  return {
    contractAddress: backendToken.address || "",
    status: "active",
    name: backendToken.name || "",
    symbol: backendToken.symbol || "",
    price: backendToken.price?.toString() || "0",
    marketCap: backendToken.market_cap?.toString() || "0",
    volume24h: backendToken.volume_24h?.toString() || "0",
    change24h: backendToken.change_24h?.toString() || "0",
    liquidity: {
      usd: backendToken.liquidity?.toString() || "0",
      base: "0",
      quote: "0"
    },
    images: {
      imageUrl: backendToken.image_url || "",
      headerImage: "",
      openGraphImage: ""
    },
    socials: backendToken.socials || {
      twitter: { url: "", count: null },
      telegram: { url: "", count: null },
      discord: { url: "", count: null }
    },
    websites: backendToken.websites || []
  };
};

/**
 * Hook for accessing and managing token data with real-time updates
 * Uses the unified WebSocket system with correct backend message format
 * 
 * @param tokensToSubscribe Optional string array of specific token symbols to subscribe to, or "all" for all tokens
 */
export function useTokenData(tokensToSubscribe: string[] | "all" = "all") {
  // State for token data
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Use ref to avoid recreating handleMessage on every isLoading change
  const isLoadingRef = useRef(isLoading);
  isLoadingRef.current = isLoading;

  // Message handler for WebSocket messages using CORRECT backend format
  const handleMessage = useCallback((message: any) => {
    try {
      console.log('[useTokenData] Received message:', message);

      // Handle DATA messages (real-time updates) - CORRECT FORMAT
      if (message.type === 'DATA' && message.topic === 'market-data') {
        if (Array.isArray(message.data)) {
          console.log(`[useTokenData] Processing ${message.data.length} tokens from DATA message`);

          // Transform backend format to frontend format
          const transformedTokens = message.data.map(transformBackendTokenData);
          setTokens(transformedTokens);
          setLastUpdate(new Date());
          setIsLoading(false);

          dispatchWebSocketEvent('token_data_update', {
            socketType: 'market-data',
            message: `Updated ${message.data.length} tokens via DATA`,
            timestamp: new Date().toISOString()
          });
        }
      }

      // Handle RESPONSE messages (request responses) - CORRECT FORMAT  
      else if (message.type === 'RESPONSE' && message.topic === 'market-data' && message.action === 'getTokens') {
        if (Array.isArray(message.data)) {
          console.log(`[useTokenData] Processing ${message.data.length} tokens from RESPONSE message`);

          // Transform backend format to frontend format
          const transformedTokens = message.data.map(transformBackendTokenData);
          setTokens(transformedTokens);
          setLastUpdate(new Date());
          setIsLoading(false);

          dispatchWebSocketEvent('token_data_update', {
            socketType: 'market-data',
            message: `Updated ${message.data.length} tokens via RESPONSE`,
            timestamp: new Date().toISOString()
          });
        }
      }

      // Mark as not loading once we've processed any valid message
      if (isLoadingRef.current) {
        setIsLoading(false);
      }
    } catch (err) {
      console.error('[useTokenData] Error processing message:', err);
      dispatchWebSocketEvent('error', {
        socketType: 'market-data',
        message: 'Error processing token data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, []);

  // Connect to the unified WebSocket system
  const ws = useWebSocket();

  // Register message listener for CORRECT message types
  useEffect(() => {
    const unregister = ws.registerListener(
      'token-data-hook',
      ['DATA', 'RESPONSE', 'ERROR'] as any[], // Listen for correct message types
      handleMessage,
      ['market-data'] // Filter for market-data topic only
    );
    return unregister;
  }, [handleMessage, ws.registerListener]);

  // Subscribe to token data when the WebSocket is connected
  useEffect(() => {
    console.log('[useTokenData] WebSocket state:', {
      isConnected: ws.isConnected,
      connectionState: ws.connectionState,
      initialized,
      error: ws.connectionError
    });

    if (ws.isConnected && !initialized) {
      // Subscribe to market-data topic using CORRECT format
      ws.subscribe(['market-data']);

      // Request initial data using CORRECT format
      const requestData: any = {
        limit: 1000, // Request all tokens
        offset: 0
      };

      if (tokensToSubscribe !== "all" && Array.isArray(tokensToSubscribe) && tokensToSubscribe.length > 0) {
        requestData.symbols = tokensToSubscribe;
      }

      ws.request('market-data', 'getTokens', requestData);

      setInitialized(true);

      dispatchWebSocketEvent('token_data_init', {
        socketType: 'market-data',
        message: 'Token data subscription initialized through unified WebSocket with correct format',
        subscription: tokensToSubscribe === "all" ? "all tokens" : tokensToSubscribe
      });

      // Set a timeout to reset loading state if we don't get data
      const timeoutId = setTimeout(() => {
        if (isLoadingRef.current) {
          console.warn('[useTokenData] Timed out waiting for data');
          setIsLoading(false);
        }
      }, 10000);

      return () => clearTimeout(timeoutId);
    }
  }, [ws.isConnected, initialized, tokensToSubscribe, ws.subscribe, ws.request]);

  // Force refresh function for token data
  const refresh = useCallback(() => {
    setIsLoading(true);

    if (ws.isConnected) {
      // Request fresh token data using CORRECT format
      const requestData: any = {
        limit: 1000,
        offset: 0
      };

      if (tokensToSubscribe !== "all" && Array.isArray(tokensToSubscribe) && tokensToSubscribe.length > 0) {
        requestData.symbols = tokensToSubscribe;
      }

      ws.request('market-data', 'getTokens', requestData);

      dispatchWebSocketEvent('token_data_refresh', {
        socketType: 'market-data',
        message: 'Refreshing token data with correct format',
        timestamp: new Date().toISOString()
      });

      // Set a timeout to reset loading state if we don't get data
      setTimeout(() => {
        if (isLoadingRef.current) {
          setIsLoading(false);
        }
      }, 10000);
    } else {
      console.warn('[useTokenData] Cannot refresh - WebSocket not connected');
      setIsLoading(false);
    }
  }, [ws.isConnected, ws.request, tokensToSubscribe]);

  // Return the token data and helper functions
  return {
    tokens,
    isConnected: ws.isConnected,
    error: ws.connectionError,
    lastUpdate,
    refresh,
    isLoading,
    close: () => {
      // No-op function kept for interface compatibility
      dispatchWebSocketEvent('token_data_close', {
        socketType: 'market-data',
        message: 'Token data WebSocket close requested (NOP in unified system)',
        timestamp: new Date().toISOString()
      });
    }
  };
}