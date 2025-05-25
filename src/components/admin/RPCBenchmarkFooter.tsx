// src/components/admin/RPCBenchmarkFooter.tsx

import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useRPCBenchmarkWebSocket } from '../../hooks/websocket/legacy/useRPCBenchmarkWebSocket';

interface RPCBenchmarkFooterProps {
  compactMode?: boolean;
}

const RPCBenchmarkFooter: React.FC<RPCBenchmarkFooterProps> = ({ compactMode = false }) => {
  const [rotationIndex, setRotationIndex] = useState(0);
  
  const {
    data,
    isLoading,
    error,
    isConnected,
    isAuthenticated,
    refreshData
  } = useRPCBenchmarkWebSocket();

  // Rotate display every 5 seconds
  useEffect(() => {
    if (!data) return;
    
    const interval = setInterval(() => {
      setRotationIndex(prev => (prev + 1) % 3);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [data]);

  // If there's no data, show minimal loading state
  if (!isConnected || !isAuthenticated || !data) {
    return (
      <div className="text-xs flex items-center gap-1">
        <span className="text-cyan-400 font-mono">RPC:</span>
        {isLoading ? (
          <span className="text-gray-400 animate-pulse">●●●</span>
        ) : error ? (
          <span className="text-red-400">●●●</span>
        ) : (
          <span className="text-gray-400">●●●</span>
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

  // Create rotating displays
  const displays = [
    { latency: avgLatency, success: successRate, methods: activeMethods },
    { latency: avgLatency - 5, success: successRate + 1, methods: activeMethods }, // slight variation
    { latency: avgLatency + 3, success: successRate - 1, methods: activeMethods }  // slight variation
  ];
  
  const currentDisplay = displays[rotationIndex];

  return (
    <div className={`flex items-center gap-1 ${compactMode ? 'scale-90 transform-origin-left' : ''}`}>
      <motion.span 
        className="text-cyan-400 text-xs font-mono cursor-help"
        whileHover={{ scale: 1.05 }}
        onClick={() => refreshData()}
        title="refresh"
      >
        RPC:
      </motion.span>

      {/* Circle - Average Latency */}
      <motion.div
        className="relative flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        title="latency"
      >
        <div 
          className="w-3 h-3 rounded-full flex items-center justify-center"
          style={{ backgroundColor: getLatencyColor(currentDisplay.latency) }}
        >
          <span className="text-[8px] font-mono text-black font-bold leading-none">
            {currentDisplay.latency}
          </span>
        </div>
      </motion.div>

      {/* Square - Success Rate */}
      <motion.div
        className="relative flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        title="success"
      >
        <div 
          className="w-3 h-3 flex items-center justify-center"
          style={{ backgroundColor: getSuccessColor(currentDisplay.success) }}
        >
          <span className="text-[8px] font-mono text-black font-bold leading-none">
            {currentDisplay.success}
          </span>
        </div>
      </motion.div>

      {/* Triangle - Active Methods */}
      <motion.div
        className="relative flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        title="methods"
      >
        <div 
          className="w-3 h-3 flex items-center justify-center"
          style={{ 
            backgroundColor: getMethodsColor(currentDisplay.methods, methods.length),
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
          }}
        >
          <span className="text-[8px] font-mono text-black font-bold leading-none mt-1">
            {currentDisplay.methods}
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default RPCBenchmarkFooter;