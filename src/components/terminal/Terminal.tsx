
import { motion, useMotionValue } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getChatResponse, getFallbackResponse } from '../../utils/openai';

// We need to port the DecryptionTimer component as well
export const DecryptionTimer = ({ targetDate = new Date('2025-03-15T18:00:00-05:00') }: { targetDate?: Date }) => {
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();
      
      if (difference <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setTimeRemaining({ days, hours, minutes, seconds });
    };
    
    calculateTimeRemaining();
    const timer = setInterval(calculateTimeRemaining, 1000);
    
    return () => clearInterval(timer);
  }, [targetDate]);
  
  const isComplete = timeRemaining.days === 0 && 
                   timeRemaining.hours === 0 && 
                   timeRemaining.minutes === 0 && 
                   timeRemaining.seconds === 0;
                   
  return (
    <div className="font-orbitron">
      {isComplete ? (
        <motion.div 
          className="text-2xl text-green-400 font-bold"
          initial={{ scale: 1 }}
          animate={{ 
            scale: [1, 1.1, 1],
            textShadow: [
              '0 0 5px rgba(74, 222, 128, 0.5)',
              '0 0 20px rgba(74, 222, 128, 0.8)',
              '0 0 5px rgba(74, 222, 128, 0.5)'
            ]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          ACCESS GRANTED
        </motion.div>
      ) : (
        <div>
          <div className="flex justify-center space-x-4">
            <TimeUnit value={timeRemaining.days} label="DAYS" />
            <TimeUnit value={timeRemaining.hours} label="HRS" />
            <TimeUnit value={timeRemaining.minutes} label="MIN" />
            <TimeUnit value={timeRemaining.seconds} label="SEC" />
          </div>
        </div>
      )}
    </div>
  );
};

const TimeUnit = ({ value, label }: { value: number, label: string }) => (
  <div className="flex flex-col items-center">
    <motion.div 
      className="text-lg sm:text-xl lg:text-2xl font-bold text-white"
      animate={{ 
        textShadow: [
          '0 0 2px rgba(157, 78, 221, 0.3)',
          '0 0 8px rgba(157, 78, 221, 0.5)',
          '0 0 2px rgba(157, 78, 221, 0.3)'
        ]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {value.toString().padStart(2, '0')}
    </motion.div>
    <div className="text-xs text-mauve-light opacity-80">{label}</div>
  </div>
);

// Types
interface TerminalProps {
  config: {
    RELEASE_DATE: Date;
    CONTRACT_ADDRESS: string;
    DISPLAY: {
      DATE_SHORT: string;
      DATE_FULL: string;
      TIME: string;
    }
  };
  onCommandExecuted?: (command: string, response: string) => void;
}

// OpenAI utilities are imported from '../../utils/openai'

export function Terminal({ config, onCommandExecuted }: TerminalProps) {
  const onTerminalExit = () => {
    // Check if parent component is App and notify it when contract should be revealed
    if (window && window.parent) {
      // Use custom event to communicate with parent App component
      const event = new CustomEvent('terminal-exit-complete', { detail: { complete: true } });
      window.dispatchEvent(event);
    }
  };
  // State
  const [userInput, setUserInput] = useState('');
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [contractAddress, setContractAddress] = useState('[     REDACTED     ]');
  const [showContractReveal, setShowContractReveal] = useState(false);
  const [revealStage, setRevealStage] = useState(0);
  const [terminalMinimized, setTerminalMinimized] = useState(false);
  const [terminalExitComplete, setTerminalExitComplete] = useState(false);
  const [currentPhrase, setCurrentPhrase] = useState('');

  // Refs
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalContentRef = useRef<HTMLDivElement>(null);
  const consoleOutputRef = useRef<HTMLDivElement>(null);
  
  // Motion values
  const glitchAmount = useMotionValue(0);
  
  // Calculate current state
  const now = useMemo(() => new Date(), []);
  const isReleaseTime = now >= config.RELEASE_DATE;
  
  // Calculate how close we are to the release date
  const daysUntilRelease = Math.max(0, Math.floor((config.RELEASE_DATE.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  
  // Time-gated commands
  const timeGatedCommands = useMemo(() => [
    // Always visible (stage 0)
    [
      "$ help",
      "$ status",
      "$ ping",
      "$ about",
      "$ contract",
      "$ access",
    ],
    // 48 hours before release (stage 1)
    [
      "$ scan-network",
      "$ check-wallet-balance",
    ],
    // 24 hours before release (stage 2)
    [
      "$ decrypt-partial --level=1",
      "$ view-roadmap",
    ],
    // 2 hours before release (stage 3)
    [
      "$ decrypt-partial --level=2",
      "$ load-preview",
      "$ check-whitelist",
    ],
    // 15 minutes before release (stage 4)
    [
      "$ decrypt-partial --level=3",
      "$ prepare-launch-sequence",
    ]
  ], []);

  // Secret phrases that animate in the terminal
  const secretPhrases = useMemo(() => {
    // Base phrases always shown
    const baseMessages = [
      "// Initializing encryption sequence",
      "// Accessing secure blockchain node",
      "// Analyzing market potential",
      "// Degen levels: EXTREME",
      "// Battle protocol activated",
      "// Players ready: WAITING FOR CONFIRMATION",
      "// Running final security checks",
      `// Access restricted until ${config.DISPLAY.DATE_FULL}`
    ];
    
    // Only show token contract message when we're close to release
    const hoursUntilRelease = (config.RELEASE_DATE.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilRelease <= 1) {
      // Insert "Token contract detected" as the third item
      return [
        ...baseMessages.slice(0, 2),
        "// Token contract detected",
        ...baseMessages.slice(2)
      ];
    }
    
    return baseMessages;
  }, [now, config.DISPLAY.DATE_FULL, config.RELEASE_DATE]);

  // Contract teaser displayed when not revealed
  const contractTeaser = "[     REDACTED     ]";

  // Scrollbar auto-hide effect
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
    
    element.addEventListener('scroll', showScrollbar);
    element.addEventListener('mouseover', showScrollbar);
    element.addEventListener('mousedown', showScrollbar);
    
    return () => {
      clearTimeout(timer);
      element.removeEventListener('scroll', showScrollbar);
      element.removeEventListener('mouseover', showScrollbar);
      element.removeEventListener('mousedown', showScrollbar);
    };
  };

  // Terminal text animation effect
  useEffect(() => {
    // If it's past release date, skip the encryption animation
    if (isReleaseTime) {
      return;
    }
    
    let phraseIndex = 0;
    let charIndex = 0;
    
    const animateNextPhrase = () => {
      // If we've gone through all phrases, stop
      if (phraseIndex >= secretPhrases.length) {
        return;
      }
      
      // Type out current phrase
      const typeInterval = setInterval(() => {
        const currentText = secretPhrases[phraseIndex].substring(0, charIndex + 1);
        setCurrentPhrase(currentText);
        
        charIndex++;
        
        if (charIndex >= secretPhrases[phraseIndex].length) {
          clearInterval(typeInterval);
          
          // After showing the complete phrase for 3 seconds, move to next
          setTimeout(() => {
            setCurrentPhrase('');
            phraseIndex++;
            charIndex = 0;
            
            // Start typing the next phrase after a short pause
            setTimeout(() => {
              animateNextPhrase();
            }, 500);
          }, 3000);
        }
      }, 50);
    };
    
    // Start the animation
    animateNextPhrase();
    
    // Cleanup function (for component unmount)
    return () => {};
  }, [isReleaseTime, secretPhrases]);

  // Apply the scrollbar auto-hide to our scrollable areas
  useEffect(() => {
    const terminalCleanup = scrollbarAutoHide(terminalContentRef.current);
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
      if (terminalCleanup) terminalCleanup();
      if (consoleCleanup) consoleCleanup();
    };
  }, []);
  
  // Update when the component mounts
  useEffect(() => {
    // When countdown reaches zero, reveal contract
    if (isReleaseTime && !showContractReveal) {
      setShowContractReveal(true);
      setContractAddress(config.CONTRACT_ADDRESS);
    }
    
    // Force window to top when component mounts
    window.scrollTo(0, 0);
    
    // Set the reveal stage based on hours/minutes until release
    const hoursUntilRelease = (config.RELEASE_DATE.getTime() - now.getTime()) / (1000 * 60 * 60);
    const minutesUntilRelease = (config.RELEASE_DATE.getTime() - now.getTime()) / (1000 * 60);
    
    if (minutesUntilRelease <= 15) {
      setRevealStage(4);
    } else if (hoursUntilRelease <= 2) {
      setRevealStage(3);
    } else if (hoursUntilRelease <= 24) {
      setRevealStage(2);
    } else if (hoursUntilRelease <= 48) {
      setRevealStage(1);
    } else {
      setRevealStage(0);
    }
  }, [daysUntilRelease, isReleaseTime, showContractReveal, now, config]);

  // Auto-restore minimized terminal after a delay
  useEffect(() => {
    if (terminalMinimized) {
      const restoreTimeout = setTimeout(() => {
        setTerminalMinimized(false);
      }, 5000);
      
      return () => clearTimeout(restoreTimeout);
    }
  }, [terminalMinimized]);

  // Default contract state from CONFIG
  useEffect(() => {
    setContractAddress(config.CONTRACT_ADDRESS);
  }, [config.CONTRACT_ADDRESS]);

  // Random glitch effect for contract address
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      glitchAmount.set(Math.random() * 0.03);
    }, 100);
    
    return () => clearInterval(glitchInterval);
  }, [glitchAmount]);

  return (
    <div className="terminal-container max-w-lg w-full mx-auto">
      {!terminalMinimized && (
        <motion.div 
          ref={terminalRef}
          key="terminal"
          className="bg-darkGrey-dark/80 border border-mauve/30 font-mono text-sm relative p-4 rounded-md max-w-full w-full"
          style={{ 
            perspective: "1000px",
            transformStyle: "preserve-3d",
            transformOrigin: "center center",
            overflow: "hidden",
            maxWidth: "100%",
            textAlign: "left" /* Ensure all text is left-aligned by default */
          }}
          initial={{ 
            opacity: 0, 
            scale: 0.6, 
            y: -40,
            rotateX: 35,
            filter: "brightness(1.8) blur(8px)"
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            filter: "brightness(1) blur(0px)",
            boxShadow: [
              '0 0 10px rgba(157, 78, 221, 0.2)',
              '0 0 20px rgba(157, 78, 221, 0.4)',
              '0 0 10px rgba(157, 78, 221, 0.2)',
            ],
            rotateX: [-1, 1, -1],
            rotateY: [-2, 0, 2, 0, -2]
          }}
          exit={showContractReveal ? {
            opacity: 0,
            scale: 1.5,
            filter: "brightness(2) blur(10px)",
            transition: { 
              duration: 0.8,
              ease: "backOut"
            }
          } : {
            opacity: 0,
            scale: 0.9,
            y: 20,
            rotateX: -25,
            filter: "brightness(0.8) blur(5px)",
            transition: { 
              duration: 0.5,
              ease: "easeInOut"
            }
          }}
          transition={{
            opacity: { duration: 0.9, ease: "easeInOut" },
            scale: { duration: 0.9, ease: [0.19, 1.0, 0.22, 1.0] },
            y: { duration: 0.9, ease: "easeOut" },
            filter: { duration: 1, ease: "easeInOut" },
            rotateX: {
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            },
            rotateY: {
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut"
            },
            boxShadow: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
          whileHover={{
            rotateX: 0,
            rotateY: 0,
            scale: 1.02,
            transition: { duration: 0.3 }
          }}
          onAnimationComplete={(definition) => {
            // When the exit animation completes
            if (definition === "exit" && showContractReveal) {
              setTerminalExitComplete(true);
              onTerminalExit(); // Notify parent component
            }
          }}
        >
          {/* Terminal header */}
          <div className="flex items-center justify-between border-b border-mauve/30 mb-2 pb-1">
            <div className="text-mauve-light flex items-center">
              <div className="flex mr-2">
                {/* Interactive terminal buttons with actual functionality */}
                <motion.div 
                  className="w-3 h-3 rounded-full bg-red-500 mr-2 cursor-pointer"
                  whileHover={{ scale: 1.2, boxShadow: "0 0 8px rgba(255, 0, 0, 0.8)" }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setTerminalMinimized(true)}
                  title="Close terminal (it will reappear in 5 seconds)"
                />
                <motion.div 
                  className="w-3 h-3 rounded-full bg-yellow-500 mr-2 cursor-pointer"
                  whileHover={{ scale: 1.2, boxShadow: "0 0 8px rgba(255, 255, 0, 0.8)" }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setTerminalMinimized(true)}
                  title="Minimize terminal (it will reappear in 5 seconds)"
                />
                <motion.div 
                  className="w-3 h-3 rounded-full bg-green-500 cursor-pointer" 
                  whileHover={{ scale: 1.2, boxShadow: "0 0 8px rgba(0, 255, 0, 0.8)" }}
                  whileTap={{ scale: 0.9 }}
                  title="Maximize terminal"
                />
              </div>
              root@degenduel:~$ ./decrypt.sh
            </div>
            <motion.div
              className="text-white/40 text-xs font-mono uppercase tracking-wider cursor-help relative group"
              whileHover={{ 
                color: "rgba(157, 78, 221, 0.9)",
                textShadow: "0 0 5px rgba(157, 78, 221, 0.5)"
              }}
            >
              CLASSIFIED
              <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/80 text-white p-2 rounded text-xs -bottom-16 right-0 w-48 pointer-events-none">
                DegenDuel Protocol v1.0.2
                <br />Code: ALPHA-7721-ZETA
                <br />Access level: RESTRICTED
              </div>
            </motion.div>
          </div>
        
          {/* Terminal content with custom scrollbar styling */}
          <div 
            ref={terminalContentRef} 
            className="text-white/70 max-h-[480px] overflow-y-auto p-3 pr-3 pb-4 custom-scrollbar console-output text-sm"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(157, 78, 221, 1) rgba(13, 13, 13, 0.95)'
            }}
          >
            <motion.div
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              {currentPhrase}
              <span className="ml-1 inline-block w-2 h-4 bg-mauve-light animate-pulse"></span>
            </motion.div>
            
            {/* Contract address teaser */}
            <motion.div 
              className="mt-4 text-white/50 cursor-help text-left"
              animate={showContractReveal ? {
                opacity: [0.3, 1],
                color: [
                  'rgba(157, 78, 221, 0.3)',
                  'rgba(0, 255, 0, 0.9)'
                ],
                textShadow: [
                  "0 0 2px rgba(157, 78, 221, 0.5)",
                  "0 0 15px rgba(0, 255, 0, 0.8)"
                ],
                scale: [1, 1.1],
                y: [0, -5]
              } : {
                opacity: [0.3, 0.8, 0.3],
                color: [
                  'rgba(157, 78, 221, 0.3)',
                  'rgba(157, 78, 221, 0.7)',
                  'rgba(157, 78, 221, 0.3)'
                ]
              }}
              transition={showContractReveal ? {
                duration: 1.5,
                times: [0, 1],
                ease: "easeInOut"
              } : { 
                duration: 3, 
                repeat: Infinity 
              }}
              whileHover={{ 
                scale: showContractReveal ? 1.15 : 1.02,
                textShadow: showContractReveal 
                  ? "0 0 15px rgba(0, 255, 0, 0.8)"
                  : "0 0 8px rgba(157, 78, 221, 0.8)"
              }}
              style={{
                textShadow: showContractReveal 
                  ? "0 0 10px rgba(0, 255, 0, 0.6)"
                  : "0 0 2px rgba(157, 78, 221, 0.5)",
                filter: !showContractReveal ? `blur(${glitchAmount}px)` : undefined,
              }}
              onMouseEnter={() => {
                if (!showContractReveal) {
                  const randomGlitches = setInterval(() => {
                    glitchAmount.set(Math.random() * 0.08);
                  }, 50);
                  
                  setTimeout(() => clearInterval(randomGlitches), 1000);
                }
              }}
            >
              $ Contract address: <span className={showContractReveal ? "bg-green-500/30 px-1" : "bg-mauve/20 px-1"}>
                {showContractReveal ? contractAddress : contractTeaser}
              </span>
            </motion.div>
            
            <motion.div 
              className="mt-2 text-mauve/50 text-left"
              animate={{
                opacity: [0.4, 0.7, 0.4]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              $ Access blocked until: {config.DISPLAY.DATE_SHORT} | {config.DISPLAY.TIME}
            </motion.div>
            
            {/* Prominent countdown timer */}
            <div className="mt-6 mb-6 border-y border-mauve/30 py-4">
              <div className="text-center">
                <motion.div 
                  className="uppercase tracking-[0.3em] text-sm text-white/60 font-orbitron mb-3"
                  animate={{
                    opacity: [0.6, 0.8, 0.6],
                    textShadow: [
                      '0 0 0px rgba(157, 78, 221, 0)',
                      '0 0 5px rgba(157, 78, 221, 0.5)',
                      '0 0 0px rgba(157, 78, 221, 0)',
                    ]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  Decryption Protocol
                </motion.div>
                <DecryptionTimer targetDate={config.RELEASE_DATE} />
              </div>
            </div>
            
            {/* Console output display (merged with AI chat responses) */}
            <div 
              ref={consoleOutputRef} 
              className="mt-3 text-green-400/80 overflow-y-auto overflow-x-hidden h-[140px] border-t border-b border-mauve/20 py-2 text-left custom-scrollbar console-output"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(157, 78, 221, 1) rgba(13, 13, 13, 0.95)'
              }}
            >
              {consoleOutput.map((output, i) => (
                <div key={i} className={`mb-1 break-words whitespace-pre-wrap ${output.startsWith('> ') ? 'text-mauve-light/80' : output.startsWith('Error:') ? 'text-red-400/90' : output.startsWith('[AI]') ? 'text-cyan-400/90' : 'text-white/80'}`}>
                  {output}
                </div>
              ))}
              {consoleOutput.length === 0 && (
                <div className="text-white/40 italic text-xs">Type commands below or ask AI questions. Try 'help' to see available options.</div>
              )}
            </div>
            
            {/* Unified user input area - always visible at bottom */}
            <div className="mt-4 flex items-center bg-gradient-to-r from-mauve/5 to-darkGrey-dark/30 rounded px-2 py-1.5 border border-mauve/20 focus-within:border-mauve/40 focus-within:shadow-sm focus-within:shadow-mauve/30">
              <span className="text-mauve-light font-mono font-bold mr-2">$</span>
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
                    
                    // Command responses
                    const commandMap: Record<string, string> = {
                      help: "Available commands: help, status, ping, decrypt, access, about, contract, clear\nAI: Type any question to speak with the AI assistant.",
                      status: "System status: ENCRYPTED | Awaiting authorization.",
                      ping: "Connection established. Signal strength: STRONG.",
                      decrypt: "Decryption failed: Missing authentication key. Try again after launch.",
                      "01-rh4-t5p": ">>> SYSTEM SCAN INITIATED <<<\n\n█████████████████████████████████ 100%\n\nSECURITY LEVEL: CRITICAL\nDIAGNOSTIC: Restricted memory sector breach detected\nTARGET: Sector 447\nRECOMMENDED ACTION: Execute sector-breach-447 protocol",
                      diagnostics: ">>> RUNNING FULL SYSTEM DIAGNOSTIC <<<\n\n[Systems Check]:  ONLINE\n[Security]:       WARNING\n[Access Control]: COMPROMISED\n[Protocol]:       sector-breach activated\n\nANOMALY DETECTED: Unauthorized entry point at sector 447",
                      "sector-breach-447": ">>> EMERGENCY OVERRIDE INITIATED <<<\n\nACCESS LEVEL: ADMINISTRATOR\nSTATUS: GRANTED\nCODE: DEGEN-PHOENIX-447\n\n>>> EARLY ACCESS PROTOCOL ACTIVATED <<<\nGenesis position confirmed. Store this access code securely.\n\nTHIS MESSAGE IS CLASSIFIED. TERMINAL ACCESS WILL BE WIPED.",
                      access: "Access denied: Clearance level insufficient.",
                      about: "DegenDuel: Next-generation competitive platform for crypto enthusiasts.",
                      contract: "Contract access restricted until official launch date.",
                      "scan-network": "Scanning network... Network status: 245 nodes active. All systems operational.",
                      "check-wallet-balance": "Wallet balance check initiated. Current balance: 0.00 DEGEN tokens. Tokens will be available after launch.",
                      "decrypt-partial --level=1": "Partial decryption successful (Level 1). Fragment recovered: 'Community allocation: 50%, Launch mechanism: Dutch auction'",
                      "decrypt-partial --level=2": "Partial decryption successful (Level 2). Fragment recovered: 'Initial liquidity: 30% locked for 6 months. Anti-bot measures active.'",
                      "decrypt-partial --level=3": "Partial decryption successful (Level 3). Fragment recovered: 'Token utility: Governance + Staking rewards. Buyback mechanism initialized.'",
                      "view-roadmap": "DegenDuel Roadmap:\nPhase 1: Initial Launch\nPhase 2: Tournament system\nPhase 3: Partner integrations\nPhase 4: Mobile application\nPhase 5: Cross-chain expansion",
                      "load-preview": "Loading preview... Preview access restricted. Join Discord for early preview eligibility.",
                      "check-whitelist": "Whitelist status: Not found. Visit Discord for whitelist opportunities.",
                      "prepare-launch-sequence": "Launch sequence preparation in progress. T-minus 15 minutes to protocol activation."
                    };
                    
                    // Add command to output
                    let response: string;
                    
                    // For the sector-breach command, add ASCII art
                    if (command.toLowerCase() === 'sector-breach-447') {
                      const accessGrantedArt = `
   _____                             _____                    _           _ 
  / ____|                           / ____|                  | |         | |
 | |     ___  _ __ ___  _ __  _   _| |  __ _ __ __ _ _ __ ___| |_ ___  __| |
 | |    / _ \\| '_ \` _ \\| '_ \\| | | | | |_ | '__/ _\` | '__/ _ \\ __/ _ \\/ _\` |
 | |___| (_) | | | | | | |_) | |_| | |__| | | | (_| | | |  __/ ||  __/ (_| |
  \\_____\\___/|_| |_| |_| .__/ \\__, |\\_____|_|  \\__,_|_|  \\___|\\__\\___|\\__,_|
                       | |     __/ |                                        
                       |_|    |___/                                         
`;
                      
                      setConsoleOutput(prev => [
                        ...prev, 
                        `> ${command}`, 
                        accessGrantedArt,
                        commandMap[command.toLowerCase()]
                      ]);
                    } else if (command.toLowerCase() === 'clear') {
                      setConsoleOutput([]);
                      return;
                    } else if (command.toLowerCase() in commandMap) {
                      response = commandMap[command.toLowerCase()];
                      setConsoleOutput(prev => [...prev, `> ${command}`, response]);
                    } else {
                      // Check if it's one of the partial decrypt or other special commands
                      const baseCommand = command.toLowerCase().split(' ')[0];
                      if (baseCommand in commandMap || 
                        ['decrypt-partial', 'scan-network', 'check-wallet-balance', 'view-roadmap',
                         'load-preview', 'check-whitelist', 'prepare-launch-sequence'].includes(baseCommand)) {
                        // It's a recognized command
                        response = `Error: Command '${command}' not recognized. Type 'help' for available commands.`;
                        setConsoleOutput(prev => [...prev, `> ${command}`, response]);
                      } else {
                        // Not a recognized command - pass to AI handler
                        setConsoleOutput(prev => [...prev, `> ${command}`]);
                        setConsoleOutput(prev => [...prev, `[AI] Processing...`]);
                        
                        // Get AI response
                        setTimeout(async () => {
                          try {
                            // Remove the "Processing..." message
                            setConsoleOutput(prev => prev.filter(msg => msg !== `[AI] Processing...`));
                            
                            const response = await getChatResponse([
                              {
                                role: 'system',
                                content: 'You are the AI assistant for DegenDuel, a high-stakes trading competition platform on Solana. You are speaking to a user through the Terminal interface on the website. Keep your answers concise and related to crypto trading, DegenDuel platform features, or general blockchain questions. The platform is launching on March 15th, 2025.'
                              },
                              {
                                role: 'user',
                                content: command
                              }
                            ]);
                            
                            // Add AI response to console
                            setConsoleOutput(prev => [...prev, `[AI] ${response}`]);
                            scrollConsoleToBottom();
                          } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
                            console.error('Error getting AI response:', error);
                            setConsoleOutput(prev => prev.filter(msg => msg !== `[AI] Processing...`));
                            setConsoleOutput(prev => [...prev, `[AI] ${getFallbackResponse()}`]);
                            scrollConsoleToBottom();
                          }
                        }, 500);
                      }
                    }
                    
                    // Notify parent component if callback provided
                    if (onCommandExecuted && command.toLowerCase() in commandMap) {
                      onCommandExecuted(command, commandMap[command.toLowerCase()]);
                    }
                    
                    // Scroll only the console output element, not the window
                    const scrollConsoleToBottom = () => {
                      if (consoleOutputRef.current) {
                        consoleOutputRef.current.scrollTop = consoleOutputRef.current.scrollHeight;
                      }
                    };
                    
                    // Immediate scroll attempt
                    scrollConsoleToBottom();
                    
                    // One delayed attempt is enough
                    setTimeout(scrollConsoleToBottom, 50);
                  }
                }}
                className="bg-transparent border-none outline-none text-white/90 w-full font-mono text-sm terminal-input"
                placeholder="$ Enter command or ask AI a question..."
                style={{ color: 'rgba(255, 255, 255, 0.9)', caretColor: 'rgb(34, 211, 238)' }}
                autoComplete="off"
                spellCheck="false"
              />
            </div>
            
            {/* Time-gated commands */}
            <motion.div 
              className="mt-3 pt-2 border-t border-mauve/20 text-left"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 1 }}
            >
              <div className="text-white/40 text-xs uppercase tracking-wider mb-1 text-left">Commands:</div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-sm">
                {/* Show all commands up to current reveal stage */}
                {timeGatedCommands.slice(0, revealStage + 1).flat().map((cmd, index) => (
                  <motion.div 
                    key={index}
                    className="text-mauve-light/60 hover:text-mauve-light cursor-pointer text-xs"
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      delay: 0.05 * index,
                      duration: 0.2
                    }}
                    whileHover={{
                      x: 3,
                      textShadow: "0 0 8px rgba(157, 78, 221, 0.8)"
                    }}
                    onClick={() => {
                      // Extract just the command part (remove the $ prefix)
                      const command = cmd.trim().replace(/^\$\s*/, '');
                      // Set the user input to the command
                      setUserInput(command);
                      // Focus on the input
                      inputRef.current?.focus();
                      // Auto-execute the command by triggering Enter key press event
                      if (inputRef.current) {
                        const enterEvent = new KeyboardEvent('keydown', {
                          key: 'Enter',
                          code: 'Enter',
                          bubbles: true
                        });
                        inputRef.current.dispatchEvent(enterEvent);
                      }
                    }}
                  >
                    {cmd}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
      
      {/* Minimized terminal state */}
      {terminalMinimized && (
        <motion.div
          key="minimized-terminal"
          className="bg-darkGrey-dark/80 border border-mauve/30 rounded-md p-2 font-mono text-xs cursor-pointer"
          initial={{ opacity: 0, y: 20, height: "auto" }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          onClick={() => setTerminalMinimized(false)}
          whileHover={{ scale: 1.02, boxShadow: "0 0 15px rgba(157, 78, 221, 0.4)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex mr-2">
                <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></div>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
              </div>
              <span className="text-mauve-light">Terminal minimized</span>
            </div>
            <motion.span 
              className="text-white/50"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              Click to restore
            </motion.span>
          </div>
        </motion.div>
      )}
      
      {/* Contract Address Reveal Animation - shows when countdown completes */}
      {terminalExitComplete && showContractReveal && (
        <motion.div
          key="contract-reveal"
          className="mt-8 max-w-lg w-full bg-darkGrey-dark/90 border border-mauve/50 rounded-md p-6 font-mono"
          initial={{ 
            opacity: 0,
            scale: 0.9,
            filter: "blur(10px) brightness(2)",
            y: 30
          }}
          animate={{ 
            opacity: 1,
            scale: 1,
            filter: "blur(0px) brightness(1)",
            y: 0
          }}
          transition={{
            duration: 0.8,
            delay: 0.2,
            ease: [0.19, 1.0, 0.22, 1.0]
          }}
        >
          <motion.div 
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <h2 className="text-mauve-light text-2xl font-bold mb-4 font-orbitron">
              DECRYPTION COMPLETE
            </h2>
            
            <div className="mb-6 flex flex-col items-center">
              <div className="text-white/70 mb-2">Contract Address:</div>
              <motion.div
                className="bg-black/30 px-4 py-2 rounded-md text-green-400 font-mono font-bold tracking-wider"
                whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(157, 78, 221, 0.6)" }}
                animate={{
                  boxShadow: [
                    "0 0 5px rgba(157, 78, 221, 0.3)",
                    "0 0 20px rgba(157, 78, 221, 0.6)",
                    "0 0 5px rgba(157, 78, 221, 0.3)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                onClick={() => {
                  // Copy to clipboard
                  navigator.clipboard.writeText(contractAddress);
                  alert("Contract address copied to clipboard!");
                }}
                style={{ cursor: "copy" }}
              >
                {contractAddress}
              </motion.div>
            </div>
            
            <p className="text-white/70 mb-6">
              Congratulations! You now have access to the DegenDuel platform.
            </p>
            
            <div className="flex justify-center">
              <motion.a
                href="#"
                className="bg-mauve/80 hover:bg-mauve text-white font-bold py-2 px-6 rounded"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ENTER PLATFORM
              </motion.a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}