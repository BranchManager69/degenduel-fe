import { Plus, X, ChevronUp, ChevronDown } from "lucide-react";
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
  token,
  isSelected,
  currentWeight,
  onToggleSelection,
  onWeightChange,
  remainingWeight = 100 - currentWeight
}) => {
  const [inputValue, setInputValue] = React.useState(currentWeight.toString());
  // const [isEditing, setIsEditing] = React.useState(false);  // Not currently used for styling

  React.useEffect(() => {
    setInputValue(currentWeight.toString());
  }, [currentWeight]);

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

  return (
    <div className="h-full flex flex-col p-2">
      {/* Header - Symbol only, no name to save space */}
      <div className="text-center mb-2">
        <h3 className="text-lg font-bold text-white" style={{
          textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
          WebkitTextStroke: '0.5px rgba(0,0,0,0.8)'
        }}>{token.symbol}</h3>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex items-center justify-center">
        {isSelected ? (
          <div className="w-full relative">
            {/* Remove X in top right corner */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelection();
              }}
              className="absolute -top-3 -right-1 p-1.5 rounded-full bg-red-500/20 hover:bg-red-500/40 transition-all hover:scale-110 group"
            >
              <X className="w-3 h-3 text-red-400 group-hover:text-red-300" />
            </button>
            
            {/* Custom input with integrated controls */}
            <div className="relative mx-auto w-32">
              {/* Main value display */}
              <div className="relative bg-gradient-to-br from-dark-300/40 to-dark-400/40 rounded-lg p-3 border border-emerald-500/20">
                <input
                  type="text"
                  inputMode="numeric"
                  value={inputValue}
                  onChange={handleInputChange}
                  onFocus={(e) => {
                    e.stopPropagation();
                    // setIsEditing(true);
                    e.target.select();
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={handleInputBlur}
                  onKeyDown={handleInputKeyDown}
                  className="w-full text-center text-3xl font-black bg-transparent text-emerald-400 focus:outline-none pr-4"
                  style={{
                    textShadow: '0 0 30px rgba(52, 211, 153, 0.8), 3px 3px 6px rgba(0,0,0,1)',
                    letterSpacing: '-0.05em'
                  }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-2xl font-black text-emerald-400/80 pointer-events-none">%</span>
                
                {/* Vertical increment/decrement on the side */}
                <div className="absolute -right-8 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const current = parseInt(inputValue) || 0;
                      const newValue = Math.min(maxWeight, current + 1);
                      setInputValue(newValue.toString());
                      if (newValue !== currentWeight) {
                        onWeightChange(newValue - currentWeight);
                      }
                    }}
                    className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 rounded border border-emerald-500/30 transition-all hover:scale-110"
                  >
                    <ChevronUp className="w-4 h-4 text-emerald-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const current = parseInt(inputValue) || 0;
                      const newValue = Math.max(0, current - 1);
                      setInputValue(newValue.toString());
                      if (newValue !== currentWeight) {
                        onWeightChange(newValue - currentWeight);
                      }
                    }}
                    className="p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded border border-red-500/30 transition-all hover:scale-110"
                  >
                    <ChevronDown className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
              
              {/* Progress bar visualization of weight */}
              <div className="mt-2 h-1 bg-dark-400/60 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${currentWeight}%` }}
                />
              </div>
              
              {/* Remaining indicator */}
              <div className="text-center mt-1">
                <span className="text-[10px] text-gray-500">{remainingWeight}% available</span>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelection();
            }}
            className="px-6 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded border border-emerald-500/30 text-emerald-400 font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add to Portfolio
          </button>
        )}
      </div>
    </div>
  );
};

PortfolioTokenCardBack.displayName = 'PortfolioTokenCardBack';