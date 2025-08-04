import { useState, useEffect, memo, useCallback } from 'react';
import { motion } from 'framer-motion';

// Separate component for PnL display to prevent re-rendering the whole player
const PnLDisplay = memo(({ basePnL, index, onPnLChange }: { basePnL: number, index: number, onPnLChange: (index: number, value: number) => void }) => {
  const [pnl, setPnl] = useState(basePnL);
  
  useEffect(() => {
    // Fixed interval based on player index to avoid random timing
    const intervalTime = 1500 + (index * 200); // Stagger updates
    
    const interval = setInterval(() => {
      setPnl(() => {
        const fluctuation = (Math.random() - 0.5) * 10; // -5 to +5
        const newValue = Math.round(basePnL + fluctuation);
        onPnLChange(index, newValue);
        return newValue;
      });
    }, intervalTime);
    
    return () => clearInterval(interval);
  }, [basePnL, index, onPnLChange]);
  
  return (
    <motion.text
      x="0" y="-20"
      textAnchor="middle"
      className={`text-[10px] font-bold ${pnl > 0 ? 'fill-green-400' : 'fill-red-400'}`}
    >
      {pnl > 0 ? '+' : ''}{pnl}%
    </motion.text>
  );
});

// Generate stable animation paths once
const generatePaths = () => {
  return Array.from({ length: 5 }, () => ({
    x: Array.from({ length: 5 }, () => Math.random() * 120 - 60),
    y: Array.from({ length: 5 }, () => Math.random() * 120 - 60),
    duration: 10 + Math.random() * 5
  }));
};

// Memoize the player component to prevent re-renders
const Player = memo(({ index, basePnL, isLeader, onPnLChange, animationPath }: any) => {
  return (
    <motion.g
      key={`player-${index}`}
      animate={{
        x: animationPath.x,
        y: animationPath.y
      }}
      transition={{
        duration: animationPath.duration,
        repeat: Infinity,
        ease: "linear"
      }}
    >
      <motion.g
        animate={{
          rotate: [0, 10, -10, 0]
        }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          repeatType: "reverse",
          delay: index * 0.1
        }}
      >
        {/* Head */}
        <circle cx="0" cy="-10" r="6" className="fill-gray-600" />
        {/* Body */}
        <line x1="0" y1="-4" x2="0" y2="8" stroke="#4B5563" strokeWidth="2" />
        {/* Arms - animated for fighting */}
        <motion.line
          x1="0" y1="0" x2="-8" y2="5"
          stroke="#4B5563" strokeWidth="2"
          animate={{ x2: [-8, -10, -6, -8] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: index * 0.2 }}
        />
        <motion.line
          x1="0" y1="0" x2="8" y2="5"
          stroke="#4B5563" strokeWidth="2"
          animate={{ x2: [8, 10, 6, 8] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: index * 0.2 + 0.25 }}
        />
        {/* Legs */}
        <line x1="0" y1="8" x2="-5" y2="16" stroke="#4B5563" strokeWidth="2" />
        <line x1="0" y1="8" x2="5" y2="16" stroke="#4B5563" strokeWidth="2" />
        
        {/* PnL indicator - isolated component */}
        <PnLDisplay basePnL={basePnL} index={index} onPnLChange={onPnLChange} />
        
        {/* Crown for leader - matching Step 3 design */}
        {isLeader && (
          <g transform="translate(-5, -20)">
            <path d="M1 8 L2 3 L4 6 L6 1 L8 6 L10 3 L11 8 L10 9 L1 9 Z" 
                  fill="#FFD700" 
                  stroke="#B8860B" 
                  strokeWidth="0.3" />
            <rect x="1" y="8" width="10" height="1.5" fill="#FFD700" stroke="#B8860B" strokeWidth="0.2" />
            <circle cx="3" cy="5" r="0.4" fill="#DC143C" />
            <circle cx="6" cy="3" r="0.4" fill="#4169E1" />
            <circle cx="9" cy="5" r="0.4" fill="#DC143C" />
          </g>
        )}
      </motion.g>
    </motion.g>
  );
});
Player.displayName = 'Player';

export const Stage2 = () => {
  // Fixed PnL values for each player
  const basePnL = [+40, -23, +3, +22, -50];
  const [currentPnL, setCurrentPnL] = useState(basePnL);
  const [leaderIndex, setLeaderIndex] = useState(0);
  
  // Generate animation paths once
  const [animationPaths] = useState(() => generatePaths());
  
  // Update leader whenever PnL changes
  useEffect(() => {
    const maxIndex = currentPnL.reduce((maxIdx, val, idx) => 
      val > currentPnL[maxIdx] ? idx : maxIdx, 0
    );
    setLeaderIndex(maxIndex);
  }, [currentPnL]);
  
  // Update PnL values
  const handlePnLChange = useCallback((index: number, value: number) => {
    setCurrentPnL(prev => {
      const newPnL = [...prev];
      newPnL[index] = value;
      return newPnL;
    });
  }, []);
  
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center">
        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Step 2</p>
        <h3 className="step-label">Contest Runs</h3>
      </div>
      
      {/* Contest circle with stick figures competing inside */}
      <svg width={260} height={260} className="relative">
        <defs>
          <radialGradient id="contestGradient2">
            <stop offset="0%" stopColor="rgba(34, 197, 94, 0.1)" />
            <stop offset="100%" stopColor="rgba(147, 51, 234, 0.1)" />
          </radialGradient>
        </defs>
        <g transform="translate(130 130)">
          {/* Contest circle - matching Step 1 */}
          <circle r={100} className="stroke-gray-600/30 stroke-1" fill="url(#contestGradient2)" />
          
          {/* Contest name - centered in circle */}
          <text y="-4" textAnchor="middle" className="fill-gray-200 text-xs">
            Dinnertime Duel
          </text>
          <text y="12" textAnchor="middle" className="fill-gray-400 text-[10px]">
            In Progress
          </text>
          
          {/* Stick figures battling inside with bouncing paths */}
          {[0, 1, 2, 3, 4].map((i) => (
            <Player
              key={`player-${i}`}
              index={i}
              basePnL={basePnL[i]}
              isLeader={leaderIndex === i}
              onPnLChange={handlePnLChange}
              animationPath={animationPaths[i]}
            />
          ))}
        </g>
      </svg>
    </div>
  );
};