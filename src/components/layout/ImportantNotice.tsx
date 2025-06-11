import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollHeader } from '../../hooks/ui/useScrollHeader';

interface ImportantNoticeProps {
  show?: boolean;
  onDismiss?: () => void;
}

export const ImportantNotice: React.FC<ImportantNoticeProps> = ({ 
  show = true,
  onDismiss 
}) => {
  // Use the same compact logic as EdgeToEdgeTicker
  const { isCompact } = useScrollHeader(50);
  
  // Position notice right below the ticker (header + ticker heights)
  // EdgeToEdgeTicker positions: compact = top-12 sm:top-14, normal = top-14 sm:top-16
  // EdgeToEdgeTicker heights: compact = h-10, normal = h-12 sm:h-12
  // So notice should be: (ticker top) + (ticker height)
  const noticePosition = isCompact 
    ? 'top-[5.5rem] sm:top-[6rem]'  // (top-12 + h-10) = 3rem + 2.5rem, (top-14 + h-10) = 3.5rem + 2.5rem
    : 'top-[6.5rem] sm:top-[7rem]'; // (top-14 + h-12) = 3.5rem + 3rem, (top-16 + h-12) = 4rem + 3rem
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className={`fixed ${noticePosition} left-0 right-0 w-full z-30 transition-[top] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`}
        >
          <div className="w-full bg-gradient-to-r from-blue-500/15 via-cyan-500/15 to-blue-500/15 backdrop-blur-sm border-b border-blue-500/40">
            <div className="w-full px-4 py-3">
              <div className="flex items-center justify-center space-x-3">
                {/* Compact animated icon */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ 
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  className="flex-shrink-0"
                >
                  <span className="text-lg">⚠️</span>
                </motion.div>
                
                {/* Data migration notice */}
                <div className="text-center flex-1">
                  {/* Desktop: allow two lines */}
                  <div className="hidden sm:block">
                    <div className="text-sm font-medium text-blue-200">
                      <strong>Data Migration Notice:</strong> Price data temporarily outdated during system upgrade
                    </div>
                    <div className="text-sm text-blue-300/80">
                      Live market data will be available June 11
                    </div>
                  </div>
                  
                  {/* Mobile: allow two lines */}
                  <div className="block sm:hidden">
                    <div className="text-xs font-medium text-blue-200">
                      <strong>Data Migration:</strong> Price data temporarily outdated
                    </div>
                    <div className="text-xs text-blue-300/80">
                      Live market data will be available June 11
                    </div>
                  </div>
                </div>
                
                {/* Optional dismiss button - smaller */}
                {onDismiss && (
                  <button
                    onClick={onDismiss}
                    className="flex-shrink-0 text-blue-400/60 hover:text-blue-300 transition-colors duration-200"
                    aria-label="Dismiss notice"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Subtle animated border effect */}
              <motion.div 
                className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400/60 to-transparent"
                animate={{ 
                  x: ["-100%", "100%"],
                  opacity: [0, 1, 0]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{ width: "100%" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};