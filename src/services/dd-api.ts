// src/services/dd-api.ts
import { API_URL } from "../config/config";
import { useStore } from "../store/useStore";
import {
  BaseActivity as Activity,
  Contest,
  PlatformStats,
  //Portfolio,
  PortfolioResponse,
  Token,
  Transaction,
  User,
} from "../types";
import type { SortOptions } from "../types/sort";

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

// doesnt work
const addParticipationFlag = (
  contest: Contest,
  userWallet?: string
): Contest => {
  if (!userWallet) return { ...contest, is_participating: false };

  return {
    ...contest,
    is_participating:
      contest.participants?.some(
        (p) => p.address?.toLowerCase() === userWallet.toLowerCase()
      ) || false,
  };
};

// doesnt work
const checkContestParticipation = async (
  contestId: number | string,
  userWallet?: string
): Promise<boolean> => {
  if (!userWallet) return false;

  try {
    const response = await fetch(
      `${API_URL}/contests/${contestId}/portfolio/${userWallet}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Wallet-Address": userWallet,
        },
        credentials: "include",
      }
    );

    // If we get a 404, user is not participating
    if (response.status === 404) return false;

    // If we get a 200, user is participating
    if (response.ok) {
      const data = await response.json();
      // Check if the portfolio exists and has tokens
      return !!(data && data.tokens && data.tokens.length > 0);
    }

    return false;
  } catch (error) {
    console.error("Error checking participation:", error);
    return false;
  }
};

// Add this helper function to dd-api.ts or a separate utils file
export const formatBonusPoints = (points: string | number): string => {
  const amount = typeof points === "string" ? parseInt(points) : points;
  return `${amount.toLocaleString()} pts`;
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
        const data = await response.json();
        // Ensure we return an array
        return Array.isArray(data) ? data : data.users || [];
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
      const response = await fetch(
        `${API_URL}/admin/users/${walletAddress}/balance`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ amount }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to adjust user balance");
      }
    },
  },

  // Contest endpoints
  contests: {
    getActive: async (): Promise<Contest[]> => {
      const user = useStore.getState().user;

      const response = await fetch(`${API_URL}/contests`, {
        headers: {
          "Content-Type": "application/json",
          "X-Wallet-Address": user?.wallet_address || "",
          "Cache-Control": "no-cache",
        },
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch active contests");

      const data = await response.json();
      const contests: Contest[] = Array.isArray(data)
        ? data
        : data.contests || [];

      return contests.map((contest: Contest) =>
        addParticipationFlag(contest, user?.wallet_address)
      );
    },

    getAll: async (sortOptions?: SortOptions): Promise<Contest[]> => {
      const user = useStore.getState().user;

      try {
        const response = await fetch(`${API_URL}/contests`, {
          headers: {
            "Content-Type": "application/json",
            "X-Wallet-Address": user?.wallet_address || "",
            "Cache-Control": "no-cache",
          },
          credentials: "include",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to fetch contests");
        }

        const data = await response.json();
        let contests: Contest[] = Array.isArray(data)
          ? data
          : data.contests || [];

        // Apply sorting if options are provided
        if (sortOptions) {
          contests.sort((a, b) => {
            let aValue = a[sortOptions.field];
            let bValue = b[sortOptions.field];

            // Convert string numbers to actual numbers for comparison
            if (typeof aValue === "string" && !isNaN(Number(aValue))) {
              aValue = Number(aValue);
              bValue = Number(bValue);
            }

            if (sortOptions.direction === "asc") {
              return aValue > bValue ? 1 : -1;
            } else {
              return aValue < bValue ? 1 : -1;
            }
          });
        } else {
          // Default sort: most participants first
          contests.sort(
            (a, b) => Number(b.participant_count) - Number(a.participant_count)
          );
        }

        // Only check participation if user is logged in
        if (!user?.wallet_address) {
          return contests.map((contest) => ({
            ...contest,
            is_participating: false,
          }));
        }

        const processedContests = await Promise.all(
          contests.map(async (contest: Contest) => {
            const isParticipating = await checkContestParticipation(
              contest.id,
              user.wallet_address
            );

            return {
              ...contest,
              is_participating: isParticipating,
            };
          })
        );

        return processedContests;
      } catch (error: any) {
        logError("contests.getAll", error, {
          userWallet: user?.wallet_address,
        });
        throw error;
      }
    },

    getById: async (contestId: string) => {
      const user = useStore.getState().user;

      try {
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

        const contest = await response.json();

        // Only check participation if user is logged in
        const isParticipating = user?.wallet_address
          ? await checkContestParticipation(contestId, user.wallet_address)
          : false;

        console.log(`[debug] Contest ${contestId} participation:`, {
          wallet: user?.wallet_address,
          isParticipating,
        });

        return {
          ...contest,
          is_participating: isParticipating,
        };
      } catch (error: any) {
        logError("contests.getById", error, {
          contestId,
          userWallet: user?.wallet_address,
        });
        throw error;
      }
    },

    enterContest: async (
      contestId: string,
      portfolio: PortfolioResponse | Array<{ symbol: string; weight: number }>
    ): Promise<void> => {
      const user = useStore.getState().user;
      const requestId = crypto.randomUUID();

      if (!user?.wallet_address) {
        throw new Error("Please connect your wallet first");
      }

      try {
        // Keep the original portfolio structure
        const portfolioData: PortfolioResponse = Array.isArray(portfolio)
          ? { tokens: portfolio }
          : portfolio;

        // Send exactly what the server expects
        const payload = {
          wallet_address: user.wallet_address,
          tokens: portfolioData.tokens.map((token) => ({
            symbol: token.symbol,
            weight: Number(token.weight),
          })),
        };

        const response = await fetch(`${API_URL}/contests/${contestId}/join`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Wallet-Address": user.wallet_address,
            "X-Request-ID": requestId,
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        // Log raw response before any processing
        console.log("[enterContest] Raw response:", {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          requestId,
        });

        // Try to get response text first
        const responseText = await response.text();
        console.log("[enterContest] Response text:", {
          text: responseText.slice(0, 200), // Log first 200 chars
          requestId,
        });

        // Then parse it if possible
        let responseData;
        try {
          responseData = responseText ? JSON.parse(responseText) : {};
        } catch (e) {
          console.error("[enterContest] Parse error:", {
            error: e,
            text: responseText,
            requestId,
          });
          throw new Error("Server returned invalid JSON");
        }

        // Handle non-200 responses
        if (!response.ok) {
          const error = new Error(
            responseData.error ||
              responseData.message ||
              `Server error: ${response.status}`
          );

          // Attach additional context to the error
          Object.assign(error, {
            status: response.status,
            responseData,
            requestId,
          });

          throw error;
        }

        // Log success
        console.log("[enterContest] Success:", {
          contestId,
          requestId,
          response: responseData,
        });

        return responseData;
      } catch (error) {
        // Log the complete error chain
        console.error("[enterContest] Error details:", {
          error:
            error instanceof Error
              ? {
                  name: error.name,
                  message: error.message,
                  stack: error.stack,
                  status: (error as any).status,
                  responseData: (error as any).responseData,
                }
              : error,
          requestId,
          contestId,
          walletAddress: user.wallet_address,
        });

        // Rethrow with user-friendly message
        if (error instanceof Error) {
          throw error; // Keep original error if it's already well-formed
        }
        throw new Error("Failed to join contest. Please try again later.");
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

    create: async (contestData: Partial<Contest>): Promise<Contest> => {
      const user = useStore.getState().user;

      if (!user?.wallet_address) {
        throw new Error("Please connect your wallet first");
      }

      try {
        const response = await fetch(`${API_URL}/contests`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Wallet-Address": user.wallet_address,
          },
          credentials: "include",
          body: JSON.stringify(contestData),
        });

        // Get the response text first
        const responseText = await response.text();
        console.log("Create contest raw response:", responseText);

        let errorData;
        try {
          errorData = responseText ? JSON.parse(responseText) : {};
        } catch (e) {
          console.error("Failed to parse response:", responseText);
        }

        if (!response.ok) {
          throw new Error(
            errorData?.message ||
              errorData?.error ||
              `Failed to create contest: ${response.status} ${response.statusText}`
          );
        }

        return errorData;
      } catch (error) {
        console.error("Failed to create contest:", {
          error,
          data: contestData,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
          errorStack: error instanceof Error ? error.stack : undefined,
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
    get: async (walletAddress: string) => {
      const response = await fetch(`${API_URL}/balance/${walletAddress}`);
      if (!response.ok) {
        throw new Error("Failed to fetch balance");
      }
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
