import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../../lib/utils';

interface PrizeDistributionCardProps {
  prizePool: string | number;
  className?: string;
}

export const PrizeDistributionCard: React.FC<PrizeDistributionCardProps> = ({
  prizePool,
  className = ""
}) => {
  const prizeAmount = parseFloat(prizePool.toString()) || 0;
  
  return (
    <motion.div 
      className={`bg-dark-200/50 backdrop-blur-sm rounded-lg p-6 border border-dark-300 relative overflow-hidden group ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/0 via-brand-500/0 to-orange-500/0 group-hover:from-yellow-500/5 group-hover:via-brand-500/5 group-hover:to-orange-500/5 transition-all duration-500" />
      
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 via-yellow-400/10 to-yellow-400/0 animate-data-stream-slow" />
      </div>
      
      <div className="relative z-10">
        <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Prize Distribution
        </h3>
        <div className="space-y-3">
          {/* 1st Place */}
          <motion.div 
            className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20"
            whileHover={{ scale: 1.02 }}
          >
            <span className="text-yellow-400 flex items-center gap-2 font-medium">
              <span className="text-2xl">🥇</span> 
              <span>1st Place</span>
            </span>
            <span className="font-mono font-bold text-yellow-400 text-lg">
              {formatCurrency(prizeAmount * 0.5)}
            </span>
          </motion.div>
          
          {/* 2nd Place */}
          <motion.div 
            className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-400/10 to-gray-500/10 border border-gray-500/20"
            whileHover={{ scale: 1.02 }}
          >
            <span className="text-gray-300 flex items-center gap-2 font-medium">
              <span className="text-2xl">🥈</span> 
              <span>2nd Place</span>
            </span>
            <span className="font-mono font-bold text-gray-300">
              {formatCurrency(prizeAmount * 0.3)}
            </span>
          </motion.div>
          
          {/* 3rd Place */}
          <motion.div 
            className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20"
            whileHover={{ scale: 1.02 }}
          >
            <span className="text-orange-500 flex items-center gap-2 font-medium">
              <span className="text-2xl">🥉</span> 
              <span>3rd Place</span>
            </span>
            <span className="font-mono font-bold text-orange-500">
              {formatCurrency(prizeAmount * 0.2)}
            </span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};