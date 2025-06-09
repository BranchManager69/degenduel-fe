import React from 'react';
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
  // const getShareLabel = () => {
  //   switch (status) {
  //     case 'active':
  //       return 'Share Live';
  //     case 'completed':
  //       return 'Share Results';
  //     case 'pending':
  //     default:
  //       return 'Share Contest';
  //   }
  // };

  return (
    <div className="relative group">
      <button
        onClick={() => {
          // Create a temporary button element to trigger ShareBlinkButton
          const tempButton = document.createElement('button');
          tempButton.style.display = 'none';
          document.body.appendChild(tempButton);
          
          // Use the share logic directly
          const fullBlinkUrl = new URL(getBlinkUrl(), window.location.origin);
          Object.entries({ contestId, contestName, status }).forEach(([key, value]) => {
            fullBlinkUrl.searchParams.append(key, value);
          });
          
          if (navigator.share) {
            navigator.share({
              title: 'DegenDuel Contest',
              text: `Check out ${contestName} on DegenDuel!`,
              url: fullBlinkUrl.toString()
            }).catch(console.error);
          } else {
            navigator.clipboard.writeText(fullBlinkUrl.toString());
          }
          
          document.body.removeChild(tempButton);
        }}
        className="
          w-8 h-8 flex-shrink-0 relative overflow-hidden 
          bg-dark-200/40 backdrop-blur-sm hover:bg-dark-200/60
          border border-dark-300/80 hover:border-brand-500/40
          transition-all duration-300 rounded-lg
          font-cyber tracking-wide
        "
      >
        {/* Subtle gradient background on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-500/0 via-brand-500/5 to-brand-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Very subtle border glow */}
        <div className="absolute -inset-[1px] rounded-lg blur-sm bg-gradient-to-r from-brand-500/0 via-brand-500/20 to-brand-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Button content - icon only */}
        <div className="relative flex items-center justify-center">
          <svg 
            className="w-4 h-4 text-gray-400 group-hover:text-brand-400 transition-colors duration-300" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
          </svg>
        </div>
        
        {/* Subtle shine effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-out" />
      </button>
    </div>
  );
};