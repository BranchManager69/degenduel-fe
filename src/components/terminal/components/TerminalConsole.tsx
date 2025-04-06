/**
 * @fileoverview
 * Terminal console component
 * 
 * @description
 * Displays terminal output and handles scrolling behavior
 * 
 * @author Branch Manager
 */

import { motion } from 'framer-motion';
import React, { useEffect, useRef } from 'react';
import { TerminalConsoleProps } from '../types';

/**
 * TerminalConsole - Displays terminal output and handles scrolling behavior
 */
export const TerminalConsole: React.FC<TerminalConsoleProps> = ({
  consoleOutput,
  size
}) => {
  const consoleOutputRef = useRef<HTMLDivElement>(null);

  // Enhanced scrollbar auto-hide effect specifically for console output
  const scrollbarAutoHide = (element: HTMLElement | null, timeout = 2000) => {
    if (!element) return;
    
    let timer: NodeJS.Timeout;
    
    const showScrollbar = () => {
      element.classList.remove('scrollbar-hidden');
      
      clearTimeout(timer);
      timer = setTimeout(() => {
        element.classList.add('scrollbar-hidden');
      }, timeout);
    };
    
    // Initial hide
    setTimeout(() => {
      element.classList.add('scrollbar-hidden');
    }, timeout);
    
    // Show scrollbar on all interaction events
    element.addEventListener('scroll', showScrollbar);
    element.addEventListener('mouseover', showScrollbar);
    element.addEventListener('mousedown', showScrollbar);
    element.addEventListener('touchstart', showScrollbar);
    element.addEventListener('focus', showScrollbar, true);
    
    return () => {
      clearTimeout(timer);
      element.removeEventListener('scroll', showScrollbar);
      element.removeEventListener('mouseover', showScrollbar);
      element.removeEventListener('mousedown', showScrollbar);
      element.removeEventListener('touchstart', showScrollbar);
      element.removeEventListener('focus', showScrollbar, true);
    };
  };

  // Set up auto-scrolling and auto-hiding of scrollbars
  useEffect(() => {
    // Apply auto-hide to the console output which is scrollable
    const consoleCleanup = scrollbarAutoHide(consoleOutputRef.current);
    
    // Ensure the scrollbars use our custom styling
    if (consoleOutputRef.current) {
      consoleOutputRef.current.classList.add('custom-scrollbar');
      // Force webkit to use our custom scrollbar
      consoleOutputRef.current.style.setProperty('--webkit-scrollbar-width', '4px');
      consoleOutputRef.current.style.setProperty('--webkit-scrollbar-track-color', 'rgba(13, 13, 13, 0.95)');
      consoleOutputRef.current.style.setProperty('--webkit-scrollbar-thumb-color', 'rgba(157, 78, 221, 0.8)');
    }
    
    return () => {
      if (consoleCleanup) consoleCleanup();
    };
  }, []);

  // Auto-scroll to the bottom when console output changes
  useEffect(() => {
    if (consoleOutputRef.current) {
      const scrollTo = () => {
        const element = consoleOutputRef.current;
        if (element) {
          // Only auto-scroll if already at bottom (or close)
          const isNearBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 50;
          if (isNearBottom) {
            element.scrollTop = element.scrollHeight;
          }
        }
      };
      
      // Have multiple scroll attempts to ensure it happens after content is rendered
      scrollTo();
      setTimeout(scrollTo, 50);
      setTimeout(scrollTo, 100);
    }
  }, [consoleOutput]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        boxShadow: [
          'inset 0 0 10px rgba(0, 0, 0, 0.3), 0 0 2px rgba(157, 78, 221, 0.3)',
          'inset 0 0 10px rgba(0, 0, 0, 0.3), 0 0 8px rgba(157, 78, 221, 0.5)',
          'inset 0 0 10px rgba(0, 0, 0, 0.3), 0 0 2px rgba(157, 78, 221, 0.3)'
        ]
      }}
      transition={{ 
        duration: 0.5, 
        boxShadow: {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }}
      className="relative rounded-t-md"
    >
      <div 
        ref={consoleOutputRef} 
        className={`text-gray-300 overflow-y-auto overflow-x-hidden py-2 px-3 text-left custom-scrollbar console-output relative z-10 w-full
          ${size === 'contracted' ? 'max-h-40' : size === 'middle' ? 'max-h-60' : 'max-h-96'}`}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(157, 78, 221, 1) rgba(13, 13, 13, 0.95)',
          background: 'rgba(0, 0, 0, 0.6)',
          boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.5)',
        }}
      >
        {consoleOutput.length === 0 ? (
          // Initial State - Show welcome message
          <div className="text-mauve-light/90 text-xs py-1">
            <div className="relative font-mono text-[10px] sm:text-xs leading-tight mt-1 mb-4 text-center overflow-hidden">
              <pre className="text-mauve bg-black/30 py-2 px-1 rounded border border-mauve/20 inline-block mx-auto max-w-full overflow-x-auto">
{`    ____  _________________ _   ____  __  ____________
   / __ \\/ ____/ ____/ __ \\ | / / / / / / / / ____/ / /
  / / / / __/ / / __/ / / / |/ / / / / / / / __/ / / 
 / /_/ / /___/ /_/ / /_/ / /|  / /_/ / /_/ / /___/ /___
/_____/_____/\\____/\\____/_/ |_/\\____/\\____/_____/_____/
                                                   `}
              </pre>
              
              <motion.div 
                className="absolute left-0 w-full h-[1px] bg-mauve/60"
                animate={{ top: ["0%", "100%"] }}
                transition={{ 
                  duration: 2.5, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
              />
              
              <motion.div 
                className="absolute right-4 top-0 font-mono text-[8px] bg-mauve/20 px-1 rounded"
                animate={{ 
                  color: ["rgba(157, 78, 221, 0.7)", "rgba(255, 255, 255, 0.9)", "rgba(157, 78, 221, 0.7)"] 
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                v4.2.0
              </motion.div>
            </div>
          </div>
        ) : (
          // Map console output when we have entries
          consoleOutput.map((output, i) => {
            // Check the type of message to apply appropriate styling
            const isUserInput = typeof output === 'string' && output.startsWith('$');
            const isError = typeof output === 'string' && output.startsWith('Error:');
            const isAI = typeof output === 'string' && output.startsWith('[Didi]');
            
            return (
              <div 
                key={i} 
                className="pl-1 mb-1 whitespace-pre-wrap"
              >
                {typeof output === 'string' ? (
                  <span 
                    className={
                      isUserInput ? 'text-mauve' : 
                      isError ? 'text-red-400' : 
                      isAI ? 'text-cyan-300' : 
                      'text-green-300'
                    }
                  >
                    {output}
                  </span>
                ) : (
                  output
                )}
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export default TerminalConsole;