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
      className="group relative w-full px-4 py-2 bg-gradient-to-br from-emerald-950/90 via-teal-950/80 to-green-950/90 border-2 border-emerald-700/40 rounded-xl hover:border-emerald-500/80 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 overflow-hidden backdrop-blur-sm"
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
          <svg className="relative w-6 h-6 filter group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" viewBox="0 0 32 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            {/* Crowd of stick figures - more spread out */}
            <g className="text-emerald-300">
              {/* Back row - 3 figures */}
              <circle cx="5" cy="4" r="1.3" fill="currentColor"/>
              <line x1="5" y1="5.3" x2="5" y2="9"/>
              <line x1="5" y1="6.5" x2="3" y2="7.5"/>
              <line x1="5" y1="6.5" x2="7" y2="7.5"/>
              <line x1="5" y1="9" x2="3.5" y2="12"/>
              <line x1="5" y1="9" x2="6.5" y2="12"/>
              
              <circle cx="16" cy="4" r="1.3" fill="currentColor"/>
              <line x1="16" y1="5.3" x2="16" y2="9"/>
              <line x1="16" y1="6.5" x2="14" y2="7.5"/>
              <line x1="16" y1="6.5" x2="18" y2="7.5"/>
              <line x1="16" y1="9" x2="14.5" y2="12"/>
              <line x1="16" y1="9" x2="17.5" y2="12"/>
              
              <circle cx="27" cy="4" r="1.3" fill="currentColor"/>
              <line x1="27" y1="5.3" x2="27" y2="9"/>
              <line x1="27" y1="6.5" x2="25" y2="7.5"/>
              <line x1="27" y1="6.5" x2="29" y2="7.5"/>
              <line x1="27" y1="9" x2="25.5" y2="12"/>
              <line x1="27" y1="9" x2="28.5" y2="12"/>
              
              {/* Front row - 2 figures */}
              <circle cx="10.5" cy="10" r="1.3" fill="currentColor"/>
              <line x1="10.5" y1="11.3" x2="10.5" y2="15"/>
              <line x1="10.5" y1="12.5" x2="8.5" y2="13.5"/>
              <line x1="10.5" y1="12.5" x2="12.5" y2="13.5"/>
              <line x1="10.5" y1="15" x2="9" y2="18"/>
              <line x1="10.5" y1="15" x2="12" y2="18"/>
              
              <circle cx="21.5" cy="10" r="1.3" fill="currentColor"/>
              <line x1="21.5" y1="11.3" x2="21.5" y2="15"/>
              <line x1="21.5" y1="12.5" x2="19.5" y2="13.5"/>
              <line x1="21.5" y1="12.5" x2="23.5" y2="13.5"/>
              <line x1="21.5" y1="15" x2="20" y2="18"/>
              <line x1="21.5" y1="15" x2="23" y2="18"/>
            </g>
          </svg>
        </div>
        
        <div className="flex flex-col items-start">
          <span className="text-xs text-emerald-300/80 group-hover:text-emerald-200 transition-colors uppercase tracking-wider font-medium whitespace-nowrap">
            Host Public
          </span>
          <span className="font-black text-gray-100 text-sm sm:text-base -mt-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-emerald-300 group-hover:via-teal-300 group-hover:to-green-300 transition-all duration-300 whitespace-nowrap">
            CONTEST
          </span>
        </div>
      </div>
      
      {/* Subtle border glow */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-40 transition-opacity duration-300">
        <div className="absolute inset-[-1px] bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 rounded-xl blur-[2px]" />
      </div>
    </button>
  );
};