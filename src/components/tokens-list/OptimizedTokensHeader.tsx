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
        <h1 className="text-2xl xs:text-3xl sm:text-4xl font-bold relative z-10 text-center xs:text-left">
          <span className="text-transparent bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text relative">
            DegenDuel Tokens
          </span>
        </h1>
      </div>
    </div>
  );
});

OptimizedTokensHeader.displayName = 'OptimizedTokensHeader';