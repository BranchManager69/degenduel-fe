// src/services/terminalDataService.ts

// FUCK THIS FILE!!!!!!!!!  SO FUCKING ANNOYING  CHECK AI SERVICE TOO

/**
 * Terminal Data Service
 * 
 * @description This service fetches all terminal data from the backend to ensure
 * accurate and consistent information across the application.
 * 
 * V69 UPDATE: Now integrated with WebSocket for real-time updates.
 * V69 FOLLOW UP: The status of this file is unclear because we've had some setbacks with the web socket implementation although some of it works some of it doesn't the fact is we do not use web socketconnections on the back end with the streaming responsesso if you're getting streaming thenjust use this unless there's a newer ....nt one yeah this is so **** confusing
 * just use this unless there's a newer replacement one yeah this is so **** confusing 
 * 
 * 
 * @author BranchManager69
 * @version 1.8.5
 * @created 2025-04-14
 * @updated 2025-05-05
 */

import { API_URL } from "../config/config";
import { useTerminalData } from "../hooks/websocket";

// Terminal data interface
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
 * @description Max cooldown period (5 minutes)
 */
const MAX_COOLDOWN_PERIOD = 5 * 60 * 1000;

/**
 * @description Debounce timer for fetch requests
 */
let fetchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * @description Debounced fetchTerminalData implementation
 * This function returns a promise that resolves with terminal data, but automatically
 * debounces multiple close calls to prevent API flooding.
 * 
 * @returns Promise that resolves to the TerminalData
 */
export const fetchTerminalData = async (): Promise<TerminalData> => {
  const now = Date.now();
  
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
          
          // Reset error cooldown on success
          lastErrorTime = 0;
          errorCooldownPeriod = 5000; // Reset to initial value
          
          resolve(result.terminalData);
        } else {
          // Only warn once per session if API returns unsuccessful response
          if (!window.terminalDataWarningShown) {
            console.warn('[TerminalDataService] Terminal data not available from API, using default');
            window.terminalDataWarningShown = true;
          }
          resolve(DEFAULT_TERMINAL_DATA);
        }
      } catch (error) {
        // Error handling after all retries have failed
        // Limit repetitive error messages
        if (!window.terminalDataErrorCount) {
          window.terminalDataErrorCount = 0;
        }
        
        // Only log first few errors, then reduce frequency
        if (window.terminalDataErrorCount < 3 || window.terminalDataErrorCount % 10 === 0) {
          console.error('[TerminalDataService] Error fetching terminal data after multiple retries');
        }
        
        // Increment the error count
        window.terminalDataErrorCount++;
        
        // Set error cooldown
        lastErrorTime = Date.now();
        
        // Increase cooldown period exponentially, capped at MAX_COOLDOWN_PERIOD
        errorCooldownPeriod = Math.min(errorCooldownPeriod * 2, MAX_COOLDOWN_PERIOD);
        
        resolve(DEFAULT_TERMINAL_DATA);
      } finally {
        // Reset fetching flag
        isFetchingTerminalData = false;
      }
    }, 300); // Debounce period - 300ms is a good balance
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
export const formatTerminalCommands = (data: TerminalData): Record<string, string> => {
  // Start with built-in commands
  const commands: Record<string, string> = {
    help: `Available commands: help, status, info, contract, stats, roadmap, tokenomics, launch-details, token, analytics, clear, banner
AI: Type any question to speak with the AI assistant.`,
    clear: "",
    banner: `
  _____  ______ _____ ______ _   _     _____  _    _ ______ _      
 |  __ \\|  ____/ ____|  ____| \\ | |   |  __ \\| |  | |  ____| |     
 | |  | | |__ | |  __| |__  |  \\| |   | |  | | |  | | |__  | |     
 | |  | |  __|| | |_ |  __| | . \` |   | |  | | |  | |  __| | |     
 | |__| | |___| |__| | |____| |\\  |   | |__| | |__| | |____| |____ 
 |_____/|______\\_____|______|_| \\_|   |_____/ \\____/|______|______|
 
 - ${data.platformDescription} -
 
 Type 'help' for available commands
`
  };
  
  // Status command - rely on server for system status
  // Check if we have systemStatus data
  if (data.systemStatus) {
    commands.status = `━━━━━━━━━━━━━━━━ SYSTEM STATUS ━━━━━━━━━━━━━━━━

${Object.entries(data.systemStatus || {}).map(([key, value]) => {
  // Each status item comes from server with its icon
  return `• ${key}: ${value}`;
}).join('\n')}

${data.platformStatus}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  } else {
    // Fallback if no systemStatus provided
    commands.status = `━━━━━━━━━━━━━━━━ SYSTEM STATUS ━━━━━━━━━━━━━━━━

${data.platformStatus}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  }
  
  // Info command
  commands.info = `━━━━━━━━━━━━━━━━ ${data.platformName.toUpperCase()} PLATFORM ━━━━━━━━━━━━━━━━

${data.platformDescription}

${data.features && data.features.length > 0 ? 
  `Key features:
${data.features.map(feature => `• ${feature}`).join('\n')}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  
  // Stats command
  commands.stats = `━━━━━━━━━━━━━━━━━ PLATFORM STATS ━━━━━━━━━━━━━━━━━
Current users: ${data.stats.currentUsers}
Upcoming contests: ${data.stats.upcomingContests}
Total prize pool: ${data.stats.totalPrizePool}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  
  // Roadmap command
  commands.roadmap = `━━━━━━━━━━━━━━━━ ${data.platformName.toUpperCase()} ROADMAP ━━━━━━━━━━━━━━━━

${data.roadmap.map(phase => {
    return `• ${phase.quarter} ${phase.year}: ${phase.title}
  ${phase.details.map(detail => `↳ ${detail}`).join('\n  ')}`;
}).join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  
  // Tokenomics command
  commands.tokenomics = `━━━━━━━━━━━━━━━━ $${data.token.symbol} TOKENOMICS ━━━━━━━━━━━━━━━━

• Total supply: ${data.token.totalSupply ? data.token.totalSupply.toLocaleString() : "N/A"} $${data.token.symbol}
• Initial circulating: ${data.token.initialCirculating ? data.token.initialCirculating.toLocaleString() : "N/A"} $${data.token.symbol}
• Initial price: ${data.token.initialPrice}

Allocation:
• Community: ${data.token.communityAllocation}
• Team: ${data.token.teamAllocation}
• Treasury: ${data.token.treasuryAllocation}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  
  // Launch details command
  commands["launch-details"] = `━━━━━━━━━━━━━━━━ $${data.token.symbol} TOKEN LAUNCH ━━━━━━━━━━━━━━━━

• Launch method: ${data.launch.method}
• Initial price: ${data.token.initialPrice}
• Liquidity lock: ${data.token.liquidityLockPeriod}
• Initial market cap: ${data.token.marketCap}
• Launch platforms: ${data.launch.platforms.join(', ')}
• Private sale: ${data.launch.privateSaleStatus}
• Public IDO: ${data.launch.publicSaleStatus}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  
  // Analytics command
  commands.analytics = `━━━━━━━━━━━━━━━━ PLATFORM ANALYTICS ━━━━━━━━━━━━━━━━

• Platform traffic: ${data.stats.platformTraffic}
• Social metrics: ${data.stats.socialGrowth}
• Waitlist: ${data.stats.waitlistUsers} users

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  
  // Token command
  commands.token = `━━━━━━━━━━━━━━━━ $${data.token.symbol} TOKEN INFO ━━━━━━━━━━━━━━━━

• Name: ${data.platformName} Token
• Symbol: $${data.token.symbol}
• Network: ${data.token.networkType}
• Token Type: ${data.token.tokenType}
• Decimals: ${data.token.decimals}

Type 'tokenomics' for detailed token distribution.
Type 'launch-details' for information about the token launch.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  // Contract command - dynamically show based on token.address from API
  // The only source of truth for contract address is now token.address
  const contractAddress = data.token.address;
  const isContractRevealed = !!contractAddress;
  
  if (isContractRevealed) {
    // When the contract address is revealed, show the actual address
    commands.contract = `━━━━━━━━━━━━━━━━ $${data.token.symbol} CONTRACT ADDRESS ━━━━━━━━━━━━━━━━

✅ CONTRACT REVEALED ✅

Official contract address: ${contractAddress}

WARNING: Only use this official contract address. Always verify on the blockchain explorer.

Type 'token' to learn more about the $${data.token.symbol} token.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  } else {
    // Default state - contract not yet revealed
    commands.contract = `━━━━━━━━━━━━━━━━ $${data.token.symbol} CONTRACT ADDRESS ━━━━━━━━━━━━━━━━

⌛ PENDING REVEAL ⌛

The official contract address will be automatically revealed when the countdown reaches zero.

WARNING: Beware of scam addresses shared before the official reveal. Only trust the address displayed in this terminal when the countdown completes.

Type 'token' to learn more about the $${data.token.symbol} token.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  }
  
  // Add any custom commands that came from the API
  return { ...commands, ...data.commands };
};
