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
  total_prize_pool?: string; // Backend-calculated: prize_pool + current_prize_pool
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
    nickname?: string;
    role?: string;
    profile_image_url?: string;
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

// REAL Backend Token Interface - Supports Both Formats
export interface Token {
  // Core identification
  id: number;
  address: string;
  symbol: string;
  name: string;

  // Status & Classification
  is_active?: boolean;
  priority_score?: number;
  degenduel_score?: number;
  trend_category?: string;
  momentum_indicator?: string;

  // Visual/Metadata
  image_url?: string | null;
  header_image_url?: string | null;
  open_graph_image_url?: string | null;
  color?: string;
  description?: string | null;
  tags?: string[];

  // Supply Information
  total_supply?: number | null;
  raw_supply?: number | null;
  decimals: number;

  // Discovery & Tracking
  first_seen_on_jupiter_at?: string | null;
  pairCreatedAt?: string | null;
  metadata_status?: string;
  refresh_interval_seconds?: number;

  // Timestamps
  created_at?: string;
  updated_at?: string;

  // FORMAT 1: Standard Tokens (/api/tokens, WebSocket) - NESTED STRUCTURE
  token_prices?: {
    price: string;           // STRING format
    change_24h: string;      // STRING format
    market_cap: string;      // STRING format
    volume_24h: string;      // STRING format
    liquidity: string;       // STRING format
    fdv: string;            // STRING format
    updated_at: string;
  } | null;

  // Enhanced data in nested structure
  refresh_metadata?: {
    enhanced_market_data?: {
      priceChanges?: {
        m5: number;   // REAL backend keys!
        h1: number;
        h6: number;
        h24: number;
      };
      volumes?: {
        m5: number;
        h1: number;
        h6: number;
        h24: number;
      };
      transactions?: {
        m5: { buys: number; sells: number };
        h1: { buys: number; sells: number };
        h6: { buys: number; sells: number };
        h24: { buys: number; sells: number };
      };
    };
  };

  // Social links in array format
  token_socials?: Array<{
    id: number;
    token_id: number;
    type: string;        // "twitter", "telegram", "discord", "website"
    url: string;
    created_at: string;
  }>;

  // Token bucket memberships
  token_bucket_memberships?: Array<{
    id: number;
    token_id: number;
    bucket_id: number;
    created_at: string;
    token_buckets?: {
      id: number;
      name: string;
      description: string;
    };
  }>;

  // FORMAT 2: Trending Tokens (/api/tokens/trending) - FLATTENED STRUCTURE
  // Direct price data as numbers
  price?: number;             // NUMBER format (trending)
  change_24h?: number;        // NUMBER format (trending)
  market_cap?: number | null; // NUMBER format (trending)
  volume_24h?: number | null; // NUMBER format (trending)
  liquidity?: number;         // NUMBER format (trending)
  fdv?: number;              // NUMBER format (trending)

  // Flattened enhanced data
  priceChanges?: {
    m5: number;   // REAL backend keys!
    h1: number;
    h6: number;
    h24: number;
  };

  volumes?: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };

  transactions?: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };

  // Flattened social data
  socials?: {
    twitter?: string;
    telegram?: string;
    discord?: string;
    website?: string;
  };

  websites?: Array<{
    label: string;
    url: string;
  }>;

  // Legacy compatibility fields
  contractAddress?: string;   // Alias for address
  totalSupply?: string;       // Legacy
  priorityScore?: number;     // Legacy
  marketCap?: string;         // Legacy
  volume24h?: string;         // Legacy
  change24h?: string;         // Legacy
  status?: string;            // Legacy
  images?: {                  // Legacy
    imageUrl?: string;
    headerImage?: string;
    openGraphImage?: string;
  };
}

// Search Token interface (for /api/tokens/search endpoint)
export interface SearchToken {
  id: number;
  address: string;
  symbol: string | null;
  name: string | null;
  image_url: string | null;
  header_image_url?: string | null;
  open_graph_image_url?: string | null;
  color?: string;
  decimals: number;
  description?: string | null;
  tags?: string[];
  total_supply?: number;
  priority_score?: number;
  degenduel_score?: string;
  first_seen_on_jupiter_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  price: number;
  change_24h: number;
  market_cap: number;
  fdv?: number;
  liquidity?: number;
  volume_24h: number;
  price_updated_at: string | null;
  priceChanges?: {
    h1: number;
    h6: number;
    m5: number;
    h24: number;
  };
  volumes?: {
    h1: number;
    h6: number;
    m5: number;
    h24: number;
  };
  transactions?: {
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    m5: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  pairCreatedAt?: string;
  socials?: {
    telegram?: string;
    twitter?: string;
    discord?: string;
    website?: string;
  };
  websites?: Array<{
    label: string;
    url: string;
  }>;
}

// Token search response
export interface TokenSearchResponse {
  tokens: SearchToken[];
}

// Token response metadata
export interface TokenResponseMetadata {
  timestamp: string;
  _cached?: boolean;
  _stale?: boolean;
  _cachedAt?: string;
}

// Enhanced API response structure (matches REST API documentation)
export interface EnhancedTokenApiResponse {
  success: boolean;
  data: Token[];
  metadata: {
    generated_at: string;
    total_returned: number;
    endpoint_type: "rest_api" | "websocket";
  };
}

// Helper functions to handle both backend formats
export const TokenHelpers = {
  // Get price (handles both string and number formats)
  getPrice(token: Token): number {
    if (typeof token.price === 'number') return token.price; // Trending format
    if (token.token_prices?.price) return parseFloat(token.token_prices.price); // Standard format
    return 0;
  },

  // Get price change (handles both string and number formats)
  getPriceChange(token: Token): number {
    if (typeof token.change_24h === 'number') return token.change_24h; // Trending format
    if (token.token_prices?.change_24h) return parseFloat(token.token_prices.change_24h); // Standard format
    return 0;
  },

  // Get market cap (handles both string and number formats)
  getMarketCap(token: Token): number {
    if (typeof token.market_cap === 'number') return token.market_cap || 0; // Trending format
    if (token.token_prices?.market_cap) return parseFloat(token.token_prices.market_cap); // Standard format
    return 0;
  },

  // Get volume (handles both string and number formats)
  getVolume(token: Token): number {
    if (typeof token.volume_24h === 'number') return token.volume_24h || 0; // Trending format
    if (token.token_prices?.volume_24h) return parseFloat(token.token_prices.volume_24h); // Standard format
    return 0;
  },

  // Get liquidity (handles both string and number formats)
  getLiquidity(token: Token): number {
    if (typeof token.liquidity === 'number') return token.liquidity || 0; // Trending format
    if (token.token_prices?.liquidity) return parseFloat(token.token_prices.liquidity); // Standard format
    return 0;
  },

  // Get FDV (handles both string and number formats)
  getFDV(token: Token): number {
    if (typeof token.fdv === 'number') return token.fdv || 0; // Trending format
    if (token.token_prices?.fdv) return parseFloat(token.token_prices.fdv); // Standard format
    return 0;
  },

  // Get multi-timeframe price changes (handles both nested and flattened)
  getPriceChanges(token: Token): { m5: number; h1: number; h6: number; h24: number } | null {
    // Trending format (flattened)
    if (token.priceChanges) return token.priceChanges;
    // Standard format (nested)
    if (token.refresh_metadata?.enhanced_market_data?.priceChanges) {
      return token.refresh_metadata.enhanced_market_data.priceChanges;
    }
    return null;
  },

  // Get multi-timeframe volumes (handles both nested and flattened)
  getVolumes(token: Token): { m5: number; h1: number; h6: number; h24: number } | null {
    if (token.volumes) return token.volumes; // Trending format
    if (token.refresh_metadata?.enhanced_market_data?.volumes) {
      return token.refresh_metadata.enhanced_market_data.volumes; // Standard format
    }
    return null;
  },

  // Get multi-timeframe transactions (handles both nested and flattened)
  getTransactions(token: Token): { m5: { buys: number; sells: number }; h1: { buys: number; sells: number }; h6: { buys: number; sells: number }; h24: { buys: number; sells: number } } | null {
    if (token.transactions) return token.transactions; // Trending format
    if (token.refresh_metadata?.enhanced_market_data?.transactions) {
      return token.refresh_metadata.enhanced_market_data.transactions; // Standard format
    }
    return null;
  },

  // Get social links (handles both array and object formats)
  getSocials(token: Token): Array<{ type: string; url: string }> {
    // Standard format (array)
    if (token.token_socials) {
      return token.token_socials.map(social => ({
        type: social.type,
        url: social.url
      }));
    }
    // Trending format (object)
    if (token.socials) {
      return Object.entries(token.socials).map(([type, url]) => ({
        type,
        url: url || ''
      }));
    }
    return [];
  },

  // Get contract address (handles both address and contractAddress)
  getAddress(token: Token): string {
    return token.address || token.contractAddress || '';
  },

  // Get image URL (handles both legacy and new formats)
  getImageUrl(token: Token): string | null {
    // Check for legacy images object
    if (token.images?.imageUrl) return token.images.imageUrl;
    if (token.images?.headerImage) return token.images.headerImage;
    if (token.images?.openGraphImage) return token.images.openGraphImage;

    // Check for direct fields
    if (token.image_url) return token.image_url;
    if (token.header_image_url) return token.header_image_url;

    return null;
  }
};

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
  totalPrizePool?: string; // Backend-calculated: prizePool + accumulated entry fees
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
