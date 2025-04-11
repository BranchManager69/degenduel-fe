/**
 * Terminal command responses loaded from server
 * 
 * This file now uses the terminalDataService to load all terminal data
 * from a centralized server endpoint.
 */

import { fetchTerminalData, formatTerminalCommands } from '../../services/terminalDataService';

// Default commands to use while loading from the server
export const defaultCommandMap: Record<string, string> = {
  help: "Available commands: help, status, info, contract, stats, clear, banner\nAI: Type any question to speak with the AI assistant.",
  status: "Platform status: Loading from server...",
  info: "DegenDuel: Loading information from server...",
  contract: "Contract address will be revealed at launch.",
  stats: "Loading statistics from server...",
  roadmap: "Loading roadmap from server...",
  tokenomics: "Loading tokenomics from server...",
  "launch-details": "Loading launch details from server...",
  analytics: "Loading analytics from server...",
  clear: "", // Special case handled in Terminal.tsx
  banner: `
  _____  ______ _____ ______ _   _     _____  _    _ ______ _      
 |  __ \\|  ____/ ____|  ____| \\ | |   |  __ \\| |  | |  ____| |     
 | |  | | |__ | |  __| |__  |  \\| |   | |  | | |  | | |__  | |     
 | |  | |  __|| | |_ |  __| | . \` |   | |  | | |  | |  __| | |     
 | |__| | |___| |__| | |____| |\\  |   | |__| | |__| | |____| |____ 
 |_____/|______\\_____|______|_| \\_|   |_____/ \\____/|______|______|
 
 - Loading terminal data... -
 
 Type 'help' for available commands
`,
  token: "Loading token information from server...",
  "dd-debug": "Developer mode activated. Welcome, team member.",
  "branch-mode": "Branch Manager special access granted. Unique identifier: BM-69420",
  "lambo-when": "According to calculations, TBD days after launch. Checking markets..."
};

// Initial command map starts with defaults while we fetch from server
export let commandMap = { ...defaultCommandMap };

// Immediately start loading terminal data when this module is imported
(async () => {
  try {
    console.log('[Terminal Commands] Loading terminal data from server...');
    const terminalData = await fetchTerminalData();
    commandMap = formatTerminalCommands(terminalData);
    console.log('[Terminal Commands] Terminal data loaded successfully');
  } catch (error) {
    console.error('[Terminal Commands] Error loading terminal data:', error);
    console.log('[Terminal Commands] Using default command responses');
  }
})();