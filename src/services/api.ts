// src/services/api.ts
import { Token } from '../types';
import { Contest } from '../types';

export const API_URL = 'https://degenduel.me/api';

/* Types */

interface User {
  wallet_address: string;
  nickname: string;
  created_at?: string;
  last_login?: string;
  total_contests?: number;
  total_wins?: number;
  total_earnings?: string;
  rank_score?: number;
  settings?: Record<string, any>;
  // New fields
  balance: number;
  is_banned: boolean;
  ban_reason?: string;
  last_deposit_at?: string;
  last_withdrawal_at?: string;
  kyc_status?: string;
  risk_level: number;
  is_admin?: boolean;
}

interface PlatformStats {
  totalUsers: number;
  activeContests: number;
  totalVolume: number;
  dailyActiveUsers: number;
  userGrowth: number;
  volumeGrowth: number;
}

interface Activity {
  id: string;
  type: 'contest_join' | 'contest_complete' | 'user_register';
  timestamp: string;
  details: string;
}

interface Transaction {
  id: number;
  wallet_address: string;
  type: 'CONTEST_ENTRY' | 'PRIZE_PAYOUT' | 'DEPOSIT' | 'WITHDRAWAL' | 'REFERRAL_BONUS' | 'PROMOTION';
  amount: number;
  balance_before: number;
  balance_after: number;
  contest_id?: number;
  description?: string;
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  metadata: Record<string, any>;
  created_at: string;
  processed_at?: string;
}

interface TokenBucket {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  tokens: Token[];
}

interface ContestPortfolio {
  contest_id: number;
  wallet_address: string;
  token_id: number;
  weight: number;
  created_at: string;
}

/* Implemented API endpoints: */

export const api = {
  // User endpoints
  users: {
    getAll: async (): Promise<User[]> => {
      const response = await fetch(`${API_URL}/users`);
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },

    getOne: async (wallet: string): Promise<User> => {
      const response = await fetch(`${API_URL}/users/${wallet}`);
      if (!response.ok) throw new Error('User not found');
      return response.json();
    },

    update: async (wallet: string, nickname: string): Promise<void> => {
      const response = await fetch(`${API_URL}/users/${wallet}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname }),
      });
      if (!response.ok) throw new Error('Failed to update user');
    },

    updateSettings: async (wallet: string, settings: Record<string, any>): Promise<void> => {
      const response = await fetch(`${API_URL}/users/${wallet}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      if (!response.ok) throw new Error('Failed to update settings');
    }
  },

  // Token endpoints
  tokens: {
    getAll: async (): Promise<Token[]> => {
      const response = await fetch(`${API_URL}/tokens`);
      if (!response.ok) throw new Error('Failed to fetch tokens');
      return response.json();
    }
  },

  // Stats endpoints
  stats: {
    getOverall: async (wallet: string) => {
      const response = await fetch(`${API_URL}/stats/${wallet}`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },

    getHistory: async (wallet: string, limit = 10, offset = 0) => {
      const response = await fetch(`${API_URL}/stats/${wallet}/history?limit=${limit}&offset=${offset}`);
      if (!response.ok) throw new Error('Failed to fetch history');
      return response.json();
    },

    getAchievements: async (wallet: string) => {
      const response = await fetch(`${API_URL}/stats/${wallet}/achievements`);
      if (!response.ok) throw new Error('Failed to fetch achievements');
      return response.json();
    }
  },

  // Admin endpoints
  admin: {
    // Get platform stats
    getPlatformStats: async (): Promise<PlatformStats> => {
      const response = await fetch(`${API_URL}/stats/platform`);
      if (!response.ok) throw new Error('Failed to fetch platform stats');
      return response.json();
    },

    // Get active contests
    getContests: async (): Promise<Contest[]> => {
      const response = await fetch(`${API_URL}/contests/active`);
      if (!response.ok) throw new Error('Failed to fetch contests');
      return response.json();
    },

    // Get recent activities
    getRecentActivities: async (): Promise<Activity[]> => {
      const response = await fetch(`${API_URL}/admin/activities`);
      if (!response.ok) throw new Error('Failed to fetch activities');
      return response.json();
    },

    // Contest management
    updateContest: async (contestId: string, data: Partial<Contest>): Promise<void> => {
      const response = await fetch(`${API_URL}/contests/${contestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update contest');
    },

    deleteContest: async (contestId: string): Promise<void> => {
      const response = await fetch(`${API_URL}/contests/${contestId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete contest');
    },
  },

  // Contest endpoints
  contests: {
    getActive: async (): Promise<Contest[]> => {
      const response = await fetch(`${API_URL}/contests/active`);
      if (!response.ok) throw new Error('Failed to fetch active contests');
      return response.json();
    },
    
    getById: async (contestId: string): Promise<Contest> => {
      const response = await fetch(`${API_URL}/contests/${contestId}`);
      if (!response.ok) throw new Error('Failed to fetch contest');
      return response.json();
    },

    submitPortfolio: async (contestId: string, portfolio: Array<{ symbol: string; weight: number }>) => {
      const response = await fetch(`${API_URL}/contests/${contestId}/portfolio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ portfolio }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit portfolio');
      }

      return response.json();
    },
  },

  // Balance endpoints
  balance: {
    get: async (): Promise<number> => {
      const response = await fetch(`${API_URL}/balance`);
      if (!response.ok) throw new Error('Failed to fetch balance');
      return response.json();
    },
  },

  // Transaction endpoints
  transactions: {
    getHistory: async (): Promise<Transaction[]> => {
      const response = await fetch(`${API_URL}/transactions`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
  },

  // Token bucket endpoints
  buckets: {
    getAll: async (): Promise<TokenBucket[]> => {
      const response = await fetch(`${API_URL}/buckets`);
      if (!response.ok) throw new Error('Failed to fetch buckets');
      return response.json();
    },

    getTokens: async (bucketId: number): Promise<Token[]> => {
      const response = await fetch(`${API_URL}/buckets/${bucketId}/tokens`);
      if (!response.ok) throw new Error('Failed to fetch bucket tokens');
      return response.json();
    },
  },

  // Portfolio endpoints  
  portfolio: {
    get: async (contestId: number): Promise<ContestPortfolio> => {
      const response = await fetch(`${API_URL}/contests/${contestId}/portfolio`);
      if (!response.ok) throw new Error('Failed to fetch portfolio');
      return response.json();
    },

    update: async (contestId: number, weights: Record<number, number>): Promise<void> => {
      const response = await fetch(`${API_URL}/contests/${contestId}/portfolio`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weights }),
      });
      if (!response.ok) throw new Error('Failed to update portfolio weights');
    },
  },

};
