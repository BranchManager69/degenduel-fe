import React from "react";
import { FaList, FaThLarge } from "react-icons/fa";

import { Button } from "../ui/Button";

interface TokenFiltersProps {
  marketCapFilter: string;
  onMarketCapFilterChange: (filter: string) => void;
  viewMode?: 'card' | 'list';
  onViewModeChange?: (mode: 'card' | 'list') => void;
}

export const TokenFilters: React.FC<TokenFiltersProps> = ({
  marketCapFilter,
  onMarketCapFilterChange,
  viewMode = 'card',
  onViewModeChange,
}) => {
  const filters = [
    { id: "high-cap", label: "High Cap ($50M+)" },
    { id: "mid-cap", label: "Mid Cap ($10-50M)" },
    { id: "low-cap", label: "Low Cap ($1-10M)" },
  ];

  const handleFilterClick = (id: string) => {
    onMarketCapFilterChange(marketCapFilter === id ? "" : id);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-400">Market Cap</h3>
        
        {/* View Toggle */}
        {onViewModeChange && (
          <div className="flex items-center space-x-1 bg-dark-300/50 rounded-lg overflow-hidden">
            <button
              onClick={() => onViewModeChange('card')}
              className={`px-2 py-1 text-xs flex items-center gap-1 ${
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
              className={`px-2 py-1 text-xs flex items-center gap-1 ${
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
      
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Button
            key={filter.id}
            variant={marketCapFilter === filter.id ? "gradient" : "outline"}
            size="sm"
            onClick={() => handleFilterClick(filter.id)}
            className="w-40"
          >
            {filter.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
