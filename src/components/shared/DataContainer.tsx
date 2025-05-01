// src/components/shared/DataContainer.tsx

/**
 * Standardized Data Container Component
 * 
 * This component provides a consistent visual style and behavior for data displays
 * throughout the DegenDuel platform. It handles loading states, errors, and debug information
 * in a standardized way.
 * 
 * @author Claude
 * @created 2025-04-29
 */

import { motion } from 'framer-motion';
import React, { ReactNode } from 'react';

export interface DataContainerProps {
  title: string;                        // Main title for the container
  subtitle?: string;                    // Optional subtitle
  titleColor?: string;                  // Color class for the title (defaults to brand purple gradient)
  children: ReactNode;                  // Content to display
  isLoading?: boolean;                  // Loading state
  error?: string | null;                // Error message
  debugInfo?: Record<string, any>;      // Debug information to display in collapsible panel
  onRetry?: () => void;                 // Function to call when retry button is clicked
  showRetryButton?: boolean;            // Explicitly control retry button visibility (defaults true)
  isLive?: boolean;                     // Whether to show the "Live" indicator
  headerRight?: ReactNode;              // Optional content for the right side of the header
  containerClassName?: string;          // Additional classes for the container
  variant?: 'default' | 'market' | 'token' | 'contest'; // Visual variant
}

/**
 * Standardized Data Container
 */
export const DataContainer: React.FC<DataContainerProps> = ({
  title,
  subtitle,
  titleColor = 'bg-gradient-to-r from-brand-400 via-purple-400 to-brand-500',
  children,
  isLoading = false,
  error = null,
  debugInfo,
  onRetry,
  showRetryButton = true,
  isLive = false,
  headerRight,
  containerClassName = '',
  variant = 'default',
}) => {
  // Style variants
  const variantStyles: Record<string, { accent: string, borders: string, corners: string }> = {
    // Default variant
    default: {
      accent: 'from-brand-500/50 to-purple-500/50',
      borders: 'border-dark-300/60',
      corners: 'border-brand-500/50 border-purple-500/50',
    },
    // Market variant
    market: {
      accent: 'from-brand-500/50 to-purple-500/50',
      borders: 'border-dark-300/60',
      corners: 'border-brand-500/50 border-cyan-500/50',
    },
    // Token variant
    token: {
      accent: 'from-yellow-500/50 to-amber-500/50',
      borders: 'border-dark-300/60',
      corners: 'border-yellow-500/50 border-amber-500/50',
    },
    // Contest variant
    contest: {
      accent: 'from-green-500/50 to-brand-500/50',
      borders: 'border-dark-300/60',
      corners: 'border-green-500/50 border-brand-500/50',
    },
  };
  
  const styles = variantStyles[variant];

  // Animation variants for the items
  // REMOVED: Unused itemVariants definition
  
  // Container variants for staggered animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`bg-dark-200/70 backdrop-blur-sm rounded-xl p-4 border ${styles.borders} shadow-lg ${containerClassName}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-dark-300/50 rounded w-1/2 mb-4"></div>
          <div className="h-20 bg-dark-300/30 rounded-lg"></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-dark-300/30 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // Error state with debugging information and retry button
  if (error) {
    return (
      <div className={`bg-dark-200/70 backdrop-blur-sm rounded-xl p-4 border ${styles.borders} shadow-lg ${containerClassName}`}>
        <div className="text-center py-8">
          {/* Improved Error Visual */}
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 mb-4">
            <svg className="h-6 w-6 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-base font-semibold text-red-400 mb-2">Oops! Something went wrong.</p>
          <p className="text-sm text-gray-400 mb-4">
            {error} 
          </p>
          
          {/* Debug information (hidden by default) */}
          {debugInfo && (
            <details className="mt-3 text-left bg-dark-300/50 p-3 rounded-lg border border-gray-700/50 text-xs">
              <summary className="text-gray-400 cursor-pointer">Debug Information</summary>
              <div className="mt-2 text-gray-300 space-y-1 font-mono pl-2">
                {Object.entries(debugInfo).map(([key, value]) => (
                  <div key={key}>
                    {key}: <span className={
                      typeof value === 'boolean' ? 
                        (value ? 'text-green-400' : 'text-red-400') : 
                        'text-blue-400'
                    }>
                      {typeof value === 'object' 
                        ? JSON.stringify(value) 
                        : String(value)
                      }
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}
          
          {/* Retry button - now conditional */}
          {onRetry && showRetryButton && (
            <button 
              onClick={onRetry}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-brand-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-dark-200/70 backdrop-blur-sm rounded-xl p-4 border ${styles.borders} shadow-lg relative overflow-hidden ${containerClassName}`}>
      {/* Corner cuts for cyberpunk aesthetic */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-brand-500/50 -translate-x-0.5 -translate-y-0.5 z-10"></div>
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-cyan-500/50 translate-x-0.5 -translate-y-0.5 z-10"></div>
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-brand-500/50 -translate-x-0.5 translate-y-0.5 z-10"></div>
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-cyan-500/50 translate-x-0.5 translate-y-0.5 z-10"></div>
      
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Ambient glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-dark-400/5 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-dark-400/5 to-transparent"></div>
        
        {/* Circuit board backdrop */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_24px,#3f3f4620_25px,#3f3f4620_26px,transparent_27px),linear-gradient(90deg,transparent_24px,#3f3f4620_25px,#3f3f4620_26px,transparent_27px)] bg-[length:25px_25px]"></div>
        </div>
        
        {/* Energy pulse */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-500/5 to-transparent animate-scan-fast opacity-20"></div>
        </div>
      </div>
      
      {/* Container header */}
      <div className="mb-4 flex items-center justify-between relative z-10">
        <div className="flex-1">
          <h3 className={`text-lg font-bold text-transparent ${titleColor} bg-clip-text font-cyber relative`}>
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Live indicator */}
          {isLive && (
            <div className="px-2 py-0.5 bg-dark-300/70 rounded-full flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1.5"></span>
              <span className="text-xs text-gray-300">Live</span>
            </div>
          )}
          
          {/* Right side header content */}
          {headerRight}
        </div>
      </div>
      
      {/* Main content with animation */}
      <motion.div
        className="relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {children}
      </motion.div>
    </div>
  );
};

// Export the DataContainer component to promote universal use
export default DataContainer;