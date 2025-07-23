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

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Loader2, WifiOff, DollarSign, TrendingUp } from "lucide-react";
import React, { ReactElement, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTickerTokens } from "../../hooks/websocket/topic-hooks/useTickerTokens";
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
}

// const TICKER_DEBUG_MODE = false;
const HOVER_PAUSE_DELAY_MS = 100;
const INTERACTION_RESUME_DELAY_MS = 3000;

export const UnifiedTicker: React.FC<Props> = ({
  contests: initialContests = [],
  loading: contestsLoadingProp = true,
  isCompact = false,
  maxTokens = 20,
}) => {
  const { maintenanceMode } = useStore();
  const navigate = useNavigate();
  
  // State for cycling between volume and market cap
  const [showVolume, setShowVolume] = useState(true);
  
  // Get launch event data for DUEL token state
  const { contractAddress: duelContractAddress, revealTime } = useLaunchEvent();
  const isRevealed = Boolean(duelContractAddress && revealTime);
  
  // State to track if we should use volume sort
  const [useVolumeSort, setUseVolumeSort] = useState(false);
  
  // Use optimized ticker tokens - dynamically switch sort based on data availability
  const { tokens: allTokens, isLoading: finalTokensLoading, isConnected: finalDataConnected } = 
    useTickerTokens({ 
      limit: 50, 
      sort: useVolumeSort ? 'volume24h' : 'change24h' 
    });

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
  const [activeTab, setActiveTab] = useState<"all" | "contests" | "tokens">("all");
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
  const hasDraggedRef = useRef<boolean>(false); // Track if user actually dragged

  // Simple loading state
  const isOverallLoading = contestsLoadingProp || finalTokensLoading;

  // Simple filtered contests
  const sortedContests = useMemo(() => {
    return currentContests
      .filter(contest => contest.status === 'active' || contest.status === 'pending')
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 10);
  }, [currentContests]);

  // Backend now handles all sorting and filtering - just use what we get
  const displayTokens = useMemo(() => {
    if (!allTokens) return [];
    
    // Backend already sorted by change24h and limited to top 50
    // We can further limit if needed for UI purposes
    return allTokens.slice(0, maxTokens);
  }, [allTokens, maxTokens]);

  useEffect(() => {
    setCurrentContests(initialContests);
  }, [initialContests]);
  
  // Detect when all tokens have no price data and switch sort method
  useEffect(() => {
    const allTokensHaveZeroChange = displayTokens.every(t => TokenHelpers.getPriceChange(t) === 0);
    
    if (allTokensHaveZeroChange && displayTokens.length > 0) {
      // Switch to volume sort when no price data is available
      if (!useVolumeSort) {
        console.log('[UnifiedTicker] No price data detected, switching to volume sort');
        setUseVolumeSort(true);
      }
      
      // Also cycle between showing volume and market cap
      const interval = setInterval(() => {
        setShowVolume(prev => !prev);
      }, 5000);
      
      return () => clearInterval(interval);
    } else if (!allTokensHaveZeroChange && useVolumeSort) {
      // Switch back to price change sort when data becomes available
      console.log('[UnifiedTicker] Price data detected, switching back to change24h sort');
      setUseVolumeSort(false);
    }
  }, [displayTokens, useVolumeSort]);

  // Simple DUEL announcement - FIXED STYLING (no double nesting)
  const duelAnnouncementItem = useMemo(() => {
    if (isRevealed && duelContractAddress) {
      return (
        <motion.div
          key="duel-announcement"
          className="inline-flex items-center px-4 py-1.5 mx-2 rounded-lg bg-yellow-500/10 border border-yellow-400/30 whitespace-nowrap transition-all duration-300 ease-out"
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
    let globalItemIndex = 0; // Track global position for staggered animations
    
    const contestItems = (activeTab === "all" || activeTab === "contests") ? 
      sortedContests.map((contest, index) => {
        const contestKey = contest.id ? `contest-${contest.id}` : `contest-idx-${index}`;
        const contestImageUrl = getContestImageUrl(contest.image_url);
        const currentItemIndex = globalItemIndex++;
        const isNumeroUno = contest.name.toLowerCase().includes('numero uno');
        
        // Determine contest label
        const getContestLabel = (index: number, contest: any) => {
          if (index === 0) return "STARTING NEXT";
          if (isNumeroUno) return "NUMERO UNO";
          if (contest.status === 'active') return "LIVE NOW";
          
          // Determine if it's a duel (2 max) or contest (3+)
          const isDuel = contest.max_participants === 2;
          return isDuel ? "NEW DUEL" : "NEW CONTEST";
        };
        
        const contestLabel = getContestLabel(index, contest);
        
        return (
          <div
            key={contestKey}
            className="inline-flex items-center"
            style={{
              marginRight: isCompact ? '16px' : '24px',
            }}
          >
            {/* Contest label badge */}
            <div 
              className={`flex items-center justify-center font-bold transition-all duration-300 ease-out rounded-sm ${
                index === 0 ? 'text-emerald-400 bg-emerald-400/15' : 
                isNumeroUno ? 'text-yellow-400 bg-yellow-400/15' :
                contest.status === 'active' ? 'text-red-400 bg-red-400/15' :
                'text-purple-400 bg-purple-400/15'
              }`}
              style={{
                fontSize: isCompact ? '9px' : '11px',
                textShadow: 
                  index === 0 ? '0 0 8px rgba(52, 211, 153, 0.6)' :
                  isNumeroUno ? '0 0 8px rgba(251, 191, 36, 0.6)' :
                  contest.status === 'active' ? '0 0 8px rgba(248, 113, 113, 0.6)' :
                  '0 0 8px rgba(168, 85, 247, 0.6)',
                fontFamily: 'inherit',
                fontWeight: 700,
                minWidth: isCompact ? '42px' : '50px',
                height: isCompact ? '14px' : '16px',
                marginRight: '0px',
                position: 'relative' as const,
                zIndex: 1,
                padding: '0 4px'
              }}
            >
              {contestLabel}
            </div>
            <div
              onClick={() => {
                // Only navigate if user didn't drag
                if (!hasDraggedRef.current && contest.id) {
                  navigate(`/contests/${contest.id}`);
              }
            }}
            className={`relative inline-flex items-center rounded-lg cursor-pointer hover:bg-brand-500/20 transition-all duration-300 ease-out whitespace-nowrap overflow-hidden ${
              isNumeroUno 
                ? 'border-2 border-yellow-400 bg-brand-500/10 shadow-[0_0_20px_rgba(251,191,36,0.5)]' 
                : 'border border-black/20 bg-brand-500/10'
            }`}
            style={{
              '--contest-px': isCompact ? '8px' : '12px',
              '--contest-py': isCompact ? '2px' : '4px',
              '--contest-mx': isCompact ? '8px' : '12px', 
              '--contest-height': isCompact ? '24px' : '32px',
              padding: 'var(--contest-py) var(--contest-px)',
              margin: '0',
              height: 'var(--contest-height)',
              transitionDelay: `${currentItemIndex * 30}ms`, // Staggered animation
              willChange: "transform",
              transform: "translate3d(0, 0, 0)",
              ...(contestImageUrl && {
                backgroundImage: `url(${contestImageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              })
            } as any}
          >
            {/* Dark overlay for better text readability */}
            {contestImageUrl && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[0.5px]" />
            )}
            
            {/* Content with higher z-index */}
            <div className="relative z-10 flex items-center justify-between w-full h-full">
              <div className="flex items-center flex-shrink-0">
                <span 
                  className={`font-medium text-white flex-shrink-0 ${
                    isCompact ? 'text-[10px]' : 'text-sm'
                  }`}
                  style={{
                    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.6), 0px 0px 6px rgba(0, 0, 0, 0.4)',
                    WebkitTextStroke: '0.3px rgba(0, 0, 0, 0.4)',
                    paintOrder: 'stroke fill'
                  }}
                >
                  {contest.name}
                </span>
              </div>
              <div className="flex items-center flex-shrink-0">
                <span 
                  className={`flex-shrink-0 font-medium text-purple-400 ${
                    isCompact ? 'text-[9px] ml-1' : 'text-sm ml-2'
                  }`}
                  style={{
                    textShadow: '4px 4px 8px rgba(0, 0, 0, 1), 2px 2px 16px rgba(0, 0, 0, 0.9), 0px 0px 20px rgba(0, 0, 0, 0.8), 0px 0px 32px rgba(0, 0, 0, 0.7)',
                    WebkitTextStroke: '1px rgba(0, 0, 0, 0.8)',
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
          </div>
        );
      }) : [];

    const tokenItems = (activeTab === "all" || activeTab === "tokens") ?
      displayTokens.map((token: Token, index: number) => {
        const tokenKey = TokenHelpers.getAddress(token) || `token-${index}`;
        const logoUrl = token.image_url || token.header_image_url;
        const currentItemIndex = globalItemIndex++;
        const symbolLetter = token.symbol ? token.symbol.charAt(0).toUpperCase() : '?';
        
        // Check if we have actual price change data
        // Since the transform converts null to 0, check if ALL tokens have 0 change
        // which likely means no price data is available
        const allTokensHaveZeroChange = displayTokens.every(t => TokenHelpers.getPriceChange(t) === 0);
        const hasChangeData = !allTokensHaveZeroChange || TokenHelpers.getPriceChange(token) !== 0;
        const change24h = TokenHelpers.getPriceChange(token);
        
        // Format display value - show volume/market cap if no price change data
        const formatDisplayValue = (): { text: string; colorClass: string; isVolume: boolean; isMarketCap: boolean } => {
          if (!hasChangeData) {
            // Cycle between volume and market cap when price data is unavailable
            if (showVolume) {
              // Show volume
              const volume = parseFloat(token.volume24h || '0');
              let volumeText: string;
              let colorClass: string;
              
              if (volume >= 1000000) {
                volumeText = `$${(volume / 1000000).toFixed(1)}M`;
                colorClass = 'text-purple-400';
              } else if (volume >= 1000) {
                volumeText = `$${(volume / 1000).toFixed(0)}K`;
                colorClass = 'text-blue-400';
              } else {
                volumeText = `$${volume.toFixed(0)}`;
                colorClass = 'text-gray-400';
              }
              
              return { text: volumeText, colorClass, isVolume: true, isMarketCap: false };
            } else {
              // Show market cap
              const marketCap = parseFloat(token.marketCap || '0');
              let marketCapText: string;
              let colorClass: string;
              
              if (marketCap >= 1000000) {
                marketCapText = `${(marketCap / 1000000).toFixed(1)}M`;
                colorClass = 'text-cyan-400';
              } else if (marketCap >= 1000) {
                marketCapText = `${(marketCap / 1000).toFixed(0)}K`;
                colorClass = 'text-teal-400';
              } else {
                marketCapText = `${marketCap.toFixed(0)}`;
                colorClass = 'text-gray-400';
              }
              
              return { text: marketCapText, colorClass, isVolume: false, isMarketCap: true };
            }
          }
          
          // Original percentage change logic
          let text: string;
          
          if (change24h === 0) {
            text = '-'; // Show just a dash for zero change
            return { text, colorClass: 'text-white', isVolume: false, isMarketCap: false };
          } else if (change24h > 0) {
            text = `+${change24h.toFixed(0)}%`; // Positive with + sign
          } else {
            text = `${change24h.toFixed(0)}%`; // Negative already has - sign from the number
          }
          
          let colorClass: string;
          if (change24h > 10) colorClass = 'text-emerald-400 font-bold';
          else if (change24h > 5) colorClass = 'text-emerald-300';
          else if (change24h > 0) colorClass = 'text-green-400';
          else if (change24h > -5) colorClass = 'text-red-400';
          else if (change24h > -10) colorClass = 'text-red-300';
          else colorClass = 'text-red-500 font-bold';
          
          return { text, colorClass, isVolume: false, isMarketCap: false };
        };
        
        const displayData = formatDisplayValue();

        return (
          <div
            key={tokenKey}
            className="inline-flex items-center"
            style={{
              transitionDelay: `${currentItemIndex * 30}ms`,
              willChange: "transform",
              transform: "translate3d(0, 0, 0)",
              marginRight: isCompact ? '16px' : '24px', // Space after the whole token unit
            }}
          >
            {/* Rank number badge */}
            <div 
              className={`flex items-center justify-center font-bold transition-all duration-300 ease-out rounded-sm ${
                index === 0 ? 'text-yellow-400 bg-yellow-400/15' : 
                index === 1 ? 'text-gray-300 bg-gray-300/15' : 
                index === 2 ? 'text-amber-600 bg-amber-600/15' : 
                'text-cyan-400/70 bg-cyan-400/10'
              }`}
              style={{
                fontSize: isCompact ? '12px' : index < 3 ? '16px' : '14px',
                textShadow: 
                  index === 0 ? '0 0 10px rgba(251, 191, 36, 0.6)' :
                  index === 1 ? '0 0 10px rgba(209, 213, 219, 0.6)' :
                  index === 2 ? '0 0 10px rgba(217, 119, 6, 0.6)' :
                  '0 0 8px rgba(0, 225, 255, 0.3)',
                fontFamily: 'inherit',
                fontWeight: 700,
                minWidth: isCompact ? '26px' : index < 3 ? '32px' : '30px',
                height: isCompact ? '16px' : index < 3 ? '20px' : '18px',
                marginRight: '1px',
                position: 'relative' as const,
                zIndex: 1
              }}
            >
              <span style={{ fontSize: '0.8em', opacity: 0.7, marginRight: '1px' }}>#</span>{index + 1}
            </div>
            <div
            onClick={() => {
              // Only navigate if user didn't drag
              if (!hasDraggedRef.current) {
                const address = TokenHelpers.getAddress(token);
                if (address) navigate(`/tokens/${address}`);
              }
            }}
            className="relative inline-flex items-center rounded-lg cursor-pointer hover:bg-cyber-500/20 transition-all duration-300 ease-out whitespace-nowrap overflow-hidden border border-black/20"
            style={{
              '--token-px': isCompact ? '6px' : '12px',
              '--token-py': isCompact ? '2px' : '4px', 
              '--token-height': isCompact ? '24px' : '32px',
              '--token-min-width': isCompact ? '110px' : '100px',
              padding: 'var(--token-py) var(--token-px)',
              height: 'var(--token-height)',
              minWidth: 'var(--token-min-width)',
              transitionDelay: `${currentItemIndex * 30}ms`, // Staggered animation
              willChange: "transform",
              transform: "translate3d(0, 0, 0)",
              background: token.header_image_url 
                ? `url(${token.header_image_url})` 
                : `linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            } as any}
          >
            {/* Dark overlay for better text readability with token icon */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[0.5px]">
              {/* Token logo with fallback */}
              <div 
                className="absolute rounded-full overflow-hidden transition-all duration-300 ease-out flex items-center justify-center"
                style={{
                  '--logo-size': isCompact ? '36px' : '48px',
                  width: 'var(--logo-size)',
                  height: 'var(--logo-size)',
                  left: isCompact ? '-8px' : '-12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  filter: 'blur(0.5px) contrast(1.1) saturate(0.9) brightness(1.0)',
                  maskImage: 'radial-gradient(circle, black 70%, transparent 100%)',
                  WebkitMaskImage: 'radial-gradient(circle, black 70%, transparent 100%)',
                  boxShadow: '0 0 20px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 0, 0, 0.7), inset 0 0 0 1px rgba(255, 255, 255, 0.2), inset 0 0 20px rgba(0, 0, 0, 0.4)',
                  background: logoUrl ? 'transparent' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                } as any}
              >
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt={token.symbol}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Hide the broken image
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  // Letter fallback - ONLY shows when no image URL exists
                  <span 
                    className="flex items-center justify-center text-white font-bold w-full h-full"
                    style={{
                      fontSize: isCompact ? '14px' : '18px',
                      textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)'
                    }}
                  >
                    {symbolLetter}
                  </span>
                )}
              </div>
            </div>
            
            {/* Content with higher z-index */}
            <div className="relative z-10 flex items-center justify-between w-full h-full px-0.5">
              <div className="flex items-center flex-shrink-0" style={{ maxWidth: isCompact ? '65%' : '70%', paddingLeft: isCompact ? '14px' : '18px' }}>
                <span 
                  className="font-medium text-white transition-all duration-300 ease-out"
                  style={{
                    '--text-size': isCompact ? '10px' : '14px',
                    fontSize: 'var(--text-size)',
                    textShadow: '4px 4px 8px rgba(0, 0, 0, 1), 2px 2px 16px rgba(0, 0, 0, 0.9), 0px 0px 20px rgba(0, 0, 0, 0.8), 0px 0px 32px rgba(0, 0, 0, 0.7)',
                    WebkitTextStroke: '1px rgba(0, 0, 0, 0.8)',
                    paintOrder: 'stroke fill'
                  } as any}
                >
                  {token.symbol}
                </span>
              </div>
              <div className="flex items-center flex-shrink-0 min-w-0">
                {/* Small icon indicator with fade animation */}
                <AnimatePresence mode="wait">
                  {displayData.isVolume && (
                    <motion.div
                      key="volume-icon"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.7 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <DollarSign 
                        className={`${displayData.colorClass} ${
                          isCompact ? 'w-2.5 h-2.5 mr-0.5' : 'w-3 h-3 mr-1'
                        }`}
                        style={{
                          filter: 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.8))'
                        }}
                      />
                    </motion.div>
                  )}
                  {displayData.isMarketCap && (
                    <motion.div
                      key="marketcap-icon"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.7 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <TrendingUp 
                        className={`${displayData.colorClass} ${
                          isCompact ? 'w-2.5 h-2.5 mr-0.5' : 'w-3 h-3 mr-1'
                        }`}
                        style={{
                          filter: 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.8))'
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                <span 
                  className={`flex-shrink-0 font-medium ${displayData.colorClass} ${
                    isCompact ? 'text-[10px]' : 'text-xs'
                  } ${!displayData.isVolume && !displayData.isMarketCap ? (isCompact ? 'ml-1.5' : 'ml-2') : ''}`}
                  style={{
                    textShadow: '4px 4px 8px rgba(0, 0, 0, 1), 2px 2px 16px rgba(0, 0, 0, 0.9), 0px 0px 20px rgba(0, 0, 0, 0.8), 0px 0px 32px rgba(0, 0, 0, 0.7)',
                    WebkitTextStroke: '1px rgba(0, 0, 0, 0.8)',
                    paintOrder: 'stroke fill',
                    minWidth: 'fit-content',
                    fontStyle: displayData.isVolume || displayData.isMarketCap ? 'italic' : 'normal' // Italicize alternative metrics
                  } as any}
                  title={displayData.isVolume ? '24h Volume' : displayData.isMarketCap ? 'Market Cap' : '24h Change'} // Tooltip to explain the value
                >
                  {isCompact ? 
                    displayData.text.replace('.0', '') : // Remove .0 decimals in compact mode
                    displayData.text
                  }
                </span>
              </div>
            </div>
          </div>
          </div>
        );
      }) : [];
    
    let items: ReactElement[] = [];
    
    // Add smooth entry animation for token items
    const animatedTokenItems = tokenItems.map((item, index) => {
      if (item.key?.toString().includes('skeleton')) return item;
      
      return React.cloneElement(item, {
        ...item.props,
        style: {
          ...item.props.style,
          opacity: 0,
          animation: `fadeInSlide 0.5s ease-out forwards`,
          animationDelay: `${index * 50}ms`
        }
      });
    });
    
    // Add DUEL announcement first
    if (duelAnnouncementItem) items.push(duelAnnouncementItem);
    
    // Simple mixing of content
    if (activeTab === "all") {
      // First add all tokens (1-21), then all contests
      items.push(...animatedTokenItems);
      
      // Only show contests after tokens are loaded (not just loading)
      if (!finalTokensLoading && animatedTokenItems.length > 0 && contestItems.length > 0) {
        // Add separator between tokens and contests
        items.push(
          <div key="section-separator" className="inline-flex items-center" style={{ marginRight: isCompact ? '16px' : '24px' }}>
            <div className="w-px h-4 bg-gray-600/40 mx-3" />
          </div>
        );
        
        // Add contests with delayed animation
        const delayedContestItems = contestItems.map((item, index) => {
          return React.cloneElement(item, {
            ...item.props,
            style: {
              ...item.props.style,
              opacity: 0,
              animation: `fadeInSlide 0.5s ease-out forwards`,
              animationDelay: `${(animatedTokenItems.length * 50) + (index * 50) + 200}ms` // Wait for tokens + extra delay
            }
          });
        });
        
        items.push(...delayedContestItems);
        
        // Add separator after contests to loop back to tokens
        items.push(
          <div key="loop-separator" className="inline-flex items-center" style={{ marginRight: isCompact ? '16px' : '24px' }}>
            <div className="w-px h-4 bg-gray-600/40 mx-3" />
          </div>
        );
      }
    } else if (activeTab === "contests") {
      items.push(...contestItems);
    } else {
      items.push(...animatedTokenItems);
    }
    
    // Show message if no data
    if (items.length === 0 && !isOverallLoading) {
      const message = !finalDataConnected ? "NOT CONNECTED" : 
                    activeTab === "contests" ? "NO HOT DUELS" :
                    activeTab === "tokens" ? "TRENCHES QUIET" :
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
  }, [activeTab, sortedContests, displayTokens, isOverallLoading, finalDataConnected, duelAnnouncementItem, navigate, isCompact]);

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
        const globalIndex = setIndex * originalTickerItems.length + itemIndex;
        
        if (setIndex === 0) {
          itemsToRender.push(item);
        } else {
          // Clone with preserved delay but continue the sequence
          const clonedItem = React.cloneElement(item, { 
            key: `clone-${setIndex - 1}-${originalKey}`,
            style: {
              ...(item.props as any)?.style,
              transitionDelay: `${globalIndex * 30}ms` // Continue staggered sequence
            }
          } as any);
          itemsToRender.push(clonedItem);
        }
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
    hasDraggedRef.current = false; // Reset drag flag
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
    
    // If user moved more than 5 pixels, consider it a drag
    if (Math.abs(deltaX) > 5) {
      hasDraggedRef.current = true;
    }
    
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
          maskImage: `linear-gradient(to right, transparent 0px, transparent ${tabsWidth - 20}px, black ${tabsWidth + 10}px, black 100%)`,
          WebkitMaskImage: `linear-gradient(to right, transparent 0px, transparent ${tabsWidth - 20}px, black ${tabsWidth + 10}px, black 100%)`
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
    <div ref={floatingTabsRef} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex space-x-0.5 pointer-events-auto">
      <AnimatePresence>
        <motion.button
          key="tab-all"
          onClick={() => setActiveTab("all")}
          initial="inactive"
          animate={activeTab === "all" ? "active" : "inactive"}
          variants={tabButtonVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-1.5 py-0.5 text-[10px] font-medium rounded-sm transition-all flex-shrink-0 ${
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
          className={`px-1.5 py-0.5 text-[10px] font-medium rounded-sm transition-all flex-shrink-0 ${
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
          className={`px-1.5 py-0.5 text-[10px] font-medium rounded-sm transition-all flex-shrink-0 ${
            activeTab === "tokens"
              ? "bg-cyber-400/20 text-cyber-400 shadow-cyber"
              : "text-gray-400 hover:text-gray-300"
          }`}
        >
          GAINS
        </motion.button>
      </AnimatePresence>
    </div>
  );

  // Use inline style for smooth height transition instead of classes
  const currentHeight = isCompact ? 40 : 48; // h-10 = 40px, h-12 = 48px

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
    <div 
      className="relative w-full group/ticker bg-dark-200/30 backdrop-blur-lg border-b border-cyan-400/30 transition-all duration-300 ease-out"
      style={{ height: `${currentHeight}px` }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/8 via-transparent to-cyan-500/8" />
      </div>
      
      <div className="absolute inset-x-0 bottom-0 pointer-events-none">
        <div className="h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent shadow-lg shadow-cyan-500/20" />
      </div>
      
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
          /* Enable GPU acceleration for smooth transitions */
          .transition-all {
            will-change: auto;
            transform: translateZ(0);
            backface-visibility: hidden;
            perspective: 1000px;
          }
          /* Smooth fade in animation for tokens */
          @keyframes fadeInSlide {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `
      }} />
    </div>
  );
};

export default UnifiedTicker;