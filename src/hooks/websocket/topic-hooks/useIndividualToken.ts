// src/hooks/websocket/topic-hooks/useIndividualToken.ts

/**
 * useIndividualToken Hook - Single token real-time subscription
 * 
 * This hook subscribes to a specific token by address for real-time updates.
 * Perfect for cases where you need guaranteed data for specific tokens
 * like DUEL and SOL on the landing page.
 * 
 * @author Claude
 * @created 2025-01-15
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useWebSocket } from '../../../contexts/UnifiedWebSocketContext';
import { Token } from '../../../types';
//import { ddApi } from '../../../services/dd-api';

interface UseIndividualTokenReturn {
  token: Token | null;
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refresh: () => void;
}

export function useIndividualToken(tokenAddress: string): UseIndividualTokenReturn {
  const [token, setToken] = useState<Token | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const ws = useWebSocket();
  const isSubscribed = useRef(false);
  const topic = `token:price:${tokenAddress}`;

  // Transform backend token to frontend Token type
  const transformToken = useCallback((data: any): Token => {
    return {
      id: data.id || 0,
      address: data.address || tokenAddress,
      contractAddress: data.address || tokenAddress,
      symbol: data.symbol || "",
      name: data.name || "",
      price: data.price || 0,
      market_cap: data.market_cap || 0,
      marketCap: String(data.market_cap || 0),
      volume_24h: data.volume_24h || 0,
      volume24h: String(data.volume_24h || 0),
      change_24h: data.change_24h || 0,
      change24h: String(data.change_24h || 0),
      liquidity: data.liquidity || 0,
      fdv: data.fdv || 0,
      decimals: data.decimals || 9,
      image_url: data.image_url || "",
      header_image_url: data.header_image_url || "",
      socials: data.socials || {},
      status: "active" as const,
      websites: data.websites || []
    };
  }, [tokenAddress]);

  // Fetch initial token data via REST
  const fetchToken = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log(`[useIndividualToken] Fetching initial data for ${tokenAddress}`);

      // Use the direct token endpoint!
      const response = await fetch(`/api/tokens/${tokenAddress}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch token: ${response.statusText}`);
      }

      const tokenData = await response.json();

      if (tokenData) {
        setToken(transformToken(tokenData));
        setLastUpdate(new Date());
        console.log(`[useIndividualToken] Found token:`, tokenData.symbol);
      } else {
        setError(`Token ${tokenAddress} not found`);
        console.warn(`[useIndividualToken] Token not found: ${tokenAddress}`);
      }
    } catch (err: any) {
      console.error(`[useIndividualToken] Failed to fetch token:`, err);
      setError(err.message || 'Failed to fetch token');
    } finally {
      setIsLoading(false);
    }
  }, [tokenAddress, transformToken]);

  // Handle incoming token updates
  const handleTokenUpdate = useCallback((message: any) => {
    if (message.type === 'DATA' && message.topic === topic && message.data) {
      console.log(`[useIndividualToken] Received update for ${tokenAddress}:`, message.data);

      const updatedToken = transformToken(message.data);
      setToken(updatedToken);
      setLastUpdate(new Date());
      setError(null);
    }
  }, [topic, tokenAddress, transformToken]);

  // Initial fetch
  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  // WebSocket subscription
  useEffect(() => {
    if (!ws.isConnected || !token) {
      return;
    }

    console.log(`[useIndividualToken] Subscribing to ${topic}`);

    // Subscribe to specific token using traditional topics array
    ws.sendMessage({
      type: "SUBSCRIBE",
      topics: [topic]
    });
    isSubscribed.current = true;

    // Register listener
    const unregister = ws.registerListener(
      `individual-token-${tokenAddress}`,
      ['DATA'] as any[],
      handleTokenUpdate
    );

    return () => {
      unregister();
      if (isSubscribed.current && ws.isConnected) {
        ws.sendMessage({
          type: "UNSUBSCRIBE",
          topics: [topic]
        });
        isSubscribed.current = false;
      }
    };
  }, [ws, token, topic, tokenAddress, handleTokenUpdate]);

  return {
    token,
    isLoading,
    isConnected: ws.isConnected,
    error,
    lastUpdate,
    refresh: fetchToken
  };
}