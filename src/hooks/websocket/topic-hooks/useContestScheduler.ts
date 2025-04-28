/**
 * useContestScheduler Hook
 * 
 * V69 Standardized WebSocket Hook for Contest Scheduler Data
 * This hook provides real-time updates for contest scheduler status and events
 * 
 * @created 2025-04-27
 */

import { useCallback, useEffect, useState } from 'react';
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';
import { useUnifiedWebSocket } from '../useUnifiedWebSocket';
import { MessageType } from '../types';
import { TopicType } from '../index';

// Define the structure for contest scheduler data updates from the server
export interface ContestSchedulerData {
  status: {
    isRunning: boolean;
    health: {
      status: string;
      circuitBreaker: {
        isOpen: boolean;
        failureCount: number;
      };
    };
    maintenance: {
      systemInMaintenanceMode: boolean;
    };
  };
  stats: {
    contests: {
      created: number;
      createdDuringMaintenance: number;
      createdFromDatabaseSchedules: number;
      nextScheduledAt: string | null;
    };
  };
  events: {
    lastEvent: string | null;
    lastEventTime: string | null;
    recentEvents: Array<{
      type: string;
      message: string;
      timestamp: string;
    }>;
  };
}

// Default contest scheduler data
const DEFAULT_SCHEDULER_DATA: ContestSchedulerData = {
  status: {
    isRunning: false,
    health: {
      status: 'unknown',
      circuitBreaker: {
        isOpen: false,
        failureCount: 0
      }
    },
    maintenance: {
      systemInMaintenanceMode: false
    }
  },
  stats: {
    contests: {
      created: 0,
      createdDuringMaintenance: 0,
      createdFromDatabaseSchedules: 0,
      nextScheduledAt: null
    }
  },
  events: {
    lastEvent: null,
    lastEventTime: null,
    recentEvents: []
  }
};

/**
 * Hook for accessing and managing contest scheduler data with real-time updates
 * Uses the admin WebSocket topic as specified by the backend team
 */
export function useContestScheduler() {
  // State for contest scheduler data
  const [schedulerData, setSchedulerData] = useState<ContestSchedulerData>(DEFAULT_SCHEDULER_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Message handler for WebSocket messages
  const handleMessage = useCallback((message: any) => {
    try {
      console.log('[ContestScheduler WebSocket] Received message:', message);
      
      // Check if this is a valid contest scheduler data message
      if (message.type === 'DATA' && 
          message.topic === 'admin' && 
          message.subtype === 'contest-scheduler' && 
          message.data) {
        
        // Update scheduler data state
        setSchedulerData(message.data);
        
        // Update status and timestamp
        setIsLoading(false);
        setLastUpdate(new Date());
        
        // Log event for monitoring
        dispatchWebSocketEvent('contest_scheduler_update', {
          socketType: TopicType.ADMIN,
          message: 'Received contest scheduler data from WebSocket',
          timestamp: new Date().toISOString()
        });
      }
      
      // Mark as not loading once we've processed any valid message
      if (isLoading) {
        setIsLoading(false);
      }
    } catch (err) {
      console.error('[ContestScheduler WebSocket] Error processing message:', err);
      dispatchWebSocketEvent('error', {
        socketType: TopicType.ADMIN,
        message: 'Error processing contest scheduler data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, [isLoading]);

  // Connect to the unified WebSocket system
  const ws = useUnifiedWebSocket(
    'contest-scheduler-hook',
    [MessageType.DATA, MessageType.ERROR],
    handleMessage,
    [TopicType.ADMIN, TopicType.SYSTEM]
  );

  // Request contest scheduler data function
  const requestSchedulerData = useCallback(() => {
    if (ws.isConnected) {
      setIsLoading(true);
      
      // Request contest scheduler data
      ws.request(TopicType.ADMIN, 'getContestSchedulerStatus');
      
      dispatchWebSocketEvent('contest_scheduler_request', {
        socketType: TopicType.ADMIN,
        message: 'Requesting contest scheduler data',
        timestamp: new Date().toISOString()
      });
      
      // Set a timeout to reset loading state if we don't get data
      setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
        }
      }, 10000);
    } else {
      console.warn('[ContestScheduler WebSocket] Cannot request data - WebSocket not connected');
      setIsLoading(false);
    }
  }, [ws.isConnected, ws.request, isLoading]);

  // Control contest scheduler service function
  const controlSchedulerService = useCallback((action: 'start' | 'stop' | 'restart') => {
    if (ws.isConnected) {
      // Send control command via request since command is not available
      ws.request(TopicType.ADMIN, 'controlContestScheduler', { action });
      
      dispatchWebSocketEvent('contest_scheduler_control', {
        socketType: TopicType.ADMIN,
        message: `Sending control command: ${action}`,
        action,
        timestamp: new Date().toISOString()
      });
      
      // Request updated data after a short delay to allow the action to complete
      setTimeout(requestSchedulerData, 1000);
    } else {
      console.warn('[ContestScheduler WebSocket] Cannot control service - WebSocket not connected');
    }
  }, [ws.isConnected, ws.request, requestSchedulerData]);

  // Subscribe to admin data and request scheduler data when WebSocket is connected
  useEffect(() => {
    if (ws.isConnected && isLoading) {
      // Subscribe to admin topic
      ws.subscribe([TopicType.ADMIN]);
      
      // Request initial scheduler data
      requestSchedulerData();
      
      // Set a timeout to reset loading state if we don't get data
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          console.warn('[ContestScheduler WebSocket] Timed out waiting for data');
          setIsLoading(false);
        }
      }, 10000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [ws.isConnected, isLoading, ws.subscribe, requestSchedulerData]);

  return {
    schedulerData,
    isLoading,
    isConnected: ws.isConnected,
    error: ws.error,
    lastUpdate,
    requestSchedulerData,
    controlSchedulerService
  };
}