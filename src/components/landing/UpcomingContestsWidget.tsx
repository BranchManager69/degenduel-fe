import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap, ChevronRight, Users, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Contest } from '../../types';

interface UpcomingContestsWidgetProps {
  contests: Contest[];
  loading?: boolean;
}

interface ContestWithCountdown extends Contest {
  timeUntilStart: number;
  isStartingSoon: boolean;
}

export const UpcomingContestsWidget: React.FC<UpcomingContestsWidgetProps> = ({ 
  contests, 
  loading = false 
}) => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every second for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter and process contests starting within the next 3 hours
  const upcomingContests = useMemo<ContestWithCountdown[]>(() => {
    const threeHoursFromNow = currentTime + (3 * 60 * 60 * 1000);
    
    return contests
      .filter(contest => {
        if (!contest.start_time) return false;
        const startTime = new Date(contest.start_time).getTime();
        const isUpcoming = startTime > currentTime && startTime <= threeHoursFromNow;
        const isJoinable = contest.status === 'pending';
        return isUpcoming && isJoinable;
      })
      .map(contest => {
        const startTime = new Date(contest.start_time!).getTime();
        const timeUntilStart = startTime - currentTime;
        const isStartingSoon = timeUntilStart <= 30 * 60 * 1000; // Within 30 minutes
        
        return {
          ...contest,
          timeUntilStart,
          isStartingSoon
        };
      })
      .sort((a, b) => a.timeUntilStart - b.timeUntilStart)
      .slice(0, 3); // Show max 3 contests
  }, [contests, currentTime]);

  const formatTimeRemaining = (milliseconds: number): string => {
    if (milliseconds <= 0) return 'Starting now!';
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const handleQuickJoin = (contestId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate directly to the contest detail page where they can join
    navigate(`/contests/${contestId}`);
  };

  // Don't render if no upcoming contests
  if (!loading && upcomingContests.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        {/* Header with pulsing indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Zap className="w-6 h-6 text-yellow-400" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-white">
              Starting Soon
            </h3>
            <span className="text-sm text-gray-400 hidden sm:inline">
              Quick join contests starting within 3 hours
            </span>
          </div>
          <button
            onClick={() => navigate('/contests')}
            className="text-sm text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1"
          >
            View all
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Contest Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-dark-200/50 rounded-xl p-4 animate-pulse">
                <div className="h-6 bg-dark-300/50 rounded mb-3" />
                <div className="h-4 bg-dark-300/50 rounded w-2/3 mb-2" />
                <div className="h-8 bg-dark-300/50 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {upcomingContests.map((contest, index) => (
                <motion.div
                  key={contest.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  onClick={() => navigate(`/contests/${contest.id.toString()}`)}
                  className={`
                    relative bg-gradient-to-br cursor-pointer
                    ${contest.isStartingSoon 
                      ? 'from-yellow-900/30 to-orange-900/20 border-yellow-500/50' 
                      : 'from-dark-200/80 to-dark-300/50 border-dark-100/50'
                    }
                    border rounded-xl p-4 hover:scale-[1.02] transition-all duration-200
                    hover:shadow-xl hover:shadow-brand-500/10
                  `}
                >
                  {/* Urgency indicator for contests starting very soon */}
                  {contest.isStartingSoon && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-bounce">
                      Hurry!
                    </div>
                  )}

                  {/* Contest Name */}
                  <h4 className="text-lg font-bold text-white mb-2 truncate">
                    {contest.name}
                  </h4>

                  {/* Contest Info */}
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{contest.participant_count || 0}/{contest.max_participants || '∞'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      <span className="text-green-400">{contest.entry_fee || 0} SOL</span>
                    </div>
                  </div>

                  {/* Countdown Timer */}
                  <div className={`
                    flex items-center justify-between p-3 rounded-lg
                    ${contest.isStartingSoon ? 'bg-yellow-900/20' : 'bg-dark-400/30'}
                  `}>
                    <div className="flex items-center gap-2">
                      <Clock className={`w-4 h-4 ${contest.isStartingSoon ? 'text-yellow-400' : 'text-gray-400'}`} />
                      <span className="text-sm text-gray-300">Starts in:</span>
                    </div>
                    <span className={`
                      font-mono font-bold text-lg
                      ${contest.isStartingSoon ? 'text-yellow-300' : 'text-white'}
                    `}>
                      {formatTimeRemaining(contest.timeUntilStart)}
                    </span>
                  </div>

                  {/* Quick Join Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => handleQuickJoin(contest.id.toString(), e)}
                    className={`
                      w-full mt-3 py-2 px-4 rounded-lg font-bold transition-all duration-200
                      ${contest.isStartingSoon
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-dark-900'
                        : 'bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white'
                      }
                      shadow-lg hover:shadow-xl
                    `}
                  >
                    Quick Join →
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Empty state for when no contests are starting soon */}
        {!loading && upcomingContests.length === 0 && (
          <div className="text-center py-8 bg-dark-200/30 rounded-xl border border-dark-100/50">
            <Clock className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">No contests starting in the next 3 hours</p>
            <button
              onClick={() => navigate('/contests')}
              className="mt-4 text-brand-400 hover:text-brand-300 transition-colors text-sm font-medium"
            >
              Browse all contests →
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};