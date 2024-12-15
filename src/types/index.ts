// src/types/index.ts

export interface ContestSettings {
  difficulty: 'guppy' | 'tadpole' | 'squid' | 'dolphin' | 'shark' | 'whale';
  min_trades: number;
  max_participants: number;
  rules: string[];
  token_types?: string[];
  // New fields from schema
  allowed_buckets?: number[];
  min_participants: number;
  entry_deadline?: string;
}

export interface Contest {
  // Existing fields
  id: number;
  name: string;
  description: string;
  start_time: string;
  end_time: string;
  entry_fee: string;
  prize_pool: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  settings: ContestSettings;
  created_at: string;
  participant_count: number;
  is_participating: boolean;
  participants: Array<{
    address: string;
    username?: string;
    score?: number;
  }>;
  // New fields from schema
  current_prize_pool: string;
  last_entry_time?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  updated_at: string;
  allowed_buckets?: number[];
}

export interface Token {
  // Existing fields
  symbol: string;
  name: string;
  price: number;
  market_cap: number;
  change_24h: number;
  volume_24h: number;
  // New fields from schema
  id: number;
  address: string;
  decimals: number;
  is_active: boolean;
  created_at: string;
}

export interface TokenBucket {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  tokens: Token[];
}

export interface User {
  // Existing fields
  wallet_address: string;
  nickname: string;
  created_at: string;
  last_login: string | null;
  total_contests: number;
  total_wins: number;
  total_earnings: number;
  rank_score: number;
  settings: Record<string, any>;
  is_admin?: boolean;
  // New fields from schema
  balance: number;
  is_banned: boolean;
  ban_reason?: string;
  last_deposit_at?: string;
  last_withdrawal_at?: string;
  kyc_status?: string;
  risk_level: number;
}

export interface Portfolio {
  tokens: {
    symbol: string;
    amount: number;
  }[];
  total_value: number;
  performance_24h: number;
}

export interface Transaction {
  id: number;
  wallet_address: string;
  type: 'CONTEST_ENTRY' | 'PRIZE_PAYOUT' | 'DEPOSIT' | 'WITHDRAWAL' | 'REFERRAL_BONUS' | 'PROMOTION';
  amount: number;
  balance_before: number;
  balance_after: number;
  contest_id?: number;
  description?: string;
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  metadata: Record<string, any>;
  created_at: string;
  processed_at?: string;
}

export interface ContestPortfolio {
  contest_id: number;
  wallet_address: string;
  token_id: number;
  weight: number;
  created_at: string;
}

export type WalletError = {
  code: 'WALLET_NOT_FOUND' | 'CONNECTION_FAILED' | 'USER_REJECTED' | 'API_ERROR' | 'UNAUTHORIZED';
  message: string;
}

