// src/components/admin/RPCBenchmarkFooter.tsx

import { motion } from 'framer-motion';
import React from 'react';
import { useRPCBenchmarkWebSocket } from '../../hooks/websocket/legacy/useRPCBenchmarkWebSocket';

// This is a standalone component that can be used in the Footer component
// for admin users to see RPC benchmark diagnostics data

interface RPCBenchmarkFooterProps {
  compactMode?: boolean;
}

const RPCBenchmarkFooter: React.FC<RPCBenchmarkFooterProps> = ({ compactMode = false }) => {
  // Use RPC benchmark WebSocket to get data
  const {
    data,
    isLoading,
    error,
    isConnected,
    isAuthenticated,
    refreshData
  } = useRPCBenchmarkWebSocket();

  // If there's no data or we're not connected/authenticated, show minimal information
  if (!isConnected || !isAuthenticated || !data) {
    return (
      <div className="text-xs flex items-center gap-1.5">
        <span className="text-cyan-400 font-mono">RPC:</span>
        {isLoading ? (
          <span className="text-gray-400 animate-pulse">Loading...</span>
        ) : error ? (
          <span className="text-red-400">Error loading benchmark data</span>
        ) : (
          <span className="text-gray-400">No data available</span>
        )}
      </div>
    );
  }

  // Calculate provider stats
  const providers: Array<{ name: string; latency: number; isFastest: boolean }> = [];
  const methods = Object.keys(data.methods);

  // Get all unique providers
  const providerSet = new Set<string>();
  Object.values(data.methods).forEach(method => {
    method.providers.forEach(provider => {
      providerSet.add(provider.provider);
    });
  });

  // Calculate average latency for each provider
  Array.from(providerSet).forEach(providerName => {
    let totalLatency = 0;
    let count = 0;

    methods.forEach(methodName => {
      const method = data.methods[methodName];
      const provider = method.providers.find(p => p.provider === providerName);
      
      if (provider) {
        totalLatency += provider.median_latency;
        count++;
      }
    });

    const avgLatency = count > 0 ? totalLatency / count : 0;
    
    providers.push({
      name: providerName,
      latency: avgLatency,
      isFastest: providerName === data.overall_fastest_provider
    });
  });

  // Sort providers by latency (fastest first)
  providers.sort((a, b) => a.latency - b.latency);

  // Format for the compact footer display
  return (
    <div className={`flex items-center gap-1.5 ${compactMode ? 'scale-90 transform-origin-left' : ''}`}>
      <motion.div 
        className="text-cyan-400 text-xs font-mono cursor-help"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => refreshData()}
        title={`Last updated: ${new Date(data.timestamp).toLocaleString()}`}
      >
        RPC:
      </motion.div>

      <div className="flex flex-wrap gap-1">
        {providers.map((provider) => (
          <motion.div
            key={provider.name}
            className={`text-xs px-1.5 py-0.5 rounded-sm flex items-center gap-1 ${
              provider.isFastest 
                ? 'bg-green-500/10 text-green-400 border border-green-500/30' 
                : 'bg-dark-800/80 text-gray-300 border border-gray-700/50'
            }`}
            whileHover={{ scale: 1.05 }}
            title={`${provider.name}: ${provider.latency.toFixed(1)}ms average latency across ${methods.length} methods`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${provider.isFastest ? 'bg-green-400' : 'bg-gray-500'}`} />
            <span className="font-mono">{provider.name}</span>
            <span>{provider.latency.toFixed(1)}ms</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default RPCBenchmarkFooter;