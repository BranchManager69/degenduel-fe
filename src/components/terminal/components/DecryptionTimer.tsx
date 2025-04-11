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
import { TimeUnit } from './TimeUnit';
import { ContractDisplay } from './ContractDisplay';
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
  
  // Use state for smooth release preference to avoid hydration mismatch
  const [useSmoothRelease, setUseSmoothRelease] = useState(false);
  
  // State to track urgency levels for visual effects
  const [urgencyLevel, setUrgencyLevel] = useState(0); // 0: normal, 1: <60s, 2: <10s, 3: complete
  const [revealTransition, setRevealTransition] = useState(false);
  
  // Check localStorage for preference in useEffect (client-side only)
  useEffect(() => {
    const storedPreference = window.localStorage?.getItem('useTerminalSmoothRelease') === 'true';
    setUseSmoothRelease(storedPreference);
  }, []);
  
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
        useSmoothRelease ? (
          // SMOOTH RELEASE STATE - Typing animation
          <motion.div 
            className="py-4"
            initial={{ opacity: 0, width: "auto" }}
            animate={{ 
              opacity: 1,
              width: "auto",
              transition: { duration: 0.5 }
            }}
            exit={{ opacity: 0 }}
            layoutId="terminal-content"
          >
            {/* Terminal-style typing effect for ACCESS GRANTED */}
            <div className="text-3xl sm:text-4xl font-bold relative">
              <div className="flex items-center">
                <span className="text-green-400 inline-block mr-2 whitespace-nowrap">&gt;</span>
                <div className="relative inline-flex">
                  <div className="text-green-400 font-mono tracking-wider relative">
                    {'ACCESS_GRANTED'.split('').map((char, index) => (
                      <motion.span
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                          duration: 0.05,
                          delay: 0.1 + index * 0.08, // Staggered delay
                          ease: "easeIn"
                        }}
                      >
                        {char}
                      </motion.span>
                    ))}
                  </div>
                  <motion.span
                    className="absolute right-0 h-full w-1 bg-green-400/80"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
                  />
                </div>
              </div>
            </div>
            
            {/* Protocol decryption message with console-style typing */}
            <motion.div 
              className="mt-2 text-base text-green-200 font-normal flex items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.5 }}
            >
              <span className="text-green-500 mr-3">[+]</span>
              <div className="inline-block whitespace-nowrap">
                {'Protocol decryption successful'.split('').map((char, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      duration: 0.03,
                      delay: 1.7 + index * 0.05, // Staggered delay
                      ease: "easeIn"
                    }}
                  >
                    {char}
                  </motion.span>
                ))}
              </div>
            </motion.div>
            
            {/* ASCII art for contract header */}
            <motion.div
              className="mt-6 mb-2 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3, duration: 0.5 }}
            >
              <pre className="text-green-400 text-xs leading-tight font-mono">
{`  _____            _                  _      ______ _______ _______ ______ _____ _______ _______ ______ 
 / ____|          | |                | |    |  ____|__   __|__   __|  ____/ ____|__   __|__   __|  ____|
| |     ___  _ __ | |_ _ __ __ _  ___| |_   | |__     | |     | |  | |__ | |       | |     | |  | |__   
| |    / _ \\| '_ \\| __| '__/ _\` |/ __| __|  |  __|    | |     | |  |  __|| |       | |     | |  |  __|  
| |___| (_) | | | | |_| | | (_| | (__| |_   | |____   | |     | |  | |___| |____   | |     | |  | |____ 
 \\_____\\___/|_| |_|\\__|_|  \\__,_|\\___|\\__|  |______|  |_|     |_|  |______\\_____|  |_|     |_|  |______|
                                                                                                         `}
              </pre>
            </motion.div>
            
            {/* Prominent contract address highlight */}
            <motion.div
              className="mt-3 p-4 border-2 border-green-500/50 bg-black/60 rounded-md text-xl relative"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3.5, duration: 0.7 }}
              whileHover={{ 
                scale: 1.03, 
                boxShadow: "0 0 20px rgba(74, 222, 128, 0.5)",
                borderColor: "rgba(74, 222, 128, 0.8)"
              }}
            >
              {/* Terminal scan line */}
              <motion.div 
                className="absolute inset-0 h-1 bg-green-400/20 z-10 overflow-hidden"
                animate={{ 
                  top: ['-10%', '110%'],
                }}
                transition={{ 
                  duration: 1.5, 
                  ease: "linear", 
                  repeat: Infinity,
                  repeatType: "loop" 
                }}
              />
              
              {/* Corner markers for a tech feel */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-green-400"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-green-400"></div>
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-green-400"></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-green-400"></div>
              
              <motion.div 
                className="text-green-300 mb-2 text-sm font-mono uppercase tracking-wider flex items-center"
                animate={{ color: ['rgba(74, 222, 128, 0.7)', 'rgba(74, 222, 128, 1)', 'rgba(74, 222, 128, 0.7)'] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <motion.span 
                  className="inline-block h-2 w-2 bg-green-400 mr-2 rounded-full"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
                Contract Address Verified:
              </motion.div>
              
              <motion.div
                className="font-mono text-green-400 tracking-wide flex items-center bg-black/40 p-2 rounded"
                animate={{ 
                  textShadow: ['0 0 5px rgba(74, 222, 128, 0.3)', '0 0 15px rgba(74, 222, 128, 0.7)', '0 0 5px rgba(74, 222, 128, 0.3)'],
                  backgroundColor: ['rgba(0, 0, 0, 0.4)', 'rgba(34, 197, 94, 0.05)', 'rgba(0, 0, 0, 0.4)']
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.span 
                  className="text-green-500 mr-2"
                  animate={{ rotate: [0, 359] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  ⟳
                </motion.span>
                <ContractDisplay isRevealed={contractData.isRevealed} contractAddress={contractData.address} />
              </motion.div>
              
              {/* Animated progress bar */}
              <motion.div 
                className="mt-3 w-full bg-black/40 h-1 rounded-full overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 4, duration: 0.5 }}
              >
                <motion.div 
                  className="h-full bg-green-400"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 4.1, duration: 1.5 }}
                />
              </motion.div>
              
              <motion.div 
                className="text-green-400/70 text-xs mt-1 text-right font-mono"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 5.6, duration: 0.5 }}
              >
                HASH VERIFIED • SIGNATURE VALID
              </motion.div>
            </motion.div>
          </motion.div>
        ) : (
          // ORIGINAL RELEASE STATE - Bouncy animation
          <motion.div 
            className="text-3xl sm:text-4xl text-green-400 font-bold py-4"
            layoutId="terminal-content"
            initial={{ scale: 1 }}
            animate={{ 
              scale: [1, 1.15, 1],
              textShadow: [
                '0 0 10px rgba(74, 222, 128, 0.5)',
                '0 0 30px rgba(74, 222, 128, 0.9)',
                '0 0 10px rgba(74, 222, 128, 0.5)'
              ],
              filter: [
                'brightness(1)',
                'brightness(1.3)',
                'brightness(1)'
              ]
            }}
            transition={{ 
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <span className="bg-gradient-to-r from-green-400 via-emerald-300 to-green-400 text-transparent bg-clip-text">
              ACCESS GRANTED
            </span>
            <div className="mt-2 text-base text-green-300 font-normal">Protocol decryption successful</div>
          </motion.div>
        )
      ) : (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          layoutId="terminal-content"
        >
          <motion.div 
            className="flex justify-center gap-2 sm:gap-3 md:gap-3 lg:gap-3 px-4 py-5 bg-black/50 rounded-md border w-full max-w-xl mx-auto"
            style={{
              borderColor: "#33ff66",
              boxShadow: "0 0 15px rgba(51, 255, 102, 0.2)"
            }}
            animate={{
              boxShadow: [
                '0 0 5px rgba(51, 255, 102, 0.2)',
                '0 0 15px rgba(51, 255, 102, 0.4)',
                '0 0 5px rgba(51, 255, 102, 0.2)'
              ]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            layout
          >
            {/* CTU-style counter header */}
            <motion.div 
              className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-black px-3 py-1 rounded-sm text-xs font-mono tracking-wider"
              style={{ color: "#33ff66", borderTop: "1px solid #33ff66", borderLeft: "1px solid #33ff66", borderRight: "1px solid #33ff66" }}
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              COUNTDOWN ACTIVE
            </motion.div>
            
            <TimeUnit value={timeRemaining.days} label="DAYS" urgencyLevel={urgencyLevel} />
            <motion.div
              className="text-xl sm:text-2xl lg:text-3xl font-mono self-center mt-1 w-4 text-center"
              style={{ color: "#33ff66" }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity }}
            >:</motion.div>
            <TimeUnit value={timeRemaining.hours} label="HRS" urgencyLevel={urgencyLevel} />
            <motion.div
              className="text-xl sm:text-2xl lg:text-3xl font-mono self-center mt-1 w-4 text-center"
              style={{ color: "#33ff66" }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity }}
            >:</motion.div>
            <TimeUnit value={timeRemaining.minutes} label="MIN" urgencyLevel={urgencyLevel} />
            <motion.div
              className="text-xl sm:text-2xl lg:text-3xl font-mono self-center mt-1 w-4 text-center"
              style={{ color: "#33ff66" }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity }}
            >:</motion.div>
            <TimeUnit value={timeRemaining.seconds} label="SEC" urgencyLevel={urgencyLevel} />
          </motion.div>
          
          <motion.div 
            className="mt-4 text-sm font-mono px-3 py-2 bg-black/40 rounded border-l-2 mx-auto max-w-lg"
            style={{ borderColor: "#33ff66", color: "#33ff66" }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
            layout
          >
            <span style={{ opacity: 0.7 }}>// </span>
            SYSTEM STATUS: <span className="font-bold">AWAITING COUNTDOWN COMPLETION</span>
            <motion.span 
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              style={{ marginLeft: 2 }}
            >_</motion.span>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DecryptionTimer;