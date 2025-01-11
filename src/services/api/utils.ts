import { API_URL } from "../../config/config";

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

    const response = await fetch(
      `${API_URL}/contests/${contestId}/portfolio/${userWallet}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Wallet-Address": userWallet,
        },
        credentials: "include",
        signal: controller.signal,
      }
    ).finally(() => clearTimeout(timeoutId));

    // If we get a 404 or any error status, user is not participating
    if (!response.ok) {
      participationCache.set(cacheKey, { result: false, timestamp: now });
      return false;
    }

    try {
      const data = await response.json();
      const result = !!(data?.tokens?.length > 0);
      participationCache.set(cacheKey, { result, timestamp: now });
      return result;
    } catch (e) {
      participationCache.set(cacheKey, { result: false, timestamp: now });
      return false;
    }
  } catch (error: unknown) {
    // Don't log timeout errors
    if (error instanceof Error && error.name !== "AbortError") {
      console.error("Error checking participation:", error);
    }
    participationCache.set(cacheKey, { result: false, timestamp: now });
    return false;
  }
};
