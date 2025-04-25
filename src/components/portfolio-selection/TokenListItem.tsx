import React from 'react';
import { FaCoins } from 'react-icons/fa';

import { Token } from '../../types/index';

interface TokenListItemProps {
  token: Token;
  isSelected: boolean;
  weight: number;
  onSelect: () => void;
  onWeightChange: (weight: number) => void;
}

// Helper function for dynamic price formatting
const formatTokenPrice = (price: string | number): string => {
  const numPrice = Number(price);
  if (numPrice >= 1) {
    return `$${numPrice.toFixed(2)}`;
  } else if (numPrice >= 0.01) {
    return `$${numPrice.toFixed(3)}`;
  } else {
    return `$${numPrice.toPrecision(3)}`;
  }
};

export const TokenListItem: React.FC<TokenListItemProps> = ({
  token,
  isSelected,
  weight,
  onSelect,
  onWeightChange,
}) => {
  // Handle weight change
  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onWeightChange(Number(e.target.value));
  };

  // Format token change percentage
  const changePercent = token.change24h != null
    ? `${(Number(token.change24h) * 100).toFixed(1)}%`
    : "N/A";

  // Set change color based on positive/negative
  const changeColor = (Number(token.change24h) || 0) >= 0
    ? "text-green-400"
    : "text-red-400";

  return (
    <div 
      className={`relative border border-dark-300 rounded-lg overflow-hidden ${
        isSelected ? "bg-dark-200/80 ring-1 ring-brand-500/40" : "bg-dark-200/30"
      } hover:bg-dark-200/50 transition-colors cursor-pointer`}
      onClick={onSelect}
    >
      <div className="flex items-center p-2">
        {/* Token symbol and icon (if available) */}
        <div className="flex-shrink-0 w-8 h-8 relative rounded-full overflow-hidden bg-dark-300 mr-2">
          {token.images && (
            <img 
              src={token.images.imageUrl || token.images.headerImage || token.images.openGraphImage} 
              alt={token.symbol}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        
        {/* Token info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline">
            <span className="font-bold text-white text-sm truncate">
              {token.symbol}
            </span>
            <span className={`ml-2 text-xs ${changeColor}`}>
              {changePercent}
            </span>
          </div>
          <div className="flex justify-between items-baseline text-xs">
            <span className="text-gray-400 truncate max-w-[110px]">{token.name}</span>
            <span className="text-gray-200 font-medium">{token.price ? formatTokenPrice(token.price) : "N/A"}</span>
          </div>
        </div>
      </div>
      
      {/* Weight slider - only visible when selected */}
      <div 
        className={`transition-all duration-200 overflow-hidden ${
          isSelected ? "max-h-12 opacity-100" : "max-h-0 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-2 pb-2 bg-dark-300/30">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <FaCoins size={8} className="text-brand-400" />
              <span>Weight</span>
            </div>
            <span className="text-xs text-brand-400 font-bold">{weight}%</span>
          </div>
          
          <input 
            type="range"
            min="0"
            max="100"
            value={weight}
            onChange={handleWeightChange}
            className="w-full h-1.5 bg-gradient-to-r from-dark-300 via-brand-500/20 to-dark-300 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-3
              [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:rounded-sm
              [&::-webkit-slider-thumb]:rotate-45
              [&::-webkit-slider-thumb]:bg-brand-400
              [&::-webkit-slider-thumb]:border
              [&::-webkit-slider-thumb]:border-dark-200"
          />
        </div>
      </div>
    </div>
  );
};