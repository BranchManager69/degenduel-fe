import React, { useEffect, useRef, useCallback } from "react";
import { OptimizedTokenCard } from "./OptimizedTokenCard";
import { Token } from "../../types";
import { formatNumber } from "../../utils/format";

interface CreativeTokensGridProps {
  tokens: Token[];
  selectedTokenSymbol?: string | null;
  onTokenClick?: (token: Token) => void;
}

/**
 * CreativeTokensGrid - A redesigned grid with multi-tiered layout,
 * visual groupings, and dynamic sizing
 */
export const CreativeTokensGrid: React.FC<CreativeTokensGridProps> = React.memo(({ 
  tokens, 
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

  // We only need hotness calculation now since we removed the other sections
  
  // ENHANCED "hotness" calculation using new multi-timeframe data
  const calculateHotness = (token: Token) => {
    // Short-term momentum (5m, 1h) - 40% weight
    const change5m = parseFloat(token.priceChanges?.["5m"] || "0");
    const change1h = parseFloat(token.priceChanges?.["1h"] || "0");
    const shortTermMomentum = (Math.abs(change5m) + Math.abs(change1h)) / 2;
    
    // Volume activity across timeframes - 30% weight
    const volume5m = parseFloat(token.volumes?.["5m"] || "0");
    const volume1h = parseFloat(token.volumes?.["1h"] || "0");
    const volume24h = parseFloat(token.volume24h || "0");
    const avgVolume = (volume5m + volume1h + volume24h) / 3;
    const volumeNormalized = Math.min(avgVolume / 10000000000, 1); // Cap at 10B
    
    // Transaction activity - 20% weight
    const buys5m = token.transactions?.["5m"]?.buys || 0;
    const sells5m = token.transactions?.["5m"]?.sells || 0;
    const buys1h = token.transactions?.["1h"]?.buys || 0;
    const sells1h = token.transactions?.["1h"]?.sells || 0;
    const totalActivity = buys5m + sells5m + buys1h + sells1h;
    const activityNormalized = Math.min(totalActivity / 1000, 1); // Cap at 1000 trades
    
    // Priority score from backend - 10% weight
    const priorityNormalized = (token.priorityScore || 0) / 100;
    
    // Combined hotness formula
    return (
      (shortTermMomentum / 10) * 0.4 +  // Short-term price movement
      volumeNormalized * 0.3 +           // Volume activity
      activityNormalized * 0.2 +         // Transaction count
      priorityNormalized * 0.1           // Backend priority
    );
  };
  
  // Hottest tokens by enhanced algorithm
  const tokensByHotness = [...tokens].sort((a, b) => 
    calculateHotness(b) - calculateHotness(a)
  );
  
  // Create our groupings based on the sorted lists
  const trendingTokens = tokensByHotness.slice(0, 12);   // Top 12 hottest tokens for enhanced display
  
  // Exclude tokens already shown in hottest section
  const featuredTokenAddresses = new Set(
    trendingTokens.map(t => t.contractAddress)
  );
  
  const restTokens = tokens.filter(
    token => !featuredTokenAddresses.has(token.contractAddress)
  );

  // We no longer need this function as we're using inline styling
  // const getTrendColor = (change: string) => {
  //   const changeNum = parseFloat(change);
  //   return changeNum >= 0 ? 'bg-green-500' : 'bg-red-500';
  // };

  // ENHANCED HOTTEST TOKEN CARD - Visually stunning design
  const HottestTokenCard = ({ token, index }: { token: Token, index: number }) => {
    const isSelected = token.symbol.toLowerCase() === selectedTokenSymbol?.toLowerCase();
    
    // Calculate hotness score for display
    const hotnessScore = calculateHotness(token) * 100;
    const isTopThree = index < 3;
    const changeNum = parseFloat(token.change24h);
    
    // Dynamic rank colors for top 3
    const getRankStyle = (rank: number) => {
      switch(rank) {
        case 0: return { bg: 'from-yellow-500 to-yellow-600', glow: 'shadow-yellow-500/50', icon: '👑' };
        case 1: return { bg: 'from-gray-400 to-gray-500', glow: 'shadow-gray-400/50', icon: '🥈' };
        case 2: return { bg: 'from-amber-600 to-amber-700', glow: 'shadow-amber-600/50', icon: '🥉' };
        default: return { bg: 'from-brand-500 to-brand-600', glow: 'shadow-brand-500/30', icon: '🔥' };
      }
    };
    
    const rankStyle = getRankStyle(index);
    
    return (
      <div 
        className={`group relative overflow-hidden rounded-2xl transition-all duration-500 cursor-pointer backdrop-blur-xl
          ${isSelected ? 'ring-4 ring-yellow-500/60 scale-105 z-30' : 'hover:scale-[1.03] z-10'}
          ${isTopThree ? 'bg-gradient-to-br from-dark-100/90 via-dark-200/80 to-dark-300/90' : 'bg-dark-200/70'}
          ${isTopThree ? 'shadow-2xl ' + rankStyle.glow : 'shadow-xl shadow-black/20'}
        `}
        onClick={() => handleTokenClick(token)}
      >
        {/* STUNNING BANNER BACKGROUND */}
        <div className="absolute inset-0 overflow-hidden">
          {(token.images?.headerImage || token.images?.imageUrl) ? (
            <>
              <img 
                src={token.images.headerImage || token.images.imageUrl} 
                alt={token.symbol}
                className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
              />
              {/* Dynamic gradient overlay based on performance */}
              <div className={`absolute inset-0 bg-gradient-to-t transition-all duration-500
                ${changeNum >= 20 ? 'from-green-900/95 via-green-800/80 to-green-700/40' :
                  changeNum >= 5 ? 'from-emerald-900/95 via-emerald-800/80 to-emerald-700/40' :
                  changeNum >= 0 ? 'from-dark-900/95 via-dark-800/80 to-dark-700/40' :
                  changeNum >= -5 ? 'from-red-900/95 via-red-800/80 to-red-700/40' :
                  'from-red-900/98 via-red-800/90 to-red-700/60'}
              `} />
            </>
          ) : (
            <div 
              className="absolute inset-0 transform group-hover:scale-110 transition-transform duration-700" 
              style={{
                background: `linear-gradient(135deg, ${getTokenColor(token.symbol)} 0%, rgba(18, 16, 25, 0.9) 100%)`,
              }}
            />
          )}
          
          {/* Animated particles for top performers */}
          {hotnessScore > 80 && (
            <div className="absolute inset-0">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-pulse opacity-60"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${2 + Math.random() * 2}s`
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* MAIN CONTENT */}
        <div className="relative z-10 p-4 h-full flex flex-col justify-between">
          {/* TOP ROW - Rank Badge & Performance Indicators */}
          <div className="flex justify-between items-start mb-3">
            {/* PREMIUM RANK BADGE */}
            <div className={`flex items-center justify-center w-8 h-8 rounded-xl shadow-2xl
              bg-gradient-to-br ${rankStyle.bg} transform group-hover:scale-110 transition-transform duration-300
              ${isTopThree ? 'ring-2 ring-white/30' : ''}
            `}>
              <span className="text-sm font-black text-white drop-shadow-lg">
                {isTopThree ? rankStyle.icon : index + 1}
              </span>
            </div>
            
            {/* HOTNESS INDICATOR */}
            <div className="flex items-center gap-2">
              {hotnessScore > 70 && (
                <div className="px-2 py-1 bg-orange-500/20 backdrop-blur-sm rounded-full border border-orange-400/30">
                  <span className="text-xs text-orange-300 font-bold animate-pulse">🔥 HOT</span>
                </div>
              )}
              {changeNum > 10 && (
                <div className="px-2 py-1 bg-green-500/20 backdrop-blur-sm rounded-full border border-green-400/30">
                  <span className="text-xs text-green-300 font-bold">📈 PUMP</span>
                </div>
              )}
            </div>
          </div>
          
          {/* MIDDLE - TOKEN INFO */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-2">
              <h3 className={`font-black text-white drop-shadow-lg transition-all duration-300
                ${isTopThree ? 'text-2xl group-hover:text-3xl' : 'text-xl group-hover:text-2xl'}
              `}>
                {token.symbol}
              </h3>
              <p className="text-gray-300 text-sm font-medium truncate opacity-80">
                {token.name}
              </p>
            </div>
            
            {/* ENHANCED PRICE DISPLAY */}
            <div className="mb-3">
              <div className="text-lg font-bold text-white font-mono drop-shadow-md">
                ${formatNumber(token.price)}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className={`px-2 py-1 rounded-lg font-bold text-sm shadow-lg
                  ${changeNum >= 0 ? 
                    'bg-green-500/30 text-green-200 border border-green-400/30' : 
                    'bg-red-500/30 text-red-200 border border-red-400/30'
                  }
                `}>
                  {changeNum >= 0 ? '↗' : '↘'} {formatNumber(token.change24h)}%
                </div>
                <div className="text-xs text-yellow-300 font-bold bg-yellow-500/10 px-2 py-1 rounded border border-yellow-400/20">
                  🔥 {hotnessScore.toFixed(0)}
                </div>
              </div>
            </div>
          </div>
          
          {/* BOTTOM - QUICK STATS */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-black/40 backdrop-blur-sm rounded-lg p-2 border border-white/10">
              <div className="text-gray-400 mb-1">MCap</div>
              <div className="text-white font-bold">${formatNumber(token.marketCap, 'short')}</div>
            </div>
            <div className="bg-black/40 backdrop-blur-sm rounded-lg p-2 border border-white/10">
              <div className="text-gray-400 mb-1">Vol 24h</div>
              <div className="text-white font-bold">${formatNumber(token.volume24h, 'short')}</div>
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
            {/* SPECTACULAR HEADER */}
            <div className="relative mb-8">
              <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-orange-500/5 to-red-500/5 rounded-3xl blur-3xl" />
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/10 via-transparent to-orange-900/10" />
              </div>
              
              <div className="relative z-10 text-center py-8">
                <div className="flex items-center justify-center mb-4">
                  <div className="h-px w-16 bg-gradient-to-r from-transparent to-yellow-500/60" />
                  <div className="mx-4 px-6 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-full border border-yellow-400/30 backdrop-blur-sm">
                    <span className="text-yellow-300 text-sm font-bold uppercase tracking-widest animate-pulse">🔥 TRENDING NOW 🔥</span>
                  </div>
                  <div className="h-px w-16 bg-gradient-to-l from-transparent to-yellow-500/60" />
                </div>
                
                <h2 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 drop-shadow-2xl mb-2">
                  HOTTEST TOKENS
                </h2>
                
                <p className="text-gray-300 text-lg font-medium mb-6">
                  The most explosive tokens right now • Real-time market momentum
                </p>
                
                {/* ANIMATED SEPARATORS */}
                <div className="flex items-center justify-center gap-4">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" />
                  <div className="w-20 h-px bg-gradient-to-r from-yellow-500/60 via-orange-500/60 to-red-500/60" />
                  <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse delay-300" />
                  <div className="w-20 h-px bg-gradient-to-r from-red-500/60 via-orange-500/60 to-yellow-500/60" />
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce delay-700" />
                </div>
              </div>
            </div>
            
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
                  Updated every 30 seconds • Powered by real-time market data
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