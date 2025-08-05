// src/pages/public/contests/PortfolioTokenSelectionPage.tsx

import { Buffer } from "buffer";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import PortfolioPreviewModal from "../../../components/portfolio-selection/PortfolioPreviewModal";
import { PortfolioSummary } from "../../../components/portfolio-selection/PortfolioSummary";
import { TokenFilters } from "../../../components/portfolio-selection/TokenFilters";
import { CreativeTokensGrid } from "../../../components/tokens-list/CreativeTokensGrid";
import { TokenSelectionList } from "../../../components/portfolio-selection/TokenSelectionList";
import { PortfolioTokenCardBack } from "../../../components/portfolio-selection/PortfolioTokenCardBack";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Skeleton } from "../../../components/ui/Skeleton";
import { config } from "../../../config/config";
import { useBatchTokens } from "../../../hooks/websocket/topic-hooks/useBatchTokens";
import { useVisibleTokenSubscriptions } from "../../../hooks/websocket/topic-hooks/useVisibleTokenSubscriptions";
import { useScrollFooter } from "../../../hooks/ui/useScrollFooter";
import { useMigratedAuth } from "../../../hooks/auth/useMigratedAuth";
import { useWalletAnalysis } from "../../../hooks/data/useWalletAnalysis";
import { useReferral } from "../../../hooks/social/useReferral";
import { ddApi } from "../../../services/dd-api";
import { useStore } from "../../../store/useStore";
import { Contest, SearchToken, Token, TokenHelpers } from "../../../types/index";

// Declare Buffer on window type
declare global {
  interface Window {
    Buffer: typeof Buffer;
  }
}

// Add Buffer to window object
if (typeof window !== "undefined") {
  window.Buffer = window.Buffer || Buffer;
}

// New interface for portfolio data
interface PortfolioToken {
  symbol: string;
  contractAddress: string;
  weight: number;
}

// Special tokens that should always be available - defined outside component to prevent re-creation
const SPECIAL_TOKEN_ADDRESSES = [
  'So11111111111111111111111111111111111111112',   // SOL  
  config.SOLANA.DEGEN_TOKEN_ADDRESS, // DUEL
  '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh', // WBTC
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'  // USDC
];

// Token Card Skeleton Component
function TokenCardSkeleton() {
  return (
    <Card className="bg-dark-200/30 backdrop-blur-sm border-emerald-500/20 p-3 sm:p-6">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Skeleton className="h-6 w-20 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-4" />
          </div>
        </div>
        
        {/* Sparkline area */}
        <Skeleton className="h-8 w-full" />
        
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Skeleton className="h-3 w-12 mb-1" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div>
            <Skeleton className="h-3 w-8 mb-1" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div>
            <Skeleton className="h-3 w-16 mb-1" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div>
            <Skeleton className="h-3 w-14 mb-1" />
            <Skeleton className="h-4 w-18" />
          </div>
        </div>
      </div>
    </Card>
  );
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="text-center p-4 relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-red-500/5 to-red-500/10 animate-data-stream-responsive opacity-0 group-hover:opacity-100" />
      <h2 className="text-xl font-bold text-red-400 mb-2 group-hover:animate-glitch">
        Something went wrong:
      </h2>
      <pre className="text-gray-400 bg-dark-300/50 p-4 rounded-lg border border-red-500/20 group-hover:border-red-500/40 transition-colors">
        {error.message}
      </pre>
    </div>
  );
}

export const PortfolioTokenSelectionPage: React.FC = () => {
  console.log("🏗️ PortfolioTokenSelectionPage: Component rendering");
  
  // Helper function to parse Decimal.js objects from backend
  const parseDecimalValue = (decimalObj: any): number => {
    if (typeof decimalObj === 'string' || typeof decimalObj === 'number') {
      return parseFloat(decimalObj.toString());
    }
    if (decimalObj && typeof decimalObj === 'object' && decimalObj.d && Array.isArray(decimalObj.d)) {
      // This is a Decimal.js object: { s: sign, e: exponent, d: digits_array }
      const digits = decimalObj.d.join('');
      const sign = decimalObj.s === 1 ? '' : '-';
      const exponent = decimalObj.e || 0;
      
      if (digits === '0') return 0;
      
      const baseNumber = parseFloat(digits);
      const result = baseNumber * Math.pow(10, exponent - digits.length + 1);
      return parseFloat(sign + result);
    }
    return 0;
  };
  
  const { id: contestId } = useParams();
  const navigate = useNavigate();
  const auth = useMigratedAuth();
  const { isSuperAdmin } = auth;
  const { referralCode } = useReferral();
  
  // Use batch tokens hook for special tokens
  const { 
    tokens: specialTokensMap, 
    isLoading: specialTokensLoading
  } = useBatchTokens(SPECIAL_TOKEN_ADDRESSES);
  
  // Convert map to array and maintain order
  const specialTokens = useMemo(() => {
    const tokens: Token[] = [];
    for (const address of SPECIAL_TOKEN_ADDRESSES) {
      const token = specialTokensMap.get(address);
      if (token) {
        // Add special banners
        if (address === 'So11111111111111111111111111111111111111112') {
          tokens.push({
            ...token,
            header_image_url: '/assets/media/sol_banner.png'
          });
        } else if (address === '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh') {
          tokens.push({
            ...token,
            header_image_url: '/assets/media/btc_banner.webp'
          });
        } else if (address === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') {
          tokens.push({
            ...token,
            header_image_url: '/assets/media/dollar.jpg'
          });
        } else {
          tokens.push(token);
        }
      }
    }
    return tokens;
  }, [specialTokensMap]);
  
  // State for paginated token loading (like TokensPage) - declare before using
  const [mainTokens, setMainTokens] = useState<Token[]>([]);
  const [totalTokenCount, setTotalTokenCount] = useState(0);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [displayCount, setDisplayCount] = useState(50);
  const TOKENS_PER_PAGE = 50;
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);
  
  // Track tokens added via search that aren't in the main list
  const [searchAddedTokens, setSearchAddedTokens] = useState<Map<string, Token>>(new Map());
  
  // Initial load - fetch first batch of tokens
  useEffect(() => {
    const loadInitialTokens = async () => {
      try {
        setIsInitialLoading(true);
        
        console.log('[PortfolioTokenSelectionPage] Loading initial tokens via trending API');
        
        // Fetch first batch with fixed initial limit and current sort
        const sortParam = getSortParam(sortBy);
        const response = await fetch(`/api/tokens/all?limit=50&offset=0&format=paginated&sort=${sortParam}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch tokens: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.tokens && Array.isArray(data.tokens)) {
          // Transform and save tokens directly
          const transformedTokens = data.tokens.map((token: any) => ({
            ...token,
            contractAddress: token.address || token.contractAddress,
            marketCap: String(token.market_cap || token.marketCap || 0),
            volume24h: String(token.volume_24h || token.volume24h || 0),
            change24h: String(token.change_24h || token.change24h || 0),
            status: token.is_active === false ? "inactive" : "active"
          } as Token));
          
          setMainTokens(transformedTokens);
          
          // Store total count for pagination
          if (data.pagination) {
            setTotalTokenCount(data.pagination.total);
          }
        }
      } catch (err: any) {
        console.error('[PortfolioTokenSelectionPage] Failed to load initial tokens:', err);
      } finally {
        setIsInitialLoading(false);
      }
    };
    
    loadInitialTokens();
  }, []); // Only run once on mount
  
  // All tokens including special ones and search results
  const allTokens = useMemo(() => {
    const specialAddresses = specialTokens.map(t => t.contractAddress?.toLowerCase());
    const searchTokensArray = Array.from(searchAddedTokens.values());
    const searchAddresses = searchTokensArray.map(t => (t.address || t.contractAddress)?.toLowerCase());
    
    // Filter main tokens to exclude both special tokens and existing portfolio tokens
    const filteredMainTokens = mainTokens.filter(t => {
      const address = t.contractAddress?.toLowerCase();
      return !specialAddresses.includes(address) && !searchAddresses.includes(address);
    });
    
    // Merge in correct order: existing portfolio tokens FIRST, then special tokens, then main tokens
    const mergedTokens = [...searchTokensArray, ...specialTokens, ...filteredMainTokens];
    
    // Deduplicate by address (though filtering above should prevent most duplicates)
    const seen = new Set<string>();
    return mergedTokens.filter(token => {
      const address = (token.address || token.contractAddress)?.toLowerCase();
      if (!address || seen.has(address)) return false;
      seen.add(address);
      return true;
    });
  }, [specialTokens, mainTokens, searchAddedTokens]);
  
  // Visible tokens - only show up to displayCount
  const tokens = useMemo(() => {
    return allTokens.slice(0, displayCount);
  }, [allTokens, displayCount]);
  
  // Debounced token updates to batch multiple changes
  const pendingUpdatesRef = useRef<Map<string, Token>>(new Map());
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const applyPendingUpdates = useCallback(() => {
    if (pendingUpdatesRef.current.size === 0) return;
    
    const updates = Array.from(pendingUpdatesRef.current.values());
    console.log(`[PortfolioPage] 📦 Applying ${updates.length} batched token updates`);
    
    setMainTokens(prev => {
      let changed = false;
      const newArray = prev.map(token => {
        const address = token.address || token.contractAddress;
        if (!address) return token;
        const update = pendingUpdatesRef.current.get(address);
        if (update) {
          // Check if meaningful fields actually changed
          if (token.price !== update.price || 
              token.market_cap !== update.market_cap ||
              token.change_24h !== update.change_24h ||
              token.volume_24h !== update.volume_24h) {
            changed = true;
            return update;
          }
        }
        return token;
      });
      
      pendingUpdatesRef.current.clear();
      return changed ? newArray : prev;
    });
  }, []);

  // Handle token updates from WebSocket
  const handleTokenUpdate = useCallback((updatedToken: Token) => {
    const address = updatedToken.address || updatedToken.contractAddress;
    if (!address) return;
    
    // Add to pending updates
    pendingUpdatesRef.current.set(address, updatedToken);
    
    // Clear existing timeout and set new one
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(applyPendingUpdates, 50); // 50ms debounce
  }, [applyPendingUpdates]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);
  
  // Combined loading state
  const tokenListLoading = isInitialLoading || specialTokensLoading;
  const isTokenDataConnected = true; // Always true with new approach
  const tokensError: string | null = null;
  const lastUpdate = new Date();
  
  // Refresh tokens function
  const refreshTokens = useCallback(async () => {
    console.log('[PortfolioTokenSelectionPage] Manual refresh triggered');
    
    // Reset everything and trigger fresh load
    setMainTokens([]);
    setDisplayCount(50);
    setTotalTokenCount(0);
    
    // Reload initial tokens
    try {
      setIsInitialLoading(true);
      
      const sortParam = getSortParam(sortBy);
      const response = await fetch(`/api/tokens/all?limit=50&offset=0&format=paginated&sort=${sortParam}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch tokens: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.tokens && Array.isArray(data.tokens)) {
        const transformedTokens = data.tokens.map((token: any) => ({
          ...token,
          contractAddress: token.address || token.contractAddress,
          marketCap: String(token.market_cap || token.marketCap || 0),
          volume24h: String(token.volume_24h || token.volume24h || 0),
          change24h: String(token.change_24h || token.change24h || 0),
          status: token.is_active === false ? "inactive" : "active"
        } as Token));
        
        setMainTokens(transformedTokens);
        
        if (data.pagination) {
          setTotalTokenCount(data.pagination.total);
        }
      }
    } catch (err: any) {
      console.error('[PortfolioTokenSelectionPage] Failed to refresh tokens:', err);
    } finally {
      setIsInitialLoading(false);
    }
  }, []);
  
  // Load more tokens - fetches next batch from API
  const loadMoreTokens = useCallback(async () => {
    if (isLoadingMore || mainTokens.length >= totalTokenCount) return;
    
    console.log('[PortfolioTokenSelectionPage] Loading more tokens from API');
    setIsLoadingMore(true);
    
    try {
      // Calculate offset based on current tokens
      const offset = mainTokens.length;
      
      // Fetch next batch with current sort
      const sortParam = getSortParam(sortBy);
      const response = await fetch(`/api/tokens/all?limit=${TOKENS_PER_PAGE}&offset=${offset}&format=paginated&sort=${sortParam}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch more tokens: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.tokens && Array.isArray(data.tokens)) {
        // Transform and append new tokens
        const newTokens = data.tokens.map((token: any) => ({
          ...token,
          contractAddress: token.address || token.contractAddress,
          marketCap: String(token.market_cap || token.marketCap || 0),
          volume24h: String(token.volume_24h || token.volume24h || 0),
          change24h: String(token.change_24h || token.change24h || 0),
          status: token.is_active === false ? "inactive" : "active"
        } as Token));
        
        // Add to existing tokens
        setMainTokens(prev => [...prev, ...newTokens]);
        
        // Update display count to show new tokens
        setDisplayCount(prev => prev + newTokens.length);
      }
    } catch (err: any) {
      console.error('[PortfolioTokenSelectionPage] Failed to load more tokens:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, mainTokens.length, totalTokenCount]);
  
  // Check if there are more tokens to load from server
  const hasMoreTokens = mainTokens.length < totalTokenCount;
  
  // Set up infinite scroll observer
  useEffect(() => {
    if (!loadMoreTriggerRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreTokens && !isLoadingMore && !tokenListLoading) {
          console.log('[PortfolioTokenSelectionPage] Intersection detected, loading more tokens');
          loadMoreTokens();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '200px' // Start loading when 200px away from bottom
      }
    );
    
    observer.observe(loadMoreTriggerRef.current);
    
    return () => {
      if (loadMoreTriggerRef.current) {
        observer.unobserve(loadMoreTriggerRef.current);
      }
    };
  }, [hasMoreTokens, isLoadingMore, tokenListLoading, loadMoreTokens]);
  
  const [selectedTokens, setSelectedTokens] = useState<Map<string, number>>(() => {
    // Try to restore saved portfolio for this contest
    try {
      const saved = localStorage.getItem(`portfolio_${contestId}`);
      if (saved) {
        const selections = JSON.parse(saved);
        console.log(`[Portfolio] Restored ${Object.keys(selections).length} saved token selections for contest ${contestId}`);
        return new Map(Object.entries(selections).map(([key, value]) => [key, Number(value)]));
      }
    } catch (error) {
      console.warn('[Portfolio] Failed to restore saved selections:', error);
    }
    return new Map();
  });
  // View mode for token display
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('portfolioViewMode');
    return (saved as 'grid' | 'list') || 'list';
  });
  const [contest, setContest] = useState<Contest | null>(null);
  const [contestLoading, setContestLoading] = useState(true);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [hasExistingPortfolio, setHasExistingPortfolio] = useState(false);
  const [debugPanelCollapsed, setDebugPanelCollapsed] = useState(true);
  const [walletDebugCollapsed, setWalletDebugCollapsed] = useState(true);
  const [tokenDebugCollapsed, setTokenDebugCollapsed] = useState(true);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [showWalletInput, setShowWalletInput] = useState(false);
  const [inputWalletAddress, setInputWalletAddress] = useState("");
  const [isAnalyzingWallet, setIsAnalyzingWallet] = useState(false);
  const user = useStore((state) => state.user);
  
  // Save portfolio selections to localStorage when they change
  useEffect(() => {
    if (contestId && selectedTokens.size > 0) {
      try {
        const selections = Object.fromEntries(selectedTokens);
        localStorage.setItem(`portfolio_${contestId}`, JSON.stringify(selections));
        console.log(`[Portfolio] Saved ${selectedTokens.size} token selections for contest ${contestId}`);
      } catch (error) {
        console.warn('[Portfolio] Failed to save selections:', error);
      }
    } else if (contestId && selectedTokens.size === 0) {
      // Clear saved data when no selections
      localStorage.removeItem(`portfolio_${contestId}`);
    }
  }, [selectedTokens, contestId]);
  
  // Wallet analysis hook - only runs if user is logged in
  const { 
    data: walletAnalysis, 
    isLoading: walletAnalysisLoading,
    error: walletAnalysisError 
  } = useWalletAnalysis(user?.wallet_address);
  
  // Get footer state for dynamic positioning
  const { isCompact } = useScrollFooter(50);
  
  // Modern wallet adapter for transactions
  const { publicKey, signTransaction, connected, connect, signMessage } = useWallet();
  const [loadingEntryStatus, setLoadingEntryStatus] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Track if we've shown the DIDI message for wallet analysis
  const [hasShownWalletMessage, setHasShownWalletMessage] = useState(false);
  const [transactionState, setTransactionState] = useState<{
    status:
      | "idle"
      | "preparing"
      | "signing"
      | "sending"
      | "confirming"
      | "submitting"
      | "success"
      | "error";
    message: string;
    error?: string;
    signature?: string;
  }>({
    status: "idle",
    message: "",
  });
  
  // Reset transaction state when user changes (fixes stuck button after login)
  useEffect(() => {
    setTransactionState({
      status: "idle",
      message: "",
    });
  }, [user?.wallet_address]);

  useEffect(() => {
    const fetchContest = async () => {
      setContestLoading(true);
      
      if (!contestId || contestId === 'undefined' || contestId === 'null') {
        console.error("Invalid contest ID:", contestId);
        toast.error("Invalid contest ID", { duration: 5000 });
        setContestLoading(false);
        return;
      }
      
      // Validate that contestId is a valid number
      const numericId = parseInt(contestId, 10);
      if (isNaN(numericId) || numericId <= 0) {
        console.error("Contest ID must be a valid number:", contestId);
        toast.error("Invalid contest ID format", { duration: 5000 });
        setContestLoading(false);
        return;
      }
      
      try {
        console.log("🏆 PortfolioTokenSelectionPage: Fetching contest:", contestId);
        const data = await ddApi.contests.getById(contestId);
        console.log("Contest data from API:", {
          data,
          isParticipating: data.is_participating,
          id: data.id,
        });
        setContest(data);
      } catch (err) {
        console.error("Error fetching contest:", err);
        toast.error("Failed to load contest details", { duration: 5000 });
        // Don't set contest to null on error, keep trying
      } finally {
        setContestLoading(false);
      }
    };

    fetchContest();
  }, [contestId]);

  // Special tokens (DUEL, SOL, USDC, WBTC) are already being fetched by useBatchTokens hook above

  useEffect(() => {
    const checkParticipationAndPortfolio = async () => {
      if (!contestId || !user?.wallet_address) {
        setLoadingEntryStatus(false);
        setHasExistingPortfolio(false);
        return;
      }

      try {
        setLoadingEntryStatus(true);
        
        // Step 1: Check participation status (public endpoint)
        const participationData = await ddApi.contests.checkParticipation(contestId, user.wallet_address);
        
        if (participationData.participating) {
          setHasExistingPortfolio(true);
          
          // Step 2: Try to get existing portfolio (authenticated endpoint)
          try {
            const portfolioData = await ddApi.portfolio.get(Number(contestId));

            // Create map using contract addresses instead of symbols
            const existingPortfolio = new Map<string, number>(
              (portfolioData.tokens as PortfolioToken[])?.map(
                (token: PortfolioToken) => [token.contractAddress, token.weight],
              ) || [],
            );

            setSelectedTokens(existingPortfolio);
            
            // ============================================================================
            // FETCH MISSING TOKENS FROM EXISTING PORTFOLIO
            // ============================================================================
            // Check if any portfolio tokens are not in the current loaded token list
            const loadedTokenAddresses = new Set(tokens.map(t => TokenHelpers.getAddress(t)));
            const missingTokenAddresses: string[] = [];
            
            for (const contractAddress of existingPortfolio.keys()) {
              if (!loadedTokenAddresses.has(contractAddress)) {
                missingTokenAddresses.push(contractAddress);
              }
            }
            
            if (missingTokenAddresses.length > 0) {
              console.log("🔍 Found missing tokens in portfolio, fetching data for:", missingTokenAddresses);
              
              // Fetch data for missing tokens
              try {
                // We'll search for each missing token to get its data
                const missingTokensData: Token[] = [];
                
                for (const address of missingTokenAddresses) {
                  try {
                    // Search by contract address to get token data
                    const searchResponse = await fetch(
                      `/api/tokens/search?search=${encodeURIComponent(address)}&limit=1`
                    );
                    
                    if (searchResponse.ok) {
                      const searchData = await searchResponse.json();
                      if (searchData.tokens && searchData.tokens.length > 0) {
                        const searchToken = searchData.tokens[0];
                        
                        // Convert SearchToken to Token format
                        const tokenForGrid: Token = {
                          id: Date.now() + Math.random(),
                          address: searchToken.address,
                          contractAddress: searchToken.address,
                          symbol: searchToken.symbol || 'UNKNOWN',
                          name: searchToken.name || 'Unknown Token',
                          decimals: searchToken.decimals || 9,
                          image_url: searchToken.image_url || '',
                          header_image_url: searchToken.header_image_url || null,
                          color: searchToken.color || null,
                          price: searchToken.price || 0,
                          market_cap: searchToken.market_cap || 0,
                          volume_24h: searchToken.volume_24h || 0,
                          change_24h: searchToken.change_24h || 0,
                          tags: searchToken.tags || [],
                          total_supply: searchToken.total_supply || null,
                          fdv: searchToken.fdv || null,
                          is_active: searchToken.is_active !== undefined ? searchToken.is_active : true,
                          priceChanges: searchToken.priceChanges || null,
                          volumes: searchToken.volumes || null,
                          transactions: searchToken.transactions || null,
                        };
                        
                        missingTokensData.push(tokenForGrid);
                      }
                    }
                  } catch (err) {
                    console.error(`Failed to fetch data for token ${address}:`, err);
                  }
                }
                
                if (missingTokensData.length > 0) {
                  console.log("✅ Successfully fetched data for", missingTokensData.length, "missing tokens");
                  // Filter out tokens with no valid data before adding
                  const validTokens = missingTokensData.filter(token => {
                    // Only include tokens that have essential data
                    // Don't filter by price/market cap as some valid tokens might have 0 values
                    return token.symbol && 
                           token.symbol !== 'UNKNOWN' && 
                           token.address;
                  });
                  
                  console.log(`Filtered to ${validTokens.length} valid tokens from ${missingTokensData.length} fetched`);
                  
                  // Add only valid tokens to search-added tokens
                  validTokens.forEach(token => {
                    setSearchAddedTokens(prev => new Map(prev).set(TokenHelpers.getAddress(token), token));
                  });
                  
                  // Clean up selectedTokens to remove tokens that couldn't be fetched or have invalid data
                  const invalidTokenAddresses = missingTokenAddresses.filter(address => 
                    !validTokens.some(token => TokenHelpers.getAddress(token) === address)
                  );
                  
                  if (invalidTokenAddresses.length > 0) {
                    console.log(`Removing ${invalidTokenAddresses.length} invalid tokens from portfolio`);
                    setSelectedTokens(prev => {
                      const newMap = new Map(prev);
                      invalidTokenAddresses.forEach(address => {
                        newMap.delete(address);
                      });
                      return newMap;
                    });
                  }
                }
              } catch (error) {
                console.error("Failed to fetch missing token data:", error);
              }
            }
            
          } catch (portfolioError: any) {
            // User is in contest but no portfolio yet - that's fine
            setSelectedTokens(new Map());
          }
        } else {
          setHasExistingPortfolio(false);
          setSelectedTokens(new Map());
        }
        
      } catch (error: any) {
        console.error("💥💥💥 PARTICIPATION CHECK FAILED 💥💥💥", error);
        setHasExistingPortfolio(false);
        setSelectedTokens(new Map());
      } finally {
        setLoadingEntryStatus(false);
      }
    };

    checkParticipationAndPortfolio();
  }, [contestId, user?.wallet_address]);


  // Auto-connect on mount if wallets match
  useEffect(() => {
    if (!connected && user?.wallet_address && typeof window !== 'undefined' && (window as any).solana?.isPhantom) {
      const phantomProvider = (window as any).solana;
      
      if (phantomProvider.isConnected && phantomProvider.publicKey?.toBase58() === user.wallet_address) {
        console.log("[WALLET DEBUG] Auto-connecting wallet adapter - Phantom matches user");
        connect();
      }
    }
  }, [connected, user?.wallet_address, connect]);


  useEffect(() => {
    console.log("Current contest state:", {
      contestId,
      contest,
      isParticipating: contest?.is_participating,
    });
  }, [contestId, contest]);


  // Sort state for this page only - default to 'change24h' to show hot movers first
  const [sortBy, setSortBy] = useState<'default' | 'marketCap' | 'volume' | 'change24h' | 'price'>('change24h');
  
  // Map frontend sort values to API sort parameter
  const getSortParam = useCallback((sortValue: typeof sortBy): string => {
    switch (sortValue) {
      case 'marketCap': return 'market_cap';
      case 'volume': return 'volume_24h';
      case 'change24h': return 'change_24h';
      case 'price': return 'price';
      case 'default': return 'change_24h'; // Default to 24h change
      default: return 'change_24h';
    }
  }, []);
  
  // Handle sort changes - reload tokens with new sort
  const handleSortChange = useCallback(async (newSort: typeof sortBy) => {
    if (newSort === sortBy) return; // No change
    
    setSortBy(newSort);
    
    // Reset tokens and reload with new sort
    setMainTokens([]);
    setIsInitialLoading(true);
    
    try {
      const sortParam = getSortParam(newSort);
      const response = await fetch(`/api/tokens/all?limit=50&offset=0&format=paginated&sort=${sortParam}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch tokens: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.tokens && Array.isArray(data.tokens)) {
        const transformedTokens = data.tokens.map((token: any) => ({
          ...token,
          contractAddress: token.address || token.contractAddress,
          marketCap: String(token.market_cap || token.marketCap || 0),
          volume24h: String(token.volume_24h || token.volume24h || 0),
          change24h: String(token.change_24h || token.change24h || 0),
          status: token.is_active === false ? "inactive" : "active"
        } as Token));
        
        setMainTokens(transformedTokens);
        
        if (data.pagination) {
          setTotalTokenCount(data.pagination.total);
        }
      }
    } catch (error) {
      console.error('[PortfolioTokenSelectionPage] Error loading tokens with new sort:', error);
    } finally {
      setIsInitialLoading(false);
    }
  }, [sortBy, getSortParam]);
  
  // Backend now handles sorting, so tokens are already sorted
  const sortedTokens = tokens;
  
  // Properly memoize tokens to prevent rapid re-subscriptions
  // Only re-memoize when the actual token set changes (not just prices)
  const memoizedTokens = useMemo(() => tokens, [
    // Create a stable dependency based on token addresses
    tokens.map(t => t.address || t.contractAddress).sort().join(',')
  ]);

  // visibleTokens are just tokens (already paginated and includes special tokens)
  const visibleTokens = tokens;

  // Subscribe to visible tokens for real-time price updates
  useVisibleTokenSubscriptions({
    tokens: memoizedTokens,
    onTokenUpdate: handleTokenUpdate,
    enabled: true
  });

  // Token selection handler - will be defined after offline mode variables

  const totalWeight = Array.from(selectedTokens.values()).reduce(
    (sum, weight) => sum + weight,
    0,
  );

  // Portfolio validation
  const portfolioValidation = useMemo(() => {
    if (totalWeight !== 100) {
      return "Total weight must equal 100%";
    }
    if (selectedTokens.size < 1) {
      return "Select at least 1 token";
    }
    return null;
  }, [totalWeight, selectedTokens.size]);

  const handlePreviewPortfolio = () => {
    setShowPreviewModal(true);
  };

  // Token search selection handler - will be defined after handleTokenSelect

  // Generate portfolio summary for the modal
  const portfolioSummary = useMemo(() => {
    if (selectedTokens.size === 0) return '';
    
    const tokenEntries = Array.from(selectedTokens.entries())
      .map(([contractAddress, weight]) => {
        const token = sortedTokens.find(t => TokenHelpers.getAddress(t) === contractAddress);
        return `${token?.symbol || 'Unknown'} (${weight}%)`;
      })
      .join(', ');
    
    return tokenEntries;
  }, [selectedTokens, sortedTokens]);

  const portfolioDetails = useMemo(() => {
    const tokens = Array.from(selectedTokens.entries())
      .map(([contractAddress, weight]) => {
        const token = sortedTokens.find(t => TokenHelpers.getAddress(t) === contractAddress);
        return {
          symbol: token?.symbol || 'Unknown',
          weight,
          price: token?.price ? Number(token.price) : undefined
        };
      })
      .sort((a, b) => b.weight - a.weight); // Sort by weight descending

    return {
      name: `Portfolio for ${contest?.name || 'Contest'}`,
      tokens
    };
  }, [selectedTokens, sortedTokens, contest?.name]);

  const handleSubmit = async () => {
    // BROWSING USERS: Check authentication first before anything else
    if (!user?.wallet_address) {
      console.log("User not authenticated, redirecting to login");
      toast.error("Please log in to enter contests", { duration: 4000 });
      
      // Navigate to login with return URL to come back here
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      navigate(`/login?returnUrl=${returnUrl}`);
      return;
    }

    // Check if contest is still loading
    if (contestLoading) {
      console.log("Contest still loading...");
      toast.error("Please wait for contest details to load", { duration: 3000 });
      return;
    }

    if (!contest || !contestId || contestId === 'undefined' || contestId === 'null') {
      console.error("Submit failed: Missing contest data:", {
        contest,
        contestId,
        contestLoading,
      });
      toast.error("Contest information not available. Please refresh the page.");
      return;
    }
    
    // Validate that contestId is a valid number
    const numericId = parseInt(contestId, 10);
    if (isNaN(numericId) || numericId <= 0) {
      console.error("Submit failed: Invalid contest ID format:", contestId);
      toast.error("Invalid contest ID format");
      return;
    }

    // Check if this is a free contest
    const entryFee = parseDecimalValue(contest.entry_fee);
    const isFreeContest = entryFee === 0;

    console.log("Contest entry details:", {
      contestId,
      entryFee,
      isFreeContest,
      contestName: contest.name,
    });

    // Capture signature in local variable to avoid React state race condition
    let confirmedSignature: string | undefined;
    
    try {
      setIsLoading(true);

      // Prepare portfolio data
      const portfolioData = {
        tokens: Array.from(selectedTokens.entries()).map(
          ([contractAddress, weight]) => {
            const token = sortedTokens.find(t => TokenHelpers.getAddress(t) === contractAddress);
            return {
              symbol: token?.symbol || '',
              contractAddress,
              weight,
            };
          }
        ),
      };

      if (isFreeContest) {
        // FREE CONTEST FLOW: No Solana transaction required
        console.log("Entering free contest directly...");
        setTransactionState({
          status: "submitting",
          message: "Submitting contest entry...",
        });

        // Use correct endpoint based on participation status for free contests too
        if (hasExistingPortfolio) {
          console.log("Updating existing portfolio in free contest...");
          await ddApi.contests.updatePortfolio(contestId, portfolioData);
        } else {
          console.log("Entering free contest with new portfolio...");
          await ddApi.contests.enterFreeContestWithPortfolio(
            contestId,
            portfolioData,
            referralCode || undefined,
          );
        }

        setTransactionState({
          status: "success",
          message: hasExistingPortfolio ? "Portfolio updated successfully!" : "Success! You have entered the free contest.",
        });
        
        // Clear saved portfolio data after successful submission
        if (contestId) {
          localStorage.removeItem(`portfolio_${contestId}`);
          console.log(`[Portfolio] Cleared saved portfolio data for contest ${contestId} after successful submission`);
        }

        toast.success(hasExistingPortfolio ? "Portfolio updated successfully!" : "Successfully entered free contest!", { duration: 5000 });

      } else {
        // PAID CONTEST FLOW: Requires Solana transaction
        console.log("Processing paid contest entry...");

        // Get contest details to ensure we have the wallet address
        const contestDetails = await ddApi.contests.getById(contestId);
        if (!contestDetails.wallet_address) {
          throw new Error("Contest wallet address not found");
        }

        // 1. Modern wallet connection and transaction flow
        console.log("Initializing modern wallet transaction...");
        
        // Ensure wallet is connected - this will show wallet picker if not connected
        if (!connected || !publicKey || !signTransaction) {
          console.log("Wallet not connected, prompting connection...");
          setTransactionState({
            status: "preparing",
            message: "Connecting wallet...",
          });
          
          try {
            await connect();
            console.log("Wallet connected successfully");
            
            // Wait a bit for wallet state to update
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Re-check wallet state - the component will re-render with new wallet state
            // For now, just return to let the user click submit again
            setTransactionState({
              status: "idle",
              message: "Wallet connected! Please click submit again to continue.",
            });
            toast.success("Wallet connected! Please click submit again to continue.", { duration: 4000 });
            return;
          } catch (error: any) {
            console.error("Wallet connection failed:", error);
            throw new Error("Please connect a Solana wallet to continue");
          }
        }

        // Verify connected wallet matches user's registered wallet
        if (user?.wallet_address && publicKey && publicKey.toBase58() !== user.wallet_address) {
          throw new Error("Connected wallet doesn't match your registered wallet address");
        }

        console.log("Creating Solana connection...");
        const connection = new Connection(
          `${window.location.origin}/api/solana-rpc`, // Using server-side Solana proxy with full URL
          "confirmed",
        );

        // Get minimum rent exemption
        const minRentExemption =
          await connection.getMinimumBalanceForRentExemption(0);
        const lamports = Math.floor(parseFloat(contest.entry_fee) * 1e9);

        console.log("Transaction details:", {
          from: publicKey?.toBase58(),
          to: contestDetails.wallet_address,
          amount: contest.entry_fee,
          lamports,
          minRentExemption,
          estimatedFee: "~0.00016 SOL",
          totalRequired: Number(contest.entry_fee) + 0.00016,
          timestamp: new Date().toISOString(),
        });

        // Get latest blockhash
        console.log("Getting recent blockhash...");
        setTransactionState({
          status: "preparing",
          message: "Preparing transaction...",
        });

        // Create transaction
        const transaction = new Transaction();

        // Check if destination account exists
        const destAccount = await connection.getAccountInfo(
          new PublicKey(contestDetails.wallet_address),
        );
        const finalLamports =
          destAccount === null ? lamports + minRentExemption : lamports;

        // Ensure we have a valid publicKey before creating transaction
        if (!publicKey) {
          throw new Error("Wallet public key not available");
        }

        transaction.add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey(contestDetails.wallet_address),
            lamports: finalLamports,
          }),
        );

        // Get the latest blockhash for transaction freshness
        console.log("Getting latest blockhash...");
        const latestBlockhash = await connection.getLatestBlockhash();
        transaction.recentBlockhash = latestBlockhash.blockhash;
        transaction.feePayer = publicKey;

        // Modern wallet adapter transaction signing
        setTransactionState({
          status: "signing",
          message: "Please confirm the transaction in your wallet...",
        });

        console.log("Requesting transaction signature using modern wallet adapter...");
        
        try {
          // Ensure signTransaction is available
          if (!signTransaction) {
            throw new Error("Wallet signing function not available");
          }

          // Use modern wallet adapter signTransaction method
          const signedTransaction = await signTransaction(transaction);
          console.log("Transaction signed successfully");

          setTransactionState({
            status: "sending",
            message: "Sending transaction to blockchain...",
          });

          // Send the signed transaction
          const signature = await connection.sendRawTransaction(signedTransaction.serialize());
          console.log("Transaction sent, signature:", signature);
          confirmedSignature = signature; // Store locally to avoid race condition

          setTransactionState({
            status: "sending",
            message: "Transaction sent, waiting for confirmation...",
            signature,
          });

          toast.success(
            <div>
              <div>Transaction sent!</div>
              <div className="text-xs mt-1">
                <a
                  href={`https://solscan.io/tx/${signature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300"
                >
                  View on Solscan
                </a>
              </div>
            </div>,
          );

          console.log("Waiting for transaction confirmation...");
          setTransactionState({
            status: "confirming",
            message: "Waiting for blockchain confirmation...",
            signature,
          });

          // Use backend's check-transaction endpoint instead of frontend confirmation
          console.log("Checking transaction status with backend...");
          
          setTransactionState({
            status: "confirming",
            message: "Verifying transaction with backend...",
            signature,
          });

          // Give transaction a moment to propagate before checking
          await new Promise(resolve => setTimeout(resolve, 2000));

          try {
            // Use the backend's check-transaction endpoint
            const checkResponse = await fetch(`${window.location.origin}/api/contests/check-transaction`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ signature })
            });

            const status = await checkResponse.json();

            if (!status.found) {
              throw new Error('Transaction not found - it may take a moment to propagate');
            }

            if (!status.success) {
              throw new Error('Transaction failed on-chain');
            }

            if (status.confirmationStatus !== 'confirmed' && 
                status.confirmationStatus !== 'finalized') {
              console.warn('Transaction not fully confirmed yet, but proceeding...');
            }

            console.log("Transaction verified by backend:", status);
          } catch (checkError) {
            console.warn("Transaction check failed, but proceeding anyway:", checkError);
            // Don't fail the whole flow if check fails - backend will verify during entry
          }

          setTransactionState({
            status: "submitting",
            message: "Transaction verified! Submitting contest entry...",
            signature,
          });
        } catch (err: any) {
          console.error("Transaction error:", err);
          
          // Handle specific wallet errors
          let errorMessage = "Transaction failed";
          let isUserCancellation = false;
          
          if (err.code === 4001 || err.message?.includes("User rejected")) {
            errorMessage = "Transaction cancelled by user";
            isUserCancellation = true;
          } else if (err.message?.includes("Insufficient funds")) {
            errorMessage = "Insufficient SOL balance for transaction";
          } else if (err.message?.includes("blockhash not found")) {
            errorMessage = "Transaction expired, please try again";
          } else if (err instanceof Error) {
            errorMessage = err.message;
          }
          
          setTransactionState({
            status: "error",
            message: "Transaction failed",
            error: errorMessage,
          });
          
          // Throw error with special flag for user cancellations
          const error = new Error(errorMessage);
          (error as any).isUserCancellation = isUserCancellation;
          throw error;
        }

        // 2. Submit contest entry and portfolio in one atomic operation
        console.log("Submitting contest entry and portfolio...");

        // Ensure we have a valid signature before proceeding
        if (!confirmedSignature) {
          throw new Error("Transaction signature not available");
        }

        // Use correct endpoint based on participation status
        if (hasExistingPortfolio) {
          console.log("Updating existing portfolio...");
          await ddApi.contests.updatePortfolio(contestId, portfolioData);
        } else {
          console.log("Entering contest with new portfolio...");
          await ddApi.contests.enterContestWithPortfolio(
            contestId,
            portfolioData,
            confirmedSignature, // Use local variable instead of potentially stale state
            referralCode || undefined,
          );
        }

        setTransactionState({
          status: "success",
          message: hasExistingPortfolio ? "Portfolio updated successfully!" : "Success! You have entered the contest.",
          signature: confirmedSignature,
        });
        
        // Clear saved portfolio data after successful submission
        if (contestId) {
          localStorage.removeItem(`portfolio_${contestId}`);
          console.log(`[Portfolio] Cleared saved portfolio data for contest ${contestId} after successful submission`);
        }

        toast.success(
          <div>
            <div>{hasExistingPortfolio ? "Portfolio updated successfully!" : "Successfully entered contest!"}</div>
            <div className="text-xs mt-1">
              <a
                href={`https://solscan.io/tx/${confirmedSignature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 hover:text-brand-300"
              >
                View transaction on Solscan
              </a>
            </div>
          </div>,
          { duration: 5000 },
        );
      }

      // Don't navigate immediately - let user see success and decide
      // navigate(`/contests/${contestId}`);
    } catch (error: any) {
      const errorMsg = error.message || "Failed to enter contest";

      // Handle user cancellation FIRST - this is not a real error
      if (error.isUserCancellation) {
        setTransactionState({
          status: "idle",
          message: "",
        });
        toast("Transaction cancelled", { duration: 2000 });
        return;
      }

      // Handle session expiration (401) errors
      if (error.status === 401 || errorMsg.includes("401") || errorMsg.includes("No session token") || errorMsg.includes("unauthorized")) {
        setTransactionState({
          status: "error",
          message: "Session expired",
          error: "Your session has expired. Please log in again to continue.",
          signature: confirmedSignature || transactionState.signature,
        });

        toast.error("Your session has expired. Please log in again.", { duration: 5000 });
        
        // Redirect to login after a short delay
        setTimeout(() => {
          const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
          navigate(`/login?returnUrl=${returnUrl}`);
        }, 2000);
        
        return;
      }

      // Handle "already participating" as info, not error
      if (errorMsg.toLowerCase().includes("already participating")) {
        // Show success message and redirect
        setTransactionState({
          status: "success",
          message: "You're already participating in this contest!",
        });

        toast.success("You're already in this contest! You can update your portfolio.", { duration: 3000 });
        
        // Don't navigate - let user see the success state
        return; // Don't show error state
      }

      // Handle analytics tracking errors gracefully
      if (errorMsg.includes("participationLogger.analytics.trackEvent is not a function") || 
          errorMsg.includes("analytics tracking temporarily unavailable")) {
        // This is a backend analytics error that doesn't affect the core functionality
        console.warn("Backend analytics error detected (non-critical):", errorMsg);
        
        // Still show success for the contest entry (the analytics error is secondary)
        setTransactionState({
          status: "success",
          message: "Contest entry successful! (Analytics temporarily unavailable)",
          signature: confirmedSignature || transactionState.signature,
        });

        toast.success("Successfully entered contest! (Analytics tracking temporarily unavailable)", { duration: 4000 });
        
        // Don't navigate - let user see the success state
        return; // Don't show error state for this non-critical error
      }

      // Handle contest-specific errors
      if (errorMsg.includes("cancelled")) {
        setTransactionState({
          status: "error",
          message: "Contest Cancelled",
          error: "This contest has been cancelled and is no longer accepting entries.",
          signature: confirmedSignature || transactionState.signature,
        });

        toast.error("This contest has been cancelled and is no longer accepting entries.", { duration: 5000 });
        
        // Navigate back to contests list after a delay
        setTimeout(() => {
          navigate('/contests');
        }, 3000);
        
        return;
      }

      // Handle other contest status errors
      if (errorMsg.includes("status") && (errorMsg.includes("completed") || errorMsg.includes("ended"))) {
        setTransactionState({
          status: "error",
          message: "Contest Ended",
          error: "This contest has already ended and is no longer accepting entries.",
          signature: confirmedSignature || transactionState.signature,
        });

        toast.error("This contest has already ended.", { duration: 5000 });
        return;
      }

      // Handle all other errors normally
      let friendlyErrorMsg = errorMsg;
      
      // Make error messages more user-friendly
      if (errorMsg.includes("update portfolio") || errorMsg.includes("Failed to update portfolio")) {
        friendlyErrorMsg = user?.wallet_address ? 
          "Unable to save your portfolio. Please try again." : 
          "Please log in to save your portfolio.";
      } else if (errorMsg.includes("enter contest") || errorMsg.includes("Failed to enter contest")) {
        friendlyErrorMsg = user?.wallet_address ? 
          "Unable to enter the contest. Please try again." : 
          "Please log in to enter contests.";
      }

      setTransactionState({
        status: "error",
        message: "Error entering contest",
        error: friendlyErrorMsg,
        signature: confirmedSignature || transactionState.signature,
      });

      console.error("Contest entry failed:", {
        error,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      });

      toast.error(friendlyErrorMsg, { duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  // ENHANCED: Offline-first portfolio selection with persistent state
  const [wsDisconnectTime, setWsDisconnectTime] = useState<number | null>(null);
  const [isInWsGracePeriod, setIsInWsGracePeriod] = useState(false);
  const [pendingSelections, setPendingSelections] = useState<Map<string, number>>(new Map());
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  // Extend grace period and add offline mode support
  useEffect(() => {
    const GRACE_PERIOD_MS = 30000; // Extended to 30 seconds for better UX
    
    if (!isTokenDataConnected) {
      // Just disconnected
      if (wsDisconnectTime === null) {
        const now = Date.now();
        setWsDisconnectTime(now);
        setIsInWsGracePeriod(true);
        
        console.log('[PortfolioSelection] WebSocket disconnected, entering offline mode');
        
        // Set timeout to end grace period
        const timeout = setTimeout(() => {
          setIsInWsGracePeriod(false);
          console.log('[PortfolioSelection] Grace period ended, showing offline mode');
        }, GRACE_PERIOD_MS);
        
        return () => clearTimeout(timeout);
      }
    } else if (isTokenDataConnected) {
      // Reconnected - sync any pending changes
      if (wsDisconnectTime !== null) {
        console.log('[PortfolioSelection] WebSocket reconnected, syncing offline changes');
        setLastSyncTime(new Date());
        
        // If there are pending selections, they'll be handled by the component state
        if (pendingSelections.size > 0) {
          console.log(`[PortfolioSelection] Syncing ${pendingSelections.size} offline selections`);
          setPendingSelections(new Map()); // Clear pending after sync
        }
      }
      
      setWsDisconnectTime(null);
      setIsInWsGracePeriod(false);
    }
  }, [isTokenDataConnected, wsDisconnectTime, pendingSelections.size]);

  // Determine if we're in offline mode (needed before token handler)
  const isOfflineMode = !isTokenDataConnected && !isInWsGracePeriod;
  const showOfflineIndicator = isOfflineMode && memoizedTokens.length > 0;

  // Check if wallet analysis matches current portfolio (to skip animation if already applied)
  const walletMatchesCurrentPortfolio = useMemo(() => {
    if (!walletAnalysis || !walletAnalysis.tokens.length || selectedTokens.size === 0) {
      return false;
    }
    
    // Get non-SOL tokens from wallet analysis
    const walletTokens = walletAnalysis.tokens.filter(t => !t.isSOL);
    
    // Check if we have the same tokens selected
    const walletAddresses = new Set(walletTokens.map(t => t.mint));
    const portfolioAddresses = new Set(selectedTokens.keys());
    
    // Quick check: different number of tokens = not matching
    if (walletAddresses.size !== portfolioAddresses.size) {
      return false;
    }
    
    // Check if all addresses match
    for (const addr of walletAddresses) {
      if (!portfolioAddresses.has(addr)) {
        return false;
      }
    }
    
    return true;
  }, [walletAnalysis, selectedTokens]);

  // Show DIDI message when wallet analysis completes
  useEffect(() => {
    if (walletAnalysis && !walletAnalysisLoading && !hasShownWalletMessage && user?.wallet_address) {
      // Only show message if we have tokens and they don't already match the portfolio
      const hasTokens = walletAnalysis.tokens.filter(t => !t.isSOL).length > 0;
      
      if (hasTokens && !walletMatchesCurrentPortfolio) {
        // Show a subtle DIDI message
        const tokenCount = walletAnalysis.tokens.filter(t => !t.isSOL).length;
        const totalValue = walletAnalysis.portfolio.deployedValue;
        
        const messages = [
          `noticed you're holding ${tokenCount} token${tokenCount > 1 ? 's' : ''}. want to match your portfolio?`,
          `your wallet has $${totalValue.toFixed(0)} in tokens. shall we sync up?`,
          `found your holdings. the purple button is ready when you are.`,
          `wallet scan complete. ${tokenCount} token${tokenCount > 1 ? 's' : ''} detected.`
        ];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        
        toast(randomMessage, {
          duration: 6000,
          icon: '🤖',
          style: {
            background: '#1a1a2e',
            color: '#fff',
            border: '1px solid #7F00FF',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            fontFamily: 'monospace'
          },
        });
        
        setHasShownWalletMessage(true);
      }
    }
  }, [walletAnalysis, walletAnalysisLoading, hasShownWalletMessage, walletMatchesCurrentPortfolio, user?.wallet_address]);

  // Apply wallet analysis suggestions to portfolio
  const applyWalletSuggestions = useCallback(() => {
    if (!walletAnalysis || !walletAnalysis.tokens.length) {
      toast.error("No wallet data available");
      return;
    }

    // Clear current selections
    setSelectedTokens(new Map());
    
    // Calculate total value of tokens we can match
    let matchedValue = 0;
    let totalWalletValue = walletAnalysis.portfolio.deployedValue; // Excluding SOL
    const matchedTokens: Array<{ contractAddress: string; value: number; symbol: string }> = [];
    
    // Find matching tokens
    walletAnalysis.tokens.forEach((walletToken) => {
      if (walletToken.isSOL) return; // Skip SOL for now
      
      // Find matching token in our available list
      const matchingToken = memoizedTokens.find(
        (t) => t.contractAddress === walletToken.mint || t.address === walletToken.mint
      );
      
      if (matchingToken) {
        matchedValue += walletToken.value;
        matchedTokens.push({
          contractAddress: matchingToken.contractAddress || matchingToken.address,
          value: walletToken.value,
          symbol: walletToken.symbol
        });
      }
    });
    
    // Find SOL token in our list by its native mint address
    const SOL_MINT = "So11111111111111111111111111111111111111112";
    const solToken = memoizedTokens.find(
      (t) => (t.contractAddress === SOL_MINT || t.address === SOL_MINT)
    );
    
    // Calculate weights
    const newSelectedTokens = new Map<string, number>();
    let allocatedWeight = 0;
    
    // Allocate weights proportionally to matched tokens
    matchedTokens.forEach((token) => {
      const weight = Math.round((token.value / totalWalletValue) * 100);
      if (weight > 0) {
        newSelectedTokens.set(token.contractAddress, weight);
        allocatedWeight += weight;
      }
    });
    
    // Allocate remaining weight to SOL
    const remainingWeight = 100 - allocatedWeight;
    if (remainingWeight > 0 && solToken) {
      const solAddress = solToken.contractAddress || solToken.address;
      newSelectedTokens.set(solAddress, remainingWeight);
    }
    
    // Apply selections
    setSelectedTokens(newSelectedTokens);
    
    // Show summary toast
    toast.success("Portfolio suggestions applied", { duration: 3000 });
  }, [walletAnalysis, memoizedTokens]);

  // AI-powered token selection with smart allocation
  const applyAISuggestions = useCallback(async () => {
    setIsAIProcessing(true);
    
    try {
      // Filter tokens that have both logo and header images
      const eligibleTokens = memoizedTokens.filter(token => {
        const hasLogo = token.image_url || token.images?.imageUrl;
        const hasHeaderImage = token.header_image_url || token.images?.headerImage;
        return hasLogo && hasHeaderImage;
      });

      if (eligibleTokens.length === 0) {
        toast.error("No eligible tokens found for AI selection");
        return;
      }

      // Calculate remaining portfolio space
      const currentWeight = Array.from(selectedTokens.values()).reduce((sum, w) => sum + w, 0);
      const remainingWeight = 100 - currentWeight;

      if (remainingWeight < 1) {
        toast.error("Portfolio is already fully allocated");
        return;
      }

      // Simulate AI processing delay (3 seconds)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Determine number of tokens to select (2-4, but respect remaining weight limits)
      const minTokens = Math.min(2, Math.floor(remainingWeight / 1)); // At least 1% each
      const maxTokens = Math.min(4, Math.floor(remainingWeight / 1)); // At least 1% each
      
      if (minTokens < 1) {
        toast.error("Not enough remaining allocation for AI suggestions");
        return;
      }

      const numTokensToSelect = Math.floor(Math.random() * (maxTokens - minTokens + 1)) + minTokens;

      // Randomly select tokens
      const shuffled = [...eligibleTokens].sort(() => 0.5 - Math.random());
      const selectedAITokens = shuffled.slice(0, numTokensToSelect);

      // Allocate weights - distribute remaining weight among selected tokens
      const baseWeight = Math.floor(remainingWeight / numTokensToSelect);
      const extraWeight = remainingWeight % numTokensToSelect;

      // Create new selections map with existing selections
      const newSelectedTokens = new Map(selectedTokens);

      selectedAITokens.forEach((token, index) => {
        const tokenAddress = token.contractAddress || token.address;
        const weight = baseWeight + (index < extraWeight ? 1 : 0);
        newSelectedTokens.set(tokenAddress, weight);
      });

      // Apply the new selections
      setSelectedTokens(newSelectedTokens);

      toast.success("AI portfolio suggestions applied", { duration: 3000 });

    } catch (error) {
      console.error("AI suggestion error:", error);
      toast.error("Failed to generate AI suggestions");
    } finally {
      setIsAIProcessing(false);
    }
  }, [memoizedTokens, selectedTokens]);

  // Clone any wallet functionality
  const handleCloneWallet = useCallback(async () => {
    if (!inputWalletAddress.trim()) {
      toast.error("Please enter a wallet address");
      return;
    }

    // Basic Solana address validation
    if (inputWalletAddress.length < 32 || inputWalletAddress.length > 44) {
      toast.error("Invalid wallet address format");
      return;
    }

    setIsAnalyzingWallet(true);
    
    try {
      // TODO: Replace with public endpoint when available
      const response = await fetch(`https://degenduel.me/api/wallet-analysis/${inputWalletAddress}`);
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please wait a moment before trying again.");
        }
        throw new Error("Failed to analyze wallet");
      }

      const walletData = await response.json();
      
      if (!walletData.tokens || walletData.tokens.length === 0) {
        toast.error("No tradeable tokens found in this wallet");
        return;
      }

      // Apply the same logic as wallet suggestions but for the input wallet
      setSelectedTokens(new Map());
      
      let matchedValue = 0;
      let totalWalletValue = walletData.portfolio.deployedValue;
      const matchedTokens: Array<{ contractAddress: string; value: number; symbol: string }> = [];
      
      walletData.tokens.forEach((walletToken: any) => {
        if (walletToken.isSOL) return;
        
        const matchingToken = memoizedTokens.find(
          (t) => t.contractAddress === walletToken.mint || t.address === walletToken.mint
        );
        
        if (matchingToken) {
          matchedValue += walletToken.value;
          matchedTokens.push({
            contractAddress: matchingToken.contractAddress || matchingToken.address,
            value: walletToken.value,
            symbol: walletToken.symbol
          });
        }
      });
      
      const SOL_MINT = "So11111111111111111111111111111111111111112";
      const solToken = memoizedTokens.find(
        (t) => (t.contractAddress === SOL_MINT || t.address === SOL_MINT)
      );
      
      const newSelectedTokens = new Map<string, number>();
      let allocatedWeight = 0;
      
      matchedTokens.forEach((token) => {
        const weight = Math.round((token.value / totalWalletValue) * 100);
        if (weight > 0) {
          newSelectedTokens.set(token.contractAddress, weight);
          allocatedWeight += weight;
        }
      });
      
      const remainingWeight = 100 - allocatedWeight;
      if (remainingWeight > 0 && solToken) {
        const solAddress = solToken.contractAddress || solToken.address;
        newSelectedTokens.set(solAddress, remainingWeight);
      }
      
      setSelectedTokens(newSelectedTokens);
      setShowWalletInput(false);
      setInputWalletAddress("");
      
      toast.success(`Cloned portfolio from ${inputWalletAddress.slice(0,6)}...${inputWalletAddress.slice(-4)}`, { duration: 3000 });

    } catch (error: any) {
      console.error("Clone wallet error:", error);
      toast.error(error.message || "Failed to analyze wallet");
    } finally {
      setIsAnalyzingWallet(false);
    }
  }, [inputWalletAddress, memoizedTokens]);


  // Enhanced token selection handler with offline support
  const handleTokenSelect = useCallback(
    (contractAddress: string) => {
      console.log("🔍 PortfolioTokenSelectionPage: handleTokenSelect called with:", {
        contractAddress,
        isOffline: isOfflineMode
      });

      // Early return if no valid contract address
      if (!contractAddress || typeof contractAddress !== 'string') {
        console.warn("Invalid contract address provided:", contractAddress);
        return;
      }

      const token = memoizedTokens.find(
        (t) => t.contractAddress === contractAddress,
      );
      console.log("Token being selected:", token);

      // Toggle selection with smart default weight
      setSelectedTokens((prev) => {
        const newSelectedTokens = new Map(prev);
        
        if (newSelectedTokens.has(contractAddress)) {
          // Token is already selected - remove it
          newSelectedTokens.delete(contractAddress);
          
          if (isOfflineMode) {
            setPendingSelections((pending) => {
              const newPending = new Map(pending);
              newPending.delete(contractAddress);
              return newPending;
            });
          }
          
          if (token) {
            toast.success(`${token.symbol} removed from portfolio`, { duration: 2000 });
          }
        } else {
          // Token not selected - add it with smart default weight
          const usedWeight = Array.from(newSelectedTokens.values()).reduce((sum, w) => sum + w, 0);
          const remainingWeight = 100 - usedWeight;
          
          let defaultWeight: number;
          if (remainingWeight >= 20) {
            defaultWeight = 20; // Give more meaningful chunk when plenty of space
          } else if (remainingWeight >= 10) {
            defaultWeight = 10; // Standard default when moderate space
          } else if (remainingWeight >= 5) {
            defaultWeight = remainingWeight; // Use all remaining when little space
          } else if (remainingWeight > 0) {
            defaultWeight = remainingWeight; // Use exactly what's left
          } else {
            // Portfolio full - show helpful error
            toast.error(`Portfolio is full (${usedWeight}%). Remove tokens or adjust weights first.`, { 
              duration: 4000 
            });
            return prev;
          }
          
          newSelectedTokens.set(contractAddress, defaultWeight);
          
          if (isOfflineMode) {
            setPendingSelections((pending) => {
              const newPending = new Map(pending);
              newPending.set(contractAddress, defaultWeight);
              return newPending;
            });
          }
          
          if (token) {
            toast.success(`${token.symbol} added with ${defaultWeight}% weight`, { duration: 2000 });
          }
        }
        
        return newSelectedTokens;
      });
    },
    [memoizedTokens, isOfflineMode],
  );

  // Handle weight changes for selected tokens
  const handleWeightChange = useCallback(
    (contractAddress: string, newWeight: number) => {
      console.log("🔍 PortfolioTokenSelectionPage: handleWeightChange called with:", {
        contractAddress,
        newWeight,
        isOffline: isOfflineMode
      });

      if (newWeight === 0) {
        // Weight set to 0 means remove the token
        handleTokenSelect(contractAddress);
        return;
      }

      setSelectedTokens((prev) => {
        const newSelectedTokens = new Map(prev);
        newSelectedTokens.set(contractAddress, newWeight);
        
        // Track offline changes for sync when reconnected
        if (isOfflineMode) {
          setPendingSelections((pending) => {
            const newPending = new Map(pending);
            newPending.set(contractAddress, newWeight);
            return newPending;
          });
        }
        
        return newSelectedTokens;
      });
    },
    [isOfflineMode, handleTokenSelect],
  );

  // Handle token search selection with smart weight calculation and top positioning
  const handleTokenSearchSelect = useCallback((token: SearchToken, customWeight?: number) => {
    // Find if this token exists in our current token list
    const existingToken = memoizedTokens.find(t => TokenHelpers.getAddress(t) === token.address);
    if (existingToken) {
      // Check if token is already selected
      if (selectedTokens.has(token.address)) {
        toast.error(`${token.symbol} is already in your portfolio`, { duration: 3000 });
        return;
      }
      
      // Calculate smart default weight based on remaining portfolio space
      const usedWeight = Array.from(selectedTokens.values()).reduce((sum, w) => sum + w, 0);
      const remainingWeight = 100 - usedWeight;
      
      let defaultWeight: number;
      if (customWeight) {
        defaultWeight = customWeight;
      } else if (remainingWeight >= 20) {
        defaultWeight = 20; // Give more meaningful chunk when plenty of space
      } else if (remainingWeight >= 10) {
        defaultWeight = 10; // Standard default when moderate space
      } else if (remainingWeight >= 5) {
        defaultWeight = remainingWeight; // Use all remaining when little space
      } else if (remainingWeight > 0) {
        defaultWeight = remainingWeight; // Use exactly what's left
      } else {
        // Portfolio full - show helpful error
        toast.error(`Portfolio is full (${usedWeight}%). Remove tokens or adjust weights first.`, { 
          duration: 4000 
        });
        return;
      }
      
      // Add token to selection - this will trigger memoizedTokens to reorder and put it at top
      handleTokenSelect(token.address);
      
      // Scroll to top so user can see the newly selected token
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
      
      toast.success(`Added ${token.symbol} with ${defaultWeight}% weight - now at top of list`, { 
        duration: 3000 
      });
    } else {
      // Token not in current data - add it from search data if possible
      console.log('Token not found in current token list, attempting to add from search data:', token);
      
      // A token without an address is not selectable. This check narrows the type.
      if (!token.address) {
        console.error("Cannot add a token without an address:", token);
        toast.error("Cannot add a token without a valid address.");
        return;
      }
      
      // Check if already selected by address
      if (selectedTokens.has(token.address)) {
        toast.error(`${token.symbol} is already in your portfolio`, { duration: 3000 });
        return;
      }
      
      // Calculate weight
      const usedWeight = Array.from(selectedTokens.values()).reduce((sum, w) => sum + w, 0);
      const remainingWeight = 100 - usedWeight;
      
      let defaultWeight: number;
      if (customWeight) {
        defaultWeight = customWeight;
      } else if (remainingWeight >= 20) {
        defaultWeight = 20;
      } else if (remainingWeight >= 10) {
        defaultWeight = 10;
      } else if (remainingWeight > 0) {
        defaultWeight = remainingWeight;
      } else {
        toast.error(`Portfolio is full (${usedWeight}%). Remove tokens first.`, { duration: 4000 });
        return;
      }
      
      // ============================================================================
      // SEARCH TOKEN SELECTION - FIXED
      // ============================================================================
      // We convert SearchToken to a Token object for compatibility.
      const newTokenForGrid: Token = {
        id: Date.now() + Math.random(), // Temporary unique ID for display
        address: token.address,
        contractAddress: token.address,
        symbol: token.symbol || 'UNKNOWN',
        name: token.name || 'Unknown Token',
        decimals: token.decimals || 9,
        image_url: token.image_url || '',
        price: token.price || 0,
        market_cap: token.market_cap || 0,
        volume_24h: token.volume_24h || 0,
        change_24h: token.change_24h || 0,
      };
      // Add the searched token to our map
      setSearchAddedTokens(prev => new Map(prev).set(token.address, newTokenForGrid));
      
      // Add the token to selectedTokens (this part works correctly)
      const newSelectedTokens = new Map(selectedTokens);
      newSelectedTokens.set(token.address, defaultWeight);
      setSelectedTokens(newSelectedTokens);
      
      // Scroll to top 
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
      
      toast.success(`Added ${token.symbol} with ${defaultWeight}% weight`, { 
        duration: 3000 
      });
    }
  }, [memoizedTokens, handleTokenSelect, selectedTokens]);

  // FIXED: Never block UI for connection issues when we have cached data
  const displayError = tokensError && memoizedTokens.length === 0 ? tokensError : null;

  console.log("🎯 PortfolioTokenSelectionPage: Render logic state:", {
    tokenListLoading,
    displayError,
    tokenCount: memoizedTokens.length,
    isTokenDataConnected,
    isOfflineMode,
    showOfflineIndicator
  });

  // Memoize portfolio calculations to prevent re-computation on every render
  const portfolioMetrics = useMemo(() => {
    const usedWeight = Array.from(selectedTokens.values()).reduce((sum, w) => sum + w, 0);
    const remainingWeight = 100 - usedWeight;
    return { usedWeight, remainingWeight };
  }, [selectedTokens]);

  // Memoized renderBackContent function to prevent re-renders
  const renderBackContent = useCallback((token: Token) => {
    const contractAddress = TokenHelpers.getAddress(token);
    const isSelected = selectedTokens.has(contractAddress);
    const currentWeight = selectedTokens.get(contractAddress) || 0;
    
    return (
      <PortfolioTokenCardBack
        token={token}
        isSelected={isSelected}
        currentWeight={currentWeight}
        remainingWeight={portfolioMetrics.remainingWeight}
        onToggleSelection={() => {
          if (isSelected) {
            handleTokenSelect(contractAddress);
          } else {
            // Add with default weight using pre-calculated values
            const { usedWeight, remainingWeight } = portfolioMetrics;
            const defaultWeight = remainingWeight >= 20 ? 20 : remainingWeight >= 10 ? 10 : remainingWeight;
            
            if (defaultWeight > 0) {
              setSelectedTokens(prev => {
                const newMap = new Map(prev);
                newMap.set(contractAddress, defaultWeight);
                return newMap;
              });
              toast.success(`${token.symbol} added with ${defaultWeight}% weight`, { duration: 2000 });
            } else {
              toast.error(`Portfolio is full (${usedWeight}%). Remove tokens first.`, { duration: 4000 });
            }
          }
        }}
        onWeightChange={(delta) => handleWeightChange(contractAddress, currentWeight + delta)}
      />
    );
  }, [selectedTokens, handleTokenSelect, handleWeightChange, portfolioMetrics]);

  // Show loading skeleton when we have no tokens and are loading
  if (tokenListLoading && memoizedTokens.length === 0) {
    console.log("⏳ PortfolioTokenSelectionPage: Rendering skeleton loading state (no cached tokens)");
    return (
      <div className="flex flex-col min-h-screen">
        {/* Content */}
        <div className="relative z-10">
          <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 relative">
            {/* Header */}
            <div className="mb-4 sm:mb-8 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 mb-2 font-mono">
                BUILD PORTFOLIO
              </h1>
              <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto font-mono">
                LOADING.TOKENS → PREPARING.SELECTION
              </p>
              
              {/* Enhanced loading indicator with retry */}
              <div className="mt-4 flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <div className={`w-2 h-2 rounded-full ${isTokenDataConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                  <span className={`font-mono ${isTokenDataConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isTokenDataConnected ? 
                      `LOADING.WEBSOCKET.DATA (${tokens.length}/1000)` : 
                      'CONNECTION.LOST'
                    }
                  </span>
                </div>
                
                {/* Manual retry button during loading */}
                <button
                  onClick={() => {
                    console.log("🔄 PortfolioTokenSelectionPage: Manual refresh triggered during loading");
                    refreshTokens();
                  }}
                  className="px-4 py-2 bg-emerald-600/20 border border-emerald-500/30 rounded text-emerald-400 text-sm font-mono hover:bg-emerald-600/30 transition-colors"
                >
                  [RETRY.CONNECTION]
                </button>
                
                {/* Show last update time if available */}
              </div>
            </div>

            {/* Skeleton Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 pb-24 lg:pb-0">
              <div className="lg:col-span-2">
                <Card className="bg-dark-200/30 backdrop-blur-sm border-emerald-500/20">
                  <div className="p-3 sm:p-6">
                    <div className="mb-4 flex justify-between items-center">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    
                    {/* Filters skeleton */}
                    <div className="mb-6 space-y-4">
                      <Skeleton className="h-10 w-full" />
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-8 w-32" />
                      </div>
                    </div>
                    
                    {/* Token grid skeleton */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <TokenCardSkeleton key={i} />
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
              
              {/* Portfolio summary skeleton */}
              <div className="hidden lg:block">
                <div className="sticky top-4">
                  <Card className="bg-dark-200/30 backdrop-blur-sm border-emerald-500/20">
                    <div className="p-4 sm:p-6">
                      <Skeleton className="h-6 w-40 mb-4" />
                      <div className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (displayError) {
    console.log("❌ PortfolioTokenSelectionPage: Rendering error state:", displayError);
    return (
      <div className="flex flex-col min-h-screen">
        <div className="relative z-10 max-w-2xl mx-auto mt-8 px-4">
          <div className="p-6 bg-dark-300/20 rounded-lg border border-red-500/30 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <span className="text-2xl flex-shrink-0">⚠️</span>
              <div className="flex-1">
                <h2 className="text-red-400 font-bold mb-2 font-mono">DATA.STREAM.ERROR</h2>
                <p className="text-red-400 mb-4 font-mono text-sm">{displayError}</p>
                
                {/* Connection diagnostics */}
                <div className="mb-4 p-3 bg-dark-400/30 rounded border border-red-500/20">
                  <div className="text-xs font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">WebSocket:</span>
                      <span className={isTokenDataConnected ? 'text-emerald-400' : 'text-red-400'}>
                        {isTokenDataConnected ? 'CONNECTED' : 'DISCONNECTED'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tokens Loaded:</span>
                      <span className="text-gray-300">{memoizedTokens.length}</span>
                    </div>
                    {lastUpdate && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Last Update:</span>
                        <span className="text-gray-300">{lastUpdate.toLocaleTimeString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      console.log("🔄 PortfolioTokenSelectionPage: Manual refresh triggered from error state");
                      refreshTokens();
                    }}
                    className="px-4 py-2 bg-red-600/20 border border-red-500/30 rounded text-red-400 text-sm font-mono hover:bg-red-600/30 transition-colors"
                  >
                    RETRY CONNECTION
                  </button>
                  
                  <button
                    onClick={() => {
                      console.log("🔄 PortfolioTokenSelectionPage: Hard refresh triggered");
                      window.location.reload();
                    }}
                    className="px-4 py-2 bg-gray-600/20 border border-gray-500/30 rounded text-gray-400 text-sm font-mono hover:bg-gray-600/30 transition-colors"
                  >
                    HARD REFRESH
                  </button>
                  
                  <button
                    onClick={() => {
                      console.log("🔄 PortfolioTokenSelectionPage: Navigate back to contests");
                      navigate('/contests');
                    }}
                    className="px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded text-blue-400 text-sm font-mono hover:bg-blue-600/30 transition-colors"
                  >
                    BACK TO CONTESTS
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log("✅ PortfolioTokenSelectionPage: Rendering main content with", memoizedTokens.length, "tokens");
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="flex flex-col min-h-screen">
        {/* User Info Banner */}
        <div className="bg-brand-500/10 border-b border-brand-500/30 px-4 py-3">
          <div className="flex items-center justify-between">
            {user?.wallet_address ? (
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                  <span className="text-brand-400">Logged in:</span>
                  <code className="bg-dark-600/50 px-2 py-1 rounded text-emerald-300 font-mono text-xs">
                    {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
                  </code>
                </div>
                
                {/* Connected Wallet Indicator */}
                {publicKey && (
                  <>
                    <span className="text-dark-300">|</span>
                    <div className="flex items-center gap-2">
                      <span className="text-brand-400">Connected:</span>
                      <code className={`px-2 py-1 rounded font-mono text-xs ${
                        publicKey.toBase58() === user.wallet_address 
                          ? "bg-dark-600/50 text-emerald-300" 
                          : "bg-red-600/20 text-red-300"
                      }`}>
                        {publicKey.toBase58().slice(0, 6)}...{publicKey.toBase58().slice(-4)}
                      </code>
                    </div>
                  </>
                )}
                
                {/* Mismatch Warning */}
                {publicKey && publicKey.toBase58() !== user.wallet_address && (
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-red-400 text-xs font-medium">⚠️ Wallet mismatch!</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-brand-400 text-sm">
                <span className="w-2 h-2 bg-brand-400 rounded-full"></span>
                <span>You can build portfolios without logging in! Enter the contest when you're ready.</span>
              </div>
            )}
            {!user?.wallet_address && (
              <div className="wallet-button-header">
                <WalletMultiButton />
                {connected && publicKey && !user?.wallet_address && (
                  <button
                    onClick={async () => {
                      try {
                        const walletAddress = publicKey.toBase58();
                        const signMessageWrapper = async (messageToSign: Uint8Array) => {
                          if (!signMessage) {
                            throw new Error('Wallet signing function not available.');
                          }
                          const signature = await signMessage(messageToSign);
                          return { signature }; 
                        };
                        
                        await auth.loginWithWallet(walletAddress, signMessageWrapper);
                        toast.success('Successfully logged in!');
                      } catch (error) {
                        console.error('Login error:', error);
                        toast.error('Login failed. Please try again.');
                      }
                    }}
                    className="px-3 py-1 bg-brand-500/20 rounded text-xs hover:bg-brand-500/30 transition-colors font-mono ml-2"
                  >
                    SIGN TO LOGIN
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Offline/Connection Status Banner */}
        {showOfflineIndicator && (
          <div className="bg-blue-500/10 border-b border-blue-500/30 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-400 text-sm">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                <span>Offline mode - selections saved locally ({memoizedTokens.length} tokens available)</span>
              </div>
              <div className="flex items-center gap-3">
                {lastUpdate && (
                  <span className="text-xs text-blue-300">
                    Data from: {lastUpdate.toLocaleTimeString()}
                  </span>
                )}
                {lastSyncTime && (
                  <span className="text-xs text-emerald-300">
                    Synced: {lastSyncTime.toLocaleTimeString()}
                  </span>
                )}
                <button
                  onClick={() => {
                    console.log("🔄 PortfolioTokenSelectionPage: Manual retry from offline banner");
                    refreshTokens();
                  }}
                  className="px-3 py-1 bg-blue-500/20 rounded text-xs hover:bg-blue-500/30 transition-colors font-mono"
                >
                  RECONNECT
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading indicator when refreshing data */}
        {tokenListLoading && memoizedTokens.length > 0 && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/30 px-4 py-2">
            <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm">
              <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin"></div>
              <span className="font-mono">Updating token data...</span>
            </div>
          </div>
        )}
        
        {/* Content Section */}
        <div className="relative z-10">
          <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 relative">
            {/* Header Section - Different styling */}
            <div className="mb-4 sm:mb-8 text-center relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-emerald-400/5 to-emerald-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 mb-2 font-mono">
                BUILD PORTFOLIO
              </h1>
              <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto font-mono">
                SELECT TOKENS → ALLOCATE WEIGHTS → DEPLOY STRATEGY
              </p>
              
              {/* Connection status indicator */}
              <div className="mt-2 flex justify-center items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isTokenDataConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                  <span className={`font-mono ${isTokenDataConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isTokenDataConnected ? 'LIVE DATA STREAM' : 'CONNECTION LOST'}
                  </span>
                </div>
                
              </div>
            </div>

            {/* Wallet Status Indicator */}
            {user?.wallet_address && (
              <div className="mb-4 p-3 bg-dark-600/50 border border-brand-500/20 rounded-lg max-w-2xl mx-auto">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Account:</span>
                      <code className="bg-dark-700/50 px-2 py-1 rounded text-emerald-300 font-mono text-xs">
                        {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
                      </code>
                    </div>
                    
                    {publicKey && (
                      <>
                        <span className="text-dark-400">•</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">Wallet:</span>
                          <code className={`px-2 py-1 rounded font-mono text-xs ${
                            publicKey.toBase58() === user.wallet_address 
                              ? "bg-dark-700/50 text-emerald-300" 
                              : "bg-red-600/20 text-red-300 animate-pulse"
                          }`}>
                            {publicKey.toBase58().slice(0, 6)}...{publicKey.toBase58().slice(-4)}
                          </code>
                        </div>
                      </>
                    )}
                    
                    {/* Enhanced wallet mismatch warning - only show if actually connected with wrong wallet */}
                    {(connected && publicKey && publicKey.toBase58() !== user.wallet_address) ? (
                      <div className="flex items-center gap-2 ml-2 px-2 py-1 bg-red-600/20 rounded animate-pulse">
                        <span className="text-red-400 text-xs font-medium">
                          ⚠️ Wrong wallet connected! Expected: {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
                        </span>
                      </div>
                    ) : null}
                  </div>
                  
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-8 pb-24 lg:pb-0">
              {/* Token Selection Area - Different card styling */}
              <div className="lg:col-span-3">
                <Card className="bg-dark-200/30 backdrop-blur-sm border-emerald-500/20 hover:border-emerald-400/30 transition-colors group relative overflow-hidden">
                  {/* Different gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 via-transparent to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-r from-dark-300/0 via-emerald-500/5 to-dark-300/0 opacity-0 group-hover:opacity-100" />
                  
                  <div className="p-3 sm:p-6 relative">
                    {/* Header with token count */}
                    <div className="mb-4 flex justify-between items-center">
                      <h2 className="text-lg font-bold text-emerald-400 font-mono">
                        TOKEN SELECTION
                      </h2>
                      {/* Smart Portfolio Buttons - Prominent placement */}
                      <div className="flex gap-2">
                        {/* Wallet Analysis Button - Always shows if user is logged in */}
                        {user?.wallet_address ? (
                          <Button
                            onClick={walletAnalysisLoading || !walletAnalysis ? undefined : applyWalletSuggestions}
                            disabled={walletAnalysisLoading || !walletAnalysis?.tokens?.length}
                            className={`px-3 py-2 text-sm font-bold transition-all duration-300 shadow-lg ${
                              walletAnalysisLoading
                                ? 'bg-gradient-to-r from-gray-600 to-gray-700 border-gray-600 text-gray-300'
                                : walletAnalysis?.tokens?.length
                                ? walletMatchesCurrentPortfolio
                                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 border-green-500 text-white hover:shadow-green-500/25'
                                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-purple-500 text-white hover:shadow-purple-500/25 animate-pulse hover:animate-none'
                                : 'bg-gradient-to-r from-gray-600 to-gray-700 border-gray-600 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            <span className="font-mono text-xs">
                              {walletAnalysisLoading 
                                ? "ANALYZING..." 
                                : walletAnalysis?.tokens?.length 
                                ? walletMatchesCurrentPortfolio
                                  ? "ALREADY MATCHED"
                                  : "MATCH MY BAGS"
                                : "NO WALLET DATA"
                              }
                            </span>
                          </Button>
                        ) : null}
                        
                        {/* AI Selection Button - Always available */}
                        <Button
                          onClick={applyAISuggestions}
                          disabled={isAIProcessing}
                          className="px-3 py-2 text-sm font-bold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 border-blue-500 text-white shadow-lg hover:shadow-blue-500/25 transition-all duration-200"
                        >
                          <span className="font-mono text-xs">
                            {isAIProcessing ? "THINKING..." : "LET DIDI PICK"}
                          </span>
                        </Button>

                        {/* Clone Wallet Button - Always available */}
                        <Button
                          onClick={() => setShowWalletInput(!showWalletInput)}
                          disabled={isAnalyzingWallet}
                          className="px-3 py-2 text-sm font-bold bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 border-orange-500 text-white shadow-lg hover:shadow-orange-500/25 transition-all duration-200"
                        >
                          <span className="font-mono text-xs">
                            {isAnalyzingWallet ? "ANALYZING..." : "CLONE WALLET"}
                          </span>
                        </Button>
                        
                        {/* Token count - only show when no user is logged in */}
                        {!user?.wallet_address && (
                          <div className="text-xs font-mono text-gray-400 flex items-center ml-2">
                            AVAILABLE: <span className="text-emerald-400">{sortedTokens.length}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Wallet Address Input - Inline Expansion */}
                    {showWalletInput && (
                      <div className="mb-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                        <div className="flex flex-col gap-3">
                          <div className="text-sm font-mono text-orange-400">
                            Enter any Solana wallet address to clone their portfolio:
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={inputWalletAddress}
                              onChange={(e) => setInputWalletAddress(e.target.value)}
                              placeholder="Enter wallet address (e.g., BRANCHVDL53igBiYuvrEfZazXJm24qKQJhyXBUm7z7V)"
                              className="flex-1 px-3 py-2 bg-dark-300/70 border border-orange-500/30 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-orange-400"
                              disabled={isAnalyzingWallet}
                            />
                            <Button
                              onClick={handleCloneWallet}
                              disabled={isAnalyzingWallet || !inputWalletAddress.trim()}
                              className="px-4 py-2 text-sm font-bold bg-orange-600 hover:bg-orange-500 border-orange-500 text-white"
                            >
                              <span className="font-mono">
                                {isAnalyzingWallet ? "CLONING..." : "CLONE"}
                              </span>
                            </Button>
                            <Button
                              onClick={() => {
                                setShowWalletInput(false);
                                setInputWalletAddress("");
                              }}
                              className="px-3 py-2 text-sm bg-gray-600 hover:bg-gray-500 border-gray-500 text-white"
                              disabled={isAnalyzingWallet}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Simplified Filters - Only search and view mode */}
                    <div className="mb-4 sm:mb-6 space-y-4">
                      <TokenFilters
                        onTokenSearchSelect={handleTokenSearchSelect}
                        sortBy={sortBy}
                        onSortChange={handleSortChange}
                      />
                      
                      {/* View Mode Toggle */}
                      <div className="inline-flex bg-dark-300/50 rounded-lg p-1">
                        <button
                          onClick={() => {
                            setViewMode('list');
                            localStorage.setItem('portfolioViewMode', 'list');
                          }}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                            viewMode === 'list'
                              ? 'bg-brand-500 text-white shadow-sm'
                              : 'text-gray-400 hover:text-gray-300'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setViewMode('grid');
                            localStorage.setItem('portfolioViewMode', 'grid');
                          }}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                            viewMode === 'grid'
                              ? 'bg-brand-500 text-white shadow-sm'
                              : 'text-gray-400 hover:text-gray-300'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* DEBUG PANEL - Contest Data (Super Admin + Development Only) */}
                    {contest && isSuperAdmin && process.env.NODE_ENV === 'development' && (
                      <div className="mb-4 p-4 bg-dark-300/50 border border-yellow-500/30 rounded-lg">
                        <div 
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => setDebugPanelCollapsed(!debugPanelCollapsed)}
                        >
                          <h3 className="text-yellow-400 font-mono font-bold">
                            {debugPanelCollapsed ? '▶' : '▼'} 🐛 DEBUG: Contest Data
                          </h3>
                          <span className="text-xs text-gray-400">Click to {debugPanelCollapsed ? 'expand' : 'collapse'}</span>
                        </div>
                        {!debugPanelCollapsed && (
                          <div className="grid grid-cols-2 gap-2 text-xs font-mono mt-4">
                          <div className="text-gray-400">ID:</div>
                          <div className="text-white">{contest.id}</div>
                          
                          <div className="text-gray-400">Name:</div>
                          <div className="text-white">{contest.name}</div>
                          
                          <div className="text-gray-400">Status:</div>
                          <div className="text-white">{contest.status}</div>
                          
                          <div className="text-gray-400">Type:</div>
                          <div className="text-white">{contest.status}</div>
                          
                          <div className="text-gray-400">Entry Fee:</div>
                          <div className="text-white">{contest.entry_fee}</div>
                          
                          <div className="text-gray-400">Start Time:</div>
                          <div className="text-white">{new Date(contest.start_time).toLocaleString()}</div>
                          
                          <div className="text-gray-400">End Time:</div>
                          <div className="text-white">{new Date(contest.end_time).toLocaleString()}</div>
                          
                          <div className="text-gray-400">Prize Pool:</div>
                          <div className="text-white">{contest.prize_pool}</div>
                          
                          <div className="text-gray-400">Max Tokens:</div>
                          <div className="text-white">{contest.max_participants}</div>
                          
                          <div className="text-gray-400">Participants:</div>
                          <div className="text-white">{contest.participant_count} / {contest.max_participants || '∞'}</div>
                          
                          <div className="text-gray-400">Is Participating:</div>
                          <div className={contest.is_participating ? 'text-green-400' : 'text-red-400'}>
                            {contest.is_participating ? 'YES' : 'NO'}
                          </div>
                          
                          <div className="text-gray-400">Has Portfolio:</div>
                          <div className={hasExistingPortfolio ? 'text-green-400' : 'text-red-400'}>
                            {hasExistingPortfolio ? 'YES' : 'NO'}
                          </div>
                          
                          <div className="text-gray-400">Raw Data:</div>
                          <div className="col-span-2 text-white text-[10px] overflow-auto max-h-32 bg-dark-400/50 p-2 rounded mt-1">
                            <pre>{JSON.stringify(contest, null, 2)}</pre>
                          </div>
                        </div>
                        )}
                      </div>
                    )}

                    {/* Wallet Analysis Debug Panel - Super Admin + Development Only */}
                    {isSuperAdmin && process.env.NODE_ENV === 'development' && user?.wallet_address && (
                      <div className="mb-4 p-4 bg-dark-300/50 border border-blue-500/30 rounded-lg">
                        <div 
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => setWalletDebugCollapsed(!walletDebugCollapsed)}
                        >
                          <h3 className="text-blue-400 font-mono font-bold">
                            {walletDebugCollapsed ? '▶' : '▼'} 💰 DEBUG: Wallet Analysis
                          </h3>
                          <span className="text-xs text-gray-400">Click to {walletDebugCollapsed ? 'expand' : 'collapse'}</span>
                        </div>
                        {!walletDebugCollapsed && (
                          <div className="mt-4 space-y-4">
                            {/* Connection Status */}
                            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                              <div className="text-gray-400">Loading:</div>
                              <div className={walletAnalysisLoading ? 'text-yellow-400' : 'text-gray-300'}>
                                {walletAnalysisLoading ? 'YES' : 'NO'}
                              </div>
                              
                              <div className="text-gray-400">Error:</div>
                              <div className={walletAnalysisError ? 'text-red-400' : 'text-green-400'}>
                                {walletAnalysisError ? 'YES' : 'NO'}
                              </div>
                              
                              <div className="text-gray-400">Data Loaded:</div>
                              <div className={walletAnalysis ? 'text-green-400' : 'text-red-400'}>
                                {walletAnalysis ? 'YES' : 'NO'}
                              </div>
                              
                              {walletAnalysis && (
                                <>
                                  <div className="text-gray-400">Total Value:</div>
                                  <div className="text-emerald-400">
                                    ${walletAnalysis.portfolio.totalValue.toFixed(2)}
                                  </div>
                                  
                                  <div className="text-gray-400">Tokens Found:</div>
                                  <div className="text-blue-400">
                                    {walletAnalysis.tokens.length}
                                  </div>
                                  
                                  <div className="text-gray-400">Processing Time:</div>
                                  <div className="text-gray-300">
                                    {walletAnalysis.metadata.processing_time_ms}ms
                                  </div>
                                </>
                              )}
                            </div>
                            
                            {/* Error Details */}
                            {walletAnalysisError && (
                              <div className="text-red-400 text-xs font-mono bg-red-500/10 p-2 rounded">
                                {walletAnalysisError.message}
                              </div>
                            )}
                            
                            {/* Raw Data */}
                            {walletAnalysis && (
                              <div>
                                <div className="text-gray-400 text-xs font-mono mb-2">Raw Data:</div>
                                <div className="text-white text-[10px] overflow-auto max-h-32 bg-dark-400/50 p-2 rounded">
                                  <pre>{JSON.stringify(walletAnalysis, null, 2)}</pre>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* DEBUG PANEL - Token Data (Super Admin + Development Only) */}
                    {isSuperAdmin && process.env.NODE_ENV === 'development' && (
                      <div className="mb-4 p-4 bg-dark-300/50 border border-purple-500/30 rounded-lg">
                        <div 
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => setTokenDebugCollapsed(!tokenDebugCollapsed)}
                        >
                          <h3 className="text-purple-400 font-mono font-bold">
                            {tokenDebugCollapsed ? '▶' : '▼'} 🪙 DEBUG: Token Data
                          </h3>
                          <span className="text-xs text-gray-400">Click to {tokenDebugCollapsed ? 'expand' : 'collapse'}</span>
                        </div>
                        {!tokenDebugCollapsed && (
                          <div className="grid grid-cols-2 gap-2 text-xs font-mono mt-4">
                            <div className="text-gray-400">Main Tokens:</div>
                            <div className="text-white">{mainTokens.length}</div>
                            
                            <div className="text-gray-400">Special Tokens:</div>
                            <div className="text-white">{specialTokens.length}</div>
                            
                            <div className="text-gray-400">Search Added Tokens:</div>
                            <div className="text-white">{searchAddedTokens.size}</div>
                            
                            <div className="text-gray-400">All Tokens (merged):</div>
                            <div className="text-white">{allTokens.length}</div>
                            
                            <div className="text-gray-400">Visible Tokens:</div>
                            <div className="text-white">{visibleTokens.length}</div>
                            
                            <div className="text-gray-400">Display Count:</div>
                            <div className="text-white">{displayCount}</div>
                            
                            <div className="text-gray-400">Total Token Count:</div>
                            <div className="text-white">{totalTokenCount}</div>
                            
                            <div className="text-gray-400 col-span-2 mt-2">Token Positions:</div>
                            <div className="col-span-2 text-white text-[10px] overflow-auto max-h-32 bg-dark-400/50 p-2 rounded">
                              {visibleTokens.slice(0, 40).map((token, idx) => (
                                <div key={idx}>
                                  {idx + 1}: {token.symbol} ({token.contractAddress?.slice(0, 8)}...)
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Token Display - Grid or List based on view mode */}
                    <div className="relative">
                      {viewMode === 'grid' ? (
                        <CreativeTokensGrid
                          tokens={visibleTokens}
                          backContent="portfolio"
                          selectedTokens={selectedTokens}
                          renderBackContent={renderBackContent}
                        />
                      ) : (
                        <TokenSelectionList
                          tokens={visibleTokens}
                          selectedTokens={selectedTokens}
                          onTokenSelect={handleTokenSelect}
                          onWeightChange={(contractAddress, newWeight) => {
                            setSelectedTokens(prev => {
                              const newMap = new Map(prev);
                              if (newWeight === 0) {
                                newMap.delete(contractAddress);
                              } else {
                                newMap.set(contractAddress, newWeight);
                              }
                              return newMap;
                            });
                          }}
                          remainingWeight={portfolioMetrics.remainingWeight}
                        />
                      )}
                      
                      {/* Load More Trigger - Subtle infinite scroll indicator */}
                      {hasMoreTokens && (
                        <div 
                          ref={loadMoreTriggerRef}
                          className="relative py-12"
                        >
                          <div className="flex items-center justify-center">
                            {isLoadingMore ? (
                              <div className="flex items-center gap-3">
                                <div className="flex gap-1">
                                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse delay-75"></div>
                                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse delay-150"></div>
                                </div>
                                <span className="text-sm text-gray-400">Loading more tokens...</span>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500">
                                Scroll for more • Showing {visibleTokens.length} of {sortedTokens.length} tokens
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Portfolio Summary - Different styling */}
              <div className="hidden lg:block lg:col-span-2">
                <div className="sticky top-4">
                  <Card className="bg-dark-200/30 backdrop-blur-sm border-emerald-500/20 hover:border-emerald-400/30 transition-colors group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 via-transparent to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="p-4 sm:p-6 relative">
                      <h2 className="text-lg sm:text-xl font-bold text-emerald-400 mb-4 font-mono">
                        PORTFOLIO DEPLOY
                      </h2>
                      
                      {/* Contest Type Indicator - Moved here */}
                      {contest && (() => {
                        const entryFeeValue = parseDecimalValue(contest.entry_fee);
                        const isFree = entryFeeValue === 0;
                        
                        return (
                          <div className={`mb-4 p-3 rounded-lg border ${isFree ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-brand-500/10 border-brand-500/30'}`}>
                            <div className="flex items-center gap-3 text-sm">
                              <div className={`flex items-center justify-center w-5 h-5 rounded-full ${isFree ? 'bg-emerald-500/20' : 'bg-brand-500/20'}`}>
                                <span className={`text-xs ${isFree ? 'text-emerald-400' : 'text-brand-400'}`}>
                                  {isFree ? '✓' : '$'}
                                </span>
                              </div>
                              <div className="flex-1">
                                <span className={`font-medium ${isFree ? 'text-emerald-300' : 'text-brand-300'}`}>
                                  {isFree ? 'Free Contest' : 'Paid Contest'}
                                </span>
                                <span className="text-gray-400 ml-2">
                                  {isFree ? 'No entry fee required' : `${entryFeeValue} SOL entry fee`}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                      
                      <PortfolioSummary
                        selectedTokens={selectedTokens}
                        tokens={sortedTokens}
                        onWeightChange={handleWeightChange}
                        onRemoveToken={(contractAddress) => handleTokenSelect(contractAddress)}
                      />

                      <div className="mt-4 sm:mt-6">
                        {/* Transaction Status Indicator - Different styling */}
                        {/* Fixed: Removed "&& transactionState.status !== 'success'" condition that was preventing success status from showing */}
                        {/* The inner code was already checking for success status, so excluding it from the outer condition caused TS errors */}
                        {transactionState.status !== "idle" && (
                          <div
                            className={`mb-4 p-3 rounded-lg border font-mono text-xs ${
                              transactionState.status === "error"
                                ? "border-red-500/30 bg-red-500/10"
                                : transactionState.status === "success"
                                  ? "border-emerald-500/30 bg-emerald-500/10"
                                  : "border-emerald-500/30 bg-emerald-500/10"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {transactionState.status === "preparing" && (
                                <div className="animate-pulse text-emerald-400">
                                  PREP
                                </div>
                              )}
                              {transactionState.status === "signing" && (
                                <div className="animate-bounce text-emerald-400">
                                  SIGN
                                </div>
                              )}
                              {transactionState.status === "sending" && (
                                <div className="animate-spin text-emerald-400">
                                  SEND
                                </div>
                              )}
                              {transactionState.status === "confirming" && (
                                <div className="animate-pulse text-emerald-400">
                                  WAIT
                                </div>
                              )}
                              {transactionState.status === "submitting" && (
                                <div className="animate-pulse text-emerald-400">
                                  SUBMIT
                                </div>
                              )}
                              {transactionState.status === "success" && (
                                <div className="text-emerald-400">SUCCESS</div>
                              )}
                              {transactionState.status === "error" && (
                                <div className="text-red-400">ERROR</div>
                              )}
                              <div>
                                <p
                                  className={`font-medium ${
                                    transactionState.status === "error"
                                      ? "text-red-400"
                                      : transactionState.status === "success"
                                        ? "text-emerald-400"
                                        : "text-emerald-400"
                                  }`}
                                >
                                  {transactionState.message}
                                </p>
                                {transactionState.error && (
                                  <p className="text-xs text-red-400 mt-1">
                                    {transactionState.error}
                                  </p>
                                )}
                                {transactionState.signature && (
                                  <a
                                    href={`https://solscan.io/tx/${transactionState.signature}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-emerald-400 hover:text-emerald-300 mt-1 inline-block"
                                  >
                                    VIEW.ON.SOLSCAN
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Offline Status Indicator */}
                        {showOfflineIndicator && (
                          <div className="mb-4 p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                            <div className="flex items-center gap-2 text-xs font-mono">
                              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                              <span className="text-blue-300">OFFLINE MODE</span>
                              <span className="text-gray-500">•</span>
                              <span className="text-gray-400">
                                Selections saved locally
                              </span>
                            </div>
                          </div>
                        )}


                        {transactionState.status === "success" ? (
                          <div className="space-y-4">
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                              <div className="flex items-center justify-center mb-3">
                                <div className="text-4xl animate-bounce">🎉</div>
                              </div>
                              <h3 className="text-lg font-bold text-emerald-400 text-center mb-2">
                                {hasExistingPortfolio ? "Portfolio Updated!" : "Contest Entry Successful!"}
                              </h3>
                              <p className="text-sm text-gray-300 text-center mb-4">
                                {hasExistingPortfolio 
                                  ? "Your portfolio has been updated and changes are live!"
                                  : "Your portfolio has been submitted and you're now competing!"
                                }
                              </p>
                              {transactionState.signature && (
                                <div className="text-center mb-4">
                                  <a
                                    href={`https://solscan.io/tx/${transactionState.signature}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-emerald-400 hover:text-emerald-300 underline"
                                  >
                                    View transaction on Solscan →
                                  </a>
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  onClick={() => navigate(`/contests/${contestId}`)}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-sm"
                                >
                                  VIEW CONTEST
                                </Button>
                                <Button
                                  onClick={() => navigate('/contests')}
                                  className="bg-dark-400 hover:bg-dark-300 text-white font-mono text-sm"
                                >
                                  BROWSE MORE
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            {portfolioValidation && (
                              <div className="mb-3 p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                                <div className="flex items-center justify-center gap-2 text-xs text-orange-300">
                                  <span className="text-orange-400">⚡</span>
                                  <span className="font-medium">{portfolioValidation}</span>
                                </div>
                              </div>
                            )}
                            
                            
                            <Button
                              onClick={handlePreviewPortfolio}
                              disabled={
                                contestLoading ||
                                loadingEntryStatus ||
                                portfolioValidation !== null ||
                                isLoading ||
                                transactionState.status !== "idle"
                              }
                              className="w-full relative group overflow-hidden text-sm sm:text-base py-3 bg-emerald-600 hover:bg-emerald-500 border-emerald-500"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-emerald-500/20 to-emerald-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                              <span className="relative flex items-center justify-center font-medium font-mono">
                                {isLoading ? (
                                  <div>
                                    DEPLOYING...
                                  </div>
                                ) : user?.wallet_address ? (
                                  (console.log("Button render state:", { hasExistingPortfolio, user: user?.wallet_address }), 
                                  hasExistingPortfolio ? "UPDATE PORTFOLIO" : "PREVIEW PORTFOLIO")
                                ) : (
                                  "BUILD PORTFOLIO"
                                )}
                              </span>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>

            {/* Floating Submit Button for Mobile - Different styling */}
            <div 
              className="lg:hidden fixed left-0 right-0 px-4 bg-gradient-to-t from-dark-100 to-transparent z-50 transition-all duration-300 max-w-md mx-auto"
              style={{ bottom: isCompact ? '48px' : '88px' }}
            >
                {transactionState.status === "success" ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-center mb-2">
                      <div className="text-3xl">🎉</div>
                    </div>
                    <h3 className="text-base font-bold text-emerald-400 text-center mb-2">
                      {hasExistingPortfolio ? "Updated!" : "Entry Successful!"}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => navigate(`/contests/${contestId}`)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs py-2"
                      >
                        VIEW
                      </Button>
                      <Button
                        onClick={() => navigate('/contests')}
                        className="bg-dark-400 hover:bg-dark-300 text-white font-mono text-xs py-2"
                      >
                        MORE
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Button
                      onClick={handlePreviewPortfolio}
                      disabled={
                        contestLoading ||
                        loadingEntryStatus ||
                        portfolioValidation !== null ||
                        isLoading ||
                        transactionState.status !== "idle"
                      }
                      className={`w-full relative group overflow-hidden text-sm py-4 shadow-lg transition-all duration-300 ${
                        totalWeight > 100
                          ? "shadow-red-500/20 bg-red-600 hover:bg-red-500 border-red-500"
                          : "shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-500 border-emerald-500"
                      }`}
                    >
                      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                        totalWeight > 100
                          ? "bg-gradient-to-r from-red-400/20 via-red-500/20 to-red-600/20"
                          : "bg-gradient-to-r from-emerald-400/20 via-emerald-500/20 to-emerald-600/20"
                      }`} />
                      <span className="relative flex items-center justify-center gap-2 font-mono">
                        {isLoading ? (
                          <div>DEPLOYING...</div>
                        ) : user?.wallet_address ? (
                          <>
                            <span className="font-medium">PREVIEW</span>
                            <span className={totalWeight > 100 ? "text-red-200 font-bold" : "text-emerald-400"}>{totalWeight}%</span>
                          </>
                        ) : (
                          <>
                            <span className="font-medium">BUILD</span>
                            <span className={totalWeight > 100 ? "text-red-200 font-bold" : "text-emerald-400"}>{totalWeight}%</span>
                          </>
                        )}
                      </span>
                    </Button>
                    <div className="mt-2 h-8">
                      {portfolioValidation && (
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg py-2 px-3">
                          <div className="flex items-center justify-center gap-2 text-xs text-orange-300">
                            <span className="text-orange-400">⚡</span>
                            <span className="font-medium">{portfolioValidation}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Custom CSS for matrix rain effect */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes matrix-rain {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100vh); }
          }
        `
      }} />

      {/* Portfolio Preview Modal */}
      <PortfolioPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        source="recent"
        summary={portfolioSummary}
        portfolioDetails={portfolioDetails}
        onConfirm={() => {
          setShowPreviewModal(false);
          handleSubmit();
        }}
      />
    </ErrorBoundary>
  );
};

export default PortfolioTokenSelectionPage;
