/**
 * useServerStatus Hook
 * 
 * V69 Standardized WebSocket Hook for Server Status
 * This hook provides real-time updates for server and service status
 * Follows the exact message format defined by the backend team
 * 
 * @author Branch Manager
 * @created 2025-04-10
 */

import { useCallback, useEffect, useState } from 'react';
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';
import { useUnifiedWebSocket } from '../useUnifiedWebSocket';
import { DDExtendedMessageType } from '../types';
import { TopicType } from '../index';

// Server status interfaces based on backend API documentation
export type ServiceStatus = 'operational' | 'degraded' | 'maintenance' | 'outage';

export interface ServiceInfo {
  name: string;
  status: ServiceStatus;
  description?: string;
  lastUpdated?: string;
  metrics?: {
    latency?: number;
    uptime?: number;
    requestRate?: number;
    errorRate?: number;
    [key: string]: any;
  };
}

export interface MaintenanceInfo {
  scheduled: boolean;
  startTime?: string;
  endTime?: string;
  description?: string;
  affectedServices?: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ServerStatusData {
  overall: ServiceStatus;
  message?: string;
  lastUpdated: string;
  services: ServiceInfo[];
  maintenance?: MaintenanceInfo;
  incidents?: Array<{
    id: string;
    title: string;
    status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
    started: string;
    resolved?: string;
    impact: 'none' | 'minor' | 'major' | 'critical';
    affectedServices: string[];
    updates: Array<{
      timestamp: string;
      message: string;
      status: string;
    }>;
  }>;
}

// Default state
const DEFAULT_STATUS: ServerStatusData = {
  overall: 'operational',
  lastUpdated: new Date().toISOString(),
  services: []
};

// Define the standard structure for server status updates from the server
// Following the exact format from the backend team
interface WebSocketStatusMessage {
  type: string; // 'DATA'
  topic: string; // 'system'
  subtype: 'status' | 'announcement' | 'maintenance' | 'feature';
  data: {
    status?: ServiceStatus;
    message?: string;
    affected_services?: string[];
    estimated_resolution?: string;
    services?: ServiceInfo[];
    maintenance?: MaintenanceInfo;
    incidents?: any[];
    features?: Record<string, boolean>;
  };
  timestamp: string;
}

/**
 * Hook for accessing server status with real-time updates
 * Uses the unified WebSocket system
 */
export function useServerStatus() {
  const [statusData, setStatusData] = useState<ServerStatusData>(DEFAULT_STATUS);
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Message handler for WebSocket messages
  const handleMessage = useCallback((message: Partial<WebSocketStatusMessage>) => {
    try {
      // Process only messages for the system topic
      if (message.type === 'DATA' && message.topic === 'system' && message.data) {
        
        // Handle status updates
        if (message.subtype === 'status') {
          const data = message.data;
          
          // Update server status
          setStatusData(prev => {
            // Create a new status object with updated fields
            const newStatus: ServerStatusData = {
              ...prev,
              lastUpdated: message.timestamp || new Date().toISOString()
            };
            
            // Update overall status if provided
            if (data.status) {
              newStatus.overall = data.status;
            }
            
            // Update message if provided
            if (data.message) {
              newStatus.message = data.message;
            }
            
            // Update services if provided
            if (data.services) {
              // Ensure all services have a status
              newStatus.services = data.services.map(service => ({
                ...service,
                status: service.status || 'operational' // Provide default if missing
              }));
            } else if (data.affected_services && data.status) {
              // Update individual services if only affected services are provided
              newStatus.services = prev.services.map(service => 
                data.affected_services?.includes(service.name)
                  ? { ...service, status: data.status || 'operational' }
                  : service
              );
            }
            
            // Update maintenance info if provided
            if (data.maintenance) {
              newStatus.maintenance = data.maintenance;
            }
            
            // Update incidents if provided
            if (data.incidents) {
              newStatus.incidents = data.incidents;
            }
            
            return newStatus;
          });
          
          // Update loading state and timestamp
          setIsLoading(false);
          setLastUpdate(new Date());
          
          // Log event for monitoring
          dispatchWebSocketEvent('server_status_update', {
            socketType: TopicType.SYSTEM,
            message: 'Server status updated',
            timestamp: new Date().toISOString(),
            status: message.data.status
          });
        }
        
        // Handle feature toggles
        else if (message.subtype === 'feature' && message.data && message.data.features) {
          setFeatures(message.data.features);
          setIsLoading(false);
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('features_update', {
            socketType: TopicType.SYSTEM,
            message: 'Feature toggles updated',
            timestamp: new Date().toISOString()
          });
        }
        
        // Handle maintenance updates
        else if (message.subtype === 'maintenance' && message.data) {
          const data = message.data;
          if (data && data.maintenance) {
            setStatusData(prev => ({
              ...prev,
              maintenance: data.maintenance,
              lastUpdated: message.timestamp || new Date().toISOString()
            }));
          }
          
          setIsLoading(false);
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('maintenance_update', {
            socketType: TopicType.SYSTEM,
            message: 'Maintenance information updated',
            timestamp: new Date().toISOString()
          });
        }
        
        // Handle announcements
        else if (message.subtype === 'announcement' && message.data && message.data.message) {
          // Announcements are typically displayed using a notification system
          // Here we just update the last update time and loading state
          setIsLoading(false);
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('system_announcement', {
            socketType: TopicType.SYSTEM,
            message: 'System announcement received',
            timestamp: new Date().toISOString(),
            announcement: message.data.message
          });
        }
      }
    } catch (err) {
      console.error('[ServerStatus WebSocket] Error processing message:', err);
      
      dispatchWebSocketEvent('error', {
        socketType: TopicType.SYSTEM,
        message: 'Error processing server status data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, []);

  // Connect to WebSocket
  const ws = useUnifiedWebSocket(
    'server-status-hook',
    [DDExtendedMessageType.DATA, DDExtendedMessageType.ERROR, DDExtendedMessageType.SYSTEM],
    handleMessage,
    [TopicType.SYSTEM]
  );

  // Subscribe to system topic when connected
  useEffect(() => {
    if (ws.isConnected && isLoading) {
      // Subscribe to system topic
      ws.subscribe([TopicType.SYSTEM]);
      
      // Request initial server status data
      ws.request(TopicType.SYSTEM, 'GET_STATUS');
      
      // Request feature toggles
      ws.request(TopicType.SYSTEM, 'GET_FEATURES');
      
      // Request maintenance info
      ws.request(TopicType.SYSTEM, 'GET_MAINTENANCE');
      
      dispatchWebSocketEvent('server_status_subscribe', {
        socketType: TopicType.SYSTEM,
        message: 'Subscribing to server status data',
        timestamp: new Date().toISOString()
      });
      
      // Set a timeout to reset loading state if we don't get data
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          console.warn('[ServerStatus WebSocket] Timed out waiting for data');
          setIsLoading(false);
        }
      }, 10000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [ws.isConnected, isLoading, ws.subscribe, ws.request]);

  // Force refresh server status
  const refreshStatus = useCallback(() => {
    if (!ws.isConnected) {
      console.warn('[ServerStatus WebSocket] Cannot refresh - WebSocket not connected');
      return;
    }
    
    setIsLoading(true);
    
    // Request fresh data
    ws.request(TopicType.SYSTEM, 'GET_STATUS');
    ws.request(TopicType.SYSTEM, 'GET_FEATURES');
    ws.request(TopicType.SYSTEM, 'GET_MAINTENANCE');
    
    dispatchWebSocketEvent('server_status_refresh', {
      socketType: TopicType.SYSTEM,
      message: 'Refreshing server status data',
      timestamp: new Date().toISOString()
    });
    
    // Set a timeout to reset loading state if we don't get data
    setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 10000);
  }, [ws.isConnected, ws.request, isLoading]);

  // Get the status of a specific service
  const getServiceStatus = useCallback((serviceName: string): ServiceInfo | undefined => {
    return statusData.services.find(s => s.name === serviceName);
  }, [statusData.services]);

  // Check if a feature is enabled
  const isFeatureEnabled = useCallback((featureName: string): boolean => {
    return features[featureName] === true;
  }, [features]);

  // Return server status data and helper functions
  return {
    status: statusData,
    features,
    isLoading,
    isConnected: ws.isConnected,
    error: ws.error,
    lastUpdate,
    refreshStatus,
    getServiceStatus,
    isFeatureEnabled,
    
    // Convenience accessors
    isOperational: statusData.overall === 'operational',
    isDegraded: statusData.overall === 'degraded',
    isInMaintenance: statusData.overall === 'maintenance',
    isDown: statusData.overall === 'outage',
    hasActiveMaintenance: !!statusData.maintenance,
    hasActiveIncidents: (statusData.incidents?.length || 0) > 0
  };
}