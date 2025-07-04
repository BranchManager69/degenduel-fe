// src/hooks/data/useGlobalTokens.ts

/**
 * Hook to access specific tokens from the global token data
 * 
 * This hook leverages the fact that UnifiedTicker already subscribes to ALL token data.
 * Instead of making redundant API calls, we simply extract the tokens we need from
 * the global data stream.
 * 
 * @author Claude
 * @created 2025-07-02
 */

import { useMemo } from 'react';
import { useStandardizedTokenData } from './useStandardizedTokenData';
import { Token } from '../../types';

export function useGlobalTokens(tokenAddresses: string[]): {
  tokens: Token[];
  isLoading: boolean;
  error: string | null;
} {
  // Get ALL tokens from the global data (which UnifiedTicker is already loading)
  // Parameters: tokensToSubscribe, sortMethod, filter, maxHotTokens, maxTopTokens, disableLiveUpdates
  const { tokens: allTokens, isLoading, error } = useStandardizedTokenData('all', 'marketCap', {}, 5, 3000);
  
  // Filter to just the tokens we need
  const specificTokens = useMemo(() => {
    console.log('[useGlobalTokens] Debug:', {
      allTokensCount: allTokens?.length || 0,
      tokenAddresses,
      firstFewTokens: allTokens?.slice(0, 5).map(t => ({ symbol: t.symbol, address: t.address, contractAddress: t.contractAddress }))
    });
    
    if (!allTokens || allTokens.length === 0) return [];
    
    const results = tokenAddresses.map(address => {
      const token = allTokens.find(t => 
        t.address === address || 
        t.contractAddress === address
      );
      console.log(`[useGlobalTokens] Looking for ${address}:`, token ? `Found ${token.symbol}` : 'Not found');
      return token;
    }).filter(Boolean) as Token[];
    
    console.log('[useGlobalTokens] Final results:', results.length, 'tokens found');
    return results;
  }, [allTokens, tokenAddresses]);
  
  return {
    tokens: specificTokens,
    isLoading,
    error
  };
}