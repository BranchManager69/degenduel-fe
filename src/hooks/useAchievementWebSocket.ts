import { useBaseWebSocket } from "./useBaseWebSocket";
import { useStore } from "../store/useStore";
import { SOCKET_TYPES, WEBSOCKET_ENDPOINTS } from "./websocket/types";
import { WS_URL } from "../config/config";

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
    url: WS_URL,
    endpoint: WEBSOCKET_ENDPOINTS.ACHIEVEMENT,
    socketType: SOCKET_TYPES.ACHIEVEMENT,
    onMessage: handleMessage,
    heartbeatInterval: 30000, // 30 second heartbeat
    maxReconnectAttempts: 5,
  });
};
