import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { formatCurrency } from "../../lib/utils";
import { getFullImageUrl } from "../../utils/profileImageUtils";
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
}

// No longer needed - all data comes from the API now
// interface EnhancedParticipant extends Participant {
//   isLoading?: boolean;
// }


export const ParticipantsList: React.FC<ParticipantsListProps> = ({
  participants,
  contestStatus = "upcoming",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setSelectedUser] = useState<any>(null);
  const [showCompactView] = useState(false);
  
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
    
    return [...filteredParticipants].sort((a, b) => {
      // For live/completed contests, sort by rank (performance-based)
      if (contestStatus !== "upcoming" && a.rank !== undefined && b.rank !== undefined) {
        return a.rank - b.rank;
      }
      
      // AI agents last for upcoming contests only
      if (contestStatus === "upcoming") {
        if (a.is_ai_agent && !b.is_ai_agent) return 1;
        if (b.is_ai_agent && !a.is_ai_agent) return -1;
      }
      
      // For upcoming contests, sort by user level then experience
      if (a.user_level && b.user_level) {
        const levelDiff = b.user_level.level_number - a.user_level.level_number;
        if (levelDiff !== 0) return levelDiff;
      }
      
      return (b.experience_points || 0) - (a.experience_points || 0);
    });
  }, [filteredParticipants, contestStatus]);

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

  // Get rank styling - maximum impact
  const getRankClass = (position?: number) => {
    if (position === 1) return "text-yellow-400 font-black text-2xl tracking-wider";
    if (position === 2) return "text-gray-300 font-black text-2xl tracking-wider";
    if (position === 3) return "text-orange-400 font-black text-2xl tracking-wider";
    return "text-gray-300 font-black text-lg tracking-wide";
  };

  // Enhanced row styling
  const getParticipantRowClass = () => {
    const baseClass = "relative h-16 rounded-lg transition-all duration-300 group overflow-hidden";
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
              const position = contestStatus !== "upcoming" ? index + 1 : undefined;
              const rankChange = rankChanges.get(participant.wallet_address) || 0;
              
              return (
                <motion.div
                  key={participant.wallet_address}
                  layoutId={participant.wallet_address}
                  layout="position"
                  variants={itemVariants}
                  className={getParticipantRowClass()}
                  style={{ 
                    willChange: 'transform',
                    position: 'relative',
                    zIndex: rankChange > 0 ? 10 : 1 
                  }}
                  transition={{
                    layout: {
                      type: "spring",
                      stiffness: 350,
                      damping: 25
                    }
                  }}
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
                <div className="relative z-10 h-full flex items-center px-4">
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
                      #{position || index + 1}
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
                      <Link
                        to={`/profile/${participant.wallet_address}`}
                        className={`text-lg font-bold transition-colors hover:text-brand-400 ${
                          participant.is_current_user ? "text-brand-400" :
                          participant.is_ai_agent ? "text-cyan-400" :
                          position === 1 ? "text-yellow-300" :
                          position === 2 ? "text-gray-100" :
                          position === 3 ? "text-orange-300" :
                          "text-gray-100"
                        }`}
                      >
                        {participant.nickname}
                        {/* Status badges */}
                        {participant.is_current_user && (
                          <span className="ml-2 text-xs bg-brand-500 text-white px-2 py-1 rounded-md font-black tracking-wide">YOU</span>
                        )}
                        {participant.is_ai_agent && (
                          <span className="ml-2 text-xs bg-cyan-500 text-white px-2 py-1 rounded-md font-black tracking-wide">AI</span>
                        )}
                      </Link>

                      {/* Enhanced level display */}
                      {participant.user_level && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-brand-400 font-bold tracking-wide">
                            LV.{participant.user_level.level_number}
                          </span>
                          <span className="text-sm text-gray-300 font-medium">
                            {participant.user_level.title}
                          </span>
                          {!showCompactView && participant.experience_points && (
                            <div className="w-16 h-1.5 bg-dark-400 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-brand-400 to-brand-500 transition-all duration-500 shadow-sm"
                                style={{ width: `${Math.min((participant.experience_points % 1000) / 10, 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      )}
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
                </motion.div>
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