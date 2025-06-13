import { useEffect, useState } from "react";

import { useStore } from "../../../store/useStore";
// We'll need to update this once the analytics WebSocket is properly set up
// import { useAnalyticsWebSocket } from './useAnalyticsWebSocket';

/**
 * @deprecated This hook is deprecated and will be removed in a future version.
 * Use hooks/websocket/topic-hooks/useAnalytics.ts instead.
 * This implementation exists as a duplicate of the one in analytics/legacy/.
 */

interface AnalyticsState {
  activeUsers: number;
  usersByZone: Record<string, number>;
  recentActivity: Array<{
    wallet: string;
    nickname: string;
    action: string;
    zone: string;
    timestamp: string;
  }>;
  metrics: {
    totalContests: number;
    totalTrades24h: number;
    totalVolume24h: number;
    peakConcurrentUsers: number;
    averageResponseTime: number;
    errorRate: number;
  };
  userSegments: Record<
    string,
    {
      userCount: number;
      averageBalance: number;
      activityScore: number;
      retentionRate: number;
      lastUpdated: string;
    }
  >;
}

// Extended store type with analytics properties
interface ExtendedStore {
  liveUserActivity?: {
    users: Array<{
      wallet: string;
      nickname: string;
      last_action: string;
      current_zone: string;
      last_active: string;
    }>;
  };
  systemMetrics?: {
    total_contests: number;
    total_trades_24h: number;
    total_volume_24h: number;
    peak_concurrent_users: number;
    average_response_time: number;
    error_rate: number;
  };
  userSegments?:
    | Array<{
        segment: string;
        user_count: number;
        average_balance: number;
        activity_score: number;
        retention_rate: number;
        timestamp: string;
      }>
    | {
        segment: string;
        user_count: number;
        average_balance: number;
        activity_score: number;
        retention_rate: number;
        timestamp: string;
      };
}

/**
 * @deprecated This hook is deprecated and will be removed in a future version.
 * Use hooks/websocket/topic-hooks/useAnalytics.ts instead.
 */
export const useEnhancedAnalytics = () => {
  const store = useStore() as unknown as ExtendedStore;
  // Get properties from the extended store
  const liveUserActivity = store.liveUserActivity;
  const systemMetrics = store.systemMetrics;
  const userSegments = store.userSegments;

  // Mocked for now until the real implementation is ready
  const connected = true;
  const [analyticsState, setAnalyticsState] = useState<AnalyticsState>({
    activeUsers: 0,
    usersByZone: {},
    recentActivity: [],
    metrics: {
      totalContests: 0,
      totalTrades24h: 0,
      totalVolume24h: 0,
      peakConcurrentUsers: 0,
      averageResponseTime: 0,
      errorRate: 0,
    },
    userSegments: {},
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Effect to process user activity data from the store
  useEffect(() => {
    if (liveUserActivity?.users) {
      // Process users by zone
      const zoneMap: Record<string, number> = {};
      liveUserActivity.users.forEach((user) => {
        const zone = user.current_zone;
        zoneMap[zone] = (zoneMap[zone] || 0) + 1;
      });

      // Process recent activity
      const recentActivity = liveUserActivity.users
        .slice(0, 20)
        .map((user) => ({
          wallet: user.wallet,
          nickname: user.nickname,
          action: user.last_action,
          zone: user.current_zone,
          timestamp: user.last_active,
        }));

      setAnalyticsState((prev) => ({
        ...prev,
        activeUsers: liveUserActivity.users.length,
        usersByZone: zoneMap,
        recentActivity,
      }));

      setIsLoading(false);
    }
  }, [liveUserActivity]);

  // Effect to process system metrics from the store
  useEffect(() => {
    if (systemMetrics) {
      setAnalyticsState((prev) => ({
        ...prev,
        metrics: {
          totalContests: systemMetrics.total_contests,
          totalTrades24h: systemMetrics.total_trades_24h,
          totalVolume24h: systemMetrics.total_volume_24h,
          peakConcurrentUsers: systemMetrics.peak_concurrent_users,
          averageResponseTime: systemMetrics.average_response_time,
          errorRate: systemMetrics.error_rate,
        },
      }));
    }
  }, [systemMetrics]);

  // Effect to process user segments from the store
  useEffect(() => {
    if (userSegments) {
      const segmentsMap: Record<string, any> = {};
      if (Array.isArray(userSegments)) {
        userSegments.forEach((segment) => {
          segmentsMap[segment.segment] = {
            userCount: segment.user_count,
            averageBalance: segment.average_balance,
            activityScore: segment.activity_score,
            retentionRate: segment.retention_rate,
            lastUpdated: segment.timestamp,
          };
        });
      } else if (userSegments.segment) {
        // Handle single segment update
        segmentsMap[userSegments.segment] = {
          userCount: userSegments.user_count,
          averageBalance: userSegments.average_balance,
          activityScore: userSegments.activity_score,
          retentionRate: userSegments.retention_rate,
          lastUpdated: userSegments.timestamp,
        };
      }

      setAnalyticsState((prev) => ({
        ...prev,
        userSegments: {
          ...prev.userSegments,
          ...segmentsMap,
        },
      }));
    }
  }, [userSegments]);

  // Function to reconnect WebSocket (will be implemented later)
  const reconnect = () => console.log("Reconnecting...");

  // Handle connection errors
  useEffect(() => {
    if (!connected && !isLoading) {
      setError("WebSocket connection lost. Attempting to reconnect...");

      // Auto-reconnect after 5 seconds
      const reconnectTimer = setTimeout(() => {
        reconnect();
        setError(null);
      }, 5000);

      return () => clearTimeout(reconnectTimer);
    }
  }, [connected, isLoading]);

  return {
    isLoading,
    error,
    connected,
    analyticsState,
    reconnect,
  };
};
