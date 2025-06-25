import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useMemo, useRef, useState } from "react";

import axiosInstance from '../../lib/axiosInstance';
// Removed unused import: formatCurrency
import { getFullImageUrl } from "../../utils/profileImageUtils";

// Same interface as ParticipantsList
interface Participant {
  wallet_address: string;
  nickname: string;
  profile_image_url?: string | null;
  
  // Contest performance data
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

interface HorizontalParticipantsListProps {
  participants: Participant[];
  contestStatus?: "upcoming" | "live" | "completed";
  prizePool?: number;
  contestId?: string;
  maxHeight?: string; // Allow customizing height
}

export const HorizontalParticipantsList: React.FC<HorizontalParticipantsListProps> = ({
  participants,
  contestStatus = "upcoming",
  prizePool = 0,
  contestId,
  maxHeight = "400px"
}) => {
  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null);
  const [portfolioData, setPortfolioData] = useState<Record<string, any>>({});
  const [loadingPortfolio, setLoadingPortfolio] = useState<Record<string, boolean>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Track previous ranks for animation
  const [previousRanks, setPreviousRanks] = useState<Map<string, number>>(new Map());
  const [rankChanges, setRankChanges] = useState<Map<string, number>>(new Map());
  const isFirstRender = useRef(true);

  // Sort participants with tied rank system (same logic as vertical)
  const sortedParticipants = useMemo(() => {
    if (contestStatus === "upcoming") {
      return [...participants].sort((a, b) => {
        if (a.is_ai_agent && !b.is_ai_agent) return 1;
        if (b.is_ai_agent && !a.is_ai_agent) return -1;
        
        if (a.user_level && b.user_level) {
          const levelDiff = b.user_level.level_number - a.user_level.level_number;
          if (levelDiff !== 0) return levelDiff;
        }
        
        return (b.experience_points || 0) - (a.experience_points || 0);
      });
    }

    // For live/completed contests, implement tied-rank system
    const sortedByPerformance = [...participants].sort((a, b) => {
      const aValue = parseFloat(a.portfolio_value || '0');
      const bValue = parseFloat(b.portfolio_value || '0');
      if (aValue !== bValue) {
        return bValue - aValue;
      }
      
      const aPerf = parseFloat(a.performance_percentage || '0');
      const bPerf = parseFloat(b.performance_percentage || '0');
      if (aPerf !== bPerf) {
        return bPerf - aPerf;
      }
      
      return a.wallet_address.localeCompare(b.wallet_address);
    });

    // Calculate tied ranks
    const participantsWithTiedRanks: (Participant & { displayRank: string; calculatedRank: number })[] = [];
    let currentRank = 1;
    
    for (let i = 0; i < sortedByPerformance.length; i++) {
      const current = sortedByPerformance[i];
      const currentScore = `${current.portfolio_value}_${current.performance_percentage}`;
      
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
      
      const displayRank = tiedGroup.length > 1 ? `T-${currentRank}` : currentRank.toString();
      tiedGroup.forEach(participant => {
        participantsWithTiedRanks.push({
          ...participant,
          displayRank,
          calculatedRank: currentRank
        });
      });
      
      currentRank += tiedGroup.length;
      i = j - 1;
    }
    
    return participantsWithTiedRanks;
  }, [participants, contestStatus]);

  // Calculate prize distribution
  const prizeMap = useMemo(() => {
    if (contestStatus === "upcoming" || !prizePool || !sortedParticipants.length) {
      return new Map();
    }

    const prizePercentages = [0.69, 0.20, 0.11];
    const paidPositions = 3;
    const prizes = new Map<string, number>();
    
    let currentPosition = 1;
    let i = 0;
    
    while (i < sortedParticipants.length && currentPosition <= paidPositions) {
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
      const paidSlotsForGroup = Math.min(tiedCount, paidPositions - currentPosition + 1);
      
      if (paidSlotsForGroup > 0) {
        let totalPrizePercentage = 0;
        for (let k = 0; k < paidSlotsForGroup; k++) {
          const prizeIndex = currentPosition - 1 + k;
          if (prizeIndex < prizePercentages.length) {
            totalPrizePercentage += prizePercentages[prizeIndex];
          }
        }
        
        const prizePerParticipant = (prizePool * totalPrizePercentage) / tiedCount;
        
        tiedGroup.forEach(participant => {
          prizes.set(participant.wallet_address, prizePerParticipant);
        });
      }
      
      currentPosition += tiedCount;
      i = j;
    }
    
    return prizes;
  }, [sortedParticipants, contestStatus, prizePool]);

  // Track rank changes
  useEffect(() => {
    if (contestStatus === "upcoming" || isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const newRankChanges = new Map<string, number>();
    
    sortedParticipants.forEach((participant) => {
      const currentRank = 'calculatedRank' in participant ? (participant as any).calculatedRank : 0;
      const previousRank = previousRanks.get(participant.wallet_address);
      
      if (previousRank !== undefined && previousRank !== currentRank) {
        newRankChanges.set(participant.wallet_address, previousRank - currentRank);
      }
    });

    setRankChanges(newRankChanges);
    
    const newPreviousRanks = new Map<string, number>();
    sortedParticipants.forEach((p) => {
      const rank = 'calculatedRank' in p ? (p as any).calculatedRank : 0;
      newPreviousRanks.set(p.wallet_address, rank);
    });
    setPreviousRanks(newPreviousRanks);

    const timer = setTimeout(() => {
      setRankChanges(new Map());
    }, 2000);

    return () => clearTimeout(timer);
  }, [sortedParticipants, contestStatus]);

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

  const handleParticipantClick = (walletAddress: string) => {
    if (expandedParticipant === walletAddress) {
      setExpandedParticipant(null);
    } else {
      setExpandedParticipant(walletAddress);
      fetchPortfolioData(walletAddress);
    }
  };

  // Get rank styling
  const getRankClass = (position?: number | string) => {
    const numericRank = typeof position === 'string' 
      ? parseInt(position.replace('T-', '')) 
      : position;
      
    if (numericRank === 1) return "text-yellow-400";
    if (numericRank === 2) return "text-gray-300";
    if (numericRank === 3) return "text-orange-400";
    return "text-gray-400";
  };

  // Get card border color based on rank
  const getCardBorderClass = (position?: number | string) => {
    const numericRank = typeof position === 'string' 
      ? parseInt(position.replace('T-', '')) 
      : position;
      
    if (numericRank === 1) return "border-yellow-400/50";
    if (numericRank === 2) return "border-gray-300/50";
    if (numericRank === 3) return "border-orange-400/50";
    return "border-dark-300/50";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
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

      {/* Horizontal scrolling container */}
      <div className="relative">
        {/* Scroll indicators */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-dark-200 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-dark-200 to-transparent z-10 pointer-events-none" />
        
        <div 
          ref={scrollContainerRef}
          className="overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-dark-300 scrollbar-track-transparent"
          style={{ maxHeight }}
        >
          <motion.div 
            className="flex gap-4 px-4 py-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <AnimatePresence mode="popLayout">
              {sortedParticipants.map((participant, index) => {
                const position: string | number | undefined = contestStatus !== "upcoming" && 'displayRank' in participant 
                  ? (participant as any).displayRank 
                  : (contestStatus !== "upcoming" ? index + 1 : undefined);
                const rankChange = rankChanges.get(participant.wallet_address) || 0;
                const prize = prizeMap.get(participant.wallet_address) || 0;
                const hasPrize = prize > 0;
                const isExpanded = expandedParticipant === participant.wallet_address;
                
                return (
                  <motion.div
                    key={participant.wallet_address}
                    layoutId={participant.wallet_address}
                    className={`relative flex-shrink-0 ${isExpanded ? 'w-80' : 'w-72'} h-80 transition-all duration-300`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div 
                      className={`h-full bg-dark-300/20 backdrop-blur-sm rounded-lg border-2 ${getCardBorderClass(position)} overflow-hidden cursor-pointer hover:bg-dark-300/40 transition-all group ${
                        hasPrize ? 'shadow-lg shadow-yellow-400/20' : ''
                      }`}
                      onClick={() => handleParticipantClick(participant.wallet_address)}
                    >
                      {/* Rank change glow */}
                      {rankChange !== 0 && (
                        <motion.div
                          className={`absolute inset-0 ${
                            rankChange > 0 
                              ? 'bg-gradient-to-b from-green-500/20 to-transparent' 
                              : 'bg-gradient-to-b from-red-500/20 to-transparent'
                          }`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 1.5, times: [0, 0.5, 1] }}
                        />
                      )}

                      {/* Card Content */}
                      <div className="relative h-full">
                        {/* Full card background - either profile image or gradient */}
                        <div className="absolute inset-0">
                          {participant.profile_image_url ? (
                            <>
                              <img
                                src={getFullImageUrl(participant.profile_image_url)}
                                alt={participant.nickname}
                                className="absolute inset-0 w-full h-full object-cover scale-110"
                                style={{
                                  maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.1) 100%)',
                                  WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.1) 100%)'
                                }}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.opacity = '0.5';
                                }}
                              />
                              <div className="absolute inset-0 bg-dark-400/40" />
                            </>
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-dark-400/80 via-dark-400/60 to-dark-400/40" />
                          )}
                        </div>
                        
                        <div className="relative h-full flex flex-col p-4">
                          {/* Top section with rank and badges */}
                          <div className="flex items-start justify-between mb-4">
                            {/* Rank with text stroke */}
                            <div className="flex items-center gap-2">
                              <motion.span 
                                className={`${getRankClass(position)} font-black text-2xl tracking-wider`}
                                style={{
                                  textShadow: '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.6)',
                                  WebkitTextStroke: '1px rgba(0,0,0,0.5)'
                                }}
                                animate={rankChange !== 0 ? { scale: [1, 1.2, 1] } : {}}
                                transition={{ duration: 0.3 }}
                              >
                                #{position || (index + 1)}
                              </motion.span>
                              
                              {rankChange !== 0 && (
                                <motion.span
                                  className={`text-sm font-bold ${
                                    rankChange > 0 ? 'text-green-400' : 'text-red-400'
                                  }`}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 10 }}
                                >
                                  {rankChange > 0 ? '↑' : '↓'}{Math.abs(rankChange)}
                                </motion.span>
                              )}
                            </div>

                            {/* Status badges */}
                            <div className="flex flex-col gap-1">
                              {participant.is_current_user && (
                                <span className="text-xs bg-brand-500 text-white px-2 py-1 rounded-md font-black">YOU</span>
                              )}
                              {participant.is_ai_agent && (
                                <span className="text-xs bg-cyan-500 text-white px-2 py-1 rounded-md font-black">AI</span>
                              )}
                            </div>
                          </div>

                          {/* User info - expand to fill space */}
                          <div className="flex-1 flex flex-col justify-center">
                            <h4 className={`font-bold text-xl truncate mb-2 ${
                              participant.is_current_user ? "text-brand-400" :
                              participant.is_ai_agent ? "text-cyan-400" :
                              position === 'T-1' || position === '1' ? "text-yellow-300" :
                              position === 'T-2' || position === '2' ? "text-gray-100" :
                              position === 'T-3' || position === '3' ? "text-orange-300" :
                              "text-gray-100"
                            }`}>
                              {participant.nickname}
                            </h4>
                            
                            {participant.user_level && (
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-sm text-brand-400 font-bold">
                                  LV.{participant.user_level.level_number}
                                </span>
                                <span className="text-xs text-gray-300 truncate">
                                  {participant.user_level.title}
                                </span>
                              </div>
                            )}

                            {/* Performance stats - no labels */}
                            {contestStatus !== "upcoming" && participant.performance_percentage !== undefined && (
                              <div className="space-y-1">
                                <motion.div 
                                  className={`text-2xl font-bold ${
                                    parseFloat(participant.performance_percentage || "0") >= 0 ? "text-green-400" : "text-red-400"
                                  }`}
                                  animate={rankChange !== 0 ? { scale: [1, 1.1, 1] } : {}}
                                  transition={{ duration: 0.3 }}
                                >
                                  {parseFloat(participant.performance_percentage || "0") >= 0 ? "+" : ""}{parseFloat(participant.performance_percentage || "0").toFixed(2)}%
                                </motion.div>
                                
                                {participant.portfolio_value && (
                                  <div className="flex items-center gap-1 text-lg font-medium text-gray-200">
                                    <span>{parseFloat(participant.portfolio_value).toFixed(2)}</span>
                                    <img 
                                      src="/assets/media/logos/solana.svg" 
                                      alt="SOL" 
                                      className="w-4 h-4"
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                      
                      {/* Prize section - positioned at bottom */}
                      {hasPrize && (contestStatus === "live" || contestStatus === "completed") && (
                        <motion.div 
                          className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-yellow-500/30 via-yellow-400/40 to-yellow-500/30 backdrop-blur-sm border-t-2 border-yellow-400/60"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <div className="px-4 py-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-black uppercase tracking-wider text-black drop-shadow-lg">
                                In The Money
                              </span>
                              <div className="flex items-center gap-1 font-bold text-xl text-yellow-300 drop-shadow-lg">
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

                    {/* Expandable portfolio (shown below the card) */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          transition={{ duration: 0.3 }}
                          className="bg-dark-300/50 border-2 border-dark-300 rounded-lg overflow-hidden"
                        >
                          <div className="p-4">
                            <h5 className="font-semibold text-gray-100 mb-2">Portfolio</h5>
                            {loadingPortfolio[participant.wallet_address] ? (
                              <div className="text-center py-4 text-gray-400">
                                <div className="animate-pulse">Loading...</div>
                              </div>
                            ) : portfolioData[participant.wallet_address] === null ? (
                              <div className="text-center py-4 text-red-400">
                                <p className="text-sm">Failed to load</p>
                              </div>
                            ) : portfolioData[participant.wallet_address]?.portfolio ? (
                              <div className="space-y-2">
                                {portfolioData[participant.wallet_address].portfolio.slice(0, 3).map((holding: any) => (
                                  <div key={holding.token_id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <img 
                                        src={holding.token.image_url} 
                                        alt={holding.token.symbol}
                                        className="w-6 h-6 rounded-full"
                                      />
                                      <span className="text-sm font-medium text-gray-200">
                                        {holding.token.symbol}
                                      </span>
                                    </div>
                                    <span className={`text-sm font-medium ${
                                      holding.pnl_percentage >= 0 ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                      {holding.pnl_percentage >= 0 ? '+' : ''}{holding.pnl_percentage.toFixed(1)}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-4 text-gray-400">
                                <p className="text-sm">No data</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
};