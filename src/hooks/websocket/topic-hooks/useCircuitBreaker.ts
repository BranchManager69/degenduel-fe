/**
 * useCircuitBreaker Hook
 * 
 * Standardized hook for the Circuit Breaker system that provides real-time
 * monitoring of service health, circuit breaker states, and system protection alerts.
 * 
 * Based on the v69 Unified WebSocket System specification
 * Last updated: April 10, 2025
 */

import { useCallback, useEffect, useState } from 'react';
import { useStore } from '../../../store/useStore';
import { DDExtendedMessageType, TopicType } from '../';
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';
import { useUnifiedWebSocket } from '../useUnifiedWebSocket';

// Circuit Breaker types
export interface CircuitState {
  state: "closed" | "open" | "half-open";
  failureCount: number;
  lastFailure: string | null;
  recoveryAttempts: number;
}

export interface CircuitConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  requestLimit: number;
}

export interface CircuitMetrics {
  failureRate: number;
  latency: number;
  throughput: number;
}

export interface ServiceCircuitBreaker {
  name: string;
  status: "healthy" | "degraded" | "failed";
  circuit: CircuitState;
  config?: CircuitConfig;
  metrics?: CircuitMetrics;
}

export interface CircuitBreakerState {
  services: ServiceCircuitBreaker[];
}

export interface CircuitAlert {
  type: "info" | "warning" | "error";
  title: string;
  message: string;
  details?: any;
  timestamp?: string;
}

const DEFAULT_STATE: CircuitBreakerState = {
  services: []
};

// Message types from v69 Unified WebSocket System
interface CircuitBreakerMessage {
  type: string;
  topic: string;
  subtype: string;
  action: string;
  data: any;
  timestamp: string;
}

/**
 * useCircuitBreaker hook for monitoring and interacting with the circuit breaker system
 * 
 * @returns Circuit breaker state, alerts, and control functions
 */
export function useCircuitBreaker() {
  const [state, setState] = useState<CircuitBreakerState>(DEFAULT_STATE);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { addCircuitAlert } = useStore();

  // Process incoming messages
  const handleMessage = useCallback((message: CircuitBreakerMessage) => {
    if (message.type !== DDExtendedMessageType.DATA || message.topic !== TopicType.CIRCUIT_BREAKER) {
      return;
    }

    try {
      const { subtype, action, data } = message;

      if (subtype === 'health') {
        if (action === 'update') {
          // Update the health status of a service
          const serviceUpdate = data as ServiceCircuitBreaker;
          
          setState(prev => {
            const serviceIndex = prev.services.findIndex(s => s.name === serviceUpdate.name);
            const newServices = [...prev.services];
            
            if (serviceIndex >= 0) {
              // Update existing service
              newServices[serviceIndex] = {
                ...newServices[serviceIndex],
                ...serviceUpdate
              };
            } else {
              // Add new service
              newServices.push(serviceUpdate);
            }
            
            return {
              ...prev,
              services: newServices
            };
          });
          
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('circuit_breaker_update', {
            socketType: 'circuit-breaker',
            message: `Health update for ${serviceUpdate.name}`,
            service: serviceUpdate.name,
            status: serviceUpdate.status,
            circuitState: serviceUpdate.circuit.state,
            timestamp: new Date().toISOString()
          });
        } else if (action === 'bulk_update') {
          // Update the entire service list
          const services = data.services as ServiceCircuitBreaker[];
          
          setState({
            services: services
          });
          
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('circuit_breaker_bulk_update', {
            socketType: 'circuit-breaker',
            message: `Bulk update for ${services.length} services`,
            serviceCount: services.length,
            timestamp: new Date().toISOString()
          });
        }
      } else if (subtype === 'breaker') {
        if (action === 'trip') {
          // Circuit breaker tripped
          const { service, error, details } = data;
          
          setState(prev => {
            const serviceIndex = prev.services.findIndex(s => s.name === service);
            
            if (serviceIndex < 0) {
              return prev;
            }
            
            const newServices = [...prev.services];
            newServices[serviceIndex] = {
              ...newServices[serviceIndex],
              status: "failed",
              circuit: {
                ...newServices[serviceIndex].circuit,
                state: "open",
                failureCount: (newServices[serviceIndex].circuit.failureCount || 0) + 1,
                lastFailure: new Date().toISOString()
              }
            };
            
            return {
              ...prev,
              services: newServices
            };
          });
          
          // Add alert
          addCircuitAlert({
            type: "error",
            title: `Circuit Breaker Tripped - ${service}`,
            message: error || "Service protection activated",
            details: details
          });
          
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('circuit_breaker_trip', {
            socketType: 'circuit-breaker',
            message: `Circuit breaker tripped for ${service}`,
            service: service,
            error: error,
            timestamp: new Date().toISOString()
          });
        } else if (action === 'reset') {
          // Circuit breaker reset
          const { service, details } = data;
          
          setState(prev => {
            const serviceIndex = prev.services.findIndex(s => s.name === service);
            
            if (serviceIndex < 0) {
              return prev;
            }
            
            const newServices = [...prev.services];
            newServices[serviceIndex] = {
              ...newServices[serviceIndex],
              status: "healthy",
              circuit: {
                ...newServices[serviceIndex].circuit,
                state: "closed",
                recoveryAttempts: 0
              }
            };
            
            return {
              ...prev,
              services: newServices
            };
          });
          
          // Add alert
          addCircuitAlert({
            type: "info",
            title: `Circuit Breaker Reset - ${service}`,
            message: "Service protection deactivated",
            details: details
          });
          
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('circuit_breaker_reset', {
            socketType: 'circuit-breaker',
            message: `Circuit breaker reset for ${service}`,
            service: service,
            timestamp: new Date().toISOString()
          });
        } else if (action === 'half_open') {
          // Circuit breaker in half-open state
          const { service, details } = data;
          
          setState(prev => {
            const serviceIndex = prev.services.findIndex(s => s.name === service);
            
            if (serviceIndex < 0) {
              return prev;
            }
            
            const newServices = [...prev.services];
            newServices[serviceIndex] = {
              ...newServices[serviceIndex],
              status: "degraded",
              circuit: {
                ...newServices[serviceIndex].circuit,
                state: "half-open",
                recoveryAttempts: (newServices[serviceIndex].circuit.recoveryAttempts || 0) + 1
              }
            };
            
            return {
              ...prev,
              services: newServices
            };
          });
          
          // Add alert
          addCircuitAlert({
            type: "warning",
            title: `Circuit Breaker Testing - ${service}`,
            message: "Service attempting recovery",
            details: details
          });
          
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('circuit_breaker_half_open', {
            socketType: 'circuit-breaker',
            message: `Circuit breaker half-open for ${service}`,
            service: service,
            timestamp: new Date().toISOString()
          });
        }
      } else if (subtype === 'metrics') {
        if (action === 'update') {
          // Update metrics for a service
          const { service, metrics } = data;
          
          setState(prev => {
            const serviceIndex = prev.services.findIndex(s => s.name === service);
            
            if (serviceIndex < 0) {
              return prev;
            }
            
            const newServices = [...prev.services];
            newServices[serviceIndex] = {
              ...newServices[serviceIndex],
              metrics: metrics
            };
            
            return {
              ...prev,
              services: newServices
            };
          });
          
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('circuit_breaker_metrics', {
            socketType: 'circuit-breaker',
            message: `Metrics update for ${service}`,
            service: service,
            metrics: metrics,
            timestamp: new Date().toISOString()
          });
        }
      }

      // If we've received any data, set loading to false
      if (isLoading) {
        setIsLoading(false);
      }

    } catch (error) {
      console.error('Error processing circuit breaker message:', error);
      dispatchWebSocketEvent('error', {
        socketType: 'circuit-breaker',
        message: 'Error processing circuit breaker data',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }, [isLoading, addCircuitAlert]);

  // Set up WebSocket connection
  const ws = useUnifiedWebSocket(
    'circuit-breaker-hook', 
    [DDExtendedMessageType.DATA, DDExtendedMessageType.ERROR],
    handleMessage,
    [TopicType.CIRCUIT_BREAKER, TopicType.SYSTEM]
  );

  // Reset loading state after a timeout if we're still loading
  useEffect(() => {
    if (!isLoading) return;

    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, [isLoading]);

  // Request initial data when connected
  useEffect(() => {
    if (!ws.isConnected || !isLoading) return;

    // Request initial state data
    ws.request(TopicType.CIRCUIT_BREAKER, 'get_services');
  }, [ws.isConnected, isLoading]);

  // Send a request to manually reset a circuit breaker
  const resetCircuitBreaker = useCallback((serviceName: string) => {
    if (!ws.isConnected) {
      return false;
    }
    
    return ws.request(TopicType.CIRCUIT_BREAKER, 'reset_breaker', { service: serviceName });
  }, [ws]);

  // Send a request to update circuit breaker config
  const updateCircuitConfig = useCallback((serviceName: string, config: Partial<CircuitConfig>) => {
    if (!ws.isConnected) {
      return false;
    }
    
    return ws.request(TopicType.CIRCUIT_BREAKER, 'update_config', { 
      service: serviceName,
      config: config
    });
  }, [ws]);

  return {
    services: state.services,
    isLoading,
    isConnected: ws.isConnected,
    error: ws.error,
    lastUpdate,
    resetCircuitBreaker,
    updateCircuitConfig
  };
}