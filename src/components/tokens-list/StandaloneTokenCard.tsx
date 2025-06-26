import { ExternalLink, Info } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Token, TokenHelpers } from "../../types";
import { formatNumber, formatPercentage } from "../../utils/format";

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

interface StandaloneTokenCardProps {
  token: Token;
}

/**
 * Standalone version of the HottestTokenCard from CreativeTokensGrid
 * Exact same design but without the grid dependencies
 */
export const StandaloneTokenCard: React.FC<StandaloneTokenCardProps> = ({ token }) => {
  const navigate = useNavigate();
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Always treat as DUEL with special styling
  const isDuel = token.symbol === 'DUEL';
  const changeNum = Number(token.change_24h || token.change24h) || 0;
  
  // Style for DUEL
  const rankStyle = { bg: 'from-yellow-500 to-yellow-600', glow: 'shadow-yellow-500/50' };
  
  return (
    <div className="w-full">
      {/* Animations CSS */}
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
        `
      }} />

      <div className="aspect-[7/3] w-full perspective-1000">
        <div 
          className={`relative w-full h-full transition-transform duration-500 transform-style-3d
            ${isFlipped ? 'rotate-y-180' : ''}
          `}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Front of card */}
          <div className={`absolute w-full h-full backface-hidden rounded-2xl overflow-hidden shadow group cursor-pointer backdrop-blur-xl
            hover:scale-[1.03] z-10
            ${isDuel ? 'ring-2 ring-purple-500/60 shadow-[0_0_20px_rgba(147,51,234,0.4),_10px_10px_30px_rgba(255,255,255,0.3)]' : ''}
            ${token.symbol === 'SOL' ? 'shadow-[0_0_25px_rgba(255,215,0,0.5)]' : ''}
            bg-gradient-to-br from-dark-100/90 via-dark-200/80 to-dark-300/90
            ${isDuel ? '' : 'shadow-2xl'} ${isDuel ? '' : rankStyle.glow}
          `}>
            {/* SOL gradient border */}
            {token.symbol === 'SOL' && (
              <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-r from-white/60 to-cyan-500/60">
                <div className="w-full h-full rounded-2xl bg-dark-200/90" />
              </div>
            )}
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

            {/* MAIN CONTENT - BOLD AND CLEAN */}
            <div className="relative z-10 p-6 h-full flex flex-col">
              {/* MARKET CAP AND 24H CHANGE - PUSHED DOWN */}
              <div className="flex items-center justify-between gap-4 mt-auto">
                {/* BIG MARKET CAP OR PRICE FOR SOL - LEFT */}
                <div className="text-center flex-1">
                  {token.symbol === 'SOL' ? (
                    <>
                      <div className="text-2xl font-bold text-white" style={{ 
                        textShadow: '4px 4px 8px rgba(0,0,0,0.9), 2px 2px 4px rgba(0,0,0,1)' 
                      }}>
                        ${TokenHelpers.getPrice(token).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">SOL Price</div>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-white" style={{ 
                        textShadow: '4px 4px 8px rgba(0,0,0,0.9), 2px 2px 4px rgba(0,0,0,1)' 
                      }}>
                        ${formatNumber(TokenHelpers.getMarketCap(token), 'short')}
                      </div>
                      <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Market Cap</div>
                    </>
                  )}
                </div>
                
                {/* MASSIVE PERCENTAGE CHANGE - RIGHT */}
                <div className="text-center flex-1">
                  <div className={`text-3xl font-black ${changeNum >= 0 ? 'text-green-400' : 'text-red-400'}`} style={{ 
                    textShadow: changeNum >= 0 
                      ? '0 0 30px rgba(34, 197, 94, 0.6), 4px 4px 8px rgba(0,0,0,1)' 
                      : '0 0 30px rgba(239, 68, 68, 0.6), 4px 4px 8px rgba(0,0,0,1)'
                  }}>
                    {changeNum >= 0 ? '+' : ''}{formatPercentage(TokenHelpers.getPriceChange(token), false)}
                  </div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">24h Change</div>
                </div>
              </div>
            </div>
            
            {/* HOVER EFFECT */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[300%] transition-transform duration-1000" />
            </div>
          </div>

          {/* Back of card - Different for SOL vs other tokens */}
          {token.symbol === 'SOL' ? (
            // SOL CARD BACK - JUST A SMILEY
            <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-2xl overflow-hidden shadow bg-dark-200/95">
              <div className="absolute inset-0">
                <img 
                  src={token.header_image_url || ''} 
                  alt={token.symbol}
                  className="absolute inset-0 w-full h-full object-cover opacity-20"
                  style={{ 
                    filter: 'brightness(0.5)'
                  }}
                />
              </div>
              
              <div className="relative z-10 h-full flex items-center justify-center">
                <style dangerouslySetInnerHTML={{
                  __html: `
                    @import url('https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap');
                  `
                }} />
                <div 
                  style={{
                    transform: 'rotate(-18deg)',
                    fontSize: '2.5rem',
                    fontFamily: "'Permanent Marker', cursive",
                    color: '#FF00FF',
                    textShadow: `
                      2px 2px 0px #000,
                      -2px -2px 0px #000,
                      2px -2px 0px #000,
                      -2px 2px 0px #000,
                      0 0 20px rgba(255,0,255,0.8),
                      4px 4px 15px rgba(0,0,0,0.5)
                    `,
                    letterSpacing: '-0.02em',
                    textTransform: 'uppercase',
                    lineHeight: '0.8'
                  }}
                >
                  <div>O'DUEL</div>
                  <div>RULES!</div>
                </div>
              </div>
            </div>
          ) : (
            // DUEL CARD BACK - ORIGINAL DESIGN WITH BUY BUTTON
            <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-2xl overflow-hidden shadow bg-dark-200/95 backdrop-blur-sm">
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
              
              <div className="relative z-10 h-full flex flex-col p-4">
                {/* Header - Symbol and Name in opposite corners */}
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-2xl font-bold text-white" style={{
                    textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                    WebkitTextStroke: '0.5px rgba(0,0,0,0.8)'
                  }}>{token.symbol}</h3>
                  <p className="text-sm text-gray-300 text-right max-w-[150px] truncate" style={{
                    textShadow: '1px 1px 2px rgba(0,0,0,0.9)'
                  }}>{token.name}</p>
                </div>
            
                {/* JUPITER BUY BUTTON IN THE MIDDLE */}
                <div className="flex-1 flex items-center justify-center px-4">
                  <a
                    href={`https://jup.ag/swap/SOL-${TokenHelpers.getAddress(token)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="relative group w-full transform hover:scale-[1.02] transition-transform duration-200"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#C7F284] to-[#00D18C] rounded-2xl opacity-20 blur-xl group-hover:opacity-30 transition-opacity"></div>
                    <div className="relative px-6 py-5 bg-gradient-to-br from-[#1a1f2e] via-[#232a3a] to-[#1a1f2e] rounded-2xl border-2 border-[#C7F284]/20 group-hover:border-[#C7F284]/40 transition-all overflow-hidden">
                      {/* Animated gradient background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-[#C7F284]/10 via-transparent to-[#00D18C]/10 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                      
                      <div className="relative flex items-center justify-center gap-4">
                        <img 
                          src="/assets/media/logos/jup.png" 
                          alt="Jupiter" 
                          className="w-12 h-12 group-hover:rotate-12 transition-transform duration-300"
                        />
                        <div className="text-center">
                          <div className="text-2xl font-black text-white tracking-tight">
                            BUY NOW
                          </div>
                          <div className="text-sm text-[#C7F284] font-medium">
                            Best price on Jupiter
                          </div>
                        </div>
                      </div>
                    </div>
                  </a>
                </div>
                
                {/* Bottom Action Buttons */}
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/tokens/${TokenHelpers.getAddress(token)}`);
                    }}
                    className="relative flex-1 group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 rounded blur-sm group-hover:blur-md transition-all"></div>
                    <div className="relative px-3 py-1.5 bg-dark-300/80 rounded border border-cyan-500/30 group-hover:border-cyan-400/50 transition-all flex items-center justify-center gap-1">
                      <Info className="w-3 h-3 text-cyan-400" />
                      <span className="text-xs text-cyan-400">Details</span>
                    </div>
                  </button>
                  
                  <a
                    href={`https://dexscreener.com/solana/${TokenHelpers.getAddress(token)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="relative flex-1 group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-green-600/20 rounded blur-sm group-hover:blur-md transition-all"></div>
                    <div className="relative px-3 py-1.5 bg-dark-300/80 rounded border border-green-500/30 group-hover:border-green-400/50 transition-all flex items-center justify-center gap-1">
                      <ExternalLink className="w-3 h-3 text-green-400" />
                      <span className="text-xs text-green-400">Chart</span>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};