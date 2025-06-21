import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../../lib/utils';

interface UserPerformanceCardProps {
  userPerformance: {
    rank?: number;
    portfolio_value?: string;
    performance_percentage?: string;
    prize_awarded?: string;
  };
  className?: string;
}

export const UserPerformanceCard: React.FC<UserPerformanceCardProps> = ({
  userPerformance,
  className = ""
}) => {
  const rank = userPerformance.rank || 0;
  const isTopThree = rank > 0 && rank <= 3;
  
  return (
    <motion.div 
      className={`bg-dark-200/50 backdrop-blur-sm rounded-lg p-6 border border-dark-300 relative overflow-hidden group ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/0 to-brand-600/0 group-hover:from-brand-500/10 group-hover:to-brand-600/10 transition-all duration-500" />
      
      {/* Rank indicator glow for top 3 */}
      {isTopThree && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/20 rounded-full blur-3xl" />
      )}
      
      <div className="relative z-10">
        <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-brand-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
          Your Performance
        </h3>
        <div className="space-y-3">
          {/* Rank */}
          <div className="flex justify-between items-center p-3 rounded-lg bg-dark-300/30 border border-dark-200/50">
            <span className="text-gray-400">Rank</span>
            <span className={`font-mono font-bold text-lg flex items-center gap-2 ${
              isTopThree ? 'text-yellow-400' : 'text-gray-200'
            }`}>
              {isTopThree && (
                <span className="text-2xl">
                  {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                </span>
              )}
              #{rank || 'N/A'}
            </span>
          </div>
          
          {/* Portfolio Value */}
          <div className="flex justify-between items-center p-3 rounded-lg bg-dark-300/30 border border-dark-200/50">
            <span className="text-gray-400">Portfolio Value</span>
            <span className="font-mono font-bold text-brand-400 text-lg">
              {formatCurrency(parseFloat(userPerformance.portfolio_value || '0'))}
            </span>
          </div>
          
          {/* P&L */}
          <div className="flex justify-between items-center p-3 rounded-lg bg-dark-300/30 border border-dark-200/50">
            <span className="text-gray-400">P&L</span>
            <span className={`font-mono font-bold text-lg ${
              parseFloat(userPerformance.performance_percentage || '0') >= 0
                ? 'text-green-400'
                : 'text-red-400'
            }`}>
              {parseFloat(userPerformance.performance_percentage || '0') >= 0 ? '+' : ''}
              {userPerformance.performance_percentage || '0'}%
            </span>
          </div>
          
          {/* Prize Won */}
          {userPerformance.prize_awarded && parseFloat(userPerformance.prize_awarded) > 0 && (
            <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20">
              <span className="text-yellow-400 font-medium">Prize Won</span>
              <span className="font-mono font-bold text-yellow-400 text-lg">
                {formatCurrency(parseFloat(userPerformance.prize_awarded))}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};