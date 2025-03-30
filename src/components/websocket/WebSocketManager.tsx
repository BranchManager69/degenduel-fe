/**
 * Unified WebSocket Manager Component
 * 
 * Manages a single WebSocket connection for the entire application.
 * All data flows through this single connection, with message types
 * determining the routing of data to appropriate components.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useStore } from '../../store/useStore';
import { dispatchWebSocketEvent, initializeWebSocketTracking } from '../../utils/wsMonitor';
import { setupWebSocketInstance } from '../../hooks/websocket/useUnifiedWebSocket';
import { ConnectionState, MessageType, SOCKET_TYPES, WEBSOCKET_ENDPOINT, WebSocketMessage } from '../../hooks/websocket/types';
import { toast } from '../toast/compat'; // Import the toast system directly

// Type helpers for specific message formats
type SubscriptionMessage = {
  type: MessageType.SUBSCRIBE | MessageType.UNSUBSCRIBE;
  topics: string[];
  authToken?: string;
};

// Container for message listeners
interface MessageListener {
  id: string;
  types: string[];   // Message types to listen for
  topics?: string[]; // Optional topic filters
  callback: (message: WebSocketMessage) => void;
}

const WebSocketManagerComponent: React.FC = () => {
  // Get auth state
  const user = useStore(state => state.user);
  const authContext = useAuth();
  
  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Message listeners registry
  const listenersRef = useRef<MessageListener[]>([]);
  
  // Reconnection logic
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeoutRef = useRef<number | null>(null);
  
  // Heartbeat logic
  const heartbeatIntervalRef = useRef<number | null>(null);
  const missedHeartbeatsRef = useRef<number>(0);
  const maxMissedHeartbeats = 3;
  
  // Authentication state with better token tracking
  const authState = React.useMemo(() => ({
    isLoggedIn: !!user,
    isAdmin: authContext.isAdmin?.() || false,
    hasWsToken: !!user?.wsToken,
    hasJwt: !!user?.jwt,
    hasSessionToken: !!user?.session_token,
    canAuthenticate: !!user
  }), [user?.wallet_address, user?.jwt, user?.wsToken, user?.session_token, authContext]);
  
  // Initialize WebSocket tracking on mount
  useEffect(() => {
    initializeWebSocketTracking();
    
    dispatchWebSocketEvent('init', {
      message: 'Unified WebSocketManager initialized',
      timestamp: new Date().toISOString()
    });
    
    // Attempt to connect
    connect();
    
    // Clean up on unmount
    return () => {
      cleanupConnection();
      dispatchWebSocketEvent('cleanup', {
        message: 'Unified WebSocketManager cleanup on unmount',
        timestamp: new Date().toISOString()
      });
    };
  }, []);
  
  // Handle authentication changes
  useEffect(() => {
    if (connectionState === ConnectionState.CONNECTED && authState.isLoggedIn) {
      authenticate();
    }
  }, [connectionState, authState.isLoggedIn, user?.jwt, user?.wsToken]);
  
  // Add automatic token retrieval mechanism
  useEffect(() => {
    // When user is logged in but doesn't have a WebSocket token, fetch one
    const fetchTokenIfNeeded = async () => {
      if (authState.isLoggedIn && !authState.hasWsToken && authContext.getAccessToken) {
        try {
          console.log("WebSocketManager: Requesting WebSocket token...");
          const token = await authContext.getAccessToken();
          if (token) {
            console.log("WebSocketManager: Token received, updating user");
            // Check if we have a valid user with required properties
            if (user && user.wallet_address) {
              // Use the store's setUser method with the correct typing
              useStore.getState().setUser({
                ...user,
                wsToken: token // Store in dedicated wsToken field
              });
            }
          } else {
            console.warn("WebSocketManager: No token received from getAccessToken");
          }
        } catch (error) {
          console.error("WebSocketManager: Failed to get WebSocket token:", error);
        }
      }
    };
    
    fetchTokenIfNeeded();
  }, [authState.isLoggedIn, authState.hasWsToken, authContext, user]);
  
  // Connect to the WebSocket
  const connect = () => {
    // Don't connect if already connected or connecting
    if (wsRef.current && (
      wsRef.current.readyState === WebSocket.OPEN || 
      wsRef.current.readyState === WebSocket.CONNECTING
    )) {
      console.log("WebSocketManager: Already connected or connecting");
      return;
    }
    
    // Clear any existing WebSocket
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (err) {
        console.error("WebSocketManager: Error closing previous connection:", err);
      }
      wsRef.current = null;
    }
    
    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Critical fix for WebSocket URL construction
    let wsUrl;
    // Get configured WebSocket URL from environment
    const configuredWsUrl = import.meta.env.VITE_WS_URL;
    
    if (configuredWsUrl) {
      // First attempt: Direct use of environment variable with endpoint
      wsUrl = `${configuredWsUrl}${WEBSOCKET_ENDPOINT}`;
      console.log("WebSocketManager: Using configured WS_URL from environment:", configuredWsUrl);
    } else {
      // Fallback mechanism based on hostname
      const hostname = window.location.hostname;
      const isProd = hostname === "degenduel.me";
      const isDev = hostname === "dev.degenduel.me";
      
      if (isProd) {
        wsUrl = `wss://degenduel.me${WEBSOCKET_ENDPOINT}`;
        console.log("WebSocketManager: Using production WebSocket URL based on hostname");
      } else if (isDev) {
        wsUrl = `wss://dev.degenduel.me${WEBSOCKET_ENDPOINT}`;
        console.log("WebSocketManager: Using development WebSocket URL based on hostname"); 
      } else {
        // Local development or unknown environment
        wsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}${WEBSOCKET_ENDPOINT}`;
        console.log("WebSocketManager: Using local WebSocket URL based on current host");
      }
    }
    
    console.log("WebSocketManager: Final WebSocket URL:", wsUrl);
    console.log(`WebSocketManager: Connecting to ${wsUrl}`);
    
    try {
      // Update state
      setConnectionState(ConnectionState.CONNECTING);
      
      // Create WebSocket connection
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      // Set up event handlers
      ws.onopen = handleOpen;
      ws.onmessage = handleMessage;
      ws.onclose = handleClose;
      ws.onerror = handleError;
      
      dispatchWebSocketEvent('connect_attempt', {
        url: wsUrl,
        timestamp: new Date().toISOString(),
        attempt: reconnectAttemptsRef.current + 1
      });
    } catch (error) {
      console.error("WebSocketManager: Error creating WebSocket:", error);
      setConnectionError(error instanceof Error ? error.message : String(error));
      setConnectionState(ConnectionState.ERROR);
      scheduleReconnect();
    }
  };
  
  // Handle WebSocket open event
  const handleOpen = () => {
    console.log("WebSocketManager: Connection established");
    setConnectionState(ConnectionState.CONNECTED);
    setConnectionError(null);
    reconnectAttemptsRef.current = 0;
    
    // Start heartbeat
    startHeartbeat();
    
    // If logged in, authenticate
    if (authState.isLoggedIn) {
      authenticate();
    }
    
    dispatchWebSocketEvent('connected', {
      timestamp: new Date().toISOString()
    });
  };
  
  // Handle WebSocket messages
  const handleMessage = (event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      
      // Log all messages for debugging
      console.log("WebSocketManager: Received message:", message);
      
      // Handle system messages
      if ((message.type === MessageType.SYSTEM && message.action === 'pong') || 
          message.type === MessageType.PONG) {
        // Reset heartbeat counter
        missedHeartbeatsRef.current = 0;
        return;
      } else if (message.type === MessageType.ACKNOWLEDGMENT && message.message?.includes('authenticated')) {
        // Backend sends ACKNOWLEDGMENT with "authenticated" message instead of AUTH_SUCCESS
        setConnectionState(ConnectionState.AUTHENTICATED);
        dispatchWebSocketEvent('authenticated', {
          timestamp: new Date().toISOString()
        });
        return;
      } else if (message.type === MessageType.SYSTEM) {
        // Handle all SYSTEM message types according to WS.TXT documentation
        console.log("WebSocketManager: Processing SYSTEM message:", message);
        
        // Check if this is a connected message and set state even if not authenticated yet
        if (message.message?.includes('Connected to DegenDuel') && connectionState === ConnectionState.CONNECTING) {
          console.log("WebSocketManager: Connection confirmed by server, setting state to CONNECTED");
          setConnectionState(ConnectionState.CONNECTED);
        }
        
        // For heartbeat messages - reset counter as documented
        if (message.action === 'heartbeat') {
          missedHeartbeatsRef.current = 0;
        }
        
        // NEW: Handle server shutdown notification
        if (message.action === 'shutdown') {
          console.log("WebSocketManager: Server shutdown notification received:", message);
          
          // Update server restart tracking
          serverRestartRef.current.inProgress = true;
          serverRestartRef.current.shutdownTime = Date.now();
          
          // Extract expected downtime if provided, otherwise use default
          // For v69 spec, the message.data object contains the expectedDowntime 
          const expectedDowntime = 
            (message.data && typeof message.data === 'object' && 'expectedDowntime' in message.data)
              ? (message.data as any).expectedDowntime 
              : 30000; // Default to 30 seconds
              
          serverRestartRef.current.expectedDowntime = expectedDowntime;
          
          // Show a toast notification for users directly here where we have complete message context
          // Use the toast system directly
          toast.info(
            message.message || `Server restarting, will be back in about ${Math.ceil(expectedDowntime/1000)} seconds.`, 
            {
              title: 'Server Maintenance',
              // Custom options for duration and ID are supported through our compat layer
              duration: Math.min(expectedDowntime + 5000, 30000), // Show until reconnect + buffer
              id: 'server-restart-' + Date.now()
            }
          );
          
          // Schedule reconnection with optimal timing
          scheduleServerRestartReconnect(expectedDowntime);
          
          // Optionally, we could filter out this specific message to prevent components
          // from receiving it directly, but letting it through allows components to 
          // implement their own shutdown handling if needed.
        }
        
        // Track all system messages for monitoring
        dispatchWebSocketEvent('system_message', {
          action: message.action || 'unknown',
          message: message.message || '',
          timestamp: new Date().toISOString()
        });
        
        // CRITICAL: Never filter out SYSTEM messages for unauthenticated users
        // Per the WS.TXT documentation, SYSTEM messages are public and
        // "Subscription: Automatic for all connections"
        // Distribution to listeners happens below
      } else if (message.type === MessageType.ERROR) {
        console.error("WebSocketManager: Received error message:", message);
        dispatchWebSocketEvent('error_message', {
          error: message.error || message.message || 'Unknown error',
          timestamp: new Date().toISOString()
        });
        
        // Handle authentication errors (code 4011 is "Invalid authentication token")
        if ((message as any).code === 4011 || 
            (message.error && typeof message.error === 'string' && message.error.includes('auth')) || 
            (message.message && typeof message.message === 'string' && message.message.includes('auth'))) {
          
          console.log("WebSocketManager: Authentication failed, but setting connection state to CONNECTED to allow public data");
          // Even though authentication failed, we're still connected and can get public data
          setConnectionState(ConnectionState.CONNECTED);
          
          // Filter out auth error messages from listeners
          console.log("WebSocketManager: Filtering out authentication error message from listeners");
          return;
        }
        
        // Filter out other known error types that should be hidden from components
        if (typeof message.error === 'number' && message.error === 4002) { // Code 4002 is "Unknown message type"
          console.log("WebSocketManager: Filtering out 'Unknown message type' error from listeners");
          return;
        }
      }
      
      // Distribute all messages to listeners - filter by both type and topic
      // This happens for ALL message types, including SYSTEM messages regardless of auth state
      distributeMessage(message);
      
    } catch (error) {
      console.error("WebSocketManager: Error processing message:", error, event.data);
    }
  };
  
  // Server restart tracking
  const serverRestartRef = useRef({
    inProgress: false,
    expectedDowntime: 30000, // Default: 30 seconds
    shutdownTime: 0,
    reconnectScheduled: false
  });
  
  // Handle WebSocket close event
  const handleClose = (event: CloseEvent) => {
    console.log(`WebSocketManager: Connection closed. Code: ${event.code}, Reason: ${event.reason || 'No reason provided'}`);
    
    // Stop heartbeat
    stopHeartbeat();
    
    // Update state
    setConnectionState(ConnectionState.DISCONNECTED);
    
    // Check if this is a clean closure due to server restart
    if (event.code === 1000 && event.reason && event.reason.includes('restart')) {
      console.log(`WebSocketManager: Server restart detected via clean shutdown: ${event.reason}`);
      
      // Don't schedule normal reconnect, as we already have a smart reconnect from handleMessage
      if (!serverRestartRef.current.reconnectScheduled) {
        // If somehow we got the close event but missed the notification message,
        // still schedule a smart reconnect
        scheduleServerRestartReconnect(serverRestartRef.current.expectedDowntime);
      }
    } 
    // For non-restart abnormal closures, use normal reconnection strategy
    else if (event.code !== 1000) {
      scheduleReconnect();
    }
    
    dispatchWebSocketEvent('disconnected', {
      code: event.code,
      reason: event.reason,
      timestamp: new Date().toISOString(),
      serverRestart: serverRestartRef.current.inProgress
    });
  };
  
  // Schedule reconnection for server restart with optimized timing
  const scheduleServerRestartReconnect = (expectedDowntime: number) => {
    // Clear any existing timeout
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Mark that a server restart reconnect is scheduled
    serverRestartRef.current.reconnectScheduled = true;
    
    // Calculate when to reconnect - 5 seconds before expected uptime
    // with a minimum of 3 seconds wait and maximum of expected downtime
    const reconnectDelay = Math.min(
      Math.max(expectedDowntime - 5000, 3000),
      expectedDowntime
    );
    
    console.log(`WebSocketManager: Server restart reconnect scheduled in ${reconnectDelay}ms`);
    setConnectionState(ConnectionState.RECONNECTING);
    
    // Show a toast notification for users using our toast system directly
    toast.info(
      `Server maintenance in progress. Connection will resume automatically in about ${Math.ceil(expectedDowntime/1000)} seconds.`,
      {
        title: 'Server Restarting',
        duration: Math.min(expectedDowntime + 5000, 30000), // Show until reconnect + buffer
        id: 'server-restart-' + Date.now()
      }
    );
    
    // Schedule reconnect
    reconnectTimeoutRef.current = window.setTimeout(() => {
      reconnectTimeoutRef.current = null;
      serverRestartRef.current.inProgress = false;
      serverRestartRef.current.reconnectScheduled = false;
      connect();
    }, reconnectDelay);
  };
  
  // Handle WebSocket error event
  const handleError = (event: Event) => {
    console.error("WebSocketManager: WebSocket error:", event);
    setConnectionState(ConnectionState.ERROR);
    
    dispatchWebSocketEvent('error', {
      event: event.type,
      timestamp: new Date().toISOString()
    });
  };
  
  // Start heartbeat interval
  const startHeartbeat = () => {
    // Clear any existing interval
    stopHeartbeat();
    
    // Reset counter
    missedHeartbeatsRef.current = 0;
    
    // Start new interval
    heartbeatIntervalRef.current = window.setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        // Send ping
        try {
          wsRef.current.send(JSON.stringify({
            type: MessageType.REQUEST,
            topic: SOCKET_TYPES.SYSTEM_SETTINGS,
            action: 'ping',
            requestId: crypto.randomUUID(),
            timestamp: new Date().toISOString()
          }));
          
          // Increment missed heartbeats
          missedHeartbeatsRef.current++;
          
          // If we've missed too many heartbeats, consider the connection dead
          if (missedHeartbeatsRef.current >= maxMissedHeartbeats) {
            console.warn(`WebSocketManager: Missed ${missedHeartbeatsRef.current} heartbeats, reconnecting...`);
            cleanupConnection();
            scheduleReconnect();
          }
        } catch (error) {
          console.error("WebSocketManager: Error sending heartbeat:", error);
        }
      }
    }, 30000); // 30 second interval
  };
  
  // Stop heartbeat interval
  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current !== null) {
      window.clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };
  
  // Schedule reconnection
  const scheduleReconnect = () => {
    // Clear any existing timeout
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Don't exceed max attempts
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.warn(`WebSocketManager: Maximum reconnection attempts (${maxReconnectAttempts}) reached`);
      setConnectionState(ConnectionState.ERROR);
      setConnectionError(`Maximum reconnection attempts (${maxReconnectAttempts}) reached`);
      return;
    }
    
    // Increment attempt counter
    reconnectAttemptsRef.current++;
    
    // Calculate delay with exponential backoff
    const delay = Math.min(
      1000 * Math.pow(2, reconnectAttemptsRef.current),
      30000 // Max 30 second delay
    );
    
    console.log(`WebSocketManager: Scheduling reconnect attempt ${reconnectAttemptsRef.current} in ${delay}ms`);
    setConnectionState(ConnectionState.RECONNECTING);
    
    // Schedule reconnect
    reconnectTimeoutRef.current = window.setTimeout(() => {
      reconnectTimeoutRef.current = null;
      connect();
    }, delay);
  };
  
  // Clean up WebSocket connection
  const cleanupConnection = () => {
    // Stop heartbeat
    stopHeartbeat();
    
    // Close WebSocket
    if (wsRef.current) {
      try {
        wsRef.current.onclose = null; // Prevent handleClose from being called
        wsRef.current.onerror = null; // Prevent handleError from being called
        wsRef.current.close();
      } catch (err) {
        console.error("WebSocketManager: Error closing WebSocket:", err);
      }
      wsRef.current = null;
    }
    
    // Clear any reconnect timeout
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };
  
  // Send authentication message by subscribing to restricted topics
  const authenticate = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error("WebSocketManager: Cannot authenticate - WebSocket not open");
      return;
    }
    
    if (!authState.isLoggedIn) {
      console.error("WebSocketManager: Cannot authenticate - User not logged in");
      return;
    }
    
    // Get token for authentication
    const user = useStore.getState().user;
    const wsToken = user?.wsToken;
    const jwt = user?.jwt;
    const sessionToken = user?.session_token;
    
    // Log all available tokens for debugging
    console.log("WebSocketManager: Authentication tokens available:", {
      hasWsToken: !!wsToken,
      hasJwt: !!jwt,
      hasSessionToken: !!sessionToken,
      wsTokenLength: wsToken ? wsToken.length : 0,
      jwtLength: jwt ? jwt.length : 0,
      sessionTokenLength: sessionToken ? sessionToken.length : 0
    });
    
    // Choose token in order of preference
    const authToken = wsToken || jwt || sessionToken;
    
    if (!authToken) {
      console.error("WebSocketManager: Cannot authenticate - No auth token available");
      return;
    }
    
    // Determine which token we're using
    const tokenType = wsToken ? 'wsToken' : jwt ? 'jwt' : 'sessionToken';
    console.log(`WebSocketManager: Authenticating using ${tokenType} with length ${authToken.length}`);
    
    // If token looks invalid, try to refresh it
    if (authToken.length < 20) {
      console.warn(`WebSocketManager: Token looks suspicious (length ${authToken.length}), may fail authentication`);
    }
    
    console.log("WebSocketManager: Authenticating via subscription to restricted topics");
    setConnectionState(ConnectionState.AUTHENTICATING);
    
    // The backend uses subscriptions with authToken to authenticate
    try {
      // Subscribe to system and market data first - these don't need auth
      const publicSubscriptionMessage: SubscriptionMessage = {
        type: MessageType.SUBSCRIBE,
        topics: [
          SOCKET_TYPES.SYSTEM_SETTINGS,
          SOCKET_TYPES.MARKET_DATA
        ]
      };
      
      wsRef.current.send(JSON.stringify(publicSubscriptionMessage));
      console.log("WebSocketManager: Subscribed to public topics");
      
      // Now try to subscribe to restricted topics with auth token
      const restrictedSubscriptionMessage: SubscriptionMessage = {
        type: MessageType.SUBSCRIBE,
        topics: [
          SOCKET_TYPES.PORTFOLIO, // Requires auth
          SOCKET_TYPES.NOTIFICATION, // Requires auth
          SOCKET_TYPES.WALLET     // Requires auth
        ],
        authToken // Pass the auth token with the subscription
      };
      
      wsRef.current.send(JSON.stringify(restrictedSubscriptionMessage));
      
      dispatchWebSocketEvent('auth_attempt', {
        timestamp: new Date().toISOString(),
        tokenType,
        tokenLength: authToken.length,
        topics: restrictedSubscriptionMessage.topics
      });
    } catch (error) {
      console.error("WebSocketManager: Error sending authentication message:", error);
      setConnectionError(error instanceof Error ? error.message : String(error));
    }
  };
  
  // Register a message listener
  const registerListener = (
    id: string, 
    types: string[], 
    callback: (message: WebSocketMessage) => void,
    topics?: string[]
  ) => {
    // Check if listener already exists
    const existingIndex = listenersRef.current.findIndex(l => l.id === id);
    
    if (existingIndex !== -1) {
      // Update existing listener
      listenersRef.current[existingIndex] = { id, types, topics, callback };
    } else {
      // Add new listener
      listenersRef.current.push({ id, types, topics, callback });
    }
    
    console.log(`WebSocketManager: Registered listener ${id}`, {
      types,
      topics: topics || 'all topics'
    });
    
    // Return unregister function
    return () => {
      listenersRef.current = listenersRef.current.filter(l => l.id !== id);
      console.log(`WebSocketManager: Unregistered listener ${id}`);
    };
  };
  
  // Distribute message to listeners
  const distributeMessage = (message: WebSocketMessage) => {
    const { type, topic } = message;
    
    // Log the message for better debugging
    console.log(`WebSocketManager: Distributing message of type ${type} ${topic ? `with topic ${topic}` : 'without a topic'}`);
    
    // SYSTEM messages should be distributed to all listeners regardless of auth state
    const isSystemMessage = type === MessageType.SYSTEM;
    
    // Find listeners for this message type and topic (if specified)
    const listeners = listenersRef.current.filter(listener => {
      // First check if listener is interested in this message type
      const typeMatch = listener.types.includes(type);
      if (!typeMatch) return false;
      
      // If listener has topic filters AND message has a topic, check for match
      if (listener.topics && topic) {
        return listener.topics.includes(topic);
      }
      
      // For SYSTEM messages, always distribute regardless of topic filters
      if (isSystemMessage) {
        return true;
      }
      
      // If listener has no topic filters or message has no topic, match by type only
      return true;
    });
    
    // Distribute message to each matching listener
    listeners.forEach(listener => {
      try {
        listener.callback(message);
      } catch (error) {
        console.error(`WebSocketManager: Error in listener ${listener.id}:`, error);
      }
    });
    
    // Log distribution
    if (listeners.length > 0) {
      dispatchWebSocketEvent('message_distributed', {
        type,
        topic: topic || 'none',
        listenerCount: listeners.length,
        listenerIds: listeners.map(l => l.id),
        timestamp: new Date().toISOString()
      });
    } else {
      console.log(`WebSocketManager: No listeners found for message type ${type} ${topic ? `with topic ${topic}` : ''}`);
    }
  };
  
  // Send a message through the WebSocket
  const sendMessage = (message: WebSocketMessage) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error("WebSocketManager: Cannot send message - WebSocket not open");
      return false;
    }
    
    try {
      wsRef.current.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error("WebSocketManager: Error sending message:", error);
      return false;
    }
  };
  
  // Update the singleton instance whenever key state changes
  useEffect(() => {
    // Create a wrapper for registerListener that matches the expected signature in the instance
    const registerListenerWrapper = (
      id: string, 
      types: string[], 
      callback: (message: WebSocketMessage) => void
    ) => {
      return registerListener(id, types, callback);
    };
    
    setupWebSocketInstance(
      registerListenerWrapper,
      sendMessage,
      connectionState,
      connectionError
    );
  }, [connectionState, connectionError]);
  
  // This component doesn't render anything
  return null;
};

// Use React.memo to prevent unnecessary re-renders
export const WebSocketManager = React.memo(WebSocketManagerComponent, () => true);

export default WebSocketManager;