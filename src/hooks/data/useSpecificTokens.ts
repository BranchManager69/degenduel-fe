// src/hooks/data/useSpecificTokens.ts

/**
 * Hook for fetching specific tokens by address
 * 
 * This is a performance-optimized hook that only fetches and subscribes to
 * specific tokens rather than all tokens. Perfect for use cases like the
 * landing page where we only need DUEL and SOL tokens.
 * 
 * @author Claude
 * @created 2025-07-02
 */

import { useCallback, useEffect, useState } from 'react';
import { Token } from '../../types';
import { ddApi } from '../../services/dd-api';
import { useWebSocket } from '../../contexts/UnifiedWebSocketContext';

interface UseSpecificTokensOptions {
  enableLiveUpdates?: boolean;
}

export function useSpecificTokens(
  tokenAddresses: string[],
  options: UseSpecificTokensOptions = {}
): {
  tokens: Token[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
} {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ws = useWebSocket();
  const { enableLiveUpdates = true } = options;

  // Fetch specific tokens via REST API
  const fetchTokens = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all tokens (unfortunately the API doesn't support filtering by address)
      const response = await ddApi.tokens.getAll();
      const allTokens = Array.isArray(response) ? response : response.tokens || [];

      // Filter to only the tokens we need
      const specificTokens = allTokens.filter((token: Token) => 
        tokenAddresses.includes(token.address) || 
        tokenAddresses.includes(token.contractAddress)
      );

      setTokens(specificTokens);
    } catch (err: any) {
      console.error('[useSpecificTokens] Failed to fetch tokens:', err);
      setError(err.message || 'Failed to fetch tokens');
    } finally {
      setIsLoading(false);
    }
  }, [tokenAddresses]);

  // Initial fetch
  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  // Subscribe to specific token updates only
  useEffect(() => {
    if (!ws.isConnected || !enableLiveUpdates || tokens.length === 0) {
      return;
    }

    // Only subscribe to the specific tokens we care about
    const topics = tokens.map(token => `token:price:${token.address}`);
    
    console.log(`[useSpecificTokens] Subscribing to ${topics.length} specific token topics`);
    ws.subscribe(topics);

    // Handle token updates
    const unregister = ws.registerListener(
      'specific-token-updates',
      ['DATA'] as any[],
      (message: any) => {
        if (message.topic && message.topic.startsWith('token:price:') && message.data?.type === 'price_update') {
          const tokenAddress = message.topic.split(':')[2];
          
          setTokens(prev => prev.map(token => {
            if (token.address === tokenAddress) {
              return {
                ...token,
                price: message.data.token.price || token.price,
                market_cap: message.data.token.market_cap || token.market_cap,
                marketCap: String(message.data.token.market_cap || token.market_cap),
                change_24h: message.data.token.change_24h || token.change_24h,
                change24h: String(message.data.token.change_24h || token.change_24h),
                volume_24h: message.data.token.volume_24h || token.volume_24h,
                volume24h: String(message.data.token.volume_24h || token.volume_24h),
              };
            }
            return token;
          }));
        }
      }
    );

    return () => {
      unregister();
      ws.unsubscribe(topics);
    };
  }, [ws, enableLiveUpdates, tokens]);

  return {
    tokens,
    isLoading,
    error,
    refresh: fetchTokens
  };
}