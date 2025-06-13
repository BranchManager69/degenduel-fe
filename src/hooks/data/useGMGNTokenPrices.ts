import { useState, useEffect, useCallback } from 'react';
import { useStandardizedTokenData } from './useStandardizedTokenData';
import { TokenHelpers } from '../../types';

/**
 * @deprecated This hook is deprecated and will be removed in a future version.
 * No components are using this hook. Use useStandardizedTokenData instead.
 */

interface GMGNPriceData {
  address: string;
  price: number;
  priceChange24h?: number;
  volume24h?: number;
  marketCap?: number;
  source: 'gmgn' | 'fallback';
  lastUpdated: Date;
}

interface GMGNTokenPricesResult {
  tokens: any[]; // Enhanced tokens with GMGN prices
  priceMap: Map<string, GMGNPriceData>;
  isLoading: boolean;
  error?: string;
  lastUpdate?: Date;
  isConnected: boolean;
  refresh: () => void;
  stats: {
    gmgnCount: number;
    fallbackCount: number;
    totalCount: number;
  };
}

// GMGN API helper functions
const SOL_ADDRESS = 'So11111111111111111111111111111111111111112';

const fetchGMGNPrice = async (tokenAddress: string, signal?: AbortSignal): Promise<number | null> => {
  try {
    // Use a small SOL amount (0.01 SOL = 10M lamports) to get effective price
    const solAmount = '10000000'; // 0.01 SOL in lamports
    
    const queryParams = new URLSearchParams({
      token_in_address: SOL_ADDRESS,
      token_out_address: tokenAddress,
      in_amount: solAmount,
      from_address: '', // Not required for quotes
      slippage: '0.01' // 1% slippage
    });
    
    const url = `https://gmgn.ai/defi/router/v1/sol/tx/get_swap_route?${queryParams}`;
    
    const response = await fetch(url, { signal });
    
    if (!response.ok) {
      throw new Error(`GMGN API HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.code !== 0 || !data.data?.quote) {
      return null;
    }
    
    const { outAmount } = data.data.quote;
    
    if (!outAmount || outAmount === '0') {
      return null;
    }
    
    // Calculate price: 0.01 SOL gets outAmount tokens
    // So 1 SOL = outAmount / 0.01 tokens
    // Therefore 1 token = 0.01 / outAmount SOL
    const tokensFor001SOL = parseFloat(outAmount);
    if (tokensFor001SOL > 0) {
      return 0.01 / tokensFor001SOL; // Price in SOL per token
    }
    
    return null;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      return null;
    }
    console.warn(`Failed to fetch GMGN price for ${tokenAddress}:`, error);
    return null;
  }
};

const fetchGMGNPricesInBatches = async (
  tokenAddresses: string[], 
  signal?: AbortSignal
): Promise<Map<string, number>> => {
  const priceMap = new Map<string, number>();
  const BATCH_SIZE = 5; // Limit concurrent requests to avoid rate limiting
  const DELAY_BETWEEN_BATCHES = 100; // Small delay between batches
  
  for (let i = 0; i < tokenAddresses.length; i += BATCH_SIZE) {
    if (signal?.aborted) break;
    
    const batch = tokenAddresses.slice(i, i + BATCH_SIZE);
    
    const promises = batch.map(async (address) => {
      const price = await fetchGMGNPrice(address, signal);
      return { address, price };
    });
    
    try {
      const results = await Promise.allSettled(promises);
      
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.price !== null) {
          priceMap.set(result.value.address, result.value.price);
        }
      });
      
      // Small delay between batches to be respectful to GMGN API
      if (i + BATCH_SIZE < tokenAddresses.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    } catch (error) {
      console.warn(`GMGN batch ${i / BATCH_SIZE + 1} failed:`, error);
    }
  }
  
  return priceMap;
};

/**
 * @deprecated This hook is deprecated and will be removed in a future version.
 * No components are using this hook. Use useStandardizedTokenData instead.
 */
export function useGMGNTokenPrices(): GMGNTokenPricesResult {
  // Get fallback data from existing hook
  const fallbackData = useStandardizedTokenData();
  
  const [gmgnPrices, setGmgnPrices] = useState<Map<string, GMGNPriceData>>(new Map());
  const [isLoadingGMGN, setIsLoadingGMGN] = useState(false);
  const [gmgnError, setGmgnError] = useState<string | undefined>(undefined);
  const [lastGMGNUpdate, setLastGMGNUpdate] = useState<Date | undefined>(undefined);
  
  const fetchGMGNData = useCallback(async () => {
    if (fallbackData.tokens.length === 0) {
      return; // Wait for fallback data first
    }
    
    setIsLoadingGMGN(true);
    setGmgnError(undefined);
    
    const controller = new AbortController();
    const signal = controller.signal;
    
    try {
      console.log(`🚀 GMGN: Fetching prices for ${fallbackData.tokens.length} tokens`);
      
      // Extract token addresses (filter out invalid ones)
      const tokenAddresses = fallbackData.tokens
        .map(token => TokenHelpers.getAddress(token))
        .filter(address => address && typeof address === 'string' && address.length > 20);
      
      // Fetch GMGN prices in batches
      const gmgnPriceMap = await fetchGMGNPricesInBatches(tokenAddresses, signal);
      
      if (signal.aborted) return;
      
      console.log(`✅ GMGN: Successfully fetched ${gmgnPriceMap.size} prices`);
      
      // Create enhanced price data
      const enhancedPrices = new Map<string, GMGNPriceData>();
      const now = new Date();
      
      fallbackData.tokens.forEach(token => {
        // Skip tokens without valid contract addresses
        if (!token.contractAddress || typeof token.contractAddress !== 'string') {
          return;
        }
        
        const tokenAddress = TokenHelpers.getAddress(token);
        const gmgnPrice = gmgnPriceMap.get(tokenAddress);
        
        if (gmgnPrice) {
          // Use GMGN price
          enhancedPrices.set(tokenAddress, {
            address: tokenAddress,
            price: gmgnPrice,
            priceChange24h: TokenHelpers.getPriceChange(token) || 0, // Use fallback for other metrics
            volume24h: TokenHelpers.getVolume(token) || 0,
            marketCap: TokenHelpers.getMarketCap(token) || 0,
            source: 'gmgn',
            lastUpdated: now
          });
        } else {
          // Use fallback price
          enhancedPrices.set(tokenAddress, {
            address: tokenAddress,
            price: TokenHelpers.getPrice(token) || 0,
            priceChange24h: TokenHelpers.getPriceChange(token) || 0,
            volume24h: TokenHelpers.getVolume(token) || 0,
            marketCap: TokenHelpers.getMarketCap(token) || 0,
            source: 'fallback',
            lastUpdated: now
          });
        }
      });
      
      setGmgnPrices(enhancedPrices);
      setLastGMGNUpdate(now);
      
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('GMGN price fetch failed:', error);
        setGmgnError(error.message);
      } else if (!(error instanceof Error)) {
        console.error('GMGN price fetch failed:', error);
        setGmgnError('Unknown error');
      }
    } finally {
      setIsLoadingGMGN(false);
    }
    
    return () => controller.abort();
  }, [fallbackData.tokens]);
  
  // Auto-refresh GMGN prices every 30 seconds
  useEffect(() => {
    fetchGMGNData();
    
    const interval = setInterval(() => {
      fetchGMGNData();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [fetchGMGNData]);
  
  // Enhanced tokens with GMGN prices
  const enhancedTokens = fallbackData.tokens.map(token => {
    const priceData = gmgnPrices.get(TokenHelpers.getAddress(token));
    
    if (priceData && priceData.source === 'gmgn') {
      // Use GMGN price, keep other data from fallback
      return {
        ...token,
        price: priceData.price.toString(),
        lastUpdated: priceData.lastUpdated.toISOString(),
        priceSource: 'gmgn'
      };
    }
    
    return {
      ...token,
      priceSource: 'fallback'
    };
  });
  
  // Calculate stats
  const stats = {
    gmgnCount: Array.from(gmgnPrices.values()).filter(p => p.source === 'gmgn').length,
    fallbackCount: Array.from(gmgnPrices.values()).filter(p => p.source === 'fallback').length,
    totalCount: gmgnPrices.size
  };
  
  const refresh = useCallback(() => {
    fallbackData.refresh();
    fetchGMGNData();
  }, [fallbackData.refresh, fetchGMGNData]);
  
  return {
    tokens: enhancedTokens,
    priceMap: gmgnPrices,
    isLoading: fallbackData.isLoading || isLoadingGMGN,
    error: gmgnError ?? (fallbackData.error ?? undefined),
    lastUpdate: lastGMGNUpdate ?? (fallbackData.lastUpdate ?? undefined),
    isConnected: fallbackData.isConnected,
    refresh,
    stats
  };
}