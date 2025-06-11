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
  subscribe: (topics: string[], componentId?: string) => boolean;
  unsubscribe: (topics: string[], componentId?: string) => boolean;
  request: (topic: string, action: string, params?: any) => boolean;
  
  // Component cleanup
  cleanupComponent: (componentId: string) => void;
  
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
  
  // Subscription tracking to prevent duplicates - ENHANCED
  const currentTopicsRef = useRef<Set<string>>(new Set());
  const pendingSubscriptionsRef = useRef<Set<string>>(new Set()); // Track pending subscriptions
  const subscriptionDebounceRef = useRef<Map<string, NodeJS.Timeout>>(new Map()); // Debounce rapid subscriptions
  
  // Track which components have subscribed to which topics for cleanup
  const componentSubscriptionsRef = useRef<Map<string, Set<string>>>(new Map());
  
  // Get default configuration
  const defaultUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/v69/ws`; // doubt that this is the best practices method but it works for now
  const connectionUrl = params?.url || defaultUrl;
  const options = params?.options || {};
  
  // Set default options
  const reconnectInterval = options.reconnectInterval || 3000; // 3 seconds base
  const heartbeatInterval = options.heartbeatInterval || 25000; // 25 seconds to match backend and stay under Cloudflare's 90s timeout
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
      ws.onclose = (event: CloseEvent) => handleCloseOrError(event, 'close');
      ws.onerror = (event: Event) => handleCloseOrError(event, 'error');

    } catch (error) {
      console.error('[WebSocket] Error creating connection:', error);
      setConnectionState(ConnectionState.ERROR);
      setConnectionError(`Failed to create WebSocket connection: ${error}`);
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
    if (pendingSubscriptionsRef.current.size > 0) {
      const pendingTopics = [...pendingSubscriptionsRef.current];
      pendingSubscriptionsRef.current.clear(); // Clear the queue
      
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
        console.debug('[WebSocket] Received pong response from server');
        missedHeartbeatsRef.current = 0;
        // Clear the ping timeout since we got a response
        if (pingTimeoutRef.current !== null) {
          window.clearTimeout(pingTimeoutRef.current);
          pingTimeoutRef.current = null;
        }
        return;
      }
      
      // Handle backend's SYSTEM heartbeat messages (as per backend specification)
      if (message.type === 'SYSTEM' && message.action === 'heartbeat' && message.topic === 'system') {
        // Backend sends heartbeats to keep connection alive through Cloudflare
        // Log this for debugging but don't reset our ping counter since this is server-initiated
        console.debug('[WebSocket] Received server heartbeat:', {
          timestamp: message.data?.timestamp,
          serverTime: message.data?.serverTime
        });
        // Distribute to listeners who might want to track server heartbeats
        distributeMessage(message);
        return;
      }
      
      // Handle simple pong response (for Cloudflare bidirectional traffic)
      if (message.type === 'pong') {
        console.debug('[WebSocket] Received simple pong response from server for Cloudflare');
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
        console.debug('[WebSocket] Received PONG response from server');
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
  
  // Handle WebSocket close/error
  const handleCloseOrError = (event: CloseEvent | Event, source: 'close' | 'error') => {
    const reason = event instanceof CloseEvent ? `Code: ${event.code}, Reason: ${event.reason}` : 'Connection error';
    console.log(`[WebSocket] Connection ${source}: ${reason}`);
    
    // Stop heartbeat
    stopHeartbeat();
    
    // Clear subscription tracking on disconnect
    console.log('[WebSocket] Clearing subscription tracking due to disconnection');
    currentTopicsRef.current.clear();
    pendingSubscriptionsRef.current.clear();
    componentSubscriptionsRef.current.clear();
    
    // Clear any pending debounce timers
    subscriptionDebounceRef.current.forEach(timer => clearTimeout(timer));
    subscriptionDebounceRef.current.clear();
    
    // Set appropriate connection state
    if (source === 'error' || (event instanceof CloseEvent && (event.code === 1006 || event.code >= 4000))) {
      setConnectionState(ConnectionState.ERROR);
      setConnectionError(`WebSocket ${source}: ${reason}`);
    } else {
      setConnectionState(ConnectionState.DISCONNECTED);
      setConnectionError(null);
    }
    
    // Attempt reconnection
    scheduleReconnect();
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
          // Send simple ping message for Cloudflare bidirectional traffic requirement
          const simplePingMessage = {
            type: 'ping',
            timestamp: Date.now()
          };
          
          wsRef.current.send(JSON.stringify(simplePingMessage));
          
          console.debug('[WebSocket] Sent simple ping to server for Cloudflare:', {
            timestamp: simplePingMessage.timestamp
          });
          
          // Also send the REQUEST ping for compatibility with existing system
          const requestPingMessage = {
            type: 'REQUEST',
            topic: 'system',
            action: 'ping',
            requestId: crypto.randomUUID(),
            timestamp: new Date().toISOString()
          };
          
          wsRef.current.send(JSON.stringify(requestPingMessage));
          
          console.debug('[WebSocket] Sent REQUEST ping to server:', {
            requestId: requestPingMessage.requestId,
            timestamp: requestPingMessage.timestamp
          });
          
          // Clear any existing ping timeout
          if (pingTimeoutRef.current !== null) {
            window.clearTimeout(pingTimeoutRef.current);
          }
          
          // Set timeout to count as missed only if no response within 10 seconds
          pingTimeoutRef.current = window.setTimeout(() => {
            missedHeartbeatsRef.current++;
            
            console.warn('[WebSocket] Ping timeout - no pong received:', {
              missedHeartbeats: missedHeartbeatsRef.current,
              maxMissedHeartbeats: maxMissedHeartbeats
            });
            
            // If we've missed too many, consider the connection dead
            if (missedHeartbeatsRef.current >= maxMissedHeartbeats) {
              console.error('[WebSocket] Too many missed heartbeats, closing connection');
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
  
  // Subscribe to topics (stable reference with useCallback + duplicate prevention + debouncing)
  const subscribe = useCallback((topics: string[], componentId?: string) => {
    // If WebSocket isn't ready, queue the subscriptions for later
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      if (topics.length === 0) return false;
      
      // Add to pending queue (avoid duplicates)
      const newPendingTopics = topics.filter(topic => 
        !pendingSubscriptionsRef.current.has(topic) && 
        !currentTopicsRef.current.has(topic)
      );
      
      if (newPendingTopics.length > 0) {
        newPendingTopics.forEach(topic => pendingSubscriptionsRef.current.add(topic));
        console.log(`[WebSocket] Queued ${newPendingTopics.length} topics for later subscription`);
      }
      
      return true; // Indicate that the request was accepted (queued)
    }
    
    if (topics.length === 0) {
      return false;
    }
    
    // Filter out already subscribed topics to prevent duplicates
    const newTopics = topics.filter(topic => !currentTopicsRef.current.has(topic));
    if (newTopics.length === 0) {
      console.log(`[WebSocket] All topics already subscribed: ${topics.join(', ')}`);
      return true; // Already subscribed, return success
    }
    
    // DEBOUNCING: Clear any pending debounce timers for these topics
    newTopics.forEach(topic => {
      const existingTimer = subscriptionDebounceRef.current.get(topic);
      if (existingTimer) {
        clearTimeout(existingTimer);
        subscriptionDebounceRef.current.delete(topic);
      }
    });
    
    // DEBOUNCING: Set a short delay to batch rapid subscription requests
    const debounceDelay = 100; // 100ms debounce
    const debounceTimer = setTimeout(() => {
      // Check if topics are still valid for subscription (connection might have changed)
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.warn('[WebSocket] Connection lost during debounced subscription');
        return;
      }
      
      // Double-check that topics aren't already subscribed (might have happened during debounce)
      const finalTopics = newTopics.filter(topic => !currentTopicsRef.current.has(topic));
      if (finalTopics.length === 0) {
        console.log('[WebSocket] All topics already subscribed during debounce');
        return;
      }
      
      console.group(`🔗 [WebSocket] Subscribing to ${finalTopics.length} topics`);
      console.log('Topics:', finalTopics);
      console.log('Component:', componentId || 'unknown');
      console.groupEnd();
      
      // Create the base message with only new topics
      const createSubscribeMessage = (authToken?: string) => {
        const message: any = {
          type: 'SUBSCRIBE',
          topics: [...finalTopics] // Use only new topics to prevent duplicates
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
              finalTopics.forEach(topic => currentTopicsRef.current.add(topic));
              
              // Track component subscriptions for cleanup
              if (componentId) {
                if (!componentSubscriptionsRef.current.has(componentId)) {
                  componentSubscriptionsRef.current.set(componentId, new Set());
                }
                finalTopics.forEach(topic => 
                  componentSubscriptionsRef.current.get(componentId)!.add(topic)
                );
              }
            }
          })
          .catch(() => {
            // Send without token if token retrieval fails
            const message = createSubscribeMessage();
            const success = sendMessage(message);
            if (success) {
              // Mark topics as subscribed
              finalTopics.forEach(topic => currentTopicsRef.current.add(topic));
              
              // Track component subscriptions for cleanup
              if (componentId) {
                if (!componentSubscriptionsRef.current.has(componentId)) {
                  componentSubscriptionsRef.current.set(componentId, new Set());
                }
                finalTopics.forEach(topic => 
                  componentSubscriptionsRef.current.get(componentId)!.add(topic)
                );
              }
            }
          });
        return;
      }
      
      // Send without auth for public topics
      const message = createSubscribeMessage();
      const success = sendMessage(message);
      if (success) {
        // Mark topics as subscribed
        finalTopics.forEach(topic => currentTopicsRef.current.add(topic));
        
        // Track component subscriptions for cleanup
        if (componentId) {
          if (!componentSubscriptionsRef.current.has(componentId)) {
            componentSubscriptionsRef.current.set(componentId, new Set());
          }
          finalTopics.forEach(topic => 
            componentSubscriptionsRef.current.get(componentId)!.add(topic)
          );
        }
      }
      
      // Remove debounce timer
      newTopics.forEach(topic => subscriptionDebounceRef.current.delete(topic));
    }, debounceDelay);
    
    // Store debounce timer
    newTopics.forEach(topic => subscriptionDebounceRef.current.set(topic, debounceTimer));
    
    return true;
  }, []); // Empty dependency array for stable reference
  
  // Unsubscribe from topics (stable reference with useCallback + tracking)
  const unsubscribe = useCallback((topics: string[], componentId?: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || topics.length === 0) {
      // Even if WebSocket is not connected, clean up tracking
      if (componentId) {
        const componentTopics = componentSubscriptionsRef.current.get(componentId);
        if (componentTopics) {
          topics.forEach(topic => componentTopics.delete(topic));
          if (componentTopics.size === 0) {
            componentSubscriptionsRef.current.delete(componentId);
          }
        }
      }
      topics.forEach(topic => currentTopicsRef.current.delete(topic));
      return false;
    }
    
    // Only unsubscribe from topics that are actually subscribed
    const subscribedTopics = topics.filter(topic => currentTopicsRef.current.has(topic));
    if (subscribedTopics.length === 0) {
      console.log(`[WebSocket] No subscribed topics to unsubscribe from: ${topics.join(', ')}`);
      return true;
    }
    
    console.log(`🔗 [WebSocket] Unsubscribing from ${subscribedTopics.length} topics:`, subscribedTopics);
    
    const success = sendMessage({
      type: 'UNSUBSCRIBE',
      topics: subscribedTopics
    });
    
    if (success) {
      // Remove topics from subscription tracking
      subscribedTopics.forEach(topic => currentTopicsRef.current.delete(topic));
      
      // Remove from component tracking
      if (componentId) {
        const componentTopics = componentSubscriptionsRef.current.get(componentId);
        if (componentTopics) {
          subscribedTopics.forEach(topic => componentTopics.delete(topic));
          if (componentTopics.size === 0) {
            componentSubscriptionsRef.current.delete(componentId);
          }
        }
      }
    }
    
    return success;
  }, [sendMessage]);
  
  // Clean up all subscriptions for a specific component
  const cleanupComponent = useCallback((componentId: string) => {
    const componentTopics = componentSubscriptionsRef.current.get(componentId);
    if (componentTopics && componentTopics.size > 0) {
      console.log(`🧹 [WebSocket] Cleaning up ${componentTopics.size} subscriptions for component: ${componentId}`);
      const topicsArray = Array.from(componentTopics);
      unsubscribe(topicsArray, componentId);
    }
    componentSubscriptionsRef.current.delete(componentId);
  }, [unsubscribe]);
  
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
  
  // Add debugging for ghost authentication states (non-invasive)
  useEffect(() => {
    if (isConnected) {
      const frontendAuthState = authService.isAuthenticated();
      const frontendUser = authService.getUser();
      
      console.group('🔍 [WebSocket Auth Debug] Authentication State Check');
      console.log('WebSocket State:', {
        connectionState,
        isConnected,
        isAuthenticated,
        isReadyForSecureInteraction
      });
      console.log('Frontend Auth State:', {
        isAuthenticated: frontendAuthState,
        hasUser: !!frontendUser,
        userWallet: frontendUser?.wallet_address,
        hasJWT: !!frontendUser?.jwt,
        hasSessionToken: !!frontendUser?.session_token
      });
      
      // Detect potential ghost auth scenarios
      if (frontendAuthState && !isAuthenticated && isConnected) {
        console.warn('🚨 GHOST AUTH DETECTED: Frontend thinks user is authenticated, but WebSocket auth failed');
        console.log('💡 This could mean:');
        console.log('   - JWT token expired but frontend hasn\'t refreshed');
        console.log('   - WebSocket auth handshake failed');
        console.log('   - Token mismatch between frontend and WebSocket');
      }
      
      if (!frontendAuthState && isAuthenticated) {
        console.warn('🚨 REVERSE GHOST AUTH: WebSocket authenticated but frontend thinks user is not');
      }
      
      console.groupEnd();
    }
  }, [connectionState, isConnected, isAuthenticated]);
  
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
    registerListener,
    
    // Component cleanup
    cleanupComponent: (componentId: string) => {
      cleanupComponent(componentId);
    }
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