// src/services/dd-api.ts
import { API_URL } from "../config/config";
import { useStore } from "../store/useStore";
import {
  Activity,
  Contest,
  PlatformStats,
  //Portfolio,
  PortfolioResponse,
  Token,
  Transaction,
  User,
} from "../types";

/* DegenDuel API Endpoints (client-side) */

export const ddApi = {
  // User endpoints
  users: {
    getAll: async (): Promise<User[]> => {
      const response = await fetch(`${API_URL}/users`);
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },

    getOne: async (wallet: string): Promise<User> => {
      const response = await fetch(`${API_URL}/users/${wallet}`);
      if (!response.ok) throw new Error("User not found");
      return response.json();
    },

    update: async (wallet: string, nickname: string): Promise<void> => {
      const response = await fetch(`${API_URL}/users/${wallet}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname }),
      });
      if (!response.ok) throw new Error("Failed to update user");
    },

    updateSettings: async (
      wallet: string,
      settings: Record<string, any>
    ): Promise<void> => {
      const response = await fetch(`${API_URL}/users/${wallet}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      if (!response.ok) throw new Error("Failed to update settings");
    },
  },

  // Token endpoints
  tokens: {
    getAll: async (): Promise<Token[]> => {
      const response = await fetch(`${API_URL}/dd-serv/tokens`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch tokens");
      }

      const responseData = await response.json();
      return responseData.data || responseData;
    },
  },

  // Stats endpoints
  stats: {
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
  },

  // Admin endpoints
  admin: {
    getPlatformStats: async (): Promise<PlatformStats> => {
      const response = await fetch(`${API_URL}/stats/platform`);
      if (!response.ok) throw new Error("Failed to fetch platform stats");
      return response.json();
    },

    getContests: async (): Promise<Contest[]> => {
      const response = await fetch(`${API_URL}/contests/active`);
      if (!response.ok) throw new Error("Failed to fetch contests");
      return response.json();
    },

    getRecentActivities: async (): Promise<Activity[]> => {
      const response = await fetch(`${API_URL}/admin/activities`);
      if (!response.ok) throw new Error("Failed to fetch activities");
      return response.json();
    },

    updateContest: async (
      contestId: string,
      data: Partial<Contest>
    ): Promise<void> => {
      const response = await fetch(`${API_URL}/contests/${contestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update contest");
    },

    deleteContest: async (contestId: string): Promise<void> => {
      const response = await fetch(`${API_URL}/contests/${contestId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete contest");
    },
  },

  // Contest endpoints
  contests: {
    getActive: async (): Promise<Contest[]> => {
      // ??
      const user = useStore.getState().user;

      const response = await fetch(`${API_URL}/contests/active`, {
        headers: {
          "Content-Type": "application/json",
          "X-Wallet-Address": user?.wallet_address || "",
          "Cache-Control": "no-cache",
        },
        credentials: "include", // ??
      });
      if (!response.ok) throw new Error("Failed to fetch active contests");
      return response.json();
    },

    getAll: async (): Promise<Contest[]> => {
      // ??
      const user = useStore.getState().user;

      const response = await fetch(`${API_URL}/contests`, {
        headers: {
          "Content-Type": "application/json",
          "X-Wallet-Address": user?.wallet_address || "",
          "Cache-Control": "no-cache",
        },
        credentials: "include", // ??
      });
      if (!response.ok) throw new Error("Failed to fetch any contests");
      return response.json();
    },

    getById: async (contestId: string) => {
      const user = useStore.getState().user;

      console.log("[debug getById] contestId:", contestId);
      const response = await fetch(`${API_URL}/contests/${contestId}`, {
        headers: {
          "Content-Type": "application/json",
          "X-Wallet-Address": user?.wallet_address || "",
          "Cache-Control": "no-cache",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch contest");
      }

      const data = await response.json();
      console.log("Contest API response:", data);
      return data;
    },

    enterContest: async (
      contestId: string | number,
      portfolio: Array<{ symbol: string; weight: number }>
    ) => {
      const user = useStore.getState().user;
      console.log("[enterContest] Starting with:", {
        contestId,
        portfolio,
        user,
      });

      if (!user?.wallet_address) {
        throw new Error("Please connect your wallet first");
      }

      const payload = {
        wallet: user.wallet_address,
        portfolio: portfolio,
      };

      try {
        console.log(
          "[enterContest] Sending request to:",
          `${API_URL}/contests/${contestId}/join`
        );
        console.log("[enterContest] With payload:", payload);

        const response = await fetch(`${API_URL}/contests/${contestId}/join`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Wallet-Address": user.wallet_address,
          },
          body: JSON.stringify(payload),
          credentials: "include",
        });

        console.log("[enterContest] Response status:", response.status);
        const data = await response.json();
        console.log("[enterContest] Response data:", data);

        if (response.status === 401) {
          throw new Error("Please connect your wallet and try again");
        }

        if (!response.ok) {
          switch (data.error?.code) {
            case "ALREADY_REGISTERED":
              throw new Error("You have already entered this contest");
            case "CONTEST_STARTED":
              throw new Error("This contest has already started");
            case "INSUFFICIENT_FUNDS":
              throw new Error("Insufficient funds for contest entry");
            case "CONTEST_FULL":
              throw new Error("Contest is full");
            default:
              throw new Error(data.error?.message || "Failed to enter contest");
          }
        }

        return data;
      } catch (error: any) {
        console.error("[enterContest] Error:", error);
        throw error;
      }
    },

    updatePortfolio: async (
      contestId: string | number,
      portfolio: Array<{ symbol: string; weight: number }>
    ) => {
      const user = useStore.getState().user;
      console.log("[updatePortfolio] Starting with:", {
        contestId,
        portfolio,
        user,
      });

      if (!user?.wallet_address) {
        throw new Error("Please connect your wallet first");
      }

      const payload = { portfolio };

      try {
        console.log(
          "[updatePortfolio] Sending request to:",
          `${API_URL}/contests/${contestId}/portfolio`
        );
        console.log("[updatePortfolio] With payload:", payload);

        const response = await fetch(
          `${API_URL}/contests/${contestId}/portfolio`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "X-Wallet-Address": user.wallet_address,
            },
            body: JSON.stringify(payload),
            credentials: "include",
          }
        );

        console.log("[updatePortfolio] Response status:", response.status);
        const data = await response.json();
        console.log("[updatePortfolio] Response data:", data);

        if (response.status === 401) {
          throw new Error("Please connect your wallet and try again");
        }

        if (!response.ok) {
          throw new Error(data.message || "Failed to update portfolio");
        }

        return data;
      } catch (error: any) {
        console.error("[updatePortfolio] Error:", error);
        throw error;
      }
    },
  },

  // Portfolio endpoints
  portfolio: {
    get: async (contestId: number): Promise<PortfolioResponse> => {
      const user = useStore.getState().user;

      if (!user?.wallet_address) {
        throw new Error("Wallet address is required");
      }

      const response = await fetch(
        `${API_URL}/contests/${contestId}/portfolio/${user.wallet_address}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (response.status === 401) {
        console.error("Authentication failed when fetching portfolio");
        throw new Error("Please connect your wallet to view your portfolio");
      }

      if (response.status === 404) {
        return { tokens: [] };
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch portfolio");
      }

      return response.json();
    },
  },

  // Balance endpoints
  balance: {
    get: async (): Promise<number> => {
      const response = await fetch(`${API_URL}/balance`);
      if (!response.ok) throw new Error("Failed to fetch balance");
      return response.json();
    },
  },

  // Transaction endpoints
  transactions: {
    getHistory: async (): Promise<Transaction[]> => {
      const response = await fetch(`${API_URL}/transactions`);
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return response.json();
    },
  },
};
