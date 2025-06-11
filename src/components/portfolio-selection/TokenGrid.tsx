import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Token, TokenHelpers } from "../../types/index";
import { PortfolioOptimizedTokenCard } from "./PortfolioOptimizedTokenCard";
import { TokenListItem } from "./TokenListItem";

interface TokenGridProps {
  tokens: Token[];
  selectedTokens: Map<string, number>;
  onTokenSelect: (contractAddress: string, weight: number) => void;
  marketCapFilter: string;
  viewMode?: 'card' | 'list';
  searchQuery?: string;
}


export const TokenGrid: React.FC<TokenGridProps> = ({
  tokens,
  selectedTokens,
  onTokenSelect,
  marketCapFilter,
  viewMode = 'card',
  searchQuery = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(100); // Start with 100 for immediate clicking
  // Removed isMobile state as it's not used in this component
  // Memoized filtered tokens with search and market cap filtering
  const filteredTokens = useMemo(() => {
    return tokens.filter((token) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const tokenAddress = TokenHelpers.getAddress(token);
        const matchesSearch = 
          token.symbol.toLowerCase().includes(query) ||
          token.name.toLowerCase().includes(query) ||
          tokenAddress.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Market cap filter
      if (!marketCapFilter) return true;

      const marketCap = TokenHelpers.getMarketCap(token);
      switch (marketCapFilter) {
        case "high-cap":
          return marketCap ? marketCap >= 50_000_000 : false;
        case "mid-cap":
          return marketCap
            ? marketCap >= 10_000_000 && marketCap < 50_000_000
            : false;
        case "low-cap":
          return marketCap < 10_000_000;
        default:
          return true;
      }
    });
  }, [tokens, searchQuery, marketCapFilter]);

  // Progressive loading with infinity scroll - but start with 100 for immediate clicking
  useEffect(() => {
    const handleScroll = () => {
      // Check if user scrolled near bottom
      const scrollTop = window.pageYOffset;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      
      // Load 50 more tokens when within 1000px of bottom
      if (scrollTop + clientHeight >= scrollHeight - 1000 && visibleCount < filteredTokens.length) {
        setVisibleCount(prev => Math.min(filteredTokens.length, prev + 50));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [filteredTokens.length, visibleCount]);

  // Show visible tokens with infinity scroll
  const visibleTokens = filteredTokens.slice(0, visibleCount);

  // Memoized handlers for better performance
  const handleCardClick = useCallback((token: Token) => {
    const tokenAddress = TokenHelpers.getAddress(token);
    console.log("🔍 TokenGrid: Card clicked for token:", token.symbol, tokenAddress);
    if (selectedTokens.has(tokenAddress)) {
      console.log("🔍 TokenGrid: Removing token from selection");
      onTokenSelect(tokenAddress, 0); // Remove token
    } else {
              console.log("🔍 TokenGrid: Adding token to selection with 10% weight");
        onTokenSelect(tokenAddress, 10); // Add token with default weight
    }
  }, [selectedTokens, onTokenSelect]);


  // Render card view with enhanced PortfolioOptimizedTokenCard
  const renderCardView = () => (
    <div className="relative" ref={containerRef}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {visibleTokens.map((token) => {
          const tokenAddress = TokenHelpers.getAddress(token);
          return (
            <PortfolioOptimizedTokenCard
              key={tokenAddress}
              token={token}
              isSelected={selectedTokens.has(tokenAddress)}
              weight={selectedTokens.get(tokenAddress) || 0}
              onSelect={() => handleCardClick(token)}
              onWeightChange={(weight: number) => onTokenSelect(tokenAddress, weight)}
            />
          );
        })}
      </div>
      
      {/* Infinity scroll loading indicator */}
      {visibleCount < filteredTokens.length && (
        <div className="h-20 flex items-center justify-center mt-4">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-emerald-500/50 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <div className="text-xs text-gray-400 font-mono">
              Showing {visibleCount}/{filteredTokens.length} tokens • Scroll for more
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
  // Render list view with virtual scrolling
  const renderListView = () => (
    <div className="relative" ref={containerRef}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {visibleTokens.map(token => {
          const tokenAddress = TokenHelpers.getAddress(token);
          return (
            <TokenListItem
              key={tokenAddress}
              token={token}
              isSelected={selectedTokens.has(tokenAddress)}
              weight={selectedTokens.get(tokenAddress) || 0}
              onSelect={() => handleCardClick(token)}
              onWeightChange={(weight: number) => onTokenSelect(tokenAddress, weight)}
            />
          );
        })}
      </div>
      
      {/* Infinity scroll loading indicator for list view */}
      {visibleCount < filteredTokens.length && (
        <div className="h-20 flex items-center justify-center mt-4">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-emerald-500/50 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <div className="text-xs text-gray-400 font-mono">
              Showing {visibleCount}/{filteredTokens.length} tokens • Scroll for more
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
  return viewMode === 'card' ? renderCardView() : renderListView();
};