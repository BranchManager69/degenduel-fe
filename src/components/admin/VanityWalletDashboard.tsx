import {
    Activity,
    BarChart3,
    Clock,
    Cpu,
    Database,
    HardDrive,
    MemoryStick,
    RefreshCw,
    TrendingUp,
    Users,
    Wallet
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useVanityDashboard } from "../../hooks/websocket/topic-hooks/useVanityDashboard";
import { admin } from "../../services/api/admin";

// Enhanced interfaces for comprehensive analytics
interface PoolStats {
  total: number;
  available: number;
  assigned: number;
  used: number;
  unused: number;
  byStatus: Record<string, number>;
  recentCompletions: Array<{
    id: number;
    pattern: string;
    wallet_address: string;
    completed_at: string;
    duration_ms: number;
    attempts: number;
  }>;
}

interface PerformanceMetrics {
  avgAttemptsPerSecond: number;
  avgCompletionTimeMs: number;
  successRate: number;
  totalJobsAnalyzed: number;
  byPatternLength: Array<{
    length: number;
    count: number;
    avgDurationMs: number;
    avgAttempts: number;
    successRate: number;
  }>;
}

interface PatternAnalytics {
  popularPatterns: Array<{
    pattern: string;
    count: number;
    successful: number;
    successRate: number;
    avgDurationMs: number;
    avgAttempts: number;
  }>;
  lengthDistribution: Array<{
    length: number;
    count: number;
    avgDurationMs: number;
    avgAttempts: number;
  }>;
}

export const VanityWalletDashboard: React.FC = () => {
  const {
    dashboardData,
    isLoading: wsLoading,
    isConnected,
    error: wsError,
    requestDashboardData
  } = useVanityDashboard();

  // Enhanced state for REST API data
  const [poolStats, setPoolStats] = useState<PoolStats | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [patternAnalytics, setPatternAnalytics] = useState<PatternAnalytics | null>(null);
  // Removed unused walletList state
  const [isLoadingEnhanced, setIsLoadingEnhanced] = useState(true);
  const [enhancedError, setEnhancedError] = useState<string | null>(null);
  const [lastApiUpdate, setLastApiUpdate] = useState<Date | null>(null);

  // Fetch comprehensive analytics from REST API (memoized to prevent hooks issues)
  const fetchEnhancedData = useCallback(async () => {
    try {
      setIsLoadingEnhanced(true);
      setEnhancedError(null);

      // Try to get comprehensive dashboard first, fallback to individual endpoints
      const [_dashboardResponse, poolResponse, walletsResponse] = await Promise.allSettled([
        admin.vanityWallets.getDashboard(),
        admin.vanityWallets.pool.getStats(),
        admin.vanityWallets.list({ limit: 50 }) // Get recent wallets for analysis
      ]);

      // Handle pool stats
      if (poolResponse.status === 'fulfilled') {
        setPoolStats(poolResponse.value);
      }

      // Handle wallets list and calculate metrics
      if (walletsResponse.status === 'fulfilled') {
        const wallets = walletsResponse.value.wallets;

        // Calculate enhanced metrics from wallet data
        const completedWallets = wallets.filter(w => w.status === 'completed' && w.attempts_per_second);
        
        if (completedWallets.length > 0) {
          const avgAttemptsPerSecond = completedWallets.reduce((sum, w) => sum + (w.attempts_per_second || 0), 0) / completedWallets.length;
          const avgCompletionTimeMs = completedWallets.reduce((sum, w) => sum + (w.duration_ms || 0), 0) / completedWallets.length;
          const successRate = (completedWallets.length / wallets.length) * 100;

          // Group by pattern length
          const byPatternLength = completedWallets.reduce((acc, wallet) => {
            const length = wallet.pattern?.length || 0;
            if (!acc[length]) {
              acc[length] = { wallets: [], totalDuration: 0, totalAttempts: 0 };
            }
            acc[length].wallets.push(wallet);
            acc[length].totalDuration += wallet.duration_ms || 0;
            acc[length].totalAttempts += wallet.attempts || 0;
            return acc;
          }, {} as Record<number, any>);

          const patternLengthStats = Object.entries(byPatternLength).map(([length, data]) => ({
            length: parseInt(length),
            count: data.wallets.length,
            avgDurationMs: data.totalDuration / data.wallets.length,
            avgAttempts: data.totalAttempts / data.wallets.length,
            successRate: 100 // All completed wallets are successful
          }));

          setPerformanceMetrics({
            avgAttemptsPerSecond,
            avgCompletionTimeMs,
            successRate,
            totalJobsAnalyzed: completedWallets.length,
            byPatternLength: patternLengthStats
          });

          // Calculate pattern analytics
          const patternGroups = completedWallets.reduce((acc, wallet) => {
            const pattern = wallet.pattern || 'Unknown';
            if (!acc[pattern]) {
              acc[pattern] = { wallets: [], totalDuration: 0, totalAttempts: 0 };
            }
            acc[pattern].wallets.push(wallet);
            acc[pattern].totalDuration += wallet.duration_ms || 0;
            acc[pattern].totalAttempts += wallet.attempts || 0;
            return acc;
          }, {} as Record<string, any>);

          const popularPatterns = Object.entries(patternGroups)
            .map(([pattern, data]) => ({
              pattern,
              count: data.wallets.length,
              successful: data.wallets.length,
              successRate: 100,
              avgDurationMs: data.totalDuration / data.wallets.length,
              avgAttempts: data.totalAttempts / data.wallets.length
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

          const lengthDistribution = patternLengthStats.sort((a, b) => a.length - b.length);

          setPatternAnalytics({
            popularPatterns,
            lengthDistribution
          });
        }
      }

      setLastApiUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch enhanced vanity wallet data:', error);
      setEnhancedError(error instanceof Error ? error.message : 'Failed to load enhanced data');
    } finally {
      setIsLoadingEnhanced(false);
    }
  }, []); // Empty dependency array since this function doesn't depend on any changing values

  // Load enhanced data on mount and set up refresh interval
  useEffect(() => {
    fetchEnhancedData();
    
    // Refresh enhanced data every 30 seconds
    const interval = setInterval(fetchEnhancedData, 30000);
    return () => clearInterval(interval);
  }, [fetchEnhancedData]); // Now properly includes the memoized function

  // Request WebSocket data when connected
  useEffect(() => {
    if (isConnected) {
      requestDashboardData();
    }
  }, [isConnected, requestDashboardData]);

  // Function to format the timestamp
  const formatTimestamp = (timestamp: string | undefined) => {
    if (!timestamp) return "Never";
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return timestamp;
    }
  };

  // Format duration in a human readable way
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  };

  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (wsLoading && isLoadingEnhanced) {
    return (
      <div className="bg-dark-300/30 rounded-lg border border-dark-300 p-4 flex justify-center items-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-400 border-t-transparent" />
        <span className="ml-2 text-gray-400">Loading comprehensive analytics...</span>
      </div>
    );
  }

  if (wsError && enhancedError) {
    return (
      <div className="bg-dark-300/30 rounded-lg border border-dark-300 p-4">
        <p className="text-red-400">Error loading dashboard data</p>
        <p className="text-sm text-gray-400 mt-1">WebSocket: {wsError}</p>
        <p className="text-sm text-gray-400">API: {enhancedError}</p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={requestDashboardData}
            className="px-3 py-1 bg-dark-400 hover:bg-dark-500 text-gray-200 text-sm rounded transition-colors"
          >
            Retry WebSocket
          </button>
          <button
            onClick={fetchEnhancedData}
            className="px-3 py-1 bg-dark-400 hover:bg-dark-500 text-gray-200 text-sm rounded transition-colors"
          >
            Retry API
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-dark-300/30 rounded-lg border border-dark-300 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-100 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Vanity Wallet Dashboard
            </h3>
            <p className="text-sm text-gray-400 mt-1">Real-time monitoring and comprehensive analytics</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-xs text-gray-400 space-y-1">
              <div>WebSocket: {formatTimestamp(dashboardData.metrics.lastUpdated)}</div>
              <div>API Data: {formatTimestamp(lastApiUpdate?.toISOString())}</div>
            </div>
            <button
              onClick={() => {
                requestDashboardData();
                fetchEnhancedData();
              }}
              disabled={wsLoading || isLoadingEnhanced}
              className="px-3 py-1 bg-dark-400 hover:bg-dark-500 text-gray-200 text-sm rounded transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${(wsLoading || isLoadingEnhanced) ? 'animate-spin' : ''}`} />
              Refresh All
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Jobs */}
        <div className="bg-dark-400/30 p-4 rounded-lg border border-dark-400">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-5 h-5 text-green-400" />
            <span className="text-xs text-gray-400">Real-time</span>
          </div>
          <div className="text-2xl font-bold text-green-400">{dashboardData.generators.active}</div>
          <div className="text-sm text-gray-400">Active Jobs</div>
          <div className="text-xs text-gray-500 mt-1">{dashboardData.generators.idle} idle workers</div>
        </div>

        {/* Success Rate */}
        <div className="bg-dark-400/30 p-4 rounded-lg border border-dark-400">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <span className="text-xs text-gray-400">Historical</span>
          </div>
          <div className="text-2xl font-bold text-blue-400">
            {performanceMetrics ? `${performanceMetrics.successRate.toFixed(1)}%` : `${dashboardData.metrics.successRate}%`}
          </div>
          <div className="text-sm text-gray-400">Success Rate</div>
          <div className="text-xs text-gray-500 mt-1">
            {performanceMetrics ? `${performanceMetrics.totalJobsAnalyzed} jobs analyzed` : 'WebSocket data'}
          </div>
        </div>

        {/* Performance */}
        <div className="bg-dark-400/30 p-4 rounded-lg border border-dark-400">
          <div className="flex items-center justify-between mb-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            <span className="text-xs text-gray-400">Performance</span>
          </div>
          <div className="text-2xl font-bold text-purple-400">
            {performanceMetrics ? formatNumber(performanceMetrics.avgAttemptsPerSecond) : formatNumber(dashboardData.generators.performance.hourly)}
          </div>
          <div className="text-sm text-gray-400">
            {performanceMetrics ? 'Avg Keys/sec' : 'Hourly Rate'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {performanceMetrics ? formatDuration(performanceMetrics.avgCompletionTimeMs) + ' avg time' : 'From WebSocket'}
          </div>
        </div>

        {/* Total Wallets */}
        <div className="bg-dark-400/30 p-4 rounded-lg border border-dark-400">
          <div className="flex items-center justify-between mb-2">
            <Wallet className="w-5 h-5 text-orange-400" />
            <span className="text-xs text-gray-400">Pool Status</span>
          </div>
          <div className="text-2xl font-bold text-orange-400">
            {poolStats ? poolStats.total : dashboardData.wallets.total}
          </div>
          <div className="text-sm text-gray-400">Total Wallets</div>
          <div className="text-xs text-gray-500 mt-1">
            {poolStats ? `${poolStats.available} available` : `${dashboardData.wallets.available} available`}
          </div>
        </div>
      </div>

      {/* Detailed Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generator & System Status */}
        <div className="bg-dark-400/30 p-4 rounded-lg border border-dark-400">
          <h4 className="text-md font-medium text-gray-200 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Generator Status
          </h4>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-dark-500/30 p-3 rounded-lg text-center">
              <p className="text-xs text-gray-400 mb-1">Active</p>
              <p className="text-xl font-semibold text-green-400">{dashboardData.generators.active}</p>
            </div>
            
            <div className="bg-dark-500/30 p-3 rounded-lg text-center">
              <p className="text-xs text-gray-400 mb-1">Idle</p>
              <p className="text-xl font-semibold text-yellow-400">{dashboardData.generators.idle}</p>
            </div>
            
            <div className="bg-dark-500/30 p-3 rounded-lg text-center">
              <p className="text-xs text-gray-400 mb-1">Total</p>
              <p className="text-xl font-semibold text-gray-200">{dashboardData.generators.total}</p>
            </div>
          </div>
          
          <h5 className="text-sm font-medium text-gray-300 mb-3">System Resources</h5>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-400">CPU</span>
                </div>
                <span className="text-xs font-medium text-gray-300">{dashboardData.resources.cpuUsage}%</span>
              </div>
              <div className="w-full bg-dark-600 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    dashboardData.resources.cpuUsage > 80 ? 'bg-red-500' : 
                    dashboardData.resources.cpuUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${dashboardData.resources.cpuUsage}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <MemoryStick className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-400">Memory</span>
                </div>
                <span className="text-xs font-medium text-gray-300">{dashboardData.resources.memoryUsage}%</span>
              </div>
              <div className="w-full bg-dark-600 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    dashboardData.resources.memoryUsage > 80 ? 'bg-red-500' : 
                    dashboardData.resources.memoryUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${dashboardData.resources.memoryUsage}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-400">Disk</span>
                </div>
                <span className="text-xs font-medium text-gray-300">{dashboardData.resources.diskSpace}%</span>
              </div>
              <div className="w-full bg-dark-600 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    dashboardData.resources.diskSpace > 80 ? 'bg-red-500' : 
                    dashboardData.resources.diskSpace > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${dashboardData.resources.diskSpace}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Performance Analytics */}
        <div className="bg-dark-400/30 p-4 rounded-lg border border-dark-400">
          <h4 className="text-md font-medium text-gray-200 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Performance by Pattern Length
          </h4>
          
          {performanceMetrics && performanceMetrics.byPatternLength.length > 0 ? (
            <div className="space-y-3">
              {performanceMetrics.byPatternLength.map((stat) => (
                <div key={stat.length} className="bg-dark-500/30 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-300">{stat.length} chars</span>
                    <span className="text-xs text-gray-400">{stat.count} wallets</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400">Avg Time:</span>
                      <div className="text-blue-400 font-medium">{formatDuration(stat.avgDurationMs)}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Avg Attempts:</span>
                      <div className="text-purple-400 font-medium">{formatNumber(stat.avgAttempts)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No performance data available</p>
              <p className="text-gray-500 text-xs">Complete some vanity wallet jobs to see analytics</p>
            </div>
          )}
        </div>

        {/* Popular Patterns */}
        <div className="bg-dark-400/30 p-4 rounded-lg border border-dark-400">
          <h4 className="text-md font-medium text-gray-200 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Popular Patterns
          </h4>
          
          {patternAnalytics && patternAnalytics.popularPatterns.length > 0 ? (
            <div className="space-y-3">
              {patternAnalytics.popularPatterns.map((pattern, index) => (
                <div key={pattern.pattern} className="bg-dark-500/30 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-300">
                      #{index + 1} {pattern.pattern}
                    </span>
                    <span className="text-xs text-gray-400">{pattern.count}x</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400">Avg Time:</span>
                      <div className="text-green-400 font-medium">{formatDuration(pattern.avgDurationMs)}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Success:</span>
                      <div className="text-green-400 font-medium">{pattern.successRate.toFixed(0)}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No pattern data available</p>
              <p className="text-gray-500 text-xs">Generate some vanity wallets to see popular patterns</p>
            </div>
          )}
        </div>
      </div>

      {/* Connection Status */}
      <div className="text-xs text-gray-500 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className={isConnected ? "text-green-400" : "text-red-400"}>
            {isConnected ? "●" : "○"} WebSocket {isConnected ? "Connected" : "Disconnected"}
          </span>
          <span className={enhancedError ? "text-red-400" : "text-green-400"}>
            {enhancedError ? "●" : "●"} REST API {enhancedError ? "Error" : "Connected"}
          </span>
        </div>
        <div className="text-gray-500">
          Enterprise-grade vanity wallet analytics powered by DegenDuel
        </div>
      </div>
    </div>
  );
};