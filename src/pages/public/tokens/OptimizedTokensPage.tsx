// src/pages/public/tokens/OptimizedTokensPage.tsx

import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { OptimizedTokensGrid } from "../../../components/tokens-list/OptimizedTokensGrid";
import { OptimizedTokensHeader } from "../../../components/tokens-list/OptimizedTokensHeader";
import { TokenDetailModal } from "../../../components/tokens-list/TokenDetailModal";
import { AddTokenModal } from "../../../components/tokens-list/AddTokenModal";
import { Button } from "../../../components/ui/Button";
import { Card, CardContent } from "../../../components/ui/Card";
import { ddApi } from "../../../services/dd-api";
import { useStore } from "../../../store/useStore";
import { Token, TokenResponseMetadata } from "../../../types";
import { BackgroundEffects } from "../../../components/animated-background/BackgroundEffects";
import useTokenData from "../../../hooks/useTokenData";

/**
 * OptimizedTokensPage component with improved performance
 * - Less frequent data refresh (60s vs 30s)
 * - Removed debug logging
 * - Optimized rendering with memoization
 * - Simplified background effects
 * - Debounced search to reduce re-renders
 */
export const OptimizedTokensPage: React.FC = () => {
  // State initialization
  const [tokens, setTokens] = useState<Token[]>([]);
  const [metadata, setMetadata] = useState<TokenResponseMetadata>({
    timestamp: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof Token>("marketCap");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isAddTokenModalOpen, setIsAddTokenModalOpen] = useState(false);
  const [selectedTokenSymbol, setSelectedTokenSymbol] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const user = useStore((state) => state.user);
  const location = useLocation();
  const navigate = useNavigate();
  const refreshTimerRef = useRef<number | null>(null);
  const searchDebounceRef = useRef<number | null>(null);
  
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
  
  // Find the selected token based on symbol
  const selectedToken = useMemo(() => {
    if (!selectedTokenSymbol) return null;
    return tokens.find(
      token => token.symbol.toLowerCase() === selectedTokenSymbol.toLowerCase()
    ) || null;
  }, [tokens, selectedTokenSymbol]);
  
  // Parse URL parameters for token selection
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenSymbol = params.get('symbol');
    if (tokenSymbol) {
      setSelectedTokenSymbol(tokenSymbol);
      setSearchQuery(tokenSymbol);
      setDebouncedSearchQuery(tokenSymbol);
      setIsDetailModalOpen(true);
    }
  }, [location.search]);

  // Token selection handler
  const handleTokenClick = useCallback((token: Token) => {
    setSelectedTokenSymbol(token.symbol);
    setIsDetailModalOpen(true);
    
    // Update URL without triggering page reload
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('symbol', token.symbol);
    navigate(`${location.pathname}?symbol=${token.symbol}`, { replace: true });
  }, [location.pathname, navigate]);

  // Close the detail modal and reset URL
  const handleCloseDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
    // Remove the symbol from the URL without page reload
    navigate(location.pathname, { replace: true });
  }, [location.pathname, navigate]);

  // Use WebSocket-based token data hook instead of API
  const { tokens: wsTokens, isConnected, connectionState, lastUpdate } = useTokenData("all");

  // Process tokens when WebSocket data is available
  useEffect(() => {
    // Check maintenance mode first
    const checkMaintenanceMode = async () => {
      try {
        const isInMaintenance = await ddApi.admin.checkMaintenanceMode();
        setIsMaintenanceMode(isInMaintenance);
  
        if (isInMaintenance) {
          setError(
            "DegenDuel is undergoing scheduled maintenance ⚙️ Try again later."
          );
          setLoading(false);
          return;
        }
      } catch (err) {
        // If can't check maintenance mode, continue anyway
        console.warn("Failed to check maintenance mode:", err);
      }
    };
    
    checkMaintenanceMode();
  }, []);
  
  // Process WebSocket token data
  useEffect(() => {
    try {
      if (wsTokens && wsTokens.length > 0) {
        // Create metadata from lastUpdate
        const metadata: TokenResponseMetadata = {
          timestamp: lastUpdate ? lastUpdate.toISOString() : new Date().toISOString(),
          _cached: false,
          _stale: false,
          _cachedAt: null,
        };
        setMetadata(metadata);
        
        // Transform tokens to match our expected format
        const transformedTokens = wsTokens.map((token: any) => ({
          contractAddress: token.contractAddress || token.address,
          name: token.name,
          symbol: token.symbol,
          price: token.price?.toString() || "0",
          marketCap: token.marketCap?.toString() || "0",
          volume24h: token.volume24h?.toString() || "0",
          change24h: token.change24h?.toString() || "0",
          liquidity: {
            usd: token.liquidity?.usd?.toString() || "0",
            base: token.liquidity?.base?.toString() || "0",
            quote: token.liquidity?.quote?.toString() || "0",
          },
          images: {
            imageUrl: token.imageUrl || token.image,
            headerImage: token.headerImage,
            openGraphImage: token.openGraphImage,
          },
          socials: {
            twitter: token.socials?.twitter || null,
            telegram: token.socials?.telegram || null,
            discord: token.socials?.discord || null,
          },
          websites: token.websites || [],
        }));
        
        setTokens(transformedTokens);
        setLoading(false);
      }
    } catch (err) {
      console.error("Failed to process token data:", err);
      setError("Failed to process token data");
      setLoading(false);
    }
  }, [wsTokens, lastUpdate]);
  
  // Handle connection state changes
  useEffect(() => {
    if (connectionState === 'error') {
      setError("Connection error. Please try again later.");
    } else if (connectionState === 'connecting' && !isConnected) {
      // Only show loading if we're connecting for the first time
      if (tokens.length === 0) {
        setLoading(true);
      }
    }
  }, [connectionState, isConnected, tokens.length]);

  // Handle Storybook environment
  useEffect(() => {
    // Check if running in Storybook environment
    const isStorybook = typeof window !== 'undefined' && 'STORYBOOK_ENV' in window;
    
    // Only use mock data in Storybook
    if (isStorybook) {
      // For Storybook, use mock data directly
      setLoading(false);
      const mockData = {
        timestamp: new Date().toISOString(),
        _cached: false,
        _stale: false,
        _cachedAt: new Date().toISOString(),
      };
      setMetadata(mockData);
      
      // Set mock tokens directly if in Storybook
      const mockTokens: Token[] = [
        {
          contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
          name: 'Solana',
          symbol: 'SOL',
          price: '103.45',
          marketCap: '42000000000',
          volume24h: '1500000000',
          change24h: '5.63',
          liquidity: { usd: '120000000', base: '1000000', quote: '2000000' },
          images: {
            imageUrl: '',
            headerImage: '',
            openGraphImage: ''
          },
          socials: {
            twitter: { url: '#', count: null },
            telegram: { url: '#', count: null },
            discord: { url: '#', count: null }
          },
          websites: [{ url: 'https://solana.com', label: 'Website' }],
        },
        {
          contractAddress: '0x2345678901abcdef2345678901abcdef23456789',
          name: 'Bitcoin',
          symbol: 'BTC',
          price: '67245.21',
          marketCap: '1320000000000',
          volume24h: '28500000000',
          change24h: '-2.34',
          liquidity: { usd: '820000000', base: '12000000', quote: '18000000' },
          images: {
            imageUrl: '',
            headerImage: '',
            openGraphImage: ''
          },
          socials: {
            twitter: { url: '#', count: null },
            telegram: { url: '#', count: null },
            discord: { url: '#', count: null }
          },
          websites: [{ url: 'https://bitcoin.org', label: 'Website' }],
        },
        {
          contractAddress: '0x3456789012abcdef3456789012abcdef34567890',
          name: 'Ethereum',
          symbol: 'ETH',
          price: '3420.89',
          marketCap: '410000000000',
          volume24h: '12500000000',
          change24h: '2.25',
          liquidity: { usd: '450000000', base: '8000000', quote: '10000000' },
          images: {
            imageUrl: '',
            headerImage: '',
            openGraphImage: ''
          },
          socials: {
            twitter: { url: '#', count: null },
            telegram: { url: '#', count: null },
            discord: { url: '#', count: null }
          },
          websites: [{ url: 'https://ethereum.org', label: 'Website' }],
        }
      ];
      setTokens(mockTokens);
    }
    
    // Clear any existing timer when component is unmounted
    return () => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);
  
  // Setup refreshing based on data staleness, using setTimeout instead of setInterval
  // to prevent overlapping calls if the network is slow
  useEffect(() => {
    // Check if running in Storybook environment
    const isStorybook = typeof window !== 'undefined' && 'STORYBOOK_ENV' in window;
    
    // Skip refresh timer in Storybook
    if (isStorybook) {
      return;
    }
    
    // Clear any existing timer
    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current);
    }
    
    // Only set up a refresh timer if not loading, not in maintenance mode, and not in error state
    if (!loading && !isMaintenanceMode && !error) {
      // Set new timer - Use 60s for fresh data and 15s for stale
      const refreshTime = metadata._stale ? 15000 : 60000;
      
      refreshTimerRef.current = window.setTimeout(() => {
        fetchTokensData();
      }, refreshTime);
    }
    
    return () => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
    };
  }, [metadata._stale, fetchTokensData, isMaintenanceMode, error, loading]);

  // Compute filtered and sorted tokens list
  const filteredAndSortedTokens = useMemo(() => {
    return tokens
      .filter(
        (token) =>
          token.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          token.symbol.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      )
      .sort((a, b) => {
        const aValue = Number(a[sortField]) || 0;
        const bValue = Number(b[sortField]) || 0;
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      });
  }, [tokens, debouncedSearchQuery, sortField, sortDirection]);

  // Loading state UI
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <BackgroundEffects />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-dark-200/50 backdrop-blur-sm">
                <CardContent className="p-6 h-24">
                  <div className="animate-pulse flex space-x-4">
                    <div className="rounded-full bg-dark-300 h-12 w-12"></div>
                    <div className="flex-1 space-y-4">
                      <div className="h-4 bg-dark-300 rounded w-3/4"></div>
                      <div className="h-4 bg-dark-300 rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Maintenance mode UI
  if (isMaintenanceMode) {
    return (
      <div className="flex flex-col min-h-screen">
        <BackgroundEffects />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center p-8 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-yellow-400">
              <span>⚠</span>
              <span>
                DegenDuel is undergoing scheduled maintenance ⚙️ Try again
                later.
              </span>
              <span>⚠</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state UI
  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <BackgroundEffects />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-red-500 p-8 bg-dark-200/50 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    );
  }

  // Main content UI
  return (
    <div className="flex flex-col min-h-screen">
      {/* Static background */}
      <div className="fixed inset-0 bg-dark-100 z-0"></div>

      {/* Content Section */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
          <div className="flex justify-between items-start mb-4 sm:mb-8">
            <OptimizedTokensHeader metadata={metadata} />
            {user?.is_admin && (
              <Button
                onClick={() => setIsAddTokenModalOpen(true)}
                className="ml-4 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <span className="flex items-center gap-2">
                  <span className="hidden sm:inline">Add Token</span>
                  <span className="sm:hidden">+</span>
                </span>
              </Button>
            )}
          </div>

          {/* Controls Section */}
          <div className="mb-6 bg-dark-200/50 backdrop-blur-sm rounded-lg border border-dark-300 hover:border-brand-400/20 transition-all duration-300">
            <div className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search Bar */}
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search tokens..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-dark-300/50 border border-dark-400 focus:border-brand-400/50 rounded-lg pl-10 pr-4 py-2 text-gray-100 placeholder-gray-500 focus:ring-1 focus:ring-brand-400/20 transition-all duration-300"
                  />
                </div>

                {/* Control Buttons */}
                <div className="flex gap-2">
                  <div className="relative">
                    <select
                      value={sortField}
                      onChange={(e) =>
                        setSortField(e.target.value as keyof Token)
                      }
                      className="appearance-none bg-dark-300/50 border border-dark-400 hover:border-brand-400/50 rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-400/20 transition-all duration-300 pr-10"
                    >
                      <option value="marketCap">Market Cap</option>
                      <option value="volume24h">Volume</option>
                      <option value="change24h">24h Change</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      setSortDirection((prev) =>
                        prev === "asc" ? "desc" : "asc",
                      )
                    }
                    className="bg-dark-300/50 border border-dark-400 hover:border-brand-400/50 rounded-lg px-4 py-2 text-gray-100 transition-all duration-300"
                  >
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <OptimizedTokensGrid 
            tokens={filteredAndSortedTokens} 
            selectedTokenSymbol={selectedTokenSymbol}
            onTokenClick={handleTokenClick}
          />

          {/* Modals */}
          <AddTokenModal
            isOpen={isAddTokenModalOpen}
            onClose={() => setIsAddTokenModalOpen(false)}
          />
          
          <TokenDetailModal
            isOpen={isDetailModalOpen && !!selectedToken}
            onClose={handleCloseDetailModal}
            token={selectedToken}
          />
        </div>
      </div>
    </div>
  );
};