import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MiniTokenCard } from "./MiniTokenCard";
import { useStandardizedTokenData } from "../../hooks/data/useStandardizedTokenData";
import { TokenHelpers } from "../../types";

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
  maxInitialDisplay = 12,
  className = ""
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  
  // Get enough tokens to properly fill the display
  const { tokens: allTokens, isLoading, error } = useStandardizedTokenData(
    "all", 
    'marketCap', 
    { status: 'active' }, 
    5,  // maxHotTokens (not used here)
    24  // maxTopTokens - get 24 tokens to have a good selection
  );

  // Randomize tokens for variety
  const actualTokens = useMemo(() => {
    // Use tokens from the API
    if (allTokens && allTokens.length > 0) {
      // Shuffle the tokens array for random selection
      const shuffled = [...allTokens].sort(() => Math.random() - 0.5);
      return shuffled.map(token => token.symbol);
    }
    
    // Fallback to popular tokens if API fails
    return ['SOL', 'BONK', 'WIF', 'PEPE', 'DOGE', 'SHIB', 'BOME', 'POPCAT', 'MEW', 'FROG'];
  }, [allTokens]);
  
  // Determine which tokens to show
  const tokensToShow = useMemo(() => {
    if (isExpanded || actualTokens.length <= maxInitialDisplay) {
      return actualTokens;
    }
    return actualTokens.slice(0, maxInitialDisplay);
  }, [actualTokens, isExpanded, maxInitialDisplay]);
  
  const hasMoreTokens = actualTokens.length > maxInitialDisplay;
  const hiddenCount = actualTokens.length - maxInitialDisplay;
  
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
      {/* Compact grid - BIGGER icons, TIGHTER spacing */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-1.5">
        {tokensToShow.map((tokenSymbol, index) => {
          const token = allTokens?.find(t => t.symbol === tokenSymbol);
          
          return (
            <div 
              key={tokenSymbol} 
              className="w-12 h-12 sm:w-14 sm:h-14 animate-slide-in-up"
              style={{
                animationDelay: `${index * 50}ms`,
                animationFillMode: 'both'
              }}
            >
              <MiniTokenCard
                tokenSymbol={tokenSymbol}
                tokenImage={token?.image_url || undefined}
                bannerImage={token?.header_image_url || undefined}
                isPositive={(token?.change_24h ? Number(token.change_24h) : 0) >= 0}
                activityLevel="medium" // Default to medium activity for hot tokens
                onClick={() => {
                  // Navigate to token detail page
                  if (token) {
                    navigate(`/tokens/${TokenHelpers.getAddress(token)}`);
                  }
                }}
              />
            </div>
          );
        })}
        
        {/* Expand/Collapse Button */}
        {hasMoreTokens && (
          <div 
            className="w-12 h-12 sm:w-14 sm:h-14 animate-slide-in-up"
            style={{
              animationDelay: `${Math.min(tokensToShow.length, maxInitialDisplay) * 50}ms`,
              animationFillMode: 'both'
            }}
          >
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full h-full rounded-lg bg-dark-300/60 hover:bg-dark-300/80 border border-brand-400/30 hover:border-brand-400/50 transition-all duration-300 flex items-center justify-center group"
            >
              {isExpanded ? (
                // Collapse icon
                <svg className="w-4 h-4 text-brand-400 group-hover:text-brand-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              ) : (
                // Expand icon showing count
                <div className="flex flex-col items-center justify-center">
                  <svg className="w-3 h-3 text-brand-400 group-hover:text-brand-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="text-xs text-brand-400 group-hover:text-brand-300 font-mono leading-none">
                    {hiddenCount}
                  </span>
                </div>
              )}
            </button>
          </div>
        )}
      </div>
      
      {/* Summary text - more natural language */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          Popular tokens in contests
        </span>
        {hasMoreTokens && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-brand-400 hover:text-brand-300 transition-colors font-medium"
          >
            {isExpanded ? 'Show Less' : `Show ${hiddenCount} More`}
          </button>
        )}
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
            animation: slide-in-up 0.4s ease-out;
          }
        `
      }} />
    </div>
  );
};