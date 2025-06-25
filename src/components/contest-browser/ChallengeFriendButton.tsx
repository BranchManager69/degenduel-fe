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
        className={`group relative px-8 py-3 bg-dark-300 border-2 border-red-900/30 rounded-xl hover:border-red-500 transition-all duration-300 overflow-hidden ${className}`}
      >
        {/* Animated fire particles background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-1 h-1 bg-orange-500 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-float-up" />
          <div className="absolute top-0 left-1/2 w-1 h-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-float-up animation-delay-300" />
          <div className="absolute top-0 left-3/4 w-1 h-1 bg-yellow-500 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-float-up animation-delay-600" />
        </div>
        
        {/* Glowing ember effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/0 via-orange-500/0 to-red-600/0 group-hover:from-red-600/10 group-hover:via-orange-500/20 group-hover:to-red-600/10 transition-all duration-500" />
        
        {/* Lightning strike effect on hover */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-0 bg-gradient-to-b from-white to-red-400 opacity-0 group-hover:opacity-100 group-hover:h-full transition-all duration-200" />
        
        {/* Content */}
        <div className="relative flex items-center gap-3">
          {/* Crossed swords icon */}
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-600 rounded-full blur-md opacity-0 group-hover:opacity-70 animate-pulse" />
            <span className="relative text-2xl group-hover:animate-pulse">⚔️</span>
          </div>
          
          <div className="flex flex-col items-start">
            <span className="text-xs text-red-400/70 group-hover:text-red-400 transition-colors uppercase tracking-wider">
              1v1 Combat
            </span>
            <span className="font-black text-gray-200 text-lg -mt-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-red-400 group-hover:to-orange-400 transition-all duration-300">
              CHALLENGE DUEL
            </span>
          </div>
          
          {/* VS indicator */}
          <div className="ml-auto">
            <span className="text-red-500 font-black text-sm group-hover:animate-pulse">VS</span>
          </div>
        </div>
        
        {/* Fire border effect */}
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-full h-full bg-gradient-to-r from-red-600 via-orange-500 to-red-600 animate-fire-flicker" />
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