import React from "react";

export interface SpectateButtonProps {
  onSpectateClick: () => void;
}

export const SpectateButton: React.FC<SpectateButtonProps> = ({
  onSpectateClick,
}) => {
  return (
    <button
      onClick={onSpectateClick}
      className="group relative w-full px-4 py-2 bg-gradient-to-br from-purple-950/90 via-indigo-950/80 to-purple-950/90 border-2 border-purple-700/40 rounded-xl hover:border-purple-500/80 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 overflow-hidden backdrop-blur-sm"
    >
      {/* Dynamic theater curtain pattern background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500">
          {/* Theater spotlight beams */}
          <div className="absolute top-0 left-1/4 w-16 h-full bg-gradient-to-b from-purple-400/30 via-transparent to-transparent transform -skew-x-12 group-hover:animate-pulse" />
          <div className="absolute top-0 right-1/4 w-16 h-full bg-gradient-to-b from-indigo-400/30 via-transparent to-transparent transform skew-x-12 group-hover:animate-pulse animation-delay-300" />
          {/* Stadium crowd dots */}
          <div className="absolute bottom-0 left-0 w-full h-1/3 opacity-50">
            <div className="flex flex-wrap gap-1">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="w-1 h-1 bg-purple-300 rounded-full animate-twinkle" style={{animationDelay: `${i * 100}ms`}} />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Subtle prismatic overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/0 via-pink-500/0 to-indigo-600/0 group-hover:from-purple-600/5 group-hover:via-pink-500/3 group-hover:to-indigo-600/5 mix-blend-screen transition-all duration-500" />
      
      {/* Content */}
      <div className="relative flex items-center gap-3">
        {/* Eye icon with stadium glow */}
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-500 to-indigo-600 rounded-full blur-lg opacity-30 group-hover:opacity-60 group-hover:scale-105 transition-all duration-300" />
          <span className="relative text-2xl filter group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]">👁️</span>
        </div>
        
        <div className="flex flex-col items-start">
          <span className="text-xs text-purple-300/80 group-hover:text-purple-200 transition-colors uppercase tracking-wider font-medium whitespace-nowrap">
            Watch the Action
          </span>
          <span className="font-black text-gray-100 text-lg -mt-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-300 group-hover:via-pink-300 group-hover:to-indigo-300 transition-all duration-300 whitespace-nowrap">
            SPECTATE
          </span>
        </div>
      </div>
      
      {/* Subtle border glow */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-40 transition-opacity duration-300">
        <div className="absolute inset-[-1px] bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 rounded-xl blur-[2px]" />
      </div>
    </button>
  );
};