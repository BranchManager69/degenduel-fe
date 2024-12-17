// src/types/index.ts

// Core Entity Types
export interface User {
  wallet_address: string;
  nickname: string;
  created_at: string;
  last_login: string | null;
  total_contests: number;
  total_wins: number;
  total_earnings: number;
  rank_score: number;
  settings: Record<string, any>;
  balance: number;
  is_banned: boolean;
  ban_reason?: string;
  last_deposit_at?: string;
  last_withdrawal_at?: string;
  kyc_status?: string;
  risk_level: number;
  is_admin?: boolean;
}

export interface Token {
  id: number;
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  price: number;
  market_cap: number;
  change_24h: number;
  volume_24h: number;
  is_active: boolean;
  created_at: string;
}

// Activity Types
export interface Activity {
  id: string;
  type: 'contest_join' | 'contest_complete' | 'user_register';
  timestamp: string;
  details: string;
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

// Contest Types
export type ContestStatus = 
  | 'pending'
  | 'active'
  | 'in_progress'
  | 'in-progress'  // Marked for future cleanup
  | 'completed'
  | 'cancelled';

export interface ContestSettings {
  difficulty: 'guppy' | 'tadpole' | 'squid' | 'dolphin' | 'shark' | 'whale';
  min_trades: number;
  max_participants: number;
  min_participants: number;
  rules: string[];
  token_types?: string[];
  allowed_buckets?: number[];
  entry_deadline?: string;
}

export interface Contest {
  id: number;
  name: string;
  description: string;
  start_time: string;
  end_time: string;
  entry_fee: string;
  prize_pool: string;
  current_prize_pool: string;
  status: ContestStatus;
  settings: ContestSettings;
  created_at: string;
  updated_at: string;
  participant_count: number;
  is_participating: boolean;
  last_entry_time?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  allowed_buckets?: number[];
  participants: Array<{
    address: string;
    username?: string;
    score?: number;
  }>;
}

// Portfolio Types
export interface Portfolio {  // (SUCKY INTERFACE) Used for displaying a user's overall portfolio value and performance
  tokens: Array<{             // Array of tokens held by user     <--- ** Does NOT use token_id! **
    symbol: string;
    amount: number;           // Actual token amount held
  }>;
  total_value: number;        // Total portfolio value in USD     <--- Stupid attribute to have
  performance_24h: number;    // 24-hour performance percentage   <--- Makes no sense conceptually
}

/* 
export interface ContestPortfolio {  // Used for database representation of contest portfolio entries
  contest_id: number;
  wallet_address: string;
  token_id: number;                  // References token table
  weight: number;                    // Percentage weight in contest portfolio (0-100)
  created_at: string;
} 
*/

// API Response Types
export interface PortfolioResponse {  // Used for API responses when fetching contest portfolio data
  tokens: Array<{    // Array of tokens held by user              <--- ** Does NOT use token_id! **
    symbol: string;
    weight: number;  // Percentage weight in contest portfolio (0-100)
  }>;
}

export interface PlatformStats {
  totalUsers: number;
  activeContests: number;
  totalVolume: number;
  dailyActiveUsers: number;
  userGrowth: number;
  volumeGrowth: number;
}

// Error Types
export type WalletError = {
  code: 'WALLET_NOT_FOUND' | 'CONNECTION_FAILED' | 'USER_REJECTED' | 'API_ERROR' | 'UNAUTHORIZED';
  message: string;
}

