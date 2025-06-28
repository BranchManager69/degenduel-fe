import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStandardizedTokenData } from "../../hooks/data/useStandardizedTokenData";
import { TokenHelpers } from "../../types";
import { MiniTokenCard } from "./MiniTokenCard";

interface AllowedTokensGridProps {
  maxInitialDisplay?: number;
  className?: string;
}

/**
 * Sleek expandable grid of mini token cards for allowed tokens display
 * Features:
 * - Tight, compact grid layout
 * - Expandable to show more tokens
 * - Beautiful visual effects inherited from OptimizedTokenCard
 * - Responsive grid sizing
 */
export const AllowedTokensGrid: React.FC<AllowedTokensGridProps> = ({
  maxInitialDisplay = 10,
  className = ""
}) => {
  const [visibleCount, setVisibleCount] = useState(maxInitialDisplay);
  const navigate = useNavigate();
  
  // Get enough tokens to properly fill the display
  const { tokens: allTokens, isLoading, error } = useStandardizedTokenData(
    "all", 
    'marketCap', 
    { status: 'active' }, 
    20,  // maxHotTokens (not used here)
    3000  // maxTopTokens - fetch the full token pool
  );

  // Randomize tokens for variety
  const actualTokens = useMemo(() => {
    if (allTokens && allTokens.length > 0) {
      // Only include tokens with an image
      const filtered = allTokens.filter(token => !!token.image_url);
      const shuffled = [...filtered].sort(() => Math.random() - 0.5);
      return shuffled.map(token => token.symbol);
    }
    return [];
  }, [allTokens]);

  // Determine which tokens to show
  const tokensToShow = useMemo(() => {
    return actualTokens.slice(0, visibleCount);
  }, [actualTokens, visibleCount]);

  const hasMoreTokens = visibleCount < actualTokens.length;
  const canShowLess = visibleCount > maxInitialDisplay;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <div className="w-4 h-4 border-2 border-gray-600 border-t-brand-400 rounded-full animate-spin"></div>
        Loading active tokens...
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-red-400 text-sm">
        {error}
      </div>
    );
  }

  // No tokens found
  if (actualTokens.length === 0) {
    return (
      <div className="text-gray-400 text-sm italic">
        All active tokens available for selection
      </div>
    );
  }
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Compact grid - TIGHTER spacing (2px gap) */}
      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-[2px]">
        {tokensToShow.map((tokenSymbol, index) => {
          const token = allTokens?.find(t => t.symbol === tokenSymbol);
          return (
            <div 
              key={tokenSymbol} 
              className="w-12 h-12 sm:w-14 sm:h-14 animate-slide-in-up transition-all duration-300"
              style={{
                animationDelay: `${index * 30}ms`,
                animationFillMode: 'both'
              }}
            >
              <MiniTokenCard
                tokenSymbol={tokenSymbol}
                tokenImage={token?.image_url || undefined}
                bannerImage={token?.header_image_url || undefined}
                isPositive={(token?.change_24h ? Number(token.change_24h) : 0) >= 0}
                activityLevel="medium"
                onClick={() => {
                  if (token) {
                    navigate(`/tokens/${TokenHelpers.getAddress(token)}`);
                  }
                }}
              />
            </div>
          );
        })}
      </div>
      {/* Show More / Show Less controls below the grid */}
      <div className="flex justify-end text-xs text-gray-500">
        <div className="flex gap-2">
          {hasMoreTokens && (
            <button
              onClick={() => setVisibleCount(v => Math.min(v + maxInitialDisplay, actualTokens.length))}
              className="text-brand-400 hover:text-brand-300 transition-colors font-medium"
            >
              Show 10 More
            </button>
          )}
          {canShowLess && (
            <button
              onClick={() => setVisibleCount(maxInitialDisplay)}
              className="text-brand-400 hover:text-brand-300 transition-colors font-medium"
            >
              Show Less
            </button>
          )}
        </div>
      </div>
      {/* Custom CSS for slide-in animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes slide-in-up {
            0% {
              opacity: 0;
              transform: translateY(20px) scale(0.9);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          .animate-slide-in-up {
            animation: slide-in-up 0.3s ease-out;
          }
        `
      }} />
    </div>
  );
};