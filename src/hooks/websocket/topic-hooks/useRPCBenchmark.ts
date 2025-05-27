// src/hooks/websocket/topic-hooks/useRPCBenchmark.ts

/**
 * useRPCBenchmark Hook
 * 
 * @description Public hook for accessing RPC benchmark data via SYSTEM WebSocket topic
 * NO AUTHENTICATION REQUIRED - public data
 * 
 * @author BranchManager69
 * @version 1.0.0
 * @created 2025-05-25
 * @updated 2025-05-25
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { DDExtendedMessageType, TopicType, isMessageType } from '../';
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

/**
 * useRPCBenchmark hook for accessing RPC benchmark data via public SYSTEM WebSocket
 * 
 * @returns RPC benchmark data, status, and control functions
 */
export function useRPCBenchmark() {
  const [data, setData] = useState<RPCBenchmarkData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBenchmarkRunning, setIsBenchmarkRunning] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

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
  const handleMessage = useCallback((message: {
    type: string;
    action?: string;
    data?: any;
    topic?: string;
    subtype?: string;
    code?: number;
    error?: string;
  }) => {
    // Handle successful RPC benchmark data responses
    if (message.type === 'RESPONSE' &&
      (message.action === 'getRpcBenchmarks' || message.action === 'rpc-benchmarks/latest') &&
      message.data) {
      console.log('[RPC Benchmark] Received data:', message.data);
      updateData(message.data);
      setIsBenchmarkRunning(false);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Handle DATA messages for real-time updates
    if (isMessageType(message.type, DDExtendedMessageType.DATA)) {
      try {
        const { topic, subtype, action, data } = message;

        if (topic === TopicType.SYSTEM) {
          if (subtype === 'rpc-benchmark') {
            if (action === 'update') {
              // Updated benchmark data
              if (data && data.test_run_id) {
                updateData(data);
                setIsBenchmarkRunning(false);
                setIsLoading(false);
                setError(null);
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
                setError(null);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error processing RPC benchmark message:', err);
      }
    }

    // Handle errors gracefully (like database stats hook)
    if (message.type === 'ERROR') {
      console.error('[RPC Benchmark] WebSocket error:', message);

      // Handle errors (should be rare since this is public data)
      if (message.code === 4003 || message.error?.includes('Authentication required')) {
        setError('RPC benchmark temporarily unavailable');
      } else if (message.code === 4012 || message.error?.includes('Admin/superadmin role required')) {
        setError('RPC benchmark access issue (this should not happen for public data)');
      } else {
        setError(message.error || 'RPC benchmark unavailable');
      }
      setIsLoading(false);
    }
  }, [updateData]);

  // Set up WebSocket connection - system for data, admin for triggering
  const ws = useUnifiedWebSocket(
    'rpc-benchmark-hook',
    [DDExtendedMessageType.DATA, DDExtendedMessageType.ERROR, DDExtendedMessageType.ACKNOWLEDGMENT],
    handleMessage,
    [TopicType.SYSTEM, TopicType.ADMIN] // Need both topics for reading data (system) and triggering (admin)
  );

  // Fetch latest benchmark data when connected
  const fetchLatestBenchmarkData = useCallback(() => {
    if (!ws.isConnected) {
      return false;
    }

    setIsLoading(true);
    return ws.request(TopicType.SYSTEM, 'getRpcBenchmarks');
  }, [ws]);

  // Trigger a new benchmark run (requires admin authentication)
  const triggerBenchmark = useCallback(() => {
    if (!ws.isConnected || !ws.isAuthenticated) {
      return false;
    }

    setIsBenchmarkRunning(true);
    return ws.request(TopicType.ADMIN, 'rpc-benchmarks/trigger'); // Use ADMIN topic for triggering
  }, [ws]);

  // Request initial data when connected
  useEffect(() => {
    if (!ws.isConnected) return;

    // Subscribe to system topic (public)
    ws.subscribe(['system']);
    
    // Subscribe to admin topic if authenticated (for trigger capabilities)
    if (ws.isAuthenticated) {
      ws.subscribe(['admin']);
    }

    // Fetch initial data
    fetchLatestBenchmarkData();

    return () => {
      if (ws.isConnected) {
        ws.unsubscribe(['system']);
        if (ws.isAuthenticated) {
          ws.unsubscribe(['admin']);
        }
      }
    };
  }, [ws.isConnected, ws.isAuthenticated, fetchLatestBenchmarkData]);

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
    error: error || ws.error,
    lastUpdate,
    refreshData: fetchLatestBenchmarkData,
    triggerBenchmark
  };
}