import { useBaseWebSocket } from "./useBaseWebSocket";
import { useStore } from "../store/useStore";

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

export const useAnalyticsWebSocket = () => {
  const { updateUserActivity, updateSystemMetrics, updateUserSegments } =
    useStore();

  const handleMessage = (message: AnalyticsMessage) => {
    switch (message.type) {
      case "user_activity_update":
        updateUserActivity(message.users);
        break;
      case "system_metrics":
        updateSystemMetrics(message.data);
        break;
      case "user_segment_update":
        updateUserSegments(message.data);
        break;
    }
  };

  return useBaseWebSocket({
    url: import.meta.env.VITE_WS_URL,
    endpoint: "/analytics",
    socketType: "analytics",
    onMessage: handleMessage,
    heartbeatInterval: 30000, // 30 second heartbeat
    maxReconnectAttempts: 5,
  });
};
