// src/components/landing/features-list/animations/DegenReputationAnimation.tsx

/**
 * Animation component for the Degen Reputation System feature card
 * Visualizes the reputation levels, badges, and rewards system
 */

import React from 'react';
import { motion } from 'framer-motion';

export const DegenReputationAnimation: React.FC = () => {
  // Reputation levels with rewards
  const reputationLevels = [
    { level: 1, name: 'Novice', color: 'gray', points: 100, rewards: ['Basic Access'] },
    { level: 2, name: 'Apprentice', color: 'green', points: 500, rewards: ['5% Fee Discount'] },
    { level: 3, name: 'Adept', color: 'blue', points: 1000, rewards: ['10% Fee Discount', 'Private Duels'] },
    { level: 4, name: 'Expert', color: 'purple', points: 2500, rewards: ['15% Fee Discount', 'Early Access'] },
    { level: 5, name: 'Master', color: 'amber', points: 5000, rewards: ['20% Fee Discount', 'Enhanced Reflections'] },
  ];
  
  // Sample user progress
  const userProgress = {
    level: 3,
    currentPoints: 1275,
    nextLevelPoints: 2500,
    badges: [
      { id: 1, name: 'First Win', icon: '🏆', earned: true },
      { id: 2, name: '10x Winner', icon: '⭐', earned: true },
      { id: 3, name: 'Comeback King', icon: '📈', earned: true },
      { id: 4, name: 'Diamond Hands', icon: '💎', earned: false },
      { id: 5, name: 'Referral Pro', icon: '👥', earned: true },
      { id: 6, name: 'Profit Machine', icon: '💰', earned: false },
    ]
  };
  
  // Calculate progress percentage to next level
  const progressPercent = ((userProgress.currentPoints - reputationLevels[userProgress.level - 1].points) / 
    (reputationLevels[userProgress.level].points - reputationLevels[userProgress.level - 1].points)) * 100;
  
  // Animation variants
  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const levelVariants = {
    initial: { opacity: 0, x: -5 },
    animate: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        delay: i * 0.1
      }
    })
  };
  
  const progressVariants = {
    initial: { width: 0 },
    animate: {
      width: `${progressPercent}%`,
      transition: {
        duration: 1,
        ease: "easeOut",
        delay: 0.5
      }
    }
  };
  
  const badgeVariants = {
    initial: { scale: 0, rotate: -10 },
    animate: (i: number) => ({
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 15,
        delay: 0.7 + (i * 0.1)
      }
    })
  };
  
  const pulseVariants = {
    animate: {
      scale: [1, 1.05, 1],
      opacity: [0.8, 1, 0.8],
      transition: {
        duration: 2,
        repeat: Infinity
      }
    }
  };
  
  // Helper to get level color class
  const getLevelColorClass = (levelName: string) => {
    switch (levelName.toLowerCase()) {
      case 'novice': return 'from-gray-400 to-gray-600';
      case 'apprentice': return 'from-green-400 to-green-600';
      case 'adept': return 'from-blue-400 to-blue-600';
      case 'expert': return 'from-purple-400 to-purple-600';
      case 'master': return 'from-amber-400 to-amber-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  return (
    <motion.div 
      className="w-full h-full bg-dark-300/60 rounded-lg p-2 overflow-hidden flex flex-col"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Profile header */}
      <div className="bg-dark-400/50 rounded-lg p-2 mb-2 flex items-center">
        <div className="relative mr-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white font-bold">
            DD
          </div>
          <motion.div 
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold border border-dark-800/50"
            variants={pulseVariants}
            animate="animate"
          >
            {userProgress.level}
          </motion.div>
        </div>
        
        <div className="flex-1">
          <div className="text-xs font-mono font-bold text-white">DegenTrader</div>
          <div className="text-[9px] font-mono text-brand-400">
            Level {userProgress.level} {reputationLevels[userProgress.level - 1].name}
          </div>
          
          {/* Level progress bar */}
          <div className="mt-1 h-1.5 bg-dark-600 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-brand-500 to-purple-500"
              variants={progressVariants}
              initial="initial"
              animate="animate"
            />
          </div>
          
          <div className="flex justify-between mt-0.5 text-[8px] font-mono">
            <span className="text-gray-400">{userProgress.currentPoints} points</span>
            <span className="text-gray-400">Next: {reputationLevels[userProgress.level].points}</span>
          </div>
        </div>
      </div>
      
      {/* Level progression system */}
      <div className="bg-dark-400/30 rounded-lg p-2 mb-2">
        <div className="text-[10px] font-mono text-gray-300 mb-1.5">Reputation Levels</div>
        
        <div className="space-y-1.5">
          {reputationLevels.map((level, idx) => (
            <motion.div 
              key={level.name}
              className={`flex items-center p-1.5 rounded ${userProgress.level >= level.level ? 'bg-dark-400/70' : 'bg-dark-600/30'}`}
              variants={levelVariants}
              initial="initial"
              animate="animate"
              custom={idx}
            >
              {/* Level indicator */}
              <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${getLevelColorClass(level.name)} flex items-center justify-center text-white text-xs font-bold mr-2`}>
                {level.level}
              </div>
              
              {/* Level name and points */}
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="text-[10px] font-mono font-bold text-white">{level.name}</span>
                  <span className="text-[9px] font-mono text-gray-400">{level.points} pts</span>
                </div>
                
                {/* Rewards */}
                <div className="flex mt-0.5 gap-1">
                  {level.rewards.map((reward, i) => (
                    <span 
                      key={i}
                      className={`text-[8px] font-mono px-1 py-0.5 rounded 
                        ${userProgress.level >= level.level 
                          ? 'bg-brand-500/20 text-brand-300'
                          : 'bg-dark-500/30 text-gray-500'}`}
                    >
                      {reward}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Completed checkmark */}
              {userProgress.level > level.level && (
                <div className="ml-1 text-green-500">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12L10 17L19 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
              
              {/* Current level indicator */}
              {userProgress.level === level.level && (
                <motion.div 
                  className="ml-1 w-2 h-2 rounded-full bg-brand-500"
                  animate={{
                    opacity: [0.5, 1, 0.5],
                    scale: [1, 1.3, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity
                  }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Achievement badges */}
      <div className="bg-dark-400/30 rounded-lg p-2 flex-1">
        <div className="text-[10px] font-mono text-gray-300 mb-1.5">Achievement Badges</div>
        
        <div className="grid grid-cols-3 gap-2">
          {userProgress.badges.map((badge, idx) => (
            <motion.div 
              key={badge.id}
              className={`flex flex-col items-center justify-center p-1.5 rounded ${badge.earned ? 'bg-dark-400/70' : 'bg-dark-600/40'}`}
              variants={badgeVariants}
              initial="initial"
              animate="animate"
              custom={idx}
            >
              <div className={`text-lg ${!badge.earned && 'grayscale opacity-50'}`}>
                {badge.icon}
              </div>
              <div className={`text-[8px] font-mono mt-1 ${badge.earned ? 'text-white' : 'text-gray-500'}`}>
                {badge.name}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Status footer */}
      <div className="flex justify-between items-center mt-2 text-[8px] font-mono text-gray-500">
        <div>Next reward: 15% Fee Discount</div>
        <div className="flex items-center">
          <div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1"></div>
          <span>Synced</span>
        </div>
      </div>
    </motion.div>
  );
};