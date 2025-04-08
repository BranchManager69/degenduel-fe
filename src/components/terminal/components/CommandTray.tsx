/**
 * @fileoverview
 * Command tray component for the terminal
 * 
 * @description
 * Displays available commands for the user to click
 * 
 * @author Branch Manager
 */

import { motion } from 'framer-motion';
import React from 'react';
import { CommandTrayProps } from '../types';

/**
 * CommandTray - Displays available commands in a tray
 */
export const CommandTray: React.FC<CommandTrayProps> = ({
  commandTrayOpen,
  setCommandTrayOpen,
  commands,
  setUserInput,
  onExecuteCommand,
  easterEggActivated = false
}) => {
  return (
    <motion.div 
      className="mt-5 pt-2 text-left relative"
      initial={{ opacity: 0, y: 10 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        boxShadow: [
          '0 0 0px rgba(157, 78, 221, 0)',
          '0 0 10px rgba(157, 78, 221, 0.3)',
          '0 0 0px rgba(157, 78, 221, 0)'
        ]
      }}
      transition={{ 
        delay: 1.2, 
        duration: 0.8,
        boxShadow: {
          duration: 3,
          repeat: Infinity
        }
      }}
    >
      {/* Scanline effect for commands section */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-mauve/10 to-transparent z-0 pointer-events-none"
        animate={{ 
          y: ['-200%', '500%'] 
        }}
        transition={{ 
          duration: 8, 
          repeat: Infinity,
          ease: "linear"
        }}
        style={{ height: '5px', opacity: 0.4 }}
      />
      
      {/* Command drawer with toggle button */}
      <div className="w-full mt-6 mb-2">
        {/* Command Toggle Button */}
        <button 
          className="mx-auto block bg-black py-2 px-6 rounded-md border-2 border-mauve-light/50 text-white text-sm font-bold flex items-center space-x-2 hover:bg-mauve/20 transition-colors"
          onClick={() => setCommandTrayOpen(!commandTrayOpen)}
        >
          <span className="text-cyan-400 text-base">{commandTrayOpen ? '▲' : '▼'}</span>
          <span>{commandTrayOpen ? 'HIDE COMMANDS' : 'SHOW COMMANDS'}</span>
        </button>
        
        {/* Command List - Animates height */}
        {commandTrayOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-3 p-3 bg-black/80 border border-mauve/40 rounded-md max-h-[200px] overflow-y-auto"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
              {/* Standard commands */}
              {commands.map((cmd, index) => (
                <div 
                  key={index}
                  className="text-mauve-light hover:text-white cursor-pointer text-xs flex items-center bg-black/40 px-2 py-1.5 rounded border border-mauve/20 hover:border-mauve/50 hover:bg-mauve/10 truncate transition-colors"
                  onClick={() => {
                    // Extract just the command part (remove the $ prefix)
                    const command = cmd.trim().replace(/^\$\s*/, '');
                    
                    if (onExecuteCommand) {
                      // Execute the command directly
                      onExecuteCommand(command);
                    } else {
                      // Fallback to just setting input
                      setUserInput(command);
                    }
                  }}
                >
                  <span className="text-cyan-400 mr-1.5 text-[10px] flex-shrink-0">⬢</span> 
                  <span className="truncate">
                    {cmd}
                  </span>
                </div>
              ))}
              
              {/* Easter egg commands */}
              {easterEggActivated && (
                <>
                  <div 
                    className="text-green-400 hover:text-green-300 cursor-pointer text-xs flex items-center bg-black/40 px-2 py-1.5 rounded border border-green-400/20 hover:border-green-400/50 hover:bg-green-400/10 truncate transition-colors"
                    onClick={() => onExecuteCommand ? onExecuteCommand('didi-status') : setUserInput('didi-status')}
                  >
                    <span className="text-green-400 mr-1.5 text-[10px] flex-shrink-0">⬢</span> 
                    <span className="truncate">$ didi-status</span>
                  </div>
                  <div 
                    className="text-green-400 hover:text-green-300 cursor-pointer text-xs flex items-center bg-black/40 px-2 py-1.5 rounded border border-green-400/20 hover:border-green-400/50 hover:bg-green-400/10 truncate transition-colors"
                    onClick={() => onExecuteCommand ? onExecuteCommand('didi-insights') : setUserInput('didi-insights')}
                  >
                    <span className="text-green-400 mr-1.5 text-[10px] flex-shrink-0">⬢</span> 
                    <span className="truncate">$ didi-insights</span>
                  </div>
                  <div 
                    className="text-green-400 hover:text-green-300 cursor-pointer text-xs flex items-center bg-black/40 px-2 py-1.5 rounded border border-green-400/20 hover:border-green-400/50 hover:bg-green-400/10 truncate transition-colors"
                    onClick={() => onExecuteCommand ? onExecuteCommand('didi-history') : setUserInput('didi-history')}
                  >
                    <span className="text-green-400 mr-1.5 text-[10px] flex-shrink-0">⬢</span> 
                    <span className="truncate">$ didi-history</span>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default CommandTray;