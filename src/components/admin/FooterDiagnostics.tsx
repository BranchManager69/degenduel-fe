// src/components/admin/FooterDiagnostics.tsx

import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';
import { useRPCBenchmarkWebSocket } from '../../hooks/websocket/legacy/useRPCBenchmarkWebSocket';
import { isStorybook } from '../../utils/storybook';

// Use a storybook mock if available
const useRPCBenchmarkWebSocketHook = (typeof window !== 'undefined' && (window as any).useRPCBenchmarkWebSocket) || useRPCBenchmarkWebSocket;

// Constants for performance thresholds
const LATENCY_THRESHOLDS = {
  EXCELLENT: 50,  // Below 50ms is excellent
  GOOD: 150,      // Below 150ms is good
  ACCEPTABLE: 300, // Below 300ms is acceptable
  POOR: 500       // Above 500ms is poor
};

interface FooterDiagnosticsProps {
  compactMode?: boolean;
}

const FooterDiagnostics: React.FC<FooterDiagnosticsProps> = ({ compactMode = false }) => {
  const [expanded, setExpanded] = useState(false);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const detailsRef = useRef<HTMLDivElement>(null);
  
  // Use RPC benchmark WebSocket to get data
  const {
    data,
    isLoading,
    error,
    isConnected,
    isAuthenticated,
    refreshData,
    triggerBenchmark
  } = useRPCBenchmarkWebSocketHook();
  
  // Click outside handler for expanded view
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (detailsRef.current && !detailsRef.current.contains(event.target as Node)) {
        setExpanded(false);
      }
    };
    
    if (expanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expanded]);

  // Effect to show detailed view after brief delay once expanded
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (expanded) {
      timer = setTimeout(() => {
        setShowDetailedView(true);
      }, 300);
    } else {
      setShowDetailedView(false);
    }
    
    return () => {
      clearTimeout(timer);
    };
  }, [expanded]);

  // Determine health status for a latency value
  const getHealthStatus = (latency: number) => {
    if (latency < LATENCY_THRESHOLDS.EXCELLENT) return 'excellent';
    if (latency < LATENCY_THRESHOLDS.GOOD) return 'good';
    if (latency < LATENCY_THRESHOLDS.ACCEPTABLE) return 'acceptable';
    if (latency < LATENCY_THRESHOLDS.POOR) return 'poor';
    return 'critical';
  };

  // Get color classes based on health status
  const getHealthColorClasses = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-emerald-500/20';
      case 'good':
        return 'bg-green-500/20 text-green-400 border-green-500/30 shadow-green-500/20';
      case 'acceptable':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 shadow-yellow-500/20';
      case 'poor':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30 shadow-orange-500/20';
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500/30 shadow-red-500/20';
      default:
        return 'bg-dark-800/80 text-gray-300 border-gray-700/50';
    }
  };

  // If there's no data or we're not connected/authenticated, show minimal information
  if (!isConnected || !isAuthenticated || !data) {
    return (
      <motion.div
        className="text-xs flex items-center gap-1.5 cursor-pointer"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => refreshData()}
      >
        <span className="text-cyan-400 font-mono bg-cyan-500/10 px-2 py-0.5 rounded-sm border border-cyan-500/20">RPC</span>
        {isLoading ? (
          <div className="text-gray-400 flex items-center gap-1">
            <span className="animate-pulse">Scanning</span>
            <div className="flex space-x-0.5">
              <div className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        ) : error ? (
          <span className="text-red-400 px-2 py-0.5 rounded-sm bg-red-500/10 border border-red-500/20">Error</span>
        ) : (
          <span className="text-gray-400 bg-dark-800/80 px-2 py-0.5 rounded-sm">Awaiting Data</span>
        )}
      </motion.div>
    );
  }

  // Calculate provider stats
  const providers: Array<{ name: string; latency: number; isFastest: boolean; health: string }> = [];
  const methods = Object.keys(data.methods);

  // Get all unique providers
  const providerSet = new Set<string>();
  Object.values(data.methods).forEach((method: any) => {
    if (method.providers && Array.isArray(method.providers)) {
      method.providers.forEach((provider: any) => {
        providerSet.add(provider.provider);
      });
    }
  });

  // Calculate average latency for each provider
  Array.from(providerSet).forEach(providerName => {
    let totalLatency = 0;
    let count = 0;

    methods.forEach(methodName => {
      const method = data.methods[methodName];
      const provider = method.providers.find((p: any) => p.provider === providerName);
      
      if (provider) {
        totalLatency += provider.median_latency;
        count++;
      }
    });

    const avgLatency = count > 0 ? totalLatency / count : 0;
    const healthStatus = getHealthStatus(avgLatency);
    
    providers.push({
      name: providerName,
      latency: avgLatency,
      isFastest: providerName === data.overall_fastest_provider,
      health: healthStatus
    });
  });

  // Sort providers by latency (fastest first)
  providers.sort((a, b) => a.latency - b.latency);

  // Calculate threshold values for relative speed visualization
  const fastestLatency = providers.length > 0 ? providers[0].latency : 0;
  const slowestLatency = providers.length > 0 ? providers[providers.length - 1].latency : 0;
  const latencyRange = slowestLatency - fastestLatency;

  // Format for the compact footer display
  return (
    <motion.div 
      className={`relative z-50 ${compactMode ? 'scale-90 transform-origin-left' : ''}`}
      initial={false}
    >
      {/* Compact view */}
      <motion.div 
        className="flex items-center gap-1.5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <motion.div 
          className="text-cyan-400 text-xs font-mono bg-cyan-500/10 px-2 py-0.5 rounded-sm border border-cyan-500/20 flex items-center gap-1 cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <span>RPC</span>
          {expanded ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          )}
        </motion.div>

        <div className="flex flex-nowrap gap-1 overflow-x-auto max-w-[200px] hide-scrollbar">
          {providers.slice(0, 3).map((provider) => (
            <motion.div
              key={provider.name}
              className={`text-xs px-1.5 py-0.5 rounded-sm flex items-center gap-1 border ${getHealthColorClasses(provider.health)}`}
              whileHover={{ scale: 1.05 }}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${!isStorybook() ? 'animate-pulse' : ''}`} 
                style={{ 
                  backgroundColor: provider.health === 'excellent' ? '#10b981' : 
                                   provider.health === 'good' ? '#22c55e' : 
                                   provider.health === 'acceptable' ? '#eab308' : 
                                   provider.health === 'poor' ? '#f97316' : '#ef4444'
                }} 
              />
              <span className="font-mono">{provider.name}</span>
              <span className="font-semibold">{provider.latency.toFixed(0)}</span>
            </motion.div>
          ))}
          {providers.length > 3 && (
            <motion.div
              className="text-xs px-1.5 py-0.5 rounded-sm bg-dark-300/50 text-gray-400 border border-dark-400/50"
              whileHover={{ scale: 1.05 }}
            >
              +{providers.length - 3} more
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Expanded detailed view */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            ref={detailsRef}
            className="absolute bottom-full mb-2 right-0 w-80 sm:w-96 bg-dark-100/95 backdrop-blur-lg border border-brand-500/20 rounded-lg shadow-lg shadow-dark-900/50 overflow-hidden"
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-3">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-cyan-500/20 p-1.5 rounded">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-200">RPC Performance Monitor</h3>
                    <p className="text-xs text-gray-400">Last updated: {new Date(data.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="bg-brand-500/20 hover:bg-brand-500/30 text-brand-400 p-1 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerBenchmark();
                    }}
                    title="Run new benchmark"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="bg-dark-300/50 hover:bg-dark-300 text-gray-400 p-1 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpanded(false);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </motion.button>
                </div>
              </div>
              
              {/* Latency Visualization */}
              <AnimatePresence>
                {showDetailedView && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="space-y-2 mb-3">
                      {providers.map((provider, index) => {
                        const relativeSpeed = latencyRange === 0 ? 100 : 100 - ((provider.latency - fastestLatency) / latencyRange * 100);
                        return (
                          <div key={provider.name} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <div className="font-mono text-gray-300 flex items-center gap-1.5">
                                <span className={`h-2 w-2 rounded-full ${!isStorybook() && index === 0 ? 'animate-pulse' : ''}`} 
                                  style={{ 
                                    backgroundColor: provider.health === 'excellent' ? '#10b981' : 
                                                    provider.health === 'good' ? '#22c55e' : 
                                                    provider.health === 'acceptable' ? '#eab308' : 
                                                    provider.health === 'poor' ? '#f97316' : '#ef4444'
                                  }} 
                                />
                                {provider.name}
                                {provider.isFastest && (
                                  <span className="bg-brand-500/20 text-brand-400 text-[10px] px-1 rounded">fastest</span>
                                )}
                              </div>
                              <span className={`font-mono font-semibold ${
                                provider.health === 'excellent' ? 'text-emerald-400' : 
                                provider.health === 'good' ? 'text-green-400' : 
                                provider.health === 'acceptable' ? 'text-yellow-400' : 
                                provider.health === 'poor' ? 'text-orange-400' : 'text-red-400'
                              }`}>
                                {provider.latency.toFixed(1)}ms
                              </span>
                            </div>
                            <div className="h-2 bg-dark-300/50 rounded overflow-hidden">
                              <motion.div 
                                className={`h-full ${
                                  provider.health === 'excellent' ? 'bg-gradient-to-r from-emerald-600/70 to-emerald-400/70' : 
                                  provider.health === 'good' ? 'bg-gradient-to-r from-green-600/70 to-green-400/70' : 
                                  provider.health === 'acceptable' ? 'bg-gradient-to-r from-yellow-600/70 to-yellow-400/70' : 
                                  provider.health === 'poor' ? 'bg-gradient-to-r from-orange-600/70 to-orange-400/70' : 
                                  'bg-gradient-to-r from-red-600/70 to-red-400/70'
                                }`}
                                initial={{ width: 0 }}
                                animate={{ width: `${relativeSpeed}%` }}
                                transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Performance thresholds legend */}
                    <div className="text-[10px] text-gray-400 flex justify-between items-center border-t border-dark-300/50 pt-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                          <span>&lt;{LATENCY_THRESHOLDS.EXCELLENT}ms</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                          <span>&lt;{LATENCY_THRESHOLDS.GOOD}ms</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-yellow-500"></span>
                          <span>&lt;{LATENCY_THRESHOLDS.ACCEPTABLE}ms</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                          <span>&gt;{LATENCY_THRESHOLDS.POOR}ms</span>
                        </div>
                      </div>
                      <div>
                        {methods.length} methods tested
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FooterDiagnostics;