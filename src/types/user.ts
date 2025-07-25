// src/types/user.ts

/**
 * User Types
 * @description User interface and its associated types; used throughout the application for authentication, profiles, etc.
 * 
 * @author BranchManager69
 * @version 2.0.0
 * @created 2025-05-04
 * @updated 2025-05-05 - Updated for unified auth system
 */

/**
 * User interface
 * 
 * Represents a user in the DegenDuel system.
 * This interface is used throughout the application for authentication, profiles, etc.
 * 
 * @updated 2025-05-05 - Updated for unified auth system
 * @see For comparison with older version, see the User interface in src/types/index.ts
 */
// User Types
export interface User {
  // Core identity fields
  id: string;
  username: string;
  email?: string;
  role?: string;
  
  // Authentication-related fields
  wallet_address: string;   // Address of the user's connected wallet - REQUIRED for all users
  twitter_id?: string;      // Twitter ID for linked Twitter account (optional)
  discord_id?: string;      // Discord ID for linked Discord account (optional)
  telegram_id?: string;     // Telegram ID for linked Telegram account (optional)
  passkey_id?: string;      // Passkey ID for linked passkey (optional)
  privy_id?: string;        // Privy ID if using Privy wallet (optional)
  auth_method?: string;     // The primary auth method used ('wallet', 'privy', etc.)
  
  // Account status fields
  avatar_url?: string;
  profile_image_url?: string;  // Backend profile image URL (full URL or path like /images/profiles/default_pic_green.png)
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
  
  // Experience and level fields
  experience_points?: number;
  user_level?: {
    level_number: number;
    title: string;
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

/**
 * @deprecated Use the User interface from src/types/user.ts instead
 * This interface is maintained for backward compatibility. The new User interface
 * in user.ts includes all these fields plus additional fields for the unified auth system.
 * 
 * @see src/types/user.ts for the unified User interface
*/
// Legacy User Types (DEPRECATED)
export interface LegacyUser {
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
