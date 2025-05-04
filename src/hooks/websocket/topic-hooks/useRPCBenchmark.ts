/**
 * useRPCBenchmark Hook
 * 
 * Standardized hook for the RPC benchmark system that provides real-time
 * benchmark data and controls for admin users.
 * 
 * Based on the v69 Unified WebSocket System specification
 * Last updated: April 10, 2025
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { DDExtendedMessageType, TopicType } from '../';
import { useUnifiedWebSocket } from '../useUnifiedWebSocket';

// RPC Benchmark types
export interface RPCBenchmarkProvider {
  provider: string;
  median_latency: number;
  avg_latency: number;
  min_latency: number;
  max_latency: number;
  success_count: number;
  failure_count: number;
  percent_slower?: number;
}

export interface RPCBenchmarkMethod {
  providers: RPCBenchmarkProvider[];
}

export interface RPCPerformanceAdvantage {
  method: string;
  vs_second_place: number;
  vs_third_place: number | null;
  second_place_provider: string;
  third_place_provider: string | null;
}

export interface RPCBenchmarkData {
  success: boolean;
  test_run_id: string;
  timestamp: string;
  methods: Record<string, RPCBenchmarkMethod>;
  overall_fastest_provider: string;
  performance_advantage: RPCPerformanceAdvantage[];
}

// Message types from v69 Unified WebSocket System
interface BenchmarkMessage {
  type: string;
  topic: string;
  subtype: string;
  action: string;
  data: any;
  timestamp: string;
}

/**
 * useRPCBenchmark hook for accessing and controlling RPC benchmark data
 * 
 * @returns RPC benchmark data, status, and control functions
 */
export function useRPCBenchmark() {
  const [data, setData] = useState<RPCBenchmarkData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBenchmarkRunning, setIsBenchmarkRunning] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // Create a mutable ref to store the latest benchmark data
  const dataRef = useRef<RPCBenchmarkData | null>(null);
  
  // Update both the state and ref when new data comes in
  const updateData = useCallback((newData: RPCBenchmarkData | null) => {
    setData(newData);
    dataRef.current = newData;
    if (newData) {
      setLastUpdate(new Date(newData.timestamp));
    }
  }, []);

  // Process incoming messages
  const handleMessage = useCallback((message: BenchmarkMessage) => {
    if (message.type !== DDExtendedMessageType.DATA) {
      return;
    }

    try {
      const { topic, subtype, action, data } = message;
      
      if (topic === TopicType.ADMIN) {
        if (subtype === 'rpc-benchmark') {
          if (action === 'update') {
            // Updated benchmark data
            if (data && data.test_run_id) {
              updateData(data);
              setIsBenchmarkRunning(false);
              setIsLoading(false);
            }
          } else if (action === 'status') {
            // Benchmark status update
            if (data && data.running !== undefined) {
              setIsBenchmarkRunning(data.running);
            }
          } else if (action === 'result') {
            // Complete benchmark result
            if (data) {
              updateData(data);
              setIsBenchmarkRunning(false);
              setIsLoading(false);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing RPC benchmark message:', error);
    }
  }, [updateData]);

  // Set up WebSocket connection
  const ws = useUnifiedWebSocket(
    'rpc-benchmark-hook',
    [DDExtendedMessageType.DATA, DDExtendedMessageType.ERROR, DDExtendedMessageType.ACKNOWLEDGMENT],
    handleMessage,
    [TopicType.ADMIN, TopicType.SYSTEM]
  );

  // Fetch latest benchmark data when connected
  const fetchLatestBenchmarkData = useCallback(() => {
    if (!ws.isConnected) {
      return false;
    }
    
    setIsLoading(true);
    return ws.request(TopicType.ADMIN, 'rpc-benchmarks/latest');
  }, [ws]);

  // Trigger a new benchmark run
  const triggerBenchmark = useCallback(() => {
    if (!ws.isConnected) {
      return false;
    }
    
    setIsBenchmarkRunning(true);
    return ws.request(TopicType.ADMIN, 'rpc-benchmarks/trigger');
  }, [ws]);

  // Request initial data when connected
  useEffect(() => {
    if (!ws.isConnected || !ws.isAuthenticated) return;

    // Subscribe to admin topic
    ws.subscribe(['admin']);
    
    // Fetch initial data
    fetchLatestBenchmarkData();
    
    return () => {
      if (ws.isConnected) {
        ws.unsubscribe(['admin']);
      }
    };
  }, [ws.isConnected, ws.isAuthenticated, fetchLatestBenchmarkData, ws]);

  // Reset loading state after a timeout if we're still loading
  useEffect(() => {
    if (!isLoading) return;

    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 15000); // Longer timeout for benchmark data which can take time

    return () => clearTimeout(timeoutId);
  }, [isLoading]);

  return {
    data,
    isLoading,
    isBenchmarkRunning,
    isConnected: ws.isConnected,
    isAuthenticated: ws.isAuthenticated,
    error: ws.error,
    lastUpdate,
    refreshData: fetchLatestBenchmarkData,
    triggerBenchmark
  };
}