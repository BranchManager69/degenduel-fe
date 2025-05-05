/**
 * useSystemSettings Hook
 * 
 * V69 Standardized WebSocket Hook for System Settings
 * This hook provides real-time updates for system-wide settings and features
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

// System settings interfaces based on backend API documentation
export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description?: string;
  conditions?: Record<string, any>;
  audience?: string[];
  metadata?: Record<string, any>;
}

export interface SystemTheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
    [key: string]: string;
  };
  fonts: {
    heading: string;
    body: string;
    mono: string;
    [key: string]: string;
  };
  logo?: string;
  active: boolean;
}

export interface GlobalNotice {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  dismissible: boolean;
  expires?: string;
  target?: 'all' | 'authenticated' | 'unauthenticated' | 'admin' | string[];
}

export interface SystemSettings {
  name: string;
  version: string;
  environment: 'dev' | 'staging' | 'production';
  features: FeatureFlag[];
  themes: SystemTheme[];
  notices: GlobalNotice[];
  defaultTheme: string;
  registrationOpen: boolean;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  analytics: {
    enabled: boolean;
    provider?: string;
    settings?: Record<string, any>;
  };
  limits: {
    maxUsersPerContest: number;
    maxContestsPerUser: number;
    maxTokensPerPortfolio: number;
    [key: string]: any;
  };
  [key: string]: any;
}

// Default settings
const DEFAULT_SETTINGS: SystemSettings = {
  name: 'DegenDuel',
  version: '1.0.0',
  environment: 'production',
  features: [],
  themes: [],
  notices: [],
  defaultTheme: 'dark',
  registrationOpen: true,
  maintenanceMode: false,
  analytics: {
    enabled: true
  },
  limits: {
    maxUsersPerContest: 100,
    maxContestsPerUser: 10,
    maxTokensPerPortfolio: 10
  }
};

// Define the standard structure for system settings updates from the server
// Following the exact format from the backend team
interface WebSocketSystemMessage {
  type: string; // 'DATA'
  topic: string; // 'system'
  subtype: 'settings' | 'notification' | 'theme' | 'feature';
  action: 'update' | 'add' | 'remove';
  data: {
    settings?: Partial<SystemSettings>;
    feature?: FeatureFlag;
    features?: FeatureFlag[];
    theme?: SystemTheme;
    themes?: SystemTheme[];
    notice?: GlobalNotice;
    notices?: GlobalNotice[];
    [key: string]: any;
  };
  timestamp: string;
}

/**
 * Hook for accessing system settings with real-time updates
 * Uses the unified WebSocket system
 * 
 * @param settingsToWatch Optional array of specific settings to watch for updates
 */
export function useSystemSettings(settingsToWatch?: string[]) {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Message handler for WebSocket messages
  const handleMessage = useCallback((message: Partial<WebSocketSystemMessage>) => {
    try {
      // Check if this is a valid system settings message
      if (message.type === 'DATA' && message.topic === 'system' && message.data) {
        const data = message.data;
        
        // Handle complete settings update
        if (message.subtype === 'settings' && data.settings) {
          setSettings(prevSettings => ({
            ...prevSettings,
            ...data.settings
          }));
          
          setIsLoading(false);
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('system_settings_update', {
            socketType: TopicType.SYSTEM,
            message: 'System settings updated',
            timestamp: new Date().toISOString(),
            changedSettings: Object.keys(data.settings)
          });
        }
        
        // Handle features update
        else if (message.subtype === 'feature') {
          // Single feature update
          if (message.action === 'update' && data.feature) {
            setSettings(prevSettings => {
              const newSettings = { ...prevSettings };
              const feature = data.feature as FeatureFlag; // Ensure type safety
              
              const featureIndex = newSettings.features.findIndex(f => 
                f.name === feature.name
              );
              
              if (featureIndex >= 0) {
                // Update existing feature
                newSettings.features = [
                  ...newSettings.features.slice(0, featureIndex),
                  feature,
                  ...newSettings.features.slice(featureIndex + 1)
                ];
              } else {
                // Add new feature
                newSettings.features = [...newSettings.features, feature];
              }
              
              return newSettings;
            });
          }
          // Bulk features update
          else if (data.features) {
            setSettings(prevSettings => ({
              ...prevSettings,
              features: data.features as FeatureFlag[] || prevSettings.features
            }));
          }
          
          setIsLoading(false);
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('system_features_update', {
            socketType: TopicType.SYSTEM,
            message: 'System features updated',
            timestamp: new Date().toISOString()
          });
        }
        
        // Handle theme update
        else if (message.subtype === 'theme') {
          // Single theme update
          if (message.action === 'update' && data.theme) {
            setSettings(prevSettings => {
              const newSettings = { ...prevSettings };
              const theme = data.theme as SystemTheme; // Ensure type safety
              
              const themeIndex = newSettings.themes.findIndex(t => 
                t.name === theme.name
              );
              
              if (themeIndex >= 0) {
                // Update existing theme
                newSettings.themes = [
                  ...newSettings.themes.slice(0, themeIndex),
                  theme,
                  ...newSettings.themes.slice(themeIndex + 1)
                ];
              } else {
                // Add new theme
                newSettings.themes = [...newSettings.themes, theme];
              }
              
              return newSettings;
            });
          }
          // Bulk themes update
          else if (data.themes) {
            setSettings(prevSettings => ({
              ...prevSettings,
              themes: data.themes as SystemTheme[] || prevSettings.themes
            }));
          }
          
          setIsLoading(false);
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('system_themes_update', {
            socketType: TopicType.SYSTEM,
            message: 'System themes updated',
            timestamp: new Date().toISOString()
          });
        }
        
        // Handle notice update
        else if (message.subtype === 'notification') {
          // Add/update single notice
          if ((message.action === 'add' || message.action === 'update') && data.notice) {
            setSettings(prevSettings => {
              const newSettings = { ...prevSettings };
              const notice = data.notice as GlobalNotice; // Ensure type safety
              
              const noticeIndex = newSettings.notices.findIndex(n => 
                n.id === notice.id
              );
              
              if (noticeIndex >= 0) {
                // Update existing notice
                newSettings.notices = [
                  ...newSettings.notices.slice(0, noticeIndex),
                  notice,
                  ...newSettings.notices.slice(noticeIndex + 1)
                ];
              } else {
                // Add new notice
                newSettings.notices = [...newSettings.notices, notice];
              }
              
              return newSettings;
            });
          }
          // Remove notice
          else if (message.action === 'remove' && data.notice?.id) {
            setSettings(prevSettings => ({
              ...prevSettings,
              notices: prevSettings.notices.filter(n => n.id !== data.notice?.id)
            }));
          }
          // Bulk notices update
          else if (data.notices) {
            setSettings(prevSettings => ({
              ...prevSettings,
              notices: data.notices as GlobalNotice[] || prevSettings.notices
            }));
          }
          
          setIsLoading(false);
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('system_notices_update', {
            socketType: TopicType.SYSTEM,
            message: 'System notices updated',
            timestamp: new Date().toISOString(),
            action: message.action
          });
        }
      }
    } catch (err) {
      console.error('[SystemSettings WebSocket] Error processing message:', err);
      
      dispatchWebSocketEvent('error', {
        socketType: TopicType.SYSTEM,
        message: 'Error processing system settings data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, []);

  // Connect to WebSocket
  const ws = useUnifiedWebSocket(
    'system-settings-hook',
    [DDExtendedMessageType.DATA, DDExtendedMessageType.ERROR],
    handleMessage,
    [TopicType.SYSTEM]
  );

  // Subscribe to system topic when connected
  useEffect(() => {
    if (ws.isConnected && isLoading) {
      // Subscribe to system topic
      ws.subscribe([TopicType.SYSTEM]);
      
      // Request initial settings data
      const params = settingsToWatch?.length ? { settingsToWatch } : undefined;
      ws.request(TopicType.SYSTEM, 'GET_SETTINGS', params);
      
      dispatchWebSocketEvent('system_settings_subscribe', {
        socketType: TopicType.SYSTEM,
        message: 'Subscribing to system settings data',
        timestamp: new Date().toISOString(),
        settingsToWatch
      });
      
      // Set a timeout to reset loading state if we don't get data
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          console.warn('[SystemSettings WebSocket] Timed out waiting for data');
          setIsLoading(false);
        }
      }, 10000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [ws.isConnected, isLoading, ws.subscribe, ws.request, settingsToWatch]);

  // Force refresh system settings
  const refreshSettings = useCallback(() => {
    if (!ws.isConnected) {
      console.warn('[SystemSettings WebSocket] Cannot refresh - WebSocket not connected');
      return;
    }
    
    setIsLoading(true);
    
    // Request fresh settings data
    const params = settingsToWatch?.length ? { settingsToWatch } : undefined;
    ws.request(TopicType.SYSTEM, 'GET_SETTINGS', params);
    
    dispatchWebSocketEvent('system_settings_refresh', {
      socketType: TopicType.SYSTEM,
      message: 'Refreshing system settings data',
      timestamp: new Date().toISOString()
    });
    
    // Set a timeout to reset loading state if we don't get data
    setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 10000);
  }, [ws.isConnected, ws.request, settingsToWatch, isLoading]);

  // Get a feature flag status
  const isFeatureEnabled = useCallback((featureName: string): boolean => {
    const feature = settings.features.find(f => f.name === featureName);
    return feature?.enabled || false;
  }, [settings.features]);

  // Get current active theme
  const getActiveTheme = useCallback((): SystemTheme | undefined => {
    return settings.themes.find(t => t.active);
  }, [settings.themes]);

  // Get filtered notices for the current user
  const getActiveNotices = useCallback((userRole: string = 'all'): GlobalNotice[] => {
    const now = new Date();
    return settings.notices.filter(notice => {
      // Check expiration
      if (notice.expires && new Date(notice.expires) < now) {
        return false;
      }
      
      // Check target audience
      if (notice.target === 'all') {
        return true;
      }
      
      if (notice.target === 'authenticated' && userRole !== 'unauthenticated') {
        return true;
      }
      
      if (notice.target === 'unauthenticated' && userRole === 'unauthenticated') {
        return true;
      }
      
      if (notice.target === userRole) {
        return true;
      }
      
      if (Array.isArray(notice.target) && notice.target.includes(userRole)) {
        return true;
      }
      
      return false;
    });
  }, [settings.notices]);

  // Return system settings data and helper functions
  return {
    settings,
    isLoading,
    isConnected: ws.isConnected,
    error: ws.error,
    lastUpdate,
    refreshSettings,
    isFeatureEnabled,
    getActiveTheme,
    getActiveNotices,
    
    // Convenience accessors
    features: settings.features,
    themes: settings.themes,
    notices: settings.notices,
    isMaintenanceMode: settings.maintenanceMode,
    maintenanceMessage: settings.maintenanceMessage,
    isRegistrationOpen: settings.registrationOpen,
    limits: settings.limits,
    version: settings.version,
    environment: settings.environment
  };
}