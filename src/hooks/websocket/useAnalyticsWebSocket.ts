/**
 * Analytics WebSocket Hook - V69 Standardized Version
 * 
 * This hook connects to the analytics WebSocket service and provides real-time
 * analytics data including user activity, system metrics, and user segments.
 */

import { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { dispatchWebSocketEvent } from '../../utils/wsMonitor';
import { SOCKET_TYPES, WEBSOCKET_ENDPOINT } from './types';
import useWebSocket from './useWebSocket';

interface UserActivityUpdate {
  type: "user_activity_update";
  users: Array<{
    wallet: string;
    nickname: string;
    avatar_url: string;
    current_zone:
      | "TRADING"
      | "CONTESTS"
      | "PORTFOLIO"
      | "TOKENS"
      | "PROFILE"
      | "LEADERBOARD";
    previous_zone: string | null;
    wallet_balance: number;
    last_action: string;
    last_active: string;
    session_duration: number;
    is_whale: boolean;
  }>;
  timestamp: string;
}

interface SystemMetrics {
  type: "system_metrics";
  data: {
    active_users: number;
    total_contests: number;
    total_trades_24h: number;
    total_volume_24h: number;
    peak_concurrent_users: number;
    average_response_time: number;
    error_rate: number;
    timestamp: string;
  };
}

interface UserSegmentUpdate {
  type: "user_segment_update";
  data: {
    segment: string;
    user_count: number;
    average_balance: number;
    activity_score: number;
    retention_rate: number;
    timestamp: string;
  };
}

type AnalyticsMessage = UserActivityUpdate | SystemMetrics | UserSegmentUpdate;

export function useAnalyticsWebSocket() {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { updateUserActivity, updateSystemMetrics, updateUserSegments } = useStore();

  // Connect to the WebSocket using the standardized hook
  const { 
    status, 
    data, 
    error,
    connect,
    close
  } = useWebSocket<AnalyticsMessage>({
    endpoint: WEBSOCKET_ENDPOINT,
    socketType: SOCKET_TYPES.ANALYTICS,
    requiresAuth: true, // Analytics requires admin authentication
    heartbeatInterval: 30000
  });

  // When the connection status changes, log it
  useEffect(() => {
    dispatchWebSocketEvent('analytics_status', {
      socketType: SOCKET_TYPES.ANALYTICS,
      status,
      message: `Analytics WebSocket is ${status}`
    });
  }, [status]);

  // Process messages from the WebSocket
  useEffect(() => {
    if (!data) return;
    
    try {
      // Process the message based on its type
      switch (data.type) {
        case "user_activity_update":
          updateUserActivity(data.users);
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('user_activity_update', {
            socketType: SOCKET_TYPES.ANALYTICS,
            message: `User activity update for ${data.users.length} users`,
            userCount: data.users.length,
            timestamp: new Date().toISOString()
          });
          break;
          
        case "system_metrics":
          updateSystemMetrics(data.data);
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('system_metrics', {
            socketType: SOCKET_TYPES.ANALYTICS,
            message: 'System metrics update',
            metrics: {
              activeUsers: data.data.active_users,
              totalContests: data.data.total_contests,
              errorRate: data.data.error_rate
            },
            timestamp: new Date().toISOString()
          });
          break;
          
        case "user_segment_update":
          updateUserSegments(data.data);
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('user_segment_update', {
            socketType: SOCKET_TYPES.ANALYTICS,
            message: `User segment update for ${data.data.segment}`,
            segment: data.data.segment,
            userCount: data.data.user_count,
            timestamp: new Date().toISOString()
          });
          break;
      }
    } catch (err) {
      console.error('Error processing analytics message:', err);
      dispatchWebSocketEvent('error', {
        socketType: SOCKET_TYPES.ANALYTICS,
        message: 'Error processing analytics data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, [data, updateUserActivity, updateSystemMetrics, updateUserSegments]);
  
  // Handle errors
  useEffect(() => {
    if (error) {
      console.error('Analytics WebSocket error:', error);
      dispatchWebSocketEvent('error', {
        socketType: SOCKET_TYPES.ANALYTICS,
        message: error.message,
        error
      });
    }
  }, [error]);
  
  return {
    isConnected: status === 'online',
    error: error ? error.message : null,
    lastUpdate,
    connect,
    close
  };
}