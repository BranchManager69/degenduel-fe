import { useEffect, useRef, useCallback } from "react";

import { useStore } from "../store/useStore";

interface WebSocketMetrics {
  totalConnections: number;
  activeSubscriptions: number;
  messageCount: number;
  errorCount: number;
  cacheHitRate: number;
  averageLatency: number;
  lastUpdate: string;
}

interface WebSocketPerformance {
  messageRate: number;
  errorRate: number;
  latencyTrend: number[];
}

interface WebSocketService {
  name: string;
  status: "operational" | "degraded" | "error";
  metrics: WebSocketMetrics;
  performance: WebSocketPerformance;
  config?: {
    maxMessageSize: number;
    rateLimit: number;
    requireAuth: boolean;
  };
}

interface WebSocketSystemHealth {
  status: "operational" | "degraded" | "error";
  activeConnections: number;
  messageRate: number;
  activeIncidents: number;
  lastUpdate: string;
}

interface WebSocketState {
  systemHealth: WebSocketSystemHealth;
  services: WebSocketService[];
}

// Add a global counter for tracking active WebSocket connections
window.DDActiveWebSockets = window.DDActiveWebSockets || {
  monitor: 0
};

export const useWebSocketMonitor = () => {
  const { setWebSocketState, addWebSocketAlert } = useStore();
  const reconnectTimeoutRef = useRef<number>();
  const reconnectAttempts = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    // Clean up any existing connection
    if (wsRef.current) {
      console.log('[WebSocketMonitor] Closing existing connection before reconnect');
      try {
        wsRef.current.close();
        
        // Update connection counter
        if (window.DDActiveWebSockets) {
          window.DDActiveWebSockets.monitor--;
          console.log(`[WebSocketMonitor] Active connections: ${window.DDActiveWebSockets.monitor}`);
        }
      } catch (e) {
        console.error('[WebSocketMonitor] Error closing existing connection:', e);
      }
      wsRef.current = null;
    }

    console.log('[WebSocketMonitor] Connecting to monitor WebSocket');
    
    try {
      const wsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/api/v69/ws/superadmin/monitor`;
      wsRef.current = new WebSocket(wsUrl);
      
      // Update connection counter
      if (window.DDActiveWebSockets) {
        window.DDActiveWebSockets.monitor++;
        console.log(`[WebSocketMonitor] Active connections: ${window.DDActiveWebSockets.monitor}`);
      }
      
      wsRef.current.onopen = () => {
        console.log('[WebSocketMonitor] Connected successfully');
        reconnectAttempts.current = 0;
        
        // Dispatch event for monitoring
        window.dispatchEvent(
          new CustomEvent("ws-debug", {
            detail: {
              type: "connection",
              socketType: "monitor",
              endpoint: "/api/v69/ws/superadmin/monitor",
              timestamp: new Date().toISOString(),
            },
          })
        );
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Dispatch debug event for debugging
          window.dispatchEvent(
            new CustomEvent("ws-debug", {
              detail: {
                type: "message",
                socketType: "monitor",
                endpoint: "/api/v69/ws/superadmin/monitor",
                data: data,
                timestamp: new Date().toISOString(),
              },
            })
          );

          switch (data.type) {
            case "system:health":
              setWebSocketState((prev) => ({
                ...prev,
                systemHealth: data.data,
              }));
              break;

            case "service:metrics":
              setWebSocketState((prev) => ({
                ...prev,
                services: prev.services.map((service) =>
                  service.name === data.service
                    ? {
                        ...service,
                        metrics: data.data.metrics,
                        performance: data.data.performance,
                        status: data.data.status,
                      }
                    : service,
                ),
              }));
              break;

            case "service:alert":
              addWebSocketAlert({
                type: data.data.severity,
                title: `${data.service} Alert`,
                message: data.data.message,
              });
              break;

            default:
              console.warn("[WebSocketMonitor] Unknown WebSocket message type:", data.type);
          }
        } catch (error) {
          console.error("[WebSocketMonitor] Error processing WebSocket message:", error);
          
          // Dispatch error event
          window.dispatchEvent(
            new CustomEvent("ws-debug", {
              detail: {
                type: "error",
                socketType: "monitor",
                endpoint: "/api/v69/ws/superadmin/monitor",
                data: { parseError: true, message: (error as Error).message },
                timestamp: new Date().toISOString(),
              },
            })
          );
        }
      };

      wsRef.current.onclose = (event) => {
        console.log(`[WebSocketMonitor] Connection closed with code ${event.code}`);
        
        // Update connection counter
        if (window.DDActiveWebSockets) {
          window.DDActiveWebSockets.monitor--;
          console.log(`[WebSocketMonitor] Active connections: ${window.DDActiveWebSockets.monitor}`);
        }
        
        // Dispatch close event
        window.dispatchEvent(
          new CustomEvent("ws-debug", {
            detail: {
              type: "close",
              socketType: "monitor",
              endpoint: "/api/v69/ws/superadmin/monitor",
              data: { code: event.code, reason: event.reason },
              timestamp: new Date().toISOString(),
            },
          })
        );

        // Clear any existing reconnect timeout
        if (reconnectTimeoutRef.current) {
          window.clearTimeout(reconnectTimeoutRef.current);
        }

        // Implement exponential backoff for reconnection
        const delay = Math.min(
          30000, // Max 30 seconds
          Math.pow(1.5, reconnectAttempts.current) * 1000
        );
        reconnectAttempts.current++;
        
        console.log(`[WebSocketMonitor] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
        reconnectTimeoutRef.current = window.setTimeout(connect, delay);
      };

      wsRef.current.onerror = (error) => {
        console.error("[WebSocketMonitor] WebSocket error:", error);
        
        // Dispatch error event
        window.dispatchEvent(
          new CustomEvent("ws-debug", {
            detail: {
              type: "error",
              socketType: "monitor",
              endpoint: "/api/v69/ws/superadmin/monitor",
              data: { error: "connection_error" },
              timestamp: new Date().toISOString(),
            },
          })
        );
        
        addWebSocketAlert({
          type: "error",
          title: "WebSocket Monitor Error",
          message: "Connection error occurred",
        });
      };
    } catch (error) {
      console.error("[WebSocketMonitor] Failed to create WebSocket:", error);
      
      // Schedule reconnect
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      
      const delay = Math.min(
        30000,
        Math.pow(1.5, reconnectAttempts.current) * 1000
      );
      reconnectAttempts.current++;
      
      console.log(`[WebSocketMonitor] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
      reconnectTimeoutRef.current = window.setTimeout(connect, delay);
    }
  }, [setWebSocketState, addWebSocketAlert]);
  
  // Function to manually close the WebSocket connection
  const close = useCallback(() => {
    console.log('[WebSocketMonitor] Manual close requested');
    
    // Clear any reconnect timeout
    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }
    
    // Close the WebSocket connection
    if (wsRef.current) {
      console.log('[WebSocketMonitor] Closing WebSocket connection');
      try {
        wsRef.current.close();
        
        // Update connection counter
        if (window.DDActiveWebSockets) {
          window.DDActiveWebSockets.monitor--;
          console.log(`[WebSocketMonitor] Active connections: ${window.DDActiveWebSockets.monitor}`);
        }
      } catch (e) {
        console.error('[WebSocketMonitor] Error during WebSocket close:', e);
      }
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    console.log('[WebSocketMonitor] Initializing monitor WebSocket hook');
    connect();

    // Cleanup function
    return () => {
      console.log('[WebSocketMonitor] Cleaning up monitor WebSocket');
      close();
    };
  }, [connect, close]);
  
  // Return API including the close method
  return {
    connect,    // Function to manually initiate connection
    close,      // Function to manually close connection
    wsRef,      // Reference to the WebSocket instance for advanced usage
  };
};

export type {
  WebSocketMetrics,
  WebSocketPerformance,
  WebSocketService,
  WebSocketSystemHealth,
  WebSocketState,
};
