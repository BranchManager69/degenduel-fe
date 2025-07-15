import { Check, ExternalLink, Info, Minus, Plus } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Token, TokenHelpers } from "../../types";
import { formatNumber, formatPercentage, formatTokenPrice } from "../../utils/format";
import { IsolatedAnimatedImage } from "./IsolatedAnimatedImage";

interface PortfolioTokenCardProps {
  token: Token;
  index: number;
  isSelected: boolean;
  currentWeight: number;
  animatedTokens: Set<string>;
  onTokenSelect: (contractAddress: string, weight: number) => void;
  onWeightChange?: (contractAddress: string, weight: number) => void;
}

export const PortfolioTokenCard: React.FC<PortfolioTokenCardProps> = ({
  token,
  index,
  isSelected,
  currentWeight,
  animatedTokens,
  onTokenSelect,
  onWeightChange
}) => {
  const navigate = useNavigate();
  const [isFlipped, setIsFlipped] = useState(false);
  
  const contractAddress = TokenHelpers.getAddress(token);
  
  const isDuel = token.symbol === 'DUEL' && index === 0;
  const isSpecialToken = index < 4; // First 4 are special tokens
  const isTopThree = index >= 4 && index < 7; // Rankings start from position 5
  const changeNum = Number(token.change_24h || token.change24h) || 0;
  
  const displayRank = isSpecialToken ? 0 : (index >= 4 ? index - 3 : 0);
  
  const tokenKey = token.contractAddress || token.address || token.symbol;
  const isNewToken = tokenKey && !animatedTokens.has(tokenKey);
  
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

  const handleWeightChange = (delta: number) => {
    const newWeight = Math.max(0, Math.min(100, currentWeight + delta));
    if (onWeightChange) {
      onWeightChange(contractAddress, newWeight);
    }
  };

  const handleToggleSelection = () => {
    if (isSelected) {
      onTokenSelect(contractAddress, 0); // Remove
    } else {
      // Add with default weight
      onTokenSelect(contractAddress, 20);
    }
  };
  
  return (
    <div className="aspect-[5/3] w-full perspective-1000">
      <div 
        className={`relative w-full h-full transition-transform duration-500 transform-style-3d
          ${isFlipped ? 'rotate-y-180' : ''}
        `}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front of card - same as original */}
        <div className={`absolute w-full h-full backface-hidden rounded-2xl overflow-hidden shadow group cursor-pointer backdrop-blur-xl
          ${isNewToken ? 'token-card-animation' : ''}
          ${isSelected ? 'ring-4 ring-emerald-500/60 scale-105 z-30' : 'hover:scale-[1.03] z-10'}
          ${isDuel ? 'ring-2 ring-purple-500/60 shadow-[0_0_20px_rgba(147,51,234,0.4)]' : ''}
          ${isTopThree ? 'bg-gradient-to-br from-dark-100/90 via-dark-200/80 to-dark-300/90' : 'bg-dark-200/70'}
          ${isTopThree ? 'shadow-2xl ' + rankStyle.glow : 'shadow-xl shadow-black/20'}
        `}
        style={{ 
          animationDelay: isNewToken && index < 500 ? `${(index % 20) * 0.05}s` : undefined,
          transform: 'rotateY(0deg) translateZ(1px)',
          WebkitTransform: 'rotateY(0deg) translateZ(1px)'
        }}>
          {/* Same front content as original */}
          {isDuel && (
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-purple-600/10 animate-pulse" />
          )}
          
          <div className="absolute inset-0 overflow-hidden">
            {(token.header_image_url) ? (
              <>
                <IsolatedAnimatedImage 
                  src={token.header_image_url || ''} 
                  alt={token.symbol}
                />
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

          <div className="relative z-10 p-3 h-full flex flex-col justify-between">
            <div className="flex-1 flex flex-col justify-center">
              <div className="mb-1">
                <div className="flex items-start justify-between">
                  <h3 className={`${
                    // Special handling for SOL, USDC, WBTC (not DUEL)
                    isSpecialToken && token.symbol !== 'DUEL' ? 'text-2xl' :
                    token.symbol.length >= 9 ? 'text-lg' : 'text-xl'
                  } font-bold text-white`} style={{ 
                    textShadow: '6px 6px 12px rgba(0,0,0,1), -4px -4px 8px rgba(0,0,0,1), 3px 3px 6px rgba(0,0,0,1), 0px 0px 10px rgba(0,0,0,0.9)', 
                    WebkitTextStroke: '1.5px rgba(0,0,0,0.7)' 
                  }}>
                    {/* Display BTC for WBTC */}
                    {token.symbol === 'WBTC' ? 'BTC' : token.symbol}
                  </h3>
                  
                  {/* Rankings removed for portfolio selection */}
                </div>
                {/* Removed token name to save space on smaller cards */}
              </div>
              
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-bold text-white whitespace-nowrap" style={{ 
                  textShadow: '2px 2px 4px rgba(0,0,0,0.9), 1px 1px 2px rgba(0,0,0,1)' 
                }}>
                  {/* Show market cap only for DUEL, price for other special tokens */}
                  {token.symbol === 'DUEL' ? (
                    `${formatNumber(TokenHelpers.getMarketCap(token), 'short')} MC`
                  ) : isSpecialToken ? (
                    <span className={token.symbol === 'SOL' ? "text-lg text-yellow-400" : ""} style={
                      token.symbol === 'SOL' ? { textShadow: '0 0 20px rgba(251, 191, 36, 0.6), 2px 2px 4px rgba(0,0,0,1)' } : {}
                    }>
                      {formatTokenPrice(TokenHelpers.getPrice(token))}
                    </span>
                  ) : (
                    `${formatNumber(TokenHelpers.getMarketCap(token), 'short')} MC`
                  )}
                </div>
                
                <div className={`text-xs font-bold font-sans whitespace-nowrap ${changeNum >= 0 ? 'text-green-400' : 'text-red-400'}`} style={{ 
                  textShadow: '2px 2px 4px rgba(0,0,0,0.9), 1px 1px 2px rgba(0,0,0,1)' 
                }}>
                  {changeNum >= 0 ? '↗' : '↘'} {formatPercentage(TokenHelpers.getPriceChange(token), false)}
                </div>
              </div>
            </div>
          </div>
          
          {isSelected && (
            <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-1">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
          
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[300%] transition-transform duration-1000" />
          </div>
        </div>

        {/* Back of card - Portfolio controls */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-2xl overflow-hidden shadow bg-dark-200/95"
          style={{
            transform: 'rotateY(180deg) translateZ(1px)',
            WebkitTransform: 'rotateY(180deg) translateZ(1px)'
          }}>
          <div className="absolute inset-0">
            {(token.header_image_url) ? (
              <>
                <img 
                  src={token.header_image_url || ''} 
                  alt={token.symbol}
                  className="absolute inset-0 w-full h-full object-cover opacity-30"
                  style={{ 
                    transform: 'scaleX(-1)',
                    filter: 'blur(2px) brightness(0.5)'
                  }}
                />
              </>
            ) : (
              <div 
                className="absolute inset-0 opacity-30" 
                style={{
                  background: `linear-gradient(135deg, ${token.color || getTokenColor(token.symbol)} 0%, rgba(18, 16, 25, 0.9) 100%)`,
                  transform: 'scaleX(-1)'
                }}
              />
            )}
          </div>
          
          <div className="relative z-10 h-full flex flex-col p-1.5">
            {/* Compact Header */}
            <div className="text-center mb-1">
              <h3 className="text-base font-bold text-white leading-tight" style={{
                textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                WebkitTextStroke: '0.5px rgba(0,0,0,0.8)'
              }}>{token.symbol}</h3>
              <p className="text-[10px] text-gray-300 truncate px-2" style={{
                textShadow: '1px 1px 2px rgba(0,0,0,0.9)'
              }}>{token.name}</p>
            </div>

            {/* Compact Portfolio Controls */}
            <div className="flex-1 flex flex-col justify-center">
              {isSelected ? (
                <div className="space-y-1">
                  {/* Compact Weight Display */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-400 leading-tight" style={{
                      textShadow: '0 0 20px rgba(52, 211, 153, 0.5), 2px 2px 4px rgba(0,0,0,0.9)'
                    }}>
                      {currentWeight}%
                    </div>
                    <div className="text-[10px] text-gray-400">Portfolio Weight</div>
                  </div>

                  {/* Compact Weight Controls */}
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWeightChange(-5);
                      }}
                      className="p-1 bg-red-500/20 hover:bg-red-500/30 rounded border border-red-500/30 transition-colors"
                    >
                      <Minus className="w-3 h-3 text-red-400" />
                    </button>
                    
                    <div className="flex gap-0.5">
                      {[1, 5, 10].map(amount => (
                        <button
                          key={amount}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWeightChange(amount);
                          }}
                          className="px-1.5 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 rounded text-emerald-400 text-[10px] font-mono transition-colors"
                        >
                          +{amount}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Compact Remove Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSelection();
                    }}
                    className="w-full py-1 bg-red-500/20 hover:bg-red-500/30 rounded border border-red-500/30 text-red-400 text-xs font-medium transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-1">
                  <div className="text-gray-400 text-xs">
                    Not in portfolio
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSelection();
                    }}
                    className="w-full py-1 bg-emerald-500/20 hover:bg-emerald-500/30 rounded border border-emerald-500/30 text-emerald-400 font-medium transition-colors flex items-center justify-center gap-0.5 text-xs"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                </div>
              )}
            </div>

            {/* Compact Quick Links */}
            <div className="flex gap-0.5 mt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/tokens/${TokenHelpers.getAddress(token)}`);
                }}
                className="flex-1 py-0.5 bg-cyan-500/20 hover:bg-cyan-500/30 rounded border border-cyan-500/30 transition-colors"
                title="View Details"
              >
                <Info className="w-2.5 h-2.5 text-cyan-400 mx-auto" />
              </button>
              
              <a
                href={`https://dexscreener.com/solana/${TokenHelpers.getAddress(token)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex-1 py-0.5 bg-green-500/20 hover:bg-green-500/30 rounded border border-green-500/30 transition-colors"
                title="View on DexScreener"
              >
                <ExternalLink className="w-2.5 h-2.5 text-green-400 mx-auto" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  return colors[symbol] || '#7F00FF';
};

PortfolioTokenCard.displayName = 'PortfolioTokenCard';