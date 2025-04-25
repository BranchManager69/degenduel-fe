// src/components/layout/UnifiedTicker.tsx

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useTokenData } from "../../hooks/useTokenData";
import { useStore } from "../../store/useStore";
import type { Contest, TokenData } from "../../types";

// Simplified interface
interface UnifiedTickerProps {
  contests: Contest[];
  loading: boolean;
  isCompact?: boolean;
  maxTokens?: number;
}

export const UnifiedTicker: React.FC<UnifiedTickerProps> = ({
  contests,
  loading,
  isCompact = false,
  maxTokens = 8,
}) => {
  const { maintenanceMode } = useStore();
  const { tokens, isConnected, error, _refresh } = useTokenData("all");
  const [activeTab, setActiveTab] = useState<"all" | "contests" | "tokens">("all");
  const [selectedTokens, setSelectedTokens] = useState<TokenData[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  
  // Sort contests once for better performance
  const sortedContests = contests.length ? 
    [...contests].sort((a, b) => {
      const statusOrder = { active: 0, pending: 1, completed: 2, cancelled: 3 };
      return statusOrder[a.status] - statusOrder[b.status];
    }) : [];

  // Process tokens when they change
  useEffect(() => {
    if (!tokens || tokens.length === 0) return;
    
    // Sort by absolute change percentage (highest first)
    const sorted = [...tokens].sort((a, b) => 
      Math.abs(parseFloat(b.change24h || '0')) - Math.abs(parseFloat(a.change24h || '0'))
    );
    
    // Take top N tokens based on maxTokens parameter
    setSelectedTokens(sorted.slice(0, maxTokens));
  }, [tokens, maxTokens]);
  
  // Fetch data when component mounts or connection status changes
  useEffect(() => {
    if (_refresh) {
      _refresh();
      
      // Set up interval for periodic refresh
      const intervalId = setInterval(() => {
        if (_refresh) _refresh();
      }, 30000);
      
      return () => clearInterval(intervalId);
    }
  }, [_refresh]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Manual refresh handler
  const handleRefresh = () => {
    setIsRefreshing(true);
    if (_refresh) _refresh();
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  // Render maintenance mode
  if (maintenanceMode) {
    return (
      <div className="bg-dark-200/60 backdrop-blur-sm border-y border-yellow-400/20 overflow-hidden relative w-full">
        <div className={`flex items-center space-x-4 px-4 py-1 text-sm ${isCompact ? 'h-6' : 'h-8'}`}>
          <span className="text-yellow-400 font-mono font-bold">⚠ DUELS PAUSED</span>
          <span className="text-yellow-400/75 font-mono">MAINTENANCE IN PROGRESS</span>
          <span className="text-yellow-400/50 font-mono">PLEASE DEGEN ELSEWHERE</span>
        </div>
      </div>
    );
  }

  // Render loading state
  if (loading) {
    return (
      <div className="bg-dark-200/60 backdrop-blur-sm border-y border-dark-300">
        <div className={`animate-pulse bg-dark-300/50 ${isCompact ? 'h-6' : 'h-8'}`} />
      </div>
    );
  }

  // Render connection error
  if (error) {
    return (
      <div className="bg-dark-200/60 backdrop-blur-sm border-y border-dark-300 relative w-full">
        <div className={`flex items-center justify-center space-x-3 ${isCompact ? 'h-6' : 'h-8'}`}>
          <span className="font-mono text-red-400">
            <span className="animate-ping inline-block h-2 w-2 rounded-full bg-red-500 opacity-75 mr-2"></span>
            CONNECTION ERROR
          </span>
          <button 
            onClick={handleRefresh}
            className="bg-red-900/30 hover:bg-red-800/30 border border-red-500/20 rounded text-[10px] px-1.5 py-0.5 flex items-center justify-center text-red-300"
          >
            <span className={isRefreshing ? 'hidden' : 'inline-block mr-0.5'}>↻</span>
            <span className={isRefreshing ? 'inline-block mr-0.5 animate-spin' : 'hidden'}>◌</span>
            RETRY
          </button>
        </div>
      </div>
    );
  }

  // Render empty state
  if (sortedContests.length === 0 && selectedTokens.length === 0) {
    return (
      <div className="bg-dark-200/60 backdrop-blur-sm border-y border-dark-300 relative w-full">
        <div className={`flex items-center justify-center space-x-3 ${isCompact ? 'h-6' : 'h-8'}`}>
          <span className="text-gray-400">No featured duels or price movements</span>
          <button 
            onClick={handleRefresh}
            className="bg-dark-400/30 hover:bg-dark-400/40 border border-brand-500/20 rounded text-[10px] px-1.5 py-0.5 flex items-center text-brand-300"
          >
            <span className={isRefreshing ? 'hidden' : 'inline-block mr-0.5'}>↻</span>
            <span className={isRefreshing ? 'inline-block mr-0.5 animate-spin' : 'hidden'}>◌</span>
            REFRESH
          </button>
        </div>
      </div>
    );
  }

  // CSS-based animation for desktop, scrollable for mobile
  const containerClasses = `
    ticker-container
    relative w-full overflow-hidden
    bg-dark-200/60 backdrop-blur-sm border-y border-dark-300
    ${isCompact ? 'h-6' : 'h-8'}
  `;

  const contentClasses = `
    flex items-center space-x-6 px-4
    ${isCompact ? 'text-[10px]' : 'text-xs'}
    ${isMobile ? 'overflow-x-auto whitespace-nowrap hide-scrollbar' : 'ticker-animation'}
  `;

  return (
    <div className={containerClasses}>
      {/* Background glow effect based on active tab */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute inset-0 bg-gradient-to-r ${
          activeTab === "tokens" 
            ? "from-cyber-900/20 to-cyber-800/10" 
            : activeTab === "contests"
              ? "from-brand-900/20 to-brand-800/10"
              : "from-dark-800/20 to-dark-700/10"
        } opacity-50`} />
        
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />
      </div>
      
      {/* Tab selector (only shown when both contest and token data exist) */}
      {sortedContests.length > 0 && selectedTokens.length > 0 && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex space-x-0.5">
          {["all", "contests", "tokens"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-1.5 py-0.5 text-[10px] font-medium rounded-sm transition-all ${
                activeTab === tab
                  ? tab === "tokens" 
                    ? "bg-cyber-400/20 text-cyber-400 shadow-sm" 
                    : tab === "contests"
                      ? "bg-brand-400/20 text-brand-400 shadow-sm"
                      : "bg-gradient-to-r from-brand-400/20 to-cyber-400/20 text-gray-200"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              {tab === "all" ? "ALL" : tab === "contests" ? "DUELS" : "PRICES"}
            </button>
          ))}
        </div>
      )}
      
      {/* Content container with CSS animation */}
      <div className={contentClasses}>
        {/* Contest items */}
        {(activeTab === "all" || activeTab === "contests") && sortedContests.map((contest) => (
          <ContestItem key={contest.id} contest={contest} />
        ))}
        
        {/* Divider (only in "all" view when both types present) */}
        {activeTab === "all" && sortedContests.length > 0 && selectedTokens.length > 0 && (
          <div className="inline-flex items-center gap-2">
            <span className="h-4 w-0.5 bg-gradient-to-b from-brand-400/50 to-cyber-400/50 rounded-full" />
            <span className="text-xs font-mono text-gray-500">MARKET</span>
            <span className="h-4 w-0.5 bg-gradient-to-b from-cyber-400/50 to-brand-400/50 rounded-full" />
          </div>
        )}
        
        {/* Token items */}
        {(activeTab === "all" || activeTab === "tokens") && selectedTokens.map((token) => (
          <TokenItem key={token.symbol} token={token} />
        ))}
      </div>
      
      {/* Mobile indicator */}
      {isMobile && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-dark-300/70 backdrop-blur-sm text-[10px] text-gray-400 px-1.5 py-0.5 rounded-sm z-10 pointer-events-none">
          Swipe ↔
        </div>
      )}
      
      {/* CSS for animation and scrollbar hiding */}
      <style>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-50% - 1.5rem)); }
        }
        
        .ticker-animation {
          white-space: nowrap;
          animation: ticker 30s linear infinite;
        }
        
        .ticker-animation:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

// Separate components for better organization and performance
const ContestItem = ({ contest }: { contest: Contest }) => {
  return (
    <Link
      to={`/contests/${contest.id}`}
      className={`group relative inline-flex items-center space-x-2 hover:bg-dark-300/50 px-2 py-1 rounded transition-all ${
        contest.status === "cancelled" ? "line-through opacity-60" : ""
      }`}
      title={contest.description}
    >
      {/* Status indicator */}
      {contest.status === "active" ? (
        <span className="inline-flex items-center text-green-400 group-hover:text-green-300 space-x-1 transition-colors">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="font-bold">LIVE</span>
        </span>
      ) : contest.status === "pending" ? (
        <span className="inline-flex items-center text-cyan-400 group-hover:text-cyan-300 space-x-1 transition-colors">
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500 animate-pulse" />
          </span>
          <span className="font-bold">OPEN</span>
        </span>
      ) : contest.status === "completed" ? (
        <span className="text-green-400/50 group-hover:text-green-300 font-medium">ENDED</span>
      ) : (
        <span className="text-red-400/50 group-hover:text-red-300 font-medium">CANCELLED</span>
      )}

      {/* Contest name */}
      <span className="font-medium text-gray-300 group-hover:text-gray-200 transition-colors">
        {contest.name}
      </span>

      {/* Entry fee */}
      <span className="bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent font-medium">
        {Number(contest.entry_fee)} SOL
      </span>

      {/* Progress indicator */}
      <div className="flex flex-col items-center gap-0.5 ml-1">
        <div className="text-[10px] text-gray-400 group-hover:text-gray-300">
          {contest.participant_count}/{contest.max_participants}
        </div>
        <div className="relative h-1 w-16 bg-dark-300/50 rounded-full overflow-hidden">
          <div
            className={`absolute left-0 top-0 bottom-0 rounded-full bg-gradient-to-r from-brand-400 to-purple-400`}
            style={{
              width: `${(contest.participant_count / contest.max_participants) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Time information */}
      <span className="text-gray-500 group-hover:text-gray-400">
        {contest.status === "active" && contest.end_time && (
          <>Ends {formatDistanceToNow(new Date(contest.end_time), { addSuffix: true })}</>
        )}
        {contest.status === "pending" && contest.start_time && (
          <>Starts {
            new Date(contest.start_time) < new Date()
              ? "soon"
              : formatDistanceToNow(new Date(contest.start_time), { addSuffix: true })
          }</>
        )}
        {contest.status === "completed" && contest.end_time && (
          <>Ended {formatDistanceToNow(new Date(contest.end_time), { addSuffix: true })}</>
        )}
        {contest.status === "cancelled" && (
          <>Cancelled {formatDistanceToNow(new Date(contest.cancelled_at || contest.end_time), { addSuffix: true })}</>
        )}
      </span>
    </Link>
  );
};

// Token item component
const TokenItem = ({ token }: { token: TokenData }) => {
  const priceChange = parseFloat(token.change24h);
  const isPositive = priceChange > 0;
  const absChange = Math.abs(priceChange);
  const isSignificant = absChange > 5;
  
  return (
    <Link
      to={`/tokens?symbol=${token.symbol}`}
      className="group relative inline-flex items-center space-x-2 hover:bg-dark-300/50 px-2 py-1 rounded transition-all"
      title={`${token.name} (${token.symbol})`}
    >
      {/* Token symbol */}
      <span className="font-mono text-cyan-400 group-hover:text-cyan-300 font-medium">
        {token.symbol}
      </span>
      
      {/* Price */}
      <span className="font-medium text-gray-300 group-hover:text-gray-200">
        ${parseFloat(token.price).toFixed(4)}
      </span>
      
      {/* Change percentage */}
      <span className={`flex items-center space-x-1 ${
        isPositive ? 'text-green-400 group-hover:text-green-300' : 'text-red-400 group-hover:text-red-300'
      }`}>
        <span className="font-bold">{isPositive ? '▲' : '▼'}</span>
        <span className={isSignificant ? 'animate-pulse font-bold' : ''}>
          {absChange.toFixed(2)}%
        </span>
      </span>
      
      {/* Volume indicator (only for high volume) */}
      {parseFloat(token.volume24h) > 1000000 && (
        <div className="px-1.5 py-0.5 bg-dark-300/70 rounded-sm text-[10px] font-mono text-gray-400">
          V:${(parseFloat(token.volume24h) / 1000000).toFixed(1)}M
        </div>
      )}
    </Link>
  );
};

export default UnifiedTicker;