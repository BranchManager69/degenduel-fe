// src/components/admin/RPCBenchmarkDashboard.tsx

import React, { useEffect } from 'react';
import { useRPCBenchmarkWebSocket } from '../../hooks/websocket/legacy/useRPCBenchmarkWebSocket';

interface RPCBenchmarkDashboardProps {
  isVisible?: boolean;
}

export const RPCBenchmarkDashboard: React.FC<RPCBenchmarkDashboardProps> = ({ 
  isVisible = true 
}) => {
  // Hook into the WebSocket data
  const { 
    data, 
    isLoading, 
    error, 
    isConnected,
    refreshData
  } = useRPCBenchmarkWebSocket();

  // Handle visibility changes
  useEffect(() => {
    if (isVisible && isConnected) {
      refreshData();
    }
  }, [isVisible, isConnected, refreshData]);

  if (!isVisible) return null;
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 rounded-full border-4 border-brand-500/30 border-t-brand-500 animate-spin"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
        <p>Error: {error}</p>
        <button 
          onClick={refreshData}
          className="mt-2 text-sm px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-md transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="bg-dark-200/50 backdrop-blur-sm border border-brand-500/20 rounded-lg p-6 text-gray-400">
        No benchmark data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-dark-200/50 backdrop-blur-sm border border-brand-500/20 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold font-cyber tracking-wider bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
              RPC PERFORMANCE BENCHMARK
            </h2>
            <p className="text-gray-400 mt-1">
              Last updated: {new Date(data.timestamp).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-dark-300/80 rounded-lg border border-dark-400/50">
              <span className="text-sm text-gray-400">Test Run ID:</span>
              <span className="ml-2 text-brand-400 font-mono text-sm">
                {data.test_run_id.substring(0, 8)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Performance Summary */}
        <div className="bg-dark-300/50 rounded-lg p-4 border border-brand-500/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-brand-400 font-semibold">Overall Fastest Provider</h3>
            <span className="text-lg text-brand-300 font-bold">
              {data.overall_fastest_provider} 
            </span>
          </div>
          
          {data.performance_advantage.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm text-gray-400 mb-2">Performance Advantage</h4>
              <div className="space-y-2">
                {data.performance_advantage.map(advantage => (
                  <div key={advantage.method} className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-gray-300">{advantage.method}</div>
                    <div className="text-brand-300">
                      {advantage.vs_second_place.toFixed(1)}% faster than {advantage.second_place_provider}
                    </div>
                    <div className="text-brand-300">
                      {advantage.vs_third_place 
                        ? `${advantage.vs_third_place.toFixed(1)}% faster than ${advantage.third_place_provider}`
                        : 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Method Details */}
      <div className="space-y-6">
        {Object.entries(data.methods).map(([method, details]) => (
          <div key={method} className="bg-dark-200/50 backdrop-blur-sm border border-brand-500/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-brand-300">
              {method}
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-dark-400/50">
                    <th className="pb-2 text-gray-400 font-normal">Provider</th>
                    <th className="pb-2 text-gray-400 font-normal">Median (ms)</th>
                    <th className="pb-2 text-gray-400 font-normal">Avg (ms)</th>
                    <th className="pb-2 text-gray-400 font-normal">Min (ms)</th>
                    <th className="pb-2 text-gray-400 font-normal">Max (ms)</th>
                    <th className="pb-2 text-gray-400 font-normal">Success Rate</th>
                    <th className="pb-2 text-gray-400 font-normal">Comparison</th>
                  </tr>
                </thead>
                <tbody>
                  {details.providers.map((provider, index) => (
                    <tr 
                      key={provider.provider}
                      className={`
                        border-b border-dark-400/30 
                        ${index === 0 ? 'bg-green-500/5' : ''}
                      `}
                    >
                      <td className="py-3 text-gray-300 font-medium">
                        {provider.provider}
                        {index === 0 && (
                          <span className="ml-2 text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
                            Fastest
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-brand-400 font-mono">
                        {provider.median_latency.toFixed(1)}
                      </td>
                      <td className="py-3 text-gray-400 font-mono">
                        {provider.avg_latency.toFixed(1)}
                      </td>
                      <td className="py-3 text-gray-400 font-mono">
                        {provider.min_latency.toFixed(1)}
                      </td>
                      <td className="py-3 text-gray-400 font-mono">
                        {provider.max_latency.toFixed(1)}
                      </td>
                      <td className="py-3 text-gray-300">
                        {((provider.success_count / (provider.success_count + provider.failure_count)) * 100).toFixed(1)}%
                      </td>
                      <td className="py-3">
                        {index === 0 ? (
                          <span className="text-green-400">Baseline</span>
                        ) : (
                          <span className="text-amber-400">
                            {provider.percent_slower?.toFixed(1)}% slower
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Visual comparison */}
            <div className="mt-4">
              <h4 className="text-sm text-gray-400 mb-2">Visual Comparison</h4>
              <div className="space-y-2">
                {details.providers.map((provider, index) => {
                  const fastestValue = details.providers[0].median_latency;
                  const percentage = (provider.median_latency / fastestValue) * 100;
                  const width = Math.max(10, Math.min(100, percentage)) + '%';
                  
                  return (
                    <div key={provider.provider} className="flex items-center">
                      <div className="w-32 text-gray-300 text-sm">
                        {provider.provider}
                      </div>
                      <div className="flex-1 h-8 bg-dark-300/50 rounded overflow-hidden">
                        <div 
                          className={`h-full flex items-center px-2 ${
                            index === 0 
                              ? 'bg-gradient-to-r from-green-500/40 to-green-400/40' 
                              : 'bg-gradient-to-r from-amber-500/40 to-amber-400/40'
                          }`}
                          style={{ width }}
                        >
                          <span className="text-xs font-semibold">
                            {provider.median_latency.toFixed(1)} ms
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RPCBenchmarkDashboard;