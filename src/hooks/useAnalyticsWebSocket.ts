import { useCallback } from 'react';
import { useStore } from '../store/useStore';
import { useWebSocket } from './websocket/useWebSocket';

export type AnalyticsWebSocketReturn = {
  isConnected: boolean;
  close: () => void;
};

export const useAnalyticsWebSocket = (): AnalyticsWebSocketReturn => {
  const { 
    updateUserActivity, 
    updateSystemMetrics, 
    updateUserSegments 
  } = useStore();
  
  const { user } = useStore();
  const token = user?.jwt || user?.session_token;

  // Handle incoming messages
  const handleMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'user_activity_update':
        if (data.users && Array.isArray(data.users)) {
          updateUserActivity(data.users);
        }
        break;
        
      case 'system_metrics':
        if (data.metrics) {
          updateSystemMetrics({
            ...data.metrics,
            timestamp: data.timestamp || new Date().toISOString()
          });
        }
        break;
        
      case 'user_segment_update':
        if (data.segment) {
          updateUserSegments({
            ...data.segment,
            timestamp: data.timestamp || new Date().toISOString()
          });
        }
        break;
    }
  }, [updateUserActivity, updateSystemMetrics, updateUserSegments]);

  // Initialize WebSocket connection
  const {
    isConnected,
    disconnect
  } = useWebSocket('analytics', {
    token,
    reconnect: true,
    maxReconnectAttempts: 10,
    onMessage: handleMessage,
    debug: true,
  });

  return {
    isConnected,
    close: disconnect
  };
};