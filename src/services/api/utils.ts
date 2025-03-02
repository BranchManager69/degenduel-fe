import { API_URL } from "../../config/config";
import { useStore } from "../../store/useStore";

/**
 * WARNING:
 * This file is a mess.
 * I have suspicions that it is causing duplicative api clients
 * Not to mention it seems it could be causing contest participation checks to trigger on every page load for every contest to ever exist.
 * Refer to getUserParticipations in src/services/dd-api.ts for a more efficient way to check contest participation.
 *
 * PURPOSE:
 * This file contains utility functions for the API.
 * It is used to check if a user is participating in a contest, and to create an API client.
 *
 */

export const logError = (
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

export const formatBonusPoints = (points: string | number): string => {
  const amount = typeof points === "string" ? parseInt(points) : points;
  return `${amount.toLocaleString()} pts`;
};

// Participation checking utilities
const participationCache = new Map<
  string,
  { result: boolean; timestamp: number }
>();
const CACHE_DURATION = 30000; // 30 seconds
const FETCH_TIMEOUT = 5000; // 5 second timeout for fetch requests

export const checkContestParticipation = async (
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

    // Use the new dedicated endpoint for checking participation
    const response = await fetch(
      `${API_URL}/contests/${contestId}/check-participation?wallet_address=${encodeURIComponent(
        userWallet
      )}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        signal: controller.signal,
      }
    ).finally(() => clearTimeout(timeoutId));

    // If we get a 404 or any error status, log detailed information before assuming non-participation
    if (!response.ok) {
      try {
        const errorText = await response.text();
        console.warn(
          `Participation check failed for contest ${contestId}, wallet ${userWallet}: HTTP ${response.status}`,
          {
            endpoint: `${API_URL}/contests/${contestId}/check-participation`,
            statusText: response.statusText,
            responseText: errorText.substring(0, 200), // Truncate large responses
            headers: Object.fromEntries(response.headers),
          }
        );
      } catch (e) {
        // If we can't read the response, just log the status
        console.warn(
          `Participation check failed for contest ${contestId}, wallet ${userWallet}: HTTP ${response.status}`
        );
      }

      participationCache.set(cacheKey, { result: false, timestamp: now });
      return false;
    }

    try {
      const data = await response.json();
      // Validate that response has the expected format
      if (data.is_participating === undefined) {
        console.warn(
          `Invalid participation response format for contest ${contestId}:`,
          data
        );
        participationCache.set(cacheKey, { result: false, timestamp: now });
        return false;
      }

      const result = Boolean(data.is_participating);
      participationCache.set(cacheKey, { result, timestamp: now });
      return result;
    } catch (e) {
      console.error(
        `Failed to parse participation response for contest ${contestId}:`,
        e
      );
      participationCache.set(cacheKey, { result: false, timestamp: now });
      return false;
    }
  } catch (error: unknown) {
    // Don't log timeout errors
    if (error instanceof Error && error.name !== "AbortError") {
      console.error(
        `Error checking participation for contest ${contestId}, wallet ${userWallet}:`,
        {
          error,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          endpoint: `${API_URL}/contests/${contestId}/check-participation`,
        }
      );
    }
    participationCache.set(cacheKey, { result: false, timestamp: now });
    return false;
  }
};

export const createApiClient = () => {
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

      // Check for ban status
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
