import React, { useMemo, useState } from "react";
import { Token } from "../../types";
import { formatNumber } from "../../utils/format";
import { CopyToClipboard } from "../common/CopyToClipboard";
import { DeleteTokenModal } from "./DeleteTokenModal";
import { useStore } from "../../store/useStore";

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

interface OptimizedTokenCardProps {
  token: Token;
  onClick?: () => void;
  isSelected?: boolean;
}

/**
 * Optimized TokenCard component with improved performance
 * - Removed excessive debug logging
 * - Simplified animations for better mobile performance
 * - Optimized renders with memoization
 * - Reduced background effects
 */
export const OptimizedTokenCard: React.FC<OptimizedTokenCardProps> = React.memo(({ 
  token, 
  onClick,
  isSelected = false
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const user = useStore((state) => state.user);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setIsFlipped(!isFlipped);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteModalOpen(true);
  };

  // Get the best available image with header image as priority
  const imageUrl = useMemo(() => {
    if (!token.images) return null;
    return (
      token.images.headerImage ||
      token.images.openGraphImage ||
      token.images.imageUrl ||
      null
    );
  }, [token.images]);

  return (
    <>
      <div
        className="aspect-[3/4] w-full perspective-1000 cursor-pointer"
        onClick={handleClick}
      >
        <div
          className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          {/* Front of card */}
          <div className="absolute w-full h-full backface-hidden rounded-xl overflow-hidden shadow">
            <div className={`relative w-full h-full bg-dark-200/70 backdrop-blur-sm hover:bg-dark-200/80 transition-colors duration-300 ${isSelected ? 'ring-2 ring-brand-500' : ''}`}>
              {/* Cyberpunk corner cuts - matching the style in CreativeTokensGrid */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-brand-500/50 -translate-x-0.5 -translate-y-0.5 z-10"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyan-500/50 translate-x-0.5 -translate-y-0.5 z-10"></div>
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-brand-500/50 -translate-x-0.5 translate-y-0.5 z-10"></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-500/50 translate-x-0.5 translate-y-0.5 z-10"></div>
              
              {/* Image container */}
              <div className="relative w-full h-full overflow-hidden">
                {imageUrl ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${imageUrl})`,
                    }}
                  />
                ) : (
                  <div 
                    className="absolute inset-0" 
                    style={{
                      background: `linear-gradient(135deg, ${getTokenColor(token.symbol)} 0%, rgba(18, 16, 25, 0.8) 100%)`,
                    }}
                  >
                    {/* No longer showing the symbol here - prevents duplication */}
                    <div className="absolute inset-0 bg-gradient-to-br from-black/0 to-black/50"></div>
                  </div>
                )}

                {/* Simplified gradient overlays */}
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                  {isSelected && (
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-transparent" />
                  )}
                </div>

                {/* Token info overlay */}
                <div className="absolute inset-x-0 bottom-0 p-4">
                  {/* Symbol Display */}
                  <div className="relative mb-3">
                    <h3 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-wide">
                      {token.symbol}
                    </h3>
                  </div>

                  {/* Market Cap Display */}
                  <div className="relative">
                    <div className="relative bg-dark-300/80 backdrop-blur-md rounded-r-xl pl-3 pr-5 py-2">
                      {/* Subtle diagonal line decoration */}
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-brand-500/50 to-transparent transform -skew-x-12"></div>
                      
                      <div className="relative">
                        <span className="font-accent text-xs text-white/50 uppercase tracking-wider font-medium">
                          Market Cap
                        </span>
                        <p className="font-numbers text-lg sm:text-xl font-bold text-white tracking-wide mt-0.5">
                          ${formatNumber(token.marketCap)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 24h Change Pill */}
                  <div
                    className={`absolute -top-3 right-4 px-3 py-1 rounded-full font-accent text-sm font-medium backdrop-blur-md shadow
                      ${
                        Number(token.change24h) >= 0
                          ? "bg-green-500/30 text-green-300 border border-green-500/30"
                          : "bg-red-500/30 text-red-300 border border-red-500/30"
                      }`}
                  >
                    <span className="font-numbers">
                      {formatNumber(token.change24h)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Back of card */}
          <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-xl overflow-hidden shadow">
            <div className="w-full h-full bg-dark-200/70 backdrop-blur-sm p-4 hover:bg-dark-200/80 transition-colors duration-300">
              {/* Cyberpunk corner cuts - matching the style on the front */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-brand-500/50 -translate-x-0.5 -translate-y-0.5 z-10"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyan-500/50 translate-x-0.5 -translate-y-0.5 z-10"></div>
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-brand-500/50 -translate-x-0.5 translate-y-0.5 z-10"></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-500/50 translate-x-0.5 translate-y-0.5 z-10"></div>
              
              {/* Background pattern */}
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-50" />
                
                {/* Digital circuit lines */}
                <div className="absolute top-12 right-6 w-16 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
                <div className="absolute top-12 right-6 w-px h-12 bg-gradient-to-b from-cyan-500/30 to-transparent"></div>
                <div className="absolute bottom-12 left-8 w-12 h-px bg-gradient-to-r from-brand-500/30 to-transparent"></div>
                <div className="absolute bottom-12 left-8 w-px h-8 bg-gradient-to-b from-transparent to-brand-500/30"></div>
              </div>

              <div className="relative flex flex-col h-full">
                {/* Token Name with cyberpunk edge */}
                <h3 className="font-display text-xl font-bold text-white tracking-wide mb-3 relative">
                  {token.name}
                  <span className="absolute -bottom-1 left-0 w-1/2 h-px bg-gradient-to-r from-brand-500/50 to-transparent"></span>
                </h3>

                {/* Compact Stats Grid with enhanced styling */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {/* Price Card */}
                  <div className="relative bg-dark-300/60 backdrop-blur-sm rounded-lg p-2 border border-white/5 hover:border-brand-400/20 transition-all duration-300 group overflow-hidden">
                    {/* Decorative corner accent */}
                    <div className="absolute -top-1 -left-1 w-3 h-3 border-t border-l border-brand-500/30 transform rotate-45"></div>
                    
                    <span className="font-accent text-xs text-white/40 uppercase tracking-wider group-hover:text-brand-400/60 transition-colors duration-300 whitespace-nowrap">
                      Price
                    </span>
                    <p className="font-numbers text-base font-bold text-white/90 mt-0.5 group-hover:text-white transition-colors duration-300">
                      ${formatNumber(token.price)}
                    </p>
                  </div>

                  {/* Volume Card */}
                  <div className="relative bg-dark-300/60 backdrop-blur-sm rounded-lg p-2 border border-white/5 hover:border-brand-400/20 transition-all duration-300 group overflow-hidden">
                    {/* Decorative corner accent */}
                    <div className="absolute -top-1 -right-1 w-3 h-3 border-t border-r border-cyan-500/30 transform rotate-45"></div>
                    
                    <span className="font-accent text-xs text-white/40 uppercase tracking-wider group-hover:text-brand-400/60 transition-colors duration-300 whitespace-nowrap">
                      24h Vol
                    </span>
                    <p className="font-numbers text-base font-bold text-white/90 mt-0.5 group-hover:text-white transition-colors duration-300">
                      ${formatNumber(token.volume24h)}
                    </p>
                  </div>
                </div>

                {/* Contract Address with enhanced styling */}
                <div className="mb-4">
                  <CopyToClipboard text={token.contractAddress}>
                    <div className="relative bg-dark-300/60 backdrop-blur-sm rounded-lg p-2 border border-white/5 hover:border-brand-400/20 transition-all duration-300 group cursor-pointer overflow-hidden">
                      {/* Decorative digital code line */}
                      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-400/20 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent"></div>
                      
                      <div className="flex items-center justify-between">
                        <span className="font-accent text-xs text-white/40 uppercase tracking-wider group-hover:text-brand-400/60 transition-colors duration-300 whitespace-nowrap">
                          Contract
                        </span>
                        <span className="text-white/30 group-hover:text-brand-400 transition-colors duration-300">
                          📋
                        </span>
                      </div>
                      <p className="font-mono text-sm text-white/70 truncate mt-0.5 group-hover:text-white transition-colors duration-300">
                        {`${token.contractAddress.slice(
                          0,
                          8,
                        )}...${token.contractAddress.slice(-6)}`}
                      </p>
                    </div>
                  </CopyToClipboard>
                </div>

                {/* Social Links with cyberpunk style */}
                {token.socials && (
                  <div className="flex gap-2 mb-4">
                    {token.socials?.twitter?.url && (
                      <a
                        href={token.socials?.twitter?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 flex items-center justify-center py-2 bg-dark-300/60 rounded-lg border border-white/5 hover:border-brand-400/20 hover:bg-dark-300/80 transition-all duration-300 group relative overflow-hidden"
                      >
                        {/* Corner cut for twitter */}
                        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyan-500/30"></div>
                        
                        <span className="text-white/50 group-hover:text-brand-400 transition-colors duration-300">
                          𝕏
                        </span>
                      </a>
                    )}
                    {token.socials?.telegram?.url && (
                      <a
                        href={token.socials?.telegram?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 flex items-center justify-center py-2 bg-dark-300/60 rounded-lg border border-white/5 hover:border-brand-400/20 hover:bg-dark-300/80 transition-all duration-300 group relative overflow-hidden"
                      >
                        {/* Corner cut for telegram */}
                        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-brand-500/30"></div>
                        
                        <span className="text-white/50 group-hover:text-brand-400 transition-colors duration-300">
                          ✈️
                        </span>
                      </a>
                    )}
                    {token.socials?.discord?.url && (
                      <a
                        href={token.socials?.discord?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 flex items-center justify-center py-2 bg-dark-300/60 rounded-lg border border-white/5 hover:border-brand-400/20 hover:bg-dark-300/80 transition-all duration-300 group relative overflow-hidden"
                      >
                        {/* Corner cut for discord */}
                        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-500/30"></div>
                        
                        <span className="text-white/50 group-hover:text-brand-400 transition-colors duration-300">
                          💬
                        </span>
                      </a>
                    )}
                  </div>
                )}

                {/* Admin Controls with cyberpunk style */}
                {user?.is_admin && (
                  <button
                    onClick={handleDeleteClick}
                    className="w-full bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-white border border-red-500/20 py-1.5 rounded-lg transition-all duration-300 font-accent relative overflow-hidden group"
                  >
                    {/* Warning corner cuts for delete button */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-red-500/50"></div>
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-red-500/50"></div>
                    
                    {/* Button light effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/0 to-red-500/0 group-hover:from-red-500/0 group-hover:via-red-500/20 group-hover:to-red-500/0 transition-all duration-500"></div>
                    
                    <span className="relative z-10">Remove Token</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <DeleteTokenModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        tokenAddress={token.contractAddress}
        tokenSymbol={token.symbol}
      />
    </>
  );
});

OptimizedTokenCard.displayName = 'OptimizedTokenCard';