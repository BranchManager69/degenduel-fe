/**
 * useRPCBenchmarkWebSocket Hook
 * 
 * Specialized hook for interacting with RPC benchmark data through the unified WebSocket
 */

import React, { useCallback, useEffect, useState } from 'react';
import { MessageType } from '../index';
import { useUnifiedWebSocket } from '../useUnifiedWebSocket';

// Types
interface BenchmarkProvider {
  provider: string;
  median_latency: number;
  avg_latency: number;
  min_latency: number;
  max_latency: number;
  success_count: number;
  failure_count: number;
  percent_slower?: number;
}

interface BenchmarkMethod {
  providers: BenchmarkProvider[];
}

interface PerformanceAdvantage {
  method: string;
  vs_second_place: number;
  vs_third_place: number | null;
  second_place_provider: string;
  third_place_provider: string | null;
}

export interface BenchmarkData {
  success: boolean;
  test_run_id: string;
  timestamp: string;
  methods: Record<string, BenchmarkMethod>;
  overall_fastest_provider: string;
  performance_advantage: PerformanceAdvantage[];
}

export interface BenchmarkMessage {
  type: string;
  topic: string;
  data: {
    type: 'rpc-benchmark-update';
    test_run_id: string;
    timestamp: string;
  };
}

/**
 * Hook for accessing RPC benchmark data via WebSocket
 */
export function useRPCBenchmarkWebSocket() {
  // Using a ref to avoid the unused setData warning while maintaining state functionality
  const [data, setData] = useState<BenchmarkData | null>(null);
  
  // Create a mutable ref to store the latest benchmark data
  const dataRef = React.useRef<BenchmarkData | null>(null);
  
  // Update both the state and ref when new data comes in
  const updateData = React.useCallback((newData: BenchmarkData | null) => {
    setData(newData);
    dataRef.current = newData;
  }, []);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isBenchmarkRunning, setIsBenchmarkRunning] = useState<boolean>(false);
  const uniqueId = 'rpc-benchmark-' + Math.random().toString(36).substring(2, 9);
  
  // Message handler
  const handleMessage = useCallback((message: BenchmarkMessage) => {
    if (message.topic === 'admin' && message.data?.type === 'rpc-benchmark-update') {
      // Trigger a fetch for the latest data
      fetchLatestBenchmarkData();
      
      // Check if benchmark is still running
      if (message.data.test_run_id) {
        setIsBenchmarkRunning(false);
      }
    }
  }, []);
  
  // Set up WebSocket connection
  const { 
    isConnected, 
    isAuthenticated,
    request,
    subscribe,
    unsubscribe,
    error: wsError
  } = useUnifiedWebSocket(
    uniqueId,
    [MessageType.DATA, MessageType.ACKNOWLEDGMENT, MessageType.ERROR],
    handleMessage,
    ['admin']
  );
  
  // Fetch latest benchmark data
  const fetchLatestBenchmarkData = useCallback(() => {
    if (!isConnected || !isAuthenticated) return;
    
    setIsLoading(true);
    
    // Send request for latest benchmark data
    try {
      request('admin', 'rpc-benchmarks/latest');
      
      // Handle async response if available
      Promise.resolve().then(() => {
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Error fetching benchmark data:', error);
      setError(error instanceof Error ? error.message : String(error));
      setIsLoading(false);
    }
  }, [isConnected, isAuthenticated, request, updateData]);
  
  // Trigger a new benchmark
  const triggerBenchmark = useCallback(() => {
    if (!isConnected || !isAuthenticated) return false;
    
    setIsBenchmarkRunning(true);
    
    try {
      request('admin', 'rpc-benchmarks/trigger');
      return true;
    } catch (error) {
      console.error('Error triggering benchmark:', error);
      setIsBenchmarkRunning(false);
      return false;
    }
  }, [isConnected, isAuthenticated, request]);
  
  // Set up subscription when connected
  useEffect(() => {
    if (isConnected && isAuthenticated) {
      // Subscribe to admin topics
      subscribe(['admin']);
      
      // Initial data fetch
      fetchLatestBenchmarkData();
    }
    
    return () => {
      if (isConnected) {
        unsubscribe(['admin']);
      }
    };
  }, [isConnected, isAuthenticated, subscribe, unsubscribe, fetchLatestBenchmarkData]);
  
  // Update error state
  useEffect(() => {
    if (wsError) {
      setError(wsError);
    }
  }, [wsError]);
  
  return {
    data,
    isLoading,
    error,
    isConnected,
    isAuthenticated,
    isBenchmarkRunning,
    triggerBenchmark,
    refreshData: fetchLatestBenchmarkData
  };
}

export default useRPCBenchmarkWebSocket;