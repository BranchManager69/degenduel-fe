import React from "react";
import { TokenResponseMetadata } from "../../types";

interface OptimizedTokensHeaderProps {
  metadata?: TokenResponseMetadata;
}

/**
 * Optimized TokensHeader component with enhanced mobile support
 * - Responds to device orientation and screen size
 * - Prioritizes critical information on small screens
 * - Progressive enhancement for larger displays
 * - Reduced animation load for better performance
 */
export const OptimizedTokensHeader: React.FC<OptimizedTokensHeaderProps> = React.memo(() => {
  
  
  return (
    <div className="flex flex-col space-y-2 sm:space-y-3 w-full">
      <div className="relative">
        {/* Enhanced cyberpunk title with adaptive elements */}
        <div className="relative">
          <h1 className="text-2xl xs:text-3xl sm:text-4xl font-bold relative z-10 text-center xs:text-left">
            <span className="text-transparent bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text relative">
              DegenDuel Tokens
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
        
      </div>
      
    </div>
  );
});

OptimizedTokensHeader.displayName = 'OptimizedTokensHeader';