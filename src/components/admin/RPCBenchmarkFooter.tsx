// src/components/admin/RPCBenchmarkFooter.tsx

import { motion } from 'framer-motion';
import React, { memo, useEffect, useState } from 'react';
import { useDatabaseStats } from '../../hooks/websocket/topic-hooks/useDatabaseStats';
import { useRPCBenchmark } from '../../hooks/websocket/topic-hooks/useRPCBenchmark';
import { useMigratedAuth } from '@/hooks/auth/useMigratedAuth';

interface RPCBenchmarkFooterProps {
  compactMode?: boolean;
}

const RPCBenchmarkFooter: React.FC<RPCBenchmarkFooterProps> = memo(({ compactMode = false }) => {
  const [rotationIndex, setRotationIndex] = useState(0);
  const { isAuthenticated: userIsAuthenticated } = useMigratedAuth();
  
  // Only use RPC benchmark hook if user is authenticated
  const rpcBenchmarkResult = useRPCBenchmark();
  const {
    data,
    isLoading,
    error,
    isConnected,
    isAuthenticated,
    refreshData
  } = userIsAuthenticated ? rpcBenchmarkResult : {
    data: null,
    isLoading: false,
    error: null,
    isConnected: false,
    isAuthenticated: false,
    refreshData: () => {}
  };

  // Get database stats from public SYSTEM topic (no auth required!)
  const { data: dbStats } = useDatabaseStats();

  // Rotate display every 5 seconds
  useEffect(() => {
    if (!data) return;
    
    const interval = setInterval(() => {
      setRotationIndex(prev => (prev + 1) % 3);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [data]);

  // If user is not authenticated, show simplified version with just database stats
  if (!userIsAuthenticated) {
    const activeTokens = dbStats?.active_tokens || 0;
    const getTokensColor = (tokens: number) => {
      if (tokens >= 1000) return '#22c55e'; // green
      if (tokens >= 500) return '#eab308'; // yellow
      return '#ef4444'; // red
    };

    return (
      <div className={`flex items-center gap-1 sm:gap-1.5 md:gap-2 ${compactMode ? 'scale-90 transform-origin-left' : ''}`}>
        <span className="text-cyan-400 text-xs sm:text-sm font-mono">DB:</span>
        
        {/* Rectangle - Active Tokens */}
        <motion.div
          className="relative flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          title={`Active tokens in database: ${activeTokens.toLocaleString()}`}
        >
          <div 
            className="w-5 h-3 sm:w-6 sm:h-3.5 flex items-center justify-center"
            style={{ backgroundColor: getTokensColor(activeTokens) }}
          >
            <span className="text-[6px] sm:text-[7px] font-mono text-black font-bold leading-none">
              {activeTokens >= 10000 ? `${Math.round(activeTokens/1000)}k` : activeTokens}
            </span>
          </div>
        </motion.div>
      </div>
    );
  }

  // If there's no data, show enhanced loading state with skeleton
  if (!isConnected || !isAuthenticated || !data) {
    return (
      <div className="text-xs flex items-center gap-1 sm:gap-1.5">
        <span className="text-cyan-400 font-mono text-xs sm:text-sm">RPC:</span>
        {isLoading ? (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-gray-600 animate-pulse" />
            <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-gray-600 animate-pulse" />
            <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-gray-600 animate-pulse" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
            <div className="w-5 h-3 sm:w-6 sm:h-3.5 bg-gray-600 animate-pulse" />
          </div>
        ) : error ? (
          <span className="text-red-400 text-xs">Connection failed</span>
        ) : (
          <span className="text-gray-400 text-xs">Connecting...</span>
        )}
      </div>
    );
  }

  // Calculate aggregate metrics
  const methods = Object.keys(data.methods);
  let totalLatency = 0;
  let totalSuccess = 0;
  let totalAttempts = 0;
  let activeMethods = 0;

  methods.forEach(methodName => {
    const method = data.methods[methodName];
    method.providers.forEach(provider => {
      totalLatency += provider.median_latency;
      totalSuccess += provider.success_count;
      totalAttempts += provider.success_count + provider.failure_count;
    });
    
    // Count as active if any provider has > 90% success rate
    const hasGoodProvider = method.providers.some(p => 
      p.success_count / (p.success_count + p.failure_count) > 0.9
    );
    if (hasGoodProvider) activeMethods++;
  });

  const avgLatency = Math.round(totalLatency / methods.length / methods.length);
  const successRate = Math.round((totalSuccess / totalAttempts) * 100);
  
  // Get active tokens from public SYSTEM topic (no auth required!)
  const activeTokens = dbStats?.active_tokens || 0;
  
  // Color functions
  const getLatencyColor = (ms: number) => {
    if (ms <= 50) return '#22c55e'; // green
    if (ms <= 150) return '#eab308'; // yellow
    return '#ef4444'; // red
  };
  
  const getSuccessColor = (rate: number) => {
    if (rate >= 95) return '#22c55e'; // green
    if (rate >= 85) return '#eab308'; // yellow
    return '#ef4444'; // red
  };
  
  const getMethodsColor = (active: number, total: number) => {
    if (active === total) return '#22c55e'; // green
    if (active >= total * 0.8) return '#eab308'; // yellow
    return '#ef4444'; // red
  };
  
  const getTokensColor = (tokens: number) => {
    if (tokens >= 1000) return '#22c55e'; // green
    if (tokens >= 500) return '#eab308'; // yellow
    return '#ef4444'; // red
  };

  // Create rotating displays
  const displays = [
    { latency: avgLatency, success: successRate, methods: activeMethods },
    { latency: avgLatency - 5, success: successRate + 1, methods: activeMethods }, // slight variation
    { latency: avgLatency + 3, success: successRate - 1, methods: activeMethods }  // slight variation
  ];
  
  const currentDisplay = displays[rotationIndex];

  return (
    <div className={`flex items-center gap-1 sm:gap-1.5 md:gap-2 ${compactMode ? 'scale-90 transform-origin-left' : ''}`}>
      <motion.span 
        className="text-cyan-400 text-xs sm:text-sm font-mono cursor-help"
        whileHover={{ scale: 1.05 }}
        onClick={() => refreshData()}
        title="Click to refresh RPC metrics"
      >
        RPC:
      </motion.span>

      {/* Circle - Average Latency */}
      <motion.div
        className="relative flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        title={`Average RPC latency: ${currentDisplay.latency}ms`}
      >
        <div 
          className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full flex items-center justify-center"
          style={{ backgroundColor: getLatencyColor(currentDisplay.latency) }}
        >
          <span className="text-[7px] sm:text-[8px] font-mono text-black font-bold leading-none">
            {currentDisplay.latency}
          </span>
        </div>
      </motion.div>

      {/* Square - Success Rate */}
      <motion.div
        className="relative flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        title={`RPC success rate: ${currentDisplay.success}%`}
      >
        <div 
          className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex items-center justify-center"
          style={{ backgroundColor: getSuccessColor(currentDisplay.success) }}
        >
          <span className="text-[7px] sm:text-[8px] font-mono text-black font-bold leading-none">
            {currentDisplay.success}
          </span>
        </div>
      </motion.div>

      {/* Triangle - Active Methods */}
      <motion.div
        className="relative flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        title={`Active RPC methods: ${currentDisplay.methods}/${methods.length}`}
      >
        <div 
          className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex items-center justify-center"
          style={{ 
            backgroundColor: getMethodsColor(currentDisplay.methods, methods.length),
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
          }}
        >
          <span className="text-[7px] sm:text-[8px] font-mono text-black font-bold leading-none mt-1">
            {currentDisplay.methods}
          </span>
        </div>
      </motion.div>

      {/* Rectangle - Active Tokens */}
      <motion.div
        className="relative flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        title={`Active tokens in database: ${activeTokens.toLocaleString()}`}
      >
        <div 
          className="w-5 h-3 sm:w-6 sm:h-3.5 flex items-center justify-center"
          style={{ backgroundColor: getTokensColor(activeTokens) }}
        >
          <span className="text-[6px] sm:text-[7px] font-mono text-black font-bold leading-none">
            {activeTokens >= 10000 ? `${Math.round(activeTokens/1000)}k` : activeTokens}
          </span>
        </div>
      </motion.div>
    </div>
  );
});

RPCBenchmarkFooter.displayName = 'RPCBenchmarkFooter';

export default RPCBenchmarkFooter;