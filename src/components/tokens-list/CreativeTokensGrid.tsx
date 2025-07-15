import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Token, TokenHelpers } from "../../types";
import { formatNumber, formatPercentage, formatTokenPrice } from "../../utils/format";
import { OptimizedTokenCard } from "./OptimizedTokenCard";
import { Info, ExternalLink, BarChart3, TrendingUp, Star } from "lucide-react";
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

  // Memoized background component that doesn't re-render on price changes
  const TokenCardBackground = React.memo(({ token }: { token: Token }) => {
    const tokenColor = token.color || getTokenColor(token.symbol);
    
    return (
      <div className="absolute inset-0 overflow-hidden">
        {(token.header_image_url) ? (
          <>
            <img 
              src={token.header_image_url || ''} 
              alt={token.symbol}
              className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 banner-image"
            />
            {/* Neutral gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-black/20 transition-all duration-500" />
          </>
        ) : (
          <div 
            className="absolute inset-0 transform group-hover:scale-110 transition-transform duration-700" 
            style={{
              background: `linear-gradient(135deg, ${tokenColor} 0%, rgba(18, 16, 25, 0.9) 100%)`,
            }}
          />
        )}
      </div>
    );
  }, (prev, next) => 
    prev.token.header_image_url === next.token.header_image_url && 
    prev.token.symbol === next.token.symbol
  );

  // Helper function to check if token data is loading/not available
  const isTokenDataLoading = (token: Token) => {
    return !token.price || token.price === 0 || !token.market_cap || token.market_cap === 0;
  };

  // Loading skeleton component for token data
  const TokenDataSkeleton = ({ width = "w-16" }: { width?: string }) => (
    <div className={`${width} h-4 bg-gray-600/30 rounded animate-pulse`} />
  );

  // ENHANCED HOTTEST TOKEN CARD - Visually stunning design with flip functionality
  const HottestTokenCard = ({ token, index, backContent = 'details' }: { token: Token, index: number, backContent?: 'details' | 'portfolio' }) => {
    const navigate = useNavigate();
    const isSelected = token.symbol.toLowerCase() === selectedTokenSymbol?.toLowerCase();
    const contractAddress = TokenHelpers.getAddress(token);
    // Use token address as key to maintain flip state across re-renders
    const [isFlipped, setIsFlipped] = useState(() => {
      // Check if this card is in portfolio mode and has a selection
      if (backContent === 'portfolio' && selectedTokens?.has(contractAddress)) {
        return true; // Keep portfolio cards flipped if they're selected
      }
      return false;
    });
    
    // Check if this is DUEL token (forced at position 0)
    const isDuel = token.symbol === 'DUEL' && index === 0;
    
    // Backend already calculated the hotness - use position in list as score
    const isSpecialToken = index < 4; // First 4 are special tokens (DUEL, SOL, USDC, WBTC)
    const isTopThree = index >= 4 && index < 7; // Rankings start from position 5
    const changeNum = Number(token.change_24h || token.change24h) || 0;
    
    // Actual rank (no rank for special tokens, then 1, 2, 3 starting from position 5)
    const displayRank = isSpecialToken ? 0 : (index >= 4 ? index - 3 : 0);
    
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
    
    // Check for price flash
    const flashType = priceFlashTokens.get(contractAddress);
    
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
            ${flashType === 'green' ? 'price-flash-green' : flashType === 'red' ? 'price-flash-red' : ''}
          `}
          style={useMemo(() => ({ 
            animationDelay: isNewToken && index < 500 ? `${(index % 20) * 0.05}s` : undefined 
          }), [isNewToken, index])}>
        {/* DUEL SPECIAL EFFECT */}
        {isDuel && (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-purple-600/10 animate-pulse" />
        )}
        
        {/* STUNNING BANNER BACKGROUND - Memoized to prevent flicker */}
        <TokenCardBackground token={token} />

        {/* MAIN CONTENT - Responsive padding */}
        <div className="relative z-10 p-2 sm:p-3 h-full flex flex-col justify-between">
          {/* MIDDLE - TOKEN INFO WITH RANK */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-1">
              <div className="flex items-start justify-between">
                <h3 className={`${
                  // Special handling for SOL, USDC, WBTC (not DUEL)
                  isSpecialToken && token.symbol !== 'DUEL' ? 'text-2xl sm:text-4xl' :
                  token.symbol.length >= 9 ? 'text-lg sm:text-2xl' : 'text-xl sm:text-3xl'
                } font-bold text-white`} style={{ 
                  textShadow: '6px 6px 12px rgba(0,0,0,1), -4px -4px 8px rgba(0,0,0,1), 3px 3px 6px rgba(0,0,0,1), 0px 0px 10px rgba(0,0,0,0.9)', 
                  WebkitTextStroke: '1.5px rgba(0,0,0,0.7)' 
                }}>
                  {/* Display BTC for WBTC */}
                  {token.symbol === 'WBTC' ? 'BTC' : token.symbol}
                </h3>
                
                {/* RANK NUMBER - on same line as symbol */}
                {!isSpecialToken && displayRank > 0 && displayRank <= 3 && (
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
              {/* Only show name for DUEL and non-special tokens */}
              {(token.symbol === 'DUEL' || !isSpecialToken) && (
                <p className="text-gray-300 text-xs sm:text-sm truncate mt-1" style={{
                  textShadow: '2px 2px 4px rgba(0,0,0,0.9)'
                }}>
                  {token.name}
                </p>
              )}
            </div>
            
            {/* MARKET CAP/PRICE AND CHANGE - side by side */}
            <div className="flex items-center justify-between gap-2">
              {/* Market Cap or Price - left side */}
              <div className="text-sm sm:text-base font-bold text-white whitespace-nowrap" style={{ 
                textShadow: '2px 2px 4px rgba(0,0,0,0.9), 1px 1px 2px rgba(0,0,0,1)' 
              }}>
                {isTokenDataLoading(token) ? (
                  <TokenDataSkeleton width="w-20" />
                ) : (
                  /* Show market cap only for DUEL, price for other special tokens */
                  token.symbol === 'DUEL' ? (
                    `$${formatNumber(TokenHelpers.getMarketCap(token), 'short')} MC`
                  ) : isSpecialToken ? (
                    formatTokenPrice(TokenHelpers.getPrice(token))
                  ) : (
                    `$${formatNumber(TokenHelpers.getMarketCap(token), 'short')} MC`
                  )
                )}
              </div>
              
              {/* Percentage change - right side */}
              {changeNum !== 0 && (
                <div className={`text-xs sm:text-sm font-bold font-sans whitespace-nowrap ${changeNum >= 0 ? 'text-green-400' : 'text-red-400'}`} style={{ 
                  textShadow: '2px 2px 4px rgba(0,0,0,0.9), 1px 1px 2px rgba(0,0,0,1)' 
                }}>
                  {changeNum >= 0 ? '↗' : '↘'} {formatPercentage(TokenHelpers.getPriceChange(token), false)}
                </div>
              )}
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
                    {isTokenDataLoading(token) ? (
                      <TokenDataSkeleton width="w-12" />
                    ) : (
                      `$${formatNumber(TokenHelpers.getMarketCap(token), 'short')}`
                    )}
                  </div>
                </div>
                <div className="bg-dark-300/60 rounded p-1">
                  <div className="text-[10px] text-gray-400" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>24h Volume</div>
                  <div className="text-xs font-bold text-white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>
                    {isTokenDataLoading(token) ? (
                      <TokenDataSkeleton width="w-12" />
                    ) : (
                      `$${formatNumber(TokenHelpers.getVolume(token), 'short')}`
                    )}
                  </div>
                </div>
                <div className="bg-dark-300/60 rounded p-1">
                  <div className="text-[10px] text-gray-400" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>Price</div>
                  <div className="text-xs font-bold text-white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>
                    {isTokenDataLoading(token) ? (
                      <TokenDataSkeleton width="w-12" />
                    ) : (
                      formatTokenPrice(TokenHelpers.getPrice(token))
                    )}
                  </div>
                </div>
                <div className="bg-dark-300/60 rounded p-1">
                  <div className="text-[10px] text-gray-400" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>24h Change</div>
                  <div className={`text-xs font-bold ${changeNum >= 0 ? 'text-green-400' : 'text-red-400'}`} style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>
                    {isTokenDataLoading(token) ? (
                      <TokenDataSkeleton width="w-10" />
                    ) : changeNum === 0 ? (
                      <span className="text-gray-500">—</span>
                    ) : (
                      formatPercentage(TokenHelpers.getPriceChange(token))
                    )}
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
}, arePropsEqual);

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