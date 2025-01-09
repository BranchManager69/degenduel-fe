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

const logError = (
  endpoint: string,
  error: any,
  context?: Record<string, any>
) => {
  console.error(`[DD-API Error] ${endpoint}:`, {
    message: error.message,
    status: error.status,
    statusText: error.statusText,
    context,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });
};

/* DegenDuel API Endpoints (client-side) */

export const ddApi = {
  // User endpoints
  users: {
    getAll: async (): Promise<User[]> => {
      try {
        const response = await fetch(`${API_URL}/users`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `Failed to fetch users: ${response.statusText}`
          );
        }
        return response.json();
      } catch (error: any) {
        logError("users.getAll", error);
        throw error;
      }
    },

    getOne: async (wallet: string): Promise<User> => {
      try {
        const response = await fetch(`${API_URL}/users/${wallet}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `User not found: ${response.statusText}`
          );
        }
        return response.json();
      } catch (error: any) {
        logError("users.getOne", error, { wallet });
        throw error;
      }
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
      try {
        const response = await fetch(`${API_URL}/users/${wallet}/settings`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ settings }),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `Failed to update settings: ${response.statusText}`
          );
        }
      } catch (error: any) {
        logError("users.updateSettings", error, { wallet, settings });
        throw error;
      }
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
      ////const response = await fetch(`${API_URL}/contests/active`);
      const response = await fetch(`${API_URL}/contests`);
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

      ////const response = await fetch(`${API_URL}/contests/active`, {
      const response = await fetch(`${API_URL}/contests`, {
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

      try {
        if (!user?.wallet_address) {
          throw new Error("Please connect your wallet first");
        }

        // Validate portfolio before sending
        const totalWeight = portfolio.reduce(
          (sum, item) => sum + item.weight,
          0
        );
        if (Math.abs(totalWeight - 100) > 0.01) {
          throw new Error("Portfolio weights must sum to 100%");
        }

        const payload = {
          wallet: user.wallet_address,
          portfolio: portfolio,
        };

        console.log("[enterContest] Sending request:", {
          url: `${API_URL}/contests/${contestId}/join`,
          payload,
          timestamp: new Date().toISOString(),
        });

        const response = await fetch(`${API_URL}/contests/${contestId}/join`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Wallet-Address": user.wallet_address,
          },
          body: JSON.stringify(payload),
          credentials: "include",
        });

        // Always try to get the response data, even if the request failed
        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          console.error("[enterContest] Failed to parse response:", {
            parseError,
            responseText: await response
              .text()
              .catch(() => "Unable to get response text"),
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
          });
          data = null;
        }

        if (!response.ok) {
          const errorDetails = {
            endpoint: "enterContest",
            status: response.status,
            statusText: response.statusText,
            responseData: data,
            requestPayload: payload,
            contestId,
            userWallet: user.wallet_address,
            portfolioSize: portfolio.length,
            timestamp: new Date().toISOString(),
            headers: Object.fromEntries(response.headers.entries()),
          };

          console.error("[enterContest] Request failed:", errorDetails);

          // Handle specific error cases
          if (response.status === 500) {
            throw new Error(
              "Server encountered an error. Please verify your portfolio meets all requirements:" +
                "\n- All weights must be between 0 and 100" +
                "\n- Total weight must equal 100%" +
                "\n- All tokens must be from the allowed list" +
                "\n\nIf the issue persists, please contact support."
            );
          }

          const error = new Error(
            data?.error?.message ||
              data?.message ||
              `Failed to enter contest (${response.status}: ${response.statusText})`
          );

          Object.assign(error, errorDetails);
          throw error;
        }

        console.log("[enterContest] Success:", {
          contestId,
          response: data,
          timestamp: new Date().toISOString(),
        });

        return data;
      } catch (error: any) {
        // Enhanced error logging with more context
        logError("contests.enterContest", error, {
          contestId,
          portfolio,
          userWallet: user?.wallet_address,
          timestamp: new Date().toISOString(),
          requestInfo: {
            url: `${API_URL}/contests/${contestId}/join`,
            method: "POST",
          },
          errorDetails: {
            name: error.name,
            code: error.code,
            status: error.status,
            statusText: error.statusText,
            responseData: error.responseData,
            portfolioValidation: {
              totalWeight: portfolio.reduce(
                (sum, item) => sum + item.weight,
                0
              ),
              tokenCount: portfolio.length,
              hasZeroWeights: portfolio.some((item) => item.weight === 0),
              hasNegativeWeights: portfolio.some((item) => item.weight < 0),
            },
          },
        });

        // Rethrow with more specific error message
        throw error;
      }
    },

    updatePortfolio: async (
      contestId: string | number,
      portfolio: Array<{ symbol: string; weight: number }>
    ) => {
      const user = useStore.getState().user;

      try {
        if (!user?.wallet_address) {
          throw new Error("Please connect your wallet first");
        }

        const payload = { portfolio };

        console.log("[updatePortfolio] Initiating request:", {
          contestId,
          portfolio,
          userWallet: user.wallet_address,
          timestamp: new Date().toISOString(),
        });

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

        const data = await response.json();

        if (!response.ok) {
          const error = new Error(data.message || "Failed to update portfolio");
          Object.assign(error, {
            status: response.status,
            responseData: data,
          });
          throw error;
        }

        console.log("[updatePortfolio] Success:", {
          contestId,
          response: data,
          timestamp: new Date().toISOString(),
        });

        return data;
      } catch (error: any) {
        logError("contests.updatePortfolio", error, {
          contestId,
          portfolio,
          userWallet: user?.wallet_address,
          timestamp: new Date().toISOString(),
        });
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
