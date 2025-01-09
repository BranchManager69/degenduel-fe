import React from "react";
import { FaSort, FaSortDown, FaSortUp } from "react-icons/fa";
import type { SortDirection, SortField } from "../../types/sort";

interface ContestSortProps {
  currentField: SortField;
  direction: SortDirection;
  onSort: (field: SortField, direction: SortDirection) => void;
}

export const ContestSort: React.FC<ContestSortProps> = ({
  currentField,
  direction,
  onSort,
}) => {
  return (
    <div className="flex items-center gap-4">
      <span className="text-gray-400">Sort by:</span>
      <div className="flex items-center gap-2">
        {sortOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              const newDirection =
                currentField === option.value && direction === "desc"
                  ? "asc"
                  : "desc";
              onSort(option.value, newDirection);
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors
              ${
                currentField === option.value
                  ? "bg-brand-500 text-white"
                  : "bg-dark-300 text-gray-300 hover:bg-dark-200"
              }`}
          >
            {option.label}
            {currentField === option.value ? (
              direction === "asc" ? (
                <FaSortUp className="w-4 h-4" />
              ) : (
                <FaSortDown className="w-4 h-4" />
              )
            ) : (
              <FaSort className="w-4 h-4 opacity-50" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

const sortOptions: Array<{ label: string; value: SortField }> = [
  { label: "Participants", value: "participant_count" },
  { label: "Entry Fee", value: "entry_fee" },
  { label: "Prize Pool", value: "prize_pool" },
  { label: "Start Time", value: "start_time" },
];
