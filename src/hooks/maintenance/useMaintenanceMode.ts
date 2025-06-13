// src/hooks/maintenance/useMaintenanceMode.ts

/**
 * @deprecated This hook is deprecated and will be removed in a future version.
 * No components are using this hook.
 * 
 * Maintenance Mode hook
 * 
 * @description This hook is used to manage the maintenance mode state and functionality.
 * 
 * @author BranchManager69
 * @version 2.0.0
 * @created 2025-05-24
 * @updated 2025-05-24
 */

import { useCallback, useEffect, useState } from 'react';
import { useWebSocket } from '../../contexts/UnifiedWebSocketContext';
import { MaintenanceEvent, MaintenanceState } from '../../types/maintenance';
import { DDExtendedMessageType } from '../websocket/types';

export const useMaintenanceMode = () => {
  const [maintenanceState, setMaintenanceState] = useState<MaintenanceState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const webSocket = useWebSocket();

  // Handle maintenance WebSocket events
  const handleMaintenanceEvent = useCallback((message: any) => {
    if (message.type === DDExtendedMessageType.DATA && message.topic === 'maintenance') {
      const event: MaintenanceEvent = message.data;

      switch (event.type) {
        case 'MAINTENANCE_STARTED':
          setMaintenanceState(event.data);
          // Show immediate notification
          if (window.Notification && Notification.permission === 'granted') {
            new Notification('Maintenance Mode Activated', {
              body: event.data.message,
              icon: '/favicon.ico'
            });
          }
          break;

        case 'MAINTENANCE_ENDED':
          setMaintenanceState(null);
          // Show end notification
          if (window.Notification && Notification.permission === 'granted') {
            new Notification('Maintenance Complete', {
              body: 'DegenDuel is back online!',
              icon: '/favicon.ico'
            });
          }
          break;

        case 'MAINTENANCE_UPDATED':
          setMaintenanceState(event.data);
          break;
      }
    }
  }, []);

  // Register WebSocket listener for maintenance events
  useEffect(() => {
    if (webSocket.isConnected) {
      const unregister = webSocket.registerListener(
        'maintenance-mode',
        [DDExtendedMessageType.DATA],
        handleMaintenanceEvent,
        ['maintenance']
      );

      // Subscribe to maintenance topic
      webSocket.subscribe(['maintenance']);

      return unregister;
    }
  }, [webSocket.isConnected, handleMaintenanceEvent]);

  // Initial maintenance state check
  useEffect(() => {
    const checkInitialState = async () => {
      try {
        const response = await fetch('/api/status');
        if (response.status === 503) {
          // In maintenance mode
          const data = await response.json();
          setMaintenanceState({
            isActive: true,
            message: data.message || 'System is in maintenance mode',
            startTime: new Date().toISOString(),
            maintenanceType: 'scheduled'
          });
        } else {
          setMaintenanceState(null);
        }
      } catch (error) {
        console.error('Failed to check initial maintenance state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkInitialState();
  }, []);

  // Admin function to trigger maintenance mode
  const triggerMaintenanceMode = useCallback(async (
    enabled: boolean,
    options?: {
      message?: string;
      estimatedDuration?: number;
      maintenanceType?: 'scheduled' | 'emergency' | 'update';
    }
  ) => {
    try {
      const response = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          enabled,
          ...options
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update maintenance mode');
      }

      // The WebSocket event will handle the state update
      return true;
    } catch (error) {
      console.error('Failed to trigger maintenance mode:', error);
      return false;
    }
  }, []);

  return {
    maintenanceState,
    isInMaintenance: !!maintenanceState?.isActive,
    isLoading,
    triggerMaintenanceMode
  };
}; 