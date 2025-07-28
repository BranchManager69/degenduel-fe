import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Token, TokenHelpers } from "../../types";
import { MiniTokenCard } from "./MiniTokenCard";

interface AllowedTokensGridProps {
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
  className = ""
}) => {
  const [currentSet, setCurrentSet] = useState(0);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const navigate = useNavigate();

  // Dynamic token count based on screen width
  useEffect(() => {
    const updateVisibleCount = () => {
      const width = window.innerWidth;
      if (width >= 1400) {
        setVisibleCount(20); // XL screens - full desktop
      } else if (width >= 1200) {
        setVisibleCount(15); // Large screens
      } else if (width >= 1024) {
        setVisibleCount(12); // Desktop
      } else if (width >= 768) {
        setVisibleCount(10); // Tablet
      } else if (width >= 640) {
        setVisibleCount(8);  // Large mobile
      } else {
        setVisibleCount(6);  // Small mobile
      }
    };

    updateVisibleCount();
    window.addEventListener('resize', updateVisibleCount);
    return () => window.removeEventListener('resize', updateVisibleCount);
  }, []);
  
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

  // Auto-rotate showcase logic
  useEffect(() => {
    if (tokens.length <= visibleCount) return; // No rotation needed if we have few tokens
    
    const interval = setInterval(() => {
      setIsTransitioning(true);
      
      setTimeout(() => {
        setCurrentSet(prev => {
          const totalSets = Math.ceil(tokens.length / visibleCount);
          return (prev + 1) % totalSets;
        });
        setIsTransitioning(false);
      }, 300); // Half transition duration
    }, 4000); // Rotate every 4 seconds

    return () => clearInterval(interval);
  }, [tokens.length, visibleCount]);

  // Get current set of tokens to display
  const tokensToShow = useMemo(() => {
    const startIndex = currentSet * visibleCount;
    const endIndex = startIndex + visibleCount;
    return tokens.slice(startIndex, endIndex);
  }, [tokens, currentSet, visibleCount]);

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
  if (tokens.length === 0) {
    return (
      <div className="text-gray-400 text-sm italic">
        All active tokens available for selection
      </div>
    );
  }
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Rotating showcase - Single row with exact token count */}
      <div 
        className={`flex gap-1 transition-all duration-600 ${
          isTransitioning ? 'opacity-40 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        {tokensToShow.map((token, index) => {
          return (
            <div 
              key={`${currentSet}-${token.symbol || token.id}-${index}`} 
              className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 animate-slide-in-up transition-all duration-300"
              style={{
                animationDelay: `${index * 40}ms`,
                animationFillMode: 'both'
              }}
            >
              <MiniTokenCard
                tokenSymbol={token.symbol}
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