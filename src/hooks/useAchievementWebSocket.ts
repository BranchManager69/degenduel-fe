import { useStore } from "../store/useStore";
import { useBaseWebSocket } from "./useBaseWebSocket";

interface AchievementMessage {
  type: "achievement:unlock" | "user:progress" | "user:levelup";
  data: any;
}

export const useAchievementWebSocket = () => {
  const { updateUserProgress, addAchievement, addCelebration } = useStore();

  const handleMessage = (message: AchievementMessage) => {
    switch (message.type) {
      case "achievement:unlock":
        addAchievement(message.data);
        break;
      case "user:progress":
        updateUserProgress(message.data);
        break;
      case "user:levelup":
        addCelebration({
          type: "level_up",
          data: message.data,
          timestamp: new Date().toISOString(),
        });
        break;
    }
  };

  return useBaseWebSocket({
    url: import.meta.env.VITE_WS_URL,
    endpoint: "/api/v2/ws/achievements",
    socketType: "achievements",
    onMessage: handleMessage,
    heartbeatInterval: 30000, // 30 second heartbeat
    maxReconnectAttempts: 5,
  });
};
