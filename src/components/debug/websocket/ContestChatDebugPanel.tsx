/**
 * Contest Chat WebSocket Debug Panel
 * 
 * Provides real-time monitoring and debugging for the Contest Chat WebSocket connection,
 * message flow, and state. This panel connects directly to the v69 unified WebSocket system.
 * 
 * Last updated: March 28, 2025
 */

/**
 * ✨ UNIFIED WEBSOCKET SYSTEM ✨
 * This file uses DegenDuel shared types from the degenduel-shared package.
 * These types are the official standard for frontend-backend communication.
 */

import React, { useEffect, useState } from 'react';
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';
import { useContestChatWebSocket } from '../../../hooks/websocket/legacy/useContestChatWebSocket';
import { DDWebSocketTopic } from '@branchmanager69/degenduel-shared';

interface ContestChatDebugPanelProps {
  contestId: string;
}

type MessageLogEntry = {
  id: string;
  direction: 'incoming' | 'outgoing';
  timestamp: string;
  type: string;
  topic?: string;
  content: any;
};

const ContestChatDebugPanel: React.FC<ContestChatDebugPanelProps> = ({ contestId }) => {
  // Connect to the WebSocket (with debug output enabled)
  const chatWebSocket = useContestChatWebSocket(contestId);
  
  // State for message logs
  const [messageLog, setMessageLog] = useState<MessageLogEntry[]>([]);
  const [filterDirection, setFilterDirection] = useState<'all' | 'incoming' | 'outgoing'>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showConnectionDetails, setShowConnectionDetails] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [testMessageText, setTestMessageText] = useState('Hello from debug panel!');

  // Reference to log container for auto-scrolling
  const logContainerRef = React.useRef<HTMLDivElement>(null);

  // Handle WebSocket event monitoring
  useEffect(() => {
    // Listen for WebSocket events from the wsMonitor
    const handleWebSocketEvent = (event: CustomEvent) => {
      const { detail } = event;
      
      // Filter for contest chat events
      if (detail.socketType === 'contest') {
        // Add to message log
        setMessageLog(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            direction: 'incoming',
            timestamp: detail.timestamp || new Date().toISOString(),
            type: detail.event || 'EVENT',
            topic: 'contest',
            content: detail
          }
        ]);
      }
    };

    // Register event listener
    window.addEventListener('websocket_event', handleWebSocketEvent as EventListener);

    // Clean up
    return () => {
      window.removeEventListener('websocket_event', handleWebSocketEvent as EventListener);
    };
  }, []);

  // Auto-scroll logs when new messages arrive
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [messageLog, autoScroll]);

  // Generate a test message
  const sendTestMessage = () => {
    chatWebSocket.sendMessage(testMessageText);
    
    // Log the outgoing message
    setMessageLog(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        direction: 'outgoing',
        timestamp: new Date().toISOString(),
        type: 'REQUEST',
        topic: DDWebSocketTopic.CONTEST,
        content: {
          action: 'SEND_CHAT_MESSAGE',
          text: testMessageText
        }
      }
    ]);
  };

  // Filter messages by direction and type
  const filteredMessages = messageLog.filter(msg => {
    // Apply direction filter
    if (filterDirection !== 'all' && msg.direction !== filterDirection) {
      return false;
    }
    // Apply type filter
    if (filterType !== 'all' && !msg.type.includes(filterType)) {
      return false;
    }
    return true;
  });

  // Generate status indicator color
  const getStatusColor = (status: boolean) => {
    return status ? 'bg-green-500' : 'bg-red-500';
  };

  const handleJoinRoom = () => {
    chatWebSocket.joinRoom();
    dispatchWebSocketEvent('debug_join_room', {
      socketType: 'contest',
      message: `Debug panel joining room: ${contestId}`,
      contestId,
      timestamp: new Date().toISOString()
    });
  };

  const handleLeaveRoom = () => {
    chatWebSocket.leaveRoom();
    dispatchWebSocketEvent('debug_leave_room', {
      socketType: 'contest',
      message: `Debug panel leaving room: ${contestId}`,
      contestId,
      timestamp: new Date().toISOString()
    });
  };
  
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gray-800 p-3 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 mr-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-white flex items-center">
            Contest Chat WebSocket Debug
            <span
              className={`ml-2 inline-block w-3 h-3 rounded-full ${getStatusColor(chatWebSocket.isConnected)}`}
            ></span>
          </h2>
        </div>
        <div className="space-x-2">
          <button
            onClick={() => setShowConnectionDetails(!showConnectionDetails)}
            className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
          >
            {showConnectionDetails ? 'Hide Details' : 'Show Details'}
          </button>
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
          >
            {showParticipants ? 'Hide Participants' : 'Show Participants'}
          </button>
          <button
            onClick={() => setMessageLog([])}
            className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
          >
            Clear Log
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <>
          {/* Connection details */}
          {showConnectionDetails && (
            <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-700">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Connection Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
                <div className="bg-gray-800 p-2 rounded">
                  <div className="text-xs text-gray-500">WebSocket Connected</div>
                  <div className="flex items-center">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${getStatusColor(chatWebSocket.isConnected)} mr-2`}
                    ></span>
                    <span className="text-sm">{chatWebSocket.isConnected ? 'Yes' : 'No'}</span>
                  </div>
                </div>
                <div className="bg-gray-800 p-2 rounded">
                  <div className="text-xs text-gray-500">Topic Subscribed</div>
                  <div className="flex items-center">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${getStatusColor(chatWebSocket.isSubscribed)} mr-2`}
                    ></span>
                    <span className="text-sm">{chatWebSocket.isSubscribed ? 'Yes' : 'No'}</span>
                  </div>
                </div>
                <div className="bg-gray-800 p-2 rounded">
                  <div className="text-xs text-gray-500">Room Joined</div>
                  <div className="flex items-center">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${getStatusColor(chatWebSocket.isJoined)} mr-2`}
                    ></span>
                    <span className="text-sm">{chatWebSocket.isJoined ? 'Yes' : 'No'}</span>
                  </div>
                </div>
                <div className="bg-gray-800 p-2 rounded">
                  <div className="text-xs text-gray-500">Rate Limited</div>
                  <div className="flex items-center">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${getStatusColor(!chatWebSocket.isRateLimited)} mr-2`}
                    ></span>
                    <span className="text-sm">{chatWebSocket.isRateLimited ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
              
              {chatWebSocket.error && (
                <div className="mt-2 text-red-400 text-sm bg-red-900/20 p-2 rounded">
                  <span className="font-medium">Error:</span> {chatWebSocket.error}
                </div>
              )}
              
              <div className="flex mt-3 space-x-2">
                <button
                  onClick={handleJoinRoom}
                  disabled={!chatWebSocket.isConnected || chatWebSocket.isJoined}
                  className={`px-3 py-1 text-sm rounded ${!chatWebSocket.isConnected || chatWebSocket.isJoined ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                  Join Room
                </button>
                <button
                  onClick={handleLeaveRoom}
                  disabled={!chatWebSocket.isJoined}
                  className={`px-3 py-1 text-sm rounded ${!chatWebSocket.isJoined ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                >
                  Leave Room
                </button>
              </div>
            </div>
          )}
          
          {/* Participants list */}
          {showParticipants && (
            <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-700">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Participants ({chatWebSocket.participants.length})</h3>
              {chatWebSocket.participants.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {chatWebSocket.participants.map(participant => (
                    <div key={participant.userId} className="bg-gray-800 p-2 rounded flex items-center">
                      <img 
                        src={participant.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.userId}`} 
                        alt={participant.nickname}
                        className="w-6 h-6 rounded-full mr-2" 
                      />
                      <div>
                        <div className="text-sm truncate">{participant.nickname}</div>
                        <div className="text-xs text-gray-500 truncate">{participant.userId.substring(0, 8)}...</div>
                      </div>
                      {participant.isAdmin && (
                        <span className="ml-1 text-xs text-purple-400 bg-purple-900/30 px-1 rounded">Admin</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-sm">No participants in room</div>
              )}
            </div>
          )}
          
          {/* Message log controls */}
          <div className="px-4 py-2 bg-gray-800/50 border-b border-gray-700 flex flex-wrap items-center gap-2">
            <div className="flex-1">
              <span className="text-xs text-gray-500 mr-2">Filter:</span>
              <select 
                value={filterDirection}
                onChange={(e) => setFilterDirection(e.target.value as any)}
                className="bg-gray-700 text-white text-xs rounded px-2 py-1 mr-2"
              >
                <option value="all">All Messages</option>
                <option value="incoming">Incoming</option>
                <option value="outgoing">Outgoing</option>
              </select>
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-gray-700 text-white text-xs rounded px-2 py-1"
              >
                <option value="all">All Types</option>
                {/* Core message types */}
                <option value="SUBSCRIBE">SUBSCRIBE</option>
                <option value="UNSUBSCRIBE">UNSUBSCRIBE</option>
                <option value="REQUEST">REQUEST</option>
                <option value="COMMAND">COMMAND</option>
                <option value="DATA">DATA</option>
                <option value="ERROR">ERROR</option>
                <option value="SYSTEM">SYSTEM</option>
                <option value="ACKNOWLEDGMENT">ACKNOWLEDGMENT</option>
                {/* Chat-specific types */}
                <option value="ROOM_STATE">ROOM_STATE</option>
                <option value="CHAT_MESSAGE">CHAT_MESSAGE</option>
                <option value="PARTICIPANT_JOINED">PARTICIPANT_JOINED</option>
                <option value="PARTICIPANT_LEFT">PARTICIPANT_LEFT</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <label className="text-xs text-gray-500 flex items-center">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="mr-1"
                />
                Auto-scroll
              </label>
            </div>
          </div>
          
          {/* Message log */}
          <div 
            ref={logContainerRef}
            className="h-64 overflow-y-auto p-2 bg-gray-900 text-xs font-mono"
          >
            {filteredMessages.length === 0 ? (
              <div className="text-gray-500 p-4 text-center">No messages logged. Connect to see WebSocket activity.</div>
            ) : (
              <div className="space-y-1">
                {filteredMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-2 rounded ${
                      msg.direction === 'incoming'
                        ? 'bg-gray-800/70 border-l-2 border-green-500'
                        : 'bg-gray-800/40 border-l-2 border-blue-500'
                    }`}
                  >
                    <div className="flex items-center text-gray-400 mb-1">
                      <span className="text-gray-500">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      <span className={`mx-2 px-1 rounded text-xs ${
                        msg.direction === 'incoming' ? 'bg-green-900/40 text-green-400' : 'bg-blue-900/40 text-blue-400'
                      }`}>
                        {msg.direction}
                      </span>
                      <span className="bg-gray-700 px-1 rounded">{msg.type}</span>
                      {msg.topic && (
                        <span className="ml-2 bg-purple-900/30 text-purple-400 px-1 rounded">
                          {msg.topic}
                        </span>
                      )}
                    </div>
                    <pre className="text-white overflow-x-auto whitespace-pre-wrap break-words">
                      {JSON.stringify(msg.content, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Test message sender */}
          <div className="p-3 bg-gray-800/50 border-t border-gray-700">
            <div className="flex">
              <input
                type="text"
                value={testMessageText}
                onChange={(e) => setTestMessageText(e.target.value)}
                placeholder="Enter test message text..."
                className="flex-1 bg-gray-700 text-white rounded-l px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendTestMessage}
                disabled={!chatWebSocket.isConnected || chatWebSocket.isRateLimited || !testMessageText.trim()}
                className={`px-4 py-2 rounded-r ${
                  !chatWebSocket.isConnected || chatWebSocket.isRateLimited || !testMessageText.trim()
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Send Test Message
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Sends a message to the current contest chat room (must be connected and joined).
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default ContestChatDebugPanel;