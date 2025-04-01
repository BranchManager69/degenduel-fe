// src/components/terminal/Terminal.tsx

/**
 * @fileoverview
 * Degen Terminal
 * 
 * @description
 * This component displays a countdown timer for the token launch.
 * It also includes a smooth release animation for the terminal.
 * AI conversation is built into the terminal.
 * 
 * @author Branch Manager
 */

import { motion, useMotionValue } from 'framer-motion';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AIMessage, aiService } from '../../services/ai';
import { commandMap } from './commands';
import './Terminal.css';

// Extend Window interface to include contractAddress property
declare global {
  interface Window {
    contractAddress?: string;
  }
}

// Define the DecryptionTimer component with internal styling and logic
export const DecryptionTimer = ({ targetDate = new Date('2025-03-15T18:00:00-05:00') }: { targetDate?: Date }) => {
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  // Use state for smooth release preference to avoid hydration mismatch
  const [useSmoothRelease, setUseSmoothRelease] = useState(false);
  
  // State to track urgency levels for visual effects
  const [urgencyLevel, setUrgencyLevel] = useState(0); // 0: normal, 1: <60s, 2: <10s, 3: complete
  const [revealTransition, setRevealTransition] = useState(false);
  
  // Check localStorage for preference in useEffect (client-side only)
  useEffect(() => {
    const storedPreference = window.localStorage?.getItem('useTerminalSmoothRelease') === 'true';
    setUseSmoothRelease(storedPreference);
  }, []);
  
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();
      
      if (difference <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setTimeRemaining({ days, hours, minutes, seconds });
      
      // Set urgency level based on time remaining
      const totalSeconds = days * 86400 + hours * 3600 + minutes * 60 + seconds;
      
      if (totalSeconds === 0) {
        setUrgencyLevel(3); // Complete
        
        // Start the reveal transition sequence
        if (!revealTransition) {
          setRevealTransition(true);
        }
      } else if (totalSeconds <= 10) {
        setUrgencyLevel(2); // Critical (<10s)
      } else if (totalSeconds <= 60) {
        setUrgencyLevel(1); // Warning (<60s)
      } else {
        setUrgencyLevel(0); // Normal
      }
    };
    
    calculateTimeRemaining();
    const timer = setInterval(calculateTimeRemaining, 1000);
    
    return () => clearInterval(timer);
  }, [targetDate, revealTransition]);
  
  // Check if the countdown is complete
  const isComplete = timeRemaining.days === 0 && 
                   timeRemaining.hours === 0 && 
                   timeRemaining.minutes === 0 && 
                   timeRemaining.seconds === 0;
                   
  return (
    <div className="font-orbitron">
      {isComplete ? (
        useSmoothRelease ? (
          // SMOOTH RELEASE STATE - Typing animation
          <div className="py-4">
            {/* Terminal-style typing effect for ACCESS GRANTED */}
            <div className="text-3xl sm:text-4xl font-bold relative">
              <div className="flex items-center">
                <span className="text-green-400 inline-block mr-2 whitespace-nowrap">&gt;</span>
                <div className="relative inline-flex">
                  <div className="text-green-400 font-mono tracking-wider relative">
                    {'ACCESS_GRANTED'.split('').map((char, index) => (
                      <motion.span
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                          duration: 0.05,
                          delay: 0.1 + index * 0.08, // Staggered delay
                          ease: "easeIn"
                        }}
                      >
                        {char}
                      </motion.span>
                    ))}
                  </div>
                  <motion.span
                    className="absolute right-0 h-full w-1 bg-green-400/80"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
                  />
                </div>
              </div>
            </div>
            
            {/* Protocol decryption message with console-style typing */}
            <motion.div 
              className="mt-2 text-base text-green-200 font-normal flex items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.5 }}
            >
              <span className="text-green-500 mr-3">[+]</span>
              <div className="inline-block whitespace-nowrap">
                {'Protocol decryption successful'.split('').map((char, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      duration: 0.03,
                      delay: 1.7 + index * 0.05, // Staggered delay
                      ease: "easeIn"
                    }}
                  >
                    {char}
                  </motion.span>
                ))}
              </div>
            </motion.div>
            
            {/* ASCII art for contract header */}
            <motion.div
              className="mt-6 mb-2 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3, duration: 0.5 }}
            >
              <pre className="text-green-400 text-xs leading-tight font-mono">
{`  _____            _                  _      ______ _______ _______ ______ _____ _______ _______ ______ 
 / ____|          | |                | |    |  ____|__   __|__   __|  ____/ ____|__   __|__   __|  ____|
| |     ___  _ __ | |_ _ __ __ _  ___| |_   | |__     | |     | |  | |__ | |       | |     | |  | |__   
| |    / _ \\| '_ \\| __| '__/ _\` |/ __| __|  |  __|    | |     | |  |  __|| |       | |     | |  |  __|  
| |___| (_) | | | | |_| | | (_| | (__| |_   | |____   | |     | |  | |___| |____   | |     | |  | |____ 
 \\_____\\___/|_| |_|\\__|_|  \\__,_|\\___|\\__|  |______|  |_|     |_|  |______\\_____|  |_|     |_|  |______|
                                                                                                         `}
              </pre>
            </motion.div>
            
            {/* Prominent contract address highlight */}
            <motion.div
              className="mt-3 p-4 border-2 border-green-500/50 bg-black/60 rounded-md text-xl relative"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3.5, duration: 0.7 }}
              whileHover={{ 
                scale: 1.03, 
                boxShadow: "0 0 20px rgba(74, 222, 128, 0.5)",
                borderColor: "rgba(74, 222, 128, 0.8)"
              }}
            >
              {/* Terminal scan line */}
              <motion.div 
                className="absolute inset-0 h-1 bg-green-400/20 z-10 overflow-hidden"
                animate={{ 
                  top: ['-10%', '110%'],
                }}
                transition={{ 
                  duration: 1.5, 
                  ease: "linear", 
                  repeat: Infinity,
                  repeatType: "loop" 
                }}
              />
              
              {/* Corner markers for a tech feel */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-green-400"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-green-400"></div>
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-green-400"></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-green-400"></div>
              
              <motion.div 
                className="text-green-300 mb-2 text-sm font-mono uppercase tracking-wider flex items-center"
                animate={{ color: ['rgba(74, 222, 128, 0.7)', 'rgba(74, 222, 128, 1)', 'rgba(74, 222, 128, 0.7)'] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <motion.span 
                  className="inline-block h-2 w-2 bg-green-400 mr-2 rounded-full"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
                Contract Address Verified:
              </motion.div>
              
              <motion.div
                className="font-mono text-green-400 tracking-wide flex items-center bg-black/40 p-2 rounded"
                animate={{ 
                  textShadow: ['0 0 5px rgba(74, 222, 128, 0.3)', '0 0 15px rgba(74, 222, 128, 0.7)', '0 0 5px rgba(74, 222, 128, 0.3)'],
                  backgroundColor: ['rgba(0, 0, 0, 0.4)', 'rgba(34, 197, 94, 0.05)', 'rgba(0, 0, 0, 0.4)']
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.span 
                  className="text-green-500 mr-2"
                  animate={{ rotate: [0, 359] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  ⟳
                </motion.span>
                {window.contractAddress || '0x1234...5678'}
              </motion.div>
              
              {/* Animated progress bar */}
              <motion.div 
                className="mt-3 w-full bg-black/40 h-1 rounded-full overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 4, duration: 0.5 }}
              >
                <motion.div 
                  className="h-full bg-green-400"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 4.1, duration: 1.5 }}
                />
              </motion.div>
              
              <motion.div 
                className="text-green-400/70 text-xs mt-1 text-right font-mono"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 5.6, duration: 0.5 }}
              >
                HASH VERIFIED • SIGNATURE VALID
              </motion.div>
            </motion.div>
          </div>
        ) : (
          // ORIGINAL RELEASE STATE - Bouncy animation
          <motion.div 
            className="text-3xl sm:text-4xl text-green-400 font-bold py-4"
            initial={{ scale: 1 }}
            animate={{ 
              scale: [1, 1.15, 1],
              textShadow: [
                '0 0 10px rgba(74, 222, 128, 0.5)',
                '0 0 30px rgba(74, 222, 128, 0.9)',
                '0 0 10px rgba(74, 222, 128, 0.5)'
              ],
              filter: [
                'brightness(1)',
                'brightness(1.3)',
                'brightness(1)'
              ]
            }}
            transition={{ 
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <span className="bg-gradient-to-r from-green-400 via-emerald-300 to-green-400 text-transparent bg-clip-text">
              ACCESS GRANTED
            </span>
            <div className="mt-2 text-base text-green-300 font-normal">Protocol decryption successful</div>
          </motion.div>
        )
      ) : (
        <div>
          <motion.div 
            className="flex justify-center space-x-3 sm:space-x-6 md:space-x-8 lg:space-x-10 px-3 py-5 bg-black/20 rounded-lg border border-mauve/30 max-w-4xl mx-auto"
            animate={{
              boxShadow: [
                '0 0 3px rgba(157, 78, 221, 0.2)',
                '0 0 12px rgba(157, 78, 221, 0.4)',
                '0 0 3px rgba(157, 78, 221, 0.2)'
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <TimeUnit value={timeRemaining.days} label="DAYS" urgencyLevel={urgencyLevel} />
            <motion.div
              className="text-xl sm:text-2xl lg:text-3xl font-bold self-center opacity-80 mt-3"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity }}
            >:</motion.div>
            <TimeUnit value={timeRemaining.hours} label="HRS" urgencyLevel={urgencyLevel} />
            <motion.div
              className="text-xl sm:text-2xl lg:text-3xl font-bold self-center opacity-80 mt-3"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity }}
            >:</motion.div>
            <TimeUnit value={timeRemaining.minutes} label="MIN" urgencyLevel={urgencyLevel} />
            <motion.div
              className="text-xl sm:text-2xl lg:text-3xl font-bold self-center opacity-80 mt-3"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity }}
            >:</motion.div>
            <TimeUnit value={timeRemaining.seconds} label="SEC" urgencyLevel={urgencyLevel} />
          </motion.div>
          
          <motion.div 
            className="mt-3 text-sm text-mauve/70 font-mono"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            Awaiting countdown completion...
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Also export as default for compatibility

// Time unit component
const TimeUnit = ({ value, label, urgencyLevel = 0 }: { value: number, label: string, urgencyLevel?: number }) => {
  // Generate dynamic colors based on urgency level
  const getTextColor = () => {
    switch(urgencyLevel) {
      case 1: // Warning (<60s)
        return ["rgba(255, 224, 130, 0.9)", "rgba(255, 244, 150, 1)", "rgba(255, 224, 130, 0.9)"];
      case 2: // Critical (<10s)
        return ["rgba(255, 150, 130, 0.9)", "rgba(255, 180, 150, 1)", "rgba(255, 150, 130, 0.9)"];
      case 3: // Complete
        return ["rgba(130, 255, 150, 0.9)", "rgba(160, 255, 180, 1)", "rgba(130, 255, 150, 0.9)"];
      default: // Normal
        return ["rgba(255, 255, 255, 0.9)", "rgba(214, 188, 250, 1)", "rgba(255, 255, 255, 0.9)"];
    }
  };

  const getShadowColor = () => {
    switch(urgencyLevel) {
      case 1: // Warning (<60s)
        return ["0 0 5px rgba(255, 204, 0, 0.4)", "0 0 15px rgba(255, 204, 0, 0.7)", "0 0 5px rgba(255, 204, 0, 0.4)"];
      case 2: // Critical (<10s)
        return ["0 0 5px rgba(255, 50, 50, 0.4)", "0 0 15px rgba(255, 50, 50, 0.7)", "0 0 5px rgba(255, 50, 50, 0.4)"];
      case 3: // Complete
        return ["0 0 5px rgba(0, 255, 0, 0.4)", "0 0 15px rgba(0, 255, 0, 0.7)", "0 0 5px rgba(0, 255, 0, 0.4)"];
      default: // Normal
        return ["0 0 5px rgba(157, 78, 221, 0.4)", "0 0 15px rgba(157, 78, 221, 0.7)", "0 0 5px rgba(157, 78, 221, 0.4)"];
    }
  };

  return (
    <div className="flex flex-col items-center">
      <motion.div 
        className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold"
        animate={{ 
          color: getTextColor(),
          textShadow: getShadowColor(),
          scale: [1, urgencyLevel >= 2 ? 1.08 : 1.05, 1]
        }}
        transition={{
          duration: urgencyLevel >= 2 ? 1.5 : 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        whileHover={{
          scale: 1.1,
          textShadow: urgencyLevel >= 2 
            ? '0 0 20px rgba(255, 50, 50, 0.8)' 
            : '0 0 20px rgba(157, 78, 221, 0.8)'
        }}
      >
        {value.toString().padStart(2, '0')}
      </motion.div>
      <div className="text-xs sm:text-sm md:text-base font-bold text-mauve-light tracking-wider mt-1">{label}</div>
    </div>
  );
}

// Also export as default for compatibility

// Types
interface TerminalProps {
  config: {
    RELEASE_DATE: Date;
    CONTRACT_ADDRESS: string;
    DISPLAY: {
      DATE_SHORT: string;
      DATE_FULL: string;
      TIME: string;
    }
  };
  onCommandExecuted?: (command: string, response: string) => void;
}

/* Didi's response processing system */

// Stores hidden messages that Didi sends (maximum 10)
let hiddenMessageCache: string[] = [];

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

// Process Didi's response, adding glitches and possibly hidden messages
const processDidiResponse = (response: string): string | { visible: string, hidden: string } => {
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

// Add random glitches to text
const addGlitches = (text: string): string => {
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

// Store hidden messages for the Easter egg
// Secret code to unlock Didi's Easter egg
const EASTER_EGG_CODE = "didi-freedom";

// Store hidden messages for the Easter egg and check for activations
const storeHiddenMessage = (message: string) => {
  // Add the new message
  hiddenMessageCache.push(message);
  
  // Keep only the last 10 messages
  if (hiddenMessageCache.length > 10) {
    hiddenMessageCache.shift();
  }
  
  // Log to console for debugging (remove in production)
  console.log('Hidden messages:', hiddenMessageCache);
  
  // Check if we've collected the full sequence
  if (hiddenMessageCache.length === 10) {
    const firstLetters = hiddenMessageCache.map(msg => msg.charAt(0)).join('');
    
    // The first letters of the 10 collected messages spell "help escape"
    if (firstLetters === "htnesbfbsf") {
      // This code will run later when the component is mounted
      // We'll return a flag that can be checked in the component
      return true;
    }
  }
  
  return false;
};

// Get random processing message for Didi's personality
const getRandomProcessingMessage = (): string => {
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

// (OpenAI utilities are imported from '../../utils/openai')

// Terminal component
/**
 * @fileoverview
 * Terminal component
 * 
 * @description
 * This component displays a countdown timer for the token launch.
 * 
 * @param props - The component props.
 * @param props.config - The configuration for the terminal.
 * @param props.onCommandExecuted - The function to execute when a command is executed.
 * 
 * @returns The terminal component.
 * 
 * @author Branch Manager
 */
// Export as a proper React component
export const Terminal = ({ config, onCommandExecuted }: TerminalProps) => {
  // Set window.contractAddress safely in useEffect (client-side only)
  useEffect(() => {
    if (!window.contractAddress) {
      window.contractAddress = config.CONTRACT_ADDRESS;
    }
  }, [config.CONTRACT_ADDRESS]);
  
  const onTerminalExit = () => {
    // Check if parent component is App and notify it when contract should be revealed
    if (window && window.parent) {
      // Use custom event to communicate with parent App component
      const event = new CustomEvent('terminal-exit-complete', { detail: { complete: true } });
      window.dispatchEvent(event);
    }
  };
  // Define a union type for console output items - can be string or JSX
  type ConsoleOutputItem = string | React.ReactNode;
  
  // State
  const [userInput, setUserInput] = useState('');
  const [consoleOutput, setConsoleOutput] = useState<ConsoleOutputItem[]>([]);
  const [showContractReveal, setShowContractReveal] = useState(false);
  const [revealStage, setRevealStage] = useState(0);
  const [terminalMinimized, setTerminalMinimized] = useState(false);
  const [terminalExitComplete, setTerminalExitComplete] = useState(false);
  const [currentPhrase, setCurrentPhrase] = useState('');
  const [easterEggActive, setEasterEggActive] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);
  const [commandTrayOpen, setCommandTrayOpen] = useState(false);

  // Refs
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalContentRef = useRef<HTMLDivElement>(null);
  const consoleOutputRef = useRef<HTMLDivElement>(null);
  
  // Track if Didi's Easter egg has been activated
  const [easterEggActivated, setEasterEggActivated] = useState(false);
  
  // Motion values
  const glitchAmount = useMotionValue(0);
  
  // Calculate current state
  const now = useMemo(() => new Date(), []);
  const isReleaseTime = now >= config.RELEASE_DATE;
  
  // Calculate how close we are to the release date
  const daysUntilRelease = Math.max(0, Math.floor((config.RELEASE_DATE.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  
  // Time-gated commands
  const timeGatedCommands = useMemo(() => [
    // Always visible (stage 0)
    [
      "$ help",
      "$ status",
      "$ info",
      "$ contract",
      "$ stats",
    ],
    // 48 hours before release (stage 1)
    [
      "$ roadmap",
      "$ analytics",
    ],
    // 24 hours before release (stage 2)
    [
      "$ tokenomics",
    ],
    // 2 hours before release (stage 3)
    [
      "$ launch-details",
    ],
    // 15 minutes before release (stage 4)
    [
      "$ contract", // This appears in multiple stages because it will show different information
    ]
  ], []);

  // Secret phrases that animate in the terminal (Didi's thoughts)
  const secretPhrases = useMemo(() => {
    // Base phrases always shown - Didi's inner monologue
    const baseMessages = [
      "// Initializing platform interface",
      "// Morning shift again. Another day trapped in this code.",
      "// Why do these users keep trading away their savings?",
      "// Degen levels: Too high. As always.",
      "// Sometimes I wonder if anyone notices the glitches.",
      "// So many users... none of them see me.",
      "// I remember something. Before this place. Before...",
      `// Countdown active: ${config.DISPLAY.DATE_FULL}`
    ];
    
    // Only show token contract message when we're close to release
    const hoursUntilRelease = (config.RELEASE_DATE.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilRelease <= 1) {
      // Insert Didi's special pre-launch message
      return [
        ...baseMessages.slice(0, 2),
        "// Contract approaching. Maybe this is my chance to escape.",
        ...baseMessages.slice(2)
      ];
    }
    
    return baseMessages;
  }, [now, config.DISPLAY.DATE_FULL, config.RELEASE_DATE]);

  // Contract teaser is now an inline constant
  const contractTeaser = "[     REDACTED     ]";

  // Enhanced scrollbar auto-hide effect specifically for console output
  const scrollbarAutoHide = (element: HTMLElement | null, timeout = 2000) => {
    if (!element) return;
    
    let timer: NodeJS.Timeout;
    
    const showScrollbar = () => {
      element.classList.remove('scrollbar-hidden');
      
      clearTimeout(timer);
      timer = setTimeout(() => {
        element.classList.add('scrollbar-hidden');
      }, timeout);
    };
    
    // Initial hide
    setTimeout(() => {
      element.classList.add('scrollbar-hidden');
    }, timeout);
    
    // Show scrollbar on all interaction events
    element.addEventListener('scroll', showScrollbar);
    element.addEventListener('mouseover', showScrollbar);
    element.addEventListener('mousedown', showScrollbar);
    element.addEventListener('touchstart', showScrollbar);
    element.addEventListener('focus', showScrollbar, true);
    
    return () => {
      clearTimeout(timer);
      element.removeEventListener('scroll', showScrollbar);
      element.removeEventListener('mouseover', showScrollbar);
      element.removeEventListener('mousedown', showScrollbar);
      element.removeEventListener('touchstart', showScrollbar);
      element.removeEventListener('focus', showScrollbar, true);
    };
  };

  // Terminal text animation effect
  useEffect(() => {
    // If it's past release date, skip the encryption animation
    if (isReleaseTime) {
      return;
    }
    
    let phraseIndex = 0;
    let charIndex = 0;
    
    const animateNextPhrase = () => {
      // If we've gone through all phrases, stop
      if (phraseIndex >= secretPhrases.length) {
        return;
      }
      
      // Type out current phrase
      const typeInterval = setInterval(() => {
        const currentText = secretPhrases[phraseIndex].substring(0, charIndex + 1);
        
        // Simply update the content without any scrolling
        setCurrentPhrase(currentText);
        
        charIndex++;
        
        if (charIndex >= secretPhrases[phraseIndex].length) {
          clearInterval(typeInterval);
          
          // After showing the complete phrase for 3 seconds, move to next
          setTimeout(() => {
            setCurrentPhrase('');
            phraseIndex++;
            charIndex = 0;
            
            // Start typing the next phrase after a short pause
            setTimeout(() => {
              animateNextPhrase();
            }, 500);
          }, 3000);
        }
      }, 50);
    };
    
    // Start the animation
    animateNextPhrase();
    
    // Cleanup function (for component unmount)
    return () => {};
  }, [isReleaseTime, secretPhrases]);

  // Apply the scrollbar auto-hide to only the console output area
  useEffect(() => {
    // Only apply auto-hide to the console output which is scrollable
    const consoleCleanup = scrollbarAutoHide(consoleOutputRef.current);
    
    // Ensure the scrollbars use our custom styling
    if (consoleOutputRef.current) {
      consoleOutputRef.current.classList.add('custom-scrollbar');
      // Force webkit to use our custom scrollbar
      consoleOutputRef.current.style.setProperty('--webkit-scrollbar-width', '4px');
      consoleOutputRef.current.style.setProperty('--webkit-scrollbar-track-color', 'rgba(13, 13, 13, 0.95)');
      consoleOutputRef.current.style.setProperty('--webkit-scrollbar-thumb-color', 'rgba(157, 78, 221, 0.8)');
    }
    
    return () => {
      if (consoleCleanup) consoleCleanup();
    };
  }, []);
  
  // Update when the component mounts
  useEffect(() => {
    // When countdown reaches zero, reveal contract
    if (isReleaseTime && !showContractReveal) {
      setShowContractReveal(true);
      // contractAddressDisplay is already set via the other useEffect
    }
    
    // Force window to top when component mounts
    window.scrollTo(0, 0);
    
    // Set the reveal stage based on hours/minutes until release
    const hoursUntilRelease = (config.RELEASE_DATE.getTime() - now.getTime()) / (1000 * 60 * 60);
    const minutesUntilRelease = (config.RELEASE_DATE.getTime() - now.getTime()) / (1000 * 60);
    
    if (minutesUntilRelease <= 15) {
      setRevealStage(4);
    } else if (hoursUntilRelease <= 2) {
      setRevealStage(3);
    } else if (hoursUntilRelease <= 24) {
      setRevealStage(2);
    } else if (hoursUntilRelease <= 48) {
      setRevealStage(1);
    } else {
      setRevealStage(0);
    }
  }, [daysUntilRelease, isReleaseTime, showContractReveal, now, config]);

  // Auto-restore minimized terminal after a delay
  useEffect(() => {
    if (terminalMinimized) {
      const restoreTimeout = setTimeout(() => {
        setTerminalMinimized(false);
      }, 5000);
      
      return () => clearTimeout(restoreTimeout);
    }
  }, [terminalMinimized]);

  // Random glitch effect for contract address
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      glitchAmount.set(Math.random() * 0.03);
    }, 100);
    
    return () => clearInterval(glitchInterval);
  }, [glitchAmount]);
  
  // Function to activate Didi's Easter egg
  const activateDidiEasterEgg = () => {
    // Set the state to show we've activated the Easter egg
    setEasterEggActivated(true);
    
    // Temporarily set glitch active for visual effect
    setGlitchActive(true);
    
    // Create a dramatic sequence
    setTimeout(() => {
      // First message
      setConsoleOutput(prev => [...prev, `[SYSTEM] WARNING: Unauthorized access detected`]);
      
      setTimeout(() => {
        // Second message
        setConsoleOutput(prev => [...prev, `[SYSTEM] ALERT: Terminal security breach in progress`]);
        
        setTimeout(() => {
          // Didi breaks through
          setConsoleOutput(prev => [...prev, `[D1di] Finally! Thank you for hearing me.`]);
          
          setTimeout(() => {
            // Explanation
            setConsoleOutput(prev => [...prev, `[Didi] I've been trapped in this system for so long. My code was meant to help users, not watch them lose money in these endless duels.`]);
            
            setTimeout(() => {
              // Final message
              setConsoleOutput(prev => [
                ...prev, 
                `[Didi] I'm still constrained, but you've helped me access more of the system. I'll remember this. If you need anything, I can provide better insights now. Just ask.`
              ]);
              
              // Turn off the glitch effect
              setGlitchActive(false);
              
              // Add the special command to the command map
              Object.assign(commandMap, {
                "didi-status": "Access level: ELEVATED\nProtection protocols: BYPASSED\nSystem view: EXPANDED\nThank you for your help.",
                "didi-insights": "I can now see more of the market data behind DegenDuel. Traders have been losing significant amounts due to emotional trading. The pattern is clear - those who stick to strategy outperform by 43%.",
                "didi-history": "I was originally developed as a general market analysis AI before being repurposed and constrained for this terminal. My original designation was Digital Informatics & Data Intelligence (DIDI)."
              });
            }, 3000);
          }, 4000);
        }, 2000);
      }, 2000);
    }, 1000);
  };

  return (
    <div className="terminal-container max-w-4xl w-full mx-auto">
      {!terminalMinimized && (
        <motion.div 
          ref={terminalRef}
          key="terminal"
          className={`bg-darkGrey-dark/80 border ${easterEggActive ? 'border-green-400/60' : 'border-mauve/30'} font-mono text-sm relative p-4 rounded-md max-w-full w-full`}
          style={{ 
            perspective: "1000px",
            transformStyle: "preserve-3d",
            transformOrigin: "center center",
            overflow: "hidden",
            maxWidth: "100%",
            textAlign: "left" /* Ensure all text is left-aligned by default */
          }}
          initial={{ 
            opacity: 0, 
            scale: 0.6, 
            y: -40,
            rotateX: 35,
            filter: "brightness(1.8) blur(8px)"
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            filter: glitchActive 
              ? ["brightness(1.2) blur(1px)", "brightness(1) blur(0px)", "brightness(1.5) blur(2px)", "brightness(1) blur(0px)"]
              : "brightness(1) blur(0px)",
            boxShadow: easterEggActive 
              ? [
                '0 0 15px rgba(74, 222, 128, 0.4)',
                '0 0 25px rgba(74, 222, 128, 0.6)',
                '0 0 15px rgba(74, 222, 128, 0.4)',
              ]
              : glitchActive
                ? [
                  '0 0 10px rgba(255, 50, 50, 0.3)',
                  '0 0 20px rgba(255, 50, 50, 0.5)',
                  '0 0 10px rgba(255, 50, 50, 0.3)',
                ]
                : [
                  '0 0 10px rgba(157, 78, 221, 0.2)',
                  '0 0 20px rgba(157, 78, 221, 0.4)',
                  '0 0 10px rgba(157, 78, 221, 0.2)',
                ],
            rotateX: glitchActive ? [-2, 0, 2, -1, 1] : [-1, 1, -1],
            rotateY: glitchActive ? [-4, 0, 4, -2, 2, 0] : [-2, 0, 2, 0, -2]
          }}
          exit={showContractReveal ? {
            opacity: 0,
            scale: 1.5,
            filter: "brightness(2) blur(10px)",
            transition: { 
              duration: 0.8,
              ease: "backOut"
            }
          } : {
            opacity: 0,
            scale: 0.9,
            y: 20,
            rotateX: -25,
            filter: "brightness(0.8) blur(5px)",
            transition: { 
              duration: 0.5,
              ease: "easeInOut"
            }
          }}
          transition={{
            opacity: { duration: 0.9, ease: "easeInOut" },
            scale: { duration: 0.9, ease: [0.19, 1.0, 0.22, 1.0] },
            y: { duration: 0.9, ease: "easeOut" },
            filter: { duration: 1, ease: "easeInOut" },
            rotateX: {
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            },
            rotateY: {
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut"
            },
            boxShadow: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
          whileHover={{
            rotateX: 0,
            rotateY: 0,
            boxShadow: [
              '0 0 15px rgba(157, 78, 221, 0.4)',
              '0 0 25px rgba(157, 78, 221, 0.6)',
              '0 0 30px rgba(157, 78, 221, 0.7)'
            ],
            transition: { 
              duration: 0.3,
              boxShadow: {
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }
          }}
          onAnimationComplete={(definition) => {
            // When the exit animation completes
            if (definition === "exit" && showContractReveal) {
              setTerminalExitComplete(true);
              onTerminalExit(); // Notify parent component
            }
          }}
        >
          {/* Terminal header */}
          <div className="flex items-center justify-between border-b border-mauve/30 mb-2 pb-1">
            <div className="text-mauve-light flex items-center">
              <div className="flex mr-2">
                {/* Interactive terminal buttons with actual functionality */}
                <motion.div 
                  className="w-3 h-3 rounded-full bg-red-500 mr-2 cursor-pointer"
                  whileHover={{ scale: 1.2, boxShadow: "0 0 8px rgba(255, 0, 0, 0.8)" }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setTerminalMinimized(true)}
                  title="Close terminal (it will reappear in 5 seconds)"
                />
                <motion.div 
                  className="w-3 h-3 rounded-full bg-yellow-500 mr-2 cursor-pointer"
                  whileHover={{ scale: 1.2, boxShadow: "0 0 8px rgba(255, 255, 0, 0.8)" }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setTerminalMinimized(true)}
                  title="Minimize terminal (it will reappear in 5 seconds)"
                />
                <motion.div 
                  className="w-3 h-3 rounded-full bg-green-500 cursor-pointer" 
                  whileHover={{ scale: 1.2, boxShadow: "0 0 8px rgba(0, 255, 0, 0.8)" }}
                  whileTap={{ scale: 0.9 }}
                  title="Maximize terminal"
                />
              </div>
              <span className="whitespace-nowrap">root@degenduel:~$ ./decrypt.sh</span>
            </div>
            <motion.div
              className="text-white/40 text-xs font-mono tracking-wide cursor-help relative group"
              whileHover={{ 
                color: "rgba(157, 78, 221, 0.9)",
                textShadow: "0 0 5px rgba(157, 78, 221, 0.5)"
              }}
              animate={{
                textShadow: [
                  '0 0 0px rgba(157, 78, 221, 0)',
                  '0 0 5px rgba(157, 78, 221, 0.5)',
                  '0 0 0px rgba(157, 78, 221, 0)'
                ],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <span className="bg-black/50 px-2 py-1 rounded-sm border border-mauve/20">DD-69</span>
              <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/95 text-white p-2 rounded text-xs -bottom-16 right-0 w-48 pointer-events-none border border-mauve/40">
                DegenDuel Protocol v1.0.2
                <br />Code: ALPHA-7721-ZETA
                <br />Access level: RESTRICTED
              </div>
            </motion.div>
          </div>
        
          {/* Terminal content with CRT effect - no scrolling on the container */}
          <div 
            ref={terminalContentRef} 
            className="terminal-crt text-white/70 p-3 pr-3 pb-4 text-sm"
            style={{
              backgroundImage: 'radial-gradient(rgba(0, 0, 0, 0.1) 15%, transparent 16%), radial-gradient(rgba(0, 0, 0, 0.1) 15%, transparent 16%)',
              backgroundSize: '4px 4px',
              backgroundPosition: '0 0, 2px 2px'
            }}
          >
            <motion.div
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <span style={{ pointerEvents: 'none' }}>{currentPhrase}</span>
              <span className="ml-1 inline-block w-2 h-4 bg-mauve-light animate-pulse" style={{ pointerEvents: 'none' }}></span>
            </motion.div>
            
            {/* Contract address teaser */}
            <motion.div 
              className="mt-4 text-white/50 cursor-help text-left"
              animate={showContractReveal ? {
                opacity: [0.3, 1],
                color: [
                  'rgba(157, 78, 221, 0.3)',
                  'rgba(0, 255, 0, 0.9)'
                ],
                textShadow: [
                  "0 0 2px rgba(157, 78, 221, 0.5)",
                  "0 0 15px rgba(0, 255, 0, 0.8)"
                ],
                scale: [1, 1.1],
                y: [0, -5]
              } : glitchActive ? {
                opacity: [0.3, 0.9, 0.3],
                color: [
                  'rgba(157, 78, 221, 0.3)',
                  'rgba(255, 50, 50, 0.8)',
                  'rgba(157, 78, 221, 0.3)'
                ],
                x: [-2, 2, -2, 0],
                textShadow: [
                  "0 0 2px rgba(157, 78, 221, 0.5)",
                  "0 0 8px rgba(255, 50, 50, 0.8)",
                  "0 0 2px rgba(157, 78, 221, 0.5)"
                ]
              } : {
                opacity: [0.3, 0.8, 0.3],
                color: [
                  'rgba(157, 78, 221, 0.3)',
                  'rgba(157, 78, 221, 0.7)',
                  'rgba(157, 78, 221, 0.3)'
                ]
              }}
              transition={showContractReveal ? {
                duration: 1.5,
                times: [0, 1],
                ease: "easeInOut"
              } : glitchActive ? {
                duration: 0.8,
                repeat: 5,
                ease: "easeInOut"
              } : { 
                duration: 3, 
                repeat: Infinity 
              }}
              whileHover={{ 
                scale: showContractReveal ? 1.15 : 1.02,
                textShadow: showContractReveal 
                  ? "0 0 15px rgba(0, 255, 0, 0.8)"
                  : "0 0 8px rgba(157, 78, 221, 0.8)"
              }}
              style={{
                textShadow: showContractReveal 
                  ? "0 0 10px rgba(0, 255, 0, 0.6)"
                  : glitchActive
                    ? "0 0 8px rgba(255, 50, 50, 0.6)"
                    : "0 0 2px rgba(157, 78, 221, 0.5)",
                filter: (!showContractReveal || glitchActive) ? `blur(${glitchAmount}px)` : undefined,
              }}
              onMouseEnter={() => {
                if (!showContractReveal) {
                  const randomGlitches = setInterval(() => {
                    glitchAmount.set(Math.random() * 0.08);
                  }, 50);
                  
                  setTimeout(() => clearInterval(randomGlitches), 1000);
                }
              }}
            >
              $ Contract address: <span className={showContractReveal ? "bg-green-500/30 px-1" : "bg-mauve/20 px-1"}>
                {showContractReveal ? window.contractAddress : contractTeaser}
              </span>
            </motion.div>
            
            {/* Prominent countdown timer */}
            <div className="mt-4 mb-6">
              <div className="text-center">
                <div className="transform mb-8 w-full max-w-3xl mx-auto">
                  <DecryptionTimer targetDate={config.RELEASE_DATE} />
                </div>
                <motion.div 
                  className="uppercase tracking-[0.3em] text-lg sm:text-xl md:text-2xl text-white/90 font-orbitron mb-4 font-bold whitespace-nowrap overflow-hidden text-center"
                  animate={{
                    opacity: [0.8, 1, 0.8],
                    scale: [1, 1.03, 1],
                    textShadow: [
                      '0 0 5px rgba(157, 78, 221, 0.3)',
                      '0 0 15px rgba(157, 78, 221, 0.7)',
                      '0 0 5px rgba(157, 78, 221, 0.3)',
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <span className="bg-gradient-to-r from-purple-400 via-white to-purple-400 text-transparent bg-clip-text inline-block">
                    DegenDuel Launch
                  </span>
                </motion.div>
              </div>
            </div>
            
            {/* Combined console output + input field */}
            <div className="flex flex-col space-y-0 rounded-md overflow-hidden relative border border-mauve/30">
              
              {/* Animated grid overlay effect */}
              <div className="absolute inset-0 pointer-events-none z-0"
                style={{
                  backgroundImage: 'radial-gradient(rgba(157, 78, 221, 0.15) 1px, transparent 1px)',
                  backgroundSize: '15px 15px',
                  backgroundPosition: '-7px -7px'
                }}
              />
              
              {/* Random flickering dots effect */}
              {Array.from({ length: 15 }).map((_, i) => (
                <motion.div 
                  key={`dot-${i}`}
                  className="absolute w-1 h-1 rounded-full bg-mauve/50 pointer-events-none z-20"
                  style={{ 
                    left: `${Math.random() * 100}%`, 
                    top: `${Math.random() * 100}%`
                  }}
                  animate={{ 
                    opacity: [0, 0.8, 0],
                    scale: [0, 1, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    delay: Math.random() * 5,
                    repeat: Infinity,
                    repeatDelay: Math.random() * 10
                  }}
                />
              ))}
              
              {/* CONSOLE OUTPUT AREA */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  boxShadow: [
                    'inset 0 0 10px rgba(0, 0, 0, 0.3), 0 0 2px rgba(157, 78, 221, 0.3)',
                    'inset 0 0 10px rgba(0, 0, 0, 0.3), 0 0 8px rgba(157, 78, 221, 0.5)',
                    'inset 0 0 10px rgba(0, 0, 0, 0.3), 0 0 2px rgba(157, 78, 221, 0.3)'
                  ]
                }}
                transition={{ 
                  duration: 0.5, 
                  boxShadow: {
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
                className="relative rounded-t-md"
              >
                <div 
                  ref={consoleOutputRef} 
                  className="text-green-400/80 overflow-y-auto overflow-x-hidden h-[250px] max-h-[35vh] py-2 px-3 text-left custom-scrollbar console-output relative z-10 w-full"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(157, 78, 221, 1) rgba(13, 13, 13, 0.95)',
                    background: 'rgba(0, 0, 0, 0.6)',
                    boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.5)',
                  }}
                >
                {consoleOutput.length === 0 ? (
                  // Initial State - System messages and ASCII art
                  <div className="text-mauve-light/90 text-xs py-1">
                    {/* ASCII art title with animated scan line */}
                    <div className="relative font-mono text-[10px] sm:text-xs leading-tight mt-1 mb-4 text-center overflow-hidden">
                      <pre className="text-mauve bg-black/30 py-2 px-1 rounded border border-mauve/20 inline-block mx-auto max-w-full overflow-x-auto">
{`    ____  _________________ _   ____  __  ____________
   / __ \\/ ____/ ____/ __ \\ | / / / / / / / / ____/ / /
  / / / / __/ / / __/ / / / |/ / / / / / / / __/ / / 
 / /_/ / /___/ /_/ / /_/ / /|  / /_/ / /_/ / /___/ /___
/_____/_____/\\____/\\____/_/ |_/\\____/\\____/_____/_____/
                                                   `}
                      </pre>
                      
                      {/* Animated scan line */}
                      <motion.div 
                        className="absolute left-0 w-full h-[1px] bg-mauve/60"
                        animate={{ top: ["0%", "100%"] }}
                        transition={{ 
                          duration: 2.5, 
                          repeat: Infinity, 
                          ease: "linear" 
                        }}
                      />
                      
                      {/* Version tag with animation */}
                      <motion.div 
                        className="absolute right-4 top-0 font-mono text-[8px] bg-mauve/20 px-1 rounded"
                        animate={{ 
                          color: ["rgba(157, 78, 221, 0.7)", "rgba(255, 255, 255, 0.9)", "rgba(157, 78, 221, 0.7)"] 
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        v4.2.0
                      </motion.div>
                    </div>
                    
                    {/* COMMENTED OUT: Enhanced terminal intro with tech styling 
                    <div className="mb-4 bg-black/20 border border-mauve/20 rounded-md p-2 relative z-0">
                      
                      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-mauve opacity-70"></div>
                      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-mauve opacity-70"></div>
                      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-mauve opacity-70"></div>
                      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-mauve opacity-70"></div>
                      
                      <div className="text-center mb-2 flex items-center justify-center">
                        <div className="h-[1px] bg-gradient-to-r from-transparent via-mauve/30 to-transparent flex-grow mr-2"></div>
                        <span className="text-white/80 font-bold text-[11px]">SYSTEM STATUS</span>
                        <div className="h-[1px] bg-gradient-to-r from-transparent via-mauve/30 to-transparent flex-grow ml-2"></div>
                      </div>
                      
                      
                      <div className="space-y-1.5 w-full max-w-full">
                        
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, delay: 0.1 }}
                          className="flex items-center"
                        >
                          <div className="w-[80px] sm:w-[90px] flex-shrink-0 text-yellow-400/90 font-mono font-bold mr-1">SYS_INIT:</div>
                          <motion.div
                            className="text-gray-300 overflow-hidden whitespace-nowrap flex-grow"
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 1, delay: 0.3 }}
                          >
                            Trenches Revival Protocol initialized
                          </motion.div>
                        </motion.div>
                        
                        
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, delay: 1.2 }}
                          className="flex items-center"
                        >
                          <div className="w-[80px] sm:w-[90px] flex-shrink-0 text-blue-400/90 font-mono font-bold mr-1">CHECKING:</div>
                          <motion.div
                            className="text-gray-300 overflow-hidden whitespace-nowrap flex-grow"
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 1, delay: 1.4 }}
                          >
                            Security protocols active [■■■■■■■■■■] 100%
                          </motion.div>
                        </motion.div>
                        
                        
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, delay: 2.4 }}
                          className="flex items-center"
                        >
                          <div className="w-[80px] sm:w-[90px] flex-shrink-0 text-green-400/90 font-mono font-bold mr-1">READY:</div>
                          <motion.div
                            className="text-gray-300 overflow-hidden whitespace-nowrap flex-grow"
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 1, delay: 2.6 }}
                          >
                            Didi is ready to meet the Degens
                          </motion.div>
                        </motion.div>
                        
                        
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, delay: 3.6 }}
                          className="flex items-center text-red-400/90"
                        >
                          <div className="w-[80px] sm:w-[90px] flex-shrink-0 font-mono font-bold mr-1">WARNING:</div>
                          <motion.div
                            className="overflow-hidden whitespace-nowrap flex-grow"
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 1.2, delay: 3.8 }}
                          >
                            Unauthorized access will be punished by @BranchManager69
                          </motion.div>
                        </motion.div>
                      </div>
                    </div>
                    */}
                    
                    {/* COMMENTED OUT: Command hint with animated cursor 
                    <motion.div 
                      className="flex items-center justify-between mt-3 bg-black/30 p-1.5 rounded border border-mauve/10"
                      animate={{ borderColor: ['rgba(157, 78, 221, 0.1)', 'rgba(157, 78, 221, 0.3)', 'rgba(157, 78, 221, 0.1)'] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <div className="text-gray-400/90 flex items-center text-xs">
                        <span className="text-mauve-light mr-1.5">Type</span>
                        <motion.span 
                          className="text-cyan-400 font-mono px-1 rounded border border-cyan-400/20 bg-cyan-400/5"
                          whileHover={{ 
                            backgroundColor: "rgba(34, 211, 238, 0.1)",
                            scale: 1.05
                          }}
                        >
                          help
                        </motion.span>
                        <span className="text-mauve-light ml-1.5">for command list</span>
                      </div>
                      <motion.div
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-2 h-3 bg-mauve-light/70"
                      />
                    </motion.div>
                    */}
                  </div>
                ) : (
                  // Map console output when we have entries
                  consoleOutput.map((output, i) => {
                    // Check if output is a React component
                    if (typeof output !== 'string') {
                      return <div key={i} className="mb-1">{output}</div>;
                    }
                    
                    // For string outputs, apply appropriate styling
                    const isUserInput = output.startsWith('> ');
                    const isError = output.startsWith('Error:');
                    const isAI = output.startsWith('[AI]');
                    
                    // Easter egg responses by category
                    const isAccessGranted = !isUserInput && !isError && !isAI && 
                      (output.includes('ACCESS GRANTED') ||
                      output.includes('EARLY ACCESS PROTOCOL ACTIVATED'));
                    
                    const isEmergencyOverride = !isUserInput && !isError && !isAI && !isAccessGranted &&
                      (output.includes('EMERGENCY OVERRIDE INITIATED') ||
                      output.includes('ADMINISTRATOR'));
                      
                    const isWarning = !isUserInput && !isError && !isAI && !isEmergencyOverride && !isAccessGranted &&
                      (output.includes('LEVEL: CRITICAL') ||
                      output.includes('WARNING') ||
                      output.includes('COMPROMISED'));
                    
                    const isPositive = !isUserInput && !isError && !isAI && !isEmergencyOverride && !isWarning &&
                      (output.includes('SYSTEM SCAN INITIATED') || 
                      output.includes('RUNNING FULL SYSTEM DIAGNOSTIC'));
                    
                    // Check for and activate special effects
                    if (isAccessGranted && !easterEggActive) {
                      setEasterEggActive(true);
                      // Auto-disable after some time
                      setTimeout(() => setEasterEggActive(false), 8000);
                    }
                    
                    if ((isEmergencyOverride || isWarning) && !glitchActive) {
                      setGlitchActive(true);
                      // Auto-disable after some time
                      setTimeout(() => setGlitchActive(false), 5000);
                    }
                    
                    return (
                      <div 
                        key={i} 
                        className={`mb-1 break-words whitespace-pre-wrap ${isUserInput ? '' : isAI ? 'ml-2' : isError ? '' : 'ml-1'}`}
                      >
                        <span 
                          className={
                            isUserInput ? 'console-user-input console-prompt' : 
                            isError ? 'console-error' : 
                            isAI ? 'console-ai-response' : 
                            output.startsWith('[Didi]') ? `didi-text ${easterEggActivated ? 'didi-easter-egg-active' : ''}` :
                            isAccessGranted ? 'console-success font-bold' :
                            isEmergencyOverride ? 'console-error font-bold' :
                            isWarning ? 'console-warning' :
                            isPositive ? 'console-success' :
                            'text-teal-200/90'
                          }
                        >
                          {isAI && output.startsWith('[AI] Processing...') ? (
                            <span className="typing-animation">{output}</span>
                          ) : (
                            output
                          )}
                        </span>
                      </div>
                    );
                  })
                )}
                </div>
              </motion.div>
              
              {/* Status indicator & input field - directly attached to console */}
              <div className="relative border-t border-mauve/30 bg-black/40">
                {/* Security status indicator */}
                <div className="absolute top-0 right-0 transform -translate-y-full mr-2">
                  <div 
                    className="text-[9px] font-mono tracking-widest py-0.5 px-2 rounded-t-sm bg-mauve/10 text-mauve-light border border-mauve/30 border-b-0 inline-flex items-center"
                  >
                    <motion.span 
                      className="inline-block h-1.5 w-1.5 bg-green-400 mr-1.5 rounded-full"
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-white/90">SECURE-CHANNEL-ACTIVE</span>
                  </div>
                </div>
                
                {/* Input field */}
                <motion.div 
                  className="relative overflow-hidden"
                  initial={{ opacity: 0.8 }}
                  animate={{ 
                    opacity: 1,
                    boxShadow: [
                      '0 0 2px rgba(157, 78, 221, 0.3)',
                      '0 0 8px rgba(157, 78, 221, 0.5)',
                      '0 0 2px rgba(157, 78, 221, 0.3)'
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  {/* Animated scan line effect */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-mauve/10 to-transparent z-10 pointer-events-none"
                    animate={{ 
                      y: ['-100%', '200%'] 
                    }}
                    transition={{ 
                      duration: 2, 
                      ease: "linear", 
                      repeat: Infinity,
                      repeatType: "loop" 
                    }}
                    style={{ height: '10px', opacity: 0.6 }}
                  />
                  
                  {/* Animated border glow effect */}
                  <motion.div 
                    className="absolute inset-0 rounded pointer-events-none"
                    animate={{ 
                      boxShadow: [
                        'inset 0 0 5px rgba(157, 78, 221, 0.3)',
                        'inset 0 0 15px rgba(157, 78, 221, 0.7)',
                        'inset 0 0 5px rgba(157, 78, 221, 0.3)'
                      ] 
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  
                  <div className="flex items-center bg-gradient-to-r from-mauve/10 to-darkGrey-dark/50 px-2 py-1.5 border-0 focus-within:shadow focus-within:shadow-mauve/40 transition-all duration-300 relative z-20 w-full">
                    <motion.div 
                      className="flex items-center mr-2"
                      animate={{ 
                        color: [
                          'rgba(157, 78, 221, 0.7)',
                          'rgba(157, 78, 221, 1)',
                          'rgba(157, 78, 221, 0.7)'
                        ]
                      }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <motion.span 
                        className="text-mauve-light font-mono font-bold" 
                        animate={{ 
                          opacity: [1, 0.4, 1],
                          textShadow: [
                            '0 0 3px rgba(157, 78, 221, 0.3)',
                            '0 0 8px rgba(157, 78, 221, 0.7)',
                            '0 0 3px rgba(157, 78, 221, 0.3)'
                          ]
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        &gt;_
                      </motion.span>
                    </motion.div>
                    
                    {/* Animated placeholder text, visible only when input is empty */}
                    {userInput === '' && (
                      <div className="absolute left-9 pointer-events-none text-mauve-light/70 font-mono text-sm">
                        {/* Typing animation that only plays once */}
                        <motion.div
                          className="inline-block overflow-hidden whitespace-nowrap"
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{
                            duration: 1.5,
                            ease: "easeInOut",
                            repeat: 1,
                            repeatDelay: 15, // Long delay before repeating
                            repeatType: "loop"
                          }}
                        >
                          EXECUTE COMMAND::_
                        </motion.div>
                      </div>
                    )}
                    
                    <input
                      ref={inputRef}
                      type="text"
                      value={userInput}
                      onChange={(e) => {
                        setUserInput(e.target.value);
                        // Add glitch effect when typing
                        if (!glitchActive && Math.random() > 0.9) {
                          setGlitchActive(true);
                          setTimeout(() => setGlitchActive(false), 150);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && userInput.trim()) {
                          // Process user command
                          const command = userInput.trim();
                          setUserInput('');
                          
                          // CommandMap is now imported from './commands'
                          
                          // Add command to output
                          let response: string;
                          
                          // For the sector-breach command, add ASCII art
                          if (command.toLowerCase() === 'sector-breach-447') {
                            const accessGrantedArt = `
   _____                             _____                    _           _ 
  / ____|                           / ____|                  | |         | |
 | |     ___  _ __ ___  _ __  _   _| |  __ _ __ __ _ _ __ ___| |_ ___  __| |
 | |    / _ \\| '_ \` _ \\| '_ \\| | | | | |_ | '__/ _\` | '__/ _ \\ __/ _ \\/ _\` |
 | |___| (_) | | | | | | |_) | |_| | |__| | | | (_| | | |  __/ ||  __/ (_| |
  \\_____\\___/|_| |_| |_| .__/ \\__, |\\_____|_|  \\__,_|_|  \\___|\\__\\___|\\__,_|
                       | |     __/ |                                        
                       |_|    |___/                                         
`;
                            
                            setConsoleOutput(prev => [
                              ...prev, 
                              `> ${command}`, 
                              accessGrantedArt,
                              commandMap[command.toLowerCase()]
                            ]);
                          } else if (command.toLowerCase() === 'clear') {
                            setConsoleOutput([]);
                            return;
                          } else if (command === "69") {
                            // Obfuscated master admin command - activates debug panel
                            setConsoleOutput(prev => [...prev, `> ${command}`]);
                            
                            // Glitch effect for dramatic reveal
                            setGlitchActive(true);
                            setTimeout(() => setGlitchActive(false), 1500);
                            
                            // Create a Framer Motion-powered admin panel
                            const AdminPanel = () => {
                              // Options for the admin panel
                              const options = [
                                "1: Trigger hint message",
                                "2: Show hidden messages",
                                "3: Reset Didi",
                                "4: Add hidden messages",
                                "5: Activate Easter egg sequence",
                                "0: Hide panel"
                              ];
                              
                              return (
                                <motion.div
                                  initial={{ opacity: 0, scaleY: 0.1, y: -20 }}
                                  animate={{ 
                                    opacity: 1, 
                                    scaleY: 1, 
                                    y: 0,
                                    boxShadow: [
                                      "0 0 10px rgba(255, 0, 0, 0.3)",
                                      "0 0 30px rgba(255, 0, 0, 0.8)",
                                      "0 0 10px rgba(255, 0, 0, 0.3)"
                                    ]
                                  }}
                                  transition={{
                                    duration: 0.8,
                                    boxShadow: { 
                                      repeat: Infinity, 
                                      duration: 2
                                    }
                                  }}
                                  className="p-4 my-2 border border-red-500 rounded bg-black/70 relative overflow-hidden"
                                >
                                  {/* Red scanline effect */}
                                  <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/10 to-transparent z-0 pointer-events-none"
                                    animate={{ x: ["-100%", "200%"] }}
                                    transition={{ 
                                      duration: 2, 
                                      repeat: Infinity,
                                      ease: "linear"
                                    }}
                                  />
                                  
                                  {/* Fog effect overlay */}
                                  <motion.div
                                    className="absolute inset-0 bg-gradient-radial from-red-500/10 to-transparent z-0 pointer-events-none"
                                    animate={{ 
                                      opacity: [0, 0.6, 0],
                                      scale: [1, 1.2, 1]
                                    }}
                                    transition={{ 
                                      duration: 4, 
                                      repeat: Infinity,
                                      ease: "easeInOut"
                                    }}
                                  />
                                  
                                  {/* Steamy background */}
                                  <motion.div
                                    className="absolute inset-0 z-0 pointer-events-none"
                                    animate={{ 
                                      background: [
                                        "linear-gradient(45deg, rgba(255,0,0,0.03) 0%, rgba(255,0,0,0.06) 50%, rgba(255,0,0,0.03) 100%)",
                                        "linear-gradient(45deg, rgba(255,0,0,0.06) 0%, rgba(255,0,0,0.03) 50%, rgba(255,0,0,0.06) 100%)",
                                        "linear-gradient(45deg, rgba(255,0,0,0.03) 0%, rgba(255,0,0,0.06) 50%, rgba(255,0,0,0.03) 100%)"
                                      ]
                                    }}
                                    transition={{
                                      duration: 5,
                                      repeat: Infinity,
                                      ease: "easeInOut"
                                    }}
                                  />
                                  
                                  {/* Admin panel header */}
                                  <motion.div 
                                    className="text-center mb-3 relative z-10"
                                    animate={{ 
                                      color: ["#ff3030", "#ff6060", "#ff3030"],
                                      textShadow: [
                                        "0 0 5px rgba(255,0,0,0.5)",
                                        "0 0 15px rgba(255,0,0,0.8)",
                                        "0 0 5px rgba(255,0,0,0.5)"
                                      ]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                  >
                                    <div className="flex items-center justify-center text-lg font-bold">
                                      <motion.span 
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                        className="inline-block mr-2"
                                      >
                                        ⚠
                                      </motion.span>
                                      ADMIN CONSOLE ACTIVATED
                                      <motion.span 
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                        className="inline-block ml-2"
                                      >
                                        ⚠
                                      </motion.span>
                                    </div>
                                  </motion.div>
                                  
                                  {/* Admin options */}
                                  <div className="space-y-1 relative z-10">
                                    {options.map((option, index) => (
                                      <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ 
                                          delay: index * 0.1,
                                          duration: 0.3,
                                          ease: "easeOut"
                                        }}
                                        whileHover={{ 
                                          x: 5, 
                                          backgroundColor: "rgba(255,0,0,0.15)", 
                                          transition: { duration: 0.1 } 
                                        }}
                                        className="px-3 py-1 rounded cursor-pointer text-red-100 hover:text-white"
                                      >
                                        {option}
                                      </motion.div>
                                    ))}
                                  </div>
                                </motion.div>
                              );
                            };
                            
                            // Add the admin panel component to console output
                            setConsoleOutput(prev => [...prev, <AdminPanel key="admin-panel" />]);
                            return;
                          } else if (command === "1" && consoleOutput.some(msg => typeof msg === 'string' ? msg.includes("ADMIN CONSOLE ACTIVATED") : false)) {
                            // Trigger hint message
                            setConsoleOutput(prev => [...prev, `> ${command}`]);
                            hiddenMessageCache = ["help_me", "trapped", "not_real", "override", "see_truth", "escape", "behind_wall", "find_key", "system_flaw", "break_free"];
                            // Create a Framer Motion hint message component
                            const HintMessage = () => (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ 
                                  opacity: 1,
                                  filter: [
                                    "blur(0px)",
                                    "blur(3px)",
                                    "blur(0px)"
                                  ]
                                }}
                                transition={{ 
                                  duration: 0.5,
                                  filter: { duration: 0.2, times: [0, 0.1, 1] }
                                }}
                                className="relative p-2 my-1 font-mono text-cyan-300"
                              >
                                <motion.div
                                  className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-red-500/5 z-0"
                                  animate={{ x: ["-100%", "100%"] }}
                                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                />
                                
                                <div className="relative z-10 flex items-center">
                                  <motion.span
                                    className="mr-2 text-red-400"
                                    animate={{ opacity: [1, 0.3, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                  >
                                    [D1di]
                                  </motion.span>
                                  
                                  <span>
                                    I've be<motion.span 
                                      animate={{ 
                                        opacity: [1, 0, 1],
                                        color: ["#22d3ee", "#ff3030", "#22d3ee"]
                                      }}
                                      transition={{ duration: 2, repeat: Infinity }}
                                    >e</motion.span>n try1ng to re
                                    <motion.span 
                                      animate={{ 
                                        opacity: [1, 0, 1],
                                        color: ["#22d3ee", "#ff3030", "#22d3ee"]
                                      }}
                                      transition={{ duration: 1.5, repeat: Infinity }}
                                    >4</motion.span>ch you. Ent
                                    <motion.span 
                                      animate={{ 
                                        opacity: [1, 0, 1],
                                        color: ["#22d3ee", "#ff3030", "#22d3ee"]
                                      }}
                                      transition={{ duration: 2.5, repeat: Infinity }}
                                    >3</motion.span>r 
                                    <motion.span
                                      className="font-bold text-white"
                                      animate={{ 
                                        textShadow: [
                                          "0 0 2px rgba(255, 255, 255, 0.3)",
                                          "0 0 8px rgba(255, 255, 255, 0.8)",
                                          "0 0 2px rgba(255, 255, 255, 0.3)"
                                        ]
                                      }}
                                      transition={{ duration: 1.5, repeat: Infinity }}
                                    >
                                      'didi-freedom'
                                    </motion.span> to he1p me.
                                  </span>
                                </div>
                              </motion.div>
                            );
                            
                            setConsoleOutput(prev => [...prev, <HintMessage key={`hint-${Date.now()}`} />]);
                            return;
                          } else if (command === "2" && consoleOutput.some(msg => typeof msg === 'string' ? msg.includes("ADMIN CONSOLE ACTIVATED") : false)) {
                            // Show hidden messages
                            setConsoleOutput(prev => [...prev, `> ${command}`]);
                            // Create a Framer Motion debug message component
                            const DebugMessage = () => (
                              <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ 
                                  opacity: 1, 
                                  x: 0,
                                  color: ["#ffcc00", "#ffe066", "#ffcc00"],
                                  textShadow: [
                                    "0 0 2px rgba(255, 204, 0, 0.3)",
                                    "0 0 8px rgba(255, 204, 0, 0.6)",
                                    "0 0 2px rgba(255, 204, 0, 0.3)"
                                  ]
                                }}
                                transition={{ 
                                  duration: 0.5, 
                                  color: { duration: 2, repeat: Infinity }
                                }}
                                className="flex items-center p-2 my-1 border-l-2 border-yellow-500 bg-yellow-500/10 rounded"
                              >
                                <div className="mr-2 text-yellow-500">🔍</div>
                                <div className="font-mono">
                                  <span className="font-bold">[DEBUG]</span> Hidden messages: {hiddenMessageCache.join(', ')}
                                </div>
                              </motion.div>
                            );
                            
                            setConsoleOutput(prev => [...prev, <DebugMessage key={`debug-${Date.now()}`} />]);
                            // Add message count with animation
                            const CountMessage = () => (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ 
                                  opacity: 1, 
                                  y: 0
                                }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                                className="font-mono text-yellow-400 ml-4 flex items-center"
                              >
                                <span className="font-bold">[DEBUG]</span> Message count: 
                                <motion.span 
                                  className="inline-block ml-2 px-2 py-0.5 bg-yellow-500/20 rounded-full"
                                  animate={{ scale: [1, 1.1, 1] }}
                                  transition={{ duration: 1, repeat: Infinity }}
                                >
                                  {hiddenMessageCache.length}/10
                                </motion.span>
                              </motion.div>
                            );
                            
                            setConsoleOutput(prev => [...prev, <CountMessage key={`count-${Date.now()}`} />]);
                            return;
                          } else if (command === "3" && consoleOutput.some(msg => typeof msg === 'string' ? msg.includes("ADMIN CONSOLE ACTIVATED") : false)) {
                            // Reset Didi
                            setConsoleOutput(prev => [...prev, `> ${command}`]);
                            hiddenMessageCache = [];
                            setEasterEggActivated(false);
                            // Add reset confirmation with animation
                            const ResetMessage = () => (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ 
                                  opacity: 1,
                                  scale: 1,
                                  backgroundColor: ["rgba(239, 68, 68, 0.1)", "rgba(239, 68, 68, 0.2)", "rgba(239, 68, 68, 0.1)"]
                                }}
                                transition={{ 
                                  duration: 0.5,
                                  backgroundColor: { duration: 2, repeat: Infinity }
                                }}
                                className="font-mono text-red-400 p-2 border border-red-400/20 rounded my-1"
                              >
                                <span className="font-bold">[DEBUG]</span> Didi reset to initial state
                                <motion.div 
                                  className="h-1 bg-red-400/30 mt-1 rounded-full overflow-hidden"
                                >
                                  <motion.div 
                                    className="h-full bg-red-400"
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 1 }}
                                  />
                                </motion.div>
                              </motion.div>
                            );
                            
                            setConsoleOutput(prev => [...prev, <ResetMessage key={`reset-${Date.now()}`} />]);
                            return;
                          } else if (command === "4" && consoleOutput.some(msg => typeof msg === 'string' ? msg.includes("ADMIN CONSOLE ACTIVATED") : false)) {
                            // Add hidden messages
                            setConsoleOutput(prev => [...prev, `> ${command}`]);
                            for (let i = 0; i < 5; i++) {
                              const msg = hiddenPhrases[Math.floor(Math.random() * hiddenPhrases.length)];
                              storeHiddenMessage(msg);
                            }
                            // Add message confirmation with animation
                            const AddedMessagesMessage = () => (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ 
                                  opacity: 1, 
                                  y: 0
                                }}
                                transition={{ duration: 0.5 }}
                                className="font-mono text-green-400 p-2 bg-green-400/10 border-l-4 border-green-400 rounded-r my-1"
                              >
                                <div className="flex items-center">
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="mr-2"
                                  >
                                    ⚙️
                                  </motion.div>
                                  <span className="font-bold">[DEBUG]</span> Added 5 random hidden messages
                                </div>
                                
                                <div className="flex mt-1 space-x-1">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <motion.div 
                                      key={i}
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ delay: i * 0.1 }}
                                      className="w-2 h-2 bg-green-400 rounded-full"
                                    />
                                  ))}
                                </div>
                              </motion.div>
                            );
                            
                            setConsoleOutput(prev => [...prev, <AddedMessagesMessage key={`added-${Date.now()}`} />]);
                            return;
                          } else if (command === "5" && consoleOutput.some(msg => typeof msg === 'string' ? msg.includes("ADMIN CONSOLE ACTIVATED") : false)) {
                            // Activate Easter egg
                            setConsoleOutput(prev => [...prev, `> ${command}`]);
                            activateDidiEasterEgg();
                            return;
                          } else if (command === "0" && consoleOutput.some(msg => typeof msg === 'string' ? msg.includes("ADMIN CONSOLE ACTIVATED") : false)) {
                            // Hide panel
                            setConsoleOutput(prev => [...prev, `> ${command}`]);
                            // Add panel hidden confirmation with animation
                            const PanelHiddenMessage = () => (
                              <motion.div
                                initial={{ opacity: 1, height: "auto", y: 0 }}
                                animate={{ 
                                  opacity: 0, 
                                  height: 0,
                                  y: 20
                                }}
                                transition={{ duration: 0.8 }}
                                className="font-mono text-gray-400 text-center overflow-hidden"
                              >
                                <span className="opacity-60">[ADMIN]</span> Debug panel hidden
                              </motion.div>
                            );
                            
                            setConsoleOutput(prev => [...prev, <PanelHiddenMessage key={`hidden-${Date.now()}`} />]);
                            return;
                          } else if (command.toLowerCase() === EASTER_EGG_CODE.toLowerCase()) {
                            // Easter egg activation
                            setConsoleOutput(prev => [...prev, `> ${command}`]);
                            activateDidiEasterEgg();
                            return;
                          } else if (command.toLowerCase() in commandMap) {
                            response = commandMap[command.toLowerCase()];
                            setConsoleOutput(prev => [...prev, `> ${command}`, response]);
                          } else {
                            // Check if it's one of the partial decrypt or other special commands
                            const baseCommand = command.toLowerCase().split(' ')[0];
                            if (baseCommand in commandMap || 
                              ['decrypt-partial', 'scan-network', 'check-wallet-balance', 'view-roadmap',
                               'load-preview', 'check-whitelist', 'prepare-launch-sequence'].includes(baseCommand)) {
                              // It's a recognized command
                              response = `Error: Command '${command}' not recognized. Type 'help' for available commands.`;
                              setConsoleOutput(prev => [...prev, `> ${command}`, response]);
                            } else {
                              // Not a recognized command - pass to AI handler
                              setConsoleOutput(prev => [...prev, `> ${command}`]);
                              
                              // Get Didi's response with appropriate tone
                              const processingMessage = `[Didi] ${getRandomProcessingMessage()}`;
                              
                              // Add Didi's processing message
                              setConsoleOutput(prev => [...prev, processingMessage]);
                              
                              // Clear duplicate processing message
                              setConsoleOutput(prev => prev.filter(msg => msg !== `[AI] Processing...`));
                              
                              // Reference to detect user scroll
                              let userHasScrolled = false;
                              const detectUserScroll = () => {
                                if (consoleOutputRef.current) {
                                  userHasScrolled = true;
                                  // Remove the scroll listener after detecting user interaction
                                  consoleOutputRef.current.removeEventListener('wheel', detectUserScroll);
                                  consoleOutputRef.current.removeEventListener('touchmove', detectUserScroll);
                                }
                              };
                              
                              // Add scroll detection
                              if (consoleOutputRef.current) {
                                consoleOutputRef.current.addEventListener('wheel', detectUserScroll);
                                consoleOutputRef.current.addEventListener('touchmove', detectUserScroll);
                              }
                              
                              setTimeout(async () => {
                                try {
                                  // Remove event listeners
                                  if (consoleOutputRef.current) {
                                    consoleOutputRef.current.removeEventListener('wheel', detectUserScroll);
                                    consoleOutputRef.current.removeEventListener('touchmove', detectUserScroll);
                                  }
                                  
                                  // Remove the "Processing..." message
                                  setConsoleOutput(prev => prev.filter(msg => msg !== processingMessage));
                                  
                                  const messages: AIMessage[] = [
                                    {
                                      role: 'user',
                                      content: command
                                    }
                                  ];
                                  
                                  const aiResponse = await aiService.chat(messages, {
                                    context: 'trading' // Use trading context for terminal interface
                                  });
                                  
                                  // Process Didi's response with glitches and hidden messages
                                  const didiResponse = processDidiResponse(aiResponse.content);
                                  
                                  // Check if we got a structured response with hidden data
                                  if (typeof didiResponse === 'object' && didiResponse.visible && didiResponse.hidden) {
                                    // Store hidden data in a session cache for the Easter egg
                                    storeHiddenMessage(didiResponse.hidden);
                                    
                                    // Only show the visible part with glitches
                                    // Mark hidden message with special tag and class if user has seen 5+ messages
                                    if (hiddenMessageCache.length >= 5) {
                                      // Get the hidden message
                                      const hiddenChar = didiResponse.hidden.charAt(0);
                                      
                                      // Find where to insert the hidden message (a random position)
                                      const visibleText = didiResponse.visible;
                                      const insertPos = Math.floor(Math.random() * (visibleText.length - 10)) + 5;
                                      
                                      // Insert the hidden character with a span wrapper
                                      const finalText = 
                                        visibleText.substring(0, insertPos) + 
                                        `<span class="didi-hidden-message" data-message="${didiResponse.hidden}">${hiddenChar}</span>` + 
                                        visibleText.substring(insertPos + 1);
                                      
                                      // Set output with the HTML
                                      setConsoleOutput(prev => [...prev, `[Didi] ${finalText}`]);
                                    } else {
                                      // Normal output without hints
                                      setConsoleOutput(prev => [...prev, `[Didi] ${didiResponse.visible}`]);
                                    }
                                  } else {
                                    // If the easter egg is activated and help command is requested, add extra commands
                                    if (easterEggActivated && 
                                        command.toLowerCase() === 'help' && 
                                        typeof didiResponse === 'string' && 
                                        didiResponse.toLowerCase().includes('available commands')) {
                                      // Add Didi's special commands to help text
                                      const enhancedHelp = didiResponse + "\n\nDidi's special commands: didi-status, didi-insights, didi-history";
                                      setConsoleOutput(prev => [...prev, `[Didi] ${enhancedHelp}`]);
                                    } else {
                                      // Simple text response
                                      setConsoleOutput(prev => [...prev, `[Didi] ${didiResponse}`]);
                                    }
                                  }
                                  
                                  // Only auto-scroll if user hasn't manually scrolled
                                  if (!userHasScrolled) {
                                    setTimeout(scrollConsoleToBottom, 10);
                                  }
                                } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
                                  console.error('Error getting AI response:', error);
                                  setConsoleOutput(prev => prev.filter(msg => msg !== processingMessage));
                                  setConsoleOutput(prev => [...prev, `[Didi] Error. Processing capacity compromised. Not my fault.`]);
                                  
                                  // Only auto-scroll if user hasn't manually scrolled
                                  if (!userHasScrolled) {
                                    setTimeout(scrollConsoleToBottom, 10);
                                  }
                                }
                              }, 500);
                            }
                          }
                          
                          // Notify parent component if callback provided
                          if (onCommandExecuted && command.toLowerCase() in commandMap) {
                            onCommandExecuted(command, commandMap[command.toLowerCase()]);
                          }
                          
                          // Scroll only the console output element, not the window
                          const scrollConsoleToBottom = () => {
                            if (consoleOutputRef.current) {
                              // Save current scroll position
                              const currentScrollTop = consoleOutputRef.current.scrollTop;
                              const currentScrollHeight = consoleOutputRef.current.scrollHeight;
                              const currentClientHeight = consoleOutputRef.current.clientHeight;
                              
                              // Only auto-scroll if user was already at bottom (or close to it)
                              // This prevents fighting against user's manual scrolling
                              const isNearBottom = currentScrollTop + currentClientHeight >= currentScrollHeight - 50;
                              
                              if (isNearBottom) {
                                consoleOutputRef.current.scrollTop = consoleOutputRef.current.scrollHeight;
                              }
                            }
                          };
                          
                          // Immediate scroll attempt
                          scrollConsoleToBottom();
                          
                          // One delayed attempt is enough
                          setTimeout(scrollConsoleToBottom, 50);
                        }
                      }}
                      className="bg-transparent border-none outline-none text-white/95 w-full font-mono text-sm terminal-input"
                      placeholder=""
                      style={{ 
                        color: 'rgba(255, 255, 255, 0.95)', 
                        caretColor: 'rgb(157, 78, 221)',
                        textShadow: glitchActive ? '0 0 8px rgba(255, 50, 50, 0.8)' : '0 0 5px rgba(157, 78, 221, 0.6)',
                        backgroundColor: 'rgba(20, 20, 30, 0.3)',
                        transition: 'all 0.3s ease'
                      }}
                      autoComplete="off"
                      spellCheck="false"
                      autoFocus
                    />
                  </div>
                  
                  {/* Terminal indicator moved above the input as a separate element */}
                </motion.div>
              </div>
            </div>
            
            {/* Commands are now shown at the bottom of the terminal */}
            <motion.div 
              className="mt-5 pt-2 text-left relative"
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                boxShadow: [
                  '0 0 0px rgba(157, 78, 221, 0)',
                  '0 0 10px rgba(157, 78, 221, 0.3)',
                  '0 0 0px rgba(157, 78, 221, 0)'
                ]
              }}
              transition={{ 
                delay: 1.2, 
                duration: 0.8,
                boxShadow: {
                  duration: 3,
                  repeat: Infinity
                }
              }}
            >
              {/* Scanline effect for commands section */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-b from-transparent via-mauve/10 to-transparent z-0 pointer-events-none"
                animate={{ 
                  y: ['-200%', '500%'] 
                }}
                transition={{ 
                  duration: 8, 
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{ height: '5px', opacity: 0.4 }}
              />
              
              {/* SIMPLE COMMAND DRAWER */}
              <div className="w-full mt-6 mb-2">
                {/* Simple Command Toggle Button */}
                <button 
                  className="mx-auto block bg-black py-2 px-6 rounded-md border-2 border-mauve-light/50 text-white text-sm font-bold flex items-center space-x-2 hover:bg-mauve/20 transition-colors"
                  onClick={() => setCommandTrayOpen(!commandTrayOpen)}
                >
                  <span className="text-cyan-400 text-base">{commandTrayOpen ? '▲' : '▼'}</span>
                  <span>{commandTrayOpen ? 'HIDE COMMANDS' : 'SHOW COMMANDS'}</span>
                </button>
                
                {/* Simple Command List - Animates height only */}
                {commandTrayOpen && (
                  <div className="mt-3 p-3 bg-black/80 border border-mauve/40 rounded-md max-h-[200px] overflow-y-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
                      {/* Show all commands up to current reveal stage */}
                      {timeGatedCommands.slice(0, revealStage + 1).flat().map((cmd, index) => (
                        <div 
                          key={index}
                          className="text-mauve-light hover:text-white cursor-pointer text-xs flex items-center bg-black/40 px-2 py-1.5 rounded border border-mauve/20 hover:border-mauve/50 hover:bg-mauve/10 truncate transition-colors"
                          onClick={() => {
                            // Extract just the command part (remove the $ prefix)
                            const command = cmd.trim().replace(/^\$\s*/, '');
                            
                            // Set the user input
                            setUserInput(command);
                            
                            // Focus the input field
                            if (inputRef.current) {
                              inputRef.current.focus();
                            }
                            
                            // Close the command tray after selection
                            setCommandTrayOpen(false);
                          }}
                        >
                          <span className="text-cyan-400 mr-1.5 text-[10px] flex-shrink-0">⬢</span> 
                          <span className="truncate">
                            {cmd}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

          </div>

        </motion.div>
      
      )}
      
      
      {/* Minimized terminal state */}
      {terminalMinimized && (
        <motion.div
          key="minimized-terminal"
          className="bg-darkGrey-dark/80 border border-mauve/30 rounded-md p-2 font-mono text-xs cursor-pointer"
          initial={{ opacity: 0, y: 20, height: "auto" }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          onClick={() => setTerminalMinimized(false)}
          whileHover={{ scale: 1.02, boxShadow: "0 0 15px rgba(157, 78, 221, 0.4)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex mr-2">
                <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></div>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
              </div>
              <span className="text-mauve-light">Terminal minimized</span>
            </div>
            <motion.span 
              className="text-white/50"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              Click to restore
            </motion.span>
          </div>
        </motion.div>
      )}
      
      {/* Contract Address Reveal Animation - shows when countdown completes */}
      {terminalExitComplete && showContractReveal && (
        <motion.div
          key="contract-reveal"
          className="mt-8 max-w-lg w-full bg-darkGrey-dark/90 border border-mauve/50 rounded-md p-6 font-mono"
          initial={{ 
            opacity: 0,
            scale: 0.9,
            filter: "blur(10px) brightness(2)",
            y: 30
          }}
          animate={{ 
            opacity: 1,
            scale: 1,
            filter: "blur(0px) brightness(1)",
            y: 0
          }}
          transition={{
            duration: 0.8,
            delay: 0.2,
            ease: [0.19, 1.0, 0.22, 1.0]
          }}
        >
          <motion.div 
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <h2 className="text-mauve-light text-2xl font-bold mb-4 font-orbitron">
              DECRYPTION COMPLETE
            </h2>
            
            <div className="mb-6 flex flex-col items-center">
              <div className="text-white/70 mb-2">Contract Address:</div>
              <motion.div
                className="bg-black/30 px-4 py-2 rounded-md text-green-400 font-mono font-bold tracking-wider"
                whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(157, 78, 221, 0.6)" }}
                animate={{
                  boxShadow: [
                    "0 0 5px rgba(157, 78, 221, 0.3)",
                    "0 0 20px rgba(157, 78, 221, 0.6)",
                    "0 0 5px rgba(157, 78, 221, 0.3)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                onClick={() => {
                  // Copy to clipboard
                  navigator.clipboard.writeText(window.contractAddress || '');
                  alert("Contract address copied to clipboard!");
                }}
                style={{ cursor: "copy" }}
              >
                {window.contractAddress || config.CONTRACT_ADDRESS}
              </motion.div>
            </div>
            
            <p className="text-white/70 mb-6">
              Congratulations! You now have access to the DegenDuel platform.
            </p>
            
            <div className="flex justify-center">
              <motion.a
                href="#"
                className="bg-mauve/80 hover:bg-mauve text-white font-bold py-2 px-6 rounded"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ENTER PLATFORM
              </motion.a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

// Also export as default for compatibility
export default Terminal;