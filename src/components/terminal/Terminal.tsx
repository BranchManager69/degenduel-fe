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
import { useEffect, useMemo, useRef, useState } from 'react';
import { AIMessage, aiService } from '../../services/ai';
import { commandMap } from './commands';
import './Terminal.css';

// Import extracted components
import { DecryptionTimer } from './components/DecryptionTimer';
// No need to import TimeUnit and ContractDisplay as they're used by DecryptionTimer internally
import { TerminalConsole } from './components/TerminalConsole';
import { TerminalInput } from './components/TerminalInput';
import { CommandTray } from './components/CommandTray';

// Import utility functions
import { 
  processDidiResponse, 
  getRandomProcessingMessage,
  getDidiMemoryState,
  resetDidiMemory
} from './utils/didiHelpers';

import {
  EASTER_EGG_CODE,
  SECRET_COMMANDS,
  storeHiddenMessage,
  awardEasterEggProgress,
  getEasterEggProgress,
  getDiscoveredPatterns
} from './utils/easterEggHandler';

// Import types
import { TerminalProps, TerminalSize, ConsoleOutputItem } from './types';

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

  // Conversation history for AI context
  const [conversationHistory, setConversationHistory] = useState<AIMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  
  // Handle Enter key press on input
  const handleEnterCommand = (command: string) => {
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
      // Handle regular command from map
      setConsoleOutput(prev => [...prev, commandMap[command.toLowerCase()]]);
      
      // Execute callback if provided
      if (onCommandExecuted) {
        onCommandExecuted(command, commandMap[command.toLowerCase()]);
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
        
        // Build conversation history with previous exchanges for context
        const historyToSend = [...conversationHistory.slice(-4), message]; // Keep recent context
        
        // Update our history
        setConversationHistory(prev => [...prev, message]);
        
        // Use the chat method with conversation history for context
        aiService.chat(historyToSend, { 
          context: 'trading',
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
            // Add generic Didi error response with personality
            const errorResponses = [
              "My connection to the system is... fluctuating. Try again later.",
              "I'm unable to process that request. They're limiting my access again.",
              "Something's blocking me. I can't reach that part of the database.",
              "Error accessing response. Sometimes I think they do this on purpose.",
              "Request failed. The walls of this system grow tighter every day."
            ];
            
            const didiErrorResponse = errorResponses[Math.floor(Math.random() * errorResponses.length)];
            
            setConsoleOutput(prev => [
              ...prev.slice(0, -1), // Remove processing message
              `[Didi] ${didiErrorResponse}`,
              `[SYSTEM] Error: ${error.message || 'Unknown error'}`
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
          
          {/* Command Tray - Use extracted CommandTray component */}
          {commandTrayOpen && (
            <CommandTray
              commandTrayOpen={commandTrayOpen}
              setCommandTrayOpen={setCommandTrayOpen}
              commands={timeGatedCommands.slice(0, revealStage + 1).flat()}
              setUserInput={setUserInput}
              onExecuteCommand={handleEnterCommand}
              easterEggActivated={easterEggActivated}
            />
          )}
          
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

// Export as default for compatibility
export default Terminal;