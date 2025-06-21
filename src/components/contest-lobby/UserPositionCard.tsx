import React from 'react';
import { motion } from 'framer-motion';

interface UserPositionCardProps {
  rank?: number;
  performancePercentage?: string;
  className?: string;
}

export const UserPositionCard: React.FC<UserPositionCardProps> = ({
  rank,
  performancePercentage,
  className = ""
}) => {
  const isTopThree = rank && rank <= 3;
  
  return (
    <motion.div 
      className={`bg-dark-200/50 backdrop-blur-sm rounded-lg p-6 border border-dark-300 relative overflow-hidden group ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/0 to-brand-600/0 group-hover:from-brand-500/10 group-hover:to-brand-600/10 transition-all duration-500" />
      <div className="relative z-10">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Your Position</h3>
        <div className="text-center">
          <div className="text-5xl font-bold text-brand-400 mb-2">
            #{rank || 'N/A'}
          </div>
          <div className="text-sm text-gray-400">
            {isTopThree ? 'In Prize Position! 🎉' : 'Current Rank'}
          </div>
          {performancePercentage && (
            <div className="mt-4 text-2xl font-bold">
              <span className={parseFloat(performancePercentage) >= 0 ? 'text-green-400' : 'text-red-400'}>
                {parseFloat(performancePercentage) >= 0 ? '+' : ''}{performancePercentage}%
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};