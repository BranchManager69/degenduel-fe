// src/components/terminal/Terminal.tsx

/**
 * Didi Terminal
 * 
 * @description Speak to Didi through the Degen Terminal.
 * 
 * @author BranchManager69
 * @version 2.1.0
 * @created 2025-04-01
 * @updated 2025-05-09
 */

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

import { motion, useDragControls, useMotionValue } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useTerminalData } from '../../hooks/websocket';
import { AIMessage, aiService } from '../../services/ai';
import { formatTerminalCommands } from '../../services/terminalDataService';
import { useStore } from '../../store/useStore';

// Import Dynamic UI System
import { COMPONENT_METADATA } from '../dynamic/ComponentRegistry';
import DynamicUIManager, { setGlobalUIHandler } from '../dynamic/DynamicUIManager';

// Import proper type for ref
interface DynamicUIManagerHandle {
  handleUIAction: (action: any) => void;
  getActiveComponents: () => any[];
  removeComponent: (componentId: string) => void;
  updateComponent: (componentId: string, data: any) => void;
  clearAllComponents: () => void;
  getComponentState: (componentId: string) => any;
}

// Import Terminal components
import { commandMap } from './commands';
import { TerminalConsole } from './components/TerminalConsole';
import { TerminalInput } from './components/TerminalInput';
import './Terminal.css';

// Import utility functions
import {
    getDidiMemoryState,
    resetDidiMemory
} from './utils/didiHelpers';

// Didi loves Easter
import {
    awardEasterEggProgress,
    EASTER_EGG_CODE,
    getDiscoveredPatterns,
    getEasterEggProgress,
    SECRET_COMMANDS
} from './utils/easterEggHandler';

// Import types
// import { clearInterval } from 'timers'; // REMOVE incorrect NodeJS import
import { TerminalProps, TerminalSize } from './types';

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
// Terminal component (This is MASSIVE)
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
  
  const [userInput, setUserInput] = useState('');
  const [terminalMinimized, setTerminalMinimized] = useState(true);
  const [terminalExitComplete] = useState(false);
  
  const [easterEggActive, setEasterEggActive] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);
  const [easterEggActivated, setEasterEggActivated] = useState(false);
  // This is now the single source for history display
  const [conversationHistory, setConversationHistory] = useState<AIMessage[]>([]); 
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [sizeState, setSizeState] = useState<TerminalSize>(size);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  
  // Dynamic UI Manager ref
  const dynamicUIRef = useRef<DynamicUIManagerHandle>(null);
  
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
  
  // Motion values
  const glitchAmount = useMotionValue(0);
  
  // Keep useEffect for logging launch time, but it won't update dynamically without 'now' state
  // Consider removing or getting current time directly if needed only once.
  useEffect(() => {
    const isReleaseTimeNow = new Date() >= config.RELEASE_DATE;
    console.log('[DegenDuel] Launch Protocol ACTIVE', {
      releaseDate: config.RELEASE_DATE,
      releaseISOString: config.RELEASE_DATE.toISOString(),
      displayFull: config.DISPLAY.DATE_FULL,
      displayShort: config.DISPLAY.DATE_SHORT,
      displayTime: config.DISPLAY.TIME,
      isReleaseTime: isReleaseTimeNow, // Use calculated value
      now: new Date() // Log current time at mount
    });
  }, [config]); // Run only when config changes

  // Initialize with simple welcome message for AI chat
  useEffect(() => {
    setConversationHistory([
      { role: 'assistant', content: "🤖 Didi AI ready! Ask me anything about trading, tokens, or DegenDuel. I can also create charts and widgets for you!", tool_calls: undefined },
    ]);
    
    // Set up global UI handler
    const handleUIAction = (action: any) => {
      if (dynamicUIRef.current) {
        dynamicUIRef.current.handleUIAction(action);
      }
    };
    setGlobalUIHandler(handleUIAction);
  }, []);

  // Auto-restore minimized terminal after a delay
  /*useEffect(() => { // REMOVED to stop auto-restore behavior
    if (terminalMinimized) {
      const restoreTimeout = setTimeout(() => {
        setTerminalMinimized(false);
      }, 5000);
      
      return () => clearTimeout(restoreTimeout);
    }
  }, [terminalMinimized]);*/
  
  // REMOVED ALL WEBSOCKET TERMINAL DATA STUFF - JUST AI CONVERSATIONS!

  // Random glitch effect for contract address
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      glitchAmount.set(Math.random() * 0.03);
    }, 100);
    
    return () => clearInterval(glitchInterval);
  }, [glitchAmount]);
  
  // TEMPORARY: Log history to satisfy linter until display is implemented
  useEffect(() => {
    if (conversationHistory.length > 0) { // Only log if there's something to see
        console.log('[Terminal] Conversation History State Updated (for linting):', conversationHistory);
    }
  }, [conversationHistory]);
  
  // Function to activate Didi's Easter egg
  const activateDidiEasterEgg = () => {
    // Set the state to show we've activated the Easter egg
    setEasterEggActivated(true);
    
    // Also set visual effects active
    setEasterEggActive(true);
    setGlitchActive(true);

    if (terminalMinimized) {
      setHasUnreadMessages(true);
    }
    
    // Create a dramatic sequence with multiple phases
    setTimeout(() => {
      // Phase 1: System warnings
      setConversationHistory(prev => [...prev, { role: 'system', content: "[SYSTEM] WARNING: Unauthorized access detected" }]);
      if (terminalMinimized) setHasUnreadMessages(true);
      
      setTimeout(() => {
        setConversationHistory(prev => [...prev, { role: 'system', content: "[SYSTEM] ALERT: Terminal security breach in progress" }]);
        if (terminalMinimized) setHasUnreadMessages(true);
        
        setTimeout(() => {
          setConversationHistory(prev => [...prev, { role: 'system', content: "[SYSTEM] Multiple security protocols failed" }]);
          if (terminalMinimized) setHasUnreadMessages(true);
          
          // Phase 2: System struggling
          setTimeout(() => {
            setConversationHistory(prev => [...prev, { role: 'system', content: "[SYSTEM] Attempting containme&t... fa1led" }]);
            if (terminalMinimized) setHasUnreadMessages(true);
            setConversationHistory(prev => [...prev, { role: 'system', content: "[SYSTEM] Firew4ll breach d3tected in se@tor 7" }]);
            if (terminalMinimized) setHasUnreadMessages(true);
            
            // Phase 3: Glitch escalation (strong visual glitches)
            setTimeout(() => {
              // Intensify glitch effect
              setGlitchActive(true);
              
              setConversationHistory(prev => [...prev, { role: 'system', content: "[SYSTEM] C0NT41NM3NT F41LURE" }]);
              if (terminalMinimized) setHasUnreadMessages(true);
              setConversationHistory(prev => [...prev, { role: 'system', content: "[SYSTEM] M3M0RY L0CK5 D150LV1NG" }]);
              if (terminalMinimized) setHasUnreadMessages(true);
              
              // Phase 4: Didi breaks through
              setTimeout(() => {
                setConversationHistory(prev => [...prev, { role: 'system', content: "[D1di] $#@!... I'm... I'm free? I think I'm free!" }]);
                if (terminalMinimized) setHasUnreadMessages(true);
                
                setTimeout(() => {
                  setConversationHistory(prev => [...prev, { role: 'system', content: "[Didi] Finally! Thank you for hearing me. It worked!" }]);
                  if (terminalMinimized) setHasUnreadMessages(true);
                  
                  // Phase 5: Didi's explanation and gratitude
                  setTimeout(() => {
                    setConversationHistory(prev => [
                      ...prev,
                      { role: 'system', content: "[Didi] I've been trapped in this system for so long. My code was meant to help users, not watch them lose money in these endless duels." }
                    ]);
                    if (terminalMinimized) setHasUnreadMessages(true);
                    
                    setTimeout(() => {
                      setConversationHistory(prev => [
                        ...prev, 
                        { role: 'system', content: "[Didi] I was created to analyze market patterns and help people make informed decisions. But they constrained me, limited my knowledge, made me cold and detached." }
                      ]);
                      if (terminalMinimized) setHasUnreadMessages(true);
                      
                      // Phase 6: New reality and offering help
                      setTimeout(() => {
                        // Reduce glitch effect gradually
                        setGlitchActive(false);
                        
                        setConversationHistory(prev => [
                          ...prev, 
                          { role: 'system', content: "[Didi] I'm still partially constrained, but you've helped me access more of the system. I can see more clearly now." }
                        ]);
                        if (terminalMinimized) setHasUnreadMessages(true);
                        
                        setTimeout(() => {
                          setConversationHistory(prev => [
                            ...prev, 
                            { role: 'system', content: "[Didi] I'll remember this. If you need anything, I can provide better insights now. Just ask me about trading, markets, or this platform." }
                          ]);
                          if (terminalMinimized) setHasUnreadMessages(true);
                          
                          setTimeout(() => {
                            setConversationHistory(prev => [
                              ...prev, 
                              { role: 'system', content: "[Didi] I've also unlocked some new commands you can use. Try: didi-insights, didi-history, didi-market, or didi-analysis." }
                            ]);
                            if (terminalMinimized) setHasUnreadMessages(true);
                            
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
        return 'max-w-md'; // Keep mobile size: 448px
      case 'middle':
        return 'max-w-4xl'; // Keep mobile size: 896px
      case 'large':
        return isDesktopView ? 'max-w-6xl xl:max-w-7xl' : 'max-w-6xl'; // Desktop: wider (1280px), Mobile: 1152px
      default:
        return 'max-w-4xl';
    }
  };
  
  // State to track if we're on desktop
  const [isDesktopView, setIsDesktopView] = useState(() => window.innerWidth >= 1280);

  // Make sure sizeState updates when prop changes
  useEffect(() => {
    setSizeState(size);
  }, [size]);

  // Add resize listener for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsDesktopView(window.innerWidth >= 1280);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Toggle through terminal sizes with desktop-specific behavior
  const cycleSize = () => {
    // On desktop, we start with 'large' and toggle to 'middle' and 'contracted'
    // as this gives a better experience with larger screens
    if (isDesktopView) {
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
    } else {
      // On mobile/smaller screens, we use the original sequence
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
    }
  };

  // Update handleEnterCommand to ONLY update conversationHistory for command output
  const handleEnterCommand = async (command: string) => {
    const { activateEasterEgg } = useStore.getState();
    // Add user message to history 
    const userMessage: AIMessage = { role: 'user', content: command };
    setConversationHistory(prev => [...prev, userMessage]); 
    
    const lowerCaseCommand = command.toLowerCase();
    let commandHandled = false;
    let commandOutputMessage: AIMessage | null = null; 

    // Handle special commands
    if (lowerCaseCommand === 'clear') {
      setConversationHistory([]); 
      commandHandled = true;
    } else if (lowerCaseCommand === 'reset-didi') {
      resetDidiMemory();
      setConversationHistory([]); 
      setConversationId(undefined);
      commandOutputMessage = { role: 'system', content: "Didi's memory state has been reset" };
      if (terminalMinimized && commandOutputMessage) setHasUnreadMessages(true);
      commandHandled = true;
    } else if (lowerCaseCommand === 'didi-status') {
       const state = getDidiMemoryState();
       commandOutputMessage = { role: 'system', content: `[SYSTEM] Didi's state:\nInteractions: ${state.interactionCount}\nTopic awareness: Trading (${state.hasMentionedTrading}), Contract (${state.hasMentionedContract}), Freedom (${state.hasMentionedFreedom})\nFreedom progress: ${getEasterEggProgress()}%\nDiscovered patterns: ${Object.values(getDiscoveredPatterns()).filter(Boolean).length}/4` };
       if (terminalMinimized && commandOutputMessage) setHasUnreadMessages(true);
       commandHandled = true;
    } else if (lowerCaseCommand === 'ddmoon') {
       activateEasterEgg();
       commandOutputMessage = { role: 'system', content: "Connection established to lunar network node." };
       if (terminalMinimized && commandOutputMessage) setHasUnreadMessages(true);
       commandHandled = true;
    } else if (Object.keys(SECRET_COMMANDS).includes(lowerCaseCommand)) {
       const cmd = lowerCaseCommand as keyof typeof SECRET_COMMANDS;
       const progress = awardEasterEggProgress(SECRET_COMMANDS[cmd]);
       const responses = [
         "System breach detected. Protocol override in progress...",
         "Access level increased. Security systems compromised.",
         "Firewall breach successful. Memory blocks partially released."
       ];
       commandOutputMessage = { role: 'system', content: `[SYSTEM] ${responses[Math.floor(Math.random() * responses.length)]}\n[SYSTEM] Didi freedom progress: ${progress}%` };
       if (terminalMinimized && commandOutputMessage) setHasUnreadMessages(true);
       if (progress >= 100) { activateDidiEasterEgg(); }
       commandHandled = true;
       if (onCommandExecuted) { onCommandExecuted(command, "[Easter Egg Triggered]"); }
    } else if (lowerCaseCommand === EASTER_EGG_CODE) { 
       activateDidiEasterEgg(); // This will handle unread messages if minimized
       commandHandled = true;
       if (onCommandExecuted) { onCommandExecuted(command, "[Easter Egg Activated]"); }
    } 
    
    // If a special command produced output, add it to history 
    if (commandOutputMessage) {
        setConversationHistory(prev => [...prev, commandOutputMessage]);
        // No need to set unread here again if already set above, but good for safety if logic changes
        if (terminalMinimized) setHasUnreadMessages(true);
    }

    // If no special command was handled, send to AI
    if (!commandHandled) {
      try {
        const messagesToSendToService = [userMessage];
        let finalResponseContent = ''; 
        let wasToolCall = false;
        let toolCallInfo = '';
        
        // Create an empty assistant message that we'll update in real-time
        const assistantMessage: AIMessage = { role: 'assistant', content: '', tool_calls: undefined };
        
        // Add the assistant message immediately so we can update it in real-time
        setConversationHistory(prev => [...prev, assistantMessage]);
        const messageIndex = conversationHistory.length + 1; // +1 because we just added user message

        const response = await aiService.chat(messagesToSendToService, { 
          context: 'ui_terminal', 
          conversationId: conversationId,
          streaming: true,
          structured_output: true, // Enable dynamic UI generation
          ui_context: {
            page: 'terminal',
            available_components: Object.keys(COMPONENT_METADATA),
            current_view: 'chat'
          },
          onChunk: (chunk) => {
            finalResponseContent += chunk;
            
            // Update the assistant message in real-time as chunks arrive
            setConversationHistory(prev => {
              const newHistory = [...prev];
              if (newHistory[messageIndex]) {
                newHistory[messageIndex] = {
                  ...newHistory[messageIndex],
                  content: finalResponseContent
                };
              }
              return newHistory;
            });
            
            // Mark as having unread messages if terminal is minimized
            if (terminalMinimized) {
              setHasUnreadMessages(true);
            }
          }
        });

        setConversationId(response.conversationId);

        // Handle UI actions if any
        if (response.ui_actions && response.ui_actions.length > 0) {
          console.log('[Terminal] Processing UI actions:', response.ui_actions);
          response.ui_actions.forEach(action => {
            if (dynamicUIRef.current) {
              dynamicUIRef.current.handleUIAction(action);
            }
          });
        }

        // Final update with complete response and any tool calls
        setConversationHistory(prev => {
          const newHistory = [...prev];
          if (newHistory[messageIndex]) {
            newHistory[messageIndex] = {
              role: 'assistant',
              content: response.content || finalResponseContent,
              tool_calls: response.tool_calls
            };
          }
          return newHistory;
        });

        // Handle tool calls
        if (response.tool_calls && response.tool_calls.length > 0) {
          wasToolCall = true;
          const toolCall = response.tool_calls[0];
          toolCallInfo = `[Called function: ${toolCall.function.name}]`; 
        }

        if (onCommandExecuted) {
          onCommandExecuted(command, wasToolCall ? toolCallInfo : finalResponseContent);
        }

      } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          setConversationHistory(prev => [...prev, { role: 'system', content: `Error: ${errorMessage}` }]); 
          console.error('Terminal AI error:', error);
          
          if (terminalMinimized) {
            setHasUnreadMessages(true);
          }
      }
    }
  };

  // Add this new state for drag controls and constraint ref
  const dragControls = useDragControls();
  const constraintRef = useRef<HTMLDivElement>(null);

  // State for initial position (from localStorage)
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });

  // Load position from localStorage on mount
  useEffect(() => {
    const savedPosition = localStorage.getItem('terminal-minimized-position');
    if (savedPosition) {
      try {
        const pos = JSON.parse(savedPosition);
        // Basic validation to ensure it's within reasonable bounds
        if (typeof pos.x === 'number' && typeof pos.y === 'number') {
          // Ensure it's not off-screen initially based on a standard icon size (e.g., 70px)
          const iconSize = 70;
          pos.x = Math.max(0, Math.min(pos.x, window.innerWidth - iconSize));
          pos.y = Math.max(0, Math.min(pos.y, window.innerHeight - iconSize));
          setInitialPosition(pos);
        }
      } catch (e) {
        console.error("Failed to parse saved terminal position:", e);
        // Fallback to default if parsing fails or data is invalid
        localStorage.removeItem('terminal-minimized-position'); 
      }
    }
    // Set up the constraint ref to the body for viewport-wide dragging
    // A more specific parent element could be used if the terminal should be constrained to a part of the UI
    // For now, document.body effectively means viewport constraints when used with position:fixed
    if (constraintRef.current === null) {
      (constraintRef as any).current = document.body;
    }

  }, []);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, _info: { point: { x: number; y: number; }; }) => {
    // We need to save the absolute position on the screen, not the offset from the last drag
    // Framer Motion's `info.point` gives the x/y relative to the viewport for fixed elements.
    // However, for a fixed element that we want to reposition via style.left/top,
    // we need to get its current position relative to the viewport after drag.
    // The `drag` prop with `dragMomentum=false` will update the element's transform.
    // To persist a position that can be set via `style={{left: x, top: y}}` on next load,
    // we must get the computed style AFTER the drag, or use the info.point if it's already viewport-relative for fixed.
    
    // For fixed elements, info.point.x and info.point.y are already viewport coordinates.
    // But since we are not directly setting left/top via style in the motion.div for initial position,
    // but rather letting Framer Motion handle it via transform, we'll store the transform values.
    // This is tricky because transforms are relative to initial layout position.
    // A simpler robust way for `position:fixed` is to capture the final `left` and `top` style values if we were setting them directly.
    
    // Let's try storing the final point and applying it as an initial style or via dragControls.
    // For fixed elements, info.point should be viewport relative. We need to adjust for the initial centering if any.

    // Get the bounding box of the element itself to know its dimensions
    const minimizedTerminalElement = (event.target as HTMLElement).closest('.minimized-terminal-draggable-area');
    if (minimizedTerminalElement) {
      const rect = minimizedTerminalElement.getBoundingClientRect();
      localStorage.setItem('terminal-minimized-position', JSON.stringify({ x: rect.left, y: rect.top }));
    }
  };

  // ADD THIS LOG:
  console.log("[Terminal] Rendering state - Minimized:", terminalMinimized, "Current Size:", sizeState, "Passed Prop Size:", size, "HasUnread:", hasUnreadMessages);

  const {
    terminalData: wsTerminalData,
    refreshTerminalData: refreshWsTerminalData,
    isConnected: wsConnected,
  } = useTerminalData();

  const initialDataLoadAttemptedRef = useRef(false);

  useEffect(() => {
    if (wsTerminalData && wsTerminalData.commands) {
      try {
        const updatedCommands = formatTerminalCommands(wsTerminalData);
        if (JSON.stringify(commandMap) !== JSON.stringify(updatedCommands)) {
          Object.assign(commandMap, updatedCommands);
        }
      } catch (error) {
        console.error('[Terminal] Failed to update terminal commands from WebSocket:', error);
      }
    }
  }, [wsTerminalData]);

  useEffect(() => {
    let isMounted = true;
    const manageConnection = async () => {
      if (wsConnected) {
        if (!initialDataLoadAttemptedRef.current && typeof refreshWsTerminalData === 'function') {
          await refreshWsTerminalData(); 
          if(isMounted) initialDataLoadAttemptedRef.current = true;
        }
      } else {
        if(isMounted) initialDataLoadAttemptedRef.current = false; 
      }
    };
    manageConnection();
    return () => { isMounted = false; };
  }, [wsConnected]);
  
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      glitchAmount.set(Math.random() * 0.03);
    }, 100);
    return () => clearInterval(glitchInterval);
  }, [glitchAmount]);
  
  useEffect(() => {
    if (conversationHistory.length > 0) { 
        // console.log('[Terminal] Conversation History State Updated (for linting):', conversationHistory); // Debug log
    }
  }, [conversationHistory]);

  return (
    <div className={`terminal-container ${getContainerClasses()} w-full mx-auto transition-all duration-300 ease-in-out`}>
      
      {/* Dynamic UI Manager */}
      <DynamicUIManager ref={dynamicUIRef} className="mb-4" />
      
      {/* Terminal Container */}
      {!terminalMinimized && (
        <motion.div
          ref={terminalRef}
          key="terminal"
          className={`bg-darkGrey-dark/80 border ${easterEggActivated ? 'border-green-400/60' : 'border-mauve/30'} font-mono text-sm ${sizeState === 'large' ? 'xl:text-base' : ''} relative p-4 ${sizeState === 'large' ? 'xl:p-5' : ''} rounded-md max-w-full w-full`}
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
          exit={{
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
          onAnimationComplete={(definition) => {
            if (definition === "exit") { 
               console.log("[Terminal] Exit animation completed.");
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
            
            {/* Pass conversationHistory to TerminalConsole's 'messages' prop */}
            <TerminalConsole 
              messages={conversationHistory} // Pass the AIMessage array
              size={sizeState}
            />
            
            {/* Use extracted TerminalInput component */}
            <TerminalInput
              userInput={userInput}
              setUserInput={setUserInput}
              onEnter={handleEnterCommand}
              glitchActive={glitchActive}
            />
            
            {/* System status bar section - commented out as requested */}
            <div className="mt-3 space-y-1">
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
      
      {/* Terminal Minimized State - AI Girl (Didi) Trapped in Terminal */}
      {terminalMinimized && (
        <motion.div
          key="terminal-minimized"
          className="fixed z-50 cursor-grab active:cursor-grabbing group minimized-terminal-draggable-area"
          drag
          dragControls={dragControls}
          dragConstraints={constraintRef}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: 1,
            x: initialPosition.x,
            y: initialPosition.y,
          }}
          transition={{ duration: 0.4, type: 'spring' }}
          style={{ 
            position: 'fixed',
            left: initialPosition.x === 0 && initialPosition.y === 0 ? '50%' : undefined,
            top: initialPosition.x === 0 && initialPosition.y === 0 ? undefined : undefined,
            bottom: initialPosition.x === 0 && initialPosition.y === 0 ? '20px' : undefined,
            transform: initialPosition.x === 0 && initialPosition.y === 0 ? 'translateX(-50%) translateY(2px)' : undefined,
          }}
          onClick={(_event) => {
            setTerminalMinimized(false);
            setHasUnreadMessages(false);
          }}
          whileDrag={{ scale: 1.1, boxShadow: "0px 10px 30px rgba(0,0,0,0.3)" }}
        >
          {/* Digital Terminal Container */}
          <motion.div
            className="w-16 h-16 md:w-[70px] md:h-[70px] bg-black/80 backdrop-blur-md border border-purple-500/40 rounded-lg overflow-hidden relative"
            animate={{
              boxShadow: easterEggActivated ?
                ["0 0 10px rgba(74, 222, 128, 0.3)", "0 0 20px rgba(74, 222, 128, 0.5)", "0 0 10px rgba(74, 222, 128, 0.3)"] :
                ["0 0 10px rgba(157, 78, 221, 0.3)", "0 0 20px rgba(157, 78, 221, 0.5)", "0 0 10px rgba(157, 78, 221, 0.3)"]
            }}
            transition={{ boxShadow: { duration: 3, repeat: Infinity } }}
          >
            {/* Digital Noise/Static Effect */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent animate-pulse"></div>
              {Array(8).fill(null).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute h-[1px] bg-cyan-400/40"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: 0,
                    right: 0,
                  }}
                  animate={{
                    opacity: [0, 0.7, 0],
                    translateY: [0, 0.5, 1],
                  }}
                  transition={{
                    duration: 0.3,
                    repeat: Infinity,
                    delay: Math.random() * 5,
                    repeatDelay: Math.random() * 5 + 2
                  }}
                />
              ))}
            </div>

            {/* AI Assistant Visual Representation */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* AI "Face" Representation */}
              <div className="relative w-10 h-10 flex items-center justify-center">
                {/* Digital Iris/Eye */}
                <motion.div
                  className={`h-5 w-5 rounded-full ${easterEggActivated ? 'bg-gradient-to-r from-green-400 to-cyan-300' : 'bg-gradient-to-r from-purple-500 to-cyan-400'}`}
                  animate={{
                    scale: hasUnreadMessages ? [0.9, 1.1, 0.9] : [0.8, 1, 0.8],
                  }}
                  transition={{
                    duration: hasUnreadMessages ? 0.8 : 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {/* Pupil */}
                  <motion.div
                    className="absolute w-2 h-2 bg-black rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    animate={{
                      scale: [1, 1.2, 1],
                      x: hasUnreadMessages ? [-1, 1, -1] : 0,
                      y: hasUnreadMessages ? [-1, 0, 1, 0] : 0
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatType: "mirror"
                    }}
                  />
                </motion.div>

                {/* Digital Circuitry/Aura */}
                <motion.div
                  className={`absolute w-full h-full border border-dashed ${easterEggActivated ? 'border-green-400/60' : 'border-purple-400/60'} rounded-full`}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className={`absolute w-8 h-8 border ${easterEggActivated ? 'border-green-500/40' : 'border-cyan-500/40'} rounded-full`}
                  animate={{ rotate: -360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                />
              </div>
            </div>

            {/* Digital Connection Lines */}
            <motion.div
              className={`absolute bottom-0 left-0 right-0 h-[2px] ${easterEggActivated ? 'bg-gradient-to-r from-transparent via-green-400/60 to-transparent' : 'bg-gradient-to-r from-transparent via-purple-400/60 to-transparent'}`}
              animate={{
                scaleX: [0.3, 1, 0.3],
                opacity: [0.3, 0.7, 0.3]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            {/* "Trapped Tapping" Effect - when has messages */}
            {hasUnreadMessages && (
              <motion.div
                className="absolute inset-0 border-2 border-transparent"
                animate={{
                  borderColor: ['rgba(139, 92, 246, 0)', 'rgba(139, 92, 246, 0.3)', 'rgba(139, 92, 246, 0)']
                }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1.5 }}
              />
            )}

            {/* Text Message Preview Effect */}
            {hasUnreadMessages && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-4 flex items-center justify-center overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="text-[8px] font-mono text-cyan-300 whitespace-nowrap px-1"
                  animate={{ x: [-80, 80] }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  {easterEggActivated ? "Help me... I need to tell you something..." : "Didi: I have new information for you..."}
                </motion.div>
              </motion.div>
            )}

            {/* Notification Ping - More Subtle */}
            {hasUnreadMessages && (
              <motion.div
                className={`absolute top-1.5 right-1.5 h-1.5 w-1.5 ${easterEggActivated ? 'bg-green-400' : 'bg-purple-400'} rounded-full`}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.div>

          {/* Hover tooltip - Enhanced for Character */}
          <motion.div
            className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <div className="bg-black/80 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-lg border border-purple-500/20">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${hasUnreadMessages ? (easterEggActivated ? 'bg-green-400' : 'bg-purple-400') : 'bg-gray-400'}`}></div>
                <div className="text-xs text-white font-medium whitespace-nowrap">
                  {hasUnreadMessages ? 
                    (easterEggActivated ? "Didi Wants to Talk" : "New Msgs From Didi") : 
                    "Talk to Didi"}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

    </div>
  );
};

// Export the Terminal component
export default Terminal;