/**
 * SkyDuel WebSocket Debug Panel
 * 
 * This component displays real-time SkyDuel WebSocket messages and connection status
 * for the v69 Unified WebSocket System.
 * 
 * Created: March 28, 2025
 */

import React, { useEffect, useState, useRef } from 'react';
import { DDExtendedMessageType, messageTypeToString } from '../../../hooks/websocket/types';
import { useSkyDuelWebSocket } from '../../../hooks/websocket/useSkyDuelWebSocket';

// Interface for tracked WebSocket messages
interface WebSocketMessage {
  id: string;
  timestamp: string;
  type: DDExtendedMessageType;
  topic?: string;
  action?: string;
  data?: any;
  direction: 'in' | 'out';
}

// Color mappings for message types
const TYPE_COLORS: Record<string, string> = {
  [DDExtendedMessageType.SUBSCRIBE]: 'text-green-400',
  [DDExtendedMessageType.UNSUBSCRIBE]: 'text-yellow-400',
  [DDExtendedMessageType.REQUEST]: 'text-blue-400',
  [DDExtendedMessageType.COMMAND]: 'text-purple-400',
  [DDExtendedMessageType.DATA]: 'text-cyan-400',
  [DDExtendedMessageType.ERROR]: 'text-red-500',
  [DDExtendedMessageType.SYSTEM]: 'text-gray-400',
  [DDExtendedMessageType.ACKNOWLEDGMENT]: 'text-indigo-400',
  'default': 'text-white'
};

// Main component
const SkyDuelDebugPanel: React.FC = () => {
  // Get WebSocket connection
  const skyDuelSocket = useSkyDuelWebSocket();
  
  // State for messages and filters
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [showHeartbeats, setShowHeartbeats] = useState(false);
  const [filterType, setFilterType] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState(true);
  const maxMessages = 100; // Fixed value
  
  // References
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  // Heartbeat status tracking
  const lastHeartbeatRef = useRef<number>(Date.now());
  const [heartbeatStatus, setHeartbeatStatus] = useState<'normal' | 'warning' | 'critical'>('normal');
  
  // Listen for WebSocket activity
  useEffect(() => {
    const handleWsEvent = (event: CustomEvent) => {
      const { type, topic, direction, data, timestamp, action } = event.detail;
      
      // Skip non-skyduel events
      if (topic !== 'skyduel' && !topic?.includes('skyduel')) {
        return;
      }
      
      // Track heartbeats for connection health monitoring
      if (type === DDExtendedMessageType.PING || type === DDExtendedMessageType.PONG || 
          (type === DDExtendedMessageType.SYSTEM && data?.action === 'heartbeat')) {
        lastHeartbeatRef.current = Date.now();
        
        // Don't add heartbeat messages unless showHeartbeats is true
        if (!showHeartbeats) return;
      }
      
      // Add message to log
      setMessages(prev => {
        const newMessage: WebSocketMessage = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          timestamp: timestamp || new Date().toISOString(),
          type,
          topic,
          action: action || data?.action,
          data,
          direction: direction || 'in'
        };
        
        // Keep only the most recent messages based on maxMessages setting
        return [...prev, newMessage].slice(-maxMessages);
      });
    };
    
    // Register event listener for WebSocket monitoring events
    window.addEventListener('ws-debug', handleWsEvent as EventListener);
    
    // Check heartbeat health every 5 seconds
    const heartbeatInterval = setInterval(() => {
      const timeSinceLastHeartbeat = Date.now() - lastHeartbeatRef.current;
      
      if (timeSinceLastHeartbeat > 60000) { // More than 60 seconds
        setHeartbeatStatus('critical');
      } else if (timeSinceLastHeartbeat > 30000) { // More than 30 seconds
        setHeartbeatStatus('warning');
      } else {
        setHeartbeatStatus('normal');
      }
    }, 5000);
    
    // Cleanup
    return () => {
      window.removeEventListener('ws-debug', handleWsEvent as EventListener);
      clearInterval(heartbeatInterval);
    };
  }, [showHeartbeats, maxMessages]);
  
  // Auto-scroll to bottom when new messages arrive if autoScroll is enabled
  useEffect(() => {
    if (autoScroll && messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);
  
  // Filter messages based on current filter settings
  const filteredMessages = messages.filter(message => {
    // Filter by message type if specified
    if (filterType && message.type !== filterType) {
      return false;
    }
    
    // Hide heartbeat messages if showHeartbeats is false
    if (!showHeartbeats && 
        (message.type === DDExtendedMessageType.PING || 
         message.type === DDExtendedMessageType.PONG || 
         (message.type === DDExtendedMessageType.SYSTEM && message.data?.action === 'heartbeat'))) {
      return false;
    }
    
    return true;
  });
  
  // Get all unique message types for filters
  const uniqueTypes = Array.from(new Set(messages.map(m => m.type))).sort();
  
  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false
      });
    } catch (e) {
      return 'Invalid time';
    }
  };
  
  // Clear all messages
  const handleClearMessages = () => {
    setMessages([]);
  };
  
  // Get color class for message type
  const getTypeColor = (type: DDExtendedMessageType) => TYPE_COLORS[type] || TYPE_COLORS.default;
  
  // Test the WebSocket connection with manual subscribe
  const testSubscribe = () => {
    try {
      // The hook already handles subscribing to the topic
      skyDuelSocket.connect();
      
      // Just log the action for our WebSocket monitor
      console.log('[SkyDuelDebug] Triggering connection/subscription');
      
      // Add the message to our local log
      setMessages(prev => [
        ...prev,
        {
          id: `manual-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: DDExtendedMessageType.SUBSCRIBE,
          topic: 'skyduel',
          data: { topics: ['skyduel'] },
          direction: 'out'
        }
      ]);
    } catch (error) {
      console.error('[SkyDuelDebug] Error sending test message:', error);
    }
  };
  
  // Manually request data refresh
  const testRefresh = () => {
    skyDuelSocket.sendCommand('refresh');
  };
  
  return (
    <div className="bg-dark-800/80 rounded-lg shadow-lg text-white backdrop-blur-sm">
      <div className="p-4">
        {/* Header with connection status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-brand-300">SkyDuel WebSocket v69</h2>
            
            <div className="flex items-center space-x-1">
              {/* Connection status indicator */}
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-1 ${skyDuelSocket.isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="text-sm">
                  {skyDuelSocket.isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              {/* Heartbeat status indicator */}
              <div className="flex items-center ml-3">
                <div className={`w-3 h-3 rounded-full mr-1 ${
                  heartbeatStatus === 'normal' ? 'bg-emerald-500' : 
                  heartbeatStatus === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                }`} />
                <span className="text-sm">Heartbeat</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleClearMessages}
              className="px-3 py-1 bg-red-700 text-white rounded text-sm hover:bg-red-600 transition-colors"
            >
              Clear Log
            </button>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex flex-wrap items-center mb-4 gap-2">
          {/* Message type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-dark-700 border border-dark-600 rounded py-1 px-2 text-sm"
          >
            <option value="">All Message Types</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
          {/* Show heartbeats toggle */}
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={showHeartbeats}
              onChange={() => setShowHeartbeats(!showHeartbeats)}
              className="mr-2"
            />
            Show Heartbeats
          </label>
          
          {/* Auto-scroll toggle */}
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={() => setAutoScroll(!autoScroll)}
              className="mr-2"
            />
            Auto-scroll
          </label>
          
          {/* Test buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={testSubscribe}
              className="px-3 py-1 bg-brand-600 text-white rounded text-sm hover:bg-brand-500 transition-colors"
            >
              Subscribe
            </button>
            <button
              onClick={testRefresh}
              className="px-3 py-1 bg-brand-600 text-white rounded text-sm hover:bg-brand-500 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
        
        {/* Message log */}
        <div className="bg-dark-700 rounded border border-dark-600 overflow-auto" style={{ height: '300px' }}>
          {filteredMessages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-gray-500">
              No messages
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-dark-800 z-10">
                <tr>
                  <th className="text-left p-2 border-b border-dark-600">Time</th>
                  <th className="text-left p-2 border-b border-dark-600">Dir</th>
                  <th className="text-left p-2 border-b border-dark-600">Type</th>
                  <th className="text-left p-2 border-b border-dark-600">Action</th>
                  <th className="text-left p-2 border-b border-dark-600">Content</th>
                </tr>
              </thead>
              <tbody>
                {filteredMessages.map(message => (
                  <tr key={message.id} className="border-b border-dark-600 hover:bg-dark-600/50">
                    <td className="p-2 whitespace-nowrap text-gray-400">{formatTime(message.timestamp)}</td>
                    <td className="p-2 whitespace-nowrap">
                      <span className={message.direction === 'in' ? 'text-green-400' : 'text-blue-400'}>
                        {message.direction === 'in' ? '←' : '→'}
                      </span>
                    </td>
                    <td className={`p-2 whitespace-nowrap ${getTypeColor(message.type)}`}>{messageTypeToString(message.type)}</td>
                    <td className="p-2 whitespace-nowrap text-brand-300">
                      {message.action || '-'}
                    </td>
                    <td className="p-2">
                      {message.data ? (
                        <details>
                          <summary className="cursor-pointer">
                            {message.data.message || 
                              (typeof message.data === 'object' ? 
                                JSON.stringify(message.data).substring(0, 50) + 
                                (JSON.stringify(message.data).length > 50 ? '...' : '') : 
                                String(message.data))}
                          </summary>
                          <pre className="mt-1 p-2 bg-dark-900 rounded text-xs overflow-x-auto">
                            {JSON.stringify(message.data, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <span className="text-gray-500">No data</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {/* Auto-scroll reference element */}
          <div ref={messageEndRef} />
        </div>
        
        {/* Message count and filters display */}
        <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
          <div>
            Showing {filteredMessages.length} of {messages.length} messages
          </div>
          <div>
            <span className="text-xs font-medium text-gray-300 mr-1">Status:</span> 
            {skyDuelSocket.lastUpdate ? (
              <span>Last update {new Date(skyDuelSocket.lastUpdate).toLocaleTimeString()}</span>
            ) : (
              <span>No updates received</span>
            )}
            {skyDuelSocket.error && (
              <span className="ml-2 text-red-400">Error: {skyDuelSocket.error}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkyDuelDebugPanel;