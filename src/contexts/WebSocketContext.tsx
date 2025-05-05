// src/contexts/WebSocketContext.tsx

/**
 * DEPRECATED - This context is scheduled for removal in the next major update.
 * Please use the UnifiedWebSocketContext instead, which provides improved WebSocket functionality.
 * 
 * @author @BranchManager69
 * @last-modified 2025-05-05
 * @deprecated Use UnifiedWebSocketContext instead for improved WebSocket management
 * 
 * This context provides a centralized WebSocket connection management system.
 * It replaces the component-based WebSocketManager with a proper React Context
 * that manages WebSocket connections at the application level.
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { authDebug } from '../config/config';
import { useAuth } from '../hooks/useAuth';
import {
  ConnectionState,
  DDExtendedMessageType,
  SOCKET_TYPES,
  WEBSOCKET_ENDPOINT,
  WebSocketMessage
} from '../hooks/websocket/types';
import { setupWebSocketInstance } from '../hooks/websocket/useUnifiedWebSocket';
import { useStore } from '../store/useStore';
import { dispatchWebSocketEvent, initializeWebSocketTracking } from '../utils/wsMonitor';

// Config
import { config } from '../config/config';

// Get the secure DegenDuel RPC URL
const DEGENDUEL_RPC_URL = config.SOLANA.RPC_BASE_URL; 
console.log('[WebSocketContext] DegenDuel RPC:', DEGENDUEL_RPC_URL);

// Interface for message listeners
interface MessageListener {
  id: string;
  types: DDExtendedMessageType[];
  topics?: string[];
  callback: (message: any) => void;
}

// Define the context type
interface WebSocketContextType {
  // Connection state
  isConnected: boolean;
  isAuthenticated: boolean;
  connectionState: ConnectionState;
  connectionError: string | null;
  
  // Methods for interacting with the WebSocket
  sendMessage: (message: any) => boolean;
  subscribe: (topics: string[]) => boolean;
  unsubscribe: (topics: string[]) => boolean;
  request: (topic: string, action: string, params?: any) => boolean;
  
  // Register a listener for messages
  registerListener: (
    id: string,
    types: DDExtendedMessageType[],
    callback: (message: any) => void,
    topics?: string[]
  ) => () => void;
}

// Create the context with default values
const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  isAuthenticated: false,
  connectionState: ConnectionState.DISCONNECTED,
  connectionError: null,
  sendMessage: () => false,
  subscribe: () => false,
  unsubscribe: () => false,
  request: () => false,
  registerListener: () => () => {}
});

// Export the WebSocket provider component
/**
 * 
 * @param {React.ReactNode} children - The children of the WebSocket provider
 * @returns {React.ReactNode} - The WebSocket provider component
 * @deprecated Use UnifiedWebSocketProvider from UnifiedWebSocketContext instead
 */
export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Log deprecation warning
  React.useEffect(() => {
    console.warn(
      "%c[DEPRECATED] WebSocketProvider is deprecated and will be removed in the next release. " +
      "Please use the UnifiedWebSocketProvider from UnifiedWebSocketContext instead. " +
      "See UNIFIED_AUTH_SYSTEM_README.md and src/AUTH_MIGRATION_PLAN.md for detailed migration instructions.",
      "color: red; font-weight: bold; background-color: yellow; padding: 2px 4px;"
    );
    console.info(
      "Migration steps:\n" +
      "1. Replace <WebSocketProvider> with <UnifiedWebSocketProvider> in your app component\n" +
      "2. Update WebSocket hook usage to new hook patterns in hooks/websocket/topic-hooks\n" +
      "3. See App.unified.tsx for reference implementation\n" +
      "4. See src/hooks/websocket/MIGRATION_GUIDE.md for detailed WebSocket hook migration steps"
    );
  }, []);

  // Get auth state from store and context
  const user = useStore(state => state.user);
  const authContext = useAuth();
  
  // WebSocket connection state
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);
  
  // Message listeners registry
  const listenersRef = useRef<MessageListener[]>([]);
  
  // Reconnection logic
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttempts = 5; // Maximum reconnection attempts
  const reconnectTimeoutRef = useRef<number | null>(null);
  
  // Heartbeat logic
  const heartbeatIntervalRef = useRef<number | null>(null);
  const missedHeartbeatsRef = useRef<number>(0);
  const maxMissedHeartbeats = 3; // Maximum missed heartbeats before reconnect
  
  // Server restart tracking
  const serverRestartRef = useRef({
    inProgress: false,
    expectedDowntime: 30000, // Default: 30 seconds
    shutdownTime: 0,
    reconnectScheduled: false
  });
  
  // Authentication state
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
    authDebug('WebSocketContext', 'Initializing WebSocket context');
    initializeWebSocketTracking();
    
    dispatchWebSocketEvent('init', {
      message: 'WebSocketContext initialized',
      timestamp: new Date().toISOString()
    });
    
    // Initialize the WebSocket manager singleton directly here
    // This is critical - it sets up the instance that useUnifiedWebSocket will access
    setupWebSocketInstance(
      // Register listener function that matches the expected signature
      (id: string, types: DDExtendedMessageType[], callback: (message: any) => void) => {
        return registerListener(id, types, callback);
      },
      // Send message function
      sendMessage,
      // Current connection state
      connectionState,
      // Current connection error
      connectionError
    );
    
    // CRITICAL: Expose WebSocketContext globally for client log forwarder
    // This allows utilities to access the WebSocket without circular dependencies
    if (typeof window !== 'undefined') {
      (window as any).__DD_WEBSOCKET_CONTEXT = {
        sendMessage,
        isConnected: connectionState === ConnectionState.CONNECTED || 
                     connectionState === ConnectionState.AUTHENTICATED
      };
    }
    
    // Listen for token refresh fallback events
    // This handles cases where a primary token refresh fails but a fallback is available
    const handleTokenFallback = (event: CustomEvent) => {
      const { type, source } = event.detail;
      authDebug('WebSocketContext', 'Received token fallback event', { type, source });
      
      // If we're already connected, try to re-authenticate with the fallback token
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        authDebug('WebSocketContext', 'Re-authenticating with fallback token');
        authenticate(false, false); // Use existing tokens, don't retry or force refresh
      }
    };
    
    // Listen for wallet disconnected events to clean up WebSocket connections
    const handleWalletDisconnected = (event: CustomEvent) => {
      authDebug('WebSocketContext', 'Wallet disconnected event received', { 
        timestamp: event.detail?.timestamp,
        readyState: wsRef.current?.readyState
      });
      
      // Clean up existing connection if any
      cleanupConnection();
      
      // Reset connection state
      setConnectionState(ConnectionState.DISCONNECTED);
      
      // Wait longer before attempting to reconnect
      // This will connect with public topics only since user is not logged in
      setTimeout(() => {
        authDebug('WebSocketContext', 'Reconnecting as public user after wallet disconnect');
        connect();
      }, 2000); // Increased from 500ms to 2000ms
    };
    
    window.addEventListener('token-refresh-fallback', handleTokenFallback as EventListener);
    window.addEventListener('wallet-disconnected', handleWalletDisconnected as EventListener);
    
    // Attempt to connect
    connect();
    
    // Clean up on unmount
    return () => {
      authDebug('WebSocketContext', 'Cleaning up WebSocket context');
      window.removeEventListener('token-refresh-fallback', handleTokenFallback as EventListener);
      window.removeEventListener('wallet-disconnected', handleWalletDisconnected as EventListener);
      cleanupConnection();
    };
  }, []);
  
  // Connect to the WebSocket
  /**
   * Connects to the WebSocket
   */
  const connect = useCallback(() => {
    // Don't connect if already connected or connecting
    if (wsRef.current && (
      wsRef.current.readyState === WebSocket.OPEN || 
      wsRef.current.readyState === WebSocket.CONNECTING
    )) {
      authDebug('WebSocketContext', 'Already connected or connecting');
      return;
    }
    
    // Clear any existing WebSocket
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (err) {
        console.error("WebSocketContext: Error closing previous connection:", err);
      }
      wsRef.current = null;
    }
    
    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Build WebSocket URL
    let wsUrl;
    const configuredWsUrl = import.meta.env.VITE_WS_URL;
    
    if (configuredWsUrl) {
      wsUrl = `${configuredWsUrl}${WEBSOCKET_ENDPOINT}`;
      authDebug('WebSocketContext', 'Using configured WS_URL from environment', { url: configuredWsUrl });
    } else {
      // Fallback mechanism based on hostname
      const hostname = window.location.hostname;
      const isProd = hostname === "degenduel.me";
      const isDev = hostname === "dev.degenduel.me";
      
      if (isProd) {
        wsUrl = `wss://degenduel.me${WEBSOCKET_ENDPOINT}`;
        authDebug('WebSocketContext', 'Using production WebSocket URL based on hostname');
      } else if (isDev) {
        wsUrl = `wss://dev.degenduel.me${WEBSOCKET_ENDPOINT}`;
        authDebug('WebSocketContext', 'Using development WebSocket URL based on hostname'); 
      } else {
        // Local development or unknown environment
        wsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}${WEBSOCKET_ENDPOINT}`;
        authDebug('WebSocketContext', 'Using local WebSocket URL based on current host');
      }
    }
    
    authDebug('WebSocketContext', 'Connecting to WebSocket', { url: wsUrl });
    
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
      authDebug('WebSocketContext', 'Error creating WebSocket connection', { error });
      setConnectionError(error instanceof Error ? error.message : String(error));
      setConnectionState(ConnectionState.ERROR);
      scheduleReconnect();
    }
  }, []);
  
  // Handle WebSocket open event
  /**
   * Handles the WebSocket open event
   */
  const handleOpen = useCallback(() => {
    authDebug('WebSocketContext', 'Connection established');
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
  }, [authState.isLoggedIn]);
  
  // Handle WebSocket messages
  /**
   * Handles the WebSocket messages
   */
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      
      // Process system messages
      if ((message.type === DDExtendedMessageType.SYSTEM && message.action === 'pong') || 
          message.type === DDExtendedMessageType.PONG) {
        // Reset heartbeat counter
        missedHeartbeatsRef.current = 0;
        return;
      } else if (message.type === DDExtendedMessageType.ACKNOWLEDGMENT && message.message?.includes('authenticated')) {
        // Server acknowledges authentication
        setConnectionState(ConnectionState.AUTHENTICATED);
        dispatchWebSocketEvent('authenticated', {
          timestamp: new Date().toISOString()
        });
        authDebug('WebSocketContext', 'Authentication successful');
        return;
      } else if (message.type === DDExtendedMessageType.SYSTEM) {
        // Handle server shutdown notification
        if (message.action === 'shutdown') {
          // Update server restart tracking
          serverRestartRef.current.inProgress = true;
          serverRestartRef.current.shutdownTime = Date.now();
          
          // Extract expected downtime if provided
          const expectedDowntime = 
            (message.data && typeof message.data === 'object' && 'expectedDowntime' in message.data)
              ? (message.data as any).expectedDowntime 
              : 30000; // Default to 30 seconds
              
          serverRestartRef.current.expectedDowntime = expectedDowntime;
          
          // Schedule reconnection with optimal timing
          scheduleServerRestartReconnect(expectedDowntime);
        }
      } else if (message.type === DDExtendedMessageType.ERROR) {
        authDebug('WebSocketContext', 'Received error message', { message });
        
        // Handle token expiration
        if ((message as any).code === 4401 && (message as any).reason === 'token_expired') {
          authDebug('WebSocketContext', 'Token expired error detected');
          
          // Get current user state and clear tokens
          const user = useStore.getState().user;
          if (user) {
            useStore.getState().setUser({
              ...user,
              jwt: undefined,
              wsToken: undefined,
              session_token: undefined
            });
          }
          return;
        }
      }
      
      // Distribute message to all registered listeners
      distributeMessage(message);
      
    } catch (error) {
      authDebug('WebSocketContext', 'Error processing message', { error, data: event.data });
    }
  }, []);
  
  // Handle WebSocket close event
  /**
   * Handles the WebSocket close event
   */
  const handleClose = useCallback((event: CloseEvent) => {
    authDebug('WebSocketContext', 'Connection closed', { 
      code: event.code, 
      reason: event.reason || 'No reason provided' 
    });
    
    // Stop heartbeat
    stopHeartbeat();
    
    // Update state
    setConnectionState(ConnectionState.DISCONNECTED);
    
    // Check if this is a clean closure due to server restart
    if (event.code === 1000 && event.reason && event.reason.includes('restart')) {
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
  }, []);
  
  // Handle WebSocket error event
  /**
   * Handles the WebSocket error event
   */
  const handleError = useCallback((event: Event) => {
    authDebug('WebSocketContext', 'WebSocket error', { event });
    setConnectionState(ConnectionState.ERROR);
    
    dispatchWebSocketEvent('error', {
      event: event.type,
      timestamp: new Date().toISOString()
    });
  }, []);
  
  // Schedule reconnection for server restart with optimized timing
  /**
   * Schedules a reconnection for server restart with optimized timing
   */
  const scheduleServerRestartReconnect = useCallback((expectedDowntime: number) => {
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
    
    authDebug('WebSocketContext', 'Server restart reconnect scheduled', { 
      reconnectDelay,
      expectedDowntime
    });
    setConnectionState(ConnectionState.RECONNECTING);
    
    // Schedule reconnect
    reconnectTimeoutRef.current = window.setTimeout(() => {
      reconnectTimeoutRef.current = null;
      serverRestartRef.current.inProgress = false;
      serverRestartRef.current.reconnectScheduled = false;
      connect();
    }, reconnectDelay);
  }, [connect]);
  
  // Schedule normal reconnection with exponential backoff
  /**
   * Schedules a normal reconnection with exponential backoff
   */
  const scheduleReconnect = useCallback(() => {
    // Clear any existing timeout
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Don't exceed max attempts
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      authDebug('WebSocketContext', 'Maximum reconnection attempts reached', { 
        attempts: reconnectAttemptsRef.current,
        max: maxReconnectAttempts
      });
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
    
    authDebug('WebSocketContext', 'Scheduling reconnect attempt', {
      attempt: reconnectAttemptsRef.current,
      delay
    });
    setConnectionState(ConnectionState.RECONNECTING);
    
    // Schedule reconnect
    reconnectTimeoutRef.current = window.setTimeout(() => {
      reconnectTimeoutRef.current = null;
      connect();
    }, delay);
  }, [connect]);
  
  // Start heartbeat interval
  /**
   * Starts the heartbeat interval
   */
  const startHeartbeat = useCallback(() => {
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
            type: DDExtendedMessageType.REQUEST,
            topic: SOCKET_TYPES.SYSTEM,
            action: 'ping',
            requestId: crypto.randomUUID(),
            timestamp: new Date().toISOString()
          }));
          
          // Increment missed heartbeats
          missedHeartbeatsRef.current++;
          
          // If we've missed too many heartbeats, consider the connection dead
          if (missedHeartbeatsRef.current >= maxMissedHeartbeats) {
            authDebug('WebSocketContext', 'Missed too many heartbeats, reconnecting', { 
              missed: missedHeartbeatsRef.current, 
              max: maxMissedHeartbeats 
            });
            cleanupConnection();
            scheduleReconnect();
          }
        } catch (error) {
          authDebug('WebSocketContext', 'Error sending heartbeat', { error });
        }
      }
    }, 30000); // 30 second interval
  }, [scheduleReconnect]);
  
  // Stop heartbeat interval
  /**
   * Stops the heartbeat interval
   */
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current !== null) {
      window.clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);
  
  // Clean up WebSocket connection
  /**
   * Cleans up the WebSocket connection
   */
  const cleanupConnection = useCallback(() => {
    // Stop heartbeat
    stopHeartbeat();
    
    // Close WebSocket
    if (wsRef.current) {
      try {
        wsRef.current.onclose = null; // Prevent handleClose from being called
        wsRef.current.onerror = null; // Prevent handleError from being called
        wsRef.current.close();
      } catch (err) {
        console.error("WebSocketContext: Error closing WebSocket:", err);
      }
      wsRef.current = null;
    }
    
    // Clear any reconnect timeout
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, [stopHeartbeat]);
  
  // Send authentication message with enhanced error handling and retry mechanism
  /**
   * Sends an authentication message to the WebSocket
   * 
   * @param retryOnFailure Whether to retry if no tokens are available (will trigger getAccessToken)
   * @param forceRefresh Whether to force a token refresh before authentication
   */
  const authenticate = useCallback(async (retryOnFailure = true, forceRefresh = false) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      authDebug('WebSocketContext', 'Cannot authenticate - WebSocket not open');
      return;
    }
    
    if (!authState.isLoggedIn) {
      authDebug('WebSocketContext', 'Cannot authenticate - User not logged in');
      return;
    }
    
    // Get user state with tokens
    const user = useStore.getState().user;
    let wsToken = user?.wsToken;
    let jwt = user?.jwt;
    const sessionToken = user?.session_token;
    
    // Detect if this is Twitter authentication
    const isTwitterAuth = authContext.activeAuthMethod === 'twitter' || 
                          authContext.isTwitterAuth?.() || 
                          (authContext.authMethods?.twitter?.active === true); // Check using auth context methods
    
    // Force token refresh if needed
    if ((forceRefresh || isTwitterAuth) && authContext.getAccessToken) {
      try {
        if (isTwitterAuth) {
          authDebug('WebSocketContext', 'Twitter auth detected, ensuring we have a WebSocket token');
        } else {
          authDebug('WebSocketContext', 'Forcing token refresh before authentication');
        }
        
        const newToken = await authContext.getAccessToken();
        if (newToken && user) {
          wsToken = newToken;
          // Update the token in the store as well
          useStore.getState().setUser({
            ...user,
            wsToken: newToken
          } as any); // Type assertion to avoid TS error
        }
      } catch (error) {
        authDebug('WebSocketContext', 'Token refresh failed', { error });
      }
    }
    
    // Log available tokens
    authDebug('WebSocketContext', 'Authentication tokens available', {
      hasWsToken: !!wsToken,
      hasJwt: !!jwt,
      hasSessionToken: !!sessionToken
    });
    
    // Use tokens in order of priority: WebSocket token first, then JWT, then session token
    const authToken = wsToken || jwt || sessionToken;
    
    if (!authToken) {
      authDebug('WebSocketContext', 'No auth token available');
      
      // If we should retry and can get a token, do so
      if (retryOnFailure && authContext.getAccessToken) {
        authDebug('WebSocketContext', 'Attempting to get a fresh access token');
        try {
          const token = await authContext.getAccessToken();
          if (token && user) {
            authDebug('WebSocketContext', 'Received new token, updating and retrying auth');
            // Update the token in the store
            useStore.getState().setUser({
              ...user,
              wsToken: token
            } as any); // Type assertion to avoid TS error
            // Retry authentication with the new token but don't allow further retries
            authenticate(false, false);
            return;
          }
        } catch (error) {
          authDebug('WebSocketContext', 'Failed to get fresh token', { error });
        }
      }
      
      // If we got here, we couldn't get a token or decided not to retry
      authDebug('WebSocketContext', 'Authentication failed - No valid auth token available');
      
      // Dispatch event for monitoring
      dispatchWebSocketEvent('auth_failure', {
        timestamp: new Date().toISOString(),
        reason: 'No valid auth token available'
      });
      
      // Still subscribe to public topics to allow app to function with market data
      authDebug('WebSocketContext', 'Subscribing to public topics only (market data will be available)');
      try {
        const publicSubscriptionMessage = {
          type: DDExtendedMessageType.SUBSCRIBE,
          topics: [
            SOCKET_TYPES.SYSTEM,
            SOCKET_TYPES.MARKET_DATA
          ]
        };
        
        wsRef.current.send(JSON.stringify(publicSubscriptionMessage));
      } catch (error) {
        authDebug('WebSocketContext', 'Error subscribing to public topics', { error });
      }
      
      return;
    }
    
    // Determine which token we're using
    const tokenType = wsToken ? 'wsToken' : jwt ? 'jwt' : 'sessionToken';
    authDebug('WebSocketContext', 'Authenticating using token', { tokenType });
    
    setConnectionState(ConnectionState.AUTHENTICATING);
    
    try {
      // Subscribe to public topics first to ensure we get data regardless of auth status
      const publicSubscriptionMessage = {
        type: DDExtendedMessageType.SUBSCRIBE,
        topics: [
          SOCKET_TYPES.SYSTEM,
          SOCKET_TYPES.MARKET_DATA
        ]
      };
      
      wsRef.current.send(JSON.stringify(publicSubscriptionMessage));
      
      // Now try to subscribe to restricted topics with auth token
      const restrictedSubscriptionMessage = {
        type: DDExtendedMessageType.SUBSCRIBE,
        topics: [
          SOCKET_TYPES.PORTFOLIO,
          SOCKET_TYPES.NOTIFICATION,
          SOCKET_TYPES.WALLET
        ],
        authToken
      };
      
      wsRef.current.send(JSON.stringify(restrictedSubscriptionMessage));
      
      dispatchWebSocketEvent('auth_attempt', {
        timestamp: new Date().toISOString(),
        tokenType,
        tokenLength: authToken.length,
        topics: restrictedSubscriptionMessage.topics
      });
    } catch (error) {
      authDebug('WebSocketContext', 'Error sending authentication message', { error });
      setConnectionError(error instanceof Error ? error.message : String(error));
      
      // Dispatch error event for monitoring
      dispatchWebSocketEvent('auth_error', {
        timestamp: new Date().toISOString(),
        tokenType,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }, [authState.isLoggedIn, authContext]);
  
  // Register a message listener
  /**
   * Registers a message listener
   */
  const registerListener = useCallback((
    id: string, 
    types: DDExtendedMessageType[], 
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
    
    authDebug('WebSocketContext', 'Registered listener', {
      id,
      types,
      topics: topics || 'all topics'
    });
    
    // Return unregister function
    return () => {
      listenersRef.current = listenersRef.current.filter(l => l.id !== id);
      authDebug('WebSocketContext', 'Unregistered listener', { id });
    };
  }, []);
  
  // Distribute message to listeners
  /**
   * Distributes a message to listeners
   */
  const distributeMessage = useCallback((message: WebSocketMessage) => {
    const { type, topic } = message;
    
    // Find listeners for this message type and topic
    const listeners = listenersRef.current.filter(listener => {
      // First check if listener is interested in this message type
      const typeMatch = listener.types.includes(type);
      if (!typeMatch) return false;
      
      // If listener has topic filters AND message has a topic, check for match
      if (listener.topics && topic) {
        return listener.topics.includes(topic);
      }
      
      // If message type is SYSTEM, always distribute regardless of topic filters
      if (type === DDExtendedMessageType.SYSTEM) {
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
        authDebug('WebSocketContext', 'Error in listener callback', { listenerId: listener.id, error });
      }
    });
    
    // Log distribution
    if (listeners.length > 0) {
      authDebug('WebSocketContext', 'Message distributed', {
        type,
        topic: topic || 'none',
        listenerCount: listeners.length,
        listenerIds: listeners.map(l => l.id)
      });
    }
  }, []);
  
  // Send a message through the WebSocket
  /**
   * Sends a message through the WebSocket
   */
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      authDebug('WebSocketContext', 'Cannot send message - WebSocket not open');
      return false;
    }
    
    try {
      wsRef.current.send(JSON.stringify(message));
      return true;
    } catch (error) {
      authDebug('WebSocketContext', 'Error sending message', { error });
      return false;
    }
  }, []);
  
  // Helper for subscribing to topics
  /**
   * Subscribes to topics
   */
  const subscribe = useCallback((topics: string[]) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || topics.length === 0) {
      return false;
    }
    
    const message: any = {
      type: DDExtendedMessageType.SUBSCRIBE,
      topics
    };
    
    // Add auth token if available
    const user = useStore.getState().user;
    if (user?.wsToken || user?.jwt) {
      message.authToken = user.wsToken || user.jwt;
    }
    
    return sendMessage(message);
  }, [sendMessage]);
  
  // Helper for unsubscribing from topics
  /**
   * Unsubscribes from topics
   */
  const unsubscribe = useCallback((topics: string[]) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || topics.length === 0) {
      return false;
    }
    
    return sendMessage({
      type: DDExtendedMessageType.UNSUBSCRIBE,
      topics
    });
  }, [sendMessage]);
  
  // Helper for making requests
  /**
   * Makes a request to the WebSocket
   */
  const request = useCallback((topic: string, action: string, params: any = {}) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return false;
    }
    
    const requestMessage: any = {
      type: DDExtendedMessageType.REQUEST,
      topic,
      action,
      ...params
    };
    
    return sendMessage(requestMessage);
  }, [sendMessage]);
  
  // Handle authentication changes
  /**
   * Handles authentication changes
   */
  useEffect(() => {
    if (connectionState === ConnectionState.CONNECTED && authState.isLoggedIn) {
      authenticate();
    }
  }, [connectionState, authState.isLoggedIn, authenticate]);
  
  // Add automatic token retrieval mechanism
  /**
   * Adds an automatic token retrieval mechanism
   */
  useEffect(() => {
    // When user is logged in but doesn't have a WebSocket token, fetch one
    const fetchTokenIfNeeded = async () => {
      if (authState.isLoggedIn && !authState.hasWsToken && authContext.getAccessToken) {
        try {
          authDebug('WebSocketContext', 'Requesting WebSocket token');
          const token = await authContext.getAccessToken();
          if (token) {
            authDebug('WebSocketContext', 'Token received, updating user');
            // Check if we have a valid user with required properties
            if (user && user.wallet_address) {
              // Use the store's setUser method with the correct typing
              useStore.getState().setUser({
                ...user,
                wsToken: token // Store in dedicated wsToken field
              });
            }
          }
        } catch (error) {
          authDebug('WebSocketContext', 'Failed to get WebSocket token', { error });
        }
      }
    };
    
    fetchTokenIfNeeded();
  }, [authState.isLoggedIn, authState.hasWsToken, authContext, user]);
  
  // Derive isConnected and isAuthenticated from connectionState
  /**
   * Derives isConnected and isAuthenticated from connectionState
   */
  const isConnected = connectionState === ConnectionState.CONNECTED || 
                      connectionState === ConnectionState.AUTHENTICATED;
  const isAuthenticated = connectionState === ConnectionState.AUTHENTICATED;
  
  // Ref to track previous connection state for logging
  const prevStateRef = useRef<ConnectionState | null>(null);
  
  // Update the singleton instance whenever key state changes
  useEffect(() => {
    // Update the WebSocket instance with the current state
    setupWebSocketInstance(
      // Register listener function
      (id: string, types: DDExtendedMessageType[], callback: (message: any) => void) => {
        return registerListener(id, types, callback);
      },
      // Send message function
      sendMessage,
      // Current connection state
      connectionState,
      // Current connection error
      connectionError
    );
    
    // Avoid excessive logging by only logging when state changes
    if (prevStateRef.current !== connectionState) {
      prevStateRef.current = connectionState;
      console.log(`WebSocketContext: Updated WebSocket instance with state: ${connectionState}`);
    }
  }, [connectionState, connectionError]);
  
  // Context value
  /**
   * The context value
   */
  const value = {
    isConnected,
    isAuthenticated,
    connectionState,
    connectionError,
    sendMessage,
    subscribe,
    unsubscribe,
    request,
    registerListener
  };
  
  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Export the hook to use the WebSocket context
/**
 * Exports the hook to use the WebSocket context
 * @deprecated Use hooks from UnifiedWebSocketContext or topic-specific hooks instead
 */
export const useWebSocketContext = () => {
  // Log deprecation warning
  React.useEffect(() => {
    console.warn(
      "%c[DEPRECATED] useWebSocketContext hook is deprecated and will be removed in the next release. " +
      "Please use topic-specific hooks from hooks/websocket/topic-hooks directory instead. " +
      "See UNIFIED_AUTH_SYSTEM_README.md and src/hooks/websocket/MIGRATION_GUIDE.md for detailed instructions.",
      "color: red; font-weight: bold; background-color: yellow; padding: 2px 4px;"
    );
    console.info(
      "Migration steps:\n" +
      "1. Identify the specific data type you need (tokens, contests, etc.)\n" +
      "2. Import the corresponding hook from hooks/websocket/topic-hooks\n" +
      "3. For example, replace useWebSocketContext() with useTokenData() from topic-hooks\n" +
      "4. See src/hooks/websocket/topic-hooks/README.md for available topic hooks"
    );
  }, []);

  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};

// Create a new version of useUnifiedWebSocket that uses the WebSocketContext
/**
 * Creates a new version of useUnifiedWebSocket that uses the WebSocketContext
 */
export function useUnifiedWebSocket<T = any>(
  id: string,
  types: DDExtendedMessageType[] = [DDExtendedMessageType.DATA],
  onMessage: (message: T) => void,
  topics?: string[]
) {
  const webSocketContext = useWebSocketContext();
  
  // Register message listener
  useEffect(() => {
    // Create callback that casts the message to the right type
    const callback = (message: any) => onMessage(message as T);
    
    // Register listener and get unregister function
    const unregister = webSocketContext.registerListener(id, types, callback, topics);
    
    // Unregister on unmount
    return unregister;
  }, [id, types, topics, onMessage, webSocketContext]);
  
  // Return a simple API for interacting with the WebSocket
  return {
    sendMessage: webSocketContext.sendMessage,
    isConnected: webSocketContext.isConnected,
    isAuthenticated: webSocketContext.isAuthenticated,
    connectionState: webSocketContext.connectionState,
    error: webSocketContext.connectionError,
    subscribe: webSocketContext.subscribe,
    unsubscribe: webSocketContext.unsubscribe,
    request: webSocketContext.request
  };
}