// src/components/layout/UnifiedTicker.tsx

/**
 * UnifiedTicker Component
 * 
 * A full-width enhanced ticker that displays real-time token prices and contest data
 * with animations, gradients, and visual effects across the entire application header.
 * 
 * 🏗️ ARCHITECTURE FIX APPLIED ✅
 * 
 * KEY INSIGHTS DISCOVERED:
 * - The proper unified WebSocket architecture was already in place and working
 * - Issue was NOT with UnifiedWebSocketContext, but with underlying useTokenData hook
 * - Direct WebSocket connections bypass the unified architecture and create inconsistency
 * - useStandardizedTokenData provides the correct abstraction layer for UI components
 * 
 * ARCHITECTURAL FIXES APPLIED:
 * ✅ Reverted from direct WebSocket hack back to proper useStandardizedTokenData hook
 * ✅ Restored unified architecture consistency across the application
 * ✅ Eliminated duplicate WebSocket connections and management logic
 * ✅ Ensured ticker uses same data source as all other components
 * ✅ Maintained proper separation of concerns (UI vs data layer)
 * 
 * BENEFITS ACHIEVED:
 * - PRICES view now displays REAL market data instead of placeholder values
 * - Consistent data format and updates across entire application
 * - Single WebSocket connection managed by UnifiedWebSocketContext
 * - Proper error handling and reconnection logic via unified system
 * - Easier maintenance and debugging of WebSocket issues
 * 
 * COMPONENT FEATURES:
 * - Real-time token price updates with proper formatting
 * - Animated scrolling ticker with hover/drag interactions
 * - Responsive design with compact/expanded modes
 * - Tab-based filtering (ALL/DUELS/PRICES)
 * - Manual refresh capability
 * - Maintenance mode support
 * 
 * @author Various Contributors
 * @created 2025-04-10
 * @updated 2025-01-15 - Restored proper unified architecture integration
 */

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Loader2, Settings, TrendingUp, WifiOff } from "lucide-react";
// RefreshCw removed - uncomment when refresh button is restored
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { useStandardizedTokenData } from "../../hooks/data/useStandardizedTokenData";
import { useHotTokensData } from "../../hooks/data/useHotTokensData";
import { useLaunchEvent } from "../../hooks/websocket/topic-hooks/useLaunchEvent";
import { useTokenProfiles } from "../../hooks/websocket/topic-hooks/useTokenProfiles";
import { getContestImageUrl } from "../../lib/imageUtils";
import { useStore } from "../../store/useStore";
import type { Contest, Token } from "../../types";

interface Props {
  contests: Contest[];
  loading: boolean;
  isCompact?: boolean;
  maxTokens?: number;
  // Note: Error handling managed via WebSocket context, no systemError prop needed
}

const TICKER_DEBUG_MODE = false;

const HOVER_PAUSE_DELAY_MS = 100; // Small delay before hover-pause engages
const INTERACTION_RESUME_DELAY_MS = 3000; // 3 seconds


export const UnifiedTicker: React.FC<Props> = ({
  contests: initialContests = [],
  loading: contestsLoadingProp = true,
  isCompact = false,
  maxTokens = 20,
}) => {
  const { maintenanceMode } = useStore();
  const navigate = useNavigate();
  
  // Get launch event data for DUEL token state
  const { contractAddress: duelContractAddress, revealTime } = useLaunchEvent();
  const isRevealed = Boolean(duelContractAddress && revealTime);
  
  // Get token profile discoveries for "New on DEX" notifications
  const { latestProfile, isConnected: isTokenProfilesConnected } = useTokenProfiles();
  
  // Error handling is managed through WebSocket context and token data hooks
  // Real errors are handled via isDataConnected, connection state, and grace periods
  
  // Helper function to format time until contest starts
  const formatTimeUntilStart = (startTime: string): string => {
    const now = new Date();
    const start = new Date(startTime);
    const diffMs = start.getTime() - now.getTime();
    
    if (diffMs <= 0) return "LIVE";
    
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays >= 1) return `${diffDays}d`;
    if (diffHours >= 1) return `${diffHours}h`;
    if (diffMinutes >= 1) return `${diffMinutes}m`;
    return `${diffSeconds}s`;
  };

  // Helper function to format market cap in short format
  const formatMarketCapShort = (marketCap: number | string): string => {
    const num = typeof marketCap === "string" ? parseFloat(marketCap) : marketCap;
    
    if (isNaN(num) || num <= 0) {
      return "$0";
    }
    
    if (num >= 1_000_000_000) {
      // Billions: show 2-3 digits with 1 decimal
      const billions = num / 1_000_000_000;
      if (billions >= 100) {
        return `$${billions.toFixed(0)}B`; // 100B+
      } else if (billions >= 10) {
        return `$${billions.toFixed(1)}B`; // 10.0B - 99.9B
      } else {
        return `$${billions.toFixed(1)}B`; // 1.0B - 9.9B
      }
    }
    
    if (num >= 1_000_000) {
      // Millions: show 2-3 digits with 1 decimal
      const millions = num / 1_000_000;
      if (millions >= 100) {
        return `$${millions.toFixed(0)}M`; // 100M+
      } else if (millions >= 10) {
        return `$${millions.toFixed(1)}M`; // 10.0M - 99.9M
      } else {
        return `$${millions.toFixed(1)}M`; // 1.0M - 9.9M
      }
    }
    
    if (num >= 1_000) {
      // Thousands: show 2-3 digits with 1 decimal
      const thousands = num / 1_000;
      if (thousands >= 100) {
        return `$${thousands.toFixed(0)}K`; // 100K+
      } else if (thousands >= 10) {
        return `$${thousands.toFixed(1)}K`; // 10.0K - 99.9K
      } else {
        return `$${thousands.toFixed(1)}K`; // 1.0K - 9.9K
      }
    }
    
    // Less than 1K
    return `$${num.toFixed(0)}`;
  };
  
  // ====================================
  // OPTIMIZED HOT TOKENS DATA (NEW!)
  // ====================================
  const {
    tokens: hotTokens,
    isLoading: hotTokensLoading,
    refresh: refreshHotTokens,
    isConnected: isHotTokensConnected,
    error: hotTokensError
  } = useHotTokensData(useMemo(() => ({
    limit: maxTokens,
    algorithm: 'hot',
    filters: {
      minMarketCap: 50000,
      minVolume: 50000,
      minLiquidity: 10000,
      onlyActive: true,
      dataFreshness: 300
    }
  }), [maxTokens]));

  // ====================================
  // FALLBACK TO OLD SYSTEM IF NEEDED
  // ====================================
  const {
    tokens: standardizedTokens,
    isLoading: tokensAreLoading,
    refresh: refreshTokenData,
    isConnected: isDataConnected,
  } = useStandardizedTokenData("all");

  // Determine which data source to use
  const useHotTokensEndpoint = !hotTokensError && isHotTokensConnected;
  const finalTokens = useHotTokensEndpoint ? hotTokens : standardizedTokens;
  const finalIsLoading = useHotTokensEndpoint ? hotTokensLoading : tokensAreLoading;
  const finalRefresh = useHotTokensEndpoint ? refreshHotTokens : refreshTokenData;
  const finalIsConnected = useHotTokensEndpoint ? isHotTokensConnected : isDataConnected;
  // finalLastUpdate removed - not needed for current implementation
  
  // ====================================
  // REST OF TICKER LOGIC
  // ====================================
  const [currentContests, setCurrentContests] = useState<Contest[]>(initialContests);
  const [activeTab, setActiveTab] = useState<"all" | "contests" | "tokens">("all");
  const [viewportWidth, setViewportWidth] = useState<number>(0);
  // const [isRefreshing, setIsRefreshing] = useState(false); // Commented out - uncomment when refresh button is restored

  const viewportRef = useRef<HTMLDivElement>(null);
  const scrollableContentRef = useRef<HTMLDivElement>(null);
  const floatingTabsRef = useRef<HTMLDivElement>(null);
  const translateXRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number | null>(null);
  const isInteractingRef = useRef<boolean>(false);
  const isHoverPausedRef = useRef<boolean>(false);
  const resumeTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const hoverPauseTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const dragStartXRef = useRef<number>(0);
  const scrollStartTranslateXRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(0);
  const actualContentWidthRef = useRef<number>(0);
  const [measurementNonce, setMeasurementNonce] = useState(0);

  // Grace period state for WebSocket connection issues (similar to Footer)
  const [wsDisconnectTime, setWsDisconnectTime] = useState<number | null>(null);
  const [isInWsGracePeriod, setIsInWsGracePeriod] = useState(false);
  
  // Dynamic padding based on floating tabs width to prevent content overlap
  const [tabsWidth, setTabsWidth] = useState(160); // Default fallback
  
  // "New on DEX" notification state
  const [newTokenNotification, setNewTokenNotification] = useState<{
    tokenAddress: string;
    description?: string;
    chainId: string;
    url?: string;
    showUntil: number; // timestamp when to hide
  } | null>(null);

  const isOverallLoading = useMemo(() => {
    const overall = contestsLoadingProp || finalIsLoading;
    return overall;
  }, [contestsLoadingProp, finalIsLoading]);

  useEffect(() => {
    if (TICKER_DEBUG_MODE) {
      console.log(`UnifiedTicker: PROP contestsLoadingProp changed to: ${contestsLoadingProp}`);
    }
  }, [contestsLoadingProp]);

  useEffect(() => {
    if (TICKER_DEBUG_MODE) {
      console.log(`UnifiedTicker: Using ${useHotTokensEndpoint ? 'HOT TOKENS' : 'FALLBACK'} endpoint. Loading: ${finalIsLoading}`);
    }
  }, [finalIsLoading, useHotTokensEndpoint]);

  useEffect(() => {
    setCurrentContests(initialContests);
  }, [initialContests]);

  useEffect(() => {
    if (finalIsConnected && finalRefresh) {
      finalRefresh();
      const intervalId = setInterval(() => { if (finalRefresh) finalRefresh(); }, 30000);
      return () => clearInterval(intervalId);
    }
  }, [finalIsConnected, finalRefresh]);

  useEffect(() => {
    const updateWidth = () => {
      if (viewportRef.current) {
        const newWidth = viewportRef.current.offsetWidth;
        if (newWidth > 0 && newWidth !== viewportWidth) {
          setViewportWidth(newWidth);
        }
      }
    };
    if (!viewportRef.current) {
      const timerId = setTimeout(updateWidth, 50);
      return () => clearTimeout(timerId);
    }
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    if (viewportRef.current) {
        observer.observe(viewportRef.current);
    }
    return () => {
      if (viewportRef.current) {
        observer.unobserve(viewportRef.current);
      }
      observer.disconnect();
    };
  }, [viewportWidth]);

  // Animate the scroll of the ticker
  const animateScroll = useCallback((timestamp: number) => {
    if (!scrollableContentRef.current || isInteractingRef.current || isHoverPausedRef.current) {
      animationFrameIdRef.current = null; 
      return;
    }

    if (lastTimestampRef.current === 0) {
      lastTimestampRef.current = timestamp;
    }
    const deltaTime = timestamp - lastTimestampRef.current;
    lastTimestampRef.current = timestamp;

    const scrollSpeed = 0.03; // pixels per millisecond
    let newTranslateX = translateXRef.current - scrollSpeed * deltaTime;

    if (actualContentWidthRef.current > 0 && Math.abs(newTranslateX) >= actualContentWidthRef.current) {
      if (TICKER_DEBUG_MODE) {
        console.log(`UnifiedTicker: Resetting scroll. current: ${newTranslateX}, reset to: ${newTranslateX + actualContentWidthRef.current}`);
      }
      newTranslateX += actualContentWidthRef.current; 
    }
    
    translateXRef.current = newTranslateX;
    scrollableContentRef.current.style.transform = `translateX(${newTranslateX}px)`;

    animationFrameIdRef.current = requestAnimationFrame(animateScroll);
  }, []);

  // Effect to start/stop animation based on content and viewport
  useEffect(() => {
    // Only start animation if we have content that overflows
    if (actualContentWidthRef.current > viewportWidth && 
        !isInteractingRef.current && 
        !isHoverPausedRef.current && 
        !animationFrameIdRef.current) {
      lastTimestampRef.current = 0;
      animationFrameIdRef.current = requestAnimationFrame(animateScroll);
    }
    
    // Cleanup on unmount
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [actualContentWidthRef.current, viewportWidth, animateScroll]);

  // Handle grace period for WebSocket connection issues (similar to Footer)
  useEffect(() => {
    const GRACE_PERIOD_MS = 8000; // 8 seconds buffer, same as Footer

    if (!finalIsConnected) {
      // Just disconnected
      if (wsDisconnectTime === null) {
        const now = Date.now();
        setWsDisconnectTime(now);
        setIsInWsGracePeriod(true);

        // Set timeout to end grace period
        const timeout = setTimeout(() => {
          setIsInWsGracePeriod(false);
        }, GRACE_PERIOD_MS);

        return () => clearTimeout(timeout);
      }
    } else if (finalIsConnected) {
      // Reconnected - clear grace period
      setWsDisconnectTime(null);
      setIsInWsGracePeriod(false);
    }
  }, [finalIsConnected, wsDisconnectTime]);

  // Measure floating tabs width for proper content padding
  useEffect(() => {
    const measureTabsWidth = () => {
      if (floatingTabsRef.current) {
        const width = floatingTabsRef.current.offsetWidth;
        const padding = width + 16; // Add 16px buffer to the right of refresh button
        setTabsWidth(padding);
        
        if (TICKER_DEBUG_MODE) {
          console.log(`UnifiedTicker: Measured tabs width: ${width}px, setting padding: ${padding}px`);
        }
      }
    };

    // Measure after a short delay to ensure tabs are rendered
    const timeoutId = setTimeout(measureTabsWidth, 100);
    
    // Re-measure on window resize
    const handleResize = () => measureTabsWidth();
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [activeTab]); // Re-measure when tabs change (isRefreshing removed - was for refresh button)

  // Handle "New on DEX" notifications when new tokens are discovered
  useEffect(() => {
    if (latestProfile && isTokenProfilesConnected) {
      const now = Date.now();
      const NOTIFICATION_DURATION = 12000; // Show for 12 seconds
      
      // Only show notification if it's a different token than current notification
      if (!newTokenNotification || newTokenNotification.tokenAddress !== latestProfile.tokenAddress) {
        setNewTokenNotification({
          tokenAddress: latestProfile.tokenAddress,
          description: latestProfile.description,
          chainId: latestProfile.chainId,
          url: latestProfile.url,
          showUntil: now + NOTIFICATION_DURATION
        });
        
        // Auto-hide after duration
        const hideTimer = setTimeout(() => {
          setNewTokenNotification(null);
        }, NOTIFICATION_DURATION);
        
        return () => clearTimeout(hideTimer);
      }
    }
  }, [latestProfile, isTokenProfilesConnected, newTokenNotification]);

  // Clean up expired notifications
  useEffect(() => {
    if (newTokenNotification && Date.now() > newTokenNotification.showUntil) {
      setNewTokenNotification(null);
    }
  }, [newTokenNotification]);

  // MANUAL REFRESH FUNCTION COMMENTED OUT - Uncomment when refresh button is restored
  /*
  const handleManualRefresh = useCallback(async () => {
    if (TICKER_DEBUG_MODE) {
      console.log(`UnifiedTicker: Manual refresh triggered via ${useHotTokensEndpoint ? 'HOT TOKENS' : 'FALLBACK'} system.`);
    }
    setIsRefreshing(true);
    try {
      if (finalRefresh) {
        finalRefresh();
      }
    } catch (error) {
      console.error("UnifiedTicker: Error during manual refresh:", error);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
        if (TICKER_DEBUG_MODE) {
          console.log(`UnifiedTicker: Manual refresh complete via ${useHotTokensEndpoint ? 'HOT TOKENS' : 'FALLBACK'} system.`);
        }
        lastTimestampRef.current = 0;
        setMeasurementNonce(prev => prev + 1);
      }, 500);
    }
  }, [finalRefresh, useHotTokensEndpoint]);
  */

  const significantChanges = useMemo(() => {
    if (!finalTokens) return [];
    
    if (useHotTokensEndpoint) {
      // NEW: Using optimized backend hot tokens - no client-side filtering needed!
      if (TICKER_DEBUG_MODE) {
        console.log(`UnifiedTicker: Using OPTIMIZED HOT TOKENS endpoint - ${finalTokens.length} pre-filtered tokens received`);
        console.log(`UnifiedTicker: Hot tokens already sorted by server-side algorithm`);
      }
      return finalTokens as Token[];
    } else {
      // FALLBACK: Using old logic for compatibility when new endpoint unavailable
      if (TICKER_DEBUG_MODE) {
        console.log(`UnifiedTicker: FALLBACK - Processing ${finalTokens.length} raw tokens with client-side filtering`);
      }

      // Apply basic filtering for fallback mode
      const tokensToProcess = (finalTokens as Token[]).slice(0, 200);
      
      const validTokens = tokensToProcess.filter((token: Token): token is Token => {
        const hasValidSymbol = Boolean(token.symbol && token.symbol.trim() !== '');
        const hasValidName = Boolean(token.name && token.name.trim() !== '');
        const hasValidData = token.change24h !== undefined && token.price !== undefined;
        const liquidityUSD = Number(token.liquidity?.usd || 0);
        const hasMinLiquidity = liquidityUSD >= 10000;
        const volume = Number(token.volume24h) || 0;
        const hasMinVolume = volume >= 50000;
        const marketCap = Number(token.marketCap) || 0;
        const hasMinMarketCap = marketCap >= 50000;
        const isActiveForPortfolios = token.status === "active";
        
        return hasValidSymbol && hasValidName && hasValidData && 
               hasMinLiquidity && hasMinVolume && hasMinMarketCap && isActiveForPortfolios;
      });
      
      // Fallback hot score calculation
      const getHotScore = (token: Token) => {
        const change = Number(token.change24h) || 0;
        const volume = Number(token.volume24h) || 0;
        const marketCap = Number(token.marketCap) || 0;
        const absChange = Math.abs(change);
        return (absChange * 10) + (Math.log10(Math.max(volume, 1)) * 2) + (Math.log10(Math.max(marketCap, 1)) * 0.5);
      };
      
      const hotTokens = validTokens
        .sort((a: Token, b: Token) => getHotScore(b) - getHotScore(a))
        .slice(0, maxTokens);
      
      if (TICKER_DEBUG_MODE) {
        console.log(`UnifiedTicker: FALLBACK mode - ${hotTokens.length} tokens after client-side filtering`);
      }
      
      return hotTokens;
    }
  }, [finalTokens, maxTokens, useHotTokensEndpoint]);
  
  const sortedContests = useMemo(() => {
    if (!currentContests) return [];
    
    // Filter contests to show both ACTIVE and PENDING duels
    const filteredContests = currentContests.filter(contest => 
      contest.status === "active" || contest.status === "pending"
    );
    
    return filteredContests.sort(
      (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    );
  }, [currentContests]);

  // Create DUEL announcement separately (only shows once, never cloned)
  const duelAnnouncementItem = useMemo(() => {
    
    if (isRevealed && duelContractAddress) {
      // Post-reveal: DUEL has landed! Link to contests page
      
      return (
        <motion.div
          key="duel-live-announcement"
          className="inline-flex items-center px-3 py-1 mx-2 rounded-xl cursor-pointer transition-all duration-500 whitespace-nowrap duel-announcement-blur"
          style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(168, 85, 247, 0.12), rgba(59, 130, 246, 0.08))',
            backdropFilter: 'blur(12px) saturate(1.2)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1)'
          }}
          onClick={() => navigate('/contests')}
          whileHover={{ 
            scale: 1.02,
            backdropFilter: 'blur(16px) saturate(1.4)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 4px 12px rgba(34, 197, 94, 0.15)'
          }}
          animate={{
            boxShadow: [
              'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1), 0 0 8px rgba(34, 197, 94, 0.15)',
              'inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 2px 6px rgba(0, 0, 0, 0.05), 0 0 12px rgba(168, 85, 247, 0.2)', 
              'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 1px 4px rgba(0, 0, 0, 0.08), 0 0 10px rgba(59, 130, 246, 0.15)',
              'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1), 0 0 8px rgba(34, 197, 94, 0.15)'
            ]
          }}
          transition={{ 
            boxShadow: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            scale: { duration: 0.3, ease: "easeOut" },
            backdropFilter: { duration: 0.3 }
          }}
        >
          <motion.div 
            className="w-2 h-2 bg-green-400 rounded-full mr-1.5"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span className="text-sm font-bold bg-gradient-to-r from-green-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
            $DUEL
          </span>
          <span className="text-sm font-medium text-green-300 ml-0.5">
            has landed! Live Duels begin June 1.
          </span>
          <motion.svg 
            className="w-4 h-4 ml-1.5 text-green-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </motion.svg>
        </motion.div>
      );
    } else {
      // Pre-reveal: DUEL mints today! Link to Discord
      return (
        <motion.div
          key="duel-countdown-announcement"
          className="inline-flex items-center px-3 py-1 mx-2 rounded-xl cursor-pointer whitespace-nowrap duel-announcement-blur"
          onClick={() => window.open('https://discord.gg/dduel', '_blank', 'noopener,noreferrer')}
          style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08), rgba(34, 197, 94, 0.06), rgba(59, 130, 246, 0.08))',
            backdropFilter: 'blur(12px) saturate(1.2)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 1px 3px rgba(0, 0, 0, 0.1)'
          }}
          animate={{
            background: [
              'linear-gradient(135deg, rgba(168, 85, 247, 0.08), rgba(34, 197, 94, 0.06), rgba(59, 130, 246, 0.08))',
              'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(59, 130, 246, 0.08), rgba(168, 85, 247, 0.06))',
              'linear-gradient(135deg, rgba(59, 130, 246, 0.09), rgba(168, 85, 247, 0.07), rgba(34, 197, 94, 0.08))',
              'linear-gradient(135deg, rgba(168, 85, 247, 0.08), rgba(34, 197, 94, 0.06), rgba(59, 130, 246, 0.08))'
            ],
            boxShadow: [
              'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 1px 3px rgba(0, 0, 0, 0.1), 0 0 6px rgba(168, 85, 247, 0.1)',
              'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05), 0 0 8px rgba(34, 197, 94, 0.12)',
              'inset 0 1px 0 rgba(255, 255, 255, 0.09), 0 1px 4px rgba(0, 0, 0, 0.08), 0 0 7px rgba(59, 130, 246, 0.11)',
              'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 1px 3px rgba(0, 0, 0, 0.1), 0 0 6px rgba(168, 85, 247, 0.1)'
            ]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div 
            className="w-2 h-2 bg-purple-400 rounded-full mr-1.5"
            animate={{ 
              backgroundColor: ['rgb(168 85 247)', 'rgb(34 197 94)', 'rgb(59 130 246)', 'rgb(168 85 247)'],
              scale: [1, 1.2, 1] 
            }}
            transition={{ 
              backgroundColor: { duration: 3, repeat: Infinity },
              scale: { duration: 2, repeat: Infinity }
            }}
          />
          <span className="text-sm font-bold bg-gradient-to-r from-purple-400 via-green-400 to-blue-400 bg-clip-text text-transparent">
            $DUEL
          </span>
          <span className="text-sm font-medium text-gray-300 ml-0.5">
            mints today! Live Duels begin June 1. 🚀
          </span>
        </motion.div>
      );
    }
  }, [isRevealed, duelContractAddress]);

  // Create "New on DEX" notification item
  const newTokenNotificationItem = useMemo(() => {
    if (!newTokenNotification) return null;

    const truncateAddress = (address: string) => {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const chainDisplayName = newTokenNotification.chainId === 'solana' ? 'SOL' : 
                            newTokenNotification.chainId === 'ethereum' ? 'ETH' : 
                            newTokenNotification.chainId.toUpperCase();

    const handleNotificationClick = () => {
      if (newTokenNotification.url) {
        window.open(newTokenNotification.url, '_blank', 'noopener,noreferrer');
      }
    };

    return (
      <motion.div
        key={`new-token-notification-${newTokenNotification.tokenAddress}`}
        className="inline-flex items-center px-3 py-1 mx-2 rounded-xl cursor-pointer transition-all duration-500 whitespace-nowrap"
        style={{
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(16, 185, 129, 0.08), rgba(5, 150, 105, 0.06))',
          backdropFilter: 'blur(12px) saturate(1.3)',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 2px 8px rgba(34, 197, 94, 0.15)'
        }}
        onClick={handleNotificationClick}
        whileHover={{ 
          scale: 1.02,
          backdropFilter: 'blur(16px) saturate(1.5)',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 4px 12px rgba(34, 197, 94, 0.25)'
        }}
        animate={{
          opacity: 1, 
          x: 0,
          boxShadow: [
            'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 2px 8px rgba(34, 197, 94, 0.15)',
            'inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 3px 10px rgba(34, 197, 94, 0.2)', 
            'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 2px 8px rgba(34, 197, 94, 0.15)'
          ]
        }}
        transition={{ 
          opacity: { duration: 0.5 },
          x: { duration: 0.5 },
          boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          scale: { duration: 0.3, ease: "easeOut" },
          backdropFilter: { duration: 0.3 }
        }}
        initial={{ opacity: 0, x: -20 }}
        exit={{ opacity: 0, x: 20 }}
      >
        <motion.div 
          className="w-2 h-2 bg-green-400 rounded-full mr-1.5"
          animate={{ 
            scale: [1, 1.4, 1],
            backgroundColor: ['rgb(34 197 94)', 'rgb(16 185 129)', 'rgb(34 197 94)']
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <span className="text-sm font-bold text-green-400 mr-1">
          New on DEX:
        </span>
        <span className="text-sm font-medium text-green-300 mr-1.5">
          {truncateAddress(newTokenNotification.tokenAddress)}
        </span>
        <span className="text-xs text-green-200/80 bg-green-500/20 px-1.5 py-0.5 rounded mr-1.5">
          {chainDisplayName}
        </span>
        {newTokenNotification.description && (
          <span className="text-sm text-green-200/90 max-w-[200px] truncate mr-1.5">
            {newTokenNotification.description}
          </span>
        )}
        <motion.svg 
          className="w-4 h-4 text-green-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </motion.svg>
      </motion.div>
    );
  }, [newTokenNotification]);

  // Main ticker items computation
  const originalTickerItems = useMemo(() => {
    const contestItems =
      activeTab === "all" || activeTab === "contests"
        ? sortedContests.map((contest, index) => {
            if (contest.id === 0 || contest.id === null || contest.id === undefined) {
              console.warn(`UnifiedTicker: Problematic contest.id found! ID: '${contest.id}', Name: ${contest.name}, Index: ${index}`);
            }
            const contestKey = contest.id ? `contest-${contest.id}` : `contest-idx-${index}`;
            
            // Handle click to navigate to contest detail page
            const handleContestClick = () => {
              if (contest.id) {
                navigate(`/contests/${contest.id}`);
              }
            };

            // Get contest image URL or use fallback icon
            const contestImageUrl = getContestImageUrl(contest.image_url);

            return (
              <div
                key={contestKey}
                onClick={handleContestClick}
                className="inline-flex items-center px-3 py-1 mx-1.5 rounded-md bg-brand-500/10 cursor-pointer hover:bg-brand-500/20 transition-colors whitespace-nowrap"
              >
                {contestImageUrl ? (
                  <img 
                    src={contestImageUrl} 
                    alt={contest.name} 
                    className="w-3.5 h-3.5 mr-1.5 rounded-full object-cover flex-shrink-0" 
                    onError={(e) => {
                      // Fallback to icon if image fails to load
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <TrendingUp className={`w-3 h-3 mr-1.5 text-brand-400 flex-shrink-0 ${contestImageUrl ? 'hidden' : ''}`} />
                <span className="text-xs font-medium text-brand-300 truncate max-w-[120px]">
                  {contest.name}
                </span>
                <span className="text-xs text-gray-400 ml-1.5 flex-shrink-0">
                  | {formatTimeUntilStart(contest.start_time)}
                </span>
              </div>
            );
          })
        : [];

    const tokenItems =
      activeTab === "all" || activeTab === "tokens"
        ? significantChanges.map((token, index) => {
            if (token.contractAddress === "" || token.contractAddress === null || token.contractAddress === undefined) {
              console.warn(`UnifiedTicker: Problematic token.contractAddress found! Address: '${token.contractAddress}', Symbol: ${token.symbol}, Index: ${index}`);
            }
            const tokenKey = token.contractAddress ? `token-${token.contractAddress}` : `token-sym-${token.symbol}-${significantChanges.indexOf(token)}`;
            const logoUrl = token.images?.imageUrl || `https://via.placeholder.com/24?text=${token.symbol.substring(0,1)}`;

            // Get market cap and format it in short format
            const marketCapNum = parseFloat(token.marketCap);
            const displayMarketCap = (isNaN(marketCapNum) || marketCapNum <= 0) ? "—" : formatMarketCapShort(marketCapNum);

            // Handle click to navigate to token page
            const handleTokenClick = () => {
              if (token.contractAddress) {
                navigate(`/tokens?address=${token.contractAddress}`);
              }
            };

            return (
              <div
                key={tokenKey}
                onClick={handleTokenClick}
                className="inline-flex items-center px-3 py-1 mx-1.5 rounded-md bg-cyber-500/10 cursor-pointer hover:bg-cyber-500/20 transition-colors whitespace-nowrap"
              >
                <img src={logoUrl} alt={token.symbol} className="w-3.5 h-3.5 mr-1.5 rounded-full object-cover flex-shrink-0" />
                <span className="text-xs font-medium text-cyber-300 truncate max-w-[60px] flex-shrink-0">
                  {token.symbol}
                </span>
                <span className="text-xs ml-1.5 text-gray-400 flex-shrink-0">
                  {displayMarketCap}
                </span>
              </div>
            );
          })
        : [];
    
    let items: ReactElement[] = [];
    
    if (activeTab === "all") {
        // Intersperse contests and tokens for better variety, with DUEL announcement and new token notification at the start
        const maxLength = Math.max(contestItems.length, tokenItems.length);
        items = [duelAnnouncementItem];
        if (newTokenNotificationItem) items.push(newTokenNotificationItem);
        for (let i = 0; i < maxLength; i++) {
          if (i < contestItems.length) items.push(contestItems[i]);
          if (i < tokenItems.length) items.push(tokenItems[i]);
        }
    } else if (activeTab === "contests") {
        items = [duelAnnouncementItem];
        if (newTokenNotificationItem) items.push(newTokenNotificationItem);
        items.push(...contestItems);
    } else {
        items = [duelAnnouncementItem];
        if (newTokenNotificationItem) items.push(newTokenNotificationItem);
        items.push(...tokenItems);
    }
    
    if (items.length === 0 && !isOverallLoading) {
        const message = (!finalIsConnected && !isInWsGracePeriod) ? "NOT CONNECTED" : 
                        activeTab === "contests" ? "NO HOT DUELS" :
                        activeTab === "tokens" ? "TRENCHES QUIET" :
                        "TRENCHES ASLEEP";
        const icon = (!finalIsConnected && !isInWsGracePeriod) ? <WifiOff className="w-3 h-3 mr-1.5 text-orange-400" /> : 
                     <AlertTriangle className="w-3 h-3 mr-1.5 text-yellow-400" />;
        items.push(
            <div key="no-data-ticker" className="flex items-center justify-center px-4 py-2 h-full w-full text-center"> {/* This key is fine */}
                {icon}
                <span className="text-xs font-medium text-gray-400">{message}</span>
            </div>
        );
    }
    return items;
  }, [activeTab, sortedContests, significantChanges, isOverallLoading, finalIsConnected, isInWsGracePeriod, isRevealed, duelContractAddress, newTokenNotificationItem]);

  // Auto-start animation when content is ready and overflows (after originalTickerItems is defined)
  useEffect(() => {
    // Start animation if content overflows and no animation is running
    if (actualContentWidthRef.current > 0 && 
        actualContentWidthRef.current > viewportWidth && 
        !isInteractingRef.current && 
        !isHoverPausedRef.current && 
        !animationFrameIdRef.current &&
        originalTickerItems.length > 0) {
      
      lastTimestampRef.current = 0;
      animationFrameIdRef.current = requestAnimationFrame(animateScroll);
      
      if (TICKER_DEBUG_MODE) {
        console.log(`UnifiedTicker: Auto-starting animation. Content: ${actualContentWidthRef.current}px, Viewport: ${viewportWidth}px`);
      }
    }
  }, [actualContentWidthRef.current, viewportWidth, originalTickerItems.length, animateScroll]);

  // Effect to measure the actual content width AFTER original items are rendered
  useLayoutEffect(() => {
    if (TICKER_DEBUG_MODE) {
      console.log(`UnifiedTicker: MEASUREMENT EFFECT RUNNING. isOverallLoading: ${isOverallLoading}, originalTickerItems.length: ${originalTickerItems.length}, viewportWidth: ${viewportWidth}, scrollableContentRef.current exists: ${!!scrollableContentRef.current}`);
    }

    // Only attempt to measure if not loading, and the main scrollable area is rendered
    if (!isOverallLoading && scrollableContentRef.current && viewportWidth > 0) {
      if (originalTickerItems.length > 0) {
        if (originalTickerItems.length === 1 && originalTickerItems[0]?.key === "no-data-ticker") {
          if (actualContentWidthRef.current !== 0) {
            if (TICKER_DEBUG_MODE) {
              console.log(`UnifiedTicker: MEASUREMENT - Only 'no-data-ticker'. Resetting ACW from ${actualContentWidthRef.current} to 0.`);
            }
            actualContentWidthRef.current = 0;
            setMeasurementNonce(prev => prev + 1);
          } else {
            if (TICKER_DEBUG_MODE) {
              console.log(`UnifiedTicker: MEASUREMENT - Only 'no-data-ticker'. ACW already 0.`);
            }
          }
          return;
        }
        const originalTransform = scrollableContentRef.current.style.transform;
        scrollableContentRef.current.style.transform = 'translateX(0px)';
        const newActualContentWidth = scrollableContentRef.current.scrollWidth;
        scrollableContentRef.current.style.transform = originalTransform; 
        if (newActualContentWidth > 0) {
          if (actualContentWidthRef.current !== newActualContentWidth) {
            if (TICKER_DEBUG_MODE) {
              console.log(`UnifiedTicker: MEASURING ACW. Old: ${actualContentWidthRef.current}, New: ${newActualContentWidth}, VPW: ${viewportWidth}`);
            }
            actualContentWidthRef.current = newActualContentWidth;
            setMeasurementNonce(prev => prev + 1);
          } else {
            if (TICKER_DEBUG_MODE) {
              console.log(`UnifiedTicker: MEASURED ACW. No change from ${actualContentWidthRef.current}. VPW: ${viewportWidth}`);
            }
          }
        } else {
          if (TICKER_DEBUG_MODE) {
            console.log(`UnifiedTicker: MEASURED ACW resulted in 0. Actual items may be hidden or zero-width. VPW: ${viewportWidth}`);
          }
        }
      } else { 
        if (actualContentWidthRef.current !== 0) {
            if (TICKER_DEBUG_MODE) {
              console.log(`UnifiedTicker: MEASUREMENT - No items (and not loading). Resetting ACW from ${actualContentWidthRef.current} to 0.`);
            }
            actualContentWidthRef.current = 0;
            setMeasurementNonce(prev => prev + 1);
        } else {
            if (TICKER_DEBUG_MODE) {
              console.log(`UnifiedTicker: MEASUREMENT - No items (and not loading). ACW already 0.`);
            }
        }
      }
    } else {
        if (TICKER_DEBUG_MODE) {
          console.log(`UnifiedTicker: MEASUREMENT - Conditions not met (isOverallLoading: ${isOverallLoading}, scrollableRef: ${!!scrollableContentRef.current}, viewportWidth: ${viewportWidth}).`);
        }
    }
  }, [originalTickerItems, viewportWidth, isOverallLoading]);

  const clonedItems = useMemo(() => {
    if (TICKER_DEBUG_MODE) {
      console.log(`UnifiedTicker: PASS 2 - Recalculating clonedItems. Measured ACW: ${actualContentWidthRef.current}, VPW: ${viewportWidth}, Nonce: ${measurementNonce}`);
    }
    if (!originalTickerItems.length || viewportWidth === 0) {
      if (TICKER_DEBUG_MODE) {
        console.log("UnifiedTicker: PASS 2 - No original items or no viewport width, returning original items.");
      }
      return originalTickerItems; 
    }
    if (originalTickerItems.length === 1 && originalTickerItems[0]?.key === "no-data-ticker") {
        if (TICKER_DEBUG_MODE) {
          console.log("UnifiedTicker: PASS 2 - Only 'no-data-ticker', returning it directly without cloning.");
        }
        return originalTickerItems;
    }
    if (actualContentWidthRef.current === 0 && originalTickerItems.length > 0) {
        if (TICKER_DEBUG_MODE) {
          console.log("UnifiedTicker: PASS 2 - ACW is 0 for actual content, returning originals, awaiting measurement effect.");
        }
        return originalTickerItems;
    }
    const itemsToRender = [originalTickerItems];
    let currentRenderWidth = actualContentWidthRef.current;
    if (actualContentWidthRef.current > 0 && originalTickerItems.length > 0) {
        let numClones = 0;
        const baseKey = "clone"; 
        if (actualContentWidthRef.current < viewportWidth * 1.5) { 
            while (currentRenderWidth < viewportWidth * 2.5 && numClones < 10) {
                itemsToRender.push(originalTickerItems.map((item: ReactElement, index: number) => {
                    const originalKey = item.key || `orig-idx-${index}`; 
                    return React.cloneElement(item, { key: `${baseKey}-${numClones}-${originalKey}` });
                }));
                currentRenderWidth += actualContentWidthRef.current;
                numClones++;
            }
        } else { 
            itemsToRender.push(originalTickerItems.map((item: ReactElement, index: number) => {
              const originalKey = item.key || `orig-idx-${index}`; 
              return React.cloneElement(item, { key: `${baseKey}-0-${originalKey}` });
            }));
            numClones = 1;
        }
        if (TICKER_DEBUG_MODE) {
          console.log(`UnifiedTicker: PASS 2 - Cloned content ${numClones} times.`);
        }
    } else {
        if (TICKER_DEBUG_MODE) {
          console.log("UnifiedTicker: PASS 2 - ACW is 0 or no original items, skipping cloning.");
        }
    }
    return itemsToRender.flat();
  }, [originalTickerItems, viewportWidth, measurementNonce]);
  
  const handleInteractionStart = useCallback((clientX: number) => {
    if (resumeTimeoutIdRef.current) clearTimeout(resumeTimeoutIdRef.current);
    if (hoverPauseTimeoutIdRef.current) clearTimeout(hoverPauseTimeoutIdRef.current);
    isHoverPausedRef.current = false;
    isInteractingRef.current = true;
    dragStartXRef.current = clientX;
    scrollStartTranslateXRef.current = translateXRef.current;
    if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    animationFrameIdRef.current = null;
    if (scrollableContentRef.current) scrollableContentRef.current.style.cursor = 'grabbing';
  }, []);

  const handleInteractionMove = useCallback((clientX: number) => {
    if (!isInteractingRef.current || !scrollableContentRef.current) return;
    const deltaX = clientX - dragStartXRef.current;
    let newTranslateX = scrollStartTranslateXRef.current + deltaX;
    translateXRef.current = newTranslateX;
    scrollableContentRef.current.style.transform = `translateX(${newTranslateX}px)`;
  }, []);

  const handleInteractionEnd = useCallback(() => {
    if (!isInteractingRef.current) return;
    isInteractingRef.current = false;
    if (scrollableContentRef.current) scrollableContentRef.current.style.cursor = 'grab';
    if (resumeTimeoutIdRef.current) clearTimeout(resumeTimeoutIdRef.current);
    resumeTimeoutIdRef.current = setTimeout(() => {
      lastTimestampRef.current = 0;
      if (!animationFrameIdRef.current && !isHoverPausedRef.current && scrollableContentRef.current && actualContentWidthRef.current > viewportWidth) {
        animationFrameIdRef.current = requestAnimationFrame(animateScroll);
      }
    }, INTERACTION_RESUME_DELAY_MS);
  }, [animateScroll, viewportWidth]);

  const handleMouseEnter = useCallback(() => {
    if (isInteractingRef.current) return; 
    if (hoverPauseTimeoutIdRef.current) clearTimeout(hoverPauseTimeoutIdRef.current);
    hoverPauseTimeoutIdRef.current = setTimeout(() => {
        if (isInteractingRef.current) return; 
        isHoverPausedRef.current = true;
        if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
    }, HOVER_PAUSE_DELAY_MS);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverPauseTimeoutIdRef.current) clearTimeout(hoverPauseTimeoutIdRef.current);
    if (isInteractingRef.current) return; 
    if (isHoverPausedRef.current) {
        isHoverPausedRef.current = false;
        lastTimestampRef.current = 0;
        if (!animationFrameIdRef.current && scrollableContentRef.current && actualContentWidthRef.current > viewportWidth) {
            animationFrameIdRef.current = requestAnimationFrame(animateScroll);
        }
    }
  }, [animateScroll, viewportWidth]);

  const onMouseDown = (e: React.MouseEvent) => handleInteractionStart(e.clientX);
  const onMouseMove = (e: React.MouseEvent) => handleInteractionMove(e.clientX);
  const onMouseUpOrLeave = () => { 
    if(isInteractingRef.current) handleInteractionEnd();
  };
  const onTouchStart = (e: React.TouchEvent) => handleInteractionStart(e.touches[0].clientX);
  const onTouchEnd = () => handleInteractionEnd();

  const tabButtonVariants = {
    active: { scale: 1.1, transition: { type: "spring", stiffness: 300, damping: 20 } },
    inactive: { scale: 1 },
  };

  const renderTickerContentArea = () => {
    if (TICKER_DEBUG_MODE) {
      console.log(`UnifiedTicker: renderTickerContentArea CALLED. isOverallLoading: ${isOverallLoading}, ContestsLoading: ${contestsLoadingProp}, TokensLoading: ${tokensAreLoading}, scrollableContentRef.current exists: ${!!scrollableContentRef.current}, originalTickerItems.length: ${originalTickerItems.length}`);
    }

    const showSystemError = false; // No system error prop, errors handled via WebSocket context
    const isLoadingNoData = isOverallLoading && originalTickerItems.length === 0;
    if (showSystemError) {
      // Clean up system error message for production
      const isProduction = import.meta.env.PROD || window.location.hostname === 'degenduel.me';
      const displayError = isProduction 
        ? 'System maintenance in progress' 
        : null; // No system error display needed
        
      return (
        <div className="flex items-center justify-center px-4 py-2 h-full w-full bg-orange-500/10 text-orange-300" ref={viewportRef}>
          <Settings className="w-4 h-4 mr-2 text-orange-400" />
          <span className="text-xs font-medium">{displayError}</span>
        </div>
      );
    }
    
    if (isLoadingNoData) {
      if (TICKER_DEBUG_MODE) {
        console.log("UnifiedTicker: renderTickerContentArea - RENDERING LOADING STATE (NO GRAB)");
      }
      return (
        <div className="flex items-center justify-center w-full overflow-hidden h-full" ref={viewportRef}>
          <div className={`flex items-center justify-center px-4 py-2 h-full w-full`}>
            <Loader2 className="w-4 h-4 mr-2 text-blue-400 animate-spin" />
            <span className="text-xs font-mono text-blue-400">Loading...</span>
          </div>
        </div>
      );
    }

    if (TICKER_DEBUG_MODE) {
      console.log("UnifiedTicker: renderTickerContentArea - RENDERING MAIN CONTENT AREA (GRAB ENABLED)");
    }
    return (
      <div
        ref={viewportRef}
        className={`h-full w-full overflow-hidden ${actualContentWidthRef.current > viewportWidth ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
        style={{ 
          paddingLeft: `${tabsWidth}px`,
          maskImage: `linear-gradient(to right, transparent 0px, transparent ${tabsWidth - 10}px, black ${tabsWidth}px, black 100%)`,
          WebkitMaskImage: `linear-gradient(to right, transparent 0px, transparent ${tabsWidth - 10}px, black ${tabsWidth}px, black 100%)`
        }}
        onMouseDown={actualContentWidthRef.current > viewportWidth ? onMouseDown : undefined}
        onMouseMove={actualContentWidthRef.current > viewportWidth ? onMouseMove : undefined}
        onMouseUp={actualContentWidthRef.current > viewportWidth ? onMouseUpOrLeave : undefined}
        onMouseLeave={() => { 
          if(actualContentWidthRef.current > viewportWidth) onMouseUpOrLeave(); 
          handleMouseLeave(); 
        }}
        onTouchStart={actualContentWidthRef.current > viewportWidth ? onTouchStart : undefined}
        onTouchEnd={actualContentWidthRef.current > viewportWidth ? onTouchEnd : undefined}
        onMouseEnter={actualContentWidthRef.current > viewportWidth ? handleMouseEnter : undefined}
      >
        <div
          ref={scrollableContentRef}
          className={`inline-flex items-center h-full flex-nowrap ${isCompact ? "text-xs" : "text-sm"}`}
          style={{ willChange: "transform", transform: `translateX(${translateXRef.current}px)` }}
        >
          {(() => {
            clonedItems.forEach((item: ReactElement, index: number) => {
              if (item === null || item === undefined) {
                console.error(`UnifiedTicker: Found null or undefined item in clonedItems at index ${index}!`, "Full clonedItems snapshot:", clonedItems.map((ci: ReactElement) => ci === null ? 'null' : ci === undefined ? 'undefined' : ci?.key));
              } else if (typeof item !== 'object' || !React.isValidElement(item)) {
                console.error(`UnifiedTicker: Found non-element in clonedItems at index ${index}! Item:`, item, "Full clonedItems snapshot:", clonedItems.map((ci: ReactElement) => ci === null ? 'null' : ci === undefined ? 'undefined' : ci?.key));
              } else if (item.key === "" || item.key === null || item.key === undefined) {
                console.error(`UnifiedTicker: Rendering item with problematic key! Index: ${index}, Key: '${item.key}', Item Type: ${item.type?.toString()}`, "Full clonedItems snapshot:", clonedItems.map((ci: ReactElement) => ci === null ? 'null' : ci === undefined ? 'undefined' : ci?.key));
              }
            });
            return clonedItems.map((item: ReactElement) => item);
          })()}
        </div>
      </div>
    );
  };

  // Effect to handle touchmove with preventDefault
  useEffect(() => {
    const viewportElement = viewportRef.current;

    // Define the callback for touchmove
    const onTouchMoveCallback = (e: TouchEvent) => {
      // Only prevent default if we are actively interacting (dragging)
      if (isInteractingRef.current) {
        e.preventDefault();
      }
      handleInteractionMove(e.touches[0].clientX);
    };

    if (viewportElement) {
      viewportElement.addEventListener('touchmove', onTouchMoveCallback, { passive: false });
    }

    return () => {
      if (viewportElement) {
        viewportElement.removeEventListener('touchmove', onTouchMoveCallback);
      }
    };
  }, [handleInteractionMove]); // Add handleInteractionMove to dependencies

  const floatingTabs = (
    <div ref={floatingTabsRef} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex space-x-0.5">
      <AnimatePresence>
        <motion.button
          key="tab-all"
          onClick={() => setActiveTab("all")}
          initial="inactive"
          animate={activeTab === "all" ? "active" : "inactive"}
          variants={tabButtonVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-1.5 py-0.5 text-[10px] font-medium rounded-sm transition-all ${
            activeTab === "all"
              ? "bg-gradient-to-r from-brand-400/20 to-cyber-400/20 text-brand-400 shadow-brand"
              : "text-gray-400 hover:text-gray-300"
          }`}
        >
          ALL
        </motion.button>
        <motion.button
          key="tab-contests"
          onClick={() => setActiveTab("contests")}
          initial="inactive"
          animate={activeTab === "contests" ? "active" : "inactive"}
          variants={tabButtonVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-1.5 py-0.5 text-[10px] font-medium rounded-sm transition-all ${
            activeTab === "contests"
              ? "bg-brand-400/20 text-brand-400 shadow-brand"
              : "text-gray-400 hover:text-gray-300"
          }`}
        >
          DUELS
        </motion.button>
        <motion.button
          key="tab-tokens"
          onClick={() => setActiveTab("tokens")}
          initial="inactive"
          animate={activeTab === "tokens" ? "active" : "inactive"}
          variants={tabButtonVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-1.5 py-0.5 text-[10px] font-medium rounded-sm transition-all ${
            activeTab === "tokens"
              ? "bg-cyber-400/20 text-cyber-400 shadow-cyber"
              : "text-gray-400 hover:text-gray-300"
          }`}
        >
          PRICES
        </motion.button>
        {/* REFRESH BUTTON HIDDEN - Remove comments to restore functionality
        <button 
          key="tab-refresh"
          onClick={handleManualRefresh}
          className="ml-1 bg-dark-400/30 hover:bg-dark-400/40 border border-blue-500/20 rounded text-[10px] px-1.5 py-0.5 flex items-center justify-center text-blue-300"
          disabled={isRefreshing || (isOverallLoading && originalTickerItems.length === 0)}
          title="Refresh data"
        >
          <span className={`${(isRefreshing || (isOverallLoading && originalTickerItems.length === 0)) ? 'hidden' : 'inline-block'}`}><RefreshCw size={10}/></span>
          <span className={`${(isRefreshing || (isOverallLoading && originalTickerItems.length === 0)) ? 'inline-block animate-spin' : 'hidden'}`}><Loader2 size={10}/></span>
        </button>
        */}
      </AnimatePresence>
    </div>
  );

  const currentHeightClass = isCompact ? "h-10 sm:h-10" : "h-12 sm:h-12";

  if (maintenanceMode) {
    return (
      <div className="bg-dark-200/60 backdrop-blur-sm border-y border-yellow-400/20 overflow-hidden whitespace-nowrap relative w-full h-full">
        <div
          ref={viewportRef}
          className={`inline-flex items-center w-full h-full`}
        >
          <div
            ref={scrollableContentRef}
            className={`inline-flex items-center space-x-8 px-4 flex-shrink-0 h-full`}
          >
            <div className="inline-flex items-center space-x-4 text-sm">
              <span className="text-yellow-400 font-mono">
                ⚠ DUELS PAUSED
              </span>
              <span className="text-yellow-400/75 font-mono">
                MAINTENANCE IN PROGRESS
              </span>
              <span className="text-yellow-400/50 font-mono">
                PLEASE DEGEN ELSEWHERE
              </span>
              <span
                className="font-mono text-yellow-400/75"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(-45deg, #000 0, #000 10px, #fbbf24 10px, #fbbf24 20px)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                ▰▰▰▰▰▰▰▰
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
        id="unified-ticker-parent-for-measurement" 
        className={`relative w-full group/ticker bg-dark-200/60 backdrop-blur-sm border-y border-dark-300/50 ${currentHeightClass}`}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/20 via-brand-500/10 to-brand-900/20 opacity-30 animate-gradientX" style={{ animationDuration: "10s" }} />
        <div className="absolute inset-0 bg-gradient-to-br from-cyber-900/20 via-cyber-500/10 to-cyber-900/20 opacity-30 animate-gradientX" style={{ animationDelay: "-5s", animationDuration: "10s" }} />
        <div className="absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-scan-slow opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(153,0,255,0.03),transparent_20%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(0,225,255,0.03),transparent_20%)]" />
      </div>
      <motion.div  className="absolute inset-x-0 top-0 pointer-events-none" animate={{ boxShadow: activeTab === "tokens" ? "0 1px 6px rgba(0, 225, 255, 0.3)" :  activeTab === "contests" ? "0 1px 6px rgba(153, 51, 255, 0.3)" :"0 1px 6px rgba(100, 100, 150, 0.2)" }} >
        <motion.div className="h-[1px] bg-gradient-to-r from-transparent to-transparent" animate={{ backgroundImage: activeTab === "tokens" ? "linear-gradient(to right, transparent, rgba(0, 225, 255, 0.5), transparent)" :  activeTab === "contests" ? "linear-gradient(to right, transparent, rgba(153, 51, 255, 0.5), transparent)" : "linear-gradient(to right, transparent, rgba(100,100,150,0.3), rgba(100,100,150,0.3), transparent)"}} />
      </motion.div>
      <motion.div className="absolute inset-x-0 bottom-0 pointer-events-none" animate={{ boxShadow: activeTab === "tokens" ? "0 -1px 6px rgba(0, 225, 255, 0.3)" : activeTab === "contests" ? "0 -1px 6px rgba(153, 51, 255, 0.3)" : "0 -1px 6px rgba(100, 100, 150, 0.2)" }} >
        <motion.div className="h-[1px] bg-gradient-to-r from-transparent to-transparent" animate={{ backgroundImage: activeTab === "tokens" ? "linear-gradient(to right, transparent, rgba(0, 225, 255, 0.5), transparent)" :  activeTab === "contests" ? "linear-gradient(to right, transparent, rgba(153, 51, 255, 0.5), transparent)" : "linear-gradient(to right, transparent, rgba(100,100,150,0.3), rgba(100,100,150,0.3), transparent)"}} />
      </motion.div>
      
      {(originalTickerItems.length > 0 || isOverallLoading) && floatingTabs}
      
      {renderTickerContentArea()}

      <style dangerouslySetInnerHTML={{
        __html: `
        .hide-scrollbar {
          -ms-overflow-style: none !important;  /* IE and Edge */
          scrollbar-width: none !important;  /* Firefox */
          overflow-x: auto;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none !important;  /* Chrome, Safari, Opera */
          width: 0px !important;
          height: 0px !important;
        }
        .ticker-animation {
          display: flex !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          width: 100% !important;
          will-change: transform !important;
        }
        .shadow-brand {
          box-shadow: 0 0 5px rgba(153, 51, 255, 0.3);
        }
        .shadow-cyber {
          box-shadow: 0 0 5px rgba(0, 225, 255, 0.3);
        }
        
        .ticker-debug {
          position: relative;
        }
        .ticker-debug:after {
          content: "Animation Debug";
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: black;
          color: lime;
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
          z-index: 1000;
        }
        @keyframes gradientX {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradientX {
          animation: gradientX 2s ease infinite;
          background-size: 200% auto;
        }
        
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        
        .duel-announcement-blur {
          position: relative;
          overflow: visible;
        }
        
        .duel-announcement-blur::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          background: linear-gradient(135deg, rgba(255,255,255,0.02), rgba(255,255,255,0.05), rgba(255,255,255,0.02));
          filter: blur(1px);
          z-index: -1;
          opacity: 0.6;
        }
        
        .duel-announcement-blur::after {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          background: inherit;
          filter: blur(2px);
          z-index: -2;
          opacity: 0.3;
        }
        `
      }} />
      
      <div className="debug-info hidden absolute bottom-full left-0 mb-1 p-2 bg-dark-800 text-xs text-white z-50 opacity-80 rounded">
        <div>Size: {viewportWidth}px</div>
        <div>Contests: {sortedContests.length}, Tokens: {significantChanges.length}</div>
        <div>WebSocket: {finalIsConnected ? 'Connected' : 'Disconnected'} ({useHotTokensEndpoint ? 'HOT' : 'FALLBACK'})</div>
        <div>Grace Period: {isInWsGracePeriod ? 'Active' : 'Inactive'}</div>
      </div>
    </div>
  );
};

export default UnifiedTicker;