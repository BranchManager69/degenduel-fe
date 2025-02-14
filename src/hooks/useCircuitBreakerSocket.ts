import { useCallback, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { env } from "../config/env";
import { useStore } from "../store/useStore";

interface CircuitBreakerMessage {
  type:
    | "health:update"
    | "metrics:update"
    | "breaker:trip"
    | "breaker:reset"
    | "incident:ack"
    | "config:update";
  timestamp: string;
  service?: string;
  data: {
    services?: Array<{
      name: string;
      status: "healthy" | "degraded" | "failed";
      circuit: {
        state: "closed" | "open" | "half-open";
        failureCount: number;
        lastFailure: string | null;
        recoveryAttempts: number;
      };
      config?: {
        failureThreshold: number;
        recoveryTimeout: number;
        requestLimit: number;
      };
    }>;
    systemHealth?: {
      status: "operational" | "degraded" | "critical";
      activeIncidents: number;
      lastIncident: string | null;
    };
    metrics?: {
      requestRate: number;
      errorRate: number;
      responseTime: number;
      cpuUsage: number;
      memoryUsage: number;
      activeConnections: number;
    };
    incident?: {
      id: string;
      type: string;
      severity: "warning" | "critical";
      message: string;
      details?: Record<string, any>;
    };
  };
}

export const useCircuitBreakerSocket = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const { user, setCircuitBreakerState, addCircuitAlert } = useStore();

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message: CircuitBreakerMessage = JSON.parse(event.data);

        switch (message.type) {
          case "health:update":
            if (message.data.services) {
              setCircuitBreakerState({
                services: message.data.services,
                systemHealth: message.data.systemHealth,
              });
            }
            break;

          case "breaker:trip":
          case "breaker:reset":
            if (message.data.incident) {
              addCircuitAlert({
                type: message.type === "breaker:trip" ? "error" : "warning",
                title:
                  message.type === "breaker:trip"
                    ? "Circuit Breaker Tripped"
                    : "Circuit Breaker Reset",
                message: message.data.incident.message,
                details: message.data.incident.details,
              });
            }
            break;

          case "metrics:update":
            // Update performance metrics in store
            break;
        }
      } catch (error) {
        console.error("Failed to process circuit breaker message:", error);
      }
    },
    [setCircuitBreakerState, addCircuitAlert]
  );

  useEffect(() => {
    if (!user?.session_token) {
      console.log("[CircuitBreaker] No session token available");
      return;
    }

    const connect = () => {
      try {
        const wsUrl = `${env.WS_URL}/api/admin/circuit-breaker`;
        console.log("[CircuitBreaker] Connecting to:", wsUrl);

        const ws = new WebSocket(wsUrl, user.session_token);

        ws.onopen = () => {
          console.log("[CircuitBreaker] Connection established");
          reconnectAttempts.current = 0;

          // Send init message
          ws.send(
            JSON.stringify({
              type: "init",
              timestamp: new Date().toISOString(),
            })
          );
        };

        ws.onmessage = handleMessage;

        ws.onclose = (event) => {
          console.warn("[CircuitBreaker] Connection closed:", event.code);

          // Implement exponential backoff for reconnection
          if (reconnectAttempts.current < 5) {
            const delay = Math.min(
              1000 * Math.pow(2, reconnectAttempts.current),
              30000
            );
            reconnectAttempts.current++;

            console.log(
              `[CircuitBreaker] Reconnecting in ${delay}ms... (Attempt ${reconnectAttempts.current})`
            );
            setTimeout(connect, delay);
          } else {
            console.error("[CircuitBreaker] Max reconnection attempts reached");
            toast.error("Circuit breaker monitoring connection lost");
          }
        };

        ws.onerror = (error) => {
          console.error("[CircuitBreaker] WebSocket error:", error);
        };

        wsRef.current = ws;
      } catch (error) {
        console.error(
          "[CircuitBreaker] Failed to establish connection:",
          error
        );
      }
    };

    connect();

    // Cleanup
    return () => {
      if (wsRef.current) {
        console.log("[CircuitBreaker] Closing connection");
        wsRef.current.close();
      }
    };
  }, [user?.session_token, handleMessage]);

  // Heartbeat
  useEffect(() => {
    const interval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "ping",
            timestamp: new Date().toISOString(),
          })
        );
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return wsRef.current;
};
