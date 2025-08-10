import React from "react";
import { Token, TokenHelpers } from "../../types";

interface CompactTokenGridProps {
  tokens: Token[];
  selectedTokens: Map<string, number>;
  onTokenSelect: (token: Token) => void;
  onWeightChange?: (contractAddress: string, newWeight: number) => void;
}

export const CompactTokenGrid: React.FC<CompactTokenGridProps> = ({
  tokens,
  selectedTokens,
  onTokenSelect,
  onWeightChange
}) => {
  const formatPrice = (price: number | string): string => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    if (num < 0.01) return `$${num.toFixed(6)}`;
    if (num < 1) return `$${num.toFixed(4)}`;
    return `$${num.toFixed(2)}`;
  };

  const formatMarketCap = (marketCap: string | number): string => {
    const num = typeof marketCap === 'string' ? parseFloat(marketCap) : marketCap;
    if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(1)}B`;
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `$${Math.round(num / 1_000)}K`;
    return `$${num.toFixed(0)}`;
  };

  const formatChange = (change: string | number): React.ReactElement => {
    const num = typeof change === 'string' ? parseFloat(change) : change;
    const isPositive = num > 0;
    return (
      <span className={isPositive ? 'text-green-400' : 'text-red-400'}>
        {isPositive ? '+' : ''}{num.toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-1">
      {tokens.map((token) => {
        const address = TokenHelpers.getAddress(token);
        const isSelected = selectedTokens.has(address);
        const weight = selectedTokens.get(address) || 0;

        return (
          <div
            key={address}
            className={`
              relative p-2 rounded-md border transition-all cursor-pointer
              ${isSelected 
                ? 'border-emerald-400 bg-emerald-400/5' 
                : 'border-gray-700 hover:border-gray-600 bg-dark-200/20'
              }
            `}
            onClick={() => onTokenSelect(token)}
          >
            {/* Selected indicator and weight */}
            {isSelected && (
              <div className="absolute top-2 right-2 flex items-center gap-2">
                <span className="text-[10px] text-emerald-400 font-bold">{weight}%</span>
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              </div>
            )}

            {/* Token Info Row */}
            <div className="flex items-center gap-2 mb-1">
              {token.image_url && (
                <img 
                  src={token.image_url} 
                  alt={token.symbol}
                  className="w-6 h-6 rounded-full"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xs">{token.symbol}</span>
                  {token.is_active === false && (
                    <span className="text-xs px-1 py-0.5 bg-red-500/20 text-red-400 rounded">
                      INACTIVE
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-gray-400 truncate">
                  {token.name || `${address.slice(0, 6)}...`}
                </div>
              </div>
            </div>

            {/* Stats - All on one line */}
            <div className="flex items-center justify-between gap-0.5 text-[9px]">
              <div className="text-white font-medium">{formatPrice(token.price || 0)}</div>
              <div className="font-medium text-[10px]">{formatChange(token.change_24h || 0)}</div>
              <div className="text-gray-400">{formatMarketCap(token.market_cap || 0)} MC</div>
              <div className="text-gray-400">{formatMarketCap(token.volume_24h || 0)} V</div>
            </div>

            {/* Weight adjustment for selected tokens */}
            {isSelected && onWeightChange && (
              <div className="mt-1 flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onWeightChange(address, Math.max(0, weight - 1));
                  }}
                  className="w-5 h-5 bg-dark-400/50 hover:bg-red-500/20 rounded text-[10px] text-gray-400 hover:text-red-400"
                >
                  -
                </button>
                <div className="flex-1 bg-dark-400/30 rounded-full h-1.5">
                  <div 
                    className="bg-emerald-400 h-full rounded-full transition-all"
                    style={{ width: `${weight}%` }}
                  />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onWeightChange(address, Math.min(100, weight + 1));
                  }}
                  className="w-5 h-5 bg-dark-400/50 hover:bg-green-500/20 rounded text-[10px] text-gray-400 hover:text-green-400"
                >
                  +
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};