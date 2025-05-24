// src/services/terminalDataService.ts

// FUCK THIS FILE!!!!!!!!!  SO FUCKING ANNOYING  CHECK AI SERVICE TOO

/**
 * Terminal Data Service
 * 
 * @description This service fetches all terminal data from the backend to ensure
 * accurate and consistent information across the application.
 * 
 * V69 UPDATE: Now integrated with WebSocket for real-time updates.
 * 
 * V69 FOLLOW UP: The status of this file is unclear because we've had some setbacks with the web socket implementation although some of it works some of it doesn't the fact is we do not use web socketconnections on the back end with the streaming responsesso if you're getting streaming thenjust use this unless there's a newer ....nt one yeah this is so **** confusing
 * just use this unless there's a newer replacement one yeah this is so **** confusing 
 * 
 * @author BranchManager69
 * @version 1.8.5
 * @created 2025-04-14
 * @updated 2025-05-05
 */

import { API_URL } from "../config/config";
import { useTerminalData } from "../hooks/websocket";

// Minimal interface for AI chat terminal data only
export interface ChatTerminalData {
  // AI Chat system info
  platformName: string;
  platformDescription: string;
  platformStatus: string;

  // Available AI chat commands
  commands: Record<string, any>;

  // System status for AI chat availability
  systemStatus?: Record<string, string>;
}

// Terminal data interface (legacy - for backwards compatibility)
export interface TerminalData {
  // Platform info
  platformName: string;
  platformDescription: string;
  platformStatus: string;

  // Key features list
  features?: string[];

  // These fields are no longer used - all contract data comes from token.address
  // Left here for backward compatibility but will be removed in future versions
  _legacyContractAddress?: string;
  _legacyContractAddressRevealed?: boolean;

  // System status information from server
  systemStatus?: Record<string, string>;

  // Statistics
  stats: {
    currentUsers: number | null;
    upcomingContests: number | null;
    totalPrizePool: string;
    platformTraffic: string;
    socialGrowth: string;
    waitlistUsers: number | null;
  };

  // Token info
  token: {
    symbol: string;
    totalSupply: number | null;
    initialCirculating: number | null;
    communityAllocation: string;
    teamAllocation: string;
    treasuryAllocation: string;
    initialPrice: string;
    marketCap: string;
    liquidityLockPeriod: string;
    networkType: string;
    tokenType: string;
    decimals: number | null;
    address?: string; // Backend sends the contract address here
  };

  // Launch info
  launch: {
    method: string;
    platforms: string[];
    privateSaleStatus: string;
    publicSaleStatus: string;
    kycRequired: boolean;
    minPurchase: string;
    maxPurchase: string;
  };

  // Roadmap
  roadmap: Array<{
    quarter: string;
    year: string;
    title: string;
    details: string[];
  }>;

  // Commands
  commands: Record<string, string>;
}

// Export the hook for components that want to use the WebSocket
export { useTerminalData }; // TODO: WHAT IS THIS????????????

// Minimal fallback data if API completely fails (contains only placeholders)
const DEFAULT_TERMINAL_DATA: TerminalData = {
  platformName: "[Platform information unavailable]",
  platformDescription: "[No description available]",
  platformStatus: "[Status information unavailable]",
  features: ["[Features unavailable]"],
  _legacyContractAddress: undefined,
  _legacyContractAddressRevealed: false,

  stats: {
    currentUsers: null,
    upcomingContests: null,
    totalPrizePool: "[Unavailable]",
    platformTraffic: "[Traffic data unavailable]",
    socialGrowth: "[Social data unavailable]",
    waitlistUsers: null
  },

  token: {
    symbol: "[?]",
    totalSupply: null,
    initialCirculating: null,
    communityAllocation: "[?]",
    teamAllocation: "[?]",
    treasuryAllocation: "[?]",
    initialPrice: "[?]",
    marketCap: "[?]",
    liquidityLockPeriod: "[?]",
    networkType: "[?]",
    tokenType: "[?]",
    decimals: null
  },

  launch: {
    method: "[Unavailable]",
    platforms: [],
    privateSaleStatus: "[Unavailable]",
    publicSaleStatus: "[Unavailable]",
    kycRequired: false, // Can't be null - must be boolean
    minPurchase: "[Unavailable]",
    maxPurchase: "[Unavailable]"
  },

  roadmap: [
    {
      quarter: "[?]",
      year: "[?]",
      title: "[Roadmap unavailable]",
      details: ["Unable to load roadmap information"]
    }
  ],

  // These are soooo bland
  commands: {
    help: "Available commands: help, status, info, contract, stats, clear, banner\nAI: Type any question to speak with the AI assistant.",
    status: "Platform status: Fetching from server...",
    info: "DegenDuel: Fetching information from server...",
    contract: "Contract address information unavailable. Please try again later.",
    stats: "Fetching statistics from server...",
    roadmap: "Fetching roadmap from server...",
    tokenomics: "Fetching tokenomics from server...",
    "launch-details": "Fetching launch details from server...",
    analytics: "Fetching analytics from server...",
    clear: "",
    token: "Fetching token information from server..."
  }
};

// Cached terminal data
const CACHE_PERIOD = 0; // 0 minutes
const CACHE_TTL = CACHE_PERIOD * 60 * 1000; // People will revolt if they don't get the token address exactly at the scheduled time.
let lastFetchTime = 0;
let cachedTerminalData: TerminalData | null = null;

/**
 * @description This is the maximum number of retries for terminal data fetch.
 */
const MAX_RETRIES = 3;

/**
 * @description This is the flag to track if terminal data is currently being fetched. This prevents multiple parallel fetch attempts.
 */
let isFetchingTerminalData = false;

/**
 * @description Tracks the last API error time to implement cooldown logic
 */
let lastErrorTime = 0;

/**
 * @description Cooldown period after errors (in milliseconds) - starts with 5 seconds but increases exponentially
 */
let errorCooldownPeriod = 5000;

/**
 * @description Debounce timer for fetch requests
 */
let fetchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

// Global state for circuit breaker
let circuitBreakerOpen = false;
let consecutiveFailures = 0;
let lastFailureTime = 0;
const CIRCUIT_BREAKER_THRESHOLD = 3;
const CIRCUIT_BREAKER_TIMEOUT = 60000; // 60 seconds

// Reset circuit breaker after successful request
const resetCircuitBreaker = () => {
  circuitBreakerOpen = false;
  consecutiveFailures = 0;
  lastFailureTime = 0;
};

// Check if circuit breaker should open
const checkCircuitBreaker = () => {
  const now = Date.now();

  // If circuit breaker is open, check if timeout has passed
  if (circuitBreakerOpen) {
    if (now - lastFailureTime > CIRCUIT_BREAKER_TIMEOUT) {
      console.log('[TerminalDataService] Circuit breaker timeout passed, resetting');
      resetCircuitBreaker();
      return false; // Allow request
    }
    return true; // Circuit breaker still open
  }

  return false; // Circuit breaker closed
};

// Record failure and potentially open circuit breaker
const recordFailure = () => {
  consecutiveFailures++;
  lastFailureTime = Date.now();

  if (consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitBreakerOpen = true;
    console.error(`[TerminalDataService] Circuit breaker opened after ${CIRCUIT_BREAKER_THRESHOLD} failures - backing off for ${CIRCUIT_BREAKER_TIMEOUT / 1000}s`);
  }
};

/**
 * @description Debounced fetchTerminalData implementation
 * This function returns a promise that resolves with terminal data, but automatically
 * debounces multiple close calls to prevent API flooding.
 * 
 * @returns Promise that resolves to the TerminalData
 */
export const fetchTerminalData = async (): Promise<TerminalData> => {
  const now = Date.now();

  // Check circuit breaker first
  if (checkCircuitBreaker()) {
    console.warn('[TerminalDataService] Circuit breaker open - using cached data or default');
    return cachedTerminalData || DEFAULT_TERMINAL_DATA;
  }

  // Return cached data if it's still fresh
  //   TODO: Entirely replace with a WSS event instead
  if (cachedTerminalData && (now - lastFetchTime < CACHE_TTL)) {
    return cachedTerminalData;
  }

  // If we're in error cooldown period, return cached data or default
  const timeSinceLastError = now - lastErrorTime;
  if (lastErrorTime > 0 && timeSinceLastError < errorCooldownPeriod) {
    console.log(`[TerminalDataService] In error cooldown (${Math.ceil((errorCooldownPeriod - timeSinceLastError) / 1000)}s remaining), using cached data`);
    return cachedTerminalData || DEFAULT_TERMINAL_DATA;
  }

  // If already fetching, return cached data or default
  if (isFetchingTerminalData) {
    return cachedTerminalData || DEFAULT_TERMINAL_DATA;
  }

  // Create a promise that will resolve with actual data
  return new Promise<TerminalData>((resolve) => {
    // Clear any pending debounce timer
    if (fetchDebounceTimer) {
      clearTimeout(fetchDebounceTimer);
    }

    // Set up a new debounce timer
    fetchDebounceTimer = setTimeout(async () => {
      // Only proceed if not already fetching 
      if (isFetchingTerminalData) {
        resolve(cachedTerminalData || DEFAULT_TERMINAL_DATA);
        return;
      }

      // Set fetching flag
      isFetchingTerminalData = true;

      try {
        // API endpoint for fetching terminal data
        const endpoint = `${API_URL}/terminal/terminal-data`;
        const result = await fetchWithRetry(endpoint);

        // Update cache with new data
        if (result && result.success) {
          cachedTerminalData = result.terminalData;
          lastFetchTime = Date.now();

          // Reset error cooldown and circuit breaker on success
          lastErrorTime = 0;
          errorCooldownPeriod = 5000; // Reset to initial value
          resetCircuitBreaker();

          resolve(result.terminalData);
        } else {
          // Record failure for circuit breaker
          recordFailure();

          // Only warn once per session if API returns unsuccessful response
          if (!window.terminalDataWarningShown) {
            console.warn('[TerminalDataService] Terminal data not available from API, using default');
            window.terminalDataWarningShown = true;
          }
          resolve(DEFAULT_TERMINAL_DATA);
        }
      } catch (error) {
        // Record failure for circuit breaker
        recordFailure();

        // Keep existing error handling
        console.error('[TerminalDataService] Error fetching terminal data after multiple retries');

        if (!window.terminalDataErrorCount) {
          window.terminalDataErrorCount = 0;
        }

        // Log error rate limiting
        window.terminalDataErrorCount++;
        if (window.terminalDataErrorCount < 3 || window.terminalDataErrorCount % 10 === 0) {
          console.error('[TerminalDataService] Fetch error details:', {
            error: error instanceof Error ? error.message : String(error),
            attemptNumber: window.terminalDataErrorCount
          });
        }

        // Set error time and increase cooldown
        lastErrorTime = Date.now();
        errorCooldownPeriod = Math.min(errorCooldownPeriod * 2, 60000); // Cap at 60 seconds

        resolve(DEFAULT_TERMINAL_DATA);
      } finally {
        isFetchingTerminalData = false;
      }
    }, 500); // Reduced debounce from potentially long delays to 500ms
  });
};

/**
 * @description This is the function to fetch with retry and exponential backoff.
 * @param url URL to fetch from
 * @param retries Number of retries remaining
 * @param delay Delay before next retry in ms
 * @returns Promise that resolves to the API response
 */
async function fetchWithRetry(url: string, retries = MAX_RETRIES, delay = 1000): Promise<any> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout

    // Fetch the data
    //   TODO: Entirely replace with a WSS event instead
    const response = await fetch(url, {
      signal: controller.signal,
      credentials: 'same-origin',
      headers: {
        'Cache-Control': 'no-cache',
      }
    });

    // Clear the timeout
    clearTimeout(timeoutId);

    // If the response is not ok, throw an error
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
    }

    // Return the JSON response
    return await response.json();
  } catch (error) {
    // If retries are exhausted, throw the error
    if (retries <= 0) {
      throw error;
    }

    // Only log first retry attempt to reduce console spam
    if (retries === MAX_RETRIES) {
      console.warn(`[TerminalDataService] Fetch attempt failed, retrying in ${delay}ms...`);
    }

    // Implement exponential backoff
    await new Promise(resolve => setTimeout(resolve, delay));

    // Retry with decreased retries count and increased delay
    return fetchWithRetry(url, retries - 1, delay * 2); // Increase to 2x for more aggressive backoff
  }
}

/**
 * @description This is the function to format terminal commands based on data from the API.
 * @param data The terminal data
 * @returns Formatted command map
 */
export const formatTerminalCommands = (data: ChatTerminalData): Record<string, string> => {
  const commands: Record<string, string> = {
    help: `Available commands: help, status, info, clear, banner\nAI: Type any question to speak with the AI assistant.`,
    clear: "",
    banner: `
========================================
 D E G E N D U E L   T E R M I N A L 
               v6.9
========================================
 - ${data.platformDescription || "AI Chat Terminal"} -
 Type 'help' for available commands
`
  };

  // Status command - AI chat system status
  if (data.systemStatus) {
    commands.status = `━━━━━━━━━━━━━━━━ AI CHAT STATUS ━━━━━━━━━━━━━━━━\n\n${Object.entries(data.systemStatus || {}).map(([key, value]) => {
      return `• ${key}: ${value}`;
    }).join('\n')}\n\n${data.platformStatus}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  } else {
    commands.status = `━━━━━━━━━━━━━━━━ AI CHAT STATUS ━━━━━━━━━━━━━━━━\n\n${data.platformStatus}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  }

  // Info command - AI chat terminal info
  commands.info = `━━━━━━━━━━━━━━━━ ${data.platformName.toUpperCase()} AI TERMINAL ━━━━━━━━━━━━━━━━\n\n${data.platformDescription}\n\nType any question to chat with the AI assistant.\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  // Add any custom AI commands from the WebSocket
  if (data.commands) {
    Object.assign(commands, data.commands);
  }

  return commands;
};
