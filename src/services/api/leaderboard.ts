import { API_URL } from "../../config/config";

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

// API Functions
export const ddApi = {
  leaderboard: {
    getGlobalRankings: async (
      limit: number = 10,
      offset: number = 0
    ): Promise<GlobalRankingsResponse> => {
      const response = await fetch(
        `${API_URL}/leaderboard/global?limit=${limit}&offset=${offset}`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch global rankings");
      }
      return response.json();
    },

    getContestPerformance: async (
      timeframe: TimeFrame = "month",
      limit: number = 10,
      offset: number = 0
    ): Promise<ContestPerformanceResponse> => {
      const response = await fetch(
        `${API_URL}/leaderboard/contests/performance?timeframe=${timeframe}&limit=${limit}&offset=${offset}`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch contest performance rankings");
      }
      return response.json();
    },
  },
};
