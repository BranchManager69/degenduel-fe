// src/hooks/websocket/topic-hooks/useVisibleTokenSubscriptions.ts

/**
 * useVisibleTokenSubscriptions Hook
 * 
 * Subscribes to price updates for visible tokens only.
 * This is a lightweight alternative to subscribing to ALL tokens,
 * reducing bandwidth by ~98%.
 * 
 * @author Claude
 * @created 2025-01-11
 */

import { useEffect, useRef } from 'react';
import { useWebSocket } from '../../../contexts/UnifiedWebSocketContext';
import { Token } from '../../../types';

interface UseVisibleTokenSubscriptionsProps {
  tokens: Token[];
  onTokenUpdate?: (updatedToken: Token) => void;
  enabled?: boolean;
}

export function useVisibleTokenSubscriptions({
  tokens,
  onTokenUpdate,
  enabled = true
}: UseVisibleTokenSubscriptionsProps) {
  const ws = useWebSocket();
  const subscribedTokensRef = useRef<Set<string>>(new Set());

  // Subscribe to visible tokens
  useEffect(() => {
    if (!ws.isConnected || !enabled || tokens.length === 0) {
      return;
    }

    // Get unique token addresses
    const tokenAddresses = tokens
      .map(t => t.address || t.contractAddress)
      .filter(Boolean) as string[];

    const newSubscriptions: string[] = [];
    const toUnsubscribe: string[] = [];

    // Find new tokens to subscribe to
    tokenAddresses.forEach(address => {
      if (!subscribedTokensRef.current.has(address)) {
        newSubscriptions.push(`token:price:${address}`);
        subscribedTokensRef.current.add(address);
      }
    });

    // Find tokens we no longer need
    const currentAddressSet = new Set(tokenAddresses);
    subscribedTokensRef.current.forEach(subscribedAddress => {
      if (!currentAddressSet.has(subscribedAddress)) {
        toUnsubscribe.push(`token:price:${subscribedAddress}`);
        subscribedTokensRef.current.delete(subscribedAddress);
      }
    });

    // Unsubscribe from removed tokens
    if (toUnsubscribe.length > 0) {
      console.log(`[useVisibleTokenSubscriptions] Unsubscribing from ${toUnsubscribe.length} removed tokens`);
      ws.unsubscribe(toUnsubscribe);
    }

    // Subscribe to new tokens
    if (newSubscriptions.length > 0) {
      console.log(`[useVisibleTokenSubscriptions] Subscribing to ${newSubscriptions.length} visible tokens`);
      ws.subscribe(newSubscriptions);
    }

    // Cleanup on unmount or when disabled
    return () => {
      if (subscribedTokensRef.current.size > 0 && (!ws.isConnected || !enabled)) {
        const topics = Array.from(subscribedTokensRef.current).map(addr => `token:price:${addr}`);
        console.log(`[useVisibleTokenSubscriptions] Cleanup: Unsubscribing from ${topics.length} tokens`);
        ws.unsubscribe(topics);
        subscribedTokensRef.current.clear();
      }
    };
  }, [ws.isConnected, tokens, ws.subscribe, ws.unsubscribe, enabled]);

  // Handle token updates
  useEffect(() => {
    if (!ws.isConnected || !enabled || !onTokenUpdate) {
      return;
    }

    const unregister = ws.registerListener(
      'visible-token-price-updates',
      ['DATA'] as any[],
      (message: any) => {
        // Handle individual token price updates
        if (message.topic && message.topic.startsWith('token:price:') && message.data?.type === 'price_update') {
          const tokenAddress = message.topic.split(':')[2];
          
          // Find the token in our list
          const existingToken = tokens.find(t => 
            (t.address === tokenAddress) || (t.contractAddress === tokenAddress)
          );
          
          if (existingToken && message.data.token) {
            // Create updated token with new price data
            const updatedToken: Token = {
              ...existingToken,
              price: message.data.token.price || existingToken.price,
              market_cap: message.data.token.market_cap || existingToken.market_cap,
              marketCap: String(message.data.token.market_cap || existingToken.market_cap),
              change_24h: message.data.token.change_24h || existingToken.change_24h,
              change24h: String(message.data.token.change_24h || existingToken.change_24h),
              volume_24h: message.data.token.volume_24h || existingToken.volume_24h,
              volume24h: String(message.data.token.volume_24h || existingToken.volume_24h),
            };
            
            onTokenUpdate(updatedToken);
          }
        }
      }
    );

    return unregister;
  }, [ws.isConnected, enabled, onTokenUpdate, tokens]);
}