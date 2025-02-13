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
    case "info":
      return "info";
    default:
      return "info";
  }
};

export const useServiceWebSocket = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const { user, setServiceState, addServiceAlert } = useStore();

  const handleServiceState = useCallback(
    (service: string, state: ServiceState) => {
      const mappedStatus = mapServiceStatus(state.status);
      const metrics = {
        uptime: state.last_started
          ? Date.now() - new Date(state.last_started).getTime()
          : 0,
        latency: state.stats.performance.averageOperationTimeMs,
        activeUsers: state.stats.operations.total,
      };

      setServiceState(mappedStatus, metrics);

      // Show toast for critical state changes
      if (state.status === "error") {
        toast.error(
          `Service ${service} encountered an error: ${state.last_error}`
        );
      } else if (state.stats?.circuitBreaker?.isOpen) {
        toast.warning(`Circuit breaker opened for ${service}`);
      }
    },
    [setServiceState]
  );

  const handleServiceAlert = useCallback(
    (_service: string, alert: any) => {
      const mappedType = mapAlertType(alert.severity);
      addServiceAlert(mappedType, alert.message);

      // Show toast for alerts based on severity
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
    if (!user?.session_token) return;

    const connect = () => {
      const ws = new WebSocket(
        `${env.WS_URL}/api/admin/services`,
        user.session_token
      );

      ws.onopen = () => {
        console.log("Service WebSocket connected");
      };

      ws.onmessage = (event) => {
        try {
          const data: ServiceEvent = JSON.parse(event.data);

          switch (data.type) {
            case "service:state":
              handleServiceState(data.service, data.data);
              break;
            case "service:metrics":
              // Update service metrics in store with mapped status
              const currentStatus = mapServiceStatus(
                data.data.status || "active"
              );
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
          console.error("Failed to handle WebSocket message:", error);
        }
      };

      ws.onclose = () => {
        console.log("Service WebSocket disconnected. Reconnecting...");
        setTimeout(connect, 3000);
      };

      ws.onerror = (error) => {
        console.error("Service WebSocket error:", error);
      };

      wsRef.current = ws;
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user?.session_token, handleServiceState, handleServiceAlert]);

  return wsRef.current;
};
