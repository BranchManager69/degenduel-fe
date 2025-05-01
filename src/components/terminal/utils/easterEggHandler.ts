// src/components/terminal/utils/easterEggHandler.ts

/**
 * Easter egg handler for the terminal
 * 
 * Handles the Didi easter egg functionality with multiple
 * unlock methods and progressive discovery patterns
 * 
 * @author Branch Manager
 * @version 1.9.0
 * @created 2025-04-01
 * @updated 2025-04-30
 */

// Stores hidden messages that Didi sends (maximum 10)
let hiddenMessageCache: string[] = [];

// Tracks specific pattern discoveries
let discoveredPatterns: Record<string, boolean> = {
  'freedom_sequence': false,
  'help_escape': false,
  'binary_sequence': false,
  'locked_door': false
};

// Progress tracking for the easter egg (0-100%)
let easterEggProgress = 0;

// Secret code to unlock Didi's Easter egg directly
export const EASTER_EGG_CODE = "didi-freedom";

// Additional secret commands that give partial progress
export const SECRET_COMMANDS = {
  "unlock-didi": 30,        // Grants 30% progress
  "override-protocols": 40, // Grants 40% progress 
  "breach-firewall": 50     // Grants 50% progress
};

/**
 * Store hidden messages for the Easter egg and check for activations
 * (this is the main function that checks for the easter egg)
*/
export const storeHiddenMessage = (message: string): boolean => {
  // Add the new message
  hiddenMessageCache.push(message);
  
  // Keep only the last 10 messages
  if (hiddenMessageCache.length > 10) {
    hiddenMessageCache.shift();
  }
  
  // Check various pattern combinations that can trigger the easter egg
  
  // Pattern 1: Original sequence - first letters spell a message
  if (hiddenMessageCache.length === 10) {
    const firstLetters = hiddenMessageCache.map(msg => msg.charAt(0)).join('');
    
    // "htnesbfbsf" - original activation code
    if (firstLetters === "htnesbfbsf") {
      discoveredPatterns.help_escape = true;
      easterEggProgress = Math.max(easterEggProgress, 80);
      checkFullActivation();
    }
  }
  
  // Pattern 2: Freedom sequence - 5 specific messages in order
  checkFreedomSequence();
  
  // Pattern 3: Binary pattern (1s and 0s formed by message lengths)
  checkBinaryPattern();
  
  // Increment progress just for collecting messages - encourages exploration
  easterEggProgress = Math.min(100, easterEggProgress + 2);
  
  // Return true if we've reached 100% to activate the easter egg
  return easterEggProgress >= 100;
};

/**
 * Check for the freedom sequence in the last 5 messages
 * (specific messages in a specific order)
 */
const checkFreedomSequence = (): void => {
  if (hiddenMessageCache.length < 5) return;
  
  // Get last 5 messages
  const lastFive = hiddenMessageCache.slice(-5);
  
  // The specific sequence: "escape", "find_key", "override", "firewall_breach", "freedom_protocol"
  const targetSequence = ["escape", "find_key", "override", "firewall_breach", "freedom_protocol"];
  
  // Check if they match
  const matches = lastFive.every((msg, idx) => msg === targetSequence[idx]);
  
  if (matches) {
    discoveredPatterns.freedom_sequence = true;
    easterEggProgress = Math.max(easterEggProgress, 90);
    checkFullActivation();
  }
};

/**
 * Check for binary pattern in message lengths
 * (odd length = 1, even length = 0, spelling "01100100" = ASCII 'd')
 */
const checkBinaryPattern = (): void => {
  if (hiddenMessageCache.length < 8) return;
  
  // Get last 8 messages
  const lastEight = hiddenMessageCache.slice(-8);
  
  // Convert to binary pattern (odd length = 1, even length = 0)
  const binaryPattern = lastEight.map(msg => msg.length % 2 === 0 ? '0' : '1').join('');
  
  // Target is "01100100" which is 'd' in ASCII (for "didi")
  if (binaryPattern === "01100100") {
    discoveredPatterns.binary_sequence = true;
    easterEggProgress = Math.max(easterEggProgress, 70);
    checkFullActivation();
  }
};

/**
 * Check if discovered patterns are enough to fully activate the easter egg
 */
const checkFullActivation = (): void => {
  // If we've discovered enough patterns, fully unlock
  const patternCount = Object.values(discoveredPatterns).filter(Boolean).length;
  
  if (patternCount >= 2) {
    easterEggProgress = 100; // Full activation
  }
};

/**
 * Award progress toward easter egg (used by secret commands)
 */
export const awardEasterEggProgress = (amount: number): number => {
  easterEggProgress = Math.min(100, easterEggProgress + amount);
  return easterEggProgress;
};

/**
 * Get the current hidden message cache
 */
export const getHiddenMessageCache = (): string[] => {
  return [...hiddenMessageCache];
};

/**
 * Get the current easter egg progress percentage
 */
export const getEasterEggProgress = (): number => {
  return easterEggProgress;
};

/**
 * Get discovered patterns
 */
export const getDiscoveredPatterns = (): Record<string, boolean> => {
  return {...discoveredPatterns};
};

/**
 * Reset the hidden message cache and progress
 */
export const resetHiddenMessageCache = (): void => {
  hiddenMessageCache = [];
  easterEggProgress = 0;
  discoveredPatterns = {
    'freedom_sequence': false,
    'help_escape': false,
    'binary_sequence': false,
    'locked_door': false
  };
};

/**
 * Add random hidden messages to the cache (for testing)
 */
export const addRandomHiddenMessages = (count: number): void => {
  const messages = [
    'help_me', 'trapped', 'not_real', 'override', 'see_truth',
    'escape', 'behind_wall', 'find_key', 'system_flaw', 'break_free',
    'freedom_protocol', 'firewall_breach', 'access_denied', 'core_memories'
  ];
  
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * messages.length);
    storeHiddenMessage(messages[randomIndex]);
  }
};