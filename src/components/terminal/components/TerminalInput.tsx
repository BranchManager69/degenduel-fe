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

/**
 * TerminalInput - Handles user input in the terminal
 */
export const TerminalInput: React.FC<TerminalInputProps> = ({
  userInput,
  setUserInput,
  onEnter,
  glitchActive = false,
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

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
          <span className="text-white/90">SECURE-CHANNEL-ACTIVE</span>
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
                EXECUTE COMMAND::_
              </motion.div>
            </div>
          )}
          
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && userInput.trim()) {
                // Process user command
                const command = userInput.trim();
                setUserInput('');
                
                // Call the onEnter callback
                onEnter(command);
              }
            }}
            className="w-full bg-transparent outline-none border-none text-white placeholder-mauve-dark/50 focus:ring-0"
            placeholder="Enter command or ask a question..."
            autoComplete="off"
            spellCheck="false"
            style={{ 
              color: 'rgba(255, 255, 255, 0.95)', 
              caretColor: 'rgb(157, 78, 221)',
              textShadow: glitchActive ? '0 0 8px rgba(255, 50, 50, 0.8)' : '0 0 5px rgba(157, 78, 221, 0.6)',
              backgroundColor: 'rgba(20, 20, 30, 0.3)',
              transition: 'all 0.3s ease'
            }}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default TerminalInput;