// src/components/layout/DecryptionTimerMini.tsx

/**
 * @fileoverview
 * Mini synchronized version of DecryptionTimer - perfect mirror clone
 * 
 * @description
 * Miniature countdown timer that mirrors the main timer exactly:
 * - Same animations, same colors, same timing
 * - Rectangular shape like main timer, just smaller
 * - Perfect synchronicity for cohesive user experience
 */

import axios from 'axios';
import { motion } from 'framer-motion';
import React, { useCallback, useEffect, useState } from 'react';
import { API_URL } from '../../config/config';
import { useLaunchEvent } from '../../hooks/websocket/topic-hooks/useLaunchEvent';

// Mini flipping digit component - synchronized with main timer
const MiniFlippingDigit: React.FC<{
  value: string;
  prevValue: string;
  textColor: string;
  shadowColor: string;
  urgencyLevel: number;
}> = ({ value, prevValue, textColor, shadowColor, urgencyLevel }) => {
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (value !== prevValue) {
      setIsFlipping(true);
      const flipTimer = setTimeout(() => setIsFlipping(false), 600);
      return () => clearTimeout(flipTimer);
    }
  }, [value, prevValue]);

  return (
    <motion.span
      key={value}
      className="text-sm font-mono font-black tracking-tight tabular-nums"
      initial={isFlipping ? { rotateX: -90, opacity: 0 } : false}
      animate={{
        rotateX: 0,
        opacity: urgencyLevel === 3 ? [1, 0.7, 1] : (urgencyLevel === 2 ? [1, 0.85, 1] : 1),
        textShadow: [
          `0 0 3px ${shadowColor}`,
          `0 0 ${urgencyLevel === 3 ? '12' : urgencyLevel === 2 ? '8' : '6'}px ${shadowColor}`,
          `0 0 3px ${shadowColor}`
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
        color: textColor,
        textShadow: `0 0 8px ${shadowColor}`,
        fontFamily: "'Digital-7', 'DSEG7 Classic', 'Roboto Mono', monospace",
        transformOrigin: 'center',
        backfaceVisibility: 'hidden'
      }}
    >
      {value}
    </motion.span>
  );
};

// Interfaces matching main timer
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

interface MiniDecryptionTimerProps {
  targetDate: Date;
  onClick?: () => void;
  isVisible?: boolean;
  delayedEntrance?: boolean;
}

export const MiniDecryptionTimer: React.FC<MiniDecryptionTimerProps> = ({ 
  targetDate: propTargetDate, 
  onClick, 
  isVisible = true,
  delayedEntrance = false 
}) => {
  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [prevTimeRemaining, setPrevTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [urgencyLevel, setUrgencyLevel] = useState(0);
  const [apiData, setApiData] = useState<CountdownApiResponse | null>(null);
  const [effectiveTargetDate, setEffectiveTargetDate] = useState<Date | null>(null);

  const { contractAddress: revealedAddress } = useLaunchEvent();

  // Same calculation logic as main timer for perfect sync
  const calculateTimeRemaining = useCallback(() => {
    if (!effectiveTargetDate || isNaN(effectiveTargetDate.getTime())) {
      setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setUrgencyLevel(4);
      return;
    }

    const now = new Date();
    const difference = effectiveTargetDate.getTime() - now.getTime();

    if (difference <= 0) {
      setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setUrgencyLevel(4);
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

    const totalSeconds = difference / 1000;
    if (totalSeconds <= 3600) {
      setUrgencyLevel(3); // Critical (Red)
    } else if (totalSeconds <= 172800) {
      setUrgencyLevel(2); // Warning (Yellow)  
    } else if (totalSeconds <= 604800) {
      setUrgencyLevel(1); // Purple
    } else {
      setUrgencyLevel(0); // Normal (Green)
    }
  }, [effectiveTargetDate]);

  // Same API fetching as main timer
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
            return;
          }
        }
        if (propTargetDate instanceof Date && !isNaN(propTargetDate.getTime())) {
          setEffectiveTargetDate(propTargetDate);
        } else {
          setEffectiveTargetDate(null);
          setUrgencyLevel(4);
        }
      } catch (error) {
        console.error('Failed to fetch countdown data for MiniTimer:', error);
        if (propTargetDate instanceof Date && !isNaN(propTargetDate.getTime())) {
          setEffectiveTargetDate(propTargetDate);
        } else {
          setEffectiveTargetDate(null);
          setUrgencyLevel(4);
        }
      }
    };

    fetchCountdownData();
    const dataRefreshTimer = setInterval(fetchCountdownData, 5 * 60 * 1000);
    return () => clearInterval(dataRefreshTimer);
  }, [propTargetDate]);

  useEffect(() => {
    if (effectiveTargetDate) {
      calculateTimeRemaining();
      const timer = setInterval(calculateTimeRemaining, 1000);
      return () => clearInterval(timer);
    }
  }, [calculateTimeRemaining, effectiveTargetDate]);

  const tokenAddress = revealedAddress || apiData?.token_address || apiData?.token_info?.address || apiData?.token_config?.address || '';
  const shouldShowCountdown = apiData ? apiData.enabled !== false : true;
  const isComplete = urgencyLevel === 4 && timeRemaining.days === 0 && timeRemaining.hours === 0 && timeRemaining.minutes === 0 && timeRemaining.seconds === 0;

  // Same color logic as main timer
  const getTextColor = () => {
    if (isComplete) return tokenAddress ? "#33ff66" : "#60a5fa";
    switch (urgencyLevel) {
      case 3: return "#ff5050"; // Critical red
      case 2: return "#ffcc00"; // Warning yellow  
      case 1: return "#a855f7"; // Purple
      default: return "#33ff66"; // Normal green
    }
  };

  const getShadowColor = () => {
    if (isComplete) return tokenAddress ? "rgba(51, 255, 102, 0.7)" : "rgba(96, 165, 250, 0.7)";
    switch (urgencyLevel) {
      case 3: return "rgba(255, 80, 80, 0.7)";
      case 2: return "rgba(255, 204, 0, 0.7)";  
      case 1: return "rgba(168, 85, 247, 0.7)";
      default: return "rgba(51, 255, 102, 0.7)";
    }
  };

  const getBorderColor = () => {
    if (isComplete) return tokenAddress ? "border-green-500/60" : "border-blue-400/60";
    switch (urgencyLevel) {
      case 3: return "border-red-500/60";
      case 2: return "border-yellow-400/60";
      case 1: return "border-purple-500/60"; 
      default: return "border-green-500/60";
    }
  };

  if (!shouldShowCountdown && apiData !== null) return null;
  if (!apiData && !effectiveTargetDate) return null;
  if (!isVisible) return null;

  const textColor = getTextColor();
  const shadowColor = getShadowColor();
  const borderColor = getBorderColor();

  return (
    <motion.div
      className={`fixed bottom-20 right-5 bg-black/30 border-2 ${borderColor} rounded-lg shadow-lg overflow-hidden cursor-pointer z-50`}
      onClick={onClick}
      initial={{ opacity: 0, y: delayedEntrance ? 20 : 0 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{
        boxShadow: `0 0 15px ${shadowColor}`,
      }}
    >
      <div className="px-3 py-2">
        {isComplete ? (
          <div className="text-center">
            <div className="text-xs font-mono font-bold" style={{ color: textColor }}>
              {tokenAddress ? "LIVE" : "..."}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-1">
            {/* Days */}
            <MiniFlippingDigit
              value={timeRemaining.days.toString().padStart(2, '0')}
              prevValue={prevTimeRemaining.days.toString().padStart(2, '0')}
              textColor={textColor}
              shadowColor={shadowColor}
              urgencyLevel={urgencyLevel}
            />
            
            {/* Colon */}
            <motion.span 
              className="text-sm font-mono font-black"
              style={{ 
                color: textColor, 
                fontFamily: "'Digital-7', 'DSEG7 Classic', 'Roboto Mono', monospace"
              }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            >
              :
            </motion.span>

            {/* Hours */}
            <MiniFlippingDigit
              value={timeRemaining.hours.toString().padStart(2, '0')}
              prevValue={prevTimeRemaining.hours.toString().padStart(2, '0')}
              textColor={textColor}
              shadowColor={shadowColor}
              urgencyLevel={urgencyLevel}
            />

            {/* Colon */}
            <motion.span 
              className="text-sm font-mono font-black"
              style={{ 
                color: textColor,
                fontFamily: "'Digital-7', 'DSEG7 Classic', 'Roboto Mono', monospace"
              }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
              :
            </motion.span>

            {/* Minutes */}
            <MiniFlippingDigit
              value={timeRemaining.minutes.toString().padStart(2, '0')}
              prevValue={prevTimeRemaining.minutes.toString().padStart(2, '0')}
              textColor={textColor}
              shadowColor={shadowColor}
              urgencyLevel={urgencyLevel}
            />

            {/* Colon */}
            <motion.span 
              className="text-sm font-mono font-black"
              style={{ 
                color: textColor,
                fontFamily: "'Digital-7', 'DSEG7 Classic', 'Roboto Mono', monospace"
              }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            >
              :
            </motion.span>

            {/* Seconds */}
            <MiniFlippingDigit
              value={timeRemaining.seconds.toString().padStart(2, '0')}
              prevValue={prevTimeRemaining.seconds.toString().padStart(2, '0')}
              textColor={textColor}
              shadowColor={shadowColor}
              urgencyLevel={urgencyLevel}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MiniDecryptionTimer;