// src/components/landing/market-stats/StandardizedMarketStatsPanel.tsx

/**
 * Standardized Market Stats Panel
 * 
 * Displays market overview statistics using the standardized DataContainer
 * and useStandardizedTokenData hook
 * 
 * @author Claude
 * @created 2025-04-29
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { formatNumber } from '../../../utils/format';
import { DataContainer } from '../../shared/DataContainer';
import { useStandardizedTokenData } from '../../../hooks/useStandardizedTokenData';

interface MarketStatsPanelProps {
  initialLoading?: boolean;
}

export const StandardizedMarketStatsPanel: React.FC<MarketStatsPanelProps> = ({
  initialLoading = false
}) => {
  // Use the standardized token data hook
  const {
    stats,
    isLoading,
    error,
    isConnected,
    connectionState,
    refresh,
    lastUpdate
  } = useStandardizedTokenData('all');
  
  // Debug information for the debug panel
  const debugInfo = useMemo(() => ({
    connectionStatus: connectionState || 'unknown',
    isConnected,
    lastUpdate: lastUpdate?.toISOString() || 'never',
    totalTokens: stats.totalTokens,
    topGainer: stats.topGainer?.symbol,
    topLoser: stats.topLoser?.symbol,
  }), [connectionState, isConnected, lastUpdate, stats]);
  
  // Animation variants for the items
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    }
  };

  // Header right content with refresh button
  const headerRight = (
    <div className="flex items-center space-x-3">
      <div className="text-xs text-gray-400 font-mono">24h Data</div>
      
      {/* Refresh button */}
      <button 
        onClick={refresh}
        className="w-6 h-6 rounded-md flex items-center justify-center bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
        title="Refresh data"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );

  return (
    <DataContainer
      title="Market Overview"
      titleColor="bg-gradient-to-r from-brand-400 via-purple-400 to-brand-500"
      isLoading={isLoading || initialLoading}
      error={error}
      debugInfo={debugInfo}
      onRetry={refresh}
      isLive={isConnected}
      headerRight={headerRight}
      variant="market"
    >
      {/* Stats Grid */}
      <motion.div 
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
      >
        {/* Total Volume */}
        <motion.div
          className="relative bg-dark-300/40 rounded-lg p-3 border border-dark-400/30 group hover:border-brand-500/30 transition-all duration-300"
          variants={itemVariants}
        >
          <div className="absolute -top-1 -right-1 w-2 h-2 border-t border-r border-brand-500/40 group-hover:border-brand-500/60 transition-colors duration-300"></div>
          
          <div className="text-xs text-gray-400 mb-1">Total Volume</div>
          <div className="text-lg font-mono text-white">${formatNumber(stats.totalVolume24h)}</div>
        </motion.div>
        
        {/* Market Cap */}
        <motion.div
          className="relative bg-dark-300/40 rounded-lg p-3 border border-dark-400/30 group hover:border-brand-500/30 transition-all duration-300"
          variants={itemVariants}
        >
          <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-cyan-500/40 group-hover:border-cyan-500/60 transition-colors duration-300"></div>
          
          <div className="text-xs text-gray-400 mb-1">Market Cap</div>
          <div className="text-lg font-mono text-white">${formatNumber(stats.totalMarketCap)}</div>
        </motion.div>
        
        {/* Top Gainer */}
        <motion.div
          className="relative bg-dark-300/40 rounded-lg p-3 border border-dark-400/30 group hover:border-green-500/30 transition-all duration-300"
          variants={itemVariants}
        >
          <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b border-l border-green-500/40 group-hover:border-green-500/60 transition-colors duration-300"></div>
          
          <div className="text-xs text-gray-400 mb-1">Top Gainer</div>
          <div className="flex items-center">
            <div className="text-base sm:text-lg font-mono text-white mr-2">
              {stats.topGainer?.symbol || "N/A"}
            </div>
            {stats.topGainer && (
              <div className="text-xs px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400">
                +{formatNumber(stats.topGainer.change)}%
              </div>
            )}
          </div>
        </motion.div>
        
        {/* Top Loser */}
        <motion.div
          className="relative bg-dark-300/40 rounded-lg p-3 border border-dark-400/30 group hover:border-red-500/30 transition-all duration-300"
          variants={itemVariants}
        >
          <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-red-500/40 group-hover:border-red-500/60 transition-colors duration-300"></div>
          
          <div className="text-xs text-gray-400 mb-1">Top Loser</div>
          <div className="flex items-center">
            <div className="text-base sm:text-lg font-mono text-white mr-2">
              {stats.topLoser?.symbol || "N/A"}
            </div>
            {stats.topLoser && (
              <div className="text-xs px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">
                {formatNumber(stats.topLoser.change)}%
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </DataContainer>
  );
};

export default StandardizedMarketStatsPanel;