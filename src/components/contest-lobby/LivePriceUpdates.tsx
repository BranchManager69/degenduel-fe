import React from 'react';
import { Card } from '../ui/Card';
import { formatCurrency } from '../../lib/utils';

interface TokenData {
  token: {
    symbol: string;
    name: string;
    price: number;
    change24h: number;
  };
}

interface LivePriceUpdatesProps {
  tokens: TokenData[];
}

export const LivePriceUpdates: React.FC<LivePriceUpdatesProps> = ({ tokens }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {tokens.map(({ token }) => (
        <Card 
          key={token.symbol}
          className="bg-dark-200/50 backdrop-blur-sm border-dark-300 p-4 flex items-center justify-between"
        >
          <div>
            <div className="text-lg font-semibold text-gray-100">{token.symbol}</div>
            <div className="text-sm text-gray-400">{token.name}</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-100">
              {formatCurrency(token.price)}
            </div>
            <div className={`text-sm ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};