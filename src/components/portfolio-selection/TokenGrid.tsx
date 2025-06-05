import React, { useRef, useCallback, useMemo, useState, useEffect } from "react";
import { IconType } from "react-icons";
import { FaCoins, FaDiscord, FaTelegram, FaTwitter } from "react-icons/fa";

import { TokenListItem } from "./TokenListItem";
import { Token } from "../../types/index";
import { Card, CardContent, CardHeader } from "../ui/Card";

interface TokenGridProps {
  tokens: Token[];
  selectedTokens: Map<string, number>;
  onTokenSelect: (contractAddress: string, weight: number) => void;
  marketCapFilter: string;
  viewMode?: 'card' | 'list';
  searchQuery?: string;
}

// Helper function for dynamic price formatting
const formatTokenPrice = (price: string | number): string => {
  const numPrice = Number(price);
  if (numPrice >= 1) {
    return `$${numPrice.toFixed(2)}`;
  } else if (numPrice >= 0.01) {
    return `$${numPrice.toFixed(3)}`;
  } else {
    return `$${numPrice.toPrecision(3)}`;
  }
};

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
        const matchesSearch = 
          token.symbol.toLowerCase().includes(query) ||
          token.name.toLowerCase().includes(query) ||
          token.contractAddress.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Market cap filter
      if (!marketCapFilter) return true;

      const marketCap = Number(token.marketCap);
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
    console.log("🔍 TokenGrid: Card clicked for token:", token.symbol, token.contractAddress);
    if (selectedTokens.has(token.contractAddress)) {
      console.log("🔍 TokenGrid: Removing token from selection");
      onTokenSelect(token.contractAddress, 0); // Remove token
    } else {
      console.log("🔍 TokenGrid: Adding token to selection with 50% weight");
      onTokenSelect(token.contractAddress, 50); // Add token with default weight
    }
  }, [selectedTokens, onTokenSelect]);

  const handleWeightChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement>,
    token: Token,
  ) => {
    e.stopPropagation();
    onTokenSelect(token.contractAddress, Number(e.target.value));
  }, [onTokenSelect]);

  // Render card view with virtual scrolling
  const renderCardView = () => (
    <div className="relative" ref={containerRef}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {visibleTokens.map((token) => (
        <Card
          key={token.contractAddress}
          onClick={() => handleCardClick(token)}
          className={`cursor-pointer transition-all relative overflow-hidden backdrop-blur-sm border-dark-300 
            ${
              selectedTokens.has(token.contractAddress)
                ? "ring-2 ring-brand-500 bg-dark-200/80"
                : "hover:bg-dark-300/80 bg-dark-200/50"
            }
            hover:shadow-xl hover:shadow-brand-500/10 hover:-translate-y-0.5 text-xs sm:text-sm
            `}
        >
          {/* Simple background pattern - no images to avoid loading delays */}
          <div className="absolute inset-0 bg-gradient-to-br from-dark-400/20 via-transparent to-transparent pointer-events-none" />

          {/* Content */}
          <div className="relative z-10">
            <CardHeader className="pb-2 p-3 sm:p-6">
              <div className="flex items-start justify-between">
                {/* Token Info */}
                <div className="flex-1 min-w-0 pr-2 sm:pr-4">
                  <h3 className="text-lg sm:text-2xl font-bold text-gray-100 tracking-tight">
                    {token.symbol}
                  </h3>
                  <span className="text-xs sm:text-sm text-gray-400 block truncate max-w-full sm:max-w-[320px] font-medium">
                    {token.name}
                  </span>
                </div>
                {/* Social Links - Moved to right side */}
                {(token.websites?.length ||
                  Object.keys(token.socials || {}).length) && (
                  <div className="flex items-center gap-1 sm:gap-2">
                    {/* Social Media Links */}
                    {Object.entries(token.socials || {})
                      .filter(([_, url]) => url)
                      .map(([platform, url]) => {
                        const Icon: IconType =
                          {
                            discord: FaDiscord,
                            twitter: FaTwitter,
                            telegram: FaTelegram,
                          }[platform as keyof typeof token.socials] ||
                          FaDiscord;

                        if (!url) return null;

                        return (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-brand-400 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Icon size={14} className="sm:text-base" />
                          </a>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* 24h Change - Simple display without sparkline to avoid backend errors */}
              <div className="mt-2">
                <div className={`text-sm font-medium ${
                  (Number(token.change24h) || 0) >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}>
                  {token.change24h != null
                    ? `${Number(token.change24h).toFixed(1)}%`
                    : "N/A"} 24h
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-1 p-3 sm:p-6 sm:pt-2">
              {/* Stats Grid with Gradient Borders */}
              <div className="grid grid-cols-2 gap-1 sm:gap-2 text-[10px] sm:text-sm">
                {/* Price */}
                <div>
                  <span className="text-gray-400">Price</span>
                  <div className="font-medium text-gray-200 truncate">
                    {token.price ? formatTokenPrice(token.price) : "N/A"}
                  </div>
                </div>

                {/* 24h Change */}
                <div>
                  <span className="text-gray-400">24h</span>
                  <div
                    className={`font-medium ${
                      (Number(token.change24h) || 0) >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {token.change24h != null
                      ? `${Number(token.change24h).toFixed(1)}%`
                      : "N/A"}
                  </div>
                </div>


              </div>

              {/* Enhanced Sword Slider */}
              <div
                className={`transform transition-all duration-200 ease-out overflow-hidden ${
                  selectedTokens.has(token.contractAddress)
                    ? "h-[68px] sm:h-[72px] opacity-100 mt-3 sm:mt-4 scale-100"
                    : "h-0 opacity-0 mt-0 scale-95"
                }`}
              >
                <div
                  className="bg-gradient-to-r from-dark-300/50 via-dark-300/30 to-dark-300/50 rounded-lg p-2 sm:p-3 border border-dark-300/50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-1 sm:mb-2">
                    {/* Portfolio Weight */}
                    <label className="text-xs sm:text-sm font-medium text-gray-400 flex items-center gap-1">
                      <FaCoins size={10} className="text-brand-400 hidden sm:inline" />
                      Weight
                    </label>
                    <span className="text-xs sm:text-sm font-bold text-brand-400 tabular-nums">
                      {selectedTokens.get(token.contractAddress)}%
                    </span>
                  </div>

                  {/* Slider */}
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedTokens.get(token.contractAddress) || 0}
                      onChange={(e) => handleWeightChange(e, token)}
                      className="w-full h-1.5 bg-gradient-to-r from-dark-300 via-brand-500/20 to-dark-300 rounded-full appearance-none cursor-pointer
                        focus:outline-none focus:ring-2 focus:ring-brand-500/50
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-3
                        [&::-webkit-slider-thumb]:h-3
                        [&::-webkit-slider-thumb]:sm:w-4
                        [&::-webkit-slider-thumb]:sm:h-4
                        [&::-webkit-slider-thumb]:rounded-sm
                        [&::-webkit-slider-thumb]:rotate-45
                        [&::-webkit-slider-thumb]:bg-brand-400
                        [&::-webkit-slider-thumb]:hover:bg-brand-300
                        [&::-webkit-slider-thumb]:transition-colors
                        [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-webkit-slider-thumb]:border-2
                        [&::-webkit-slider-thumb]:border-dark-200
                        [&::-webkit-slider-thumb]:shadow-lg
                        [&::-moz-range-thumb]:w-3
                        [&::-moz-range-thumb]:h-3
                        [&::-moz-range-thumb]:sm:w-4
                        [&::-moz-range-thumb]:sm:h-4
                        [&::-moz-range-thumb]:rotate-45
                        [&::-moz-range-thumb]:rounded-sm
                        [&::-moz-range-thumb]:bg-brand-400
                        [&::-moz-range-thumb]:hover:bg-brand-300
                        [&::-moz-range-thumb]:transition-colors
                        [&::-moz-range-thumb]:cursor-pointer
                        [&::-moz-range-thumb]:border-2
                        [&::-moz-range-thumb]:border-dark-200
                        [&::-moz-range-thumb]:shadow-lg"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
        ))}
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
        {visibleTokens.map(token => (
          <TokenListItem
            key={token.contractAddress}
            token={token}
            isSelected={selectedTokens.has(token.contractAddress)}
            weight={selectedTokens.get(token.contractAddress) || 0}
            onSelect={() => handleCardClick(token)}
            onWeightChange={(weight: number) => onTokenSelect(token.contractAddress, weight)}
          />
        ))}
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