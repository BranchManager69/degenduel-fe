import React from "react";
import { ChallengeCreationModal } from "./ChallengeCreationModal";

interface ChallengeFriendButtonProps {
  onChallengeCreated?: () => void;
  className?: string;
  userRole: 'admin' | 'user';
  availableCredits?: number;
  currentUserNickname?: string;
}

export const ChallengeFriendButton: React.FC<ChallengeFriendButtonProps> = ({
  onChallengeCreated,
  className = "",
  userRole,
  availableCredits,
  currentUserNickname,
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
        disabled
        onClick={handleOpenModal}
        className={`group relative w-full px-4 py-2 bg-gradient-to-br from-gray-800/90 via-gray-700/80 to-gray-800/90 border-2 border-gray-600/40 rounded-xl cursor-not-allowed opacity-60 transition-all duration-300 backdrop-blur-sm ${className}`}
      >
        {/* Dynamic battle arena background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500">
            {/* Battle arena grid */}
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Arena boundary lines - grayed out */}
              <rect x="10" y="10" width="80" height="80" fill="none" stroke="#6b7280" strokeWidth="0.5" strokeDasharray="3,3" className="animate-pulse" />
              <rect x="20" y="20" width="60" height="60" fill="none" stroke="#4b5563" strokeWidth="0.3" strokeDasharray="2,2" className="animate-pulse animation-delay-300" />
              {/* Center combat zone */}
              <circle cx="50" cy="50" r="15" fill="none" stroke="#6b7280" strokeWidth="0.8" className="animate-ping" />
              <circle cx="50" cy="50" r="8" fill="none" stroke="#9ca3af" strokeWidth="0.5" className="animate-pulse animation-delay-500" />
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
            <div className="absolute inset-0 bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600 rounded-full blur-lg opacity-30 transition-all duration-300" />
            <svg className="relative w-6 h-6 filter" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {/* Two stick figures facing each other - bigger */}
              <g className="text-gray-400">
                {/* Left figure */}
                <circle cx="7" cy="4" r="2.5" fill="currentColor"/>
                <line x1="7" y1="6.5" x2="7" y2="14"/>
                <line x1="7" y1="9" x2="3" y2="11"/>
                <line x1="7" y1="9" x2="11" y2="11"/>
                <line x1="7" y1="14" x2="4" y2="20"/>
                <line x1="7" y1="14" x2="10" y2="20"/>
                
                {/* Right figure */}
                <circle cx="17" cy="4" r="2.5" fill="currentColor"/>
                <line x1="17" y1="6.5" x2="17" y2="14"/>
                <line x1="17" y1="9" x2="13" y2="11"/>
                <line x1="17" y1="9" x2="21" y2="11"/>
                <line x1="17" y1="14" x2="14" y2="20"/>
                <line x1="17" y1="14" x2="20" y2="20"/>
              </g>
            </svg>
          </div>
          
          <div className="flex flex-col items-start">
            <span className="text-xs text-gray-400/80 transition-colors uppercase tracking-wider font-medium whitespace-nowrap">
              1v1 Private
            </span>
            <span className="font-black text-gray-400 text-sm sm:text-base -mt-1 transition-all duration-300 whitespace-nowrap">
              CHALLENGE
            </span>
          </div>
        </div>
        
        {/* Coming Soon Badge */}
        <span className="absolute -top-2 -right-2 bg-brand-500 text-xs text-white px-2 py-0.5 rounded-full font-semibold animate-pulse">
          Coming Soon
        </span>
      </button>

      <ChallengeCreationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleChallengeSuccess}
        userRole={userRole}
        availableCredits={availableCredits}
        currentUserNickname={currentUserNickname}
      />
    </>
  );
};