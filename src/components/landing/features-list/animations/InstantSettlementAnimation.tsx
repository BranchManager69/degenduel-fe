// src/components/landing/features-list/animations/InstantSettlementAnimation.tsx

/**
 * Animation component for the Instant Settlement feature card
 * Visualizes the immediate prize distribution after contest completion
 */

import React from 'react';
import { motion } from 'framer-motion';

export const InstantSettlementAnimation: React.FC = () => {
  // Contest results data
  const contestResults = [
    { rank: 1, user: 'CryptoWhale', profit: '+42.6%', prize: '5.00 SOL' },
    { rank: 2, user: 'TokenMaster', profit: '+38.3%', prize: '2.50 SOL' },
    { rank: 3, user: 'SolanaWizard', profit: '+31.9%', prize: '1.50 SOL' },
    { rank: 4, user: 'DegenKing', profit: '+28.7%', prize: '1.00 SOL' }
  ];
  
  // Settlement confirmation data
  const confirmations = [
    { type: 'transaction', id: 'TX783D...A21F', status: 'Confirmed', time: '0.8s' },
    { type: 'verification', id: 'VX512C...93BF', status: 'Verified', time: '0.3s' },
    { type: 'distribution', id: 'DX954A...F21C', status: 'Complete', time: '1.2s' }
  ];
  
  // Animation variants
  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.15
      }
    }
  };
  
  const resultRowVariants = {
    initial: { opacity: 0, y: 10 },
    animate: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        delay: i * 0.1
      }
    })
  };
  
  const confirmationVariants = {
    initial: { opacity: 0, x: -10 },
    animate: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        delay: 0.8 + (i * 0.2)
      }
    })
  };
  
  const walletTransferVariants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        delay: 1.6
      }
    }
  };
  
  // Animation for the transfer of funds
  const transferAnimation = {
    initial: { x: 0, opacity: 0 },
    animate: {
      x: [0, 80],
      opacity: [0, 1, 0],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        repeatDelay: 2
      }
    }
  };
  
  // Celebration animation
  const celebrationVariants = {
    initial: { opacity: 0, scale: 0.5 },
    animate: {
      opacity: [0, 1, 0],
      scale: [0.5, 1.2, 0.8],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatDelay: 3,
        delay: 2
      }
    }
  };
  
  // Pulse animation for status indicators
  const statusPulseVariants = {
    animate: {
      scale: [1, 1.1, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 2,
        repeat: Infinity
      }
    }
  };

  return (
    <motion.div 
      className="w-full h-full flex flex-col bg-dark-300/60 rounded-lg overflow-hidden p-2"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Contest completion header */}
      <div className="bg-dark-400/50 rounded-lg p-2 mb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white mr-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M12 15C15.5 15 18.5 12 18.5 8V4.5H5.5V8C5.5 12 8.5 15 12 15Z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8.5 20.5H15.5M12 15V20.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-white">Alpha Degen Duel</div>
              <div className="text-[9px] font-mono text-gray-400">ID: DD-728-ALPHA</div>
            </div>
          </div>
          
          <div className="bg-green-500/20 px-2 py-1 rounded border border-green-500/30">
            <span className="text-[10px] font-mono text-green-400 font-bold">COMPLETED</span>
          </div>
        </div>
        
        <div className="flex justify-between mt-2 text-[9px] font-mono">
          <div className="text-gray-400">Entry: 1.0 SOL</div>
          <div className="text-brand-400">Prize Pool: 10.0 SOL</div>
          <div className="text-gray-400">Duration: 24h</div>
        </div>
      </div>
      
      {/* Results table */}
      <div className="bg-dark-400/30 rounded-lg p-2 mb-2">
        <div className="text-[10px] font-mono text-gray-300 mb-1">Final Standings</div>
        
        <div className="space-y-1.5">
          {/* Header row */}
          <div className="flex items-center text-[9px] font-mono text-gray-500 pb-1 border-b border-dark-500/50">
            <div className="w-8 text-center">#</div>
            <div className="flex-1">Trader</div>
            <div className="w-16 text-right">Profit</div>
            <div className="w-16 text-right">Prize</div>
          </div>
          
          {/* Result rows */}
          {contestResults.map((result, idx) => (
            <motion.div 
              key={idx}
              className={`flex items-center text-[10px] font-mono ${idx === 0 ? 'bg-brand-500/20 rounded' : idx < 3 ? 'bg-dark-400/40 rounded' : ''}`}
              variants={resultRowVariants}
              initial="initial"
              animate="animate"
              custom={idx}
            >
              <div className="w-8 text-center">
                {idx === 0 ? (
                  <span className="text-yellow-400 font-bold">1st</span>
                ) : idx === 1 ? (
                  <span className="text-gray-400 font-bold">2nd</span>
                ) : idx === 2 ? (
                  <span className="text-amber-700 font-bold">3rd</span>
                ) : (
                  <span className="text-gray-500">{result.rank}th</span>
                )}
              </div>
              <div className="flex-1 text-white">{result.user}</div>
              <div className="w-16 text-right text-green-400">{result.profit}</div>
              <div className="w-16 text-right text-brand-300 font-bold">{result.prize}</div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Settlement process visualization */}
      <div className="flex-1 grid grid-cols-2 gap-2">
        {/* Left: Transaction confirmations */}
        <div className="bg-dark-400/30 rounded-lg p-2">
          <div className="text-[10px] font-mono text-gray-300 mb-1.5">Settlement Process</div>
          
          <div className="space-y-2">
            {confirmations.map((confirm, idx) => (
              <motion.div 
                key={idx}
                className="bg-dark-500/30 rounded p-1.5 border border-dark-600/50"
                variants={confirmationVariants}
                initial="initial"
                animate="animate"
                custom={idx}
              >
                <div className="flex justify-between text-[9px] font-mono mb-0.5">
                  <span className="text-gray-400">{confirm.type.toUpperCase()}</span>
                  <span className="text-gray-400">{confirm.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[8px] font-mono text-brand-300">{confirm.id}</span>
                  <div className="flex items-center">
                    <motion.div 
                      className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1"
                      variants={statusPulseVariants}
                      animate="animate"
                    />
                    <span className="text-[8px] font-mono text-green-400">{confirm.status}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Settlement time indicator */}
          <div className="mt-2 flex items-center justify-center bg-dark-600/30 rounded p-1.5">
            <div className="flex items-center">
              <motion.div 
                className="h-2 w-2 rounded-full bg-brand-500 mr-1.5"
                variants={statusPulseVariants}
                animate="animate"
              />
              <span className="text-[10px] font-mono text-white">Total Settlement Time:</span>
              <span className="text-[10px] font-mono text-brand-400 font-bold ml-1">2.3s</span>
            </div>
          </div>
        </div>
        
        {/* Right: Wallet transfer visualization */}
        <motion.div 
          className="bg-dark-400/30 rounded-lg p-2 flex flex-col"
          variants={walletTransferVariants}
          initial="initial"
          animate="animate"
        >
          <div className="text-[10px] font-mono text-gray-300 mb-1.5">Prize Distribution</div>
          
          {/* The transfer animation */}
          <div className="flex-1 flex flex-col items-center justify-center relative">
            {/* DegenDuel wallet (source) */}
            <div className="absolute top-2 left-2 w-16 p-1.5 bg-dark-500/70 border border-dark-600 rounded">
              <div className="text-[8px] font-mono text-center">
                <div className="text-gray-400">Platform</div>
                <div className="text-white truncate">DD7x8...F24r</div>
              </div>
            </div>
            
            {/* Winner wallet (destination) */}
            <div className="absolute bottom-2 right-2 w-16 p-1.5 bg-dark-500/70 border border-dark-600 rounded">
              <div className="text-[8px] font-mono text-center">
                <div className="text-gray-400">Winner</div>
                <div className="text-white truncate">C8p2...A39z</div>
              </div>
            </div>
            
            {/* Transfer path */}
            <svg viewBox="0 0 100 100" className="w-full h-full absolute">
              <defs>
                <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#d946ef" />
                </linearGradient>
              </defs>
              <path 
                d="M20 20 C 40 20, 40 80, 80 80" 
                fill="none" 
                stroke="url(#pathGradient)" 
                strokeWidth="1.5"
                strokeDasharray="3,3"
                strokeOpacity="0.6"
              />
            </svg>
            
            {/* Moving SOL token */}
            <motion.div
              className="absolute w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 border border-white/20 flex items-center justify-center shadow-lg"
              style={{ top: '20%', left: '20%' }}
              variants={transferAnimation}
              initial="initial"
              animate="animate"
            >
              <span className="text-white text-[9px] font-bold">SOL</span>
            </motion.div>
            
            {/* Celebration animation */}
            <motion.div
              className="absolute w-14 h-14 bottom-0 right-0"
              variants={celebrationVariants}
              initial="initial"
              animate="animate"
            >
              {/* Simple confetti */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-xl">🎉</div>
              </div>
            </motion.div>
          </div>
          
          {/* Status indicator */}
          <div className="mt-2 flex items-center justify-center bg-dark-600/30 rounded p-1.5">
            <div className="flex items-center">
              <motion.div 
                className="h-2 w-2 rounded-full bg-green-500 mr-1.5"
                variants={statusPulseVariants}
                animate="animate"
              />
              <span className="text-[10px] font-mono text-green-400">Prizes Sent Successfully</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};