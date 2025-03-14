import { useState, useEffect, useCallback } from 'react';
import { useStore } from "../store/useStore";
import { useWebSocket } from './websocket/useWebSocket';

interface SystemSettings {
  [key: string]: any;
}

export interface SettingsWebSocketState {
  settings: SystemSettings;
  isConnected: boolean;
  updateSetting: (key: string, value: any) => boolean;
  reset: () => boolean;
  close: () => void;
}

export function useSystemSettingsWebSocket(): SettingsWebSocketState {
  const [settings, setSettings] = useState<SystemSettings>({});
  const { user } = useStore();
  const token = user?.jwt || user?.session_token;

  // Handle WebSocket messages
  const handleMessage = useCallback((data: any) => {
    if (data.type === 'settings') {
      setSettings(data.settings || {});
    }
    else if (data.type === 'setting_updated') {
      setSettings(prev => ({
        ...prev,
        [data.key]: data.value
      }));
    }
  }, []);

  // Initialize WebSocket
  const {
    isConnected,
    sendMessage,
    disconnect
  } = useWebSocket('settings', {
    token,
    reconnect: true,
    maxReconnectAttempts: 10,
    onMessage: handleMessage,
    debug: true,
  });

  // Request settings when connected
  useEffect(() => {
    if (isConnected) {
      sendMessage({ type: 'get_settings' });
    }
  }, [isConnected, sendMessage]);

  // Function to update a single setting
  const updateSetting = useCallback((key: string, value: any): boolean => {
    if (!isConnected) return false;
    
    return sendMessage({
      type: 'update_setting',
      key,
      value
    });
  }, [isConnected, sendMessage]);

  // Function to reset all settings to defaults
  const reset = useCallback((): boolean => {
    if (!isConnected) return false;
    
    return sendMessage({
      type: 'reset_settings'
    });
  }, [isConnected, sendMessage]);

  return {
    settings,
    isConnected,
    updateSetting,
    reset,
    close: disconnect
  };
}