// src/hooks/websocket/topic-hooks/useSystemSettings.ts

/**
 * useSystemSettings Hook
 * 
 * @description V69 Standardized WebSocket Hook for System Settings
 * This hook provides real-time updates for system-wide settings and features
 * Follows the exact message format defined by the backend team
 * 
 *   LATEST AND GREATEST! 
 *   V69 STANDARDIZED WEBSOCKET HOOK
 *   SYSTEM SETTINGS
 * 
 * @author BranchManager69
 * @version 2.1.0
 * @created 2025-04-10
 * @updated 2025-05-08
 */

import { useCallback, useEffect, useState } from 'react';
import { useStore } from '../../../store/useStore'; // For actions like setMaintenanceMode
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';
import { DDWebSocketActions } from '../../../websocket-types-implementation';
import { DDExtendedMessageType, DDWebSocketTopic } from '../index';
import { useUnifiedWebSocket } from '../useUnifiedWebSocket';

// Placeholder types - these should be properly defined in src/types/settings.ts or similar
interface FeatureFlag { name: string; enabled: boolean; [key: string]: any; }
interface SystemTheme { name: string; settings: Record<string, string>; [key: string]: any; }
interface GlobalNotice { id: string; message: string; type: 'info' | 'warning' | 'error'; active: boolean; [key: string]: any; }

// This should match the actual SystemSettings type definition from src/types/settings.ts
interface SystemSettings {
  name?: string;
  version?: string;
  environment?: "dev" | "staging" | "production";
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  features?: FeatureFlag[];
  themes?: SystemTheme[];
  notices?: GlobalNotice[];
  defaultTheme?: string;
  [key: string]: any; // Allow other settings
}

interface SystemSettingsDataPayload { // Type for message.data content
  settings?: Partial<SystemSettings>; // For full/partial settings update
  feature?: FeatureFlag;             // For single feature update
  theme?: SystemTheme;               // For single theme update
  notice?: GlobalNotice;             // For single notice update/add
  noticeId?: string;               // For notice removal
  [key: string]: any;
}

interface SystemSettingsWebSocketMessage {
  type: DDExtendedMessageType.DATA | DDExtendedMessageType.ERROR;
  topic: DDWebSocketTopic.SYSTEM;
  subtype?: 'settings' | 'feature' | 'theme' | 'notification'; // subtype helps differentiate data structure
  action?: DDWebSocketActions | string; // Action for the operation
  data?: SystemSettingsDataPayload;
  error?: string;
}

const DEFAULT_SETTINGS: SystemSettings = {
  features: [],
  themes: [],
  notices: [],
  maintenanceMode: false,
  maintenanceMessage: "The platform is currently undergoing scheduled maintenance. Please check back shortly.",
};

export function useSystemSettings(settingsToWatch?: string[]) { // settingsToWatch is optional
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null); 

  const { setMaintenanceMode /*, addServiceAlert */ } = useStore(); // Example store actions

  const handleMessage = useCallback((message: Partial<SystemSettingsWebSocketMessage>) => {
    if (message.type === DDExtendedMessageType.ERROR && message.error) {
      dispatchWebSocketEvent('system_settings_error', { error: message.error });
      // setError(message.error); // If hook manages its own error state
      return;
    }

    if (!message.data || message.type !== DDExtendedMessageType.DATA || message.topic !== DDWebSocketTopic.SYSTEM) {
      return;
    }

    const { subtype, action, data } = message;

    setSettings(prevSettings => {
      const currentSettings = prevSettings || { ...DEFAULT_SETTINGS };
      let newSettings = { ...currentSettings };

      if (action === DDWebSocketActions.GET_SETTINGS && data.settings) { // Response to initial fetch
        newSettings = { ...currentSettings, ...data.settings };
        setIsLoading(false);
        dispatchWebSocketEvent('system_settings_loaded', { settings: newSettings });
      } else if (action === DDWebSocketActions.SETTINGS_UPDATE) { // A general push update
        if (subtype === 'settings' && data.settings) { // Full or partial settings object pushed
          newSettings = { ...currentSettings, ...data.settings };
        } else if (subtype === 'feature' && data.feature) {
          const feature = data.feature as FeatureFlag;
          const features = [...(newSettings.features || [])];
          const idx = features.findIndex(f => f.name === feature.name);
          if (idx >= 0) features[idx] = feature; else features.push(feature);
          newSettings.features = features;
        } else if (subtype === 'theme' && data.theme) {
          const theme = data.theme as SystemTheme;
          const themes = [...(newSettings.themes || [])];
          const idx = themes.findIndex(t => t.name === theme.name);
          if (idx >= 0) themes[idx] = theme; else themes.push(theme);
          newSettings.themes = themes;
        } else if (subtype === 'notification' && data.notice) { // Add/update notice
          const notice = data.notice as GlobalNotice;
          const notices = [...(newSettings.notices || [])];
          const idx = notices.findIndex(n => n.id === notice.id);
          if (idx >= 0) notices[idx] = notice; else notices.push(notice);
          newSettings.notices = notices;
        }
        dispatchWebSocketEvent('system_settings_updated_push', { data });
      } else if (subtype === 'notification' && action === 'remove' && data.noticeId) { // Specific remove action for notice
         newSettings.notices = (newSettings.notices || []).filter(n => n.id !== data.noticeId);
         dispatchWebSocketEvent('system_settings_notice_removed', { noticeId: data.noticeId });
      }

      // Handle specific known fields like maintenanceMode
      if (newSettings.maintenanceMode !== undefined && newSettings.maintenanceMode !== currentSettings.maintenanceMode) {
        setMaintenanceMode(newSettings.maintenanceMode);
      }
      setLastUpdate(new Date());
      return newSettings;
    });
  }, [setMaintenanceMode]);

  const ws = useUnifiedWebSocket(
    'system-settings-hook',
    [DDExtendedMessageType.DATA, DDExtendedMessageType.ERROR],
    handleMessage,
    [DDWebSocketTopic.SYSTEM]
  );

  useEffect(() => {
    if (ws.isConnected && isLoading) {
      ws.request(DDWebSocketTopic.SYSTEM, DDWebSocketActions.GET_SETTINGS, settingsToWatch ? { settingsToWatch } : {});
      dispatchWebSocketEvent('system_settings_initial_request', { settingsToWatch });
    }
  }, [ws.isConnected, ws.request, isLoading, settingsToWatch]);

  const updateSystemSettings = useCallback((newPartialSettings: Partial<SystemSettings>) => {
    if (ws.isConnected) {
      ws.request(DDWebSocketTopic.SYSTEM, DDWebSocketActions.UPDATE_SYSTEM_SETTINGS, newPartialSettings );
    }
  }, [ws.isConnected, ws.request]);

  return {
    settings,
    isLoading: isLoading && !settings, // More accurate loading: true if loading and no settings yet
    error: ws.error,
    updateSystemSettings,
    isConnected: ws.isConnected,
    lastSystemSettingsUpdate: lastUpdate
  };
}