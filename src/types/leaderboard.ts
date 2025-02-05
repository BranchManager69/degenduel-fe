// src/types/leaderboard.ts

// Types for Global Rankings
export interface GlobalRankingEntry {
  rank: number;
  wallet_address: string;
  nickname: string;
  rank_score: number;
  highest_rank_score: number;
  percentile: number;
  trend: "↑" | "↓" | "→";
  avg_position: number | null;
  total_contests: number;
  total_earnings: string;
}

export interface GlobalRankingsResponse {
  total: number;
  rankings: GlobalRankingEntry[];
}

// Types for Contest Performance
export interface ContestPerformanceEntry {
  rank: number;
  wallet_address: string;
  nickname: string;
  contests_won: number;
  total_contests: number;
  win_rate: number;
  longest_win_streak: number;
  current_win_streak: number;
  avg_position: number | null;
  percentile: number;
  trend: "↑" | "↓" | "→";
  total_earnings: string;
}

export interface ContestPerformanceResponse {
  total: number;
  rankings: ContestPerformanceEntry[];
}

export type TimeFrame = "all" | "month" | "week";
