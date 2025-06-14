// src/pages/public/tokens/TokensPage.tsx

import { RefreshCw } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TokenSearch } from "../../../components/common/TokenSearch";
import { AuthDebugPanel } from "../../../components/debug";
import { TokenErrorBoundary } from "../../../components/shared/TokenErrorBoundary";
import { AddTokenModal } from "../../../components/tokens-list/AddTokenModal";
import { CreativeTokensGrid } from "../../../components/tokens-list/CreativeTokensGrid";
import { OptimizedTokensHeader } from "../../../components/tokens-list/OptimizedTokensHeader";
import { Button } from "../../../components/ui/Button";
import { Card, CardContent } from "../../../components/ui/Card";
import { useStandardizedTokenData } from "../../../hooks/data/useStandardizedTokenData";
import { useStore } from "../../../store/useStore";
import { SearchToken, Token, TokenHelpers, TokenResponseMetadata } from "../../../types";
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
  
  const user = useStore((state) => state.user);
  const location = useLocation();
  const navigate = useNavigate();
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);
  
  
  // Removed Jupiter filters - nobody cares about these
  
  // Sort state - Default to 24h change to show hot movers first! 🚀
  const [sortField, setSortField] = useState<string>("change");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  // Single data source - backend handles everything!
  const {
    tokens: allTokens,
    isLoading,
    error,
    lastUpdate,
    pagination,
    getTokenBySymbol,
    refresh,
    loadMore,
  } = useStandardizedTokenData("all", "marketCap", {}, 5, 50); // Start with 50, load more on scroll
  
  // Token metadata for compatibility
  const metadata = useMemo<TokenResponseMetadata>(() => ({
    timestamp: lastUpdate?.toISOString() || new Date().toISOString(),
    _cached: false,
    _stale: false,
  }), [lastUpdate]);

  // Token selection handler
  const handleTokenClick = useCallback((token: Token) => {
    // Navigate to token detail page using contract address
    navigate(`/tokens/${TokenHelpers.getAddress(token)}`);
  }, [navigate]);

  // Modal close handler removed - no longer needed

  // Load more tokens for infinite scroll using real pagination
  const loadMoreTokens = useCallback(() => {
    if (isLoadingMore || !pagination?.hasMore || isLoading) {
      console.log('[TokensPage] Cannot load more:', { isLoadingMore, hasMore: pagination?.hasMore, isLoading });
      return;
    }
    
    console.log('[TokensPage] Loading more tokens...');
    setIsLoadingMore(true);
    
    // Use the actual loadMore function from the hook
    loadMore();
    
    // Reset loading state after a short delay
    setTimeout(() => {
      setIsLoadingMore(false);
    }, 500);
  }, [isLoadingMore, pagination?.hasMore, isLoading, loadMore]);

  // Token selection logic removed - using dedicated pages now

  // NO CLIENT-SIDE SORTING - Trust backend order
  // Backend already sorted by degenduel_score (best to worst)

  // DUEL token data state
  const [duelToken, setDuelToken] = useState<Token | null>(null);
  
  // Fetch DUEL token data
  useEffect(() => {
    const fetchDuelToken = async () => {
      try {
        const response = await fetch('/api/tokens/search?search=F4e7axJDGLk5WpNGEL2ZpxTP9STdk7L9iSoJX7utHHHX&limit=1');
        const data = await response.json();
        if (data.tokens && data.tokens.length > 0) {
          const duelData = data.tokens[0];
          // Convert to Token format
          const duelTokenFormatted: Token = {
            ...duelData,
            address: duelData.address || 'F4e7axJDGLk5WpNGEL2ZpxTP9STdk7L9iSoJX7utHHHX',
            contractAddress: duelData.address || 'F4e7axJDGLk5WpNGEL2ZpxTP9STdk7L9iSoJX7utHHHX',
            market_cap: duelData.market_cap || 0,
            volume_24h: duelData.volume_24h || 0,
            change_24h: duelData.change_24h || 0,
            price: Number(duelData.price) || 0,
          };
          setDuelToken(duelTokenFormatted);
        }
      } catch (error) {
        console.error('Failed to fetch DUEL token:', error);
      }
    };
    
    fetchDuelToken();
  }, []);

  // Sort all tokens by the selected field
  const sortedTokens = useMemo(() => {
    if (!allTokens || allTokens.length === 0) return [];
    
    // Sort ALL tokens by the selected field
    const sorted = [...allTokens].sort((a, b) => {
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

  // Visible tokens - all sorted tokens with DUEL prepended if not already there
  const visibleTokens = useMemo(() => {
    // Prepend DUEL token if not already in the list
    if (duelToken && !sortedTokens.some(t => t.contractAddress === duelToken.contractAddress)) {
      return [duelToken, ...sortedTokens];
    }
    
    return sortedTokens;
  }, [sortedTokens, duelToken]);

  // Check if there are more tokens to load from server
  const hasMoreTokens = pagination?.hasMore ?? false;

  // NO CLIENT-SIDE SEARCH/FILTERING - Backend handles everything

  // Parse URL parameters for token selection - redirect to dedicated page
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenAddress = params.get('address');
    const tokenSymbol = params.get('symbol'); // For backward compatibility
    
    if (tokenAddress || tokenSymbol) {
      // Find the token to get its symbol for the URL
      const token = getTokenBySymbol(tokenAddress || tokenSymbol || '') || 
                   allTokens.find(t => t.contractAddress?.toLowerCase() === (tokenAddress || tokenSymbol || '').toLowerCase());
      
      if (token) {
        // Redirect to the dedicated token page using contract address
        navigate(`/tokens/${TokenHelpers.getAddress(token)}`, { replace: true });
      } else {
        // If token not found, clear the URL parameters
        navigate(location.pathname, { replace: true });
      }
    }
  }, [location.search, allTokens, getTokenBySymbol, navigate, location.pathname]);
  
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
        if (entries[0].isIntersecting && hasMoreTokens && !isLoadingMore && !isLoading) {
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
  }, [hasMoreTokens, isLoadingMore, isLoading, loadMoreTokens]);

  // Note: handleSearchChange removed since we now use TokenSearch component

  // Handle sort change
  const handleSortChange = useCallback((field: string, direction: "asc" | "desc") => {
    setSortField(field);
    setSortDirection(direction);
  }, []);

  // Refresh data
  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

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
          {pagination && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-xs font-mono">
                <div className="text-blue-300">📊 Pagination Debug:</div>
                <div className="text-blue-200 mt-1">
                  Loaded: {visibleTokens.length} | Total: {pagination.total} | 
                  Offset: {pagination.offset} | HasMore: {pagination.hasMore ? '✅' : '❌'} | 
                  Sort: {sortField} ({sortDirection})
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Header */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <OptimizedTokensHeader
          metadata={metadata}
        />
        
        
        {/* Simplified Controls */}
        <div className="mt-6 flex justify-center">
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
        </div>
        
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          
          {/* Regular Token List View */}
          {/* Loading State */}
          {isLoading && visibleTokens.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 mb-4 mx-auto">
                  <div className="w-full h-full border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
                </div>
                <p className="text-gray-400">Loading tokens...</p>
              </div>
            </div>
          ) : error ? (
            // Error State
            <Card className="bg-dark-300/50 backdrop-blur-sm border-red-500/20">
              <CardContent className="p-8 text-center">
                <p className="text-red-400 mb-4">{error}</p>
                <Button onClick={handleRefresh} variant="outline">
                  Try Again
                </Button>
              </CardContent>
            </Card>
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
                onTokenClick={handleTokenClick}
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
                        Scroll for more • {sortedTokens.length} tokens loaded
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