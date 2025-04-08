import React from "react";
import { TokenResponseMetadata } from "../../types";

interface OptimizedTokensHeaderProps {
  metadata: TokenResponseMetadata;
}

/**
 * Optimized TokensHeader component with reduced animations
 */
export const OptimizedTokensHeader: React.FC<OptimizedTokensHeaderProps> = React.memo(({ metadata }) => {
  // Format date for display
  const lastUpdated = new Date(metadata.timestamp);
  const formattedDate = lastUpdated.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  
  // Calculate staleness
  const isStale = metadata._stale === true;
  const isCached = metadata._cached === true;
  
  return (
    <div className="flex flex-col space-y-3">
      <div className="relative">
        {/* Enhanced cyberpunk title with decorative elements */}
        <div className="relative">
          <h1 className="text-3xl sm:text-4xl font-bold relative z-10">
            <span className="text-transparent bg-gradient-to-r from-brand-400 via-white to-cyan-500 bg-clip-text relative">
              DegenDuel Markets
              <span className="absolute -right-3 -top-1 text-xs font-mono text-cyan-500/70">v2.0</span>
            </span>
          </h1>
          
          {/* Cyberpunk decorative elements */}
          <div className="absolute -left-5 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-gradient-to-b from-brand-500 to-transparent -skew-y-12"></div>
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-gradient-to-b from-brand-500/70 to-transparent -skew-y-12"></div>
          <div className="absolute -bottom-2 left-0 w-32 h-px bg-gradient-to-r from-brand-500 to-transparent"></div>
          <div className="absolute -bottom-4 left-0 w-56 h-px bg-gradient-to-r from-brand-500/50 to-transparent"></div>
          
          {/* Circuit board lines */}
          <div className="absolute right-0 top-0 flex items-center">
            <div className="w-4 h-4 border-2 border-cyan-500/40 rounded-full flex items-center justify-center">
              <div className="w-1 h-1 bg-cyan-500/70"></div>
            </div>
            <div className="h-px w-12 bg-gradient-to-r from-cyan-500/70 to-transparent"></div>
          </div>
        </div>
        
        {/* Cyberpunk subtitle with digital distortion effect */}
        <div className="text-sm text-gray-400 mt-1 font-mono relative pl-2">
          <span className="relative inline-block overflow-hidden">
            <span className="relative z-10">Live crypto market data</span>
            <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-brand-500/10 to-transparent animate-pulse"></span>
          </span>
          
          {/* Digital circuit segments */}
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 flex space-x-1">
            <div className="w-0.5 h-3 bg-brand-500/70"></div>
            <div className="w-0.5 h-2 bg-brand-500/40"></div>
          </div>
        </div>
      </div>
      
      {/* Status indicators with cyberpunk style */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
        {/* Live status indicator */}
        <div className="flex items-center space-x-2 px-3 py-1 bg-dark-300/60 backdrop-blur-sm rounded-md border border-dark-500/50 relative overflow-hidden group">
          {/* Corner accent */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-brand-500/40"></div>
          
          {/* Glow effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-500/0 via-brand-500/0 to-brand-500/0 
            group-hover:from-brand-500/0 group-hover:via-brand-500/5 group-hover:to-brand-500/0 transition-all duration-300"></div>
          
          <span className={`w-2 h-2 rounded-full ${isStale ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'} relative z-10`}></span>
          <span className={`${isStale ? 'text-yellow-500' : 'text-green-500'} relative z-10`}>
            {isStale ? 'Refreshing...' : 'Live Data'}
          </span>
        </div>
        
        {/* Time indicator */}
        <div className="flex items-center space-x-2 px-3 py-1 bg-dark-300/60 backdrop-blur-sm rounded-md border border-dark-500/50 relative overflow-hidden group">
          {/* Corner accent */}
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500/40"></div>
          
          {/* Glow effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/0 to-cyan-500/0 
            group-hover:from-cyan-500/0 group-hover:via-cyan-500/5 group-hover:to-cyan-500/0 transition-all duration-300"></div>
            
          <svg className="w-4 h-4 text-brand-400 relative z-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="text-white/90 relative z-10 font-mono tracking-wide">{formattedDate}</span>
        </div>
        
        {/* Cached indicator */}
        {isCached && (
          <div className="px-3 py-1 bg-dark-300/60 backdrop-blur-sm rounded-md text-blue-400 flex items-center space-x-2 border border-dark-500/50 relative overflow-hidden group">
            {/* Corner accents */}
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-blue-500/40"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-blue-500/40"></div>
            
            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 
              group-hover:from-blue-500/0 group-hover:via-blue-500/5 group-hover:to-blue-500/0 transition-all duration-300"></div>
              
            <svg className="w-4 h-4 relative z-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 8L15 12H18C18 15.31 15.31 18 12 18C10.99 18 10.03 17.75 9.2 17.3L7.74 18.76C8.97 19.54 10.43 20 12 20C16.42 20 20 16.42 20 12H23L19 8Z" fill="currentColor"/>
              <path d="M6 12C6 8.69 8.69 6 12 6C13.01 6 13.97 6.25 14.8 6.7L16.26 5.24C15.03 4.46 13.57 4 12 4C7.58 4 4 7.58 4 12H1L5 16L9 12H6Z" fill="currentColor"/>
            </svg>
            <span className="relative z-10 font-mono">Cached</span>
          </div>
        )}
      </div>
    </div>
  );
});

OptimizedTokensHeader.displayName = 'OptimizedTokensHeader';