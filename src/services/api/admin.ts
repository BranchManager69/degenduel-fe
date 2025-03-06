import { Activity, Contest, PlatformStats } from "../../types/index";
import { createApiClient } from "./utils";

export const admin = {
  getSystemSettings: async (): Promise<any> => {
    try {
      const api = createApiClient();
      const response = await api.fetch("/admin/system-settings");
      return response.json();
    } catch (error) {
      console.error("Failed to fetch system settings:", error);
      throw error;
    }
  },
  
  updateSystemSettings: async (key: string, value: any): Promise<any> => {
    try {
      const api = createApiClient();
      const response = await api.fetch("/admin/system-settings", {
        method: "POST",
        body: JSON.stringify({ key, value }),
      });
      return response.json();
    } catch (error) {
      console.error(`Failed to update system setting "${key}":`, error);
      throw error;
    }
  },
  
  getPlatformStats: async (): Promise<PlatformStats> => {
    try {
      const api = createApiClient();
      const response = await api.fetch("/admin/stats/platform");
      return response.json();
    } catch (error) {
      console.error("Failed to fetch platform stats:", error);
      throw error;
    }
  },

  getContests: async (): Promise<{ contests: Contest[] }> => {
    const api = createApiClient();
    const response = await api.fetch("/contests");
    return response.json();
  },

  getRecentActivities: async (): Promise<{ activities: Activity[] }> => {
    const api = createApiClient();
    const response = await api.fetch("/admin/activities");
    return response.json();
  },

  updateContest: async (
    contestId: string,
    data: Partial<Contest>
  ): Promise<Contest> => {
    try {
      const api = createApiClient();
      const response = await api.fetch(`/contests/${contestId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return response.json();
    } catch (error) {
      console.error("Contest update error:", {
        error,
        contestId,
        data,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  },

  deleteContest: async (contestId: string): Promise<void> => {
    const api = createApiClient();
    await api.fetch(`/contests/${contestId}`, {
      method: "DELETE",
    });
  },

  adjustUserBalance: async (
    walletAddress: string,
    amount: number
  ): Promise<void> => {
    try {
      const api = createApiClient();
      await api.fetch(`/users/${walletAddress}/balance`, {
        method: "POST",
        body: JSON.stringify({ amount }),
      });
    } catch (error) {
      console.error("Failed to adjust user balance:", error);
      throw error;
    }
  },

  getActivities: async (limit: number = 10, offset: number = 0) => {
    const api = createApiClient();
    const response = await api.fetch(
      `/admin/activities?limit=${limit}&offset=${offset}`
    );
    return response.json();
  },
};
