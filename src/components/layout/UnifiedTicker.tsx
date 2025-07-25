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
  const [viewportWidth, setViewportWidth] = useState<number>(0);
  const [contentOverflows, setContentOverflows] = useState(false);

  // Refs
  const viewportRef = useRef<HTMLDivElement>(null);
  const scrollableContentRef = useRef<HTMLDivElement>(null);
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

    const scrollSpeed = 0.06; // Doubled from 0.03 to 0.06 for faster scrolling
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


  // Mixed ticker items - contest, 10 tokens, contest, 10 tokens...
  const originalTickerItems = useMemo(() => {
    const items: ReactElement[] = [];
    let globalItemIndex = 0;
    let contestIndex = 0;
    let tokenIndex = 0;
    
    // Helper function to create contest element
    const createContestElement = (contest: Contest, index: number) => {
      const contestKey = `contest-${index}-${contest.id || 'no-id'}`;
      const contestImageUrl = getContestImageUrl(contest.image_url);
      const currentItemIndex = globalItemIndex++;
      const isNumeroUno = contest.name.toLowerCase().includes('numero uno');
      
      // Determine contest label
      const getContestLabel = (index: number, contest: any) => {
        if (index === 0) return "STARTING NEXT";
        if (isNumeroUno) return "NUMERO UNO";
        if (contest.status === 'active') return "LIVE NOW";
        
        // Check if contest starts within 30 minutes
        const now = new Date();
        const startTime = new Date(contest.start_time);
        const timeDiffMs = startTime.getTime() - now.getTime();
        const timeDiffMinutes = timeDiffMs / (1000 * 60);
        
        if (timeDiffMinutes <= 30 && timeDiffMinutes > 0) {
          return "STARTING SOON";
        }
        
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
              contestIndex === 0 ? 'text-emerald-400 bg-emerald-400/15' : 
              isNumeroUno ? 'text-yellow-400 bg-yellow-400/15' :
              contest.status === 'active' ? 'text-red-400 bg-red-400/15' :
              'text-purple-400 bg-purple-400/15'
            }`}
            style={{
              fontSize: isCompact ? '9px' : '11px',
              textShadow: 
                contestIndex === 0 ? '0 0 8px rgba(52, 211, 153, 0.6)' :
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
    };

    // Helper function to create token element
    const createTokenElement = (token: Token, actualTokenIndex: number) => {
      const tokenKey = `token-${actualTokenIndex}-${TokenHelpers.getAddress(token) || token.symbol}`;
      const logoUrl = token.image_url || token.header_image_url;
      const currentItemIndex = globalItemIndex++;
      const symbolLetter = token.symbol ? token.symbol.charAt(0).toUpperCase() : '?';
      
      // Check if we have actual price change data
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
              actualTokenIndex === 0 ? 'text-yellow-400 bg-yellow-400/15' : 
              actualTokenIndex === 1 ? 'text-gray-300 bg-gray-300/15' : 
              actualTokenIndex === 2 ? 'text-amber-600 bg-amber-600/15' : 
              'text-cyan-400/70 bg-cyan-400/10'
            }`}
            style={{
              fontSize: isCompact ? '12px' : actualTokenIndex < 3 ? '16px' : '14px',
              textShadow: 
                actualTokenIndex === 0 ? '0 0 10px rgba(251, 191, 36, 0.6)' :
                actualTokenIndex === 1 ? '0 0 10px rgba(209, 213, 219, 0.6)' :
                actualTokenIndex === 2 ? '0 0 10px rgba(217, 119, 6, 0.6)' :
                '0 0 8px rgba(0, 225, 255, 0.3)',
              fontFamily: 'inherit',
              fontWeight: 700,
              minWidth: isCompact ? '26px' : actualTokenIndex < 3 ? '32px' : '30px',
              height: isCompact ? '16px' : actualTokenIndex < 3 ? '20px' : '18px',
              marginRight: '1px',
              position: 'relative' as const,
              zIndex: 1
            }}
          >
            <span style={{ fontSize: '0.8em', opacity: 0.7, marginRight: '1px' }}>#</span>{actualTokenIndex + 1}
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
    };
    
    // Implement the new pattern: contest, 10 tokens, contest, 10 tokens...
    let totalContestIndex = 0;
    if (sortedContests.length > 0) {
      // Start with first contest
      items.push(createContestElement(sortedContests[0], totalContestIndex++));
      contestIndex = 1; // Move to next contest for next time
    }
    
    // Add tokens in groups of 10, with contest between each group
    for (let i = 0; i < displayTokens.length; i++) {
      items.push(createTokenElement(displayTokens[i], i));
      tokenIndex++;
      
      // After every 10 tokens, add a contest
      if ((i + 1) % 10 === 0 && sortedContests.length > 0) {
        const contestToUse = sortedContests[contestIndex % sortedContests.length];
        items.push(createContestElement(contestToUse, totalContestIndex++));
        contestIndex++;
      }
    }
    
    // Add DUEL announcement if available
    if (duelAnnouncementItem) {
      items.unshift(duelAnnouncementItem); // Add at beginning
    }

    return items;
  }, [sortedContests, displayTokens, isOverallLoading, finalDataConnected, duelAnnouncementItem, navigate, isCompact, showVolume]);

  // Measure content after ticker items change
  useLayoutEffect(() => {
    if (scrollableContentRef.current && viewportRef.current && originalTickerItems.length > 0) {
      // Force a reflow to ensure accurate measurements
      const viewport = viewportRef.current;
      const content = scrollableContentRef.current;
      
      const viewportWidth = viewport.offsetWidth;
      const contentWidth = content.scrollWidth;
      
      // Store original content width for perfect infinite scroll
      originalContentWidthRef.current = contentWidth;
      
      const shouldOverflow = contentWidth > viewportWidth;
      
      if (shouldOverflow !== contentOverflows) {
        console.log(`[UnifiedTicker] Content overflow changed: ${shouldOverflow}, viewport: ${viewportWidth}, content: ${contentWidth}`);
        setContentOverflows(shouldOverflow);
      }
      
      if (shouldOverflow) {
        // Duplicate content for seamless infinite scroll
        actualContentWidthRef.current = contentWidth * 2;
        
        // Reset position if we're beyond the original content width
        if (Math.abs(translateXRef.current) >= originalContentWidthRef.current) {
          translateXRef.current = 0;
          content.style.transform = `translate3d(0, 0, 0)`;
        }
      } else {
        // Reset transform for non-overflowing content
        translateXRef.current = 0;
        content.style.transform = `translate3d(0, 0, 0)`;
        actualContentWidthRef.current = contentWidth;
      }
    }
  }, [originalTickerItems, viewportWidth, contentOverflows]);

  // Generate duplicated content for infinite scroll
  const tickerContent = useMemo(() => {
    if (!contentOverflows || originalTickerItems.length === 0) {
      return originalTickerItems;
    }
    
    // Duplicate the items for seamless infinite scroll with unique keys
    const duplicatedItems = originalTickerItems.map((item) => {
      return React.cloneElement(item, {
        key: `${item.key}-dup`
      });
    });
    
    return [...originalTickerItems, ...duplicatedItems];
  }, [originalTickerItems, contentOverflows]);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (maintenanceMode) return;
    
    e.preventDefault();
    isInteractingRef.current = true;
    hasDraggedRef.current = false;
    dragStartXRef.current = e.clientX;
    scrollStartTranslateXRef.current = translateXRef.current;
    lastDragTimeRef.current = Date.now();
    lastDragPositionRef.current = e.clientX;
    dragVelocityRef.current = 0;
    
    // Cancel animation during interaction
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
  }, [maintenanceMode]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isInteractingRef.current || !scrollableContentRef.current) return;
    
    const deltaX = e.clientX - dragStartXRef.current;
    const newTranslateX = scrollStartTranslateXRef.current + deltaX;
    
    // Apply modulo for infinite scroll boundaries
    let boundedTranslateX = newTranslateX;
    if (originalContentWidthRef.current > 0) {
      boundedTranslateX = newTranslateX % originalContentWidthRef.current;
      if (boundedTranslateX > 0) {
        boundedTranslateX -= originalContentWidthRef.current;
      }
    }
    
    translateXRef.current = boundedTranslateX;
    scrollableContentRef.current.style.transform = `translate3d(${boundedTranslateX}px, 0, 0)`;
    
    // Calculate velocity for momentum
    const currentTime = Date.now();
    const timeDelta = currentTime - lastDragTimeRef.current;
    const positionDelta = e.clientX - lastDragPositionRef.current;
    
    if (timeDelta > 0) {
      dragVelocityRef.current = positionDelta / timeDelta;
    }
    
    lastDragTimeRef.current = currentTime;
    lastDragPositionRef.current = e.clientX;
    
    // Mark as dragged if moved significantly
    if (Math.abs(deltaX) > 5) {
      hasDraggedRef.current = true;
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!isInteractingRef.current) return;
    
    isInteractingRef.current = false;
    
    // Resume scrolling after interaction with delay
    if (resumeTimeoutIdRef.current) {
      clearTimeout(resumeTimeoutIdRef.current);
    }
    
    resumeTimeoutIdRef.current = setTimeout(() => {
      if (contentOverflows && !isHoverPausedRef.current && !animationFrameIdRef.current) {
        console.log('[UnifiedTicker] Resuming animation after interaction');
        lastTimestampRef.current = 0;
        animationFrameIdRef.current = requestAnimationFrame(animateScroll);
      }
    }, INTERACTION_RESUME_DELAY_MS);
  }, [contentOverflows, animateScroll]);

  const handleMouseEnter = useCallback(() => {
    if (maintenanceMode) return;
    
    // Clear existing timeout
    if (hoverPauseTimeoutIdRef.current) {
      clearTimeout(hoverPauseTimeoutIdRef.current);
      hoverPauseTimeoutIdRef.current = null;
    }
    
    // Pause after delay
    hoverPauseTimeoutIdRef.current = setTimeout(() => {
      isHoverPausedRef.current = true;
      
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    }, HOVER_PAUSE_DELAY_MS);
  }, [maintenanceMode]);

  const handleMouseLeave = useCallback(() => {
    // Clear pause timeout
    if (hoverPauseTimeoutIdRef.current) {
      clearTimeout(hoverPauseTimeoutIdRef.current);
      hoverPauseTimeoutIdRef.current = null;
    }
    
    isHoverPausedRef.current = false;
    
    // Resume animation if content overflows and not interacting
    if (contentOverflows && !isInteractingRef.current && !animationFrameIdRef.current) {
      console.log('[UnifiedTicker] Resuming animation on mouse leave');
      lastTimestampRef.current = 0;
      animationFrameIdRef.current = requestAnimationFrame(animateScroll);
    }
  }, [contentOverflows, animateScroll]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (resumeTimeoutIdRef.current) {
        clearTimeout(resumeTimeoutIdRef.current);
      }
      if (hoverPauseTimeoutIdRef.current) {
        clearTimeout(hoverPauseTimeoutIdRef.current);
      }
    };
  }, []);

  // Loading state
  if (isOverallLoading && (!displayTokens || displayTokens.length === 0)) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="flex items-center space-x-2 text-white/60">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium">Loading market data...</span>
        </div>
      </div>
    );
  }

  // No data state
  if (!finalDataConnected) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="flex items-center space-x-2 text-yellow-400/80">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">Connecting to market data...</span>
        </div>
      </div>
    );
  }

  // Empty state
  if ((!displayTokens || displayTokens.length === 0) && (!sortedContests || sortedContests.length === 0)) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="flex items-center space-x-2 text-white/40">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">TRENCHES QUIET</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-brand-800/20">
      <div
        ref={viewportRef}
        className="relative h-full w-full overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
      >
        <div
          ref={scrollableContentRef}
          className="inline-flex items-center h-full"
          style={{ 
            width: 'max-content',
            transform: 'translate3d(0, 0, 0)',
            willChange: 'transform'
          }}
        >
          {tickerContent}
        </div>
      </div>
    </div>
  );
};

export default UnifiedTicker;
