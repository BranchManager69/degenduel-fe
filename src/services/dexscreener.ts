// src/services/dexscreener.ts

// Define the type for a token with market data
interface TokenWithMarketData {
    address: string;
    name: string;
    symbol: string;
    currentPrice: number;
    imageUrl?: string;
    volume24h?: number;
    marketCap?: number;
    websites?: { url: string }[];
    socials?: { platform: string; handle: string; url?: string }[];
    dexUrl?: string;
    priceChange24h?: number;
}

// Fallback token for when no Hot Tokens are found (probably not a good idea)
export const FALLBACK_TOKEN = 'DoxsC4PpVHiUxCKYeKSkPXVVVSJYzidZZJxW4XCFF2t';

// Define the type for a DexScreener pair
interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    symbol: string;
  };
  priceUsd: string;
  priceChange?: {
    h24: number;
  };
  volume: {
    h24: number;
  };
  liquidity?: {
    usd: number;
  };
  fdv?: number;
  marketCap?: number;
  info?: {
    imageUrl?: string;
    websites?: { url: string }[];
    socials?: { platform: string; handle: string; url?: string }[];
  };
}

// Define the type for a DexScreener response
interface DexScreenerResponse {
  pairs: DexScreenerPair[];
}

interface TokenBoost {
  chainId: string;
  tokenAddress: string;
  amount: number;
  totalAmount: number;
  icon?: string;
}

export interface DebugInfo {
  totalPairs: number;
  filteredPairs: number;
  error?: string;
  timestamp: number;
}

let lastDebugInfo: DebugInfo = {
  totalPairs: 0,
  filteredPairs: 0,
  timestamp: Date.now()
};

export function getLastDebugInfo(): DebugInfo {
  return lastDebugInfo;
}

// Search for tokens by name or symbol
export async function searchTokens(query: string): Promise<Partial<TokenWithMarketData>[]> {
  try {
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!response.ok) {
      throw new Error('Failed to search tokens');
    }

    const data: DexScreenerResponse = await response.json();
    
    // Filter for Solana pairs with SOL as quote token
    const solanaPairs = data.pairs?.filter(pair => 
      pair.chainId === 'solana' &&
      pair.quoteToken.symbol === 'SOL' &&
      parseFloat(pair.priceUsd) > 0
    );

    // Sort by volume and get highest volume pair
    const sortedPairs = solanaPairs?.sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0));
    const bestPair = sortedPairs?.[0];

    if (!bestPair) return [];

    return [{
      address: bestPair.baseToken.address,
      name: bestPair.baseToken.name,
      symbol: bestPair.baseToken.symbol,
      currentPrice: parseFloat(bestPair.priceUsd),
      imageUrl: bestPair.info?.imageUrl,
      volume24h: bestPair.volume?.h24,
      marketCap: bestPair.marketCap,
      websites: bestPair.info?.websites || [],
      socials: bestPair.info?.socials || [],
      dexUrl: bestPair.url,
      priceChange24h: bestPair.priceChange?.h24
    }];
  } catch (error) {
    console.error('Failed to search tokens:', error);
    return [];
  }
}

// Fetch token info for a given token address
export async function fetchTokenInfo(tokenAddress: string): Promise<TokenWithMarketData | null> {
  try {
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch token information');
    }

    const data: DexScreenerResponse = await response.json();
    
    // Filter for Solana pairs with SOL as quote token
    const solanaPairs = data.pairs?.filter(pair => 
      pair.chainId === 'solana' && 
      pair.quoteToken.symbol === 'SOL'
    );

    const pair = solanaPairs?.[0];
    if (!pair) {
      throw new Error('No valid trading pairs found');
    }

    return {
      address: tokenAddress,
      name: pair.baseToken.name,
      symbol: pair.baseToken.symbol,
      currentPrice: parseFloat(pair.priceUsd),
      imageUrl: pair.info?.imageUrl,
      volume24h: pair.volume?.h24,
      marketCap: pair.marketCap,
      websites: pair.info?.websites || [],
      socials: pair.info?.socials || [],
      dexUrl: pair.url,
      priceChange24h: pair.priceChange?.h24
    };
  } catch (error) {
    console.error('Failed to fetch token info:', error);
    return null;
  }
}

export async function fetchHotTokens(): Promise<TokenWithMarketData[]> {
  try {
    console.log('Fetching hot tokens...');
    
    // Use the token boosts endpoint to get trending tokens
    const response = await fetch(
      'https://api.dexscreener.com/token-boosts/top/v1',
      { headers: { 'Accept': 'application/json' } }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const boosts: TokenBoost[] = await response.json();
    const solanaBoosts = boosts.filter(boost => boost.chainId === 'solana');

    // Fetch detailed info for each boosted token
    const tokens = await Promise.all(
      solanaBoosts.map(async boost => {
        try {
          const info = await fetchTokenInfo(boost.tokenAddress);
          return info;
        } catch {
          return null;
        }
      })
    );

    const validTokens = tokens.filter((t): t is TokenWithMarketData => t !== null);

    lastDebugInfo = {
      totalPairs: boosts.length,
      filteredPairs: validTokens.length,
      timestamp: Date.now()
    };

    // If no tokens found, use fallback
    if (validTokens.length === 0) {
      console.log('No hot tokens found, using fallback');
      const fallbackInfo = await fetchTokenInfo(FALLBACK_TOKEN);
      if (fallbackInfo) {
        validTokens.push(fallbackInfo);
      }
    }

    return validTokens;
  } catch (error) {
    console.error('Failed to fetch hot tokens:', error);
    lastDebugInfo = {
      totalPairs: 0,
      filteredPairs: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    };

    // Try fallback token
    const fallbackInfo = await fetchTokenInfo(FALLBACK_TOKEN);
    return fallbackInfo ? [fallbackInfo] : [];
  }
}

// Define the type for contest-relevant market data
interface TokenMarketData {
    marketCap: number | null;
    price: number | null;
    liquidity: number | null;
    volume24h: number | null;
}  

// Service class for fetching market data
export class DexScreenerService {
    private static cache = new Map<string, {
      data: TokenMarketData;
      timestamp: number;
    }>();
    private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
    // Need a special method for SOL price
    private static async getSolPrice(): Promise<number | null> {
        try {
            // -- [OPTION 1] CoinGecko --
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
            const data = await response.json();
            return data.solana.usd;

            // [OPTION 2] DexScreener (must use USDC/SOL pair directly) --
            // const response = await fetch('https://api.dexscreener.com/latest/dex/pairs/solana/USDC/SOL');
            // const data = await response.json();
            // return parseFloat(data.pairs[0]?.priceUsd);
        } catch (error) {
            console.error('Failed to fetch SOL price:', error);
            return null;
        }
    }

    // Simple getter for contest-relevant market data
    static async getMarketData(tokenAddress: string): Promise<TokenMarketData> {
        // Special handling for SOL
        if (tokenAddress === 'So11111111111111111111111111111111111111111') {
            const solPrice = await this.getSolPrice();
            return {
                marketCap: null, // Could fetch from CoinGecko if needed
                price: solPrice,
                liquidity: null,
                volume24h: null
            };
        }

        try {
            // Check cache first
            const cached = this.cache.get(tokenAddress);
            if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
                return cached.data;
            }
    
            const tokenInfo = await fetchTokenInfo(tokenAddress);
            
            const marketData: TokenMarketData = {
                marketCap: tokenInfo?.marketCap || null,
                price: tokenInfo?.currentPrice  || null,
                liquidity: tokenInfo?.volume24h || null,
                volume24h: tokenInfo?.volume24h || null,
            };
    
            // Update cache
            this.cache.set(tokenAddress, {
                data: marketData,
                timestamp: Date.now()
            });
    
            return marketData;
        } catch (error) {
            console.error(`Failed to fetch market data for ${tokenAddress}:`, error);
            return {
                marketCap: null,
                price: null,
                liquidity: null,
                volume24h: null
            };
        }
    }
  
    // Bulk fetch for contest tokens
    static async getContestTokensData(tokenAddresses: string[]): Promise<Map<string, TokenMarketData>> {
      const results = new Map();
      await Promise.all(
        tokenAddresses.map(async (address) => {
          results.set(address, await this.getMarketData(address));
        })
      );
      return results;
    }
  
    // Treat standalone functions as static methods
    static async searchTokens(query: string): Promise<Partial<TokenWithMarketData>[]> {
        return searchTokens(query);
    }
    static async fetchTokenInfo(tokenAddress: string): Promise<TokenWithMarketData | null> {
    return fetchTokenInfo(tokenAddress);
    }
    static async fetchHotTokens(): Promise<TokenWithMarketData[]> {
    return fetchHotTokens();
    }
}
