/**
 * Referral System Type Definitions
 * These interfaces define the contract between frontend and backend
 */

// Enum types matching database schema
export enum ReferralStatus {
  pending = "pending",
  qualified = "qualified",
  rewarded = "rewarded",
  expired = "expired",
}

export enum ReferralRewardType {
  signup_bonus = "signup_bonus",
  contest_bonus = "contest_bonus",
  special_event = "special_event",
}

// Common types
export interface UtmParams {
  source: string;
  medium: string;
  campaign: string;
  content?: string;
  term?: string;
}

// Response Types
export interface ReferralStats {
  total_referrals: number;
  qualified_referrals: number;
  pending_referrals: number;
  total_rewards: number;
  recent_referrals: RecentReferral[];
  recent_rewards: RecentReward[];
}

export interface RecentReferral {
  username: string;
  status: ReferralStatus; // Using enum instead of string union
  joined_at: string; // ISO date string
}

export interface RecentReward {
  type: ReferralRewardType; // Using enum instead of string union
  amount: number;
  date: string; // ISO date string
  description: string;
}

export interface ReferralCode {
  referral_code: string;
}

export interface LeaderboardStats {
  total_global_referrals: number;
  current_period: {
    start_date: string; // ISO date string
    end_date: string; // ISO date string
    days_remaining: number;
  };
  next_payout_date: string; // ISO date string
}

export interface LeaderboardEntry {
  username: string;
  referrals: number;
  lifetime_rewards: number;
  period_rewards: number;
  rank: number;
  trend: "up" | "down" | "stable";
}

export interface ReferralAnalytics {
  totals: {
    clicks: number;
    conversions: number;
    rewards_distributed: number;
  };
  clicks: {
    by_source: Record<string, number>;
    by_device: Record<string, number>;
    by_browser: Record<string, number>;
    by_campaign: Record<string, number>; // Added campaign tracking
  };
  conversions: {
    by_source: Record<string, number>;
    by_status: Record<ReferralStatus, number>; // Using enum for status
    by_campaign: Record<string, number>; // Added campaign tracking
  };
  rewards: {
    by_type: Record<ReferralRewardType, number>; // Using enum for reward type
  };
}

// Request Types
export interface ClickTrackingPayload {
  referralCode: string;
  sessionId: string;
  clickData: {
    source: string;
    device: string;
    browser: string;
    landingPage: string;
    utmParams?: UtmParams; // Using the new UtmParams interface instead of separate fields
    timestamp: string; // ISO date string
  };
}

export interface ConversionPayload {
  referralCode: string;
  sessionId: string;
  conversionData: {
    timeToConvert: number | null;
    completedSteps: string[];
    qualificationStatus: ReferralStatus.pending;
    convertedAt: string;
    originalClickData: any | null;
  };
}

// Generic API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}
