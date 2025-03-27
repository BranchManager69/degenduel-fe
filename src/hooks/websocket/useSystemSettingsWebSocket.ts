/**
 * System Settings WebSocket Hook - V69 Standardized Version
 * 
 * This hook connects to the system settings WebSocket service and provides real-time
 * system settings updates including background scene configuration and other system settings.
 */

import { useCallback, useEffect, useState } from 'react';
import { dispatchWebSocketEvent } from '../../utils/wsMonitor';
import { SOCKET_TYPES, WEBSOCKET_ENDPOINTS } from './types';
import useWebSocket from './useWebSocket';

// SPECIFICALLY FOR BACKGROUND SCENE SETTINGS
interface SystemSettings {
  background_scene?:
    | string
    | {
        enabled: boolean;
        scenes: Array<{
          name: string;
          enabled: boolean;
          zIndex: number;
          blendMode: string;
        }>;
      };
  [key: string]: any;
}

interface SystemSettingsMessage {
  type: string;
  data?: SystemSettings;
  error?: string;
  message?: string;
}

export function useSystemSettingsWebSocket() {
  // State management
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Connect to the WebSocket using the standardized hook
  const { 
    status, 
    data, 
    error,
    send,
    connect,
    close
  } = useWebSocket<SystemSettingsMessage>({
    endpoint: WEBSOCKET_ENDPOINTS.SYSTEM_SETTINGS,
    socketType: SOCKET_TYPES.SYSTEM_SETTINGS,
    requiresAuth: false, // Changed to false to match status WebSocket and allow connection without auth
    heartbeatInterval: 30000
  });

  // When the connection status changes, log it
  useEffect(() => {
    dispatchWebSocketEvent('system_settings_status', {
      socketType: SOCKET_TYPES.SYSTEM_SETTINGS,
      status,
      message: `System settings WebSocket is ${status}`
    });
    
    // Request settings when connected and loading
    if (status === 'online' && isLoading) {
      requestSettings();
    }
  }, [status, isLoading]);

  // Request system settings
  const requestSettings = useCallback(() => {
    if (status !== 'online') {
      console.warn('Cannot request system settings: WebSocket not connected');
      return;
    }
    
    send({
      type: "GET_SYSTEM_SETTINGS",
      timestamp: Date.now(),
    });
    
    dispatchWebSocketEvent('system_settings_request', {
      socketType: SOCKET_TYPES.SYSTEM_SETTINGS,
      message: 'Requesting system settings',
      timestamp: new Date().toISOString()
    });
  }, [status, send]);

  // Process messages from the WebSocket
  useEffect(() => {
    if (!data) return;
    
    try {
      // Only process relevant messages
      if (data.type === "SYSTEM_SETTINGS_UPDATE" && data.data) {
        console.log("Received system settings update:", data.data);
        setSettings(data.data);
        setIsLoading(false);
        setLastUpdated(new Date());
        
        dispatchWebSocketEvent('system_settings_update', {
          socketType: SOCKET_TYPES.SYSTEM_SETTINGS,
          message: 'System settings updated',
          hasBackgroundScene: !!data.data.background_scene,
          timestamp: new Date().toISOString()
        });
      } else if (data.type === "ERROR") {
        dispatchWebSocketEvent('error', {
          socketType: SOCKET_TYPES.SYSTEM_SETTINGS,
          message: data.error || data.message || 'Unknown system settings error',
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Error processing system settings message:', err);
      dispatchWebSocketEvent('error', {
        socketType: SOCKET_TYPES.SYSTEM_SETTINGS,
        message: 'Error processing system settings data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, [data]);
  
  // Handle errors
  useEffect(() => {
    if (error) {
      console.error('System settings WebSocket error:', error);
      dispatchWebSocketEvent('error', {
        socketType: SOCKET_TYPES.SYSTEM_SETTINGS,
        message: error.message,
        error
      });
    }
  }, [error]);
  
  // Fallback to REST API if WebSocket fails after timeout
  useEffect(() => {
    // Only use fallback if WebSocket is not connected after a timeout
    const fallbackTimer = setTimeout(async () => {
      if (isLoading && status !== 'online') {
        try {
          console.log("WebSocket fallback: Fetching system settings via Admin API");
          const { admin } = await import("../../services/api/admin");
          const data = await admin.getSystemSettings();
          setSettings(data);
          setLastUpdated(new Date());
          
          dispatchWebSocketEvent('system_settings_fallback', {
            socketType: SOCKET_TYPES.SYSTEM_SETTINGS,
            message: 'Fetched system settings via fallback API',
            timestamp: new Date().toISOString()
          });
        } catch (err) {
          console.error("Fallback fetch error:", err);
          dispatchWebSocketEvent('error', {
            socketType: SOCKET_TYPES.SYSTEM_SETTINGS,
            message: 'Error fetching system settings via fallback API',
            error: err instanceof Error ? err.message : String(err)
          });
        } finally {
          setIsLoading(false);
        }
      }
    }, 3000); // 3 second timeout before fallback
    
    return () => clearTimeout(fallbackTimer);
  }, [isLoading, status]);
  
  // Function to manually refresh settings
  const refreshSettings = () => {
    setIsLoading(true);
    
    if (status === 'online') {
      requestSettings();
    } else {
      // Fallback to API if WebSocket is not connected
      import("../../services/api/admin")
        .then(({ admin }) => admin.getSystemSettings())
        .then((data) => {
          setSettings(data);
          setLastUpdated(new Date());
          setIsLoading(false);
          
          dispatchWebSocketEvent('system_settings_refresh_api', {
            socketType: SOCKET_TYPES.SYSTEM_SETTINGS,
            message: 'Refreshed system settings via API',
            timestamp: new Date().toISOString()
          });
        })
        .catch((err) => {
          console.error("Error refreshing system settings:", err);
          dispatchWebSocketEvent('error', {
            socketType: SOCKET_TYPES.SYSTEM_SETTINGS,
            message: 'Error refreshing system settings via API',
            error: err instanceof Error ? err.message : String(err)
          });
          setIsLoading(false);
        });
    }
  };
  
  // Utility method to update background scene settings
  const updateBackgroundScene = async (value: any) => {
    try {
      setIsLoading(true);
      const { admin } = await import("../../services/api/admin");
      const result = await admin.updateSystemSettings("background_scene", value);
      
      setSettings((prev) =>
        prev
          ? { ...prev, background_scene: value }
          : { background_scene: value },
      );
      setLastUpdated(new Date());
      setIsLoading(false);
      
      dispatchWebSocketEvent('system_settings_update_background', {
        socketType: SOCKET_TYPES.SYSTEM_SETTINGS,
        message: 'Updated background scene via API',
        hasValue: !!value,
        timestamp: new Date().toISOString()
      });
      
      return result;
    } catch (err) {
      console.error("Error updating background scene:", err);
      dispatchWebSocketEvent('error', {
        socketType: SOCKET_TYPES.SYSTEM_SETTINGS,
        message: 'Error updating background scene',
        error: err instanceof Error ? err.message : String(err)
      });
      setIsLoading(false);
      throw err;
    }
  };
  
  return {
    settings,
    loading: isLoading,
    error: error ? error.message : null,
    lastUpdated,
    refreshSettings,
    updateBackgroundScene,
    connect,
    close
  };
}