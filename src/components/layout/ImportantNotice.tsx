import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollHeader } from '../../hooks/ui/useScrollHeader';

interface ImportantNoticeProps {
  show?: boolean;
  onDismiss?: () => void;
  title?: string;
  message?: string;
  type?: 'info' | 'warning' | 'error' | 'success';
}

export const ImportantNotice: React.FC<ImportantNoticeProps> = ({ 
  show = true,
  onDismiss,
  title = "Data Migration Notice:",
  message = "Price data temporarily outdated during system upgrade",
  type = 'warning'
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

  // Dynamic styling based on notice type
  const typeStyles = {
    info: {
      bg: 'from-blue-500/15 via-cyan-500/15 to-blue-500/15',
      border: 'border-blue-500/40',
      textPrimary: 'text-blue-200',
      textSecondary: 'text-blue-300/80',
      icon: 'ℹ️',
      iconGlow: 'via-blue-400/60'
    },
    warning: {
      bg: 'from-yellow-500/15 via-amber-500/15 to-yellow-500/15',
      border: 'border-yellow-500/40',
      textPrimary: 'text-yellow-200',
      textSecondary: 'text-yellow-300/80',
      icon: '⚠️',
      iconGlow: 'via-yellow-400/60'
    },
    error: {
      bg: 'from-red-500/15 via-rose-500/15 to-red-500/15',
      border: 'border-red-500/40',
      textPrimary: 'text-red-200',
      textSecondary: 'text-red-300/80',
      icon: '🚨',
      iconGlow: 'via-red-400/60'
    },
    success: {
      bg: 'from-green-500/15 via-emerald-500/15 to-green-500/15',
      border: 'border-green-500/40',
      textPrimary: 'text-green-200',
      textSecondary: 'text-green-300/80',
      icon: '✅',
      iconGlow: 'via-green-400/60'
    }
  };

  const styles = typeStyles[type];
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
          <div className={`w-full bg-gradient-to-r ${styles.bg} backdrop-blur-sm border-b ${styles.border}`}>
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
                  <span className="text-lg">{styles.icon}</span>
                </motion.div>
                
                {/* Dynamic notice content */}
                <div className="text-center flex-1">
                  {/* Desktop */}
                  <div className="hidden sm:block">
                    <div className={`text-sm font-medium ${styles.textPrimary}`}>
                      {title && <strong>{title}</strong>} {message}
                    </div>
                  </div>
                  
                  {/* Mobile */}
                  <div className="block sm:hidden">
                    <div className={`text-xs font-medium ${styles.textPrimary}`}>
                      {title && <strong>{title}</strong>} {message}
                    </div>
                  </div>
                </div>
                
                {/* Optional dismiss button - smaller */}
                {onDismiss && (
                  <button
                    onClick={onDismiss}
                    className={`flex-shrink-0 ${styles.textSecondary} hover:${styles.textPrimary} transition-colors duration-200`}
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
                className={`absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-transparent ${styles.iconGlow} to-transparent`}
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