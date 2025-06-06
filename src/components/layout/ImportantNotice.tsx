import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

interface ImportantNoticeProps {
  show?: boolean;
  onDismiss?: () => void;
}

export const ImportantNotice: React.FC<ImportantNoticeProps> = ({ 
  show = true,
  onDismiss 
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="relative w-full"
        >
          <div className="w-full bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 backdrop-blur-sm border-b border-amber-500/40">
            <div className="w-full px-4 py-2">
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
                  <span className="text-lg">📢</span>
                </motion.div>
                
                {/* Compact message content */}
                <div className="text-center">
                  <Link 
                    to="/important-update"
                    className="group inline-flex items-center space-x-2 text-amber-200 hover:text-amber-100 transition-colors duration-200"
                  >
                    <span className="text-xs sm:text-sm font-medium">
                      Important Update: A message from the DegenDuel team
                    </span>
                    <svg 
                      className="w-3 h-3 sm:w-4 sm:h-4 transform group-hover:translate-x-1 transition-transform duration-200" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
                
                {/* Optional dismiss button - smaller */}
                {onDismiss && (
                  <button
                    onClick={onDismiss}
                    className="flex-shrink-0 text-amber-400/60 hover:text-amber-300 transition-colors duration-200"
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
                className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent"
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