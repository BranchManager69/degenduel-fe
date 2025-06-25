import React from "react";
import { FaList, FaThLarge } from "react-icons/fa";

import { SearchToken } from "../../types";
import { TokenSearch } from "../common/TokenSearch";

interface TokenFiltersProps {
  viewMode?: 'card' | 'list';
  onViewModeChange?: (mode: 'card' | 'list') => void;
  onTokenSearchSelect?: (token: SearchToken) => void;
  sortBy?: 'default' | 'marketCap' | 'volume' | 'change24h' | 'price';
  onSortChange?: (sort: 'default' | 'marketCap' | 'volume' | 'change24h' | 'price') => void;
}

export const TokenFilters: React.FC<TokenFiltersProps> = ({
  viewMode = 'card',
  onViewModeChange,
  onTokenSearchSelect,
  sortBy = 'volume',
  onSortChange,
}) => {
  return (
    <div className="space-y-4">
      {/* Token Search */}
      {onTokenSearchSelect && (
        <div className="space-y-2">
          <div className="text-xs font-mono text-emerald-400 mb-2">TOKEN.SEARCH:</div>
          <TokenSearch
            onSelectToken={onTokenSearchSelect}
            placeholder="Search by symbol, name, or address..."
            variant="modern"
            showPriceData={true}
          />
        </div>
      )}

      {/* View Mode & Sort Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            {onViewModeChange && (
              <div className="flex items-center space-x-1 bg-dark-300/70 rounded-lg overflow-hidden border border-dark-400">
                <button
                  onClick={() => onViewModeChange('card')}
                  className={`px-4 py-2 text-sm flex items-center gap-2 transition-all duration-200 ${
                    viewMode === 'card' 
                      ? 'bg-brand-500/40 text-white shadow-inner' 
                      : 'text-gray-300 hover:text-white hover:bg-dark-200/50'
                  }`}
                >
                  <FaThLarge size={14} />
                  <span>Cards</span>
                </button>
                <button
                  onClick={() => onViewModeChange('list')}
                  className={`px-4 py-2 text-sm flex items-center gap-2 transition-all duration-200 ${
                    viewMode === 'list' 
                      ? 'bg-brand-500/40 text-white shadow-inner' 
                      : 'text-gray-300 hover:text-white hover:bg-dark-200/50'
                  }`}
                >
                  <FaList size={14} />
                  <span>List</span>
                </button>
              </div>
            )}
          </div>

          {onSortChange && (
            <div className="flex items-center gap-3">
              <div className="text-xs font-mono text-emerald-400">SORT.BY:</div>
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as any)}
                className="px-3 py-2 bg-dark-300/70 border border-dark-400 rounded-lg text-white text-sm focus:outline-none focus:border-brand-400 appearance-none"
              >
                <option value="default">🔥 Trending</option>
                <option value="marketCap">Market Cap</option>
                <option value="volume">Volume</option>
                <option value="change24h">24h Change</option>
                <option value="price">Price</option>
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
