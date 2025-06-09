import React from "react";
import { Token, TokenHelpers } from "../../types";
import { formatNumber, formatTokenPrice } from "../../utils/format";

interface SimpleTokenCardProps {
  token: Token;
  isSelected: boolean;
  weight: number;
  onSelect: () => void;
  onEditWeight?: () => void;
}

/**
 * Simplified token card for portfolio selection
 * - Mobile-first design
 * - Clear tap targets
 * - No conflicting click handlers
 * - Visible weight controls
 */
export const SimpleTokenCard: React.FC<SimpleTokenCardProps> = ({
  token,
  isSelected,
  weight,
  onSelect,
  onEditWeight,
}) => {
  // Get token image
  const imageUrl = token.image_url || token.images?.imageUrl || null;
  
  // Format 24h change
  const change24h = Number(token.change_24h || token.change24h || 0);
  const changeColor = change24h >= 0 ? 'text-green-400' : 'text-red-400';
  const changeIcon = change24h >= 0 ? '↗' : '↘';
  
  return (
    <div className={`
      bg-dark-200/50 backdrop-blur-sm rounded-lg overflow-hidden
      border transition-all duration-200
      ${isSelected 
        ? 'border-brand-500 shadow-lg shadow-brand-500/20' 
        : 'border-dark-300/50 hover:border-dark-300'
      }
    `}>
      {/* Token Info Section - Clickable */}
      <button
        onClick={onSelect}
        className="w-full p-4 text-left focus:outline-none focus:bg-dark-300/20 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          {/* Left: Token image and info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {imageUrl && (
              <img
                src={imageUrl}
                alt={token.symbol}
                className="w-10 h-10 rounded-full flex-shrink-0 bg-dark-300"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-lg">
                  {token.symbol}
                </h3>
                {isSelected && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditWeight?.();
                    }}
                    className="px-2 py-1 bg-brand-500/20 hover:bg-brand-500/30 text-brand-400 rounded text-xs font-medium transition-colors border border-brand-500/30 hover:border-brand-500/50"
                  >
                    Selected: {weight}%
                  </button>
                )}
              </div>
              <p className="text-gray-400 text-sm truncate">
                {token.name}
              </p>
            </div>
          </div>
          
          {/* Right: Price and change */}
          <div className="text-right flex-shrink-0">
            <div className="text-white font-medium">
              {formatTokenPrice(TokenHelpers.getPrice(token))}
            </div>
            <div className={`text-sm ${changeColor} flex items-center justify-end gap-1`}>
              <span>{changeIcon}</span>
              <span>{Math.abs(change24h).toFixed(1)}%</span>
            </div>
          </div>
        </div>
        
        {/* Market cap and volume */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <div className="text-xs text-gray-500">Market Cap</div>
            <div className="text-sm text-gray-300">
              ${formatNumber(TokenHelpers.getMarketCap(token), 'short')}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">24h Volume</div>
            <div className="text-sm text-gray-300">
              ${formatNumber(TokenHelpers.getVolume(token), 'short')}
            </div>
          </div>
        </div>
      </button>
    </div>
  );
};