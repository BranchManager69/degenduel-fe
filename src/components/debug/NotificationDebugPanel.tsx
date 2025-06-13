/**
 * Notification Debug Panel
 * 
 * Debug component to help diagnose notification issues
 */

import React, { useEffect, useState } from 'react';
import { useNotifications } from '../../hooks/websocket/topic-hooks/useNotifications';
import { useUnifiedWebSocket } from '../../hooks/websocket/useUnifiedWebSocket';
import { DDExtendedMessageType } from '../../hooks/websocket/types';

export const NotificationDebugPanel: React.FC = () => {
  const [wsMessages, setWsMessages] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    isConnected,
    isAuthenticated,
    lastUpdate,
    refreshNotifications
  } = useNotifications();

  // Listen to all WebSocket messages
  const handleDebugMessage = (message: any) => {
    setWsMessages(prev => [...prev.slice(-49), { ...message, timestamp: new Date() }]);
  };

  // Connect to WebSocket for debugging - use different topics to avoid conflicts
  const debugWs = useUnifiedWebSocket(
    'notification-debug',
    [DDExtendedMessageType.DATA, DDExtendedMessageType.ERROR, DDExtendedMessageType.SYSTEM],
    handleDebugMessage
    // No topic filter - listen to all messages
  );

  // Toggle panel visibility with keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Using Ctrl+Shift+D (D for Debug) to avoid browser conflicts
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setIsVisible(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-1 rounded text-xs z-50">
        Press Ctrl+Shift+D to toggle debug panel
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 w-96 max-h-[50vh] bg-gray-900 border-l border-t border-gray-700 rounded-tl-lg shadow-2xl z-50 overflow-hidden">
      <div className="p-3 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-sm font-bold text-white">Notification Debug Panel</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white text-lg"
        >
          ×
        </button>
      </div>
      
      <div className="p-3 space-y-3 overflow-y-auto max-h-[calc(50vh-50px)]">
        {/* Connection Status */}
        <div className="bg-gray-800 p-2 rounded text-xs">
          <div className="font-bold text-white mb-1">Connection Status</div>
          <div className="space-y-1">
            <div className="text-yellow-400 font-semibold">Notification Hook:</div>
            <div>WebSocket: <span className={isConnected ? 'text-green-400' : 'text-red-400'}>{isConnected ? 'Connected' : 'Disconnected'}</span></div>
            <div>Authenticated: <span className={isAuthenticated ? 'text-green-400' : 'text-red-400'}>{isAuthenticated ? 'Yes' : 'No'}</span></div>
            <div>Loading: <span className={isLoading ? 'text-yellow-400' : 'text-gray-400'}>{isLoading ? 'Yes' : 'No'}</span></div>
            
            <div className="text-blue-400 font-semibold mt-2">Debug Hook:</div>
            <div>WebSocket: <span className={debugWs.isConnected ? 'text-green-400' : 'text-red-400'}>{debugWs.isConnected ? 'Connected' : 'Disconnected'}</span></div>
            <div>Authenticated: <span className={debugWs.isAuthenticated ? 'text-green-400' : 'text-red-400'}>{debugWs.isAuthenticated ? 'Yes' : 'No'}</span></div>
            
            {error && <div>Error: <span className="text-red-400">{error.toString()}</span></div>}
            {lastUpdate && <div>Last Update: <span className="text-gray-400">{lastUpdate.toLocaleTimeString()}</span></div>}
          </div>
        </div>

        {/* Notification Stats */}
        <div className="bg-gray-800 p-2 rounded text-xs">
          <div className="font-bold text-white mb-1">Notification Stats</div>
          <div className="space-y-1">
            <div>Total: <span className="text-blue-400">{notifications.length}</span></div>
            <div>Unread: <span className="text-yellow-400">{unreadCount}</span></div>
            <button
              onClick={refreshNotifications}
              className="mt-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
            >
              Refresh Notifications
            </button>
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="bg-gray-800 p-2 rounded text-xs">
          <div className="font-bold text-white mb-1">Recent Notifications</div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {notifications.slice(0, 5).map((notif, idx) => (
              <div key={notif.id} className="text-gray-300 border-b border-gray-700 pb-1">
                <div className="font-semibold">{idx + 1}. {notif.title}</div>
                <div className="text-gray-400 text-[10px]">
                  Type: {notif.type} | Read: {notif.isRead ? 'Yes' : 'No'} | {new Date(notif.createdAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
            {notifications.length === 0 && <div className="text-gray-400">No notifications</div>}
          </div>
        </div>

        {/* WebSocket Messages */}
        <div className="bg-gray-800 p-2 rounded text-xs">
          <div className="font-bold text-white mb-1">Recent WebSocket Messages</div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {wsMessages.map((msg, idx) => (
              <div key={idx} className="text-gray-300 border-b border-gray-700 pb-1">
                <div className="font-semibold text-[10px]">
                  {msg.timestamp?.toLocaleTimeString()} - 
                  <span className={`ml-1 ${msg.type === 'DATA' ? 'text-green-400' : msg.type === 'ERROR' ? 'text-red-400' : 'text-yellow-400'}`}>
                    {msg.type}
                  </span> - 
                  <span className="text-blue-400">{msg.topic}</span>
                </div>
                {msg.action && <div className="text-purple-400 text-[10px]">Action: {msg.action}</div>}
                {msg.data && (
                  <div className="text-gray-400 text-[10px] truncate">
                    Data: {JSON.stringify(msg.data).substring(0, 100)}...
                  </div>
                )}
                {msg.error && <div className="text-red-400 text-[10px]">Error: {msg.error}</div>}
              </div>
            ))}
            {wsMessages.length === 0 && <div className="text-gray-400">No messages yet</div>}
          </div>
        </div>
      </div>
    </div>
  );
};