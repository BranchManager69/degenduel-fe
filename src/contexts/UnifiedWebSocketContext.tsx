// src/contexts/UnifiedWebSocketContext.tsx

/**
 * UnifiedWebSocketContext.tsx
 * 
 * @description A WebSocket context wrapper that uses the new unified authentication system.
 * This ensures that WebSocket authentication is properly integrated with the
 * new authentication service and doesn't rely on direct store access.
 * 
 * @author BranchManager69
 * @version 2.0.0
 * @created 2025-04-14
 * @updated 2025-05-07
 */

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { authDebug } from '../config/config';
import { DDExtendedMessageType } from '../hooks/websocket/types';
import { AuthEventType, authService, TokenType } from '../services';

// Re-export the ConnectionState enum for components that need it
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  AUTHENTICATING = 'authenticating',
  AUTHENTICATED = 'authenticated',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

// WebSocket connection parameters
interface WebSocketParams {
  url: string;
  protocols?: string | string[];
  options?: {
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
    heartbeatInterval?: number;
    maxMissedHeartbeats?: number;
  };
}

// WebSocket message interface
interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

// WebSocket context interface
export interface UnifiedWebSocketContextType {
  // Connection state
  isConnected: boolean;
  isAuthenticated: boolean;
  isReadyForSecureInteraction: boolean;
  connectionState: ConnectionState;
  connectionError: string | null;
  
  // Enhanced status information
  isServerDown?: boolean;
  isReconnecting?: boolean;
  reconnectAttempt?: number;
  lastConnectionTime?: number | null;
  
  // WebSocket methods
  sendMessage: (message: any) => boolean;
  subscribe: (topics: string[]) => boolean;
  unsubscribe: (topics: string[]) => boolean;
  request: (topic: string, action: string, params?: any) => boolean;
  
  // Listener management
  registerListener: (
    id: string,
    types: DDExtendedMessageType[],
    callback: (message: any) => void,
    topics?: string[]
  ) => () => void;
}

// Create context with default values
const UnifiedWebSocketContext = createContext<UnifiedWebSocketContextType | null>(null);

/**
 * UnifiedWebSocketProvider component
 * 
 * This provider manages a WebSocket connection and authentication with the
 * new unified authentication system.
 */
export const UnifiedWebSocketProvider: React.FC<{
  children: React.ReactNode;
  params?: WebSocketParams;
}> = ({ children, params }) => {
  // State for WebSocket connection
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isServerDown, setIsServerDown] = useState<boolean>(false);
  const [lastConnectionTime, setLastConnectionTime] = useState<number | null>(null);
  
  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);
  
  // Listener registry
  const listenersRef = useRef<Map<string, { types: DDExtendedMessageType[], topics?: string[], callback: (message: any) => void }>>(
    new Map()
  );
  
  // Reconnection state
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  
  // Heartbeat state
  const heartbeatIntervalRef = useRef<number | null>(null);
  const missedHeartbeatsRef = useRef<number>(0);
  
  // Get default configuration
  const defaultUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/v69/ws`;
  const connectionUrl = params?.url || defaultUrl;
  const options = params?.options || {};
  
  // Set default options
  const reconnectInterval = options.reconnectInterval || 1000;
  const maxReconnectAttempts = options.maxReconnectAttempts || 5;
  const heartbeatInterval = options.heartbeatInterval || 30000;
  const maxMissedHeartbeats = options.maxMissedHeartbeats || 3;
  
  // Handle authentication state changes
  useEffect(() => {
    const authStateListener = (event: any) => {
      if (event.type === AuthEventType.AUTH_STATE_CHANGED) {
        // If the user logged in or out, update WebSocket connection
        const isAuthenticated = !!event.user;
        
        authDebug('WebSocketContext', 'Auth state changed', {
          isAuthenticated,
          connectionState
        });
        
        // If the connection is already established, try to authenticate
        if (isAuthenticated && connectionState === ConnectionState.CONNECTED) {
          authenticate();
        }
      }
    };
    
    // Register auth state listener
    const unsubscribe = authService.on(AuthEventType.AUTH_STATE_CHANGED, authStateListener);
    
    return () => {
      unsubscribe();
    };
  }, [connectionState]);
  
  // Connect to WebSocket
  const connect = async () => {
    // Don't connect if already connected
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }
    
    // Clean up existing connection
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (err) {
        console.error('Error closing previous WebSocket connection:', err);
      }
      wsRef.current = null;
    }
    
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Update state
    setConnectionState(ConnectionState.CONNECTING);
    
    try {
      // Create new WebSocket connection
      const ws = new WebSocket(connectionUrl);
      wsRef.current = ws;
      
      // Set up event handlers
      ws.onopen = handleOpen;
      ws.onmessage = handleMessage;
      ws.onclose = handleClose;
      ws.onerror = handleError;
      
      authDebug('WebSocketContext', 'Connecting to WebSocket', { url: connectionUrl });
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : String(error));
      setConnectionState(ConnectionState.ERROR);
      scheduleReconnect();
    }
  };
  
  // Handle WebSocket open
  const handleOpen = () => {
    authDebug('WebSocketContext', 'WebSocket connection established');
    setConnectionState(ConnectionState.CONNECTED);
    setConnectionError(null);
    setIsServerDown(false);
    setLastConnectionTime(Date.now());
    reconnectAttemptsRef.current = 0;
    
    // Start heartbeat
    startHeartbeat();
    
    // Authenticate if user is logged in
    if (authService.isAuthenticated()) {
      authenticate();
    }
  };
  
  // Handle WebSocket messages
  const handleMessage = (event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data);
      authDebug('WebSocketContext', 'Raw message received:', message); // Log raw message

      // Handle system messages like pong
      if (message.type === 'SYSTEM' && message.action === 'pong') {
        missedHeartbeatsRef.current = 0;
        return;
      }
      // Handle explicit PONG type if backend sends it
      if (message.type === DDExtendedMessageType.PONG) { // Assuming PONG is in DDExtendedMessageType
        missedHeartbeatsRef.current = 0;
        authDebug('WebSocketContext', 'Pong received');
        return;
      }
      
      // Handle successful authentication ACK from server
      if (message.type === DDExtendedMessageType.ACKNOWLEDGMENT && message.message?.includes('authenticated')) {
        setConnectionState(ConnectionState.AUTHENTICATED);
        authDebug('WebSocketContext', 'WebSocket authentication successful via ACK');
        return;
      }

      // Handle WebSocket Authentication Error (token_expired or other auth issues from WS message)
      if (message.type === DDExtendedMessageType.ERROR && message.code === 4401 && message.reason === 'token_expired') {
        authDebug('WebSocketContext', 'WebSocket auth error: Token expired (4401)', message);
        // Even if WS token is bad, the main session might still be valid or renewable.
        // Trigger a global auth check. If that also determines the session is invalid (e.g., main JWT also expired), `authService` should then handle the full logout.
        // Do not set connectionState to ERROR here, as the connection itself might be fine.
        // The key is that this specific WebSocket session is not AUTHENTICATED.
        if (connectionState === ConnectionState.AUTHENTICATING || connectionState === ConnectionState.AUTHENTICATED) {
          setConnectionState(ConnectionState.CONNECTED); // Revert to CONNECTED, not authenticated for secure topics
        }
        // Potentially dispatch an event that authService or UnifiedAuthContext can listen to, to trigger re-auth or logout.
        // For now, let's call authService.checkAuth() which might lead to logout if main tokens are also bad.
        authService.checkAuth().then(isValidSession => {
          if (!isValidSession) {
            authDebug('WebSocketContext', 'Global auth check failed after WS token expiry, full logout likely.');
            // authService.logout(); // checkAuth should handle logout if necessary
          }
        });
        // Do not distribute this specific error message further if it's just for WS auth status.
        return; 
      }
      
      // Distribute other messages to listeners
      distributeMessage(message);
    } catch (error) {
      console.error('Error processing WebSocket message:', error, 'Raw data:', event.data);
    }
  };
  
  // Handle WebSocket close
  const handleClose = (event: CloseEvent) => {
    // Identify specific types of connection issues
    let errorMessage = '';
    let localServerDown = false;
    
    switch (event.code) {
      case 1000:
        // Normal closure
        errorMessage = 'Connection closed normally';
        break;
      case 1001:
        errorMessage = 'Server is going away';
        break;
      case 1006:
        // Abnormal closure - often indicates server unavailability or network issues
        errorMessage = 'Connection closed abnormally - server may be down or unreachable';
        localServerDown = true;
        break;
      case 1011:
        errorMessage = 'Server encountered an error';
        localServerDown = true;
        break;
      case 1012:
        errorMessage = 'Server is restarting';
        localServerDown = true;
        break;
      case 1013:
        errorMessage = 'Server is unavailable';
        localServerDown = true;
        break;
      default:
        errorMessage = `Connection closed with code ${event.code}: ${event.reason || 'Unknown reason'}`;
    }
    
    // Update server down state
    setIsServerDown(localServerDown);
    
    authDebug('WebSocketContext', 'WebSocket connection closed', {
      code: event.code,
      reason: event.reason || 'No reason provided',
      message: errorMessage,
      isServerDown: localServerDown
    });
    
    // Stop heartbeat
    stopHeartbeat();
    
    // Update state
    setConnectionState(ConnectionState.DISCONNECTED);
    setConnectionError(errorMessage);
    
    // Use a shorter initial reconnect delay for server down scenarios
    if (localServerDown && reconnectAttemptsRef.current === 0) {
      // For server down on first attempt, use a shorter delay (5s)
      // This avoids unnecessary rapid reconnects when server is known to be down
      const serverDownDelay = 5000;
      authDebug('WebSocketContext', 'Server appears to be down, using minimum delay', {
        delay: serverDownDelay
      });
      reconnectTimeoutRef.current = window.setTimeout(() => {
        reconnectTimeoutRef.current = null;
        // Try to confirm server status before actual reconnect
        checkServerStatus().then(isUp => {
          if (isUp) {
            connect();
          } else {
            // If still down, continue with normal exponential backoff
            reconnectAttemptsRef.current++;
            scheduleReconnect();
          }
        }).catch(() => {
          // If check fails, proceed with normal reconnect
          reconnectAttemptsRef.current++;
          scheduleReconnect();
        });
      }, serverDownDelay);
      return;
    }
    
    // Reconnect if not a clean close
    if (event.code !== 1000) {
      scheduleReconnect();
    }
  };
  
  // Check if the server is available
  const checkServerStatus = async (): Promise<boolean> => {
    try {
      // Try to fetch a lightweight endpoint to check server status
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        // Short timeout to avoid hanging
        signal: AbortSignal.timeout(2000)
      });
      return response.ok;
    } catch (error) {
      authDebug('WebSocketContext', 'Server status check failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  };
  
  // Handle WebSocket error
  const handleError = (event: Event) => {
    // WebSocket error events don't provide much information
    // Most errors will be captured by the close event
    authDebug('WebSocketContext', 'WebSocket error', { event });
    setConnectionState(ConnectionState.ERROR);
    setConnectionError('WebSocket connection error - server may be down or unreachable');
  };
  
  // Schedule reconnection with exponential backoff
  const scheduleReconnect = () => {
    // Clear existing timeout
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
      reconnectInterval * Math.pow(2, reconnectAttemptsRef.current - 1),
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
  };
  
  // Start heartbeat interval
  const startHeartbeat = () => {
    // Clear existing interval
    stopHeartbeat();
    
    // Reset counter
    missedHeartbeatsRef.current = 0;
    
    // Start new interval
    heartbeatIntervalRef.current = window.setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        // Send ping
        try {
          wsRef.current.send(JSON.stringify({
            type: 'REQUEST',
            topic: 'system',
            action: 'ping',
            requestId: crypto.randomUUID(),
            timestamp: new Date().toISOString()
          }));
          
          // Increment missed heartbeats
          missedHeartbeatsRef.current++;
          
          // If we've missed too many, consider the connection dead
          if (missedHeartbeatsRef.current >= maxMissedHeartbeats) {
            authDebug('WebSocketContext', 'Missed too many heartbeats, reconnecting', {
              missed: missedHeartbeatsRef.current,
              max: maxMissedHeartbeats
            });
            
            // Clean up and reconnect
            wsRef.current.close();
            wsRef.current = null;
            scheduleReconnect();
          }
        } catch (error) {
          console.error('Error sending heartbeat:', error);
        }
      }
    }, heartbeatInterval);
  };
  
  // Stop heartbeat interval
  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current !== null) {
      window.clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };
  
  // Authenticate WebSocket connection
  const authenticate = async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }
    
    if (!authService.isAuthenticated()) {
      return;
    }
    
    try {
      authDebug('WebSocketContext', 'Authenticating WebSocket connection');
      setConnectionState(ConnectionState.AUTHENTICATING);
      
      // Get authentication token from auth service
      const token = await authService.getToken(TokenType.WS_TOKEN);
      
      if (!token) {
        authDebug('WebSocketContext', 'No WebSocket token available');
        return;
      }
      
      // Subscribe to topics with authentication
      const message = {
        type: 'SUBSCRIBE',
        topics: ['portfolio', 'user', 'wallet', 'notification'],
        authToken: token
      };
      
      // Send authentication message
      wsRef.current.send(JSON.stringify(message));
      
      authDebug('WebSocketContext', 'Sent WebSocket authentication message');
    } catch (error) {
      authDebug('WebSocketContext', 'WebSocket authentication failed', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };
  
  // Distribute message to registered listeners
  const distributeMessage = (message: WebSocketMessage) => {
    const { type, topic } = message;
    
    // Find matching listeners
    listenersRef.current.forEach((listener) => {
      // Check if listener is interested in this message type
      if (!listener.types.includes(type as DDExtendedMessageType)) {
        return;
      }
      
      // If listener has topic filters AND message has a topic, check for match
      if (listener.topics && topic) {
        if (!listener.topics.includes(topic)) {
          return;
        }
      }
      
      // If message type is SYSTEM, always distribute regardless of topic filters
      if (type === 'SYSTEM') {
        listener.callback(message);
        return;
      }
      
      // If no topic filters or no topic in message, distribute based on type match only
      listener.callback(message);
    });
  };
  
  // Register message listener
  const registerListener = (
    id: string,
    types: DDExtendedMessageType[],
    callback: (message: any) => void,
    topics?: string[]
  ) => {
    listenersRef.current.set(id, { types, topics, callback });
    
    authDebug('WebSocketContext', 'Registered WebSocket listener', {
      id,
      types,
      topics: topics || 'all topics'
    });
    
    // Return unregister function
    return () => {
      listenersRef.current.delete(id);
      authDebug('WebSocketContext', 'Unregistered WebSocket listener', { id });
    };
  };
  
  // Send message through WebSocket
  const sendMessage = (message: WebSocketMessage) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return false;
    }
    
    try {
      wsRef.current.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  };
  
  // Subscribe to topics
  const subscribe = (topics: string[]) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || topics.length === 0) {
      return false;
    }
    
    const message: any = {
      type: 'SUBSCRIBE',
      topics
    };
    
    // Add auth token if authenticated
    if (authService.isAuthenticated()) {
      authService.getToken(TokenType.WS_TOKEN).then(token => {
        if (token) {
          message.authToken = token;
          sendMessage(message);
        } else {
          sendMessage(message);
        }
      }).catch(() => {
        sendMessage(message);
      });
      return true;
    }
    
    return sendMessage(message);
  };
  
  // Unsubscribe from topics
  const unsubscribe = (topics: string[]) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || topics.length === 0) {
      return false;
    }
    
    return sendMessage({
      type: 'UNSUBSCRIBE',
      topics
    });
  };
  
  // Make a request
  const request = (topic: string, action: string, params: any = {}) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return false;
    }
    
    const requestId = crypto.randomUUID();
    const message = {
      type: 'REQUEST',
      topic,
      action,
      requestId,
      ...params
    };
    
    return sendMessage(message);
  };
  
  // Connect on mount
  useEffect(() => {
    connect();
    
    // Clean up on unmount
    return () => {
      // Stop heartbeat
      stopHeartbeat();
      
      // Clear reconnect timeout
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Close WebSocket
      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent handleClose from being called
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);
  
  // Derive isConnected and isAuthenticated from connectionState
  const isConnected = connectionState === ConnectionState.CONNECTED || 
                      connectionState === ConnectionState.AUTHENTICATED;
  const isAuthenticated = connectionState === ConnectionState.AUTHENTICATED;
  const isReadyForSecureInteraction = isAuthenticated;
  
  // Create context value
  const contextValue: UnifiedWebSocketContextType = {
    // Connection state
    isConnected,
    isAuthenticated,
    isReadyForSecureInteraction,
    connectionState,
    connectionError,
    
    // Enhanced status info
    isServerDown,
    isReconnecting: connectionState === ConnectionState.RECONNECTING,
    reconnectAttempt: reconnectAttemptsRef.current,
    lastConnectionTime,
    
    // Methods
    sendMessage,
    subscribe,
    unsubscribe,
    request,
    registerListener
  };
  
  return (
    <UnifiedWebSocketContext.Provider value={contextValue}>
      {children}
    </UnifiedWebSocketContext.Provider>
  );
};

/**
 * Hook to use the unified WebSocket context
 * 
 * @returns UnifiedWebSocketContextType
 */
export const useWebSocket = () => {
  const context = useContext(UnifiedWebSocketContext);
  
  if (context === null) {
    throw new Error('useWebSocket must be used within a UnifiedWebSocketProvider');
  }
  
  return context;
};