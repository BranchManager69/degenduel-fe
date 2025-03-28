import React, { useCallback, useEffect, useState } from 'react';
import { MessageType, TopicType, useUnifiedWebSocket } from '../../../hooks/websocket';
import { NODE_ENV } from '../../../config/config';

interface SystemMessage {
  type: string;
  action?: string;
  status?: string;
  message?: string;
  timestamp?: string;
  serverTime?: string;
}

/**
 * Debug component for testing the System Status WebSocket topic
 * Displays real-time system status updates and heartbeats
 */
const SystemStatusDebug: React.FC = () => {
  const [systemMessages, setSystemMessages] = useState<SystemMessage[]>([]);
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [serverTime, setServerTime] = useState<string | null>(null);
  const [systemStatus, setSystemStatus] = useState<string>('unknown');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [heartbeatCount, setHeartbeatCount] = useState<number>(0);
  
  // Generate unique ID for this hook instance
  const wsId = `system-status-${Math.random().toString(36).substring(2, 9)}`;
  
  // Handle incoming messages from the WebSocket
  const handleMessage = useCallback((message: any) => {
    try {
      if (NODE_ENV === "development") {
        console.log(`[SystemStatus] Received message:`, message);
      }
      
      // Add to message history
      setSystemMessages(prev => {
        // Keep only last 20 messages
        const newMessages = [...prev, message].slice(-20);
        return newMessages;
      });
      
      // Update last updated time
      setLastUpdate(new Date());
      
      // Handle specific system messages
      if (message.type === 'SYSTEM') {
        if (message.serverTime) {
          setServerTime(message.serverTime);
        }
        
        // Track heartbeats
        if (message.action === 'heartbeat' || message.action === 'ping') {
          setHeartbeatCount(prev => prev + 1);
        }
      }
      // Handle maintenance mode updates
      else if (message.type === 'maintenance_status') {
        if (message.data && typeof message.data.mode === 'boolean') {
          setMaintenanceMode(message.data.mode);
        }
      }
      // Handle system status updates
      else if (message.type === 'system_status') {
        if (message.data && message.data.status) {
          setSystemStatus(message.data.status);
        }
      }
    } catch (err) {
      console.error('[SystemStatus] Failed to process message:', err);
    }
  }, []);
  
  // Connect to the WebSocket and subscribe to the SYSTEM topic
  const ws = useUnifiedWebSocket(
    wsId,
    [MessageType.SYSTEM, MessageType.DATA, MessageType.ERROR],
    handleMessage,
    [TopicType.SYSTEM]
  );
  
  // Subscribe to the SYSTEM topic when connected
  useEffect(() => {
    if (ws.isConnected) {
      ws.subscribe([TopicType.SYSTEM]);
    }
  }, [ws.isConnected]);
  
  // Format timestamp for display
  const formatTimestamp = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString();
  };
  
  // Get the appropriate status indicator color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'operational':
      case 'active':
      case 'online':
        return 'text-green-400';
      case 'degraded':
      case 'warning':
        return 'text-yellow-400';
      case 'critical':
      case 'error':
      case 'maintenance':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };
  
  // Request system status
  const requestSystemStatus = () => {
    if (ws.isConnected) {
      ws.request(TopicType.SYSTEM, 'getSystemStatus');
    }
  };
  
  return (
    <div className="text-white">
      {/* Connection Status */}
      <div className="mb-4">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${ws.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>{ws.isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        {ws.error && (
          <div className="mt-2 p-2 bg-red-900 bg-opacity-50 rounded text-sm">
            Error: {ws.error}
          </div>
        )}
        <div className="mt-2 text-sm text-gray-400">
          Last update: {formatTimestamp(lastUpdate)}
        </div>
      </div>
      
      {/* System Status Overview */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-800 p-3 rounded">
          <h3 className="font-medium text-sm text-gray-400 mb-1">System Status</h3>
          <div className={`text-lg font-semibold ${getStatusColor(systemStatus)}`}>
            {systemStatus.charAt(0).toUpperCase() + systemStatus.slice(1)}
          </div>
        </div>
        
        <div className="bg-gray-800 p-3 rounded">
          <h3 className="font-medium text-sm text-gray-400 mb-1">Maintenance Mode</h3>
          <div className={`text-lg font-semibold ${maintenanceMode ? 'text-red-400' : 'text-green-400'}`}>
            {maintenanceMode ? 'Enabled' : 'Disabled'}
          </div>
        </div>
        
        <div className="bg-gray-800 p-3 rounded">
          <h3 className="font-medium text-sm text-gray-400 mb-1">Server Time</h3>
          <div className="text-lg font-semibold text-cyan-400">
            {serverTime ? new Date(serverTime).toLocaleTimeString() : 'Unknown'}
          </div>
        </div>
        
        <div className="bg-gray-800 p-3 rounded">
          <h3 className="font-medium text-sm text-gray-400 mb-1">Heartbeat Count</h3>
          <div className="text-lg font-semibold text-blue-400">
            {heartbeatCount}
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="mb-4">
        <button
          onClick={requestSystemStatus}
          className="px-3 py-1 bg-blue-600 rounded mr-2"
          disabled={!ws.isConnected}
        >
          Request System Status
        </button>
      </div>
      
      {/* Message Log */}
      <div>
        <h3 className="font-semibold mb-2">Recent System Messages</h3>
        <div className="overflow-auto max-h-60 bg-gray-800 rounded">
          {systemMessages.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-700">
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-left">Action</th>
                  <th className="p-2 text-left">Message</th>
                </tr>
              </thead>
              <tbody>
                {systemMessages.map((msg, index) => (
                  <tr key={index} className="border-t border-gray-700">
                    <td className="p-2">{msg.type}</td>
                    <td className="p-2">{msg.action || '-'}</td>
                    <td className="p-2">{msg.message || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-4 text-center text-gray-500">
              No system messages received
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemStatusDebug;