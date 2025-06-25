import { motion } from 'framer-motion';
import React from 'react';
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
  const isFirst = rank === 1;
  const portfolioValue = parseFloat(userPerformance.portfolio_value || '0');
  const pnlPercent = parseFloat(userPerformance.performance_percentage || '0');
  const isProfit = pnlPercent >= 0;
  
  // Get rank display styling
  const getRankStyling = () => {
    if (isFirst) return {
      bgGradient: 'from-yellow-400/30 via-yellow-500/20 to-orange-500/30',
      textColor: 'text-yellow-300',
      glowColor: 'shadow-yellow-400/50',
      ringColor: 'ring-yellow-400/60',
      emoji: '👑'
    };
    if (rank === 2) return {
      bgGradient: 'from-gray-300/30 via-gray-400/20 to-gray-500/30',
      textColor: 'text-gray-200',
      glowColor: 'shadow-gray-400/50',
      ringColor: 'ring-gray-400/60',
      emoji: '🥈'
    };
    if (rank === 3) return {
      bgGradient: 'from-amber-600/30 via-amber-700/20 to-amber-800/30',
      textColor: 'text-amber-400',
      glowColor: 'shadow-amber-500/50',
      ringColor: 'ring-amber-500/60',
      emoji: '🥉'
    };
    if (rank <= 10) return {
      bgGradient: 'from-brand-500/20 via-brand-600/15 to-purple-600/20',
      textColor: 'text-brand-300',
      glowColor: 'shadow-brand-500/40',
      ringColor: 'ring-brand-500/50',
      emoji: '⭐'
    };
    return {
      bgGradient: 'from-dark-200/50 via-dark-300/30 to-dark-400/20',
      textColor: 'text-gray-300',
      glowColor: 'shadow-dark-500/30',
      ringColor: 'ring-dark-400/40',
      emoji: '🎯'
    };
  };

  const styling = getRankStyling();
  
  return (
    <motion.div 
      className={`bg-gradient-to-br ${styling.bgGradient} backdrop-blur-sm rounded-2xl p-8 border border-dark-300/50 relative overflow-hidden group ${className}`}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ 
        delay: 0.3,
        type: "spring",
        stiffness: 200,
        damping: 20
      }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
    >
      {/* Epic Background Effects */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700`}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-shimmer" />
      </div>
      
      {/* Rank Glow Effect */}
      {isTopThree && (
        <>
          <div className={`absolute -top-4 -right-4 w-24 h-24 bg-gradient-radial ${styling.glowColor} rounded-full blur-2xl animate-pulse`} />
          <div className={`absolute -bottom-4 -left-4 w-20 h-20 bg-gradient-radial ${styling.glowColor} rounded-full blur-xl animate-pulse`} style={{ animationDelay: '1s' }} />
        </>
      )}
      
      <div className="relative z-10">
        {/* MASSIVE RANK DISPLAY */}
        <div className="text-center mb-6">
          <motion.div
            animate={{ 
              rotate: isFirst ? [0, 5, -5, 0] : 0,
              scale: isFirst ? [1, 1.05, 1] : 1
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative"
          >
            {/* Rank Number - HUGE! */}
            <div className={`text-8xl md:text-9xl font-black ${styling.textColor} leading-none mb-2 filter drop-shadow-2xl`}>
              #{rank || '?'}
            </div>
            
            {/* Rank Badge/Emoji */}
            <motion.div 
              className="text-4xl absolute -top-4 -right-4"
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                delay: 0.5
              }}
            >
              {styling.emoji}
            </motion.div>
          </motion.div>
          
          {/* Rank Status */}
          <motion.div 
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/30 ring-2 ${styling.ringColor} ${styling.textColor} text-sm font-bold uppercase tracking-wider`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {isFirst && "🏆 CHAMPION"}
            {rank === 2 && "🥈 RUNNER UP"}
            {rank === 3 && "🥉 THIRD PLACE"}
            {rank > 3 && rank <= 10 && "⭐ TOP 10"}
            {rank > 10 && "🎯 COMPETING"}
            {rank === 0 && "⏳ PENDING"}
          </motion.div>
        </div>
        
        {/* SLEEK COMBINED STATS */}
        <motion.div 
          className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-center justify-between">
            {/* Portfolio Value */}
            <div className="text-center flex-1">
              <div className="text-2xl font-black text-brand-400 font-mono">
                {formatCurrency(portfolioValue)}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Portfolio</div>
            </div>
            
            {/* Divider */}
            <div className="w-px h-12 bg-gradient-to-b from-transparent via-gray-600 to-transparent mx-4" />
            
            {/* P&L */}
            <div className="text-center flex-1">
              <motion.div 
                className={`text-2xl font-black font-mono flex items-center justify-center gap-1 ${
                  isProfit ? 'text-green-400' : 'text-red-400'
                }`}
                animate={{ 
                  scale: isProfit && pnlPercent > 10 ? [1, 1.05, 1] : 1
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity 
                }}
              >
                {isProfit ? '📈' : '📉'}
                {isProfit ? '+' : ''}{pnlPercent.toFixed(1)}%
              </motion.div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Return</div>
            </div>
          </div>
        </motion.div>
        
        {/* Prize Won - Epic Style */}
        {userPerformance.prize_awarded && parseFloat(userPerformance.prize_awarded) > 0 && (
          <motion.div 
            className="mt-4 bg-gradient-to-r from-yellow-500/20 via-yellow-400/30 to-yellow-500/20 backdrop-blur-sm rounded-xl p-4 border border-yellow-400/40 text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, type: "spring" }}
          >
            <div className="text-yellow-300 font-bold text-lg flex items-center justify-center gap-2">
              🏆 <span>{formatCurrency(parseFloat(userPerformance.prize_awarded))}</span> 🏆
            </div>
            <div className="text-yellow-400/80 text-sm uppercase tracking-wider">Prize Won!</div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};