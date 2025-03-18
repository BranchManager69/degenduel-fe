/**
 * Base WebSocket Hook for the v69 WebSocket System
 * 
 * This is a template for creating WebSocket hooks that are compatible with
 * the monitoring system. All hooks should follow this pattern for consistency.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { WS_URL } from '../../config/config';
import { useStore } from '../../store/useStore';
import { dispatchWebSocketEvent } from '../../utils/wsMonitor';
import { useBaseWebSocket } from '../useBaseWebSocket';
import { WebSocketMessage, WebSocketStatus } from './types';

interface UseWebSocketOptions {
  endpoint: string;
  socketType: string;
  requiresAuth?: boolean;
  autoConnect?: boolean;
  heartbeatInterval?: number;
  maxReconnectAttempts?: number;
}

interface UseWebSocketResult<T> {
  status: WebSocketStatus;
  data: T | null;
  error: Error | null;
  send: (message: any) => void;
  connect: () => void;
  close: () => void;
}

/**
 * Generic WebSocket hook that connects to a specified endpoint
 * and provides consistent tracking and monitoring.
 * 
 * @param options Configuration options for the WebSocket
 * @returns Object containing status, data, error, and methods to interact with the WebSocket
 */
export function useWebSocket<T = any>(options: UseWebSocketOptions): UseWebSocketResult<T> {
  // Destructure options with defaults
  const {
    endpoint = '',
    socketType,
    requiresAuth = true,
    autoConnect = true, // Whether to auto-connect on initialization
    heartbeatInterval = 30000,
    maxReconnectAttempts = 5,
  } = options;
  
  // Memoize options to prevent unnecessary re-renders
  const memoizedOptions = React.useMemo(() => ({
    endpoint,
    socketType,
    requiresAuth,
    autoConnect,
    heartbeatInterval,
    maxReconnectAttempts
  }), [endpoint, socketType, requiresAuth, autoConnect, heartbeatInterval, maxReconnectAttempts]);
  
  const { user } = useStore(state => ({ user: state.user }));
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const wsRef = useRef<ReturnType<typeof useBaseWebSocket> | null>(null);
  
  // Only attempt connection if we have auth when required
  const shouldConnect = !requiresAuth || (requiresAuth && !!user?.jwt);
  
  // Memoize message handler to prevent needless recreation
  const handleMessage = useCallback((message: WebSocketMessage) => {
    try {
      // Dispatch the event for monitoring
      dispatchWebSocketEvent('message', {
        socketType,
        message: 'Received WebSocket message',
        data: message
      });
      
      // Process message - this should be customized in each hook implementation
      if (message.data) {
        setData(message.data as T);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error processing message'));
      dispatchWebSocketEvent('error', {
        socketType,
        message: 'Error processing message',
        error: err
      });
    }
  }, [socketType]);
  
  // Memoize error handler to prevent needless recreation
  const handleError = useCallback((err: Error) => {
    setError(err);
    dispatchWebSocketEvent('error', {
      socketType,
      message: err.message,
      error: err
    });
  }, [socketType]);
  
  // Get authentication token once
  const authToken = user?.jwt || '';
  
  // Log authentication details when required for specific WebSockets
  useEffect(() => {
    if (requiresAuth && endpoint) {
      // Debug connection exactly as recommended by backend team
      console.group(`WebSocket Connection Debug: ${socketType}`);
      console.log("Auth State:", { 
        requiresAuth, 
        hasToken: !!authToken,
        isAuthenticated: !!user,
        shouldConnect
      });
      if (authToken) {
        console.log("Token (truncated):", 
          `${authToken.substring(0, 10)}...${authToken.substring(authToken.length - 10)}`);
      } else {
        console.log("Token: NONE");
      }
      console.log("URL Construction:", {
        base: window.location.host,
        protocol: window.location.protocol === 'https:' ? 'wss:' : 'ws:',
        path: endpoint
      });
      
      if (authToken) {
        const wsUrlObj = new URL(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}${endpoint}`);
        wsUrlObj.searchParams.append('token', authToken);
        console.log("Final URL with token (redacted):", 
          wsUrlObj.toString().replace(authToken, `${authToken.substring(0, 5)}...${authToken.substring(authToken.length - 5)}`));
      }
      console.groupEnd();
    }
  }, [endpoint, requiresAuth, authToken, user, socketType, shouldConnect]);
  
  // Initialize WebSocket with baseWebSocket hook, but only establish 
  // connection if autoConnect is true and we have authentication when needed
  const wsHook = useBaseWebSocket({
    url: WS_URL,
    endpoint: memoizedOptions.endpoint,
    socketType: memoizedOptions.socketType,
    onMessage: handleMessage,
    onError: handleError,
    heartbeatInterval: memoizedOptions.heartbeatInterval,
    maxReconnectAttempts: memoizedOptions.maxReconnectAttempts,
    requiresAuth: memoizedOptions.requiresAuth,
    // Only connect if we have auth when needed and autoConnect is true
    disableAutoConnect: !memoizedOptions.autoConnect || (memoizedOptions.requiresAuth && !authToken)
  });
  
  // Store reference for cleanup
  wsRef.current = wsHook;
  
  // Send a message through the WebSocket
  const send = (message: any) => {
    if (wsRef.current?.wsRef?.current?.readyState === WebSocket.OPEN) {
      wsRef.current.wsRef.current.send(typeof message === 'string' ? message : JSON.stringify(message));
      
      dispatchWebSocketEvent('sent', {
        socketType,
        message: 'Sent WebSocket message',
        data: message
      });
    } else {
      setError(new Error('WebSocket is not connected'));
      dispatchWebSocketEvent('error', {
        socketType,
        message: 'Failed to send - WebSocket not connected',
      });
    }
  };
  
  // Map the ws status to our standardized status type
  const mapStatus = (wsStatus: string): WebSocketStatus => {
    switch (wsStatus) {
      case 'online': return 'online';
      case 'offline': return 'offline';
      case 'degraded': return 'connecting';
      case 'error': return 'error';
      default: return 'offline';
    }
  };
  
  return {
    status: mapStatus(wsHook.status),
    data,
    error,
    send,
    connect: wsHook.connect,
    close: wsHook.close
  };
}

export default useWebSocket;