import React from "react";
import { FaList, FaThLarge, FaTh } from "react-icons/fa";

import { SearchToken } from "../../types";
import { TokenSearch } from "../common/TokenSearch";

interface TokenFiltersProps {
  viewMode?: 'grid' | 'list' | 'compact';
  onViewModeChange?: (mode: 'grid' | 'list' | 'compact') => void;
  onTokenSearchSelect?: (token: SearchToken) => void;
  sortBy?: 'default' | 'marketCap' | 'volume' | 'change24h' | 'price';
  onSortChange?: (sort: 'default' | 'marketCap' | 'volume' | 'change24h' | 'price') => void;
}

export const TokenFilters: React.FC<TokenFiltersProps> = ({
  viewMode = 'compact',
  onViewModeChange,
  onTokenSearchSelect,
  sortBy = 'volume',
  onSortChange,
}) => {
  return (
    <div className="space-y-3">
      {/* View Mode & Sort Controls - on same line */}
      <div className="flex justify-between items-center gap-4">
        {onSortChange && (
          <div className="flex items-center gap-2">
            <div className="text-xs font-mono text-emerald-400">SORT:</div>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as any)}
              className="px-2 py-1.5 bg-dark-300/70 border border-dark-400 rounded-lg text-white text-sm focus:outline-none focus:border-brand-400 appearance-none"
            >
              <option value="change24h">24h Change</option>
              <option value="marketCap">Market Cap</option>
              <option value="volume">Volume</option>
              <option value="price">Price</option>
            </select>
          </div>
        )}

        {onViewModeChange && (
          <div className="flex items-center space-x-1 bg-dark-300/70 rounded-lg overflow-hidden border border-dark-400">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-all duration-200 ${
                viewMode === 'grid' 
                  ? 'bg-brand-500/40 text-white shadow-inner' 
                  : 'text-gray-300 hover:text-white hover:bg-dark-200/50'
              }`}
            >
              <FaThLarge size={12} />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-all duration-200 ${
                viewMode === 'list' 
                  ? 'bg-brand-500/40 text-white shadow-inner' 
                  : 'text-gray-300 hover:text-white hover:bg-dark-200/50'
              }`}
            >
              <FaList size={12} />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              onClick={() => onViewModeChange('compact')}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-all duration-200 ${
                viewMode === 'compact' 
                  ? 'bg-brand-500/40 text-white shadow-inner' 
                  : 'text-gray-300 hover:text-white hover:bg-dark-200/50'
              }`}
            >
              <FaTh size={12} />
              <span className="hidden sm:inline">Compact</span>
            </button>
          </div>
        )}
      </div>

      {/* Token Search */}
      {onTokenSearchSelect && (
        <div className="space-y-2">
          <div className="text-xs font-mono text-emerald-400">TOKEN.SEARCH:</div>
          <TokenSearch
            onSelectToken={onTokenSearchSelect}
            placeholder="Search by symbol, name, or address..."
            variant="modern"
            showPriceData={true}
          />
        </div>
      )}
    </div>
  );
};
