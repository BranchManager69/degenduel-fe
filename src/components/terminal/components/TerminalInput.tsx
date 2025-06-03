/**
 * @fileoverview
 * Terminal input component
 * 
 * @description
 * Handles user input in the terminal
 * 
 * @author Branch Manager
 */

import { motion } from 'framer-motion';
import React from 'react';
import { TerminalInputProps } from '../types';
import { VoiceInput } from './VoiceInput';

/**
 * TerminalInput - Handles user input in the terminal
 */
export const TerminalInput: React.FC<TerminalInputProps> = ({
  userInput,
  setUserInput,
  onEnter,
  glitchActive = false,
}) => {
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  
  // Auto-resize textarea
  const adjustHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const scrollHeight = inputRef.current.scrollHeight;
      const lineHeight = 24; // Approximate line height
      const maxLines = 4;
      const maxHeight = lineHeight * maxLines;
      
      inputRef.current.style.height = Math.min(scrollHeight, maxHeight) + 'px';
    }
  };
  
  React.useEffect(() => {
    adjustHeight();
  }, [userInput]);
  
  // Advanced mobile keyboard viewport handling
  React.useEffect(() => {
    let initialViewportHeight = window.visualViewport?.height ?? window.innerHeight;
    let keyboardVisible = false;
    
    const handleViewportChange = () => {
      const currentHeight = window.visualViewport?.height ?? window.innerHeight;
      const heightDifference = initialViewportHeight - currentHeight;
      
      // Keyboard is visible if viewport height is significantly reduced
      const newKeyboardVisible = heightDifference > 150;
      
      if (newKeyboardVisible !== keyboardVisible) {
        keyboardVisible = newKeyboardVisible;
        
        if (keyboardVisible && inputRef.current && document.activeElement === inputRef.current) {
          // Keyboard appeared - scroll input into view with extra padding
          setTimeout(() => {
            const inputElement = inputRef.current;
            if (inputElement) {
              const inputRect = inputElement.getBoundingClientRect();
              const availableHeight = window.visualViewport?.height ?? window.innerHeight;
              const keyboardHeight = window.innerHeight - availableHeight;
              
              // Calculate if input is hidden behind keyboard
              if (inputRect.bottom > availableHeight - 20) {
                // Scroll to position input above keyboard with padding
                const scrollOffset = inputRect.bottom - availableHeight + keyboardHeight + 60;
                window.scrollBy({
                  top: scrollOffset,
                  behavior: 'smooth'
                });
              }
            }
          }, 150); // Small delay to ensure keyboard is fully shown
        }
      }
    };
    
    const handleResize = () => {
      // Fallback for devices without Visual Viewport API
      if (!window.visualViewport) {
        handleViewportChange();
      }
    };
    
    const handleFocus = () => {
      // When input gets focus, prepare for keyboard
      setTimeout(() => {
        if (inputRef.current && document.activeElement === inputRef.current) {
          // Ensure input is in view
          inputRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 300); // Delay to allow keyboard animation
    };
    
    // Use Visual Viewport API if available (modern browsers)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
    } else {
      // Fallback for older browsers
      window.addEventListener('resize', handleResize);
    }
    
    // Listen to focus events
    if (inputRef.current) {
      inputRef.current.addEventListener('focus', handleFocus);
    }
    
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      } else {
        window.removeEventListener('resize', handleResize);
      }
      
      if (inputRef.current) {
        inputRef.current.removeEventListener('focus', handleFocus);
      }
    };
  }, []);

  return (
    <div className="relative border-t border-mauve/30 bg-black/40">
      {/* Status indicator */}
      <div className="absolute top-0 right-0 transform -translate-y-full mr-2">
        <div className="text-[9px] font-mono tracking-widest py-0.5 px-2 rounded-t-sm bg-mauve/10 text-mauve-light border border-mauve/30 border-b-0 inline-flex items-center">
          <motion.span 
            className="inline-block h-1.5 w-1.5 bg-green-400 mr-1.5 rounded-full"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-white/90">SOLANA-CONNECTION-ACTIVE</span>
        </div>
      </div>
      
      {/* Input field */}
      <motion.div 
        className="relative overflow-hidden"
        initial={{ opacity: 0.8 }}
        animate={{ 
          opacity: 1,
          boxShadow: [
            '0 0 2px rgba(157, 78, 221, 0.3)',
            '0 0 8px rgba(157, 78, 221, 0.5)',
            '0 0 2px rgba(157, 78, 221, 0.3)'
          ]
        }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        {/* Animated scan line effect */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-b from-transparent via-mauve/10 to-transparent z-10 pointer-events-none"
          animate={{ 
            y: ['-100%', '200%'] 
          }}
          transition={{ 
            duration: 2, 
            ease: "linear", 
            repeat: Infinity,
            repeatType: "loop" 
          }}
          style={{ height: '10px', opacity: 0.6 }}
        />
        
        {/* Animated border glow effect */}
        <motion.div 
          className="absolute inset-0 rounded pointer-events-none"
          animate={{ 
            boxShadow: [
              'inset 0 0 5px rgba(157, 78, 221, 0.3)',
              'inset 0 0 15px rgba(157, 78, 221, 0.7)',
              'inset 0 0 5px rgba(157, 78, 221, 0.3)'
            ] 
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        
        <div className="flex items-center bg-gradient-to-r from-mauve/10 to-darkGrey-dark/50 px-2 py-1.5 border-0 focus-within:shadow focus-within:shadow-mauve/40 transition-all duration-300 relative z-20 w-full">
          <motion.div 
            className="flex items-center mr-2"
            animate={{ 
              color: [
                'rgba(157, 78, 221, 0.7)',
                'rgba(157, 78, 221, 1)',
                'rgba(157, 78, 221, 0.7)'
              ]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <motion.span 
              className="text-mauve-light font-mono font-bold" 
              animate={{ 
                opacity: [1, 0.4, 1],
                textShadow: [
                  '0 0 3px rgba(157, 78, 221, 0.3)',
                  '0 0 8px rgba(157, 78, 221, 0.7)',
                  '0 0 3px rgba(157, 78, 221, 0.3)'
                ]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              &gt;_
            </motion.span>
          </motion.div>
          
          {/* Voice input button */}
          <VoiceInput
            onTranscript={(transcript) => {
              // Set the transcript as input
              setUserInput(transcript);
              // Don't auto-submit, let user review first
            }}
            onAudioResponse={() => {
              // Audio responses are handled by the Real-Time API directly
              console.log('[TerminalInput] Received audio response');
            }}
            className="mr-2"
          />
          
          {/* Animated placeholder text, visible only when input is empty */}
          {userInput === '' && (
            <div className="absolute left-9 pointer-events-none text-mauve-light/70 font-mono text-sm">
              {/* Typing animation that only plays once */}
              <motion.div
                className="inline-block overflow-hidden whitespace-nowrap"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{
                  duration: 1.5,
                  ease: "easeInOut",
                  repeat: 1,
                  repeatDelay: 15, // Long delay before repeating
                  repeatType: "loop"
                }}
              >
                Ask Didi anything...
              </motion.div>
            </div>
          )}
          
          <textarea
            ref={inputRef}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && userInput.trim()) {
                e.preventDefault(); // Prevent newline
                e.stopPropagation(); // Stop event bubbling
                
                // Add small delay for mobile to ensure proper keyboard handling
                const isMobile = window.innerWidth <= 768;
                const processCommand = () => {
                  const command = userInput.trim();
                  setUserInput('');
                  onEnter(command);
                };
                
                if (isMobile) {
                  // Small delay for mobile keyboards
                  setTimeout(processCommand, 100);
                } else {
                  processCommand();
                }
              }
              // Allow Shift+Enter for new lines
            }}
            onInput={() => {
              // Ensure input stays visible while typing on mobile
              if (inputRef.current && document.activeElement === inputRef.current) {
                const isMobile = window.innerWidth <= 768;
                if (isMobile) {
                  setTimeout(() => {
                    inputRef.current?.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'nearest',
                      inline: 'nearest'
                    });
                  }, 50);
                }
              }
            }}
            className="w-full bg-transparent outline-none border-none text-white placeholder-mauve-dark/50 focus:ring-0 resize-none"
            // THIS IS *BEHIND* THE TRUE INPUT FIELD!
            placeholder=""
            autoComplete="off"
            spellCheck="false"
            rows={1}
            // The key properties to prevent iOS zoom: font-size at least 16px and user-scalable=no
            style={{ 
              color: 'rgba(255, 255, 255, 0.95)', 
              caretColor: 'rgb(157, 78, 221)',
              textShadow: glitchActive ? '0 0 8px rgba(255, 50, 50, 0.8)' : '0 0 5px rgba(157, 78, 221, 0.6)',
              backgroundColor: 'rgba(20, 20, 30, 0.3)',
              transition: 'all 0.3s ease',
              fontSize: '16px', // Critical for preventing iOS zoom
              touchAction: 'manipulation', // Helps with touch handling
              lineHeight: '24px',
              minHeight: '24px',
              maxHeight: '96px', // 4 lines max
              overflowY: 'auto'
            }}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default TerminalInput;