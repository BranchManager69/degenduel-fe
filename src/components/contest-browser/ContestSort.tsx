import React from "react";
import type { SortDirection, SortField } from "../../types/sort";

interface ContestSortProps {
  currentField: SortField;
  direction: SortDirection;
  onSort: (field: SortField, direction: SortDirection) => void;
}

const sortOptions: Array<{ label: string; value: SortField }> = [
  { label: "Participants", value: "participant_count" },
  { label: "Entry Fee", value: "entry_fee" },
  { label: "Prize Pool", value: "prize_pool" },
  { label: "Start Time", value: "start_time" },
];

export const ContestSort: React.FC<ContestSortProps> = ({
  currentField,
  direction,
  onSort,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="text-sm text-gray-400">Sort by:</label>
      <div className="flex flex-wrap gap-2">
        {sortOptions.map((option) => (
          <button
            key={option.value}
            onClick={() =>
              onSort(option.value, direction === "asc" ? "desc" : "asc")
            }
            className={`px-3 py-1 rounded-full text-sm ${
              currentField === option.value
                ? "bg-brand-500 text-white"
                : "bg-dark-300 text-gray-400 hover:text-gray-200"
            }`}
          >
            {option.label}{" "}
            {currentField === option.value && (direction === "asc" ? "↑" : "↓")}
          </button>
        ))}
      </div>
    </div>
  );
};
