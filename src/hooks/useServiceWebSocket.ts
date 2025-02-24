import { useRef } from "react";
import { useStore } from "../store/useStore";
import { useBaseWebSocket } from "./useBaseWebSocket";

interface ServiceMessage {
  type: "service:state" | "service:metrics" | "service:alert";
  service: string;
  data: {
    status: string;
    metrics?: {
      uptime: number;
      latency: number;
      activeUsers: number;
    };
    alert?: {
      type: "info" | "warning" | "error";
      message: string;
    };
  };
  timestamp: string;
}

interface ServiceState {
  enabled: boolean;
  status: "active" | "stopped" | "error";
  last_started: string | null;
  last_stopped: string | null;
  last_error: string | null;
  stats: {
    operations: {
      total: number;
      successful: number;
      failed: number;
    };
    performance: {
      averageOperationTimeMs: number;
    };
    circuitBreaker?: {
      failures: number;
      isOpen: boolean;
      lastFailure: string | null;
    };
  };
}

// Map service status to store status
const mapServiceStatus = (
  status: ServiceState["status"]
): "online" | "offline" | "degraded" => {
  switch (status) {
    case "active":
      return "online";
    case "stopped":
      return "offline";
    case "error":
      return "degraded";
    default:
      return "offline";
  }
};

// Map alert severity to store alert type
const mapAlertType = (severity: string): "info" | "warning" | "error" => {
  switch (severity) {
    case "critical":
      return "error";
    case "warning":
      return "warning";
    default:
      return "info";
  }
};

// Add helper function for dispatching debug events
const dispatchDebugEvent = (
  type: "connection" | "state" | "alert" | "error" | "metrics",
  message: string,
  data?: any
) => {
  window.dispatchEvent(
    new CustomEvent("ws-debug", {
      detail: {
        type,
        service: "service-websocket",
        message,
        data,
        timestamp: new Date().toISOString(),
      },
    })
  );
};

export const useServiceWebSocket = () => {
  const { setServiceState, addServiceAlert } = useStore();
  const reconnectAttempts = useRef(0);
  const maxReconnectDelay = 30000; // 30 seconds

  const handleConnectionError = (error: Error) => {
    console.warn("[ServiceWebSocket] Connection error:", error);

    // Calculate exponential backoff delay
    const delay = Math.min(
      1000 * Math.pow(2, reconnectAttempts.current),
      maxReconnectDelay
    );
    reconnectAttempts.current++;

    addServiceAlert(
      "error",
      `WebSocket connection lost. Retrying in ${Math.round(
        delay / 1000
      )} seconds...`
    );

    // Update service state to show disconnected status
    setServiceState("offline", {
      uptime: 0,
      latency: -1,
      activeUsers: 0,
    });
  };

  const handleReconnect = () => {
    reconnectAttempts.current = 0;
    addServiceAlert("info", "WebSocket connection restored");
  };

  const handleMessage = (message: ServiceMessage) => {
    try {
      dispatchDebugEvent("state", "Received service message", message);

      switch (message.type) {
        case "service:state": {
          const serviceState = message.data as ServiceState;
          const mappedStatus = mapServiceStatus(serviceState.status);

          dispatchDebugEvent(
            "state",
            `Service status mapped: ${serviceState.status} -> ${mappedStatus}`,
            { original: serviceState.status, mapped: mappedStatus }
          );

          setServiceState(
            mappedStatus,
            message.data.metrics || {
              uptime: 0,
              latency: 0,
              activeUsers: 0,
            }
          );
          break;
        }
        case "service:alert":
          if (message.data.alert) {
            const mappedType = mapAlertType(message.data.alert.type);

            dispatchDebugEvent(
              "alert",
              `Service alert mapped: ${message.data.alert.type} -> ${mappedType}`,
              { original: message.data.alert.type, mapped: mappedType }
            );

            addServiceAlert(mappedType, message.data.alert.message);
          }
          break;
        case "service:metrics":
          dispatchDebugEvent(
            "metrics",
            "Received service metrics",
            message.data.metrics
          );
          break;
      }
    } catch (error) {
      console.error("[ServiceWebSocket] Error processing message:", error);
      addServiceAlert("error", "Error processing WebSocket message");
    }
  };

  return useBaseWebSocket({
    url: import.meta.env.VITE_WS_URL,
    endpoint: "/api/admin/services",
    socketType: "service",
    onMessage: handleMessage,
    onError: handleConnectionError,
    onReconnect: handleReconnect,
    heartbeatInterval: 30000, // 30 second heartbeat
    maxReconnectAttempts: 10,
    reconnectBackoff: true,
  });
};
