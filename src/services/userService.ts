import { API_URL } from "../config/config";

export interface UserStats {
  contests_entered: number;
  contests_won: number;
  total_prize_money: string;
  best_score: string;
  avg_score: string;
  last_updated: string;
}

export interface User {
  wallet_address: string;
  nickname: string;
  role: string;
  is_banned: boolean;
  ban_reason: string | null;
  balance: string;
  total_contests: number;
  total_wins: number;
  total_earnings: string;
  rank_score: number;
  created_at: string;
  last_login: string;
  user_stats: UserStats;
}

export interface UserLevel {
  current_level: {
    level_number: number;
    class_name: string;
    title: string;
    icon_url: string;
  };
  experience: {
    current: number;
    next_level_at: number;
    percentage: number;
  };
  achievements: {
    bronze: { current: number; required: number };
    silver: { current: number; required: number };
    gold: { current: number; required: number };
    platinum: { current: number; required: number };
    diamond: { current: number; required: number };
  };
}

class UserService {
  async searchUsers(query: string): Promise<User[]> {
    if (!query || query.length < 2) return [];

    try {
      const response = await fetch(
        `${API_URL}/users/search?search=${encodeURIComponent(query)}&limit=5`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Failed to search users: ${response.status}`
        );
      }

      const data = await response.json();
      return data.users;
    } catch (error) {
      console.error("Search users error:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to search users");
    }
  }
  
  async getUserLevel(walletAddress: string): Promise<UserLevel> {
    try {
      const response = await fetch(
        `${API_URL}/users/${walletAddress}/level`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Failed to fetch user level: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Get user level error:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to fetch user level");
    }
  }
}

export const userService = new UserService();
