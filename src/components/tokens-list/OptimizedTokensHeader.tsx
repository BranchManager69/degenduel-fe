import React, { useState, useEffect } from "react";
import { TokenResponseMetadata } from "../../types";
import { TokenDataFreshnessIndicator } from "./TokenDataFreshnessIndicator";

interface OptimizedTokensHeaderProps {
  metadata: TokenResponseMetadata;
}

/**
 * Optimized TokensHeader component with enhanced mobile support
 * - Responds to device orientation and screen size
 * - Prioritizes critical information on small screens
 * - Progressive enhancement for larger displays
 * - Reduced animation load for better performance
 */
export const OptimizedTokensHeader: React.FC<OptimizedTokensHeaderProps> = React.memo(({ metadata }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Format date for display
  const lastUpdated = new Date(metadata.timestamp);
  const formattedDate = lastUpdated.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: isMobile ? undefined : '2-digit', // Simpler time format on mobile
    hour12: true
  });
  
  // Calculate staleness
  const isStale = metadata._stale === true;
  const isCached = metadata._cached === true;
  
  return (
    <div className="flex flex-col space-y-2 sm:space-y-3 w-full">
      <div className="relative">
        {/* Enhanced cyberpunk title with adaptive elements */}
        <div className="relative">
          <h1 className="text-2xl xs:text-3xl sm:text-4xl font-bold relative z-10 text-center xs:text-left">
            <span className="text-transparent bg-gradient-to-r from-brand-400 via-white to-cyan-500 bg-clip-text relative">
              {isMobile ? 'DD Markets' : 'DegenDuel Markets'}
              <span className="absolute -right-3 -top-1 text-xs font-mono text-cyan-500/70 hidden xs:inline">v2.0</span>
            </span>
          </h1>
          
          {/* Cyberpunk decorative elements - hidden on smallest screens for simplicity */}
          <div className="hidden xs:block absolute -left-5 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-gradient-to-b from-brand-500 to-transparent -skew-y-12"></div>
          <div className="hidden xs:block absolute -left-2 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-gradient-to-b from-brand-500/70 to-transparent -skew-y-12"></div>
          
          {/* Simpler underlines that work well on mobile */}
          <div className="absolute -bottom-2 left-0 w-20 xs:w-32 h-px bg-gradient-to-r from-brand-500 to-transparent"></div>
          <div className="absolute -bottom-4 left-0 w-24 xs:w-56 h-px bg-gradient-to-r from-brand-500/50 to-transparent"></div>
          
          {/* Circuit board lines - simplified on mobile, more detailed on desktop */}
          <div className="hidden xs:flex absolute right-0 top-0 items-center">
            <div className="w-4 h-4 border-2 border-cyan-500/40 rounded-full flex items-center justify-center">
              <div className="w-1 h-1 bg-cyan-500/70"></div>
            </div>
            <div className="h-px w-12 bg-gradient-to-r from-cyan-500/70 to-transparent"></div>
          </div>
        </div>
        
        {/* Cyberpunk subtitle - adaptive for mobile */}
        <div className="text-xs xs:text-sm text-gray-400 mt-1 font-mono relative pl-0 xs:pl-2 text-center xs:text-left">
          <span className="relative inline-block overflow-hidden">
            <span className="relative z-10">
              {isMobile ? 'Live market data' : 'Live crypto market data'}
            </span>
            {/* Reduce animation on mobile */}
            {!isMobile && (
              <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-brand-500/10 to-transparent animate-pulse"></span>
            )}
          </span>
          
          {/* Digital circuit segments - hidden on mobile */}
          <div className="hidden xs:flex absolute -left-2 top-1/2 -translate-y-1/2 space-x-1">
            <div className="w-0.5 h-3 bg-brand-500/70"></div>
            <div className="w-0.5 h-2 bg-brand-500/40"></div>
          </div>
        </div>
      </div>
      
      {/* Status indicators with cyberpunk style - reorganized for mobile */}
      <div className="flex flex-wrap justify-center xs:justify-start items-center gap-1 sm:gap-3 text-xs sm:text-sm text-gray-400">
        {/* Real-time Price Update Indicator */}
        <TokenDataFreshnessIndicator compact={isMobile} />
        {/* Live status indicator - critical info, always visible */}
        <div className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 bg-dark-300/60 backdrop-blur-sm rounded-md relative overflow-hidden touch-manipulation">
          {/* Corner accent - simplified on mobile */}
          {!isMobile && (
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-brand-500/40"></div>
          )}
          
          <span className={`w-2 h-2 rounded-full ${isStale ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'} relative z-10`}></span>
          <span className={`${isStale ? 'text-yellow-500' : 'text-green-500'} relative z-10 whitespace-nowrap`}>
            {isStale ? 'Refreshing...' : 'Live'}
          </span>
        </div>
        
        {/* Time indicator - simplified on mobile */}
        <div className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 bg-dark-300/60 backdrop-blur-sm rounded-md relative overflow-hidden touch-manipulation">
          {/* Corner accent - only on desktop */}
          {!isMobile && (
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500/40"></div>
          )}
            
          {/* Smaller icon on mobile */}
          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-brand-400 relative z-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="text-white/90 relative z-10 font-mono tracking-wide text-xs sm:text-sm">{formattedDate}</span>
        </div>
        
        {/* Cached indicator - compact design on mobile, full on desktop */}
        {isCached && (
          <div className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 bg-dark-300/60 backdrop-blur-sm rounded-md text-blue-400 relative overflow-hidden touch-manipulation ${isMobile ? 'text-[10px]' : ''}`}>
            {/* Corner accents - only on desktop */}
            {!isMobile && (
              <>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-blue-500/40"></div>
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-blue-500/40"></div>
              </>
            )}
            
            {/* Different icon size based on device */}
            <svg className={`${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3 sm:w-4 sm:h-4'} relative z-10`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 8L15 12H18C18 15.31 15.31 18 12 18C10.99 18 10.03 17.75 9.2 17.3L7.74 18.76C8.97 19.54 10.43 20 12 20C16.42 20 20 16.42 20 12H23L19 8Z" fill="currentColor"/>
              <path d="M6 12C6 8.69 8.69 6 12 6C13.01 6 13.97 6.25 14.8 6.7L16.26 5.24C15.03 4.46 13.57 4 12 4C7.58 4 4 7.58 4 12H1L5 16L9 12H6Z" fill="currentColor"/>
            </svg>
            <span className="relative z-10 font-mono">{isMobile ? 'Cache' : 'Cached'}</span>
          </div>
        )}
        
        {/* Manual refresh button - useful on mobile */}
        {isMobile && (
          <button 
            onClick={() => window.location.reload()}
            className="ml-auto flex items-center space-x-1 px-2 py-1 bg-brand-500/20 backdrop-blur-sm rounded-md text-brand-400 touch-manipulation"
          >
            <svg className="w-3 h-3 relative z-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4V9H4.58152M19.9381 11C19.446 7.05369 16.0796 4 12 4C8.64262 4 5.76829 6.06817 4.58152 9M4.58152 9H9M20 20V15H19.4185M19.4185 15C18.2317 17.9318 15.3574 20 12 20C7.92038 20 4.55399 16.9463 4.06189 13M19.4185 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-xs">SYNC</span>
          </button>
        )}
      </div>
    </div>
  );
});

OptimizedTokensHeader.displayName = 'OptimizedTokensHeader';