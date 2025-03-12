import React from "react";

import { formatCurrency } from "../../lib/utils";

interface TokenPerformanceProps {
  token: {
    symbol: string;
    name: string;
    price: number;
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
  const change = ((currentValue - initialValue) / initialValue) * 100;

  return (
    <div className="p-4 rounded-lg bg-dark-300/50">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-lg font-semibold text-gray-100">
            {token.symbol}
          </div>
          <div className="text-sm text-gray-400">{amount} tokens</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-100">
            {formatCurrency(currentValue)}
          </div>
          <div
            className={`text-sm ${change >= 0 ? "text-green-400" : "text-red-400"}`}
          >
            {change >= 0 ? "+" : ""}
            {change.toFixed(2)}%
          </div>
        </div>
      </div>
      <div className="w-full h-1.5 bg-dark-400 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            change >= 0 ? "bg-green-500" : "bg-red-500"
          }`}
          style={{
            width: `${Math.min(Math.max((change + 100) / 2, 0), 100)}%`,
          }}
        />
      </div>
    </div>
  );
};
