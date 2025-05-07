import { motion } from "framer-motion";
import React, { useCallback, useEffect, useState } from "react";
import { useStandardizedTokenData, type TokenStatistics } from "../../../hooks/data/useStandardizedTokenData";
import { formatNumber } from "../../../utils/format";

interface MarketStatsPanelProps {
  initialLoading?: boolean;
}

export const MarketStatsPanel: React.FC<MarketStatsPanelProps> = ({
  initialLoading = false
}) => {
  const {
    stats: standardizedStats,
    tokens,
    isLoading: standardizedLoading,
    error: standardizedError,
    isConnected,
    connectionState,
    refresh
  } = useStandardizedTokenData("all");

  const [stats, setStats] = useState<TokenStatistics | null>(null);
  const [loading, setLoading] = useState(initialLoading || standardizedLoading);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<{
    connectionStatus: string;
    lastError: string | null;
    tokenCount: number;
    lastAttempt: string;
  }>({
    connectionStatus: 'initializing',
    lastError: null,
    tokenCount: 0,
    lastAttempt: new Date().toISOString()
  });
  
  useEffect(() => {
    setDebugInfo(prev => ({
      ...prev,
      connectionStatus: connectionState || 'unknown',
      lastError: standardizedError || null,
      tokenCount: (tokens || []).length,
      lastAttempt: new Date().toISOString()
    }));
    
    console.log("[MarketStatsPanel] Hook state update:", {
      connectionState,
      isConnected,
      errorMsg: standardizedError,
      tokensAvailable: (tokens || []).length
    });
    
    if (isConnected && (!standardizedStats || standardizedStats.totalTokens === 0)) {
      console.log("[MarketStatsPanel] Connected but no stats/tokens, requesting refresh");
      refresh?.();
    }
  }, [isConnected, connectionState, standardizedError, tokens, standardizedStats, refresh]);
  
  useEffect(() => {
    setLoading(standardizedLoading);
    setError(standardizedError);
    if (standardizedStats) {
      setStats(standardizedStats);
    } else if (isConnected && !standardizedLoading) {
      setStats(null); 
    }
  }, [standardizedStats, standardizedLoading, standardizedError, isConnected]);

  const retryFetch = useCallback(() => {
    console.log("[MarketStatsPanel] Manually retrying token fetch...");
    setLoading(true);
    setError(null);
    
    if (refresh) {
      refresh();
    }
    
    setDebugInfo(prev => ({
      ...prev,
      lastAttempt: new Date().toISOString()
    }));
  }, [refresh]);
  
  if (loading) {
    return (
      <div className="bg-dark-200/70 backdrop-blur-sm rounded-xl p-4 border border-dark-300/60 shadow-lg">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-dark-300/50 rounded w-1/2 mb-4"></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-dark-300/30 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !stats) {
    return (
      <div className="bg-dark-200/70 backdrop-blur-sm rounded-xl p-4 border border-dark-300/60 shadow-lg">
        <div className="text-center py-4">
          <div className="text-red-400 mb-2">
            {error || "Unable to load market statistics"}
          </div>
          
          <details className="mt-3 text-left bg-dark-300/50 p-3 rounded-lg border border-gray-700/50 text-xs">
            <summary className="text-gray-400 cursor-pointer">Debug Information</summary>
            <div className="mt-2 text-gray-300 space-y-1 font-mono pl-2">
              <div>Connection Status: <span className="text-blue-400">{debugInfo.connectionStatus}</span></div>
              <div>WebSocket Connected: <span className={isConnected ? "text-green-400" : "text-red-400"}>{isConnected ? "Yes" : "No"}</span></div>
              <div>Tokens Available: <span className="text-blue-400">{debugInfo.tokenCount}</span></div>
              <div>Last Error: <span className="text-red-400">{debugInfo.lastError || "None"}</span></div>
              <div>Last Attempt: <span className="text-blue-400">{debugInfo.lastAttempt}</span></div>
            </div>
          </details>
          
          <button 
            onClick={retryFetch}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-brand-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
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
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  return (
    <div className="bg-dark-200/70 backdrop-blur-sm rounded-xl p-4 border border-dark-300/60 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-brand-500/50 -translate-x-0.5 -translate-y-0.5 z-10"></div>
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-cyan-500/50 translate-x-0.5 -translate-y-0.5 z-10"></div>
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-brand-500/50 -translate-x-0.5 translate-y-0.5 z-10"></div>
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-cyan-500/50 translate-x-0.5 translate-y-0.5 z-10"></div>
      
      <div className="absolute top-6 right-0 w-16 h-px bg-gradient-to-l from-cyan-500/30 to-transparent"></div>
      <div className="absolute bottom-6 left-0 w-16 h-px bg-gradient-to-r from-brand-500/30 to-transparent"></div>
      
      <div className="mb-4 flex items-center">
        <h3 className="text-lg font-bold text-white">Market Overview</h3>
        <div className="ml-2 px-2 py-0.5 bg-dark-300/70 rounded-full flex items-center">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1.5"></span>
          <span className="text-xs text-gray-300">Live</span>
        </div>
        <div className="ml-auto flex items-center space-x-3">
          <div className="text-xs text-gray-400 font-mono">24h Data</div>
          
          <button 
            onClick={retryFetch}
            className="w-6 h-6 rounded-md flex items-center justify-center bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
            title="Refresh data"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      <motion.div 
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="relative bg-dark-300/40 rounded-lg p-3 border border-dark-400/30 group hover:border-brand-500/30 transition-all duration-300"
          variants={itemVariants}
        >
          <div className="absolute -top-1 -right-1 w-2 h-2 border-t border-r border-brand-500/40 group-hover:border-brand-500/60 transition-colors duration-300"></div>
          
          <div className="text-xs text-gray-400 mb-1">Total Volume</div>
          <div className="text-lg font-mono text-white">${stats.formatted?.totalVolume24h || formatNumber(stats.totalVolume24h)}</div>
        </motion.div>
        
        <motion.div
          className="relative bg-dark-300/40 rounded-lg p-3 border border-dark-400/30 group hover:border-brand-500/30 transition-all duration-300"
          variants={itemVariants}
        >
          <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-cyan-500/40 group-hover:border-cyan-500/60 transition-colors duration-300"></div>
          
          <div className="text-xs text-gray-400 mb-1">Market Cap</div>
          <div className="text-lg font-mono text-white">${stats.formatted?.totalMarketCap || formatNumber(stats.totalMarketCap)}</div>
        </motion.div>
        
        <motion.div
          className="relative bg-dark-300/40 rounded-lg p-3 border border-dark-400/30 group hover:border-green-500/30 transition-all duration-300"
          variants={itemVariants}
        >
          <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b border-l border-green-500/40 group-hover:border-green-500/60 transition-colors duration-300"></div>
          
          <div className="text-xs text-gray-400 mb-1">Top Gainer</div>
          {stats.topGainer ? (() => {
            const gainer = stats.topGainer; // Guarantees gainer is not null here
            return (
              <div className="flex items-center">
                <div className="text-base sm:text-lg font-mono text-white mr-2">{gainer.symbol}</div>
                <div className="text-xs px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400">
                  +{stats.formatted?.topGainerChange ?? formatNumber(gainer.change)}%
                </div>
              </div>
            );
          })() : <div className="text-sm text-gray-500">N/A</div>}
        </motion.div>
        
        {/* Top Loser */}
        <motion.div
          className="relative bg-dark-300/40 rounded-lg p-3 border border-dark-400/30 group hover:border-red-500/30 transition-all duration-300"
          variants={itemVariants}
        >
          <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-red-500/40 group-hover:border-red-500/60 transition-colors duration-300"></div>
          
          <div className="text-xs text-gray-400 mb-1">Top Loser</div>
          {stats.topLoser ? (() => {
            const loser = stats.topLoser; // Guarantees loser is not null here
            return (
              <div className="flex items-center">
                <div className="text-base sm:text-lg font-mono text-white mr-2">{loser.symbol}</div>
                <div className="text-xs px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">
                  {stats.formatted?.topLoserChange ?? formatNumber(loser.change)}%
                </div>
              </div>
            );
          })() : <div className="text-sm text-gray-500">N/A</div>}
        </motion.div>
      </motion.div>
    </div>
  );
};