import React from "react";
import { Token } from "../../types";

interface TokensControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortField: keyof Token;
  onSortFieldChange: (field: keyof Token) => void;
  sortDirection: "asc" | "desc";
  onSortDirectionChange: () => void;
}

export const TokensControls: React.FC<TokensControlsProps> = ({
  searchQuery,
  onSearchChange,
  sortField,
  onSortFieldChange,
  sortDirection,
  onSortDirectionChange,
}) => {
  return (
    <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between gap-4">
      <div className="w-full sm:max-w-md">
        <input
          type="text"
          placeholder="Search tokens..."
          className="w-full px-4 py-2 bg-dark-300 border border-dark-400 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <select
          value={sortField}
          onChange={(e) => onSortFieldChange(e.target.value as keyof Token)}
          className="px-3 py-2 bg-dark-300 border border-dark-400 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors text-sm"
        >
          <option value="marketCap">Market Cap</option>
          <option value="volume24h">Volume</option>
          <option value="change24h">24h Change</option>
          <option value="liquidity">Liquidity</option>
        </select>
        <button
          onClick={onSortDirectionChange}
          className="px-3 py-2 bg-dark-300 border border-dark-400 rounded-lg text-gray-100 hover:bg-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500 flex items-center gap-2 transition-colors text-sm"
        >
          <span>{sortDirection === "asc" ? "Ascending" : "Descending"}</span>
          <svg
            className={`w-4 h-4 transform transition-transform ${
              sortDirection === "asc" ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
