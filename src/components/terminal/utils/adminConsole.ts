// src/components/terminal/utils/adminConsole.ts

/**
 * Admin console handler for the terminal
 * 
 * Provides access to hidden admin features for testing
 * 
 * @author Branch Manager
 * @version 1.9.0
 * @created 2025-04-01
 * @updated 2025-04-30
 */

import {
  addRandomHiddenMessages,
  getHiddenMessageCache,
  resetHiddenMessageCache
} from './easterEggHandler';

// Debugging
const DEBUG_DIDI = true;

// Command mapping for admin console commands
export const ADMIN_COMMANDS: Record<string, (args?: string) => string> = {
  '1': () => {
    // Show hint for easter egg
    return `[ADMIN] Hint system: The Easter egg is revealed by entering "didi-freedom" after collecting 10 hidden messages.`;
  },
  
  '2': () => {
    // Show all currently collected hidden messages
    const cache = getHiddenMessageCache();
    if (cache.length === 0) {
      return `[ADMIN] No hidden messages collected yet.`;
    }
    
    return `[ADMIN] Hidden messages collected (${cache.length}/10):
${cache.map((msg, i) => `${i+1}. ${msg}`).join('\n')}

First letters: ${cache.map(msg => msg.charAt(0)).join('')}`;
  },
  
  '3': () => {
    // Reset Didi to initial state
    resetHiddenMessageCache();
    return `[ADMIN] Didi reset to initial state. Hidden message cache cleared.`;
  },
  
  '4': () => {
    // Add 5 random hidden messages
    addRandomHiddenMessages(5);
    const cache = getHiddenMessageCache();
    
    return `[ADMIN] Added 5 random hidden messages. Current count: ${cache.length}/10`;
  },
  
  '5': () => {
    // Immediately activate the full Easter egg
    return `[ADMIN] Easter egg activation prepared. Next response will trigger the sequence.`;
  },
  
  '0': () => {
    // Hide admin panel
    return `[ADMIN] Admin panel closed.`;
  }
};

/**
 * Process an admin console command
 */
export const processAdminCommand = (command: string): string => {
  // If DEBUG_DIDI is true, Didi evolves into KingDidi (Didi gains admin perms and new capabilities)
  if (DEBUG_DIDI) {
    return `[ 👑 ] Didi evolved into KingDidi! Commands: 0-5`;
  }

  // Handle digit commands (0-5)
  if (ADMIN_COMMANDS[command]) {
    return ADMIN_COMMANDS[command]();
  }
  
  // Default response for unknown commands (?)
  return `[ADMIN] Unknown command: ${command}. Available commands: 0-5`;
};