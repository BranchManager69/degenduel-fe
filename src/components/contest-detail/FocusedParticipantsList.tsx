import { AnimatePresence, motion } from "framer-motion";
import React, { useState, useMemo, useEffect, useRef } from "react";
import axiosInstance from '../../lib/axiosInstance';
import { getFullImageUrl } from "../../utils/profileImageUtils";

interface Participant {
  wallet_address: string;
  nickname: string;
  profile_image_url?: string | null;
  rank?: number;
  portfolio_value?: string;
  performance_percentage?: string;
  prize_awarded?: string | null;
  user_level?: {
    level_number: number;
    title: string;
  };
  is_current_user?: boolean;
  is_ai_agent?: boolean;
}

interface FocusedParticipantsListProps {
  participants: Participant[];
  contestStatus?: "upcoming" | "live" | "completed";
  prizePool?: number;
  contestId?: string;
}

export const FocusedParticipantsList: React.FC<FocusedParticipantsListProps> = ({
  participants,
  contestStatus = "upcoming",
  prizePool = 0,
  contestId,
}) => {
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [pulseCurrentUser, setPulseCurrentUser] = useState(true);
  const [expandedPortfolio, setExpandedPortfolio] = useState<boolean>(false);
  const [portfolioData, setPortfolioData] = useState<Record<string, any>>({});
  const [loadingPortfolio, setLoadingPortfolio] = useState<Record<string, boolean>>({});
  
  // Detect mobile viewport
  const [isMobile, setIsMobile] = useState(false);
  
  // Rolodex window state
  const [windowStart, setWindowStart] = useState(0);
  const WINDOW_SIZE = isMobile ? 10 : 20; // Show fewer on mobile
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sort participants with tied ranking system
  const sortedParticipants = useMemo(() => {
    if (contestStatus === "upcoming") {
      return [...participants].sort((a, b) => {
        if (a.is_ai_agent && !b.is_ai_agent) return 1;
        if (b.is_ai_agent && !a.is_ai_agent) return -1;
        if (a.user_level && b.user_level) {
          const levelDiff = b.user_level.level_number - a.user_level.level_number;
          if (levelDiff !== 0) return levelDiff;
        }
        return 0;
      });
    }

    // For live/completed contests, implement tied-rank system
    
    // 1. Sort by performance (portfolio_value desc, then performance_percentage desc, then wallet_address asc)
    const sortedByPerformance = [...participants].sort((a, b) => {
      const aValue = parseFloat(a.portfolio_value || '0');
      const bValue = parseFloat(b.portfolio_value || '0');
      if (aValue !== bValue) {
        return bValue - aValue; // Higher portfolio value wins
      }
      
      const aPerf = parseFloat(a.performance_percentage || '0');
      const bPerf = parseFloat(b.performance_percentage || '0');
      if (aPerf !== bPerf) {
        return bPerf - aPerf; // Higher performance wins
      }
      
      // Deterministic fallback - alphabetical by wallet address
      return a.wallet_address.localeCompare(b.wallet_address);
    });

    // 2. Calculate tied ranks with proper skipping
    const participantsWithTiedRanks: (Participant & { displayRank: string; calculatedRank: number })[] = [];
    let currentRank = 1;
    
    for (let i = 0; i < sortedByPerformance.length; i++) {
      const current = sortedByPerformance[i];
      const currentScore = `${current.portfolio_value}_${current.performance_percentage}`;
      
      // Find all participants with the same score
      const tiedGroup = [];
      let j = i;
      while (j < sortedByPerformance.length) {
        const participant = sortedByPerformance[j];
        const participantScore = `${participant.portfolio_value}_${participant.performance_percentage}`;
        if (participantScore === currentScore) {
          tiedGroup.push(participant);
          j++;
        } else {
          break;
        }
      }
      
      // Assign ranks - "T-X" for ties, regular number for individuals
      const displayRank = tiedGroup.length > 1 ? `T-${currentRank}` : currentRank.toString();
      tiedGroup.forEach(participant => {
        participantsWithTiedRanks.push({
          ...participant,
          displayRank,
          calculatedRank: currentRank
        });
      });
      
      // Skip ranks properly (if 3 people tie for 1st, next person is 4th)
      currentRank += tiedGroup.length;
      i = j - 1; // -1 because for loop will increment
    }
    
    return participantsWithTiedRanks;
  }, [participants, contestStatus]);


  // Calculate prize distribution for live/completed contests
  const prizeMap = useMemo(() => {
    if (contestStatus === "upcoming" || !prizePool || !sortedParticipants.length) {
      return new Map();
    }

    const prizePercentages = [0.69, 0.20, 0.11]; // 69%, 20%, 11% for 1st, 2nd, 3rd
    const paidPositions = 3;
    const prizes = new Map<string, number>();
    
    let currentPosition = 1;
    let i = 0;
    
    while (i < sortedParticipants.length) {
      // Find all participants with the same score (tied group)
      const currentParticipant = sortedParticipants[i];
      const currentScore = `${currentParticipant.portfolio_value}_${currentParticipant.performance_percentage}`;
      const tiedGroup = [];
      
      let j = i;
      while (j < sortedParticipants.length) {
        const participant = sortedParticipants[j];
        const participantScore = `${participant.portfolio_value}_${participant.performance_percentage}`;
        if (participantScore === currentScore) {
          tiedGroup.push(participant);
          j++;
        } else {
          break;
        }
      }
      
      const tiedCount = tiedGroup.length;
      
      // Calculate prize for this tied group
      if (currentPosition <= paidPositions) {
        // How many paid positions does this group occupy?
        const paidSlotsForGroup = Math.min(tiedCount, paidPositions - currentPosition + 1);
        
        if (paidSlotsForGroup > 0) {
          // Pool consecutive prizes and split among tied participants
          let totalPrizePercentage = 0;
          for (let k = 0; k < paidSlotsForGroup; k++) {
            const prizeIndex = currentPosition - 1 + k;
            if (prizeIndex < prizePercentages.length) {
              totalPrizePercentage += prizePercentages[prizeIndex];
            }
          }
          
          const prizePerParticipant = (prizePool * totalPrizePercentage) / tiedCount;
          
          // Assign prize to all tied participants
          tiedGroup.forEach(participant => {
            prizes.set(participant.wallet_address, prizePerParticipant);
          });
        } else {
          // Beyond paid positions
          tiedGroup.forEach(participant => {
            prizes.set(participant.wallet_address, 0);
          });
        }
      } else {
        // Beyond paid positions
        tiedGroup.forEach(participant => {
          prizes.set(participant.wallet_address, 0);
        });
      }
      
      currentPosition += tiedCount;
      i = j; // Move to next group
    }
    
    return prizes;
  }, [sortedParticipants, contestStatus, prizePool]);

  // Get color based on performance
  const getPerformanceColor = (perf: string | undefined) => {
    const value = parseFloat(perf || "0");
    if (value > 10) return "from-green-500 to-green-400";
    if (value > 5) return "from-green-600 to-green-500";
    if (value > 0) return "from-green-700 to-green-600";
    if (value > -5) return "from-red-700 to-red-600";
    if (value > -10) return "from-red-600 to-red-500";
    return "from-red-500 to-red-400";
  };

  // Get rank color class - handles tied ranks like "T-1"
  const getRankColor = (position?: number | string) => {
    // Extract numeric rank for styling (T-1 becomes 1, T-5 becomes 5, etc.)
    const numericRank = typeof position === 'string' 
      ? parseInt(position.replace('T-', '')) 
      : position;
      
    if (numericRank === 1) return "text-yellow-400";
    if (numericRank === 2) return "text-gray-300";
    if (numericRank === 3) return "text-orange-400";
    return "text-gray-400";
  };

  const activeIndex = hoveredIndex !== null ? hoveredIndex : focusedIndex;
  
  // Display configuration based on viewport
  const displayConfig = useMemo(() => {
    const visibleCount = Math.min(WINDOW_SIZE, sortedParticipants.length);
    const maxWidth = 100; // percentage
    
    // Calculate widths based on what's actually visible
    const expandedWidth = isMobile ? 40 : 30;
    const remainingWidth = maxWidth - expandedWidth;
    
    // Calculate sliver width with a maximum cap
    const calculatedSliverWidth = visibleCount > 1 ? remainingWidth / (visibleCount - 1) : remainingWidth;
    const maxSliverWidth = isMobile ? 10 : 8; // Maximum width to prevent ugly stretching
    const sliverWidth = Math.min(calculatedSliverWidth, maxSliverWidth);
    
    return {
      sliverWidth,
      expandedWidth,
      showAllDetails: visibleCount <= 10 && !isMobile,
      visibleCount,
      fontSize: {
        rank: isMobile ? 'text-lg' : 'text-xl',
        username: isMobile ? 'text-xl' : 'text-3xl',
        expanded: {
          rank: isMobile ? 'text-2xl' : 'text-4xl',
          name: isMobile ? 'text-2xl' : 'text-4xl'
        }
      }
    };
  }, [sortedParticipants.length, isMobile, WINDOW_SIZE]);
  
  // Calculate visible participants for the current window
  const visibleParticipants = useMemo(() => {
    const start = windowStart;
    const end = Math.min(windowStart + WINDOW_SIZE, sortedParticipants.length);
    return sortedParticipants.slice(start, end);
  }, [sortedParticipants, windowStart]);
  
  // Check if we can navigate left/right
  const canGoLeft = windowStart > 0;
  const canGoRight = windowStart + WINDOW_SIZE < sortedParticipants.length;
  
  // Navigate window
  const navigateWindow = (direction: 'left' | 'right') => {
    if (direction === 'left' && canGoLeft) {
      setWindowStart(prev => Math.max(0, prev - 1));
    } else if (direction === 'right' && canGoRight) {
      setWindowStart(prev => Math.min(sortedParticipants.length - WINDOW_SIZE, prev + 1));
    }
  };
  
  // Ensure focused participant is visible in window
  useEffect(() => {
    if (focusedIndex < windowStart) {
      setWindowStart(focusedIndex);
    } else if (focusedIndex >= windowStart + WINDOW_SIZE) {
      setWindowStart(Math.max(0, focusedIndex - WINDOW_SIZE + 1));
    }
  }, [focusedIndex, windowStart]);

  // Find current user index
  const currentUserIndex = useMemo(() => {
    return sortedParticipants.findIndex(p => p.is_current_user);
  }, [sortedParticipants]);

  // Auto-focus on current user when component mounts
  useEffect(() => {
    if (currentUserIndex !== -1) {
      setFocusedIndex(currentUserIndex);
      // Stop pulsing after a few seconds
      setTimeout(() => setPulseCurrentUser(false), 5000);
    }
  }, [currentUserIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (focusedIndex > 0) {
          setFocusedIndex(prev => prev - 1);
          setHoveredIndex(null);
          // Auto-scroll window if needed
          if (focusedIndex - 1 < windowStart) {
            navigateWindow('left');
          }
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (focusedIndex < sortedParticipants.length - 1) {
          setFocusedIndex(prev => prev + 1);
          setHoveredIndex(null);
          // Auto-scroll window if needed
          if (focusedIndex + 1 >= windowStart + WINDOW_SIZE) {
            navigateWindow('right');
          }
        }
      } else if (e.key === 'Home') {
        e.preventDefault();
        setFocusedIndex(0);
        setWindowStart(0);
        setHoveredIndex(null);
      } else if (e.key === 'End') {
        e.preventDefault();
        const lastIndex = sortedParticipants.length - 1;
        setFocusedIndex(lastIndex);
        setWindowStart(Math.max(0, sortedParticipants.length - WINDOW_SIZE));
        setHoveredIndex(null);
      } else if (e.key === 'PageUp' && canGoLeft) {
        e.preventDefault();
        setWindowStart(prev => Math.max(0, prev - WINDOW_SIZE));
      } else if (e.key === 'PageDown' && canGoRight) {
        e.preventDefault();
        setWindowStart(prev => Math.min(sortedParticipants.length - WINDOW_SIZE, prev + WINDOW_SIZE));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sortedParticipants.length, focusedIndex, windowStart, canGoLeft, canGoRight]);

  const jumpToCurrentUser = () => {
    if (currentUserIndex !== -1) {
      setFocusedIndex(currentUserIndex);
      setHoveredIndex(null);
      setPulseCurrentUser(true);
      // Also ensure the window shows the current user
      if (currentUserIndex < windowStart || currentUserIndex >= windowStart + WINDOW_SIZE) {
        // Center the window on the current user
        const newStart = Math.max(0, Math.min(currentUserIndex - Math.floor(WINDOW_SIZE / 2), sortedParticipants.length - WINDOW_SIZE));
        setWindowStart(newStart);
      }
      setTimeout(() => setPulseCurrentUser(false), 2000);
    }
  };

  // Fetch portfolio data
  const fetchPortfolioData = async (walletAddress: string) => {
    if (portfolioData[walletAddress] || !contestId) return;
    
    setLoadingPortfolio(prev => ({ ...prev, [walletAddress]: true }));
    
    try {
      const response = await axiosInstance.get(`/contests/${contestId}/portfolio/${walletAddress}`);
      setPortfolioData(prev => ({ ...prev, [walletAddress]: response.data }));
    } catch (error) {
      console.error('Failed to fetch portfolio data:', error);
      setPortfolioData(prev => ({ ...prev, [walletAddress]: null }));
    } finally {
      setLoadingPortfolio(prev => ({ ...prev, [walletAddress]: false }));
    }
  };

  // Handle portfolio toggle for focused participant
  const togglePortfolio = () => {
    const focusedParticipant = sortedParticipants[focusedIndex];
    if (focusedParticipant) {
      if (!expandedPortfolio) {
        fetchPortfolioData(focusedParticipant.wallet_address);
      }
      setExpandedPortfolio(!expandedPortfolio);
    }
  };

  // Touch gesture support for mobile
  const touchStartX = useRef<number | null>(null);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX.current) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    
    if (Math.abs(diff) > 50) { // Minimum swipe distance
      if (diff > 0 && focusedIndex < sortedParticipants.length - 1) {
        // Swipe left - next participant
        setFocusedIndex(prev => prev + 1);
      } else if (diff < 0 && focusedIndex > 0) {
        // Swipe right - previous participant
        setFocusedIndex(prev => prev - 1);
      }
    }
    
    touchStartX.current = null;
  };

  // Reset portfolio when focus changes
  useEffect(() => {
    setExpandedPortfolio(false);
  }, [focusedIndex]);

  return (
    <div className="relative w-full">
      {/* Header */}
      <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center justify-between'} mb-4`}>
        <div className="flex items-center gap-4">
          <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-100`}>
            {contestStatus === "completed" ? "Final Rankings" : "Live Rankings"}
          </h3>
          {currentUserIndex !== -1 && (
            <button
              onClick={jumpToCurrentUser}
              className={`${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm'} bg-brand-500/20 text-brand-400 rounded-md font-medium hover:bg-brand-500/30 transition-colors flex items-center gap-2`}
            >
              <span>{isMobile ? 'Me' : 'Jump to Me'}</span>
              <span className="text-xs">#{(sortedParticipants[currentUserIndex] as any).displayRank || currentUserIndex + 1}</span>
            </button>
          )}
        </div>
        {!isMobile && (
          <div className="text-sm text-gray-400">
            Click to focus • ← → Navigate • Home/End Jump
          </div>
        )}
      </div>

      {/* Main container with navigation */}
      <div className="relative">
        {/* Progress indicator */}
        {sortedParticipants.length > WINDOW_SIZE && (
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs text-gray-400">
              Showing {windowStart + 1}-{Math.min(windowStart + WINDOW_SIZE, sortedParticipants.length)} of {sortedParticipants.length}
            </div>
            <div className="flex-1 mx-4 h-1 bg-dark-300 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-500 transition-all duration-300"
                style={{ 
                  width: `${((windowStart + WINDOW_SIZE / 2) / sortedParticipants.length) * 100}%`
                }}
              />
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => navigateWindow('left')}
                disabled={!canGoLeft}
                className={`p-1 rounded ${canGoLeft ? 'bg-dark-300 hover:bg-dark-200 text-gray-300' : 'bg-dark-400 text-gray-600 cursor-not-allowed'} transition-colors`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => navigateWindow('right')}
                disabled={!canGoRight}
                className={`p-1 rounded ${canGoRight ? 'bg-dark-300 hover:bg-dark-200 text-gray-300' : 'bg-dark-400 text-gray-600 cursor-not-allowed'} transition-colors`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
        <div 
          className={`relative ${isMobile ? 'h-64' : 'h-96'} bg-dark-300/20 rounded-lg overflow-hidden`}
          onTouchStart={isMobile ? handleTouchStart : undefined}
          onTouchEnd={isMobile ? handleTouchEnd : undefined}
        >
          {/* Current user position indicator - now relative to window */}
          {currentUserIndex !== -1 && currentUserIndex >= windowStart && currentUserIndex < windowStart + WINDOW_SIZE && (
            <div 
              className="absolute top-0 w-1 h-full bg-brand-500/40 z-10 pointer-events-none"
              style={{ 
                left: `${((currentUserIndex - windowStart) / WINDOW_SIZE) * 100}%`,
                transform: 'translateX(-50%)'
              }}
            >
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-brand-500" />
              </div>
            </div>
          )}
          
          {/* Mobile swipe hint */}
          {isMobile && sortedParticipants.length > WINDOW_SIZE && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center z-20 pointer-events-none">
              <div className="bg-dark-400/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-gray-300 flex items-center gap-2">
                <span>← Swipe →</span>
              </div>
            </div>
          )}
          
          <div className="absolute inset-0 flex">
            {visibleParticipants.map((participant, visibleIndex) => {
              const actualIndex = windowStart + visibleIndex;
              const isActive = actualIndex === activeIndex;
              const isFocused = actualIndex === focusedIndex;
              const prize = prizeMap.get(participant.wallet_address) || 0;
              const hasPrize = prize > 0;
              const displayRank = 'displayRank' in participant ? (participant as any).displayRank : actualIndex + 1;
            
            return (
              <motion.div
                key={participant.wallet_address}
                className="relative h-full cursor-pointer"
                style={{
                  width: isActive ? `${displayConfig.expandedWidth}%` : `${displayConfig.sliverWidth}%`
                }}
                animate={{
                  width: isActive ? `${displayConfig.expandedWidth}%` : `${displayConfig.sliverWidth}%`
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                onClick={() => setFocusedIndex(actualIndex)}
                onMouseEnter={() => setHoveredIndex(actualIndex)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Sliver view (compressed) */}
                {!isActive && (
                  <div className={`h-full relative overflow-hidden border-r ${
                    participant.is_current_user 
                      ? 'border-brand-400/50 bg-brand-500/10' 
                      : 'border-dark-400/50'
                  } hover:bg-dark-300/30 transition-all duration-300`}>
                    {/* Profile picture background */}
                    {participant.profile_image_url && (
                      <div className="absolute inset-0">
                        <img
                          src={getFullImageUrl(participant.profile_image_url)}
                          alt={participant.nickname}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    {/* Current user glow effect */}
                    {participant.is_current_user && pulseCurrentUser && (
                      <motion.div
                        className="absolute inset-0 bg-brand-400/20"
                        animate={{ opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                    
                    {/* Performance gradient background - very faint */}
                    <div 
                      className={`absolute inset-0 bg-gradient-to-b ${getPerformanceColor(participant.performance_percentage)} opacity-10`}
                    />
                    
                    {/* Dark overlay for text readability */}
                    <div className="absolute inset-0 bg-dark-400/50" />
                    
                    {/* Current user indicator */}
                    {participant.is_current_user && (
                      <div className="absolute top-0 left-0 right-0 bg-brand-500 h-1" />
                    )}
                    
                    {/* Rank indicator - vertical stack without # */}
                    <div className="absolute top-2 left-0 right-0 flex justify-center">
                      <div className={`${
                        participant.is_current_user 
                          ? 'text-brand-400' 
                          : getRankColor(displayRank)
                      } font-bold flex flex-col items-center`}>
                        {displayConfig.showAllDetails ? (
                          <span className={`${displayConfig.fontSize.rank}`} style={{
                            textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                            WebkitTextStroke: '1px rgba(0,0,0,0.8)'
                          }}>{displayRank}</span>
                        ) : (
                          // Display rank vertically without #
                          displayRank.toString().split('').map((char: string, i: number) => (
                            <span key={i} className={`${displayConfig.fontSize.rank} leading-tight`}>
                              {char === '-' ? '—' : char}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                    
                    {/* YOU badge for current user */}
                    {participant.is_current_user && displayConfig.showAllDetails && (
                      <div className="absolute top-8 left-0 right-0 flex justify-center">
                        <span className="bg-brand-500 text-white px-1 py-0.5 rounded text-[10px] font-black">YOU</span>
                      </div>
                    )}
                    
                    {/* Prize indicator */}
                    {hasPrize && (
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                        <div className={`w-2 h-2 rounded-full animate-pulse ${
                          displayRank == 1 || displayRank === 'T-1' || displayRank === '1' ? 'bg-yellow-400' :
                          displayRank == 2 || displayRank === 'T-2' || displayRank === '2' ? 'bg-gray-300' :
                          displayRank == 3 || displayRank === 'T-3' || displayRank === '3' ? 'bg-orange-400' :
                          'bg-green-400'
                        }`} />
                      </div>
                    )}
                    
                    {/* Username - rotated, centered in available space */}
                    <div className="absolute top-1/2 left-0 right-0 flex justify-center -translate-y-1/2 z-20">
                      <div className="transform -rotate-90 whitespace-nowrap">
                        <span className={`${
                          participant.nickname.length > 12 ? (isMobile ? 'text-base' : 'text-xl') :
                          participant.nickname.length > 8 ? (isMobile ? 'text-lg' : 'text-2xl') :
                          displayConfig.fontSize.username
                        } font-bold ${
                          participant.is_current_user ? 'text-brand-300' : 'text-gray-100'
                        }`}
                        style={{
                          textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                          WebkitTextStroke: '1px rgba(0,0,0,0.8)'
                        }}>
                          {participant.nickname}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Expanded view (focused) */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full relative overflow-hidden group"
                    >
                      {/* Background with profile image */}
                      {participant.profile_image_url && (
                        <div className="absolute inset-0">
                          <img
                            src={getFullImageUrl(participant.profile_image_url)}
                            alt={participant.nickname}
                            className="absolute inset-0 w-full h-full object-cover"
                            style={{
                              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 100%)',
                              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 100%)'
                            }}
                          />
                          <div className={`absolute inset-0 ${
                            participant.is_current_user ? 'bg-brand-900/60' : 'bg-dark-400/60'
                          }`} />
                        </div>
                      )}
                      
                      {/* Current user spotlight effect */}
                      {participant.is_current_user && (
                        <div className="absolute inset-0 bg-gradient-to-t from-brand-500/20 to-transparent pointer-events-none" />
                      )}
                      
                      {/* Content - clickable to toggle portfolio */}
                      <div 
                        className={`relative h-full ${isMobile ? 'p-3' : 'p-6'} flex flex-col justify-between cursor-pointer`}
                        onClick={togglePortfolio}
                      >
                        {/* Top section */}
                        <div>
                          {/* Rank with focus indicator */}
                          <div className="flex items-center gap-3 mb-4">
                            <motion.span 
                              className={`${getRankColor(displayRank)} font-black ${displayConfig.fontSize.expanded.rank}`}
                              style={{
                                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                                WebkitTextStroke: '1px rgba(0,0,0,0.5)'
                              }}
                              animate={isFocused ? { scale: [1, 1.1, 1] } : {}}
                              transition={{ duration: 0.3 }}
                            >
                              {displayRank}
                            </motion.span>
                            {participant.is_current_user && (
                              <span className="bg-brand-500 text-white px-3 py-1 rounded-md font-black text-sm">YOU</span>
                            )}
                            {participant.is_ai_agent && (
                              <span className="bg-cyan-500 text-white px-3 py-1 rounded-md font-black text-sm">AI</span>
                            )}
                          </div>
                          
                          {/* Name and level */}
                          <h4 className={`font-bold ${
                            participant.nickname.length > 15 ? (isMobile ? 'text-lg' : 'text-2xl') :
                            participant.nickname.length > 10 ? (isMobile ? 'text-xl' : 'text-3xl') :
                            displayConfig.fontSize.expanded.name
                          } mb-2 ${
                            participant.is_current_user ? "text-brand-400" :
                            participant.is_ai_agent ? "text-cyan-400" :
                            "text-gray-100"
                          }`}
                          style={{
                            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                            WebkitTextStroke: '1px rgba(0,0,0,0.8)'
                          }}>
                            {participant.nickname}
                          </h4>
                          
                          {participant.user_level && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-brand-400 font-bold">
                                LV.{participant.user_level.level_number}
                              </span>
                              <span className="text-gray-300">
                                {participant.user_level.title}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Bottom section - Performance */}
                        <div>
                          {contestStatus !== "upcoming" && (
                            <div className="space-y-3">
                              <div className={`text-3xl font-bold ${
                                parseFloat(participant.performance_percentage || "0") >= 0 ? "text-green-400" : "text-red-400"
                              }`}
                              style={{
                                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                                WebkitTextStroke: '1px rgba(0,0,0,0.8)'
                              }}>
                                {parseFloat(participant.performance_percentage || "0") >= 0 ? "+" : ""}
                                {parseFloat(participant.performance_percentage || "0").toFixed(2)}%
                              </div>
                              
                              {participant.portfolio_value && (
                                <div className="flex items-center gap-2 text-xl text-gray-200">
                                  <span style={{
                                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                                    WebkitTextStroke: '1px rgba(0,0,0,0.8)'
                                  }}>{parseFloat(participant.portfolio_value).toFixed(2)}</span>
                                  <img 
                                    src="/assets/media/logos/solana.svg" 
                                    alt="SOL" 
                                    className="w-5 h-5"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Prize indicator - edge to edge */}
                          {hasPrize && (
                            <motion.div 
                              className={`mt-4 ${isMobile ? '-mx-3 -mb-3' : '-mx-6 -mb-6'} p-3 ${
                                displayRank == 1 || displayRank === 'T-1' || displayRank === '1' 
                                  ? 'bg-gradient-to-r from-yellow-500/30 to-yellow-400/30' :
                                displayRank == 2 || displayRank === 'T-2' || displayRank === '2' 
                                  ? 'bg-gradient-to-r from-gray-400/30 to-gray-300/30' :
                                displayRank == 3 || displayRank === 'T-3' || displayRank === '3' 
                                  ? 'bg-gradient-to-r from-orange-500/30 to-orange-400/30' :
                                  'bg-gradient-to-r from-green-500/30 to-green-400/30'
                              }`}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-black uppercase tracking-wider text-black">
                                  In The Money
                                </span>
                                <div className={`flex items-center gap-1 font-bold ${
                                  displayRank == 1 || displayRank === 'T-1' || displayRank === '1' 
                                    ? 'text-yellow-300' :
                                  displayRank == 2 || displayRank === 'T-2' || displayRank === '2' 
                                    ? 'text-gray-200' :
                                  displayRank == 3 || displayRank === 'T-3' || displayRank === '3' 
                                    ? 'text-orange-300' :
                                    'text-green-300'
                                }`}>
                                  <span>{prize.toFixed(2)}</span>
                                  <img 
                                    src="/assets/media/logos/solana.svg" 
                                    alt="SOL" 
                                    className="w-4 h-4"
                                  />
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                        
                        {/* Subtle expand indicator - positioned absolutely */}
                        {hasPrize ? (
                          <div className={`absolute ${isMobile ? 'bottom-14' : 'bottom-16'} right-2 text-gray-500 group-hover:text-gray-300 transition-colors`}>
                            <motion.div
                              animate={{ y: expandedPortfolio ? 0 : [0, 3, 0] }}
                              transition={{ duration: 2, repeat: expandedPortfolio ? 0 : Infinity }}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={expandedPortfolio ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                              </svg>
                            </motion.div>
                          </div>
                        ) : (
                          <div className="absolute bottom-2 right-2 text-gray-500 group-hover:text-gray-300 transition-colors">
                            <motion.div
                              animate={{ y: expandedPortfolio ? 0 : [0, 3, 0] }}
                              transition={{ duration: 2, repeat: expandedPortfolio ? 0 : Infinity }}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={expandedPortfolio ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                              </svg>
                            </motion.div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
            })}
          </div>
        </div>
      </div>

      {/* Right-side Portfolio Drawer */}
      <AnimatePresence>
        {expandedPortfolio && sortedParticipants[focusedIndex] && (
          <>
            {/* Dark overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setExpandedPortfolio(false)}
            />
            
            <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`fixed right-0 top-0 h-full ${isMobile ? 'w-full' : 'w-96'} bg-dark-300/95 backdrop-blur-md border-l border-dark-300 z-50 overflow-y-auto overflow-x-hidden`}
          >
            {/* Close button */}
            <button
              onClick={() => setExpandedPortfolio(false)}
              className="absolute top-4 right-4 p-2 bg-dark-400/50 rounded-lg hover:bg-dark-400 transition-colors z-10"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="p-6 pt-16 max-w-full">
              <h4 className="text-lg font-semibold text-gray-100 mb-4">
                {sortedParticipants[focusedIndex].nickname}'s Portfolio
              </h4>
              
              {loadingPortfolio[sortedParticipants[focusedIndex].wallet_address] ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="animate-pulse">Loading portfolio...</div>
                </div>
              ) : portfolioData[sortedParticipants[focusedIndex].wallet_address] === null ? (
                <div className="text-center py-8 text-red-400">
                  <p>Failed to load portfolio data</p>
                </div>
              ) : portfolioData[sortedParticipants[focusedIndex].wallet_address]?.portfolio ? (
                <div>
                  {/* Portfolio Summary */}
                  <div className="mb-6 p-4 bg-dark-400/30 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Initial Value:</span>
                        <div className="font-semibold text-gray-100 flex items-center gap-1 mt-1">
                          <span>{parseFloat(portfolioData[sortedParticipants[focusedIndex].wallet_address].portfolio_summary.initial_value).toFixed(2)}</span>
                          <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400">Current Value:</span>
                        <div className="font-semibold text-gray-100 flex items-center gap-1 mt-1">
                          <span>{parseFloat(portfolioData[sortedParticipants[focusedIndex].wallet_address].portfolio_summary.current_value).toFixed(2)}</span>
                          <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400">P&L:</span>
                        <div className={`font-semibold mt-1 flex items-center gap-1 ${
                          portfolioData[sortedParticipants[focusedIndex].wallet_address].portfolio_summary.total_pnl_amount >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {portfolioData[sortedParticipants[focusedIndex].wallet_address].portfolio_summary.total_pnl_amount >= 0 ? '+' : ''}
                          <span>{parseFloat(portfolioData[sortedParticipants[focusedIndex].wallet_address].portfolio_summary.total_pnl_amount).toFixed(2)}</span>
                          <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400">Return:</span>
                        <div className={`font-semibold mt-1 ${
                          portfolioData[sortedParticipants[focusedIndex].wallet_address].portfolio_summary.total_pnl_percentage >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {portfolioData[sortedParticipants[focusedIndex].wallet_address].portfolio_summary.total_pnl_percentage >= 0 ? '+' : ''}
                          {portfolioData[sortedParticipants[focusedIndex].wallet_address].portfolio_summary.total_pnl_percentage.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Token Holdings */}
                  <div className="space-y-3">
                    <h5 className="font-semibold text-gray-100 mb-3">Token Holdings</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {portfolioData[sortedParticipants[focusedIndex].wallet_address].portfolio.map((holding: any) => (
                        <div key={holding.token_id} className="flex items-center justify-between p-3 bg-dark-400/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <img 
                              src={holding.token.image_url} 
                              alt={holding.token.symbol}
                              className="w-10 h-10 rounded-full"
                            />
                            <div>
                              <div className="font-semibold text-gray-100">
                                {holding.token.symbol}
                              </div>
                              <div className="text-xs text-gray-400">
                                {holding.weight.toFixed(1)}% allocation
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="font-semibold text-gray-100 flex items-center gap-1">
                              <span>{parseFloat(holding.current_value).toFixed(2)}</span>
                              <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-3 h-3" />
                            </div>
                            <div className={`text-xs font-medium ${
                              holding.pnl_percentage >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {holding.pnl_percentage >= 0 ? '+' : ''}{holding.pnl_percentage.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p>No portfolio data available</p>
                </div>
              )}
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};