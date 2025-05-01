// src/pages/public/tokens/TokensPage.tsx

import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { AddTokenModal } from "../../../components/tokens-list/AddTokenModal";
import { CreativeTokensGrid } from "../../../components/tokens-list/CreativeTokensGrid";
import { OptimizedTokensHeader } from "../../../components/tokens-list/OptimizedTokensHeader";
import { TokenDetailModal } from "../../../components/tokens-list/TokenDetailModal";
import { Button } from "../../../components/ui/Button";
import { Card, CardContent } from "../../../components/ui/Card";
import useTokenData from "../../../hooks/useTokenData";
import { ddApi } from "../../../services/dd-api";
import { useStore } from "../../../store/useStore";
import { Token, TokenResponseMetadata } from "../../../types";

/**
 * @deprecated This component is deprecated. Use EnhancedTokensPage instead.
 */
export const TokensPage: React.FC = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [metadata, setMetadata] = useState<TokenResponseMetadata>({
    timestamp: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof Token>("marketCap");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [imageSource, setImageSource] = useState<
    "default" | "header" | "openGraph"
  >("header");
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isAddTokenModalOpen, setIsAddTokenModalOpen] = useState(false);
  const [selectedTokenSymbol, setSelectedTokenSymbol] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const user = useStore((state) => state.user);
  const location = useLocation();
  
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
      console.log(`Token selected from URL: ${tokenSymbol}`);
      setSelectedTokenSymbol(tokenSymbol);
      // If we have a token symbol, set the search query to make it easy to find
      setSearchQuery(tokenSymbol);
      // If a token is selected via URL, open the modal
      setIsDetailModalOpen(true);
    }
  }, [location.search]);

  // Use WebSocket-based token data hook
  const { tokens: wsTokens, lastUpdate } = useTokenData("all");

  // Process tokens when WebSocket data is available
  useEffect(() => {
    try {
      if (wsTokens && wsTokens.length > 0) {
        // Create metadata from lastUpdate
        const metadata: TokenResponseMetadata = {
          timestamp: lastUpdate ? lastUpdate.toISOString() : new Date().toISOString(),
          _cached: false,
          _stale: false,
          _cachedAt: undefined,
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
          status: token.status || "active", // Add required status field
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
  
  // Check maintenance mode
  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const isInMaintenance = await ddApi.admin.checkMaintenanceMode();
        setIsMaintenanceMode(isInMaintenance);

        if (isInMaintenance) {
          setError(
            "DegenDuel is undergoing scheduled maintenance ⚙️ Try again later.",
          );
          setLoading(false);
        }
      } catch (err) {
        console.warn("Failed to check maintenance mode:", err);
      }
    };

    checkMaintenanceMode();
    
    // No need for auto-refresh interval as WebSocket provides real-time updates
  }, []);

  // Close the detail modal and reset URL
  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    // Remove the symbol from the URL without page reload
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('symbol');
    window.history.pushState({}, '', newUrl);
  };

  const filteredAndSortedTokens = tokens
    .filter(
      (token) =>
        token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      const aValue = Number(a[sortField]) || 0;
      const bValue = Number(b[sortField]) || 0;
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    });

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
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

  if (isMaintenanceMode) {
    return (
      <div className="flex flex-col min-h-screen">
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

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-red-500 p-8 bg-dark-200/50 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">

      {/* Content Section - Improved for mobile */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
          {/* Mobile-optimized header */}
          <div className="flex flex-col xs:flex-row justify-between items-center mb-4 sm:mb-8 gap-2 xs:gap-0">
            <OptimizedTokensHeader metadata={metadata} />
            {user?.is_admin && (
              <Button
                onClick={() => setIsAddTokenModalOpen(true)}
                className="w-full xs:w-auto xs:ml-4 mt-2 xs:mt-0 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center justify-center xs:justify-start gap-2 relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 via-brand-500/20 to-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />
                <span className="relative flex items-center gap-2">
                  <span className="inline">Add Token</span>
                  <span className="hidden">+</span>
                </span>
              </Button>
            )}
          </div>

          {/* Enhanced Controls Section */}
          <div className="mb-8 relative">
            {/* Background decorative elements */}
            <div className="absolute -z-10 inset-0 rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-dark-200/40 backdrop-blur-sm"></div>
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent"></div>
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
              <div className="absolute right-1/4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-brand-500/20 to-transparent"></div>
              <div className="absolute left-1/4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent"></div>
              
              {/* Enhanced cyberpunk corner cuts */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-brand-500/40 rounded-tl"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-500/40 rounded-tr"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-brand-500/40 rounded-bl"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-500/40 rounded-br"></div>
              
              {/* Digital code segments */}
              <div className="absolute top-2 left-10 flex space-x-1">
                <div className="w-1 h-1 bg-brand-500/60"></div>
                <div className="w-3 h-1 bg-brand-500/40"></div>
                <div className="w-2 h-1 bg-brand-500/60"></div>
              </div>
              <div className="absolute bottom-2 right-10 flex space-x-1">
                <div className="w-2 h-1 bg-cyan-500/60"></div>
                <div className="w-3 h-1 bg-cyan-500/40"></div>
                <div className="w-1 h-1 bg-cyan-500/60"></div>
              </div>
            </div>
            
            <div className="p-3 sm:p-5">
              {/* Mobile-optimized control layout */}
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {/* Search Bar - Full width on mobile, responsive on larger screens */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center text-gray-400 group-focus-within:text-brand-400 transition-colors duration-300">
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
                    placeholder="Search by name or symbol..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-dark-300/50 border-2 border-dark-400 focus:border-brand-400 rounded-lg pl-10 sm:pl-12 pr-8 py-2 sm:py-3 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-brand-400/20 transition-all duration-300"
                  />
                  
                  {/* Animated border glow on focus */}
                  <div className="absolute inset-0 rounded-lg opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity duration-300">
                    <div className="absolute inset-0 rounded-lg border-2 border-brand-400/0 group-focus-within:border-brand-400/20"></div>
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-400/50 to-transparent transform -translate-y-1 group-focus-within:translate-y-0 opacity-0 group-focus-within:opacity-100 transition-all duration-500"></div>
                  </div>
                  
                  {/* "Clear" button appears when there's text */}
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}
                </div>
                
                {/* Filters row - responsive grid for mobile and desktop */}
                <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 sm:gap-4">
                  {/* Sort field dropdown - Spans 4 columns on mobile, 3 on larger screens */}
                  <div className="col-span-1 sm:col-span-3 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center text-brand-400">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none">
                        <path d="M7 15l5 5 5-5M7 9l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    
                    <select
                      value={sortField}
                      onChange={(e) => setSortField(e.target.value as keyof Token)}
                      className="w-full appearance-none bg-dark-300/50 border-2 border-dark-400 hover:border-brand-400/30 rounded-lg pl-10 sm:pl-12 pr-8 sm:pr-10 py-2 sm:py-3 text-sm sm:text-base text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-400/20 transition-all duration-300"
                    >
                      <option value="marketCap">Market Cap</option>
                      <option value="volume24h">24h Volume</option>
                      <option value="change24h">Price Change</option>
                      <option value="price">Current Price</option>
                    </select>
                    
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 sm:pr-4 pointer-events-none text-cyan-400">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none">
                        <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Sort direction button with animation */}
                  <div className="col-span-1 sm:col-span-2">
                    <button
                      onClick={() => setSortDirection(prev => prev === "asc" ? "desc" : "asc")}
                      className="w-full h-full flex items-center justify-center bg-dark-300/70 border-2 border-dark-400 hover:border-brand-400/30 rounded-lg px-4 py-2 sm:py-3 text-white transition-all duration-300 relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/0 to-cyan-500/0 group-hover:from-brand-500/10 group-hover:to-cyan-500/10 transition-all duration-500"></div>
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100">
                        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-400/40 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"></div>
                      </div>
                      
                      <div className="transition-transform duration-300 transform">
                        {sortDirection === "asc" ? (
                          <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none">
                            <path d="M17 8l-5-5-5 5M17 16l-5 5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none">
                            <path d="M17 16l-5-5-5 5M17 8l-5 5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    </button>
                  </div>
                  
                  {/* Image source selection */}
                  <div className="col-span-2 sm:col-span-2 sm:flex sm:justify-end">
                    <div className="relative group/image w-full md:w-auto">
                      <select
                        value={imageSource}
                        onChange={(e) => setImageSource(e.target.value as "default" | "header" | "openGraph")}
                        className="w-full appearance-none bg-dark-300/50 border-2 border-dark-400 hover:border-brand-400/30 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-400/20 transition-all duration-300 pr-8 sm:pr-10"
                      >
                        <option value="default">Default</option>
                        <option value="header">Header</option>
                        <option value="openGraph">OpenGraph</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 sm:pr-4 pointer-events-none text-cyan-400">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Search result stats - mobile optimized */}
                {searchQuery && (
                  <div className="text-xs sm:text-sm text-gray-400 flex flex-wrap items-center gap-1 sm:gap-2">
                    <span>Found {filteredAndSortedTokens.length} tokens matching "{searchQuery}"</span>
                    {filteredAndSortedTokens.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 text-xs whitespace-nowrap">
                        {sortField === "marketCap" ? "By Market Cap" : 
                         sortField === "volume24h" ? "By Volume" : 
                         sortField === "change24h" ? "By Change" : "By Price"}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <CreativeTokensGrid 
            tokens={filteredAndSortedTokens} 
            selectedTokenSymbol={selectedTokenSymbol}
            onTokenClick={(token) => {
              setSelectedTokenSymbol(token.symbol);
              setIsDetailModalOpen(true);
            }}
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