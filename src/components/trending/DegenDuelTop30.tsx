/**
 * DegenDuelTop30 Component
 * 
 * Premium display component for DegenDuel's proprietary Top 30 trending tokens
 * Features enhanced UI with scores, categories, sparklines, and highlight reasons
 * 
 * @author DegenDuel Team
 * @created 2025-01-15
 */

import { AnimatePresence, motion } from "framer-motion";
import { Crown, Gem, RefreshCw, Sunrise, TrendingUp, Zap } from "lucide-react";
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DegenDuelToken, useDegenDuelTop30 } from "../../hooks/websocket/topic-hooks/useDegenDuelTop30";
import { formatNumber } from "../../utils/format";

interface DegenDuelTop30Props {
  limit?: number;
  showCategories?: boolean;
  showSparklines?: boolean;
  refreshInterval?: number;
  className?: string;
}

// Category icons and colors
const CATEGORY_CONFIG = {
  '🌅 Early Birds': {
    icon: Sunrise,
    color: 'from-orange-500 to-yellow-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30'
  },
  '🔥 Heating Up': {
    icon: TrendingUp,
    color: 'from-red-500 to-orange-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30'
  },
  '🚀 Moon Mission': {
    icon: Zap,
    color: 'from-blue-500 to-purple-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30'
  },
  '💎 Hidden Gems': {
    icon: Gem,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30'
  }
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
  const categoryConfig = CATEGORY_CONFIG[token.trend_category];
  const IconComponent = categoryConfig.icon;
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={`
        relative p-4 rounded-xl cursor-pointer group
        bg-gradient-to-br from-gray-900/80 to-gray-800/80 
        border ${categoryConfig.borderColor}
        hover:shadow-xl hover:shadow-brand-500/20
        transition-all duration-300
      `}
    >
      {/* Rank badge */}
      <div className="absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
        {rank}
      </div>
      
      {/* Top row - Token info */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          {token.image_url ? (
            <img 
              src={token.image_url} 
              alt={token.symbol}
              className="w-8 h-8 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <IconComponent className={`w-6 h-6 ${token.image_url ? 'hidden' : ''}`} />
          
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-white">{token.symbol}</span>
              <span className="text-xl">{token.momentum_indicator}</span>
            </div>
            <div className="text-xs text-gray-400 truncate max-w-[120px]">{token.name}</div>
          </div>
        </div>
        
        {/* DegenDuel Score */}
        <div className="text-right">
          <div className="text-lg font-bold bg-gradient-to-r from-brand-400 to-cyber-400 bg-clip-text text-transparent">
            {token.degenduel_score.toFixed(1)}
          </div>
          <div className="text-xs text-gray-400">DD Score™</div>
        </div>
      </div>
      
      {/* Price and change */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-medium text-white">
            ${formatNumber(Number(token.price))}
          </div>
          <div className="text-xs text-gray-400">
            MC: {formatNumber(Number(token.marketCap))}
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-sm font-semibold ${
            Number(token.change24h) >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {Number(token.change24h) >= 0 ? '+' : ''}{Number(token.change24h).toFixed(2)}%
          </div>
          {showSparkline && token.sparkline_1h && (
            <Sparkline data={token.sparkline_1h} className="mt-1" />
          )}
        </div>
      </div>
      
      {/* Category badge */}
      <div className={`
        inline-flex items-center px-2 py-1 rounded-md text-xs font-medium mb-2
        ${categoryConfig.bgColor} text-white
      `}>
        <span className="mr-1">{token.trend_category.split(' ')[0]}</span>
        {token.trend_category.split(' ').slice(1).join(' ')}
      </div>
      
      {/* Highlight reason */}
      {token.highlight_reason && (
        <div className="text-xs text-brand-300 bg-brand-500/10 px-2 py-1 rounded border border-brand-500/20">
          {token.highlight_reason}
        </div>
      )}
      
      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-500/0 to-cyber-500/0 group-hover:from-brand-500/10 group-hover:to-cyber-500/10 transition-all duration-300 pointer-events-none" />
    </motion.div>
  );
};

export const DegenDuelTop30: React.FC<DegenDuelTop30Props> = ({
  limit = 30,
  showCategories = true,
  showSparklines = true,
  refreshInterval = 30000,
  className = ""
}) => {
  const navigate = useNavigate();
  
  const {
    tokens,
    metadata,
    isLoading,
    lastUpdate,
    isConnected,
    error,
    refresh,
    stats,
    getTokensByCategory
  } = useDegenDuelTop30({
    limit,
    refreshInterval,
    includeSparklines: showSparklines
  });

  // Group tokens by category if enabled
  const tokensByCategory = useMemo(() => {
    if (!showCategories) {
      return { 'All Tokens': tokens };
    }

    return {
      '🌅 Early Birds': getTokensByCategory('🌅 Early Birds'),
      '🔥 Heating Up': getTokensByCategory('🔥 Heating Up'),
      '🚀 Moon Mission': getTokensByCategory('🚀 Moon Mission'),
      '💎 Hidden Gems': getTokensByCategory('💎 Hidden Gems')
    };
  }, [tokens, showCategories, getTokensByCategory]);

  const handleTokenClick = (token: DegenDuelToken) => {
    if (token.contractAddress) {
      navigate(`/tokens?address=${token.contractAddress}`);
    }
  };

  if (isLoading && tokens.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-brand-400 to-cyber-400 bg-clip-text text-transparent">
            DegenDuel Top {limit}
          </h2>
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
        <div className="text-red-400 mb-4">Error loading DegenDuel Top {limit}</div>
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
          <div className="flex items-center space-x-3">
            <Crown className="w-8 h-8 text-yellow-500" />
            <h2 className="text-3xl font-bold bg-gradient-to-r from-brand-400 to-cyber-400 bg-clip-text text-transparent">
              DegenDuel Top {limit}
            </h2>
          </div>
          <p className="text-gray-400 mt-1">Curated trending tokens with proprietary scoring</p>
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

      {/* Stats */}
      {metadata && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 p-3 rounded-lg">
            <div className="text-sm text-gray-400">Total Tokens</div>
            <div className="text-xl font-bold text-white">{stats.totalTokens}</div>
          </div>
          <div className="bg-gray-800/50 p-3 rounded-lg">
            <div className="text-sm text-gray-400">Avg Score</div>
            <div className="text-xl font-bold text-brand-400">{stats.averageScore.toFixed(1)}</div>
          </div>
          <div className="bg-gray-800/50 p-3 rounded-lg">
            <div className="text-sm text-gray-400">Top Score</div>
            <div className="text-xl font-bold text-cyber-400">{stats.topScore.toFixed(1)}</div>
          </div>
          <div className="bg-gray-800/50 p-3 rounded-lg">
            <div className="text-sm text-gray-400">Algorithm</div>
            <div className="text-xl font-bold text-white">{metadata.algorithm_version}</div>
          </div>
        </div>
      )}

      {/* Token Grid by Category */}
      <div className="space-y-8">
        {Object.entries(tokensByCategory).map(([category, categoryTokens]) => {
          if (categoryTokens.length === 0) return null;
          
          return (
            <div key={category}>
              {showCategories && category !== 'All Tokens' && (
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                  <span>{category}</span>
                  <span className="text-sm text-gray-400">({categoryTokens.length})</span>
                </h3>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence>
                  {categoryTokens.map((token: DegenDuelToken) => (
                    <TokenCard
                      key={token.contractAddress}
                      token={token}
                      rank={token.trend_rank}
                      showSparkline={showSparklines}
                      onClick={() => handleTokenClick(token)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      {/* Connection status */}
      {!isConnected && (
        <div className="text-center py-4 text-yellow-400 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
          ⚠️ Connection lost - Data may be outdated
        </div>
      )}
    </div>
  );
}; 