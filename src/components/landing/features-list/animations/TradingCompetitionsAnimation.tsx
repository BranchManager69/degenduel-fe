// src/components/landing/features-list/animations/TradingCompetitionsAnimation.tsx

/**
 * Animation component for the Trading Competitions feature card
 * Visualizes the dynamic competition between traders with live price charts
 */

import React from 'react';
import { motion } from 'framer-motion';

export const TradingCompetitionsAnimation: React.FC = () => {
  // Participants in the trading competition
  const participants = [
    { id: 1, name: 'Trader1', color: 'from-green-500 to-emerald-600', profit: 32.4 },
    { id: 2, name: 'DegenKing', color: 'from-purple-500 to-indigo-600', profit: 28.7 },
    { id: 3, name: 'SolMaster', color: 'from-blue-500 to-cyan-600', profit: 21.2 },
    { id: 4, name: 'MoonHunter', color: 'from-red-500 to-pink-600', profit: 15.8 },
    { id: 5, name: 'TokenLord', color: 'from-amber-500 to-yellow-600', profit: 8.3 },
  ];
  
  // Chart data points for the competition
  const generateChartPoints = (baseline: number, volatility: number) => {
    return Array.from({ length: 24 }, (_, i) => {
      const randomFactor = Math.sin(i * 0.5) * volatility + Math.random() * volatility * 2;
      return baseline + randomFactor;
    });
  };
  
  // Generate chart data for each participant
  const participantCharts = participants.map(participant => {
    const volatility = 5 + Math.random() * 3;
    const baseline = 50 + Math.random() * 10;
    return {
      ...participant,
      chartPoints: generateChartPoints(baseline, volatility)
    };
  });
  
  // Time remaining in competition
  const timeRemaining = {
    hours: 1,
    minutes: 23,
    seconds: 45
  };
  
  // Prize pool details
  const prizePool = {
    total: '18.75 SOL',
    firstPlace: '9.5 SOL',
    secondPlace: '4.75 SOL',
    thirdPlace: '2.5 SOL',
    entries: 15
  };
  
  // Animation variants for pulsing elements
  const pulseVariant = {
    pulse: {
      opacity: [0.7, 1, 0.7],
      transition: { 
        duration: 2, 
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };
  
  // Animation variants for chart lines
  const chartLineVariant = {
    animate: (custom: number) => ({
      pathLength: [0, 1],
      transition: { 
        duration: 2,
        delay: custom * 0.2,
        ease: "easeInOut"
      }
    })
  };
  
  // Format chart points as SVG path
  const getChartPath = (points: number[]) => {
    const width = 100;
    const height = 40;
    const pointDistance = width / (points.length - 1);
    
    return points.map((point, index) => {
      const x = index * pointDistance;
      const y = height - (point / 100) * height;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-dark-300/30 rounded-lg flex flex-col">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_24px,#3f3f4610_25px,#3f3f4610_26px,transparent_27px),linear-gradient(90deg,transparent_24px,#3f3f4610_25px,#3f3f4610_26px,transparent_27px)] bg-[length:25px_25px]"></div>
      
      {/* Competition header */}
      <div className="flex justify-between items-center p-3 bg-dark-400/50 border-b border-gray-800">
        <div className="text-xs font-mono">
          <div className="text-brand-400 font-semibold">Alpha DuelMasters Competition</div>
          <div className="text-gray-400">ID: #DG45-721</div>
        </div>
        
        {/* Timer */}
        <motion.div 
          className="flex items-center space-x-1 bg-dark-800/70 px-2 py-1 rounded border border-brand-500/30"
          variants={pulseVariant}
          animate="pulse"
        >
          <span className="text-brand-300 text-xs font-mono">Ends in:</span>
          <span className="text-white text-xs font-mono font-bold">{`${timeRemaining.hours}h ${timeRemaining.minutes}m ${timeRemaining.seconds}s`}</span>
        </motion.div>
      </div>
      
      {/* Leaderboard */}
      <div className="flex-1 p-2 overflow-auto">
        <div className="text-xs font-mono text-gray-400 mb-1 flex justify-between pr-2">
          <div>Trader</div>
          <div>Profit</div>
        </div>
        
        {/* Participants */}
        <div className="space-y-2">
          {participantCharts.map((participant, index) => (
            <div 
              key={participant.id}
              className="flex items-center bg-dark-400/30 p-2 rounded relative overflow-hidden"
            >
              {/* Position indicator */}
              <div className={`absolute top-0 left-0 h-full w-1 bg-gradient-to-b ${participant.color}`}></div>
              
              {/* Trophy for top 3 */}
              {index < 3 && (
                <div className={`flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br ${participant.color} mr-2`}>
                  <span className="text-white text-[10px] font-bold">{index + 1}</span>
                </div>
              )}
              
              {/* Participant name */}
              <div className="flex-1 flex items-center">
                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${participant.color} mr-2`}></div>
                <div className="text-xs font-mono text-white">{participant.name}</div>
              </div>
              
              {/* Mini chart */}
              <div className="w-[100px] h-[40px] mx-2 relative">
                <svg viewBox="0 0 100 40" className="w-full h-full">
                  <motion.path
                    d={getChartPath(participant.chartPoints)}
                    fill="none"
                    stroke={`url(#gradient-${participant.id})`}
                    strokeWidth="2"
                    strokeLinecap="round"
                    variants={chartLineVariant}
                    initial={{ pathLength: 0 }}
                    animate="animate"
                    custom={index}
                  />
                  <defs>
                    <linearGradient id={`gradient-${participant.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" className={`${participant.color.split(' ')[0].replace('from-', 'text-')}`} />
                      <stop offset="100%" className={`${participant.color.split(' ')[1].replace('to-', 'text-')}`} />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              
              {/* Profit percentage */}
              <div className="text-xs font-mono font-bold w-14 text-right" style={{ color: index === 0 ? '#10b981' : index < 3 ? '#6ee7b7' : '#d1d5db' }}>
                +{participant.profit}%
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Prize pool section */}
      <div className="p-2 bg-dark-600/30 border-t border-gray-800 flex justify-between">
        <div className="text-xs font-mono">
          <div className="text-gray-400">Prize Pool</div>
          <div className="text-white font-bold">{prizePool.total}</div>
        </div>
        
        <div className="text-xs font-mono text-right">
          <div className="text-gray-400">Entries</div>
          <div className="text-white font-bold">{prizePool.entries}</div>
        </div>
      </div>
      
      {/* Market data ticker */}
      <motion.div 
        className="px-2 py-1 bg-dark-800/70 border-t border-gray-800/50 overflow-hidden whitespace-nowrap"
        animate={{ x: [0, -500] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      >
        <div className="text-[10px] font-mono flex space-x-4">
          <span className="text-green-400">SOL $198.45 +2.3%</span>
          <span className="text-red-400">BTC $62,780 -0.5%</span>
          <span className="text-green-400">ETH $3,412 +1.2%</span>
          <span className="text-green-400">BONK $0.00026 +5.7%</span>
          <span className="text-red-400">DEGEN $0.054 -0.8%</span>
          <span className="text-green-400">SAMO $0.032 +3.1%</span>
          <span className="text-red-400">PYTH $0.87 -1.4%</span>
          <span className="text-green-400">SOL $198.45 +2.3%</span>
          <span className="text-red-400">BTC $62,780 -0.5%</span>
          <span className="text-green-400">ETH $3,412 +1.2%</span>
        </div>
      </motion.div>
    </div>
  );
};