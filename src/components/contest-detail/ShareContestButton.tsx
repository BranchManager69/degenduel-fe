import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Contest } from '../../types';

interface ShareContestButtonProps {
  contest: Contest;
  className?: string;
  contestStatus: 'upcoming' | 'live' | 'ended';
}

export const ShareContestButton: React.FC<ShareContestButtonProps> = ({ 
  contest,
  className = '',
  contestStatus
}) => {
  const [isShared, setIsShared] = useState(false);
  
  const getShareLabel = () => {
    switch (contestStatus) {
      case 'live':
        return 'Share Live';
      case 'ended':
        return 'Share Results';
      case 'upcoming':
      default:
        return 'Share Contest';
    }
  };
  
  const handleShare = async () => {
    // Create a shareable blink URL for this contest
    const contestId = contest.id.toString();
    const contestName = contest.name;
    
    // Build the URL based on contest status
    const blinkPath = 
      contestStatus === "upcoming" ? "/blinks/join-contest" :
      contestStatus === "live" ? "/blinks/view-contest" :
      "/blinks/view-results";
    
    // Create the full URL
    const fullUrl = `${window.location.origin}${blinkPath}?contestId=${contestId}&contestName=${encodeURIComponent(contestName)}`;
    
    // Try to use the native share API if available (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `DegenDuel: ${contestName}`,
          text: contestStatus === "upcoming" 
            ? `Join this contest on DegenDuel: ${contestName}` 
            : contestStatus === "live"
            ? `Check out this live contest on DegenDuel: ${contestName}`
            : `See the results of this contest on DegenDuel: ${contestName}`,
          url: fullUrl
        });
        
        // Do not set shared status for native sharing
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fall back to clipboard
      try {
        await navigator.clipboard.writeText(fullUrl);
        // Show copied state
        setIsShared(true);
        setTimeout(() => setIsShared(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  return (
    <motion.button
      onClick={handleShare}
      className={`relative flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all duration-300 font-medium overflow-hidden group ${
        isShared 
          ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-400/60 shadow-lg shadow-green-500/20' 
          : 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-200 border-purple-400/60 hover:border-purple-300/80 shadow-lg hover:shadow-purple-500/20'
      } ${className}`}
      whileHover={{ scale: 1.05, y: -1 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Animated background gradient */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
        !isShared ? 'bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10' : ''
      }`} />
      
      {/* Content */}
      <div className="relative flex items-center gap-2">
        <span className="text-sm font-semibold">
          {isShared ? '✓ Copied!' : getShareLabel()}
        </span>
        
        {isShared ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-4 h-4"
          >
            <svg 
              className="w-4 h-4 text-green-400" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </motion.div>
        ) : (
          <motion.div
            whileHover={{ rotate: 15 }}
            className="w-4 h-4"
          >
            <svg 
              className="w-4 h-4 text-purple-300 group-hover:text-purple-200" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
          </motion.div>
        )}
      </div>
      
      {/* Subtle shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
    </motion.button>
  );
};