import { Minus, Plus } from "lucide-react";
import React from "react";
import { Token } from "../../types";

interface PortfolioTokenCardBackProps {
  token: Token;
  isSelected: boolean;
  currentWeight: number;
  onToggleSelection: () => void;
  onWeightChange: (delta: number) => void;
}

export const PortfolioTokenCardBack: React.FC<PortfolioTokenCardBackProps> = ({
  token,
  isSelected,
  currentWeight,
  onToggleSelection,
  onWeightChange
}) => {
  return (
    <div className="h-full flex flex-col p-1.5">
      {/* Compact Header */}
      <div className="text-center mb-1">
        <h3 className="text-base font-bold text-white leading-tight" style={{
          textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
          WebkitTextStroke: '0.5px rgba(0,0,0,0.8)'
        }}>{token.symbol}</h3>
        <p className="text-[10px] text-gray-300 truncate px-2" style={{
          textShadow: '1px 1px 2px rgba(0,0,0,0.9)'
        }}>{token.name}</p>
      </div>

      {/* Compact Portfolio Controls */}
      <div className="flex-1 flex flex-col justify-center">
        {isSelected ? (
          <div className="space-y-1">
            {/* Compact Weight Display */}
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400 leading-tight" style={{
                textShadow: '0 0 20px rgba(52, 211, 153, 0.5), 2px 2px 4px rgba(0,0,0,0.9)'
              }}>
                {currentWeight}%
              </div>
              <div className="text-[10px] text-gray-400">Portfolio Weight</div>
            </div>

            {/* Compact Weight Controls */}
            <div className="flex items-center justify-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onWeightChange(-5);
                }}
                className="p-1 bg-red-500/20 hover:bg-red-500/30 rounded border border-red-500/30 transition-colors"
              >
                <Minus className="w-3 h-3 text-red-400" />
              </button>
              
              <div className="flex gap-0.5">
                {[1, 5, 10].map(amount => (
                  <button
                    key={amount}
                    onClick={(e) => {
                      e.stopPropagation();
                      onWeightChange(amount);
                    }}
                    className="px-1.5 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 rounded text-emerald-400 text-[10px] font-mono transition-colors"
                  >
                    +{amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Compact Remove Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelection();
              }}
              className="w-full py-1 bg-red-500/20 hover:bg-red-500/30 rounded border border-red-500/30 text-red-400 text-xs font-medium transition-colors"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="text-center space-y-1">
            <div className="text-gray-400 text-xs">
              Not in portfolio
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelection();
              }}
              className="w-full py-1 bg-emerald-500/20 hover:bg-emerald-500/30 rounded border border-emerald-500/30 text-emerald-400 font-medium transition-colors flex items-center justify-center gap-0.5 text-xs"
            >
              <Plus className="w-3 h-3" />
              Add to Portfolio
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

PortfolioTokenCardBack.displayName = 'PortfolioTokenCardBack';