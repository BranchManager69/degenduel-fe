import { useEffect, useRef, useState } from "react";
import { useWebSocketContext } from "../../../contexts/WebSocketContext";
import { useStore } from "../../../store/useStore";
import { ConnectionState } from "../../websocket/types";
import { useInterval } from "../useInterval";

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

// Enhanced monitor interface with authentication status
export interface WebSocketMonitorData {
  // Connection status
  isConnected: boolean;
  connectionState: string | null;
  
  // Authentication status
  isAuthenticated: boolean;
  isAuthError: boolean;
  authErrorMessage: string | null;
  
  // Message statistics
  messageCount: number;
  errorCount: number;
  messageRatePerSecond: number;
  
  // Performance
  latency: number;
  lastActivityTime: Date | null;
}

/**
 * WebSocket monitoring hook with performance optimizations
 * 
 * This hook now properly uses the WebSocketContext instead of
 * modifying WebSocket prototype methods, which was causing
 * issues with the tracking system
 */
export const useWebSocketMonitor = (): WebSocketMonitorData => {
  // Display deprecation warning
  useEffect(() => {
    console.warn(
      "⚠️ DEPRECATED: useWebSocketMonitor is deprecated and will be removed in a future version.\n" +
      "Please use the hooks/websocket/topic-hooks/ components for WebSocket monitoring."
    );
  }, []);

  const store = useStore();
  const { setWebSocketState, addWebSocketAlert } = store;
  const webSocketState = store.webSocket;
  
  // Get context connection state from unified WebSocket system
  const webSocketContext = useWebSocketContext();
  
  // Local state for UI monitoring
  const [messageCount, setMessageCount] = useState(0);
  const [prevMessageCount, setPrevMessageCount] = useState(0);
  const [messageRate, setMessageRate] = useState(0);
  const [lastActivity, setLastActivity] = useState<Date | null>(null);
  const [isAuthError, setIsAuthError] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);
  
  // Track if we've already set up the event listeners
  const listenerSetupRef = useRef(false);
  
  // Message tracking via event listeners instead of prototype modification
  useEffect(() => {
    if (listenerSetupRef.current) return;
    listenerSetupRef.current = true;
    
    // Use custom events for tracking instead of prototype modifications
    const handleWsEvent = (event: CustomEvent) => {
      const { type, data } = event.detail;
      
      // Track messages
      if (type === 'message' || type === 'sent') {
        setMessageCount(prev => prev + 1);
        setLastActivity(new Date());
      }
      
      // Track auth errors
      if (type === 'error' && data) {
        const errorData = data;
        if (
          (errorData.code === 4011 || errorData.code === 4401) || 
          (errorData.error && typeof errorData.error === 'string' && errorData.error.includes('auth')) || 
          (errorData.message && typeof errorData.message === 'string' && errorData.message.includes('auth'))
        ) {
          setIsAuthError(true);
          setAuthErrorMessage(
            typeof errorData.message === 'string' ? errorData.message : 'Authentication failed'
          );
        }
      }
      
      // Reset auth errors when authenticated
      if (type === 'authenticated') {
        setIsAuthError(false);
        setAuthErrorMessage(null);
      }
    };
    
    // Register for WebSocket events
    window.addEventListener('ws-debug', handleWsEvent as EventListener);
    
    // Cleanup
    return () => {
      window.removeEventListener('ws-debug', handleWsEvent as EventListener);
    };
  }, []);
  
  // Calculate message rate per second (updated every second)
  useInterval(() => {
    const newRate = messageCount - prevMessageCount;
    setMessageRate(newRate);
    setPrevMessageCount(messageCount);
  }, 1000);
  
  // Connect to monitoring WebSocket if available (only for superadmins)
  useEffect(() => {
    // Only attempt to connect if user is superadmin
    const user = store.user;
    if (!user?.is_superadmin) return;
    
    let ws: WebSocket | null = null;
    let connectAttempts = 0;
    const MAX_CONNECT_ATTEMPTS = 3;

    const connect = () => {
      if (connectAttempts >= MAX_CONNECT_ATTEMPTS) {
        console.warn("Giving up on monitoring WebSocket after multiple failed attempts");
        return;
      }
      
      try {
        connectAttempts++;
        ws = new WebSocket(
          `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/api/superadmin/ws/monitor`,
        );

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

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
                
              case "auth:status":
                if (data.status === "authenticated") {
                  setIsAuthError(false);
                  setAuthErrorMessage(null);
                } else if (data.status === "error") {
                  setIsAuthError(true);
                  setAuthErrorMessage(data.message || "Authentication failed");
                }
                break;

              default:
                // Skip warning in production for unknown message types
                if (process.env.NODE_ENV !== "production") {
                  console.warn("Unknown WebSocket message type:", data.type);
                }
            }
          } catch (error) {
            // Only log errors in development
            if (process.env.NODE_ENV !== "production") {
              console.error("Error processing WebSocket message:", error);
            }
          }
        };

        ws.onclose = () => {
          // Only attempt reconnect if we haven't exceeded our limit
          if (connectAttempts < MAX_CONNECT_ATTEMPTS) {
            // Exponential backoff: 5s, 10s, 20s
            const reconnectDelay = Math.min(5000 * Math.pow(2, connectAttempts - 1), 20000);
            setTimeout(connect, reconnectDelay);
          }
        };

        ws.onerror = (error) => {
          if (process.env.NODE_ENV !== "production") {
            console.error("Monitoring WebSocket error:", error);
          }
          // Only show alerts to superadmins in development
          if (process.env.NODE_ENV !== "production" && user?.is_superadmin) {
            addWebSocketAlert({
              type: "error",
              title: "Monitoring WebSocket Error",
              message: "Connection error occurred"
            });
          }
        };
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Failed to connect to monitoring WebSocket:", error);
        }
      }
    };

    // Only try to connect if we're not in test mode
    if (process.env.NODE_ENV !== "test") {
      connect();
    }

    // Cleanup
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [store.user]);
  
  // Map the context connection state to our monitoring state
  const getContextConnectionState = () => {
    // Use the context connection state if available
    if (webSocketContext) {
      switch (webSocketContext.connectionState) {
        case ConnectionState.CONNECTED:
          return "connected";
        case ConnectionState.AUTHENTICATED:
          return "authenticated";
        case ConnectionState.CONNECTING:
        case ConnectionState.AUTHENTICATING:
          return "connecting";
        case ConnectionState.RECONNECTING:
          return "reconnecting";
        case ConnectionState.ERROR:
          return "error";
        case ConnectionState.DISCONNECTED:
        default:
          return "disconnected";
      }
    }
    
    // Fall back to the legacy system health status
    return webSocketState?.systemHealth?.status === "operational" 
      ? "connected" 
      : webSocketState?.systemHealth?.status === "degraded"
      ? "degraded"
      : webSocketState?.systemHealth?.status === "error"
      ? "error"
      : null;
  };
  
  // Determine if authenticated based on the context
  const isAuthenticatedFromContext = () => {
    // First check the WebSocketContext
    if (webSocketContext) {
      return webSocketContext.isAuthenticated;
    }
    
    // Then fall back to our tracked auth error state
    return !isAuthError;
  };
  
  // Create the monitor data object to return
  const connectionStateValue = getContextConnectionState();
  const monitorData: WebSocketMonitorData = {
    isConnected: connectionStateValue === "connected" || connectionStateValue === "authenticated",
    connectionState: connectionStateValue,
    isAuthenticated: isAuthenticatedFromContext(),
    isAuthError,
    authErrorMessage,
    messageCount,
    errorCount: webSocketState?.systemHealth?.activeIncidents || 0,
    messageRatePerSecond: messageRate,
    latency: webSocketState?.systemHealth?.messageRate || 0,
    lastActivityTime: lastActivity
  };
  
  return monitorData;
};

// Re-export types
export type {
  WebSocketMetrics,
  WebSocketPerformance,
  WebSocketService, WebSocketState, WebSocketSystemHealth
};

