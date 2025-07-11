// src/pages/public/tokens/TokensPage.tsx

import { RefreshCw } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { TokenSearch } from "../../../components/common/TokenSearch";
import { ServerCrashDisplay } from "../../../components/common/ServerCrashDisplay";
import { AuthDebugPanel } from "../../../components/debug";
import { TokenErrorBoundary } from "../../../components/shared/TokenErrorBoundary";
import { AddTokenModal } from "../../../components/tokens-list/AddTokenModal";
import { CreativeTokensGrid } from "../../../components/tokens-list/CreativeTokensGrid";
import { Button } from "../../../components/ui/Button";
import { Card, CardContent } from "../../../components/ui/Card";
import { useBatchTokens } from "../../../hooks/websocket/topic-hooks/useBatchTokens";
import { useVisibleTokenSubscriptions } from "../../../hooks/websocket/topic-hooks/useVisibleTokenSubscriptions";
import { useStore } from "../../../store/useStore";
import { SearchToken, Token, TokenHelpers } from "../../../types";
import { resetToDefaultMeta } from "../../../utils/ogImageUtils";


/**
 * TokensPage - Production version using the UnifiedWebSocket system
 * through the useStandardizedTokenData hook
 */
export const TokensPage: React.FC = () => {
  // State initialization
  const [isAddTokenModalOpen, setIsAddTokenModalOpen] = useState(false);
  
  // Infinite scroll state
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Client-side pagination state
  const [displayCount, setDisplayCount] = useState(50); // Start by showing 50 tokens
  const TOKENS_PER_PAGE = 50; // Load 50 more each time
  
  const user = useStore((state) => state.user);
  const location = useLocation();
  const navigate = useNavigate();
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);
  
  
  // Removed Jupiter filters - nobody cares about these
  
  // Sort state - Default to 24h change to show hot movers first! 🚀
  const [sortField, setSortField] = useState<string>("change");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  // Main tokens state
  const [mainTokens, setMainTokens] = useState<Token[]>([]);
  const [totalTokenCount, setTotalTokenCount] = useState(0);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  

  // Token selection handler - removed to enable card flipping
  // Cards will now flip instead of navigating

  // Modal close handler removed - no longer needed

  // Load more tokens - fetches next batch from API
  const loadMoreTokens = useCallback(async () => {
    if (isLoadingMore || mainTokens.length >= totalTokenCount) return;
    
    console.log('[TokensPage] Loading more tokens from API');
    setIsLoadingMore(true);
    
    try {
      // Calculate offset based on current tokens
      const offset = mainTokens.length;
      
      // Fetch next batch
      const response = await fetch(`/api/tokens/trending?limit=${TOKENS_PER_PAGE}&offset=${offset}&format=paginated`);
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
      console.error('[TokensPage] Failed to load more tokens:', err);
      // Don't set error state for pagination failures
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, mainTokens.length, totalTokenCount]);

  // Token selection logic removed - using dedicated pages now

  // NO CLIENT-SIDE SORTING - Trust backend order
  // Backend already sorted by degenduel_score (best to worst)

  // Special tokens addresses
  const SPECIAL_TOKEN_ADDRESSES = [
    'F4e7axJDGLk5WpNGEL2ZpxTP9STdk7L9iSoJX7utHHHX', // DUEL
    'So11111111111111111111111111111111111111112',     // SOL
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',   // USDC
    '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh'    // WBTC
  ];
  
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
        // Add special SOL banner
        if (address === 'So11111111111111111111111111111111111111112') {
          tokens.push({
            ...token,
            header_image_url: '/assets/media/sol_banner.png'
          });
        } else {
          tokens.push(token);
        }
      }
    }
    return tokens;
  }, [specialTokensMap]);
  
  // All tokens including special ones
  const allTokens = mainTokens;
  
  // Combined loading state
  const isCombinedLoading = isInitialLoading || specialTokensLoading;
  
  // Initial load - fetch first batch of tokens
  useEffect(() => {
    const loadInitialTokens = async () => {
      try {
        setIsInitialLoading(true);
        setError(null);
        
        console.log('[TokensPage] Loading initial tokens via trending API');
        
        // Fetch first batch with fixed initial limit
        const response = await fetch(`/api/tokens/trending?limit=50&offset=0&format=paginated`);
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
        console.error('[TokensPage] Failed to load initial tokens:', err);
        setError(err.message || 'Failed to load tokens');
      } finally {
        setIsInitialLoading(false);
      }
    };
    
    loadInitialTokens();
  }, []); // Only run once on mount

  // Sort all tokens by the selected field
  const sortedTokens = useMemo(() => {
    if (!allTokens || allTokens.length === 0) return [];
    
    // Filter tokens by minimum market cap of $100,000
    const filtered = allTokens.filter(token => {
      const marketCap = Number(token.market_cap) || 0;
      return marketCap >= 100000;
    });
    
    // Sort filtered tokens by the selected field
    const sorted = [...filtered].sort((a, b) => {
      let compareValue = 0;
      
      switch (sortField) {
        case "degenduelScore":
          // Keep original backend order
          return 0;
        case "marketCap":
          compareValue = (Number(b.market_cap) || 0) - (Number(a.market_cap) || 0);
          break;
        case "volume":
          compareValue = (Number(b.volume_24h) || 0) - (Number(a.volume_24h) || 0);
          break;
        case "price":
          compareValue = (Number(b.price) || 0) - (Number(a.price) || 0);
          break;
        case "change":
          // Sort by 24h change percentage (percent gain)
          compareValue = (Number(b.change_24h) || 0) - (Number(a.change_24h) || 0);
          break;
        default:
          return 0;
      }
      
      // Apply sort direction
      return sortDirection === "desc" ? compareValue : -compareValue;
    });
    
    return sorted;
  }, [allTokens, sortField, sortDirection]);

  // All tokens sorted (but not all displayed)
  const allSortedTokens = useMemo(() => {
    // Filter out special tokens from the regular list
    const specialAddresses = specialTokens.map(t => t.contractAddress?.toLowerCase());
    const filteredTokens = sortedTokens.filter(t => 
      !specialAddresses.includes(t.contractAddress?.toLowerCase())
    );
    
    // Prepend special tokens in order: DUEL, SOL, USDC, WBTC
    const orderedSpecialTokens = [];
    const specialOrder = ['DUEL', 'SOL', 'USDC', 'WBTC'];
    
    for (const symbol of specialOrder) {
      const token = specialTokens.find(t => t.symbol === symbol);
      if (token) {
        orderedSpecialTokens.push(token);
      }
    }
    
    return [...orderedSpecialTokens, ...filteredTokens];
  }, [sortedTokens, specialTokens]);
  
  // Visible tokens - only show up to displayCount
  const visibleTokens = useMemo(() => {
    return allSortedTokens.slice(0, displayCount);
  }, [allSortedTokens, displayCount]);

  // Handle token updates from WebSocket
  const handleTokenUpdate = useCallback((updatedToken: Token) => {
    setMainTokens(prev => prev.map(token => 
      (token.address === updatedToken.address || token.contractAddress === updatedToken.contractAddress) 
        ? updatedToken 
        : token
    ));
  }, []);

  // Subscribe to visible tokens for real-time price updates
  useVisibleTokenSubscriptions({
    tokens: visibleTokens,
    onTokenUpdate: handleTokenUpdate,
    enabled: true
  });

  // Check if there are more tokens to load from server
  const hasMoreTokens = mainTokens.length < totalTokenCount;

  // NO CLIENT-SIDE SEARCH/FILTERING - Backend handles everything

  // Parse URL parameters for token selection - redirect to dedicated page
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenAddress = params.get('address');
    const tokenSymbol = params.get('symbol'); // For backward compatibility
    
    if (tokenAddress || tokenSymbol) {
      // Find the token to get its symbol for the URL
      const token = allTokens.find(t => 
        t.symbol?.toLowerCase() === (tokenAddress || tokenSymbol || '').toLowerCase() ||
        t.contractAddress?.toLowerCase() === (tokenAddress || tokenSymbol || '').toLowerCase()
      );
      
      if (token) {
        // Redirect to the dedicated token page using contract address
        navigate(`/tokens/${TokenHelpers.getAddress(token)}`, { replace: true });
      } else {
        // If token not found, clear the URL parameters
        navigate(location.pathname, { replace: true });
      }
    }
  }, [location.search, allTokens, navigate, location.pathname]);
  
  // Setup OG meta tags
  useEffect(() => {
    // Setup page title and meta tags
    document.title = "Tokens | DegenDuel";

    return () => {
      // Reset to default meta tags when leaving the page
      resetToDefaultMeta();
    };
  }, []);

  // Set up infinite scroll observer
  useEffect(() => {
    if (!loadMoreTriggerRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreTokens && !isLoadingMore && !isCombinedLoading) {
          console.log('[TokensPage] Intersection detected, loading more tokens');
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
  }, [hasMoreTokens, isLoadingMore, isCombinedLoading, loadMoreTokens]);

  // Note: handleSearchChange removed since we now use TokenSearch component

  // Handle sort change
  const handleSortChange = useCallback((field: string, direction: "asc" | "desc") => {
    setSortField(field);
    setSortDirection(direction);
  }, []);

  // Refresh data
  const handleRefresh = useCallback(async () => {
    console.log('[TokensPage] Manual refresh triggered');
    
    // Reset everything and trigger fresh load
    setMainTokens([]);
    setDisplayCount(50);
    setTotalTokenCount(0);
    
    // Reload initial tokens
    try {
      setIsInitialLoading(true);
      setError(null);
      
      const response = await fetch(`/api/tokens/trending?limit=50&offset=0&format=paginated`);
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
      console.error('[TokensPage] Failed to refresh tokens:', err);
      setError(err.message || 'Failed to load tokens');
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  // Handle token search selection
  const handleTokenSearchSelect = useCallback((token: SearchToken) => {
    // Navigate to the token detail page using contract address
    if (token.address) {
      navigate(`/tokens/${token.address}`);
    } else {
      console.warn('Token search result missing address:', token);
    }
  }, [navigate]);

  return (
    <TokenErrorBoundary>
      <div className="flex flex-col min-h-screen">
      {/* Admin Debug Panel - Show only for admin users */}
      {user && typeof user === 'object' && 'isAdministrator' in user && user.isAdministrator === true && (
        <>
          <AuthDebugPanel />
          {/* Pagination Debug Info */}
          {totalTokenCount > 0 && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-xs font-mono">
                <div className="text-blue-300">📊 Pagination Debug:</div>
                <div className="text-blue-200 mt-1">
                  Loaded: {mainTokens.length} | Showing: {visibleTokens.length} | Total Available: {totalTokenCount} | 
                  HasMore: {hasMoreTokens ? '✅' : '❌'} | 
                  Sort: {sortField} ({sortDirection})
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Header Section matching contests page */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb navigation */}
        <div className="mb-4 flex items-center text-sm text-gray-400">
          <Link to="/" className="hover:text-brand-400 transition-colors">
            Home
          </Link>
          <span className="mx-2">›</span>
          <span className="text-gray-300">Tokens</span>
        </div>

        {/* Enhanced Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 relative">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 relative group">
            <span className="relative z-10 group-hover:animate-glitch">
              Browse Tokens
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream-responsive" />
          </h1>
          
          {/* Controls moved to header - only show if not error state */}
          {!error && (
            <div className="flex items-center gap-3">
              <TokenSearch
                onSelectToken={handleTokenSearchSelect}
                placeholder="Search tokens..."
                variant="modern"
                showPriceData={false}
                className="w-64"
              />
              <select
                value={sortField}
                onChange={(e) => handleSortChange(e.target.value, sortDirection)}
                className="px-3 py-2 bg-dark-200/50 border border-dark-300 rounded-lg text-white text-sm focus:outline-none focus:border-brand-400"
              >
                <option value="degenduelScore">🔥 Trending</option>
                <option value="marketCap">Market Cap</option>
                <option value="volume">Volume</option>
                <option value="change">24h Change</option>
                <option value="price">Price</option>
              </select>
              <button
                onClick={handleRefresh}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-dark-200/50 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          
          {/* Regular Token List View */}
          {/* Loading State */}
          {isCombinedLoading && visibleTokens.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 mb-4 mx-auto">
                  <div className="w-full h-full border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
                </div>
                <p className="text-gray-400">Loading tokens...</p>
              </div>
            </div>
          ) : error ? (
            // Error State - Show server crash animation for WebSocket errors
            error.includes("WebSocket") || error.includes("1006") ? (
              <div className="py-12">
                <ServerCrashDisplay 
                  error={error}
                  onRetry={handleRefresh}
                  isRetrying={isCombinedLoading}
                />
              </div>
            ) : (
              // Regular error display for other errors
              <Card className="bg-dark-300/50 backdrop-blur-sm border-red-500/20">
                <CardContent className="p-8 text-center">
                  <p className="text-red-400 mb-4">{error}</p>
                  <Button onClick={handleRefresh} variant="outline">
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            )
          ) : visibleTokens.length === 0 ? (
            // No Results State
            <Card className="bg-dark-300/50 backdrop-blur-sm border-dark-400">
              <CardContent className="p-8 text-center">
                <p className="text-gray-400 mb-4">
                  No tokens available
                </p>
              </CardContent>
            </Card>
          ) : (
            // Tokens Grid
            <>
              <CreativeTokensGrid
                tokens={visibleTokens}
                featuredTokens={[]} // Empty array to show all tokens in one grid
                selectedTokenSymbol={null}
              />
              
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
                          <div className="w-2 h-2 bg-brand-400 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-brand-400 rounded-full animate-pulse delay-75"></div>
                          <div className="w-2 h-2 bg-brand-400 rounded-full animate-pulse delay-150"></div>
                        </div>
                        <span className="text-sm text-gray-400">Loading more tokens...</span>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500">
                        Scroll for more • Showing {visibleTokens.length} of {allSortedTokens.length} tokens
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {isAddTokenModalOpen && (
        <AddTokenModal
          isOpen={isAddTokenModalOpen}
          onClose={() => setIsAddTokenModalOpen(false)}
        />
      )}
    </div>
    </TokenErrorBoundary>
  );
};