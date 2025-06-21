import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { getContestImageUrl } from '../../lib/imageUtils';
import { CountdownTimer } from '../ui/CountdownTimer';
import { ShareContestButton } from './ShareContestButton';
import { formatCurrency } from '../../lib/utils';
import { ContestDetails } from '../../types';

interface ContestLobbyHeaderProps {
  contest: ContestDetails;
  participants: any[];
  mousePosition: { x: number; y: number };
  isHovering: boolean;
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export const ContestLobbyHeader: React.FC<ContestLobbyHeaderProps> = ({
  contest,
  participants,
  mousePosition,
  isHovering,
  onMouseMove,
  onMouseEnter,
  onMouseLeave,
}) => {
  const headerRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const contestImage = getContestImageUrl('');
  
  // Calculate time until start/end
  const getTimeDisplay = () => {
    // const now = new Date();
    const startTime = new Date(contest.startTime || (contest as any).start_time);
    const endTime = new Date(contest.endTime || (contest as any).end_time);
    
    if (contest.status === 'pending') {
      return {
        label: 'Starts in',
        time: startTime
      };
    } else if (contest.status === 'active') {
      return {
        label: 'Ends in',
        time: endTime
      };
    }
    
    return null;
  };
  
  const timeDisplay = getTimeDisplay();
  
  return (
    <>
      {/* Breadcrumb navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="flex items-center text-sm text-gray-400">
          <a href="/" className="hover:text-brand-400 transition-colors">
            Home
          </a>
          <span className="mx-2">›</span>
          <a href="/contests" className="hover:text-brand-400 transition-colors">
            Contests
          </a>
          <span className="mx-2">›</span>
          <span className="text-gray-300">{contest.name}</span>
        </div>
      </div>
      
      <motion.div
        ref={headerRef}
        className="relative w-full h-80 sm:h-96 overflow-hidden bg-gradient-to-br from-dark-200 to-dark-300 group"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        onMouseMove={onMouseMove}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
      {/* Background Image with Parallax */}
      <motion.div
        className="absolute inset-0 z-0"
        animate={{
          x: isHovering ? mousePosition.x * 0.02 : 0,
          y: isHovering ? mousePosition.y * 0.02 : 0,
          scale: isHovering ? 1.05 : 1,
        }}
        transition={{ type: "spring", stiffness: 150, damping: 30 }}
      >
        {contestImage && !imageError ? (
          <>
            <img
              src={contestImage}
              alt={contest.name}
              className={`w-full h-full object-cover transition-opacity duration-500 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
            {/* Gradient overlays for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-dark-100/95 via-dark-100/50 to-dark-100/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-dark-100/60 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/20 to-purple-500/20">
            <div className="absolute inset-0 bg-gradient-to-t from-dark-100/95 via-dark-100/50 to-dark-100/20" />
          </div>
        )}
      </motion.div>
      
      {/* Animated gradient effects */}
      <div className="absolute inset-0 opacity-30 mix-blend-overlay">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/20 to-brand-400/0 animate-data-stream" />
      </div>
      
      {/* Content Container with Parallax */}
      <motion.div
        className="relative z-10 h-full flex flex-col justify-end p-6 sm:p-8 lg:p-12"
        animate={{
          x: isHovering ? mousePosition.x * -0.01 : 0,
          y: isHovering ? mousePosition.y * -0.01 : 0,
        }}
        transition={{ type: "spring", stiffness: 200, damping: 30 }}
      >
        <div className="max-w-7xl mx-auto w-full">
          {/* Status Badge with glow effect */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-4"
          >
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm ${
              contest.status === 'active'
                ? 'bg-green-500/20 text-green-300 border border-green-400/30 shadow-[0_0_20px_rgba(34,197,94,0.5)]'
                : contest.status === 'pending'
                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30 shadow-[0_0_20px_rgba(234,179,8,0.5)]'
                  : contest.status === 'completed'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                    : 'bg-red-500/20 text-red-300 border border-red-400/30'
            }`}>
              <span className={`mr-2 w-2 h-2 rounded-full ${
                contest.status === 'active'
                  ? 'bg-green-400 animate-pulse'
                  : contest.status === 'pending'
                    ? 'bg-yellow-400 animate-pulse'
                    : contest.status === 'completed'
                      ? 'bg-blue-400'
                      : 'bg-red-400'
              }`} />
              {contest.status === 'active' ? 'LIVE' : contest.status.toUpperCase()}
            </span>
          </motion.div>
          
          {/* Contest Title with gradient text */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent"
          >
            {contest.name}
          </motion.h1>
          
          {/* Contest Info Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center gap-6 text-lg"
          >
            {/* Prize Pool with animated shimmer */}
            <div className="flex items-center gap-2 bg-dark-100/60 backdrop-blur-sm rounded-lg px-4 py-2 border border-brand-400/30">
              <span className="text-gray-300">Prize Pool:</span>
              <motion.span
                className="font-bold text-brand-300 relative"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                {formatCurrency(parseFloat(contest.prizePool || '0'))}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-400/50 to-transparent animate-shimmer" />
              </motion.span>
            </div>
            
            {/* Participants Count */}
            <div className="flex items-center gap-2 bg-dark-100/60 backdrop-blur-sm rounded-lg px-4 py-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="text-gray-300">
                {participants.length} / {contest.settings?.maxParticipants || '∞'} Players
              </span>
            </div>
            
            {/* Timer */}
            {timeDisplay && (
              <div className="flex items-center gap-2 bg-dark-100/60 backdrop-blur-sm rounded-lg px-4 py-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-300">{timeDisplay.label}</span>
                <div className="font-mono text-white">
                  <CountdownTimer
                    targetDate={timeDisplay.time}
                    showSeconds={true}
                  />
                </div>
              </div>
            )}
            
            {/* Share Button */}
            <ShareContestButton
              contestId={contest.id.toString()}
              contestName={contest.name}
              prizePool={contest.prizePool || '0'}
              className="ml-auto"
            />
          </motion.div>
        </div>
      </motion.div>
      
      {/* Bottom gradient fade for smooth transition */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dark-100 to-transparent z-20" />
    </motion.div>
    </>
  );
};