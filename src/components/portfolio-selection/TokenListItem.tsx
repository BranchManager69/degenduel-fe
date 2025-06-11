import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FaCoins } from 'react-icons/fa';

import { Token, TokenHelpers } from '../../types/index';
import { formatPercentage } from '../../utils/format';
import { applyTokenImageOverrides } from '../../config/tokenImageOverrides';

interface TokenListItemProps {
  token: Token;
  isSelected: boolean;
  weight: number;
  onSelect: () => void;
  onWeightChange: (weight: number) => void;
  remainingAllocation?: number;
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
  remainingAllocation = 0,
}) => {
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [tempWeight, setTempWeight] = useState(weight.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  // Apply frontend image overrides
  const enhancedToken = useMemo(() => applyTokenImageOverrides(token), [token]);

  // Sync tempWeight with weight prop
  useEffect(() => {
    setTempWeight(weight.toString());
  }, [weight]);

  // Handle weight change from slider
  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onWeightChange(Number(e.target.value));
  };

  // Handle weight percentage tap-to-edit
  const handleWeightEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingWeight(true);
    setTempWeight(weight.toString());
  };

  const handleWeightSubmit = () => {
    const newWeight = Math.max(0, Math.min(100, parseInt(tempWeight) || 0));
    onWeightChange(newWeight);
    setIsEditingWeight(false);
  };

  const handleWeightCancel = () => {
    setTempWeight(weight.toString());
    setIsEditingWeight(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleWeightSubmit();
    } else if (e.key === 'Escape') {
      handleWeightCancel();
    }
  };

  // Auto-focus input when editing starts
  useEffect(() => {
    if (isEditingWeight && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingWeight]);

  // Format token change percentage using TokenHelpers (same as card view)
  const priceChange = TokenHelpers.getPriceChange(token);
  const changePercent = formatPercentage(priceChange, false);

  // Set change color based on positive/negative
  const changeColor = priceChange >= 0
    ? "text-green-400"
    : "text-red-400";

  // Get header image for background
  const headerImage = enhancedToken.header_image_url || enhancedToken.images?.headerImage;

  return (
    <div 
      className={`relative border border-dark-300 rounded-lg overflow-hidden ${
        isSelected ? "bg-dark-200/80 ring-1 ring-brand-500/40" : "bg-dark-200/30"
      } hover:bg-dark-200/50 transition-colors cursor-pointer`}
      onClick={onSelect}
    >
      {/* Very faint header background for selected tokens */}
      {isSelected && headerImage && (
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.9) 100%), url(${headerImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}
      <div className="flex items-stretch">
        {/* Token symbol and icon (if available) - square edge-to-edge */}
        <div className="flex-shrink-0 w-12 h-12 relative overflow-hidden bg-dark-300 rounded-l-lg">
          {(enhancedToken.image_url || enhancedToken.images) && (
            <img 
              src={enhancedToken.image_url || enhancedToken.images?.imageUrl || enhancedToken.images?.headerImage || enhancedToken.images?.openGraphImage} 
              alt={token.symbol}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
        </div>
        
        {/* Token info */}
        <div className="min-w-0 flex-1 py-2 px-3 flex flex-col justify-center">
          <div className="flex items-baseline justify-between">
            <span className="font-bold text-white text-sm truncate">
              {token.symbol}
            </span>
            <span className={`text-xs ${changeColor} font-medium`}>
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
            <div className="flex items-center gap-2">
              {isEditingWeight ? (
                <div className="flex items-center gap-1">
                  <input
                    ref={inputRef}
                    type="number"
                    value={tempWeight}
                    onChange={(e) => setTempWeight(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleWeightSubmit}
                    className="w-8 bg-brand-500/20 text-brand-400 text-xs font-bold text-center rounded px-1 focus:outline-none focus:ring-1 focus:ring-brand-400"
                    min="0"
                    max="100"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="text-xs text-brand-400">%</span>
                </div>
              ) : (
                <span 
                  className="text-xs text-brand-400 font-bold cursor-pointer hover:text-brand-300 transition-colors"
                  onClick={handleWeightEdit}
                >
                  {weight}%
                </span>
              )}
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const maxWeight = weight + remainingAllocation;
                  onWeightChange(maxWeight);
                }}
                className="px-1.5 py-0.5 bg-brand-500/20 hover:bg-brand-500/30 text-brand-400 text-xs font-medium rounded transition-colors"
                disabled={remainingAllocation <= 0}
              >
                Max
              </button>
            </div>
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