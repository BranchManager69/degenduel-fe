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
import { TokenSortMethod, useStandardizedTokenData } from "../../../hooks/data/useStandardizedTokenData";
import { useStore } from "../../../store/useStore";
import { Token, TokenResponseMetadata, SearchToken } from "../../../types";
import { resetToDefaultMeta } from "../../../utils/ogImageUtils";
import { DegenDuelTop30 } from "@/components/trending/DegenDuelTop30";

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
  const searchDebounceRef = useRef<number | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  
  // Removed Jupiter filters - nobody cares about these
  
  // Sort state - DegenDuel Score shows exciting tokens first! 🚀
  const [sortField, setSortField] = useState<string>("degenduelScore");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  // Use the standardized token data hook - now uses paginated REST API!
  // Apply proper filtering like the ticker does to ensure quality tokens
  const {
    tokens: allTokens,
    isLoading,
    error,
    lastUpdate,
    pagination,
    getTokenBySymbol,
    refresh,
    loadMore,
    setFilter,
    setSortMethod,
  } = useStandardizedTokenData("all", "marketCap", { 
    status: "active",
    search: debouncedSearchQuery
  });
  
  // Token metadata for compatibility
  const metadata = useMemo<TokenResponseMetadata>(() => ({
    timestamp: lastUpdate?.toISOString() || new Date().toISOString(),
    _cached: false,
    _stale: false,
  }), [lastUpdate]);

  // Token selection handler
  const handleTokenClick = useCallback((token: Token) => {
    // Navigate to token detail page
    navigate(`/tokens/${token.symbol}`);
  }, [navigate]);

  // Modal close handler removed - no longer needed

  // Load more tokens for infinite scroll using real pagination
  const loadMoreTokens = useCallback(() => {
    if (isLoadingMore || !pagination?.hasMore) {
      console.log('[TokensPage] Cannot load more:', { isLoadingMore, hasMore: pagination?.hasMore });
      return;
    }
    
    setIsLoadingMore(true);
    
    // Use the actual loadMore function from the hook
    loadMore();
    
    // Reset loading state (the hook will manage actual loading)
    setTimeout(() => {
      setIsLoadingMore(false);
    }, 1000);
  }, [isLoadingMore, pagination?.hasMore, loadMore]);

  // Token selection logic removed - using dedicated pages now

  // Apply custom sorting for the grid (the hook handles basic sorting, but we need direction control)
  const sortedTokens = useMemo(() => {
    if (!allTokens || allTokens.length === 0) return [];
    
    // PRESERVE BACKEND ORDER when sortField is "default"
    if (sortField === "default") {
      return allTokens; // Don't re-sort! Backend knows best!
    }
    
    const sorted = [...allTokens].sort((a, b) => {
      let aValue = 0;
      let bValue = 0;
      
      switch(sortField) {
        case 'marketCap':
          aValue = a.market_cap || Number(a.marketCap) || 0;
          bValue = b.market_cap || Number(b.marketCap) || 0;
          break;
        case 'volume24h':
          aValue = a.volume_24h || Number(a.volume24h) || 0;
          bValue = b.volume_24h || Number(b.volume24h) || 0;
          break;
        case 'change24h':
          aValue = a.change_24h || Number(a.change24h) || 0;
          bValue = b.change_24h || Number(b.change24h) || 0;
          break;
        case 'price':
          aValue = Number(a.price) || 0;
          bValue = Number(b.price) || 0;
          break;
        case 'liquidity':
          aValue = a.liquidity || 0;
          bValue = b.liquidity || 0;
          break;
        case 'fdv':
          aValue = a.fdv || 0;
          bValue = b.fdv || 0;
          break;
        case 'priorityScore':
          aValue = a.priority_score || a.priorityScore || 0;
          bValue = b.priority_score || b.priorityScore || 0;
          break;
        case 'degenduelScore':
          aValue = a.degenduel_score || 0;
          bValue = b.degenduel_score || 0;
          break;
        case 'change5m':
          aValue = a.priceChanges?.["5m"] || 0;
          bValue = b.priceChanges?.["5m"] || 0;
          break;
        case 'change1h':
          aValue = a.priceChanges?.["1h"] || 0;
          bValue = b.priceChanges?.["1h"] || 0;
          break;
        case 'volume5m':
          aValue = a.volumes?.["5m"] || 0;
          bValue = b.volumes?.["5m"] || 0;
          break;
        case 'volume1h':
          aValue = a.volumes?.["1h"] || 0;
          bValue = b.volumes?.["1h"] || 0;
          break;
        case 'transactions5m':
          aValue = (a.transactions?.["5m"]?.buys || 0) + (a.transactions?.["5m"]?.sells || 0);
          bValue = (b.transactions?.["5m"]?.buys || 0) + (b.transactions?.["5m"]?.sells || 0);
          break;
        case 'transactions1h':
          aValue = (a.transactions?.["1h"]?.buys || 0) + (a.transactions?.["1h"]?.sells || 0);
          bValue = (b.transactions?.["1h"]?.buys || 0) + (b.transactions?.["1h"]?.sells || 0);
          break;
        case 'age':
          // Newer tokens first when descending
          aValue = a.pairCreatedAt ? new Date(a.pairCreatedAt).getTime() : 0;
          bValue = b.pairCreatedAt ? new Date(b.pairCreatedAt).getTime() : 0;
          break;
        default:
          aValue = Number(a[sortField as keyof Token]) || 0;
          bValue = Number(b[sortField as keyof Token]) || 0;
      }
      
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    });
    
    return sorted;
  }, [allTokens, sortField, sortDirection]);

  // All loaded tokens are visible (pagination handled by backend)
  const visibleTokens = useMemo(() => {
    return sortedTokens;
  }, [sortedTokens]);

  // Check if there are more tokens to load from server
  const hasMoreTokens = pagination?.hasMore ?? false;

  // Create debounce for search to improve performance
  useEffect(() => {
    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current);
    }
    
    searchDebounceRef.current = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    
    return () => {
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery]);

  // Update filter when debounced search changes
  useEffect(() => {
    setFilter({
      status: "active",
      search: debouncedSearchQuery
    });
  }, [debouncedSearchQuery, setFilter]);

  // Update sort method when sort field/direction changes
  useEffect(() => {
    const sortMethodMap: Record<string, TokenSortMethod> = {
      'marketCap': 'marketCap',
      'volume24h': 'volume',
      'price': 'price',
      'change24h': sortDirection === 'desc' ? 'gainers' : 'losers'
    };
    
    const method = sortMethodMap[sortField] || 'marketCap';
    setSortMethod(method);
  }, [sortField, sortDirection, setSortMethod]);

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
        // Redirect to the dedicated token page
        navigate(`/tokens/${token.symbol}`, { replace: true });
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
      { threshold: 0.1 }
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
    // Navigate to the token detail page
    if (token.symbol) {
      navigate(`/tokens/${token.symbol}`);
    } else {
      // Fallback to address if no symbol
      navigate(`/tokens?address=${token.address}`);
    }
  }, [navigate]);

  return (
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
        
        {/* View Toggle */}
        <div className="mt-6 flex items-center justify-center">
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
                  ? 'bg-gradient-to-r from-brand-600 to-cyber-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🏆 DegenDuel Top 30
            </button>
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
              showCategories={true}
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
                  {searchQuery ? 
                    `No tokens found matching "${searchQuery}"` : 
                    "No tokens available"
                  }
                </p>
                {searchQuery && (
                  <Button 
                    onClick={() => setSearchQuery("")} 
                    variant="outline"
                  >
                    Clear Search
                  </Button>
                )}
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
              
              {/* Load More Trigger */}
              {hasMoreTokens && (
                <div 
                  ref={loadMoreTriggerRef}
                  className="flex items-center justify-center py-8"
                >
                  {isLoadingMore && (
                    <div className="text-center">
                      <div className="w-8 h-8 border-3 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
                      <p className="text-gray-400 mt-2 text-sm">Loading more tokens...</p>
                    </div>
                  )}
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
  );
};