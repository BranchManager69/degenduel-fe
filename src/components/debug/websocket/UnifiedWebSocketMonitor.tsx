/**
 * DEPRECATED: UnifiedWebSocketMonitor Component
 * 
 * This component is deprecated in favor of the new topic-specific monitors:
 * - TokenDataDebug - for market data
 * - SystemStatusDebug - for system monitoring
 * - UserProfileDebug - for user data
 * 
 * This was designed for the old WebSocket system and is kept for reference only.
 * Please use the new topic-specific monitors for better usability and design.
 * 
 * @deprecated Use topic-specific WebSocket monitors instead
 */

import React, { useEffect, useState, useRef } from 'react';
import { DDExtendedMessageType, TopicType, messageTypeToString } from '../../../hooks/websocket';
import { useStore } from '../../../store/useStore';

// Interface for tracked WebSocket messages
interface WebSocketMessage {
  id: string;
  timestamp: string;
  type: DDExtendedMessageType;
  topic?: string;
  data?: any;
  direction: 'in' | 'out';
}

// Color mappings for message types and topics
const TYPE_COLORS: Record<string, string> = {
  [DDExtendedMessageType.SUBSCRIBE]: 'text-green-400',
  [DDExtendedMessageType.UNSUBSCRIBE]: 'text-yellow-400',
  [DDExtendedMessageType.REQUEST]: 'text-blue-400',
  [DDExtendedMessageType.COMMAND]: 'text-purple-400',
  [DDExtendedMessageType.DATA]: 'text-cyan-400',
  [DDExtendedMessageType.ERROR]: 'text-red-500',
  [DDExtendedMessageType.SYSTEM]: 'text-gray-400',
  [DDExtendedMessageType.ACKNOWLEDGMENT]: 'text-indigo-400',
  [DDExtendedMessageType.AUTH]: 'text-pink-400',
  [DDExtendedMessageType.AUTH_SUCCESS]: 'text-pink-500',
  [DDExtendedMessageType.PING]: 'text-gray-500',
  [DDExtendedMessageType.PONG]: 'text-gray-500',
  'default': 'text-white'
};

const TOPIC_COLORS: Record<string, string> = {
  [TopicType.MARKET_DATA]: 'bg-green-900 text-green-300',
  [TopicType.PORTFOLIO]: 'bg-blue-900 text-blue-300',
  [TopicType.SYSTEM]: 'bg-gray-800 text-gray-300',
  [TopicType.CONTEST]: 'bg-yellow-900 text-yellow-300',
  [TopicType.USER]: 'bg-purple-900 text-purple-300',
  [TopicType.ADMIN]: 'bg-red-900 text-red-300',
  [TopicType.WALLET]: 'bg-indigo-900 text-indigo-300',
  [TopicType.SKYDUEL]: 'bg-cyan-900 text-cyan-300',
  'default': 'bg-gray-700 text-white'
};

// Main component
const UnifiedWebSocketMonitor: React.FC = () => {
  // Get user information for authentication display
  const user = useStore(state => state.user);
  
  // State for WebSocket connection status, messages, and active topics
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [activeTopics, setActiveTopics] = useState<Set<string>>(new Set());
  
  // Settings for the monitor
  const [showHeartbeats, setShowHeartbeats] = useState(false);
  const [filterTopic, setFilterTopic] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [maxMessages, setMaxMessages] = useState(100);
  
  // References
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  // Heartbeat status tracking
  const lastHeartbeatRef = useRef<number>(Date.now());
  const [heartbeatStatus, setHeartbeatStatus] = useState<'normal' | 'warning' | 'critical'>('normal');
  
  // Listen for WebSocket activity from our global event handler
  useEffect(() => {
    const handleWsEvent = (event: CustomEvent) => {
      const { type, topic, direction, data, timestamp } = event.detail;
      
      // Check for connection status changes
      if (type === 'connected') {
        setIsConnected(true);
      } else if (type === 'disconnected') {
        setIsConnected(false);
        setIsAuthenticated(false);
      } else if (type === 'authenticated') {
        setIsAuthenticated(true);
      }
      
      // Track heartbeats for connection health monitoring
      if (type === DDExtendedMessageType.PING || type === DDExtendedMessageType.PONG || 
          (type === DDExtendedMessageType.SYSTEM && data?.action === 'ping')) {
        lastHeartbeatRef.current = Date.now();
        
        // Update heartbeat indicator, but don't add to messages unless showHeartbeats is true
        if (!showHeartbeats) return;
      }
      
      // Track topic subscriptions
      if (type === DDExtendedMessageType.ACKNOWLEDGMENT && data?.operation === 'subscribe' && data?.topics) {
        setActiveTopics(prev => {
          const newTopics = new Set(prev);
          data.topics.forEach((t: string) => newTopics.add(t));
          return newTopics;
        });
      } else if (type === DDExtendedMessageType.ACKNOWLEDGMENT && data?.operation === 'unsubscribe' && data?.topics) {
        setActiveTopics(prev => {
          const newTopics = new Set(prev);
          data.topics.forEach((t: string) => newTopics.delete(t));
          return newTopics;
        });
      }
      
      // Add message to log
      setMessages(prev => {
        const newMessage: WebSocketMessage = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          timestamp: timestamp || new Date().toISOString(),
          type,
          topic,
          data,
          direction: direction || 'in'
        };
        
        // Keep only the most recent messages based on maxMessages setting
        return [...prev, newMessage].slice(-maxMessages);
      });
    };
    
    // Register event listener
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
    // Filter by topic if specified
    if (filterTopic && message.topic !== filterTopic) {
      return false;
    }
    
    // Filter by message type if specified
    if (filterType && message.type !== filterType) {
      return false;
    }
    
    // Hide heartbeat messages if showHeartbeats is false
    if (!showHeartbeats && 
        (message.type === DDExtendedMessageType.PING || 
         message.type === DDExtendedMessageType.PONG || 
         (message.type === DDExtendedMessageType.SYSTEM && message.data?.action === 'ping'))) {
      return false;
    }
    
    return true;
  });
  
  // Get all unique message types and topics for filters
  const uniqueTypes = Array.from(new Set(messages.map(m => m.type))).sort();
  const uniqueTopics = Array.from(new Set(messages.map(m => m.topic).filter(Boolean) as string[])).sort();
  
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
  
  // Get color class for topic badge
  const getTopicColor = (topic: string) => TOPIC_COLORS[topic] || TOPIC_COLORS.default;
  
  // Get connection status indicators 
  const getConnectionStatusColor = () => {
    if (!isConnected) return 'bg-red-500';
    if (isAuthenticated) return 'bg-green-500';
    return 'bg-yellow-500';
  };
  
  const getHeartbeatStatusColor = () => {
    switch (heartbeatStatus) {
      case 'normal': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
    }
  };
  
  // Helper to show short token previews
  const formatToken = (token: string | null) => {
    if (!token) return 'Not available';
    if (token.length <= 8) return token;
    return `${token.substring(0, 6)}...${token.substring(token.length - 4)}`;
  };
  
  return (
    <div className="bg-gray-900 rounded-lg shadow-lg text-white">
      <div className="p-4">
        {/* Header with connection status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold">Unified WebSocket</h2>
            
            <div className="flex items-center space-x-1">
              {/* Connection status indicator */}
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-1 ${getConnectionStatusColor()}`} />
                <span className="text-sm">
                  {!isConnected ? 'Disconnected' : 
                   isAuthenticated ? 'Authenticated' : 'Connected'}
                </span>
              </div>
              
              {/* Heartbeat status indicator */}
              <div className="flex items-center ml-3">
                <div className={`w-3 h-3 rounded-full mr-1 ${getHeartbeatStatusColor()}`} />
                <span className="text-sm">Heartbeat</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleClearMessages}
              className="px-3 py-1 bg-red-700 text-white rounded text-sm"
            >
              Clear Log
            </button>
          </div>
        </div>
        
        {/* Auth status display */}
        <div className="mb-4 text-sm">
          <div className="flex items-center">
            <span className="font-medium mr-2">Auth Status:</span>
            <span className={isAuthenticated ? 'text-green-400' : 'text-red-400'}>
              {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
            </span>
          </div>
          {user && (
            <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 bg-gray-800 p-2 rounded text-xs">
              <div className="flex items-center">
                <span className="text-gray-400 w-16">User ID:</span>
                <span className="text-blue-300">{formatToken(user.wallet_address)}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-400 w-16">WS Token:</span>
                <span className={user.wsToken ? 'text-green-300' : 'text-red-300'}>
                  {user.wsToken ? formatToken(user.wsToken) : 'Not available'}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-400 w-16">Role:</span>
                <span className="text-purple-300">
                  {user.is_superadmin ? 'SuperAdmin' : 
                   user.is_admin ? 'Admin' : 'User'}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-400 w-16">JWT:</span>
                <span className={user.jwt ? 'text-green-300' : 'text-red-300'}>
                  {user.jwt ? formatToken(user.jwt) : 'Not available'}
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Active topics display */}
        <div className="mb-4">
          <h3 className="font-semibold mb-1">Active Subscriptions</h3>
          <div className="flex flex-wrap gap-2 bg-gray-800 p-2 rounded">
            {Array.from(activeTopics).length > 0 ? (
              Array.from(activeTopics).map(topic => (
                <span 
                  key={topic} 
                  className={`px-2 py-1 rounded text-xs ${getTopicColor(topic)}`}
                  onClick={() => setFilterTopic(filterTopic === topic ? '' : topic)}
                  style={{ cursor: 'pointer' }}
                >
                  {topic}
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-500">No active subscriptions</span>
            )}
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex flex-wrap items-center mb-4 gap-2">
          {/* Message type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded py-1 px-2 text-sm"
          >
            <option value="">All Message Types</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
          {/* Topic filter */}
          <select
            value={filterTopic}
            onChange={(e) => setFilterTopic(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded py-1 px-2 text-sm"
          >
            <option value="">All Topics</option>
            {uniqueTopics.map(topic => (
              <option key={topic} value={topic}>{topic}</option>
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
          
          {/* Max messages selector */}
          <div className="flex items-center">
            <span className="text-sm mr-2">Max Messages:</span>
            <select
              value={maxMessages}
              onChange={(e) => setMaxMessages(Number(e.target.value))}
              className="bg-gray-800 border border-gray-700 rounded py-1 px-2 text-sm"
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
            </select>
          </div>
        </div>
        
        {/* Message log */}
        <div className="bg-gray-800 rounded border border-gray-700 h-96 overflow-auto">
          {filteredMessages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-gray-500">
              No messages
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-900 z-10">
                <tr>
                  <th className="text-left p-2 border-b border-gray-700">Time</th>
                  <th className="text-left p-2 border-b border-gray-700">Dir</th>
                  <th className="text-left p-2 border-b border-gray-700">Type</th>
                  <th className="text-left p-2 border-b border-gray-700">Topic</th>
                  <th className="text-left p-2 border-b border-gray-700">Content</th>
                </tr>
              </thead>
              <tbody>
                {filteredMessages.map(message => (
                  <tr key={message.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="p-2 whitespace-nowrap text-gray-400">{formatTime(message.timestamp)}</td>
                    <td className="p-2 whitespace-nowrap">
                      <span className={message.direction === 'in' ? 'text-green-400' : 'text-blue-400'}>
                        {message.direction === 'in' ? '←' : '→'}
                      </span>
                    </td>
                    <td className={`p-2 whitespace-nowrap ${getTypeColor(message.type)}`}>{messageTypeToString(message.type)}</td>
                    <td className="p-2 whitespace-nowrap">
                      {message.topic && (
                        <span className={`px-1.5 py-0.5 rounded text-xs ${getTopicColor(message.topic)}`}>
                          {message.topic}
                        </span>
                      )}
                    </td>
                    <td className="p-2">
                      {message.data ? (
                        <details>
                          <summary className="cursor-pointer">
                            {message.data.message || 
                             message.data.action || 
                             (typeof message.data === 'object' ? 
                               JSON.stringify(message.data).substring(0, 50) + 
                               (JSON.stringify(message.data).length > 50 ? '...' : '') : 
                               String(message.data))}
                          </summary>
                          <pre className="mt-1 p-2 bg-gray-900 rounded text-xs overflow-x-auto">
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
            {filterType && `Type: ${filterType}`}
            {filterType && filterTopic && ' | '}
            {filterTopic && `Topic: ${filterTopic}`}
            {!filterType && !filterTopic && 'No filters active'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedWebSocketMonitor;