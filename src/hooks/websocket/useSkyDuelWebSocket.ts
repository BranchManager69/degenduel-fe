/**
 * SkyDuel WebSocket Hook - V69 Standardized Version
 * 
 * This hook connects to the SkyDuel WebSocket service and provides real-time
 * monitoring and control of the SkyDuel service network visualization.
 */

import { useCallback, useEffect, useState } from 'react';
import { dispatchWebSocketEvent } from '../../utils/wsMonitor';
import { SOCKET_TYPES, WEBSOCKET_ENDPOINTS } from './types';
import useWebSocket from './useWebSocket';
import { useStore } from '../../store/useStore';

// SkyDuel service types
export interface ServiceNode {
  id: string;
  name: string;
  type: "api" | "worker" | "websocket" | "database" | "cache";
  status: "online" | "offline" | "degraded" | "restarting";
  health: number; // 0-100
  uptime: number; // seconds
  lastRestart: string | null;
  metrics: {
    cpu: number; // percentage
    memory: number; // percentage
    connections: number;
    requestsPerMinute: number;
    errorRate: number;
  };
  alerts: ServiceAlert[];
}

export interface ServiceAlert {
  id: string;
  severity: "info" | "warning" | "error" | "critical";
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface ServiceConnection {
  source: string;
  target: string;
  status: "active" | "degraded" | "failed";
  latency: number; // milliseconds
  throughput: number; // requests per second
}

interface SkyDuelState {
  nodes: ServiceNode[];
  connections: ServiceConnection[];
  systemStatus: {
    overall: "operational" | "degraded" | "outage";
    timestamp: string;
    message: string;
  };
}

// WebSocket message types
interface SkyDuelMessage {
  type:
    | "state_update"
    | "node_update"
    | "connection_update"
    | "alert"
    | "command_response";
  data: any;
  timestamp: string;
}

export function useSkyDuelWebSocket() {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { setSkyDuelState, addServiceAlert } = useStore();

  // Connect to the WebSocket using the standardized hook
  const { 
    status, 
    data, 
    error,
    send,
    connect,
    close
  } = useWebSocket<SkyDuelMessage>({
    endpoint: WEBSOCKET_ENDPOINTS.SKYDUEL,
    socketType: SOCKET_TYPES.SKYDUEL,
    requiresAuth: true, // SkyDuel requires admin authentication
    heartbeatInterval: 15000 // 15 second heartbeat
  });

  // When the connection status changes, log it
  useEffect(() => {
    dispatchWebSocketEvent('skyduel_status', {
      socketType: SOCKET_TYPES.SKYDUEL,
      status,
      message: `SkyDuel WebSocket is ${status}`
    });
  }, [status]);

  // Process messages from the WebSocket
  useEffect(() => {
    if (!data) return;
    
    try {
      // Process the message based on its type
      switch (data.type) {
        case "state_update":
          const skyDuelState = data.data as SkyDuelState;
          setSkyDuelState(skyDuelState);
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('skyduel_state_update', {
            socketType: SOCKET_TYPES.SKYDUEL,
            message: 'SkyDuel state updated',
            nodeCount: skyDuelState.nodes.length,
            connectionCount: skyDuelState.connections.length,
            systemStatus: skyDuelState.systemStatus.overall,
            timestamp: new Date().toISOString()
          });
          break;
          
        case "node_update":
          // Individual node updates are handled in the store
          dispatchWebSocketEvent('skyduel_node_update', {
            socketType: SOCKET_TYPES.SKYDUEL,
            message: `Node update for ${data.data.name || data.data.id}`,
            nodeId: data.data.id,
            nodeStatus: data.data.status,
            timestamp: new Date().toISOString()
          });
          break;
          
        case "connection_update":
          // Individual connection updates are handled in the store
          dispatchWebSocketEvent('skyduel_connection_update', {
            socketType: SOCKET_TYPES.SKYDUEL,
            message: `Connection update for ${data.data.source} → ${data.data.target}`,
            source: data.data.source,
            target: data.data.target,
            status: data.data.status,
            timestamp: new Date().toISOString()
          });
          break;
          
        case "alert":
          if (data.data.alert) {
            const { severity, content } = data.data.alert;
            addServiceAlert(severity, content);
            setLastUpdate(new Date());
            
            dispatchWebSocketEvent('skyduel_alert', {
              socketType: SOCKET_TYPES.SKYDUEL,
              message: 'SkyDuel alert received',
              severity,
              content,
              timestamp: new Date().toISOString()
            });
          }
          break;
          
        case "command_response":
          dispatchWebSocketEvent('skyduel_command_response', {
            socketType: SOCKET_TYPES.SKYDUEL,
            message: 'Command response received',
            command: data.data.command,
            status: data.data.status,
            timestamp: new Date().toISOString()
          });
          break;
      }
    } catch (err) {
      console.error('Error processing SkyDuel message:', err);
      addServiceAlert("error", "Error processing SkyDuel WebSocket message");
      
      dispatchWebSocketEvent('error', {
        socketType: SOCKET_TYPES.SKYDUEL,
        message: 'Error processing SkyDuel data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, [data, setSkyDuelState, addServiceAlert]);
  
  // Handle errors
  useEffect(() => {
    if (error) {
      console.error('SkyDuel WebSocket error:', error);
      addServiceAlert("error", `SkyDuel WebSocket error: ${error.message}`);
      
      dispatchWebSocketEvent('error', {
        socketType: SOCKET_TYPES.SKYDUEL,
        message: error.message,
        error
      });
    }
  }, [error, addServiceAlert]);
  
  // Send a command to the SkyDuel system
  const sendCommand = useCallback((command: string, params: Record<string, any> = {}) => {
    if (status !== 'online') {
      console.error("[SkyDuelWebSocket] Cannot send command: socket not connected");
      return false;
    }

    try {
      const commandMessage = {
        type: "command",
        command,
        params,
        timestamp: new Date().toISOString(),
      };

      send(commandMessage);
      
      dispatchWebSocketEvent('skyduel_command', {
        socketType: SOCKET_TYPES.SKYDUEL,
        message: `Command sent: ${command}`,
        command,
        params,
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error("[SkyDuelWebSocket] Error sending command:", error);
      
      dispatchWebSocketEvent('error', {
        socketType: SOCKET_TYPES.SKYDUEL,
        message: 'Error sending command',
        command,
        params,
        error
      });
      
      return false;
    }
  }, [status, send]);
  
  return {
    isConnected: status === 'online',
    error: error ? error.message : null,
    lastUpdate,
    sendCommand,
    connect,
    close
  };
}