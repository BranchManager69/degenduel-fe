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
import React, { useEffect, useRef, useState } from 'react';
import { AIMessage } from '../../../services/ai';
import { TerminalConsoleProps } from '../types';

/**
 * TypeWriter - Creates a typewriter effect for text
 */
interface TypeWriterProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

const TypeWriter: React.FC<TypeWriterProps> = ({ 
  text, 
  speed = 35, // Characters per second (average typing speed)
  className = "",
  onComplete
}) => {
  // Reference to track timeouts for cleanup
  const timeoutsRef = useRef<number[]>([]);
  // Ref to track if component is mounted
  const isMountedRef = useRef(true);
  
  // Use state for actual display text
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  // Use ref for storing the pre-computed final text to avoid calculation on each render
  const finalTextRef = useRef({ prefix: "", content: "" });
  
  // Clear all timeouts on unmount or text change
  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(id => window.clearTimeout(id));
    timeoutsRef.current = [];
  };

  // Use a ref to store the last typed message to prevent repeating the same message
  const lastTypedMessageRef = useRef("");
  
  useEffect(() => {
    // If we've already typed this exact message, just set it directly without animation
    if (lastTypedMessageRef.current === text) {
      setDisplayText(text);
      setIsComplete(true);
      if (onComplete) onComplete();
      return;
    }
    
    // This is a new message, update our reference
    lastTypedMessageRef.current = text;
    
    // Reset component mount state
    isMountedRef.current = true;
    
    // Reset state when text changes
    setIsComplete(false);
    
    // Clean up previous animation
    clearAllTimeouts();
    
    // Parse the text structure only once and store in ref
    const hasDidiPrefix = text.startsWith('[Didi] ');
    finalTextRef.current = {
      prefix: hasDidiPrefix ? '[Didi] ' : '',
      content: hasDidiPrefix ? text.substring(7) : text
    };
    
    // Immediately set the prefix without animation
    setDisplayText(finalTextRef.current.prefix);
    
    // Setup typing sequence with proper closure variables
    let index = 0;
    const contentToType = finalTextRef.current.content;
    
    // Calculate a varying delay: slow down for punctuation, speed up for common letters
    const getTypeDelay = (char: string) => {
      if ('.!?'.includes(char)) return speed * 5; // Pause longer at sentence endings
      if (',;:'.includes(char)) return speed * 3; // Pause at commas and semicolons
      if (' '.includes(char)) return speed * 0.8; // Slightly faster for spaces
      return speed; // Normal speed for regular characters
    };
    
    // Type text gradually with stable timeouts
    const typeNextChar = () => {
      if (!isMountedRef.current) return;
      
      if (index < contentToType.length) {
        // Set the text directly without using unused variables
        setDisplayText(finalTextRef.current.prefix + contentToType.substring(0, index + 1));
        index++;
        
        // Get next character's typing delay
        const nextChar = contentToType[index] || '';
        const delay = getTypeDelay(nextChar);
        
        // Track timeout ID for cleanup
        const timeoutId = window.setTimeout(typeNextChar, delay);
        timeoutsRef.current.push(timeoutId);
      } else {
        // Typing complete - ensure we have the complete text displayed
        setDisplayText(finalTextRef.current.prefix + contentToType);
        setIsComplete(true);
        if (onComplete && isMountedRef.current) onComplete();
      }
    };
    
    // Start typing with initial delay
    const initialTimeoutId = window.setTimeout(() => {
      if (isMountedRef.current) {
        typeNextChar();
      }
    }, 150);
    
    timeoutsRef.current.push(initialTimeoutId);
    
    // Clean up timeouts when component unmounts or text changes
    return () => {
      isMountedRef.current = false;
      clearAllTimeouts();
    };
  }, [text, speed, onComplete]);
  
  return (
    <span className={className}>
      {displayText}
      {!isComplete && (
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="inline-block h-4 w-2 ml-0.5 bg-cyan-300"
        />
      )}
    </span>
  );
};

/**
 * TerminalConsole - Displays terminal output and handles scrolling behavior
 */
export const TerminalConsole: React.FC<TerminalConsoleProps> = ({
  messages,
  size
}) => {
  const consoleOutputRef = useRef<HTMLDivElement>(null);
  
  // Track typing completion for auto-scrolling
  const handleTypingComplete = () => {
    // Scroll to bottom when typing completes
    if (consoleOutputRef.current) {
      consoleOutputRef.current.scrollTop = consoleOutputRef.current.scrollHeight;
    }
  };
  
  // When a new message appears, scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      // Immediately scroll to bottom when new message appears
      if (consoleOutputRef.current) {
        consoleOutputRef.current.scrollTop = consoleOutputRef.current.scrollHeight;
      }
    }
  }, [messages.length]);

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

  // Always auto-scroll to the bottom when console output changes
  useEffect(() => {
    if (consoleOutputRef.current) {
      const scrollTo = () => {
        const element = consoleOutputRef.current;
        if (element) {
          // Always scroll to bottom - don't check position
          element.scrollTop = element.scrollHeight;
        }
      };
      
      // Multiple scroll attempts with increasing delays to ensure it happens
      // even after content is fully rendered
      scrollTo();
      setTimeout(scrollTo, 50);
      setTimeout(scrollTo, 100);
      setTimeout(scrollTo, 200);
      setTimeout(scrollTo, 500); // Extra long timeout for slow devices
    }
  }, [messages]);

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
                   ${size === 'contracted' ? 'h-40' : size === 'middle' ? 'h-60' : 'h-80'}` }
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(157, 78, 221, 1) rgba(13, 13, 13, 0.95)',
          background: 'rgba(0, 0, 0, 0.6)',
          boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.5)',
        }}
      >
        {messages.length === 0 ? (
          // Initial State - Show welcome message
          <div className="text-mauve-light/90 text-xs py-1">
            <div className="relative font-mono text-[10px] sm:text-xs leading-tight mt-1 mb-4 text-center overflow-hidden">
              <pre className="text-mauve bg-black/30 py-2 px-1 rounded border border-mauve/20 inline-block mx-auto max-w-full overflow-x-auto">
{window.innerWidth < 400 ? 
`  ██████╗ ██╗   ██╗███████╗██╗     
  ██╔══██╗██║   ██║██╔════╝██║     
  ██║  ██║██║   ██║█████╗  ██║     
  ██║  ██║██║   ██║██╔══╝  ██║     
  ██████╔╝╚██████╔╝███████╗███████╗
  ╚═════╝  ╚═════╝ ╚══════╝╚══════╝`
: window.innerWidth < 768 ? 
`  ██████╗ ██╗   ██╗███████╗██╗     
  ██╔══██╗██║   ██║██╔════╝██║     
  ██║  ██║██║   ██║█████╗  ██║     
  ██║  ██║██║   ██║██╔══╝  ██║     
  ██████╔╝╚██████╔╝███████╗███████╗
  ╚═════╝  ╚═════╝ ╚══════╝╚══════╝`
:
`    ____  _________________ _   ____  __  ____________
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
          // Map console output when we have entries - only show last 10 lines max
          messages.map((message: AIMessage, i: number) => {
            let prefix = '';
            let content = message.content ?? '';
            let textClassName = 'text-gray-300'; // Default
            let isLastMessage = i === messages.length - 1;
            let useTypingEffect = false;

            switch (message.role) {
              case 'user':
                prefix = '$ ';
                textClassName = 'text-mauve';
                break;
              case 'assistant':
                prefix = '[Didi] ';
                textClassName = 'text-cyan-300';
                // Check for tool calls
                if (message.tool_calls && message.tool_calls.length > 0) {
                    const toolCall = message.tool_calls[0];
                    // Display tool call info instead of null content
                    content = `[Calling tool: ${toolCall.function.name}...]`;
                } else if (message.content !== null) {
                    // Only use typewriter for last assistant text message
                    useTypingEffect = isLastMessage;
                    content = message.content; // Use the actual content
                } else {
                    content = ''; // Handle case where content is null and no tool call
                }
                break;
              case 'system':
                prefix = '[SYSTEM] ';
                textClassName = 'text-gray-400 italic';
                break;
              case 'tool': // Added case for tool results
                 prefix = '[TOOL_RESULT] ';
                 textClassName = 'text-yellow-400';
                 content = message.content ?? ''; // Tool results should have content
                 break;
            }
            
            const key = `msg-${i}-${message.role}-${message.content?.substring(0, 5)}`; // Create a reasonably stable key

            return (
              <motion.div 
                key={key}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="pl-1 mb-1 whitespace-pre-wrap"
              >
                {/* Render prefix directly */}
                {prefix}
                {/* Use TypeWriter only for the last assistant message, otherwise render content directly */}
                {useTypingEffect ? (
                  <TypeWriter 
                    text={content}
                    speed={15}
                    className={textClassName}
                    onComplete={handleTypingComplete}
                  />
                ) : (
                  <span className={textClassName}>{content}</span>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export default TerminalConsole;