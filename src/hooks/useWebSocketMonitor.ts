import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { useInterval } from "./useInterval";

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

export const useWebSocketMonitor = (): WebSocketMonitorData => {
  const store = useStore();
  const { setWebSocketState, addWebSocketAlert } = store;
  const webSocketState = store.webSocket;
  
  // Local state for UI monitoring
  const [messageCount, setMessageCount] = useState(0);
  const [prevMessageCount, setPrevMessageCount] = useState(0);
  const [messageRate, setMessageRate] = useState(0);
  const [lastActivity, setLastActivity] = useState<Date | null>(null);
  const [isAuthError, setIsAuthError] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);
  
  // Message tracking
  useEffect(() => {
    // Access global message event listeners to track all WS activity
    const originalSend = WebSocket.prototype.send;
    const originalAddEventListener = WebSocket.prototype.addEventListener;
    
    // Track message count
    let localMessageCount = 0;
    let localErrorCount = 0;
    
    // Override addEventListener to track message events
    // Using type 'any' here is necessary for the proper overriding of the native method
    WebSocket.prototype.addEventListener = function(
      type: string, 
      listener: EventListenerOrEventListenerObject, 
      options?: boolean | AddEventListenerOptions
    ): void {
      if (type === 'message') {
        const wrappedListener = function(this: WebSocket, event: Event) {
          // Track all message events
          localMessageCount++;
          setMessageCount(prev => prev + 1);
          setLastActivity(new Date());
          
          // Track auth errors
          try {
            const messageEvent = event as MessageEvent;
            const data = JSON.parse(messageEvent.data as string);
            if (
              (data.code === 4011) || 
              (data.error && typeof data.error === 'string' && data.error.includes('auth')) || 
              (data.message && typeof data.message === 'string' && data.message.includes('auth'))
            ) {
              setIsAuthError(true);
              setAuthErrorMessage(
                typeof data.message === 'string' ? data.message : 'Authentication failed'
              );
            }
          } catch (e) {
            // Not JSON or other parsing error, ignore
          }
          
          // Call original listener
          if (typeof listener === 'function') {
            listener.call(this, event);
          } else if (listener && typeof listener.handleEvent === 'function') {
            listener.handleEvent(event);
          }
        };
        return originalAddEventListener.call(this, type, wrappedListener, options);
      }
      
      // Handle error events
      if (type === 'error') {
        const wrappedListener = function(this: WebSocket, event: Event) {
          localErrorCount++;
          if (typeof listener === 'function') {
            listener.call(this, event);
          } else if (listener && typeof listener.handleEvent === 'function') {
            listener.handleEvent(event);
          }
        };
        return originalAddEventListener.call(this, type, wrappedListener, options);
      }
      
      return originalAddEventListener.call(this, type, listener, options);
    };
    
    // Override send to track outgoing messages
    WebSocket.prototype.send = function(this: WebSocket, data: string | ArrayBufferLike | Blob | ArrayBufferView) {
      // Record activity time when sending messages
      setLastActivity(new Date());
      return originalSend.call(this, data);
    };
    
    // Restore original methods on cleanup
    return () => {
      WebSocket.prototype.addEventListener = originalAddEventListener;
      WebSocket.prototype.send = originalSend;
    };
  }, []);
  
  // Calculate message rate per second (updated every second)
  useInterval(() => {
    const newRate = messageCount - prevMessageCount;
    setMessageRate(newRate);
    setPrevMessageCount(messageCount);
  }, 1000);
  
  // Connect to monitoring WebSocket if available
  useEffect(() => {
    let ws: WebSocket | null = null;

    const connect = () => {
      try {
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
                if (process.env.NODE_ENV !== "production") {
                  console.warn("Unknown WebSocket message type:", data.type);
                }
            }
          } catch (error) {
            if (process.env.NODE_ENV !== "production") {
              console.error("Error processing WebSocket message:", error);
            }
          }
        };

        ws.onclose = () => {
          // Attempt to reconnect after 5 seconds
          setTimeout(connect, 5000);
        };

        ws.onerror = (error) => {
          if (process.env.NODE_ENV !== "production") {
            console.error("WebSocket error:", error);
          }
          addWebSocketAlert({
            type: "error",
            title: "WebSocket Error",
            message: "Connection error occurred",
          });
        };
      } catch (error) {
        console.error("Failed to connect to monitoring WebSocket:", error);
      }
    };

    // Try to connect if we're not in test mode
    if (process.env.NODE_ENV !== "test") {
      connect();
    }

    // Cleanup
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);
  
  // Get connection state from global WebSocket context
  // This will be populated from the unified WebSocket manager
  const connectionState = webSocketState?.systemHealth?.status === "operational" 
    ? "connected" 
    : webSocketState?.systemHealth?.status === "degraded"
    ? "degraded"
    : webSocketState?.systemHealth?.status === "error"
    ? "error"
    : null;
  
  // Create the monitor data object to return
  const monitorData: WebSocketMonitorData = {
    isConnected: !!connectionState && connectionState !== "error",
    connectionState,
    isAuthenticated: !isAuthError,
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
  WebSocketService,
  WebSocketSystemHealth,
  WebSocketState,
};
