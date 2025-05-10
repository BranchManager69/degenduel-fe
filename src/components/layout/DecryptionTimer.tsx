/**
 * @fileoverview
 * Decryption timer component for the terminal
 * 
 * @description
 * Displays a countdown timer with various visual states
 * 
 * @author Branch Manager
 */

import { motion } from 'framer-motion';
import React, { useCallback, useEffect, useState } from 'react';
import { useLaunchEvent } from '../../hooks/websocket/topic-hooks/useLaunchEvent';
import { DecryptionTimerProps } from '../terminal/types';

/**
 * DecryptionTimer - Displays a countdown timer for the token launch
 */
export const DecryptionTimer: React.FC<DecryptionTimerProps> = ({ 
  targetDate = new Date('2025-03-15T18:00:00-05:00')
}) => {
  const { contractAddress: revealedAddress } = useLaunchEvent();
  
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  const [urgencyLevel, setUrgencyLevel] = useState(0);
  
  const calculateTimeRemaining = useCallback(() => {
    if (!(targetDate instanceof Date) || isNaN(targetDate.getTime())) {
      setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setUrgencyLevel(3);
      return;
    }

    const now = new Date();
    const difference = targetDate.getTime() - now.getTime();
    
    if (difference <= 0) {
      setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setUrgencyLevel(3);
      return;
    }
    
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    
    setTimeRemaining({ days, hours, minutes, seconds });
    
    const totalSeconds = days * 86400 + hours * 3600 + minutes * 60 + seconds;
    
    if (totalSeconds <= 10) {
      setUrgencyLevel(2);
    } else if (totalSeconds <= 60) {
      setUrgencyLevel(1);
    } else {
      setUrgencyLevel(0);
    }
  }, [targetDate instanceof Date ? targetDate.getTime() : null, setTimeRemaining, setUrgencyLevel]);
  
  useEffect(() => {
    calculateTimeRemaining();
    const timer = setInterval(calculateTimeRemaining, 1000);
    
    return () => {
      clearInterval(timer);
    };
  }, [calculateTimeRemaining]);
  
  const isComplete = timeRemaining.days === 0 && 
                   timeRemaining.hours === 0 && 
                   timeRemaining.minutes === 0 && 
                   timeRemaining.seconds === 0;
  
  return (
    <motion.div 
      className="bg-black/30 border-2 border-green-500/60 rounded-xl shadow-lg shadow-green-900/20 overflow-hidden"
      layout
      transition={{
        layout: { type: "spring", bounce: 0.2, duration: 0.8 }
      }}
    >
      {isComplete && revealedAddress ? (
        <div className="py-4">
          <div className="text-2xl font-fira-code text-[#33ff66] mb-6 flex items-center justify-center">
            <span className="inline-block h-3 w-3 bg-green-400 mr-3 rounded-full"></span>
            CONTRACT ADDRESS
            <span className="inline-block h-3 w-3 bg-green-400 ml-3 rounded-full"></span>
          </div>
          
          <div className="relative bg-black/60 border-2 border-green-500/50 rounded-md p-5 shadow-lg shadow-green-900/40 mx-4">
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-green-400/80 -translate-x-1 -translate-y-1"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-green-400/80 translate-x-1 -translate-y-1"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-green-400/80 -translate-x-1 translate-y-1"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-green-400/80 translate-x-1 translate-y-1"></div>
            
            <div className="text-xl font-fira-code text-[#33ff66] break-all tracking-wide p-2 text-shadow-sm shadow-green-500/50">
              {revealedAddress}
            </div>
            
            <div className="mt-3 text-right text-green-300/90 text-xs font-fira-code">
              VERIFIED ✓
            </div>
          </div>
        </div>
      ) : isComplete && !revealedAddress ? (
        <div className="py-4">
          <div className="text-2xl font-fira-code text-[#ffcc00] mb-6 flex items-center justify-center">
            <span className="inline-block h-3 w-3 bg-yellow-400 mr-3 rounded-full"></span>
            VERIFYING CONTRACT...
            <span className="inline-block h-3 w-3 bg-yellow-400 ml-3 rounded-full"></span>
          </div>
          
          <div className="relative bg-black/60 border-2 border-yellow-500/50 rounded-md p-5 shadow-lg shadow-yellow-900/40 mx-4">
            <div className="text-xl font-fira-code text-[#ffcc00] break-all tracking-wide p-2 text-shadow-sm shadow-yellow-500/50">
              Awaiting secure transmission...
            </div>
            
            <div className="mt-3 text-right text-yellow-300/90 text-xs font-fira-code">
              PENDING
            </div>
          </div>
        </div>
      ) : (
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
            COUNTDOWN ACTIVE
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