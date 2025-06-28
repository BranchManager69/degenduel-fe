import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useMemo, useRef, useState } from "react";

import axiosInstance from '../../lib/axiosInstance';
import { formatCurrency } from "../../lib/utils";
import { getFullImageUrl } from "../../utils/profileImageUtils";
import { getFlairLabel, getRoleBadgeClasses, getUserNameColorWithFlair, getUserRoleLabel } from "../../utils/roleColors";
import { PublicUserSearch } from "../common/PublicUserSearch";

// New unified participant structure from backend API
interface Participant {
  wallet_address: string;
  nickname: string;
  profile_image_url?: string | null;
  
  // Contest performance data (null/0 before contest starts)
  rank?: number;
  portfolio_value?: string;
  initial_portfolio_value?: string;
  performance_percentage?: string;
  prize_awarded?: string | null;
  
  // Enhanced user profile data
  user_level?: {
    level_number: number;
    class_name: string;
    title: string;
    icon_url?: string;
  };
  experience_points?: number;
  total_contests_entered?: number;
  contests_won?: number;
  twitter_handle?: string | null;
  is_current_user?: boolean;
  is_ai_agent?: boolean;
  is_banned?: boolean;
  is_admin?: boolean;
  is_superadmin?: boolean;
  role?: string;
  flair?: 'victor' | 'whale' | 'legend' | null;
  
  // Portfolio breakdown
  portfolio?: Array<{
    token_symbol: string;
    token_name: string;
    token_image?: string;
    weight: number;
    current_value: string;
    performance_percentage: string;
  }>;
}

interface ParticipantsListProps {
  participants: Participant[];
  contestStatus?: "upcoming" | "live" | "completed";
  prizePool?: number; // Add prize pool for live prize calculations
  contestId?: string; // Add contest ID for portfolio fetching
  onParticipantHover?: (walletAddress: string | null) => void; // Chart hover coordination
  hoveredParticipant?: string | null; // Current hovered participant
}

// No longer needed - all data comes from the API now
// interface EnhancedParticipant extends Participant {
//   isLoading?: boolean;
// }


export const ParticipantsList: React.FC<ParticipantsListProps> = ({
  participants,
  contestStatus = "upcoming",
  prizePool = 0,
  contestId,
  onParticipantHover,
  hoveredParticipant,
}) => {
  // // Debug role data
  // useEffect(() => {
  //   console.log('[ParticipantsList] Participants with roles:', participants.map(p => ({
  //     nickname: p.nickname,
  //     role: p.role,
  //     is_admin: p.is_admin,
  //     is_superadmin: p.is_superadmin
  //   })));
  // }, [participants]);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setSelectedUser] = useState<any>(null);
  const [showCompactView] = useState(false);
  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null);
  const [portfolioData, setPortfolioData] = useState<Record<string, any>>({});
  const [loadingPortfolio, setLoadingPortfolio] = useState<Record<string, boolean>>({});
  
  // Track previous ranks for animation
  const [previousRanks, setPreviousRanks] = useState<Map<string, number>>(new Map());
  const [rankChanges, setRankChanges] = useState<Map<string, number>>(new Map());
  const isFirstRender = useRef(true);

  const filteredParticipants = useMemo(() => {
    if (!searchQuery) {
      return participants;
    }

    const query = searchQuery.toLowerCase();
    return participants.filter(
      (p) =>
        p.nickname.toLowerCase().includes(query) ||
        p.wallet_address.toLowerCase().includes(query),
    );
  }, [participants, searchQuery]);

  const sortedParticipants = useMemo(() => {
    if (contestStatus === "upcoming") {
      // Keep existing logic for upcoming contests
      return [...filteredParticipants].sort((a, b) => {
        // AI agents last for upcoming contests only
        if (a.is_ai_agent && !b.is_ai_agent) return 1;
        if (b.is_ai_agent && !a.is_ai_agent) return -1;
        
        // For upcoming contests, sort by user level then experience
        if (a.user_level && b.user_level) {
          const levelDiff = b.user_level.level_number - a.user_level.level_number;
          if (levelDiff !== 0) return levelDiff;
        }
        
        return (b.experience_points || 0) - (a.experience_points || 0);
      });
    }

    // For live/completed contests, implement tied-rank system
    
    // 1. Sort by performance (portfolio_value desc, then performance_percentage desc, then wallet_address asc)
    const sortedByPerformance = [...filteredParticipants].sort((a, b) => {
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
  }, [filteredParticipants, contestStatus]);

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

  // Track rank changes when participants update
  useEffect(() => {
    if (contestStatus === "upcoming" || isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const newRankChanges = new Map<string, number>();
    
    sortedParticipants.forEach((participant, index) => {
      const currentRank = participant.rank || index + 1;
      const previousRank = previousRanks.get(participant.wallet_address);
      
      if (previousRank !== undefined && previousRank !== currentRank) {
        newRankChanges.set(participant.wallet_address, previousRank - currentRank);
      }
    });

    setRankChanges(newRankChanges);
    
    // Update previous ranks for next comparison
    const newPreviousRanks = new Map<string, number>();
    sortedParticipants.forEach((p, index) => {
      newPreviousRanks.set(p.wallet_address, p.rank || index + 1);
    });
    setPreviousRanks(newPreviousRanks);

    // Clear rank change indicators after animation
    const timer = setTimeout(() => {
      setRankChanges(new Map());
    }, 2000);

    return () => clearTimeout(timer);
  }, [sortedParticipants, contestStatus]);

  // Get rank styling - maximum impact (handles tied ranks like "T-1")
  const getRankClass = (position?: number | string) => {
    // Extract numeric rank for styling (T-1 becomes 1, T-5 becomes 5, etc.)
    const numericRank = typeof position === 'string' 
      ? parseInt(position.replace('T-', '')) 
      : position;
      
    if (numericRank === 1) return "text-yellow-400 font-black text-2xl tracking-wider";
    if (numericRank === 2) return "text-gray-300 font-black text-2xl tracking-wider";
    if (numericRank === 3) return "text-orange-400 font-black text-2xl tracking-wider";
    return "text-gray-300 font-black text-lg tracking-wide";
  };

  // Enhanced row styling - dynamic height based on prize status
  const getParticipantRowClass = (hasPrize: boolean) => {
    const height = hasPrize ? "h-20" : "h-16"; // Taller for prize winners
    const baseClass = `relative ${height} rounded-lg transition-all duration-300 group overflow-hidden`;
    return `${baseClass} bg-dark-300/20 hover:bg-dark-300/40 border border-dark-300/30`;
  };

  // Animation variants for container
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
        delayChildren: 0.1
      }
    }
  };

  // Animation variants for items
  const itemVariants = {
    hidden: { 
      opacity: 0, 
      x: -20,
      scale: 0.95
    },
    show: { 
      opacity: 1, 
      x: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  const fetchPortfolioData = async (walletAddress: string) => {
    if (portfolioData[walletAddress] || !contestId) return; // Already loaded or no contest ID
    
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

  const handleParticipantClick = (walletAddress: string) => {
    if (expandedParticipant === walletAddress) {
      setExpandedParticipant(null);
    } else {
      setExpandedParticipant(walletAddress);
      // Only fetch portfolio data if contest has started (not pending)
      if (contestStatus !== "upcoming") {
        fetchPortfolioData(walletAddress);
      }
    }
  };

  return (
    <div className="space-y-6 bg-dark-200/50 backdrop-blur-sm rounded-lg p-6 border border-dark-300">
      {/* Enhanced Header */}
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-100">
              {contestStatus === "completed" ? "Final Rankings" : "Participants"}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 bg-dark-300/50 px-2 py-1 rounded-full">
                {participants.length} {participants.length === 1 ? "dueler" : "duelers"}
              </span>
              {contestStatus === "live" && (
                <span className="text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded-full flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Live
                </span>
              )}
            </div>
          </div>
          

        </div>

        {/* Search - only show for 10+ participants */}
        {participants.length >= 10 && (
          <PublicUserSearch
            onSelectUser={(user) => {
              setSelectedUser(user as any);
              setSearchQuery(user.nickname);
            }}
            placeholder="Search participants..."
            variant="modern"
            className="w-full"
            autoFocus={false}
          />
        )}
      </div>

      {/* Participants List */}
      {sortedParticipants.length > 0 ? (
        <motion.div 
          className="space-y-2"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <AnimatePresence mode="popLayout">
            {sortedParticipants.map((participant, index) => {
              // Use displayRank for live/completed contests, index+1 for upcoming
              const position: string | number | undefined = contestStatus !== "upcoming" && 'displayRank' in participant 
                ? (participant as any).displayRank 
                : (contestStatus !== "upcoming" ? index + 1 : undefined);
              const rankChange = rankChanges.get(participant.wallet_address) || 0;
              
              // Check if participant has a prize
              const prize = prizeMap.get(participant.wallet_address) || 0;
              const hasPrize = prize > 0;
              const isExpanded = expandedParticipant === participant.wallet_address;
              const portfolio = portfolioData[participant.wallet_address];
              const isLoadingPortfolio = loadingPortfolio[participant.wallet_address];
              const isHovered = hoveredParticipant === participant.wallet_address;
              
              return (
                <div key={participant.wallet_address}>
                  <motion.div
                    layoutId={participant.wallet_address}
                    layout="position"
                    variants={itemVariants}
                    className={`${getParticipantRowClass(hasPrize)} cursor-pointer ${
                      isHovered ? 'ring-2 ring-brand-400/50 bg-brand-500/5' : ''
                    }`}
                    style={{ 
                      willChange: 'transform',
                      position: 'relative',
                      zIndex: isHovered ? 15 : rankChange > 0 ? 10 : 1 
                    }}
                    transition={{
                      layout: {
                        type: "spring",
                        stiffness: 350,
                        damping: 25
                      }
                    }}
                    onClick={() => handleParticipantClick(participant.wallet_address)}
                    onMouseEnter={() => onParticipantHover?.(participant.wallet_address)}
                    onMouseLeave={() => onParticipantHover?.(null)}
                  >
                  {/* Rank change glow effect */}
                  {rankChange !== 0 && (
                    <motion.div
                      className={`absolute inset-0 ${
                        rankChange > 0 
                          ? 'bg-gradient-to-r from-green-500/0 via-green-500/20 to-green-500/0' 
                          : 'bg-gradient-to-r from-red-500/0 via-red-500/20 to-red-500/0'
                      }`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1.5, times: [0, 0.5, 1] }}
                    />
                  )}

                  {/* Edge-to-edge profile picture background */}
                  <div className="absolute inset-0 overflow-hidden">
                    {/* Super admin background color - behind everything */}
                    {(participant.role === "superadmin" || participant.is_superadmin) && (
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-900/40 via-yellow-800/20 to-transparent" />
                    )}
                    
                    {participant.profile_image_url ? (
                      <div className="relative w-full h-full">
                      {/* Profile image - zoomed and fading to right */}
                      <img
                        src={getFullImageUrl(participant.profile_image_url)}
                        alt={participant.nickname}
                        className="absolute left-0 top-0 h-full w-32 object-cover scale-125"
                        style={{
                          maskImage: 'linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0) 100%)',
                          WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0) 100%)'
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          // Optionally add a fallback image or styling for broken images
                          target.style.opacity = '0.5';
                        }}
                      />
                      {/* Overlay for text readability */}
                      <div className="absolute inset-0 bg-dark-400/20" />
                    </div>
                  ) : (
                    <div className="absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-dark-400/60 to-transparent" />
                  )}
                </div>


                {/* Content overlay */}
                <div className="relative z-10 h-full flex flex-col">
                  {/* Main content area */}
                  <div className="flex-1 flex items-center px-4">
                    {/* Rank number positioned over the image */}
                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                      <motion.span 
                        className={`${getRankClass(position)} drop-shadow-lg`}
                        style={{
                          textShadow: '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.6)',
                          WebkitTextStroke: '1px rgba(0,0,0,0.5)'
                        }}
                        animate={rankChange !== 0 ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        #{position || (index + 1)}
                      </motion.span>
                      
                      {/* Rank change indicator */}
                      {rankChange !== 0 && (
                        <motion.div
                          className="flex items-center"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ duration: 0.3 }}
                        >
                          <span className={`text-sm font-bold ${
                            rankChange > 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {rankChange > 0 ? '↑' : '↓'}{Math.abs(rankChange)}
                          </span>
                        </motion.div>
                      )}
                    </div>

                    {/* User info - positioned after the image fade */}
                    <div className="ml-20 flex-1 flex items-center justify-between">
                      <div className="flex flex-col">
                        <div
                          className={`font-bold transition-colors ${
                            getUserNameColorWithFlair(participant)
                          }`}
                          style={{
                            fontSize: (participant.role === "superadmin" || participant.is_superadmin) ? "1.375rem" : "1.125rem",
                            textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
                            WebkitTextStroke: (participant.role === "superadmin" || participant.is_superadmin) ? '0.5px rgba(0,0,0,0.8)' : '0.3px rgba(0,0,0,0.6)'
                          }}
                        >
                          {participant.nickname}
                          {/* Level display - simple and clean */}
                          {participant.user_level && (
                            <span className="ml-2 text-sm text-brand-400/80 font-mono">
                              Lv{participant.user_level.level_number}
                            </span>
                          )}
                          {/* Status badges */}
                          {getUserRoleLabel(participant) && (
                            <span className={`ml-2 ${getRoleBadgeClasses(participant)}`}>
                              {getUserRoleLabel(participant)}
                            </span>
                          )}
                          {participant.flair && getFlairLabel(participant.flair) && (
                            <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-800/60 text-gray-300 border border-gray-600/50">
                              {getFlairLabel(participant.flair)}
                            </span>
                          )}
                          {participant.is_current_user && (
                            <span className="ml-2 text-xs bg-brand-500 text-white px-2 py-1 rounded-md font-black tracking-wide">YOU</span>
                          )}
                          {participant.is_ai_agent && (
                            <span className="ml-2 text-xs bg-cyan-500 text-white px-2 py-1 rounded-md font-black tracking-wide">AI</span>
                          )}
                        </div>

                      </div>

                      {/* Score display */}
                      {contestStatus !== "upcoming" && participant.performance_percentage !== undefined && (
                        <motion.div 
                          className="text-right"
                          animate={rankChange !== 0 ? { scale: [1, 1.1, 1] } : {}}
                          transition={{ duration: 0.3 }}
                        >
                          <div className={`text-lg font-bold ${
                            parseFloat(participant.performance_percentage || "0") >= 0 ? "text-green-400" : "text-red-400"
                          }`}>
                            {parseFloat(participant.performance_percentage || "0") >= 0 ? "+" : ""}{parseFloat(participant.performance_percentage || "0").toFixed(2)}%
                          </div>
                          {!showCompactView && participant.portfolio_value && (
                            <div className="text-xs text-gray-500">
                              {formatCurrency(participant.portfolio_value)}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </div>
                  
                  {/* In The Money Banner - Only show for winners */}
                  {hasPrize && (contestStatus === "live" || contestStatus === "completed") && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="bg-gradient-to-r from-yellow-500/20 via-yellow-400/30 to-yellow-500/20 px-4 border-t border-yellow-400/40">
                        <div className="flex items-center justify-end gap-3">
                          <span className="text-black font-bold text-sm uppercase tracking-wider">
                            In The Money
                          </span>
                          <div className="flex items-center gap-2 text-yellow-300 font-bold text-lg">
                            <span>{prize.toFixed(2)}</span>
                            <img 
                              src="/assets/media/logos/solana.svg" 
                              alt="SOL" 
                              className="w-4 h-4"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                                      )}
                  </div>
                  </motion.div>
                  
                  {/* Expandable Portfolio Tray */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-dark-300/30 border-x border-b border-dark-300/50 rounded-b-lg overflow-hidden"
                      >
                        <div className="p-4">
                          {/* Experience Section - Above Portfolio */}
                          {participant.user_level && (
                            <div className="mb-4 p-3 bg-gradient-to-r from-dark-400/50 to-dark-400/30 rounded-lg border border-dark-300/50">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-brand-400 font-black text-2xl">
                                      LV{participant.user_level.level_number}
                                    </span>
                                    <span className="text-gray-300 font-semibold">
                                      {participant.user_level.title}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {participant.total_contests_entered || 0} contests • {participant.contests_won || 0} wins
                                </div>
                              </div>
                              
                              {participant.experience_points !== undefined && (
                                <div className="relative">
                                  <div className="w-full h-6 bg-dark-500/50 rounded-full overflow-hidden border-2 border-dark-300">
                                    <div className="relative h-full">
                                      <div
                                        className="h-full bg-gradient-to-r from-brand-400 via-brand-500 to-brand-400 transition-all duration-500"
                                        style={{ width: `${Math.min((participant.experience_points % 1000) / 10, 100)}%` }}
                                      />
                                      {/* Animated shine effect */}
                                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                                    </div>
                                  </div>
                                  {/* XP text inside the bar */}
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xs font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                                      {participant.experience_points % 1000} / 1000 XP
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <h4 className="text-lg font-semibold text-gray-100 mb-3">
                            Portfolio Breakdown
                          </h4>
                          
                          {isLoadingPortfolio ? (
                            <div className="text-center py-4 text-gray-400">
                              <div className="animate-pulse">Loading portfolio...</div>
                            </div>
                          ) : portfolio === null ? (
                            <div className="text-center py-4 text-red-400">
                              <p>Failed to load portfolio data</p>
                            </div>
                          ) : portfolio && portfolio.portfolio ? (
                            <div>
                              {/* Portfolio Summary */}
                              <div className="mb-4 p-3 bg-dark-400/30 rounded-lg">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-400">Initial:</span>
                                    <span className="ml-2 font-semibold text-gray-100">
                                      {formatCurrency(portfolio.portfolio_summary.initial_value)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">Value:</span>
                                    <span className="ml-2 font-semibold text-gray-100">
                                      {formatCurrency(portfolio.portfolio_summary.current_value)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">P&L:</span>
                                    <span className={`ml-2 font-semibold ${
                                      portfolio.portfolio_summary.total_pnl_amount >= 0 ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                      {portfolio.portfolio_summary.total_pnl_amount >= 0 ? '+' : ''}
                                      {formatCurrency(portfolio.portfolio_summary.total_pnl_amount)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">Return:</span>
                                    <span className={`ml-2 font-semibold ${
                                      portfolio.portfolio_summary.total_pnl_percentage >= 0 ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                      {portfolio.portfolio_summary.total_pnl_percentage >= 0 ? '+' : ''}
                                      {portfolio.portfolio_summary.total_pnl_percentage.toFixed(2)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Token Holdings */}
                              <div className="space-y-2">
                                <h4 className="font-semibold text-gray-100 mb-2">Token Holdings</h4>
                                {portfolio.portfolio.map((holding: any) => (
                                  <div key={holding.token_id} className="flex items-center justify-between p-3 bg-dark-400/30 rounded-lg">
                                    <div className="flex items-center gap-3">
                                      <img 
                                        src={holding.token.image_url} 
                                        alt={holding.token.symbol}
                                        className="w-8 h-8 rounded-full"
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
                                      <div className="font-semibold text-gray-100">
                                        {formatCurrency(holding.current_value)}
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
                          ) : (
                            <div className="text-center py-4 text-gray-400">
                              <p>No portfolio data available for this participant</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      ) : searchQuery ? (
        <div className="text-center py-6">
          <div className="text-gray-400 mb-2">
            No participants match your search
          </div>
          <button
            onClick={() => setSearchQuery("")}
            className="px-4 py-2 bg-brand-500/20 text-brand-400 text-sm rounded-md hover:bg-brand-500/30 transition-colors"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            No duelers have entered yet
          </div>
          <div className="text-xs text-gray-500">
            Be the first to join this contest!
          </div>
        </div>
      )}
    </div>
  );
};