/**
 * useService Hook
 * 
 * Standardized hook for the Service monitoring system that provides real-time
 * service state, metrics, and alert information for admin users.
 * 
 * Based on the v69 Unified WebSocket System specification
 * Last updated: April 10, 2025
 */

import { useCallback, useEffect, useState } from 'react';
import { useStore } from '../../../store/useStore';
import { DDExtendedMessageType, TopicType } from '../';
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';
import { useUnifiedWebSocket } from '../useUnifiedWebSocket';

// Service monitoring types
export interface ServiceMetrics {
  uptime: number;
  latency: number;
  activeUsers: number;
}

export interface ServiceAlertMessage {
  type: "info" | "warning" | "error";
  message: string;
  timestamp?: string;
}

export interface ServiceState {
  status: "online" | "offline" | "degraded";
  metrics: ServiceMetrics;
  lastUpdate: string;
}

// Message types from v69 Unified WebSocket System
interface ServiceMessage {
  type: DDExtendedMessageType;
  topic: string;
  subtype: string;
  action: string;
  data: any;
  timestamp: string;
}

// Map service status to standardized status
const mapServiceStatus = (
  status: string,
): "online" | "offline" | "degraded" => {
  switch (status.toLowerCase()) {
    case "active":
    case "online":
      return "online";
    case "stopped":
    case "offline":
      return "offline";
    case "error":
    case "degraded":
      return "degraded";
    default:
      return "offline";
  }
};

// Map alert severity to standardized type
const mapAlertType = (severity: string): "info" | "warning" | "error" => {
  switch (severity.toLowerCase()) {
    case "critical":
    case "error":
      return "error";
    case "warning":
      return "warning";
    default:
      return "info";
  }
};

/**
 * useService hook for monitoring service health and metrics
 * 
 * @returns Service state, alerts, and connection status
 */
export function useService() {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { setServiceState, addServiceAlert } = useStore();

  // Process incoming messages
  const handleMessage = useCallback((message: ServiceMessage) => {
    if (message.type !== DDExtendedMessageType.DATA || message.topic !== TopicType.SERVICE) {
      return;
    }

    try {
      const { subtype, action, data } = message;
      
      dispatchWebSocketEvent('service_message', {
        socketType: 'service',
        message: `Received service message: ${subtype}:${action}`,
        messageType: `${subtype}:${action}`,
        timestamp: new Date().toISOString()
      });

      if (subtype === 'state') {
        if (action === 'update') {
          // Service state update
          const service = data.service || 'unknown';
          const mappedStatus = mapServiceStatus(data.status);
          
          setServiceState(
            mappedStatus,
            data.metrics || {
              uptime: 0,
              latency: 0,
              activeUsers: 0,
            },
          );
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('service_state_update', {
            socketType: 'service',
            message: `Service state update for ${service}`,
            service: service,
            status: mappedStatus,
            originalStatus: data.status,
            timestamp: new Date().toISOString()
          });
        }
      } else if (subtype === 'metrics') {
        if (action === 'update') {
          // Service metrics update
          const service = data.service || 'unknown';
          
          if (data.metrics) {
            setServiceState(
              mapServiceStatus(data.status || 'online'),
              data.metrics
            );
            setLastUpdate(new Date());
            
            dispatchWebSocketEvent('service_metrics', {
              socketType: 'service',
              message: `Service metrics update for ${service}`,
              service: service,
              metrics: data.metrics,
              timestamp: new Date().toISOString()
            });
          }
        }
      } else if (subtype === 'alert') {
        if (action === 'new') {
          // Service alert
          const service = data.service || 'unknown';
          const { type, message: alertMessage } = data.alert || { type: 'info', message: 'Unknown alert' };
          
          const mappedType = mapAlertType(type);
          addServiceAlert(mappedType, `${service}: ${alertMessage}`);
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('service_alert', {
            socketType: 'service',
            message: `Service alert for ${service}`,
            service: service,
            alertType: mappedType,
            originalType: type,
            alertMessage: alertMessage,
            timestamp: new Date().toISOString()
          });
        }
      }

      // If we've received any data, set loading to false
      if (isLoading) {
        setIsLoading(false);
      }

    } catch (error) {
      console.error('Error processing service message:', error);
      addServiceAlert("error", "Error processing WebSocket message");
      
      dispatchWebSocketEvent('error', {
        socketType: 'service',
        message: 'Error processing service data',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }, [isLoading, setServiceState, addServiceAlert]);

  // Set up WebSocket connection
  const ws = useUnifiedWebSocket(
    'service-hook', 
    [DDExtendedMessageType.DATA, DDExtendedMessageType.ERROR],
    handleMessage,
    [TopicType.SERVICE, TopicType.SYSTEM]
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
    ws.request(TopicType.SERVICE, 'get_state');
  }, [ws.isConnected, isLoading]);

  // Send a request to refresh service data
  const refreshServiceData = useCallback(() => {
    if (!ws.isConnected) {
      return false;
    }
    
    return ws.request(TopicType.SERVICE, 'get_state');
  }, [ws]);

  // Handle connection status changes
  useEffect(() => {
    // If disconnected, update service state to show disconnected
    if (!ws.isConnected && !isLoading) {
      setServiceState("offline", {
        uptime: 0,
        latency: -1,
        activeUsers: 0,
      });
    }
  }, [ws.isConnected, isLoading, setServiceState]);

  return {
    isConnected: ws.isConnected,
    isLoading,
    error: ws.error,
    lastUpdate,
    refreshServiceData
  };
}