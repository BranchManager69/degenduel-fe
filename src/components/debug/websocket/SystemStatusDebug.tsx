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
      <div className="mb-4 bg-black/30 backdrop-blur-sm p-3 rounded border border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${ws.isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className={ws.isConnected ? 'text-green-400' : 'text-red-400'}>
              {ws.isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="text-sm text-gray-400">
            Last update: <span className="text-cyan-400">{formatTimestamp(lastUpdate)}</span>
          </div>
        </div>
        {ws.error && (
          <div className="mt-2 p-2 bg-red-900/50 border border-red-700 rounded text-sm">
            Error: {ws.error}
          </div>
        )}
      </div>
      
      {/* System Status Overview */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-black/30 backdrop-blur-sm p-3 rounded border border-gray-700">
          <h3 className="font-medium text-sm text-cyan-400 mb-1">System Status</h3>
          <div className={`text-lg font-semibold ${getStatusColor(systemStatus)}`}>
            {systemStatus.charAt(0).toUpperCase() + systemStatus.slice(1)}
          </div>
        </div>
        
        <div className="bg-black/30 backdrop-blur-sm p-3 rounded border border-gray-700">
          <h3 className="font-medium text-sm text-cyan-400 mb-1">Maintenance Mode</h3>
          <div className={`text-lg font-semibold ${maintenanceMode ? 'text-red-400' : 'text-green-400'}`}>
            {maintenanceMode ? 'Enabled' : 'Disabled'}
          </div>
        </div>
        
        <div className="bg-black/30 backdrop-blur-sm p-3 rounded border border-gray-700">
          <h3 className="font-medium text-sm text-cyan-400 mb-1">Server Time</h3>
          <div className="text-lg font-semibold text-cyan-400 font-mono">
            {serverTime ? new Date(serverTime).toLocaleTimeString() : 'Unknown'}
          </div>
        </div>
        
        <div className="bg-black/30 backdrop-blur-sm p-3 rounded border border-gray-700">
          <h3 className="font-medium text-sm text-cyan-400 mb-1">Heartbeat Count</h3>
          <div className="flex items-baseline">
            <div className="text-lg font-semibold text-blue-400 font-mono mr-2">
              {heartbeatCount}
            </div>
            <div className="text-xs text-gray-400">
              ping/pong cycles
            </div>
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="mb-4 flex justify-center">
        <button
          onClick={requestSystemStatus}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded transition-colors flex items-center disabled:opacity-50 disabled:pointer-events-none"
          disabled={!ws.isConnected}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Request System Status
        </button>
      </div>
      
      {/* Message Log */}
      <div className="bg-black/30 backdrop-blur-sm rounded border border-gray-700">
        <div className="flex justify-between items-center p-3 border-b border-gray-700">
          <h3 className="font-semibold text-cyan-400">Recent System Messages</h3>
          <div className="flex items-center text-xs bg-black/30 px-2 py-1 rounded">
            <span className="text-gray-400 mr-2">Count:</span> 
            <span className="text-cyan-300 font-mono">{systemMessages.length}</span>
          </div>
        </div>
        <div className="overflow-auto max-h-60 rounded">
          {systemMessages.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-800/80 sticky top-0">
                  <th className="p-2 text-left text-cyan-400 font-mono">TYPE</th>
                  <th className="p-2 text-left text-cyan-400 font-mono">ACTION</th>
                  <th className="p-2 text-left text-cyan-400 font-mono">MESSAGE</th>
                </tr>
              </thead>
              <tbody>
                {systemMessages.map((msg, index) => (
                  <tr key={index} className="border-t border-gray-800 hover:bg-gray-800/50 transition-colors">
                    <td className="p-2 text-cyan-300 font-mono">{msg.type}</td>
                    <td className="p-2 font-mono">{msg.action || '-'}</td>
                    <td className="p-2 text-gray-300">{msg.message || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center">
              <div className="flex flex-col items-center justify-center text-gray-500 space-y-2">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>No system messages received</span>
                {ws.isConnected && <span className="text-xs">Try requesting system status</span>}
              </div>
            </div>
          )}
        </div>
        
        {/* Debug Info */}
        <div className="px-3 py-2 text-xs border-t border-gray-700 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-gray-500 mr-2">Topic:</span>
            <span className="bg-gray-800/60 border border-gray-700 rounded-sm px-1.5 text-cyan-300 font-mono">system</span>
          </div>
          <div className="text-gray-500">WebSocket message rate: <span className="text-cyan-400 font-mono">~0.1/sec</span></div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatusDebug;