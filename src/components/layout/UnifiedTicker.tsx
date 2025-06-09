// src/components/layout/UnifiedTicker.tsx

/**
 * UnifiedTicker Component - SIMPLIFIED VERSION
 * 
 * Displays real-time token prices and contest data with clean, simple logic.
 * No more complex fallbacks - just one clear data path.
 * 
 * @author BranchManager69
 * @created 2025-04-10
 * @updated 2025-01-15 - Simplified and cleaned up
 */

import { useDegenDuelTop30 } from "@/hooks/websocket/topic-hooks/useDegenDuelTop30";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Loader2, WifiOff } from "lucide-react";
import React, { ReactElement, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStandardizedTokenData } from "../../hooks/data/useStandardizedTokenData";
import { useLaunchEvent } from "../../hooks/websocket/topic-hooks/useLaunchEvent";
import { getContestImageUrl } from "../../lib/imageUtils";
import { useStore } from "../../store/useStore";
import type { Contest, Token } from "../../types";
import { TokenHelpers } from "../../types";

interface Props {
  contests: Contest[];
  loading: boolean;
  isCompact?: boolean;
  maxTokens?: number;
  enableDegenDuelTop30?: boolean; // Enable DegenDuel Top 30 for premium token data
}

// const TICKER_DEBUG_MODE = false;
const HOVER_PAUSE_DELAY_MS = 100;
const INTERACTION_RESUME_DELAY_MS = 3000;

export const UnifiedTicker: React.FC<Props> = ({
  contests: initialContests = [],
  loading: contestsLoadingProp = true,
  isCompact = false,
  maxTokens = 20,
  enableDegenDuelTop30 = false,
}) => {
  const { maintenanceMode } = useStore();
  const navigate = useNavigate();
  
  // Get launch event data for DUEL token state
  const { contractAddress: duelContractAddress, revealTime } = useLaunchEvent();
  const isRevealed = Boolean(duelContractAddress && revealTime);
  
  // We'll add the debug effect later after originalTickerItems is defined
  
  // OPTIMIZED: Only run the hook we actually need to prevent data conflicts!
  const standardTokenData = useStandardizedTokenData("all", "marketCap", {}, 5, maxTokens);
  const degenDuelData = useDegenDuelTop30({
    limit: maxTokens,
    refreshInterval: enableDegenDuelTop30 ? 30000 : 0,
    includeSparklines: false
  });

  // Select data source based on enableDegenDuelTop30 prop - only use what we need
  const { tokens: finalTokens, isLoading: finalTokensLoading, isConnected: finalDataConnected } = 
    enableDegenDuelTop30 ? degenDuelData : standardTokenData;

  // Helper functions
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


  
  // State
  const [currentContests, setCurrentContests] = useState<Contest[]>(initialContests);
  const [activeTab, setActiveTab] = useState<"all" | "contests" | "tokens">("tokens");
  const [viewportWidth, setViewportWidth] = useState<number>(0);
  const [tabsWidth, setTabsWidth] = useState(160);
  const [measurementNonce, setMeasurementNonce] = useState(0);
  const [contentOverflows, setContentOverflows] = useState(false);

  // Refs
  const viewportRef = useRef<HTMLDivElement>(null);
  const scrollableContentRef = useRef<HTMLDivElement>(null);
  const floatingTabsRef = useRef<HTMLDivElement>(null);
  const translateXRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number | null>(null);
  const isInteractingRef = useRef<boolean>(false);
  const isHoverPausedRef = useRef<boolean>(false);
  const dragVelocityRef = useRef<number>(0);
  const lastDragTimeRef = useRef<number>(0);
  const lastDragPositionRef = useRef<number>(0);
  const resumeTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const hoverPauseTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const dragStartXRef = useRef<number>(0);
  const scrollStartTranslateXRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(0);
  const actualContentWidthRef = useRef<number>(0);
  const originalContentWidthRef = useRef<number>(0); // Width of original items only

  // Simple loading state
  const isOverallLoading = contestsLoadingProp || finalTokensLoading;

  // Simple filtered contests
  const sortedContests = useMemo(() => {
    return currentContests
      .filter(contest => contest.status === 'active' || contest.status === 'pending')
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 10);
  }, [currentContests]);

  // Just display whatever tokens we get - no filtering at UI level
  const displayTokens = useMemo(() => {
    if (!finalTokens) return [];
    return (finalTokens as Token[]).slice(0, maxTokens);
  }, [finalTokens, maxTokens]);

  useEffect(() => {
    setCurrentContests(initialContests);
  }, [initialContests]);

  // Simple DUEL announcement - FIXED STYLING (no double nesting)
  const duelAnnouncementItem = useMemo(() => {
    if (isRevealed && duelContractAddress) {
      return (
        <motion.div
          key="duel-announcement"
          className="inline-flex items-center px-4 py-1.5 mx-2 rounded-lg bg-yellow-500/10 border border-yellow-400/30 whitespace-nowrap"
          animate={{
            borderColor: ['rgb(251 191 36 / 0.3)', 'rgb(245 158 11 / 0.5)', 'rgb(217 119 6 / 0.3)', 'rgb(251 191 36 / 0.3)'],
          }}
          transition={{ 
            borderColor: { duration: 3, repeat: Infinity }
          }}
        >
          <motion.div 
            className="w-2 h-2 bg-yellow-400 rounded-full mr-2"
            animate={{
              backgroundColor: ['rgb(251 191 36)', 'rgb(245 158 11)', 'rgb(217 119 6)', 'rgb(251 191 36)'],
              scale: [1, 1.2, 1] 
            }}
            transition={{ 
              backgroundColor: { duration: 3, repeat: Infinity },
              scale: { duration: 2, repeat: Infinity }
            }}
          />
          <span className="text-sm font-bold text-yellow-400 mr-2">
            $DUEL 
          </span>
          <span className="text-sm font-medium text-yellow-300">
             Stress Testing In-Progress
          </span>
        </motion.div>
      );
    }
  }, [isRevealed, duelContractAddress]);

  // Initialize transform on mount
  useEffect(() => {
    if (scrollableContentRef.current) {
      scrollableContentRef.current.style.transform = `translate3d(0, 0, 0)`;
    }
  }, []);

  // Viewport width detection
  useEffect(() => {
    const updateWidth = () => {
      if (viewportRef.current) {
        const newWidth = viewportRef.current.offsetWidth;
        if (newWidth > 0 && newWidth !== viewportWidth) {
          setViewportWidth(newWidth);
        }
      }
    };
    
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    if (viewportRef.current) {
      observer.observe(viewportRef.current);
    }
    
    return () => observer.disconnect();
  }, [viewportWidth]);

  // Scroll animation with proper modulo math
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

    const scrollSpeed = 0.03;
    let newTranslateX = translateXRef.current - scrollSpeed * deltaTime;

    // Use modulo for perfect infinite scroll based on original content width
    if (originalContentWidthRef.current > 0) {
      // Normalize to always be in the range [0, -originalContentWidth)
      newTranslateX = newTranslateX % originalContentWidthRef.current;
      if (newTranslateX > 0) {
        newTranslateX -= originalContentWidthRef.current;
      }
    }
    
    translateXRef.current = newTranslateX;
    scrollableContentRef.current.style.transform = `translate3d(${newTranslateX}px, 0, 0)`;
    animationFrameIdRef.current = requestAnimationFrame(animateScroll);
  }, []);

  // Start animation when content overflows
  useEffect(() => {
    console.log(`[UnifiedTicker] Animation check - overflows: ${contentOverflows}, animating: ${!!animationFrameIdRef.current}`);
    
    if (contentOverflows && 
        !isInteractingRef.current && 
        !isHoverPausedRef.current && 
        !animationFrameIdRef.current) {
      console.log('[UnifiedTicker] Starting animation from effect');
      lastTimestampRef.current = 0;
      animationFrameIdRef.current = requestAnimationFrame(animateScroll);
    }
    
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [contentOverflows, animateScroll]);

  // Measure tabs width
  useEffect(() => {
    const measureTabsWidth = () => {
      if (floatingTabsRef.current) {
        const width = floatingTabsRef.current.offsetWidth;
        setTabsWidth(width + 16);
      }
    };

    const timeoutId = setTimeout(measureTabsWidth, 100);
    window.addEventListener('resize', measureTabsWidth);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', measureTabsWidth);
    };
  }, [activeTab]);

  // Simple ticker items - no complex logic
  const originalTickerItems = useMemo(() => {
    const contestItems = (activeTab === "all" || activeTab === "contests") ? 
      sortedContests.map((contest, index) => {
        const contestKey = contest.id ? `contest-${contest.id}` : `contest-idx-${index}`;
        const contestImageUrl = getContestImageUrl(contest.image_url);
        
        return (
          <div
            key={contestKey}
            onClick={() => contest.id && navigate(`/contests/${contest.id}`)}
            className={`relative inline-flex items-center rounded-full cursor-pointer hover:bg-brand-500/20 transition-transform duration-300 ease-out whitespace-nowrap overflow-hidden bg-brand-500/10 ${
              isCompact ? 'px-2 py-0.5 mx-2 h-6' : 'px-3 py-0.5 mx-3 h-7'
            }`}
            style={{
              willChange: "transform",
              transform: "translate3d(0, 0, 0)",
              ...(contestImageUrl && {
                backgroundImage: `url(${contestImageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              })
            }}
          >
            {/* Content with higher z-index */}
            <div className="relative z-10 flex items-center justify-between w-full h-full">
              <div className="flex items-center flex-shrink-0">
                <span 
                  className={`font-medium text-white flex-shrink-0 ${
                    isCompact ? 'text-[10px]' : 'text-sm'
                  }`}
                  style={{
                    textShadow: '1px 1px 3px rgba(0, 0, 0, 0.9), 0px 0px 6px rgba(0, 0, 0, 0.7)',
                    WebkitTextStroke: '0.5px rgba(0, 0, 0, 0.5)',
                    paintOrder: 'stroke fill'
                  }}
                >
                  {contest.name}
                </span>
              </div>
              <div className="flex items-center flex-shrink-0">
                <span 
                  className={`flex-shrink-0 font-medium text-white ${
                    isCompact ? 'text-[9px] ml-1' : 'text-sm ml-2'
                  }`}
                  style={{
                    textShadow: '1px 1px 3px rgba(0, 0, 0, 0.9), 0px 0px 6px rgba(0, 0, 0, 0.7)',
                    WebkitTextStroke: '0.5px rgba(0, 0, 0, 0.5)',
                    paintOrder: 'stroke fill'
                  }}
                >
                  {isCompact ? 
                    formatTimeUntilStart(contest.start_time).replace('Starts in ', '').replace('Starting ', '') :
                    formatTimeUntilStart(contest.start_time)
                  }
                </span>
              </div>
            </div>
          </div>
        );
      }) : [];

    const tokenItems = (activeTab === "all" || activeTab === "tokens") ?
      displayTokens.map((token: Token, index: number) => {
        const tokenKey = TokenHelpers.getAddress(token) || `token-${index}`;
        const logoUrl = token.image_url || token.header_image_url || `https://via.placeholder.com/24?text=${token.symbol.substring(0,1)}`;
        
        // Format percentage change with proper color coding using helper function
        const change24h = TokenHelpers.getPriceChange(token);
        const formatPercentageChange = (change: number): { text: string; colorClass: string } => {
          const absChange = Math.abs(change);
          const sign = change >= 0 ? '+' : '';
          const text = `${sign}${absChange.toFixed(0)}%`; // No decimals for crypto percentages
          
          if (change > 10) return { text, colorClass: 'text-emerald-400 font-bold' };
          if (change > 5) return { text, colorClass: 'text-emerald-300' };
          if (change > 0) return { text, colorClass: 'text-green-400' };
          if (change > -5) return { text, colorClass: 'text-red-400' };
          if (change > -10) return { text, colorClass: 'text-red-300' };
          return { text, colorClass: 'text-red-500 font-bold' };
        };
        
        const changeData = formatPercentageChange(change24h);
        
        // Check if this is a DegenDuel token with enhanced data
        const isDegenDuelToken = enableDegenDuelTop30 && 'degenduel_score' in token;
        const degenToken = isDegenDuelToken ? token as any : null;

        return (
          <div
            key={tokenKey}
            onClick={() => {
              const address = TokenHelpers.getAddress(token);
              if (address) navigate(`/tokens/${address}`);
            }}
            className={`relative inline-flex items-center rounded-full cursor-pointer hover:bg-cyber-500/20 transition-transform duration-300 ease-out whitespace-nowrap ${
              isDegenDuelToken ? 'bg-gradient-to-r from-brand-500/10 to-cyber-500/10 border border-brand-400/20' : 'bg-cyber-500/10'
            } ${
              isCompact ? 'px-2 py-0.5 mx-2 h-6 min-w-[60px]' : 'px-3 py-0.5 mx-3 h-7 min-w-[100px]'
            }`}
            style={{
              willChange: "transform",
              transform: "translate3d(0, 0, 0)",
              ...(token.header_image_url && {
                backgroundImage: `url(${token.header_image_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              })
            }}
          >
            {/* Content with higher z-index */}
            <div className="relative z-10 flex items-center justify-between w-full h-full">
              <div className="flex items-center flex-shrink-0">
                <img src={logoUrl} alt={token.symbol} className={`rounded-full object-cover flex-shrink-0 ring-1 ring-white/20 ${
                  isCompact ? 'w-3 h-3 mr-1' : 'w-5 h-5 mr-2'
                }`} />
                <span 
                  className={`font-medium text-white flex-shrink-0 ${
                    isCompact ? 'text-[10px]' : 'text-sm'
                  }`}
                  style={{
                    textShadow: '1px 1px 3px rgba(0, 0, 0, 0.9), 0px 0px 6px rgba(0, 0, 0, 0.7)',
                    WebkitTextStroke: '0.5px rgba(0, 0, 0, 0.5)',
                    paintOrder: 'stroke fill'
                  }}
                >
                  {token.symbol}
                </span>
              </div>
              <div className="flex items-center flex-shrink-0">
                {isDegenDuelToken && degenToken ? (
                  <>
                    <span 
                      className={`text-brand-400 font-bold flex-shrink-0 ${
                        isCompact ? 'text-[9px] ml-1' : 'text-xs ml-1.5'
                      }`}
                      style={{
                        textShadow: '1px 1px 3px rgba(0, 0, 0, 0.9), 0px 0px 6px rgba(0, 0, 0, 0.7)',
                        WebkitTextStroke: '0.5px rgba(0, 0, 0, 0.5)',
                        paintOrder: 'stroke fill'
                      }}
                    >
                      #{degenToken.trend_rank}
                    </span>
                    <span 
                      className={`text-yellow-400 flex-shrink-0 ${
                        isCompact ? 'text-[9px] ml-0.5' : 'text-sm ml-1'
                      }`}
                      style={{
                        textShadow: '1px 1px 3px rgba(0, 0, 0, 0.9), 0px 0px 6px rgba(0, 0, 0, 0.7)',
                        WebkitTextStroke: '0.5px rgba(0, 0, 0, 0.5)',
                        paintOrder: 'stroke fill'
                      }}
                    >
                      {degenToken.momentum_indicator}
                    </span>
                    {!isCompact && (
                      <span 
                        className={`text-gray-200 flex-shrink-0 ${
                          isCompact ? 'text-[9px] ml-1' : 'text-xs ml-1.5'
                        }`}
                        style={{
                          textShadow: '1px 1px 3px rgba(0, 0, 0, 0.9), 0px 0px 6px rgba(0, 0, 0, 0.7)',
                          WebkitTextStroke: '0.5px rgba(0, 0, 0, 0.5)',
                          paintOrder: 'stroke fill'
                        }}
                      >
                        {degenToken.degenduel_score.toFixed(0)}
                      </span>
                    )}
                  </>
                ) : (
                  <span 
                    className={`flex-shrink-0 font-medium ${changeData.colorClass} ${
                      isCompact ? 'text-[9px] ml-1' : 'text-xs ml-1.5'
                    }`}
                    style={{
                      textShadow: '1px 1px 3px rgba(0, 0, 0, 0.9), 0px 0px 6px rgba(0, 0, 0, 0.7)',
                      WebkitTextStroke: '0.5px rgba(0, 0, 0, 0.5)',
                      paintOrder: 'stroke fill'
                    }}
                  >
                    {isCompact ? 
                      changeData.text.replace('.0', '') : // Remove .0 decimals in compact mode
                      changeData.text
                    }
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      }) : [];
    
    let items: ReactElement[] = [];
    
    // Add DUEL announcement first
    if (duelAnnouncementItem) items.push(duelAnnouncementItem);
    
    // Simple mixing of content
    if (activeTab === "all") {
      const maxLength = Math.max(contestItems.length, tokenItems.length);
      for (let i = 0; i < maxLength; i++) {
        if (i < contestItems.length) items.push(contestItems[i]);
        if (i < tokenItems.length) items.push(tokenItems[i]);
      }
    } else if (activeTab === "contests") {
      items.push(...contestItems);
    } else {
      items.push(...tokenItems);
    }
    
    // Show message if no data
    if (items.length === 0 && !isOverallLoading) {
      const message = !finalDataConnected ? "NOT CONNECTED" : 
                    activeTab === "contests" ? "NO HOT DUELS" :
                    activeTab === "tokens" ? (enableDegenDuelTop30 ? "DD TOP 30 QUIET" : "TRENCHES QUIET") :
                    "TRENCHES ASLEEP";
      const icon = !finalDataConnected ? <WifiOff className="w-3 h-3 mr-1.5 text-orange-400" /> : 
                   <AlertTriangle className="w-3 h-3 mr-1.5 text-yellow-400" />;
      items.push(
        <div key="no-data-ticker" className="flex items-center justify-center px-4 py-2 h-full w-full text-center">
          {icon}
          <span className="text-xs font-medium text-gray-400">{message}</span>
        </div>
      );
    }
    
    return items;
  }, [activeTab, sortedContests, displayTokens, isOverallLoading, finalDataConnected, duelAnnouncementItem, navigate]);

  // DEBUG: Measure actual element heights and computed styles
  useEffect(() => {
    const measureHeights = () => {
      if (scrollableContentRef.current) {
        const items = scrollableContentRef.current.querySelectorAll('[class*="inline-flex"]');
        if (items.length > 0) {
          const firstItem = items[0] as HTMLElement;
          const computed = window.getComputedStyle(firstItem);
          const heights = Array.from(items).slice(0, 3).map(item => 
            item.getBoundingClientRect().height
          );
          
          // Check for any transforms on parents
          // let transformScale = 1;
          let element = scrollableContentRef.current as HTMLElement;
          while (element && element !== document.body) {
            const transform = window.getComputedStyle(element).transform;
            if (transform && transform !== 'none') {
              console.log(`[UnifiedTicker] Found transform on parent:`, transform);
            }
            element = element.parentElement as HTMLElement;
          }
          
          console.log(`[UnifiedTicker] Page: ${window.location.pathname}`);
          console.log(`  isCompact prop: ${isCompact}`);
          console.log(`  Item heights: ${heights.join(', ')}px`);
          console.log(`  Font size: ${computed.fontSize}`);
          console.log(`  Line height: ${computed.lineHeight}`);
          console.log(`  Padding: ${computed.padding}`);
          console.log(`  HTML font-size: ${window.getComputedStyle(document.documentElement).fontSize}`);
        }
      }
    };
    
    // Delay measurement to ensure DOM is rendered
    setTimeout(measureHeights, 100);
  }, [isCompact, originalTickerItems]);

  // Content width measurement - measure ONLY original items
  useLayoutEffect(() => {
    if (!isOverallLoading && scrollableContentRef.current && viewportWidth > 0) {
      if (originalTickerItems.length > 0) {
        // Measure the actual rendered content width
        requestAnimationFrame(() => {
          if (!scrollableContentRef.current) return;
          
          // Get all the actual rendered items in the scrollable container
          const items = scrollableContentRef.current.querySelectorAll('[class*="inline-flex"]');
          let totalWidth = 0;
          
          // Sum up the width of original items only (not clones)
          const itemCount = Math.min(items.length, originalTickerItems.length);
          for (let i = 0; i < itemCount; i++) {
            const item = items[i] as HTMLElement;
            const rect = item.getBoundingClientRect();
            totalWidth += rect.width;
          }
          
          console.log(`[UnifiedTicker] Measured content width: ${totalWidth}px, viewport: ${viewportWidth}px, items: ${itemCount}`);
          
          if (totalWidth > 0 && originalContentWidthRef.current !== totalWidth) {
            originalContentWidthRef.current = totalWidth;
            actualContentWidthRef.current = totalWidth;
            setMeasurementNonce(prev => prev + 1);
            
            // Update overflow state
            const overflows = totalWidth > viewportWidth;
            setContentOverflows(overflows);
            
            // Start animation if content overflows
            if (overflows && !animationFrameIdRef.current && !isInteractingRef.current && !isHoverPausedRef.current) {
              console.log('[UnifiedTicker] Starting animation - content overflows viewport');
              lastTimestampRef.current = 0;
              animationFrameIdRef.current = requestAnimationFrame(animateScroll);
            }
          }
        });
      } else {
        if (originalContentWidthRef.current !== 0) {
          originalContentWidthRef.current = 0;
          actualContentWidthRef.current = 0;
          setMeasurementNonce(prev => prev + 1);
        }
      }
    }
  }, [originalTickerItems, viewportWidth, isOverallLoading, animateScroll]);

  // Smart virtual scrolling - only render what's needed
  const clonedItems = useMemo(() => {
    if (!originalTickerItems.length || viewportWidth === 0) return originalTickerItems;
    
    if (originalTickerItems.length === 1 && originalTickerItems[0]?.key === "no-data-ticker") {
      return originalTickerItems;
    }
    
    if (originalContentWidthRef.current === 0) return originalTickerItems;
    
    // Calculate how many full sets we need to ensure smooth scrolling
    // We need enough content to fill viewport + one full set for seamless loop
    const setsNeeded = Math.ceil((viewportWidth + originalContentWidthRef.current) / originalContentWidthRef.current);
    
    // But cap it at 3 sets maximum for performance
    const setsToRender = Math.min(setsNeeded, 3);
    
    const itemsToRender: ReactElement[] = [];
    
    // Render the calculated number of sets
    for (let setIndex = 0; setIndex < setsToRender; setIndex++) {
      originalTickerItems.forEach((item: ReactElement, itemIndex: number) => {
        const originalKey = item.key || `orig-idx-${itemIndex}`;
        const clonedItem = setIndex === 0 ? item : React.cloneElement(item, { 
          key: `clone-${setIndex - 1}-${originalKey}` 
        });
        itemsToRender.push(clonedItem);
      });
    }
    
    return itemsToRender;
  }, [originalTickerItems, viewportWidth, measurementNonce]);

  // Interaction handlers
  const handleInteractionStart = useCallback((clientX: number) => {
    if (resumeTimeoutIdRef.current) clearTimeout(resumeTimeoutIdRef.current);
    if (hoverPauseTimeoutIdRef.current) clearTimeout(hoverPauseTimeoutIdRef.current);
    isHoverPausedRef.current = false;
    isInteractingRef.current = true;
    dragStartXRef.current = clientX;
    scrollStartTranslateXRef.current = translateXRef.current;
    
    // Initialize velocity tracking
    dragVelocityRef.current = 0;
    lastDragTimeRef.current = Date.now();
    lastDragPositionRef.current = clientX;
    
    if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    animationFrameIdRef.current = null;
  }, []);

  const handleInteractionMove = useCallback((clientX: number) => {
    if (!isInteractingRef.current || !scrollableContentRef.current) return;
    
    // Calculate velocity for momentum
    const currentTime = Date.now();
    const timeDelta = currentTime - lastDragTimeRef.current;
    const positionDelta = clientX - lastDragPositionRef.current;
    
    if (timeDelta > 0) {
      dragVelocityRef.current = positionDelta / timeDelta * 16; // Convert to pixels per frame (60fps)
    }
    
    lastDragTimeRef.current = currentTime;
    lastDragPositionRef.current = clientX;
    
    const deltaX = clientX - dragStartXRef.current;
    const newTranslateX = scrollStartTranslateXRef.current + deltaX;
    translateXRef.current = newTranslateX;
    scrollableContentRef.current.style.transform = `translate3d(${newTranslateX}px, 0, 0)`;
  }, []);

  const handleInteractionEnd = useCallback(() => {
    if (!isInteractingRef.current) return;
    
    // Apply momentum based on final velocity
    const momentum = Math.abs(dragVelocityRef.current) > 2 ? dragVelocityRef.current * 0.7 : 0;
    
    isInteractingRef.current = false;
    if (resumeTimeoutIdRef.current) clearTimeout(resumeTimeoutIdRef.current);
    
    // Apply momentum decay if there's significant velocity
    if (Math.abs(momentum) > 1) {
      let currentMomentum = momentum;
      const momentumDecay = () => {
        if (!scrollableContentRef.current || isInteractingRef.current) return;
        
        currentMomentum *= 0.92; // 8% decay per frame for smooth coast
        translateXRef.current += currentMomentum;
        
        // Handle infinite scroll wrap-around during momentum with modulo
        if (originalContentWidthRef.current > 0) {
          translateXRef.current = translateXRef.current % originalContentWidthRef.current;
          if (translateXRef.current > 0) {
            translateXRef.current -= originalContentWidthRef.current;
          }
        }
        
        scrollableContentRef.current.style.transform = `translate3d(${translateXRef.current}px, 0, 0)`;
        
        // Continue until momentum is negligible
        if (Math.abs(currentMomentum) > 0.2) {
          requestAnimationFrame(momentumDecay);
        } else {
          // Resume auto-scroll after momentum ends
          resumeTimeoutIdRef.current = setTimeout(() => {
            lastTimestampRef.current = 0;
            if (!animationFrameIdRef.current && !isHoverPausedRef.current && 
                scrollableContentRef.current && originalContentWidthRef.current > viewportWidth) {
              animationFrameIdRef.current = requestAnimationFrame(animateScroll);
            }
          }, INTERACTION_RESUME_DELAY_MS);
        }
      };
      requestAnimationFrame(momentumDecay);
    } else {
      // No momentum, resume normally
      resumeTimeoutIdRef.current = setTimeout(() => {
        lastTimestampRef.current = 0;
        if (!animationFrameIdRef.current && !isHoverPausedRef.current && 
            scrollableContentRef.current && originalContentWidthRef.current > viewportWidth) {
          animationFrameIdRef.current = requestAnimationFrame(animateScroll);
        }
      }, INTERACTION_RESUME_DELAY_MS);
    }
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
      if (!animationFrameIdRef.current && scrollableContentRef.current && 
          originalContentWidthRef.current > viewportWidth) {
        animationFrameIdRef.current = requestAnimationFrame(animateScroll);
      }
    }
  }, [animateScroll, viewportWidth]);

  // Touch handling
  useEffect(() => {
    const viewportElement = viewportRef.current;
    const onTouchMoveCallback = (e: TouchEvent) => {
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
  }, [handleInteractionMove]);

  // Tab variants
  const tabButtonVariants = {
    active: { scale: 1.1, transition: { type: "spring", stiffness: 300, damping: 20 } },
    inactive: { scale: 1 },
  };

  // Render functions
  const renderTickerContentArea = () => {
    if (isOverallLoading && originalTickerItems.length === 0) {
      return (
        <div className="flex items-center justify-center w-full overflow-hidden h-full" ref={viewportRef}>
          <div className="flex items-center justify-center px-4 py-2 h-full w-full">
            <Loader2 className="w-4 h-4 mr-2 text-blue-400 animate-spin" />
            <span className="text-xs font-mono text-blue-400">Loading...</span>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={viewportRef}
        className={`h-full w-full overflow-hidden ${contentOverflows ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
        style={{ 
          paddingLeft: `${tabsWidth}px`,
          maskImage: `linear-gradient(to right, transparent 0px, transparent ${tabsWidth - 10}px, black ${tabsWidth}px, black 100%)`,
          WebkitMaskImage: `linear-gradient(to right, transparent 0px, transparent ${tabsWidth - 10}px, black ${tabsWidth}px, black 100%)`
        }}
        onMouseDown={contentOverflows ? (e) => handleInteractionStart(e.clientX) : undefined}
        onMouseMove={contentOverflows ? (e) => handleInteractionMove(e.clientX) : undefined}
        onMouseUp={contentOverflows ? handleInteractionEnd : undefined}
        onMouseLeave={() => { 
          if(contentOverflows) handleInteractionEnd(); 
          handleMouseLeave(); 
        }}
        onTouchStart={contentOverflows ? (e) => handleInteractionStart(e.touches[0].clientX) : undefined}
        onTouchEnd={contentOverflows ? handleInteractionEnd : undefined}
        onMouseEnter={contentOverflows ? handleMouseEnter : undefined}
      >
        <div
          ref={scrollableContentRef}
          className={`inline-flex items-center h-full flex-nowrap ${isCompact ? "text-xs" : "text-sm"}`}
          style={{ 
            willChange: "transform", 
            transform: `translate3d(${translateXRef.current}px, 0, 0)`,
            backfaceVisibility: "hidden",
            perspective: 1000,
            whiteSpace: 'nowrap'
          }}
        >
          {clonedItems}
        </div>
      </div>
    );
  };

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
          {enableDegenDuelTop30 ? "DD TOP 30" : "GAINS"}
        </motion.button>
      </AnimatePresence>
    </div>
  );

  const currentHeightClass = isCompact ? "h-10 sm:h-10" : "h-12 sm:h-12";

  // Maintenance mode
  if (maintenanceMode) {
    return (
      <div className="bg-dark-200/70 backdrop-blur-sm border-y border-yellow-400/30 overflow-hidden whitespace-nowrap relative w-full h-full">
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-yellow-400/10 to-yellow-500/5 animate-maintenance-glow"
            style={{ backgroundSize: "200% 100%" }}
          />
        </div>

        <div ref={viewportRef} className="relative h-full w-full overflow-hidden">
          <div
            ref={scrollableContentRef}
            className="inline-flex items-center h-full animate-maintenance-scroll"
            style={{ width: 'max-content' }}
          >
            {[...Array(4)].map((_, index) => (
              <div key={`maintenance-${index}`} className="inline-flex items-center space-x-6 px-4 flex-shrink-0 h-full">
                <div className="flex items-center space-x-2 animate-maintenance-pulse">
                  <span className="text-yellow-400 font-mono text-lg">⚠</span>
                  <span className="text-yellow-400 font-mono font-bold">DUELS PAUSED</span>
                </div>
                <div className="w-8 h-[2px] bg-gradient-to-r from-yellow-400/20 via-yellow-400/60 to-yellow-400/20" />
                <span className="text-yellow-400/90 font-mono font-medium">
                  MAINTENANCE IN PROGRESS
                </span>
                <span className="text-yellow-400/60 font-mono">
                  PLEASE DEGEN ELSEWHERE
                </span>
              </div>
            ))}
          </div>
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes maintenance-scroll {
              0% { transform: translateX(0px); }
              100% { transform: translateX(-1000px); }
            }
            
            @keyframes maintenance-pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.05); }
            }
            
            @keyframes maintenance-glow {
              0%, 100% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
            }
            
            .animate-maintenance-scroll {
              animation: maintenance-scroll 30s linear infinite;
            }
            
            .animate-maintenance-pulse {
              animation: maintenance-pulse 2s ease-in-out infinite;
            }
            
            .animate-maintenance-glow {
              animation: maintenance-glow 8s ease-in-out infinite;
            }
          `
        }} />
      </div>
    );
  }

  return (
    <div className={`relative w-full group/ticker bg-dark-200/60 backdrop-blur-sm border-y border-dark-300/50 ${currentHeightClass}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/20 via-brand-500/10 to-brand-900/20 opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-br from-cyber-900/20 via-cyber-500/10 to-cyber-900/20 opacity-30" />
        <div className="absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-scan-slow opacity-50" />
      </div>
      
      <motion.div className="absolute inset-x-0 top-0 pointer-events-none">
        <motion.div className="h-[1px] bg-gradient-to-r from-transparent via-brand-400/30 to-transparent" />
      </motion.div>
      
      <motion.div className="absolute inset-x-0 bottom-0 pointer-events-none">
        <motion.div className="h-[1px] bg-gradient-to-r from-transparent via-brand-400/30 to-transparent" />
      </motion.div>
      
      {(originalTickerItems.length > 0 || isOverallLoading) && floatingTabs}
      
      {renderTickerContentArea()}

      <style dangerouslySetInnerHTML={{
        __html: `
          .shadow-brand {
            box-shadow: 0 0 5px rgba(153, 51, 255, 0.3);
          }
          .shadow-cyber {
            box-shadow: 0 0 5px rgba(0, 225, 255, 0.3);
          }
          @keyframes scan-slow {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-scan-slow {
            animation: scan-slow 8s linear infinite;
          }
        `
      }} />
    </div>
  );
};

export default UnifiedTicker;