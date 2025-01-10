// src/services/dd-api.ts
import { API_BASE, API_URL } from "../config/config";
import { useStore } from "../store/useStore";
import {
  BaseActivity as Activity,
  Contest,
  PlatformStats,
  Portfolio,
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
        const response = await fetch(`${API_URL}/users`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-Wallet-Address": useStore.getState().user?.wallet_address || "",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }

        const data = await response.json();
        console.log("Raw users API response:", data);
        const users = data.users || [];
        console.log("Processed users array:", users);

        return users.sort((a: User, b: User) =>
          a.wallet_address.localeCompare(b.wallet_address)
        );
      } catch (error) {
        console.error("Failed to fetch users:", error);
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

    getPortfolio: async (walletAddress: string): Promise<Portfolio> => {
      const response = await fetch(`/api/users/${walletAddress}/portfolio`);
      if (!response.ok) {
        throw new Error("Failed to fetch portfolio");
      }
      return response.json();
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

    getPlatformStats: async () => {
      try {
        const response = await fetch(`${API_URL}/admin/stats/platform`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-Wallet-Address": useStore.getState().user?.wallet_address || "",
          },
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
          headers: {
            "Content-Type": "application/json",
            "X-Wallet-Address": useStore.getState().user?.wallet_address || "",
          },
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
  },

  // Admin endpoints
  admin: {
    getPlatformStats: async (): Promise<PlatformStats> => {
      const response = await fetch(`${API_URL}/admin/stats/platform`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Wallet-Address": useStore.getState().user?.wallet_address || "",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch platform stats");
      return response.json();
    },

    getRecentActivities: async (): Promise<{ activities: Activity[] }> => {
      const response = await fetch(`${API_URL}/admin/activities`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Wallet-Address": useStore.getState().user?.wallet_address || "",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch activities");
      return response.json();
    },

    awardBonusPoints: async (walletAddress: string, amount: number) => {
      const response = await fetch(`${API_URL}/admin/bonus-points`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Wallet-Address": useStore.getState().user?.wallet_address || "",
        },
        credentials: "include",
        body: JSON.stringify({ walletAddress, amount }),
      });
      if (!response.ok) throw new Error("Failed to award bonus points");
    },

    adjustUserBalance: async (
      walletAddress: string,
      amount: number
    ): Promise<void> => {
      const response = await fetch(
        //  `${API_URL}/admin/users/${walletAddress}/balance`,
        `${API_URL}/balance/${walletAddress}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Wallet-Address": useStore.getState().user?.wallet_address || "",
          },
          credentials: "include",
          body: JSON.stringify({ amount }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to adjust user balance");
      }
    },

    getContests: async (): Promise<{ contests: Contest[] }> => {
      const response = await fetch(`${API_URL}/contests`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Wallet-Address": useStore.getState().user?.wallet_address || "",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch contests");
      return response.json();
    },

    updateContest: async (contestId: string, updates: Partial<Contest>) => {
      const response = await fetch(`${API_URL}/contests/${contestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Wallet-Address": useStore.getState().user?.wallet_address || "",
        },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update contest");
    },

    deleteContest: async (contestId: string): Promise<void> => {
      const response = await fetch(`${API_URL}/contests/${contestId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-Wallet-Address": useStore.getState().user?.wallet_address || "",
        },
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete contest");
    },
  },

  // Contest endpoints
  contests: {
    getActive: async (): Promise<Contest[]> => {
      const user = useStore.getState().user;

      const response = await fetch(`${API_URL}/contests/active`, {
        headers: {
          "Content-Type": "application/json",
          "X-Wallet-Address": user?.wallet_address || "",
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
        const response = await fetch(`${API_BASE}/api/contests`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-Wallet-Address": user?.wallet_address || "",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch contests");
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
      console.log("API Service - Contest data before send:", contestData);

      try {
        const formattedData = {
          ...contestData,
          entry_fee: contestData.entry_fee
            ? String(parseFloat(contestData.entry_fee))
            : undefined,
          prize_pool: contestData.prize_pool
            ? String(parseFloat(contestData.prize_pool))
            : undefined,
          settings: {
            ...contestData.settings,
            max_participants: Number(contestData.settings?.max_participants),
            min_participants: Number(contestData.settings?.min_participants),
            min_trades: Number(contestData.settings?.min_trades),
          },
        };

        console.log("API Service - Formatted contest data:", formattedData);

        const response = await fetch(`${API_URL}/contests`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Wallet-Address": useStore.getState().user?.wallet_address || "",
          },
          credentials: "include",
          body: JSON.stringify(formattedData),
        });

        const responseText = await response.text();
        console.log("API Raw Response:", responseText);

        if (!response.ok) {
          let errorData;
          try {
            errorData = responseText ? JSON.parse(responseText) : {};
          } catch (e) {
            console.error("Failed to parse error response:", responseText);
            throw new Error("Invalid server response");
          }
          throw new Error(
            errorData?.message ||
              errorData?.error ||
              `Failed to create contest: ${response.status} ${response.statusText}`
          );
        }

        return JSON.parse(responseText);
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

    getPortfolio: async (contestId: string, wallet: string) => {
      const response = await fetch(
        `${API_URL}/contests/${contestId}/portfolio/${wallet}`,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Wallet-Address": useStore.getState().user?.wallet_address || "",
          },
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to fetch portfolio");
      return response.json();
    },

    // Balance endpoints
    balance: {
      adjust: async (walletAddress: string, amount: number): Promise<void> => {
        try {
          const response = await fetch(`${API_URL}/balance/${walletAddress}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ amount }),
            credentials: "include",
          });
          if (!response.ok) throw new Error("Failed to adjust balance");
        } catch (error) {
          console.error("Failed to adjust balance:", error);
          throw error;
        }
      },

      reset: async (walletAddress: string): Promise<void> => {
        try {
          const response = await fetch(
            `${API_URL}/admin/users/${walletAddress}/reset-balance`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
            }
          );
          if (!response.ok) throw new Error("Failed to reset balance");
        } catch (error) {
          console.error("Failed to reset balance:", error);
          throw error;
        }
      },
    },

    update: async (
      contestId: string | number,
      contestData: Partial<Contest>
    ): Promise<Contest> => {
      const user = useStore.getState().user;

      try {
        // Ensure numeric values are properly formatted
        const formattedData = {
          ...contestData,
          entry_fee: contestData.entry_fee
            ? String(parseFloat(contestData.entry_fee))
            : undefined,
          prize_pool: contestData.prize_pool
            ? String(parseFloat(contestData.prize_pool))
            : undefined,
          current_prize_pool: contestData.current_prize_pool
            ? String(parseFloat(contestData.current_prize_pool))
            : undefined,
          settings: {
            ...contestData.settings,
            min_participants: Number(contestData.settings?.min_participants),
            max_participants: Number(contestData.settings?.max_participants),
            min_trades: Number(contestData.settings?.min_trades),
          },
        };

        console.log("[Contest Update] Sending data:", {
          contestId,
          data: formattedData,
          timestamp: new Date().toISOString(),
        });

        const response = await fetch(`${API_URL}/contests/${contestId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Wallet-Address": user?.wallet_address || "",
          },
          credentials: "include",
          body: JSON.stringify(formattedData),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          console.error("[Contest Update] Failed:", {
            status: response.status,
            error,
            contestId,
            timestamp: new Date().toISOString(),
          });
          throw new Error(error.message || "Failed to update contest");
        }

        const updatedContest = await response.json();
        console.log("[Contest Update] Success:", {
          contestId,
          response: updatedContest,
          timestamp: new Date().toISOString(),
        });

        return addParticipationFlag(updatedContest, user?.wallet_address);
      } catch (error: any) {
        logError("contests.update", error, {
          contestId,
          contestData,
          userWallet: user?.wallet_address,
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
    get: async (
      walletAddress: string
    ): Promise<{
      balance: string;
      exact_usdc: string;
      formatted_balance: string;
      decimals: number;
    }> => {
      console.log("Fetching balance for wallet:", walletAddress);
      try {
        const response = await fetch(`${API_URL}/balance/${walletAddress}`, {
          headers: {
            "Content-Type": "application/json",
            "X-Wallet-Address": useStore.getState().user?.wallet_address || "",
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch balance");
        }

        return response.json();
      } catch (error) {
        console.error("Failed to fetch balance:", error);
        throw error;
      }
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
