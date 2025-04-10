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
      className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-all duration-300 ${
        isShared 
          ? 'bg-purple-600/20 text-purple-300 border-purple-500/50' 
          : 'bg-dark-300 hover:bg-dark-200 text-white border-purple-500/30 hover:border-purple-500/50'
      } ${className}`}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      <span className="text-sm font-medium">
        {isShared ? 'Copied!' : getShareLabel()}
      </span>
      <svg 
        className="w-4 h-4 text-purple-400" 
        fill="currentColor" 
        viewBox="0 0 20 20"
      >
        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
      </svg>
    </motion.button>
  );
};