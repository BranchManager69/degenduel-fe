/**
 * DegenDuelTop30 Component
 * 
 * Clean, professional display for top trending tokens
 * No tacky emojis or made-up categories - just data
 * 
 * @author DegenDuel Team
 * @created 2025-01-15
 * @updated 2025-06-05 - Cleaned up UI
 */

import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { DegenDuelToken, useDegenDuelTop30 } from "../../hooks/websocket/topic-hooks/useDegenDuelTop30";
import { formatNumber } from "../../utils/format";

interface DegenDuelTop30Props {
  limit?: number;
  showSparklines?: boolean;
  refreshInterval?: number;
  className?: string;
}

// Clean design constants
const RANK_COLORS = {
  1: 'from-yellow-500 to-amber-600',  // Gold
  2: 'from-gray-300 to-gray-400',     // Silver  
  3: 'from-orange-600 to-orange-700', // Bronze
  default: 'from-brand-500 to-brand-600'
};

// Simple sparkline component
const Sparkline: React.FC<{ data: number[]; className?: string }> = ({ data, className = "" }) => {
  if (!data || data.length === 0) return null;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg className={`w-16 h-8 ${className}`} viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        points={points}
        className="text-brand-400"
      />
    </svg>
  );
};

// Token card component
const TokenCard: React.FC<{ 
  token: DegenDuelToken; 
  rank: number; 
  showSparkline: boolean;
  onClick: () => void;
}> = ({ token, rank, showSparkline, onClick }) => {
  const rankGradient = RANK_COLORS[rank as keyof typeof RANK_COLORS] || RANK_COLORS.default;
  
  // Format percentage change with proper color coding
  const change24h = token.change_24h || parseFloat(token.change24h || '0');
  const formatPercentageChange = (change: number): { text: string; colorClass: string } => {
    const absChange = Math.abs(change);
    const sign = change >= 0 ? '+' : '';
    const text = `${sign}${absChange.toFixed(1)}%`;
    
    if (change > 10) return { text, colorClass: 'text-emerald-400' };
    if (change > 0) return { text, colorClass: 'text-green-400' };
    if (change > -10) return { text, colorClass: 'text-red-400' };
    return { text, colorClass: 'text-red-500' };
  };
  
  const changeData = formatPercentageChange(change24h);
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      onClick={onClick}
      className="relative p-4 rounded-xl cursor-pointer group bg-dark-300/50 border border-dark-400 hover:border-brand-400/50 hover:shadow-lg transition-all duration-300"
    >
      {/* Rank badge */}
      <div className={`absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-br ${rankGradient} rounded-full flex items-center justify-center text-xs font-bold text-white`}>
        {rank}
      </div>
      
      {/* Top row - Token info */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          {token.image_url && (
            <img 
              src={token.image_url} 
              alt={token.symbol}
              className="w-8 h-8 rounded-full object-cover"
            />
          )}
          
          <div>
            <span className="font-semibold text-white">{token.symbol}</span>
            <div className="text-xs text-gray-400 truncate max-w-[120px]">{token.name}</div>
          </div>
        </div>
        
        {/* DegenDuel Score */}
        <div className="text-right">
          <div className="text-lg font-bold text-brand-400">
            {Number(token.degenduel_score || 0).toFixed(0)}
          </div>
          <div className="text-xs text-gray-400">Score</div>
        </div>
      </div>
      
      {/* Price and change */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-medium text-white">
            ${formatNumber(Number(token.price))}
          </div>
          <div className="text-xs text-gray-400">Price</div>
        </div>
        
        <div className={`text-right ${changeData.colorClass}`}>
          <div className="text-sm font-medium">{changeData.text}</div>
          <div className="text-xs text-gray-400">24h</div>
        </div>
      </div>
      
      {/* Market data */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="text-gray-400">Market Cap</div>
          <div className="text-white font-medium">${formatNumber(Number(token.market_cap))}</div>
        </div>
        <div>
          <div className="text-gray-400">Volume 24h</div>
          <div className="text-white font-medium">${formatNumber(Number(token.volume_24h))}</div>
        </div>
      </div>
      
      {/* Sparkline */}
      {showSparkline && token.sparkline_1h && (
        <div className="mt-3 flex justify-center">
          <Sparkline data={token.sparkline_1h} />
        </div>
      )}
    </motion.div>
  );
};

export const DegenDuelTop30: React.FC<DegenDuelTop30Props> = ({
  limit = 30,
  showSparklines = false,
  refreshInterval = 30000,
  className = ""
}) => {
  const navigate = useNavigate();
  
  const {
    tokens,
    isLoading,
    lastUpdate,
    error,
    refresh,
    stats
  } = useDegenDuelTop30({
    limit,
    refreshInterval,
    includeSparklines: showSparklines
  });

  const handleTokenClick = (token: DegenDuelToken) => {
    if (token.contractAddress) {
      navigate(`/tokens?address=${token.contractAddress}`);
    }
  };

  if (isLoading && tokens.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Top {limit} Tokens</h2>
          <div className="animate-spin">
            <RefreshCw className="w-5 h-5 text-brand-400" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-red-400 mb-4">Error loading top {limit} tokens</div>
        <button 
          onClick={refresh}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Top {limit} Tokens
          </h2>
          <p className="text-gray-400 mt-1">Ranked by DegenDuel Score</p>
        </div>
        
        <div className="text-right space-y-1">
          <button 
            onClick={refresh}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 py-1.5 bg-brand-600/20 hover:bg-brand-600/30 rounded-lg transition-colors text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {lastUpdate && (
            <div className="text-xs text-gray-500">
              Updated {new Date(lastUpdate).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-dark-300/50 p-3 rounded-lg border border-dark-400">
            <div className="text-sm text-gray-400">Total Volume</div>
            <div className="text-lg font-bold text-white">${formatNumber(stats.totalVolume24h)}</div>
          </div>
          <div className="bg-dark-300/50 p-3 rounded-lg border border-dark-400">
            <div className="text-sm text-gray-400">Total Market Cap</div>
            <div className="text-lg font-bold text-white">${formatNumber(stats.totalMarketCap)}</div>
          </div>
          <div className="bg-dark-300/50 p-3 rounded-lg border border-dark-400">
            <div className="text-sm text-gray-400">Avg Score</div>
            <div className="text-lg font-bold text-brand-400">{stats.averageScore.toFixed(1)}</div>
          </div>
          <div className="bg-dark-300/50 p-3 rounded-lg border border-dark-400">
            <div className="text-sm text-gray-400">Top Score</div>
            <div className="text-lg font-bold text-cyber-400">{stats.topScore.toFixed(1)}</div>
          </div>
        </div>
      )}

      {/* Token Grid - Clean, no categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {tokens.map((token, index) => (
            <TokenCard
              key={token.contractAddress || token.symbol}
              token={token}
              rank={index + 1}
              showSparkline={showSparklines}
              onClick={() => handleTokenClick(token)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};