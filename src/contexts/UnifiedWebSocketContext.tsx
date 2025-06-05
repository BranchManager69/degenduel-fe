// src/contexts/UnifiedWebSocketContext.tsx

/**
 * UnifiedWebSocketContext.tsx
 * 
 * @description A WebSocket context wrapper that uses the new unified authentication system.
 * This ensures that WebSocket authentication is properly integrated with the
 * new authentication service and DOES NOT RELY ON DIRECT STORE ACCESS.
 * 
 * @author BranchManager69
 * @version 2.0.0
 * @created 2025-04-14
 * @updated 2025-05-07
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { DDExtendedMessageType } from '../hooks/websocket/types';
import { setupWebSocketInstance } from '../hooks/websocket/useUnifiedWebSocket';
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
  
  // Subscription tracking to prevent duplicates
  const currentTopicsRef = useRef<Set<string>>(new Set());
  
  // Pending subscriptions queue to handle calls before socket is ready
  const pendingSubscriptionsRef = useRef<string[]>([]);
  
  // Get default configuration
  const defaultUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/v69/ws`; // doubt that this is the best practices method but it works for now
  const connectionUrl = params?.url || defaultUrl;
  const options = params?.options || {};
  
  // Set default options
  const reconnectInterval = options.reconnectInterval || 3000; // 3 seconds base
  const heartbeatInterval = options.heartbeatInterval || 30000;
  const maxMissedHeartbeats = options.maxMissedHeartbeats || 3;
  
  // Handle authentication state changes
  useEffect(() => {
    const authStateListener = (event: any) => {
      if (event.type === AuthEventType.AUTH_STATE_CHANGED) {
        // If the user logged in or out, update WebSocket connection
        const isAuthenticated = !!event.user;
        
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
  const connect = useCallback(async () => {
    // Only re-create the socket if we don't have one or it's not already connecting/open
    // This makes the function idempotent for React StrictMode and prevents duplicate connections
    if (wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    // Clean up existing connection only if it's in a failed state
    if (wsRef.current && 
        wsRef.current.readyState !== WebSocket.CONNECTING && 
        wsRef.current.readyState !== WebSocket.OPEN) {
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

    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : String(error));
      setConnectionState(ConnectionState.ERROR);
      scheduleReconnect();
    }
  }, [connectionUrl]);
  
  // Handle WebSocket open
  const handleOpen = () => {
    setConnectionState(ConnectionState.CONNECTED);
    setConnectionError(null);
    setIsServerDown(false);
    setLastConnectionTime(Date.now());
    
    // Reset reconnect attempts on successful connection
    reconnectAttemptsRef.current = 0;
    
    // Start heartbeat
    startHeartbeat();
    
    // Process any pending subscriptions
    if (pendingSubscriptionsRef.current.length > 0) {
      const pendingTopics = [...pendingSubscriptionsRef.current];
      pendingSubscriptionsRef.current = []; // Clear the queue
      
      // Subscribe to pending topics
      subscribe(pendingTopics);
    }
    
    // Authenticate if user is logged in
    if (authService.isAuthenticated()) {
      authenticate();
    }
  };
  
  // Handle WebSocket messages
  const handleMessage = (event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data);

      // Handle proper pong responses from backend
      if ((message.type === 'RESPONSE' || message.type === 'SYSTEM') && message.action === 'pong') {
        missedHeartbeatsRef.current = 0;
        // Clear the ping timeout since we got a response
        if (pingTimeoutRef.current !== null) {
          window.clearTimeout(pingTimeoutRef.current);
          pingTimeoutRef.current = null;
        }
        return;
      }
      // Handle explicit PONG type if backend sends it
      if (message.type === DDExtendedMessageType.PONG) {
        missedHeartbeatsRef.current = 0;
        // Clear the ping timeout since we got a response
        if (pingTimeoutRef.current !== null) {
          window.clearTimeout(pingTimeoutRef.current);
          pingTimeoutRef.current = null;
        }
        return;
      }
      
      // Handle successful authentication ACK from server
      if (message.type === DDExtendedMessageType.ACKNOWLEDGMENT && 
          message.operation === 'authenticate' && 
          message.status === 'success') {
        setConnectionState(ConnectionState.AUTHENTICATED);
        return;
      }

      // Handle subscription confirmations (separate from authentication)
      if (message.type === DDExtendedMessageType.ACKNOWLEDGMENT && 
          message.operation === 'subscribe' && 
          message.status === 'success') {
        return;
      }

      // Handle WebSocket Authentication Errors per backend specification
      if (message.type === DDExtendedMessageType.ERROR && message.code === 4401) {
        // Handle different authentication error types
        switch (message.reason) {
          case 'token_required':
            console.error('🚨 [WebSocket] Authentication token is required');
            setConnectionState(ConnectionState.CONNECTED);
            break;
            
          case 'token_expired':
            console.error('🚨 [WebSocket] Session expired - triggering auth check');
            setConnectionState(ConnectionState.CONNECTED);
            
            // Trigger global auth check for token renewal
            authService.checkAuth().then(isValidSession => {
              if (!isValidSession) {
                console.error('Global auth check failed after WS token expiry, full logout likely.');
              }
            });
            break;
            
          case 'token_invalid':
            console.error('🚨 [WebSocket] Invalid authentication token');
            setConnectionState(ConnectionState.CONNECTED);
            
            // Trigger global auth check which may log out the user
            authService.checkAuth().then(isValidSession => {
              if (!isValidSession) {
                console.error('Global auth check failed after invalid token, logout triggered.');
              }
            });
            break;
            
          default:
            console.error('🚨 [WebSocket] Unknown authentication error:', message.reason);
            setConnectionState(ConnectionState.CONNECTED);
        }
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
    
    // Check if we're in production environment
    const isProduction = import.meta.env.PROD || window.location.hostname === 'degenduel.me';
    
    switch (event.code) {
      case 1000:
        // Normal closure
        errorMessage = 'Connection closed normally';
        break;
      case 1001:
        errorMessage = isProduction ? 'Server maintenance in progress' : 'Server is going away';
        break;
      case 1005:
        // Empty status - common browser-side issue, not server error
        errorMessage = isProduction ? 'Connection temporarily unavailable' : `Connection closed with code ${event.code}: ${event.reason || 'Unknown reason'}`;
        break;
      case 1006:
        // Abnormal closure - often indicates server unavailability or network issues
        errorMessage = isProduction ? 'Connection temporarily unavailable' : 'Can\'t connect to DegenDuel.';
        localServerDown = true;
        break;
      case 1011:
        errorMessage = isProduction ? 'Service temporarily unavailable' : 'Server encountered an error';
        localServerDown = true;
        break;
      case 1012:
        errorMessage = isProduction ? 'Server maintenance in progress' : 'Server is restarting';
        localServerDown = true;
        break;
      case 1013:
        errorMessage = isProduction ? 'Service temporarily unavailable' : 'Server is unavailable';
        localServerDown = true;
        break;
      default:
        errorMessage = isProduction 
          ? 'Connection issue - reconnecting...' 
          : `Connection closed with code ${event.code}: ${event.reason || 'Unknown reason'}`;
    }
    
    // Update server down state
    setIsServerDown(localServerDown);
    
    // Stop heartbeat
    stopHeartbeat();
    
    // Clear subscription tracking on disconnect
    currentTopicsRef.current.clear();
    
    // Clear pending subscriptions queue on disconnect
    pendingSubscriptionsRef.current = [];
    
    // Update state
    setConnectionState(ConnectionState.DISCONNECTED);
    setConnectionError(errorMessage);
    
    // Use a shorter initial reconnect delay for server down scenarios
    if (localServerDown && reconnectAttemptsRef.current === 0) {
      // For server down on first attempt, use a shorter delay (5s)
      // This avoids unnecessary rapid reconnects when server is known to be down
      const serverDownDelay = 5000;
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
      return false;
    }
  };
  
  // Handle WebSocket error
  const handleError = () => {
    // WebSocket error events don't provide much information
    // Most errors will be captured by the close event
    // Don't tear down the context - just set error state and let close event handle reconnection
    // This prevents the infinite reconnect spiral where onerror triggers a rebuild
    setConnectionState(ConnectionState.ERROR);
    setConnectionError('WebSocket connection error - server may be down or unreachable');
  };
  
  // Schedule reconnection with exponential backoff (no permanent failure)
  const scheduleReconnect = () => {
    // Clear existing timeout
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Increment attempt counter
    reconnectAttemptsRef.current++;
    
         // Calculate delay with exponential backoff, max 15 seconds
    const delay = Math.min(
      reconnectInterval * Math.pow(2, Math.min(reconnectAttemptsRef.current - 1, 4)), // Cap exponential growth at 2^4
      15000 // Max 15 second delay
    );
    
    setConnectionState(ConnectionState.RECONNECTING);
    
    // Schedule reconnect - always keep trying
    reconnectTimeoutRef.current = window.setTimeout(() => {
      reconnectTimeoutRef.current = null;
      connect();
    }, delay);
  };
  
  // Track ping timeouts to avoid counting slow responses as missed
  const pingTimeoutRef = useRef<number | null>(null);
  
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
          const pingMessage = {
            type: 'REQUEST',
            topic: 'system',
            action: 'ping',
            requestId: crypto.randomUUID(),
            timestamp: new Date().toISOString()
          };
          
          wsRef.current.send(JSON.stringify(pingMessage));
          
          // Clear any existing ping timeout
          if (pingTimeoutRef.current !== null) {
            window.clearTimeout(pingTimeoutRef.current);
          }
          
          // Set timeout to count as missed only if no response within 10 seconds
          pingTimeoutRef.current = window.setTimeout(() => {
            missedHeartbeatsRef.current++;
            
            // If we've missed too many, consider the connection dead
            if (missedHeartbeatsRef.current >= maxMissedHeartbeats) {
              wsRef.current?.close();
              wsRef.current = null;
              scheduleReconnect();
            }
          }, 10000); // 10 second timeout for response
          
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
    // Clear any pending ping timeout
    if (pingTimeoutRef.current !== null) {
      window.clearTimeout(pingTimeoutRef.current);
      pingTimeoutRef.current = null;
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
      setConnectionState(ConnectionState.AUTHENTICATING);
      
      // Get authentication token from auth service
      const token = await authService.getToken(TokenType.WS_TOKEN);
      
      if (!token) {
        setConnectionState(ConnectionState.CONNECTED);
        return;
      }
      
      // Send AUTH message with new format as specified by backend team
      const authMessage = {
        type: 'AUTH',
        authToken: token
      };
      
      wsRef.current.send(JSON.stringify(authMessage));
    } catch (error) {
      // Fall back to CONNECTED state on authentication error
      setConnectionState(ConnectionState.CONNECTED);
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
  
  // Register message listener (stable reference with useCallback)
  const registerListener = useCallback((
    id: string,
    types: DDExtendedMessageType[],
    callback: (message: any) => void,
    topics?: string[]
  ) => {
    listenersRef.current.set(id, { types, topics, callback });
    
    // Return unregister function
    return () => {
      listenersRef.current.delete(id);
    };
  }, []);
  
  // Send message through WebSocket (stable reference with useCallback)
  const sendMessage = useCallback((message: WebSocketMessage) => {
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
  }, []);
  
  // Subscribe to topics (stable reference with useCallback + duplicate prevention)
  const subscribe = useCallback((topics: string[]) => {
    // If WebSocket isn't ready, queue the subscriptions for later
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      if (topics.length === 0) return false;
      
      // Add to pending queue (avoid duplicates)
      const newPendingTopics = topics.filter(topic => 
        !pendingSubscriptionsRef.current.includes(topic) && 
        !currentTopicsRef.current.has(topic)
      );
      
      if (newPendingTopics.length > 0) {
        pendingSubscriptionsRef.current.push(...newPendingTopics);
      }
      
      return true; // Indicate that the request was accepted (queued)
    }
    
    if (topics.length === 0) {
      return false;
    }
    
    // Filter out already subscribed topics to prevent duplicates
    const newTopics = topics.filter(topic => !currentTopicsRef.current.has(topic));
    if (newTopics.length === 0) {
      return true; // Already subscribed, return success
    }
    
    // Create the base message with only new topics
    const createSubscribeMessage = (authToken?: string) => {
    const message: any = {
      type: 'SUBSCRIBE',
        topics: [...newTopics] // Use only new topics to prevent duplicates
    };
    
      if (authToken) {
        message.authToken = authToken;
      }
      
      return message;
    };
    
    // Handle authenticated subscription
    if (authService.isAuthenticated()) {
      authService.getToken(TokenType.WS_TOKEN)
        .then(token => {
          const message = createSubscribeMessage(token || undefined);
          const success = sendMessage(message);
          if (success) {
            // Mark topics as subscribed
            newTopics.forEach(topic => currentTopicsRef.current.add(topic));
          }
        })
        .catch(() => {
          // Send without token if token retrieval fails
          const message = createSubscribeMessage();
          const success = sendMessage(message);
          if (success) {
            // Mark topics as subscribed
            newTopics.forEach(topic => currentTopicsRef.current.add(topic));
          }
      });
      return true;
    }
    
    // Send without auth for public topics
    const message = createSubscribeMessage();
    const success = sendMessage(message);
    if (success) {
      // Mark topics as subscribed
      newTopics.forEach(topic => currentTopicsRef.current.add(topic));
    }
    return success;
  }, []); // Empty dependency array for stable reference
  
  // Unsubscribe from topics (stable reference with useCallback + tracking)
  const unsubscribe = useCallback((topics: string[]) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || topics.length === 0) {
      return false;
    }
    
    const success = sendMessage({
      type: 'UNSUBSCRIBE',
      topics
    });
    
    if (success) {
      // Remove topics from subscription tracking
      topics.forEach(topic => currentTopicsRef.current.delete(topic));
    }
    
    return success;
  }, [sendMessage]);
  
  // Make a request (stable reference with useCallback)
  const request = useCallback((topic: string, action: string, params: any = {}) => {
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
  }, [sendMessage]);
  
  // Connect on mount and handle page visibility
  useEffect(() => {
    connect();
    
    // Handle page visibility changes - reconnect when user returns to tab
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // User returned to tab
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          connect();
        }
      }
    };
    
    // Handle user interaction while disconnected - immediate reconnect
    const handleUserInteraction = () => {
      // Only reconnect if disconnected and not already trying to connect
      if ((!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) && 
          connectionState !== ConnectionState.CONNECTING && 
          connectionState !== ConnectionState.RECONNECTING) {
        connect();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Add user interaction listeners for immediate reconnect
    const interactionEvents = ['click', 'scroll', 'keydown', 'touchstart'];
    interactionEvents.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { passive: true });
    });
    
    // Clean up on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Clean up user interaction listeners
      const interactionEvents = ['click', 'scroll', 'keydown', 'touchstart'];
      interactionEvents.forEach(event => {
        document.removeEventListener(event, handleUserInteraction);
      });
      
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
  }, [connect]);
  
  // Derive isConnected and isAuthenticated from connectionState
  const isConnected = connectionState === ConnectionState.CONNECTED || 
                      connectionState === ConnectionState.AUTHENTICATED;
  const isAuthenticated = connectionState === ConnectionState.AUTHENTICATED;
  const isReadyForSecureInteraction = isAuthenticated;
  
  // Setup the singleton instance for useUnifiedWebSocket hook (only log once)
  const hasLoggedSetup = useRef(false);
  useEffect(() => {
    if (!hasLoggedSetup.current) {
      console.log('[UnifiedWebSocketContext] Setting up singleton instance (initial setup)');
      hasLoggedSetup.current = true;
    }
    setupWebSocketInstance(
      registerListener,
      sendMessage,
      connectionState,
      connectionError
    );
  }, [connectionState, connectionError]);
  
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