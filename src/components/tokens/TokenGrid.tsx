import React from 'react';
import { Token } from '../../types';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { formatCurrency, formatMarketCap } from '../../lib/utils';

interface TokenGridProps {
  tokens: Token[];
  selectedTokens: Map<string, number>;
  onTokenSelect: (symbol: string, weight: number) => void;
  marketCapFilter: string;
}

export const TokenGrid: React.FC<TokenGridProps> = ({
  tokens,
  selectedTokens,
  onTokenSelect,
  marketCapFilter,
}) => {
  const filteredTokens = tokens.filter(token => {
    if (!marketCapFilter) return true;
    
    switch (marketCapFilter) {
      case 'high-cap':
        return token.market_cap >= 10_000_000_000; // $10B+
      case 'mid-cap':
        return token.market_cap >= 1_000_000_000 && token.market_cap < 10_000_000_000; // $1B-$10B
      case 'low-cap':
        return token.market_cap < 1_000_000_000; // <$1B
      default:
        return true;
    }
  });

  const handleCardClick = (symbol: string) => {
    if (selectedTokens.has(symbol)) {
      onTokenSelect(symbol, 0); // Remove token
    } else {
      onTokenSelect(symbol, 20); // Add token with default weight
    }
  };

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>, symbol: string) => {
    e.stopPropagation();
    onTokenSelect(symbol, Number(e.target.value));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredTokens.map((token) => (
        <Card
          key={token.symbol}
          onClick={() => handleCardClick(token.symbol)}
          className={`cursor-pointer transition-colors bg-dark-200/50 backdrop-blur-sm border-dark-300 ${
            selectedTokens.has(token.symbol)
              ? 'ring-2 ring-brand-500'
              : 'hover:bg-dark-300/50'
          }`}
        >
          <CardHeader>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-100">{token.symbol}</h3>
              <span className="text-sm text-gray-400">{token.name}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Price</span>
                <span className="font-medium text-gray-200">{formatCurrency(token.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">24h Change</span>
                <span className={`font-medium ${token.change_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {token.change_24h.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Market Cap</span>
                <span className="font-medium text-gray-200">{formatMarketCap(token.market_cap)}</span>
              </div>
              
              {/* Token Weight Slider */}
              {selectedTokens.has(token.symbol) && (
                <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                  <label className="block text-sm text-gray-400 mb-1">Portfolio Weight</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedTokens.get(token.symbol) || 0}
                      onChange={(e) => handleWeightChange(e, token.symbol)}
                      className="w-full h-2 bg-dark-300 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-200 w-12">
                      {selectedTokens.get(token.symbol)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};