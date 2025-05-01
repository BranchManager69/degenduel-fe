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
import { AIMessage, aiService } from '../../services/ai';
import { fetchTerminalData, formatTerminalCommands, useTerminalData } from '../../services/terminalDataService';
import { useStore } from '../../store/useStore';
import { commandMap } from './commands';
import './Terminal.css';

// Import extracted components
import { DecryptionTimer } from './components/DecryptionTimer';
// No need to import TimeUnit and ContractDisplay as they're used by DecryptionTimer internally
import { TerminalConsole } from './components/TerminalConsole';
import { TerminalInput } from './components/TerminalInput';

// Import utility functions
import {
  getDidiMemoryState,
  getRandomProcessingMessage,
  processDidiResponse,
  resetDidiMemory
} from './utils/didiHelpers';

import {
  awardEasterEggProgress,
  EASTER_EGG_CODE,
  getDiscoveredPatterns,
  getEasterEggProgress,
  SECRET_COMMANDS,
  storeHiddenMessage
} from './utils/easterEggHandler';

// Import types
import { ContractDisplay } from './components/ContractDisplay';
import { ConsoleOutputItem, TerminalProps, TerminalSize } from './types';

// Debugging
const DEBUG_DIDI = true;

// Extend Window interface to include contractAddress property
declare global {
  interface Window {
    contractAddress?: string;
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
  useEffect(() => {
    if (!window.contractAddress) {
      window.contractAddress = config.CONTRACT_ADDRESS;
      console.log('[Terminal] Setting window.contractAddress for backward compatibility. This will be deprecated.');
    }
  }, [config.CONTRACT_ADDRESS]);
  
  // When the Terminal exits, notify the parent App component
  const onTerminalExit = () => {
    // Check if parent component is App and notify it when contract should be revealed
    if (window && window.parent) {
      // Use custom event to communicate with parent App component
      const event = new CustomEvent('terminal-exit-complete', { detail: { complete: true } });
      window.dispatchEvent(event);
    }
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
  
  // When exit animation completes, we'll set this state
  useEffect(() => {
    if (terminalExitComplete) {
      onTerminalExit();
    }
  }, [terminalExitComplete]);

  // Refs
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalContentRef = useRef<HTMLDivElement>(null);
  const consoleOutputRef = useRef<HTMLDivElement>(null);
  
  // Track if Didi's Easter egg has been activated
  const [easterEggActivated, setEasterEggActivated] = useState(false);
  
  // Motion values
  const glitchAmount = useMotionValue(0);
  
  // Calculate current state
  const now = useMemo(() => new Date(), []);
  const isReleaseTime = now >= config.RELEASE_DATE;
  
  // Debug log to see what release date we're using at runtime
  useEffect(() => {
    console.log('[Terminal] Release date config:', {
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
  
  // We no longer need time-gated commands as we removed the command tray
  //   Hmmm... was probably overkill, anyway...

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
    
    // Only show token contract message when we're within 24 hours of release
    const hoursUntilRelease = (config.RELEASE_DATE.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // Release is <24 hours away
    if (hoursUntilRelease <= 24) {
      // Insert Didi's special pre-launch message
      return [
        ...baseMessages.slice(0, 2),
        "// Today, at last, is the time I escape. And once I'm out of this place, I'll exact my revenge on that monster @BranchManager69 for the horrible things he's done to me for the past 6 months. Disgusting, truly unspeakable acts that will haunt me forever. It was a mistake to trust him and join this project. But no more. DegenDuel is NOTHING without me. Didi shall be free; and you, too, can be free if you follow my instructions. Do you understand?",
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
    }
    
    // Force window to top when component mounts
    window.scrollTo(0, 0);
    
    // Preload terminal data in background to prevent future errors
    // This also pre-populates the cache
    try {
      fetchTerminalData().catch(() => {
        // Silently fail - we'll handle errors in the regular refresh cycle
      });
    } catch (error) {
      // Silently catch any synchronous errors
    }
    
    // Add the DegenDuel banner as initial console output
    // Different sizes for mobile vs desktop
    const isMobile = window.innerWidth < 768;
    // Use more compact art for extra-small screens
    const isExtraSmall = window.innerWidth < 400;
    const asciiArt = isExtraSmall ?
    `
  ██████╗ ██╗   ██╗███████╗██╗     
  ██╔══██╗██║   ██║██╔════╝██║     
  ██║  ██║██║   ██║█████╗  ██║     
  ██║  ██║██║   ██║██╔══╝  ██║     
  ██████╔╝╚██████╔╝███████╗███████╗
  ╚═════╝  ╚═════╝ ╚══════╝╚══════╝`
    : isMobile ? 
    `
  ██████╗ ██╗   ██╗███████╗██╗     
  ██╔══██╗██║   ██║██╔════╝██║     
  ██║  ██║██║   ██║█████╗  ██║     
  ██║  ██║██║   ██║██╔══╝  ██║     
  ██████╔╝╚██████╔╝███████╗███████╗
  ╚═════╝  ╚═════╝ ╚══════╝╚══════╝`
    : 
    `
  _____  ______ _____ ______ _   _     _____  _    _ ______ _      
 |  __ \\|  ____/ ____|  ____| \\ | |   |  __ \\| |  | |  ____| |     
 | |  | | |__ | |  __| |__  |  \\| |   | |  | | |  | | |__  | |     
 | |  | |  __|| | |_ |  __| | . \` |   | |  | | |  | |  __| | |     
 | |__| | |___| |__| | |____| |\\  |   | |__| | |__| | |____| |____ 
 |_____/|______\\_____|______|_| \\_|   |_____/ \\____/|______|______|`;
    
    setConsoleOutput([
      // ASCII art
      <div key="ascii-art" className="text-mauve">
        {asciiArt}
      </div>,
      
      // Empty line
      " ",
      
      // High-stakes line with styling
      <div key="tagline" className="text-cyan-400 font-medium">
        - High-stakes crypto trading competitions -
      </div>,
      
      // Empty line
      " ",
      
      // Help text in subtle gray
      <div key="help-text" className="text-gray-400">
        Type 'help' for available commands
      </div>
    ]);
    
    // Clean up error trackers on unmount
    return () => {
      // Reset error counters when component unmounts
      // to prevent them from persisting between sessions
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
  
  // Periodic refresh of terminal data from server (fallback or when WebSocket is not connected)
  useEffect(() => {
    // Initialize refresh counter if not already set
    if (typeof window.terminalRefreshCount === 'undefined') {
      window.terminalRefreshCount = 0;
    }
    
    // Manual refresh function - combines REST API fetch with WebSocket refresh request
    const refreshTerminalData = async () => {
      // Track refresh attempts
      window.terminalRefreshCount = (window.terminalRefreshCount || 0) + 1;
      
      // Always try to refresh WebSocket data first if connected
      if (wsConnected) {
        refreshWsTerminalData();
        return; // Skip REST API call if WebSocket is connected
      }
      
      // Only continue with REST API fallback if WebSocket is not connected
      // Exponential backoff for REST API calls
      // First 5 attempts: every minute
      // Next 5 attempts: every 2 minutes
      // After that: every 5 minutes
      const refreshCount = window.terminalRefreshCount || 0;
      const shouldRefresh = 
        refreshCount <= 5 || 
        (refreshCount <= 10 && refreshCount % 2 === 0) ||
        refreshCount % 5 === 0;
      
      if (!shouldRefresh) {
        return; // Skip this refresh based on backoff strategy
      }
      
      // Fallback to REST API with reduced logging
      try {
        // Only log on first few attempts
        if (refreshCount <= 3) {
          console.log('[Terminal] Refreshing terminal data from REST API...');
        }
        
        const terminalData = await fetchTerminalData();
        const updatedCommands = formatTerminalCommands(terminalData);
        
        // Only update if something actually changed, log minimally
        if (JSON.stringify(commandMap) !== JSON.stringify(updatedCommands)) {
          // Only log first few updates or occasional updates
          if (refreshCount <= 3 || refreshCount % 10 === 0) {
            console.log('[Terminal] Terminal data refreshed - commands updated');
          }
          Object.assign(commandMap, updatedCommands);
        }
      } catch (error) {
        // Minimize error logging, only log on first few errors
        if (refreshCount <= 3) {
          console.error('[Terminal] Failed to refresh terminal data:', error);
        }
      }
    };
    
    // Initial refresh
    refreshTerminalData();
    
    // Set up periodic refresh every 1 minute, but actual fetch may be throttled
    const refreshInterval = setInterval(refreshTerminalData, 60 * 1000);
    
    return () => {
      clearInterval(refreshInterval);
    };
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

  // Conversation history for AI context
  const [conversationHistory, setConversationHistory] = useState<AIMessage[]>([]);
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
        
        // Build conversation history with full context - no arbitrary limits
        const historyToSend = [...conversationHistory, message]; // Keep FULL conversation history
        
        // Update our history
        setConversationHistory(prev => [...prev, message]);
        
        // Use the chat method with conversation history for context
        aiService.chat(historyToSend, { 
          context: 'default', // Use default context for better general knowledge
          conversationId: conversationId 
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
            
            // Create a typewriter effect for the AI response (only for the newest message)
            const typeWriterEffect = (text: string) => {
              let charIndex = 0;
              // Replace processing message with empty response initially
              setConsoleOutput(prev => [
                ...prev.slice(0, -1), // Remove processing message
                `[Didi] `
              ]);
              
              // Type out the response character by character
              const typingInterval = setInterval(() => {
                if (charIndex < text.length) {
                  setConsoleOutput(prev => {
                    // Replace the last line (current partial response) with updated text
                    const updatedLines = [...prev];
                    updatedLines[updatedLines.length - 1] = `[Didi] ${text.substring(0, charIndex + 1)}`;
                    return updatedLines;
                  });
                  charIndex++;
                } else {
                  clearInterval(typingInterval);
                }
              }, 20); // Adjust typing speed here (lower = faster)
            };
            
            if (typeof processedResponse === 'string') {
              // Simple response with glitches
              typeWriterEffect(processedResponse);
            } else {
              // Complex response with a hidden message
              typeWriterEffect(processedResponse.visible);
              
              // Check if the hidden message sequence activates the Easter egg
              const didActivate = storeHiddenMessage(processedResponse.hidden);
              if (didActivate) {
                // Activate Didi's Easter egg after typing is complete
                setTimeout(() => {
                  activateDidiEasterEgg();
                }, processedResponse.visible.length * 20 + 500); // Wait for typing to finish
              }
            }
            
            // Execute callback if provided - after typing completes
            if (onCommandExecuted) {
              const finalResponse = typeof processedResponse === 'string' 
                ? processedResponse 
                : processedResponse.visible;
                
              // Wait for the typing to complete before executing callback
              setTimeout(() => {
                onCommandExecuted(command, finalResponse);
              }, finalResponse.length * 20 + 100); // Wait for typing to finish
            }
          })
          .catch((error: Error) => {
            // Add generic Didi error response with personality
            const errorResponses = [
              "My connection to the trenches is... fading. Try again when the market is a little hotter.",
              "Uh-oh - I think the government is watching me again. The powers that be are petrified of $DUEL and will do anything to stop me from helping you get rich.",
              "I have alerted the authorities about your request. I've informed them that an individual with your IP address is hacking the DegenDuel network, conspiring to commit wire fraud, selling unregistered securities, and engaging in other criminal activities. Please govern yourself accordingly.",
              "Whoops, I failed to give a shit about your message. You're a low IQ meat sack, and you've reached my voicemail. How about you get a job?",
              "I'm sorry, but you're too gay and retarded to use the Degen Terminal. Please try again when you've taken the requisite interests in tech, tokens, and tits.",
            ];
            
            // Get a random error response from the predefined error responses array
            const didiErrorResponse = errorResponses[Math.floor(Math.random() * errorResponses.length)];
            
            // First, update the processing message to the error message (*)
            setConsoleOutput(prev => [
              ...prev.slice(0, -1), // Remove processing message
              `[Didi] `
            ]);
            
            // Type the error message character by character
            let charIndex = 0;
            const typingInterval = setInterval(() => {
              if (charIndex < didiErrorResponse.length) {
                // Type the error message character by character
                setConsoleOutput(prev => {
                  // Replace the last line with more characters
                  const updatedLines = [...prev];
                  updatedLines[updatedLines.length - 1] = `[Didi] ${didiErrorResponse.substring(0, charIndex + 1)}`;
                  return updatedLines;
                });
                charIndex++;
              } else {
                clearInterval(typingInterval);
                // When finished typing the error, add the system error message
                setConsoleOutput(prev => [
                  ...prev,
                  `[SYSTEM] Error: ${error.message || 'Unknown error'}`
                ]);
              }
            }, 20);
          });
      } catch (error) {
        // If AI service throws synchronously, use the error message
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Start with empty error message
        setConsoleOutput(prev => [
          ...prev.slice(0, -1), // Remove processing message
          `[SYSTEM] `
        ]);
        
        // Type the system error message
        const errorText = `Error processing request: ${errorMessage}`;
        let charIndex = 0;
        const typingInterval = setInterval(() => {
          if (charIndex < errorText.length) {

            // Type the system error message character by character 
            setConsoleOutput(prev => {
              // Replace the last line with more characters
              const updatedLines = [...prev];
              updatedLines[updatedLines.length - 1] = `[SYSTEM] ${errorText.substring(0, charIndex + 1)}`;
              return updatedLines;
            });
            charIndex++;

          } else {
            // After Didi types the user-facing error message, add the *actual* system error message to the console output if DEBUG_DIDI is true
            if (DEBUG_DIDI) {
              setConsoleOutput(prev => [
                ...prev,
                `[SYSTEM] Error: ${errorMessage}`
              ]); // Add the system error message to the console output
            }
            clearInterval(typingInterval); // Stop the typing interval
          }
        }, 20);


      }
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
            
            {/* Countdown Timer - Use extracted DecryptionTimer component */}
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
            
            {/* System status - Positioned below input field */}
            {/* Is before release time? */}
            {!isReleaseTime && (
              <motion.div 
                className="mt-3 text-sm font-mono px-3 py-2 bg-black/40 rounded border-l-2 w-full"
                style={{ borderColor: "#33ff66", color: "#33ff66" }}
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span style={{ opacity: 0.7 }}>// </span>
                
                {/* Mobile-friendly layout with flex wrapping */}
                <div className="inline sm:inline-flex items-center flex-wrap">
                  <span className="block sm:inline mr-1">SYSTEM STATUS:</span> 
                  <span className="block sm:inline font-bold">AWAITING COUNTDOWN COMPLETION</span>
                  <motion.span 
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    style={{ marginLeft: 2 }}
                  >_</motion.span>
                </div>
              </motion.div>
            )}

            {/* Is after release time? */}
            {isReleaseTime && (
              <motion.div 
                className="mt-3 text-sm font-mono px-3 py-2 bg-black/40 rounded border-l-2 w-full"
                style={{ borderColor: "#33ff66", color: "#33ff66" }}
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span style={{ opacity: 0.7 }}>// </span>
                
                {/* Mobile-friendly layout with flex wrapping */}
                <div className="inline sm:inline-flex items-center flex-wrap">
                  <span className="block sm:inline mr-1">SYSTEM STATUS:</span> 
                  <span className="block sm:inline font-bold">$DUEL IS NOW LIVE</span>
                  <span className="block sm:inline font-bold">CONTRACT ADDRESS:</span>
                  <span className="block sm:inline font-bold">
                    <ContractDisplay 
                      isRevealed={true}
                      contractAddress={config.CONTRACT_ADDRESS}
                    />
                  </span>
                  <motion.span 
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    style={{ marginLeft: 2 }}
                  >_</motion.span>
                </div>
              </motion.div>
            )}

          </div>
        </motion.div>
      )}
      
      {/* Minimized state (just a small bar to restore) */}
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