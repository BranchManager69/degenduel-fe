/**
 * Server Status WebSocket Hook
 * 
 * This hook provides access to the server status WebSocket endpoint.
 * It follows the standardized WebSocket pattern for monitoring.
 */

import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { dispatchWebSocketEvent } from '../../utils/wsMonitor';
import { SOCKET_TYPES, WEBSOCKET_ENDPOINTS } from './types';
import useWebSocket from './useWebSocket';

export type ServerStatus = 'online' | 'maintenance' | 'offline' | 'error';

interface ServerStatusData {
  status: ServerStatus;
  message: string;
  timestamp: string;
  lastChecked: string;
}

interface ServerStatusMessage {
  type: string; // Accept both the unified MessageType enum and service-specific types
  data: {
    status: ServerStatus;
    message: string;
    timestamp: string;
  };
}

/**
 * Hook for monitoring server status via WebSocket with HTTP fallback
 * Uses the v69 Monitor WebSocket endpoint for real-time status updates
 */
export function useServerStatusWebSocket() {
  const [statusData, setStatusData] = useState<ServerStatusData>({
    status: 'online',
    message: 'Connecting to server...',
    timestamp: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);
  const { maintenanceMode } = useStore();

  // Memoize WebSocket options to prevent constant re-creation
  const wsOptions = React.useMemo(() => ({
    endpoint: WEBSOCKET_ENDPOINTS.SERVER_STATUS,
    socketType: SOCKET_TYPES.SERVER_STATUS,
    requiresAuth: false, // Changed to false as authentication is no longer required
    heartbeatInterval: 30000, // 30-second heartbeat
    maxReconnectAttempts: 5
  }), []);

  // Connect to the WebSocket using the standardized hook
  const { 
    status: socketStatus, 
    data, 
    error 
  } = useWebSocket<ServerStatusMessage>(wsOptions);

  // If maintenance mode is active in the store, always show maintenance status
  useEffect(() => {
    if (maintenanceMode) {
      setStatusData(prevData => ({
        ...prevData,
        status: 'maintenance',
        message: 'System is in scheduled maintenance mode',
        lastChecked: new Date().toISOString(),
      }));
    }
  }, [maintenanceMode]);

  // Process data from WebSocket
  useEffect(() => {
    if (data) {
      try {
        // Only process relevant status update messages
        if (data.type === 'SERVER_STATUS_UPDATE' && data.data) {
          const { status, message: statusMessage, timestamp } = data.data;

          // Update status with the data from the WebSocket
          setStatusData({
            status: status as ServerStatus,
            message: statusMessage || getDefaultMessage(status as ServerStatus),
            timestamp,
            lastChecked: new Date().toISOString(),
          });

          setLoading(false);

          // Dispatch a debug event
          dispatchWebSocketEvent('status_update', {
            socketType: SOCKET_TYPES.SERVER_STATUS,
            status,
            message: statusMessage,
            timestamp: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error('Error processing server status update:', err);
        setStatusData(prevData => ({
          ...prevData,
          status: 'error',
          message: 'Error processing status data',
          lastChecked: new Date().toISOString(),
        }));
      }
    }
  }, [data]);

  // Process errors
  useEffect(() => {
    if (error) {
      console.warn('Server status WebSocket error:', error);
      setStatusData(prevData => ({
        ...prevData,
        status: 'error',
        message: `WebSocket error: ${error.message}`,
        lastChecked: new Date().toISOString(),
      }));
    }
  }, [error]);

  // Fallback HTTP polling when WebSocket is not available
  useEffect(() => {
    // Skip if WebSocket is connected or in maintenance mode
    if (socketStatus === 'online' || maintenanceMode) {
      return;
    }

    // Fallback polling function
    const checkServerStatus = async () => {
      try {
        // Use simple fetch for status check
        const response = await fetch('/api/status');

        // Update status based on response
        if (response.status === 503) {
          setStatusData({
            status: 'maintenance',
            message: 'System is in scheduled maintenance mode',
            timestamp: new Date().toISOString(),
            lastChecked: new Date().toISOString(),
          });
        } else {
          setStatusData({
            status: 'online',
            message: 'Server is operating normally',
            timestamp: new Date().toISOString(),
            lastChecked: new Date().toISOString(),
          });
        }
      } catch (err) {
        // Differentiate between complete offline and other errors
        if (err instanceof Error && err.message.includes('Failed to fetch')) {
          setStatusData({
            status: 'offline',
            message: 'Unable to connect to server',
            timestamp: new Date().toISOString(),
            lastChecked: new Date().toISOString(),
          });
        } else if (err instanceof Error && err.message.includes('503')) {
          setStatusData({
            status: 'maintenance',
            message: 'System is in scheduled maintenance mode',
            timestamp: new Date().toISOString(),
            lastChecked: new Date().toISOString(),
          });
        } else {
          setStatusData({
            status: 'error',
            message: 'Server is experiencing issues',
            timestamp: new Date().toISOString(),
            lastChecked: new Date().toISOString(),
          });
        }
        console.error('Failed to check server status:', err);
      } finally {
        setLoading(false);
      }
    };

    // Initial check
    checkServerStatus();

    // Polling interval - 5 seconds when offline, 30 seconds when online
    const interval = setInterval(
      checkServerStatus,
      statusData.status === 'offline' || statusData.status === 'error'
        ? 5000
        : 30000,
    );

    return () => clearInterval(interval);
  }, [socketStatus, statusData.status, maintenanceMode]);

  // Utility function to get default status messages
  const getDefaultMessage = (status: ServerStatus): string => {
    switch (status) {
      case 'online':
        return 'Server is operating normally';
      case 'maintenance':
        return 'System is in scheduled maintenance mode';
      case 'offline':
        return 'Unable to connect to server';
      case 'error':
        return 'Server is experiencing issues';
      default:
        return 'Unknown server status';
    }
  };

  return {
    status: statusData.status,
    message: statusData.message,
    timestamp: statusData.timestamp,
    lastChecked: statusData.lastChecked,
    loading,
    isWebSocketConnected: socketStatus === 'online',
    close: () => {}, // Add empty close method to satisfy WebSocketManager's cleanup
  };
}