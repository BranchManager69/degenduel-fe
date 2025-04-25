import React, { useEffect, useRef, useState } from 'react';

/**
 * DegenDuel WebSocket API Guide Component
 * 
 * This component provides both documentation and an interactive demo
 * for the DegenDuel WebSocket API.
 */
const WebSocketAPIGuide = () => {
  // WebSocket state
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [logs, setLogs] = useState([]);
  const [lastReceivedData, setLastReceivedData] = useState(null);
  const [authToken, setAuthToken] = useState('');
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [wsUrl, setWsUrl] = useState('/api/v69/ws');
  const [activeTab, setActiveTab] = useState('demo');
  
  // Form fields
  const [requestTopic, setRequestTopic] = useState('market-data');
  const [requestAction, setRequestAction] = useState('getToken');
  const [requestParams, setRequestParams] = useState('{"symbol": "btc"}');
  
  // References
  const logContainerRef = useRef(null);
  
  // Available topics
  const availableTopics = [
    { id: 'market-data', name: 'Market Data', requiresAuth: false },
    { id: 'portfolio', name: 'Portfolio', requiresAuth: true },
    { id: 'system', name: 'System', requiresAuth: false },
    { id: 'contest', name: 'Contest', requiresAuth: false },
    { id: 'user', name: 'User', requiresAuth: true },
    { id: 'admin', name: 'Admin', requiresAuth: true },
    { id: 'wallet', name: 'Wallet', requiresAuth: true },
    { id: 'wallet-balance', name: 'Wallet Balance', requiresAuth: true },
    { id: 'skyduel', name: 'SkyDuel', requiresAuth: false },
  ];
  
  // Available actions for each topic
  const topicActions = {
    'market-data': ['getToken', 'getAllTokens'],
    'portfolio': ['getProfile', 'getHoldings', 'getPerformance'],
    'system': ['getStatus', 'ping', 'getMetrics'],
    'user': ['getProfile', 'getStats', 'getAuthStatus'],
    'contest': ['getActiveContests', 'getContestDetails'],
    'admin': ['getSystemStatus', 'getUserCount'],
    'wallet': ['getTransactions', 'getBalance'],
    'wallet-balance': ['getCurrentBalance'],
    'skyduel': ['getGameStats', 'getLeaderboard']
  };
  
  // Update available actions when topic changes
  useEffect(() => {
    if (topicActions[requestTopic] && topicActions[requestTopic].length > 0) {
      setRequestAction(topicActions[requestTopic][0]);
    }
  }, [requestTopic]);
  
  // Detect development or production environment
  useEffect(() => {
    // Check if we're running in development mode
    const isDevelopment = 
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('dev.');
    
    // Set appropriate WebSocket URL
    if (isDevelopment) {
      setWsUrl('/api/v69/ws');
      addLog('Detected development environment', 'system');
    } else {
      setWsUrl('wss://degenduel.me/api/v69/ws');
      addLog('Detected production environment', 'system');
    }
  }, []);
  
  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);
  
  // Add log entry
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toISOString();
    setLogs(prevLogs => [
      ...prevLogs, 
      { id: Date.now(), message, type, timestamp }
    ]);
  };
  
  // Clear logs
  const clearLogs = () => {
    setLogs([]);
  };
  
  // Connect to WebSocket
  const connect = () => {
    if (socket) {
      addLog('Already connected or connecting', 'warning');
      return;
    }
    
    try {
      addLog(`Connecting to ${getFullWebSocketUrl()}...`, 'system');
      
      const newSocket = new WebSocket(getFullWebSocketUrl());
      setSocket(newSocket);
      setConnectionStatus('connecting');
      
      // Connection opened
      newSocket.onopen = () => {
        addLog('Connection established', 'success');
        setConnectionStatus('connected');
      };
      
      // Connection closed
      newSocket.onclose = (event) => {
        addLog(`Connection closed: ${event.code} ${event.reason}`, 'system');
        setConnectionStatus('disconnected');
        setSocket(null);
      };
      
      // Connection error
      newSocket.onerror = (error) => {
        addLog(`WebSocket error: ${error}`, 'error');
        setConnectionStatus('error');
      };
      
      // Message received
      newSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          addLog(`Received: ${JSON.stringify(data, null, 2)}`, 'receive');
          setLastReceivedData(data);
          
          // Handle error messages
          if (data.type === 'ERROR') {
            addLog(`Error (${data.code}): ${data.message}`, 'error');
          }
        } catch (error) {
          addLog(`Failed to parse message: ${error}`, 'error');
        }
      };
    } catch (error) {
      addLog(`Failed to connect: ${error}`, 'error');
      setConnectionStatus('error');
    }
  };
  
  // Disconnect from WebSocket
  const disconnect = () => {
    if (!socket) {
      addLog('Not connected', 'warning');
      return;
    }
    
    socket.close(1000, 'User initiated disconnect');
    setConnectionStatus('disconnecting');
  };
  
  // Get full WebSocket URL
  const getFullWebSocketUrl = () => {
    if (wsUrl.startsWith('ws://') || wsUrl.startsWith('wss://')) {
      return wsUrl;
    }
    
    return (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + 
      window.location.host + wsUrl;
  };
  
  // Send message to WebSocket
  const sendMessage = (message) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      addLog('WebSocket not connected', 'error');
      return;
    }
    
    try {
      const messageString = JSON.stringify(message);
      socket.send(messageString);
      addLog(`Sent: ${JSON.stringify(message, null, 2)}`, 'send');
    } catch (error) {
      addLog(`Failed to send message: ${error}`, 'error');
    }
  };
  
  // Subscribe to topics
  const subscribe = () => {
    if (selectedTopics.length === 0) {
      addLog('No topics selected', 'warning');
      return;
    }
    
    const message = {
      type: 'SUBSCRIBE',
      topics: selectedTopics
    };
    
    // Add auth token if provided
    if (authToken.trim()) {
      message.authToken = authToken.trim();
    }
    
    sendMessage(message);
  };
  
  // Unsubscribe from topics
  const unsubscribe = () => {
    if (selectedTopics.length === 0) {
      addLog('No topics selected', 'warning');
      return;
    }
    
    const message = {
      type: 'UNSUBSCRIBE',
      topics: selectedTopics
    };
    
    sendMessage(message);
  };
  
  // Send request
  const sendRequest = () => {
    try {
      const params = requestParams ? JSON.parse(requestParams) : {};
      const requestId = `req-${Date.now()}`;
      
      const message = {
        type: 'REQUEST',
        topic: requestTopic,
        action: requestAction,
        requestId,
        ...params
      };
      
      sendMessage(message);
    } catch (error) {
      addLog(`Invalid JSON parameters: ${error}`, 'error');
    }
  };
  
  // Send ping
  const sendPing = () => {
    const message = {
      type: 'REQUEST',
      topic: 'system',
      action: 'ping',
      clientTime: new Date().toISOString(),
      requestId: `ping-${Date.now()}`
    };
    
    sendMessage(message);
  };
  
  // Update topic selection
  const handleTopicChange = (topicId) => {
    setSelectedTopics(prev => {
      if (prev.includes(topicId)) {
        return prev.filter(id => id !== topicId);
      } else {
        return [...prev, topicId];
      }
    });
  };
  
  // Get log entry class based on type
  const getLogEntryClass = (type) => {
    switch (type) {
      case 'success': return 'bg-green-100 border-green-500 text-green-800';
      case 'error': return 'bg-red-100 border-red-500 text-red-800';
      case 'warning': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'system': return 'bg-purple-100 border-purple-500 text-purple-800';
      case 'send': return 'bg-blue-100 border-blue-500 text-blue-800';
      case 'receive': return 'bg-green-50 border-green-300 text-green-800';
      default: return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };
  
  // Get connection status display
  const getConnectionStatusDisplay = () => {
    switch (connectionStatus) {
      case 'connected': 
        return <span className="text-green-600 font-bold">Connected</span>;
      case 'connecting': 
        return <span className="text-blue-600 font-bold">Connecting...</span>;
      case 'disconnecting': 
        return <span className="text-orange-600 font-bold">Disconnecting...</span>;
      case 'error':
        return <span className="text-red-600 font-bold">Error</span>;
      default:
        return <span className="text-gray-600 font-bold">Disconnected</span>;
    }
  };
  
  // Format JSON for display
  const formatJSON = (json) => {
    try {
      if (typeof json === 'string') {
        json = JSON.parse(json);
      }
      return JSON.stringify(json, null, 2);
    } catch {
      return typeof json === 'string' ? json : JSON.stringify(json);
    }
  };
  
  // Render documentation tab
  const renderDocumentationTab = () => (
    <div className="documentation px-4 py-2">
      <h2 className="text-2xl font-bold mb-4">DegenDuel WebSocket API</h2>
      
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">Overview</h3>
        <p>
          DegenDuel uses a unified WebSocket system where all data flows through a single connection
          with topic-based subscriptions. This allows for efficient real-time updates while minimizing
          connection overhead.
        </p>
      </div>
      
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">Connection Details</h3>
        <ul className="list-disc pl-6">
          <li><strong>Main WebSocket endpoint:</strong> <code>/api/v69/ws</code></li>
          <li><strong>Authentication:</strong> Required for private data (user, portfolio, wallet)</li>
          <li><strong>Protocol:</strong> WebSocket (WSS)</li>
        </ul>
      </div>
      
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">Message Types</h3>
        
        <h4 className="text-lg font-bold mt-3 mb-1">Client → Server:</h4>
        <ul className="list-disc pl-6">
          <li><strong>SUBSCRIBE:</strong> Subscribe to one or more topics</li>
          <li><strong>UNSUBSCRIBE:</strong> Unsubscribe from topics</li>
          <li><strong>REQUEST:</strong> Request specific data</li>
          <li><strong>COMMAND:</strong> Execute an action (requires authentication)</li>
        </ul>
        
        <h4 className="text-lg font-bold mt-3 mb-1">Server → Client:</h4>
        <ul className="list-disc pl-6">
          <li><strong>DATA:</strong> Data response or update</li>
          <li><strong>ERROR:</strong> Error message</li>
          <li><strong>SYSTEM:</strong> System messages and heartbeats</li>
          <li><strong>ACKNOWLEDGMENT:</strong> Confirms subscription/unsubscription</li>
        </ul>
      </div>
      
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">Available Topics</h3>
        <table className="min-w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border text-left">Topic</th>
              <th className="py-2 px-4 border text-left">Description</th>
              <th className="py-2 px-4 border text-center">Authentication</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2 px-4 border"><code>market-data</code></td>
              <td className="py-2 px-4 border">Real-time market data including token prices and stats</td>
              <td className="py-2 px-4 border text-center">No</td>
            </tr>
            <tr>
              <td className="py-2 px-4 border"><code>portfolio</code></td>
              <td className="py-2 px-4 border">User's portfolio updates and performance</td>
              <td className="py-2 px-4 border text-center">Yes</td>
            </tr>
            <tr>
              <td className="py-2 px-4 border"><code>system</code></td>
              <td className="py-2 px-4 border">System status, announcements and heartbeats</td>
              <td className="py-2 px-4 border text-center">No</td>
            </tr>
            <tr>
              <td className="py-2 px-4 border"><code>contest</code></td>
              <td className="py-2 px-4 border">Contest updates, entries and results</td>
              <td className="py-2 px-4 border text-center">Public: No<br />Personal: Yes</td>
            </tr>
            <tr>
              <td className="py-2 px-4 border"><code>user</code></td>
              <td className="py-2 px-4 border">User-specific notifications and data</td>
              <td className="py-2 px-4 border text-center">Yes</td>
            </tr>
            <tr>
              <td className="py-2 px-4 border"><code>admin</code></td>
              <td className="py-2 px-4 border">Administrative information</td>
              <td className="py-2 px-4 border text-center">Yes (admin role)</td>
            </tr>
            <tr>
              <td className="py-2 px-4 border"><code>wallet</code></td>
              <td className="py-2 px-4 border">Wallet updates and transaction information</td>
              <td className="py-2 px-4 border text-center">Yes</td>
            </tr>
            <tr>
              <td className="py-2 px-4 border"><code>wallet-balance</code></td>
              <td className="py-2 px-4 border">Real-time balance updates</td>
              <td className="py-2 px-4 border text-center">Yes</td>
            </tr>
            <tr>
              <td className="py-2 px-4 border"><code>skyduel</code></td>
              <td className="py-2 px-4 border">Game-specific information</td>
              <td className="py-2 px-4 border text-center">Public: No<br />Personal: Yes</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">Error Codes</h3>
        <table className="min-w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border text-left">Code</th>
              <th className="py-2 px-4 border text-left">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2 px-4 border">4000</td>
              <td className="py-2 px-4 border">Invalid message format</td>
            </tr>
            <tr>
              <td className="py-2 px-4 border">4001</td>
              <td className="py-2 px-4 border">Missing message type</td>
            </tr>
            <tr>
              <td className="py-2 px-4 border">4003</td>
              <td className="py-2 px-4 border">Subscription requires at least one topic</td>
            </tr>
            <tr>
              <td className="py-2 px-4 border">4010</td>
              <td className="py-2 px-4 border">Authentication required for restricted topics</td>
            </tr>
            <tr>
              <td className="py-2 px-4 border">4011</td>
              <td className="py-2 px-4 border">Invalid authentication token</td>
            </tr>
            <tr>
              <td className="py-2 px-4 border">4012</td>
              <td className="py-2 px-4 border">Admin role required for admin topics</td>
            </tr>
            <tr>
              <td className="py-2 px-4 border">4040</td>
              <td className="py-2 px-4 border">Resource not found</td>
            </tr>
            <tr>
              <td className="py-2 px-4 border">4401</td>
              <td className="py-2 px-4 border">Token expired</td>
            </tr>
            <tr>
              <td className="py-2 px-4 border">5000</td>
              <td className="py-2 px-4 border">Internal server error</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">Quick Start Example</h3>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
{`// Connect to the WebSocket
const socket = new WebSocket('wss://degenduel.me/api/v69/ws');

// Handle connection open
socket.onopen = () => {
  console.log('Connected to DegenDuel WebSocket');
  
  // Subscribe to market data
  socket.send(JSON.stringify({
    type: 'SUBSCRIBE',
    topics: ['market-data']
  }));
};

// Handle incoming messages
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};`}
        </pre>
      </div>
    </div>
  );
  
  // Render demo tab
  const renderDemoTab = () => (
    <div className="demo px-4 py-2">
      <div className="mb-4">
        <p className="mb-4">
          This interactive demo allows you to experiment with the DegenDuel WebSocket API.
          You can connect to the WebSocket server, subscribe to topics, send requests, and view real-time updates.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="connection-panel">
          <div className="border border-gray-300 rounded-lg p-4 bg-white">
            <h3 className="text-xl font-bold mb-4">Connection</h3>
            <div className="mb-4">
              <span>Status: {getConnectionStatusDisplay()}</span>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">WebSocket URL:</label>
              <input
                type="text"
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                disabled={connectionStatus !== 'disconnected'}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Auth Token (optional):</label>
              <input
                type="text"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="JWT token for authenticated requests"
                disabled={connectionStatus !== 'disconnected'}
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={connect}
                disabled={connectionStatus !== 'disconnected'}
                className={`px-4 py-2 rounded ${
                  connectionStatus === 'disconnected'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                }`}
              >
                Connect
              </button>
              <button
                onClick={disconnect}
                disabled={connectionStatus !== 'connected'}
                className={`px-4 py-2 rounded ${
                  connectionStatus === 'connected'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                }`}
              >
                Disconnect
              </button>
            </div>
          </div>
          
          <div className="border border-gray-300 rounded-lg p-4 bg-white mt-4">
            <h3 className="text-xl font-bold mb-4">Topics</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select topics to subscribe/unsubscribe:</label>
              <div className="max-h-40 overflow-y-auto border border-gray-300 rounded p-2">
                {availableTopics.map((topic) => (
                  <div key={topic.id} className="flex items-center mb-1">
                    <input
                      type="checkbox"
                      id={`topic-${topic.id}`}
                      checked={selectedTopics.includes(topic.id)}
                      onChange={() => handleTopicChange(topic.id)}
                      className="mr-2"
                      disabled={connectionStatus !== 'connected'}
                    />
                    <label htmlFor={`topic-${topic.id}`} className="flex-1">
                      {topic.name}
                      {topic.requiresAuth && (
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded">
                          Requires Auth
                        </span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={subscribe}
                disabled={connectionStatus !== 'connected' || selectedTopics.length === 0}
                className={`px-4 py-2 rounded ${
                  connectionStatus === 'connected' && selectedTopics.length > 0
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                }`}
              >
                Subscribe
              </button>
              <button
                onClick={unsubscribe}
                disabled={connectionStatus !== 'connected' || selectedTopics.length === 0}
                className={`px-4 py-2 rounded ${
                  connectionStatus === 'connected' && selectedTopics.length > 0
                    ? 'bg-orange-600 text-white hover:bg-orange-700'
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                }`}
              >
                Unsubscribe
              </button>
            </div>
          </div>
          
          <div className="border border-gray-300 rounded-lg p-4 bg-white mt-4">
            <h3 className="text-xl font-bold mb-4">Requests</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Topic:</label>
              <select
                value={requestTopic}
                onChange={(e) => setRequestTopic(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                disabled={connectionStatus !== 'connected'}
              >
                {Object.keys(topicActions).map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Action:</label>
              <select
                value={requestAction}
                onChange={(e) => setRequestAction(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                disabled={connectionStatus !== 'connected'}
              >
                {topicActions[requestTopic]?.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Parameters (JSON):</label>
              <textarea
                value={requestParams}
                onChange={(e) => setRequestParams(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded font-mono"
                rows={3}
                disabled={connectionStatus !== 'connected'}
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={sendRequest}
                disabled={connectionStatus !== 'connected'}
                className={`px-4 py-2 rounded ${
                  connectionStatus === 'connected'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                }`}
              >
                Send Request
              </button>
              <button
                onClick={sendPing}
                disabled={connectionStatus !== 'connected'}
                className={`px-4 py-2 rounded ${
                  connectionStatus === 'connected'
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                }`}
              >
                Ping
              </button>
              <button
                onClick={clearLogs}
                className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700"
              >
                Clear Log
              </button>
            </div>
          </div>
        </div>
        
        <div className="logs-panel">
          <div className="border border-gray-300 rounded-lg p-4 bg-white h-full flex flex-col">
            <h3 className="text-xl font-bold mb-4">Logs</h3>
            <div 
              ref={logContainerRef}
              className="flex-1 overflow-y-auto bg-gray-50 p-2 border border-gray-300 rounded"
              style={{ minHeight: '300px' }}
            >
              {logs.length === 0 ? (
                <div className="text-gray-500 text-center py-4">No logs yet. Connect to get started.</div>
              ) : (
                logs.map((log) => (
                  <div 
                    key={log.id} 
                    className={`mb-1 p-2 border-l-4 rounded text-sm ${getLogEntryClass(log.type)}`}
                  >
                    <div className="font-mono text-xs opacity-70">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="whitespace-pre-wrap font-mono text-xs">
                      {log.message}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="border border-gray-300 rounded-lg p-4 bg-white mt-4">
            <h3 className="text-xl font-bold mb-4">Last Received Data</h3>
            <div className="bg-gray-900 text-gray-100 p-3 rounded overflow-auto max-h-60 font-mono">
              {lastReceivedData ? (
                <pre>{formatJSON(lastReceivedData)}</pre>
              ) : (
                <div className="text-gray-400 text-center">No data received yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="websocket-api-guide">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">DegenDuel WebSocket API Guide</h1>
        <p className="text-gray-600">Interactive documentation and testing tool for the WebSocket API</p>
      </div>
      
      <div className="mb-6">
        <div className="border-b border-gray-300">
          <nav className="flex">
            <button
              className={`py-2 px-4 text-center ${
                activeTab === 'demo'
                  ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                  : 'text-gray-600 hover:text-blue-500'
              }`}
              onClick={() => setActiveTab('demo')}
            >
              Interactive Demo
            </button>
            <button
              className={`py-2 px-4 text-center ${
                activeTab === 'docs'
                  ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                  : 'text-gray-600 hover:text-blue-500'
              }`}
              onClick={() => setActiveTab('docs')}
            >
              Documentation
            </button>
          </nav>
        </div>
      </div>
      
      {activeTab === 'demo' ? renderDemoTab() : renderDocumentationTab()}
    </div>
  );
};

export default WebSocketAPIGuide; 