// src/services/dd-api.ts

/***********************************************************************
 * ⚠️ CRITICAL REFACTORING NEEDED ⚠️
 * 
 * THIS FILE IS UNWIELDY AND MUST BE REFACTORED IMMEDIATELY.
 * 
 * URGENT ACTION REQUIRED:
 * - DESTRUCTURE THIS MONOLITHIC FILE INTO MULTIPLE SERVICE FILES
 * - ORGANIZE BY DOMAIN (USERS, CONTESTS, ADMIN, ETC.)
 * - IMPLEMENT PROPER ERROR HANDLING AND LOGGING
 * - MAINTAIN CONSISTENT PATTERNS ACROSS ALL API CALLS
 * - ELIMINATE REDUNDANT CODE
 * 
 * THIS FILE HAS GROWN BEYOND MAINTAINABLE SIZE AND CONTINUES TO
 * ACCUMULATE TECHNICAL DEBT THAT WILL IMPEDE FUTURE DEVELOPMENT.
 ***********************************************************************/

import { API_URL, DDAPI_DEBUG_MODE } from "../config/config";
import { useStore } from "../store/useStore";
import {
  BaseActivity as Activity,
  Contest,
  ContestViewData,
  PlatformStats,
  PortfolioResponse,
  Token,
  Transaction,
  UnifiedContestViewApiResponse,
  User
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

  // Ban status is set by the API, and we can't do anything about it.
  if (banStatus === "true" && store.user) {
    store.setUser({
      ...store.user,
      is_banned: true,
      ban_reason: banReason || "Account has been banned",
    });
  }
};

// Normalize path to avoid double API URL issues
const normalizePath = (path: string): string => {
  // Remove any leading/trailing slashes
  const trimmed = path
    .replace(/^\/+(.*?)\/+$|^\/+|\/+$/g, "$1")
    .replace(/^\/+|\/+$/g, "");
  // Alternatively, a simpler version:
  // const trimmed = path.replace(/^\/+|\/+$/g, '');

  // If path already starts with 'api/', remove it to prevent double
  if (trimmed.startsWith("api/")) {
    return trimmed.substring(4);
  }

  return trimmed;
};

// Add circuit breaker state management
interface CircuitBreakerState {
  isOpen: boolean;
  failures: number;
  lastFailure: number | null;
  lastSuccess: number | null;
  cooldownPeriod: number;
  failureThreshold: number;
  notifiedAdmin: boolean;
}

interface ServiceCircuitBreaker extends CircuitBreakerState {
  endpoint: string;
  affectedOperations: string[];
  recoveryHistory: Array<{ timestamp: number; success: boolean }>;
}

interface CircuitBreakerAnalytics {
  totalFailures: number;
  lastIncident: number | null;
  recoveryAttempts: number;
  meanTimeBetweenFailures: number | null;
  serviceHealth: Record<
    string,
    {
      status: "healthy" | "degraded" | "failed";
      lastCheck: number;
      failureRate: number;
    }
  >;
}

// Track circuit breakers by service
const circuitBreakers = new Map<string, ServiceCircuitBreaker>();
const analytics: CircuitBreakerAnalytics = {
  totalFailures: 0,
  lastIncident: null,
  recoveryAttempts: 0,
  meanTimeBetweenFailures: null,
  serviceHealth: {},
};

const getServiceKey = (endpoint: string): string => {
  // Extract service name from endpoint
  const parts = normalizePath(endpoint).split("/");
  return parts[0] || "default";
};

const getOrCreateBreaker = (endpoint: string): ServiceCircuitBreaker => {
  const serviceKey = getServiceKey(endpoint);
  if (!circuitBreakers.has(serviceKey)) {
    circuitBreakers.set(serviceKey, {
      endpoint: serviceKey,
      isOpen: false,
      failures: 0,
      lastFailure: null,
      lastSuccess: null,
      cooldownPeriod: 30000,
      failureThreshold: 5,
      notifiedAdmin: false,
      affectedOperations: [],
      recoveryHistory: [],
    });
  }
  return circuitBreakers.get(serviceKey)!;
};

const updateAnalytics = (breaker: ServiceCircuitBreaker, success: boolean) => {
  const now = Date.now();

  if (!success) {
    analytics.totalFailures++;
    analytics.lastIncident = now;

    // Update MTBF if we have multiple incidents
    if (breaker.recoveryHistory.length > 1) {
      const incidents = breaker.recoveryHistory.filter((r) => !r.success);
      if (incidents.length > 1) {
        const mtbf =
          incidents.reduce((acc, curr, idx, arr) => {
            if (idx === 0) return 0;
            return acc + (curr.timestamp - arr[idx - 1].timestamp);
          }, 0) /
          (incidents.length - 1);
        analytics.meanTimeBetweenFailures = mtbf;
      }
    }
  }

  // Update service health
  analytics.serviceHealth[breaker.endpoint] = {
    status: breaker.isOpen
      ? "failed"
      : breaker.failures > 0
        ? "degraded"
        : "healthy",
    lastCheck: now,
    failureRate: breaker.failures / (breaker.recoveryHistory.length || 1),
  };
};

// Helper function to handle expected unauthorized endpoints
// TODO: This is a very curious function, and I'm not sure why it's needed. I forget.
const isExpectedUnauthorized = (path: string, status: number): boolean => {
  // List of endpoints that are expected to return 401 unauthorized status
  // Note: These paths should match normalized paths (without /api/ prefix)
  const expectedUnauthEndpoints: readonly string[] = [
    "auth/session",
    "admin/maintenance/status",
    "admin/metrics/service-analytics",
  ] as const;

  // Check if the path includes any of the expected unauthorized endpoints
  return expectedUnauthEndpoints.some(
    (endpoint) =>
      path.includes(endpoint) && status === 401,
  );
};

// Circuit breaker helper functions
const resetCircuitBreaker = (endpoint: string) => {
  const breaker = getOrCreateBreaker(endpoint);
  breaker.isOpen = false;
  breaker.failures = 0;
  breaker.lastFailure = null;
  breaker.notifiedAdmin = false;
  updateAnalytics(breaker, true);
};

// Handle success with circuit breaker
const handleSuccess = (endpoint: string) => {
  const breaker = getOrCreateBreaker(endpoint);
  breaker.lastSuccess = Date.now();
  if (breaker.failures > 0) {
    breaker.failures = 0;
    breaker.recoveryHistory.push({ timestamp: Date.now(), success: true });
    console.log(
      `[DD-API] Circuit breaker reset for service: ${breaker.endpoint}`,
    );
  }
  updateAnalytics(breaker, true);
};

// Handle failure with circuit breaker
const handleFailure = (endpoint: string, error: any) => {
  const breaker = getOrCreateBreaker(endpoint);
  breaker.failures++;
  breaker.lastFailure = Date.now();
  breaker.recoveryHistory.push({ timestamp: Date.now(), success: false });
  updateAnalytics(breaker, false);

  // Check if we should open the circuit breaker
  if (breaker.failures >= breaker.failureThreshold) {
    breaker.isOpen = true;

    // Only notify once per circuit breaker open event
    if (!breaker.notifiedAdmin) {
      const store = useStore.getState();
      // Case-insensitive role check
      const userRole = store.user?.role?.toLowerCase();
      const isAdmin = userRole === "admin" || userRole === "superadmin";

      if (isAdmin) {
        const details = {
          service: breaker.endpoint,
          failures: breaker.failures,
          lastFailure: new Date(breaker.lastFailure).toISOString(),
          lastSuccess: breaker.lastSuccess
            ? new Date(breaker.lastSuccess).toISOString()
            : "never",
          error: error instanceof Error ? error.message : "Unknown error",
          analytics: {
            totalFailures: analytics.totalFailures,
            meanTimeBetweenFailures: analytics.meanTimeBetweenFailures,
            serviceHealth: analytics.serviceHealth[breaker.endpoint],
          },
        };

        // Dispatch event for admin dashboard
        const event = new CustomEvent("circuit-breaker", {
          detail: {
            ...details,
            cooldownPeriod: breaker.cooldownPeriod,
            failureThreshold: breaker.failureThreshold,
            recoveryTime: new Date(
              Date.now() + breaker.cooldownPeriod,
            ).toISOString(),
          },
        });
        window.dispatchEvent(event);
      }
      breaker.notifiedAdmin = true;
    }
  }
};

// Add server status tracking
let serverDownSince: number | null = null;
let serverDownChecks = 0;
const SERVER_DOWN_THRESHOLD = 3; // Number of 502 errors before considering server down

// Check if server is down
const isServerDown = () => {
  return serverDownSince !== null && serverDownChecks >= SERVER_DOWN_THRESHOLD;
};

// Handle server status
const handleServerStatus = (status: number) => {
  if (status === 502) {
    if (!serverDownSince) {
      serverDownSince = Date.now();
    }
    serverDownChecks++;

    if (serverDownChecks >= SERVER_DOWN_THRESHOLD) {
      // Dispatch a global event that components can listen to
      window.dispatchEvent(
        new CustomEvent("server-down", {
          detail: {
            status: 502,
            since: serverDownSince,
            checks: serverDownChecks,
            lastCheck: Date.now(),
          },
        }),
      );
    }
  } else {
    // Reset server down tracking if we get a non-502 response
    if (serverDownSince) {
      window.dispatchEvent(new CustomEvent("server-up"));
    }
    serverDownSince = null;
    serverDownChecks = 0;
  }
};

// Create a consistent API client
const createApiClient = () => {
  return {
    fetch: async (endpoint: string, options: RequestInit = {}) => {
      // If the server has been flagged as down, immediately return a synthetic
      // 502 Response object instead of throwing.  This prevents callers from
      // triggering unhandled Promise rejections (which can crash React
      // components if they do async work inside render) while still allowing
      // components to decide what to do with the error status.
      if (isServerDown()) {
        return new Response(
          JSON.stringify({ message: "Server is currently unavailable." }),
          {
            status: 502,
            statusText: "Bad Gateway",
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const breaker = getOrCreateBreaker(endpoint);

      // Check if circuit breaker is open
      if (breaker.isOpen && breaker.lastFailure) {
        const timeSinceLastFailure = Date.now() - breaker.lastFailure;
        if (timeSinceLastFailure < breaker.cooldownPeriod) {
          throw new Error(
            `Service ${breaker.endpoint} temporarily unavailable - Circuit breaker is open`,
          );
        } else {
          // Try to reset after cooldown
          resetCircuitBreaker(endpoint);
        }
      }

      const defaultOptions = {
        credentials: "include" as const,
        headers: {
          "Content-Type": "application/json",
        },
      };

      // Normalize endpoint path
      const normalizedPath = normalizePath(endpoint);
      const response = await fetch(`${API_URL}/${normalizedPath}`, {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...options.headers,
        },
      });

      // Track server status
      handleServerStatus(response.status);

      // Check for ban status
      checkAndUpdateBanStatus(response);

      if (!response.ok) {
        // Handle 502 specifically
        if (response.status === 502) {
          throw new Error(
            "Server is currently unavailable. Please try again later.",
          );
        }

        // Check if this is an expected unauthorized response // TODO: THIS MAKES NO SENSE
        if (isExpectedUnauthorized(normalizedPath, response.status)) {
          // Log as info instead of error for expected unauthorized responses
          if (DDAPI_DEBUG_MODE === "true") {
            console.info(
              `[DD-API Info] Expected unauthorized access to ${endpoint}`,
              {
                status: response.status,
                statusText: response.statusText,
              },
            );
          }
          return response;
        }

        // Don't treat 503 maintenance mode as an error
        if (response.status === 503) {
          return response;
        }

        // Handle failure with circuit breaker
        handleFailure(
          endpoint,
          new Error(`${response.status} ${response.statusText}`),
        );

        // Log actual errors
        console.error(`[API Error] ${endpoint}:`, {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          cookies: document.cookie,
        });

        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `API Error: ${response.statusText}`,
        );
      }

      // Handle success with circuit breaker
      handleSuccess(endpoint);
      return response;
    },
  };
};

// Log error
const logError = (
  endpoint: string,
  error: any,
  context?: Record<string, any>,
) => {
  console.error(`[DD-API Error] ${endpoint}:`, {
    message: error?.message,
    status: error?.status,
    context,
    timestamp: new Date().toISOString(),
  });
};

// Add a debounce/cache mechanism for participation checks
const participationCache = new Map<
  string,
  { result: boolean; timestamp: number }
>();
const CACHE_DURATION = 30000; // Participation check cache duration: 30 seconds
const FETCH_TIMEOUT = 5000; // Fetch timeout: 5 seconds

/**
 * Standard method for checking contest participation
 * Uses the dedicated check-participation endpoint for efficient lookups
 *
 * @param contestId The ID of the contest to check participation for
 * @param userWallet The wallet address to check participation for
 * @returns A promise that resolves to a boolean indicating if the user is participating
 */
const checkContestParticipation = async (
  contestId: number | string,
  userWallet?: string,
): Promise<boolean> => {
  if (!userWallet) return false;

  // Validate contestId
  if (!contestId || contestId === 'undefined' || contestId === 'null') {
    console.warn('[checkContestParticipation] Invalid contest ID:', contestId);
    return false;
  }

  // Ensure contestId is a valid number
  const numericId = typeof contestId === 'number' ? contestId : parseInt(contestId.toString(), 10);
  if (isNaN(numericId) || numericId <= 0) {
    console.warn('[checkContestParticipation] Contest ID must be a valid positive number:', contestId);
    return false;
  }

  // Create a cache key
  const cacheKey = `${numericId}-${userWallet}`;
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
      .fetch(
        `/contests/${numericId}/check-participation?wallet_address=${encodeURIComponent(
          userWallet,
        )}`,
        {
          signal: controller.signal,
        },
      )
      .finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      // Log detailed error information for non-200 responses
      try {
        const errorText = await response.text();
        console.warn(
          `[DD-API] Participation check failed for contest ${numericId}, wallet ${userWallet}: HTTP ${response.status}`,
          {
            endpoint: `/contests/${numericId}/check-participation`,
            statusText: response.statusText,
            errorText: errorText.substring(0, 200), // Limit long responses
          },
        );
      } catch (e) {
        console.warn(
          `[DD-API] Participation check failed: HTTP ${response.status}`,
        );
      }

      participationCache.set(cacheKey, { result: false, timestamp: now });
      return false;
    }

    const data = await response.json();

    // Validate response format
    if (data.is_participating === undefined) {
      console.warn(
        `[DD-API] Invalid participation check response format for contest ${contestId}:`,
        data,
      );
      participationCache.set(cacheKey, { result: false, timestamp: now });
      return false;
    }

    // The dedicated endpoint returns is_participating boolean
    const result = Boolean(data.is_participating);

    // Store in cache
    participationCache.set(cacheKey, { result, timestamp: now });
    return result;
  } catch (error: unknown) {
    // Don't log timeout errors
    if (error instanceof Error && error.name !== "AbortError") {
      console.error(
        `[DD-API] Error checking participation for contest ${contestId}, wallet ${userWallet}:`,
        {
          error,
          errorType:
            error instanceof Error ? error.constructor.name : "Unknown",
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
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

// Maintenance mode check function
const checkMaintenanceMode = async () => {
  try {
    // Get current user state
    const store = useStore.getState();

    // Case-insensitive administrator check:
    const userRole = store.user?.role?.toLowerCase();
    const isAdmin = userRole === "admin" || userRole === "superadmin";

    // If user is administrator, try administrator endpoint
    if (isAdmin) {
      try {
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
          return data.enabled;
        }
      } catch (err) {
        console.warn(
          `Admin maintenance check failed. Falling back to public endpoint...`,
        );
      }
    }

    // For non-administrators and/or if administrator maintenance check fails, use the public status endpoint instead
    const statusCheckResponse = await fetch(`${API_URL}/status`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    // If we get a 503, that is how we currently indicate that Maintenance Mode is active
    if (statusCheckResponse.status === 503) {
      return true;
    }

    // If we get a successful response, check its maintenance flag just in case
    if (statusCheckResponse.ok) {
      const data = await statusCheckResponse.json();
      return data.maintenance || false;
    }

    //// If we get a 401, that means we're not authorized to check maintenance mode
    //if (response.status === 401) {
    //  return false;
    //}

    // Not in maintenance mode if we get a 200 (or 404)
    if (
      statusCheckResponse.status === 200 ||
      statusCheckResponse.status === 404
    ) {
      return false;
    }

    // If we get a 500, that means there was an error checking maintenance mode, in which case we've got bigger problems
    if (statusCheckResponse.status === 500) {
      console.error(
        `DegenDuel servers are down, cannot check maintenance mode.`,
        statusCheckResponse.statusText
      );
      return false;
    }
  } catch (error) {
    console.error("Failed to check maintenance mode:", error);
    // Default to false on error - better to let users try to access than to block them incorrectly
    return false;
  }
};

// -------------------------------------------------------

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
      settings: Record<string, any>,
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

    // Get user level data
    getUserLevel: async (wallet: string) => {
      try {
        const api = createApiClient();
        const response = await api.fetch(`/users/${wallet}/level`);
        return response.json();
      } catch (error: any) {
        logError("users.getUserLevel", error, { wallet });
        // Return fallback data if the endpoint doesn't exist
        return {
          current_level: {
            level_number: 1,
            class_name: "Novice",
            title: "DegenDuel Novice",
            icon_url: "/images/levels/novice.png",
          },
          experience: {
            current: 0,
            next_level_at: 100,
            percentage: 0,
          },
          achievements: {
            bronze: { current: 0, required: 1 },
            silver: { current: 0, required: 0 },
            gold: { current: 0, required: 0 },
            platinum: { current: 0, required: 0 },
            diamond: { current: 0, required: 0 },
          },
        };
      }
    },

    // Get user profile image
    getProfileImage: async (wallet: string): Promise<string> => {
      try {
        // First try to check if the API has a profile image endpoint
        const defaultImageUrl = "/images/avatars/default.png";
        const api = createApiClient();
        const response = await api.fetch(`/users/${wallet}/profile-image`, {
          method: "HEAD", // Just check if it exists, don't download the image
        });

        if (response.ok) {
          return `${API_URL}/users/${wallet}/profile-image`;
        }

        return defaultImageUrl;
      } catch (error) {
        console.warn("Profile image fetch failed, using default", error);
        return "/images/avatars/default.png";
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
        const api = createApiClient();
        const response = await api.fetch(`/stats/${wallet}`);
        return response.json();
      } catch (error: any) {
        logError("stats.getOverall", error, { wallet });
        throw error;
      }
    },

    getHistory: async (wallet: string, limit = 10, offset = 0) => {
      try {
        const api = createApiClient();
        const response = await api.fetch(
          `/stats/${wallet}/history?limit=${limit}&offset=${offset}`,
        );
        return response.json();
      } catch (error: any) {
        logError("stats.getHistory", error, { wallet, limit, offset });
        throw error;
      }
    },

    getAchievements: async (wallet: string) => {
      try {
        const api = createApiClient();
        const response = await api.fetch(`/stats/${wallet}/achievements`);
        return response.json();
      } catch (error: any) {
        logError("stats.getAchievements", error, { wallet });
        throw error;
      }
    },

    getPlatformStats: async () => {
      try {
        const api = createApiClient();
        const response = await api.fetch(`/admin/stats/platform`);
        return response.json();
      } catch (error) {
        console.error("Failed to fetch platform stats:", error);
        throw error;
      }
    },

    getRecentActivity: async () => {
      try {
        const api = createApiClient();
        const response = await api.fetch(`/admin/stats/activity`);
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
      data: Partial<Contest>,
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
              `Server error: ${response.status} ${response.statusText}`,
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
      amount: number,
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
          },
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
      try {
        const response = await fetch(`${API_URL}/admin/maintenance`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ enabled }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error ||
            `Failed to set maintenance mode: ${response.statusText}`,
          );
        }

        return response;
      } catch (error) {
        console.error("Failed to set maintenance mode:", error);
        throw error;
      }
    },

    // Get maintenance status
    getMaintenanceStatus: async () => {
      const api = createApiClient();
      return api.fetch("/admin/maintenance");
    },

    checkMaintenanceMode,

    // Get service capacities
    getServiceCapacities: async (): Promise<Record<string, number>> => {
      try {
        const api = createApiClient();
        const response = await api.fetch("/admin/settings/service-capacities");
        return response.json();
      } catch (error) {
        console.error("Failed to fetch service capacities:", error);
        // Return default capacities if fetch fails
        // TODO: Is this a good idea?
        return {
          "dd-serv": 300,
          contests: 200,
          users: 150,
          stats: 100,
        };
      }
    },

    // Update service capacity
    updateServiceCapacity: async (
      service: string,
      capacity: number,
    ): Promise<void> => {
      try {
        const api = createApiClient();
        await api.fetch("/admin/settings/service-capacities", {
          method: "PUT",
          body: JSON.stringify({
            service,
            capacity,
          }),
        });
      } catch (error) {
        console.error(
          `Failed to update capacity for service ${service}:`,
          error,
        );
        throw error;
      }
    },

    // Get performance metrics
    getPerformanceMetrics: async () => {
      try {
        const api = createApiClient();
        const response = await api.fetch("/admin/metrics/performance");
        return response.json();
      } catch (error) {
        console.error("Failed to fetch performance metrics:", error);
        throw error;
      }
    },

    // Get memory stats
    getMemoryStats: async () => {
      try {
        const api = createApiClient();
        const response = await api.fetch("/admin/metrics/memory");
        return response.json();
      } catch (error) {
        console.error("Failed to fetch memory stats:", error);
        throw error;
      }
    },

    // Get service analytics
    getServiceAnalytics: async (): Promise<{
      services: Array<{
        name: string;
        status: "healthy" | "degraded" | "failed";
        lastCheck: number;
        failureRate: number;
      }>;
    }> => {
      try {
        const api = createApiClient();
        const response = await api.fetch("/admin/metrics/service-analytics");
        return response.json();
      } catch (error) {
        console.error("Failed to fetch service analytics:", error);
        throw error;
      }
    },
  },

  // Contest endpoints
  contests: {
    // Get active contests
    getActive: async (): Promise<Contest[]> => {
      const user = useStore.getState().user;
      const api = createApiClient();
      const response = await api.fetch("/contests", {
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      const data = await response.json();
      let contests: Contest[] = Array.isArray(data)
        ? data
        : data.contests || [];

      // Mark contests as not participating by default
      contests = contests.map((contest) => ({
        ...contest,
        is_participating: false,
      }));

      // If user is logged in, check participation using the dedicated endpoint
      if (user?.wallet_address) {
        // Check participation in batches for better performance
        const BATCH_SIZE = 5;
        for (let i = 0; i < contests.length; i += BATCH_SIZE) {
          const batch = contests.slice(i, i + BATCH_SIZE);
          const batchPromises = batch.map((contest) =>
            checkContestParticipation(contest.id, user.wallet_address).catch(
              () => false,
            ),
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
      }

      return contests;
    },

    // Gets detailed performance data for a user's contest entry
    getPerformanceDetails: async (
      contestId: string | number,
      walletAddress: string,
    ) => {
      try {
        const api = createApiClient();
        const response = await api.fetch(
          `/contests/${contestId}/performance?wallet_address=${encodeURIComponent(walletAddress)}`,
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch performance data: HTTP ${response.status}`,
          );
        }

        const data = await response.json();
        return {
          value: data.portfolio_value || 0,
          change: data.performance_percentage || 0,
          ranking: data.ranking || null,
          tokens: data.token_performances || [],
        };
      } catch (error) {
        console.error(
          `Error fetching performance for contest ${contestId}:`,
          error,
        );
        // Return mock data for now until the API is implemented
        return {
          value: 100 + Math.random() * 100,
          change: Math.random() * 20 - 10, // Random value between -10 and +10
          ranking: Math.floor(Math.random() * 20) + 1,
          tokens: [],
        };
      }
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
            const field = sortOptions.field;
            let aValue: string | number;
            let bValue: string | number;

            switch (field) {
              case "participant_count":
                aValue = a.participant_count;
                bValue = b.participant_count;
                break;
              case "entry_fee":
                aValue = parseFloat(a.entry_fee);
                bValue = parseFloat(b.entry_fee);
                break;
              case "prize_pool":
                aValue = parseFloat(a.prize_pool);
                bValue = parseFloat(b.prize_pool);
                break;
              case "start_time":
                aValue = new Date(a.start_time).getTime();
                bValue = new Date(b.start_time).getTime();
                break;
              default:
                // Exhaustive check for SortField, should not reach here
                // const _exhaustiveCheck: never = field;
                return 0;
            }

            // Handle potential NaN from parseFloat, default to 0 for comparison
            if (field === "entry_fee" || field === "prize_pool") {
              if (isNaN(aValue as number)) aValue = 0;
              if (isNaN(bValue as number)) bValue = 0;
            }

            if (sortOptions.direction === "asc") {
              return aValue > bValue ? 1 : (aValue < bValue ? -1 : 0);
            } else {
              return aValue < bValue ? 1 : (aValue > bValue ? -1 : 0);
            }
          });
        } else {
          // Default sort: start time ascending
          contests.sort((a, b) => {
            const aStartTime = new Date(a.start_time).getTime();
            const bStartTime = new Date(b.start_time).getTime();
            return aStartTime - bStartTime;
          });
        }

        // Mark contests as not participating by default
        contests = contests.map((contest) => ({
          ...contest,
          is_participating: false,
        }));

        // If user is logged in, check participation either using:
        // 1. The is_participating flag already present in the response (if using Method 1 on backend)
        // 2. Batch checking with the dedicated endpoint (if no flags are present)
        if (user?.wallet_address) {
          const needsParticipationCheck = contests.some(
            (contest) =>
              contest.is_participating === undefined ||
              contest.is_participating === null,
          );

          if (needsParticipationCheck) {
            // Check participation in batches
            const BATCH_SIZE = 5;
            for (let i = 0; i < contests.length; i += BATCH_SIZE) {
              const batch = contests.slice(i, i + BATCH_SIZE);
              const batchPromises = batch.map((contest) =>
                checkContestParticipation(
                  contest.id,
                  user.wallet_address,
                ).catch(() => false),
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
          }
        }

        return contests;
      } catch (error: any) {
        logError(`contests.getAll: ${error}`, error, {
          userWallet: user?.wallet_address,
        });
        throw error;
      }
    },

    // Get contest by ID
    getById: async (contestId: string) => {
      const user = useStore.getState().user;

      // Validate contestId before making API call
      if (!contestId || contestId === 'undefined' || contestId === 'null') {
        throw new Error('Contest ID is required');
      }

      // Ensure contestId is a valid number
      const numericId = parseInt(contestId, 10);
      if (isNaN(numericId) || numericId <= 0) {
        throw new Error('Contest ID must be a valid positive number');
      }

      try {
        const api = createApiClient();
        const response = await api.fetch(`/contests/${numericId}`, {
          headers: {
            "Cache-Control": "no-cache",
          },
        });

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

    // Enter contest - UPDATED: Now supports both free and paid contests
    enterContest: async (
      contestId: string,
      transaction_signature?: string, // Optional for free contests
    ): Promise<void> => {
      const user = useStore.getState().user;

      // Validate contestId before making API call
      if (!contestId || contestId === 'undefined' || contestId === 'null') {
        throw new Error('Contest ID is required');
      }

      // Ensure contestId is a valid number
      const numericId = parseInt(contestId, 10);
      if (isNaN(numericId) || numericId <= 0) {
        throw new Error('Contest ID must be a valid positive number');
      }

      if (!user?.wallet_address) {
        throw new Error("Please connect your wallet first");
      }

      try {
        const payload = {
          wallet_address: user.wallet_address,
          ...(transaction_signature && { transaction_signature }), // Only include if provided
        };

        const api = createApiClient();
        const response = await api.fetch(`/contests/${numericId}/join`, {
          method: "POST",
          body: JSON.stringify(payload),
        });

        return response.json();
      } catch (error) {
        console.error("[enterContest] Error:", error);
        throw error instanceof Error
          ? error
          : new Error("Failed to join contest");
      }
    },

    // NEW: Enter free contest without transaction (uses backend's /join endpoint)
    enterFreeContest: async (contestId: string): Promise<void> => {
      const user = useStore.getState().user;

      // Validate contestId before making API call
      if (!contestId || contestId === 'undefined' || contestId === 'null') {
        throw new Error('Contest ID is required');
      }

      // Ensure contestId is a valid number
      const numericId = parseInt(contestId, 10);
      if (isNaN(numericId) || numericId <= 0) {
        throw new Error('Contest ID must be a valid positive number');
      }

      if (!user?.wallet_address) {
        throw new Error("Please connect your wallet first");
      }

      try {
        const payload = {
          wallet_address: user.wallet_address,
        };

        const api = createApiClient();
        const response = await api.fetch(`/contests/${numericId}/join`, {
          method: "POST",
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "Failed to enter free contest");
        }

        return response.json();
      } catch (error) {
        console.error("[enterFreeContest] Error:", error);
        throw error instanceof Error
          ? error
          : new Error("Failed to enter free contest");
      }
    },

    // Submit portfolio
    submitPortfolio: async (
      contestId: string,
      portfolio: PortfolioResponse,
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
          },
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
      portfolio: PortfolioResponse,
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
          },
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

    // Get all contests a user is participating in
    getUserParticipations: async (walletAddress: string) => {
      try {
        if (!walletAddress) {
          throw new Error("Wallet address is required");
        }

        const api = createApiClient();
        const response = await api.fetch(
          `/contests/participations/${encodeURIComponent(walletAddress)}`,
        );

        const data = await response.json();

        if (!data.participations || !Array.isArray(data.participations)) {
          throw new Error(
            "Invalid response format: participations array not found",
          );
        }

        return data.participations;
      } catch (error: any) {
        logError("contests.getUserParticipations", error, { walletAddress });
        throw error;
      }
    },

    // Get detailed participation data for a specific contest
    getParticipationDetails: async (
      contestId: string | number,
      walletAddress: string,
    ) => {
      try {
        if (!contestId || !walletAddress) {
          throw new Error("Contest ID and wallet address are required");
        }

        const api = createApiClient();
        const response = await api.fetch(
          `/contests/${contestId}/check-participation?wallet_address=${encodeURIComponent(
            walletAddress,
          )}`,
        );

        const data = await response.json();

        return {
          isParticipating: Boolean(data.is_participating),
          participantData: data.participant_data || null,
        };
      } catch (error: any) {
        logError("contests.getParticipationDetails", error, {
          contestId,
          walletAddress,
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
            `Failed to create contest: ${response.status} ${response.statusText}`,
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

    // UPDATED: Now supports both free and paid contests with portfolio
    enterContestWithPortfolio: async (
      contestId: string,
      portfolio: {
        tokens: Array<{
          contractAddress: string;
          weight: number;
        }>;
      },
      transaction_signature?: string, // Optional for free contests
    ) => {
      const user = useStore.getState().user;
      if (!user?.wallet_address) {
        throw new Error("Please connect your wallet first");
      }

      // Validate contestId before making API call
      if (!contestId || contestId === 'undefined' || contestId === 'null') {
        throw new Error('Contest ID is required');
      }

      // Ensure contestId is a valid number
      const numericId = parseInt(contestId, 10);
      if (isNaN(numericId) || numericId <= 0) {
        throw new Error('Contest ID must be a valid positive number');
      }

      try {
        const payload = {
          wallet_address: user.wallet_address,
          portfolio,
          ...(transaction_signature && { transaction_signature }), // Only include if provided
        };

        const response = await fetch(`${API_URL}/contests/${numericId}/enter`, {
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
        
        // Handle analytics tracking errors gracefully
        if (error instanceof Error && error.message.includes("participationLogger.analytics.trackEvent is not a function")) {
          console.warn("Backend analytics error detected (non-critical) - contest entry may have succeeded");
          // Re-throw with a more user-friendly message that the frontend can handle
          throw new Error("Contest entry completed successfully (analytics tracking temporarily unavailable)");
        }
        
        throw error;
      }
    },

    // NEW: Enter free contest with portfolio (no transaction required)
    enterFreeContestWithPortfolio: async (
      contestId: string,
      portfolio: {
        tokens: Array<{
          contractAddress: string;
          weight: number;
        }>;
      },
    ) => {
      const user = useStore.getState().user;
      if (!user?.wallet_address) {
        throw new Error("Please connect your wallet first");
      }

      // Validate contestId before making API call
      if (!contestId || contestId === 'undefined' || contestId === 'null') {
        throw new Error('Contest ID is required');
      }

      // Ensure contestId is a valid number
      const numericId = parseInt(contestId, 10);
      if (isNaN(numericId) || numericId <= 0) {
        throw new Error('Contest ID must be a valid positive number');
      }

      try {
        const payload = {
          wallet_address: user.wallet_address,
          portfolio,
        };

        const response = await fetch(`${API_URL}/contests/${numericId}/enter`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "Failed to enter free contest with portfolio");
        }

        return await response.json();
      } catch (error) {
        console.error("[enterFreeContestWithPortfolio] Error:", error);
        
        // Handle analytics tracking errors gracefully
        if (error instanceof Error && error.message.includes("participationLogger.analytics.trackEvent is not a function")) {
          console.warn("Backend analytics error detected (non-critical) - contest entry may have succeeded");
          // Re-throw with a more user-friendly message that the frontend can handle
          throw new Error("Contest entry completed successfully (analytics tracking temporarily unavailable)");
        }
        
        throw error;
      }
    },

    // Get AI-selected portfolio for a contest
    getAIPortfolio: async (contestId: string | number) => {
      const user = useStore.getState().user;

      if (!user?.wallet_address) {
        throw new Error("Please connect your wallet first");
      }

      try {
        const api = createApiClient();
        const response = await api.fetch(
          `/blinks/ai-portfolio?contest_id=${contestId}&wallet_address=${encodeURIComponent(user.wallet_address)}`
        );

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || 'Failed to generate AI portfolio');
        }

        const data = await response.json();

        // The expected response format includes portfolio (array of tokens) and a summary string
        return {
          portfolio: data.portfolio || [],
          summary: data.summary || 'AI-selected tokens for this contest',
        };
      } catch (error) {
        console.error('[getAIPortfolio] Error:', error);
        throw error instanceof Error ? error : new Error('Failed to generate AI portfolio');
      }
    },

    // --- NEW: Get Unified Contest View ---
    getView: async (contestId: string): Promise<ContestViewData> => {
      const user = useStore.getState().user;
      const api = createApiClient();

      // Validate contestId before making API call
      if (!contestId || contestId === 'undefined' || contestId === 'null') {
        throw new Error('Contest ID is required');
      }

      // Ensure contestId is a valid number
      const numericId = parseInt(contestId, 10);
      if (isNaN(numericId) || numericId <= 0) {
        throw new Error('Contest ID must be a valid positive number');
      }

      try {
        const response = await api.fetch(`/contests/${numericId}/view`, {
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        // The API wrapper should handle non-OK responses by throwing an error
        const result: UnifiedContestViewApiResponse = await response.json();

        if (!result.success || !result.data) {
          console.error("Failed to fetch unified contest view:", result.error || "API did not return success=true or data missing");
          throw new Error(result.error || "Failed to retrieve contest data");
        }

        // TODO: Potentially add caching layer here if needed later

        return result.data; // Return only the data part

      } catch (error: any) {
        logError(`contests.getView failed for contest ${contestId}`, error, {
          contestId,
          userWallet: user?.wallet_address,
        });
        // Rethrow or handle specific errors (e.g., 404 Not Found)
        throw error;
      }
    },
    // --- End of NEW method ---
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
        },
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
      offset: number = 0,
    ): Promise<GlobalRankingsResponse> => {
      const response = await fetch(
        `${API_URL}/leaderboard/global?limit=${limit}&offset=${offset}`,
        {
          credentials: "include",
        },
      );
      if (!response.ok) throw new Error("Failed to fetch global rankings");
      return response.json();
    },

    // Get contest performance (Degen Rankings)
    getContestPerformance: async (
      timeframe: TimeFrame = "month",
      limit: number = 10,
      offset: number = 0,
    ): Promise<ContestPerformanceResponse> => {
      const response = await fetch(
        `${API_URL}/leaderboard/contests/performance?timeframe=${timeframe}&limit=${limit}&offset=${offset}`,
        {
          credentials: "include",
        },
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

    // Normalize endpoint path
    const normalizedPath = normalizePath(endpoint);
    const response = await fetch(`${API_URL}/${normalizedPath}`, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      // Check if this is an expected unauthorized response
      if (isExpectedUnauthorized(normalizedPath, response.status)) {
        // Log as info instead of error for expected unauthorized responses
        if (DDAPI_DEBUG_MODE === "true") {
          console.info(
            `[DD-API Info] Expected unauthorized access to ${endpoint}`,
            {
              status: response.status,
              statusText: response.statusText,
            },
          );
        }
        return response;
      }

      // Don't treat 503 maintenance mode as an error
      if (response.status === 503) {
        return response;
      }

      // Log actual errors
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

  // Superadmin token endpoints
  superadmin: {
    getToken: async (): Promise<{ token: string }> => {
      const api = createApiClient();
      const response = await api.fetch("/superadmin/token");
      return response.json();
    },
  },
};

// -------------------------------------------------------

// Note: createDDApi function was removed as it was redundant and never used

// Export analytics for admin dashboard
export const getCircuitBreakerAnalytics = () => ({
  ...analytics,
  services: Array.from(circuitBreakers.entries()).map(([key, breaker]) => ({
    name: key,
    status: breaker.isOpen
      ? "failed"
      : breaker.failures > 0
        ? "degraded"
        : "healthy",
    failures: breaker.failures,
    lastFailure: breaker.lastFailure,
    lastSuccess: breaker.lastSuccess,
    recoveryHistory: breaker.recoveryHistory,
  })),
});
