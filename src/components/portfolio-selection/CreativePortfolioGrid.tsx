import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Token, TokenHelpers } from "../../types";
import { formatNumber, formatPercentage, formatTokenPrice } from "../../utils/format";
import { Info, ExternalLink, Plus, Minus, Check } from "lucide-react";

interface CreativePortfolioGridProps {
  tokens: Token[];
  selectedTokens: Map<string, number>; // contractAddress -> weight
  onTokenSelect: (contractAddress: string, weight: number) => void;
  onWeightChange?: (contractAddress: string, weight: number) => void;
}

/**
 * CreativePortfolioGrid - Enhanced version of CreativeTokensGrid for portfolio selection
 */
export const CreativePortfolioGrid: React.FC<CreativePortfolioGridProps> = React.memo(({ 
  tokens, 
  selectedTokens,
  onTokenSelect,
  onWeightChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track which tokens have already been animated
  const [animatedTokens, setAnimatedTokens] = useState<Set<string>>(new Set());

  // Update animated tokens when new tokens arrive
  useEffect(() => {
    const newAnimatedTokens = new Set<string>();
    tokens.forEach(token => {
      const key = token.contractAddress || token.address || token.symbol;
      if (key) {
        newAnimatedTokens.add(key);
      }
    });
    
    setTimeout(() => {
      setAnimatedTokens(newAnimatedTokens);
    }, 1000);
  }, [tokens]);

  // Just use all tokens directly
  const allTokens = tokens;

  // Enhanced Portfolio Token Card with weight controls
  const PortfolioTokenCard = ({ token, index }: { token: Token, index: number }) => {
    const navigate = useNavigate();
    const [isFlipped, setIsFlipped] = useState(false);
    
    const contractAddress = TokenHelpers.getAddress(token);
    const isSelected = selectedTokens.has(contractAddress);
    const currentWeight = selectedTokens.get(contractAddress) || 0;
    
    const isDuel = token.symbol === 'DUEL' && index === 0;
    const isTopThree = !isDuel && index < 4;
    const changeNum = Number(token.change_24h || token.change24h) || 0;
    
    const displayRank = isDuel ? 0 : index;
    
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
        // Calculate smart default weight
        const usedWeight = Array.from(selectedTokens.values()).reduce((sum, w) => sum + w, 0);
        const remainingWeight = 100 - usedWeight;
        const defaultWeight = Math.min(20, remainingWeight);
        
        if (defaultWeight > 0) {
          onTokenSelect(contractAddress, defaultWeight);
        }
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
          style={{ animationDelay: isNewToken && index < 500 ? `${(index % 20) * 0.05}s` : undefined }}>
            {/* Same front content as original */}
            {isDuel && (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-purple-600/10 animate-pulse" />
            )}
            
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
                    <h3 className={`${token.symbol.length >= 9 ? 'text-xl' : 'text-2xl'} font-bold text-white`} style={{ 
                      textShadow: '6px 6px 12px rgba(0,0,0,1), -4px -4px 8px rgba(0,0,0,1), 3px 3px 6px rgba(0,0,0,1), 0px 0px 10px rgba(0,0,0,0.9)', 
                      WebkitTextStroke: '1.5px rgba(0,0,0,0.7)' 
                    }}>
                      {token.symbol}
                    </h3>
                    
                    {/* Rankings removed for portfolio selection */}
                  </div>
                  {/* Removed token name to save space on smaller cards */}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-white" style={{ 
                    textShadow: '2px 2px 4px rgba(0,0,0,0.9), 1px 1px 2px rgba(0,0,0,1)' 
                  }}>
                    ${formatNumber(TokenHelpers.getMarketCap(token), 'short')} MC
                  </div>
                  
                  <div className={`text-xs font-bold font-sans ${changeNum >= 0 ? 'text-green-400' : 'text-red-400'}`} style={{ 
                    textShadow: '2px 2px 4px rgba(0,0,0,0.9), 1px 1px 2px rgba(0,0,0,1)' 
                  }}>
                    {changeNum >= 0 ? '↗' : '↘'} {formatPercentage(TokenHelpers.getPriceChange(token), false)}
                  </div>
                </div>
              </div>
              
              <div>
                <div className="text-[10px] text-gray-300 whitespace-nowrap" style={{ 
                  textShadow: '2px 2px 4px rgba(0,0,0,0.9), 1px 1px 2px rgba(0,0,0,1)' 
                }}>
                  {formatTokenPrice(TokenHelpers.getPrice(token))}
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
          <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-2xl overflow-hidden shadow bg-dark-200/95">
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
            
            <div className="relative z-10 h-full flex flex-col p-2">
              {/* Header */}
              <div className="text-center mb-2">
                <h3 className="text-lg font-bold text-white" style={{
                  textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                  WebkitTextStroke: '0.5px rgba(0,0,0,0.8)'
                }}>{token.symbol}</h3>
                <p className="text-xs text-gray-300" style={{
                  textShadow: '1px 1px 2px rgba(0,0,0,0.9)'
                }}>{token.name}</p>
              </div>

              {/* Portfolio Controls */}
              <div className="flex-1 flex flex-col justify-center">
                {isSelected ? (
                  <div className="space-y-2">
                    {/* Weight Display */}
                    <div className="text-center">
                      <div className="text-3xl font-bold text-emerald-400 mb-1" style={{
                        textShadow: '0 0 20px rgba(52, 211, 153, 0.5), 2px 2px 4px rgba(0,0,0,0.9)'
                      }}>
                        {currentWeight}%
                      </div>
                      <div className="text-xs text-gray-400">Portfolio Weight</div>
                    </div>

                    {/* Weight Controls */}
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWeightChange(-5);
                        }}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded border border-red-500/30 transition-colors"
                      >
                        <Minus className="w-4 h-4 text-red-400" />
                      </button>
                      
                      <div className="flex gap-1">
                        {[1, 5, 10].map(amount => (
                          <button
                            key={amount}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleWeightChange(amount);
                            }}
                            className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 rounded text-emerald-400 text-xs font-mono transition-colors"
                          >
                            +{amount}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSelection();
                      }}
                      className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg border border-red-500/30 text-red-400 font-medium transition-colors"
                    >
                      Remove from Portfolio
                    </button>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <div className="text-gray-400 text-sm">
                      Not in portfolio
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSelection();
                      }}
                      className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded border border-emerald-500/30 text-emerald-400 font-medium transition-colors flex items-center justify-center gap-1 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add to Portfolio
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Links */}
              <div className="flex gap-1 mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/tokens/${TokenHelpers.getAddress(token)}`);
                  }}
                  className="flex-1 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 rounded border border-cyan-500/30 transition-colors"
                  title="View Details"
                >
                  <Info className="w-3 h-3 text-cyan-400 mx-auto" />
                </button>
                
                <a
                  href={`https://dexscreener.com/solana/${TokenHelpers.getAddress(token)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 py-1 bg-green-500/20 hover:bg-green-500/30 rounded border border-green-500/30 transition-colors"
                  title="View on DexScreener"
                >
                  <ExternalLink className="w-3 h-3 text-green-400 mx-auto" />
                </a>
              </div>
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
            0%, 100% { object-position: center center; }
            25% { object-position: left center; }
            50% { object-position: center center; }
            75% { object-position: right center; }
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
          
          .perspective-1000 { perspective: 1000px; }
          .transform-style-3d { transform-style: preserve-3d; }
          .backface-hidden { backface-visibility: hidden; }
          .rotate-y-180 { transform: rotateY(180deg); }
        `
      }} />

      {/* Main grid container - All tokens use PortfolioTokenCard */}
      <div ref={containerRef} className="relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {allTokens.map((token, index) => (
            <PortfolioTokenCard key={token.contractAddress || token.address} token={token} index={index} />
          ))}
        </div>
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
  return colors[symbol] || '#7F00FF';
};

CreativePortfolioGrid.displayName = 'CreativePortfolioGrid';