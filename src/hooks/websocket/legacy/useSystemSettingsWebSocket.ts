/**
 * System Settings WebSocket Hook - V69 Standardized Version
 * 
 * This hook connects to the system settings WebSocket service and provides real-time
 * system settings updates including background scene configuration and other system settings.
 */

import { useCallback, useEffect, useState } from 'react';
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';
import { SOCKET_TYPES, WEBSOCKET_ENDPOINT } from '../types';
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
    endpoint: WEBSOCKET_ENDPOINT,
    socketType: SOCKET_TYPES.SYSTEM, // Changed from SYSTEM_SETTINGS to SYSTEM per v69 API
    requiresAuth: false, // Changed to false to match status WebSocket and allow connection without auth
    heartbeatInterval: 30000
  });

  // When the connection status changes, log it
  useEffect(() => {
    dispatchWebSocketEvent('system_settings_status', {
      socketType: SOCKET_TYPES.SYSTEM, // Changed from SYSTEM_SETTINGS to SYSTEM per v69 API
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
      socketType: SOCKET_TYPES.SYSTEM, // Changed from SYSTEM_SETTINGS to SYSTEM per v69 API
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
          socketType: SOCKET_TYPES.SYSTEM, // Changed from SYSTEM_SETTINGS to SYSTEM per v69 API
          message: 'System settings updated',
          hasBackgroundScene: !!data.data.background_scene,
          timestamp: new Date().toISOString()
        });
      } else if (data.type === "ERROR") {
        dispatchWebSocketEvent('error', {
          socketType: SOCKET_TYPES.SYSTEM, // Changed from SYSTEM_SETTINGS to SYSTEM per v69 API
          message: data.error || data.message || 'Unknown system settings error',
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Error processing system settings message:', err);
      dispatchWebSocketEvent('error', {
        socketType: SOCKET_TYPES.SYSTEM, // Changed from SYSTEM_SETTINGS to SYSTEM per v69 API
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
        socketType: SOCKET_TYPES.SYSTEM, // Changed from SYSTEM_SETTINGS to SYSTEM per v69 API
        message: error.message,
        error
      });
    }
  }, [error]);
  
  // Fallback to REST API if WebSocket fails after timeout
  useEffect(() => {
    const fetchSettings = async () => {
      if (isLoading && status !== 'online') {
        try {
          // Check if we're in a Storybook environment
          const isStorybook = typeof window !== 'undefined' && (window as any).STORYBOOK_ENV === true;
          
          if (isStorybook) {
            console.log("Running in Storybook environment, skipping API fallback");
            setIsLoading(false);
            return;
          }
          
          console.log("WebSocket fallback: Fetching system settings via Admin API");
          
          const { admin } = await import("../../../services/api/admin");
          console.log("WebSocket fallback: Imported admin API client");
          
          const data = await admin.getSystemSettings();
          console.log("WebSocket fallback: Received system settings:", data);
          setSettings(data);
          setLastUpdated(new Date());

          dispatchWebSocketEvent('system_settings_fallback', {
            socketType: SOCKET_TYPES.SYSTEM, // Changed from SYSTEM_SETTINGS to SYSTEM per v69 API
            message: 'Fetched system settings via fallback API',
            timestamp: new Date().toISOString(),
            endpoint: '/admin/system-settings' // Add the actual endpoint for debugging
          });
        } catch (err) {
          console.error("Fallback fetch error:", err);
          dispatchWebSocketEvent('error', {
            socketType: SOCKET_TYPES.SYSTEM, // Changed from SYSTEM_SETTINGS to SYSTEM per v69 API
            message: 'Error fetching system settings via fallback API',
            error: err instanceof Error ? err.message : String(err),
            endpoint: '/admin/system-settings' // Add the actual endpoint for debugging
          });
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchSettings();
  }, [isLoading, status]);
  
  // Function to manually refresh settings
  const refreshSettings = useCallback(() => {
    setIsLoading(true);
    
    if (status === 'online') {
      requestSettings();
    } else {
      // Fallback to API if WebSocket is not connected
      console.log("Refresh settings: Falling back to Admin API due to WebSocket not connected");
      
      // Check if we're in a Storybook environment
      const isStorybook = typeof window !== 'undefined' && (window as any).STORYBOOK_ENV === true;
      if (isStorybook) {
        console.log("Running in Storybook environment, skipping API refresh");
        setIsLoading(false);
        return;
      }
      
      import("../../../services/api/admin")
        .then(({ admin }) => {
          console.log("Refresh settings: Imported admin API client");
          return admin.getSystemSettings();
        })
        .then((data) => {
          console.log("Refresh settings: Received system settings:", data);
          setSettings(data);
          setLastUpdated(new Date());
          setIsLoading(false);
          
          dispatchWebSocketEvent('system_settings_refresh_api', {
            socketType: SOCKET_TYPES.SYSTEM, // Changed from SYSTEM_SETTINGS to SYSTEM per v69 API
            message: 'Refreshed system settings via API',
            timestamp: new Date().toISOString(),
            endpoint: '/admin/system-settings'
          });
        })
        .catch((err) => {
          console.error("Refresh settings error:", err);
          dispatchWebSocketEvent('error', {
            socketType: SOCKET_TYPES.SYSTEM, // Changed from SYSTEM_SETTINGS to SYSTEM per v69 API
            message: 'Error refreshing system settings via API',
            error: err instanceof Error ? err.message : String(err),
            endpoint: '/admin/system-settings'
          });
          setIsLoading(false);
        });
    }
  }, [status, requestSettings, setSettings, setLastUpdated, setIsLoading, dispatchWebSocketEvent]);
  
  // Utility method to update background scene settings
  const updateBackgroundScene = async (value: any) => {
    try {
      setIsLoading(true);
      const { admin } = await import("../../../services/api/admin");
      const result = await admin.updateSystemSettings("background_scene", value);
      
      setSettings((prev) =>
        prev
          ? { ...prev, background_scene: value }
          : { background_scene: value },
      );
      setLastUpdated(new Date());
      setIsLoading(false);
      
      dispatchWebSocketEvent('system_settings_update_background', {
        socketType: SOCKET_TYPES.SYSTEM, // Changed from SYSTEM_SETTINGS to SYSTEM per v69 API
        message: 'Updated background scene via API',
        hasValue: !!value,
        timestamp: new Date().toISOString()
      });
      
      return result;
    } catch (err) {
      console.error("Error updating background scene:", err);
      dispatchWebSocketEvent('error', {
        socketType: SOCKET_TYPES.SYSTEM, // Changed from SYSTEM_SETTINGS to SYSTEM per v69 API
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
    close,
    // CRITICAL FIX: Explicitly expose whether we're using a WebSocket connection
    // This is used by Footer to determine whether to show the WebSocket indicator (lightning bolt)
    webSocketConnected: status === 'online'
  };
}