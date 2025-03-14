import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { useWebSocket } from './websocket/useWebSocket';

export interface CircuitBreakerService {
  name: string;
  status: 'healthy' | 'degraded' | 'failed';
  circuit: {
    state: 'closed' | 'open' | 'half-open';
    failureCount: number;
    lastFailure: string | null;
    recoveryAttempts: number;
  };
  config?: {
    failureThreshold: number;
    recoveryTimeout: number;
    requestLimit: number;
  };
}

export interface CircuitBreakerState {
  services: CircuitBreakerService[];
  systemHealth?: {
    status: 'operational' | 'degraded' | 'critical';
    activeIncidents: number;
    lastIncident: string | null;
  };
}

export function useCircuitBreakerSocket() {
  const { user } = useStore();
  const token = user?.jwt || user?.session_token;
  const [circuitState, setCircuitState] = useState<CircuitBreakerState>({ services: [] });

  // Initialize WebSocket using the new hook
  const {
    isConnected,
    sendMessage,
    disconnect
  } = useWebSocket('circuit-breaker', {
    token,
    reconnect: true,
    maxReconnectAttempts: 10,
    onMessage: handleMessage,
    debug: true,
  });

  // Handle incoming messages
  function handleMessage(data: any) {
    switch (data.type) {
      case 'circuit_breaker_state':
        setCircuitState(data.data);
        break;
        
      case 'service:update': {
        // Update a single service in the list
        const updatedService = {
          name: data.service,
          status: data.status,
          circuit: data.circuit_breaker
        };
        
        setCircuitState(prev => {
          const serviceIndex = prev.services.findIndex(s => s.name === data.service);
          
          if (serviceIndex >= 0) {
            // Update existing service
            const updatedServices = [...prev.services];
            updatedServices[serviceIndex] = {
              ...updatedServices[serviceIndex],
              ...updatedService
            };
            
            return {
              ...prev,
              services: updatedServices
            };
          } else {
            // Add new service
            return {
              ...prev,
              services: [...prev.services, updatedService]
            };
          }
        });
        break;
      }
      
      case 'services:state':
        // Full services list update
        setCircuitState({
          services: data.services || [],
          systemHealth: data.systemHealth
        });
        break;
    }
  }

  // Request circuit breaker state when connected
  useEffect(() => {
    if (isConnected) {
      sendMessage({
        type: 'get_circuit_breaker_state'
      });
    }
  }, [isConnected, sendMessage]);

  // Function to reset a circuit breaker
  const resetCircuit = useCallback((serviceName: string) => {
    if (isConnected) {
      sendMessage({
        type: 'reset_circuit_breaker',
        service: serviceName
      });
      
      return true;
    }
    return false;
  }, [isConnected, sendMessage]);

  // Function to perform health check on a service
  const checkHealth = useCallback((serviceName: string) => {
    if (isConnected) {
      sendMessage({
        type: 'health_check',
        service: serviceName
      });
      
      return true;
    }
    return false;
  }, [isConnected, sendMessage]);

  return {
    circuitState,
    isConnected,
    resetCircuit,
    checkHealth,
    close: disconnect
  };
}

export default useCircuitBreakerSocket;