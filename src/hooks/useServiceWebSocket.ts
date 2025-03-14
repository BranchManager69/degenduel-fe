import { useCallback } from 'react';
import { useStore } from '../store/useStore';
import { useWebSocket } from './websocket/useWebSocket';

export interface ServiceCommand {
  service: string;
  command: 'start' | 'stop' | 'restart' | 'healthcheck';
  options?: Record<string, any>;
}

export interface ServiceWebSocketReturn {
  isConnected: boolean;
  sendCommand: (command: ServiceCommand) => boolean;
  close: () => void;
}

export const useServiceWebSocket = (): ServiceWebSocketReturn => {
  const { setServices, addServiceAlert, services } = useStore();
  const { user } = useStore();
  const token = user?.jwt || user?.session_token;

  // Handle incoming messages
  const handleMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'services:state':
        if (data.services) {
          const servicesMap = data.services.reduce((acc: Record<string, any>, service: any) => {
            acc[service.name] = {
              enabled: service.enabled,
              status: service.status,
              last_started: service.last_started,
              last_check: service.last_check,
              last_operation_time_ms: service.last_operation_time_ms,
              stats: service.stats
            };
            return acc;
          }, {});
          
          setServices(servicesMap);
        }
        break;
        
      case 'service:update':
        if (data.service) {
          // Create a new services object with the updated service
          const updatedServices = {
            ...services,
            [data.service]: {
              enabled: data.enabled,
              status: data.status,
              last_started: data.last_started,
              last_check: data.last_check,
              last_operation_time_ms: data.last_operation_time_ms,
              stats: data.stats
            }
          };
          
          setServices(updatedServices);
        }
        break;
        
      case 'service:alert':
        if (data.alert) {
          addServiceAlert(data.alert.type, data.alert.message);
        }
        break;
    }
  }, [setServices, addServiceAlert, services]);

  // Initialize WebSocket connection
  const {
    isConnected,
    sendMessage,
    disconnect
  } = useWebSocket('services', {
    token,
    reconnect: true,
    maxReconnectAttempts: 10,
    onMessage: handleMessage,
    debug: true,
  });

  // Send a command to a service
  const sendCommand = useCallback((command: ServiceCommand): boolean => {
    if (!isConnected) return false;
    
    return sendMessage({
      type: 'service:command',
      service: command.service,
      command: command.command,
      options: command.options || {}
    });
  }, [isConnected, sendMessage]);

  return {
    isConnected,
    sendCommand,
    close: disconnect
  };
};