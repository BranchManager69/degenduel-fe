import { API_URL } from "../../config/config";
import { useStore } from "../../store/useStore";
import { Activity, Contest, PlatformStats } from "../../types";

export const admin = {
  getPlatformStats: async (): Promise<PlatformStats> => {
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

  getContests: async (): Promise<{ contests: Contest[] }> => {
    const response = await fetch(`${API_URL}/contests`);
    if (!response.ok) throw new Error("Failed to fetch contests");
    return response.json();
  },

  getRecentActivities: async (): Promise<{ activities: Activity[] }> => {
    const response = await fetch(`${API_URL}/admin/activities`);
    if (!response.ok) throw new Error("Failed to fetch activities");
    return response.json();
  },

  updateContest: async (
    contestId: string,
    data: Partial<Contest>
  ): Promise<Contest> => {
    try {
      const requestData = {
        url: `${API_URL}/contests/${contestId}`,
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Wallet-Address": useStore.getState().user?.wallet_address || "",
        },
        data,
      };

      console.log("Making update request:", requestData);

      // Add timeout to the fetch
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

      try {
        const response = await fetch(`${API_URL}/contests/${contestId}`, {
          method: "PUT",
          headers: requestData.headers,
          credentials: "include",
          body: JSON.stringify(data),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        const responseText = await response.text();
        console.log("Raw response text:", responseText);

        let parsedResponse;
        try {
          parsedResponse = responseText ? JSON.parse(responseText) : {};
        } catch (e) {
          console.error("Failed to parse response:", responseText);
          throw new Error("Invalid JSON response from server");
        }

        if (!response.ok) {
          throw new Error(
            parsedResponse.error ||
              parsedResponse.message ||
              `Server error: ${response.status} ${response.statusText}`
          );
        }

        return parsedResponse;
      } catch (fetchError: unknown) {
        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          throw new Error("Request timed out");
        }
        throw fetchError;
      }
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
    const response = await fetch(`${API_URL}/contests/${contestId}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete contest");
  },

  adjustUserBalance: async (
    walletAddress: string,
    amount: number
  ): Promise<void> => {
    try {
      const response = await fetch(
        `${API_URL}/users/${walletAddress}/balance`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ amount }),
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to adjust user balance");
      }
    } catch (error) {
      console.error("Failed to adjust user balance:", error);
      throw error;
    }
  },
};
