import { useCallback, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { env } from "../config/env";
import { useStore } from "../store/useStore";

interface ServiceEvent {
  type: "service:state" | "service:metrics" | "service:alert";
  service: string;
  data: any;
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
  status: "active" | "stopped" | "error"
): "online" | "offline" | "degraded" => {
  const mapped = (() => {
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
  })();
  console.log(
    `[ServiceWebSocket] Mapped service status: ${status} -> ${mapped}`
  );
  return mapped;
};

// Map alert severity to store alert type
const mapAlertType = (severity: string): "info" | "warning" | "error" => {
  const mapped = (() => {
    switch (severity) {
      case "critical":
        return "error";
      case "warning":
        return "warning";
      case "info":
        return "info";
      default:
        return "info";
    }
  })();
  console.log(
    `[ServiceWebSocket] Mapped alert severity: ${severity} -> ${mapped}`
  );
  return mapped;
};

// Add helper function for dispatching debug events
const dispatchDebugEvent = (
  type: "connection" | "state" | "alert" | "error" | "metrics",
  message: string,
  data?: any
) => {
  window.dispatchEvent(
    new CustomEvent("serviceWebSocket", {
      detail: { type, message, data },
    })
  );
};

export const useServiceWebSocket = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const { user, setServiceState, addServiceAlert } = useStore();

  const handleServiceState = useCallback(
    (service: string, state: ServiceState) => {
      console.log(
        `[ServiceWebSocket] Handling service state update for ${service}:`,
        state
      );

      const mappedStatus = mapServiceStatus(state.status);
      const metrics = {
        uptime: state.last_started
          ? Date.now() - new Date(state.last_started).getTime()
          : 0,
        latency: state.stats.performance.averageOperationTimeMs,
        activeUsers: state.stats.operations.total,
      };

      console.log(`[ServiceWebSocket] Setting service state:`, {
        status: mappedStatus,
        metrics,
      });

      setServiceState(mappedStatus, metrics);

      // Show toast for critical state changes
      if (state.status === "error") {
        console.log(
          `[ServiceWebSocket] Service error detected:`,
          state.last_error
        );
        toast.error(
          `Service ${service} encountered an error: ${state.last_error}`
        );
      } else if (state.stats?.circuitBreaker?.isOpen) {
        console.log(`[ServiceWebSocket] Circuit breaker opened for ${service}`);
        toast.warning(`Circuit breaker opened for ${service}`);
      }
    },
    [setServiceState]
  );

  const handleServiceAlert = useCallback(
    (_service: string, alert: any) => {
      console.log(`[ServiceWebSocket] Handling service alert:`, alert);

      const mappedType = mapAlertType(alert.severity);
      console.log(`[ServiceWebSocket] Adding service alert:`, {
        type: mappedType,
        message: alert.message,
      });

      addServiceAlert(mappedType, alert.message);

      // Show toast for alerts based on severity
      console.log(
        `[ServiceWebSocket] Showing toast for severity: ${alert.severity}`
      );
      switch (alert.severity) {
        case "critical":
          toast.error(alert.message);
          break;
        case "warning":
          toast.warning(alert.message);
          break;
        case "info":
          toast.info(alert.message);
          break;
      }
    },
    [addServiceAlert]
  );

  useEffect(() => {
    if (!user?.session_token) {
      console.log(
        "[ServiceWebSocket] No session token available, skipping connection"
      );
      dispatchDebugEvent("connection", "No session token available");
      return;
    }

    const connect = () => {
      const wsUrl = `${env.WS_URL}/api/admin/services`;
      console.log(`[ServiceWebSocket] Attempting connection to ${wsUrl}`);
      dispatchDebugEvent("connection", "Attempting connection", { url: wsUrl });

      const ws = new WebSocket(wsUrl, user.session_token);

      ws.onopen = () => {
        console.log("[ServiceWebSocket] Connection established successfully");
        dispatchDebugEvent("connection", "Connection established successfully");
        reconnectAttempts.current = 0;
        toast.info("Service monitoring connected", {
          toastId: "service-ws-connected",
        });
      };

      ws.onmessage = (event) => {
        try {
          console.log("[ServiceWebSocket] Message received:", event.data);
          const data: ServiceEvent = JSON.parse(event.data);
          dispatchDebugEvent("metrics", "Message received", data);

          switch (data.type) {
            case "service:state":
              handleServiceState(data.service, data.data);
              break;
            case "service:metrics":
              const currentStatus = mapServiceStatus(
                data.data.status || "active"
              );
              console.log("[ServiceWebSocket] Updating metrics:", {
                status: currentStatus,
                metrics: data.data,
              });
              dispatchDebugEvent("metrics", "Metrics updated", {
                status: currentStatus,
                metrics: data.data,
              });
              setServiceState(currentStatus, {
                uptime: data.data.uptime || 0,
                latency: data.data.latency || 0,
                activeUsers: data.data.activeUsers || 0,
              });
              break;
            case "service:alert":
              handleServiceAlert(data.service, data.data);
              break;
          }
        } catch (error) {
          console.error("[ServiceWebSocket] Failed to handle message:", error);
          console.error("[ServiceWebSocket] Raw message data:", event.data);
          dispatchDebugEvent("error", "Failed to handle message", {
            error: error instanceof Error ? error.message : "Unknown error",
            rawData: event.data,
          });
        }
      };

      ws.onclose = (event) => {
        reconnectAttempts.current++;
        const delay = Math.min(
          1000 * Math.pow(2, reconnectAttempts.current),
          30000
        );
        const message = `Connection closed. Attempt ${reconnectAttempts.current}. Reconnecting in ${delay}ms...`;
        console.log(`[ServiceWebSocket] ${message}`, event);
        dispatchDebugEvent("connection", message, {
          attempt: reconnectAttempts.current,
          delay,
          code: event.code,
          reason: event.reason,
        });
        toast.warning("Service monitoring disconnected. Reconnecting...", {
          toastId: "service-ws-disconnected",
        });
        setTimeout(connect, delay);
      };

      ws.onerror = (error) => {
        console.error("[ServiceWebSocket] WebSocket error:", error);
        dispatchDebugEvent("error", "WebSocket error occurred", error);
      };

      wsRef.current = ws;
    };

    connect();

    return () => {
      if (wsRef.current) {
        console.log("[ServiceWebSocket] Cleaning up WebSocket connection");
        dispatchDebugEvent("connection", "Cleaning up WebSocket connection");
        wsRef.current.close();
      }
    };
  }, [
    user?.session_token,
    handleServiceState,
    handleServiceAlert,
    setServiceState,
  ]);

  return wsRef.current;
};
