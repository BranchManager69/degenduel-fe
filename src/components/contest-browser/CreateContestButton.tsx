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
      className="group relative px-4 py-2 bg-gradient-to-br from-emerald-950/90 via-teal-950/80 to-green-950/90 border-2 border-emerald-700/40 rounded-xl hover:border-emerald-500/80 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 overflow-hidden backdrop-blur-sm sm:scale-100 scale-75"
    >
      {/* Dynamic blueprint grid background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500">
          {/* Blueprint grid lines */}
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Vertical lines */}
            <line x1="25" y1="0" x2="25" y2="100" stroke="#10b981" strokeWidth="0.3" strokeDasharray="2,2" className="animate-pulse" />
            <line x1="50" y1="0" x2="50" y2="100" stroke="#10b981" strokeWidth="0.3" strokeDasharray="2,2" className="animate-pulse animation-delay-200" />
            <line x1="75" y1="0" x2="75" y2="100" stroke="#10b981" strokeWidth="0.3" strokeDasharray="2,2" className="animate-pulse animation-delay-400" />
            {/* Horizontal lines */}
            <line x1="0" y1="25" x2="100" y2="25" stroke="#10b981" strokeWidth="0.3" strokeDasharray="2,2" className="animate-pulse animation-delay-100" />
            <line x1="0" y1="75" x2="100" y2="75" stroke="#10b981" strokeWidth="0.3" strokeDasharray="2,2" className="animate-pulse animation-delay-300" />
            {/* Central crosshairs */}
            <circle cx="50" cy="50" r="8" fill="none" stroke="#10b981" strokeWidth="0.5" className="animate-ping" />
            <circle cx="50" cy="50" r="3" fill="#10b981" className="animate-pulse" />
          </svg>
          {/* Construction dots */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-emerald-400 rounded-full animate-twinkle" />
            <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-emerald-400 rounded-full animate-twinkle animation-delay-500" />
          </div>
        </div>
      </div>
      
      {/* Subtle construction overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/0 via-teal-500/0 to-green-600/0 group-hover:from-emerald-600/5 group-hover:via-teal-500/3 group-hover:to-green-600/5 mix-blend-screen transition-all duration-500" />
      
      {/* Content */}
      <div className="relative flex items-center gap-3">
        {/* Animated trophy with architect tools */}
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-emerald-500 to-orange-500 rounded-full blur-lg opacity-30 group-hover:opacity-60 group-hover:scale-105 transition-all duration-300" />
          <span className="relative text-2xl filter group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.8)] group-hover:animate-bounce">🏆</span>
        </div>
        
        <div className="flex flex-col items-start">
          <span className="text-xs text-emerald-300/80 group-hover:text-emerald-200 transition-colors uppercase tracking-wider font-medium whitespace-nowrap">
            Host Your Own
          </span>
          <span className="font-black text-gray-100 text-lg -mt-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-emerald-300 group-hover:via-teal-300 group-hover:to-green-300 transition-all duration-300 whitespace-nowrap">
            CREATE CONTEST
          </span>
        </div>
        
        {/* Create indicator */}
        <div className="ml-auto flex items-center">
          <span className="text-xs text-emerald-300 font-mono tracking-wider">NEW</span>
        </div>
      </div>
      
      {/* Subtle border glow */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-40 transition-opacity duration-300">
        <div className="absolute inset-[-1px] bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 rounded-xl blur-[2px]" />
      </div>
    </button>
  );
};