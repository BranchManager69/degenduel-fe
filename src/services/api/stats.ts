import { API_URL } from "../../config/config";

export const stats = {
  getOverall: async (wallet: string) => {
    const response = await fetch(`${API_URL}/stats/${wallet}`);
    if (!response.ok) throw new Error("Failed to fetch stats");
    return response.json();
  },

  getHistory: async (wallet: string, limit = 10, offset = 0) => {
    const response = await fetch(
      `${API_URL}/stats/${wallet}/history?limit=${limit}&offset=${offset}`
    );
    if (!response.ok) throw new Error("Failed to fetch history");
    return response.json();
  },

  getAchievements: async (wallet: string) => {
    const response = await fetch(`${API_URL}/stats/${wallet}/achievements`);
    if (!response.ok) throw new Error("Failed to fetch achievements");
    return response.json();
  },

  getPlatformStats: async () => {
    try {
      const response = await fetch(`${API_URL}/admin/stats/platform`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch platform stats");
      }

      return response.json();
    } catch (error) {
      console.error("Failed to fetch platform stats:", error);
      throw error;
    }
  },

  getRecentActivity: async () => {
    try {
      const response = await fetch(`${API_URL}/admin/stats/activity`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch recent activity");
      }

      return response.json();
    } catch (error) {
      console.error("Failed to fetch recent activity:", error);
      throw error;
    }
  },
};
