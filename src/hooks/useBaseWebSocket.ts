import { useEffect, useRef } from "react";
import { useStore } from "../store/useStore";

export interface WebSocketConfig {
  url: string;
  endpoint: string;
  socketType: string;
  onMessage: (message: any) => void;
  onError?: (error: Error) => void;
  onReconnect?: () => void;
  heartbeatInterval?: number;
  maxReconnectAttempts?: number;
  reconnectBackoff?: boolean;
}

export type ServiceStatus = "online" | "offline" | "degraded" | "error";

export const useBaseWebSocket = (config: WebSocketConfig) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const { user } = useStore();

  const dispatchDebugEvent = (type: string, data?: any) => {
    window.dispatchEvent(
      new CustomEvent("ws-debug", {
        detail: {
          type,
          socketType: config.socketType,
          timestamp: new Date().toISOString(),
          data,
        },
      })
    );
  };

  useEffect(() => {
    if (!user?.session_token) {
      dispatchDebugEvent("error", { message: "No session token available" });
      return;
    }

    const connect = () => {
      const ws = new WebSocket(
        `${config.url}${config.endpoint}`,
        user.session_token
      );

      ws.onopen = () => {
        reconnectAttempts.current = 0;
        dispatchDebugEvent("connection");
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          dispatchDebugEvent("message", message);
          // Handle message will be implemented by child hooks
          if (typeof config.onMessage === "function") {
            config.onMessage(message);
          }
        } catch (error) {
          dispatchDebugEvent("error", { type: "parse_error", error });
        }
      };

      ws.onclose = () => {
        dispatchDebugEvent("close");
        handleReconnection();
      };

      ws.onerror = (error) => {
        dispatchDebugEvent("error", error);
      };

      wsRef.current = ws;
    };

    const handleReconnection = () => {
      if (reconnectAttempts.current < (config.maxReconnectAttempts || 5)) {
        const delay = Math.min(
          1000 * Math.pow(2, reconnectAttempts.current),
          30000
        );
        reconnectAttempts.current++;
        setTimeout(connect, delay);
        dispatchDebugEvent("reconnect", {
          attempt: reconnectAttempts.current,
          delay,
        });
      } else {
        dispatchDebugEvent("error", {
          type: "max_reconnect_attempts",
          attempts: reconnectAttempts.current,
        });
      }
    };

    connect();

    // Cleanup
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [config.url, config.endpoint, user?.session_token]);

  // Implement heartbeat if interval is specified
  useEffect(() => {
    if (!config.heartbeatInterval) return;

    const interval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "ping",
            timestamp: new Date().toISOString(),
          })
        );
        dispatchDebugEvent("heartbeat");
      }
    }, config.heartbeatInterval);

    return () => clearInterval(interval);
  }, [config.heartbeatInterval]);

  return wsRef.current;
};
