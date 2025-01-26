import { createApiClient } from "./utils";

export const stats = {
  getOverall: async (wallet: string) => {
    const api = createApiClient();
    const response = await api.fetch(`/stats/${wallet}`);
    return response.json();
  },

  getHistory: async (wallet: string, limit = 10, offset = 0) => {
    const api = createApiClient();
    const response = await api.fetch(
      `/stats/${wallet}/history?limit=${limit}&offset=${offset}`
    );
    return response.json();
  },

  getAchievements: async (wallet: string) => {
    const api = createApiClient();
    const response = await api.fetch(`/stats/${wallet}/achievements`);
    return response.json();
  },

  getPlatformStats: async () => {
    try {
      const api = createApiClient();
      const response = await api.fetch("/admin/stats/platform");
      return response.json();
    } catch (error) {
      console.error("Failed to fetch platform stats:", error);
      throw error;
    }
  },

  getRecentActivity: async () => {
    try {
      const api = createApiClient();
      const response = await api.fetch("/admin/stats/activity");
      return response.json();
    } catch (error) {
      console.error("Failed to fetch recent activity:", error);
      throw error;
    }
  },
};
