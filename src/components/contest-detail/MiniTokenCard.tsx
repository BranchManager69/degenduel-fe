import React, { useMemo, useState } from "react";

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

interface MiniTokenCardProps {
  tokenSymbol: string;
  tokenImage?: string;
  bannerImage?: string;
  isPositive?: boolean; // For trend-based gradient
  activityLevel?: 'low' | 'medium' | 'high'; // For pulse effects
  onClick?: () => void;
}

/**
 * Ultra-compact square token card with same visual effects as OptimizedTokenCard
 * - No text, pure visual
 * - Square aspect ratio (1:1)
 * - Same shine, parallax, and gradient effects
 * - Tiny and sleek for allowed tokens grid
 */
export const MiniTokenCard: React.FC<MiniTokenCardProps> = ({ 
  tokenSymbol,
  tokenImage,
  bannerImage,
  isPositive = true,
  activityLevel = 'low',
  onClick
}) => {
  const tokenColor = useMemo(() => getTokenColor(tokenSymbol), [tokenSymbol]);
  const [showSymbol, setShowSymbol] = useState(false);

  // Ticker display logic
  const displaySymbol = tokenSymbol.length > 4 ? tokenSymbol.slice(0, 4) + '…' : tokenSymbol;

  // Handle card click/tap to toggle
  const handleCardToggle = () => {
    setShowSymbol((prev) => !prev);
  };

  // Handle navigation icon click
  const handleNavClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) onClick();
  };

  return (
    <div
      className="aspect-square w-full cursor-pointer group select-none"
      onClick={handleCardToggle}
      onTouchEnd={handleCardToggle}
      style={{ position: 'relative' }}
    >
      <div className="relative w-full h-full rounded-lg overflow-hidden shadow-lg transition-all duration-300">
        <div className="relative w-full h-full bg-dark-200/70 backdrop-blur-sm transition-all duration-300">
          {/* HIGH-RES BANNER BACKGROUND with Parallax - Same as OptimizedTokenCard */}
          <div className="absolute inset-0 overflow-hidden">
            {bannerImage ? (
              <div
                className="absolute inset-0 bg-cover bg-center transform group-hover:scale-110 transition-transform duration-700 ease-out"
                style={{
                  backgroundImage: `url(${bannerImage})`,
                  backgroundPosition: 'center 30%',
                  backgroundSize: 'cover'
                }}
              />
            ) : (
              <div 
                className="absolute inset-0 transform group-hover:scale-110 transition-transform duration-700" 
                style={{
                  background: `linear-gradient(135deg, ${tokenColor} 0%, rgba(18, 16, 25, 0.8) 100%)`,
                }}
              />
            )}
            {/* Smart gradient overlay - adapts to trend */}
            <div className={`absolute inset-0 transition-all duration-500 ${
              isPositive 
                ? 'bg-gradient-to-br from-green-900/60 via-black/50 to-black/30'
                : 'bg-gradient-to-br from-red-900/60 via-black/50 to-black/30'
            }`} />
            {/* Activity pulse overlay */}
            {activityLevel === 'high' && (
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/15 to-transparent animate-pulse" />
            )}
            {activityLevel === 'medium' && (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
            )}
          </div>
          {/* CENTERED TOKEN LOGO + SYMBOL REVEAL */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-10 h-10 flex items-center justify-center">
              {/* Logo slides up and out, ticker slides/fades in */}
              <div
                className={`absolute left-0 right-0 mx-auto transition-all duration-500 z-10 ${
                  showSymbol ? '-translate-y-[60%] scale-110 opacity-100' : 'translate-y-0 scale-100 opacity-100'
                }`}
                style={{
                  transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1), opacity 0.3s',
                  zIndex: 10,
                }}
              >
                {tokenImage ? (
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-black/40 backdrop-blur-sm border border-white/30 shadow-lg">
                    <img 
                      src={tokenImage} 
                      alt={tokenSymbol} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                ) : (
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg border border-white/30 shadow-lg"
                    style={{ backgroundColor: tokenColor }}
                  >
                    {tokenSymbol.charAt(0)}
                  </div>
                )}
              </div>
              <div
                className={`absolute left-0 right-0 mx-auto flex items-center justify-center transition-all duration-500 z-20 ${
                  showSymbol ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'
                }`}
                style={{
                  transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1), opacity 0.3s',
                  zIndex: 20,
                }}
              >
                <span
                  className="font-extrabold text-[1.3rem] text-white select-none"
                  style={{
                    WebkitTextStroke: '1px black',
                    textShadow: '0 0 2px #000, 0 0 1px #000',
                  }}
                >
                  {displaySymbol}
                </span>
              </div>
            </div>
          </div>
          {/* CHEVRON BUTTON IN TOP-RIGHT CORNER */}
          {showSymbol && (
            <button
              className="absolute top-0 right-0 w-[18px] h-[18px] flex items-center justify-center bg-black/90 hover:bg-black transition-colors rounded-none z-30"
              style={{ border: 'none', padding: 0 }}
              onClick={handleNavClick}
              tabIndex={0}
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="0" width="20" height="20" fill="none" />
                <path d="M7 5L13 10L7 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          {/* SUBTLE SHINE EFFECT */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          {/* BOTTOM ACTIVITY STRIP - Same as OptimizedTokenCard */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent">
            <div 
              className={`h-full transition-all duration-500 ${
                activityLevel === 'high' ? 'bg-gradient-to-r from-red-500/70 to-orange-500/70' :
                activityLevel === 'medium' ? 'bg-gradient-to-r from-yellow-500/50 to-blue-500/50' :
                'bg-gradient-to-r from-brand-500/30 to-cyan-500/30'
              }`}
              style={{ 
                width: activityLevel === 'high' ? '100%' : activityLevel === 'medium' ? '60%' : '30%'
              }}
            />
          </div>
          {/* CORNER GLOW EFFECT */}
          <div className={`absolute top-0 right-0 w-3 h-3 rounded-bl-lg opacity-0 group-hover:opacity-60 transition-opacity duration-300 ${
            isPositive ? 'bg-green-400/40' : 'bg-red-400/40'
          }`} />
        </div>
      </div>
    </div>
  );
};