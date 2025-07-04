import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Token, TokenHelpers } from "../../types";
import { formatNumber, formatPercentage, formatTokenPrice } from "../../utils/format";
import { OptimizedTokenCard } from "./OptimizedTokenCard";
import { Info, ExternalLink, BarChart3, TrendingUp, Star } from "lucide-react";

interface CreativeTokensGridProps {
  tokens: Token[];
  featuredTokens?: Token[]; // NEW: Separate stable featured tokens
  selectedTokenSymbol?: string | null;
  backContent?: 'details' | 'portfolio'; // Control what shows on card back
  renderBackContent?: (token: Token) => React.ReactNode; // NEW: Custom back content renderer
  selectedTokens?: Map<string, number>; // NEW: For portfolio selection highlighting
}

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

  // ENHANCED HOTTEST TOKEN CARD - Visually stunning design with flip functionality
  const HottestTokenCard = ({ token, index, backContent = 'details' }: { token: Token, index: number, backContent?: 'details' | 'portfolio' }) => {
    const navigate = useNavigate();
    const isSelected = token.symbol.toLowerCase() === selectedTokenSymbol?.toLowerCase();
    const [isFlipped, setIsFlipped] = useState(false);
    
    // Check if this is DUEL token (forced at position 0)
    const isDuel = token.symbol === 'DUEL' && index === 0;
    
    // Backend already calculated the hotness - use position in list as score
    const isTopThree = !isDuel && index < 4; // Top 3 excluding DUEL
    const changeNum = Number(token.change_24h || token.change24h) || 0;
    
    // Actual rank (0 for DUEL, then 1, 2, 3...)
    const displayRank = isDuel ? 0 : index;
    
    // Check if this token has already been animated
    const tokenKey = token.contractAddress || token.address || token.symbol;
    const isNewToken = tokenKey && !animatedTokens.has(tokenKey);
    
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
    
    // Check if token is selected in portfolio mode
    const isPortfolioSelected = selectedTokens?.has(TokenHelpers.getAddress(token)) || false;
    const portfolioWeight = selectedTokens?.get(TokenHelpers.getAddress(token)) || 0;
    
    return (
      <div className="aspect-[16/9] sm:aspect-[5/3] w-full perspective-1000">
        <div 
          className={`relative w-full h-full transition-transform duration-500 transform-style-3d
            ${isFlipped ? 'rotate-y-180' : ''}
          `}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Front of card */}
          <div className={`absolute w-full h-full backface-hidden rounded-2xl overflow-hidden shadow group cursor-pointer backdrop-blur-xl
            ${isNewToken ? 'token-card-animation' : ''}
            ${isSelected ? 'ring-4 ring-yellow-500/60 scale-105 z-30' : isPortfolioSelected ? 'ring-4 ring-emerald-500/60 scale-[1.02] z-20' : 'hover:scale-[1.03] z-10'}
            ${isDuel ? 'ring-2 ring-purple-500/60 shadow-[0_0_20px_rgba(147,51,234,0.4)]' : ''}
            ${isTopThree ? 'bg-gradient-to-br from-dark-100/90 via-dark-200/80 to-dark-300/90' : 'bg-dark-200/70'}
            ${isTopThree ? 'shadow-2xl ' + rankStyle.glow : 'shadow-xl shadow-black/20'}
          `}
          style={{ animationDelay: isNewToken && index < 500 ? `${(index % 20) * 0.05}s` : undefined }}>
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

        {/* MAIN CONTENT - Responsive padding */}
        <div className="relative z-10 p-2 sm:p-3 h-full flex flex-col justify-between">
          {/* MIDDLE - TOKEN INFO WITH RANK */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-1">
              <div className="flex items-start justify-between">
                <h3 className={`${token.symbol.length >= 9 ? 'text-xl sm:text-3xl' : 'text-2xl sm:text-4xl'} font-bold text-white`} style={{ 
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
              <p className="text-gray-300 text-xs sm:text-sm truncate mt-1" style={{
                textShadow: '2px 2px 4px rgba(0,0,0,0.9)'
              }}>
                {token.name}
              </p>
            </div>
            
            {/* MARKET CAP AND CHANGE - side by side */}
            <div className="flex items-center justify-between">
              {/* Market Cap - left side */}
              <div className="text-sm sm:text-base font-bold text-white" style={{ 
                textShadow: '2px 2px 4px rgba(0,0,0,0.9), 1px 1px 2px rgba(0,0,0,1)' 
              }}>
                ${formatNumber(TokenHelpers.getMarketCap(token), 'short')} MC
              </div>
              
              {/* Percentage change - right side */}
              <div className={`text-xs sm:text-sm font-bold font-sans ${changeNum >= 0 ? 'text-green-400' : 'text-red-400'}`} style={{ 
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
            
            {/* Portfolio Selection Indicator */}
            {isPortfolioSelected && (
              <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-2 shadow-lg">
                <div className="text-white font-bold text-sm">{portfolioWeight}%</div>
              </div>
            )}
          </div>

          {/* Back of card */}
          <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-2xl overflow-hidden shadow">
            {/* Mirrored background image */}
            <div className="absolute inset-0">
              {(token.header_image_url) ? (
                <>
                  <img 
                    src={token.header_image_url || ''} 
                    alt={token.symbol}
                    className="absolute inset-0 w-full h-full object-cover opacity-70"
                    style={{ 
                      transform: 'scaleX(-1)',
                      filter: 'blur(0.5px) brightness(0.9)'
                    }}
                  />
                  {/* Light gradient overlay for readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/30 to-transparent" />
                </>
              ) : (
                <div 
                  className="absolute inset-0 opacity-60" 
                  style={{
                    background: `linear-gradient(135deg, ${token.color || getTokenColor(token.symbol)} 0%, rgba(18, 16, 25, 0.9) 100%)`,
                    transform: 'scaleX(-1)'
                  }}
                />
              )}
              {/* Very light dark overlay for content readability */}
              <div className="absolute inset-0 bg-dark-200/30" />
            </div>
            
            <div className="relative z-10 h-full flex flex-col p-2">
              {backContent === 'portfolio' && renderBackContent ? (
                // Custom portfolio content
                renderBackContent(token)
              ) : backContent === 'details' ? (
                <>
                  {/* Header */}
                  <div className="mb-1">
                    <h3 className="text-base font-bold text-white truncate" style={{
                      textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                      WebkitTextStroke: '0.5px rgba(0,0,0,0.8)'
                    }}>{token.name}</h3>
                    <p className="text-xs text-gray-300" style={{
                      textShadow: '1px 1px 2px rgba(0,0,0,0.9)'
                    }}>{token.symbol}</p>
                  </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-1">
                <div className="bg-dark-300/60 rounded p-1">
                  <div className="text-[10px] text-gray-400" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>Market Cap</div>
                  <div className="text-xs font-bold text-white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>
                    ${formatNumber(TokenHelpers.getMarketCap(token), 'short')}
                  </div>
                </div>
                <div className="bg-dark-300/60 rounded p-1">
                  <div className="text-[10px] text-gray-400" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>24h Volume</div>
                  <div className="text-xs font-bold text-white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>
                    ${formatNumber(TokenHelpers.getVolume(token), 'short')}
                  </div>
                </div>
                <div className="bg-dark-300/60 rounded p-1">
                  <div className="text-[10px] text-gray-400" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>Price</div>
                  <div className="text-xs font-bold text-white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>
                    {formatTokenPrice(TokenHelpers.getPrice(token))}
                  </div>
                </div>
                <div className="bg-dark-300/60 rounded p-1">
                  <div className="text-[10px] text-gray-400" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>24h Change</div>
                  <div className={`text-xs font-bold ${changeNum >= 0 ? 'text-green-400' : 'text-red-400'}`} style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>
                    {formatPercentage(TokenHelpers.getPriceChange(token))}
                  </div>
                </div>
              </div>
              
              {/* Action Buttons - CYBERPUNK STYLE */}
              <div className="mt-auto">
                <div className="flex items-center justify-between gap-2">
                  {/* Token Detail Page - Glowing Info */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/tokens/${TokenHelpers.getAddress(token)}`);
                    }}
                    className="relative flex-1 group"
                    title="View Details"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-xl group-hover:blur-2xl transition-all duration-300 rounded-lg" />
                    <div className="relative bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border border-cyan-500/30 group-hover:border-cyan-400/60 rounded-lg p-2 transform transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-0.5">
                      <Info className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300 mx-auto drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                    </div>
                  </button>
                  
                  {/* DexScreener - Neon External */}
                  <a
                    href={`https://dexscreener.com/solana/${TokenHelpers.getAddress(token)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="relative flex-1 group"
                    title="View on DexScreener"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 blur-xl group-hover:blur-2xl transition-all duration-300 rounded-lg animate-pulse" />
                    <div className="relative bg-gradient-to-br from-green-900/40 to-emerald-900/40 border border-green-500/30 group-hover:border-green-400/60 rounded-lg p-2 transform transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-0.5">
                      <ExternalLink className="w-4 h-4 text-green-400 group-hover:text-green-300 mx-auto drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                    </div>
                  </a>
                  
                  {/* Chart - Holographic */}
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="relative flex-1 group opacity-70 hover:opacity-100 transition-opacity"
                    disabled
                    title="Analytics Coming Soon"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 blur-xl rounded-lg" />
                    <div className="relative bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/20 rounded-lg p-2 transform transition-all duration-300">
                      <BarChart3 className="w-4 h-4 text-purple-400/50 mx-auto" />
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
                    </div>
                  </button>
                  
                  {/* Trending - Flame Effect */}
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="relative flex-1 group opacity-70 hover:opacity-100 transition-opacity"
                    disabled
                    title="Trending Coming Soon"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 blur-xl rounded-lg" />
                    <div className="relative bg-gradient-to-br from-orange-900/20 to-red-900/20 border border-orange-500/20 rounded-lg p-2 transform transition-all duration-300">
                      <TrendingUp className="w-4 h-4 text-orange-400/50 mx-auto" />
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-orange-500/30 rounded-full blur-sm animate-ping" />
                    </div>
                  </button>
                  
                  {/* Star - Golden Glow */}
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="relative flex-1 group opacity-70 hover:opacity-100 transition-opacity"
                    disabled
                    title="Favorites Coming Soon"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 blur-xl rounded-lg" />
                    <div className="relative bg-gradient-to-br from-yellow-900/20 to-amber-900/20 border border-yellow-500/20 rounded-lg p-2 transform transition-all duration-300">
                      <Star className="w-4 h-4 text-yellow-400/50 mx-auto" />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/5 to-transparent animate-shimmer rounded-lg" />
                    </div>
                  </button>
                </div>
              </div>
                </>
              ) : (
                /* Portfolio mode - minimal placeholder */
                <div className="h-full flex flex-col">
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-white" style={{
                      textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                      WebkitTextStroke: '0.5px rgba(0,0,0,0.8)'
                    }}>{token.symbol}</h3>
                  </div>
                  {/* Empty space for future portfolio controls */}
                  <div className="flex-1" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      {/* CSS for animations */}
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
          
          @keyframes fadeUpIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .token-card-animation {
            animation: fadeUpIn 0.6s ease-out forwards;
            opacity: 0;
            will-change: transform, opacity;
          }
          
          .perspective-1000 {
            perspective: 1000px;
          }
          
          .transform-style-3d {
            transform-style: preserve-3d;
          }
          
          .backface-hidden {
            backface-visibility: hidden;
          }
          
          .rotate-y-180 {
            transform: rotateY(180deg);
          }
          
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(200%);
            }
          }
          
          .animate-shimmer {
            animation: shimmer 3s ease-in-out infinite;
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
            
            {/* PREMIUM GRID LAYOUT - 2 cols on mobile for better space usage */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {trendingTokens.map((token, index) => (
                <HottestTokenCard key={token.contractAddress} token={token} index={index} backContent={backContent} />
              ))}
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