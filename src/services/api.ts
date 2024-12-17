// src/services/api.ts
import { Token } from '../types';
import { Contest } from '../types';
import { useStore } from '../store/useStore';

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

interface PortfolioResponse {
  tokens: Array<{
    symbol: string;
    weight: number;
  }>;
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
      const response = await fetch('/api/tokens', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch tokens');
      }

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
    getActive: async () => {
      const response = await fetch('/api/contests/active');
      if (!response.ok) throw new Error('Failed to fetch active contests');
      return response.json();
    },

    getById: async (contestId: string) => {
      const response = await fetch(`/api/contests/${contestId}`);
      if (!response.ok) throw new Error('Failed to fetch contest');
      return response.json();
    },

    enterContest: async (contestId: string | number, portfolio: Array<{ symbol: string, weight: number }>) => {
      const user = useStore.getState().user;
      
      if (!user?.wallet_address) {
        throw new Error('Please connect your wallet first');
      }

      const payload = {
        wallet: user.wallet_address,
        portfolio: portfolio
      };

      console.log('API enterContest - Sending payload:', payload);

      try {
        const response = await fetch(`/api/contests/${contestId}/enter`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
          // Handle specific error cases
          switch (data.error?.code) {
            case 'ALREADY_REGISTERED':
              throw new Error('You have already entered this contest');
            case 'CONTEST_STARTED':
              throw new Error('This contest has already started');
            case 'INSUFFICIENT_FUNDS':
              throw new Error('Insufficient funds for contest entry');
            case 'CONTEST_FULL':
              throw new Error('Contest is full');
            default:
              throw new Error(data.error?.message || 'Failed to enter contest');
          }
        }

        return data;
      } catch (error: any) {
        console.error('API error:', error);
        // If it's our error with a message, use it, otherwise show generic error
        throw new Error(error.message || 'Failed to enter contest. Please try again.');
      }
    },

    updatePortfolio: async (contestId: string | number, portfolio: Array<{ symbol: string, weight: number }>) => {
      const user = useStore.getState().user;
      
      if (!user?.wallet_address) {
        throw new Error('Wallet address is required');
      }

      // Match the swagger spec for update portfolio - only send portfolio
      const payload = {
        portfolio: portfolio
      };

      console.log('API updatePortfolio - Sending payload:', payload);

      const response = await fetch(`/api/contests/${contestId}/portfolio`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload), // Only send portfolio for updates
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        throw new Error(errorData?.message || 'Failed to update portfolio');
      }

      return response.json();
    }
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
    get: async (contestId: number): Promise<PortfolioResponse> => {
      const user = useStore.getState().user;
      
      if (!user?.wallet_address) {
        throw new Error('Wallet address is required');
      }

      const response = await fetch(`/api/contests/${contestId}/portfolio`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.status === 404) {
        // No existing portfolio is fine, return empty result
        return { tokens: [] };
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch portfolio');
      }

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
