import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../../lib/utils';
import { ContestDetails } from '../../types';

interface ContestStatsCardProps {
  contest: ContestDetails;
  participants: any[];
  className?: string;
}

export const ContestStatsCard: React.FC<ContestStatsCardProps> = ({
  contest,
  participants,
  className = ""
}) => {
  // Calculate average performance
  const avgPerformance = participants.length > 0 
    ? participants.reduce((acc, p) => acc + parseFloat(p.performance_percentage || '0'), 0) / participants.length
    : 0;
    
  // Calculate duration
  const getDuration = () => {
    const endTime = contest.endTime || (contest as any).end_time;
    const startTime = contest.startTime || (contest as any).start_time;
    if (endTime && startTime) {
      const hours = Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 3600000);
      return hours + 'h';
    }
    return 'N/A';
  };
  
  return (
    <motion.div 
      className={`bg-dark-200/50 backdrop-blur-sm rounded-lg p-6 border border-dark-300 relative overflow-hidden group ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/0 via-purple-500/0 to-blue-500/0 group-hover:from-brand-500/5 group-hover:via-purple-500/5 group-hover:to-blue-500/5 transition-all duration-500" />
      
      <div className="relative z-10">
        <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Contest Stats
        </h3>
        <div className="space-y-3">
          {/* Total Volume */}
          <div className="flex justify-between items-center p-3 rounded-lg bg-dark-300/30 border border-dark-200/50 group/stat hover:bg-dark-300/50 transition-all">
            <span className="text-gray-400 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-400 group-hover/stat:animate-pulse" />
              Total Volume
            </span>
            <span className="font-mono font-bold text-brand-400">
              {formatCurrency(participants.length * parseFloat(contest.entryFee || '0'))}
            </span>
          </div>
          
          {/* Avg Performance */}
          <div className="flex justify-between items-center p-3 rounded-lg bg-dark-300/30 border border-dark-200/50 group/stat hover:bg-dark-300/50 transition-all">
            <span className="text-gray-400 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-400 group-hover/stat:animate-pulse" />
              Avg Performance
            </span>
            <span className={`font-mono font-bold ${
              avgPerformance > 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {avgPerformance > 0 ? '+' : ''}{avgPerformance.toFixed(2)}%
            </span>
          </div>
          
          {/* Duration */}
          <div className="flex justify-between items-center p-3 rounded-lg bg-dark-300/30 border border-dark-200/50 group/stat hover:bg-dark-300/50 transition-all">
            <span className="text-gray-400 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400 group-hover/stat:animate-pulse" />
              Duration
            </span>
            <span className="font-mono text-gray-200">
              {getDuration()}
            </span>
          </div>
          
          {/* Allowed Tokens */}
          {contest.settings?.tokenTypesAllowed && (
            <div className="flex justify-between items-center p-3 rounded-lg bg-dark-300/30 border border-dark-200/50 group/stat hover:bg-dark-300/50 transition-all">
              <span className="text-gray-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400 group-hover/stat:animate-pulse" />
                Allowed Tokens
              </span>
              <span className="text-gray-200 text-sm">
                {contest.settings.tokenTypesAllowed.join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};