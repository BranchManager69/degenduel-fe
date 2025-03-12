// src/types/profile.ts

export interface UserData {
  wallet_address: string;
  nickname: string | null;
  rank_score: number;
  created_at: string;
  bonusBalance: string;
  is_banned?: boolean;
  ban_reason?: string | null;
  role?: string;
}

export interface UserStats {
  total_earnings: number;
  total_contests: number;
  total_wins: number;
  win_rate: number;
  average_return: number;
}

export interface Achievement {
  achievement: string;
  description: string;
  earned_at: string;
  icon?: string;
  rarity?: "common" | "rare" | "epic" | "legendary";
}

export interface ContestHistoryEntry {
  contest_id: string;
  contest_name: string;
  start_time: string;
  end_time: string;
  portfolio_return: number;
  rank: number;
}

export type ContestHistory = ContestHistoryEntry[];
