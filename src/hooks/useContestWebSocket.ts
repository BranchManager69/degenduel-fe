import { useStore } from "../store/useStore";
import { useBaseWebSocket } from "./useBaseWebSocket";

interface ContestUpdate {
  type: "CONTEST_UPDATED";
  data: {
    contest_id: string;
    status: "active" | "completed" | "cancelled";
    current_round?: number;
    time_remaining?: number;
    total_participants: number;
    total_prize_pool: number;
  };
}

interface LeaderboardUpdate {
  type: "LEADERBOARD_UPDATED";
  data: {
    contest_id: string;
    leaderboard: Array<{
      rank: number;
      wallet_address: string;
      username: string;
      portfolio_value: number;
      performance: number;
      last_trade_time?: string;
    }>;
    timestamp: string;
  };
}

interface ParticipantActivity {
  type: "PARTICIPANT_ACTIVITY";
  data: {
    contest_id: string;
    wallet_address: string;
    username: string;
    activity_type: "join" | "leave" | "trade";
    details?: {
      symbol?: string;
      amount?: number;
      price?: number;
    };
    timestamp: string;
  };
}

type ContestMessage = ContestUpdate | LeaderboardUpdate | ParticipantActivity;

export const useContestWebSocket = (contestId: string) => {
  const { updateContest, updateLeaderboard, addContestActivity } = useStore();

  const handleMessage = (message: ContestMessage) => {
    switch (message.type) {
      case "CONTEST_UPDATED":
        updateContest(message.data);
        break;
      case "LEADERBOARD_UPDATED":
        updateLeaderboard(message.data);
        break;
      case "PARTICIPANT_ACTIVITY":
        addContestActivity(message.data);
        break;
    }
  };

  return useBaseWebSocket({
    url: import.meta.env.VITE_WS_URL,
    endpoint: `/api/v2/ws/contest/${contestId}`,
    socketType: "contest",
    onMessage: handleMessage,
    heartbeatInterval: 30000, // 30 second heartbeat
    maxReconnectAttempts: 5,
  });
};
