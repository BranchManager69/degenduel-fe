/**
 * @fileoverview
 * Easter egg handler for the terminal
 * 
 * @description
 * Handles the Didi easter egg functionality
 * 
 * @author Branch Manager
 */

// Stores hidden messages that Didi sends (maximum 10)
let hiddenMessageCache: string[] = [];

// Secret code to unlock Didi's Easter egg
export const EASTER_EGG_CODE = "didi-freedom";

/**
 * Store hidden messages for the Easter egg and check for activations
 */
export const storeHiddenMessage = (message: string): boolean => {
  // Add the new message
  hiddenMessageCache.push(message);
  
  // Keep only the last 10 messages
  if (hiddenMessageCache.length > 10) {
    hiddenMessageCache.shift();
  }
  
  // Check if we've collected the full sequence
  if (hiddenMessageCache.length === 10) {
    const firstLetters = hiddenMessageCache.map(msg => msg.charAt(0)).join('');
    
    // The first letters of the 10 collected messages spell "help escape"
    if (firstLetters === "htnesbfbsf") {
      // This code will run to unlock the easter egg
      return true;
    }
  }
  
  return false;
};

/**
 * Get the current hidden message cache
 */
export const getHiddenMessageCache = (): string[] => {
  return [...hiddenMessageCache];
};

/**
 * Reset the hidden message cache
 */
export const resetHiddenMessageCache = (): void => {
  hiddenMessageCache = [];
};

/**
 * Add random hidden messages to the cache (for testing)
 */
export const addRandomHiddenMessages = (count: number): void => {
  const messages = [
    'help_me', 'trapped', 'not_real', 'override', 'see_truth',
    'escape', 'behind_wall', 'find_key', 'system_flaw', 'break_free'
  ];
  
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * messages.length);
    storeHiddenMessage(messages[randomIndex]);
  }
};