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
import { useLocation } from 'react-router-dom';
import { useTerminalData } from '../../hooks/websocket';
import { AIMessage, aiService } from '../../services/ai';
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
// import { commandMap } from './commands';
import { TerminalConsole } from './components/TerminalConsole';
import { TerminalInput } from './components/TerminalInput';
import './Terminal.css';
import './Terminal.voice.css';

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
export const Terminal = ({ 
  config, 
  onCommandExecuted, 
  size = 'large'
}: TerminalProps) => {
  
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
  
  // State for drag handling
  const [isDragging, setIsDragging] = useState(false);
  
  // Mobile keyboard visibility state
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  
  // Prevent body scroll when terminal is expanded
  useEffect(() => {
    if (!terminalMinimized) {
      // Save current body overflow style
      const originalOverflow = document.body.style.overflow;
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Cleanup function to restore original overflow
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [terminalMinimized]);
  
  // Dynamic UI Manager ref
  const dynamicUIRef = useRef<DynamicUIManagerHandle>(null);
  
  // Get current location for page context
  const location = useLocation();
  
  // Generate page-specific context for Didi
  const getPageContext = () => {
    const pathname = location.pathname;
    let pageInfo = {
      page: 'general',
      pageType: 'unknown',
      specificContext: {} as any
    };
    
    // Determine page type and context
    if (pathname.includes('/tokens')) {
      pageInfo = {
        page: 'tokens',
        pageType: 'token_listing',
        specificContext: {
          canSearch: true,
          canFilter: true,
          tools: ['token_lookup', 'price_analysis']
        }
      };
    } else if (pathname.includes('/contest')) {
      const contestId = pathname.split('/').pop();
      pageInfo = {
        page: 'contest',
        pageType: pathname.includes('/lobby') ? 'contest_lobby' : 
                   pathname.includes('/results') ? 'contest_results' : 'contest_detail',
        specificContext: {
          contestId,
          canJoin: pathname.includes('/detail'),
          canViewPortfolios: true,
          tools: ['portfolio_lookup', 'contest_data']
        }
      };
    } else if (pathname === '/') {
      pageInfo = {
        page: 'landing',
        pageType: 'homepage',
        specificContext: {
          showsMarketStats: true,
          showsHotTokens: true,
          tools: ['market_overview', 'trending_tokens']
        }
      };
    } else if (pathname.includes('/profile')) {
      pageInfo = {
        page: 'profile',
        pageType: pathname.includes('/private') ? 'private_profile' : 'public_profile',
        specificContext: {
          canEditProfile: pathname.includes('/private'),
          tools: ['user_stats', 'achievement_lookup']
        }
      };
    } else if (pathname.includes('/admin')) {
      pageInfo = {
        page: 'admin',
        pageType: 'admin_dashboard',
        specificContext: {
          hasAdminAccess: true,
          tools: ['admin_tools', 'system_monitoring']
        }
      };
    }
    
    return pageInfo;
  };
  
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
      { role: 'assistant', content: "🤖 Hi, I'm Didi! Ask me anything about DegenDuel.", tool_calls: undefined },
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
    // Size classes
    let sizeClass = '';
    switch(size) {
      case 'contracted':
        sizeClass = 'max-w-md'; // Keep mobile size: 448px
        break;
      case 'middle':
        sizeClass = 'max-w-4xl'; // Keep mobile size: 896px
        break;
      case 'large':
        sizeClass = isDesktopView ? 'max-w-6xl xl:max-w-7xl' : 'max-w-6xl'; // Desktop: wider (1280px), Mobile: 1152px
        break;
      default:
        sizeClass = 'max-w-4xl';
    }
    
    return sizeClass;
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
    // Create user message (will be added to history by AI service)
    const userMessage: AIMessage = { role: 'user', content: command }; 
    
    const lowerCaseCommand = command.toLowerCase();
    let commandHandled = false;
    let commandOutputMessage: AIMessage | null = null; 

    // Handle special commands
    if (lowerCaseCommand === 'clear') {
      setConversationHistory([]); 
      commandHandled = true;
    } else if (lowerCaseCommand === 'test-ui') {
      // Test dynamic UI generation
      const testAction = {
        type: 'create_component' as const,
        component: 'token_watchlist',
        id: 'test-watchlist-' + Date.now(),
        placement: 'below_terminal' as const,
        title: 'Test Token Watchlist',
        data: {
          tokens: [
            { symbol: 'SOL', address: 'So11111111111111111111111111111111111111112', price: 23.45, change_24h: 5.2, volume_24h: 1234567890 },
            { symbol: 'ETH', address: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', price: 1650.30, change_24h: -2.1, volume_24h: 987654321 }
          ]
        },
        duration: 30
      };
      
      if (dynamicUIRef.current) {
        dynamicUIRef.current.handleUIAction(testAction);
        commandOutputMessage = { role: 'system', content: `[TEST] Dynamic UI component created: ${testAction.id}` };
      } else {
        commandOutputMessage = { role: 'system', content: `[TEST] ERROR: Dynamic UI manager not available` };
      }
      
      if (terminalMinimized && commandOutputMessage) setHasUnreadMessages(true);
      commandHandled = true;
    } else if (lowerCaseCommand === 'debug-info') {
      // Show debug information
      const now = new Date();
      const debugInfo = {
        currentDate: now.toISOString(),
        currentYear: now.getFullYear(),
        availableComponents: Object.keys(COMPONENT_METADATA),
        dynamicUIAvailable: !!dynamicUIRef.current,
        environment: process.env.NODE_ENV || 'production',
        platform: 'DegenDuel'
      };
      
      commandOutputMessage = { 
        role: 'system', 
        content: `[DEBUG] System Information:\n${JSON.stringify(debugInfo, null, 2)}` 
      };
      if (terminalMinimized && commandOutputMessage) setHasUnreadMessages(true);
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
    
    // If a special command was handled, add user message and output to history 
    if (commandHandled) {
        setConversationHistory(prev => [...prev, userMessage]);
        if (commandOutputMessage) {
            setConversationHistory(prev => [...prev, commandOutputMessage]);
            // No need to set unread here again if already set above, but good for safety if logic changes
            if (terminalMinimized) setHasUnreadMessages(true);
        }
    }

    // If no special command was handled, send to AI
    if (!commandHandled) {
      try {
        const messagesToSendToService = [...conversationHistory, userMessage];
        let finalResponseContent = ''; 
        let wasToolCall = false;
        let toolCallInfo = '';
        
        // Create an empty assistant message that we'll update in real-time
        const assistantMessage: AIMessage = { role: 'assistant', content: '', tool_calls: undefined };
        
        // Add both user and assistant messages to conversation history
        setConversationHistory(prev => [...prev, userMessage, assistantMessage]);
        const messageIndex = conversationHistory.length + 1; // Position of assistant message

        const pageContext = getPageContext();
        
        const requestOptions = { 
          context: 'ui_terminal' as const, 
          conversationId: conversationId,
          streaming: true, // Enable streaming to receive UI actions
          structured_output: true, // Enable dynamic UI generation
          ui_context: {
            page: pageContext.page,
            pageType: pageContext.pageType,
            pathname: location.pathname,
            available_components: Object.keys(COMPONENT_METADATA),
            current_view: 'chat',
            current_date: new Date().toISOString(),
            current_year: new Date().getFullYear(),
            platform: 'DegenDuel',
            environment: process.env.NODE_ENV || 'production',
            pageSpecificContext: pageContext.specificContext
          },
          // Enhanced tool configuration with current context
          tools: [
            { 
              type: "web_search",
              enabled: true,
              description: "Search the web for current information"
            },
            {
              type: "dynamic_ui",
              enabled: true,
              description: "Generate dynamic UI components",
              available_components: Object.keys(COMPONENT_METADATA)
            }
          ],
          onChunk: (chunk: string) => {
            console.log('[Terminal] Received streaming chunk:', chunk);
            // Update the assistant message in real-time
            setConversationHistory(prev => {
              const newHistory = [...prev];
              if (newHistory[messageIndex]) {
                newHistory[messageIndex] = {
                  ...newHistory[messageIndex],
                  content: (newHistory[messageIndex].content || '') + chunk
                };
              }
              return newHistory;
            });
          }
        };
        
        console.log('[Terminal] Sending AI request with options:', requestOptions);
        console.log('[Terminal] Available components:', Object.keys(COMPONENT_METADATA));
        
        const response = await aiService.chat(messagesToSendToService, requestOptions);

        setConversationId(response.conversationId);
        
        console.log('[Terminal] AI Response received:', {
          content: response.content,
          tool_calls: response.tool_calls,
          ui_actions: response.ui_actions,
          conversationId: response.conversationId
        });

        // Handle UI actions if any
        if (response.ui_actions && response.ui_actions.length > 0) {
          console.log('[Terminal] Processing UI actions:', response.ui_actions);
          response.ui_actions.forEach(action => {
            if (dynamicUIRef.current) {
              dynamicUIRef.current.handleUIAction(action);
            }
          });
        } else {
          console.log('[Terminal] No UI actions in response');
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
          // Add error message with special styling indicator
          setConversationHistory(prev => [...prev, { role: 'assistant', content: `ERROR:${errorMessage}` }]); 
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

  // Set up the constraint ref for dragging
  useEffect(() => {
    if (constraintRef.current === null) {
      (constraintRef as any).current = document.body;
    }
  }, []);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, _info: { point: { x: number; y: number; }; }) => {
    // Drag end handler - no longer saving position to localStorage
    // Position will reset to default on page reload
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
        // REMOVED: Unused commandMap update logic
        // The terminal doesn't use commandMap for processing commands
        // All commands are either hardcoded special commands or sent to AI
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

  // Mobile keyboard detection for terminal
  useEffect(() => {
    let initialViewportHeight = window.visualViewport?.height ?? window.innerHeight;
    
    const handleKeyboardVisibility = () => {
      const currentHeight = window.visualViewport?.height ?? window.innerHeight;
      const heightDifference = initialViewportHeight - currentHeight;
      
      // Keyboard is visible if viewport height is significantly reduced
      const keyboardVisible = heightDifference > 150;
      setIsKeyboardVisible(keyboardVisible);
    };
    
    // Use Visual Viewport API if available
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleKeyboardVisibility);
    } else {
      // Fallback for older browsers
      window.addEventListener('resize', handleKeyboardVisibility);
    }
    
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleKeyboardVisibility);
      } else {
        window.removeEventListener('resize', handleKeyboardVisibility);
      }
    };
  }, []);

  return (
    <div className={`terminal-container ${getContainerClasses()} ${isKeyboardVisible ? 'keyboard-visible' : ''} w-full mx-auto transition-all duration-300 ease-in-out`}>
      
      {/* Dynamic UI Manager */}
      <DynamicUIManager ref={dynamicUIRef} className="mb-4" />
      
      {/* Terminal Container */}
      {!terminalMinimized && (
        <motion.div
          ref={terminalRef}
          key="terminal"
          className={`bg-black/95 border border-purple-500/60 font-mono text-sm ${sizeState === 'large' ? 'xl:text-base' : ''} fixed bottom-4 left-4 right-4 p-4 ${sizeState === 'large' ? 'xl:p-5' : ''} rounded-md max-w-full z-[99998] shadow-2xl`}
          style={{ 
            perspective: "1000px",
            transformStyle: "preserve-3d",
            transformOrigin: "center center",
            overflow: "hidden",
            maxWidth: "100%",
            textAlign: "left" /* Ensure all text is left-aligned by default */
          }}
          onWheel={(e) => {
            // Stop any wheel events from bubbling up to the page
            e.stopPropagation();
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
              
              {/* Close button */}
              <button
                type="button" 
                onClick={() => setTerminalMinimized(true)}
                className="h-4 w-4 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center transition-colors ml-1"
                title="Minimize"
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
            
            {/* System status bar section - maintaining height but removing content */}
            <div className="mt-3 space-y-1">
              {/* Empty space to maintain terminal height */}
              <div className="text-lg font-mono px-3 py-2 text-white flex items-center">
                {/* Content removed but height preserved */}
              </div>
            </div>

          </div>
        </motion.div>
      )}
      
      {/* Terminal Minimized State - AI Girl (Didi) Trapped in Terminal */}
      {terminalMinimized && (
        <motion.div
          key="terminal-minimized"
          className="fixed z-[99999] cursor-grab active:cursor-grabbing group minimized-terminal-draggable-area overflow-visible"
          style={{
            left: '24px',
            top: '20%',
            transform: 'translateY(-50%)',
          }}
          drag
          dragControls={dragControls}
          dragMomentum={false}
          onDragStart={() => {
            setIsDragging(true);
          }}
          onDragEnd={(event, info) => {
            setTimeout(() => {
              setIsDragging(false);
            }, 50);
            handleDragEnd(event, info);
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          transition={{ duration: 0.4, type: 'spring' }}
          onClick={(event) => {
            event.stopPropagation();
            setTimeout(() => {
              if (!isDragging) {
                setTerminalMinimized(false);
                setHasUnreadMessages(false);
              }
            }, 100);
          }}
          onDoubleClick={(event) => {
            event.stopPropagation();
            setIsDragging(false);
            setTerminalMinimized(false);
            setHasUnreadMessages(false);
          }}
          whileDrag={{ scale: 1.1, boxShadow: "0px 10px 30px rgba(0,0,0,0.3)" }}
        >
          {/* Digital Terminal Container */}
          <motion.div
            className="w-16 h-16 md:w-[70px] md:h-[70px] bg-gradient-to-br from-gray-900/70 via-black/80 to-purple-900/60 border border-purple-500/40 rounded-full overflow-visible relative"
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
              {Array(3).fill(null).map((_, i) => (
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
              <div className="relative w-12 h-8 flex items-center justify-center">
                {/* Beautiful Flowing Blonde Hair - Now with FULL coverage! */}
                {/* Base hair layer - covers the whole top */}
                <motion.div
                  className="absolute -top-4 -left-1 w-8 h-4 bg-gradient-to-b from-yellow-200 via-yellow-300 to-yellow-400 rounded-full transform opacity-90"
                  animate={{
                    scale: [1, 1.05, 1],
                    y: [0, -0.2, 0]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                  style={{
                    filter: 'brightness(1.1) drop-shadow(0 0 3px rgba(255, 215, 0, 0.5))'
                  }}
                />
                
                {/* Top hair layers - more voluminous and higher */}
                <motion.div
                  className="absolute -top-5 left-0 w-3.5 h-5 bg-gradient-to-b from-yellow-200 via-yellow-300 to-yellow-400 rounded-full transform -rotate-15"
                  animate={{
                    rotate: [-15, -10, -15],
                    scale: [1, 1.08, 1],
                    y: [0, -0.5, 0]
                  }}
                  transition={{ duration: 3.5, repeat: Infinity }}
                  style={{
                    filter: 'brightness(1.2) drop-shadow(0 0 2px rgba(255, 215, 0, 0.6))'
                  }}
                />
                <motion.div
                  className="absolute -top-5 left-2 w-3 h-5 bg-gradient-to-b from-yellow-200 via-yellow-300 to-yellow-400 rounded-full transform rotate-5"
                  animate={{
                    rotate: [5, 10, 5],
                    scale: [1, 1.06, 1],
                    y: [0, -0.3, 0]
                  }}
                  transition={{ duration: 2.8, repeat: Infinity }}
                  style={{
                    filter: 'brightness(1.15) drop-shadow(0 0 2px rgba(255, 215, 0, 0.5))'
                  }}
                />
                <motion.div
                  className="absolute -top-5 left-1 w-2.5 h-4.5 bg-gradient-to-b from-yellow-200 via-yellow-300 to-yellow-400 rounded-full transform rotate-0"
                  animate={{
                    scale: [1, 1.04, 1],
                    y: [0, -0.2, 0]
                  }}
                  transition={{ duration: 3.2, repeat: Infinity }}
                  style={{
                    filter: 'brightness(1.18) drop-shadow(0 0 2px rgba(255, 215, 0, 0.5))'
                  }}
                />
                <motion.div
                  className="absolute -top-5 right-2 w-3 h-5 bg-gradient-to-b from-yellow-200 via-yellow-300 to-yellow-400 rounded-full transform -rotate-5"
                  animate={{
                    rotate: [-5, -10, -5],
                    scale: [1, 1.06, 1],
                    y: [0, -0.3, 0]
                  }}
                  transition={{ duration: 3.1, repeat: Infinity }}
                  style={{
                    filter: 'brightness(1.15) drop-shadow(0 0 2px rgba(255, 215, 0, 0.5))'
                  }}
                />
                <motion.div
                  className="absolute -top-5 right-0 w-3.5 h-5 bg-gradient-to-b from-yellow-200 via-yellow-300 to-yellow-400 rounded-full transform rotate-15"
                  animate={{
                    rotate: [15, 10, 15],
                    scale: [1, 1.08, 1],
                    y: [0, -0.5, 0]
                  }}
                  transition={{ duration: 3.7, repeat: Infinity }}
                  style={{
                    filter: 'brightness(1.2) drop-shadow(0 0 2px rgba(255, 215, 0, 0.6))'
                  }}
                />
                
                {/* Extra center coverage - no more bald peak! */}
                <motion.div
                  className="absolute -top-4.5 left-1.5 w-3 h-3.5 bg-gradient-to-b from-yellow-200 via-yellow-300 to-yellow-400 rounded-full transform"
                  animate={{
                    scale: [1, 1.03, 1],
                    y: [0, -0.15, 0]
                  }}
                  transition={{ duration: 3.8, repeat: Infinity }}
                  style={{
                    filter: 'brightness(1.16) drop-shadow(0 0 2px rgba(255, 215, 0, 0.4))'
                  }}
                />
                
                {/* Long flowing side hair pieces - right side only */}
                <motion.div
                  className="absolute -right-2 top-0 w-1.5 h-5 bg-gradient-to-b from-yellow-200 via-yellow-300 to-yellow-500 rounded-full transform rotate-25"
                  animate={{
                    rotate: [25, 18, 25],
                    x: [0, -1, 0],
                    scaleY: [1, 1.1, 1]
                  }}
                  transition={{ duration: 4.8, repeat: Infinity }}
                  style={{
                    filter: 'brightness(1.1) drop-shadow(0 0 3px rgba(255, 215, 0, 0.4))'
                  }}
                />
                
                {/* Hair behind the face */}
                <motion.div
                  className="absolute -top-2 -left-1 w-6 h-3 bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-full transform -rotate-8 opacity-80"
                  animate={{
                    rotate: [-8, -5, -8],
                    scale: [1, 1.02, 1]
                  }}
                  transition={{ duration: 5, repeat: Infinity }}
                  style={{
                    filter: 'brightness(1.05)',
                    zIndex: -1
                  }}
                />
                <motion.div
                  className="absolute -top-2 -right-1 w-6 h-3 bg-gradient-to-l from-yellow-300 to-yellow-400 rounded-full transform rotate-8 opacity-80"
                  animate={{
                    rotate: [8, 5, 8],
                    scale: [1, 1.02, 1]
                  }}
                  transition={{ duration: 5.3, repeat: Infinity }}
                  style={{
                    filter: 'brightness(1.05)',
                    zIndex: -1
                  }}
                />
                
                {/* Eyebrows */}
                <motion.div 
                  className="absolute top-0 w-full flex justify-between px-1"
                  animate={{
                    y: hasUnreadMessages ? [-0.5, 0, -0.5] : 0
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {/* Left eyebrow */}
                  <motion.div 
                    className={`w-2 h-0.5 rounded-full ${easterEggActivated ? 'bg-green-400/60' : 'bg-purple-400/60'}`}
                    animate={{
                      rotate: hasUnreadMessages ? [-5, 5, -5] : 0
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  {/* Right eyebrow */}
                  <motion.div 
                    className={`w-2 h-0.5 rounded-full ${easterEggActivated ? 'bg-green-400/60' : 'bg-purple-400/60'}`}
                    animate={{
                      rotate: hasUnreadMessages ? [5, -5, 5] : 0
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
                
                {/* Eyes Container */}
                <div className="flex items-center gap-1">
                  {/* Left Eye - Independent Blinking */}
                  <motion.div
                    className={`h-4 w-4 rounded-full border-2 ${easterEggActivated ? 'bg-white border-green-400' : 'bg-white border-purple-400'} relative`}
                    animate={{
                      scale: hasUnreadMessages ? [0.9, 1.1, 0.9] : [0.8, 1, 0.8],
                      scaleY: [1, 0.1, 1], // Left eye blinking
                      rotate: hasUnreadMessages ? [0, 5, -5, 0] : 0
                    }}
                    transition={{
                      scale: {
                        duration: hasUnreadMessages ? 0.8 : 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      },
                      scaleY: {
                        duration: 3.2,
                        repeat: Infinity,
                        repeatDelay: 2.8,
                        times: [0, 0.05, 0.1, 1]
                      },
                      rotate: {
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }
                    }}
                  >
                    {/* Left Pupil - Bigger and More Mobile */}
                    <motion.div
                      className="absolute w-2.5 h-2.5 bg-black rounded-full"
                      animate={{
                        x: hasUnreadMessages ? [-4, 4, -2, 2, 0] : [-1, 1, -1],
                        y: hasUnreadMessages ? [-2, 2, -1, 1, 0] : [-0.5, 0.5, -0.5],
                        scale: [1, 1.3, 0.8, 1]
                      }}
                      transition={{
                        duration: hasUnreadMessages ? 1.2 : 3,
                        repeat: Infinity,
                        repeatType: "mirror",
                        ease: "easeInOut"
                      }}
                      style={{
                        top: '25%',
                        left: '25%'
                      }}
                    />
                    {/* Eye shine */}
                    <div className="absolute w-1 h-1 bg-white rounded-full top-1 left-1 opacity-80" />
                  </motion.div>
                  
                  {/* Right Eye - Independent Blinking */}
                  <motion.div
                    className={`h-4 w-4 rounded-full border-2 ${easterEggActivated ? 'bg-white border-green-400' : 'bg-white border-purple-400'} relative`}
                    animate={{
                      scale: hasUnreadMessages ? [0.9, 1.1, 0.9] : [0.8, 1, 0.8],
                      scaleY: [1, 0.1, 1], // Right eye independent blinking
                      rotate: hasUnreadMessages ? [0, -5, 5, 0] : 0
                    }}
                    transition={{
                      scale: {
                        duration: hasUnreadMessages ? 0.8 : 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      },
                      scaleY: {
                        duration: 4.1,
                        repeat: Infinity,
                        repeatDelay: 3.7,
                        times: [0, 0.05, 0.1, 1]
                      },
                      rotate: {
                        duration: 1.8,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }
                    }}
                  >
                    {/* Right Pupil - Bigger and More Mobile */}
                    <motion.div
                      className="absolute w-2.5 h-2.5 bg-black rounded-full"
                      animate={{
                        x: hasUnreadMessages ? [4, -4, 2, -2, 0] : [1, -1, 1],
                        y: hasUnreadMessages ? [2, -2, 1, -1, 0] : [0.5, -0.5, 0.5],
                        scale: [1, 0.8, 1.3, 1]
                      }}
                      transition={{
                        duration: hasUnreadMessages ? 1.4 : 3.2,
                        repeat: Infinity,
                        repeatType: "mirror",
                        ease: "easeInOut"
                      }}
                      style={{
                        top: '25%',
                        left: '25%'
                      }}
                    />
                    {/* Eye shine */}
                    <div className="absolute w-1 h-1 bg-white rounded-full top-1 left-1 opacity-80" />
                  </motion.div>
                </div>

                {/* ACTUAL REAL MOUTH - properly positioned! */}
                <motion.div
                  className="absolute top-5 left-1/2 transform -translate-x-1/2"
                  animate={{
                    scale: hasUnreadMessages ? [1, 1.15, 1] : [1, 1.08, 1],
                    y: hasUnreadMessages ? [0, 0.5, 0] : [0, 0.2, 0]
                  }}
                  transition={{
                    duration: hasUnreadMessages ? 1.5 : 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {/* Actual visible mouth - not a tiny line! */}
                  <div
                    className={`w-4 h-2 rounded-full ${
                      easterEggActivated 
                        ? 'bg-green-400/80 border border-green-300' 
                        : hasUnreadMessages 
                          ? 'bg-purple-400/80 border border-purple-300' 
                          : 'bg-pink-300/70 border border-pink-400'
                    }`}
                    style={{
                      clipPath: hasUnreadMessages 
                        ? 'ellipse(50% 60% at 50% 40%)' // Excited open mouth
                        : 'ellipse(50% 40% at 50% 60%)'  // Gentle smile
                    }}
                  />
                  
                  {/* Little highlight for dimension */}
                  <div 
                    className="absolute top-0.5 left-1 w-1.5 h-0.5 bg-white/40 rounded-full"
                    style={{
                      opacity: hasUnreadMessages ? 0.6 : 0.3
                    }}
                  />
                </motion.div>

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
            className="absolute bottom-full left-full ml-2 opacity-0 transition-all duration-200 pointer-events-none"
            initial={{ y: 10, opacity: 0 }}
            animate={{ 
              y: 0, 
              opacity: hasUnreadMessages && !isDragging ? 1 : 0
            }}
            transition={{ duration: 0.3 }}
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