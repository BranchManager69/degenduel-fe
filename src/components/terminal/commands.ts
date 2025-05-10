/**
 * Terminal command responses loaded from server
 * 
 * // THIS DOES NOT WORK PROPERLY!
 * 
 * This file now uses the terminalDataService to load all terminal data
 * from a centralized server endpoint.
 */

import { fetchTerminalData, formatTerminalCommands } from '../../services/terminalDataService';

// Default commands to use while loading from the server
export const defaultCommandMap: Record<string, string> = {
  help: `Commands: you, are, gay \nDidi: Hi, I'm Didi, the DegenDuel AI. How may I help you retard?`,
  clear: ``, // Special case handled in Terminal.tsx

  // @ts-ignore - This is a special case for dynamic content
  banner: function getBanner() {
    // ASCII Art REMOVED. Replaced with a sleek text banner.
    // const isMobile = window.innerWidth < 768;
    // const isExtraSmall = window.innerWidth < 400;
    // const asciiArt = isExtraSmall ? 
    // `...` : isMobile ? 
    // `...` : 
    // `...`;
    
    // return `${asciiArt}\n \n - Loading terminal data... -\n \n Type 'help' for available commands`;
    return `
========================================
 D E G E N D U E L   T E R M I N A L 
               v6.9
========================================
 - Loading terminal data... -
 Type 'help' for available commands
`;
  },

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
    // formatTerminalCommands will create its own banner, potentially overwriting the default one.
    // We need to ensure formatTerminalCommands also doesn't use ASCII.
    commandMap = formatTerminalCommands(terminalData); 
    console.log('[Terminal Commands] Terminal data loaded successfully');
  } catch (error) {
    console.error('[Terminal Commands] Error loading terminal data:', error);
    console.log('[Terminal Commands] Using default command responses');
  }
})();