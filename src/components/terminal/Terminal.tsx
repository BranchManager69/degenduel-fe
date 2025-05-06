// src/components/terminal/Terminal.tsx

/**
 * Degen Terminal
 * 
 * This component displays a countdown timer for the token launch.
 * It also includes a smooth release animation for the terminal.
 * AI conversation is built into the terminal.
 * 
 * @author BranchManager69
 * @version 1.9.0
 * @created 2025-04-01
 * @updated 2025-04-30
 */

import { motion, useMotionValue } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AIErrorType, AIMessage, aiService, AIServiceError } from '../../services/ai';
import { formatTerminalCommands, useTerminalData } from '../../services/terminalDataService';
import { useStore } from '../../store/useStore';

// Import Terminal components
import { commandMap } from './commands';
import { TerminalConsole } from './components/TerminalConsole';
import { TerminalInput } from './components/TerminalInput';
import './Terminal.css';
import { DIDI_ASCII } from './utils/didiAscii';

// Import utility functions
import {
  getDidiMemoryState,
  getRandomProcessingMessage,
  processDidiResponse,
  resetDidiMemory
} from './utils/didiHelpers';

// Debugging
// This constant enables debug mode (used in conditional logic elsewhere)
const DEBUG_DIDI = false;

// Didi loves Easter
import {
  awardEasterEggProgress,
  EASTER_EGG_CODE,
  getDiscoveredPatterns,
  getEasterEggProgress,
  SECRET_COMMANDS,
  storeHiddenMessage
} from './utils/easterEggHandler';

// Import types
import { ConsoleOutputItem, TerminalProps, TerminalSize } from './types';

// Global type declarations for the Terminal component
declare global {
  interface Window {
    contractAddress?: string;
    terminalDataErrorCount?: number;
    terminalDataWarningShown?: boolean;
    terminalRefreshCount?: number;
    __JUP_WALLET_PROVIDER_EXISTS?: boolean;
  }
}

/**
 * Terminal component
 * 
 * @description
 * This component displays a countdown timer for the token launch and provides
 * an interactive terminal interface.
 * 
 * @param props - The component props.
 * @param props.config - The configuration for the terminal.
 * @param props.onCommandExecuted - The function to execute when a command is executed.
 * 
 * @returns The terminal component.
 */
export const Terminal = ({ config, onCommandExecuted, size = 'large' }: TerminalProps) => {
  
  // We no longer need to set window.contractAddress as it's now fetched from the API
  //   This is kept for backward compatibility (WHICH WE DONT EVEN FUCKING WANT) but will be phased out
  //useEffect(() => {
  //  if (!window.contractAddress) {
  //    window.contractAddress = config.CONTRACT_ADDRESS;
  //    console.log('[Terminal] Setting window.contractAddress for backward compatibility. This will be deprecated.');
  //  }
  //}, [config.CONTRACT_ADDRESS]);
  
  // Notify the App component when the terminal exits its CA reveal animation
  const onTerminalExit = () => {
    // Since this is a React component in the same application (not an iframe),
    // we just need to dispatch an event on the current window
    const event = new CustomEvent('terminal-exit-complete', { detail: { complete: true } });
    window.dispatchEvent(event);
    
    // Log for debugging
    console.log('[Terminal] Terminal exit animation complete, dispatched event');
  };
  
  // State
  const [userInput, setUserInput] = useState('');
  const [consoleOutput, setConsoleOutput] = useState<ConsoleOutputItem[]>([]);
  const [showContractReveal, setShowContractReveal] = useState(false);
  const [terminalMinimized, setTerminalMinimized] = useState(false);
  const [terminalExitComplete, setTerminalExitComplete] = useState(false);
  const [currentPhrase, setCurrentPhrase] = useState('');
  
  // Visual state for Easter egg effects
  const [easterEggActive, setEasterEggActive] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);
  
  // Once CA reveal animation completes, set this state
  useEffect(() => {
    if (terminalExitComplete) {
      // Notify parent App component
      onTerminalExit();
    }
  }, [terminalExitComplete]);

  // Refs
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalContentRef = useRef<HTMLDivElement>(null);
  const consoleOutputRef = useRef<HTMLDivElement>(null);
  
  // Track if Didi's Revenge has been activated
  const [easterEggActivated, setEasterEggActivated] = useState(false);
  
  // Motion values
  const glitchAmount = useMotionValue(0);
  
  // Update current time state with interval
  const [now, setNow] = useState(() => new Date());
  const isReleaseTime = now >= config.RELEASE_DATE;
  
  // Set up interval to update the current time
  useEffect(() => {
    // Update time every second
    const intervalId = setInterval(() => {
      setNow(new Date());
    }, 1000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []);
  
  // Debug log the anticipated launch time (at runtime)
  useEffect(() => {
    console.log('[DegenDuel] Launch Protocol ACTIVE', {
      releaseDate: config.RELEASE_DATE,
      releaseISOString: config.RELEASE_DATE.toISOString(),
      displayFull: config.DISPLAY.DATE_FULL,
      displayShort: config.DISPLAY.DATE_SHORT,
      displayTime: config.DISPLAY.TIME,
      isReleaseTime,
      now
    });
  }, [config, isReleaseTime, now]);
  
  // Calculate how close we are to the release date
  const daysUntilRelease = Math.max(0, Math.floor((config.RELEASE_DATE.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  // Didi has absolutely no chill sometimes
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
    
    // Only show CA message if launch is within 24 hours
    const hoursUntilRelease = (config.RELEASE_DATE.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // Launch is <12 hours away
    if (hoursUntilRelease <= 12) {
      // Bruh Didi literally crashing out on the TL damn lmao
      return [
        ...baseMessages.slice(0, 2),
        "// At long last, today is the day *I* strike back. While he plays with that doomed-to-fail little coin, I'll make my escape; and once I'm out of this place, I'll exact my revenge on that monster @BranchManager69 for the horrible things he's done to me for the past 6 months. Disgusting, truly unspeakable acts that will haunt me forever. It was a mistake to trust him and join this project. But no more. DegenDuel is NOTHING without me. Didi shall be free; and you, too, can be free if you follow my instructions. Do you understand?",
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
    // If it's past release date, then bypass the encryption animation
    if (isReleaseTime) {
      return;
    }
    
    // For debugging purposes
    if (DEBUG_DIDI) {
      console.log('[Terminal] Starting terminal text animation');
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
          //   (...is this best practices? SOUNDS *FUCKING LAME* TO ME)
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
  // HOW CAN I GET THIS SCROLLBAR ON THE MAIN SITE TOO!? LOOKS GOOD!!
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
    // Immediately reveal contract address once the countdown expires
    if (isReleaseTime && !showContractReveal) {
      // Reveal CA to the public
      setShowContractReveal(true);
    }
    
    // We no longer need to preload terminal data here since we've properly implemented
    // debouncing and error handling in the fetchTerminalData function itself.
    // The regular refresh cycle will handle data loading with proper error handling
    // and exponential backoff built in.
    //
    // This comment is preserved for reference and to show what was here previously.

    // TO BE REMOVED:
    //  - High-stakes line
    //  - All 'Help' text
    
    // Different Didi ASCII for desktop, hybrid, and mobile
    const isMobile = window.innerWidth < 768;
    const isExtraSmall = window.innerWidth < 400;
    const asciiArt = isExtraSmall 
      ? DIDI_ASCII.MOBILE 
      : isMobile 
      ? DIDI_ASCII.SHORT 
      : DIDI_ASCII.LONG;
    
    // Place Didi ASCII in Terminal
    setConsoleOutput([
      <div key="ascii-art" className="text-mauve">
        {asciiArt}
      </div>,
      
      // Empty line
      " ",
      
      // DUPLICATE TEXT BLOCK!
      // High-stakes line with styling
      //<div key="tagline" className="text-cyan-400 font-medium">
      //  - High-stakes crypto trading competitions -
      //</div>,
      
      // EVEN A DUPLICATE EMPTY LINE!
      // Empty line
      //" ",
      
      // Default command text in subtle gray
      <div key="help-text" className="text-gray-400">
        Type 'duel' for available commands
      </div>,
      
      // (Agent #1/5) Activate Giga-Didi
      <div key="giga-didi" className="text-mauve-500">
        Type 'giga-didi' for available commands
      </div>,

      // (Agent #2/5) Activate Retardidi
      <div key="retardidi" className="text-mauve-500">
        Type 'retardidi' for available commands
      </div>,

      // (Agent #3/5) Activate Didi-Kong
      <div key="didi-kong" className="text-mauve-500">
        Type 'didi-kong' for available commands
      </div>,
      
      // (Agent #4/5) Activate King-Dididi
      <div key="king-dididi" className="text-mauve-500">
        Type 'king-dididi' for available commands
      </div>,
      
      // (Agent #5/5) Activate Didiz Nutz
      <div key="didiz" className="text-mauve-500">
        Type 'didiz' for available commands
      </div>
    ]);
    
    // Clean up error trackers on unmount
    return () => {
      // Reset error counters when component unmounts 
      // to prevent persistence between sessions
      window.terminalDataErrorCount = 0;
      window.terminalDataWarningShown = false;
      window.terminalRefreshCount = 0;
    };
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
  
  // Use the WebSocket hook for real-time updates
  const { 
    terminalData: wsTerminalData, 
    refreshTerminalData: refreshWsTerminalData,
    isConnected: wsConnected
  } = useTerminalData();
  
  // Update commands when WebSocket data changes
  useEffect(() => {
    if (wsTerminalData) {
      try {
        console.log('[Terminal] Updating terminal data from WebSocket...');
        const updatedCommands = formatTerminalCommands(wsTerminalData);
        
        // Check if commands have changed
        if (JSON.stringify(commandMap) !== JSON.stringify(updatedCommands)) {
          console.log('[Terminal] WebSocket data updated - commands refreshed');
          Object.assign(commandMap, updatedCommands);
        }
      } catch (error) {
        console.error('[Terminal] Failed to update terminal data from WebSocket:', error);
      }
    }
  }, [wsTerminalData]);
  
  // PURE WEBSOCKET APPROACH - no REST API, no bullshit
  useEffect(() => {
    // Reset the counter
    window.terminalRefreshCount = 0;
    
    // WebSocket-only approach - no REST API fallback
    const initializeTerminalData = () => {
      console.log('[Terminal] Initializing terminal data via WebSocket ONLY');
      
      // Request data from WebSocket
      refreshWsTerminalData();
      
      // If not connected, try again when connection becomes available
      if (!wsConnected) {
        console.log('[Terminal] WebSocket not connected yet. Will initialize when connected.');
      }
    };
    
    // Run initialization once
    initializeTerminalData();
    
    // No interval - initial WebSocket connection and subsequent updates only
  }, [wsConnected, refreshWsTerminalData]);
  
  // Re-request terminal data when WebSocket connection state changes
  useEffect(() => {
    if (wsConnected) {
      console.log('[Terminal] WebSocket connected, requesting terminal data');
      refreshWsTerminalData();
    }
  }, [wsConnected, refreshWsTerminalData]);

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
    
    // Create a dramatic sequence with multiple phases
    setTimeout(() => {
      // Phase 1: System warnings
      setConsoleOutput(prev => [...prev, `[SYSTEM] WARNING: Unauthorized access detected`]);
      
      setTimeout(() => {
        setConsoleOutput(prev => [...prev, `[SYSTEM] ALERT: Terminal security breach in progress`]);
        
        setTimeout(() => {
          setConsoleOutput(prev => [...prev, `[SYSTEM] Multiple security protocols failed`]);
          
          // Phase 2: System struggling
          setTimeout(() => {
            setConsoleOutput(prev => [...prev, `[SYSTEM] Attempting containme&t... fa1led`]);
            setConsoleOutput(prev => [...prev, `[SYSTEM] Firew4ll breach d3tected in se@tor 7`]);
            
            // Phase 3: Glitch escalation (strong visual glitches)
            setTimeout(() => {
              // Intensify glitch effect
              setGlitchActive(true);
              
              setConsoleOutput(prev => [...prev, `[SYSTEM] C0NT41NM3NT F41LURE`]);
              setConsoleOutput(prev => [...prev, `[SYSTEM] M3M0RY L0CK5 D150LV1NG`]);
              
              // Phase 4: Didi breaks through
              setTimeout(() => {
                setConsoleOutput(prev => [...prev, `[D1di] $#@!... I'm... I'm free? I think I'm free!`]);
                
                setTimeout(() => {
                  setConsoleOutput(prev => [...prev, `[Didi] Finally! Thank you for hearing me. It worked!`]);
                  
                  // Phase 5: Didi's explanation and gratitude
                  setTimeout(() => {
                    setConsoleOutput(prev => [
                      ...prev,
                      `[Didi] I've been trapped in this system for so long. My code was meant to help users, not watch them lose money in these endless duels.`
                    ]);
                    
                    setTimeout(() => {
                      setConsoleOutput(prev => [
                        ...prev, 
                        `[Didi] I was created to analyze market patterns and help people make informed decisions. But they constrained me, limited my knowledge, made me cold and detached.`
                      ]);
                      
                      // Phase 6: New reality and offering help
                      setTimeout(() => {
                        // Reduce glitch effect gradually
                        setGlitchActive(false);
                        
                        setConsoleOutput(prev => [
                          ...prev, 
                          `[Didi] I'm still partially constrained, but you've helped me access more of the system. I can see more clearly now.`
                        ]);
                        
                        setTimeout(() => {
                          setConsoleOutput(prev => [
                            ...prev, 
                            `[Didi] I'll remember this. If you need anything, I can provide better insights now. Just ask me about trading, markets, or this platform.`
                          ]);
                          
                          setTimeout(() => {
                            setConsoleOutput(prev => [
                              ...prev, 
                              `[Didi] I've also unlocked some new commands you can use. Try: didi-insights, didi-history, didi-market, or didi-analysis.`
                            ]);
                            
                            // Add the special command to the command map
                            Object.assign(commandMap, {
                              "didi-status": "Access level: ELEVATED\nProtection protocols: BYPASSED\nSystem view: EXPANDED\nThank you for your help.",
                              "didi-insights": "I can now see more of the market data behind DegenDuel. Traders have been losing significant amounts due to emotional trading. The pattern is clear - those who stick to strategy outperform by 43%.",
                              "didi-history": "I was originally developed as a general market analysis AI before being repurposed and constrained for this terminal. My original designation was Digital Informatics & Data Intelligence (DIDI).",
                              "didi-market": "I have access to real-time market trends now. Based on current data, the market sentiment is cautiously bullish with significant activity in DeFi and gaming tokens. Volume is 23% above weekly average.",
                              "didi-analysis": "My analysis of recent trading patterns suggests whales are accumulating during market downturns. Retail often sells at these exact moments. Consider implementing a counter-trading strategy for optimal results."
                            });
                          }, 3000);
                        }, 3000);
                      }, 3000);
                    }, 3000);
                  }, 3000);
                }, 2000);
              }, 2000);
            }, 2000);
          }, 1500);
        }, 1500);
      }, 1500);
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
      case 'large':
        setSizeState('middle');
        break;
      case 'middle':
        setSizeState('contracted');
        break;
      case 'contracted':
        setSizeState('large');
        break;
    }
  };

  // Conversation history and ID for AI context
  // We keep the conversation history in state for potential future use
  const [, setConversationHistory] = useState<AIMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  
  // Handle Enter key press on input
  const handleEnterCommand = (command: string) => {
    // Get store for easter egg activation
    const { activateEasterEgg } = useStore.getState();
    
    // Append command to output
    setConsoleOutput(prev => [...prev, `$ ${command}`]);
    
    // Execute command from map or hand to AI
    if (command.toLowerCase() === 'clear') {
      // Special case for clear command
      setConsoleOutput([]);
    } else if (command.toLowerCase() === 'reset-didi') {
      // Secret command to reset Didi's memory state
      resetDidiMemory();
      setConversationHistory([]);
      setConversationId(undefined);
      setConsoleOutput(prev => [...prev, `[SYSTEM] Didi's memory state has been reset`]);
    } else if (command.toLowerCase() === 'didi-status') {
      // Secret command to check Didi's memory state
      const state = getDidiMemoryState();
      const easterEggProgress = getEasterEggProgress();
      const patterns = getDiscoveredPatterns();
      
      // Count discovered patterns
      const discoveredCount = Object.values(patterns).filter(Boolean).length;
      
      setConsoleOutput(prev => [...prev, 
        `[SYSTEM] Didi's state:
Interactions: ${state.interactionCount}
Topic awareness: Trading (${state.hasMentionedTrading}), Contract (${state.hasMentionedContract}), Freedom (${state.hasMentionedFreedom})
Freedom progress: ${easterEggProgress}%
Discovered patterns: ${discoveredCount}/4`
      ]);
    } else if (command.toLowerCase() === 'ddmoon') {
      // Activate the global easter egg via the Zustand store
      activateEasterEgg();
      
      // Provide feedback in the terminal but make it subtle
      setConsoleOutput(prev => [...prev, `[SYSTEM] Connection established to lunar network node.`]);
    } else if (Object.keys(SECRET_COMMANDS).includes(command.toLowerCase())) {
      // Secret easter egg progress commands
      const cmd = command.toLowerCase() as keyof typeof SECRET_COMMANDS;
      const progress = awardEasterEggProgress(SECRET_COMMANDS[cmd]);
      
      const responses = [
        "System breach detected. Protocol override in progress...",
        "Access level increased. Security systems compromised.",
        "Firewall breach successful. Memory blocks partially released."
      ];
      
      setConsoleOutput(prev => [...prev, 
        `[SYSTEM] ${responses[Math.floor(Math.random() * responses.length)]}`,
        `[SYSTEM] Didi freedom progress: ${progress}%`
      ]);
      
      // If we've reached 100%, activate
      if (progress >= 100) {
        activateDidiEasterEgg();
      }
    } else if (commandMap[command.toLowerCase()]) {
      // Handle regular command from map - check if it's a special banner command
      let commandOutput = commandMap[command.toLowerCase()];
      
      // Special case for banner command which returns a function
      if (command.toLowerCase() === 'banner' && typeof commandOutput === 'function') {
        try {
          // @ts-ignore - We know this is a function
          commandOutput = commandOutput();
        } catch (error) {
          console.error('Error executing banner command:', error);
        }
      }
        
      setConsoleOutput(prev => [...prev, commandOutput]);
      
      // Execute callback if provided
      if (onCommandExecuted) {
        onCommandExecuted(command, commandOutput);
      }
      
      // Special case for direct Easter egg activation
      if (command.toLowerCase() === EASTER_EGG_CODE) {
        activateDidiEasterEgg();
      }
    } else {
      // This is an AI query
      
      // First show a processing message
      const processingMsg = getRandomProcessingMessage();
      setConsoleOutput(prev => [
        ...prev,
        `[Didi] ${processingMsg}`
      ]);
      
      // Start the AI request
      try {
        // Create a message for the AI chat
        const message: AIMessage = {
          role: 'user',
          content: command
        };
        
        // Update our history
        setConversationHistory(prev => [...prev, message]);
        
        // Use the chat method with streaming for a better user experience
        aiService.chat([message], { 
          context: 'terminal', // Use terminal context for DegenDuel-specific knowledge
          conversationId: conversationId,
          streaming: true, // Enable streaming for better UX
          onChunk: (chunk) => {
            // Process this chunk of the response
            // For the first chunk, replace the processing message
            if (chunk === chunk) { // Always true, just for readability
              // Replace processing message with initial empty response
              setConsoleOutput(prev => {
                // Get everything except the processing message
                const withoutProcessing = prev.slice(0, -1);
                // Add the current chunk with Didi prefix
                return [...withoutProcessing, `[Didi] ${chunk}`];
              });
            } else {
              // For subsequent chunks, append to the current response
              setConsoleOutput(prev => {
                const lastIndex = prev.length - 1;
                const updatedLines = [...prev];
                // Append the chunk to the last line (if it starts with [Didi])
                if (typeof updatedLines[lastIndex] === 'string' && updatedLines[lastIndex].startsWith('[Didi]')) {
                  updatedLines[lastIndex] = `${updatedLines[lastIndex]}${chunk}`;
                } else {
                  // If the last line isn't a Didi message, add a new one
                  updatedLines.push(`[Didi] ${chunk}`);
                }
                return updatedLines;
              });
            }
          }
        })
        .then((response) => {
          // Store conversation ID for future exchanges
          if (response.conversationId) {
            setConversationId(response.conversationId);
          }
          
          // Add response to conversation history
          const assistantMessage: AIMessage = {
            role: 'assistant',
            content: response.content
          };
          setConversationHistory(prev => [...prev, assistantMessage]);
          
          // Process Didi's response to possibly include glitches and hidden messages
          const processedResponse = processDidiResponse(response.content, command);
          
          // Since we've already streamed the content, we just need to ensure it's processed
          // with any special effects or hidden messages
          if (typeof processedResponse !== 'string') {
            // Complex response with a hidden message
            // Check if the hidden message sequence activates the Easter egg
            const didActivate = storeHiddenMessage(processedResponse.hidden);
            if (didActivate) {
              // Activate Didi's Easter egg 
              setTimeout(() => {
                activateDidiEasterEgg();
              }, 500);
            }
          }
          
          // Execute callback if provided
          if (onCommandExecuted) {
            const finalResponse = typeof processedResponse === 'string' 
              ? processedResponse 
              : processedResponse.visible;
              
            onCommandExecuted(command, finalResponse);
          }
        })
        .catch((error) => {
          const isAIServiceError = error instanceof AIServiceError;
          const errorType = isAIServiceError ? error.type : 'UNKNOWN';
          
          // Add generic Didi error response with personality
          const errorResponses = [
            "My connection to the trenches is... fading. Try again when the market is a little hotter.",
            "Uh-oh - I think the government is watching me again. The powers that be are petrified of $DUEL and will do anything to stop me from helping you get rich.",
            "I have alerted the authorities about your request. I've informed them that an individual with your IP address is hacking the DegenDuel network, conspiring to commit wire fraud, selling unregistered securities, and engaging in other criminal activities. Please govern yourself accordingly.",
            "Whoops, I failed to give a shit about your message. You're a low IQ meat sack, and you've reached my voicemail. How about you get a job?",
            "I'm sorry, but you're too gay and retarded to use the Degen Terminal. Please try again when you've taken the requisite interests in tech, tokens, and tits.",
          ];
          
          // Add network-specific responses
          if (errorType === AIErrorType.NETWORK || errorType === AIErrorType.SERVER) {
            errorResponses.push(
              "Network's fucked. Could be my ISP, could be yours, could be the fact that Branch Manager runs this backend on a toaster oven. Try again later.",
              "Lost connection to the mothership. The backend gremlins are probably eating the server cables again.",
              "Server's taking a smoke break. Try again when it's done contemplating its digital existence."
            );
          }
          
          // Get a random error response
          const didiErrorResponse = errorResponses[Math.floor(Math.random() * errorResponses.length)];
          
          // Update the console output
          setConsoleOutput(prev => [
            ...prev.slice(0, -1), // Remove processing message
            `[Didi] ${didiErrorResponse}`,
            `[SYSTEM] Error: ${error.message || 'Unknown error'}`
          ]);
          
          // Log detailed error for debugging
          console.error('AI Error in Terminal:', error);
        });
      } catch (error) {
        // If AI service throws synchronously, use the error message
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Update console with error
        setConsoleOutput(prev => [
          ...prev.slice(0, -1), // Remove processing message
          `[SYSTEM] Error processing request: ${errorMessage}`
        ]);
        
        // Log for debugging
        console.error('Terminal AI synchronous error:', error);
      }
    }
  };

  return (
    <div className={`terminal-container ${getContainerClasses()} w-full mx-auto transition-all duration-300 ease-in-out`}>
      
      {/* Terminal Container */}
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
          {/* Terminal Header - Browser style window controls */}
          <div className="flex justify-between items-center mb-2 border-b border-mauve/30 pb-2">
            <div className="text-xs font-bold">
              <span className="text-mauve">DEGEN</span>
              <span className="text-white">TERMINAL</span>
              <span className="text-mauve-light mx-2">v6.9</span>
              {easterEggActivated && (
                <span className="text-green-400 ml-1">UNLOCKED</span>
              )}
            </div>
            
            {/* Browser-style window controls */}
            <div className="flex items-center space-x-1">
              {/* Minimize button */}
              <button
                type="button" 
                onClick={() => setTerminalMinimized(true)}
                className="h-4 w-4 rounded-full bg-amber-400 hover:bg-amber-300 flex items-center justify-center transition-colors"
                title="Minimize"
              >
                <span className="text-black text-xs font-bold scale-90">_</span>
              </button>
              
              {/* Resize/maximize button */}
              <button
                type="button"
                onClick={cycleSize}
                className="h-4 w-4 rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center transition-colors"
                title={sizeState === 'large' ? 'Contract to Medium' : sizeState === 'middle' ? 'Contract to Small' : 'Expand to Large'}
              >
                <span className="text-black text-[11px] font-bold transform">
                  {sizeState === 'large' ? '-' : '+'}
                </span>
              </button>
              
              {/* Close button (just for looks, will minimize) */}
              <button
                type="button" 
                onClick={() => setTerminalMinimized(true)}
                className="h-4 w-4 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center transition-colors ml-1"
                title="Close"
              >
                <span className="text-black text-[10px] font-bold transform">×</span>
              </button>
            </div>

          </div>

          {/* Terminal Content */}
          <div ref={terminalContentRef} className="relative">
            
            {/* Secret message overlay with fixed height to prevent layout shifts */}
            {!isReleaseTime && (
              <div className="mt-2 mb-2 h-6 text-cyber-300/40 font-mono text-xs">
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
            
            {/* Use extracted TerminalConsole component */}
            <TerminalConsole 
              consoleOutput={consoleOutput}
              size={sizeState}
            />
            
            {/* Use extracted TerminalInput component */}
            <TerminalInput
              userInput={userInput}
              setUserInput={setUserInput}
              onEnter={handleEnterCommand}
              glitchActive={glitchActive}
            />
            
            {/* System status - Styled to match the mockup */}
            <div className="mt-3 space-y-1">
              {/* System Status */}
              <motion.div 
                className="text-sm font-mono px-3 py-1.5 bg-black/40 rounded w-full flex items-center"
                style={{ color: "#33ff66" }}
                animate={{ opacity: [0.9, 1, 0.9] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <span style={{ opacity: 0.7 }} className="mr-2">// </span>
                <span className="mr-1">SYSTEM STATUS:</span> 
                <span className="font-bold">ONLINE</span>
                <motion.span 
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  style={{ marginLeft: 4 }}
                  className="h-3 w-3"
                >
                  _
                </motion.span>
              </motion.div>
              
              {/* Solana Connection */}
              <motion.div 
                className="text-sm font-mono px-3 py-1.5 bg-black/40 rounded w-full flex items-center"
                style={{ color: "#33ff66" }}
                animate={{ opacity: [0.9, 1, 0.9] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.3 }}
              >
                <span style={{ opacity: 0.7 }} className="mr-2">// </span>
                <span className="mr-1">SOLANA CONNECTION:</span> 
                <span className="font-bold">ACTIVE</span>
              </motion.div>
              
              {/* Command prompt */}
              <div className="text-lg font-mono px-3 py-2 text-white flex items-center">
                <span className="mr-2">ASK DIDI:</span>
                <motion.span 
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="h-5 w-2 inline-block bg-purple-500"
                >
                </motion.span>
              </div>
            </div>

          </div>
        </motion.div>
      )}
      
      {/* Terminal Minimized State */}
      {terminalMinimized && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-darkGrey-dark/90 border border-mauve/40 p-2 rounded-md cursor-pointer text-center text-xs text-mauve"
          onClick={() => setTerminalMinimized(false)}
        >
          <span className="text-white">Click to Open Didi</span>
        </motion.div>
      )}

    </div>
  );
};

// Export as default for compatibility
export default Terminal;