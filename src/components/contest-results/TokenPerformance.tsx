import React from "react";

import { formatCurrency } from "../../lib/utils";

// Props aligned with what ContestResultsPage will provide from API data
interface TokenPerformanceProps {
  symbol: string;
  name: string;
  imageUrl?: string | null; // Added to display token image
  // finalValue represents the token holding's value at contest end for this user
  finalValue: number; 
  // change represents the performance percentage of this token holding for the user
  change: number; 
  // contribution might represent the P/L value or a specific contribution metric
  contribution: number; // Keep as number, parent will pass parsed value
  // Add other props if needed, e.g., quantity, initialValue if they need to be displayed
}

export const TokenPerformance: React.FC<TokenPerformanceProps> = ({
  symbol,
  name,
  imageUrl,
  finalValue,
  change,
  contribution, // Assuming this is P/L value as per new API structure mapping
}) => {
  return (
    <div className="p-4 rounded-lg bg-dark-300/50 flex items-center space-x-3">
      {imageUrl && (
        <img src={imageUrl} alt={name} className="w-8 h-8 rounded-full object-contain bg-gray-700 p-0.5" />
      )}
      {!imageUrl && (
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 font-semibold text-xs">
          {symbol.substring(0, 3).toUpperCase()}
        </div>
      )}
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-md font-semibold text-gray-100 truncate max-w-[120px]" title={name}>{name}</div>
            <div className="text-xs text-gray-400">{symbol}</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-md font-bold text-gray-100">
              {formatCurrency(finalValue)}
            </div>
            <div
              className={`text-sm font-medium ${change >= 0 ? "text-green-400" : "text-red-400"}`}
            >
              {change >= 0 ? "+" : ""}
              {change.toFixed(2)}%
            </div>
          </div>
        </div>
        {/* Contribution display - assuming 'contribution' is the P/L value */}
        <div className="mt-2 flex justify-between items-center text-xs">
          <span className="text-gray-400">P/L Value:</span>
          <span className={`font-medium ${contribution >= 0 ? "text-green-400" : "text-red-400"}`}>
            {contribution >= 0 ? "+" : ""}{formatCurrency(contribution)}
          </span>
        </div>
      </div>
      {/* Removed performance bar for now to simplify, can be added back if needed */}
    </div>
  );
};
