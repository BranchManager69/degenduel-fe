import React from "react";
import { useNavigate } from "react-router-dom";
import { Token, TokenHelpers } from "../../types";
import { formatNumber, formatPercentage, formatTokenPrice } from "../../utils/format";
import { Info, ExternalLink, BarChart3, TrendingUp, Star } from "lucide-react";

interface MemoizedTokenCardProps {
  token: Token;
  index: number;
  backContent?: 'details' | 'portfolio';
  isFlipped: boolean;
  onFlipChange: (flipped: boolean) => void;
  selectedTokensMap?: Map<string, number>;
  renderBackContentFn?: (token: Token) => React.ReactNode;
  isNewToken?: boolean;
  flashType?: 'green' | 'red';
}

// Separate component for token data that updates independently
const TokenPriceDisplay = React.memo(({ token }: { token: Token }) => {
  const changeNum = Number(token.change_24h || token.change24h) || 0;
  const isSpecialToken = ['SOL', 'USDC', 'WBTC', 'DUEL'].includes(token.symbol);
  
  return (
    <div className="flex items-center justify-between gap-2">
      {/* Market Cap or Price - left side */}
      <div className={`font-bold text-white whitespace-nowrap ${
        /* Make price/market cap MUCH bigger for all special tokens */
        isSpecialToken ? 'text-2xl sm:text-3xl' : 'text-sm sm:text-base'
      }`} style={{ 
        textShadow: isSpecialToken 
          ? '4px 4px 8px rgba(0,0,0,1), 2px 2px 4px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.8)' 
          : '2px 2px 4px rgba(0,0,0,0.9), 1px 1px 2px rgba(0,0,0,1)',
        fontWeight: isSpecialToken ? 800 : 700
      }}>
        {/* For special tokens (SOL, USDC, WBTC), only check price. For others, check both price and market_cap */
          (isSpecialToken && token.symbol !== 'DUEL' 
            ? (!token.price || token.price === 0)
            : (!token.price || token.price === 0 || !token.market_cap || token.market_cap === 0)
          ) ? (
          <div className={`bg-gray-600/30 rounded animate-pulse ${
            isSpecialToken ? 'w-32 h-8' : 'w-20 h-4'
          }`} />
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
  );
});

TokenPriceDisplay.displayName = 'TokenPriceDisplay';

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

export const MemoizedTokenCard = React.memo(({
  token,
  index,
  backContent = 'details',
  isFlipped,
  onFlipChange,
  selectedTokensMap,
  renderBackContentFn,
  isNewToken,
  flashType
}: MemoizedTokenCardProps) => {
  const navigate = useNavigate();
  const contractAddress = TokenHelpers.getAddress(token);
  const [imageError, setImageError] = React.useState(false);
  
  // Check if this is DUEL token (forced at position 0)
  const isDuel = token.symbol === 'DUEL' && index === 0;
  
  // Backend already calculated the hotness - use position in list as score
  const isSpecialToken = index < 4; // First 4 are special tokens (DUEL, SOL, USDC, WBTC)
  const isTopThree = index >= 4 && index < 7; // Rankings start from position 5
  
  // Actual rank (no rank for special tokens, then 1, 2, 3 starting from position 5)
  const displayRank = isSpecialToken ? 0 : (index >= 4 ? index - 3 : 0);
  
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
  const isPortfolioSelected = selectedTokensMap?.has(contractAddress) || false;
  const portfolioWeight = selectedTokensMap?.get(contractAddress) || 0;
  
  const tokenColor = token.color || getTokenColor(token.symbol);
  
  return (
    <div className="aspect-[16/9] sm:aspect-[5/3] w-full perspective-1000">
      <div 
        className={`relative w-full h-full transition-transform duration-500 transform-style-3d
          ${isFlipped ? 'rotate-y-180' : ''}
        `}
        onClick={() => onFlipChange(!isFlipped)}
      >
        {/* Front of card */}
        <div className={`absolute w-full h-full backface-hidden rounded-2xl overflow-hidden shadow group cursor-pointer backdrop-blur-xl
          ${isNewToken ? 'token-card-animation' : ''}
          ${isPortfolioSelected ? 'ring-4 ring-emerald-500/60 scale-[1.02] z-20' : 'hover:scale-[1.03] z-10'}
          ${isDuel ? 'ring-2 ring-purple-500/60 shadow-[0_0_20px_rgba(147,51,234,0.4)]' : ''}
          ${isTopThree ? 'bg-gradient-to-br from-dark-100/90 via-dark-200/80 to-dark-300/90' : 'bg-dark-200/70'}
          ${isTopThree ? 'shadow-2xl ' + rankStyle.glow : 'shadow-xl shadow-black/20'}
          ${flashType === 'green' ? 'price-flash-green' : flashType === 'red' ? 'price-flash-red' : ''}
        `}
        style={{ 
          animationDelay: isNewToken && index < 500 ? `${(index % 20) * 0.05}s` : undefined 
        }}>
          {/* DUEL SPECIAL EFFECT */}
          {isDuel && (
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-purple-600/10 animate-pulse" />
          )}
          
          {/* STUNNING BANNER BACKGROUND */}
          <div className="absolute inset-0 overflow-hidden">
            {(token.header_image_url && !imageError) ? (
              <>
                <img 
                  src={token.header_image_url || ''} 
                  alt={token.symbol}
                  className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 banner-image"
                  onError={() => setImageError(true)}
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
                {/* Only show name for non-special tokens */}
                {!isSpecialToken && (
                  <p className="text-gray-300 text-xs sm:text-sm truncate mt-1" style={{
                    textShadow: '2px 2px 4px rgba(0,0,0,0.9)'
                  }}>
                    {token.name}
                  </p>
                )}
              </div>
              
              {/* Use separate component for price display that can update independently */}
              <TokenPriceDisplay token={token} />
            </div>
          </div>
          
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

        {/* Back of card - Similar structure but with custom content */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-2xl overflow-hidden shadow">
          {/* Mirrored background image */}
          <div className="absolute inset-0">
            {(token.header_image_url && !imageError) ? (
              <>
                <img 
                  src={token.header_image_url || ''} 
                  alt={token.symbol}
                  className="absolute inset-0 w-full h-full object-cover opacity-70"
                  style={{ 
                    transform: 'scaleX(-1)',
                    filter: 'blur(0.5px) brightness(0.9)'
                  }}
                  onError={() => setImageError(true)}
                />
                {/* Light gradient overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/30 to-transparent" />
              </>
            ) : (
              <div 
                className="absolute inset-0 opacity-60" 
                style={{
                  background: `linear-gradient(135deg, ${tokenColor} 0%, rgba(18, 16, 25, 0.9) 100%)`,
                  transform: 'scaleX(-1)'
                }}
              />
            )}
            {/* Very light dark overlay for content readability */}
            <div className="absolute inset-0 bg-dark-200/30" />
          </div>
          
          <div className="relative z-10 h-full flex flex-col p-2">
            {backContent === 'portfolio' && renderBackContentFn ? (
              // Custom portfolio content
              renderBackContentFn(token)
            ) : backContent === 'details' ? (
              // Details view with stats and buttons
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
                      {!token.price || token.price === 0 || !token.market_cap || token.market_cap === 0 ? (
                        <div className="w-12 h-4 bg-gray-600/30 rounded animate-pulse" />
                      ) : (
                        `$${formatNumber(TokenHelpers.getMarketCap(token), 'short')}`
                      )}
                    </div>
                  </div>
                  <div className="bg-dark-300/60 rounded p-1">
                    <div className="text-[10px] text-gray-400" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>Price</div>
                    <div className="text-xs font-bold text-white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>
                      {!token.price || token.price === 0 ? (
                        <div className="w-12 h-4 bg-gray-600/30 rounded animate-pulse" />
                      ) : (
                        formatTokenPrice(TokenHelpers.getPrice(token))
                      )}
                    </div>
                  </div>
                  <div className="bg-dark-300/60 rounded p-1">
                    <div className="text-[10px] text-gray-400" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>24h Change</div>
                    <div className={`text-xs font-bold ${TokenHelpers.getPriceChange(token) >= 0 ? 'text-green-400' : 'text-red-400'}`} style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>
                      {!token.price || token.price === 0 ? (
                        <div className="w-10 h-4 bg-gray-600/30 rounded animate-pulse" />
                      ) : TokenHelpers.getPriceChange(token) === 0 ? (
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
                      <div className="absolute inset-0 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.3)] group-hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-shadow duration-300" />
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
                      <div className="absolute inset-0 rounded-lg shadow-[0_0_20px_rgba(34,197,94,0.3)] group-hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-shadow duration-300">
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 animate-pulse" />
                      </div>
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
}, (prevProps, nextProps) => {
  // Deep comparison for memoization
  const prevAddr = TokenHelpers.getAddress(prevProps.token);
  const nextAddr = TokenHelpers.getAddress(nextProps.token);
  
  // Different token
  if (prevAddr !== nextAddr) return false;
  
  // UI state changes
  if (prevProps.isFlipped !== nextProps.isFlipped) return false;
  if (prevProps.index !== nextProps.index) return false;
  if (prevProps.backContent !== nextProps.backContent) return false;
  if (prevProps.isNewToken !== nextProps.isNewToken) return false;
  if (prevProps.flashType !== nextProps.flashType) return false;
  
  // Portfolio selection changes
  const prevSelected = prevProps.selectedTokensMap?.has(prevAddr) || false;
  const nextSelected = nextProps.selectedTokensMap?.has(nextAddr) || false;
  if (prevSelected !== nextSelected) return false;
  
  if (prevSelected && nextSelected) {
    const prevWeight = prevProps.selectedTokensMap?.get(prevAddr) || 0;
    const nextWeight = nextProps.selectedTokensMap?.get(nextAddr) || 0;
    if (prevWeight !== nextWeight) return false;
  }
  
  // Token data changes - only re-render for significant changes
  // Skip price updates (handled by TokenPriceDisplay component)
  if (prevProps.token.symbol !== nextProps.token.symbol) return false;
  if (prevProps.token.name !== nextProps.token.name) return false;
  if (prevProps.token.header_image_url !== nextProps.token.header_image_url) return false;
  
  return true; // Props are equal, don't re-render
});

MemoizedTokenCard.displayName = 'MemoizedTokenCard';