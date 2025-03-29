/**
 * Circuit Breaker WebSocket Hook - V69 Standardized Version
 * 
 * This hook connects to the circuit breaker WebSocket service and provides real-time
 * monitoring of service health, circuit breaker states, and system protection alerts.
 */

import { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { dispatchWebSocketEvent } from '../../utils/wsMonitor';
import { SOCKET_TYPES, WEBSOCKET_ENDPOINT } from './types';
import useWebSocket from './useWebSocket';

interface CircuitBreakerMessage {
  type: "health:update" | "metrics:update" | "breaker:trip" | "breaker:reset";
  service: string;
  data: {
    status: "healthy" | "degraded" | "failed";
    circuit: {
      state: "closed" | "open" | "half-open";
      failureCount: number;
      lastFailure: string | null;
      recoveryAttempts: number;
    };
    config?: {
      failureThreshold: number;
      recoveryTimeout: number;
      requestLimit: number;
    };
    metrics?: {
      failureRate: number;
      latency: number;
      throughput: number;
    };
    error?: string;
  };
  timestamp: string;
}

export function useCircuitBreakerSocket() {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { setCircuitBreakerState, addCircuitAlert } = useStore();

  // Connect to the WebSocket using the standardized hook
  const { 
    status, 
    data, 
    error,
    connect,
    close
  } = useWebSocket<CircuitBreakerMessage>({
    endpoint: WEBSOCKET_ENDPOINT,
    socketType: SOCKET_TYPES.CIRCUIT_BREAKER,
    requiresAuth: false, // Allow more flexible connection handling
    heartbeatInterval: 15000, // 15 second heartbeat
    autoConnect: true // Ensure we try to connect automatically
  });

  // Track loading state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // When the connection status changes, log it
  useEffect(() => {
    dispatchWebSocketEvent('circuit_breaker_status', {
      socketType: SOCKET_TYPES.CIRCUIT_BREAKER,
      status,
      message: `Circuit breaker WebSocket is ${status}`
    });
    
    // Reset loading state when connected
    if (status === 'online') {
      setIsLoading(false);
    }
    
    // If we're not connected but should be loading, trigger connection with timeout
    if (status !== 'online' && isLoading) {
      // Attempt connection
      connect();
      
      // Set a timeout to prevent endless loading state
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          console.warn('Circuit breaker connection timed out, resetting loading state');
          setIsLoading(false);
        }
      }, 10000);
      
      // Clean up the timeout if component unmounts
      return () => clearTimeout(timeoutId);
    }
  }, [status, isLoading, connect]);

  // Process messages from the WebSocket
  useEffect(() => {
    if (!data) return;
    
    try {
      // Process the message based on its type
      switch (data.type) {
        case "health:update":
        case "metrics:update":
          setCircuitBreakerState({
            services: [
              {
                name: data.service,
                status: data.data.status,
                circuit: data.data.circuit,
                config: data.data.config,
              },
            ],
          });
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('circuit_breaker_update', {
            socketType: SOCKET_TYPES.CIRCUIT_BREAKER,
            message: `${data.type === 'health:update' ? 'Health' : 'Metrics'} update for ${data.service}`,
            service: data.service,
            status: data.data.status,
            circuitState: data.data.circuit.state,
            timestamp: new Date().toISOString()
          });
          break;
          
        case "breaker:trip":
          addCircuitAlert({
            type: "error",
            title: `Circuit Breaker Tripped - ${data.service}`,
            message: data.data.error || "Service protection activated",
            details: data.data,
          });
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('circuit_breaker_trip', {
            socketType: SOCKET_TYPES.CIRCUIT_BREAKER,
            message: `Circuit breaker tripped for ${data.service}`,
            service: data.service,
            error: data.data.error,
            timestamp: new Date().toISOString()
          });
          break;
          
        case "breaker:reset":
          addCircuitAlert({
            type: "info",
            title: `Circuit Breaker Reset - ${data.service}`,
            message: "Service protection deactivated",
            details: data.data,
          });
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('circuit_breaker_reset', {
            socketType: SOCKET_TYPES.CIRCUIT_BREAKER,
            message: `Circuit breaker reset for ${data.service}`,
            service: data.service,
            timestamp: new Date().toISOString()
          });
          break;
      }
    } catch (err) {
      console.error('Error processing circuit breaker message:', err);
      dispatchWebSocketEvent('error', {
        socketType: SOCKET_TYPES.CIRCUIT_BREAKER,
        message: 'Error processing circuit breaker data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, [data, setCircuitBreakerState, addCircuitAlert]);
  
  // Handle errors
  useEffect(() => {
    if (error) {
      console.error('Circuit breaker WebSocket error:', error);
      dispatchWebSocketEvent('error', {
        socketType: SOCKET_TYPES.CIRCUIT_BREAKER,
        message: error.message,
        error
      });
    }
  }, [error]);
  
  return {
    isConnected: status === 'online',
    error: error ? error.message : null,
    lastUpdate,
    connect,
    close
  };
}