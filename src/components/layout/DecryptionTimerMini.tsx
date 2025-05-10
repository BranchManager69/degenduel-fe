// src/components/layout/DecryptionTimerMini.tsx

/**
 * 
 * Needs finishing!
 * 
 */

import { motion } from 'framer-motion';
import React, { useCallback, useEffect, useState } from 'react';
// Assuming you create this shared hook:
import { useLaunchEvent } from '../../hooks/websocket/topic-hooks/useLaunchEvent';

interface MiniDecryptionTimerProps {
  targetDate: Date;
  onClick?: () => void; // Optional: if clicking it does something
}

export const MiniDecryptionTimer: React.FC<MiniDecryptionTimerProps> = ({ targetDate, onClick }) => {
  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [urgencyLevel, setUrgencyLevel] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const { contractAddress: revealedAddress } = useLaunchEvent();

  const calculateMiniTimeRemaining = useCallback(() => {
    if (!(targetDate instanceof Date) || isNaN(targetDate.getTime())) {
      setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setUrgencyLevel(3); // Default to "LIVE" or "VERIFYING" style if date is invalid
      setIsComplete(true); // Treat invalid date as complete for display logic
      return;
    }

    const now = new Date();
    const difference = targetDate.getTime() - now.getTime();

    if (difference <= 0) {
      setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setUrgencyLevel(3); // Countdown finished
      setIsComplete(true);
      return;
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    setTimeRemaining({ days, hours, minutes, seconds });
    setIsComplete(false);

    const totalSeconds = days * 86400 + hours * 3600 + minutes * 60 + seconds;
    if (totalSeconds <= 10) {
      setUrgencyLevel(2); // Critical
    } else if (totalSeconds <= 60) {
      setUrgencyLevel(1); // Warning
    } else {
      setUrgencyLevel(0); // Normal
    }
  }, [targetDate]);

  useEffect(() => {
    calculateMiniTimeRemaining(); // Initial calculation
    const timer = setInterval(calculateMiniTimeRemaining, 1000);
    return () => clearInterval(timer); // Cleanup interval
  }, [calculateMiniTimeRemaining]);

  const getBeaconContent = () => {
    let digits = "";
    let unit = "";
    let statusText = "";
    let icon = null;
    let beaconColorClass = "bg-black/60 border-green-500/70 text-[#33ff66]"; // Default (urgency 0)
    let digitFontClass = "font-digital-7";
    let textFontClass = "font-fira-code";
    let shadowClass = "shadow-lg shadow-green-900/30";

    // Urgency Level Styling
    if (urgencyLevel === 1) { // Yellow - Warning
      beaconColorClass = "bg-black/60 border-yellow-400/70 text-[#ffcc00]";
      shadowClass = "shadow-lg shadow-yellow-700/40";
    } else if (urgencyLevel === 2) { // Red - Critical
      beaconColorClass = "bg-black/60 border-red-500/70 text-[#ff5050]";
      shadowClass = "shadow-lg shadow-red-700/50";
    } else if (urgencyLevel === 3 && isComplete && revealedAddress) { // Green - Live
      beaconColorClass = "bg-black/60 border-green-400 text-green-300";
      shadowClass = "shadow-lg shadow-green-500/50";
    } else if (urgencyLevel === 3 && isComplete && !revealedAddress) { // Blue - Verifying
      beaconColorClass = "bg-black/60 border-blue-400/70 text-blue-300";
      shadowClass = "shadow-lg shadow-blue-700/40";
    }

    if (isComplete && revealedAddress) {
      statusText = "LIVE";
      beaconColorClass = "bg-black/60 border-green-400 text-green-300";
      shadowClass = "shadow-lg shadow-green-500/50";
      digitFontClass = textFontClass; // No digits, status text uses text font
    } else if (isComplete && !revealedAddress) {
      statusText = "...";
      beaconColorClass = "bg-black/60 border-blue-400/70 text-blue-300";
      shadowClass = "shadow-lg shadow-blue-700/40";
      digitFontClass = textFontClass;
    } else {
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
    return { digits, unit, statusText, icon, beaconColorClass, digitFontClass, textFontClass, shadowClass };
  };

  const { digits, unit, statusText, icon, beaconColorClass, digitFontClass, textFontClass, shadowClass } = getBeaconContent();

  const pulseAnimation = {
    scale: urgencyLevel === 2 ? [1, 1.03, 1] : [1, 1.01, 1],
    transition: { 
      duration: urgencyLevel === 2 ? 1 : (urgencyLevel === 1 ? 2 : 4), 
      repeat: Infinity, 
      ease: "easeInOut" 
    }
  };
  
  const verifyingAnimation = {
    opacity: [0.5, 1, 0.5],
    transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut"}
  };

  return (
    <motion.div
      className={`fixed bottom-5 right-5 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center cursor-pointer z-50 ${beaconColorClass} ${shadowClass} ${textFontClass}`} // Added base textFontClass here for general text
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, ...pulseAnimation }} // Removed duplicate scale: 1
      whileHover={{ scale: 1.1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {statusText ? (
        statusText === "..." ? (
           <motion.span className={`text-[1.5em] ${textFontClass}`} animate={verifyingAnimation}>...</motion.span> // Ensure textFontClass
        ) : (
          <span className={`text-[0.8em] font-bold ${textFontClass}`}>{statusText}</span> // Ensure textFontClass
        )
      ) : icon ? (
        icon
      ) : (
        <div className="flex flex-col items-center justify-center leading-none">
          <span className={`text-[1.6em] ${digitFontClass}`}> {/* Adjust size */}
            {digits}
          </span>
          {unit && (
            <span className={`text-[0.65em] opacity-80 ${textFontClass}`}> {/* Ensure textFontClass */}
              {unit}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default MiniDecryptionTimer;