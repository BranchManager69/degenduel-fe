import React, { useEffect, useRef, useCallback } from "react";
import { OptimizedTokenCard } from "./OptimizedTokenCard";
import { Token } from "../../types";

interface OptimizedTokensGridProps {
  tokens: Token[];
  selectedTokenSymbol?: string | null;
  onTokenClick?: (token: Token) => void;
}

/**
 * Optimized TokensGrid component with better performance
 * - Simplified animations and background effects
 * - Replaced AnimatePresence with simpler CSS transitions
 * - Optimized scroll handling
 * - Reduced re-renders with memoization
 */
export const OptimizedTokensGrid: React.FC<OptimizedTokensGridProps> = React.memo(({ 
  tokens, 
  selectedTokenSymbol,
  onTokenClick
}) => {
  const selectedTokenRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<number | null>(null);

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

  // Memoized token click handler
  const handleTokenClick = useCallback((token: Token) => {
    if (onTokenClick) {
      onTokenClick(token);
    }
  }, [onTokenClick]);

  return (
    <div className="relative">
      {/* Lighter background effects - static instead of animated for better performance */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 via-transparent to-cyber-500/5"></div>
      </div>

      {/* Grid container */}
      <div className="relative grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 z-10">
        {tokens.map((token) => {
          const isSelected = token.symbol.toLowerCase() === selectedTokenSymbol?.toLowerCase();
          
          return (
            <div 
              key={token.contractAddress}
              ref={isSelected ? selectedTokenRef : null}
              className={`
                relative transition-all duration-300 ease-in-out
                ${isSelected ? 'z-20 scale-105 sm:scale-105' : 'z-10 hover:scale-100'}
              `}
            >
              {/* Selection indicator for mobile optimization */}
              {isSelected && (
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-cyber-500 flex items-center justify-center text-white text-xs font-bold shadow-lg z-30">
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
    </div>
  );
});

OptimizedTokensGrid.displayName = 'OptimizedTokensGrid';