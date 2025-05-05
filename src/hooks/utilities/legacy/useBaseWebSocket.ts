import { useEffect, useRef } from "react";

import { useStore } from "../../../store/useStore";
import {
  dispatchWebSocketEvent,
  trackConnectionAttempt,
  trackSuspendedWebSocket,
  trackWebSocketConnection,
  untrackWebSocketConnection
} from "../../../utils/wsMonitor";

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
  // Use selective subscription to only get user session token
  const userSessionToken = useStore(state => state.user?.session_token);

  const dispatchDebugEvent = (type: string, data?: any) => {
    // Only log in development environment
    if (process.env.NODE_ENV !== "production") {
      console.log(`[WebSocket:${config.socketType}] [${type}]`, {
        endpoint: config.endpoint,
        timestamp: new Date().toISOString(),
        ...data,
      });
    }

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
      
      if (process.env.NODE_ENV !== "production") {
        console.log(
          `[WebSocket:${config.socketType}] [Connected] [${config.endpoint}]`,
        );
      }
      
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
        
        // Check for authentication messages
        if (message.type === 'error' && message.code === 4001) {
          // Authentication error - follow backend team tip #3 with clear logging
          if (process.env.NODE_ENV !== "production") {
            console.error(`[WebSocket:${config.socketType}] Authentication failed:`, {
              error: message.message || "Authentication failed",
              code: message.code,
              authType: (ws as any).authType,
              wsUrl: config.endpoint,
              userHasJwt: !!useStore.getState().user?.jwt,
              userHasSessionToken: !!useStore.getState().user?.session_token
            });
          }
          
          dispatchDebugEvent("error", { 
            type: "auth_error", 
            message: message.message || "Authentication failed",
            code: message.code,
            authType: (ws as any).authType
          });
          
          // If we get an auth error and we're using message auth, we might try to reconnect later
          return;
        } else if (message.type === 'auth_success' || message.type === 'authenticated') {
          // Authentication success - follow backend team tip #3 with clear logging
          if (process.env.NODE_ENV !== "production") {
            console.log(`[WebSocket:${config.socketType}] Authentication successful:`, {
              type: message.type,
              authType: (ws as any).authType,
              endpoint: config.endpoint,
              timestamp: new Date().toISOString()
            });
          }
          
          dispatchDebugEvent("auth", { 
            type: "auth_success", 
            message: "Authentication successful",
            authType: (ws as any).authType
          });
        }
        
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
      
      // Pass the close event to the reconnection handler for better error analysis
      handleReconnection(event);
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
  
  // Function to handle reconnection attempts with aggressive throttling and better error analysis
  const handleReconnection = (event?: CloseEvent) => {
    // Clear any existing reconnection timeout
    if (reconnectTimeoutRef.current !== null) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Analyze close code if available
    let closeReason = "Unknown reason";
    let isAbnormalClose = false;
    let isAuthError = false;
    let isServerError = false;
    
    if (event) {
      // Standard WebSocket close codes: https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code
      switch (event.code) {
        case 1000:
          closeReason = "Normal closure - reconnection not necessary";
          // Don't reconnect on normal closure
          return;
        case 1001:
          closeReason = "Endpoint going away";
          break;
        case 1002:
          closeReason = "Protocol error";
          break;
        case 1003:
          closeReason = "Unsupported data";
          break;
        case 1005:
          closeReason = "No status received";
          break;
        case 1006:
          closeReason = "Abnormal closure - limiting reconnection attempts";
          isAbnormalClose = true;
          
          // Special handling for 1006 (abnormal closure) to limit excessive reconnection attempts
          // Track the 1006 error count in localStorage with expiration
          const storageKey = `ws_1006_error_${config.socketType}`;
          let errorCount = 1;
          
          try {
            // Get existing error count if any
            const storedData = localStorage.getItem(storageKey);
            if (storedData) {
              const data = JSON.parse(storedData);
              // Only count errors within the last hour
              if (Date.now() - data.timestamp < 3600000) {
                errorCount = data.count + 1;
              }
            }
            
            // Store updated count
            localStorage.setItem(storageKey, JSON.stringify({
              count: errorCount,
              timestamp: Date.now()
            }));
            
            // If we've seen too many 1006 errors for this socket, stop reconnecting until page refresh
            if (errorCount >= 3) {
              console.error(`[WebSocket:${config.socketType}] Multiple 1006 errors detected. Stopping reconnection attempts for this session.`);
              dispatchWebSocketEvent("error", {
                socketType: config.socketType,
                message: "Multiple abnormal closures (1006) detected - reconnection attempts suspended",
                errorCount,
                severity: "high"
              });
              
              // Track this socket as suspended in our monitoring system
              trackSuspendedWebSocket(
                config.socketType, 
                "Multiple 1006 (abnormal closure) errors",
                errorCount
              );
              
              // Don't reconnect anymore for this socket type during this session
              return;
            }
          } catch (storageError) {
            // If localStorage fails, just continue with normal reconnection
            console.warn("Failed to track WebSocket 1006 errors:", storageError);
          }
          
          break;
        case 1007:
          closeReason = "Invalid frame payload data";
          break;
        case 1008:
          closeReason = "Policy violation";
          break;
        case 1009:
          closeReason = "Message too big";
          break;
        case 1010:
          closeReason = "Extension required";
          break;
        case 1011:
          closeReason = "Internal server error";
          isServerError = true;
          break;
        case 1012:
          closeReason = "Service restart";
          isServerError = true;
          break;
        case 1013:
          closeReason = "Try again later";
          isServerError = true;
          break;
        case 1014:
          closeReason = "Bad gateway";
          isServerError = true;
          break;
        case 1015:
          closeReason = "TLS handshake failure";
          break;
        case 4000:
          closeReason = "Custom close: Invalid message";
          break;
        case 4001:
          closeReason = "Authentication error";
          isAuthError = true;
          break;
        case 4002:
          closeReason = "Access denied";
          isAuthError = true;
          break;
        case 4003:
          closeReason = "Invalid request";
          break;
        default:
          closeReason = `Unknown code ${event.code}`;
      }
      
      // Log with detailed information about the closure
      console.log(`[WebSocket:${config.socketType}] Closed with code ${event.code}: ${closeReason}`, {
        event,
        endpoint: config.endpoint,
        requiresAuth: config.requiresAuth,
        time: new Date().toISOString()
      });
    }
    
    // Different handling for auth errors - don't retry continuously if auth is failing
    if (isAuthError) {
      dispatchDebugEvent("error", {
        type: "authentication_error",
        code: event?.code,
        message: `Authentication failed: ${closeReason}`,
      });
      
      // Only try once more after a longer delay, then give up
      if (reconnectAttempts.current >= 1) {
        console.error(`[WebSocket:${config.socketType}] Authentication errors persisting, stopping reconnection attempts`);
        return;
      }
      
      // One retry with a longer delay for auth errors
      const authRetryDelay = 10000; // 10 seconds
      console.log(`[WebSocket:${config.socketType}] Authentication error, will retry once in ${authRetryDelay}ms`);
      
      reconnectAttempts.current++;
      lastReconnectTime.current = Date.now();
      
      reconnectTimeoutRef.current = window.setTimeout(() => {
        reconnectTimeoutRef.current = null;
        connect();
      }, authRetryDelay);
      
      return;
    }
    
    // Check if we've exceeded maximum reconnect attempts
    if (reconnectAttempts.current >= (config.maxReconnectAttempts || 5)) {
      dispatchDebugEvent("error", {
        type: "max_reconnect_attempts",
        attempts: reconnectAttempts.current,
        message: "Maximum reconnection attempts reached. Blocking further reconnection attempts.",
        closeCode: event?.code,
        closeReason,
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
    
    // Adjust delay based on close code analysis
    if (isServerError) {
      // Server errors - add extra delay because server may need time to recover
      delay = Math.max(delay, 15000); // Minimum 15s for server errors
      console.log(`[WebSocket:${config.socketType}] Server error detected, using longer minimum delay: ${delay}ms`);
    } else if (isAbnormalClose) {
      // Abnormal closes - these are often network issues which may need some time
      delay = Math.max(delay, 5000); // Minimum 5s for abnormal closes
      console.log(`[WebSocket:${config.socketType}] Abnormal close detected, using minimum delay: ${delay}ms`);
    }
    
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
          closeCode: event?.code,
          closeReason,
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
        closeCode: event?.code,
        closeReason,
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
      closeCode: event?.code,
      closeReason,
      timeSinceLastConnection,
      timeSinceLastReconnect,
      consecutiveRapidDisconnects: consecutiveRapidDisconnects.current,
      delay,
      nextAttemptTime: new Date(now + delay).toISOString()
    });
    
    dispatchDebugEvent("reconnect", {
      attempt: reconnectAttempts.current,
      closeCode: event?.code,
      closeReason,
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
    if (config.requiresAuth !== false) {
      // Try to get more tokens from the store
      const user = useStore.getState().user;
      const hasJwt = !!user?.jwt;
      const hasSessionToken = !!user?.session_token;
      const hasToken = hasJwt || hasSessionToken || !!userSessionToken;
      
      // If no token is available, don't try to connect
      if (!hasToken) {
        dispatchDebugEvent("error", { 
          message: "No authentication token available for WebSocket", 
          requiresAuth: config.requiresAuth,
          endpoint: config.endpoint,
          socketType: config.socketType,
          hasJwt,
          hasSessionToken,
          hasUserSessionToken: !!userSessionToken
        });
        
        if (process.env.NODE_ENV !== "production") {
          console.warn(`[WebSocket:${config.socketType}] Authentication error: No token available`, {
            hasJwt,
            hasSessionToken,
            hasUserSessionToken: !!userSessionToken
          });
        }
        return;
      }
      
      // Log authentication details
      if (process.env.NODE_ENV !== "production") {
        console.log(`[WebSocket:${config.socketType}] Authentication tokens available:`, {
          hasJwt,
          jwtLength: hasJwt && user?.jwt ? user.jwt.length : 0,
          hasSessionToken,
          sessionTokenLength: hasSessionToken && user?.session_token ? user.session_token.length : 0,
          hasUserSessionToken: !!userSessionToken,
          userSessionTokenLength: userSessionToken ? userSessionToken.length : 0
        });
      }
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
  }, [config.url, config.endpoint, config.requiresAuth, userSessionToken, config.socketType]);

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
          // Send heartbeat ping as a REQUEST message with 'ping' action
          // This follows the v69 protocol format for client-to-server messages
          wsRef.current.send(
            JSON.stringify({
              type: "REQUEST",
              topic: "system",
              action: "ping",
              requestId: crypto.randomUUID(),
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
    // Check if this socket type is suspended due to multiple errors
    const suspendedSockets = window.DDSuspendedWebSockets || {};
    if (suspendedSockets[config.socketType]) {
      const { timestamp, reason } = suspendedSockets[config.socketType];
      // Only log if we haven't logged recently (prevents console spam)
      if (Date.now() - timestamp > 10000) { // Log at most once every 10 seconds
        console.warn(`[WebSocket:${config.socketType}] Connection suspended due to: ${reason}. Will not attempt reconnection until page refresh.`);
        // Update timestamp so we don't spam logs
        suspendedSockets[config.socketType].timestamp = Date.now();
      }
      return;
    }
  
    // Don't attempt to connect if we already have an open connection
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      if (process.env.NODE_ENV !== "production") {
        console.log(`[WebSocket:${config.socketType}] Already connected, skipping connect call`);
      }
      return;
    }
    
    // Don't allow reconnection if we're already in the process of connecting
    if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
      if (process.env.NODE_ENV !== "production") {
        console.log(`[WebSocket:${config.socketType}] Connection in progress, skipping redundant connect call`);
      }
      return;
    }
    
    // Clear any existing WebSocket before creating a new one
    if (wsRef.current) {
      try {
        wsRef.current.close();
        wsRef.current = null;
      } catch (err) {
        console.error(`[WebSocket:${config.socketType}] Error closing previous connection:`, err);
      }
    }
    
    console.log(`[WebSocket:${config.socketType}] Initiating new connection attempt to ${config.endpoint}`, {
      timestamp: new Date().toISOString(),
      socketType: config.socketType,
      requiresAuth: config.requiresAuth,
      attempt: reconnectAttempts.current + 1
    });
    
    // Track this connection attempt
    trackConnectionAttempt(config.socketType);
    
    // CRITICAL CHECK: Don't attempt authenticated connections when no auth token is available
    if (config.requiresAuth !== false) {
      const user = useStore.getState().user;
      // Check for WebSocket token first, then fall back to JWT for backward compatibility
      if (!user?.wsToken && !user?.jwt) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`[WebSocket:${config.socketType}] Cannot establish authenticated connection: No WebSocket token available`);
        }
        throw new Error(`Cannot connect to ${config.endpoint}: Authentication required but no WebSocket token available`);
      }
    }
    
    // CRITICAL FIX: Use a consistent, reliable WebSocket URL construction
    // 1. Always prioritize the VITE_WS_URL environment variable if available
    // 2. Fall back to a domain-specific default if needed
    let baseWsUrl;
    
    // Check if we have a configured WebSocket URL in environment
    const configuredWsUrl = import.meta.env.VITE_WS_URL;
    
    if (configuredWsUrl) {
      // Use the explicitly configured WebSocket URL from environment
      baseWsUrl = configuredWsUrl;
      console.log(`[WebSocket:${config.socketType}] Using configured WS_URL from environment: ${baseWsUrl}`);
    } else {
      // Determine based on the current domain (fallback)
      const isProdDomain = window.location.hostname === "degenduel.me";
      
      if (isProdDomain) {
        baseWsUrl = `wss://degenduel.me`;
      } else if (window.location.hostname === "dev.degenduel.me") {
        baseWsUrl = `wss://dev.degenduel.me`;
      } else if (config.url) {
        // Use the provided URL from config (for custom environments)
        baseWsUrl = config.url;
      } else {
        // Last resort fallback to current host
        baseWsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`;
      }
      
      console.log(`[WebSocket:${config.socketType}] No VITE_WS_URL found, using derived URL: ${baseWsUrl}`);
    }
    
    // ALWAYS log the full URL construction to help with debugging
    console.log(`[WebSocket:${config.socketType}] [Connecting] URL Construction:`, {
      baseWsUrl,
      endpoint: config.endpoint,
      fullUrl: `${baseWsUrl}${config.endpoint}`,
      authRequired: config.requiresAuth !== false,
      hasToken: !!userSessionToken
    });

    // Create the WebSocket connection with enhanced logging
    // Construct the full WebSocket URL using the baseWsUrl and endpoint
    let wsUrl = `${baseWsUrl}${config.endpoint}`;
    
    // Add comprehensive debugging information to console
    console.log(`[WebSocket:${config.socketType}] Full WebSocket URL (pre-auth): ${wsUrl}`);
    
    let ws: WebSocket;
    
    // Implement the authentication strategy recommended by the backend team
    if (config.requiresAuth !== false) {
      // Get user from store to access all possible tokens
      const user = useStore.getState().user;
      const wsToken = user?.wsToken;  // Dedicated WebSocket token (preferred)
      const jwt = user?.jwt;          // Legacy JWT (as fallback)
      const sessionToken = user?.session_token || userSessionToken;
      
      // Choose the best token to use (prefer WebSocket token, then JWT, then session token)
      const authToken = wsToken || jwt || sessionToken;
      
      // Debug connection exactly as recommended by backend team
      console.group("⭐⭐⭐ WebSocket Connection Debug ⭐⭐⭐");
      console.log("Auth State:", { isAuthenticated: !!user, hasToken: !!authToken });
      console.log("Token (truncated):", authToken ? `${authToken.substring(0, 10)}...${authToken.substring(authToken.length - 10)}` : "NONE");
      console.log("URL Construction:", {
        base: window.location.host,
        protocol: window.location.protocol === 'https:' ? 'wss:' : 'ws:',
        path: config.endpoint
      });
      console.log("Final URL with token:", `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}${config.endpoint}?token=${encodeURIComponent(authToken || '')}`);
      console.groupEnd();
      
      // Only proceed if we have a token
      if (!authToken) {
        console.error(`[WebSocket:${config.socketType}] Cannot connect: No authentication token available`);
        throw new Error("No authentication token available");
      }
      
      // Log auth token details in development
      if (process.env.NODE_ENV !== "production") {
        console.log(`[WebSocket:${config.socketType}] Auth tokens:`, {
          hasWsToken: !!wsToken,
          wsTokenLength: wsToken ? wsToken.length : 0,
          hasJwt: !!jwt,
          jwtLength: jwt ? jwt.length : 0,
          hasSessionToken: !!sessionToken,
          sessionTokenLength: sessionToken ? sessionToken.length : 0,
          selectedTokenType: wsToken ? "WS_TOKEN" : jwt ? "JWT" : "SESSION",
          selectedTokenLength: authToken ? authToken.length : 0
        });
      }
      
      try {
        // Using recommended URL constructor method from backend team
        try {
          // Create URL object as recommended by backend team
          const wsUrlObj = new URL(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}${config.endpoint}`);
          
          // Add token to search params
          wsUrlObj.searchParams.append('token', authToken);
          
          // Get final URL
          const authUrl = wsUrlObj.toString();
          
          // Log final URL (partially redacted)
          console.log("🔴 Final WebSocket URL (using URL constructor):", 
                     authUrl.replace(authToken, `${authToken.substring(0, 5)}...${authToken.substring(authToken.length - 5)}`));
                     
          // Create WebSocket with this URL
          ws = new WebSocket(authUrl);
        } catch (urlError) {
          // Fallback to manual construction if URL constructor fails
          console.warn("URL constructor failed, falling back to string construction", urlError);
          
          // Following backend team's tip #2 and #4 - Build URL with properly encoded token
          const separator = wsUrl.includes('?') ? '&' : '?';
          
          // Ensure token is properly URL encoded as per backend team's tip #4
          const encodedToken = encodeURIComponent(authToken || "");
          const authUrl = `${wsUrl}${separator}token=${encodedToken}`;
          
          // Log final URL (partially redacted)
          const redactedUrl = authToken 
            ? `${wsUrl}${separator}token=${authToken.substring(0, 5)}...${authToken.substring(authToken.length - 5)}`
            : `${wsUrl}${separator}token=MISSING_TOKEN`;
              
          console.log(`[WebSocket:${config.socketType}] Fallback URL (redacted):`, redactedUrl);
          
          // Create WebSocket with fallback URL
          ws = new WebSocket(authUrl);
        }
        
        // Add auth type for debugging
        (ws as any).authType = 'query';
        
        if (process.env.NODE_ENV !== "production") {
          console.debug(`[WebSocket:${config.socketType}] Using query parameter authentication`);
        }
      } catch (e) {
        // Fallback: Try to connect without auth in URL, then send auth message on open
        if (process.env.NODE_ENV !== "production") {
          console.warn(`[WebSocket:${config.socketType}] Query auth failed, trying message auth`, e);
        }
        
        // Get user from store to access all possible tokens (again since we're in a new scope)
        const user = useStore.getState().user;
        const jwt = user?.jwt;
        const sessionToken = user?.session_token || userSessionToken;
        
        // Choose the best token to use (prefer JWT)
        const authToken = jwt || sessionToken;
        
        // Connect without token in URL
        ws = new WebSocket(wsUrl);
        
        // Add auth type for debugging
        (ws as any).authType = 'message';
        
        // Send authentication message on connection open
        const originalOnOpen = ws.onopen;
        ws.onopen = (event) => {
          // Send authentication message as first message
          try {
            ws.send(JSON.stringify({ 
              type: 'auth', 
              token: authToken 
            }));
            
            if (process.env.NODE_ENV !== "production") {
              console.debug(`[WebSocket:${config.socketType}] Sent auth message after connection with token length: ${authToken ? authToken.length : 0}`);
            }
          } catch (authError) {
            if (process.env.NODE_ENV !== "production") {
              console.error(`[WebSocket:${config.socketType}] Failed to send auth message`, authError);
            }
          }
          
          // Call original onopen handler if it exists
          if (typeof originalOnOpen === 'function') {
            originalOnOpen.call(ws, event);
          }
        };
      }
    } else {
      // No authentication required - create simple WebSocket
      ws = new WebSocket(wsUrl);
      
      // Add auth type for debugging
      (ws as any).authType = 'none';
    }
      
    // Add detailed debug info
    if (process.env.NODE_ENV !== "production") {
      // Construct the final URL for logging to confirm token is present
      // But redact the actual token value
      let logUrl = wsUrl;
      if ((ws as any).authType === 'query') {
        const user = useStore.getState().user;
        const authToken = user?.jwt || userSessionToken;
        if (authToken) {
          const separator = wsUrl.includes('?') ? '&' : '?';
          logUrl = `${wsUrl}${separator}token=[REDACTED-TOKEN-LENGTH-${authToken.length}]`;
        } else {
          logUrl = `${wsUrl}[NO-AUTH-TOKEN-FOUND!]`;
        }
      }
      
      console.debug(`[WebSocket:${config.socketType}] Connection details:`, {
        url: logUrl,
        baseUrl: `${baseWsUrl}${config.endpoint}`,
        requiresAuth: config.requiresAuth,
        usingAuth: config.requiresAuth !== false && !!userSessionToken,
        authMethod: (ws as any).authType, // 'query', 'message', or 'none'
        readyState: ws.readyState,
        protocol: ws.protocol,
        timestamp: new Date().toISOString(),
        originalWsUrl: wsUrl,
        locationHostname: window.location.hostname,
        locationProtocol: window.location.protocol
      });
    }

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
