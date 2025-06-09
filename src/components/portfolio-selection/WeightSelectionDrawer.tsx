import React, { useEffect, useRef, useState } from "react";
import { Token, TokenHelpers } from "../../types";
import { formatTokenPrice } from "../../utils/format";

interface WeightSelectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  token: Token | null;
  currentWeight: number;
  remainingWeight: number;
  onWeightChange: (weight: number) => void;
  onRemove: () => void;
}

export const WeightSelectionDrawer: React.FC<WeightSelectionDrawerProps> = ({
  isOpen,
  onClose,
  token,
  currentWeight,
  remainingWeight,
  onWeightChange,
  onRemove,
}) => {
  const [inputValue, setInputValue] = useState(currentWeight.toString());
  const [isMobile, setIsMobile] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update input when weight changes
  useEffect(() => {
    setInputValue(currentWeight.toString());
  }, [currentWeight]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      onWeightChange(numValue);
    }
  };

  const handleQuickWeight = (weight: number) => {
    const maxWeight = Math.min(100, currentWeight + remainingWeight);
    const finalWeight = Math.min(weight, maxWeight);
    setInputValue(finalWeight.toString());
    onWeightChange(finalWeight);
  };

  const handleIncrement = (delta: number) => {
    const newWeight = Math.max(0, Math.min(100, currentWeight + delta));
    const maxWeight = currentWeight + remainingWeight;
    const finalWeight = Math.min(newWeight, maxWeight);
    setInputValue(finalWeight.toString());
    onWeightChange(finalWeight);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) {
      onClose();
    }
  };

  const handleRemove = () => {
    onRemove();
    onClose();
  };

  if (!isOpen || !token) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`
          relative w-full max-w-lg bg-dark-200/95 backdrop-blur-md border border-dark-300/50 shadow-2xl
          transition-transform duration-300 ease-out
          ${isMobile 
            ? 'rounded-t-xl max-h-[80vh] overflow-y-auto' 
            : 'rounded-xl m-4 max-h-[90vh] overflow-y-auto'
          }
          ${isOpen 
            ? 'transform-none' 
            : isMobile 
              ? 'translate-y-full' 
              : 'scale-95 opacity-0'
          }
        `}
      >
        {/* Handle (mobile only) */}
        {isMobile && (
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-gray-600 rounded-full" />
          </div>
        )}

        {/* Header */}
        <div className="px-6 py-4 border-b border-dark-300/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {token.image_url && (
                <img
                  src={token.image_url}
                  alt={token.symbol}
                  className="w-10 h-10 rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <div>
                <h3 className="text-xl font-bold text-white">
                  {token.symbol}
                </h3>
                <p className="text-sm text-gray-400">
                  {formatTokenPrice(TokenHelpers.getPrice(token))}
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-dark-300/50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Current Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-dark-300/30 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Current Weight</div>
              <div className="text-lg font-bold text-brand-400">{currentWeight}%</div>
            </div>
            <div className="bg-dark-300/30 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Available</div>
              <div className="text-lg font-bold text-gray-300">{remainingWeight + currentWeight}%</div>
            </div>
          </div>

          {/* Weight Input */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
              Set Weight Percentage
            </label>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleIncrement(-5)}
                disabled={currentWeight <= 0}
                className="w-10 h-10 bg-dark-300/50 hover:bg-dark-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold text-white transition-colors"
              >
                -5
              </button>
              
              <button
                onClick={() => handleIncrement(-1)}
                disabled={currentWeight <= 0}
                className="w-10 h-10 bg-dark-300/50 hover:bg-dark-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold text-white transition-colors"
              >
                -1
              </button>
              
              <div className="flex-1 relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-300/50 border border-dark-300 rounded-lg text-white text-center text-xl font-bold focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-all"
                  placeholder="0"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-medium pointer-events-none">
                  %
                </div>
              </div>
              
              <button
                onClick={() => handleIncrement(1)}
                disabled={currentWeight >= 100 || remainingWeight <= 0}
                className="w-10 h-10 bg-dark-300/50 hover:bg-dark-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold text-white transition-colors"
              >
                +1
              </button>
              
              <button
                onClick={() => handleIncrement(5)}
                disabled={currentWeight >= 100 || remainingWeight < 5}
                className="w-10 h-10 bg-dark-300/50 hover:bg-dark-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold text-white transition-colors"
              >
                +5
              </button>
            </div>
          </div>

          {/* Quick Weights */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
              Quick Options
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[10, 20, 25, 33].map((weight) => {
                const maxWeight = currentWeight + remainingWeight;
                const canUse = weight <= maxWeight;
                return (
                  <button
                    key={weight}
                    onClick={() => handleQuickWeight(weight)}
                    disabled={!canUse}
                    className={`
                      py-2 rounded-lg font-medium transition-colors text-sm
                      ${currentWeight === weight
                        ? 'bg-brand-500 text-white'
                        : canUse
                          ? 'bg-dark-300/50 text-gray-300 hover:bg-dark-300'
                          : 'bg-dark-300/20 text-gray-600 cursor-not-allowed'
                      }
                    `}
                  >
                    {weight}%
                  </button>
                );
              })}
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleQuickWeight(50)}
                disabled={50 > currentWeight + remainingWeight}
                className={`
                  py-2 rounded-lg font-medium transition-colors text-sm
                  ${currentWeight === 50
                    ? 'bg-brand-500 text-white'
                    : 50 <= currentWeight + remainingWeight
                      ? 'bg-dark-300/50 text-gray-300 hover:bg-dark-300'
                      : 'bg-dark-300/20 text-gray-600 cursor-not-allowed'
                  }
                `}
              >
                50%
              </button>
              
              <button
                onClick={() => handleQuickWeight(currentWeight + remainingWeight)}
                disabled={remainingWeight <= 0}
                className={`
                  py-2 rounded-lg font-medium transition-colors text-sm
                  ${remainingWeight <= 0
                    ? 'bg-dark-300/20 text-gray-600 cursor-not-allowed'
                    : 'bg-emerald-600/50 text-emerald-300 hover:bg-emerald-600/70'
                  }
                `}
              >
                Max ({currentWeight + remainingWeight}%)
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4 border-t border-dark-300/50">
            <button
              onClick={onClose}
              className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-medium transition-colors"
            >
              Update Weight
            </button>
            
            <button
              onClick={handleRemove}
              className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-medium transition-colors"
            >
              Remove from Portfolio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};