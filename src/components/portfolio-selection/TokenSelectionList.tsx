import React, { useState, useRef, useEffect } from 'react';
import { Token, TokenHelpers } from '../../types';
import { formatNumber, formatPercentage, formatTokenPrice } from '../../utils/format';
import { Plus, Minus } from 'lucide-react';

interface TokenSelectionListProps {
  tokens: Token[];
  selectedTokens: Map<string, number>;
  onTokenSelect: (contractAddress: string) => void;
  onWeightChange: (contractAddress: string, newWeight: number) => void;
  remainingWeight: number;
}

// Individual row component for performance
const TokenListRow = React.memo(({
  token,
  isSelected,
  currentWeight,
  remainingWeight,
  onToggle,
  onWeightChange,
}: {
  token: Token;
  isSelected: boolean;
  currentWeight: number;
  remainingWeight: number;
  onToggle: () => void;
  onWeightChange: (newWeight: number) => void;
}) => {
  const [inputValue, setInputValue] = useState(currentWeight.toString());
  const [imageError, setImageError] = useState(false);
  
  // Refs for hold-to-repeat functionality
  const incrementIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const decrementIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    setInputValue(currentWeight.toString());
  }, [currentWeight]);
  
  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (incrementIntervalRef.current) clearInterval(incrementIntervalRef.current);
      if (decrementIntervalRef.current) clearInterval(decrementIntervalRef.current);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d{0,3}$/.test(value)) {
      setInputValue(value);
    }
  };

  const handleInputBlur = () => {
    const numValue = parseInt(inputValue) || 0;
    const maxWeight = currentWeight + remainingWeight;
    const clampedValue = Math.min(maxWeight, Math.max(0, numValue));
    
    if (clampedValue !== currentWeight) {
      onWeightChange(clampedValue);
    }
    setInputValue(clampedValue.toString());
  };

  // Start increment with hold-to-repeat
  const startIncrement = () => {
    const canIncrement = currentWeight < 100 && remainingWeight > 0;
    if (!canIncrement) return;
    
    // Immediate increment
    const newWeight = Math.min(100, currentWeight + 1);
    onWeightChange(newWeight);
    
    // Start repeating after delay
    const timeoutId = setTimeout(() => {
      const intervalId = setInterval(() => {
        setInputValue(prev => {
          const current = parseInt(prev) || 0;
          const max = current + remainingWeight;
          if (current < max && current < 100) {
            const newVal = current + 1;
            onWeightChange(newVal);
            return newVal.toString();
          }
          return prev;
        });
      }, 50); // Rapid repeat
      
      incrementIntervalRef.current = intervalId;
    }, 300); // Initial delay
    
    incrementIntervalRef.current = timeoutId as any;
  };

  const startDecrement = () => {
    const canDecrement = currentWeight > 0;
    if (!canDecrement) return;
    
    // Immediate decrement
    const newWeight = Math.max(0, currentWeight - 1);
    onWeightChange(newWeight);
    
    // Start repeating after delay
    const timeoutId = setTimeout(() => {
      const intervalId = setInterval(() => {
        setInputValue(prev => {
          const current = parseInt(prev) || 0;
          if (current > 0) {
            const newVal = current - 1;
            onWeightChange(newVal);
            return newVal.toString();
          }
          return prev;
        });
      }, 50); // Rapid repeat
      
      decrementIntervalRef.current = intervalId;
    }, 300); // Initial delay
    
    decrementIntervalRef.current = timeoutId as any;
  };

  const stopIncrement = () => {
    if (incrementIntervalRef.current) {
      clearTimeout(incrementIntervalRef.current);
      clearInterval(incrementIntervalRef.current);
      incrementIntervalRef.current = null;
    }
  };

  const stopDecrement = () => {
    if (decrementIntervalRef.current) {
      clearTimeout(decrementIntervalRef.current);
      clearInterval(decrementIntervalRef.current);
      decrementIntervalRef.current = null;
    }
  };

  const changeNum = Number(token.change_24h || token.change24h) || 0;
  const logoUrl = token.image_url || '';
  
  return (
    <div 
      className={`group relative border-b border-dark-300/50 hover:bg-dark-200/50 transition-all duration-200
        ${isSelected ? 'bg-emerald-900/20 border-emerald-500/30' : ''}
      `}
    >
      {/* Subtle banner background */}
      {token.header_image_url && !imageError && (
        <div 
          className="absolute inset-0 opacity-5 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${token.header_image_url})`,
            filter: 'blur(20px)'
          }}
        />
      )}
      
      {/* Desktop Layout */}
      <div className="hidden md:grid grid-cols-12 gap-3 items-center p-4 relative">
        {/* Token Info - 3 cols */}
        <div className="col-span-3 flex items-center gap-3">
          <div className="relative w-10 h-10 flex-shrink-0">
            {logoUrl && !imageError ? (
              <img 
                src={logoUrl} 
                alt={token.symbol}
                className="w-full h-full rounded-full object-cover ring-1 ring-white/10"
                onError={() => setImageError(true)}
              />
            ) : (
              <div 
                className="w-full h-full rounded-full ring-1 ring-white/10"
                style={{ backgroundColor: token.color || '#7F00FF' }}
              />
            )}
          </div>
          <div>
            <div className="font-semibold text-white">{token.symbol}</div>
            <div className="text-sm text-gray-400 truncate max-w-[150px]">{token.name}</div>
          </div>
        </div>
        
        {/* Price + Market Cap + 24h Change - 3 cols */}
        <div className="col-span-3 text-left">
          <div className="text-sm">
            <span className="text-gray-300 font-medium">
              ${formatNumber(TokenHelpers.getMarketCap(token), 'short')} MC
            </span>
            <span className="ml-2"> </span>
            <span className={`font-medium ${changeNum >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatPercentage(changeNum)}
            </span>
          </div>
          <div className="text-white text-xs">
            {formatTokenPrice(TokenHelpers.getPrice(token))}
          </div>
        </div>
        
        {/* Weight Controls - 6 cols */}
        <div className="col-span-6">
          {isSelected ? (
            <div className="flex items-center gap-2 justify-end">
              <button
                onMouseDown={startDecrement}
                onMouseUp={stopDecrement}
                onMouseLeave={stopDecrement}
                onTouchStart={startDecrement}
                onTouchEnd={stopDecrement}
                disabled={currentWeight === 0}
                className="w-8 h-8 flex items-center justify-center rounded bg-dark-400 hover:bg-dark-500 
                  disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                className="w-12 text-center bg-dark-300 rounded px-1 py-1 text-white"
              />
              <span className="text-gray-400 text-sm">%</span>
              
              <button
                onMouseDown={startIncrement}
                onMouseUp={stopIncrement}
                onMouseLeave={stopIncrement}
                onTouchStart={startIncrement}
                onTouchEnd={stopIncrement}
                disabled={currentWeight === 100 || remainingWeight === 0}
                className="w-8 h-8 flex items-center justify-center rounded bg-dark-400 hover:bg-dark-500 
                  disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
              
              {/* Visual weight bar */}
              <div className="w-20 h-2 bg-dark-400 rounded-full overflow-hidden ml-2">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-200"
                  style={{ width: `${currentWeight}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex justify-end">
              <button
                onClick={onToggle}
                className="px-4 py-1 rounded bg-brand-500/20 hover:bg-brand-500/30 
                  text-brand-400 font-medium transition-colors"
              >
                Add
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile Layout */}
      <div className="md:hidden p-4 space-y-3 relative">
        {/* Row 1: Token info and price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 flex-shrink-0">
              {logoUrl && !imageError ? (
                <img 
                  src={logoUrl} 
                  alt={token.symbol}
                  className="w-full h-full rounded-full object-cover ring-1 ring-white/10"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div 
                  className="w-full h-full rounded-full ring-1 ring-white/10"
                  style={{ backgroundColor: token.color || '#7F00FF' }}
                />
              )}
            </div>
            <div>
              <div className="font-semibold text-white">{token.symbol}</div>
              <div className="text-xs text-gray-400">{token.name}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-white font-medium">
              {formatTokenPrice(TokenHelpers.getPrice(token))}
            </div>
            <div className={`text-sm font-medium ${changeNum >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatPercentage(changeNum)}
            </div>
          </div>
        </div>
        
        {/* Row 2: Market cap */}
        <div className="text-sm text-gray-400">
          MCap: ${formatNumber(TokenHelpers.getMarketCap(token), 'short')}
        </div>
        
        {/* Row 3: Weight controls */}
        {isSelected ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-dark-400 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-200"
                  style={{ width: `${currentWeight}%` }}
                />
              </div>
              <span className="text-white font-medium w-12 text-right">{currentWeight}%</span>
            </div>
            <div className="flex items-center justify-center gap-4">
              <button
                onMouseDown={startDecrement}
                onMouseUp={stopDecrement}
                onMouseLeave={stopDecrement}
                onTouchStart={startDecrement}
                onTouchEnd={stopDecrement}
                disabled={currentWeight === 0}
                className="w-10 h-10 flex items-center justify-center rounded bg-dark-400 hover:bg-dark-500 
                  disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="w-5 h-5" />
              </button>
              
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                className="w-16 text-center bg-dark-300 rounded px-2 py-2 text-white text-lg"
              />
              <span className="text-gray-400">%</span>
              
              <button
                onMouseDown={startIncrement}
                onMouseUp={stopIncrement}
                onMouseLeave={stopIncrement}
                onTouchStart={startIncrement}
                onTouchEnd={stopIncrement}
                disabled={currentWeight === 100 || remainingWeight === 0}
                className="w-10 h-10 flex items-center justify-center rounded bg-dark-400 hover:bg-dark-500 
                  disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={onToggle}
            className="w-full py-2 rounded bg-brand-500/20 hover:bg-brand-500/30 
              text-brand-400 font-medium transition-colors"
          >
            Add to Portfolio
          </button>
        )}
      </div>
    </div>
  );
});

TokenListRow.displayName = 'TokenListRow';

export const TokenSelectionList: React.FC<TokenSelectionListProps> = ({
  tokens,
  selectedTokens,
  onTokenSelect,
  onWeightChange,
  remainingWeight,
}) => {
  // Desktop headers
  const headers = [
    { label: 'Token', className: 'col-span-3' },
    { label: 'Price', className: 'col-span-3 text-left' },
    { label: 'Allocation', className: 'col-span-6 text-right' },
  ];
  
  return (
    <div className="bg-dark-200/50 rounded-lg overflow-hidden">
      {/* Desktop Header */}
      <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-dark-300/50 bg-dark-300/30">
        {headers.map((header, index) => (
          <div key={index} className={`text-sm font-medium text-gray-400 ${header.className}`}>
            {header.label}
          </div>
        ))}
      </div>
      
      {/* Token Rows */}
      <div>
        {tokens.map(token => {
          const contractAddress = TokenHelpers.getAddress(token);
          const isSelected = selectedTokens.has(contractAddress);
          const currentWeight = selectedTokens.get(contractAddress) || 0;
          
          return (
            <TokenListRow
              key={contractAddress}
              token={token}
              isSelected={isSelected}
              currentWeight={currentWeight}
              remainingWeight={remainingWeight}
              onToggle={() => {
                if (isSelected) {
                  onTokenSelect(contractAddress);
                } else {
                  // Add with default weight
                  const defaultWeight = remainingWeight >= 20 ? 20 : remainingWeight >= 10 ? 10 : remainingWeight;
                  if (defaultWeight > 0) {
                    onWeightChange(contractAddress, defaultWeight);
                  }
                }
              }}
              onWeightChange={(newWeight) => {
                if (newWeight === 0) {
                  onTokenSelect(contractAddress); // Remove
                } else {
                  onWeightChange(contractAddress, newWeight);
                }
              }}
            />
          );
        })}
      </div>
    </div>
  );
};