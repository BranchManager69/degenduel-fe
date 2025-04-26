// src/types/admin.ts

import {
  BaseActivity,
  PlatformStats as BasePlatformStats,
  Contest,
  PaginatedResponse,
} from ".";

export type PlatformStats = BasePlatformStats;
export type Activity = BaseActivity;

export interface ContestsResponse extends PaginatedResponse<Contest> {
  contests: Contest[];
}

export interface ActivitiesResponse extends PaginatedResponse<Activity> {
  activities: Activity[];
}

export interface AdminActivity {
  id: number;
  action: string;
  admin_address?: string;
  details?: Record<string, any>;
  created_at: string;
  ip_address?: string;
}

export interface AdminActivitiesResponse {
  activities: AdminActivity[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface AdminActivityFilters {
  limit?: number;
  offset?: number;
  action?: string;
}

// Vanity wallet types
export interface VanityWallet {
  id: number;
  pattern: string;
  is_suffix: boolean;
  case_sensitive: boolean;
  status: VanityWalletStatus;
  wallet_address: string | null;
  private_key: string | null;
  created_at: string;
  completed_at: string | null;
}

export type VanityWalletStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface VanityWalletListParams {
  status?: VanityWalletStatus;
  isUsed?: boolean;
  pattern?: string;
  limit?: number;
  offset?: number;
}

export interface VanityWalletCreateParams {
  pattern: string;
  isSuffix: boolean;
  caseSensitive: boolean;
}

export interface VanityWalletBatchCreateParams {
  patterns: string[];
  isSuffix: boolean;
  caseSensitive: boolean;
}

export interface VanityWalletListResponse {
  wallets: VanityWallet[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface VanityWalletCreateResponse {
  status: string;
  message: string;
  requestId: number;
  pattern: string;
  isSuffix: boolean;
  caseSensitive: boolean;
  createdAt: string;
}

export interface VanityWalletBatchCreateResponse {
  status: string;
  message: string;
  results: {
    status: string;
    pattern: string;
    requestId: number;
  }[];
}

export interface VanityWalletCancelResponse {
  status: string;
  message: string;
  walletId: number;
  pattern: string;
}
