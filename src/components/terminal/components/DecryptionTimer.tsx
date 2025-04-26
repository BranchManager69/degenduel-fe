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
import React, { useEffect, useState } from 'react';
import { DecryptionTimerProps } from '../types';
import { fetchTerminalData, useTerminalData } from '../../../services/terminalDataService';

/**
 * DecryptionTimer - Displays a countdown timer for the token launch
 */
export const DecryptionTimer: React.FC<DecryptionTimerProps> = ({ 
  targetDate = new Date('2025-03-15T18:00:00-05:00')
  // contractAddress is now fetched from terminal data API
}) => {
  // Get real-time terminal data from WebSocket
  const { 
    terminalData
  } = useTerminalData();
  
  // Combine WebSocket data with fallback to REST API
  const [contractData, setContractData] = useState({
    address: undefined as string | undefined,
    isRevealed: false
  });
  
  // Update contract data whenever WebSocket updates come in
  useEffect(() => {
    // The contract address is now only in the token.address field
    // So we wait for terminalData.token to be available and use its address property
    if (terminalData?.token?.address) {
      setContractData({
        address: terminalData.token.address,
        isRevealed: true
      });
      
      console.log('[DecryptionTimer] Contract data updated from WebSocket:', {
        hasAddress: true,
        address: terminalData.token.address
      });
    }
  }, [terminalData]);
  
  // Fallback to REST API on initial load or if WebSocket is not connected
  useEffect(() => {
    const fetchContractInfo = async () => {
      try {
        console.log('[DecryptionTimer] Fetching contract data from terminal API (fallback)...');
        const terminalData = await fetchTerminalData();
        
        setContractData(prevData => {
          // Only update if we don't already have data from WebSocket
          if (!prevData.address && !prevData.isRevealed && terminalData.token?.address) {
            return {
              address: terminalData.token.address,
              isRevealed: true
            };
          }
          return prevData;
        });
        
        console.log('[DecryptionTimer] Contract data updated from REST API:', {
          hasAddress: !!terminalData.token?.address,
          address: terminalData.token?.address
        });
      } catch (error) {
        console.error('[DecryptionTimer] Error fetching contract data:', error);
      }
    };
    
    // Fetch on initial mount as a fallback
    fetchContractInfo();
  }, []);
  
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  // State to track urgency levels for visual effects
  const [urgencyLevel, setUrgencyLevel] = useState(0); // 0: normal, 1: <60s, 2: <10s, 3: complete
  const [revealTransition, setRevealTransition] = useState(false);
  
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
      
      // Set urgency level based on time remaining
      const totalSeconds = days * 86400 + hours * 3600 + minutes * 60 + seconds;
      
      if (totalSeconds === 0) {
        setUrgencyLevel(3); // Complete
        
        // Start the reveal transition sequence
        if (!revealTransition) {
          setRevealTransition(true);
        }
      } else if (totalSeconds <= 10) {
        setUrgencyLevel(2); // Critical (<10s)
      } else if (totalSeconds <= 60) {
        setUrgencyLevel(1); // Warning (<60s)
      } else {
        setUrgencyLevel(0); // Normal
      }
    };
    
    calculateTimeRemaining();
    const timer = setInterval(calculateTimeRemaining, 1000);
    
    return () => clearInterval(timer);
  }, [targetDate, revealTransition]);
  
  // Check if the countdown is complete
  const isComplete = timeRemaining.days === 0 && 
                   timeRemaining.hours === 0 && 
                   timeRemaining.minutes === 0 && 
                   timeRemaining.seconds === 0;
  
  // Calculate if it's release time
  // Note: We primarily use contractData.isRevealed from the API now instead of this
  const now = new Date();
  const isPastReleaseTime = now >= targetDate;
  
  // If we're past the release time and don't have contract data yet, try to fetch it again
  useEffect(() => {
    if (isPastReleaseTime && !contractData.isRevealed) {
      // Refresh contract data when the release time passes
      (async () => {
        try {
          const terminalData = await fetchTerminalData();
          setContractData({
            address: terminalData.token?.address,
            isRevealed: !!terminalData.token?.address
          });
        } catch (error) {
          console.error('[DecryptionTimer] Error refreshing contract data after release time:', error);
        }
      })();
    }
  }, [isPastReleaseTime, contractData.isRevealed]);
                   
  return (
    <motion.div 
      className="font-orbitron"
      layout
      transition={{
        layout: { type: "spring", bounce: 0.2, duration: 0.8 }
      }}
    >
      {isComplete ? (
        // Modern, clean but stylish contract display
        <div className="py-4">
          <div className="text-2xl font-mono text-green-400 mb-6 flex items-center">
            <span className="inline-block h-3 w-3 bg-green-400 mr-3 rounded-full"></span>
            CONTRACT ADDRESS
            <span className="inline-block h-3 w-3 bg-green-400 ml-3 rounded-full"></span>
          </div>
          
          <div className="relative bg-black/60 border-2 border-green-500/50 rounded-md p-5 shadow-lg shadow-green-900/40">
            {/* Subtle corner accents */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-green-400/80 -translate-x-1 -translate-y-1"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-green-400/80 translate-x-1 -translate-y-1"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-green-400/80 -translate-x-1 translate-y-1"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-green-400/80 translate-x-1 translate-y-1"></div>
            
            {/* Address with subtle glow */}
            <div className="font-mono text-green-400 text-xl break-all tracking-wide p-2 text-shadow-sm shadow-green-500/50">
              {contractData.isRevealed ? contractData.address : "Loading contract address..."}
            </div>
            
            {/* Status indicator */}
            <div className="mt-3 text-right text-green-300/90 text-xs font-mono">
              VERIFIED ✓
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
          {/* CTU-style counter header */}
          <motion.div 
            className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-black px-3 py-1 rounded-sm text-xs font-mono tracking-wider z-10"
            style={{ color: "#33ff66", borderTop: "1px solid #33ff66", borderLeft: "1px solid #33ff66", borderRight: "1px solid #33ff66" }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            COUNTDOWN ACTIVE
          </motion.div>
          
          {/* Single unified countdown container */}
          <div className="w-full max-w-xl mx-auto bg-black/40 border border-opacity-30 rounded px-4 py-5 relative"
               style={{ 
                 borderColor: "#33ff66",
                 boxShadow: "0 0 15px rgba(51, 255, 102, 0.2)"
               }}>
            <div className="grid grid-cols-4 gap-0 w-full">
              {/* Helper function for getting text color based on urgency */}
              {(() => {
                // Generate dynamic colors based on urgency level
                const getTextColor = () => {
                  switch(urgencyLevel) {
                    case 1: // Warning (<60s)
                      return "#ffcc00";
                    case 2: // Critical (<10s)
                      return "#ff5050";
                    case 3: // Complete
                      return "#33ff66";
                    default: // Normal
                      return "#33ff66"; // 24-style digital green
                  }
                };

                const getShadowColor = () => {
                  switch(urgencyLevel) {
                    case 1: // Warning (<60s)
                      return "rgba(255, 204, 0, 0.7)";
                    case 2: // Critical (<10s)
                      return "rgba(255, 50, 50, 0.7)";
                    case 3: // Complete
                      return "rgba(51, 255, 102, 0.7)";
                    default: // Normal
                      return "rgba(51, 255, 102, 0.7)"; // 24-style digital green glow
                  }
                };
                
                const getBorderColor = () => {
                  switch(urgencyLevel) {
                    case 1: // Warning (<60s)
                      return "rgba(255, 204, 0, 0.3)";
                    case 2: // Critical (<10s)
                      return "rgba(255, 50, 50, 0.3)";
                    case 3: // Complete
                      return "rgba(51, 255, 102, 0.3)";
                    default: // Normal
                      return "rgba(51, 255, 102, 0.3)";
                  }
                };

                const textColor = getTextColor();
                const shadowColor = getShadowColor();
                const borderColor = getBorderColor();
                
                return (
                  <>
                    {/* Days */}
                    <div className="flex flex-col items-center border-r px-2" 
                         style={{ borderColor: borderColor }}>
                      <motion.div 
                        className="text-2xl md:text-3xl lg:text-4xl font-mono tabular-nums text-center w-full"
                        style={{
                          color: textColor,
                          textShadow: `0 0 10px ${shadowColor}`,
                          fontFamily: "'Courier New', monospace",
                        }}
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
                      <div className="text-xs sm:text-sm font-bold tracking-wider mt-1 text-center" 
                           style={{ color: textColor, opacity: 0.8 }}>
                        DAYS
                      </div>
                    </div>
                    
                    {/* Hours */}
                    <div className="flex flex-col items-center border-r px-2" 
                         style={{ borderColor: borderColor }}>
                      <motion.div 
                        className="text-2xl md:text-3xl lg:text-4xl font-mono tabular-nums text-center w-full"
                        style={{
                          color: textColor,
                          textShadow: `0 0 10px ${shadowColor}`,
                          fontFamily: "'Courier New', monospace",
                        }}
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
                      <div className="text-xs sm:text-sm font-bold tracking-wider mt-1 text-center" 
                           style={{ color: textColor, opacity: 0.8 }}>
                        HRS
                      </div>
                    </div>
                    
                    {/* Minutes */}
                    <div className="flex flex-col items-center border-r px-2" 
                         style={{ borderColor: borderColor }}>
                      <motion.div 
                        className="text-2xl md:text-3xl lg:text-4xl font-mono tabular-nums text-center w-full"
                        style={{
                          color: textColor,
                          textShadow: `0 0 10px ${shadowColor}`,
                          fontFamily: "'Courier New', monospace",
                        }}
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
                      <div className="text-xs sm:text-sm font-bold tracking-wider mt-1 text-center" 
                           style={{ color: textColor, opacity: 0.8 }}>
                        MIN
                      </div>
                    </div>
                    
                    {/* Seconds */}
                    <div className="flex flex-col items-center px-2">
                      <motion.div 
                        className="text-2xl md:text-3xl lg:text-4xl font-mono tabular-nums text-center w-full"
                        style={{
                          color: textColor,
                          textShadow: `0 0 10px ${shadowColor}`,
                          fontFamily: "'Courier New', monospace",
                        }}
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
                      <div className="text-xs sm:text-sm font-bold tracking-wider mt-1 text-center" 
                           style={{ color: textColor, opacity: 0.8 }}>
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