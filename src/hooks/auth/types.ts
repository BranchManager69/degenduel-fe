// src/hooks/auth/types.ts
// Auth-related types shared across auth hooks

// Basic user type 
export interface User {
  id: string;
  username?: string;
  nickname?: string; // Added for tests
  wallet_address: string; // Required field per our update
  twitter_id?: string;
  privy_id?: string;
  auth_method?: string;
  profile_image?: string;
  is_admin?: boolean;
  is_super_admin?: boolean;
  created_at?: string;
  updated_at?: string;
  degen_level?: number;
  exp?: number;
  achievement_count?: number;
  has_email?: boolean;
  has_wallet?: boolean;
  role?: string; // Added for legacy mock
  last_login?: string; // Added for tests
  total_contests?: number; // Added for tests
  total_wins?: number; // Added for tests
  total_earnings?: string; // Added for tests
  rank_score?: number; // Added for tests
  settings?: Record<string, any>; // Added for tests
  balance?: string; // Added for tests
  is_banned?: boolean; // Added for tests
  ban_reason?: string | null; // Added for tests
  risk_level?: string; // Added for tests
  jwt?: string; // Added for tests
}

// Auth state interface
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
}

// Migrated auth types
export interface MigratedAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export interface MigratedAuthUser extends User {
  // Additional properties specific to migrated auth
}