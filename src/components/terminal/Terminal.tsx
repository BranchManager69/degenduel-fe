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
import React, { /* useCallback, */ useEffect, useMemo, useRef, useState } from 'react';
import { AIMessage, aiService } from '../../services/ai';
import { commandMap } from './commands';
import './Terminal.css';

// Extend Window interface to include contractAddress property
declare global {
  interface Window {
    contractAddress?: string;
  }
}

// Helper function to generate contract display
const getContractDisplay = (isReleaseTime: boolean, contractAddress: string) => {
  if (isReleaseTime) {
    // When release time has passed, show the real contract in 24-style green
    return (
      <span className="text-green-400 font-mono tracking-wider relative">
        {contractAddress}
        <motion.span 
          className="absolute top-0 left-0 bg-green-500/10 h-full" 
          style={{ width: "100%" }}
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </span>
    );
  } else {
    // Before release, show redacted display
    const redactedDisplay = "[ ██-█████████-████████ ]";
    return (
      <span className="text-red-400 font-mono tracking-wider relative">
        {redactedDisplay}
        <motion.span 
          className="absolute top-0 left-0 bg-red-500/20 h-full" 
          style={{ width: "100%" }}
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </span>
    );
  }
};

// Define the DecryptionTimer component with internal styling and logic
export const DecryptionTimer = ({ targetDate = new Date('2025-03-15T18:00:00-05:00'), contractAddress = '0x1111111111111111111111111111111111111111' }: { targetDate?: Date, contractAddress?: string }) => {
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
  
  // Calculate if it's release time
  const now = new Date();
  const isReleaseTime = now >= targetDate;
                   
  return (
    <motion.div 
      className="font-orbitron"
      layout
      transition={{
        layout: { type: "spring", bounce: 0.2, duration: 0.8 }
      }}
    >
      {isComplete ? (
        useSmoothRelease ? (
          // SMOOTH RELEASE STATE - Typing animation
          <motion.div 
            className="py-4"
            initial={{ opacity: 0, width: "auto" }}
            animate={{ 
              opacity: 1,
              width: "auto",
              transition: { duration: 0.5 }
            }}
            exit={{ opacity: 0 }}
            layoutId="terminal-content"
          >
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
                {getContractDisplay(isReleaseTime, contractAddress)}
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
          </motion.div>
        ) : (
          // ORIGINAL RELEASE STATE - Bouncy animation
          <motion.div 
            className="text-3xl sm:text-4xl text-green-400 font-bold py-4"
            layoutId="terminal-content"
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
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          layoutId="terminal-content"
        >
          <motion.div 
            className="flex justify-center gap-2 sm:gap-3 md:gap-3 lg:gap-3 px-4 py-5 bg-black/50 rounded-md border w-full max-w-xl mx-auto"
            style={{
              borderColor: "#33ff66",
              boxShadow: "0 0 15px rgba(51, 255, 102, 0.2)"
            }}
            animate={{
              boxShadow: [
                '0 0 5px rgba(51, 255, 102, 0.2)',
                '0 0 15px rgba(51, 255, 102, 0.4)',
                '0 0 5px rgba(51, 255, 102, 0.2)'
              ]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            layout
          >
            {/* CTU-style counter header */}
            <motion.div 
              className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-black px-3 py-1 rounded-sm text-xs font-mono tracking-wider"
              style={{ color: "#33ff66", borderTop: "1px solid #33ff66", borderLeft: "1px solid #33ff66", borderRight: "1px solid #33ff66" }}
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              COUNTDOWN ACTIVE
            </motion.div>
            
            <TimeUnit value={timeRemaining.days} label="DAYS" urgencyLevel={urgencyLevel} />
            <motion.div
              className="text-xl sm:text-2xl lg:text-3xl font-mono self-center mt-1 w-4 text-center"
              style={{ color: "#33ff66" }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity }}
            >:</motion.div>
            <TimeUnit value={timeRemaining.hours} label="HRS" urgencyLevel={urgencyLevel} />
            <motion.div
              className="text-xl sm:text-2xl lg:text-3xl font-mono self-center mt-1 w-4 text-center"
              style={{ color: "#33ff66" }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity }}
            >:</motion.div>
            <TimeUnit value={timeRemaining.minutes} label="MIN" urgencyLevel={urgencyLevel} />
            <motion.div
              className="text-xl sm:text-2xl lg:text-3xl font-mono self-center mt-1 w-4 text-center"
              style={{ color: "#33ff66" }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity }}
            >:</motion.div>
            <TimeUnit value={timeRemaining.seconds} label="SEC" urgencyLevel={urgencyLevel} />
          </motion.div>
          
          <motion.div 
            className="mt-4 text-sm font-mono px-3 py-2 bg-black/40 rounded border-l-2 mx-auto max-w-lg"
            style={{ borderColor: "#33ff66", color: "#33ff66" }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
            layout
          >
            <span style={{ opacity: 0.7 }}>// </span>
            SYSTEM STATUS: <span className="font-bold">AWAITING COUNTDOWN COMPLETION</span>
            <motion.span 
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              style={{ marginLeft: 2 }}
            >_</motion.span>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}

// Also export as default for compatibility

// Time unit component with 24-style digital clock appearance
const TimeUnit = ({ value, label, urgencyLevel = 0 }: { value: number, label: string, urgencyLevel?: number }) => {
  // Generate dynamic colors based on urgency level
  const getTextColor = () => {
    switch(urgencyLevel) {
      case 1: // Warning (<60s)
        return "#ffcc00";
      case 2: // Critical (<10s)
        return "#ff5050";
      case 3: // Complete
        return "#33ff66";
      default: // Normal
        return "#33ff66"; // 24-style digital green
    }
  };

  const getShadowColor = () => {
    switch(urgencyLevel) {
      case 1: // Warning (<60s)
        return "0 0 10px rgba(255, 204, 0, 0.7)";
      case 2: // Critical (<10s)
        return "0 0 10px rgba(255, 50, 50, 0.7)";
      case 3: // Complete
        return "0 0 10px rgba(51, 255, 102, 0.7)";
      default: // Normal
        return "0 0 10px rgba(51, 255, 102, 0.7)"; // 24-style digital green glow
    }
  };

  return (
    <div className="flex flex-col items-center w-12 sm:w-14 md:w-16 lg:w-20">
      <motion.div 
        className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-mono tabular-nums w-full text-center bg-black/50 px-1 py-1 rounded border border-opacity-30"
        style={{
          borderColor: getTextColor(),
          color: getTextColor(),
          textShadow: getShadowColor(),
          fontFamily: "'Courier New', monospace",
          letterSpacing: "1px"
        }}
        animate={{ 
          opacity: urgencyLevel >= 2 ? [1, 0.8, 1] : 1,
          textShadow: [
            getShadowColor(),
            `0 0 ${urgencyLevel >= 2 ? '15' : '12'}px ${getTextColor()}`,
            getShadowColor()
          ]
        }}
        transition={{
          duration: urgencyLevel >= 2 ? 0.5 : 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        whileHover={{
          // No scale change to prevent layout shifts
          textShadow: `0 0 15px ${getTextColor()}`
        }}
      >
        {value.toString().padStart(2, '0')}
      </motion.div>
      <div className="text-xs sm:text-sm font-bold tracking-wider mt-2 w-full text-center" style={{ color: getTextColor(), opacity: 0.8 }}>{label}</div>
    </div>
  );
}

// Also export as default for compatibility

// Types
// Size option for the Terminal component
export type TerminalSize = 'contracted' | 'middle' | 'large';

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
  size?: TerminalSize; // Size prop for controlling terminal dimensions
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
export const Terminal = ({ config, onCommandExecuted, size = 'middle' }: TerminalProps) => {
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
  // Visual state for Easter egg effects
  const [easterEggActive, setEasterEggActive] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);
  const [commandTrayOpen, setCommandTrayOpen] = useState(false);
  
  // When exit animation completes, we'll set this state
  useEffect(() => {
    if (terminalExitComplete) {
      onTerminalExit();
    }
  }, [terminalExitComplete]);

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
  
  /* Moved to standalone getContractDisplay function
  // Contract teaser can be used in commands that reference the contract before launch
  const contractTeaser = useMemo(() => {
    // 24-style classified/redacted display with dashes, matching the digital aesthetic
    const redactedDisplay = "[ ██-█████████-████████ ]";
    return (
      <span className="text-red-400 font-mono tracking-wider relative">
        {redactedDisplay}
        <motion.span 
          className="absolute top-0 left-0 bg-red-500/20 h-full" 
          style={{ width: "100%" }}
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </span>
    );
  }, []);
  */
  
  // Function to use the contract teaser if needed - IMPORTANT: moved to global helper
  /*
  const getContractDisplay = useCallback(() => {
    if (isReleaseTime) {
      // When release time has passed, show the real contract in 24-style green
      return (
        <span className="text-green-400 font-mono tracking-wider relative">
          {config.CONTRACT_ADDRESS}
          <motion.span 
            className="absolute top-0 left-0 bg-green-500/10 h-full" 
            style={{ width: "100%" }}
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </span>
      );
    } else {
      // Before release, show the redacted teaser
      return contractTeaser;
    }
  }, [isReleaseTime, config.CONTRACT_ADDRESS, contractTeaser]);
  */
  
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

  // Improved terminal text animation effect with smoother transitions
  useEffect(() => {
    // If it's past release date, skip the encryption animation
    if (isReleaseTime) {
      return;
    }
    
    let phraseIndex = 0;
    let charIndex = 0;
    let typeInterval: NodeJS.Timeout;
    let transitionTimeout: NodeJS.Timeout;
    let pauseTimeout: NodeJS.Timeout;
    
    const animateNextPhrase = () => {
      // If we've gone through all phrases, restart from beginning for continuous effect
      if (phraseIndex >= secretPhrases.length) {
        phraseIndex = 0;
      }
      
      // Type out current phrase with fixed timing
      typeInterval = setInterval(() => {
        const currentText = secretPhrases[phraseIndex].substring(0, charIndex + 1);
        
        // Update the content with a subtle fade
        setCurrentPhrase(currentText);
        
        charIndex++;
        
        if (charIndex >= secretPhrases[phraseIndex].length) {
          clearInterval(typeInterval);
          
          // Display completed phrase for 3 seconds, then fade out
          transitionTimeout = setTimeout(() => {
            // Just move to next phrase without clearing
            // This prevents layout shifts by keeping content height stable
            phraseIndex++;
            charIndex = 0;
            
            // Brief pause before next phrase
            pauseTimeout = setTimeout(() => {
              setCurrentPhrase(''); // Clear only after pause
              
              // Wait a bit before starting next phrase
              setTimeout(() => {
                animateNextPhrase();
              }, 400);
            }, 400);
          }, 3000);
        }
      }, 50);
    };
    
    // Start the animation with initial delay
    const initialDelay = setTimeout(() => {
      animateNextPhrase();
    }, 1000);
    
    // Improved cleanup that handles all interval/timeout clearing
    return () => {
      clearTimeout(initialDelay);
      clearInterval(typeInterval);
      clearTimeout(transitionTimeout);
      clearTimeout(pauseTimeout);
    };
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
    
    // Also set visual effects active
    setEasterEggActive(true);
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

  // Get the appropriate container class based on the size prop
  const getContainerClasses = () => {
    switch(size) {
      case 'contracted':
        return 'max-w-md'; // Small width (around 448px)
      case 'middle':
        return 'max-w-4xl'; // Medium width (around 896px)
      case 'large':
        return 'max-w-6xl'; // Large width (around 1152px)
      default:
        return 'max-w-4xl';
    }
  };
  
  // State to track if we should expand the terminal
  const [sizeState, setSizeState] = useState<TerminalSize>(size);
  
  // Make sure sizeState updates when prop changes
  useEffect(() => {
    setSizeState(size);
  }, [size]);
  
  // Toggle through terminal sizes
  const cycleSize = () => {
    switch(sizeState) {
      case 'contracted':
        setSizeState('middle');
        break;
      case 'middle':
        setSizeState('large');
        break;
      case 'large':
        setSizeState('contracted');
        break;
    }
  };

  return (
    <div className={`terminal-container ${getContainerClasses()} w-full mx-auto transition-all duration-300 ease-in-out`}>
      {!terminalMinimized && (
        <motion.div 
          ref={terminalRef}
          key="terminal"
          className={`bg-darkGrey-dark/80 border ${easterEggActivated ? 'border-green-400/60' : 'border-mauve/30'} font-mono text-sm relative p-4 rounded-md max-w-full w-full`}
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
              // onTerminalExit is called via the useEffect
            }
          }}
        >
          {/* Terminal Header */}
          <div className="flex justify-between items-center mb-2 border-b border-mauve/30 pb-2">
            <div className="text-xs font-bold">
              <span className="text-mauve">DEGEN</span>
              <span className="text-white">TERMINAL</span>
              <span className="text-mauve-light mx-2">v6.9</span>
              {easterEggActivated && (
                <span className="text-green-400 ml-1">UNLOCKED</span>
              )}
            </div>
            <div className="flex space-x-2">
              {/* Command tray toggle */}
              <button 
                type="button"
                onClick={() => setCommandTrayOpen(!commandTrayOpen)} 
                className="px-1 py-0.5 text-xs text-mauve-light hover:text-white border border-mauve-dark/30 hover:border-mauve/50 rounded bg-mauve-dark/20 hover:bg-mauve-dark/40 transition-colors"
              >
                {commandTrayOpen ? 'Hide Commands' : 'Show Commands'}
              </button>

              {/* Resize button */}
              <button
                type="button"
                onClick={cycleSize}
                className="px-1 py-0.5 text-xs text-mauve-light hover:text-white border border-mauve-dark/30 hover:border-mauve/50 rounded bg-mauve-dark/20 hover:bg-mauve-dark/40 transition-colors"
                title={sizeState === 'contracted' ? 'Expand to Medium' : sizeState === 'middle' ? 'Expand to Large' : 'Contract to Small'}
              >
                {sizeState === 'contracted' ? '↔️' : sizeState === 'middle' ? '⤢' : '⤏'}
              </button>
              
              {/* Minimize button */}
              <button
                type="button" 
                onClick={() => setTerminalMinimized(true)} 
                className="text-xs text-mauve/50 hover:text-mauve transition-colors"
              >
                _
              </button>
            </div>
          </div>
          
          {/* Command Tray - Quick reference for available commands */}
          {commandTrayOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-black/40 rounded p-2 mb-4 text-xs border border-mauve/20"
            >
              <div className="text-mauve-light mb-1">Available Commands:</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1">
                {/* All available commands, grouped by stages */}
                {timeGatedCommands.slice(0, revealStage + 1).flat().map((cmd, i) => (
                  <div key={i} className="text-mauve hover:text-white cursor-pointer transition-colors" onClick={() => {
                    setUserInput(cmd.replace('$ ', ''));
                    inputRef.current?.focus();
                  }}>{cmd}</div>
                ))}
                {easterEggActivated && (
                  <>
                    <div className="text-green-400 hover:text-green-300 cursor-pointer transition-colors" onClick={() => {
                      setUserInput('didi-status');
                      inputRef.current?.focus();
                    }}>$ didi-status</div>
                    <div className="text-green-400 hover:text-green-300 cursor-pointer transition-colors" onClick={() => {
                      setUserInput('didi-insights');
                      inputRef.current?.focus();
                    }}>$ didi-insights</div>
                    <div className="text-green-400 hover:text-green-300 cursor-pointer transition-colors" onClick={() => {
                      setUserInput('didi-history');
                      inputRef.current?.focus();
                    }}>$ didi-history</div>
                  </>
                )}
              </div>
            </motion.div>
          )}
          
          <div ref={terminalContentRef} className="relative">
            {/* Countdown Timer or Success State */}
            <div>
              <DecryptionTimer 
                targetDate={config.RELEASE_DATE} 
                contractAddress={config.CONTRACT_ADDRESS}
              />
            </div>
            
            {/* Secret message overlay with fixed height to prevent layout shifts */}
            {!isReleaseTime && (
              <div className="mt-4 mb-2 h-6 text-cyber-300/40 font-mono text-xs">
                {currentPhrase && (
                  <motion.div 
                    key={currentPhrase}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    transition={{ duration: 0.5 }}
                    style={{ minHeight: '24px' }}
                  >
                    {currentPhrase}
                  </motion.div>
                )}
              </div>
            )}
            
            {/* Console Output - Height varies by terminal size */}
            <div 
              ref={consoleOutputRef}
              className={`mt-4 py-2 font-mono text-sm text-gray-300 overflow-y-auto custom-scrollbar scrollbar-hidden
                ${sizeState === 'contracted' ? 'max-h-40' : sizeState === 'middle' ? 'max-h-60' : 'max-h-96'}`}
            >
              {consoleOutput.map((output, index) => (
                <div key={index} className="pl-1 mb-1 whitespace-pre-wrap">
                  {typeof output === 'string' ? output : output}
                </div>
              ))}
            </div>
            
            {/* User Input Area */}
            <div className="mt-2 flex items-center border-t border-mauve/20 pt-2">
              <span className="text-mauve mr-2">$</span>
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                style={{ fontSize: '16px' /* Prevents iOS zoom on focus */ }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && userInput.trim()) {
                    // Handle command
                    const command = userInput.trim();
                    // Clear input
                    setUserInput('');
                    
                    // Append command to output
                    setConsoleOutput(prev => [...prev, `$ ${command}`]);
                    
                    // Execute command from map or hand to AI
                    if (command.toLowerCase() === 'clear') {
                      // Special case for clear command
                      setConsoleOutput([]);
                    } else if (commandMap[command.toLowerCase()]) {
                      // Handle regular command from map
                      setConsoleOutput(prev => [...prev, commandMap[command.toLowerCase()]]);
                      
                      // Execute callback if provided
                      if (onCommandExecuted) {
                        onCommandExecuted(command, commandMap[command.toLowerCase()]);
                      }
                      
                      // Special case for Easter egg activation
                      if (command.toLowerCase() === EASTER_EGG_CODE) {
                        activateDidiEasterEgg();
                      }
                    } else {
                      // This is an AI query
                      
                      // First show a processing message
                      const processingMsg = getRandomProcessingMessage();
                      setConsoleOutput(prev => [
                        ...prev.slice(0, -1), // Remove processing message
                        `[Didi] ${processingMsg}`
                      ]);
                      
                      // Start the AI request
                      try {
                        // Create a message for the AI chat
                        const message: AIMessage = {
                          role: 'user',
                          content: command
                        };
                        
                        // Use the chat method with a simple message array
                        aiService.chat([message], { context: 'trading' })
                          .then((response) => {
                            // Process Didi's response to possibly include glitches and hidden messages
                            const processedResponse = processDidiResponse(response.content);
                            
                            if (typeof processedResponse === 'string') {
                              // Simple response with glitches
                              setConsoleOutput(prev => [
                                ...prev.slice(0, -1), // Remove processing message
                                `[Didi] ${processedResponse}`
                              ]);
                            } else {
                              // Complex response with a hidden message
                              setConsoleOutput(prev => [
                                ...prev.slice(0, -1), // Remove processing message
                                `[Didi] ${processedResponse.visible}`
                              ]);
                              
                              // Check if the hidden message sequence activates the Easter egg
                              const didActivate = storeHiddenMessage(processedResponse.hidden);
                              if (didActivate) {
                                // Activate Didi's Easter egg
                                activateDidiEasterEgg();
                              }
                            }
                            
                            // Execute callback if provided
                            if (onCommandExecuted) {
                              onCommandExecuted(
                                command, 
                                typeof processedResponse === 'string' 
                                  ? processedResponse 
                                  : processedResponse.visible
                              );
                            }
                          })
                          .catch((error: Error) => {
                            setConsoleOutput(prev => [
                              ...prev.slice(0, -1), // Remove processing message
                              `[SYSTEM] Error processing request: ${error.message || 'Unknown error'}`
                            ]);
                          });
                      } catch (error) {
                        // Fallback if the AI service throws synchronously
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                        setConsoleOutput(prev => [
                          ...prev.slice(0, -1), // Remove processing message
                          `[SYSTEM] Error processing request: ${errorMessage}`
                        ]);
                      }
                    }
                  }
                }}
                autoComplete="off"
                className="w-full bg-transparent outline-none border-none text-white placeholder-mauve-dark/50 focus:ring-0"
                placeholder="Enter command or ask a question..."
              />
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Minimized state - just a small bar to restore */}
      {terminalMinimized && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-darkGrey-dark/90 border border-mauve/40 p-2 rounded-md cursor-pointer text-center text-xs text-mauve"
          onClick={() => setTerminalMinimized(false)}
        >
          Click to restore terminal
        </motion.div>
      )}
    </div>
  );
};

// And exporting as default
export default Terminal;

// Also export types for external use
export type { TerminalProps };
