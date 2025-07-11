import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Token, TokenHelpers } from "../../types";
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
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Fetch a small sample of tokens efficiently
  useEffect(() => {
    const fetchSampleTokens = async () => {
      try {
        setIsLoading(true);
        // Fetch just 50 trending tokens for the example grid
        const response = await fetch('/api/tokens/trending?limit=50&offset=0&format=paginated');
        if (!response.ok) {
          throw new Error('Failed to fetch tokens');
        }
        
        const data = await response.json();
        if (data.tokens && Array.isArray(data.tokens)) {
          // Filter tokens with images and randomize for variety
          const tokensWithImages = data.tokens.filter((token: any) => token.image_url);
          const shuffled = [...tokensWithImages].sort(() => Math.random() - 0.5);
          setTokens(shuffled);
        }
      } catch (err: any) {
        console.error('Failed to fetch sample tokens:', err);
        setError(err.message || 'Failed to load tokens');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSampleTokens();
  }, []);

  // Get token symbols for display
  const actualTokens = useMemo(() => {
    return tokens.map(token => token.symbol);
  }, [tokens]);

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
          const token = tokens.find((t: Token) => t.symbol === tokenSymbol);
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