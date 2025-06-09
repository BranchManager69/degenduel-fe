// src/pages/public/tokens/TokensPage.tsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthDebugPanel } from "../../../components/debug";
import { TokenSearch } from "../../../components/common/TokenSearch";
import { AddTokenModal } from "../../../components/tokens-list/AddTokenModal";
import { CreativeTokensGrid } from "../../../components/tokens-list/CreativeTokensGrid";
import { OptimizedTokensHeader } from "../../../components/tokens-list/OptimizedTokensHeader";
import { Button } from "../../../components/ui/Button";
import { Card, CardContent } from "../../../components/ui/Card";
import { RefreshCw } from "lucide-react";
import { useStandardizedTokenData } from "../../../hooks/data/useStandardizedTokenData";
import { useStore } from "../../../store/useStore";
import { Token, TokenResponseMetadata, SearchToken, TokenHelpers } from "../../../types";
import { resetToDefaultMeta } from "../../../utils/ogImageUtils";
import { DegenDuelTop30 } from "@/components/trending/DegenDuelTop30";
import { TokenErrorBoundary } from "../../../components/shared/TokenErrorBoundary";

// DUEL Token Card Component
const DuelTokenCard: React.FC = () => {
  const [duelData, setDuelData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDuelData = async () => {
      try {
        const response = await fetch('/api/tokens/search?search=F4e7axJDGLk5WpNGEL2ZpxTP9STdk7L9iSoJX7utHHHX&limit=1');
        const data = await response.json();
        if (data.tokens && data.tokens.length > 0) {
          setDuelData(data.tokens[0]);
        }
      } catch (error) {
        console.error('Failed to fetch DUEL token data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDuelData();
  }, []);

  if (loading) {
    return (
      <div className="bg-dark-200/80 backdrop-blur-sm border border-yellow-500/30 rounded-lg p-3 shadow-xl min-w-[120px]">
        <div className="text-xs text-gray-400 text-center font-mono">
          Loading...
        </div>
      </div>
    );
  }

  if (!duelData) {
    return (
      <div className="bg-dark-200/80 backdrop-blur-sm border border-yellow-500/30 rounded-lg p-3 shadow-xl min-w-[120px]">
        <div className="text-xs text-gray-400 text-center font-mono">
          DUEL N/A
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-200/80 backdrop-blur-sm border border-yellow-500/30 rounded-lg p-3 shadow-xl hover:shadow-yellow-500/20 transition-all duration-300 min-w-[120px] cursor-pointer group"
         onClick={() => {
           if (duelData.address) navigate(`/tokens/${duelData.address}`);
         }}>
      <div className="flex items-center gap-2 mb-2">
        {duelData.image_url ? (
          <img src={duelData.image_url} alt={duelData.symbol} className="w-6 h-6 rounded-full" />
        ) : (
          <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-black">
            {duelData.symbol?.charAt(0) || 'D'}
          </div>
        )}
        <div>
          <div className="text-white font-bold text-sm">{duelData.symbol}</div>
          <div className="text-xs text-gray-400">{duelData.name}</div>
        </div>
      </div>
      <div className="text-center">
        <div className="text-yellow-400 font-mono text-sm font-bold">
          ${Number(duelData.current_price).toFixed(6)}
        </div>
      </div>
      <div className="text-[10px] text-yellow-400 text-center mt-1 group-hover:animate-pulse">
        ⭐ Featured Token
      </div>
    </div>
  );
};

/**
 * TokensPage - Production version using the UnifiedWebSocket system
 * through the useStandardizedTokenData hook
 */
export const TokensPage: React.FC = () => {
  // State initialization
  const [isAddTokenModalOpen, setIsAddTokenModalOpen] = useState(false);
  
  // View toggle state - NEW
  const [activeView, setActiveView] = useState<'tokens' | 'degenduel'>('tokens');
  
  // Infinite scroll state
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const user = useStore((state) => state.user);
  const location = useLocation();
  const navigate = useNavigate();
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);
  
  
  // Removed Jupiter filters - nobody cares about these
  
  // Sort state - DegenDuel Score shows exciting tokens first! 🚀
  const [sortField, setSortField] = useState<string>("degenduelScore");
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

  // All loaded tokens are visible (backend handles filtering & sorting)
  const visibleTokens = useMemo(() => {
    return allTokens || [];
  }, [allTokens]);

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
                  Loaded: {allTokens.length} | Total: {pagination.total} | 
                  Offset: {pagination.offset} | HasMore: {pagination.hasMore ? '✅' : '❌'}
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
        
        {/* View Toggle with Mini Token Card */}
        <div className="mt-6 flex items-center justify-center relative">
          <div className="bg-gray-800/50 p-1 rounded-lg border border-gray-600/30">
            <button
              onClick={() => setActiveView('tokens')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeView === 'tokens'
                  ? 'bg-brand-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All Tokens
            </button>
            <button
              onClick={() => setActiveView('degenduel')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeView === 'degenduel'
                  ? 'bg-brand-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🏆 DegenDuel Top 30
            </button>
          </div>
          
          {/* Mini Floating DUEL Token Card - Fetches Real Data */}
          <div className="absolute -right-20 lg:-right-24 xl:-right-32 top-1/2 -translate-y-1/2 hidden md:block">
            <DuelTokenCard />
          </div>
        </div>
        
        {/* Simplified Controls - Only show for regular token view */}
        {activeView === 'tokens' && (
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
              <option value="volume24h">Volume</option>
              <option value="change24h">24h Change</option>
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
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          
          {/* DegenDuel Top 30 View */}
          {activeView === 'degenduel' ? (
            <DegenDuelTop30
              limit={30}
              showSparklines={true}
              refreshInterval={30000}
            />
          ) : (
          <>
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
                        Scroll for more • {allTokens.length} tokens loaded
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
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