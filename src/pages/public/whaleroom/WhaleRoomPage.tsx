/**
 * WhaleRoom Page - Institutional Analytics Dashboard 🐋💎
 * 
 * Exclusive analytics dashboard for top holders with hedge fund-level metrics
 * Features real-time institutional analytics: momentum physics, slippage analysis, 
 * alpha/beta calculations, risk metrics, and market regime detection
 * 
 * NOW WITH SERVER-SIDE VERIFICATION - Unhackable token gating!
 * 
 * @author DegenDuel Team
 * @created 2025-06-03
 * @updated 2025-01-01 - Added server-side whale status verification
 */

import { Activity, AlertTriangle, BarChart3, RefreshCw, Shield, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useMigratedAuth } from '../../../hooks/auth/useMigratedAuth';
import { useWhaleRoomData, WhaleRoomToken } from '../../../hooks/data/useWhaleRoomData';
import { useWhaleStatus } from '../../../hooks/data/useWhaleStatus';
import { formatNumber } from '../../../utils/format';

// Import the wallet profitability hook for enhanced display
import { useWalletProfitability } from '../../../hooks/data/useWalletProfitability';

// Sorting options for the data tables
type SortField = 'symbol' | 'degenduel_score' | 'percentile_rank' | 'alpha' | 'momentum_strength' | 'slippage_100k' | 'sharpe_24h' | 'change_24h';
type SortDirection = 'asc' | 'desc';

interface TableSort {
  field: SortField;
  direction: SortDirection;
}

export const WhaleRoomPage: React.FC = () => {
  const { user } = useMigratedAuth();
  
  // Server-side whale status verification (secure and unhackable)
  const {
    isWhale,
    currentBalance,
    requiredBalance,
    progressPercentage,
    isLoading: whaleStatusLoading,
    error: whaleStatusError,
    forceRefresh: refreshWhaleStatus
  } = useWhaleStatus();

  // Optional: Enhanced display with wallet performance data (doesn't affect access)
  const { performanceData } = useWalletProfitability(user?.wallet_address);
  
  // Fetch whale room data with institutional quality
  const {
    tokens,
    metadata,
    isLoading,
    error,
    lastUpdate,
    refresh,
    getTopPerformers,
    getHighestAlpha,
    getBestLiquidity,
    getMomentumLeaders
  } = useWhaleRoomData({
    limit: 50,
    qualityLevel: 'strict', // Institutional quality only
    refreshInterval: 30000  // 30 second refresh
  });

  // Table sorting state
  const [sort, setSort] = useState<TableSort>({ field: 'degenduel_score', direction: 'desc' });

  // Access control - check for authentication first
  const hasWalletAccess = useMemo(() => {
    return !!user?.wallet_address;
  }, [user]);

  // Sort tokens based on current sort settings
  const sortedTokens = useMemo(() => {
    if (!tokens.length) return [];
    
    return [...tokens].sort((a, b) => {
      let aValue: number, bValue: number;
      
      switch (sort.field) {
        case 'symbol':
          return sort.direction === 'asc' 
            ? a.symbol.localeCompare(b.symbol)
            : b.symbol.localeCompare(a.symbol);
            
        case 'degenduel_score':
          aValue = a.degenduel_score;
          bValue = b.degenduel_score;
          break;
          
        case 'percentile_rank':
          aValue = a.advanced_metrics.relative_strength.percentile_rank;
          bValue = b.advanced_metrics.relative_strength.percentile_rank;
          break;
          
        case 'alpha':
          aValue = a.advanced_metrics.relative_strength.alpha;
          bValue = b.advanced_metrics.relative_strength.alpha;
          break;
          
        case 'momentum_strength':
          aValue = a.advanced_metrics.momentum.strength;
          bValue = b.advanced_metrics.momentum.strength;
          break;
          
        case 'slippage_100k':
          aValue = a.advanced_metrics.liquidity_analysis.slippage_estimates["100k"];
          bValue = b.advanced_metrics.liquidity_analysis.slippage_estimates["100k"];
          break;
          
        case 'sharpe_24h':
          aValue = a.advanced_metrics.risk_adjusted.sharpe_ratio["24h"];
          bValue = b.advanced_metrics.risk_adjusted.sharpe_ratio["24h"];
          break;
          
        case 'change_24h':
          aValue = a.change_24h;
          bValue = b.change_24h;
          break;
          
        default:
          return 0;
      }
      
      return sort.direction === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [tokens, sort]);

  // Handle column header click for sorting
  const handleSort = (field: SortField) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Get sort indicator for column headers
  const getSortIndicator = (field: SortField) => {
    if (sort.field !== field) return '↕️';
    return sort.direction === 'asc' ? '↑' : '↓';
  };

  // Get risk color based on rating
  const getRiskColor = (rating: string) => {
    switch (rating) {
      case 'LOW': return 'text-green-400';
      case 'MEDIUM': return 'text-yellow-400';
      case 'HIGH': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  // Get momentum color based on signal
  const getMomentumColor = (signal: string) => {
    switch (signal) {
      case 'ACCELERATING': return 'text-green-400';
      case 'DECELERATING': return 'text-red-400';
      case 'STEADY': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  // Access denied for non-authenticated users
  if (!hasWalletAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-100 to-dark-300 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-dark-200/50 backdrop-blur-sm border border-dark-300 rounded-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">🐋 Whale Room Access Required</h1>
          <p className="text-gray-400 mb-6">
            This exclusive analytics dashboard is reserved for DegenDuel token holders and active traders.
          </p>
          <p className="text-sm text-gray-500">
            Connect your wallet and meet the whale criteria to access institutional-grade market analytics.
          </p>
        </div>
      </div>
    );
  }

  // Server-side whale status loading state
  if (whaleStatusLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-100 to-dark-300 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-dark-200/50 backdrop-blur-sm border border-dark-300 rounded-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6">
            <div className="w-full h-full border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">🔍 Verifying Whale Status...</h1>
          <p className="text-gray-400">
            Checking your DegenDuel token balance with our secure servers...
          </p>
        </div>
      </div>
    );
  }

  // Server-side whale status error
  if (whaleStatusError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-100 to-dark-300 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-dark-200/50 backdrop-blur-sm border border-dark-300 rounded-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">🐋 Whale Status Error</h1>
          <p className="text-gray-400 mb-6">
            Unable to verify your whale status: {whaleStatusError}
          </p>
          <button
            onClick={refreshWhaleStatus}
            className="w-full bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg px-4 py-2 text-purple-300 hover:text-purple-200 transition-colors flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Verification</span>
          </button>
        </div>
      </div>
    );
  }

  // Access denied for insufficient token balance (server-verified)
  if (!isWhale) {
    const tokensNeeded = requiredBalance - currentBalance;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-100 to-dark-300 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-dark-200/50 backdrop-blur-sm border border-dark-300 rounded-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">🐋 Insufficient Whale Status</h1>
          <div className="text-gray-400 mb-6 space-y-3">
            <p>You need <span className="text-brand-400 font-bold">{requiredBalance.toLocaleString()}</span> DegenDuel tokens to access the Whale Room.</p>
            <div className="bg-dark-300/50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-300">Current Balance:</span>
                <span className="text-yellow-400 font-bold">{currentBalance.toLocaleString()} DUEL</span>
              </div>
              <div className="w-full bg-dark-400 rounded-full h-3 mb-2">
                <div 
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
              <div className="text-xs text-gray-400">
                {progressPercentage.toFixed(2)}% of whale requirement
              </div>
            </div>
            <p>You need <span className="text-red-400 font-bold">{tokensNeeded.toLocaleString()}</span> more tokens.</p>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Acquire more DegenDuel tokens to unlock institutional-grade market analytics.
            </p>
            <button
              onClick={refreshWhaleStatus}
              className="w-full bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg px-4 py-2 text-purple-300 hover:text-purple-200 transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Balance</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 🎉 WHALE ACCESS GRANTED! Show the institutional analytics dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-100 to-dark-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-300 to-indigo-400 bg-clip-text text-transparent">
                  🐋 Whale Room Analytics
                </h1>
                <p className="text-gray-400">Institutional-grade market intelligence for top holders</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                <div>Balance: <span className="text-green-400 font-semibold">{currentBalance.toLocaleString()} DUEL</span></div>
                <div>Status: <span className="text-purple-400 font-semibold">🐋 VERIFIED WHALE</span></div>
                {/* Enhanced display: Portfolio performance (optional enhancement) */}
                {performanceData && (
                  <>
                    <div>Portfolio: <span className="text-blue-400 font-semibold">${performanceData.totalPortfolioValue.toLocaleString()}</span></div>
                    <div>24h P&L: <span className={`font-semibold ${performanceData.pnl24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {performanceData.pnl24h >= 0 ? '+' : ''}${performanceData.pnl24h.toFixed(2)}
                    </span></div>
                  </>
                )}
              </div>
              {lastUpdate && (
                <div className="text-sm text-gray-500">
                  Updated: {lastUpdate.toLocaleTimeString()}
                </div>
              )}
              <button
                onClick={refresh}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg transition-colors text-purple-300 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
          
          {/* Metadata */}
          {metadata && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-dark-200/30 backdrop-blur-sm border border-dark-300 rounded-lg p-3">
                <div className="text-sm text-gray-400">Quality Level</div>
                <div className="text-lg font-semibold text-white capitalize">{metadata.quality_level}</div>
              </div>
              <div className="bg-dark-200/30 backdrop-blur-sm border border-dark-300 rounded-lg p-3">
                <div className="text-sm text-gray-400">Candidates Analyzed</div>
                <div className="text-lg font-semibold text-white">{metadata.total_candidates}</div>
              </div>
              <div className="bg-dark-200/30 backdrop-blur-sm border border-dark-300 rounded-lg p-3">
                <div className="text-sm text-gray-400">Algorithm Version</div>
                <div className="text-lg font-semibold text-white">{metadata.algorithm_version}</div>
              </div>
              <div className="bg-dark-200/30 backdrop-blur-sm border border-dark-300 rounded-lg p-3">
                <div className="text-sm text-gray-400">Tokens Returned</div>
                <div className="text-lg font-semibold text-white">{metadata.actual_returned}</div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && tokens.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 mb-4 mx-auto">
                <div className="w-full h-full border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
              </div>
              <p className="text-gray-400">Loading institutional analytics...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <div className="text-red-400 font-medium">Error loading whale room data</div>
            </div>
            <div className="text-red-300 text-sm mt-1">{error}</div>
          </div>
        )}

        {/* Quick Stats */}
        {!isLoading && tokens.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            
            {/* Top Alpha Generator */}
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="w-5 h-5 text-green-400" />
                <div className="text-sm font-medium text-green-400">Highest Alpha</div>
              </div>
              {(() => {
                const topAlpha = getHighestAlpha(1)[0];
                return topAlpha ? (
                  <div>
                    <div className="text-lg font-bold text-white">{topAlpha.symbol}</div>
                    <div className="text-sm text-green-300">
                      α: {formatNumber(topAlpha.advanced_metrics.relative_strength.alpha)}
                    </div>
                  </div>
                ) : <div className="text-gray-400">No data</div>;
              })()}
            </div>

            {/* Best Liquidity */}
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-600/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="w-5 h-5 text-blue-400" />
                <div className="text-sm font-medium text-blue-400">Best Liquidity</div>
              </div>
              {(() => {
                const bestLiq = getBestLiquidity(1)[0];
                return bestLiq ? (
                  <div>
                    <div className="text-lg font-bold text-white">{bestLiq.symbol}</div>
                    <div className="text-sm text-blue-300">
                      100k: {(bestLiq.advanced_metrics.liquidity_analysis.slippage_estimates["100k"] * 100).toFixed(2)}% slip
                    </div>
                  </div>
                ) : <div className="text-gray-400">No data</div>;
              })()}
            </div>

            {/* Momentum Leader */}
            <div className="bg-gradient-to-br from-purple-500/10 to-violet-600/10 border border-purple-500/20 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <div className="text-sm font-medium text-purple-400">Momentum Leader</div>
              </div>
              {(() => {
                const topMomentum = getMomentumLeaders(1)[0];
                return topMomentum ? (
                  <div>
                    <div className="text-lg font-bold text-white">{topMomentum.symbol}</div>
                    <div className="text-sm text-purple-300">
                      Strength: {topMomentum.advanced_metrics.momentum.strength}/10
                    </div>
                  </div>
                ) : <div className="text-gray-400">No data</div>;
              })()}
            </div>

            {/* Top Performer */}
            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-600/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-5 h-5 text-yellow-400" />
                <div className="text-sm font-medium text-yellow-400">Top Performer</div>
              </div>
              {(() => {
                const topPerformer = getTopPerformers(1)[0];
                return topPerformer ? (
                  <div>
                    <div className="text-lg font-bold text-white">{topPerformer.symbol}</div>
                    <div className="text-sm text-yellow-300">
                      {topPerformer.advanced_metrics.relative_strength.percentile_rank.toFixed(1)}th percentile
                    </div>
                  </div>
                ) : <div className="text-gray-400">No data</div>;
              })()}
            </div>
          </div>
        )}

        {/* Main Data Table */}
        {!isLoading && tokens.length > 0 && (
          <div className="bg-dark-200/30 backdrop-blur-sm border border-dark-300 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-dark-300">
              <h2 className="text-xl font-semibold text-white">Institutional Analytics Table</h2>
              <p className="text-sm text-gray-400 mt-1">Click column headers to sort • All metrics calculated in real-time</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-300/50">
                  <tr>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-dark-300/70 transition-colors"
                      onClick={() => handleSort('symbol')}
                    >
                      Token {getSortIndicator('symbol')}
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-dark-300/70 transition-colors"
                      onClick={() => handleSort('degenduel_score')}
                    >
                      DD Score {getSortIndicator('degenduel_score')}
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-dark-300/70 transition-colors"
                      onClick={() => handleSort('percentile_rank')}
                    >
                      Percentile {getSortIndicator('percentile_rank')}
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-dark-300/70 transition-colors"
                      onClick={() => handleSort('alpha')}
                    >
                      Alpha {getSortIndicator('alpha')}
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-dark-300/70 transition-colors"
                      onClick={() => handleSort('momentum_strength')}
                    >
                      Momentum {getSortIndicator('momentum_strength')}
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-dark-300/70 transition-colors"
                      onClick={() => handleSort('slippage_100k')}
                    >
                      100k Slippage {getSortIndicator('slippage_100k')}
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-dark-300/70 transition-colors"
                      onClick={() => handleSort('sharpe_24h')}
                    >
                      24h Sharpe {getSortIndicator('sharpe_24h')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Risk Level
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Regime
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-400/20">
                  {sortedTokens.map((token: WhaleRoomToken) => (
                    <tr
                      key={token.address}
                      className="hover:bg-dark-300/20 transition-colors"
                    >
                      {/* Token Info */}
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-3">
                          {token.image_url && (
                            <img
                              src={token.image_url}
                              alt={token.symbol}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-white">{token.symbol}</div>
                            <div className="text-xs text-gray-400 truncate max-w-[100px]">{token.name}</div>
                          </div>
                        </div>
                      </td>

                      {/* DegenDuel Score */}
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-brand-400">
                          {formatNumber(token.degenduel_score)}
                        </div>
                        <div className="text-xs text-gray-400">
                          Rank #{token.trend_rank}
                        </div>
                      </td>

                      {/* Percentile Rank */}
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-white">
                          {token.advanced_metrics.relative_strength.percentile_rank.toFixed(1)}%
                        </div>
                        <div className="w-20 bg-dark-400 rounded-full h-2 mt-1">
                          <div
                            className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full"
                            style={{ width: `${token.advanced_metrics.relative_strength.percentile_rank}%` }}
                          />
                        </div>
                      </td>

                      {/* Alpha */}
                      <td className="px-4 py-4">
                        <div className={`text-sm font-medium ${token.advanced_metrics.relative_strength.alpha > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatNumber(token.advanced_metrics.relative_strength.alpha)}
                        </div>
                        <div className="text-xs text-gray-400">
                          β: {token.advanced_metrics.relative_strength.beta.toFixed(2)}
                        </div>
                      </td>

                      {/* Momentum */}
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-white">
                          {token.advanced_metrics.momentum.strength}/10
                        </div>
                        <div className={`text-xs font-medium ${getMomentumColor(token.advanced_metrics.momentum.signal)}`}>
                          {token.advanced_metrics.momentum.signal}
                        </div>
                      </td>

                      {/* Slippage */}
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-white">
                          {(token.advanced_metrics.liquidity_analysis.slippage_estimates["100k"] * 100).toFixed(2)}%
                        </div>
                        <div className="text-xs text-gray-400">
                          {token.advanced_metrics.liquidity_analysis.quality_rating}
                        </div>
                      </td>

                      {/* Sharpe Ratio */}
                      <td className="px-4 py-4">
                        <div className={`text-sm font-medium ${token.advanced_metrics.risk_adjusted.sharpe_ratio["24h"] > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {token.advanced_metrics.risk_adjusted.sharpe_ratio["24h"].toFixed(3)}
                        </div>
                        <div className="text-xs text-gray-400">
                          Sortino: {token.advanced_metrics.risk_adjusted.sortino_ratio["24h"].toFixed(3)}
                        </div>
                      </td>

                      {/* Risk Level */}
                      <td className="px-4 py-4">
                        <div className={`text-sm font-medium ${getRiskColor(token.advanced_metrics.risk_adjusted.risk_rating)}`}>
                          {token.advanced_metrics.risk_adjusted.risk_rating}
                        </div>
                        <div className="text-xs text-gray-400">
                          Score: {token.advanced_metrics.risk_adjusted.quality_score}/10
                        </div>
                      </td>

                      {/* Market Regime */}
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-white">
                          {token.advanced_metrics.regime.current}
                        </div>
                        <div className="text-xs text-gray-400">
                          {(token.advanced_metrics.regime.confidence * 100).toFixed(0)}% confident
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No Data State */}
        {!isLoading && !error && tokens.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">No institutional-grade tokens available</div>
            <button
              onClick={refresh}
              className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg transition-colors text-purple-300"
            >
              Refresh Data
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhaleRoomPage; 