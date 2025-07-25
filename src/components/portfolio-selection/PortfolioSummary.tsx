import React from "react";

import { Token, TokenHelpers } from "../../types/index";
import { Card, CardContent, CardHeader } from "../ui/Card";

interface PortfolioSummaryProps {
  selectedTokens: Map<string, number>;
  tokens: Token[];
  onWeightChange?: (contractAddress: string, newWeight: number) => void;
  onRemoveToken?: (contractAddress: string) => void;
}

export const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({
  selectedTokens,
  tokens,
  onWeightChange,
  onRemoveToken,
}) => {
  const totalWeight = Array.from(selectedTokens.values()).reduce(
    (sum, weight) => sum + weight,
    0,
  );
  
  // Refs for hold-to-repeat functionality
  const incrementIntervals = React.useRef<Map<string, NodeJS.Timeout>>(new Map());
  const decrementIntervals = React.useRef<Map<string, NodeJS.Timeout>>(new Map());
  const incrementTimeouts = React.useRef<Map<string, NodeJS.Timeout>>(new Map());
  const decrementTimeouts = React.useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      incrementIntervals.current.forEach(interval => clearInterval(interval));
      decrementIntervals.current.forEach(interval => clearInterval(interval));
      incrementTimeouts.current.forEach(timeout => clearTimeout(timeout));
      decrementTimeouts.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);
  
  // Helper functions for hold-to-repeat
  const startIncrement = React.useCallback((contractAddress: string, currentWeight: number) => {
    if (!onWeightChange) return;
    
    // Immediate increment
    const newWeight = Math.min(100, currentWeight + 1);
    onWeightChange(contractAddress, newWeight);
    
    // After 500ms delay, start repeating
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        selectedTokens.forEach((weight, address) => {
          if (address === contractAddress) {
            const newWeight = Math.min(100, weight + 1);
            onWeightChange(address, newWeight);
          }
        });
      }, 50); // Repeat every 50ms
      incrementIntervals.current.set(contractAddress, interval);
    }, 500);
    incrementTimeouts.current.set(contractAddress, timeout);
  }, [onWeightChange, selectedTokens]);
  
  const stopIncrement = React.useCallback((contractAddress: string) => {
    const timeout = incrementTimeouts.current.get(contractAddress);
    const interval = incrementIntervals.current.get(contractAddress);
    
    if (timeout) {
      clearTimeout(timeout);
      incrementTimeouts.current.delete(contractAddress);
    }
    if (interval) {
      clearInterval(interval);
      incrementIntervals.current.delete(contractAddress);
    }
  }, []);
  
  const startDecrement = React.useCallback((contractAddress: string, currentWeight: number) => {
    if (!onWeightChange) return;
    
    // Immediate decrement
    const newWeight = Math.max(0, currentWeight - 1);
    if (newWeight === 0 && onRemoveToken) {
      onRemoveToken(contractAddress);
    } else {
      onWeightChange(contractAddress, newWeight);
    }
    
    // After 500ms delay, start repeating
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        selectedTokens.forEach((weight, address) => {
          if (address === contractAddress) {
            const newWeight = Math.max(0, weight - 1);
            if (newWeight === 0 && onRemoveToken) {
              onRemoveToken(address);
              // Clear the interval for this token
              const intervalToClear = decrementIntervals.current.get(address);
              if (intervalToClear) {
                clearInterval(intervalToClear);
                decrementIntervals.current.delete(address);
              }
            } else {
              onWeightChange(address, newWeight);
            }
          }
        });
      }, 50); // Repeat every 50ms
      decrementIntervals.current.set(contractAddress, interval);
    }, 500);
    decrementTimeouts.current.set(contractAddress, timeout);
  }, [onWeightChange, onRemoveToken, selectedTokens]);
  
  const stopDecrement = React.useCallback((contractAddress: string) => {
    const timeout = decrementTimeouts.current.get(contractAddress);
    const interval = decrementIntervals.current.get(contractAddress);
    
    if (timeout) {
      clearTimeout(timeout);
      decrementTimeouts.current.delete(contractAddress);
    }
    if (interval) {
      clearInterval(interval);
      decrementIntervals.current.delete(contractAddress);
    }
  }, []);

  return (
    <div>
      <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-colors">
        <CardHeader className="py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base sm:text-lg font-semibold text-gray-100">
              Portfolio
            </h3>
            <span
              className={`text-xs sm:text-sm font-medium ${
                totalWeight === 100 ? "text-green-400" : 
                totalWeight > 100 ? "text-red-300 font-bold" : "text-gray-400"
              }`}
            >
              {totalWeight}% Allocated
            </span>
          </div>
        </CardHeader>
        <CardContent className="py-2 sm:py-3">
          {/* Weight Progress Bar */}
          <div className="mb-4">
            <div className="h-2 bg-dark-400 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  totalWeight === 100 ? 'bg-green-500' : 
                  totalWeight > 100 ? 'bg-red-700' : 'bg-yellow-500'
                }`}
                style={{ width: `${Math.min(totalWeight, 100)}%` }}
              />
            </div>
          </div>
          <div className="space-y-2">
            {Array.from(selectedTokens.entries()).map(
              ([contractAddress, weight]) => {
                const token = tokens.find(
                  (t) => TokenHelpers.getAddress(t) === contractAddress,
                );
                return (
                  <div
                    key={contractAddress}
                    className="flex items-center p-2 rounded bg-dark-300/50 hover:bg-dark-300/70 transition-colors group"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {token?.image_url && (
                        <img
                          src={token.image_url}
                          alt=""
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <span className="font-medium text-xs text-gray-200">
                        {token?.symbol || "Unknown"}
                      </span>
                    </div>
                    
                    {/* Weight Controls - Way to the right */}
                    <div className="flex items-center gap-1 ml-auto flex-shrink-0">
                      {onWeightChange && (
                        <>
                          <button
                            onClick={(e) => e.preventDefault()}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              startDecrement(contractAddress, weight);
                            }}
                            onMouseUp={(e) => {
                              e.preventDefault();
                              stopDecrement(contractAddress);
                            }}
                            onMouseLeave={(e) => {
                              e.preventDefault();
                              stopDecrement(contractAddress);
                            }}
                            onTouchStart={(e) => {
                              e.preventDefault();
                              startDecrement(contractAddress, weight);
                            }}
                            onTouchEnd={(e) => {
                              e.preventDefault();
                              stopDecrement(contractAddress);
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded bg-dark-400/50 hover:bg-orange-500/20 text-gray-400 hover:text-orange-400 transition-colors text-xs"
                            title="Decrease weight"
                          >
                            −
                          </button>
                          
                          <span className="text-sm font-medium text-brand-400 min-w-[35px] text-center">
                            {weight}%
                          </span>
                          
                          <button
                            onClick={(e) => e.preventDefault()}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              startIncrement(contractAddress, weight);
                            }}
                            onMouseUp={(e) => {
                              e.preventDefault();
                              stopIncrement(contractAddress);
                            }}
                            onMouseLeave={(e) => {
                              e.preventDefault();
                              stopIncrement(contractAddress);
                            }}
                            onTouchStart={(e) => {
                              e.preventDefault();
                              startIncrement(contractAddress, weight);
                            }}
                            onTouchEnd={(e) => {
                              e.preventDefault();
                              stopIncrement(contractAddress);
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded bg-dark-400/50 hover:bg-green-500/20 text-gray-400 hover:text-green-400 transition-colors text-xs"
                            title="Increase weight"
                          >
                            +
                          </button>
                        </>
                      )}
                      
                      {onRemoveToken && (
                        <button
                          onClick={() => onRemoveToken(contractAddress)}
                          className="w-6 h-6 flex items-center justify-center rounded bg-dark-400/50 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors opacity-0 group-hover:opacity-100 ml-2"
                          title="Remove token"
                        >
                          ×
                        </button>
                      )}
                      
                      {!onWeightChange && !onRemoveToken && (
                        <span className="text-sm font-medium text-brand-400 flex-shrink-0">
                          {weight}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              },
            )}
            {selectedTokens.size === 0 && (
              <div className="text-center py-6 px-4">
                <p className="text-xs sm:text-sm text-gray-400">
                  No tokens selected
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Click tokens to add them to your portfolio
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
