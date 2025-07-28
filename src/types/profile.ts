// src/types/profile.ts

export interface UserData {
  wallet_address: string;
  nickname: string | null;
  rank_score: number;
  created_at: string;
  bonusBalance: string;
  is_banned?: boolean;
  ban_reason?: string | null;
  role?: string | null;
}

export interface UserStats {
  total_earnings: number;
  total_contests: number;
  total_wins: number;
  win_rate: number;
  average_return: number;
  avg_rank?: number;
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

export interface TokenInfo {
  id: number;
  address: string;
  symbol: string;
  name: string;
  image_url: string | null;
  color: string;
  price: string;
  change_24h: string;
  market_cap: string;
  volume_24h: string | null;
}

export interface PortfolioToken {
  token_id: number;
  weight: number;
  quantity: number;
  value_usd: number;
  value_sol: number | null;
  token: TokenInfo;
}

export interface ContestInfo {
  id: number;
  name: string;
  status: "completed" | "cancelled" | "active" | "pending";
  start_time: string;
  end_time: string;
  entry_fee: string;
  prize_pool: string;
  participant_count: number;
  contest_code: string;
  description: string;
  created_at: string;
  allowed_buckets: number[];
  min_participants: number;
  max_participants: number;
  cancellation_reason: string | null;
  image_url: string;
  created_by_user: string;
  creator_credit_used: number | null;
  visibility: "public" | "private";
  contest_type: "REGULAR" | string;
  token_mint: string | null;
  challenge_expires_at: string | null;
  challenge_status: string | null;
  challenged_wallet: string | null;
  challenger_wallet: string | null;
  settings: {
    difficulty: string;
    tokenTypesAllowed: any[];
    startingPortfolioValue: string;
  };
}

import { PortfolioTransactions } from './transactions';

export interface UserPortfolio {
  contest_id: number;
  contest: ContestInfo;
  wallet_address: string;
  joined_at: string;
  rank: number;
  final_rank: number | null;
  portfolio_value: string;
  portfolio_value_usd: number;
  portfolio_value_sol: number;
  sol_price_used: number;
  sol_price_source: string;
  sol_price_timestamp: string | null;
  portfolio: PortfolioToken[];
  has_portfolio: boolean;
  transactions: PortfolioTransactions;
}

export type ContestHistory = ContestHistoryEntry[];
