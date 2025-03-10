import { useStore } from "../store/useStore";
import { useBaseWebSocket } from "./useBaseWebSocket";

interface CircuitBreakerMessage {
  type: "health:update" | "metrics:update" | "breaker:trip" | "breaker:reset";
  service: string;
  data: {
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
    metrics?: {
      failureRate: number;
      latency: number;
      throughput: number;
    };
    error?: string;
  };
  timestamp: string;
}

export const useCircuitBreakerSocket = () => {
  const { setCircuitBreakerState, addCircuitAlert } = useStore();

  const handleMessage = (message: CircuitBreakerMessage) => {
    switch (message.type) {
      case "health:update":
      case "metrics:update":
        setCircuitBreakerState({
          services: [
            {
              name: message.service,
              status: message.data.status,
              circuit: message.data.circuit,
              config: message.data.config,
            },
          ],
        });
        break;
      case "breaker:trip":
        addCircuitAlert({
          type: "error",
          title: `Circuit Breaker Tripped - ${message.service}`,
          message: message.data.error || "Service protection activated",
          details: message.data,
        });
        break;
      case "breaker:reset":
        addCircuitAlert({
          type: "info",
          title: `Circuit Breaker Reset - ${message.service}`,
          message: "Service protection deactivated",
          details: message.data,
        });
        break;
    }
  };

  return useBaseWebSocket({
    url: import.meta.env.VITE_WS_URL,
    endpoint: "/api/v69/ws/circuit-breaker",
    socketType: "circuit-breaker",
    onMessage: handleMessage,
    heartbeatInterval: 15000, // 15 second heartbeat
    maxReconnectAttempts: 5,
  });
};
