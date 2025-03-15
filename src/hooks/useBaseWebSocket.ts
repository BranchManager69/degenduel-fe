import { useEffect, useRef } from "react";

import { useStore } from "../store/useStore";
import { 
  trackWebSocketConnection,
  trackConnectionAttempt,
  untrackWebSocketConnection, 
  dispatchWebSocketEvent
} from "../utils/wsMonitor";

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
  requiresAuth?: boolean; // New option to make auth optional for public endpoints
  disableAutoConnect?: boolean; // Option to prevent automatic connection on mount
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
      ...data,
    });

    // Use the centralized monitoring system to dispatch events
    dispatchWebSocketEvent(type, {
      socketType: config.socketType,
      endpoint: config.endpoint,
      ...data,
    });
  };

  // Reference for tracking missed heartbeats
  const heartbeatsRef = useRef<number>(0);
  
  // Function to set up WebSocket handlers
  const setupWebSocketHandlers = (ws: WebSocket) => {
    ws.onopen = () => {
      // Record connection time to help prevent rapid reconnection cycles
      lastConnectionTime.current = Date.now();
      
      // Reset reconnect attempts on successful connection
      reconnectAttempts.current = 0;
      
      console.log(
        `[WebSocket:${config.socketType}] [Connected] [${config.endpoint}]`,
      );
      dispatchDebugEvent("connection", { 
        message: "Connection established successfully",
        connectionTime: new Date().toISOString()
      });
      
      // Track this connection in the central monitoring system
      trackWebSocketConnection(config.socketType);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // Check for pong responses to reset heartbeat counter
        if (message.type === "pong") {
          // Reset heartbeat counter since we got a response
          heartbeatsRef.current = 0;
          
          dispatchDebugEvent("pong", {
            message: "Received pong response",
            timestamp: new Date().toISOString(),
            serverTimestamp: message.timestamp
          });
        } else {
          // Regular message, dispatch to monitoring system
          dispatchDebugEvent("message", message);
          
          // Handle message will be implemented by child hooks
          if (typeof config.onMessage === "function") {
            config.onMessage(message);
          }
        }
      } catch (error) {
        dispatchDebugEvent("error", { type: "parse_error", error });
      }
    };

    ws.onclose = (event) => {
      console.log(
        `[WebSocket:${config.socketType}] [Closed] [${config.endpoint}] [Code: ${event.code}] [Reason: ${event.reason || "No reason provided"}]`,
      );
      dispatchDebugEvent("close", { code: event.code, reason: event.reason });
      
      // Untrack this connection from the central monitoring system
      untrackWebSocketConnection(config.socketType);
      
      handleReconnection();
    };

    ws.onerror = (error) => {
      console.error(
        `[WebSocket:${config.socketType}] [Error] [${config.endpoint}]`,
        error,
      );
      dispatchDebugEvent("error", error);
    };
  };

  // Tracking variables to handle reconnection throttling
  const lastConnectionTime = useRef<number>(0);
  const lastReconnectTime = useRef<number>(0);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const consecutiveRapidDisconnects = useRef<number>(0);
  const MAX_RAPID_DISCONNECTS = 3;
  
  // Function to handle reconnection attempts with aggressive throttling
  const handleReconnection = () => {
    // Clear any existing reconnection timeout
    if (reconnectTimeoutRef.current !== null) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Check if we've exceeded maximum reconnect attempts
    if (reconnectAttempts.current >= (config.maxReconnectAttempts || 5)) {
      dispatchDebugEvent("error", {
        type: "max_reconnect_attempts",
        attempts: reconnectAttempts.current,
        message: "Maximum reconnection attempts reached. Blocking further reconnection attempts.",
      });
      
      console.error(`[WebSocket:${config.socketType}] Maximum reconnection attempts (${reconnectAttempts.current}) reached. No further reconnection attempts will be made.`);
      return;
    }
    
    // Calculate time since last connection
    const now = Date.now();
    const timeSinceLastConnection = now - lastConnectionTime.current;
    const timeSinceLastReconnect = now - lastReconnectTime.current;
    
    // Base minimum delays
    const MIN_RECONNECT_INTERVAL = 2000; // Base: 2 seconds minimum between reconnect attempts
    const RAPID_DISCONNECT_THRESHOLD = 5000; // Consider a connection "rapid disconnect" if it disconnects within 5 seconds
    
    // Detect rapid disconnect pattern (connect->disconnect cycle happening too quickly)
    if (timeSinceLastConnection < RAPID_DISCONNECT_THRESHOLD) {
      consecutiveRapidDisconnects.current++;
      console.warn(`[WebSocket:${config.socketType}] Rapid disconnect detected (#${consecutiveRapidDisconnects.current}). Connection lasted only ${timeSinceLastConnection}ms`);
    } else {
      // Reset the counter if we had a longer-lived connection
      consecutiveRapidDisconnects.current = 0;
    }
    
    // Calculate exponential backoff delay
    // Start with standard exponential backoff
    let delay = Math.min(
      1000 * Math.pow(2, reconnectAttempts.current),
      30000, // Maximum 30 second base delay
    );
    
    // Add aggressive throttling for rapid disconnect patterns
    if (consecutiveRapidDisconnects.current > 0) {
      // Add 5 seconds for each consecutive rapid disconnect
      const rapidDisconnectPenalty = consecutiveRapidDisconnects.current * 5000;
      
      // If we've seen multiple rapid disconnects in a row, apply much more aggressive throttling
      if (consecutiveRapidDisconnects.current >= MAX_RAPID_DISCONNECTS) {
        // After 3 rapid disconnects, add a much longer delay (30s + 5s per attempt beyond 3)
        const severePenalty = 30000 + ((consecutiveRapidDisconnects.current - MAX_RAPID_DISCONNECTS) * 5000);
        delay = Math.max(delay, severePenalty);
        
        dispatchDebugEvent("reconnect_severe_throttling", {
          message: `Severe throttling applied after ${consecutiveRapidDisconnects.current} rapid disconnects`,
          basePenalty: 30000,
          additionalPenalty: (consecutiveRapidDisconnects.current - MAX_RAPID_DISCONNECTS) * 5000,
          totalDelay: delay
        });
      } else {
        // Apply standard rapid disconnect penalty
        delay = Math.max(delay, MIN_RECONNECT_INTERVAL + rapidDisconnectPenalty);
      }
      
      dispatchDebugEvent("reconnect_throttled", {
        message: "Reconnection throttled due to rapid disconnect pattern",
        consecutiveRapidDisconnects: consecutiveRapidDisconnects.current,
        timeSinceLastConnection,
        additionalDelay: rapidDisconnectPenalty,
        totalDelay: delay,
      });
    }
    
    // Ensure minimum time between reconnect attempts regardless of other factors
    if (timeSinceLastReconnect < MIN_RECONNECT_INTERVAL * 2) {
      const extraDelay = MIN_RECONNECT_INTERVAL * 2 - timeSinceLastReconnect;
      delay += extraDelay;
      
      dispatchDebugEvent("reconnect_rate_limited", {
        message: "Adding extra delay to limit reconnection rate",
        timeSinceLastReconnect,
        minimumInterval: MIN_RECONNECT_INTERVAL * 2,
        extraDelay,
        totalDelay: delay
      });
    }
    
    // Update tracking
    reconnectAttempts.current++;
    lastReconnectTime.current = now;
    
    // Log reconnection attempt with complete information
    console.log(`[WebSocket:${config.socketType}] Scheduling reconnection attempt #${reconnectAttempts.current} in ${delay}ms`, {
      timeSinceLastConnection,
      timeSinceLastReconnect,
      consecutiveRapidDisconnects: consecutiveRapidDisconnects.current,
      delay,
      nextAttemptTime: new Date(now + delay).toISOString()
    });
    
    dispatchDebugEvent("reconnect", {
      attempt: reconnectAttempts.current,
      delay,
      consecutiveRapidDisconnects: consecutiveRapidDisconnects.current,
      nextAttemptTime: new Date(now + delay).toISOString(),
    });
    
    // Schedule reconnection with calculated delay
    reconnectTimeoutRef.current = window.setTimeout(() => {
      reconnectTimeoutRef.current = null;
      connect();
    }, delay);
  };

  useEffect(() => {
    // Only check for authentication if the WebSocket endpoint requires it
    if (config.requiresAuth !== false && !user?.session_token) {
      dispatchDebugEvent("error", { 
        message: "No session token available for authenticated WebSocket", 
        requiresAuth: config.requiresAuth,
        endpoint: config.endpoint,
        socketType: config.socketType,
        userInfo: user ? {
          wallet: user.wallet_address,
          hasJwt: !!user.jwt,
          hasSessionToken: !!user.session_token
        } : null
      });
      console.warn(`[WebSocket:${config.socketType}] Authentication error:`, { 
        user: user ? {
          wallet: user.wallet_address,
          hasJwt: !!user.jwt,
          hasSessionToken: !!user.session_token,
          // Print the first 10 chars of tokens for debugging
          sessionTokenPrefix: user.session_token ? user.session_token.substring(0, 10) + '...' : null,
          jwtPrefix: user.jwt ? user.jwt.substring(0, 10) + '...' : null,
        } : 'No user object available',
        requiresAuth: config.requiresAuth
      });
      return;
    }

    // Only auto-connect if not explicitly disabled
    if (!config.disableAutoConnect) {
      connect();
    }

    // Connection is tracked in onopen handler

    // Cleanup
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        untrackWebSocketConnection(config.socketType);
      }
    };
  }, [config.url, config.endpoint, config.requiresAuth, user?.session_token, config.socketType]);

  // Implement heartbeat if interval is specified
  useEffect(() => {
    if (!config.heartbeatInterval) return;

    // Reset heartbeats counter when starting interval
    heartbeatsRef.current = 0;
    const MAX_MISSED_HEARTBEATS = 3; // Consider connection dead after 3 missed responses
    
    const interval = setInterval(() => {
      // Only send heartbeats on open connections
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        try {
          // Send heartbeat ping
          wsRef.current.send(
            JSON.stringify({
              type: "ping",
              timestamp: new Date().toISOString(),
            }),
          );
          
          // Count this heartbeat attempt
          heartbeatsRef.current++;
          
          // Log heartbeat for monitoring
          dispatchDebugEvent("heartbeat", {
            missed: heartbeatsRef.current,
            timestamp: new Date().toISOString()
          });
          
          // If we've missed too many heartbeats, the connection might be dead
          if (heartbeatsRef.current >= MAX_MISSED_HEARTBEATS) {
            dispatchDebugEvent("zombie_connection", {
              message: `Possible zombie connection detected after ${MAX_MISSED_HEARTBEATS} missed heartbeats`,
              socketType: config.socketType,
              missed: heartbeatsRef.current
            });
            
            // Force close and reconnect
            if (wsRef.current) {
              dispatchDebugEvent("forced_reconnect", {
                reason: "Missed heartbeats",
                count: heartbeatsRef.current
              });
              
              // Close the zombie connection
              wsRef.current.close();
              // Allow reconnection logic to handle reopening
            }
          }
        } catch (err) {
          // Error sending heartbeat
          dispatchDebugEvent("error", {
            type: "heartbeat_error",
            message: "Failed to send heartbeat",
            error: err
          });
        }
      }
    }, config.heartbeatInterval);
    
    // Handle pong responses in message handler to reset the missed heartbeats counter
    // This should be implemented in the specific WebSocket hooks
    
    return () => clearInterval(interval);
  }, [config.heartbeatInterval]);

  // Public API
  const connect = () => {
    // Don't attempt to connect if we already have an open connection
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log(`[WebSocket:${config.socketType}] Already connected, skipping connect call`);
      return;
    }
    
    // Don't allow reconnection if we're already in the process of connecting
    if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
      console.log(`[WebSocket:${config.socketType}] Connection in progress, skipping redundant connect call`);
      return;
    }
    
    // Track this connection attempt
    trackConnectionAttempt(config.socketType);
    
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

    console.log(
      `[WebSocket:${config.socketType}] [Connecting] [URL: ${baseWsUrl}${config.endpoint}] [Token available: ${!!user?.session_token}]`,
    );

    // Create the WebSocket connection with token as subprotocol if auth is required
    const ws = config.requiresAuth !== false && user?.session_token
      ? new WebSocket(
          `${baseWsUrl}${config.endpoint}`,
          user.session_token,
        )
      : new WebSocket(`${baseWsUrl}${config.endpoint}`);
      
    // Add detailed debug info
    console.debug(`[WebSocket:${config.socketType}] Connection details:`, {
      url: `${baseWsUrl}${config.endpoint}`,
      requiresAuth: config.requiresAuth,
      usingAuth: config.requiresAuth !== false && !!user?.session_token,
      tokenLength: user?.session_token ? user.session_token.length : 0,
      readyState: ws.readyState,
      protocol: ws.protocol,
      timestamp: new Date().toISOString()
    });

    setupWebSocketHandlers(ws);
    wsRef.current = ws;
  };

  const close = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      untrackWebSocketConnection(config.socketType);
      dispatchDebugEvent("cleanup", { message: "WebSocket closed manually" });
    }
  };

  const getStatus = (): ServiceStatus => {
    if (!wsRef.current) return "offline";

    switch (wsRef.current.readyState) {
      case WebSocket.CONNECTING:
        return "degraded";
      case WebSocket.OPEN:
        return "online";
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
    close,
  };
};
