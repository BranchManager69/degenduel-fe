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
import { useLaunchEvent } from '../../hooks/websocket/topic-hooks/useLaunchEvent';
import { DecryptionTimerProps } from '../terminal/types';

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

export const DecryptionTimer: React.FC<DecryptionTimerProps> = ({
  targetDate: propTargetDate = new Date('2025-03-15T18:00:00-05:00') // Fallback if API fails
}) => {
  const [apiData, setApiData] = useState<CountdownApiResponse | null>(null);
  const { contractAddress: revealedAddress } = useLaunchEvent();
  
  const [effectiveTargetDate, setEffectiveTargetDate] = useState<Date | null>(null);

  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  const [urgencyLevel, setUrgencyLevel] = useState(0);
  
  const calculateTimeRemaining = useCallback(() => {
    if (!effectiveTargetDate || isNaN(effectiveTargetDate.getTime())) {
      setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setUrgencyLevel(3); // Indicates completion or issue
      return;
    }

    const now = new Date();
    const difference = effectiveTargetDate.getTime() - now.getTime();
    
    if (difference <= 0) {
      setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setUrgencyLevel(3); // Countdown finished
      return;
    }
    
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    
    setTimeRemaining({ days, hours, minutes, seconds });
    
    const totalSeconds = difference / 1000; // Use raw difference for urgency
    
    if (totalSeconds <= 10) {
      setUrgencyLevel(2); // Critical
    } else if (totalSeconds <= 60) {
      setUrgencyLevel(1); // Warning
    } else {
      setUrgencyLevel(0); // Normal
    }
  }, [effectiveTargetDate]); // Depends on effectiveTargetDate
  
  useEffect(() => {
    const fetchCountdownData = async () => {
      try {
        const response = await axios.get<CountdownApiResponse>('https://degenduel.me/api/status/countdown');
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
  
  const isComplete = urgencyLevel === 3 && // urgencyLevel 3 means complete or issue
                   timeRemaining.days === 0 && 
                   timeRemaining.hours === 0 && 
                   timeRemaining.minutes === 0 && 
                   timeRemaining.seconds === 0;
  
  const tokenAddress = revealedAddress || apiData?.token_address || apiData?.token_info?.address || apiData?.token_config?.address || '';
  const shouldShowCountdown = apiData ? apiData.enabled !== false : true; // Default to true if apiData is null

  const displayTitle = apiData?.title || (isComplete ? (tokenAddress ? "CONTRACT REVEALED" : "VERIFYING CONTRACT...") : "COUNTDOWN ACTIVE");
  const displayMessage = apiData?.message || (isComplete && !tokenAddress ? "Awaiting secure transmission..." : "");

  return (
    <motion.div
      className="bg-black/30 border-2 border-green-500/60 rounded-xl shadow-lg shadow-green-900/20 overflow-hidden"
      layout
      transition={{
        layout: { type: "spring", bounce: 0.2, duration: 0.8 }
      }}
    >
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
        <div className="py-4">
          <div className="text-2xl font-fira-code text-[#33ff66] mb-6 flex items-center justify-center">
            <span className="inline-block h-3 w-3 bg-green-400 mr-3 rounded-full"></span>
            {apiData?.token_info?.name ? apiData.token_info.name.toUpperCase() : (apiData?.title || "CONTRACT REVEALED")}
            <span className="inline-block h-3 w-3 bg-green-400 ml-3 rounded-full"></span>
          </div>
          
          <div className="relative bg-black/60 border-2 border-green-500/50 rounded-md p-5 shadow-lg shadow-green-900/40 mx-4">
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-green-400/80 -translate-x-1 -translate-y-1"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-green-400/80 translate-x-1 -translate-y-1"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-green-400/80 -translate-x-1 translate-y-1"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-green-400/80 translate-x-1 translate-y-1"></div>
            
            <div className="text-xl font-fira-code text-[#33ff66] break-all tracking-wide p-2 text-shadow-sm shadow-green-500/50">
              {tokenAddress}
            </div>
            {apiData?.token_info?.symbol && (
              <div className="mt-1 text-center text-sm text-green-400/80 font-fira-code">
                Symbol: ${apiData.token_info.symbol}
              </div>
            )}
            <div className="mt-3 text-right text-green-300/90 text-xs font-fira-code">
              VERIFIED ✓
            </div>
          </div>
        </div>
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
            <div className="grid grid-cols-4 gap-0 w-full">
              {(() => {
                const getTextColor = () => {
                  switch(urgencyLevel) {
                    case 1:
                      return "#ffcc00";
                    case 2:
                      return "#ff5050";
                    case 3:
                      return "#33ff66";
                    default:
                      return "#33ff66";
                  }
                };

                const getShadowColor = () => {
                  switch(urgencyLevel) {
                    case 1:
                      return "rgba(255, 204, 0, 0.7)";
                    case 2:
                      return "rgba(255, 50, 50, 0.7)";
                    case 3:
                      return "rgba(51, 255, 102, 0.7)";
                    default:
                      return "rgba(51, 255, 102, 0.7)";
                  }
                };
                
                const getBorderColor = () => {
                  switch(urgencyLevel) {
                    case 1:
                      return "rgba(255, 204, 0, 0.3)";
                    case 2:
                      return "rgba(255, 50, 50, 0.3)";
                    case 3:
                      return "rgba(51, 255, 102, 0.3)";
                    default:
                      return "rgba(51, 255, 102, 0.3)";
                  }
                };

                const textColor = getTextColor();
                const shadowColor = getShadowColor();
                const borderColor = getBorderColor();
                
                return (
                  <>
                    <div className="flex flex-col items-center border-r px-2" 
                         style={{ borderColor: borderColor }}>
                      <motion.div 
                        className="text-5xl md:text-7xl lg:text-8xl font-fira-code font-bold tracking-tight tabular-nums text-center w-full"
                        style={{ color: textColor, textShadow: `0 0 15px ${shadowColor}` }}
                        animate={{ 
                          opacity: urgencyLevel >= 2 ? [1, 0.8, 1] : 1,
                          textShadow: [
                            `0 0 5px ${shadowColor}`,
                            `0 0 ${urgencyLevel >= 2 ? '15' : '12'}px ${shadowColor}`,
                            `0 0 5px ${shadowColor}`
                          ]
                        }}
                        transition={{
                          duration: urgencyLevel >= 2 ? 0.5 : 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        {timeRemaining.days.toString().padStart(2, '0')}
                      </motion.div>
                      <div className="text-lg sm:text-xl font-fira-code font-bold tracking-wider mt-1 text-center" 
                           style={{ color: textColor, opacity: 0.9 }}>
                        DAYS
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center border-r px-2" 
                         style={{ borderColor: borderColor }}>
                      <motion.div 
                        className="text-5xl md:text-7xl lg:text-8xl font-fira-code font-bold tracking-tight tabular-nums text-center w-full"
                        style={{ color: textColor, textShadow: `0 0 15px ${shadowColor}` }}
                        animate={{ 
                          opacity: urgencyLevel >= 2 ? [1, 0.8, 1] : 1,
                          textShadow: [
                            `0 0 5px ${shadowColor}`,
                            `0 0 ${urgencyLevel >= 2 ? '15' : '12'}px ${shadowColor}`,
                            `0 0 5px ${shadowColor}`
                          ]
                        }}
                        transition={{
                          duration: urgencyLevel >= 2 ? 0.5 : 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.1
                        }}
                      >
                        {timeRemaining.hours.toString().padStart(2, '0')}
                      </motion.div>
                      <div className="text-lg sm:text-xl font-fira-code font-bold tracking-wider mt-1 text-center" 
                           style={{ color: textColor, opacity: 0.9 }}>
                        HRS
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center border-r px-2" 
                         style={{ borderColor: borderColor }}>
                      <motion.div 
                        className="text-5xl md:text-7xl lg:text-8xl font-fira-code font-bold tracking-tight tabular-nums text-center w-full"
                        style={{ color: textColor, textShadow: `0 0 15px ${shadowColor}` }}
                        animate={{ 
                          opacity: urgencyLevel >= 2 ? [1, 0.8, 1] : 1,
                          textShadow: [
                            `0 0 5px ${shadowColor}`,
                            `0 0 ${urgencyLevel >= 2 ? '15' : '12'}px ${shadowColor}`,
                            `0 0 5px ${shadowColor}`
                          ]
                        }}
                        transition={{
                          duration: urgencyLevel >= 2 ? 0.5 : 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.2
                        }}
                      >
                        {timeRemaining.minutes.toString().padStart(2, '0')}
                      </motion.div>
                      <div className="text-lg sm:text-xl font-fira-code font-bold tracking-wider mt-1 text-center" 
                           style={{ color: textColor, opacity: 0.9 }}>
                        MIN
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center px-2">
                      <motion.div 
                        className="text-5xl md:text-7xl lg:text-8xl font-fira-code font-bold tracking-tight tabular-nums text-center w-full"
                        style={{ color: textColor, textShadow: `0 0 15px ${shadowColor}` }}
                        animate={{ 
                          opacity: urgencyLevel >= 2 ? [1, 0.8, 1] : 1,
                          textShadow: [
                            `0 0 5px ${shadowColor}`,
                            `0 0 ${urgencyLevel >= 2 ? '15' : '12'}px ${shadowColor}`,
                            `0 0 5px ${shadowColor}`
                          ]
                        }}
                        transition={{
                          duration: urgencyLevel >= 2 ? 0.5 : 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.3
                        }}
                      >
                        {timeRemaining.seconds.toString().padStart(2, '0')}
                      </motion.div>
                      <div className="text-lg sm:text-xl font-fira-code font-bold tracking-wider mt-1 text-center" 
                           style={{ color: textColor, opacity: 0.9 }}>
                        SEC
                      </div>
                    </div>
                  </>
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