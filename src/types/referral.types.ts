export enum ReferralStatus {
  pending = "pending",
  qualified = "qualified",
  rewarded = "rewarded",
  expired = "expired",
}

// Updated interfaces for new contest credit system
export interface ReferralStats {
  total_referrals: number;
  qualified_referrals: number;
  pending_referrals: number;
  contest_credits_earned: number;
  progress_to_next_credit: number;
  referrals_until_next_credit: number;
  recent_referrals: any[];
  recent_rewards: any[];
}

export interface ReferralCode {
  referral_code: string;
}

export interface ReferralHistoryItem {
  id: string;
  referred_user: string;
  referral_code: string;
  status: ReferralStatus;
  created_at: string;
  qualified_at?: string;
  entry_fee?: string;
}

export interface ReferralHistory {
  referrals: ReferralHistoryItem[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface ReferrerDetails {
  username: string;
  profile_image?: string;
  member_since: string;
  referral_stats: {
    total_referrals: number;
    qualified_referrals: number;
    contest_credits_earned: number;
  };
  referral_code: string;
}

export interface ApplyReferralRequest {
  referral_code: string;
  wallet_address: string;
}

export interface SignupTrackingRequest {
  inviteCode: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}
