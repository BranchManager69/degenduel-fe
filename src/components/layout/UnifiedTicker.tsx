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
import { AlertTriangle, Loader2, RefreshCw, Settings, TrendingUp, WifiOff } from "lucide-react";
import React, { ReactElement, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useStandardizedTokenData } from "../../hooks/data/useStandardizedTokenData";
import { useStore } from "../../store/useStore";
import type { Contest, Token } from "../../types";

interface Props {
  contests: Contest[];
  loading: boolean;
  isCompact?: boolean;
  maxTokens?: number;
  storeError?: string | null;
  systemError?: string | null;
}

const TICKER_DEBUG_MODE = true;

const HOVER_PAUSE_DELAY_MS = 100; // Small delay before hover-pause engages
const INTERACTION_RESUME_DELAY_MS = 3000; // 3 seconds

export const UnifiedTicker: React.FC<Props> = ({
  contests: initialContests = [],
  loading: contestsLoadingProp = true,
  isCompact = false,
  maxTokens = 8,
  storeError,
  systemError,
}) => {
  const { maintenanceMode } = useStore();
  
  // ====================================
  // PROPER UNIFIED WEBSOCKET (FIXED!)
  // ====================================
  const {
    tokens: standardizedTokens,
    isLoading: tokensAreLoading,
    refresh: refreshTokenData,
    isConnected: isDataConnected,
  } = useStandardizedTokenData("all");
  
  // ====================================
  // REST OF TICKER LOGIC
  // ====================================
  const [currentContests, setCurrentContests] = useState<Contest[]>(initialContests);
  const [activeTab, setActiveTab] = useState<"all" | "contests" | "tokens">("contests");
  const [viewportWidth, setViewportWidth] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const scrollableContentRef = useRef<HTMLDivElement>(null);
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

  const isOverallLoading = useMemo(() => {
    const overall = contestsLoadingProp || tokensAreLoading;
    return overall;
  }, [contestsLoadingProp, tokensAreLoading]);

  useEffect(() => {
    if (TICKER_DEBUG_MODE) {
      console.log(`UnifiedTicker: PROP contestsLoadingProp changed to: ${contestsLoadingProp}`);
    }
  }, [contestsLoadingProp]);

  useEffect(() => {
    if (TICKER_DEBUG_MODE) {
      console.log(`UnifiedTicker: FIXED tokensAreLoading changed to: ${tokensAreLoading}`);
    }
  }, [tokensAreLoading]);

  useEffect(() => {
    setCurrentContests(initialContests);
  }, [initialContests]);

  useEffect(() => {
    if (isDataConnected && refreshTokenData) {
      refreshTokenData();
      const intervalId = setInterval(() => { if (refreshTokenData) refreshTokenData(); }, 30000);
      return () => clearInterval(intervalId);
    }
  }, [isDataConnected, refreshTokenData]);

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

  const handleManualRefresh = useCallback(async () => {
    if (TICKER_DEBUG_MODE) {
      console.log("UnifiedTicker: Manual refresh triggered via unified system.");
    }
    setIsRefreshing(true);
    try {
      if (refreshTokenData) {
        refreshTokenData();
      }
    } catch (error) {
      console.error("UnifiedTicker: Error during manual refresh:", error);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
        if (TICKER_DEBUG_MODE) {
          console.log("UnifiedTicker: Manual refresh complete via unified system.");
        }
        lastTimestampRef.current = 0;
        setMeasurementNonce(prev => prev + 1);
      }, 500);
    }
  }, [refreshTokenData]);

  const significantChanges = useMemo(() => {
    if (!standardizedTokens) return [];
    
    if (TICKER_DEBUG_MODE) {
      console.log(`UnifiedTicker: Processing ${standardizedTokens.length} raw tokens`);
    }
    
    // First, filter out completely empty/invalid tokens
    const validTokens = (standardizedTokens as Token[]).filter(
      (token: Token): token is Token => {
        // Must have a symbol and name (no empty strings)
        const hasValidSymbol = Boolean(token.symbol && token.symbol.trim() !== '');
        const hasValidName = Boolean(token.name && token.name.trim() !== '');
        
        // Must have defined price and change values (even if 0)
        const hasValidData = token.change24h !== undefined && 
                            token.price !== undefined;
        
        const isValid = hasValidSymbol && hasValidName && hasValidData;
        
        if (TICKER_DEBUG_MODE && !isValid) {
          console.log(`UnifiedTicker: Filtered out token - Symbol: "${token.symbol}", Name: "${token.name}", hasValidSymbol: ${hasValidSymbol}, hasValidName: ${hasValidName}, hasValidData: ${hasValidData}`);
        }
        
        return isValid;
      }
    );
    
    if (TICKER_DEBUG_MODE) {
      console.log(`UnifiedTicker: ${validTokens.length} valid tokens after filtering`);
    }
    
    // If we have valid tokens with actual movement, show those
    const tokensWithMovement = validTokens.filter(token => 
      Math.abs(parseFloat(token.change24h)) > 0.05 || 
      (parseFloat(token.volume24h) || 0) > 10000
    );
    
    // If no tokens with movement, fall back to showing any valid tokens
    const tokensToShow = tokensWithMovement.length > 0 ? tokensWithMovement : validTokens;
    
    if (TICKER_DEBUG_MODE) {
      console.log(`UnifiedTicker: Using ${tokensWithMovement.length > 0 ? 'tokens with movement' : 'all valid tokens'} - ${tokensToShow.length} tokens`);
      if (tokensToShow.length > 0) {
        console.log(`UnifiedTicker: Top tokens:`, tokensToShow.slice(0, 3).map(t => ({
          symbol: t.symbol,
          name: t.name,
          price: t.price,
          change24h: t.change24h,
          volume24h: t.volume24h
        })));
      }
    }
    
    return tokensToShow
      .sort((a: Token, b: Token) => {
        // Sort by volume first, then by absolute change
        const volumeA = parseFloat(a.volume24h) || 0;
        const volumeB = parseFloat(b.volume24h) || 0;
        if (volumeB !== volumeA) return volumeB - volumeA;
        
        const changeA = Math.abs(parseFloat(a.change24h) || 0);
        const changeB = Math.abs(parseFloat(b.change24h) || 0);
        return changeB - changeA;
      })
      .slice(0, maxTokens);
  }, [standardizedTokens, maxTokens]);
  
  const sortedContests = useMemo(() => {
    if (!currentContests) return [];
    return [...currentContests].sort(
      (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    );
  }, [currentContests]);

  const originalTickerItems = useMemo(() => {
    let items: ReactElement[] = [];
    const showError = !!storeError;
    const showSystemError = !!systemError;

    if (showError || showSystemError) return [];

    const contestItems =
      activeTab === "all" || activeTab === "contests"
        ? sortedContests.map((contest, index) => {
            if (contest.id === 0 || contest.id === null || contest.id === undefined) {
              console.warn(`UnifiedTicker: Problematic contest.id found! ID: '${contest.id}', Name: ${contest.name}, Index: ${index}`);
            }
            const contestKey = contest.id ? `contest-${contest.id}` : `contest-idx-${index}`;
            return (
              <div
                key={contestKey}
                className="inline-flex items-center px-3 py-1 mx-1.5 rounded-md bg-brand-500/10 border border-brand-500/20 cursor-pointer hover:bg-brand-500/20 transition-colors"
              >
                <TrendingUp className="w-3 h-3 mr-1.5 text-brand-400" />
                <span className="text-xs font-medium text-brand-300">
                  {contest.name}
                </span>
                <span className="text-xs text-gray-400 ml-1.5">
                  | {new Date(contest.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
            const change24hNum = parseFloat(token.change24h);
            const logoUrl = token.images?.imageUrl || `https://via.placeholder.com/24?text=${token.symbol.substring(0,1)}`;

            const priceNum = parseFloat(token.price);
            const hasRealPrice = priceNum > 0;
            const displayPrice = hasRealPrice ? 
              (priceNum < 0.01 ? priceNum.toFixed(6) : priceNum.toFixed(4)) : 
              'N/A';

            return (
              <div
                key={tokenKey}
                className="inline-flex items-center px-3 py-1 mx-1.5 rounded-md bg-cyber-500/10 border border-cyber-500/20 cursor-pointer hover:bg-cyber-500/20 transition-colors"
              >
                <img src={logoUrl} alt={token.symbol} className="w-3.5 h-3.5 mr-1.5 rounded-full object-cover" />
                <span className="text-xs font-medium text-cyber-300">
                  {token.symbol}
                </span>
                {hasRealPrice && (
                  <span className="text-xs ml-1.5 text-gray-400">
                    ${displayPrice}
                  </span>
                )}
                <span className={`text-xs ml-1.5 ${change24hNum >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {change24hNum >= 0 ? '+' : ''}{change24hNum === 0 ? '0.00' : (change24hNum * 100).toFixed(2)}%
                </span>
              </div>
            );
          })
        : [];
    
    if (activeTab === "all") {
        items = contestItems.concat(tokenItems);
    } else if (activeTab === "contests") {
        items = contestItems;
    } else {
        items = tokenItems;
    }
    
    if (items.length === 0 && !isOverallLoading && !showError && !showSystemError) {
        const message = !isDataConnected ? "WEBSOCKET OFFLINE" : 
                        activeTab === "contests" ? "NO ACTIVE DUELS" :
                        activeTab === "tokens" ? "NO SIGNIFICANT TOKEN MOVEMENT" :
                        "NO DATA AVAILABLE";
        const icon = !isDataConnected ? <WifiOff className="w-3 h-3 mr-1.5 text-orange-400" /> : 
                     <AlertTriangle className="w-3 h-3 mr-1.5 text-yellow-400" />;
        items.push(
            <div key="no-data-ticker" className="flex items-center justify-center px-4 py-2 h-full w-full text-center"> {/* This key is fine */}
                {icon}
                <span className="text-xs font-medium text-gray-400">{message}</span>
            </div>
        );
    }
    return items;
  }, [activeTab, sortedContests, significantChanges, storeError, systemError, isOverallLoading, isDataConnected]);

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
                itemsToRender.push(originalTickerItems.map((item, index) => {
                    const originalKey = item.key || `orig-idx-${index}`; 
                    return React.cloneElement(item, { key: `${baseKey}-${numClones}-${originalKey}` });
                }));
                currentRenderWidth += actualContentWidthRef.current;
                numClones++;
            }
        } else { 
            itemsToRender.push(originalTickerItems.map((item, index) => {
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

    const showError = !!storeError;
    const showSystemError = !!systemError;
    const isLoadingNoData = isOverallLoading && originalTickerItems.length === 0;

    if (showError) {
      return (
        <div className="flex items-center justify-center px-4 py-2 h-full w-full bg-red-500/10 text-red-300" ref={viewportRef}>
          <AlertTriangle className="w-4 h-4 mr-2 text-red-400" />
          <span className="text-xs font-medium">{storeError}</span>
        </div>
      );
    }
    if (showSystemError) {
      return (
        <div className="flex items-center justify-center px-4 py-2 h-full w-full bg-orange-500/10 text-orange-300" ref={viewportRef}>
          <Settings className="w-4 h-4 mr-2 text-orange-400" />
          <span className="text-xs font-medium">{systemError}</span>
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
            <span className="text-xs font-mono text-blue-400">LOADING INITIAL DATA...</span>
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
        className={`h-full w-full overflow-hidden ${actualContentWidthRef.current > viewportWidth ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'} pl-40`}
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
            clonedItems.forEach((item, index) => {
              if (item === null || item === undefined) {
                console.error(`UnifiedTicker: Found null or undefined item in clonedItems at index ${index}!`, "Full clonedItems snapshot:", clonedItems.map(ci => ci === null ? 'null' : ci === undefined ? 'undefined' : ci?.key));
              } else if (typeof item !== 'object' || !React.isValidElement(item)) {
                console.error(`UnifiedTicker: Found non-element in clonedItems at index ${index}! Item:`, item, "Full clonedItems snapshot:", clonedItems.map(ci => ci === null ? 'null' : ci === undefined ? 'undefined' : ci?.key));
              } else if (item.key === "" || item.key === null || item.key === undefined) {
                console.error(`UnifiedTicker: Rendering item with problematic key! Index: ${index}, Key: '${item.key}', Item Type: ${item.type?.toString()}`, "Full clonedItems snapshot:", clonedItems.map(ci => ci === null ? 'null' : ci === undefined ? 'undefined' : ci?.key));
              }
            });
            return clonedItems.map((item) => item);
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
    <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex space-x-0.5">
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
      </AnimatePresence>
    </div>
  );

  const currentHeightClass = storeError || systemError ? isCompact ? "h-10" : "h-12" : isCompact ? "h-10 sm:h-10" : "h-12 sm:h-12";

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
      <motion.div  className="absolute inset-x-0 top-0 pointer-events-none" animate={{ boxShadow: storeError ? "0 1px 6px rgba(239, 68, 68, 0.4)" : systemError ? "0 1px 6px rgba(249, 115, 22, 0.4)" : activeTab === "tokens" ? "0 1px 6px rgba(0, 225, 255, 0.3)" :  activeTab === "contests" ? "0 1px 6px rgba(153, 51, 255, 0.3)" :"0 1px 6px rgba(100, 100, 150, 0.2)" }} >
        <motion.div className="h-[1px] bg-gradient-to-r from-transparent to-transparent" animate={{ backgroundImage: storeError ? "linear-gradient(to right, transparent, rgba(239, 68, 68, 0.5), transparent)" : systemError ? "linear-gradient(to right, transparent, rgba(249, 115, 22, 0.5), transparent)" : activeTab === "tokens" ? "linear-gradient(to right, transparent, rgba(0, 225, 255, 0.5), transparent)" :  activeTab === "contests" ? "linear-gradient(to right, transparent, rgba(153, 51, 255, 0.5), transparent)" : "linear-gradient(to right, transparent, rgba(100,100,150,0.3), rgba(100,100,150,0.3), transparent)"}} />
      </motion.div>
      <motion.div className="absolute inset-x-0 bottom-0 pointer-events-none" animate={{ boxShadow: storeError ? "0 -1px 6px rgba(239, 68, 68, 0.4)" : systemError ? "0 -1px 6px rgba(249, 115, 22, 0.4)" : activeTab === "tokens" ? "0 -1px 6px rgba(0, 225, 255, 0.3)" : activeTab === "contests" ? "0 -1px 6px rgba(153, 51, 255, 0.3)" : "0 -1px 6px rgba(100, 100, 150, 0.2)" }} >
        <motion.div className="h-[1px] bg-gradient-to-r from-transparent to-transparent" animate={{ backgroundImage: storeError ? "linear-gradient(to right, transparent, rgba(239, 68, 68, 0.5), transparent)" : systemError ? "linear-gradient(to right, transparent, rgba(249, 115, 22, 0.5), transparent)" : activeTab === "tokens" ? "linear-gradient(to right, transparent, rgba(0, 225, 255, 0.5), transparent)" :  activeTab === "contests" ? "linear-gradient(to right, transparent, rgba(153, 51, 255, 0.5), transparent)" : "linear-gradient(to right, transparent, rgba(100,100,150,0.3), rgba(100,100,150,0.3), transparent)"}} />
      </motion.div>
      
      {(!storeError && !systemError && (originalTickerItems.length > 0 || isOverallLoading)) && floatingTabs}
      
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
        `
      }} />
      
      <div className="debug-info hidden absolute bottom-full left-0 mb-1 p-2 bg-dark-800 text-xs text-white z-50 opacity-80 rounded">
        <div>Size: {viewportWidth}px</div>
        <div>Contests: {sortedContests.length}, Tokens: {significantChanges.length}</div>
        <div>WebSocket: {isDataConnected ? 'Connected' : 'Disconnected'}</div>
      </div>
    </div>
  );
};

export default UnifiedTicker;