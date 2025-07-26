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

import { motion, useMotionValue } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AIMessage, aiService } from '../../services/ai';
import { useStore } from '../../store/useStore';

// Import Dynamic UI System
import { COMPONENT_METADATA } from '../dynamic/ComponentRegistry';
import DynamicUIManager, { setGlobalUIHandler } from '../dynamic/DynamicUIManager';

// Import optimized Didi Avatar
import './DidiAvatar.css';

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
import {
    getDidiPosition,
    calculateTransitionDuration,
    generateTransition,
    type DidiPosition
} from './utils/didiPositions';

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
import { DidiAvatar } from './DidiAvatar';
import { TerminalMode, TerminalProps, TerminalSize } from './types';

// NEW: Import chat room functionality for alter ego mode
import { GeneralChatMessage, useGeneralChat } from '../../hooks/websocket/topic-hooks/useGeneralChat';

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
  size = 'middle',
  isInitiallyMinimized = true,
  mode = 'ai',
  onModeChange,
}: TerminalProps) => {
  
  // Get user authentication state
  const { user } = useStore();
  
  // Debug: Send user info to debug tab when it changes
  useEffect(() => {
    if (user) {
      setDebugMessages([{
        role: 'system',
        content: `[USER INFO] id: "${user.id}" | wallet: "${user.wallet_address}" | username: "${user.username}" | role: "${user.role}" | admin: ${user.is_admin} | superadmin: ${user.is_superadmin}`,
        tool_calls: undefined
      }]);
    }
  }, [user]);
  
  
  // NEW: Terminal mode state management
  const [currentMode, setCurrentMode] = useState<TerminalMode>(mode);
  
  // Debug messages for debug tab
  const [debugMessages, setDebugMessages] = useState<AIMessage[]>([]);
  
  // NEW: Use general chat for chat room mode with debug message handler
  const {
    messages: chatMessages,
    sendMessage: sendChatMessage,
    isConnected: chatConnected
  } = useGeneralChat();
  
  // Filter debug messages from chat and add to debug tab
  const actualChatMessages = chatMessages.filter(msg => !msg.username?.includes('DEBUG'));
  const newDebugMessages = chatMessages.filter(msg => msg.username?.includes('DEBUG'));
  
  // Debug: Track message comparisons
  useEffect(() => {
    if (actualChatMessages.length > 0 && user) {
      const latestMsg = actualChatMessages[actualChatMessages.length - 1];
      
      // Log EVERYTHING from the message object
      const msgFields = Object.entries(latestMsg).map(([key, value]) => 
        `${key}: "${value}"`
      ).join(' | ');
      
      // Also log all user fields for comparison
      const userFields = `user.id: "${user.id}" | user.username: "${user.username}" | user.wallet_address: "${user.wallet_address}"`;
      
      setDebugMessages(prev => [...prev, {
        role: 'system',
        content: `[FULL MSG] ${msgFields}`,
        tool_calls: undefined
      }, {
        role: 'system', 
        content: `[USER DATA] ${userFields}`,
        tool_calls: undefined
      }]);
    }
  }, [actualChatMessages.length, user]);
  
  // Update debug messages when new debug messages arrive
  useEffect(() => {
    if (newDebugMessages.length > 0) {
      const latestDebugMessage = newDebugMessages[newDebugMessages.length - 1];
      setDebugMessages(prev => {
        // Check if this message is already in debug messages
        const exists = prev.some(msg => 
          msg.content === latestDebugMessage.message && 
          msg.role === 'system'
        );
        if (!exists) {
          return [...prev, {
            role: 'system',
            content: latestDebugMessage.message,
            tool_calls: undefined,
            metadata: { isDebug: true }
          }];
        }
        return prev;
      });
    }
  }, [newDebugMessages]);
  
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
  const [terminalMinimized, setTerminalMinimized] = useState(isInitiallyMinimized);
  const [terminalExitComplete] = useState(false);
  
  const [easterEggActive, setEasterEggActive] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);
  const [easterEggActivated, setEasterEggActivated] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<AIMessage[]>([]); 
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [sizeState, setSizeState] = useState<TerminalSize>(size);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [dynamicStyle, setDynamicStyle] = useState<React.CSSProperties>({});
  
  // State for drag handling
  const [isDragging, setIsDragging] = useState(false);
  
  // State for terminal resizing - initialize based on size prop
  const getInitialDimensions = (size: TerminalSize) => {
    switch (size) {
      case 'contracted':
        return { width: 896, height: 300 };
      case 'middle':
        return { width: 896, height: 400 };
      case 'large':
        return { width: 1152, height: 500 };
      default:
        return { width: 896, height: 400 };
    }
  };
  
  const initialDimensions = getInitialDimensions(size);
  const [terminalWidth, setTerminalWidth] = useState<number>(initialDimensions.width);
  const [terminalHeight, setTerminalHeight] = useState<number>(initialDimensions.height);
  const [isResizing, setIsResizing] = useState(false);
  
  // Mobile keyboard visibility state
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  
  // Proactive messaging system state - use sessionStorage for persistence
  const [pageLoadTime, setPageLoadTime] = useState<Date>(new Date());
  const [hasShownProactiveMessage, setHasShownProactiveMessage] = useState(() => {
    // Check if we've already shown a proactive message this session
    return sessionStorage.getItem('didi_proactive_shown') === 'true';
  });
  const [lastInteractionTime, setLastInteractionTime] = useState<Date>(new Date());
  const lastInteractionRef = useRef<Date>(new Date());
  
  // No body scroll lock - let the browser handle cursor-aware scrolling
  
  // Dynamic UI Manager ref
  const dynamicUIRef = useRef<DynamicUIManagerHandle>(null);
  
  // Get current location for page context
  const location = useLocation();
  
  // Helper functions for tab visibility
  const isAdministrator = user?.role === 'admin' || user?.role === 'superadmin';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Define available tabs based on user role and environment
  const getAvailableTabs = () => {
    const tabs = [
      { id: 'ai' as TerminalMode, label: 'AI', icon: '🤖' },
      { id: 'chat-room' as TerminalMode, label: 'CHAT', icon: '💬' }
    ];
    
    if (isAdministrator) {
      tabs.push({ id: 'admin-chat' as TerminalMode, label: 'ADMIN', icon: '👑' });
    }
    
    if (isDevelopment) {
      tabs.push({ id: 'debug' as TerminalMode, label: 'DEBUG', icon: '🔧' });
    }
    
    return tabs;
  };

  // Get tab-specific muted colors when not selected
  const getTabColors = (tabId: TerminalMode) => {
    switch (tabId) {
      case 'ai':
        return 'bg-purple-800/50 text-purple-200 hover:text-purple-100 border-purple-600/40 hover:bg-purple-700/60';
      case 'chat-room':
        return 'bg-teal-800/50 text-teal-200 hover:text-teal-100 border-teal-600/40 hover:bg-teal-700/60';
      case 'admin-chat':
        return 'bg-red-800/50 text-red-200 hover:text-red-100 border-red-600/40 hover:bg-red-700/60';
      case 'debug':
        return 'bg-gray-700/50 text-gray-200 hover:text-gray-100 border-gray-600/40 hover:bg-gray-600/60';
      default:
        return 'bg-gray-800/50 text-gray-200 hover:text-gray-100 border-gray-600/40 hover:bg-gray-700/60';
    }
  };
  
  // State for Didi's position - initialized after location is available
  const [didiPosition, setDidiPosition] = useState<DidiPosition>(() => 
    getDidiPosition(location.pathname)
  );
  const [didiTransition, setDidiTransition] = useState<string>('none');
  
  // State for test component cycling
  // const [testComponentIndex, setTestComponentIndex] = useState(0);
  
  // Check if tokens have loaded (look for token grid or any token data in DOM)
  const checkTokensLoaded = () => {
    // Look for token cards, token grid, or any indication tokens have loaded
    const tokenElements = document.querySelectorAll('[data-testid*="token"], .token-card, .token-grid tr, [class*="token"]');
    return tokenElements.length > 0;
  };
  
  // Generate contextual proactive message based on current page and state
  const getProactiveMessage = () => {
    const pathname = location.pathname;
    
    if (pathname.includes('/tokens')) {
      const tokensLoaded = checkTokensLoaded();
      if (!tokensLoaded) {
        return "Sometimes tokens can take a while to load if they haven't appeared yet.";
      } else {
        return "I can explain any token metrics you see here - just ask about price changes, volume, or what any of the data means.";
      }
    } else if (pathname.includes('/contest') && pathname.includes('/detail')) {
      return "Want tips for building a winning portfolio for this contest? I can help you understand the rules and strategy.";
    } else if (pathname.includes('/contest') && pathname.includes('/live')) {
      return "I can explain how the contest scoring works or help you understand what you're seeing in the leaderboard.";
    } else if (pathname === '/') {
      return "I can explain any of the market data, hot tokens, or features you see on DegenDuel.";
    } else if (pathname.includes('/profile')) {
      return "I can help you understand your stats, achievements, or explain how the ranking system works.";
    }
    
    return "I can help you understand anything you see on DegenDuel - just ask!";
  };
  
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

  // Initialize with mode-appropriate welcome message
  useEffect(() => {
    if (currentMode === 'ai') {
      setConversationHistory([
        { role: 'assistant', content: "Hi, I'm Didi! Ask me anything about DegenDuel.", tool_calls: undefined },
      ]);
    }
    
    // Set up global UI handler
    const handleUIAction = (action: any) => {
      if (dynamicUIRef.current) {
        dynamicUIRef.current.handleUIAction(action);
      }
    };
    setGlobalUIHandler(handleUIAction);
  }, [currentMode]);
  
  // NOTE: Contest chat automatically handles joining/leaving - no manual join needed

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

  // Handle resize drag with mouse events
  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = terminalWidth;
    const startHeight = terminalHeight;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = startY - e.clientY; // Invert Y so up = positive (taller)
      
      const newWidth = Math.max(320, Math.min(window.innerWidth - 32, startWidth + deltaX));
      const newHeight = Math.max(200, Math.min(window.innerHeight - 100, startHeight + deltaY));
      
      setTerminalWidth(newWidth);
      setTerminalHeight(newHeight);
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Make sure sizeState updates when prop changes
  useEffect(() => {
    setSizeState(size);
  }, [size]);
  
  // Set terminal to predefined sizes (keeping for compatibility)
  const setToPresetSize = (size: TerminalSize) => {
    switch (size) {
      case 'contracted':
        setTerminalWidth(896);
        setTerminalHeight(300);
        break;
      case 'middle':
        setTerminalWidth(896);
        setTerminalHeight(400);
        break;
      case 'large':
        setTerminalWidth(1152);
        setTerminalHeight(500);
        break;
    }
    setSizeState(size);
  };
  
  // NEW: Switch between terminal modes
  const switchMode = (newMode: TerminalMode) => {
    setCurrentMode(newMode);
    onModeChange?.(newMode);
    console.log(`[Terminal] Switched to ${newMode} mode`);
  };
  
  // NEW: Participant count - removed until proper backend implementation
  const participantCount = 0;
  
  // NEW: Convert chat messages to AI message format for display
  const getDisplayMessages = (): AIMessage[] => {
    switch (currentMode) {
      case 'ai':
        return conversationHistory;
      case 'chat-room':
        // Convert filtered chat messages (no debug) to AI message format with enhanced metadata
        return actualChatMessages.map((msg: GeneralChatMessage): AIMessage => {
          // Check if this is the user's own message - backend uses walletAddress field!
          const msgWallet = (msg as any).walletAddress; // Backend sends walletAddress, not user_id
          const isOwnMessage = msgWallet === user?.wallet_address;
          
          return {
            role: msg.is_system ? 'system' : 'chat', // Always use 'chat' role for chat messages
            content: msg.is_system ? msg.message : msg.message,
            tool_calls: undefined,
            // Pass all metadata for enhanced display
            metadata: { 
              isChat: true,
              username: msg.username,
              userId: msg.user_id,
              timestamp: msg.timestamp,
              userRole: msg.user_role || 'user',
              isAdmin: msg.is_admin,
              profilePicture: msg.profile_picture,
              isOwnMessage
            }
          };
        });
      case 'admin-chat':
        // For now, return empty array until admin chat is implemented
        return [{
          role: 'system',
          content: 'Admin chat coming soon...',
          tool_calls: undefined
        }];
      case 'debug':
        return debugMessages;
      default:
        return conversationHistory;
    }
  };

  // Update handleEnterCommand to handle both AI and Chat modes
  const handleEnterCommand = async (command: string) => {
    // Update interaction time when user sends a message
    setLastInteractionTime(new Date());
    
    // Handle different modes
    if (currentMode === 'chat-room') {
      // In chat mode, send message directly to chat room
      const success = sendChatMessage(command);
      if (!success) {
        console.warn('[Terminal] Failed to send chat message');
      }
      return; // Exit early for chat mode
    } else if (currentMode === 'admin-chat') {
      // Admin chat not implemented yet
      console.warn('[Terminal] Admin chat not implemented yet');
      return;
    } else if (currentMode === 'debug') {
      // Debug mode - add command as debug message
      setDebugMessages(prev => [...prev, {
        role: 'user',
        content: command,
        tool_calls: undefined
      }, {
        role: 'system',
        content: `[DEBUG] Command "${command}" received`,
        tool_calls: undefined
      }]);
      return;
    }
    
    // AI mode handling (existing logic)
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
        placement: 'floating' as const,
        title: 'Test Token Watchlist',
        data: {
          tokens: [
            { symbol: 'DUEL', address: 'F4e7axJDGLk5WpNGEL2ZpxTP9STdk7L9iSoJX7utHHHX', price: 0.0025, change_24h: 12.5, volume_24h: 89123456 },
            { symbol: 'SOL', address: 'So11111111111111111111111111111111111111112', price: 23.45, change_24h: 5.2, volume_24h: 1234567890 },
            { symbol: 'ETH', address: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', price: 1650.30, change_24h: -2.1, volume_24h: 987654321 },
            { symbol: 'BTC', address: '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh', price: 43250.0, change_24h: 3.8, volume_24h: 567890123 }
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
          context: 'terminal' as const, 
          conversationId: conversationId,
          streaming: true, // Enable streaming to receive UI actions
          structured_output: true, // Enable dynamic UI generation
          // Add user authentication for terminal functions
          userId: user?.wallet_address || 'anonymous',
          userRole: user?.role || 'user',
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
            pageSpecificContext: pageContext.specificContext,
            // User authentication context
            user: user ? {
              wallet_address: user.wallet_address,
              role: user.role,
              nickname: user.nickname,
              is_authenticated: true
            } : {
              is_authenticated: false
            }
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
            },
            {
              type: "file_search",
              enabled: true,
              description: "Search DegenDuel knowledge base and documentation"
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

  // Removed unused drag controls - handled directly in DidiAvatar now

  // ADD THIS LOG:
  console.log("[Terminal] Rendering state - Minimized:", terminalMinimized, "Current Size:", sizeState, "Passed Prop Size:", size, "HasUnread:", hasUnreadMessages);

  
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

  // Proactive messaging system
  useEffect(() => {
    // Reset state when page changes, but respect global session flag
    setPageLoadTime(new Date());
    setLastInteractionTime(new Date());
    // Don't reset hasShownProactiveMessage - let it stay true for the entire session
  }, [location.pathname]);

  // Update Didi's position when location changes
  useEffect(() => {
    const newPosition = getDidiPosition(location.pathname);
    const oldPosition = didiPosition;
    
    // Calculate transition duration based on distance
    const duration = calculateTransitionDuration(oldPosition, newPosition);
    
    // Set transition before updating position
    setDidiTransition(generateTransition(duration));
    
    // Small delay to ensure transition is applied
    setTimeout(() => {
      setDidiPosition(newPosition);
    }, 10);
    
    // Remove transition after animation completes
    setTimeout(() => {
      setDidiTransition('none');
    }, duration * 1000 + 100);
    
    console.log('[Terminal] Didi moving to new position for path:', location.pathname, newPosition);
  }, [location.pathname]);

  // Track user interactions to update last interaction time
  useEffect(() => {
    const handleUserInteraction = () => {
      // Update ref immediately (no re-render)
      lastInteractionRef.current = new Date();
      
      // Debounce state updates to prevent excessive re-renders
      // Only update state if we haven't updated in the last 5 seconds
      const now = new Date();
      const timeSinceLastStateUpdate = (now.getTime() - lastInteractionTime.getTime()) / 1000;
      if (timeSinceLastStateUpdate >= 5) {
        setLastInteractionTime(now);
      }
    };

    // Listen for various user interactions
    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);
    window.addEventListener('scroll', handleUserInteraction, { passive: true });

    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('scroll', handleUserInteraction);
    };
  }, [lastInteractionTime]);

  // Proactive message timer
  useEffect(() => {
    if (hasShownProactiveMessage || !terminalMinimized) {
      return; // Don't show if already shown or terminal is open
    }

    const timer = setTimeout(() => {
      const now = new Date();
      const timeSincePageLoad = (now.getTime() - pageLoadTime.getTime()) / 1000;
      const timeSinceLastInteraction = (now.getTime() - lastInteractionRef.current.getTime()) / 1000;

      // Show message after 30 seconds on page AND 10 seconds since last interaction
      if (timeSincePageLoad >= 30 && timeSinceLastInteraction >= 10) {
        const message = getProactiveMessage();
        
        // Add proactive message to conversation history
        setConversationHistory(prev => [...prev, { 
          role: 'assistant', 
          content: `🤖 ${message}`,
          tool_calls: undefined 
        }]);
        
        // Show unread indicator and mark as shown globally
        setHasUnreadMessages(true);
        setHasShownProactiveMessage(true);
        sessionStorage.setItem('didi_proactive_shown', 'true');
        
        console.log('[Terminal] Didi sent proactive message (once per session):', message);
      }
    }, 31000); // Check after 31 seconds

    return () => clearTimeout(timer);
  }, [pageLoadTime, lastInteractionTime, hasShownProactiveMessage, terminalMinimized, location.pathname]);

  // Mobile keyboard handling to keep terminal above keyboard on iOS
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (!isIOS || !window.visualViewport || terminalMinimized) {
      return;
    }

    const viewport = window.visualViewport;

    const handleResize = () => {
      const viewportHeight = viewport.height;
      const keyboardIsUp = window.innerHeight > viewportHeight + 50;

      if (keyboardIsUp) {
        // Keep terminal anchored to bottom of visible viewport with fixed 16px margin
        setDynamicStyle({
          bottom: '16px',
          top: 'auto',
          maxHeight: `${viewportHeight - 32}px`, // Ensure it fits in viewport with margins
        });
      } else {
        // Keyboard is closed, revert to default positioning
        setDynamicStyle({});
      }
    };

    // Initial call to set correct position
    handleResize();
    viewport.addEventListener('resize', handleResize);

    return () => {
      viewport.removeEventListener('resize', handleResize);
      setDynamicStyle({});
    };
  }, [terminalMinimized]);

  return (
    <>
      {/* Dynamic UI Manager - Rendered outside terminal container */}
      <DynamicUIManager ref={dynamicUIRef} className="mb-4" />
      
      <div className={`terminal-container ${isKeyboardVisible ? 'keyboard-visible' : ''} w-full mx-auto transition-all duration-300 ease-in-out fixed top-0 left-0 z-[99999] pointer-events-none`}>
      
      {/* Terminal Container */}
      {!terminalMinimized && (
        <motion.div
          ref={terminalRef}
          key="terminal"
          className={`bg-black/95 border border-purple-500/60 text-sm ${terminalHeight > 450 ? 'xl:text-base' : ''} fixed bottom-4 left-4 p-4 ${terminalHeight > 450 ? 'xl:p-5' : ''} rounded-md z-[99998] shadow-2xl pointer-events-auto flex flex-col`}
          style={{ 
            perspective: "1000px",
            transformStyle: "preserve-3d",
            transformOrigin: "center center",
            overflow: "hidden",
            width: `${terminalWidth}px`,
            height: `${terminalHeight}px`,
            maxWidth: `calc(100vw - 32px)`, // Ensure it doesn't exceed viewport
            textAlign: "left",
            ...dynamicStyle
          }}
          onWheel={(e) => {
            // Better scroll event handling - only prevent propagation if we can actually scroll
            const target = e.currentTarget;
            const { scrollTop, scrollHeight, clientHeight } = target;
            const isScrollable = scrollHeight > clientHeight;
            const deltaY = e.deltaY;
            
            if (isScrollable) {
              // Check if we're at scroll boundaries
              const isAtTop = scrollTop === 0 && deltaY < 0;
              const isAtBottom = scrollTop + clientHeight >= scrollHeight && deltaY > 0;
              
              // Only prevent propagation if we're not at a boundary, or if we're scrolling within bounds
              if (!isAtTop && !isAtBottom) {
                e.stopPropagation();
              }
            } else {
              // If not scrollable, just stop propagation - avoid preventDefault() on passive listeners
              e.stopPropagation();
            }
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
          <div className="flex justify-between items-center mb-2 border-b border-mauve/30 pb-2 flex-shrink-0">
            <div className="text-xs font-bold flex items-center">
              <span className="text-mauve">DEGEN</span>
              <span className="text-white">TERMINAL</span>
              <span className="text-mauve-light mx-2">v6.9</span>
              
              {easterEggActivated && (
                <span className="text-green-400 ml-1">UNLOCKED</span>
              )}
            </div>
            
            {/* NEW: Tab System - Proper tabs */}
            <div className="flex items-end flex-1 mx-4">
              <div className="flex -mb-[1px]">
                {getAvailableTabs().map((tab, index) => (
                  <button
                    key={tab.id}
                    onClick={() => switchMode(tab.id)}
                    className={`relative px-3 py-1 text-xs transition-all flex items-center gap-1 rounded-t-md border-t border-l border-r ${
                      currentMode === tab.id
                        ? 'bg-black/95 text-white border-purple-500/60'
                        : getTabColors(tab.id)
                    }`}
                    style={{
                      marginLeft: index > 0 ? '-1px' : '0',
                      zIndex: currentMode === tab.id ? 10 : 1,
                      borderBottom: currentMode === tab.id ? '1px solid rgb(0 0 0 / 0.95)' : '1px solid rgb(168 85 247 / 0.6)'
                    }}
                    title={`Switch to ${tab.label} mode`}
                  >
                    <span className="text-[10px]">{tab.icon}</span>
                    <span>{tab.label}</span>
                    {/* Connection indicator for chat */}
                    {tab.id === 'chat-room' && (
                      <span className={`ml-1 text-[8px] ${chatConnected ? 'text-green-400' : 'text-red-400'}`}>
                        {chatConnected ? '●' : '○'}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Browser-style window controls */}
            <div className="flex items-center space-x-1">
              {/* Development component test dropdown */}
              {process.env.NODE_ENV === 'development' && (
                <select
                  onChange={(e) => {
                    if (!e.target.value) return;
                    
                    const componentType = e.target.value;
                    
                    // Check for existing components of the same type and remove them
                    if (dynamicUIRef.current) {
                      const activeComponents = dynamicUIRef.current.getActiveComponents();
                      const existingComponent = activeComponents.find(comp => 
                        comp.type === componentType || comp.component === componentType
                      );
                      
                      if (existingComponent) {
                        // Remove existing component before creating new one
                        dynamicUIRef.current.removeComponent(existingComponent.id);
                      }
                    }
                    
                    const testAction = {
                      type: 'create_component' as const,
                      component: componentType as any,
                      id: `test-${componentType}-${Date.now()}`,
                      placement: 'floating' as const,
                      title: `Test ${e.target.options[e.target.selectedIndex].text}`,
                      data: {
                        // Generic test data that works for most components
                        tokens: [
                          { symbol: 'DUEL', address: 'F4e7axJDGLk5WpNGEL2ZpxTP9STdk7L9iSoJX7utHHHX', price: 0.0025, change_24h: 12.5, volume_24h: 89123456 },
                          { symbol: 'SOL', address: 'So11111111111111111111111111111111111111112', price: 23.45, change_24h: 5.2, volume_24h: 1234567890 },
                          { symbol: 'ETH', address: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', price: 1650.30, change_24h: -2.1, volume_24h: 987654321 },
                          { symbol: 'BTC', address: '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh', price: 43250.0, change_24h: 3.8, volume_24h: 567890123 }
                        ],
                        contestId: '768',
                        participants: [
                          { username: 'TestUser1', rank: 1, score: 1500, profit: 25.5 },
                          { username: 'TestUser2', rank: 2, score: 1200, profit: 12.3 }
                        ]
                      }
                    };
                    
                    if (dynamicUIRef.current) {
                      dynamicUIRef.current.handleUIAction(testAction);
                    }
                    
                    // Reset dropdown
                    e.target.value = '';
                  }}
                  className="h-4 text-[10px] bg-gray-900 text-gray-300 border border-gray-700 rounded cursor-pointer hover:bg-gray-800 transition-colors"
                  style={{
                    backgroundColor: '#111827',
                    borderColor: '#374151',
                    color: '#d1d5db'
                  }}
                  title="Test Dynamic Components"
                  defaultValue=""
                >
                  <option value="" disabled style={{backgroundColor: '#111827', color: '#6b7280'}}>Test Component</option>
                  {/* Token/Market Analysis */}
                  <option value="token_watchlist" style={{backgroundColor: '#111827', color: '#22c55e', fontWeight: 'bold'}}>📊 Watchlist ✓</option>
                  <option value="token_analysis" style={{backgroundColor: '#111827', color: '#d1d5db'}}>🔍 Token Analysis</option>
                  <option value="token_details" style={{backgroundColor: '#111827', color: '#22c55e', fontWeight: 'bold'}}>📋 Token Details ✓</option>
                  <option value="price_comparison" style={{backgroundColor: '#111827', color: '#d1d5db'}}>📈 Price Compare</option>
                  <option value="market_heatmap" style={{backgroundColor: '#111827', color: '#d1d5db'}}>🗺️ Market Heatmap</option>
                  {/* Portfolio Management */}
                  <option value="portfolio_chart" style={{backgroundColor: '#111827', color: '#d1d5db'}}>💼 Portfolio Chart</option>
                  <option value="portfolio_summary" style={{backgroundColor: '#111827', color: '#d1d5db'}}>📊 Portfolio Summary</option>
                  <option value="performance_metrics" style={{backgroundColor: '#111827', color: '#d1d5db'}}>📉 Performance Metrics</option>
                  <option value="transaction_history" style={{backgroundColor: '#111827', color: '#d1d5db'}}>📜 Transaction History</option>
                  {/* Trading & Signals */}
                  <option value="trading_signals" style={{backgroundColor: '#111827', color: '#d1d5db'}}>🚦 Trading Signals</option>
                  <option value="alert_panel" style={{backgroundColor: '#111827', color: '#d1d5db'}}>🔔 Alert Panel</option>
                  <option value="liquidity_pools" style={{backgroundColor: '#111827', color: '#d1d5db'}}>💧 Liquidity Pools</option>
                  {/* Social & Competition */}
                  <option value="contest_leaderboard" style={{backgroundColor: '#111827', color: '#d1d5db'}}>🏆 Contest Leaderboard</option>
                  <option value="user_comparison" style={{backgroundColor: '#111827', color: '#d1d5db'}}>👥 User Comparison</option>
                  <option value="live_activity_feed" style={{backgroundColor: '#111827', color: '#d1d5db'}}>⚡ Live Activity</option>
                  {/* Advanced */}
                  <option value="token_tracking_monitor" style={{backgroundColor: '#111827', color: '#d1d5db'}}>🖥️ DADDIOS Monitor</option>
                </select>
              )}
              
              {/* Close/minimize button (red) - moved to rightmost position */}
              <button
                type="button" 
                onClick={() => setTerminalMinimized(true)}
                className="h-4 w-4 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center transition-all hover:scale-110 shadow-sm hover:shadow-md"
                title="Minimize"
              >
                <span className="text-black/80 text-[11px] font-semibold">×</span>
              </button>
            </div>

          </div>

          {/* Terminal Content */}
          <div ref={terminalContentRef} className="flex flex-col flex-1 min-h-0">
            
            {/* Pass display messages to TerminalConsole (AI or Chat) - takes remaining space */}
            <TerminalConsole 
              messages={getDisplayMessages()} // Pass the appropriate message array based on mode
              size="flexible" // Override fixed heights
            />
            
            {/* Use extracted TerminalInput component - fixed height */}
            <TerminalInput
              userInput={userInput}
              setUserInput={setUserInput}
              onEnter={handleEnterCommand}
              glitchActive={glitchActive}
              size={sizeState}
              mode={currentMode}
            />
            
          </div>
          
          {/* Corner resize handle - positioned at top-right corner */}
          <div
            className={`absolute top-0 right-0 w-6 h-6 cursor-ne-resize ${
              isResizing ? 'opacity-100' : 'opacity-70 hover:opacity-100'
            } transition-all z-50 hover:drop-shadow-[0_0_4px_rgba(168,85,247,0.5)]`}
            title="Drag to resize"
            onMouseDown={startResize}
          >
            {/* Triangle corner indicator */}
            <svg 
              className="w-6 h-6 text-purple-500" 
              viewBox="0 0 24 24"
            >
              <path 
                d="M 24 0 L 24 14 L 10 0 Z" 
                fill="currentColor" 
                fillOpacity="0.4"
              />
              <path 
                d="M 24 0 L 24 10 L 14 0 Z" 
                fill="currentColor" 
                fillOpacity="0.7"
              />
            </svg>
          </div>
        </motion.div>
      )}
      

      </div>
      
      {/* Terminal Minimized State - Mode-aware Didi Avatar */}
      {terminalMinimized && (
        <div
          className="fixed z-[99999] pointer-events-auto"
          style={{
            ...didiPosition,
            transition: didiTransition,
          }}
        >
          {/* NEW: Show mode indicator on minimized avatar */}
          <div className="relative">
            <DidiAvatar
              hasUnreadMessages={hasUnreadMessages}
              easterEggActivated={easterEggActivated}
              glitchActive={glitchActive}
              isDragging={isDragging}
              onClick={() => {
                console.log(`[Terminal] Didi avatar clicked (${currentMode} mode)`);
                if (!isDragging) {
                  setTerminalMinimized(false);
                  setHasUnreadMessages(false);
                  setToPresetSize('contracted');
                }
              }}
              onDragStart={() => {
                console.log('[Terminal] Didi drag started');
                setIsDragging(true);
              }}
              onDragEnd={() => {
                console.log('[Terminal] Didi drag ended');
                setTimeout(() => {
                  setIsDragging(false);
                }, 50);
              }}
            />
            
            {/* NEW: Chat participant count for chat mode */}
            {currentMode === 'chat-room' && participantCount > 1 && (
              <div className="absolute -bottom-1 -right-1 w-5 h-4 bg-green-600 text-white text-[8px] rounded-full flex items-center justify-center border border-black">
                {participantCount}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// Export the Terminal component
export default Terminal;