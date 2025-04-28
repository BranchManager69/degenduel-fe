import React, { useEffect } from "react";
import { useVanityDashboard } from "../../hooks/websocket/topic-hooks/useVanityDashboard";

export const VanityWalletDashboard: React.FC = () => {
  const {
    dashboardData,
    isLoading,
    isConnected,
    error,
    requestDashboardData
  } = useVanityDashboard();

  // Request dashboard data when component mounts
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

  if (isLoading) {
    return (
      <div className="bg-dark-300/30 rounded-lg border border-dark-300 p-4 flex justify-center items-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-400 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-dark-300/30 rounded-lg border border-dark-300 p-4">
        <p className="text-red-400">Error: {error}</p>
        <button
          onClick={requestDashboardData}
          className="mt-2 px-3 py-1 bg-dark-400 hover:bg-dark-500 text-gray-200 text-sm rounded transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="bg-dark-300/30 rounded-lg border border-dark-300 p-4">
        <p className="text-yellow-400">WebSocket disconnected. Reconnecting...</p>
      </div>
    );
  }

  return (
    <div className="bg-dark-300/30 rounded-lg border border-dark-300 p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-100">Vanity Wallet Dashboard</h3>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            Last updated: {formatTimestamp(dashboardData.metrics.lastUpdated)}
          </span>
          <button
            onClick={requestDashboardData}
            className="px-3 py-1 bg-dark-400 hover:bg-dark-500 text-gray-200 text-sm rounded transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Generator Stats */}
        <div className="bg-dark-400/30 p-4 rounded-lg border border-dark-400">
          <h4 className="text-md font-medium text-gray-200 mb-3">Generator Status</h4>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-dark-500/30 p-3 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Active</p>
              <p className="text-xl font-semibold text-green-400">{dashboardData.generators.active}</p>
            </div>
            
            <div className="bg-dark-500/30 p-3 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Idle</p>
              <p className="text-xl font-semibold text-yellow-400">{dashboardData.generators.idle}</p>
            </div>
            
            <div className="bg-dark-500/30 p-3 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Total</p>
              <p className="text-xl font-semibold text-gray-200">{dashboardData.generators.total}</p>
            </div>
          </div>
          
          <h5 className="text-sm font-medium text-gray-300 mt-4 mb-2">Performance</h5>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-dark-500/30 p-3 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Hourly</p>
              <p className="text-lg font-semibold text-blue-400">{dashboardData.generators.performance.hourly}</p>
            </div>
            
            <div className="bg-dark-500/30 p-3 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Daily</p>
              <p className="text-lg font-semibold text-blue-400">{dashboardData.generators.performance.daily}</p>
            </div>
            
            <div className="bg-dark-500/30 p-3 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Weekly</p>
              <p className="text-lg font-semibold text-blue-400">{dashboardData.generators.performance.weekly}</p>
            </div>
          </div>
        </div>
        
        {/* Wallet Stats */}
        <div className="bg-dark-400/30 p-4 rounded-lg border border-dark-400">
          <h4 className="text-md font-medium text-gray-200 mb-3">Wallet Status</h4>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-dark-500/30 p-3 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Available</p>
              <p className="text-xl font-semibold text-green-400">{dashboardData.wallets.available}</p>
            </div>
            
            <div className="bg-dark-500/30 p-3 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Assigned</p>
              <p className="text-xl font-semibold text-orange-400">{dashboardData.wallets.assigned}</p>
            </div>
            
            <div className="bg-dark-500/30 p-3 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Total</p>
              <p className="text-xl font-semibold text-gray-200">{dashboardData.wallets.total}</p>
            </div>
          </div>
          
          <h5 className="text-sm font-medium text-gray-300 mt-4 mb-2">Metrics</h5>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-dark-500/30 p-3 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Success Rate</p>
              <p className="text-lg font-semibold text-green-400">{dashboardData.metrics.successRate}%</p>
            </div>
            
            <div className="bg-dark-500/30 p-3 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Avg Gen Time</p>
              <p className="text-lg font-semibold text-blue-400">{dashboardData.metrics.avgGenerationTime}s</p>
            </div>
          </div>
        </div>
        
        {/* System Resources */}
        <div className="bg-dark-400/30 p-4 rounded-lg border border-dark-400">
          <h4 className="text-md font-medium text-gray-200 mb-3">System Resources</h4>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-400">CPU Usage</span>
                <span className="text-xs font-medium text-gray-300">{dashboardData.resources.cpuUsage}%</span>
              </div>
              <div className="w-full bg-dark-600 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    dashboardData.resources.cpuUsage > 80 ? 'bg-red-500' : 
                    dashboardData.resources.cpuUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${dashboardData.resources.cpuUsage}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-400">Memory Usage</span>
                <span className="text-xs font-medium text-gray-300">{dashboardData.resources.memoryUsage}%</span>
              </div>
              <div className="w-full bg-dark-600 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    dashboardData.resources.memoryUsage > 80 ? 'bg-red-500' : 
                    dashboardData.resources.memoryUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${dashboardData.resources.memoryUsage}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-400">Disk Space</span>
                <span className="text-xs font-medium text-gray-300">{dashboardData.resources.diskSpace}%</span>
              </div>
              <div className="w-full bg-dark-600 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    dashboardData.resources.diskSpace > 80 ? 'bg-red-500' : 
                    dashboardData.resources.diskSpace > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${dashboardData.resources.diskSpace}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 mt-2">
        <span className={isConnected ? "text-green-400" : "text-red-400"}>
          {isConnected ? "●" : "○"} WebSocket {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>
    </div>
  );
};