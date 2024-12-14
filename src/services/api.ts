// src/services/api.ts

const API_URL = 'https://degenduel.me/api';

// Type definitions based on your API responses
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
}

interface Contest {
  id: string;
  name: string;
  difficulty: 'dolphin' | 'shark' | 'whale';
  entryFee: number;
  prizePool: number;
  startTime: string;
  endTime: string;
  participants: number;
  maxParticipants: number;
  status: 'open' | 'in_progress' | 'completed';
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
  },
};
