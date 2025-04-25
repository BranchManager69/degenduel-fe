import React, { useEffect, useRef, useCallback, useState } from "react";
import { OptimizedTokenCard } from "./OptimizedTokenCard";
import { Token } from "../../types";

interface OptimizedTokensGridProps {
  tokens: Token[];
  selectedTokenSymbol?: string | null;
  onTokenClick?: (token: Token) => void;
}

/**
 * Optimized TokensGrid component with better performance
 * - Enhanced mobile experience with touch-friendly UI
 * - Responsive grid layout with adaptive columns
 * - Progressive loading and viewport optimization
 * - Efficient scroll handling with intersection observer
 * - Reduced re-renders with memoization
 */
export const OptimizedTokensGrid: React.FC<OptimizedTokensGridProps> = React.memo(({ 
  tokens, 
  selectedTokenSymbol,
  onTokenClick
}) => {
  const selectedTokenRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll to selected token with a delay to ensure rendering is complete
  useEffect(() => {
    if (selectedTokenSymbol && selectedTokenRef.current) {
      // Clear existing timeout if any
      if (scrollTimeout.current) {
        window.clearTimeout(scrollTimeout.current);
      }

      // Set a timeout to scroll after components have rendered
      scrollTimeout.current = window.setTimeout(() => {
        if (selectedTokenRef.current) {
          selectedTokenRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 300);
    }

    // Cleanup timeout on unmount
    return () => {
      if (scrollTimeout.current) {
        window.clearTimeout(scrollTimeout.current);
      }
    };
  }, [selectedTokenSymbol, tokens]);

  // Setup intersection observer for more efficient rendering
  useEffect(() => {
    // Skip setup if we have few tokens
    if (tokens.length <= 50) return;
    
    const options = {
      root: null,
      rootMargin: '600px', // Load tokens that are approaching the viewport
      threshold: 0.1
    };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && containerRef.current) {
          // Calculate visible range based on scroll position
          const scrollTop = window.scrollY;
          const viewportHeight = window.innerHeight;
          
          // Expand the range as user scrolls
          const startIndex = Math.max(0, Math.floor((scrollTop - 600) / 100));
          const endIndex = Math.min(tokens.length, Math.ceil((scrollTop + viewportHeight + 800) / 100));
          
          setVisibleRange({ 
            start: startIndex, 
            end: endIndex 
          });
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, options);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [tokens.length]);

  // Memoized token click handler
  const handleTokenClick = useCallback((token: Token) => {
    if (onTokenClick) {
      onTokenClick(token);
    }
  }, [onTokenClick]);

  // Determine visible tokens (either all tokens or just the visible range)
  const visibleTokens = tokens.length <= 50 
    ? tokens 
    : tokens.slice(visibleRange.start, visibleRange.end);

  return (
    <div className="relative" ref={containerRef}>
      {/* Lighter background effects - static for better performance */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 via-transparent to-cyber-500/5"></div>
      </div>

      {isMobile ? (
        /* Mobile-optimized grid with single column on very small screens, two columns on small screens */
        <div className="relative grid grid-cols-1 xs:grid-cols-2 gap-2 z-10">
          {visibleTokens.map((token) => {
            const isSelected = token.symbol.toLowerCase() === selectedTokenSymbol?.toLowerCase();
            
            return (
              <div 
                key={token.contractAddress}
                ref={isSelected ? selectedTokenRef : null}
                className={`
                  relative transition-all duration-300 ease-in-out 
                  ${isSelected ? 'z-20 ring-2 ring-brand-500' : 'z-10'}
                  touch-manipulation
                `}
              >
                {/* Mobile-optimized card structure directly in-grid for better performance */}
                <div 
                  className="p-3 bg-dark-200/70 backdrop-blur-sm rounded-lg cursor-pointer 
                  border border-dark-300/60 hover:border-brand-400/30"
                  onClick={() => handleTokenClick(token)}
                >
                  <div className="flex flex-col space-y-2">
                    {/* Simplified header for mobile */}
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-white">{token.symbol}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs 
                        ${Number(token.change24h) >= 0 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'}`}
                      >
                        {Number(token.change24h).toFixed(2)}%
                      </span>
                    </div>
                    
                    {/* Token info with mobile-friendly layout */}
                    <div className="flex justify-between items-center">
                      <span className="text-base text-white">${Number(token.price).toLocaleString()}</span>
                      <span className="text-xs text-gray-400 truncate">{token.name}</span>
                    </div>
                  </div>
                </div>
                
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-to-br from-brand-500 to-cyber-500 flex items-center justify-center text-white text-xs font-bold shadow-lg z-30">
                    ✦
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Desktop grid with more columns for larger screens */
        <div className="relative grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 z-10">
          {visibleTokens.map((token) => {
            const isSelected = token.symbol.toLowerCase() === selectedTokenSymbol?.toLowerCase();
            
            return (
              <div 
                key={token.contractAddress}
                ref={isSelected ? selectedTokenRef : null}
                className={`
                  relative transition-all duration-300 ease-in-out
                  ${isSelected ? 'z-20 scale-[1.02]' : 'z-10 hover:scale-[1.01]'}
                `}
              >
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-to-br from-brand-500 to-cyber-500 flex items-center justify-center text-white text-xs font-bold shadow-lg z-30">
                    ✦
                  </div>
                )}
                
                <OptimizedTokenCard 
                  token={token} 
                  isSelected={isSelected}
                  onClick={() => handleTokenClick(token)}
                />
              </div>
            );
          })}
        </div>
      )}
      
      {/* Virtual loading placeholder for better UX when progressively loading */}
      {tokens.length > 50 && visibleRange.end < tokens.length && (
        <div className="h-20 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-brand-500/50 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
});

OptimizedTokensGrid.displayName = 'OptimizedTokensGrid';