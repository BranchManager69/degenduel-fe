import { API_URL } from "../../config/config";
import { useStore } from "../../store/useStore";

/**
 * DEPRECATION NOTICE:
 * This file is being phased out in favor of centralizing API utilities in src/services/dd-api.ts.
 * All utilities in this file should be considered deprecated and will be removed in a future update.
 *
 * For participation checking, use the standardized checkContestParticipation from dd-api.ts
 * For API client creation, use createApiClient from dd-api.ts
 */

export const logError = (
  endpoint: string,
  error: any,
  context?: Record<string, any>,
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

// Import the actual implementation from dd-api.ts
import { ddApi } from "../../services/dd-api";

/**
 * @deprecated Use checkContestParticipation from dd-api.ts instead
 */
export const checkContestParticipation = async (
  contestId: number | string,
  userWallet?: string,
): Promise<boolean> => {
  console.warn(
    "Using deprecated checkContestParticipation from utils.ts. Please update to use the version from dd-api.ts",
  );

  // Forward to the canonical implementation
  return await ddApi.contests
    .getParticipationDetails(contestId, userWallet || "")
    .then((result) => result.isParticipating)
    .catch(() => false);
};

/**
 * @deprecated Use createApiClient from dd-api.ts instead
 */
export const createApiClient = () => {
  console.warn(
    "Using deprecated createApiClient from utils.ts. Please update to use the version from dd-api.ts",
  );

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
          errorData.message || `API Error: ${response.statusText}`,
        );
      }

      return response;
    },
  };
};
