// src/types/sort.ts

export type SortDirection = "asc" | "desc";
export type SortField =
  | "participant_count"
  | "entry_fee"
  | "prize_pool"
  | "start_time";

export interface SortOptions {
  field: SortField;
  direction: SortDirection;
}
