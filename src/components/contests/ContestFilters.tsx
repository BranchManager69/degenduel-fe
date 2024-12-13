import React from 'react';
import { Button } from '../ui/Button';

interface ContestFiltersProps {
  activeStatusFilter: string;
  activeDifficultyFilter: string;
  activeSort: string;
  onStatusFilterChange: (filter: string) => void;
  onDifficultyFilterChange: (filter: string) => void;
  onSortChange: (sort: string) => void;
}

export const ContestFilters: React.FC<ContestFiltersProps> = ({
  activeStatusFilter,
  activeDifficultyFilter,
  activeSort,
  onStatusFilterChange,
  onDifficultyFilterChange,
  onSortChange,
}) => {
  const statusFilters = [
    { id: 'all', label: 'All' },
    { id: 'live', label: 'Live' },
    { id: 'upcoming', label: 'Upcoming' },
  ];

  const difficultyFilters = [
    { id: 'guppy', label: 'Guppy' },
    { id: 'tadpole', label: 'Tadpole' },
    { id: 'squid', label: 'Squid' },
    { id: 'dolphin', label: 'Dolphin' },
    { id: 'shark', label: 'Shark' },
    { id: 'whale', label: 'Whale' },
  ];

  const sortOptions = [
    { id: 'startTime', label: 'Starts Soon' },
    { id: 'prizePool', label: 'Biggest Prize Pool' },
    { id: 'entryFee', label: 'Cheap Entry' },
    { id: 'players', label: 'Most Players' },
  ];

  const handleStatusClick = (id: string) => {
    onStatusFilterChange(activeStatusFilter === id ? 'all' : id);
  };

  const handleDifficultyClick = (id: string) => {
    onDifficultyFilterChange(activeDifficultyFilter === id ? '' : id);
  };

  const handleSortClick = (id: string) => {
    onSortChange(id);
  };

  return (
    <div className="space-y-8">
      {/* Status Filters */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3">Status</h3>
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <Button
              key={filter.id}
              variant={activeStatusFilter === filter.id ? 'gradient' : 'outline'}
              size="sm"
              onClick={() => handleStatusClick(filter.id)}
              className="w-24"
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Difficulty Filters */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3">Difficulty</h3>
        <div className="flex flex-wrap gap-2">
          {difficultyFilters.map((filter) => (
            <Button
              key={filter.id}
              variant={activeDifficultyFilter === filter.id ? 'gradient' : 'outline'}
              size="sm"
              onClick={() => handleDifficultyClick(filter.id)}
              className="w-24"
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Sort Options */}
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-400">Sort by:</span>
        <div className="flex gap-2">
          {sortOptions.map((option) => (
            <Button
              key={option.id}
              variant={activeSort === option.id ? 'gradient' : 'outline'}
              size="sm"
              onClick={() => handleSortClick(option.id)}
              className="w-36"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};