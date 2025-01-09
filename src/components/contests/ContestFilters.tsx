import React from "react";
import type { ContestSettings } from "../../types";

interface ContestFiltersProps {
  activeStatusFilter: string;
  activeDifficultyFilter: string;
  activeSort: string;
  onStatusFilterChange: (status: string) => void;
  onDifficultyFilterChange: (
    difficulty: ContestSettings["difficulty"] | ""
  ) => void;
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
  return (
    <div className="flex flex-wrap gap-4">
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

      <select
        className="bg-dark-200 text-gray-100 rounded px-3 py-2"
        value={activeSort}
        onChange={(e) => onSortChange(e.target.value)}
      >
        <option value="start_time">Sort by Start Time</option>
        <option value="end_time">Sort by End Time</option>
        <option value="prize_pool">Sort by Prize Pool</option>
        <option value="entry_fee">Sort by Entry Fee</option>
        <option value="participant_count">Sort by Participants</option>
      </select>
    </div>
  );
};
