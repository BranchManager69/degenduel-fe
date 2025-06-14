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
import React, { useEffect, useRef, useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { AIMessage } from '../../../services/ai';
import { useStore } from '../../../store/useStore';
import { TerminalConsoleProps } from '../types';

/**
 * MarkdownRenderer - Renders markdown with terminal-appropriate styling
 */
interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  return (
    <span className={className}>
      <ReactMarkdown
        components={{
          // Style markdown elements for terminal
          p: ({ children }) => <span className="inline">{children}</span>,
          strong: ({ children }) => <span className="text-purple-300 font-bold">{children}</span>,
          em: ({ children }) => <span className="text-cyan-300 italic">{children}</span>,
          h1: ({ children }) => <span className="text-mauve text-lg font-bold block mb-2">{children}</span>,
          h2: ({ children }) => <span className="text-mauve-light text-base font-bold block mb-1">{children}</span>,
          h3: ({ children }) => <span className="text-purple-300 font-semibold block mb-1">{children}</span>,
          ul: ({ children }) => <div className="ml-2">{children}</div>,
          ol: ({ children }) => <div className="ml-2">{children}</div>,
          li: ({ children }) => <div className="text-gray-300">• {children}</div>,
          a: ({ children, href }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 underline"
            >
              {children}
            </a>
          ),
          code: ({ children }) => (
            <span className="bg-gray-800 text-green-400 px-1 rounded text-sm">
              {children}
            </span>
          ),
          blockquote: ({ children }) => (
            <div className="border-l-2 border-purple-500 pl-2 ml-2 text-gray-400 italic">
              {children}
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </span>
  );
};

/**
 * TypeWriterMarkdown - Creates a typewriter effect for markdown text
 */
interface TypeWriterMarkdownProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

const TypeWriterMarkdown: React.FC<TypeWriterMarkdownProps> = ({ 
  text, 
  speed = 35,
  className = "",
  onComplete
}) => {
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const timeoutsRef = useRef<number[]>([]);
  const isMountedRef = useRef(true);
  const lastTypedMessageRef = useRef("");

  // Clear all timeouts on unmount or text change
  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(id => window.clearTimeout(id));
    timeoutsRef.current = [];
  };

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
    
    // Parse for Didi prefix
    const hasDidiPrefix = text.startsWith('[Didi] ');
    const prefix = hasDidiPrefix ? '[Didi] ' : '';
    const contentToType = hasDidiPrefix ? text.substring(7) : text;
    
    // Immediately set the prefix without animation
    setDisplayText(prefix);
    
    // Setup typing sequence
    let index = 0;
    
    // Calculate a varying delay
    const getTypeDelay = (char: string) => {
      if ('.!?'.includes(char)) return speed * 5;
      if (',;:'.includes(char)) return speed * 3;
      if (' '.includes(char)) return speed * 0.8;
      return speed;
    };
    
    // Type text gradually
    const typeNextChar = () => {
      if (!isMountedRef.current) return;
      
      if (index < contentToType.length) {
        setDisplayText(prefix + contentToType.substring(0, index + 1));
        index++;
        
        const nextChar = contentToType[index] || '';
        const delay = getTypeDelay(nextChar);
        
        const timeoutId = window.setTimeout(typeNextChar, delay);
        timeoutsRef.current.push(timeoutId);
      } else {
        setDisplayText(prefix + contentToType);
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
    
    return () => {
      isMountedRef.current = false;
      clearAllTimeouts();
    };
  }, [text, speed, onComplete]);
  
  return (
    <span className={className}>
      <MarkdownRenderer content={displayText} className={className} />
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
 * TypeWriter - Creates a typewriter effect for text
 * @deprecated Use TypeWriterMarkdown instead for proper markdown support
 */
/*
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
*/

/**
 * TerminalConsole - Displays terminal output and handles scrolling behavior
 */
export const TerminalConsole: React.FC<TerminalConsoleProps> = ({
  messages,
  size
}) => {
  const consoleOutputRef = useRef<HTMLDivElement>(null);
  const { user } = useStore();
  const [imageError, setImageError] = useState(false);
  
  // Get user profile image (same logic as MobileMenuButton)
  const profileImageUrl = useMemo(() => {
    if (!user || imageError || !user?.profile_image?.url) {
      return "/assets/media/default/profile_pic.png";
    }
    return user.profile_image.thumbnail_url || user.profile_image.url;
  }, [user, user?.profile_image, imageError]);
  
  const handleImageError = () => {
    setImageError(true);
  };
  
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

  // Auto-scroll during streaming when content changes
  useEffect(() => {
    if (messages.length > 0 && consoleOutputRef.current) {
      const lastMessage = messages[messages.length - 1];
      
      // Check if we should auto-scroll during streaming
      const shouldAutoScroll = () => {
        const element = consoleOutputRef.current;
        if (!element) return false;
        
        // Only auto-scroll if user is already near the bottom (within 100px)
        const isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 100;
        
        // Always auto-scroll for the last assistant message (streaming)
        const isLastAssistantMessage = lastMessage?.role === 'assistant';
        
        return isNearBottom || isLastAssistantMessage;
      };
      
      if (shouldAutoScroll()) {
        // Smooth scroll to bottom
        consoleOutputRef.current.scrollTo({
          top: consoleOutputRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [messages]); // Triggers on any message content change

  // Enhanced auto-scroll for streaming with MutationObserver
  useEffect(() => {
    const element = consoleOutputRef.current;
    if (!element) return;

    let isUserScrolling = false;
    let scrollTimeout: NodeJS.Timeout;

    // Track if user is manually scrolling
    const handleUserScroll = () => {
      isUserScrolling = true;
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isUserScrolling = false;
      }, 1000); // Consider user done scrolling after 1 second
    };

    // Auto-scroll function with user scroll detection
    const autoScrollToBottom = () => {
      if (!element || isUserScrolling) return;
      
      const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 50;
      const hasContent = element.scrollHeight > element.clientHeight;
      
      if (hasContent && (isAtBottom || !isUserScrolling)) {
        element.scrollTo({
          top: element.scrollHeight,
          behavior: 'smooth'
        });
      }
    };

    // Watch for content changes (like streaming text)
    const observer = new MutationObserver((mutations) => {
      let hasContentChange = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          hasContentChange = true;
        }
      });
      
      if (hasContentChange) {
        // Small delay to let content render
        setTimeout(autoScrollToBottom, 10);
      }
    });

    // Start observing
    observer.observe(element, {
      childList: true,
      subtree: true,
      characterData: true
    });

    // Add scroll listener
    element.addEventListener('scroll', handleUserScroll);

    // Cleanup
    return () => {
      observer.disconnect();
      element.removeEventListener('scroll', handleUserScroll);
      clearTimeout(scrollTimeout);
    };
  }, []); // Only setup once

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
                   ${size === 'contracted'
                     ? 'h-24'
                     : size === 'middle'
                     ? 'h-60'
                     : 'h-80 xl:h-96'}` }
        onWheel={(e) => {
          // Enhanced scroll handling for the conversation area
          const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
          const deltaY = e.deltaY;
          const isScrollable = scrollHeight > clientHeight;
          
          if (isScrollable) {
            // Check if we're at scroll boundaries
            const isAtTop = scrollTop === 0 && deltaY < 0;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1 && deltaY > 0;
            
            // Only prevent propagation if we're scrolling within bounds
            if (!isAtTop && !isAtBottom) {
              e.stopPropagation();
            }
          } else {
            // If content isn't scrollable, just stop propagation to prevent background scroll
            // Don't call preventDefault() as it causes passive event listener errors
            e.stopPropagation();
          }
        }}
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
            <div className="relative text-[10px] sm:text-xs leading-tight mt-1 mb-4 text-center overflow-hidden">
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
                className="absolute right-4 top-0 text-[8px] bg-mauve/20 px-1 rounded"
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
                prefix = '';
                textClassName = 'text-mauve';
                break;
              case 'assistant':
                prefix = '';
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
                prefix = '';
                textClassName = 'text-gray-400 italic text-center';
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
                className={message.role === 'system' ? "whitespace-pre-wrap text-center" : "pl-1 whitespace-pre-wrap"}
              >
                {/* Render user profile picture or robot emoji for Didi */}
                {message.role === 'user' ? (
                  user ? (
                    <div className="inline-block mr-2 align-top mt-0.5">
                      <img
                        src={profileImageUrl}
                        alt="You"
                        onError={handleImageError}
                        className="w-4 h-4 rounded-full object-cover ring-1 ring-mauve/30"
                        loading="eager"
                      />
                    </div>
                  ) : (
                    <span className="text-mauve mr-1">$ </span>
                  )
                ) : message.role === 'assistant' && !content.startsWith('🤖') ? (
                  <span className="text-lg mr-2 align-top inline-block">🤖</span>
                ) : message.role === 'assistant' ? null : (
                  prefix
                )}
                {/* Show thinking indicator for empty assistant messages */}
                {message.role === 'assistant' && !content && useTypingEffect ? (
                  <span className="inline-flex items-center gap-1 text-purple-400">
                    <span className="text-sm">Thinking</span>
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      className="inline-flex gap-0.5"
                    >
                      <span className="w-1 h-1 bg-purple-400 rounded-full" />
                      <motion.span 
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                        className="w-1 h-1 bg-purple-400 rounded-full" 
                      />
                      <motion.span 
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                        className="w-1 h-1 bg-purple-400 rounded-full" 
                      />
                    </motion.span>
                  </span>
                ) : (
                  /* Use TypeWriter only for the last assistant message, otherwise render content directly */
                  useTypingEffect ? (
                    <TypeWriterMarkdown 
                      text={content.startsWith('ERROR:') ? content.substring(6) : content}
                      speed={15}
                      className={content.startsWith('ERROR:') ? 'text-red-300' : textClassName}
                      onComplete={handleTypingComplete}
                    />
                  ) : (
                    // Render markdown for AI responses, plain text for others
                    message.role === 'assistant' ? (
                      <MarkdownRenderer 
                        content={content.startsWith('ERROR:') ? content.substring(6) : content}
                        className={content.startsWith('ERROR:') ? 'text-red-300' : textClassName}
                      />
                    ) : (
                      <span className={content.startsWith('ERROR:') ? 'text-red-300' : textClassName}>
                        {content.startsWith('ERROR:') ? content.substring(6) : content}
                      </span>
                    )
                  )
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