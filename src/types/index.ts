// src/types/index.ts

// Core Entity Types
export interface User {
  wallet_address: string;
  nickname: string | null;
  created_at: string;
  last_login: string;
  role: string;
  total_contests: number;
  total_wins: number;
  total_earnings: string;
  rank_score: number;
  settings: Record<string, any>;
  balance: string;
  is_banned: boolean;
  ban_reason: string | null;
  last_deposit_at?: string;
  last_withdrawal_at?: string;
  kyc_status?: string;
  risk_level: string;
  is_admin?: boolean;
}

export interface BaseToken {
  name: string;
  symbol: string;
  address: string;
}

export interface TokenLiquidity {
  usd: number;
  base: number;
  quote: number;
}

export interface TimeframeStats {
  buys: number;
  sells: number;
}

export interface PriceChange {
  id: number;
  tokenId: number;
  timeframe: string;
  percentage: string;
}

export interface TokensResponse {
  timestamp: string;
  data: Token[];
}

interface Website {
  url: string;
  label: string;
}

export interface Token {
  id: number;
  symbol: string;
  name: string;
  contractAddress: string;
  chain: string;
  createdAt: string;
  updatedAt: string;

  // Price and market data
  price: string;
  marketCap: number | null;
  volume24h: string;

  // Changes and metrics
  changesJson: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
    [key: string]: number; // Allow for future timeframes
  };

  // Token metadata
  imageUrl: string | null;
  headerImage: string | null;
  openGraphImage: string | null;
  coingeckoId: string | null;
  websites: Website[] | null;

  // Liquidity information
  liquidity: TokenLiquidity;
  pairUrl: string;

  // Transaction statistics
  transactionsJson: {
    m5: TimeframeStats;
    h1: TimeframeStats;
    h6: TimeframeStats;
    h24: TimeframeStats;
    [key: string]: TimeframeStats; // Allow for future timeframes
  };

  // Token pair information
  baseToken: BaseToken;
  quoteToken: BaseToken;

  // Historical price changes
  priceChanges: PriceChange[];

  // Social media links
  socials: Array<{
    platform: string;
    url: string;
  }>;

  // Computed/transformed fields
  change_24h?: number; // Maintained for backward compatibility

  // Future-proofing
  metadata?: Record<string, any>;
  flags?: Record<string, boolean>;
  [key: string]: any; // Allow for additional properties
}

// Activity Types
export interface BaseActivity {
  id: string;
  type: "contest_join" | "contest_complete" | "user_register";
  timestamp: string;
  details: string;
  created_at: string;
}

export interface Transaction {
  id: number;
  wallet_address: string;
  type:
    | "CONTEST_ENTRY"
    | "PRIZE_PAYOUT"
    | "DEPOSIT"
    | "WITHDRAWAL"
    | "REFERRAL_BONUS"
    | "PROMOTION";
  amount: number;
  balance_before: number;
  balance_after: number;
  contest_id?: number;
  description?: string;
  status: "pending" | "completed" | "failed" | "reversed";
  metadata: Record<string, any>;
  created_at: string;
  processed_at?: string;
}

export interface Activity {
  id: string;
  type: "contest_join" | "contest_complete" | "user_register";
  timestamp: string;
  details: string;
  created_at: Date;
}

// Contest Types
export type ContestStatus = "pending" | "active" | "completed" | "cancelled";

export type DifficultyLevel =
  | "guppy"
  | "tadpole"
  | "squid"
  | "dolphin"
  | "shark"
  | "whale";

export interface ContestSettings {
  difficulty: DifficultyLevel;
  min_trades: number;
  ////max_participants: number;
  ////min_participants: number;
  token_types: string[];
  rules: string[];
}

export interface Contest {
  id: number;
  name: string;
  description: string;
  entry_fee: string;
  prize_pool: string;
  current_prize_pool?: string;
  start_time: string;
  end_time: string;
  entry_deadline?: string;
  allowed_buckets: number[];
  participant_count: number;
  last_entry_time?: string;
  status: ContestStatus;
  cancelled_at?: string;
  cancellation_reason?: string;
  settings: ContestSettings;
  created_at: string;
  updated_at: string;
  min_participants: number;
  max_participants: number;
  is_participating?: boolean;
  participants?: Array<{
    address: string;
    username?: string;
    score?: number;
  }>;
  contest_code: string;
}

// Portfolio Types
export interface Portfolio {
  // (SUCKY INTERFACE) Used for displaying a user's overall portfolio value and performance
  tokens: Array<{
    // Array of tokens held by user     <--- ** Does NOT use token_id! **
    symbol: string;
    amount: number; // Actual token amount held
  }>;
  total_value: number; // Total portfolio value in USD     <--- Stupid attribute to have
  performance_24h: number; // 24-hour performance percentage   <--- Makes no sense conceptually
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
export interface PortfolioResponse {
  tokens: Array<{
    symbol: string;
    contractAddress: string;
    weight: number;
  }>;
  transaction_signature?: string;
}

export interface PlatformStats {
  totalUsers: number;
  activeContests: number;
  totalVolume: number | string;
  totalPrizesPaid: number | string;
  dailyActiveUsers: number;
  userGrowth: number;
  volumeGrowth: number;
}

// Error Types
export type WalletError = {
  code:
    | "WALLET_NOT_FOUND"
    | "CONNECTION_FAILED"
    | "USER_REJECTED"
    | "API_ERROR"
    | "UNAUTHORIZED";
  message: string;
};

// Response Types
export interface PaginatedResponse<T> {
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
  data?: T[];
}
