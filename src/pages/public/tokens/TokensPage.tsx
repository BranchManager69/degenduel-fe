// src/pages/public/tokens/TokensPage.tsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthDebugPanel } from "../../../components/debug";
import { AddTokenModal } from "../../../components/tokens-list/AddTokenModal";
import { CreativeTokensGrid } from "../../../components/tokens-list/CreativeTokensGrid";
import { OptimizedTokensHeader } from "../../../components/tokens-list/OptimizedTokensHeader";
import { Button } from "../../../components/ui/Button";
import { Card, CardContent } from "../../../components/ui/Card";
import { TokenSortMethod, useStandardizedTokenData } from "../../../hooks/data/useStandardizedTokenData";
import { useStore } from "../../../store/useStore";
import { Token, TokenResponseMetadata } from "../../../types";
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
  const [visibleTokensCount, setVisibleTokensCount] = useState(50); // Start with 50 tokens
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const user = useStore((state) => state.user);
  const location = useLocation();
  const navigate = useNavigate();
  const searchDebounceRef = useRef<number | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  
  // Jupiter filter state
  const [jupiterFilters, setJupiterFilters] = useState({
    strictOnly: false,
    verifiedOnly: false,
    showAll: true
  });
  
  // Sort state
  const [sortField, setSortField] = useState<string>("marketCap");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  // Use the standardized token data hook - this uses UnifiedWebSocket!
  // Apply proper filtering like the ticker does to ensure quality tokens
  const {
    tokens: allTokens,
    isLoading,
    error,
    lastUpdate,
    getTokenBySymbol,
    refresh,
    setFilter,
    setSortMethod,
  } = useStandardizedTokenData("all", "marketCap", { 
    status: "active",
    minMarketCap: 50000,    // $50k minimum market cap
    minVolume: 5000,        // $5k minimum 24h volume
    search: debouncedSearchQuery,
    // User-configurable Jupiter filters
    strictOnly: jupiterFilters.strictOnly,
    verifiedOnly: jupiterFilters.verifiedOnly && !jupiterFilters.strictOnly  // Strict overrides verified
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

  // Load more tokens for infinite scroll
  const loadMoreTokens = useCallback(() => {
    if (isLoadingMore) return;
    
    setIsLoadingMore(true);
    
    // Simulate loading delay for better UX
    setTimeout(() => {
      setVisibleTokensCount(prev => prev + 50); // Load 50 more tokens
      setIsLoadingMore(false);
    }, 300);
  }, [isLoadingMore]);

  // Token selection logic removed - using dedicated pages now

  // Apply custom sorting for the grid (the hook handles basic sorting, but we need direction control)
  const sortedTokens = useMemo(() => {
    if (!allTokens || allTokens.length === 0) return [];
    
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

  // Visible tokens for infinite scroll (only show up to visibleTokensCount)
  const visibleTokens = useMemo(() => {
    return sortedTokens.slice(0, visibleTokensCount);
  }, [sortedTokens, visibleTokensCount]);

  // Check if there are more tokens to load
  const hasMoreTokens = sortedTokens.length > visibleTokensCount;

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
      minMarketCap: 50000,    // $50k minimum market cap
      minVolume: 5000,        // $5k minimum 24h volume  
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
        if (entries[0].isIntersecting && hasMoreTokens && !isLoadingMore) {
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
  }, [hasMoreTokens, isLoadingMore, loadMoreTokens]);

  // Handle search input with controlled component
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  // Handle sort change
  const handleSortChange = useCallback((field: string, direction: "asc" | "desc") => {
    setSortField(field);
    setSortDirection(direction);
  }, []);

  // Refresh data
  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Admin Debug Panel - Show only for admin users */}
      {user && typeof user === 'object' && 'isAdministrator' in user && user.isAdministrator === true && <AuthDebugPanel />}

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
        
        {/* Search and Sort Controls - Only show for regular token view */}
        {activeView === 'tokens' && (
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search tokens..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full px-4 py-2 bg-dark-200/50 border border-dark-300 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-400"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sortField}
                onChange={(e) => handleSortChange(e.target.value, sortDirection)}
                className="px-4 py-2 bg-dark-200/50 border border-dark-300 rounded-lg text-white focus:outline-none focus:border-brand-400"
              >
                <option value="marketCap">Market Cap</option>
                <option value="volume24h">24h Volume</option>
                <option value="change24h">24h Change</option>
                <option value="price">Price</option>
                <option value="liquidity">Liquidity</option>
                <option value="fdv">FDV</option>
                <option value="priorityScore">Priority Score</option>
                <option value="change5m">5m Change</option>
                <option value="change1h">1h Change</option>
                <option value="volume5m">5m Volume</option>
                <option value="volume1h">1h Volume</option>
                <option value="transactions5m">5m Activity</option>
                <option value="transactions1h">1h Activity</option>
                <option value="age">Token Age</option>
              </select>
              <button
                onClick={() => handleSortChange(sortField, sortDirection === 'asc' ? 'desc' : 'asc')}
                className="px-4 py-2 bg-dark-200/50 border border-dark-300 rounded-lg text-white hover:bg-dark-300/50 focus:outline-none focus:border-brand-400"
              >
                {sortDirection === 'asc' ? '↑' : '↓'}
              </button>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-dark-200/50 border border-dark-300 rounded-lg text-white hover:bg-dark-300/50 focus:outline-none focus:border-brand-400"
              >
                Refresh
              </button>
            </div>
          </div>
          
          {/* Jupiter Filter Controls */}
          <div className="flex flex-wrap gap-4 items-center p-3 bg-dark-200/30 border border-dark-300/50 rounded-lg">
            <span className="text-sm font-medium text-gray-300">Jupiter Filters:</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={jupiterFilters.strictOnly}
                onChange={(e) => setJupiterFilters({
                  strictOnly: e.target.checked,
                  verifiedOnly: false, // Strict overrides verified
                  showAll: !e.target.checked && !jupiterFilters.verifiedOnly
                })}
                className="w-4 h-4 text-brand-400 bg-dark-300 border-dark-400 rounded focus:ring-brand-400 focus:ring-2"
              />
              <span className="text-sm text-gray-300">Strict Only</span>
              <span className="text-xs text-gray-500">(Highest Quality)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={jupiterFilters.verifiedOnly && !jupiterFilters.strictOnly}
                disabled={jupiterFilters.strictOnly}
                onChange={(e) => setJupiterFilters({
                  strictOnly: false,
                  verifiedOnly: e.target.checked,
                  showAll: !e.target.checked && !jupiterFilters.strictOnly
                })}
                className="w-4 h-4 text-brand-400 bg-dark-300 border-dark-400 rounded focus:ring-brand-400 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className={`text-sm ${jupiterFilters.strictOnly ? 'text-gray-500' : 'text-gray-300'}`}>Verified Only</span>
              <span className="text-xs text-gray-500">(Curated)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={!jupiterFilters.strictOnly && !jupiterFilters.verifiedOnly}
                onChange={(e) => setJupiterFilters({
                  strictOnly: false,
                  verifiedOnly: false,
                  showAll: e.target.checked
                })}
                className="w-4 h-4 text-brand-400 bg-dark-300 border-dark-400 rounded focus:ring-brand-400 focus:ring-2"
              />
              <span className="text-sm text-gray-300">Show All</span>
              <span className="text-xs text-gray-500">(Unfiltered)</span>
            </label>
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