import React from "react";

export interface CreateContestButtonProps {
  onCreateClick: () => void;
}

export const CreateContestButton: React.FC<CreateContestButtonProps> = ({
  onCreateClick,
}) => {
  return (
    <button
      onClick={onCreateClick}
      className="group relative px-8 py-3 bg-dark-200 border-2 border-transparent rounded-xl hover:border-brand-500 transition-all duration-300 overflow-hidden"
    >
      {/* Animated circuit board pattern background */}
      <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
        <div className="absolute top-0 left-0 w-full h-full">
          {/* Circuit lines */}
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,20 L30,20 L30,50 L70,50 L70,80 L100,80" stroke="#00ff88" strokeWidth="0.5" fill="none" className="animate-pulse" />
            <path d="M0,80 L20,80 L20,30 L80,30 L80,10 L100,10" stroke="#00ff88" strokeWidth="0.5" fill="none" className="animate-pulse animation-delay-1000" />
            <circle cx="30" cy="20" r="2" fill="#00ff88" className="animate-ping" />
            <circle cx="70" cy="50" r="2" fill="#00ff88" className="animate-ping animation-delay-500" />
          </svg>
        </div>
      </div>
      
      {/* Holographic effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-400/0 via-purple-500/0 to-cyan-400/0 group-hover:from-brand-400/20 group-hover:via-purple-500/10 group-hover:to-cyan-400/20 transition-all duration-500" />
      
      {/* Glitch effect on hover */}
      <div className="absolute inset-0 group-hover:animate-glitch opacity-50">
        <div className="h-full w-full bg-gradient-to-r from-red-500/10 to-blue-500/10" />
      </div>
      
      {/* Content */}
      <div className="relative flex items-center gap-3">
        {/* Animated crown/trophy hybrid */}
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full blur-md opacity-50 group-hover:opacity-100 animate-pulse" />
          <span className="relative text-2xl group-hover:animate-bounce">🏆</span>
        </div>
        
        <div className="flex flex-col items-start">
          <span className="text-xs text-gray-500 group-hover:text-brand-400 transition-colors uppercase tracking-wider">
            Host Your Own
          </span>
          <span className="font-black text-white text-lg -mt-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-brand-400 group-hover:to-purple-400 transition-all duration-300">
            CREATE CONTEST
          </span>
        </div>
        
        {/* Animated plus signs */}
        <div className="ml-auto flex items-center">
          <span className="text-brand-400 text-xl font-bold group-hover:rotate-90 transition-transform duration-300">+</span>
        </div>
      </div>
      
      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-brand-400 to-purple-400 group-hover:w-full transition-all duration-500" />
    </button>
  );
};