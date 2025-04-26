import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { formatNumber } from "../../../utils/format";
import useTokenData from "../../../hooks/useTokenData";

interface MarketStats {
  totalVolume24h: number;
  totalTokens: number;
  topGainer: {
    symbol: string;
    change: number;
  };
  topLoser: {
    symbol: string;
    change: number;
  };
  totalMarketCap: number;
}

interface MarketStatsPanelProps {
  initialLoading?: boolean;
}

export const MarketStatsPanel: React.FC<MarketStatsPanelProps> = ({
  initialLoading = false
}) => {
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);
  
  // Use WebSocket-based token data hook
  const { tokens, isConnected } = useTokenData("all");
  
  // Calculate market stats from WebSocket token data
  useEffect(() => {
    try {
      if (tokens && tokens.length > 0) {
        setLoading(false);
        
        // Calculate market stats from tokens data
        let totalVolume24h = 0;
        let totalMarketCap = 0;
        let topGainer = { symbol: "", change: -Infinity };
        let topLoser = { symbol: "", change: Infinity };
        
        tokens.forEach((token: any) => {
          // Calculate totals
          totalVolume24h += Number(token.volume24h || 0);
          totalMarketCap += Number(token.marketCap || 0);
          
          // Find top gainer
          const change = Number(token.change24h || 0);
          if (change > topGainer.change) {
            topGainer = { symbol: token.symbol, change };
          }
          
          // Find top loser
          if (change < topLoser.change) {
            topLoser = { symbol: token.symbol, change };
          }
        });
        
        // Set the calculated stats
        setStats({
          totalVolume24h,
          totalTokens: tokens.length,
          topGainer,
          topLoser,
          totalMarketCap
        });
      }
    } catch (err) {
      console.error("Failed to calculate market stats:", err);
      setError("Failed to calculate market statistics");
      setLoading(false);
    }
  }, [tokens]);
  
  // Loading state
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
  
  // Error state
  if (error || !stats) {
    return (
      <div className="bg-dark-200/70 backdrop-blur-sm rounded-xl p-4 border border-dark-300/60 shadow-lg">
        <div className="text-red-400 text-center py-4">
          {error || "Unable to load market statistics"}
        </div>
      </div>
    );
  }
  
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
  
  // Container variants for staggered animation
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
      {/* Corner cuts for cyberpunk aesthetic */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-brand-500/50 -translate-x-0.5 -translate-y-0.5 z-10"></div>
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-cyan-500/50 translate-x-0.5 -translate-y-0.5 z-10"></div>
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-brand-500/50 -translate-x-0.5 translate-y-0.5 z-10"></div>
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-cyan-500/50 translate-x-0.5 translate-y-0.5 z-10"></div>
      
      {/* Circuit board aesthetic elements */}
      <div className="absolute top-6 right-0 w-16 h-px bg-gradient-to-l from-cyan-500/30 to-transparent"></div>
      <div className="absolute bottom-6 left-0 w-16 h-px bg-gradient-to-r from-brand-500/30 to-transparent"></div>
      
      {/* Panel header */}
      <div className="mb-4 flex items-center">
        <h3 className="text-lg font-bold text-white">Market Overview</h3>
        <div className="ml-2 px-2 py-0.5 bg-dark-300/70 rounded-full flex items-center">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1.5"></span>
          <span className="text-xs text-gray-300">Live</span>
        </div>
        <div className="ml-auto text-xs text-gray-400 font-mono">24h Data</div>
      </div>
      
      {/* Stats Grid */}
      <motion.div 
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
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
            <div className="text-base sm:text-lg font-mono text-white mr-2">{stats.topGainer.symbol}</div>
            <div className="text-xs px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400">
              +{formatNumber(stats.topGainer.change)}%
            </div>
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
            <div className="text-base sm:text-lg font-mono text-white mr-2">{stats.topLoser.symbol}</div>
            <div className="text-xs px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">
              {formatNumber(stats.topLoser.change)}%
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};