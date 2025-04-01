/**
 * Terminal command responses with feature flags
 */

// Feature flags to easily enable/disable command sets
const FEATURES = {
  CORE_COMMANDS: true,         // Basic essential commands
  PLATFORM_INFO: true,         // Platform-related information
  EASTER_EGGS: false,          // Easter egg hidden commands
  UPCOMING_FEATURES: false,    // Teaser for upcoming features
  TIME_GATED: true,            // Time-gated commands that unlock closer to launch
};

// Core commands that are always available
const coreCommands = {
  help: "Available commands: help, status, info, contract, stats, clear\nAI: Type any question to speak with the AI assistant.",
  status: "Platform status: Ready for launch on scheduled date.",
  clear: "", // Special case handled in Terminal.tsx
};

// Platform information commands
const platformCommands = {
  info: "DegenDuel: Next-generation competitive crypto trading platform.",
  contract: "Contract address will be revealed at launch.",
  stats: "Current users: 0\nUpcoming contests: 3\nTotal prize pool: $50,000",
  roadmap: "DegenDuel Roadmap:\n• Q2 2025: Platform launch\n• Q3 2025: Tournament system\n• Q4 2025: Mobile app\n• Q1 2026: Cross-chain expansion",
};

// Easter egg commands (disabled by default)
const easterEggCommands = {
  "dd-debug": "Developer mode activated. Welcome, team member.",
  "branch-mode": "Branch Manager special access granted. Unique identifier: BM-69420",
  "lambo-when": "According to our calculations, approximately 741 days after launch.", 
};

// Upcoming feature teasers (disabled by default)
const upcomingCommands = {
  "preview-tournaments": "Tournament system preview: Users will compete in time-limited trading contests with prize pools.",
  "preview-staking": "Staking preview: Lock $DUEL tokens to earn platform fees and exclusive benefits.",
  "preview-governance": "Governance preview: $DUEL holders will vote on platform upgrades and feature prioritization.",
};

// Time-gated commands that reveal more info closer to launch
const timeGatedCommands = {
  "tokenomics": "DUEL token:\n• Total supply: 100,000,000\n• Initial circulating: 20,000,000\n• Community allocation: 50%\n• Team (locked): 15%\n• Treasury: 35%",
  "launch-details": "Launch method: Initial DEX Offering\nInitial price: $0.10\nLiquidity lock: 12 months\nInitial market cap: $2M",
  "analytics": "Platform traffic: Increasing 23% week over week\nSocial growth: Twitter +5.2K followers this week\nWaitlist: 12,500 users",
};

// Combine all enabled command sets
export const commandMap: Record<string, string> = {
  ...coreCommands,
  ...(FEATURES.PLATFORM_INFO ? platformCommands : {}),
  ...(FEATURES.EASTER_EGGS ? easterEggCommands : {}),
  ...(FEATURES.UPCOMING_FEATURES ? upcomingCommands : {}),
  ...(FEATURES.TIME_GATED ? timeGatedCommands : {}),
};