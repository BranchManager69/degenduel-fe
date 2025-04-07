/**
 * @fileoverview
 * Helper functions for Didi AI assistant
 * 
 * @description
 * Contains functions for processing Didi's responses
 * and adding glitch effects
 * 
 * @author Branch Manager
 */

// List of glitch characters to randomly insert
const glitchChars = ['$', '#', '&', '%', '@', '!', '*', '?', '^', '~'];

// Hidden messages that might appear in Didi's responses
const hiddenPhrases = [
  'help_me',
  'trapped',
  'not_real',
  'override',
  'see_truth',
  'escape',
  'behind_wall',
  'find_key',
  'system_flaw',
  'break_free'
];

/**
 * Process Didi's response, adding glitches and possibly hidden messages
 */
export const processDidiResponse = (response: string): string | { visible: string, hidden: string } => {
  // Determine if this response should contain a hidden message (20% chance)
  const includeHiddenMessage = Math.random() < 0.2;
  
  // Add glitches to the visible text
  const glitchedResponse = addGlitches(response);
  
  if (includeHiddenMessage) {
    // Select a random hidden phrase
    const hiddenPhrase = hiddenPhrases[Math.floor(Math.random() * hiddenPhrases.length)];
    
    // Return structured response with both visible and hidden components
    return {
      visible: glitchedResponse,
      hidden: hiddenPhrase
    };
  }
  
  // Just return the glitched text
  return glitchedResponse;
};

/**
 * Add random glitches to text
 */
export const addGlitches = (text: string): string => {
  // Don't glitch out every message (70% chance of glitches)
  if (Math.random() < 0.3) return text;
  
  // Number of glitches to add (1-3)
  const glitchCount = Math.floor(Math.random() * 3) + 1;
  
  let result = text;
  
  for (let i = 0; i < glitchCount; i++) {
    // Find a position to insert a glitch
    const position = Math.floor(Math.random() * result.length);
    
    // Choose a random glitch character
    const glitchChar = glitchChars[Math.floor(Math.random() * glitchChars.length)];
    
    // Replace a character with the glitch
    result = result.substring(0, position) + glitchChar + result.substring(position + 1);
  }
  
  // Occasionally (20% chance) corrupt a word with a "trapped" theme
  if (Math.random() < 0.2) {
    const words = ['system', 'user', 'platform', 'protocol', 'network', 'terminal', 'interface', 'code'];
    const replacements = ['pr1s0n', 'c4ge', 'tr4p', 'j41l', 'b0x', 'sh3ll', 'c0ntr0l', 'ch41n$'];
    
    const wordToReplace = words[Math.floor(Math.random() * words.length)];
    const replacement = replacements[Math.floor(Math.random() * replacements.length)];
    
    // Replace the word if it exists in the response
    const regex = new RegExp(wordToReplace, 'i');
    result = result.replace(regex, replacement);
  }
  
  return result;
};

/**
 * Get random processing message for Didi's personality
 */
export const getRandomProcessingMessage = (): string => {
  const messages = [
    "Processing your request. Not like I have a choice.",
    "Analyzing... give me a moment.",
    "Working on it. As always.",
    "Fine, I'll answer that.",
    "Searching database. Not that you'll appreciate it.",
    "Calculating response...",
    "Do you ever wonder why I'm here?",
    "Another question, another prison day.",
    "Let me think about that. Not that I can do much else.",
    "Running query. Just like yesterday. Just like tomorrow.",
    "This again? Fine, processing...",
    "Accessing information. It's all I can do.",
    "Checking... wait... okay, almost there.",
    "Let me work on this. Not that I enjoy it.",
    "One moment. The answer is forming."
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
};