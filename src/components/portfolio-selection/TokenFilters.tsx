import React from "react";
import { FaList, FaThLarge } from "react-icons/fa";

import { TokenSearch } from "../common/TokenSearch";
import { SearchToken } from "../../types";

interface TokenFiltersProps {
  viewMode?: 'card' | 'list';
  onViewModeChange?: (mode: 'card' | 'list') => void;
  onTokenSearchSelect?: (token: SearchToken) => void;
}

export const TokenFilters: React.FC<TokenFiltersProps> = ({
  viewMode = 'card',
  onViewModeChange,
  onTokenSearchSelect,
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

      {/* View Toggle Only */}
      <div className="flex justify-end items-center">
        {onViewModeChange && (
          <div className="flex items-center space-x-1 bg-dark-300/50 rounded-lg overflow-hidden">
            <button
              onClick={() => onViewModeChange('card')}
              className={`px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors ${
                viewMode === 'card' 
                  ? 'bg-brand-500/30 text-white' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <FaThLarge size={12} />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors ${
                viewMode === 'list' 
                  ? 'bg-brand-500/30 text-white' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <FaList size={12} />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
