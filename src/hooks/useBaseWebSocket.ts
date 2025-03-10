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
    // Add more detailed logging for debugging purposes
    console.log(`[WebSocket:${config.socketType}] [${type}]`, {
      endpoint: config.endpoint,
      timestamp: new Date().toISOString(),
      ...data
    });
    
    // Also dispatch event for potential WebSocket monitoring tools
    window.dispatchEvent(
      new CustomEvent("ws-debug", {
        detail: {
          type,
          socketType: config.socketType,
          endpoint: config.endpoint,
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
      // Determine the WebSocket URL based on the current domain
      let baseWsUrl;
      
      // Check if we're on the production domain
      const isProdDomain = window.location.hostname === "degenduel.me";
      
      if (isProdDomain) {
        // In production on the main domain, use the same domain for WebSockets
        baseWsUrl = `wss://${window.location.hostname}`;
      } else if (config.url) {
        // Use the provided URL from config (for dev environments)
        baseWsUrl = config.url;
      } else {
        // Fallback to current host
        baseWsUrl = `wss://${window.location.host}`;
      }
      
      console.log(`[WebSocket:${config.socketType}] [Connecting] [URL: ${baseWsUrl}${config.endpoint}] [Token available: ${!!user.session_token}]`);
      
      // Create the WebSocket connection with token as subprotocol
      const ws = new WebSocket(
        `${baseWsUrl}${config.endpoint}`,
        user.session_token
      );

      ws.onopen = () => {
        reconnectAttempts.current = 0;
        console.log(`[WebSocket:${config.socketType}] [Connected] [${config.endpoint}]`);
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

      ws.onclose = (event) => {
        console.log(`[WebSocket:${config.socketType}] [Closed] [${config.endpoint}] [Code: ${event.code}] [Reason: ${event.reason || 'No reason provided'}]`);
        dispatchDebugEvent("close", { code: event.code, reason: event.reason });
        handleReconnection();
      };

      ws.onerror = (error) => {
        console.error(`[WebSocket:${config.socketType}] [Error] [${config.endpoint}]`, error);
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

  // Public API
  const connect = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    reconnectAttempts.current = 0;
    // Implementation is handled in the useEffect
  };

  const close = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const getStatus = (): ServiceStatus => {
    if (!wsRef.current) return "offline";
    
    switch (wsRef.current.readyState) {
      case WebSocket.CONNECTING: return "degraded";
      case WebSocket.OPEN: return "online";
      case WebSocket.CLOSING: 
      case WebSocket.CLOSED:
      default:
        return "offline";
    }
  };

  return {
    wsRef,
    status: getStatus(),
    connect,
    close
  };
};
