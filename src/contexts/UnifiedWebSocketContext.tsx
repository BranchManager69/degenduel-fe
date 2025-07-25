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
  
  // Track pending subscription acknowledgments
  const pendingSubscriptionAcks = useRef<Map<string, {
    topics: string[],
    timestamp: number,
    retryCount: number,
    timeoutId?: NodeJS.Timeout
  }>>(new Map());
  
  // Subscription error codes
  const SUBSCRIPTION_ERROR_CODES = {
    REQUIRES_TOPIC: 4003,
    NO_VALID_TOPICS: 4004,
    UNSUBSCRIBE_REQUIRES_TOPIC: 4005,
    AUTH_REQUIRED: 4010,
    ADMIN_REQUIRED: 4012
  };
  
  // Permanent error codes that should not be retried
  const PERMANENT_ERROR_CODES = new Set([
    SUBSCRIPTION_ERROR_CODES.NO_VALID_TOPICS,  // 4004 - Don't retry empty subscriptions
    SUBSCRIPTION_ERROR_CODES.AUTH_REQUIRED,    // 4010
    SUBSCRIPTION_ERROR_CODES.ADMIN_REQUIRED    // 4012
  ]);
  
  // Generate unique request ID for tracking
  const generateRequestId = () => {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };
  
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
  const handleOpen = async () => {
    setConnectionState(ConnectionState.CONNECTED);
    setConnectionError(null);
    setIsServerDown(false);
    setLastConnectionTime(Date.now());
    
    // Reset reconnect attempts on successful connection
    reconnectAttemptsRef.current = 0;
    
    // Start heartbeat
    startHeartbeat();
    
    // Authenticate first if user is logged in, and WAIT for it to complete
    if (authService.isAuthenticated()) {
      try {
        await authenticate();
        console.log('[WebSocket] Authentication completed before processing subscriptions');
      } catch (error) {
        console.warn('[WebSocket] Authentication failed, continuing with subscriptions:', error);
      }
    }
    
    // Process any pending subscriptions after authentication completes
    if (pendingSubscriptionsRef.current.size > 0) {
      const pendingTopics = [...pendingSubscriptionsRef.current];
      pendingSubscriptionsRef.current.clear(); // Clear the queue
      
      // Subscribe to pending topics
      subscribe(pendingTopics);
    }
  };
  
  // Handle WebSocket messages
  const handleMessage = (event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data);
      
      // Fix missing type field from backend WebSocket messages
      if (message.topic && !message.type) {
        console.log('[WebSocket] Fixed missing type field for message:', message);
        message.type = 'DATA';
      }
      
      // Log ALL messages to see what we're getting
      console.log('[WebSocket] Raw message received:', message);

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
        // Clear pending ACK if we have a requestId
        if (message.requestId && pendingSubscriptionAcks.current.has(message.requestId)) {
          const pending = pendingSubscriptionAcks.current.get(message.requestId);
          if (pending?.timeoutId) {
            clearTimeout(pending.timeoutId);
          }
          pendingSubscriptionAcks.current.delete(message.requestId);
          console.log(`[WebSocket] Subscription acknowledged for topics:`, message.topics);
        }
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
      
      // Handle subscription-related errors
      if (message.type === DDExtendedMessageType.ERROR && 
          message.requestId && 
          pendingSubscriptionAcks.current.has(message.requestId)) {
        
        const pending = pendingSubscriptionAcks.current.get(message.requestId)!;
        
        // Clear the timeout
        if (pending.timeoutId) {
          clearTimeout(pending.timeoutId);
        }
        
        // Check if this is a permanent error
        if (PERMANENT_ERROR_CODES.has(message.code)) {
          console.error(`[WebSocket] Permanent subscription error (${message.code}):`, message.message);
          pendingSubscriptionAcks.current.delete(message.requestId);
        } else {
          // Retry for non-permanent errors
          console.warn(`[WebSocket] Subscription error (${message.code}), will retry:`, message.message);
          retrySubscription(message.requestId);
        }
        
        return;
      }
      
      // Distribute other messages to listeners
      distributeMessage(message);
    } catch (error) {
      console.error('Error processing WebSocket message:', error, 'Raw data:', event.data);
    }
  };
  
  // Check for pending ACK after timeout
  const checkPendingAck = (requestId: string) => {
    const pending = pendingSubscriptionAcks.current.get(requestId);
    
    if (!pending) {
      return; // Already acknowledged or handled
    }
    
    if (pending.retryCount < 2) {
      console.warn(`[WebSocket] No ACK received for subscription ${requestId}, retrying...`);
      retrySubscription(requestId);
    } else {
      console.error(`[WebSocket] Subscription failed after 3 attempts for topics:`, pending.topics);
      pendingSubscriptionAcks.current.delete(requestId);
    }
  };
  
  // Retry a failed subscription
  const retrySubscription = async (requestId: string) => {
    const pending = pendingSubscriptionAcks.current.get(requestId);
    
    if (!pending || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }
    
    // Safety check - don't retry empty topic arrays
    if (!pending.topics || pending.topics.length === 0) {
      console.error(`[WebSocket] Cannot retry subscription ${requestId} with empty topics`);
      pendingSubscriptionAcks.current.delete(requestId);
      return;
    }
    
    // Clear old timeout
    if (pending.timeoutId) {
      clearTimeout(pending.timeoutId);
    }
    
    // Update retry count and timestamp
    pending.retryCount++;
    pending.timestamp = Date.now();
    
    // Calculate backoff: 1s, 2s, then fail
    const timeoutDelay = 1000 * pending.retryCount;
    
    // Get current auth token if authenticated  
    let authToken: string | undefined;
    if (authService.isAuthenticated()) {
      try {
        const token = await authService.getToken(TokenType.WS_TOKEN);
        authToken = token || undefined;
      } catch (error) {
        console.warn('[WebSocket] Failed to get auth token for retry:', error);
        authToken = undefined;
      }
    }
    
    // Resend subscription with same requestId
    const message = {
      type: 'SUBSCRIBE',
      topics: pending.topics,
      requestId,
      ...(authToken && { authToken })
    };
    
    console.log(`[WebSocket] Retrying subscription ${requestId} with topics:`, pending.topics);
    
    try {
      wsRef.current.send(JSON.stringify(message));
      
      // Set new timeout
      pending.timeoutId = setTimeout(() => checkPendingAck(requestId), timeoutDelay);
      
      console.log(`[WebSocket] Retry ${pending.retryCount + 1} sent for ${requestId}`);
    } catch (error) {
      console.error('[WebSocket] Failed to retry subscription:', error);
      pendingSubscriptionAcks.current.delete(requestId);
    }
  };
  
  // Handle WebSocket close/error
  const handleCloseOrError = (event: CloseEvent | Event, source: 'close' | 'error') => {
    const reason = event instanceof CloseEvent ? `Code: ${event.code}, Reason: ${event.reason}` : 'Connection error';
    console.log(`[WebSocket] Connection ${source}: ${reason}`);
    
    // Stop heartbeat
    stopHeartbeat();
    
    // IMPORTANT: Move active subscriptions to pending queue for reconnection
    console.log('[WebSocket] Preserving active subscriptions for reconnection');
    if (currentTopicsRef.current.size > 0) {
      // Add all current topics to pending queue
      currentTopicsRef.current.forEach(topic => {
        pendingSubscriptionsRef.current.add(topic);
      });
      console.log(`[WebSocket] Preserved ${currentTopicsRef.current.size} active subscriptions`);
      
      // Now clear current topics since we're disconnected
      currentTopicsRef.current.clear();
    }
    
    // Clear component tracking but keep pending subscriptions
    componentSubscriptionsRef.current.clear();
    
    // Clear any pending debounce timers
    subscriptionDebounceRef.current.forEach(timer => clearTimeout(timer));
    subscriptionDebounceRef.current.clear();
    
    // Clear pending subscription ACKs
    pendingSubscriptionAcks.current.forEach(pending => {
      if (pending.timeoutId) {
        clearTimeout(pending.timeoutId);
      }
    });
    pendingSubscriptionAcks.current.clear();
    
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
    
    console.log(`🔥 [WebSocket] DISTRIBUTING MESSAGE:`, {
      type,
      topic,
      hasData: !!message.data,
      listenerCount: listenersRef.current.size
    });
    
    // Find matching listeners
    listenersRef.current.forEach((listener, listenerId) => {
      console.log(`🎯 [WebSocket] Checking listener '${listenerId}':`, {
        listenerTypes: listener.types,
        listenerTopics: listener.topics,
        messageType: type,
        messageTopic: topic
      });
      
      // Check if listener is interested in this message type
      if (!listener.types.includes(type as DDExtendedMessageType)) {
        console.log(`❌ [WebSocket] Listener '${listenerId}' not interested in type '${type}'`);
        return;
      }
      
      // If listener has topic filters AND message has a topic, check for match
      if (listener.topics && topic) {
        if (!listener.topics.includes(topic)) {
          console.log(`❌ [WebSocket] Listener '${listenerId}' topic mismatch. Wants: ${listener.topics}, Got: ${topic}`);
          return;
        }
      }
      
      // If message type is SYSTEM, always distribute regardless of topic filters
      if (type === 'SYSTEM') {
        console.log(`✅ [WebSocket] Distributing SYSTEM message to listener '${listenerId}'`);
        listener.callback(message);
        return;
      }
      
      // If no topic filters or no topic in message, distribute based on type match only
      console.log(`✅ [WebSocket] Distributing message to listener '${listenerId}'`);
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
      const messageStr = JSON.stringify(message);
      if (message.type === 'SUBSCRIBE') {
        console.log('[WebSocket] Sending subscription:', messageStr);
      }
      wsRef.current.send(messageStr);
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
        console.log('Current subscribed topics:', Array.from(currentTopicsRef.current));
        console.log('Attempted topics:', newTopics);
        return;
      }
      
      console.group(`🔗 [WebSocket] Subscribing to ${finalTopics.length} topics`);
      console.log('Topics:', finalTopics);
      console.log('Component:', componentId || 'unknown');
      console.groupEnd();
      
      // Generate request ID for tracking
      const requestId = generateRequestId();
      
      // Track pending ACK
      pendingSubscriptionAcks.current.set(requestId, {
        topics: finalTopics,
        timestamp: Date.now(),
        retryCount: 0
      });
      
      console.log(`[WebSocket] Preparing subscription ${requestId} for topics:`, finalTopics);
      
      // Create the base message with only new topics
      const createSubscribeMessage = (authToken?: string) => {
        const message: any = {
          type: 'SUBSCRIBE',
          topics: [...finalTopics], // Use only new topics to prevent duplicates
          requestId
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
              
              // Set timeout for ACK
              const timeoutId = setTimeout(() => checkPendingAck(requestId), 1000);
              const pending = pendingSubscriptionAcks.current.get(requestId);
              if (pending) {
                pending.timeoutId = timeoutId;
              }
              
              // Track component subscriptions for cleanup
              if (componentId) {
                if (!componentSubscriptionsRef.current.has(componentId)) {
                  componentSubscriptionsRef.current.set(componentId, new Set());
                }
                finalTopics.forEach(topic => 
                  componentSubscriptionsRef.current.get(componentId)!.add(topic)
                );
              }
            } else {
              // Failed to send, remove from tracking
              pendingSubscriptionAcks.current.delete(requestId);
            }
          })
          .catch(() => {
            // Send without token if token retrieval fails
            const message = createSubscribeMessage();
            const success = sendMessage(message);
            if (success) {
              // Mark topics as subscribed
              finalTopics.forEach(topic => currentTopicsRef.current.add(topic));
              
              // Set timeout for ACK
              const timeoutId = setTimeout(() => checkPendingAck(requestId), 1000);
              const pending = pendingSubscriptionAcks.current.get(requestId);
              if (pending) {
                pending.timeoutId = timeoutId;
              }
              
              // Track component subscriptions for cleanup
              if (componentId) {
                if (!componentSubscriptionsRef.current.has(componentId)) {
                  componentSubscriptionsRef.current.set(componentId, new Set());
                }
                finalTopics.forEach(topic => 
                  componentSubscriptionsRef.current.get(componentId)!.add(topic)
                );
              }
            } else {
              // Failed to send, remove from tracking
              pendingSubscriptionAcks.current.delete(requestId);
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
        
        // Set timeout for ACK
        const timeoutId = setTimeout(() => checkPendingAck(requestId), 1000);
        const pending = pendingSubscriptionAcks.current.get(requestId);
        if (pending) {
          pending.timeoutId = timeoutId;
        }
        
        // Track component subscriptions for cleanup
        if (componentId) {
          if (!componentSubscriptionsRef.current.has(componentId)) {
            componentSubscriptionsRef.current.set(componentId, new Set());
          }
          finalTopics.forEach(topic => 
            componentSubscriptionsRef.current.get(componentId)!.add(topic)
          );
        }
      } else {
        // Failed to send, remove from tracking
        pendingSubscriptionAcks.current.delete(requestId);
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
  
  // Debug auth state mismatches (enhanced)
  useEffect(() => {
    if (isConnected) {
      const frontendAuthState = authService.isAuthenticated();
      const frontendUser = authService.getUser();
      
      if (process.env.NODE_ENV === 'development') {
        console.group('🔍 [WebSocket Auth Debug] Authentication State Check');
        console.log('WebSocket State:', {
          connectionState,
          isConnected,
          isAuthenticated,
          isReadyForSecureInteraction
        });
        console.log('Frontend State:', {
          isAuthenticated: frontendAuthState,
          user: frontendUser ? { id: frontendUser.id, method: frontendUser.auth_method } : null
        });
        console.groupEnd();
      }
      
      // Detect ghost authentication: Frontend says authenticated but WebSocket says not
      if (frontendAuthState && frontendUser && !isAuthenticated && connectionState === ConnectionState.CONNECTED) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('🚨 GHOST AUTH DETECTED: Frontend authenticated but WebSocket not authenticated');
          console.log('This usually happens when:');
          console.log('- Wallet was disconnected but JWT is still valid');
          console.log('- WebSocket auth token expired');
          console.log('- Server-side session was invalidated');
          console.log('Attempting to refresh authentication...');
        }
        
        // Auto-fix: Try to refresh authentication
        authService.checkAuth().then(() => {
          if (process.env.NODE_ENV === 'development') {
            console.log('Auth refresh completed');
          }
        }).catch((error) => {
          console.error('Auth refresh failed, logging out:', error);
          authService.logout();
        });
      }
    }
  }, [connectionState, isConnected, isAuthenticated]);
  
  // Setup the singleton instance for useUnifiedWebSocket hook (only log once)
  const hasLoggedSetup = useRef(false);
  useEffect(() => {
    if (!hasLoggedSetup.current && process.env.NODE_ENV === 'development') {
      console.log('[UnifiedWebSocketContext] Setting up singleton instance (initial setup)');
      hasLoggedSetup.current = true;
    }
    setupWebSocketInstance(
      registerListener,
      sendMessage,
      connectionState,
      connectionError,
      subscribe, // Pass the context's deduplication-aware subscribe method
      unsubscribe // Pass the context's deduplication-aware unsubscribe method
    );
  }, [connectionState, connectionError, subscribe, unsubscribe]);
  
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