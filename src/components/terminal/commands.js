"use strict";
/**
 * Terminal command responses with feature flags
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.commandMap = void 0;
// Feature flags to easily enable/disable command sets
var FEATURES = {
    CORE_COMMANDS: true,
    PLATFORM_INFO: true,
    EASTER_EGGS: false,
    UPCOMING_FEATURES: false,
    TIME_GATED: true
};
// Core commands that are always available
var coreCommands = {
    help: "Available commands: help, status, info, contract, stats, clear\nAI: Type any question to speak with the AI assistant.",
    status: "Platform status: Ready for launch on scheduled date.",
    clear: ""
};
// Platform information commands
var platformCommands = {
    info: "DegenDuel: Next-generation competitive crypto trading platform.",
    contract: "Contract address will be revealed at launch.",
    stats: "Current users: 0\nUpcoming contests: 3\nTotal prize pool: $50,000",
    roadmap: "DegenDuel Roadmap:\n• Q2 2025: Platform launch\n• Q3 2025: Tournament system\n• Q4 2025: Mobile app\n• Q1 2026: Cross-chain expansion"
};
// Easter egg commands (disabled by default)
var easterEggCommands = {
    "dd-debug": "Developer mode activated. Welcome, team member.",
    "branch-mode": "Branch Manager special access granted. Unique identifier: BM-69420",
    "lambo-when": "According to our calculations, approximately 741 days after launch."
};
// Upcoming feature teasers (disabled by default)
var upcomingCommands = {
    "preview-tournaments": "Tournament system preview: Users will compete in time-limited trading contests with prize pools.",
    "preview-staking": "Staking preview: Lock $DUEL tokens to earn platform fees and exclusive benefits.",
    "preview-governance": "Governance preview: $DUEL holders will vote on platform upgrades and feature prioritization."
};
// Time-gated commands that reveal more info closer to launch
var timeGatedCommands = {
    "tokenomics": "DUEL token:\n• Total supply: 100,000,000\n• Initial circulating: 20,000,000\n• Community allocation: 50%\n• Team (locked): 15%\n• Treasury: 35%",
    "launch-details": "Launch method: Initial DEX Offering\nInitial price: $0.10\nLiquidity lock: 12 months\nInitial market cap: $2M",
    "analytics": "Platform traffic: Increasing 23% week over week\nSocial growth: Twitter +5.2K followers this week\nWaitlist: 12,500 users"
};
// Combine all enabled command sets
exports.commandMap = __assign(__assign(__assign(__assign(__assign({}, coreCommands), (FEATURES.PLATFORM_INFO ? platformCommands : {})), (FEATURES.EASTER_EGGS ? easterEggCommands : {})), (FEATURES.UPCOMING_FEATURES ? upcomingCommands : {})), (FEATURES.TIME_GATED ? timeGatedCommands : {}));
