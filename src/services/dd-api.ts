// src/services/dd-api.ts

import { API_URL, DDAPI_DEBUG_MODE } from "../config/config";
import { useStore } from "../store/useStore";
import {
  BaseActivity as Activity,
  Contest,
  PlatformStats,
  PortfolioResponse,
  Token,
  Transaction,
  User,
} from "../types/index";
import type {
  ContestPerformanceResponse,
  GlobalRankingsResponse,
  TimeFrame,
} from "../types/leaderboard";
import type { SortOptions } from "../types/sort";

// Helper function to check and update ban status
const checkAndUpdateBanStatus = (response: Response) => {
  const store = useStore.getState();
  const banStatus = response.headers.get("X-User-Banned");
  const banReason = response.headers.get("X-Ban-Reason");

  if (banStatus === "true" && store.user) {
    store.setUser({
      ...store.user,
      is_banned: true,
      ban_reason: banReason || "Account has been banned",
    });
  }
};

// Create a consistent API client
const createApiClient = () => {
  return {
    fetch: async (endpoint: string, options: RequestInit = {}) => {
      const headers = new Headers({
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Debug": "true",
      });

      // Merge provided headers with defaults
      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          headers.append(key, value);
        });
      }

      // Log the request if debug mode is enabled
      if (DDAPI_DEBUG_MODE === "true") {
        console.log("[DD-API Debug] Request:", {
          url: `${API_URL}${endpoint}`,
          method: options.method || "GET",
          headers: Object.fromEntries([...headers]),
          cookies: document.cookie,
          timestamp: new Date().toISOString(),
        });
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: "include",
        mode: "cors",
      });

      // If debug mode is enabled, log the response
      if (DDAPI_DEBUG_MODE === "true") {
        console.log("[DD-API Debug] Response:", {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries([...response.headers]),
          url: response.url,
          timestamp: new Date().toISOString(),
        });
      }

      // Check for ban status
      checkAndUpdateBanStatus(response);

      if (!response.ok) {
        console.error(`[API Error] ${endpoint}:`, {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries([...response.headers]),
          url: response.url,
          cookies: document.cookie,
        });
        throw new Error(`API Error: ${response.statusText}`);
      }

      return response;
    },
  };
};

// Log error
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

// Add type for participant in addParticipationFlag
const addParticipationFlag = (
  contest: Contest,
  userWallet?: string
): Contest => {
  if (!userWallet) return { ...contest, is_participating: false };

  return {
    ...contest,
    is_participating:
      contest.participants?.some(
        (p: { address?: string }) =>
          p.address?.toLowerCase() === userWallet.toLowerCase()
      ) || false,
  };
};

// Add a debounce/cache mechanism for participation checks
const participationCache = new Map<
  string,
  { result: boolean; timestamp: number }
>();
const CACHE_DURATION = 30000; // 30 seconds
const FETCH_TIMEOUT = 5000; // 5 second timeout for fetch requests

// Check contest participation
const checkContestParticipation = async (
  contestId: number | string,
  userWallet?: string
): Promise<boolean> => {
  if (!userWallet) return false;

  // Create a cache key
  const cacheKey = `${contestId}-${userWallet}`;
  const now = Date.now();

  // Check cache first
  const cached = participationCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.result;
  }

  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const api = createApiClient();
    const response = await api
      .fetch(`/contests/${contestId}/portfolio/${userWallet}`, {
        signal: controller.signal,
      })
      .finally(() => clearTimeout(timeoutId));

    const data = await response.json();
    // Check if the portfolio entries array has any entries
    const result = !!(data?.length > 0);
    participationCache.set(cacheKey, { result, timestamp: now });
    return result;
  } catch (error: unknown) {
    // Don't log timeout errors
    if (error instanceof Error && error.name !== "AbortError") {
      console.error(
        `[Contest ${contestId}] Error checking participation:`,
        error
      );
    }
    participationCache.set(cacheKey, { result: false, timestamp: now });
    return false;
  }
};

// Helper function to format bonus points
export const formatBonusPoints = (points: string | number): string => {
  const amount = typeof points === "string" ? parseInt(points) : points;
  return `${amount.toLocaleString()} pts`;
};

// Add maintenance mode check function
const checkMaintenanceMode = async () => {
  try {
    // First try the public status endpoint
    const response = await fetch(`${API_URL}/status`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    // If we get a 503, that means we're in maintenance mode
    if (response.status === 503) {
      return true;
    }

    // If we get a successful response, check the maintenance flag
    if (response.ok) {
      const data = await response.json();
      return data.maintenance || false;
    }

    // For admin users, try the admin endpoint as fallback
    const adminResponse = await fetch(`${API_URL}/admin/maintenance`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (adminResponse.ok) {
      const data = await adminResponse.json();
      return data.enabled || false;
    }

    // If both checks fail, assume we're not in maintenance mode
    return false;
  } catch (error) {
    console.error("Error checking maintenance mode:", error);
    // If we can't check maintenance mode, assume we're not in maintenance
    return false;
  }
};

/* DegenDuel API Endpoints (client-side) */

export const ddApi = {
  // User endpoints
  users: {
    getAll: async (): Promise<User[]> => {
      try {
        const api = createApiClient();
        const response = await api.fetch("/users");
        const data = await response.json();
        return data.users;
      } catch (error) {
        console.error("Failed to fetch users:", error);
        return [];
      }
    },

    getOne: async (wallet: string): Promise<User> => {
      try {
        const api = createApiClient();
        const response = await api.fetch(`/users/${wallet}`);
        return response.json();
      } catch (error: any) {
        logError("users.getOne", error, { wallet });
        throw error;
      }
    },

    update: async (wallet: string, nickname: string): Promise<void> => {
      const api = createApiClient();
      await api.fetch(`/users/${wallet}`, {
        method: "PUT",
        body: JSON.stringify({ nickname }),
      });
    },

    updateSettings: async (
      wallet: string,
      settings: Record<string, any>
    ): Promise<void> => {
      try {
        const api = createApiClient();
        await api.fetch(`/users/${wallet}/settings`, {
          method: "PUT",
          body: JSON.stringify({ settings }),
        });
      } catch (error: any) {
        logError("users.updateSettings", error, { wallet, settings });
        throw error;
      }
    },
  },

  // Token endpoints
  tokens: {
    getAll: async (): Promise<Token[]> => {
      const api = createApiClient();
      const response = await api.fetch("/dd-serv/tokens");
      const responseData = await response.json();
      return responseData.data || responseData;
    },
  },

  // Stats endpoints
  stats: {
    getOverall: async (wallet: string) => {
      try {
        const response = await fetch(`${API_URL}/stats/${wallet}`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch stats");
        return response.json();
      } catch (error: any) {
        logError("stats.getOverall", error, { wallet });
        throw error;
      }
    },

    getHistory: async (wallet: string, limit = 10, offset = 0) => {
      try {
        const response = await fetch(
          `${API_URL}/stats/${wallet}/history?limit=${limit}&offset=${offset}`,
          { credentials: "include" }
        );
        if (!response.ok) throw new Error("Failed to fetch history");
        return response.json();
      } catch (error: any) {
        logError("stats.getHistory", error, { wallet, limit, offset });
        throw error;
      }
    },

    getAchievements: async (wallet: string) => {
      try {
        const response = await fetch(
          `${API_URL}/stats/${wallet}/achievements`,
          {
            credentials: "include",
          }
        );
        if (!response.ok) throw new Error("Failed to fetch achievements");
        return response.json();
      } catch (error: any) {
        logError("stats.getAchievements", error, { wallet });
        throw error;
      }
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
  },

  // Admin endpoints
  admin: {
    // Get platform stats
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

    // Get contests
    getContests: async (): Promise<{ contests: Contest[] }> => {
      const response = await fetch(`${API_URL}/contests`);
      if (!response.ok) throw new Error("Failed to fetch contests");
      return response.json();
    },

    // Get recent activities
    getRecentActivities: async (): Promise<{ activities: Activity[] }> => {
      const response = await fetch(`${API_URL}/admin/activities`);
      if (!response.ok) throw new Error("Failed to fetch activities");
      return response.json();
    },

    // Update contest
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

    // Delete contest
    deleteContest: async (contestId: string): Promise<void> => {
      const response = await fetch(`${API_URL}/contests/${contestId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete contest");
    },

    // Adjust user balance
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

    // Get list of available log files
    getLogs: async () => {
      const response = await fetch(`${API_URL}/superadmin/logs/available`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch log files");
      return response.json();
    },

    // Get content of a specific log file
    getLogContent: async (filename: string) => {
      const response = await fetch(`${API_URL}/superadmin/logs/${filename}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch log content");
      return response.json();
    },

    // Set maintenance mode
    setMaintenanceMode: async (enabled: boolean) => {
      const response = await fetch(`${API_URL}/admin/maintenance`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) {
        throw new Error("Failed to set maintenance mode");
      }

      return response.json();
    },

    // Get maintenance status
    getMaintenanceStatus: async () => {
      const response = await fetch(`${API_URL}/admin/maintenance`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to get maintenance status");
      }

      return response.json();
    },

    checkMaintenanceMode,
  },

  // Contest endpoints
  contests: {
    // Get active contests
    getActive: async (): Promise<Contest[]> => {
      const user = useStore.getState().user;

      const response = await fetch(`${API_URL}/contests`, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        credentials: "include",
      });
      // This does not actually filter for active contests; it returns all contests.

      if (!response.ok) throw new Error("Failed to fetch active contests");

      const data = await response.json();
      const contests: Contest[] = Array.isArray(data)
        ? data
        : data.contests || [];

      return contests.map((contest: Contest) =>
        addParticipationFlag(contest, user?.wallet_address)
      );
    },

    // Get all contests
    getAll: async (sortOptions?: SortOptions): Promise<Contest[]> => {
      const user = useStore.getState().user;

      try {
        const api = createApiClient();
        const response = await api.fetch("/contests");
        const data = await response.json();
        let contests: Contest[] = Array.isArray(data)
          ? data
          : data.contests || [];

        // Apply sorting if options are provided
        if (sortOptions) {
          contests.sort((a, b) => {
            let aValue = a[sortOptions.field];
            let bValue = b[sortOptions.field];

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

        // Check participation in batches if user is logged in
        if (user?.wallet_address) {
          const BATCH_SIZE = 5;
          for (let i = 0; i < contests.length; i += BATCH_SIZE) {
            const batch = contests.slice(i, i + BATCH_SIZE);
            const batchPromises = batch.map((contest) =>
              checkContestParticipation(contest.id, user.wallet_address).catch(
                () => false
              )
            );
            const batchResults = await Promise.all(batchPromises);

            // Update contests with participation results
            batchResults.forEach((result, index) => {
              contests[i + index] = {
                ...contests[i + index],
                is_participating: result,
              };
            });
          }
        } else {
          contests = contests.map((contest) => ({
            ...contest,
            is_participating: false,
          }));
        }

        return contests;
      } catch (error: any) {
        logError("contests.getAll", error, {
          userWallet: user?.wallet_address,
        });
        throw error;
      }
    },

    // Get contest by ID
    getById: async (contestId: string) => {
      const user = useStore.getState().user;

      try {
        const response = await fetch(`${API_URL}/contests/${contestId}`, {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
          credentials: "include",
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.message || "Failed to fetch contest");
        }

        const contest = await response.json();

        // Only check participation if we have both user and contest, and contest is in a valid state
        const shouldCheckParticipation =
          user?.wallet_address &&
          contest?.id &&
          contest.status !== "cancelled" &&
          contest.status !== "completed";

        const isParticipating = shouldCheckParticipation
          ? await checkContestParticipation(contestId, user.wallet_address)
          : false;

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

    // Enter contest
    enterContest: async (
      contestId: string,
      transaction_signature: string
    ): Promise<void> => {
      const user = useStore.getState().user;

      if (!user?.wallet_address) {
        throw new Error("Please connect your wallet first");
      }

      try {
        const payload = {
          wallet_address: user.wallet_address,
          transaction_signature,
        };

        const response = await fetch(`${API_URL}/contests/${contestId}/join`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        // Log raw response before any processing
        console.log("[enterContest] Raw response:", {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        });

        if (!response.ok) {
          const responseText = await response.text();
          let responseData;
          try {
            responseData = responseText ? JSON.parse(responseText) : {};
          } catch (e) {
            throw new Error("Server returned invalid response");
          }

          throw new Error(
            responseData.error ||
              responseData.message ||
              `Server error: ${response.status}`
          );
        }

        return await response.json();
      } catch (error) {
        console.error("[enterContest] Error:", error);
        throw error instanceof Error
          ? error
          : new Error("Failed to join contest");
      }
    },

    // Submit portfolio
    submitPortfolio: async (
      contestId: string,
      portfolio: PortfolioResponse
    ): Promise<void> => {
      const user = useStore.getState().user;

      if (!user?.wallet_address) {
        throw new Error("Please connect your wallet first");
      }

      try {
        const payload = {
          wallet_address: user.wallet_address,
          tokens: portfolio.tokens.map((token) => ({
            contractAddress: token.contractAddress,
            weight: Number(token.weight),
          })),
        };

        console.log("[submitPortfolio] Initiating request:", {
          contestId,
          portfolio,
          userWallet: user.wallet_address,
          timestamp: new Date().toISOString(),
        });

        const response = await fetch(
          `${API_URL}/contests/${contestId}/portfolio`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          const error = new Error(data.message || "Failed to submit portfolio");
          Object.assign(error, {
            status: response.status,
            responseData: data,
          });
          throw error;
        }

        console.log("[submitPortfolio] Success:", {
          contestId,
          response: data,
          timestamp: new Date().toISOString(),
        });

        return data;
      } catch (error: any) {
        logError("contests.submitPortfolio", error, {
          contestId,
          portfolio,
          userWallet: user?.wallet_address,
          timestamp: new Date().toISOString(),
        });
        throw error;
      }
    },

    // Update portfolio
    updatePortfolio: async (
      contestId: string | number,
      portfolio: PortfolioResponse
    ) => {
      const user = useStore.getState().user;

      try {
        if (!user?.wallet_address) {
          throw new Error("Please connect your wallet first");
        }

        const payload = {
          wallet_address: user.wallet_address,
          tokens: portfolio.tokens.map((token) => ({
            contractAddress: token.contractAddress,
            weight: Number(token.weight),
          })),
        };

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

    // Create contest
    create: async (contestData: Partial<Contest>): Promise<Contest> => {
      console.log("API Service - Contest data before send:", contestData);

      try {
        const response = await fetch(`${API_URL}/contests`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(contestData),
        });

        const responseText = await response.text();
        console.log("API Raw Response:", responseText);

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

    enterContestWithPortfolio: async (
      contestId: string,
      transaction_signature: string,
      portfolio: {
        tokens: Array<{
          contractAddress: string;
          weight: number;
        }>;
      }
    ) => {
      const user = useStore.getState().user;
      if (!user?.wallet_address) {
        throw new Error("Please connect your wallet first");
      }

      try {
        const payload = {
          wallet_address: user.wallet_address,
          transaction_signature,
          portfolio,
        };

        const response = await fetch(`${API_URL}/contests/${contestId}/enter`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "Failed to enter contest");
        }

        return await response.json();
      } catch (error) {
        console.error("[enterContestWithPortfolio] Error:", error);
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
    get: async (walletAddress: string): Promise<{ balance: string }> => {
      console.log("Fetching balance for wallet:", walletAddress);
      try {
        const api = createApiClient();
        const response = await api.fetch(`/users/${walletAddress}`);
        const data = await response.json();
        console.log("User data:", data);
        return { balance: data.balance || "0" };
      } catch (error) {
        console.error("Failed to fetch user balance:", {
          error,
          walletAddress,
          timestamp: new Date().toISOString(),
        });
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

  // Leaderboard endpoints
  leaderboard: {
    // Get global rankings (DD Point Leaderboard)
    getGlobalRankings: async (
      limit: number = 10,
      offset: number = 0
    ): Promise<GlobalRankingsResponse> => {
      const response = await fetch(
        `${API_URL}/leaderboard/global?limit=${limit}&offset=${offset}`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to fetch global rankings");
      return response.json();
    },

    // Get contest performance (Degen Rankings)
    getContestPerformance: async (
      timeframe: TimeFrame = "month",
      limit: number = 10,
      offset: number = 0
    ): Promise<ContestPerformanceResponse> => {
      const response = await fetch(
        `${API_URL}/leaderboard/contests/performance?timeframe=${timeframe}&limit=${limit}&offset=${offset}`,
        {
          credentials: "include",
        }
      );
      if (!response.ok)
        throw new Error("Failed to fetch contest performance rankings");
      return response.json();
    },
  },

  // Fetch -- generic endpoint
  fetch: async (endpoint: string, options: RequestInit = {}) => {
    const defaultOptions = {
      credentials: "include" as const,
      headers: {
        "Content-Type": "application/json",
      },
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      console.error(`[API Error] ${endpoint}:`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        cookies: document.cookie,
      });
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.statusText}`);
    }

    return response;
  },
};

export const createDDApi = () => {
  return {
    fetch: async (endpoint: string, options: RequestInit = {}) => {
      const defaultOptions = {
        credentials: "include" as const,
        headers: {
          "Content-Type": "application/json",
        },
      };

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        console.error(`[API Error] ${endpoint}:`, {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          cookies: document.cookie,
        });
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `API Error: ${response.statusText}`
        );
      }

      return response;
    },
  };
};
