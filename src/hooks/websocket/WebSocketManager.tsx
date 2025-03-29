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

// Single unified WebSocket URL - this is the exact path specified in WS.TXT
const UNIFIED_WS_ENDPOINT = '/api/v69/ws';

// Message types for the unified WebSocket - from backend specs
export enum MessageType {
  // Core message types from backend
  SUBSCRIBE = 'SUBSCRIBE',
  UNSUBSCRIBE = 'UNSUBSCRIBE',
  REQUEST = 'REQUEST',
  COMMAND = 'COMMAND',
  DATA = 'DATA',
  ERROR = 'ERROR',
  SYSTEM = 'SYSTEM',
  ACKNOWLEDGMENT = 'ACKNOWLEDGMENT',
  
  // Authentication message types
  AUTH = 'AUTH',
  AUTH_SUCCESS = 'AUTH_SUCCESS',
  
  // Connection message types (internal)
  PING = 'PING',
  PONG = 'PONG'
}

// Topic types from backend specs
export enum TopicType {
  MARKET_DATA = 'market-data',
  PORTFOLIO = 'portfolio',
  SYSTEM = 'system',
  CONTEST = 'contest',
  USER = 'user',
  ADMIN = 'admin',
  WALLET = 'wallet',
  SKYDUEL = 'skyduel'
}

// WebSocket connection states
enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  AUTHENTICATING = 'authenticating',
  AUTHENTICATED = 'authenticated',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

// Message interface based on backend's unified WebSocket API
interface WebSocketMessage {
  type: string;
  topic?: string;
  data?: any;
  error?: string;
  timestamp?: string;
  authToken?: string;
  topics?: string[];
  action?: string;
  message?: string;
}

// Type helpers for specific message formats - used directly in the code
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
  
  // Authentication state
  const authState = React.useMemo(() => ({
    isLoggedIn: !!user,
    isAdmin: authContext.isAdmin?.() || false,
    hasWsToken: !!user?.wsToken,
    hasJwt: !!user?.jwt,
    canAuthenticate: !!user
  }), [user?.wallet_address, user?.jwt, user?.wsToken, authContext]);
  
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
      wsUrl = `${configuredWsUrl}${UNIFIED_WS_ENDPOINT}`;
      console.log("WebSocketManager: Using configured WS_URL from environment:", configuredWsUrl);
    } else {
      // Fallback mechanism based on hostname
      const hostname = window.location.hostname;
      const isProd = hostname === "degenduel.me";
      const isDev = hostname === "dev.degenduel.me";
      
      if (isProd) {
        wsUrl = `wss://degenduel.me${UNIFIED_WS_ENDPOINT}`;
        console.log("WebSocketManager: Using production WebSocket URL based on hostname");
      } else if (isDev) {
        wsUrl = `wss://dev.degenduel.me${UNIFIED_WS_ENDPOINT}`;
        console.log("WebSocketManager: Using development WebSocket URL based on hostname"); 
      } else {
        // Local development or unknown environment
        wsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}${UNIFIED_WS_ENDPOINT}`;
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
        
        // For heartbeat messages - reset counter as documented
        if (message.action === 'heartbeat') {
          missedHeartbeatsRef.current = 0;
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
        
        // Only filter out auth-related error messages
        if ((message.error && message.error.includes('auth')) || 
            (message.message && message.message.includes('auth')) ||
            (typeof message.error === 'number' && message.error === 4002)) { // Code 4002 is "Unknown message type"
          console.log("WebSocketManager: Filtering out authentication error message from listeners");
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
  
  // Handle WebSocket close event
  const handleClose = (event: CloseEvent) => {
    console.log(`WebSocketManager: Connection closed. Code: ${event.code}, Reason: ${event.reason || 'No reason provided'}`);
    
    // Stop heartbeat
    stopHeartbeat();
    
    // Update state
    setConnectionState(ConnectionState.DISCONNECTED);
    
    // Schedule reconnect if not a normal closure
    if (event.code !== 1000) {
      scheduleReconnect();
    }
    
    dispatchWebSocketEvent('disconnected', {
      code: event.code,
      reason: event.reason,
      timestamp: new Date().toISOString()
    });
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
            topic: TopicType.SYSTEM,
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
    
    // Choose token in order of preference
    const authToken = wsToken || jwt || sessionToken;
    
    if (!authToken) {
      console.error("WebSocketManager: Cannot authenticate - No auth token available");
      return;
    }
    
    console.log("WebSocketManager: Authenticating via subscription to restricted topics");
    setConnectionState(ConnectionState.AUTHENTICATING);
    
    // The backend uses subscriptions with authToken to authenticate
    try {
      // Subscribe to essential topics including some that require authentication
      const subscriptionMessage: SubscriptionMessage = {
        type: MessageType.SUBSCRIBE,
        topics: [
          TopicType.SYSTEM,
          TopicType.MARKET_DATA,
          TopicType.PORTFOLIO, // Requires auth
          TopicType.USER,      // Requires auth
          TopicType.WALLET     // Requires auth
        ],
        authToken // Pass the auth token with the subscription
      };
      
      wsRef.current.send(JSON.stringify(subscriptionMessage));
      
      dispatchWebSocketEvent('auth_attempt', {
        timestamp: new Date().toISOString(),
        tokenType: wsToken ? 'wsToken' : jwt ? 'jwt' : 'sessionToken',
        topics: subscriptionMessage.topics
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
    
    setupInstance(
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

// Singleton instance references
// These will be set by the WebSocketManager component
let instance: {
  registerListener: (id: string, types: string[], callback: (message: WebSocketMessage) => void) => () => void;
  sendMessage: (message: WebSocketMessage) => boolean;
  connectionState: ConnectionState;
  connectionError: string | null;
} | null = null;

// Set up the singleton instance when WebSocketManager mounts
const setupInstance = (
  registerFn: (id: string, types: string[], callback: (message: WebSocketMessage) => void) => () => void,
  sendFn: (message: WebSocketMessage) => boolean,
  state: ConnectionState,
  error: string | null
) => {
  instance = {
    registerListener: registerFn,
    sendMessage: sendFn,
    connectionState: state,
    connectionError: error
  };
};

// Hook for components to use the WebSocket with topic filtering
export function useUnifiedWebSocket<T = any>(
  id: string, 
  types: string[] = [MessageType.DATA], 
  onMessage: (message: T) => void,
  topics?: string[]
) {
  // Effect for registration
  useEffect(() => {
    if (!instance) {
      console.error("WebSocketManager: Cannot register listener - WebSocketManager not initialized");
      return () => {};
    }
    
    // Use the registerListener with topics filtering applied in the callback
    const unregister = instance.registerListener(id, types, message => {
      // If topics are provided, only forward messages with matching topics
      if (topics && message.topic && !topics.includes(message.topic)) {
        return; // Skip messages with non-matching topics
      }
      // Call onMessage with the data
      onMessage(message as T);
    });
    
    // Clean up on unmount
    return unregister;
  }, [id, types, topics, onMessage]);
  
  // Safety check
  if (!instance) {
    return {
      sendMessage: () => false,
      isConnected: false,
      isAuthenticated: false,
      connectionState: ConnectionState.DISCONNECTED,
      error: "WebSocketManager not initialized",
      // Subscription helpers
      subscribe: () => false,
      unsubscribe: () => false,
      request: () => false
    };
  }
  
  // Helper for subscribing to topics
  const subscribe = (topicsToSubscribe: string[]) => {
    if (!instance || topicsToSubscribe.length === 0) return false;
    
    const message: SubscriptionMessage = {
      type: MessageType.SUBSCRIBE,
      topics: topicsToSubscribe
    };
    
    // Add auth token if available
    const user = useStore.getState().user;
    if (user?.wsToken || user?.jwt) {
      message.authToken = user.wsToken || user.jwt;
    }
    
    return instance.sendMessage(message);
  };
  
  // Helper for unsubscribing from topics
  const unsubscribe = (topicsToUnsubscribe: string[]) => {
    if (!instance || topicsToUnsubscribe.length === 0) return false;
    
    return instance.sendMessage({
      type: MessageType.UNSUBSCRIBE,
      topics: topicsToUnsubscribe
    });
  };
  
  // Helper for making requests
  const request = (topic: string, action: string, params: any = {}) => {
    if (!instance) return false;
    
    const requestMessage: WebSocketMessage = {
      type: MessageType.REQUEST,
      topic,
      action,
      ...params
    };
    
    return instance.sendMessage(requestMessage);
  };
  
  // Return functions for interacting with the WebSocket
  return {
    sendMessage: (message: any) => instance!.sendMessage(message),
    isConnected: instance.connectionState === ConnectionState.CONNECTED || 
                instance.connectionState === ConnectionState.AUTHENTICATED,
    isAuthenticated: instance.connectionState === ConnectionState.AUTHENTICATED,
    connectionState: instance.connectionState,
    error: instance.connectionError,
    // Add higher-level methods
    subscribe,
    unsubscribe,
    request
  };
}

// Default export for backward compatibility
export default WebSocketManager;