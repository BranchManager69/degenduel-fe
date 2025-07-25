import { X } from "lucide-react";
import React from "react";
import { Token } from "../../types";

interface PortfolioTokenCardBackProps {
  token: Token;
  isSelected: boolean;
  currentWeight: number;
  onToggleSelection: () => void;
  onWeightChange: (delta: number) => void;
  remainingWeight?: number;
}

export const PortfolioTokenCardBack: React.FC<PortfolioTokenCardBackProps> = ({
  isSelected,
  currentWeight,
  onToggleSelection,
  onWeightChange,
  remainingWeight = 100 - currentWeight
}) => {
  const [inputValue, setInputValue] = React.useState(currentWeight.toString());
  // const [isEditing, setIsEditing] = React.useState(false);  // Not currently used for styling
  
  // Refs for hold-to-repeat functionality
  const incrementIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const decrementIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const incrementTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const decrementTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    setInputValue(currentWeight.toString());
  }, [currentWeight]);
  
  // Cleanup intervals on unmount
  React.useEffect(() => {
    return () => {
      if (incrementIntervalRef.current) clearInterval(incrementIntervalRef.current);
      if (decrementIntervalRef.current) clearInterval(decrementIntervalRef.current);
      if (incrementTimeoutRef.current) clearTimeout(incrementTimeoutRef.current);
      if (decrementTimeoutRef.current) clearTimeout(decrementTimeoutRef.current);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or numbers only
    if (value === '' || /^\d{0,3}$/.test(value)) {
      setInputValue(value);
    }
  };

  const handleInputBlur = () => {
    // setIsEditing(false);
    const numValue = parseInt(inputValue) || 0;
    const clampedValue = Math.min(maxWeight, Math.max(0, numValue));
    
    if (clampedValue !== currentWeight) {
      onWeightChange(clampedValue - currentWeight);
    }
    setInputValue(clampedValue.toString());
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  // Maximum weight this token can have
  const maxWeight = currentWeight + remainingWeight;
  
  // Helper function to increment value - using functional updates to avoid stale closures
  const incrementValue = React.useCallback(() => {
    setInputValue(prev => {
      const current = parseInt(prev) || 0;
      const newValue = Math.min(currentWeight + remainingWeight, current + 1);
      if (newValue !== current) {
        // Calculate the delta from the actual currentWeight
        const delta = newValue - currentWeight;
        if (delta !== 0) {
          onWeightChange(delta);
        }
      }
      return newValue.toString();
    });
  }, [currentWeight, remainingWeight, onWeightChange]);
  
  // Helper function to decrement value - using functional updates to avoid stale closures
  const decrementValue = React.useCallback(() => {
    setInputValue(prev => {
      const current = parseInt(prev) || 0;
      const newValue = Math.max(0, current - 1);
      if (newValue !== current) {
        // Calculate the delta from the actual currentWeight
        const delta = newValue - currentWeight;
        if (delta !== 0) {
          onWeightChange(delta);
        }
      }
      return newValue.toString();
    });
  }, [currentWeight, onWeightChange]);
  
  // Start incrementing on hold
  const startIncrement = React.useCallback(() => {
    incrementValue(); // Immediate first increment
    
    // After 500ms delay, start repeating
    incrementTimeoutRef.current = setTimeout(() => {
      incrementIntervalRef.current = setInterval(() => {
        incrementValue();
      }, 50); // Repeat every 50ms for smooth acceleration
    }, 500);
  }, [incrementValue]);
  
  // Start decrementing on hold
  const startDecrement = React.useCallback(() => {
    decrementValue(); // Immediate first decrement
    
    // After 500ms delay, start repeating
    decrementTimeoutRef.current = setTimeout(() => {
      decrementIntervalRef.current = setInterval(() => {
        decrementValue();
      }, 50); // Repeat every 50ms for smooth acceleration
    }, 500);
  }, [decrementValue]);
  
  // Stop incrementing
  const stopIncrement = React.useCallback(() => {
    if (incrementTimeoutRef.current) {
      clearTimeout(incrementTimeoutRef.current);
      incrementTimeoutRef.current = null;
    }
    if (incrementIntervalRef.current) {
      clearInterval(incrementIntervalRef.current);
      incrementIntervalRef.current = null;
    }
  }, []);
  
  // Stop decrementing
  const stopDecrement = React.useCallback(() => {
    if (decrementTimeoutRef.current) {
      clearTimeout(decrementTimeoutRef.current);
      decrementTimeoutRef.current = null;
    }
    if (decrementIntervalRef.current) {
      clearInterval(decrementIntervalRef.current);
      decrementIntervalRef.current = null;
    }
  }, []);

  return (
    <div className="h-full relative p-4">
      {/* X button in actual top right corner */}
      {isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelection();
          }}
          className="absolute top-2 right-2 w-6 h-6 bg-red-900/50 hover:bg-red-800 transition-all flex items-center justify-center"
        >
          <X className="w-4 h-4 text-red-300" />
        </button>
      )}
      
      {/* Center content */}
      <div className="h-full flex items-center justify-center">
        {isSelected ? (
          <div className="w-full max-w-[180px]">
            
            {/* Weight control system */}
            <div className="flex items-center justify-center gap-0">
              {/* Minus button */}
              <button
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  startDecrement();
                }}
                onMouseUp={(e) => {
                  e.stopPropagation();
                  stopDecrement();
                }}
                onMouseLeave={(e) => {
                  e.stopPropagation();
                  stopDecrement();
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  startDecrement();
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  stopDecrement();
                }}
                className="w-10 h-10 bg-black border-2 border-red-500/50 hover:border-red-400 hover:bg-red-950/50 transition-all flex items-center justify-center"
              >
                <span className="text-2xl font-bold text-red-400">-</span>
              </button>
              
              {/* Weight display */}
              <div className="bg-black/90 border-2 border-emerald-500/30 px-3 py-2 flex items-center">
                <input
                  type="text"
                  inputMode="numeric"
                  value={inputValue}
                  onChange={handleInputChange}
                  onFocus={(e) => {
                    e.stopPropagation();
                    e.target.select();
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={handleInputBlur}
                  onKeyDown={handleInputKeyDown}
                  className="w-10 text-center text-2xl font-bold bg-transparent text-emerald-400 focus:outline-none"
                  style={{
                    textShadow: '0 0 10px rgba(52, 211, 153, 0.5)'
                  }}
                />
                <span className="text-xl font-bold text-emerald-400/80">%</span>
              </div>
              
              {/* Plus button */}
              <button
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  startIncrement();
                }}
                onMouseUp={(e) => {
                  e.stopPropagation();
                  stopIncrement();
                }}
                onMouseLeave={(e) => {
                  e.stopPropagation();
                  stopIncrement();
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  startIncrement();
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  stopIncrement();
                }}
                className="w-10 h-10 bg-black border-2 border-emerald-500/50 hover:border-emerald-400 hover:bg-emerald-950/50 transition-all flex items-center justify-center"
              >
                <span className="text-2xl font-bold text-emerald-400">+</span>
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelection();
            }}
            className="px-6 py-3 bg-emerald-500/20 border-2 border-emerald-500/50 hover:bg-emerald-500/30 hover:border-emerald-400 text-emerald-400 font-bold uppercase text-sm tracking-wider transition-all whitespace-nowrap shadow-lg"
          >
            ADD TO PORTFOLIO
          </button>
        )}
      </div>
    </div>
  );
};

PortfolioTokenCardBack.displayName = 'PortfolioTokenCardBack';