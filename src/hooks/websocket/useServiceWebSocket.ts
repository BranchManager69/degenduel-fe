/**
 * Service WebSocket Hook - V69 Standardized Version
 * 
 * This hook connects to the service monitoring WebSocket endpoint and provides real-time
 * service state, metrics, and alert information for admin users.
 * Note: This actually connects to the circuit-breaker endpoint as per v69 documentation
 * since service monitoring is handled by the circuit breaker system.
 */

import { useEffect, useState } from 'react';
import { dispatchWebSocketEvent } from '../../utils/wsMonitor';
import { SOCKET_TYPES, WEBSOCKET_ENDPOINTS } from './types';
import useWebSocket from './useWebSocket';
import { useStore } from '../../store/useStore';

interface ServiceMessage {
  type: "service:state" | "service:metrics" | "service:alert";
  service: string;
  data: {
    status: string;
    metrics?: {
      uptime: number;
      latency: number;
      activeUsers: number;
    };
    alert?: {
      type: "info" | "warning" | "error";
      message: string;
    };
  };
  timestamp: string;
}

// Map service status to store status
const mapServiceStatus = (
  status: string,
): "online" | "offline" | "degraded" => {
  switch (status) {
    case "active":
      return "online";
    case "stopped":
      return "offline";
    case "error":
      return "degraded";
    default:
      return "offline";
  }
};

// Map alert severity to store alert type
const mapAlertType = (severity: string): "info" | "warning" | "error" => {
  switch (severity) {
    case "critical":
      return "error";
    case "warning":
      return "warning";
    default:
      return "info";
  }
};

export function useServiceWebSocket() {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { setServiceState, addServiceAlert } = useStore();

  // Connect to the WebSocket using the standardized hook
  const { 
    status, 
    data, 
    error,
    connect,
    close
  } = useWebSocket<ServiceMessage>({
    endpoint: WEBSOCKET_ENDPOINTS.SERVICE, // This maps to circuit-breaker as per types.ts
    socketType: SOCKET_TYPES.SERVICE,
    requiresAuth: true, // Service monitoring requires admin authentication
    heartbeatInterval: 30000
  });

  // When the connection status changes, log it
  useEffect(() => {
    dispatchWebSocketEvent('service_status', {
      socketType: SOCKET_TYPES.SERVICE,
      status,
      message: `Service WebSocket is ${status}`
    });
    
    // If disconnected, update service state to show disconnected
    if (status !== 'online') {
      setServiceState("offline", {
        uptime: 0,
        latency: -1,
        activeUsers: 0,
      });
    }
  }, [status, setServiceState]);

  // Process messages from the WebSocket
  useEffect(() => {
    if (!data) return;
    
    try {
      dispatchWebSocketEvent('service_message', {
        socketType: SOCKET_TYPES.SERVICE,
        message: `Received service message: ${data.type}`,
        messageType: data.type,
        service: data.service,
        timestamp: new Date().toISOString()
      });
      
      // Process the message based on its type
      switch (data.type) {
        case "service:state": {
          const mappedStatus = mapServiceStatus(data.data.status);
          
          setServiceState(
            mappedStatus,
            data.data.metrics || {
              uptime: 0,
              latency: 0,
              activeUsers: 0,
            },
          );
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('service_state_update', {
            socketType: SOCKET_TYPES.SERVICE,
            message: `Service state update for ${data.service}`,
            service: data.service,
            status: mappedStatus,
            originalStatus: data.data.status,
            timestamp: new Date().toISOString()
          });
          break;
        }
        
        case "service:metrics":
          // Update service metrics if provided
          if (data.data.metrics) {
            setServiceState(
              mapServiceStatus(data.data.status),
              data.data.metrics
            );
            setLastUpdate(new Date());
            
            dispatchWebSocketEvent('service_metrics', {
              socketType: SOCKET_TYPES.SERVICE,
              message: `Service metrics update for ${data.service}`,
              service: data.service,
              metrics: data.data.metrics,
              timestamp: new Date().toISOString()
            });
          }
          break;
          
        case "service:alert":
          // Handle service alerts
          if (data.data.alert) {
            const mappedType = mapAlertType(data.data.alert.type);
            addServiceAlert(mappedType, data.data.alert.message);
            setLastUpdate(new Date());
            
            dispatchWebSocketEvent('service_alert', {
              socketType: SOCKET_TYPES.SERVICE,
              message: `Service alert for ${data.service}`,
              service: data.service,
              alertType: mappedType,
              originalType: data.data.alert.type,
              alertMessage: data.data.alert.message,
              timestamp: new Date().toISOString()
            });
          }
          break;
      }
    } catch (err) {
      console.error('Error processing service message:', err);
      addServiceAlert("error", "Error processing WebSocket message");
      
      dispatchWebSocketEvent('error', {
        socketType: SOCKET_TYPES.SERVICE,
        message: 'Error processing service data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, [data, setServiceState, addServiceAlert]);
  
  // Handle errors
  useEffect(() => {
    if (error) {
      console.error('Service WebSocket error:', error);
      addServiceAlert("error", `WebSocket error: ${error.message}`);
      
      dispatchWebSocketEvent('error', {
        socketType: SOCKET_TYPES.SERVICE,
        message: error.message,
        error
      });
    }
  }, [error, addServiceAlert]);
  
  return {
    isConnected: status === 'online',
    error: error ? error.message : null,
    lastUpdate,
    connect,
    close
  };
}