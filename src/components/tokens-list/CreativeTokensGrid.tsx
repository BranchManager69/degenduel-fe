import React, { useEffect, useRef, useState, useMemo } from "react";
import { Token, TokenHelpers } from "../../types";
import { OptimizedTokenCard } from "./OptimizedTokenCard";
import { MemoizedTokenCard } from "./MemoizedTokenCard";
import "../portfolio-selection/portfolio-animations.css";

interface CreativeTokensGridProps {
  tokens: Token[];
  featuredTokens?: Token[]; // NEW: Separate stable featured tokens
  selectedTokenSymbol?: string | null;
  backContent?: 'details' | 'portfolio'; // Control what shows on card back
  renderBackContent?: (token: Token) => React.ReactNode; // NEW: Custom back content renderer
  selectedTokens?: Map<string, number>; // NEW: For portfolio selection highlighting
}

/**
 * Custom comparison function for React.memo to prevent unnecessary re-renders
 * Optimized for stable array references from parent component
 */
const arePropsEqual = (prevProps: CreativeTokensGridProps, nextProps: CreativeTokensGridProps) => {
  // Fast reference check - if arrays are same reference, props are equal
  if (prevProps.tokens === nextProps.tokens &&
      prevProps.featuredTokens === nextProps.featuredTokens &&
      prevProps.selectedTokenSymbol === nextProps.selectedTokenSymbol &&
      prevProps.backContent === nextProps.backContent &&
      prevProps.renderBackContent === nextProps.renderBackContent &&
      prevProps.selectedTokens === nextProps.selectedTokens) {
    return true;
  }
  
  // If tokens array changed reference, check if length is different (new/removed tokens)
  if (prevProps.tokens.length !== nextProps.tokens.length) return false;
  
  // Check featuredTokens length
  if (prevProps.featuredTokens?.length !== nextProps.featuredTokens?.length) return false;
  
  // Check other primitive props
  if (prevProps.selectedTokenSymbol !== nextProps.selectedTokenSymbol ||
      prevProps.backContent !== nextProps.backContent) return false;
  
  // Check function/object references
  if (prevProps.renderBackContent !== nextProps.renderBackContent ||
      prevProps.selectedTokens !== nextProps.selectedTokens) return false;
  
  return false; // Default to re-render if we can't prove equality
};

/**
 * CreativeTokensGrid - A redesigned grid with multi-tiered layout,
 * visual groupings, and dynamic sizing
 */
export const CreativeTokensGrid: React.FC<CreativeTokensGridProps> = React.memo(({ 
  tokens, 
  featuredTokens = [], // NEW: Default to empty array
  selectedTokenSymbol,
  backContent = 'details', // Default to current detailed view
  renderBackContent,
  selectedTokens
}) => {
  const selectedTokenRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track which tokens have already been animated
  const [animatedTokens, setAnimatedTokens] = useState<Set<string>>(new Set());
  
  // Track price changes for flash effect
  const [priceFlashTokens, setPriceFlashTokens] = useState<Map<string, 'green' | 'red'>>(new Map());
  const previousPricesRef = useRef<Map<string, number>>(new Map());
  
  // Store flip states separately to prevent loss on re-render
  const [flipStates, setFlipStates] = useState<Map<string, boolean>>(new Map());

  // Update animated tokens when new tokens arrive
  useEffect(() => {
    // Mark all current tokens as animated after a delay
    const newAnimatedTokens = new Set<string>();
    tokens.forEach(token => {
      const key = token.contractAddress || token.address || token.symbol;
      if (key) {
        newAnimatedTokens.add(key);
      }
    });
    
    // Update the set after animation completes
    setTimeout(() => {
      setAnimatedTokens(newAnimatedTokens);
    }, 1000); // After animation duration
  }, [tokens]);
  
  // Memoize combined tokens to prevent array recreation
  const allTokens = useMemo(() => [...featuredTokens, ...tokens], [featuredTokens, tokens]);
  
  // Track price changes and trigger flash effects (optimized)
  useEffect(() => {
    const newFlashTokens = new Map<string, 'green' | 'red'>();
    
    allTokens.forEach(token => {
      const address = token.contractAddress || token.address;
      if (!address) return;
      
      const currentPrice = token.price;
      const previousPrice = previousPricesRef.current.get(address);
      
      if (previousPrice !== undefined && currentPrice !== undefined && currentPrice !== previousPrice) {
        // Price changed!
        if (currentPrice > previousPrice) {
          newFlashTokens.set(address, 'green');
        } else if (currentPrice < previousPrice) {
          newFlashTokens.set(address, 'red');
        }
        
        // Remove flash after animation
        setTimeout(() => {
          setPriceFlashTokens(prev => {
            const updated = new Map(prev);
            updated.delete(address);
            return updated;
          });
        }, 600); // Match animation duration
      }
      
      // Update previous price
      if (currentPrice !== undefined) {
        previousPricesRef.current.set(address, currentPrice);
      }
    });
    
    // Apply new flashes only if there are changes
    if (newFlashTokens.size > 0) {
      setPriceFlashTokens(prev => new Map([...prev, ...newFlashTokens]));
    }
  }, [allTokens]);

  // Scroll to selected token with a delay
  useEffect(() => {
    if (selectedTokenSymbol && selectedTokenRef.current) {
      const timeout = setTimeout(() => {
        selectedTokenRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 300);
      
      return () => clearTimeout(timeout);
    }
  }, [selectedTokenSymbol]);

  // Token click handler removed - cards now flip instead of navigate

  // NEW: If no featured tokens provided, show ALL tokens in the hot grid format
  const trendingTokens = featuredTokens.length > 0 ? featuredTokens : tokens;
  
  // Only show rest tokens if we have featured tokens
  const restTokens = featuredTokens.length > 0 ? tokens : [];

  // We no longer need this function as we're using inline styling
  // const getTrendColor = (change: string) => {
  //   const changeNum = parseFloat(change);
  //   return changeNum >= 0 ? 'bg-green-500' : 'bg-red-500';
  // };

  // TokenCardBackground removed - now handled inside MemoizedTokenCard

  // Helper functions removed - now handled inside MemoizedTokenCard

  // HottestTokenCard component has been replaced by MemoizedTokenCard

  return (
    <div className="relative">
      
      {/* Background effects - Enhanced cyberpunk grid */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-cyber-500/10"></div>
        
        {/* Horizontal grid lines with glitch effect */}
        <div className="absolute w-full h-px top-[25%] bg-brand-500/20"></div>
        <div className="absolute w-[95%] h-px top-[25.5%] left-[2%] bg-brand-500/10"></div>
        <div className="absolute w-full h-px top-[65%] bg-cyber-500/20"></div>
        <div className="absolute w-[97%] h-px top-[65.5%] right-0 bg-cyber-500/10"></div>
        
        {/* Vertical grid lines */}
        <div className="absolute h-full w-px left-1/3 bg-brand-500/10"></div>
        <div className="absolute h-[90%] w-px left-[33.5%] top-[5%] bg-brand-500/5"></div>
        <div className="absolute h-full w-px right-1/3 bg-cyber-500/10"></div>
        
        {/* Corner angular cuts */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-brand-500/30 rounded-tl-md"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500/30 rounded-tr-md"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-brand-500/30 rounded-bl-md"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/30 rounded-br-md"></div>
        
        {/* Digital code lines */}
        <div className="absolute top-2 left-12 w-20 h-2 flex items-center">
          <div className="w-1 h-1 bg-brand-500/40 mr-1"></div>
          <div className="w-3 h-1 bg-brand-500/30 mr-1"></div>
          <div className="w-2 h-1 bg-brand-500/50 mr-1"></div>
          <div className="w-4 h-1 bg-brand-500/20"></div>
        </div>
        <div className="absolute bottom-2 right-12 w-20 h-2 flex items-center justify-end">
          <div className="w-4 h-1 bg-cyan-500/20 mr-1"></div>
          <div className="w-2 h-1 bg-cyan-500/50 mr-1"></div>
          <div className="w-3 h-1 bg-cyan-500/30 mr-1"></div>
          <div className="w-1 h-1 bg-cyan-500/40"></div>
        </div>
      </div>

      {/* Main grid container */}
      <div ref={containerRef} className="relative z-10">
        
        {/* ENHANCED HOTTEST TOKENS SECTION */}
        {trendingTokens.length > 0 && (
          <div className="mb-16">
            
            {/* PREMIUM GRID LAYOUT - 2 cols on mobile for better space usage */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {trendingTokens.map((token, index) => {
                const contractAddress = TokenHelpers.getAddress(token);
                const isFlipped = flipStates.get(contractAddress) || false;
                const flashType = priceFlashTokens.get(contractAddress);
                const tokenKey = token.contractAddress || token.address || token.symbol;
                const isNewToken = tokenKey ? !animatedTokens.has(tokenKey) : false;
                
                return (
                  <MemoizedTokenCard
                    key={contractAddress}
                    token={token}
                    index={index}
                    backContent={backContent}
                    isFlipped={isFlipped}
                    onFlipChange={(flipped) => {
                      setFlipStates(prev => {
                        const newMap = new Map(prev);
                        newMap.set(contractAddress, flipped);
                        return newMap;
                      });
                    }}
                    selectedTokensMap={selectedTokens}
                    renderBackContentFn={renderBackContent}
                    isNewToken={isNewToken}
                    flashType={flashType || undefined}
                  />
                );
              })}
            </div>
            
          </div>
        )}
        
        {/* Tier 3: Standard grid for remaining tokens */}
        {restTokens.length > 0 && (
          <div>
            <div className="flex items-center mb-3 relative">
              <div className="w-1.5 h-6 bg-purple-500 mr-2 -skew-x-12"></div>
              <h3 className="text-xl font-bold text-white relative">
                All Tokens
                <span className="absolute -bottom-1 left-0 w-full h-px bg-gradient-to-r from-purple-500/70 to-transparent"></span>
              </h3>
              
              {/* Visual line with digital circuit look */}
              <div className="ml-4 flex items-center flex-1">
                <div className="w-2 h-2 border border-purple-500/50 rotate-45"></div>
                <div className="h-px bg-gradient-to-r from-purple-500/50 to-transparent flex-grow"></div>
                <div className="w-1 h-1 bg-purple-500/50 mr-1"></div>
                <div className="w-2 h-1 bg-purple-500/40 mr-4"></div>
                <span className="text-xs text-purple-400 uppercase tracking-wider">Market Data</span>
              </div>
            </div>
            
            {/* Optimized grid layout for mobile - 3 columns on small screens for space efficiency */}
            <div className="grid grid-cols-3 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1 xs:gap-2 sm:gap-3">
              {restTokens.map(token => {
                const isSelected = token.symbol.toLowerCase() === selectedTokenSymbol?.toLowerCase();
                
                return (
                  <div 
                    key={token.contractAddress}
                    ref={isSelected ? selectedTokenRef : null}
                    className={`relative transition-all duration-300 ease-in-out touch-manipulation
                      ${isSelected ? 'scale-105 z-20' : 'hover:scale-[1.03] z-10'}`}
                  >
                    <OptimizedTokenCard 
                      token={token} 
                      isSelected={isSelected}
                      // onClick removed to enable card flipping
                    />
                  </div>
                );
              })}
            </div>
            
            {/* Mobile scroll indicator - only visible on smallest screens when there are many tokens */}
            {restTokens.length > 6 && (
              <div className="flex justify-center items-center mt-3 sm:hidden">
                <div className="w-20 h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent rounded-full"></div>
              </div>
            )}
          </div>
        )}
        
        {/* Empty state - responsive for mobile */}
        {tokens.length === 0 && (
          <div className="flex flex-col items-center justify-center p-6 sm:p-10 bg-dark-200/60 backdrop-blur-md rounded-lg border border-dark-300/60">
            <div className="text-xl sm:text-2xl text-white/50 mb-2">No tokens found</div>
            <div className="text-sm sm:text-base text-gray-400 text-center">Try adjusting your search or filters</div>
            
            {/* Mobile-friendly visual indicator */}
            <div className="mt-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-brand-500/50 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-cyan-500/50 rounded-full animate-pulse" style={{ animationDelay: '100ms' }}></div>
              <div className="w-2 h-2 bg-yellow-500/50 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}, arePropsEqual);

// getTokenColor helper removed - now handled inside MemoizedTokenCard

CreativeTokensGrid.displayName = 'CreativeTokensGrid';