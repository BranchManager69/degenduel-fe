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
  showViewToggle?: boolean;
  viewMode?: 'carousel' | 'list';
  onViewModeChange?: (mode: 'carousel' | 'list') => void;
  onAction1?: () => void;
  onAction2?: () => void;
}

export const ContestLobbyHeader: React.FC<ContestLobbyHeaderProps> = ({
  contest,
  participants,
  mousePosition,
  isHovering,
  onMouseMove,
  onMouseEnter,
  onMouseLeave,
  showViewToggle = false,
  viewMode = 'carousel',
  onViewModeChange,
  onAction1,
  onAction2,
}) => {
  const headerRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const contestImage = getContestImageUrl((contest as any).image_url || '');
  
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
      {/* Content Section - contained like detail page */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Breadcrumb navigation - inside the main container */}
          <div className="mb-4">
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
            className="relative rounded-lg mb-8 overflow-hidden group"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            onMouseMove={onMouseMove}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            {/* Contest Image with Parallax Effect - matching detail page */}
            {contestImage && (
              <div className="absolute inset-0 overflow-hidden rounded-lg">
                {/* Loading state */}
                {!imageLoaded && !imageError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-dark-300/70 z-10">
                    <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                
                {/* Background image with parallax */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0"
                >
                  <motion.div
                    style={{
                      width: "100%",
                      height: "100%",
                      transform: isHovering ? 
                        `scale(1.08) translateX(${mousePosition.x * 15}px) translateY(${mousePosition.y * 10}px)` : 
                        "scale(1.02)",
                      transition: "transform 0.3s ease-out"
                    }}
                  >
                    <img
                      src={contestImage}
                      alt={contest.name}
                      className="w-full h-full object-cover"
                      onLoad={() => setImageLoaded(true)}
                      onError={() => setImageError(true)}
                    />
                  </motion.div>
                  
                  {/* Gradient overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-200 via-dark-200/90 to-dark-200/60" />
                </motion.div>
              </div>
            )}
            
            {/* If no image or image error, show gradient background */}
            {(!contestImage || imageError) && (
              <div className="absolute inset-0 bg-gradient-to-br from-dark-200/80 to-dark-300/80" />
            )}
            
            {/* Banner Content - 30% shorter than detail page (196px instead of 280px) */}
            <div className="relative z-20 p-4 sm:p-6 md:p-8 min-h-[196px] flex flex-col justify-end">
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
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2 border border-brand-400/30">
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
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="text-gray-300">
                {participants.length} / {contest.settings?.maxParticipants || '∞'} Players
              </span>
            </div>
            
            {/* Timer */}
            {timeDisplay && (
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2">
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
            
            {/* Action Buttons */}
            <div className="ml-auto flex items-center gap-2">
              {/* View Toggle - only show if enabled */}
              {showViewToggle && (
                <>
                  {/* View Mode Toggle Button */}
                  <motion.button
                    onClick={() => onViewModeChange!(viewMode === 'carousel' ? 'list' : 'carousel')}
                    className="px-4 py-2 bg-dark-300/90 backdrop-blur-sm border border-dark-200 rounded-lg flex items-center gap-2 hover:bg-dark-200/90 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title={viewMode === 'carousel' ? 'Switch to List View' : 'Switch to Carousel View'}
                  >
                    {viewMode === 'carousel' ? (
                      <>
                        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        <span className="text-sm text-gray-300">List View</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-gray-300">Carousel View</span>
                      </>
                    )}
                  </motion.button>
                  
                  {/* Placeholder Action Button 1 */}
                  <motion.button
                    onClick={onAction1}
                    className="w-10 h-10 bg-dark-300/90 backdrop-blur-sm border border-dark-200 rounded-lg flex items-center justify-center hover:bg-dark-200/90 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-gray-400">?</span>
                  </motion.button>
                  
                  {/* Placeholder Action Button 2 */}
                  <motion.button
                    onClick={onAction2}
                    className="w-10 h-10 bg-dark-300/90 backdrop-blur-sm border border-dark-200 rounded-lg flex items-center justify-center hover:bg-dark-200/90 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-gray-400">?</span>
                  </motion.button>
                </>
              )}
              
              {/* Share Button */}
              <ShareContestButton
                contestId={contest.id.toString()}
                contestName={contest.name}
                prizePool={contest.prizePool || '0'}
              />
            </div>
          </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};