/**
 * Base WebSocket Hook for the v69 WebSocket System
 * 
 * This is a template for creating WebSocket hooks that are compatible with
 * the monitoring system. All hooks should follow this pattern for consistency.
 */

import { useRef, useState } from 'react';
import { WS_URL } from '../../config/config';
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
  const {
    endpoint = '',
    socketType,
    requiresAuth = true,
    autoConnect = true, // Whether to auto-connect on initialization
    heartbeatInterval = 30000,
    maxReconnectAttempts = 5,
  } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const wsRef = useRef<ReturnType<typeof useBaseWebSocket> | null>(null);
  
  // Message handler for incoming WebSocket messages
  const handleMessage = (message: WebSocketMessage) => {
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
  };
  
  // Error handler for WebSocket errors
  const handleError = (err: Error) => {
    setError(err);
    dispatchWebSocketEvent('error', {
      socketType,
      message: err.message,
      error: err
    });
  };
  
  // Initialize WebSocket with baseWebSocket hook, but only establish 
  // connection if autoConnect is true
  const wsHook = useBaseWebSocket({
    url: WS_URL,
    endpoint,
    socketType,
    onMessage: handleMessage,
    onError: handleError,
    heartbeatInterval,
    maxReconnectAttempts,
    requiresAuth,
    // Add a disableAutoConnect option if autoConnect is false
    disableAutoConnect: !autoConnect
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