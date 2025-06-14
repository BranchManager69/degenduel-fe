import React, { useCallback, useEffect, useRef } from "react";
import { Token, TokenHelpers } from "../../types";
import { formatNumber, formatPercentage, formatTokenPrice } from "../../utils/format";
import { OptimizedTokenCard } from "./OptimizedTokenCard";

interface CreativeTokensGridProps {
  tokens: Token[];
  featuredTokens?: Token[]; // NEW: Separate stable featured tokens
  selectedTokenSymbol?: string | null;
  onTokenClick?: (token: Token) => void;
}

/**
 * CreativeTokensGrid - A redesigned grid with multi-tiered layout,
 * visual groupings, and dynamic sizing
 */
export const CreativeTokensGrid: React.FC<CreativeTokensGridProps> = React.memo(({ 
  tokens, 
  featuredTokens = [], // NEW: Default to empty array
  selectedTokenSymbol,
  onTokenClick
}) => {
  const selectedTokenRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Memoized token click handler
  const handleTokenClick = useCallback((token: Token) => {
    if (onTokenClick) {
      onTokenClick(token);
    }
  }, [onTokenClick]);

  // NEW: If no featured tokens provided, show ALL tokens in the hot grid format
  const trendingTokens = featuredTokens.length > 0 ? featuredTokens : tokens;
  
  // Only show rest tokens if we have featured tokens
  const restTokens = featuredTokens.length > 0 ? tokens : [];

  // We no longer need this function as we're using inline styling
  // const getTrendColor = (change: string) => {
  //   const changeNum = parseFloat(change);
  //   return changeNum >= 0 ? 'bg-green-500' : 'bg-red-500';
  // };

  // ENHANCED HOTTEST TOKEN CARD - Visually stunning design
  const HottestTokenCard = ({ token, index }: { token: Token, index: number }) => {
    const isSelected = token.symbol.toLowerCase() === selectedTokenSymbol?.toLowerCase();
    
    // Check if this is DUEL token (forced at position 0)
    const isDuel = token.symbol === 'DUEL' && index === 0;
    
    // Backend already calculated the hotness - use position in list as score
    const isTopThree = !isDuel && index < 4; // Top 3 excluding DUEL
    const changeNum = Number(token.change_24h || token.change24h) || 0;
    
    // Actual rank (0 for DUEL, then 1, 2, 3...)
    const displayRank = isDuel ? 0 : index;
    
    // Dynamic rank colors for top 3
    const getRankStyle = (rank: number) => {
      if (isDuel) return { bg: 'from-yellow-500 to-yellow-600', glow: 'shadow-yellow-500/50' };
      switch(rank) {
        case 1: return { bg: 'from-yellow-500 to-yellow-600', glow: 'shadow-yellow-500/50' };
        case 2: return { bg: 'from-gray-400 to-gray-500', glow: 'shadow-gray-400/50' };
        case 3: return { bg: 'from-amber-600 to-amber-700', glow: 'shadow-amber-600/50' };
        default: return { bg: 'from-brand-500 to-brand-600', glow: 'shadow-brand-500/30' };
      }
    };
    
    const rankStyle = getRankStyle(displayRank);
    
    return (
      <div 
        className={`group relative overflow-hidden rounded-2xl transition-all duration-500 cursor-pointer backdrop-blur-xl
          ${isSelected ? 'ring-4 ring-yellow-500/60 scale-105 z-30' : 'hover:scale-[1.03] z-10'}
          ${isDuel ? 'ring-2 ring-purple-500/60 shadow-[0_0_20px_rgba(147,51,234,0.4)]' : ''}
          ${isTopThree ? 'bg-gradient-to-br from-dark-100/90 via-dark-200/80 to-dark-300/90' : 'bg-dark-200/70'}
          ${isTopThree ? 'shadow-2xl ' + rankStyle.glow : 'shadow-xl shadow-black/20'}
        `}
        onClick={() => handleTokenClick(token)}
      >
        {/* DUEL SPECIAL EFFECT */}
        {isDuel && (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-purple-600/10 animate-pulse" />
        )}
        
        {/* STUNNING BANNER BACKGROUND */}
        <div className="absolute inset-0 overflow-hidden">
          {(token.header_image_url) ? (
            <>
              <img 
                src={token.header_image_url || ''} 
                alt={token.symbol}
                className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                style={{ 
                  objectPosition: 'center center',
                  animation: 'bannerScan 60s ease-in-out infinite'
                }}
              />
              {/* Neutral gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-black/20 transition-all duration-500" />
            </>
          ) : (
            <div 
              className="absolute inset-0 transform group-hover:scale-110 transition-transform duration-700" 
              style={{
                background: `linear-gradient(135deg, ${token.color || getTokenColor(token.symbol)} 0%, rgba(18, 16, 25, 0.9) 100%)`,
              }}
            />
          )}
          
        </div>

        {/* MAIN CONTENT */}
        <div className="relative z-10 p-4 h-full flex flex-col justify-between">
          {/* MIDDLE - TOKEN INFO WITH RANK */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-3">
              <div className="flex items-start justify-between">
                <h3 className={`${token.symbol.length >= 9 ? 'text-3xl' : 'text-4xl'} font-bold text-white`} style={{ 
                  textShadow: '6px 6px 12px rgba(0,0,0,1), -4px -4px 8px rgba(0,0,0,1), 3px 3px 6px rgba(0,0,0,1), 0px 0px 10px rgba(0,0,0,0.9)', 
                  WebkitTextStroke: '1.5px rgba(0,0,0,0.7)' 
                }}>
                  {token.symbol}
                </h3>
                
                {/* RANK NUMBER - on same line as symbol */}
                {!isDuel && displayRank && (
                  <span className={`font-bold ml-2 ${
                    displayRank === 1 ? 'text-yellow-400' : 
                    displayRank === 2 ? 'text-gray-300' : 
                    displayRank === 3 ? 'text-amber-600' : 
                    'text-white/60'
                  }`} style={{
                    fontSize: '14px',
                    textShadow: 
                      displayRank === 1 ? '0 0 10px rgba(251, 191, 36, 0.6), 2px 2px 4px rgba(0,0,0,1)' :
                      displayRank === 2 ? '0 0 10px rgba(209, 213, 219, 0.6), 2px 2px 4px rgba(0,0,0,1)' :
                      displayRank === 3 ? '0 0 10px rgba(217, 119, 6, 0.6), 2px 2px 4px rgba(0,0,0,1)' :
                      '2px 2px 4px rgba(0,0,0,1)',
                    fontWeight: 700,
                  }}>
                    #{displayRank}
                  </span>
                )}
              </div>
              <p className="text-gray-300 text-sm truncate mt-1" style={{
                textShadow: '2px 2px 4px rgba(0,0,0,0.9)'
              }}>
                {token.name}
              </p>
            </div>
            
            {/* MARKET CAP AND CHANGE - side by side */}
            <div className="flex items-center justify-between">
              {/* Market Cap - left side */}
              <div className="text-base font-bold text-white" style={{ 
                textShadow: '2px 2px 4px rgba(0,0,0,0.9), 1px 1px 2px rgba(0,0,0,1)' 
              }}>
                ${formatNumber(TokenHelpers.getMarketCap(token), 'short')} MC
              </div>
              
              {/* Percentage change - right side */}
              <div className={`text-sm font-bold font-sans ${changeNum >= 0 ? 'text-green-400' : 'text-red-400'}`} style={{ 
                textShadow: '2px 2px 4px rgba(0,0,0,0.9), 1px 1px 2px rgba(0,0,0,1)' 
              }}>
                {changeNum >= 0 ? '↗' : '↘'} {formatPercentage(TokenHelpers.getPriceChange(token), false)}
              </div>
            </div>
          </div>
          
          {/* BOTTOM - PRICE */}
          <div>
            <div className="text-xs text-gray-300 whitespace-nowrap" style={{ 
              textShadow: '2px 2px 4px rgba(0,0,0,0.9), 1px 1px 2px rgba(0,0,0,1)' 
            }}>
              {formatTokenPrice(TokenHelpers.getPrice(token))}
            </div>
          </div>
        </div>
        
        {/* SELECTION GLOW EFFECT */}
        {isSelected && (
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-500/20 via-transparent to-yellow-500/20 animate-pulse pointer-events-none" />
        )}
        
        {/* HOVER SHIMMER EFFECT */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[300%] transition-transform duration-1000" />
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      {/* CSS for banner scanning animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes bannerScan {
            0%, 100% {
              object-position: center center;
            }
            25% {
              object-position: left center;
            }
            50% {
              object-position: center center;
            }
            75% {
              object-position: right center;
            }
          }
        `
      }} />
      
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
            
            {/* PREMIUM GRID LAYOUT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {trendingTokens.map((token, index) => (
                <HottestTokenCard key={token.contractAddress} token={token} index={index} />
              ))}
            </div>
            
            {/* BOTTOM DECORATIVE ELEMENTS */}
            <div className="mt-12 relative">
              <div className="flex items-center justify-center">
                <div className="h-px w-32 bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent" />
                <div className="mx-4 w-6 h-6 border-2 border-yellow-500/40 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-yellow-500/60 rounded-full animate-ping" />
                </div>
                <div className="h-px w-32 bg-gradient-to-l from-transparent via-yellow-500/40 to-transparent" />
              </div>
              
              <div className="text-center mt-4">
                <p className="text-gray-500 text-sm font-medium">
                  🚀 Powered by DegenDuel's proprietary scoring algorithm • Real-time market intelligence
                </p>
              </div>
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
                      onClick={() => handleTokenClick(token)}
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
              <div className="w-2 h-2 bg-cyan-500/50 rounded-full animate-pulse delay-100"></div>
              <div className="w-2 h-2 bg-yellow-500/50 rounded-full animate-pulse delay-200"></div>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
});

// Helper function to get a color based on token symbol  
const getTokenColor = (symbol: string): string => {
  const colors: Record<string, string> = {
    SOL: '#14F195',
    BTC: '#F7931A',
    ETH: '#627EEA',
    DOGE: '#C3A634',
    ADA: '#0033AD',
    WIF: '#9945FF',
    PEPE: '#479F53',
    BONK: '#F2A900',
    SHIB: '#FFA409'
  };
  return colors[symbol] || '#7F00FF'; // Default to brand purple
};

CreativeTokensGrid.displayName = 'CreativeTokensGrid';