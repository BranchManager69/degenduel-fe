// src/components/layout/DecryptionTimerMini.tsx

/**
 * @fileoverview
 * Smaller version of the DecryptionTimer component, now driven by API.
 *
 * @description
 * Compact countdown timer that displays in a fixed position.
 *
 * @author Branch Manager
 * @updated 2025-05-12 - Integrated new API response structure
 */

import axios from 'axios';
import { motion } from 'framer-motion';
import React, { useCallback, useEffect, useState } from 'react';
import { useLaunchEvent } from '../../hooks/websocket/topic-hooks/useLaunchEvent';

// --- NEW INTERFACES (can be imported from a shared file if preferred) ---
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

interface MiniDecryptionTimerProps {
  targetDate: Date; // Fallback if API fails or no end_time
  onClick?: () => void;
}

export const MiniDecryptionTimer: React.FC<MiniDecryptionTimerProps> = ({ targetDate: propTargetDate, onClick }) => {
  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [urgencyLevel, setUrgencyLevel] = useState(0); // 0: Normal, 1: Warning (Yellow), 2: Critical (Red), 3: Complete/Status
  const [isEffectivelyComplete, setIsEffectivelyComplete] = useState(false);
  const [apiData, setApiData] = useState<CountdownApiResponse | null>(null);
  const [effectiveTargetDate, setEffectiveTargetDate] = useState<Date | null>(null);

  const { contractAddress: revealedAddress } = useLaunchEvent();

  const calculateMiniTimeRemaining = useCallback(() => {
    if (!effectiveTargetDate || isNaN(effectiveTargetDate.getTime())) {
      setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setUrgencyLevel(3); // Indicates completion or issue
      setIsEffectivelyComplete(true);
      return;
    }

    const now = new Date();
    const difference = effectiveTargetDate.getTime() - now.getTime();

    if (difference <= 0) {
      setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setUrgencyLevel(3); // Countdown finished
      setIsEffectivelyComplete(true);
      return;
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    setTimeRemaining({ days, hours, minutes, seconds });
    setIsEffectivelyComplete(false);

    const totalSeconds = difference / 1000;
    if (totalSeconds <= 10) {
      setUrgencyLevel(2); // Critical
    } else if (totalSeconds <= 60) {
      setUrgencyLevel(1); // Warning
    } else {
      setUrgencyLevel(0); // Normal
    }
  }, [effectiveTargetDate]);

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
            // Use API's countdown for initial display if available
            if (data.countdown) {
                 setTimeRemaining({
                    days: data.countdown.days,
                    hours: data.countdown.hours,
                    minutes: data.countdown.minutes,
                    seconds: data.countdown.seconds,
                });
                // Determine initial completion state based on API countdown
                const initialTotalSeconds = data.countdown.total_seconds;
                setIsEffectivelyComplete(initialTotalSeconds <= 0);
                // Set initial urgency based on API's total_seconds
                if (initialTotalSeconds <= 0) {
                    setUrgencyLevel(3);
                } else if (initialTotalSeconds <= 10) {
                    setUrgencyLevel(2);
                } else if (initialTotalSeconds <= 60) {
                    setUrgencyLevel(1);
                } else {
                    setUrgencyLevel(0);
                }
            } else { // If no API countdown, calculate completion based on end_time vs now
                const now = new Date();
                setIsEffectivelyComplete(apiDate.getTime() - now.getTime() <= 0);
            }
            return;
          }
        }
        // Fallback if API end_time is missing or invalid
        if (propTargetDate instanceof Date && !isNaN(propTargetDate.getTime())) {
          setEffectiveTargetDate(propTargetDate);
           // Calculate completion based on propTargetDate vs now
          const now = new Date();
          setIsEffectivelyComplete(propTargetDate.getTime() - now.getTime() <= 0);
        } else {
          setEffectiveTargetDate(null);
          setIsEffectivelyComplete(true); // No valid date, treat as complete/error
          setUrgencyLevel(3);
        }
      } catch (error) {
        console.error('Failed to fetch countdown data for MiniTimer:', error);
        // Fallback on API error
        if (propTargetDate instanceof Date && !isNaN(propTargetDate.getTime())) {
          setEffectiveTargetDate(propTargetDate);
          const now = new Date();
          setIsEffectivelyComplete(propTargetDate.getTime() - now.getTime() <= 0);
        } else {
          setEffectiveTargetDate(null);
          setIsEffectivelyComplete(true);
          setUrgencyLevel(3);
        }
      }
    };

    fetchCountdownData();
    const dataRefreshTimer = setInterval(fetchCountdownData, 5 * 60 * 1000);
    return () => clearInterval(dataRefreshTimer);
  }, [propTargetDate]);

  useEffect(() => {
    if(effectiveTargetDate && !isEffectivelyComplete) { // Only run interval if there's a date and not already complete
        calculateMiniTimeRemaining(); // Initial calculation for this specific effectiveTargetDate
        const timer = setInterval(calculateMiniTimeRemaining, 1000);
        return () => clearInterval(timer);
    } else if (isEffectivelyComplete) {
        // If complete, ensure time is zeroed out and urgency is set to 3
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setUrgencyLevel(3);
    } else if (!effectiveTargetDate) { // No valid date at all
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setUrgencyLevel(3);
        setIsEffectivelyComplete(true);
    }
  }, [calculateMiniTimeRemaining, effectiveTargetDate, isEffectivelyComplete]);

  const tokenAddress = revealedAddress || apiData?.token_address || apiData?.token_info?.address || apiData?.token_config?.address || '';
  const shouldShowCountdown = apiData ? apiData.enabled !== false : true; // Default to true if apiData is null (e.g. initial load before fetch)


  const getBeaconContent = () => {
    let digits = "";
    let unit = "";
    let statusText = "";
    let beaconColorClass = "bg-black/60 border-green-500/70 text-[#33ff66]";
    let digitFontClass = "font-digital-7";
    let textFontClass = "font-fira-code";
    let shadowClass = "shadow-lg shadow-green-900/30";

    // Determine status based on isEffectivelyComplete and tokenAddress
    if (isEffectivelyComplete) {
      if (tokenAddress) {
        statusText = apiData?.token_info?.symbol || "LIVE"; // Prefer symbol if short
        if (statusText.length > 4 && statusText !== "LIVE") statusText = "LIVE"; // Fallback if symbol is too long, unless it's already LIVE
        beaconColorClass = "bg-black/60 border-green-400 text-green-300";
        shadowClass = "shadow-lg shadow-green-500/50";
      } else {
        statusText = "..."; // Verifying or awaiting address
        beaconColorClass = "bg-black/60 border-blue-400/70 text-blue-300";
        shadowClass = "shadow-lg shadow-blue-700/40";
      }
      digitFontClass = textFontClass; // No digits, status text uses text font
    } else { // Countdown is active
      // Countdown is active, determine colors by urgencyLevel (already set by calculateMiniTimeRemaining)
      if (urgencyLevel === 1) { // Yellow - Warning
        beaconColorClass = "bg-black/60 border-yellow-400/70 text-[#ffcc00]";
        shadowClass = "shadow-lg shadow-yellow-700/40";
      } else if (urgencyLevel === 2) { // Red - Critical
        beaconColorClass = "bg-black/60 border-red-500/70 text-[#ff5050]";
        shadowClass = "shadow-lg shadow-red-700/50";
      }
      // Default green for urgencyLevel 0 is already set

      // Determine time display
      if (timeRemaining.days > 0) {
        digits = timeRemaining.days.toString().padStart(2, '0');
        unit = "d";
      } else if (timeRemaining.hours > 0) {
        digits = timeRemaining.hours.toString().padStart(2, '0');
        unit = "h";
      } else if (timeRemaining.minutes > 0) {
        digits = timeRemaining.minutes.toString().padStart(2, '0');
        unit = "m";
      } else {
        digits = timeRemaining.seconds.toString().padStart(2, '0');
        unit = "s";
      }
    }
    return { digits, unit, statusText, beaconColorClass, digitFontClass, textFontClass, shadowClass };
  };

  const { digits, unit, statusText, beaconColorClass, digitFontClass, textFontClass, shadowClass } = getBeaconContent();

  const pulseAnimation = {
    scale: urgencyLevel === 2 ? [1, 1.03, 1] : (isEffectivelyComplete && !tokenAddress ? 1 : [1, 1.01, 1]), // No pulse for verifying state
    transition: { 
      duration: urgencyLevel === 2 ? 1 : (urgencyLevel === 1 ? 2 : (isEffectivelyComplete ? 4 : 2)), // Slower pulse if just normal countdown
      repeat: Infinity, 
      ease: "easeInOut" 
    }
  };
  
  const verifyingAnimation = {
    opacity: [0.5, 1, 0.5],
    transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut"}
  };

  if (!shouldShowCountdown && apiData !== null) { // Only hide if apiData is fetched and explicitly says disabled
    return null; 
  }
  
  if (!apiData && !effectiveTargetDate) { // Still loading initial data and no fallback date yet
    return null; // Or a very minimal loading indicator if preferred for fixed position element
  }


  return (
    <motion.div
      className={`fixed bottom-5 right-5 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center cursor-pointer z-50 ${beaconColorClass} ${shadowClass} ${textFontClass}`}
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, ...pulseAnimation }}
      whileHover={{ scale: 1.1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {statusText ? (
        statusText === "..." ? (
           <motion.span className={`text-[1.5em] ${textFontClass}`} animate={verifyingAnimation}>...</motion.span>
        ) : (
          <span className={`text-[0.8em] font-bold ${textFontClass}`}>{statusText}</span>
        )
      ) : (
        <div className="flex flex-col items-center justify-center leading-none">
          <span className={`text-[1.6em] ${digitFontClass}`}>
            {digits}
          </span>
          {unit && (
            <span className={`text-[0.65em] opacity-80 ${textFontClass}`}>
              {unit}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default MiniDecryptionTimer;