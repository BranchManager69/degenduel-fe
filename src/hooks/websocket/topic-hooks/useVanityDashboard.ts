/**
 * useVanityDashboard Hook
 * 
 * V69 Standardized WebSocket Hook for Vanity Wallet Dashboard Data
 * This hook provides real-time updates for vanity wallet management data
 * 
 * @created 2025-04-27
 */

import { useCallback, useEffect, useState } from 'react';
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';
import { useUnifiedWebSocket } from '../useUnifiedWebSocket';
import { DDExtendedMessageType } from '../types';
import { TopicType } from '../index';

// Define the structure for vanity dashboard data updates from the server
export interface VanityDashboardData {
  generators: {
    active: number;
    idle: number;
    total: number;
    performance: {
      hourly: number;
      daily: number;
      weekly: number;
    };
  };
  wallets: {
    available: number;
    assigned: number;
    total: number;
  };
  resources: {
    cpuUsage: number;
    memoryUsage: number;
    diskSpace: number;
  };
  metrics: {
    successRate: number;
    avgGenerationTime: number;
    lastUpdated: string;
  };
}

// Default vanity dashboard data
const DEFAULT_VANITY_DASHBOARD: VanityDashboardData = {
  generators: {
    active: 0,
    idle: 0,
    total: 0,
    performance: {
      hourly: 0,
      daily: 0,
      weekly: 0
    }
  },
  wallets: {
    available: 0,
    assigned: 0,
    total: 0
  },
  resources: {
    cpuUsage: 0,
    memoryUsage: 0,
    diskSpace: 0
  },
  metrics: {
    successRate: 0,
    avgGenerationTime: 0,
    lastUpdated: new Date().toISOString()
  }
};

/**
 * Hook for accessing and managing vanity wallet dashboard data with real-time updates
 * Uses the terminal WebSocket topic as specified by the backend team
 */
export function useVanityDashboard() {
  // State for vanity dashboard data
  const [dashboardData, setDashboardData] = useState<VanityDashboardData>(DEFAULT_VANITY_DASHBOARD);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Message handler for WebSocket messages
  const handleMessage = useCallback((message: any) => {
    try {
      console.log('[VanityDashboard WebSocket] Received message:', message);
      
      // Check if this is a valid vanity dashboard data message
      if (message.type === 'DATA' && 
          message.topic === 'terminal' && 
          message.subtype === 'vanity-dashboard' && 
          message.data) {
        
        // Update dashboard data state
        setDashboardData(message.data);
        
        // Update status and timestamp
        setIsLoading(false);
        setLastUpdate(new Date());
        
        // Log event for monitoring
        dispatchWebSocketEvent('vanity_dashboard_update', {
          socketType: TopicType.TERMINAL,
          message: 'Received vanity dashboard data from WebSocket',
          timestamp: new Date().toISOString()
        });
      }
      
      // Mark as not loading once we've processed any valid message
      if (isLoading) {
        setIsLoading(false);
      }
    } catch (err) {
      console.error('[VanityDashboard WebSocket] Error processing message:', err);
      dispatchWebSocketEvent('error', {
        socketType: TopicType.TERMINAL,
        message: 'Error processing vanity dashboard data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, [isLoading]);

  // Connect to the unified WebSocket system
  const ws = useUnifiedWebSocket(
    'vanity-dashboard-hook',
    [DDExtendedMessageType.DATA, DDExtendedMessageType.ERROR],
    handleMessage,
    [TopicType.TERMINAL, TopicType.SYSTEM]
  );

  // Request vanity dashboard data function
  const requestDashboardData = useCallback(() => {
    if (ws.isConnected) {
      setIsLoading(true);
      
      // Request vanity dashboard data
      ws.request(TopicType.TERMINAL, 'getVanityDashboard');
      
      dispatchWebSocketEvent('vanity_dashboard_request', {
        socketType: TopicType.TERMINAL,
        message: 'Requesting vanity dashboard data',
        timestamp: new Date().toISOString()
      });
      
      // Set a timeout to reset loading state if we don't get data
      setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
        }
      }, 10000);
    } else {
      console.warn('[VanityDashboard WebSocket] Cannot request data - WebSocket not connected');
      setIsLoading(false);
    }
  }, [ws.isConnected, ws.request, isLoading]);

  // Subscribe to terminal data and request dashboard data when WebSocket is connected
  useEffect(() => {
    if (ws.isConnected && isLoading) {
      // Subscribe to terminal topic
      ws.subscribe([TopicType.TERMINAL]);
      
      // Request initial dashboard data
      requestDashboardData();
      
      // Set a timeout to reset loading state if we don't get data
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          console.warn('[VanityDashboard WebSocket] Timed out waiting for data');
          setIsLoading(false);
        }
      }, 10000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [ws.isConnected, isLoading, ws.subscribe, requestDashboardData]);

  return {
    dashboardData,
    isLoading,
    isConnected: ws.isConnected,
    error: ws.error,
    lastUpdate,
    requestDashboardData
  };
}