/**
 * useSkyDuel Hook
 * 
 * Standardized hook for the SkyDuel service visualization and monitoring system.
 * This hook provides real-time monitoring and control of the SkyDuel service network.
 * 
 * Based on the v69 Unified WebSocket System specification
 * Last updated: April 10, 2025
 */

import { useCallback, useEffect, useState } from 'react';
import { DDExtendedMessageType, TopicType } from '../';
import { useUnifiedWebSocket } from '../useUnifiedWebSocket';

// SkyDuel service types
export interface SkyDuelServiceNode {
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
  alerts: SkyDuelServiceAlert[];
}

export interface SkyDuelServiceAlert {
  id: string;
  severity: "info" | "warning" | "error" | "critical";
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface SkyDuelServiceConnection {
  source: string;
  target: string;
  status: "active" | "degraded" | "failed";
  latency: number; // milliseconds
  throughput: number; // requests per second
}

export interface SkyDuelState {
  nodes: SkyDuelServiceNode[];
  connections: SkyDuelServiceConnection[];
  systemStatus: {
    overall: "operational" | "degraded" | "outage";
    timestamp: string;
    message: string;
  };
}

const DEFAULT_STATE: SkyDuelState = {
  nodes: [],
  connections: [],
  systemStatus: {
    overall: "operational",
    timestamp: new Date().toISOString(),
    message: "System status unknown"
  }
};

// Message types from v69 Unified WebSocket System
interface SkyDuelMessage {
  type: string;
  topic: string;
  subtype?: string;
  action?: string;
  data?: any;
  timestamp: string;
}

/**
 * useSkyDuel hook for monitoring and interacting with the SkyDuel service visualization
 * 
 * @returns SkyDuel state and control functions
 */
export function useSkyDuel() {
  const [state, setState] = useState<SkyDuelState>(DEFAULT_STATE);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Process incoming messages
  const handleMessage = useCallback((message: SkyDuelMessage) => {
    if (message.type !== DDExtendedMessageType.DATA || message.topic !== TopicType.SKYDUEL) {
      return;
    }

    try {
      const { subtype, action, data } = message;

      if (subtype === 'system') {
        if (action === 'state_update') {
          // Full state update
          const skyDuelState = data as SkyDuelState;
          setState(skyDuelState);
          setLastUpdate(new Date());
        } else if (action === 'status_change') {
          // System status change only
          setState(prev => ({
            ...prev,
            systemStatus: {
              overall: data.status,
              timestamp: data.timestamp,
              message: data.message
            }
          }));
          setLastUpdate(new Date());
        }
      } else if (subtype === 'node') {
        if (action === 'update') {
          // Update a specific node
          const updatedNode = data.node as SkyDuelServiceNode;
          
          setState(prev => {
            const nodeIndex = prev.nodes.findIndex(n => n.id === updatedNode.id);
            const newNodes = [...prev.nodes];
            
            if (nodeIndex >= 0) {
              // Update existing node
              newNodes[nodeIndex] = updatedNode;
            } else {
              // Add new node
              newNodes.push(updatedNode);
            }
            
            return {
              ...prev,
              nodes: newNodes
            };
          });
          
          setLastUpdate(new Date());
        }
      } else if (subtype === 'connection') {
        if (action === 'update') {
          // Update a specific connection
          const updatedConnection = data.connection as SkyDuelServiceConnection;
          
          setState(prev => {
            const connectionIndex = prev.connections.findIndex(
              c => c.source === updatedConnection.source && c.target === updatedConnection.target
            );
            
            const newConnections = [...prev.connections];
            
            if (connectionIndex >= 0) {
              // Update existing connection
              newConnections[connectionIndex] = updatedConnection;
            } else {
              // Add new connection
              newConnections.push(updatedConnection);
            }
            
            return {
              ...prev,
              connections: newConnections
            };
          });
          
          setLastUpdate(new Date());
        }
      } else if (subtype === 'alert') {
        if (action === 'new') {
          // Add new alert to the appropriate node
          const { nodeId, alert } = data;
          
          setState(prev => {
            const nodeIndex = prev.nodes.findIndex(n => n.id === nodeId);
            
            if (nodeIndex < 0) {
              // Node not found, can't add alert
              return prev;
            }
            
            const newNodes = [...prev.nodes];
            newNodes[nodeIndex] = {
              ...newNodes[nodeIndex],
              alerts: [...newNodes[nodeIndex].alerts, alert]
            };
            
            return {
              ...prev,
              nodes: newNodes
            };
          });
          
          setLastUpdate(new Date());
        }
      }

      // If we've received any data, set loading to false
      if (isLoading) {
        setIsLoading(false);
      }

    } catch (error) {
      console.error('Error processing SkyDuel message:', error);
    }
  }, [isLoading]);

  // Set up WebSocket connection
  const ws = useUnifiedWebSocket(
    'skyduel-hook', 
    [DDExtendedMessageType.DATA, DDExtendedMessageType.ERROR],
    handleMessage,
    [TopicType.SKYDUEL, TopicType.SYSTEM]
  );

  // Reset loading state after a timeout if we're still loading
  useEffect(() => {
    if (!isLoading) return;

    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, [isLoading]);

  // Request initial data when connected
  useEffect(() => {
    if (!ws.isConnected || !isLoading) return;

    // Request initial state data
    ws.request(TopicType.SKYDUEL, 'get_state');
  }, [ws.isConnected, isLoading]);

  // Send a request to the SkyDuel system
  const requestData = useCallback((action: string, params: Record<string, any> = {}) => {
    if (!ws.isConnected) {
      return false;
    }
    
    return ws.request(TopicType.SKYDUEL, action, params);
  }, [ws]);

  // Helper to restart a specific service node
  const restartNode = useCallback((nodeId: string) => {
    return requestData('restart_node', { nodeId });
  }, [requestData]);

  // Helper to acknowledge an alert
  const acknowledgeAlert = useCallback((nodeId: string, alertId: string) => {
    return requestData('acknowledge_alert', { nodeId, alertId });
  }, [requestData]);

  return {
    state,
    isLoading,
    isConnected: ws.isConnected,
    error: ws.error,
    lastUpdate,
    requestData,
    restartNode,
    acknowledgeAlert
  };
}