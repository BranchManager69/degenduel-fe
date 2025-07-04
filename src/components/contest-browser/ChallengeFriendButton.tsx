import React from "react";
import { ChallengeCreationModal } from "./ChallengeCreationModal";

interface ChallengeFriendButtonProps {
  onChallengeCreated?: () => void;
  className?: string;
  userRole: 'admin' | 'user';
  availableCredits?: number;
}

export const ChallengeFriendButton: React.FC<ChallengeFriendButtonProps> = ({
  onChallengeCreated,
  className = "",
  userRole,
  availableCredits,
}) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleChallengeSuccess = () => {
    setIsModalOpen(false);
    onChallengeCreated?.();
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        className={`group relative px-4 py-2 bg-gradient-to-br from-amber-950/90 via-orange-950/80 to-yellow-950/90 border-2 border-amber-700/40 rounded-xl hover:border-amber-500/80 hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300 overflow-hidden backdrop-blur-sm sm:scale-100 scale-75 ${className}`}
      >
        {/* Dynamic battle arena background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500">
            {/* Battle arena grid */}
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Arena boundary lines */}
              <rect x="10" y="10" width="80" height="80" fill="none" stroke="#d97706" strokeWidth="0.5" strokeDasharray="3,3" className="animate-pulse" />
              <rect x="20" y="20" width="60" height="60" fill="none" stroke="#ea580c" strokeWidth="0.3" strokeDasharray="2,2" className="animate-pulse animation-delay-300" />
              {/* Center combat zone */}
              <circle cx="50" cy="50" r="15" fill="none" stroke="#d97706" strokeWidth="0.8" className="animate-ping" />
              <circle cx="50" cy="50" r="8" fill="none" stroke="#f97316" strokeWidth="0.5" className="animate-pulse animation-delay-500" />
              {/* Diagonal clash lines */}
              <line x1="30" y1="30" x2="70" y2="70" stroke="#d97706" strokeWidth="0.4" className="animate-pulse animation-delay-200" />
              <line x1="70" y1="30" x2="30" y2="70" stroke="#d97706" strokeWidth="0.4" className="animate-pulse animation-delay-400" />
            </svg>
            {/* Spark effects */}
            <div className="absolute inset-0">
              <div className="absolute top-1/4 left-1/3 w-1 h-1 bg-orange-400 rounded-full animate-twinkle" />
              <div className="absolute bottom-1/4 right-1/3 w-1 h-1 bg-red-400 rounded-full animate-twinkle animation-delay-700" />
            </div>
          </div>
        </div>
        
        {/* Combat heat overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-600/0 via-orange-500/0 to-yellow-600/0 group-hover:from-amber-600/5 group-hover:via-orange-500/3 group-hover:to-yellow-600/5 mix-blend-screen transition-all duration-500" />
        
        {/* Content */}
        <div className="relative flex items-center gap-3">
          {/* Combat swords with arena glow */}
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-600 rounded-full blur-lg opacity-30 group-hover:opacity-60 group-hover:scale-105 transition-all duration-300" />
            <span className="relative text-2xl filter group-hover:drop-shadow-[0_0_8px_rgba(217,119,6,0.8)] group-hover:animate-pulse">⚔️</span>
          </div>
          
          <div className="flex flex-col items-start">
            <span className="text-xs text-amber-300/80 group-hover:text-amber-200 transition-colors uppercase tracking-wider font-medium whitespace-nowrap">
              1v1 Combat
            </span>
            <span className="font-black text-gray-100 text-lg -mt-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-amber-300 group-hover:via-orange-300 group-hover:to-yellow-300 transition-all duration-300 whitespace-nowrap">
              CHALLENGE DUEL
            </span>
          </div>
          
          {/* Combat indicator */}
          <div className="ml-auto flex items-center">
            <span className="text-xs text-amber-300 font-mono tracking-wider">1v1</span>
          </div>
        </div>
        
        {/* Subtle border glow */}
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-40 transition-opacity duration-300">
          <div className="absolute inset-[-1px] bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 rounded-xl blur-[2px]" />
        </div>
      </button>

      <ChallengeCreationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleChallengeSuccess}
        userRole={userRole}
        availableCredits={availableCredits}
      />
    </>
  );
};