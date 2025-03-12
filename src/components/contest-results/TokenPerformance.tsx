import React from "react";

import { formatCurrency } from "../../lib/utils";

interface TokenPerformanceProps {
  symbol: string;
  name: string;
  finalValue: number;
  change: number;
  contribution: number;
}

export const TokenPerformance: React.FC<TokenPerformanceProps> = ({
  symbol,
  name,
  finalValue,
  change,
  contribution,
}) => {
  return (
    <div className="p-4 rounded-lg bg-dark-300/50">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-lg font-medium text-gray-100">{name}</div>
          <div className="text-sm text-gray-400">{symbol}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-100">
            {formatCurrency(Math.round(finalValue))}
          </div>
          <div
            className={`text-sm ${change >= 0 ? "text-green-400" : "text-red-400"}`}
          >
            {change >= 0 ? "+" : ""}
            {change.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Performance Bar */}
      <div className="relative h-2 bg-dark-400 rounded-full overflow-hidden">
        <div
          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
            change >= 0 ? "bg-green-500" : "bg-red-500"
          }`}
          style={{
            width: `${Math.min(Math.max((change + 100) / 2, 0), 100)}%`,
          }}
        />
      </div>

      {/* Portfolio Contribution */}
      <div className="mt-2 flex justify-between items-center text-sm">
        <span className="text-gray-400">Portfolio Contribution</span>
        <span className="text-gray-300">{contribution}%</span>
      </div>
    </div>
  );
};
