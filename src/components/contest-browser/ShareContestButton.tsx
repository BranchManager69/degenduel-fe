import React from 'react';
import { motion } from 'framer-motion';
import { ShareBlinkButton } from '../blinks';
import { ContestStatus } from '../../types';

interface ShareContestButtonProps {
  contestId: string;
  contestName: string;
  status: ContestStatus;
}

export const ShareContestButton: React.FC<ShareContestButtonProps> = ({ 
  contestId,
  contestName,
  status
}) => {
  // Determine the correct blink action based on contest status
  const getBlinkUrl = () => {
    switch (status) {
      case 'active':
        return '/blinks/view-contest'; // For active contests - view only
      case 'completed':
        return '/blinks/view-results'; // For completed contests - see results
      case 'pending':
      default:
        return '/blinks/join-contest'; // For pending contests - join
    }
  };

  // Get appropriate label based on status
  const getShareLabel = () => {
    switch (status) {
      case 'active':
        return 'Share Live';
      case 'completed':
        return 'Share Results';
      case 'pending':
      default:
        return 'Share Contest';
    }
  };

  return (
    <motion.div 
      className="inline-block"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
    >
      <ShareBlinkButton
        blinkUrl={getBlinkUrl()}
        params={{
          contestId,
          contestName,
          status // Include status so the receiver knows what to expect
        }}
        label={getShareLabel()}
        className="flex items-center space-x-2 text-sm px-3 py-2 bg-dark-300 hover:bg-dark-200 text-white rounded-md transition-colors duration-300 border border-purple-500/30"
        iconClassName="ml-2 w-4 h-4 text-purple-400"
      />
    </motion.div>
  );
};