/**
 * @fileoverview
 * Decryption timer component for the terminal
 *
 * @description
 * Displays a countdown timer with various visual states, now driven by API.
 *
 * @author Branch Manager
 * @updated 2025-05-12 - Integrated new API response structure
 */

import axios from 'axios';
import { motion } from 'framer-motion';
import React, { useCallback, useEffect, useState } from 'react';
import { API_URL } from '../../config/config';
import { useLaunchEvent } from '../../hooks/websocket/topic-hooks/useLaunchEvent';
import { DecryptionTimerProps } from '../terminal/types';

// Flipping digit component for airport departure board effect
const FlippingDigit: React.FC<{
  value: string;
  prevValue: string;
  textColor: string;
  shadowColor: string;
  urgencyLevel: number;
  className: string;
  fontFamily: string;
}> = ({ value, prevValue, textColor, shadowColor, urgencyLevel, className, fontFamily }) => {
  const [isFlipping, setIsFlipping] = useState(false);
  const [showBurnIn, setShowBurnIn] = useState(false);

  useEffect(() => {
    if (value !== prevValue) {
      setIsFlipping(true);
      setShowBurnIn(true);
      
      const flipTimer = setTimeout(() => setIsFlipping(false), 600);
      const burnInTimer = setTimeout(() => setShowBurnIn(false), 1200);
      
      return () => {
        clearTimeout(flipTimer);
        clearTimeout(burnInTimer);
      };
    }
  }, [value, prevValue]);

  return (
    <div className="relative">
      {/* Burn-in ghost effect */}
      {showBurnIn && prevValue !== value && (
        <motion.span
          className={`absolute inset-0 ${className}`}
          style={{
            color: textColor,
            opacity: 0.3,
            textShadow: `0 0 8px ${shadowColor}`,
            fontFamily,
            filter: 'blur(0.5px)'
          }}
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          {prevValue}
        </motion.span>
      )}
      
      {/* Main digit with flip animation */}
      <motion.span
        key={value}
        className={className}
        initial={isFlipping ? { rotateX: -90, opacity: 0 } : false}
        animate={{
          rotateX: 0,
          opacity: urgencyLevel === 3 ? [1, 0.7, 1] : (urgencyLevel === 2 ? [1, 0.85, 1] : 1),
          textShadow: [
            `0 0 5px ${shadowColor}`,
            `0 0 ${urgencyLevel === 3 ? '20' : urgencyLevel === 2 ? '15' : '12'}px ${shadowColor}`,
            `0 0 5px ${shadowColor}`
          ]
        }}
        transition={{
          rotateX: { duration: 0.6, ease: "easeOut" },
          opacity: {
            duration: urgencyLevel === 3 ? 0.3 : urgencyLevel === 2 ? 0.8 : urgencyLevel === 1 ? 1.5 : 2,
            repeat: Infinity,
            ease: "easeInOut"
          },
          textShadow: {
            duration: urgencyLevel === 3 ? 0.3 : urgencyLevel === 2 ? 0.8 : urgencyLevel === 1 ? 1.5 : 2,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
        style={{
          transformOrigin: 'center',
          backfaceVisibility: 'hidden',
          willChange: 'transform',
          color: textColor,
          textShadow: `0 0 15px ${shadowColor}`,
          fontFamily
        }}
      >
        {value}
      </motion.span>
    </div>
  );
};

// Segmented dissolution reveal component for contract address
const SegmentedReveal: React.FC<{
  contractAddress: string;
  isRevealing: boolean;
  textColor: string;
  shadowColor: string;
}> = ({ contractAddress, isRevealing, textColor, shadowColor }) => {
  const [revealStage, setRevealStage] = useState(0); // 0: dissolve, 1: scramble, 2: reassemble

  useEffect(() => {
    if (!isRevealing) return;
    
    const stageTimers = [
      setTimeout(() => setRevealStage(1), 800),  // Start scramble
      setTimeout(() => setRevealStage(2), 1600), // Start reassemble
    ];
    
    return () => stageTimers.forEach(clearTimeout);
  }, [isRevealing]);

  // Generate random segments for scramble effect
  const scrambleChars = ['8', '█', '▉', '▊', '▋', '▌', '▍', '▎', '▏', '■', '▪', '▫'];
  
  return (
    <div className="relative">
      {revealStage === 0 && (
        // Dissolving countdown numbers into segments
        <motion.div
          className="absolute inset-0 flex justify-center items-center"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          {Array.from('00:00:00:00').map((char, i) => (
            <motion.span
              key={i}
              className="text-4xl md:text-6xl lg:text-7xl font-mono font-black"
              style={{ 
                color: textColor,
                fontFamily: "'Digital-7', 'DSEG7 Classic', 'Roboto Mono', monospace",
                willChange: 'transform'
              }}
              animate={{
                scale: [1, 1.2, 0.8, 0],
                rotate: [0, -10, 10, -5],
                opacity: [1, 0.8, 0.3, 0]
              }}
              transition={{
                duration: 0.8,
                delay: i * 0.05,
                ease: "easeInOut"
              }}
            >
              {char}
            </motion.span>
          ))}
        </motion.div>
      )}
      
      {revealStage === 1 && (
        // Scrambling segments
        <motion.div
          className="absolute inset-0 flex justify-center items-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {Array.from({ length: contractAddress.length }).map((_, i) => (
            <motion.span
              key={i}
              className="text-lg md:text-xl font-mono font-black"
              style={{ 
                color: textColor,
                textShadow: `0 0 10px ${shadowColor}`,
                fontFamily: "'Digital-7', 'DSEG7 Classic', 'Roboto Mono', monospace",
                willChange: 'transform'
              }}
              animate={{
                opacity: [0, 1, 0.7, 1],
                scale: [0.5, 1.1, 0.9, 1],
                y: [20, -5, 5, 0]
              }}
              transition={{
                duration: 0.8,
                delay: i * 0.02,
                ease: "easeOut"
              }}
            >
              {scrambleChars[Math.floor(Math.random() * scrambleChars.length)]}
            </motion.span>
          ))}
        </motion.div>
      )}
      
      {revealStage === 2 && (
        // Reassembling into contract address
        <motion.div
          className="flex justify-center items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {contractAddress.split('').map((char, i) => (
            <motion.span
              key={i}
              className="text-lg md:text-xl font-mono font-bold tracking-wider"
              style={{ 
                color: textColor,
                textShadow: `0 0 15px ${shadowColor}`,
                fontFamily: "'Digital-7', 'DSEG7 Classic', 'Roboto Mono', monospace",
                willChange: 'transform'
              }}
              initial={{ 
                opacity: 0,
                scale: 0.3,
                rotate: 180,
                y: -30
              }}
              animate={{ 
                opacity: 1,
                scale: 1,
                rotate: 0,
                y: 0
              }}
              transition={{
                duration: 0.6,
                delay: i * 0.03,
                ease: "easeOut",
                type: "spring",
                stiffness: 100
              }}
            >
              {char}
            </motion.span>
          ))}
        </motion.div>
      )}
    </div>
  );
};

// --- NEW INTERFACES ---
interface TokenInfo {
  id: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  raw_supply: number;
  price: string | null;
  market_cap: number | null;
  volume_24h: number | null;
  fdv: number | null;
  liquidity: number | null;
  change_24h: number | null;
}

interface TokenConfig {
  symbol: string;
  address: string;
}

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total_seconds: number;
}

interface CountdownApiResponse {
  enabled: boolean;
  end_time: string | null;
  title: string;
  message: string;
  redirect_url: string | null;
  token_address: string | null;
  token_info: TokenInfo | null;
  token_config: TokenConfig | null;
  countdown: CountdownTime | null;
}
// --- END NEW INTERFACES ---

interface FloatingTimerProps extends DecryptionTimerProps {
  enableFloating?: boolean;
  onMorphComplete?: (scrolledDown: boolean) => void;
}

export const DecryptionTimer: React.FC<FloatingTimerProps> = ({
  targetDate: propTargetDate = new Date('2025-03-15T18:00:00-05:00'), // Fallback if API fails
  enableFloating = false,
  onMorphComplete
}) => {
  const [apiData, setApiData] = useState<CountdownApiResponse | null>(null);
  const { contractAddress: revealedAddress } = useLaunchEvent();
  
  const [effectiveTargetDate, setEffectiveTargetDate] = useState<Date | null>(null);
  
  // Scroll-based visibility state
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  
  // Copy and transition states
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [showTransitionFlash, setShowTransitionFlash] = useState(false);
  const [hasShownComplete, setHasShownComplete] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  
  // Dev-only testing state
  const [devTestRevealing, setDevTestRevealing] = useState(false);
  const isDev = import.meta.env.DEV || window.location.hostname.includes('dev.');

  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Track previous values for flip animations
  const [prevTimeRemaining, setPrevTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  const [urgencyLevel, setUrgencyLevel] = useState(0);
  
  const calculateTimeRemaining = useCallback(() => {
    if (!effectiveTargetDate || isNaN(effectiveTargetDate.getTime())) {
      setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setUrgencyLevel(4); // Indicates completion or issue
      return;
    }

    const now = new Date();
    const difference = effectiveTargetDate.getTime() - now.getTime();
    
    if (difference <= 0) {
      setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setUrgencyLevel(4); // Countdown finished
      return;
    }
    
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    
    setTimeRemaining(prev => {
      setPrevTimeRemaining(prev);
      return { days, hours, minutes, seconds };
    });
    
    const totalSeconds = difference / 1000; // Use raw difference for urgency
    
    if (totalSeconds <= 3600) { // Less than 1 hour = Red (Critical)
      setUrgencyLevel(3); // Critical (Red)
    } else if (totalSeconds <= 172800) { // Less than 2 days = Yellow (Warning)  
      setUrgencyLevel(2); // Warning (Yellow)
    } else if (totalSeconds <= 604800) { // Less than 7 days = Purple (New level)
      setUrgencyLevel(1); // Purple (New)
    } else {
      setUrgencyLevel(0); // Normal (Green)
    }
  }, [effectiveTargetDate]); // Depends on effectiveTargetDate
  
  useEffect(() => {
    const fetchCountdownData = async () => {
      try {
        const response = await axios.get<CountdownApiResponse>(`${API_URL}/status/countdown`);
        const data = response.data;
        setApiData(data);

        if (data && data.end_time) {
          const apiDate = new Date(data.end_time);
          if (!isNaN(apiDate.getTime())) {
            setEffectiveTargetDate(apiDate);
            // Optionally initialize timeRemaining with API's countdown snapshot
            if (data.countdown) {
              setTimeRemaining({
                days: data.countdown.days,
                hours: data.countdown.hours,
                minutes: data.countdown.minutes,
                seconds: data.countdown.seconds,
              });
            }
            return; // API date set, no need for fallback yet
          }
        }
        // Fallback to propTargetDate if API end_time is missing or invalid
        if (propTargetDate instanceof Date && !isNaN(propTargetDate.getTime())) {
          setEffectiveTargetDate(propTargetDate);
        } else {
          setEffectiveTargetDate(null); // No valid date
        }

      } catch (error) {
        console.error('Failed to fetch countdown data:', error);
        // Fallback to propTargetDate on API error
        if (propTargetDate instanceof Date && !isNaN(propTargetDate.getTime())) {
          setEffectiveTargetDate(propTargetDate);
        } else {
          setEffectiveTargetDate(null);
        }
      }
    };

    fetchCountdownData();
    const dataRefreshTimer = setInterval(fetchCountdownData, 5 * 60 * 1000);

    return () => {
      clearInterval(dataRefreshTimer);
    };
  }, [propTargetDate]); // propTargetDate is a dep for initial/fallback setting

  useEffect(() => {
    if (effectiveTargetDate) { // Only run interval if we have a date
      calculateTimeRemaining(); // Initial calculation
      const timer = setInterval(calculateTimeRemaining, 1000);
      return () => clearInterval(timer);
    } else {
      // If no effectiveTargetDate, ensure timer is cleared and state is reset
      setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setUrgencyLevel(3);
    }
  }, [calculateTimeRemaining, effectiveTargetDate]);

  // Scroll-based auto hide/show
  useEffect(() => {
    if (!enableFloating) return;

    const handleScroll = () => {
      const scrollThreshold = window.innerHeight * 0.7; // 70% of viewport height
      const scrolled = window.scrollY > scrollThreshold;
      
      if (scrolled !== isScrolledDown) {
        setIsScrolledDown(scrolled);
        onMorphComplete?.(scrolled); // Pass scroll state to parent
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [enableFloating, isScrolledDown, onMorphComplete]);

  // Handle copy to clipboard
  const handleCopyAddress = useCallback(async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setShowCopiedMessage(true);
      setTimeout(() => setShowCopiedMessage(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  }, []);

  const isComplete = urgencyLevel === 4 && // urgencyLevel 4 means complete or issue
                   timeRemaining.days === 0 && 
                   timeRemaining.hours === 0 && 
                   timeRemaining.minutes === 0 && 
                   timeRemaining.seconds === 0;

  const tokenAddress = revealedAddress || apiData?.token_address || apiData?.token_info?.address || apiData?.token_config?.address || '';
  
  // Trigger reveal animation when countdown completes
  useEffect(() => {
    if (isComplete && !hasShownComplete && tokenAddress) {
      setIsRevealing(true);
      setShowTransitionFlash(true);
      setHasShownComplete(true);
      setTimeout(() => setShowTransitionFlash(false), 1000);
    }
  }, [isComplete, hasShownComplete, tokenAddress]);
  const shouldShowCountdown = apiData ? apiData.enabled !== false : true; // Default to true if apiData is null

  const displayTitle = apiData?.title || (isComplete ? (tokenAddress ? "CONTRACT REVEALED" : "VERIFYING CONTRACT...") : "$DUEL MINT");
  const displayMessage = apiData?.message || (isComplete && !tokenAddress ? "Awaiting secure transmission..." : "");

  // Hide main timer when scrolled down (mini timer will show)
  if (enableFloating && isScrolledDown) {
    return null;
  }

  return (
    <motion.div
      className="relative bg-black/30 border-2 border-green-500/60 rounded-xl shadow-lg shadow-green-900/20 overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Dev-only reveal test button */}
      {isDev && !isComplete && (
        <button
          onClick={() => {
            setDevTestRevealing(true);
            setTimeout(() => setDevTestRevealing(false), 5000); // Reset after 5 seconds
          }}
          className="absolute top-2 right-2 z-10 bg-yellow-500/20 hover:bg-yellow-500/40 border border-yellow-500/50 text-yellow-400 text-xs px-2 py-1 rounded transition-colors"
          title="Dev: Test reveal animation"
        >
          TEST
        </button>
      )}
      {!shouldShowCountdown && apiData ? (
        <div className="py-4 px-6">
          <div className="text-2xl font-fira-code text-[#33ff66] mb-2 flex items-center justify-center">
            {apiData.title}
          </div>
          <div className="text-lg text-center text-[#33ff66]/80 font-fira-code">
            {apiData.message}
          </div>
        </div>
      ) : isComplete && tokenAddress ? (
        <motion.div 
          className="py-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {/* Flash overlay */}
          {showTransitionFlash && (
            <motion.div 
              className="absolute inset-0 bg-white z-50 rounded-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.8, 0] }}
              transition={{ duration: 1, ease: "easeInOut" }}
            />
          )}

          <motion.div 
            className="text-2xl font-fira-code text-[#33ff66] mb-6 flex items-center justify-center"
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span className="inline-block h-3 w-3 bg-green-400 mr-3 rounded-full animate-pulse"></span>
            {apiData?.token_info?.name ? apiData.token_info.name.toUpperCase() : (apiData?.title || "CONTRACT REVEALED")}
            <span className="inline-block h-3 w-3 bg-green-400 ml-3 rounded-full animate-pulse"></span>
          </motion.div>
          
          <motion.div 
            className="relative bg-black/70 border-2 border-green-500/60 rounded-lg p-4 shadow-2xl shadow-green-900/50 mx-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Corner decorations */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-green-400/80 -translate-x-1 -translate-y-1"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-green-400/80 translate-x-1 -translate-y-1"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-green-400/80 -translate-x-1 translate-y-1"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-green-400/80 translate-x-1 translate-y-1"></div>
            
            {/* Copyable contract address with reveal animation */}
            <div 
              className="group flex items-center justify-center cursor-pointer hover:bg-green-500/10 rounded-md p-2 transition-all duration-200"
              onClick={() => handleCopyAddress(tokenAddress)}
            >
              {(isRevealing || devTestRevealing) ? (
                <SegmentedReveal
                  contractAddress={tokenAddress || 'Ey59PH7Z4BFU4HjyKnyMdWt5GGN76KazTAwQihoUXRnk'}
                  isRevealing={isRevealing || devTestRevealing}
                  textColor="#33ff66"
                  shadowColor="rgba(51, 255, 102, 0.7)"
                />
              ) : (
                <div className="text-lg md:text-xl font-mono font-bold text-[#33ff66] tracking-wider text-center truncate max-w-full overflow-hidden whitespace-nowrap">
                  {tokenAddress}
                </div>
              )}
              
              {/* Copy icon */}
              <div className="ml-3 flex-shrink-0">
                <svg 
                  className="w-5 h-5 text-green-400 group-hover:text-green-300 transition-colors duration-200" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" 
                  />
                </svg>
              </div>
            </div>

            {/* Copied message */}
            {showCopiedMessage && (
              <motion.div 
                className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded-md"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                Copied!
              </motion.div>
            )}
            
            {/* Token symbol */}
            {apiData?.token_info?.symbol && (
              <div className="mt-3 text-center text-sm text-green-400/80 font-fira-code">
                Symbol: ${apiData.token_info.symbol}
              </div>
            )}
            
            {/* Verification status */}
            <div className="mt-3 text-right text-green-300/90 text-xs font-fira-code flex items-center justify-end">
              <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              VERIFIED
            </div>
          </motion.div>
        </motion.div>
      ) : isComplete && !tokenAddress ? ( // Still complete, but no address revealed yet
        <div className="py-4">
          <div className="text-2xl font-fira-code text-[#ffcc00] mb-6 flex items-center justify-center">
            <span className="inline-block h-3 w-3 bg-yellow-400 mr-3 rounded-full"></span>
            {displayTitle}
            <span className="inline-block h-3 w-3 bg-yellow-400 ml-3 rounded-full"></span>
          </div>
          
          <div className="relative bg-black/60 border-2 border-yellow-500/50 rounded-md p-5 shadow-lg shadow-yellow-900/40 mx-4">
            <div className="text-xl font-fira-code text-[#ffcc00] break-all tracking-wide p-2 text-shadow-sm shadow-yellow-500/50">
              {displayMessage || "Awaiting secure transmission..."}
            </div>
            
            <div className="mt-3 text-right text-yellow-300/90 text-xs font-fira-code">
              PENDING
            </div>
          </div>
        </div>
      ) : ( // Countdown active
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          layoutId="terminal-content"
        >
          <motion.div
            className="w-full bg-green-500/20 text-center py-2 px-3 border-b border-green-500/40 text-sm font-fira-code tracking-wider z-10"
            style={{ color: "#33ff66"}}
            animate={{ 
              backgroundColor: ["rgba(34, 197, 94, 0.1)", "rgba(34, 197, 94, 0.2)", "rgba(34, 197, 94, 0.1)"],
              textShadow: ["0 0 5px rgba(52, 211, 153, 0.3)", "0 0 10px rgba(52, 211, 153, 0.5)", "0 0 5px rgba(52, 211, 153, 0.3)"]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            {displayTitle}
          </motion.div>
          
          <div className="w-full px-8 py-6"
               style={{
                 backgroundColor: "rgba(0,0,0,0.2)",
               }}>
            <div className="flex items-center justify-center w-full space-x-2">
              {(() => {
                const getTextColor = () => {
                  switch(urgencyLevel) {
                    case 1: // Purple (< 7 days)
                      return "#a855f7";
                    case 2: // Yellow (< 2 days)
                      return "#ffcc00";
                    case 3: // Red (< 1 hour)
                      return "#ff5050";
                    case 4: // Complete
                      return "#33ff66";
                    default: // Green (normal)
                      return "#33ff66";
                  }
                };

                const getShadowColor = () => {
                  switch(urgencyLevel) {
                    case 1: // Purple (< 7 days)
                      return "rgba(168, 85, 247, 0.7)";
                    case 2: // Yellow (< 2 days)
                      return "rgba(255, 204, 0, 0.7)";
                    case 3: // Red (< 1 hour)
                      return "rgba(255, 80, 80, 0.7)";
                    case 4: // Complete
                      return "rgba(51, 255, 102, 0.7)";
                    default: // Green (normal)
                      return "rgba(51, 255, 102, 0.7)";
                  }
                };
                

                const textColor = getTextColor();
                const shadowColor = getShadowColor();
                
                return (
                  <div className="flex items-center justify-center">
                    {/* Days */}
                    <FlippingDigit
                      value={timeRemaining.days.toString().padStart(2, '0')}
                      prevValue={prevTimeRemaining.days.toString().padStart(2, '0')}
                      textColor={textColor}
                      shadowColor={shadowColor}
                      urgencyLevel={urgencyLevel}
                      className="text-4xl md:text-6xl lg:text-7xl font-mono font-black tracking-tighter tabular-nums"
                      fontFamily="'Digital-7', 'DSEG7 Classic', 'Roboto Mono', monospace"
                    />

                    {/* Colon */}
                    <motion.span 
                      className="text-4xl md:text-6xl lg:text-7xl font-mono font-black mx-1"
                      style={{ 
                        color: textColor, 
                        fontFamily: "'Digital-7', 'DSEG7 Classic', 'Roboto Mono', monospace"
                      }}
                      animate={{ 
                        opacity: [1, 0.3, 1]
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      :
                    </motion.span>

                    {/* Hours */}
                    <FlippingDigit
                      value={timeRemaining.hours.toString().padStart(2, '0')}
                      prevValue={prevTimeRemaining.hours.toString().padStart(2, '0')}
                      textColor={textColor}
                      shadowColor={shadowColor}
                      urgencyLevel={urgencyLevel}
                      className="text-4xl md:text-6xl lg:text-7xl font-mono font-black tracking-tighter tabular-nums"
                      fontFamily="'Digital-7', 'DSEG7 Classic', 'Roboto Mono', monospace"
                    />

                    {/* Colon */}
                    <motion.span 
                      className="text-4xl md:text-6xl lg:text-7xl font-mono font-black mx-1"
                      style={{ 
                        color: textColor,
                        fontFamily: "'Digital-7', 'DSEG7 Classic', 'Roboto Mono', monospace"
                      }}
                      animate={{ 
                        opacity: [1, 0.3, 1]
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.5
                      }}
                    >
                      :
                    </motion.span>

                    {/* Minutes */}
                    <FlippingDigit
                      value={timeRemaining.minutes.toString().padStart(2, '0')}
                      prevValue={prevTimeRemaining.minutes.toString().padStart(2, '0')}
                      textColor={textColor}
                      shadowColor={shadowColor}
                      urgencyLevel={urgencyLevel}
                      className="text-4xl md:text-6xl lg:text-7xl font-mono font-black tracking-tighter tabular-nums"
                      fontFamily="'Digital-7', 'DSEG7 Classic', 'Roboto Mono', monospace"
                    />

                    {/* Colon */}
                    <motion.span 
                      className="text-4xl md:text-6xl lg:text-7xl font-mono font-black mx-1"
                      style={{ 
                        color: textColor,
                        fontFamily: "'Digital-7', 'DSEG7 Classic', 'Roboto Mono', monospace"
                      }}
                      animate={{ 
                        opacity: [1, 0.3, 1]
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      :
                    </motion.span>

                    {/* Seconds */}
                    <FlippingDigit
                      value={timeRemaining.seconds.toString().padStart(2, '0')}
                      prevValue={prevTimeRemaining.seconds.toString().padStart(2, '0')}
                      textColor={textColor}
                      shadowColor={shadowColor}
                      urgencyLevel={urgencyLevel}
                      className="text-4xl md:text-6xl lg:text-7xl font-mono font-black tracking-tighter tabular-nums"
                      fontFamily="'Digital-7', 'DSEG7 Classic', 'Roboto Mono', monospace"
                    />
                  </div>
                );
              })()}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DecryptionTimer;