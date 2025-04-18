/**
 * Terminal Data Service
 * 
 * This service fetches all terminal data from the backend to ensure
 * accurate and consistent information across the application.
 * 
 * V69 UPDATE: Now integrated with WebSocket for real-time updates.
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
export { useTerminalData };

// Minimal fallback data if API completely fails - contains only placeholders
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
let cachedTerminalData: TerminalData | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

/**
 * Fetch terminal data from the backend
 * @returns Promise that resolves to the terminal data
 */
export const fetchTerminalData = async (): Promise<TerminalData> => {
  const now = Date.now();
  
  // Return cached data if it's still fresh
  if (cachedTerminalData && (now - lastFetchTime < CACHE_TTL)) {
    console.log('[TerminalDataService] Using cached terminal data');
    return cachedTerminalData;
  }
  
  // API endpoint for fetching terminal data
  const endpoint = `${API_URL}/terminal/terminal-data`;
  
  try {
    console.log(`[TerminalDataService] Fetching terminal data from endpoint: ${endpoint}`);
    
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`Error fetching terminal data: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      // Update cache
      cachedTerminalData = data.terminalData;
      lastFetchTime = now;
      
      console.log('[TerminalDataService] Terminal data fetched successfully');
      return data.terminalData;
    } else {
      console.warn('[TerminalDataService] Terminal data not available from API, using default');
      return DEFAULT_TERMINAL_DATA;
    }
  } catch (error) {
    console.error('[TerminalDataService] Error fetching terminal data:', error);
    console.log('[TerminalDataService] Using default terminal data');
    return DEFAULT_TERMINAL_DATA;
  }
};

/**
 * Format terminal commands based on data from the API
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