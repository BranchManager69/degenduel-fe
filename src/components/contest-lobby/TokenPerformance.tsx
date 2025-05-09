import React from "react";

import { formatCurrency } from "../../lib/utils";

interface TokenPerformanceProps {
  token: {
    symbol: string;
    name: string;
    price: number;
    imageUrl?: string | null;
  };
  amount: number;
  initialValue: number;
  currentValue: number;
}

export const TokenPerformance: React.FC<TokenPerformanceProps> = ({
  token,
  amount,
  initialValue,
  currentValue,
}) => {
  const change = initialValue === 0 ? (currentValue === 0 ? 0 : 100) : ((currentValue - initialValue) / initialValue) * 100;

  return (
    <div className="p-4 rounded-lg bg-dark-300/50 flex items-center space-x-4">
      {token.imageUrl && (
        <img src={token.imageUrl} alt={token.name} className="w-10 h-10 rounded-full object-contain bg-gray-700 p-1" />
      )}
      {!token.imageUrl && (
        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 font-semibold">
          {token.symbol.substring(0, 2).toUpperCase()}
        </div>
      )}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <div>
            <div className="text-md font-semibold text-gray-100">
              {token.name} ({token.symbol})
            </div>
            <div className="text-xs text-gray-400">{amount.toLocaleString()} tokens @ {formatCurrency(token.price)}</div>
          </div>
          <div className="text-right">
            <div className="text-md font-semibold text-gray-100">
              {formatCurrency(currentValue)}
            </div>
            <div
              className={`text-sm font-medium ${change >= 0 ? "text-green-400" : "text-red-400"}`}
            >
              {change >= 0 ? "+" : ""}
              {change.toFixed(2)}%
            </div>
          </div>
        </div>
        <div className="w-full h-1.5 bg-dark-400 rounded-full overflow-hidden mt-1">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              change >= 0 ? "bg-green-500" : "bg-red-500"
            }`}
            style={{
              width: `${Math.min(Math.max(change >= 0 ? (change > 100 ? 100 : change) : (100 + change > 0 ? 100+change : 0 ), 0), 100)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};
