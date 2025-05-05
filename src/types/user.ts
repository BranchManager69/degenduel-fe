/**
 * User interface
 * 
 * Represents a user in the DegenDuel system.
 * This interface is used throughout the application for authentication, profiles, etc.
 * 
 * @updated 2025-05-05 - Updated for unified auth system
 * @see For comparison with older version, see the User interface in src/types/index.ts
 */
export interface User {
  // Core identity fields
  id: string;
  username: string;
  email?: string;
  role?: string;
  
  // Authentication-related fields
  wallet_address: string;   // Address of the user's connected wallet - REQUIRED for all users
  twitter_id?: string;      // Twitter ID for linked Twitter account (optional)
  privy_id?: string;        // Privy ID if using Privy wallet (optional)
  auth_method?: string;     // The primary auth method used ('wallet', 'privy', etc.)
  
  // Account status fields
  avatar_url?: string;
  is_admin?: boolean;
  is_superadmin?: boolean;
  banned?: boolean;
  banned_reason?: string;
  
  // Auth tokens (typically present in auth context, not stored but included for type safety)
  jwt?: string;             // JWT token for API authentication
  wsToken?: string;         // WebSocket token for WebSocket authentication
  session_token?: string;   // Session token for maintaining session
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
  createdAt?: string;       // Alternative naming format
  updatedAt?: string;       // Alternative naming format
  
  // Profile fields
  display_name?: string;
  bio?: string;
  twitter_handle?: string;
  website?: string;
  social_links?: {
    twitter?: string;
    discord?: string;
    telegram?: string;
    instagram?: string;
    github?: string;
    website?: string;
  };
  
  // Stats
  stats?: {
    total_contests?: number;
    contests_won?: number;
    win_rate?: number;
    total_winnings?: number;
    degen_level?: number;
    degen_points?: number;
  };
  
  // Settings
  settings?: {
    email_notifications?: boolean;
    push_notifications?: boolean;
    theme?: string;
    hidden_stats?: string[];
  };
  
  // Legacy fields for compatibility with index.ts User interface
  nickname?: string;
  last_login?: string;
  total_contests?: number;
  total_wins?: number;
  total_earnings?: string;
  rank_score?: number;
  balance?: string;
  is_banned?: boolean;
  ban_reason?: string;
  last_deposit_at?: string;
  last_withdrawal_at?: string;
  kyc_status?: string;
  risk_level?: string;
  profile_image?: {
    url: string;
    thumbnail_url?: string;
    updated_at?: string;
  };
}
