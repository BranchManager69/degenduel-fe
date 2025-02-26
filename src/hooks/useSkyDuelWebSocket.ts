import { useRef } from "react";
import { useStore } from "../store/useStore";
import { useBaseWebSocket } from "./useBaseWebSocket";

// SkyDuel service types
export interface ServiceNode {
  id: string;
  name: string;
  type: "api" | "worker" | "websocket" | "database" | "cache";
  status: "online" | "offline" | "degraded" | "restarting";
  health: number; // 0-100
  uptime: number; // seconds
  lastRestart: string | null;
  metrics: {
    cpu: number; // percentage
    memory: number; // percentage
    connections: number;
    requestsPerMinute: number;
    errorRate: number;
  };
  alerts: ServiceAlert[];
}

export interface ServiceAlert {
  id: string;
  severity: "info" | "warning" | "error" | "critical";
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface ServiceConnection {
  source: string;
  target: string;
  status: "active" | "degraded" | "failed";
  latency: number; // milliseconds
  throughput: number; // requests per second
}

interface SkyDuelState {
  nodes: ServiceNode[];
  connections: ServiceConnection[];
  systemStatus: {
    overall: "operational" | "degraded" | "outage";
    timestamp: string;
    message: string;
  };
}

// WebSocket message types
interface SkyDuelMessage {
  type: "state_update" | "node_update" | "connection_update" | "alert" | "command_response";
  data: any;
  timestamp: string;
}

// Helper function for dispatching debug events
const dispatchDebugEvent = (
  type: "connection" | "state" | "alert" | "error" | "metrics" | "command",
  message: string,
  data?: any
) => {
  window.dispatchEvent(
    new CustomEvent("ws-debug", {
      detail: {
        type,
        service: "skyduel-websocket",
        message,
        data,
        timestamp: new Date().toISOString(),
      },
    })
  );
};

export const useSkyDuelWebSocket = () => {
  const { setSkyDuelState, addServiceAlert } = useStore();
  const reconnectAttempts = useRef(0);
  const maxReconnectDelay = 30000; // 30 seconds

  const handleConnectionError = (error: Error) => {
    console.warn("[SkyDuelWebSocket] Connection error:", error);

    // Calculate exponential backoff delay
    const delay = Math.min(
      1000 * Math.pow(2, reconnectAttempts.current),
      maxReconnectDelay
    );
    reconnectAttempts.current++;

    addServiceAlert(
      "error",
      `SkyDuel WebSocket connection lost. Retrying in ${Math.round(
        delay / 1000
      )} seconds...`
    );

    dispatchDebugEvent("error", "Connection error", { error: error.message });
  };

  const handleReconnect = () => {
    reconnectAttempts.current = 0;
    addServiceAlert("info", "SkyDuel WebSocket connection restored");
    dispatchDebugEvent("connection", "Connection restored");
  };

  const handleMessage = (message: SkyDuelMessage) => {
    try {
      dispatchDebugEvent("state", "Received SkyDuel message", message);

      switch (message.type) {
        case "state_update":
          const skyDuelState = message.data as SkyDuelState;
          setSkyDuelState(skyDuelState);
          dispatchDebugEvent("state", "SkyDuel state updated", skyDuelState);
          break;
          
        case "node_update":
          dispatchDebugEvent("state", "Node update received", message.data);
          // We'll handle individual node updates in the store
          break;
          
        case "connection_update":
          dispatchDebugEvent("state", "Connection update received", message.data);
          // We'll handle individual connection updates in the store
          break;
          
        case "alert":
          if (message.data.alert) {
            const { severity, content } = message.data.alert;
            addServiceAlert(severity, content);
            dispatchDebugEvent("alert", "SkyDuel alert received", message.data.alert);
          }
          break;
          
        case "command_response":
          dispatchDebugEvent("command", "Command response received", message.data);
          break;
      }
    } catch (error) {
      console.error("[SkyDuelWebSocket] Error processing message:", error);
      addServiceAlert("error", "Error processing SkyDuel WebSocket message");
      dispatchDebugEvent("error", "Message processing error", { error });
    }
  };

  // Send a command to the SkyDuel system
  const sendCommand = (command: string, params: Record<string, any> = {}) => {
    const socket = websocket.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error("[SkyDuelWebSocket] Cannot send command: socket not connected");
      return false;
    }
    
    try {
      const commandMessage = {
        type: "command",
        command,
        params,
        timestamp: new Date().toISOString()
      };
      
      socket.send(JSON.stringify(commandMessage));
      dispatchDebugEvent("command", `Command sent: ${command}`, { command, params });
      return true;
    } catch (error) {
      console.error("[SkyDuelWebSocket] Error sending command:", error);
      dispatchDebugEvent("error", "Error sending command", { command, params, error });
      return false;
    }
  };

  const websocket = useBaseWebSocket({
    url: import.meta.env.VITE_WS_URL,
    endpoint: "/api/admin/skyduel",
    socketType: "skyduel",
    onMessage: handleMessage,
    onError: handleConnectionError,
    onReconnect: handleReconnect,
    heartbeatInterval: 15000, // 15 second heartbeat
    maxReconnectAttempts: 10,
    reconnectBackoff: true,
  });

  return {
    ...websocket,
    sendCommand,
  };
};