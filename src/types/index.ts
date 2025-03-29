// src/types/index.ts

// Re-export leaderboard types
export type {
  ContestPerformanceEntry,
  ContestPerformanceResponse,
  GlobalRankingEntry,
  GlobalRankingsResponse,
  TimeFrame,
} from "./leaderboard";

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
  jwt?: string; // JWT token for authentication
  wsToken?: string; // WebSocket-specific token
  session_token?: string; // Session token for WebSocket authentication
  is_superadmin?: boolean;
  profile_image?: {
    url: string;
    thumbnail_url?: string;
    updated_at?: string;
  };
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

// Token interface (matches DegenDuel market data API)
export interface Token {
  contractAddress: string;
  name: string;
  symbol: string;
  price: string;
  marketCap: string;
  volume24h: string;
  change24h: string;
  changesJson?: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
    [key: string]: number;
  };
  transactionsJson?: {
    m5: TimeframeStats;
    h1: TimeframeStats;
    h6: TimeframeStats;
    h24: TimeframeStats;
    [key: string]: TimeframeStats;
  };
  baseToken?: BaseToken;
  quoteToken?: BaseToken;
  liquidity?: {
    usd: string;
    base: string;
    quote: string;
  };
  images?: {
    imageUrl: string;
    headerImage: string;
    openGraphImage: string;
  };
  socials?: {
    twitter?: { url: string; count: number | null };
    telegram?: { url: string; count: number | null };
    discord?: { url: string; count: number | null };
  };
  websites?: Array<{
    url: string;
    label: string;
  }>;
}

/**
 * WebSocket-specific token data interface
 * Used by the WebSocket token data system
 */
export interface TokenData {
  symbol: string;
  name: string;
  price: string;
  marketCap: string;
  volume24h: string;
  volume5m?: string;
  change24h: string;
  change5m?: string;
  change1h?: string;
  imageUrl?: string;
  liquidity?: number;
  status?: "active" | "inactive";
}

// Token response metadata
export interface TokenResponseMetadata {
  timestamp: string;
  _cached?: boolean;
  _stale?: boolean;
  _cachedAt?: string;
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
  token_types: string[];
  rules: Array<{
    id: string;
    title: string;
    description: string;
  }>;
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

// IP Ban Types
export interface IpBan {
  id: string;
  ip_address: string;
  reason: string;
  is_permanent: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  troll_level: number;
  num_attempts: number;
  metadata?: Record<string, any>;
}

export interface IpBanListResponse {
  success: boolean;
  data: IpBan[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface IpBanParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  filter?: string;
}

export interface IpBanCheckResponse {
  success: boolean;
  is_banned: boolean;
  ban_details?: IpBan;
}

export interface IpBanCreateParams {
  ip_address: string;
  reason: string;
  is_permanent?: boolean;
  expires_at?: string;
  troll_level?: number;
  metadata?: Record<string, any>;
}

export interface IpBanUpdateParams {
  reason?: string;
  is_permanent?: boolean;
  expires_at?: string;
  troll_level?: number;
  metadata?: Record<string, any>;
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
