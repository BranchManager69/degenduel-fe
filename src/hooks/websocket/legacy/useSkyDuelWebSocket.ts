/**
 * SkyDuel WebSocket Hook for v69 Unified WebSocket System
 * 
 * This hook connects to the SkyDuel topic of the unified WebSocket system and provides
 * real-time monitoring and control of the SkyDuel service network visualization.
 * 
 * Last updated: March 28, 2025
 * Based on the v69 Unified WebSocket System specification
 */

import { useCallback, useEffect, useState } from 'react';
import type {
  NodeConnection as AdminNodeConnection,
  NodeMetrics as AdminNodeMetrics,
  NodeStatus as AdminNodeStatus,
  NodeType as AdminNodeType,
  ServiceNode as AdminServiceNode,
  SkyDuelAlert as AdminSkyDuelAlert,
  SkyDuelState as AdminSkyDuelState
} from '../../../components/admin/skyduel/types';
import { useStore } from '../../../store/useStore';
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';
import { DDExtendedMessageType, isMessageType, SOCKET_TYPES, WEBSOCKET_ENDPOINT } from '../types';
import useWebSocket from './useWebSocket';

// SkyDuel service types
export interface ServiceNode extends Omit<AdminServiceNode, 'type' | 'status' | 'metrics' | 'alerts'> {
  type: AdminNodeType;
  status: AdminNodeStatus;
  metrics: AdminNodeMetrics;
  alerts: AdminSkyDuelAlert[];
}

export interface ServiceAlert extends AdminSkyDuelAlert {
  // acknowledged?: boolean;
}

export interface ServiceConnection extends AdminNodeConnection {}

interface SkyDuelState extends Omit<AdminSkyDuelState, 'nodes' | 'connections' | 'systemStatus'> {
  nodes: ServiceNode[];
  connections: ServiceConnection[];
  systemStatus: AdminSkyDuelState['systemStatus'];
}

// Message types from v69 Unified WebSocket System
interface UnifiedMessage {
  type: DDExtendedMessageType;
  topic?: string;
  data?: any;
  message?: string;
  timestamp?: string;
  initialData?: boolean;
  error?: string;
  code?: number;
  action?: string;
  requestId?: string;
  operation?: string; // For acknowledgment messages
  topics?: string[]; // For subscription-related messages
}

export function useSkyDuelWebSocket() {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { setSkyDuelState, addServiceAlert } = useStore();

  // Connect to the WebSocket using the standardized hook
  const { 
    status, 
    data, 
    error,
    send,
    connect,
    close
  } = useWebSocket<UnifiedMessage>({
    endpoint: WEBSOCKET_ENDPOINT,
    socketType: SOCKET_TYPES.SKYDUEL,
    requiresAuth: false, // Allow more flexible connection handling
    heartbeatInterval: 30000, // 30 second heartbeat as per v69 spec
    autoConnect: true // Ensure we try to connect automatically
  });

  // Track loading state
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // When the connection status changes, log it
  useEffect(() => {
    dispatchWebSocketEvent('skyduel_status', {
      socketType: SOCKET_TYPES.SKYDUEL,
      status,
      message: `SkyDuel WebSocket is ${status}`
    });

    // Subscribe to the skyduel topic when connected
    if (status === 'online' && !isSubscribed) {
      // Subscribe to the skyduel topic
      subscribeToSkyDuelTopic();
      setIsLoading(false);
    }
    
    // If we're not connected but should be loading, trigger connection with timeout
    if (status !== 'online' && isLoading) {
      // Attempt connection
      connect();
      
      // Set a timeout to prevent endless loading state
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          console.warn('SkyDuel connection timed out, resetting loading state');
          setIsLoading(false);
        }
      }, 10000);
      
      // Clean up the timeout if component unmounts
      return () => clearTimeout(timeoutId);
    }
  }, [status, isSubscribed, isLoading, connect]);

  // Subscribe to the skyduel topic
  const subscribeToSkyDuelTopic = useCallback(() => {
    if (status !== 'online') {
      console.warn('[SkyDuelWebSocket] Cannot subscribe: socket not connected');
      return;
    }

    try {
      // Subscribe message format according to v69 spec
      const subscribeMessage = {
        type: DDExtendedMessageType.SUBSCRIBE,
        topics: ['skyduel'],
        timestamp: new Date().toISOString()
      };

      console.log('[SkyDuelWebSocket] Subscribing to skyduel topic');
      send(subscribeMessage);
      
      dispatchWebSocketEvent('skyduel_subscribe', {
        socketType: SOCKET_TYPES.SKYDUEL,
        message: 'Subscribing to skyduel topic',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[SkyDuelWebSocket] Error subscribing to topic:', error);
      
      dispatchWebSocketEvent('error', {
        socketType: SOCKET_TYPES.SKYDUEL,
        message: 'Error subscribing to skyduel topic',
        error
      });
    }
  }, [status, send]);

  // Process messages from the WebSocket
  useEffect(() => {
    if (!data) return;
    
    try {
      // Process the message based on its type according to v69 unified system
      if (isMessageType(data, DDExtendedMessageType.ACKNOWLEDGMENT)) {
          // Handle subscription acknowledgment
          if (data.operation === 'SUBSCRIBE' && data.topics?.includes('skyduel')) {
            console.log('[SkyDuelWebSocket] Successfully subscribed to skyduel topic');
            setIsSubscribed(true);
            
            dispatchWebSocketEvent('skyduel_subscribed', {
              socketType: SOCKET_TYPES.SKYDUEL,
              message: 'Successfully subscribed to skyduel topic',
              timestamp: new Date().toISOString()
            });
          }
      } else if (isMessageType(data, DDExtendedMessageType.DATA)) {
          // Handle data messages for the skyduel topic
          if (data.topic === 'skyduel') {
            // Mark as receiving initial data if specified
            if (data.initialData) {
              console.log('[SkyDuelWebSocket] Received initial skyduel data');
              dispatchWebSocketEvent('skyduel_initial_data', {
                socketType: SOCKET_TYPES.SKYDUEL,
                message: 'Received initial skyduel data',
                timestamp: new Date().toISOString()
              });
            }
            
            // Process the skyduel data based on its content
            const skyDuelData = data.data;
            
            if (skyDuelData.fullState) {
              // Full state update
              const skyDuelState = skyDuelData.fullState as SkyDuelState;
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
            } else if (skyDuelData.nodeUpdate) {
              // Individual node update
              const nodeUpdate = skyDuelData.nodeUpdate;
              dispatchWebSocketEvent('skyduel_node_update', {
                socketType: SOCKET_TYPES.SKYDUEL,
                message: `Node update for ${nodeUpdate.name || nodeUpdate.id}`,
                nodeId: nodeUpdate.id,
                nodeStatus: nodeUpdate.status,
                timestamp: new Date().toISOString()
              });
            } else if (skyDuelData.connectionUpdate) {
              // Individual connection update
              const connUpdate = skyDuelData.connectionUpdate;
              dispatchWebSocketEvent('skyduel_connection_update', {
                socketType: SOCKET_TYPES.SKYDUEL,
                message: `Connection update for ${connUpdate.source} → ${connUpdate.target}`,
                source: connUpdate.source,
                target: connUpdate.target,
                status: connUpdate.status,
                timestamp: new Date().toISOString()
              });
            } else if (skyDuelData.alert) {
              // Alert notification
              const { severity, content } = skyDuelData.alert;
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
          }
      } else if (isMessageType(data, DDExtendedMessageType.ERROR)) {
          // Handle error messages
          console.error(`[SkyDuelWebSocket] Error (${data.code}): ${data.message}`);
          addServiceAlert("error", `SkyDuel WebSocket error (${data.code}): ${data.message}`);
          
          dispatchWebSocketEvent('error', {
            socketType: SOCKET_TYPES.SKYDUEL,
            message: data.message || 'Unknown error',
            code: data.code,
            timestamp: new Date().toISOString()
          });
      } else if (isMessageType(data, DDExtendedMessageType.SYSTEM)) {
          // Handle system messages
          if (data.action === 'heartbeat') {
            // Heartbeat message
            dispatchWebSocketEvent('skyduel_heartbeat', {
              socketType: SOCKET_TYPES.SKYDUEL,
              message: 'Received heartbeat',
              timestamp: data.timestamp
            });
          } else {
            // Other system messages
            console.log(`[SkyDuelWebSocket] System message: ${data.message}`);
            
            dispatchWebSocketEvent('skyduel_system', {
              socketType: SOCKET_TYPES.SKYDUEL,
              message: data.message || 'System message received',
              timestamp: new Date().toISOString()
            });
          }
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
  
  // Send a request for data to the SkyDuel system
  const requestData = useCallback((action: string, params: Record<string, any> = {}) => {
    if (status !== 'online') {
      console.error("[SkyDuelWebSocket] Cannot request data: socket not connected");
      return false;
    }

    if (!isSubscribed) {
      console.error("[SkyDuelWebSocket] Cannot request data: not subscribed to skyduel topic");
      return false;
    }

    try {
      // Format according to v69 unified system REQUEST message
      const requestMessage = {
        type: DDExtendedMessageType.REQUEST,
        topic: 'skyduel',
        action,
        ...params,
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      };

      send(requestMessage);
      
      dispatchWebSocketEvent('skyduel_request', {
        socketType: SOCKET_TYPES.SKYDUEL,
        message: `Data request sent: ${action}`,
        action,
        params,
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error("[SkyDuelWebSocket] Error sending data request:", error);
      
      dispatchWebSocketEvent('error', {
        socketType: SOCKET_TYPES.SKYDUEL,
        message: 'Error sending data request',
        action,
        params,
        error
      });
      
      return false;
    }
  }, [status, isSubscribed, send]);
  
  // Send a command to the SkyDuel system
  const sendCommand = useCallback((action: string, params: Record<string, any> = {}) => {
    if (status !== 'online') {
      console.error("[SkyDuelWebSocket] Cannot send command: socket not connected");
      return false;
    }

    if (!isSubscribed) {
      console.error("[SkyDuelWebSocket] Cannot send command: not subscribed to skyduel topic");
      return false;
    }

    try {
      // Format according to v69 unified system COMMAND message
      const commandMessage = {
        type: DDExtendedMessageType.COMMAND,
        topic: 'skyduel',
        action,
        ...params,
        timestamp: new Date().toISOString(),
      };

      send(commandMessage);
      
      dispatchWebSocketEvent('skyduel_command', {
        socketType: SOCKET_TYPES.SKYDUEL,
        message: `Command sent: ${action}`,
        action,
        params,
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error("[SkyDuelWebSocket] Error sending command:", error);
      
      dispatchWebSocketEvent('error', {
        socketType: SOCKET_TYPES.SKYDUEL,
        message: 'Error sending command',
        action,
        params,
        error
      });
      
      return false;
    }
  }, [status, isSubscribed, send]);
  
  return {
    isConnected: status === 'online' && isSubscribed,
    error: error ? error.message : null,
    lastUpdate,
    sendCommand,
    requestData,
    connect,
    close
  };
}