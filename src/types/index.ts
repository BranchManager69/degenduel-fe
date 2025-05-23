// src/types/index.ts

/**
 * @description Index file for all types used throughout the application.
 * @author BranchManager69
 * @version 2.0.0
 * @created 2025-05-04
 * @updated 2025-05-05 - Updated for unified auth system
 */

// ------------------------------------------------------------------------------------------------

/* Re-exports */

// Re-export user types
export type {
  LegacyUser, User
} from "./user";

// Re-export admin types
export type {
  VanityWallet, VanityWalletBatchCreateParams, VanityWalletBatchCreateResponse,
  VanityWalletCancelResponse, VanityWalletCreateParams, VanityWalletCreateResponse, VanityWalletListParams, VanityWalletListResponse, VanityWalletStatus
} from "./admin";

// Re-export leaderboard types
export type {
  ContestPerformanceEntry,
  ContestPerformanceResponse,
  GlobalRankingEntry,
  GlobalRankingsResponse,
  TimeFrame
} from "./leaderboard";

// ------------------------------------------------------------------------------------------------

/* Types */

// Contest Types
export type ContestStatus = 
  | "pending" 
  | "active" 
  | "completed" 
  | "cancelled";

// Contest Difficulty Levels - REMOVED as new API uses string
// export type DifficultyLevel =
//   | "guppy"
//   | "tadpole"
//   | "squid"
//   | "dolphin"
//   | "shark"
//   | "whale";


// ------------------------------------------------------------------------------------------------

/* Interfaces */

// Contest Settings (Verify!) - REMOVED as it conflicts with new API definition
// export interface ContestSettings {
//   difficulty: DifficultyLevel;
//   min_trades: number;
//   max_participants?: number;
//   min_participants?: number;
//   token_types: string[];
//   rules: Array<{
//     id: string;
//     title: string;
//     description: string;
//   }>;
// }

// Contest Types (Verify!) - Keep this base Contest type for now, might need merging/updating later
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
  image_url?: string; // AI-generated contest image URL
}

// Base Token
export interface BaseToken {
  name: string;
  symbol: string;
  address: string;
}

// Token Liquidity
export interface TokenLiquidity {
  usd: number;
  base: number;
  quote: number;
}

// Timeframe Stats
export interface TimeframeStats {
  buys: number;
  sells: number;
}

// Price Change
export interface PriceChange {
  id: number;
  tokenId: number;
  timeframe: string;
  percentage: string;
}

// Tokens Response
export interface TokensResponse {
  timestamp: string;
  data: Token[];
}

// Token interface (matches DegenDuel market data API)
export interface Token {
  contractAddress: string;
  status: string;
  name: string;
  symbol: string;
  price: string;
  marketCap: string;
  liquidity: {
    usd: string;
    base: string;
    quote: string;
  };
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

// Transaction Types
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

// Activity Types
export interface Activity {
  id: string;
  type: "contest_join" | "contest_complete" | "user_register";
  timestamp: string;
  details: string;
  created_at: Date;
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

// IP Ban List Response
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

// IP Ban Params  
export interface IpBanParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  filter?: string;
}

// IP Ban Check Response
export interface IpBanCheckResponse {
  success: boolean;
  is_banned: boolean;
  ban_details?: IpBan;
}

// IP Ban Create Params
export interface IpBanCreateParams {
  ip_address: string;
  reason: string;
  is_permanent?: boolean;
  expires_at?: string;
  troll_level?: number;
  metadata?: Record<string, any>;
}

// IP Ban Update Params
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

// ------------------------------------------------------------------------------------------------

/* Unused and To Be Removed */

/**
 * Legacy TokenData interface
 * 
 * @deprecated Use Token interface instead for new development
 * This interface is maintained for backward compatibility with older components
 * that expect this structure.
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
  liquidity?: number; // Legacy definition as a number
  status?: "active" | "inactive";
  contractAddress?: string; // Optional to match how it's used with fallbacks
}

// ------------------------------------------------------------------------------------------------

/* Unused and To Be Removed */

/* 
export interface ContestPortfolio {  // Used for database representation of contest portfolio entries
  contest_id: number;
  wallet_address: string;
  token_id: number;                  // References token table
  weight: number;                    // Percentage weight in contest portfolio (0-100)
  created_at: string;
} 
*/

// ======= Types for Unified Contest View Endpoint =======

// This ContestSettings definition is the one aligned with the new API
export interface ContestSettings {
  difficulty: string; // e.g., "guppy"
  maxParticipants: number | null;
  minParticipants: number;
  tokenTypesAllowed: string[]; // e.g., ["SPL"]
  startingPortfolioValue: string; // e.g., "10000"
}

// This ContestDetails definition is the one aligned with the new API
export interface ContestDetails {
  id: string; 
  name: string;
  description: string;
  status: "pending" | "active" | "completed" | "cancelled";
  startTime: string; 
  endTime: string; 
  entryFee: string; 
  prizePool: string; 
  currency: string; 
  participantCount: number;
  settings: ContestSettings; // Uses the new ContestSettings definition above
  isCurrentUserParticipating: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string; // Wallet address
  username: string;
  profilePictureUrl: string | null;
  portfolioValue: string; // Decimal string (8 places)
  performancePercentage: string; // Decimal string (2 places)
  isCurrentUser: boolean;
  isAiAgent: boolean;
  prizeAwarded: string | null; // Decimal string (8 places)
}

export interface HistoricalDataPoint {
  timestamp: string; // ISO8601DateTimeString
  value: string; // Decimal string (8 places)
}

export interface TokenHoldingPerformance {
  symbol: string;
  name: string;
  imageUrl: string | null;
  weight: number; // Percentage
  quantity: string; // Decimal string (8 places)
  initialValueContribution: string; // Decimal string (8 places)
  currentValueContribution: string; // Decimal string (8 places)
  performancePercentage: string; // Decimal string (2 places)
  profitLossValueContribution: string; // Decimal string (8 places)
}

export interface CurrentUserPerformance {
  rank: number | null;
  portfolioValue: string; // Decimal string (8 places)
  initialPortfolioValue: string; // Decimal string (8 places)
  performancePercentage: string; // Decimal string (2 places)
  historicalPerformance: HistoricalDataPoint[];
  tokens: TokenHoldingPerformance[];
}

export interface ContestViewData {
  contest: ContestDetails;
  leaderboard: LeaderboardEntry[];
  currentUserPerformance: CurrentUserPerformance | null; // Null if user not participating
}

export interface UnifiedContestViewApiResponse {
  success: boolean;
  data: ContestViewData;
  error?: string; // Include optional error field
}

// ======= End of Unified Contest View Types =======
