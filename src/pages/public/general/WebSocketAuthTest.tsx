import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../hooks/auth';

interface LogEntry {
  id: number;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

const WebSocketAuthTest: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isWsAuthenticated, setIsWsAuthenticated] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [authToken, setAuthToken] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const logIdRef = useRef(0);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: logIdRef.current++,
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    }]);
  };

  const clearLogs = () => setLogs([]);

  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      addLog('Already connected!', 'warning');
      return;
    }

    addLog('Connecting to wss://degenduel.me/api/v69/ws...', 'info');
    
    wsRef.current = new WebSocket('wss://degenduel.me/api/v69/ws');

    wsRef.current.onopen = () => {
      addLog('✅ WebSocket connected!', 'success');
      setIsConnected(true);
      addLog('Checking for cookie-based authentication...', 'info');
    };

    wsRef.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        addLog(`📥 Received: ${JSON.stringify(message, null, 2)}`, 'info');
        
        if (message.type === 'ACKNOWLEDGMENT') {
          if (message.operation === 'authenticate' && message.status === 'success') {
            addLog('🔐 Authentication successful!', 'success');
            setIsWsAuthenticated(true);
            if (message.user) {
              addLog(`User: ${message.user.userId} (${message.user.role})`, 'success');
            }
          } else if (message.operation === 'subscribe' && message.status === 'success') {
            addLog(`✅ Subscribed to: ${message.topics.join(', ')}`, 'success');
          }
        } else if (message.type === 'ERROR') {
          addLog(`❌ Error ${message.code}: ${message.error || message.message}`, 'error');
          if (message.code === 4401) {
            setIsWsAuthenticated(false);
          }
        } else if (message.type === 'DATA') {
          const preview = JSON.stringify(message.data).substring(0, 100);
          addLog(`📊 Data from ${message.topic}: ${preview}...`, 'info');
        }
      } catch (e) {
        addLog('Failed to parse message: ' + event.data, 'error');
      }
    };

    wsRef.current.onerror = () => {
      addLog('❌ WebSocket error!', 'error');
    };

    wsRef.current.onclose = (event) => {
      addLog(`WebSocket closed. Code: ${event.code}, Reason: ${event.reason || 'No reason'}`, 'warning');
      setIsConnected(false);
      setIsWsAuthenticated(false);
    };
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      addLog('Disconnected WebSocket', 'info');
    } else {
      addLog('Not connected', 'warning');
    }
  };

  const sendAuthMessage = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      addLog('Not connected! Connect first.', 'error');
      return;
    }

    const token = authToken || 
                  localStorage.getItem('wsToken') || 
                  localStorage.getItem('jwt') ||
                  sessionStorage.getItem('authToken');
    
    if (!token) {
      addLog('No token found! Enter a token or log in to the site first.', 'error');
      return;
    }

    const authMessage = {
      type: 'AUTH',
      authToken: token
    };

    addLog('📤 Sending AUTH message...', 'info');
    wsRef.current.send(JSON.stringify(authMessage));
  };

  const checkAuthToken = () => {
    const wsToken = localStorage.getItem('wsToken');
    const jwtToken = localStorage.getItem('jwt');
    const sessionToken = sessionStorage.getItem('authToken');
    
    if (wsToken) {
      addLog(`Found wsToken in localStorage: ${wsToken.substring(0, 20)}...`, 'success');
    }
    if (jwtToken) {
      addLog(`Found jwt in localStorage: ${jwtToken.substring(0, 20)}...`, 'success');
    }
    if (sessionToken) {
      addLog(`Found authToken in sessionStorage: ${sessionToken.substring(0, 20)}...`, 'success');
    }
    if (!wsToken && !jwtToken && !sessionToken) {
      addLog('No tokens found in storage. You need to log in first.', 'warning');
    }
    
    if (isAuthenticated && user) {
      addLog(`Currently logged in as: ${user.wallet_address}`, 'success');
    }
  };

  const subscribeToTopic = (topics: string[]) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      addLog('Not connected! Connect first.', 'error');
      return;
    }

    const message = {
      type: 'SUBSCRIBE',
      topics: topics
    };

    addLog(`📤 Subscribing to: ${topics.join(', ')}`, 'info');
    wsRef.current.send(JSON.stringify(message));
  };

  const subscribeWithAuth = (topics: string[]) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      addLog('Not connected! Connect first.', 'error');
      return;
    }

    const token = authToken || 
                  localStorage.getItem('wsToken') || 
                  localStorage.getItem('jwt') ||
                  sessionStorage.getItem('authToken');

    const message: any = {
      type: 'SUBSCRIBE',
      topics: topics
    };

    if (token) {
      message.authToken = token;
      addLog(`📤 Subscribing to ${topics.join(', ')} with auth token`, 'info');
    } else {
      addLog('No token available for authenticated subscription', 'error');
      return;
    }

    wsRef.current.send(JSON.stringify(message));
  };

  const unsubscribeFromTopic = (topics: string[]) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      addLog('Not connected! Connect first.', 'error');
      return;
    }

    const message = {
      type: 'UNSUBSCRIBE',
      topics: topics
    };

    addLog(`📤 Unsubscribing from: ${topics.join(', ')}`, 'info');
    wsRef.current.send(JSON.stringify(message));
  };

  // Check auth status on mount
  useEffect(() => {
    checkAuthToken();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      default: return 'text-blue-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-green-400">🧪 WebSocket Authentication Test</h1>
        
        {/* Status Section */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h2 className="text-xl font-semibold mb-3">Connection Status</h2>
          <div className="flex gap-4">
            <span className={`px-3 py-1 rounded ${isConnected ? 'bg-green-600' : 'bg-red-600'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            <span className={`px-3 py-1 rounded ${isWsAuthenticated ? 'bg-blue-600' : 'bg-gray-600'}`}>
              {isWsAuthenticated ? 'Authenticated' : 'Not Authenticated'}
            </span>
            {isAuthenticated && (
              <span className="px-3 py-1 rounded bg-purple-600">
                Site Login: {user?.username || user?.wallet_address}
              </span>
            )}
          </div>
        </div>

        {/* Connection Section */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h2 className="text-xl font-semibold mb-3">1. Connection</h2>
          <div className="flex gap-2">
            <button 
              onClick={connectWebSocket}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition-colors"
            >
              Connect to WebSocket
            </button>
            <button 
              onClick={disconnectWebSocket}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>

        {/* Authentication Section */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h2 className="text-xl font-semibold mb-3">2. Authentication</h2>
          <input
            type="text"
            value={authToken}
            onChange={(e) => setAuthToken(e.target.value)}
            placeholder="JWT Token (optional - uses stored token if empty)"
            className="w-full bg-gray-700 text-white px-3 py-2 rounded mb-3"
          />
          <div className="flex gap-2">
            <button 
              onClick={sendAuthMessage}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              Send AUTH Message
            </button>
            <button 
              onClick={checkAuthToken}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded transition-colors"
            >
              Check Stored Token
            </button>
          </div>
        </div>

        {/* Topic Subscription Section */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h2 className="text-xl font-semibold mb-3">3. Topic Subscription</h2>
          
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2 text-green-400">Public Topics (No Auth Required)</h3>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => subscribeToTopic(['MARKET_DATA'])} className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded">
                Market Data
              </button>
              <button onClick={() => subscribeToTopic(['SYSTEM'])} className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded">
                System
              </button>
              <button onClick={() => subscribeToTopic(['TERMINAL'])} className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded">
                Terminal
              </button>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2 text-yellow-400">Authenticated Topics</h3>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => subscribeToTopic(['USER'])} className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded">
                User
              </button>
              <button onClick={() => subscribeToTopic(['PORTFOLIO'])} className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded">
                Portfolio
              </button>
              <button onClick={() => subscribeToTopic(['WALLET'])} className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded">
                Wallet
              </button>
              <button onClick={() => subscribeToTopic(['WALLET_BALANCE'])} className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded">
                Wallet Balance
              </button>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2 text-red-400">Admin Topics</h3>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => subscribeToTopic(['ADMIN'])} className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded">
                Admin
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2 text-blue-400">Combined Subscriptions</h3>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => subscribeToTopic(['USER', 'PORTFOLIO', 'WALLET'])} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded">
                All User Topics
              </button>
              <button onClick={() => subscribeWithAuth(['PORTFOLIO'])} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded">
                Portfolio with Auth Token
              </button>
            </div>
          </div>
        </div>

        {/* Unsubscribe Section */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h2 className="text-xl font-semibold mb-3">4. Unsubscribe</h2>
          <div className="flex gap-2">
            <button onClick={() => unsubscribeFromTopic(['MARKET_DATA'])} className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded">
              Unsubscribe Market Data
            </button>
            <button onClick={() => unsubscribeFromTopic(['USER', 'PORTFOLIO'])} className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded">
              Unsubscribe User Topics
            </button>
          </div>
        </div>

        {/* Message Log Section */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold">Message Log</h2>
            <button 
              onClick={clearLogs}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
            >
              Clear Log
            </button>
          </div>
          <div className="bg-black rounded p-3 h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500">No messages yet. Click "Connect to WebSocket" to begin.</div>
            ) : (
              logs.map(log => (
                <div key={log.id} className={`mb-1 ${getLogColor(log.type)}`}>
                  [{log.timestamp}] {log.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebSocketAuthTest;