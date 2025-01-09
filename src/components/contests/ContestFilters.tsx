import React from "react";
import type { ContestSettings } from "../../types";
import type { SortDirection, SortField } from "../../types/sort";
import { ContestSort } from "./ContestSort";

interface ContestFiltersProps {
  activeStatusFilter: string;
  activeDifficultyFilter: ContestSettings["difficulty"] | "";
  activeSortField: SortField;
  sortDirection: SortDirection;
  onStatusFilterChange: (status: string) => void;
  onDifficultyFilterChange: (
    difficulty: ContestSettings["difficulty"] | ""
  ) => void;
  onSortChange: (field: SortField, direction: SortDirection) => void;
}

export const ContestFilters: React.FC<ContestFiltersProps> = ({
  activeStatusFilter,
  activeDifficultyFilter,
  activeSortField,
  sortDirection,
  onStatusFilterChange,
  onDifficultyFilterChange,
  onSortChange,
}) => {
  return (
    <div className="flex flex-wrap gap-4 items-center">
      <select
        className="bg-dark-200 text-gray-100 rounded px-3 py-2"
        value={activeStatusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value)}
      >
        <option value="all">All Status</option>
        <option value="live">Live</option>
        <option value="upcoming">Upcoming</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>

      <select
        className="bg-dark-200 text-gray-100 rounded px-3 py-2"
        value={activeDifficultyFilter}
        onChange={(e) =>
          onDifficultyFilterChange(
            e.target.value as ContestSettings["difficulty"] | ""
          )
        }
      >
        <option value="">All Difficulties</option>
        <option value="guppy">Guppy</option>
        <option value="tadpole">Tadpole</option>
        <option value="squid">Squid</option>
        <option value="dolphin">Dolphin</option>
        <option value="shark">Shark</option>
        <option value="whale">Whale</option>
      </select>

      <ContestSort
        currentField={activeSortField}
        direction={sortDirection}
        onSort={onSortChange}
      />
    </div>
  );
};
