import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './websocket/useWebSocket';

export interface ServerStatus {
  status: 'online' | 'offline' | 'degraded';
  message?: string;
  uptime?: number;
  serverTime?: string;
  services?: {
    [key: string]: {
      status: 'online' | 'offline' | 'degraded';
      message?: string;
    }
  };
  maintenanceMode?: {
    enabled: boolean;
    message?: string;
    estimatedEndTime?: string;
  };
}

export function useServerStatusWebSocket() {
  const [serverStatus, setServerStatus] = useState<ServerStatus>({
    status: 'offline'
  });
  
  // This connection doesn't usually need authentication
  const {
    isConnected,
    sendMessage,
    disconnect
  } = useWebSocket('server-status', {
    reconnect: true,
    maxReconnectAttempts: 5,
    onMessage: handleMessage,
    debug: true,
  });

  function handleMessage(data: any) {
    if (data.type === 'system_status') {
      setServerStatus({
        status: data.status,
        message: data.message,
        uptime: data.uptime,
        serverTime: data.timestamp,
        services: data.services,
        maintenanceMode: data.maintenanceMode
      });
    }
    else if (data.type === 'maintenance_status') {
      setServerStatus(prev => ({
        ...prev,
        maintenanceMode: {
          enabled: data.data?.mode || false,
          message: data.data?.message,
          estimatedEndTime: data.data?.estimatedEndTime
        }
      }));
    }
  }

  const checkStatus = useCallback(() => {
    if (isConnected) {
      sendMessage({
        type: 'get_system_status'
      });
    }
  }, [isConnected, sendMessage]);

  // Request status on connection and every 30 seconds
  useEffect(() => {
    if (isConnected) {
      // Initial status request
      checkStatus();
      
      // Set up interval for periodic checks
      const intervalId = setInterval(checkStatus, 30000);
      
      return () => clearInterval(intervalId);
    }
  }, [isConnected, checkStatus]);

  return {
    serverStatus,
    isConnected,
    checkStatus,
    close: disconnect
  };
}

export default useServerStatusWebSocket;