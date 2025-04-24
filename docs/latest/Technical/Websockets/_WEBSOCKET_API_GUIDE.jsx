// _WEBSOCKET_API_GUIDE.jsx
// This is a React component that serves as both documentation and a demo for the WebSocket API
// Import this component into your React application to test and understand the WebSocket API

import React, { useState, useEffect, useRef } from 'react';

// You can replace this with your actual authentication token handling
const useAuthToken = () => {
  // This is just a placeholder - replace with your actual auth token management
  return localStorage.getItem('auth_token') || '';
};

// WebSocket API Guide component
const WebSocketAPIGuide = () => {
  const [connected, setConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [messages, setMessages] = useState([]);
  const [tokens, setTokens] = useState({});
  const [topicSubscriptions, setTopicSubscriptions] = useState({
    'market-data': true,
    'portfolio': false,
    'system': true,
    'contest': false,
    'user': false,
    'admin': false,
    'wallet': false,
    'wallet-balance': false,
    'skyduel': false
  });
  const [manualMessage, setManualMessage] = useState(
`{
  "type": "REQUEST",
  "topic": "market-data",
  "action": "getToken",
  "symbol": "BTC"
}`);
  
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const authToken = useAuthToken();
  
  // Connection URL
  const socketUrl = process.env.NODE_ENV === 'production' 
    ? 'wss://degenduel.me/api/v69/ws'
    : `ws://${window.location.hostname}:${window.location.port}/api/v69/ws`;
  
  // Message types constants
  const MESSAGE_TYPES = {
    SUBSCRIBE: 'SUBSCRIBE',
    UNSUBSCRIBE: 'UNSUBSCRIBE',
    REQUEST: 'REQUEST',
    COMMAND: 'COMMAND',
    DATA: 'DATA',
    ERROR: 'ERROR',
    SYSTEM: 'SYSTEM',
    ACKNOWLEDGMENT: 'ACKNOWLEDGMENT'
  };
  
  // Scroll to bottom of message list on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Connect to WebSocket
  const connect = () => {
    if (socketRef.current) {
      addMessage('Already connected', 'outgoing', 'error');
      return;
    }
    
    try {
      setConnectionStatus('connecting');
      addMessage(`Connecting to ${socketUrl}...`, 'outgoing');
      
      socketRef.current = new WebSocket(socketUrl);
      
      socketRef.current.onopen = handleOpen;
      socketRef.current.onmessage = handleMessage;
      socketRef.current.onclose = handleClose;
      socketRef.current.onerror = handleError;
    } catch (error) {
      addMessage(`Connection error: ${error.message}`, 'outgoing', 'error');
      setConnectionStatus('error');
    }
  };
  
  // Disconnect from WebSocket
  const disconnect = () => {
    if (!socketRef.current) {
      addMessage('Not connected', 'outgoing', 'error');
      return;
    }
    
    try {
      socketRef.current.close(1000, 'User disconnected');
      addMessage('Disconnecting...', 'outgoing');
    } catch (error) {
      addMessage(`Disconnect error: ${error.message}`, 'outgoing', 'error');
    }
  };
  
  // Handle WebSocket open event
  const handleOpen = () => {
    setConnectionStatus('connected');
    setConnected(true);
    addMessage('Connected to server', 'incoming');
  };
  
  // Handle WebSocket message event
  const handleMessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      
      // Format the message for display
      const formattedMessage = JSON.stringify(message, null, 2);
      
      // Add the message to the list
      const topicClass = message.topic ? `topic-${message.topic}` : '';
      addMessage(formattedMessage, 'incoming', topicClass);
      
      // Process token data if present
      if (message.type === MESSAGE_TYPES.DATA && message.topic === 'market-data') {
        processTokenData(message);
      }
    } catch (error) {
      addMessage(`Parse error: ${error.message}. Raw data: ${event.data}`, 'incoming', 'error');
    }
  };
  
  // Handle WebSocket close event
  const handleClose = (event) => {
    setConnectionStatus('disconnected');
    setConnected(false);
    addMessage(`Disconnected from server: ${event.code} ${event.reason}`, 'incoming');
    socketRef.current = null;
  };
  
  // Handle WebSocket error event
  const handleError = (error) => {
    setConnectionStatus('error');
    addMessage(`WebSocket error: ${error.message || 'Unknown error'}`, 'incoming', 'error');
  };
  
  // Add message to message list
  const addMessage = (content, direction, className = '') => {
    const now = new Date();
    const timestamp = now.toTimeString().split(' ')[0];
    
    // Try to identify message type
    let messageType = 'Unknown';
    let topicName = null;
    
    if (typeof content === 'string' && content.includes('"type":')) {
      try {
        const parsed = JSON.parse(content);
        messageType = parsed.type || 'Unknown';
        topicName = parsed.topic || null;
      } catch (e) {
        // Just a fallback
        messageType = content.includes('"type":"') 
          ? content.split('"type":"')[1].split('"')[0] 
          : 'Unknown';
      }
    }
    
    const newMessage = {
      id: Date.now(),
      content,
      direction,
      className,
      timestamp,
      messageType,
      topicName
    };
    
    setMessages(prev => [...prev, newMessage]);
  };
  
  // Process token data message
  const processTokenData = (message) => {
    try {
      if (Array.isArray(message.data)) {
        // Bulk update (initial data)
        const newTokens = { ...tokens };
        message.data.forEach(token => {
          newTokens[token.symbol] = token;
        });
        setTokens(newTokens);
      } else if (message.data && message.data.symbol) {
        // Single token update
        setTokens(prev => ({
          ...prev,
          [message.data.symbol]: message.data
        }));
      }
    } catch (error) {
      console.error('Error processing token data:', error);
    }
  };
  
  // Send message to WebSocket server
  const sendMessage = (message) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      addMessage('Not connected to server', 'outgoing', 'error');
      return;
    }
    
    try {
      const messageString = JSON.stringify(message);
      socketRef.current.send(messageString);
      addMessage(messageString, 'outgoing');
    } catch (error) {
      addMessage(`Send error: ${error.message}`, 'outgoing', 'error');
    }
  };
  
  // Subscribe to selected topics
  const subscribeToTopics = () => {
    const selectedTopics = Object.entries(topicSubscriptions)
      .filter(([_, isSelected]) => isSelected)
      .map(([topic]) => topic);
      
    if (selectedTopics.length === 0) {
      addMessage('No topics selected', 'outgoing', 'error');
      return;
    }
    
    const message = {
      type: MESSAGE_TYPES.SUBSCRIBE,
      topics: selectedTopics,
    };
    
    // Add auth token if provided and needed
    const restrictedTopics = ['portfolio', 'user', 'admin', 'wallet', 'wallet-balance'];
    const hasRestrictedTopic = selectedTopics.some(topic => restrictedTopics.includes(topic));
    
    if (hasRestrictedTopic && authToken) {
      message.authToken = authToken;
    }
    
    sendMessage(message);
  };
  
  // Unsubscribe from selected topics
  const unsubscribeFromTopics = () => {
    const selectedTopics = Object.entries(topicSubscriptions)
      .filter(([_, isSelected]) => isSelected)
      .map(([topic]) => topic);
      
    if (selectedTopics.length === 0) {
      addMessage('No topics selected', 'outgoing', 'error');
      return;
    }
    
    sendMessage({
      type: MESSAGE_TYPES.UNSUBSCRIBE,
      topics: selectedTopics
    });
  };
  
  // Send manual message
  const sendManualMessage = () => {
    try {
      const message = JSON.parse(manualMessage);
      sendMessage(message);
    } catch (error) {
      addMessage(`Error parsing JSON: ${error.message}`, 'outgoing', 'error');
    }
  };
  
  // Clear messages
  const clearMessages = () => {
    setMessages([]);
  };
  
  // Handle topic checkbox change
  const handleTopicChange = (topic) => {
    setTopicSubscriptions(prev => ({
      ...prev,
      [topic]: !prev[topic]
    }));
  };
  
  // Render token list
  const renderTokenList = () => {
    const sortedTokens = Object.values(tokens).sort((a, b) => 
      a.symbol.localeCompare(b.symbol)
    );
    
    return (
      <div className="token-list">
        {sortedTokens.map(token => (
          <div key={token.symbol} className="token-item">
            <div className="token-symbol">{token.symbol}</div>
            <div className="token-price">
              ${typeof token.price === 'number' 
                ? token.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : 'N/A'}
            </div>
            <div className={`token-change ${(token.change24h || 0) >= 0 ? 'positive' : 'negative'}`}>
              {token.change24h 
                ? `${token.change24h >= 0 ? '+' : ''}${token.change24h.toFixed(2)}%` 
                : 'N/A'}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="websocket-guide">
      <h1>DegenDuel WebSocket API Guide</h1>
      
      <div className="container">
        {/* Control Panel */}
        <div className="panel controls">
          <h2>Connection Controls</h2>
          <div className="form-group">
            <label>Status:</label>
            <span className={`status-${connectionStatus}`}>
              {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
            </span>
          </div>
          
          <div className="button-group">
            <button 
              className="connect-button" 
              onClick={connect}
              disabled={connected}>
              Connect
            </button>
            <button 
              className="disconnect-button" 
              onClick={disconnect}
              disabled={!connected}>
              Disconnect
            </button>
          </div>
          
          <h3>Topic Subscriptions</h3>
          <div className="checkbox-container">
            {Object.entries(topicSubscriptions).map(([topic, isChecked]) => (
              <div key={topic} className="checkbox-item">
                <input
                  type="checkbox"
                  id={`topic-${topic}`}
                  checked={isChecked}
                  onChange={() => handleTopicChange(topic)}
                />
                <label htmlFor={`topic-${topic}`}>{topic}</label>
              </div>
            ))}
          </div>
          
          <div className="button-group">
            <button 
              className="subscribe-button" 
              onClick={subscribeToTopics}
              disabled={!connected}>
              Subscribe
            </button>
            <button 
              className="unsubscribe-button" 
              onClick={unsubscribeFromTopics}
              disabled={!connected}>
              Unsubscribe
            </button>
          </div>
          
          <h3>Manual Commands</h3>
          <div className="form-group">
            <label>Custom Message JSON:</label>
            <textarea
              value={manualMessage}
              onChange={(e) => setManualMessage(e.target.value)}
              rows={6}
              className="message-input"
            />
          </div>
          <button 
            className="send-button" 
            onClick={sendManualMessage}
            disabled={!connected}>
            Send Message
          </button>
        </div>
        
        {/* Message Panel */}
        <div className="panel messages">
          <h2>WebSocket Messages</h2>
          <button 
            className="clear-button" 
            onClick={clearMessages}>
            Clear Messages
          </button>
          <div className="message-list">
            {messages.map(message => (
              <div 
                key={message.id} 
                className={`message message-${message.direction} ${message.className}`}>
                <div className="timestamp">{message.timestamp}</div>
                
                {message.topicName && (
                  <span className={`topic-label topic-${message.topicName}`}>
                    {message.topicName}
                  </span>
                )}
                
                <div className="message-type">{message.messageType}</div>
                <pre className="message-content">{message.content}</pre>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Data Display Panel */}
        <div className="panel data-display">
          <h2>Token Data</h2>
          <div className="token-count">
            {Object.keys(tokens).length > 0 
              ? `${Object.keys(tokens).length} tokens received` 
              : 'No tokens received'}
          </div>
          {renderTokenList()}
        </div>
      </div>
      
      {/* Documentation Section */}
      <div className="documentation">
        <h2>WebSocket API Documentation</h2>
        
        <h3>Connection Information</h3>
        <p><strong>Endpoint:</strong> /api/v69/ws</p>
        <p>This WebSocket API provides real-time data from the DegenDuel platform through a unified WebSocket implementation with topic-based subscriptions.</p>
        
        <h3>Available Topics</h3>
        <table className="topics-table">
          <thead>
            <tr>
              <th>Topic</th>
              <th>Description</th>
              <th>Auth Required</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>market-data</td>
              <td>Real-time market data including token prices and stats</td>
              <td>No</td>
            </tr>
            <tr>
              <td>portfolio</td>
              <td>User's portfolio updates and performance</td>
              <td>Yes</td>
            </tr>
            <tr>
              <td>system</td>
              <td>System status, announcements and heartbeats</td>
              <td>No</td>
            </tr>
            <tr>
              <td>contest</td>
              <td>Contest updates, entries and results</td>
              <td>No (public), Yes (personal)</td>
            </tr>
            <tr>
              <td>user</td>
              <td>User-specific notifications and data</td>
              <td>Yes</td>
            </tr>
            <tr>
              <td>admin</td>
              <td>Administrative information</td>
              <td>Yes (admin role)</td>
            </tr>
            <tr>
              <td>wallet</td>
              <td>Wallet updates and transaction information</td>
              <td>Yes</td>
            </tr>
            <tr>
              <td>wallet-balance</td>
              <td>Real-time balance updates</td>
              <td>Yes</td>
            </tr>
            <tr>
              <td>skyduel</td>
              <td>Game-specific information</td>
              <td>No (public), Yes (personal)</td>
            </tr>
          </tbody>
        </table>
        
        <h3>Message Types</h3>
        
        <h4>Client → Server</h4>
        <div className="code-example">
          <h5>SUBSCRIBE</h5>
          <pre>{`{
  "type": "SUBSCRIBE",
  "topics": ["market-data", "system"]
}`}</pre>
          
          <h5>UNSUBSCRIBE</h5>
          <pre>{`{
  "type": "UNSUBSCRIBE",
  "topics": ["portfolio"]
}`}</pre>
          
          <h5>REQUEST</h5>
          <pre>{`{
  "type": "REQUEST",
  "topic": "market-data",
  "action": "getToken",
  "symbol": "btc",
  "requestId": "123"
}`}</pre>
          
          <h5>COMMAND</h5>
          <pre>{`{
  "type": "COMMAND",
  "topic": "portfolio",
  "action": "refreshBalance"
}`}</pre>
        </div>
        
        <h4>Server → Client</h4>
        <div className="code-example">
          <h5>DATA</h5>
          <pre>{`{
  "type": "DATA",
  "topic": "market-data",
  "action": "getToken",
  "requestId": "123",
  "data": { /* token data */ },
  "timestamp": "2025-04-07T15:30:00Z"
}`}</pre>
          
          <h5>ERROR</h5>
          <pre>{`{
  "type": "ERROR",
  "code": 4010,
  "message": "Authentication required for restricted topics",
  "timestamp": "2025-04-07T15:30:00Z"
}`}</pre>
          
          <h5>SYSTEM</h5>
          <pre>{`{
  "type": "SYSTEM",
  "action": "heartbeat",
  "timestamp": "2025-04-07T15:30:00Z"
}`}</pre>
          
          <h5>ACKNOWLEDGMENT</h5>
          <pre>{`{
  "type": "ACKNOWLEDGMENT",
  "operation": "subscribe",
  "topics": ["market-data", "system"],
  "timestamp": "2025-04-07T15:30:00Z"
}`}</pre>
        </div>
        
        <h3>Error Codes</h3>
        <table className="error-codes-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>4000</td>
              <td>Invalid message format</td>
            </tr>
            <tr>
              <td>4001</td>
              <td>Missing message type</td>
            </tr>
            <tr>
              <td>4003</td>
              <td>Subscription requires at least one topic</td>
            </tr>
            <tr>
              <td>4010</td>
              <td>Authentication required for restricted topics</td>
            </tr>
            <tr>
              <td>4011</td>
              <td>Invalid authentication token</td>
            </tr>
            <tr>
              <td>4012</td>
              <td>Admin role required for admin topics</td>
            </tr>
            <tr>
              <td>4040</td>
              <td>Resource not found</td>
            </tr>
            <tr>
              <td>4401</td>
              <td>Token expired</td>
            </tr>
            <tr>
              <td>5000</td>
              <td>Internal server error</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* CSS Styles for the component */}
      <style jsx>{`
        .websocket-guide {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 20px;
          max-width: 1600px;
          margin: 0 auto;
          color: #333;
        }
        
        h1, h2, h3, h4, h5 {
          color: #2c3e50;
        }
        
        .container {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 40px;
        }
        
        .panel {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          padding: 20px;
          position: relative;
        }
        
        .controls {
          flex: 1;
          min-width: 300px;
        }
        
        .messages {
          flex: 2;
          min-width: 400px;
        }
        
        .data-display {
          flex: 1;
          min-width: 300px;
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        
        .message-input {
          width: 100%;
          font-family: monospace;
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #ddd;
        }
        
        button {
          background-color: #3498db;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          margin: 5px;
        }
        
        button:hover {
          background-color: #2980b9;
        }
        
        button:disabled {
          background-color: #95a5a6;
          cursor: not-allowed;
        }
        
        .connect-button {
          background-color: #3498db;
        }
        
        .disconnect-button {
          background-color: #e74c3c;
        }
        
        .subscribe-button {
          background-color: #2ecc71;
        }
        
        .unsubscribe-button {
          background-color: #f39c12;
        }
        
        .clear-button {
          position: absolute;
          top: 20px;
          right: 20px;
          background-color: #7f8c8d;
        }
        
        .button-group {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        
        .checkbox-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 15px;
        }
        
        .checkbox-item {
          display: flex;
          align-items: center;
        }
        
        .checkbox-item input {
          margin-right: 5px;
        }
        
        .message-list {
          max-height: 500px;
          overflow-y: auto;
          border: 1px solid #ddd;
          padding: 10px;
          border-radius: 4px;
          background-color: #f9f9f9;
        }
        
        .message {
          padding: 10px;
          margin-bottom: 10px;
          border-radius: 4px;
          position: relative;
        }
        
        .message-incoming {
          background-color: #e8f4fd;
          border-left: 4px solid #3498db;
        }
        
        .message-outgoing {
          background-color: #f0fff4;
          border-left: 4px solid #2ecc71;
        }
        
        .message-error {
          background-color: #ffeaea;
          border-left: 4px solid #e74c3c;
        }
        
        .timestamp {
          font-size: 0.7em;
          color: #7f8c8d;
          position: absolute;
          top: 8px;
          right: 8px;
        }
        
        .message-type {
          font-weight: bold;
          color: #3498db;
          margin-bottom: 5px;
        }
        
        .message-content {
          font-family: monospace;
          white-space: pre-wrap;
          word-break: break-word;
          margin: 0;
          overflow-x: auto;
        }
        
        .topic-label {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 0.8em;
          margin-right: 5px;
          color: white;
          background-color: #7f8c8d;
        }
        
        .topic-market-data { background-color: #3498db; }
        .topic-portfolio { background-color: #2ecc71; }
        .topic-system { background-color: #9b59b6; }
        .topic-contest { background-color: #f1c40f; }
        .topic-user { background-color: #e67e22; }
        .topic-admin { background-color: #e74c3c; }
        .topic-wallet { background-color: #1abc9c; }
        .topic-skyduel { background-color: #34495e; }
        
        .status-connected, .status-operational {
          color: #2ecc71;
          font-weight: bold;
        }
        
        .status-disconnected, .status-error {
          color: #e74c3c;
          font-weight: bold;
        }
        
        .status-connecting {
          color: #f39c12;
          font-weight: bold;
        }
        
        .token-list {
          max-height: 400px;
          overflow-y: auto;
          margin-top: 10px;
        }
        
        .token-item {
          padding: 8px;
          border-bottom: 1px solid #eee;
          display: flex;
          align-items: center;
        }
        
        .token-item:hover {
          background-color: #f9f9f9;
        }
        
        .token-symbol {
          font-weight: bold;
          width: 80px;
        }
        
        .token-price {
          width: 100px;
          text-align: right;
        }
        
        .token-change {
          width: 80px;
          text-align: right;
          padding: 0 5px;
        }
        
        .token-change.positive {
          color: #2ecc71;
        }
        
        .token-change.negative {
          color: #e74c3c;
        }
        
        .token-count {
          margin-top: 5px;
          font-style: italic;
          color: #7f8c8d;
          margin-bottom: 10px;
        }
        
        /* Documentation Styles */
        .documentation {
          padding: 20px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .topics-table, .error-codes-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        
        .topics-table th, .topics-table td,
        .error-codes-table th, .error-codes-table td {
          border: 1px solid #ddd;
          padding: 10px;
          text-align: left;
        }
        
        .topics-table th, .error-codes-table th {
          background-color: #f2f2f2;
        }
        
        .code-example {
          margin: 20px 0;
        }
        
        .code-example h5 {
          margin: 10px 0 5px;
        }
        
        .code-example pre {
          background-color: #f8f8f8;
          padding: 10px;
          border-radius: 4px;
          border-left: 4px solid #3498db;
          font-family: monospace;
          overflow-x: auto;
        }
        
        @media (max-width: 1200px) {
          .container {
            flex-direction: column;
          }
          .controls, .messages, .data-display {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default WebSocketAPIGuide;

/*
   WEBSOCKET IMPLEMENTATION EXAMPLES

   Here are some practical examples for implementing WebSocket connections in your React application:

   1. Basic WebSocket Hook:
   ```jsx
   import { useState, useEffect, useRef, useCallback } from 'react';

   // Custom hook for WebSocket connection
   export const useWebSocket = (url) => {
     const [connected, setConnected] = useState(false);
     const [messages, setMessages] = useState([]);
     const socketRef = useRef(null);

     // Connect to WebSocket
     const connect = useCallback(() => {
       if (socketRef.current) return;

       socketRef.current = new WebSocket(url);

       socketRef.current.onopen = () => {
         setConnected(true);
         console.log('WebSocket connected');
       };

       socketRef.current.onmessage = (event) => {
         const message = JSON.parse(event.data);
         setMessages(prev => [...prev, message]);
       };

       socketRef.current.onclose = () => {
         setConnected(false);
         socketRef.current = null;
         console.log('WebSocket disconnected');
       };

       socketRef.current.onerror = (error) => {
         console.error('WebSocket error:', error);
       };
     }, [url]);

     // Disconnect WebSocket
     const disconnect = useCallback(() => {
       if (!socketRef.current) return;
       socketRef.current.close();
     }, []);

     // Send message to WebSocket
     const send = useCallback((message) => {
       if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
         console.error('WebSocket not connected');
         return;
       }
       socketRef.current.send(JSON.stringify(message));
     }, []);

     // Clean up on unmount
     useEffect(() => {
       return () => {
         if (socketRef.current) {
           socketRef.current.close();
         }
       };
     }, []);

     return { connected, messages, connect, disconnect, send };
   };
   ```

   2. MarketData Component Example:
   ```jsx
   import React, { useEffect, useState } from 'react';
   import { useWebSocket } from './hooks/useWebSocket';

   const MarketDataComponent = () => {
     const [tokens, setTokens] = useState({});
     const wsUrl = process.env.NODE_ENV === 'production' 
       ? 'wss://degenduel.me/api/v69/ws'
       : `ws://${window.location.hostname}:${window.location.port}/api/v69/ws`;
     
     const { connected, messages, connect, disconnect, send } = useWebSocket(wsUrl);

     // Connect on component mount
     useEffect(() => {
       connect();
       return () => disconnect();
     }, [connect, disconnect]);

     // Subscribe to market data when connected
     useEffect(() => {
       if (connected) {
         send({
           type: 'SUBSCRIBE',
           topics: ['market-data']
         });
         
         // Request initial data
         send({
           type: 'REQUEST',
           topic: 'market-data',
           action: 'getAllTokens',
           requestId: 'initial-load'
         });
       }
     }, [connected, send]);

     // Process incoming messages
     useEffect(() => {
       if (messages.length > 0) {
         const latestMessage = messages[messages.length - 1];
         
         // Process market data
         if (latestMessage.type === 'DATA' && latestMessage.topic === 'market-data') {
           if (Array.isArray(latestMessage.data)) {
             // Handle bulk update
             const newTokens = { ...tokens };
             latestMessage.data.forEach(token => {
               newTokens[token.symbol] = token;
             });
             setTokens(newTokens);
           } else if (latestMessage.data && latestMessage.data.symbol) {
             // Handle single token update
             setTokens(prev => ({
               ...prev,
               [latestMessage.data.symbol]: latestMessage.data
             }));
           }
         }
       }
     }, [messages, tokens]);

     return (
       <div className="market-data">
         <h2>Market Data</h2>
         <div className="connection-status">
           Status: <span className={connected ? 'connected' : 'disconnected'}>
             {connected ? 'Connected' : 'Disconnected'}
           </span>
         </div>
         
         <div className="token-list">
           <h3>Tokens ({Object.keys(tokens).length})</h3>
           <table>
             <thead>
               <tr>
                 <th>Symbol</th>
                 <th>Price</th>
                 <th>24h Change</th>
               </tr>
             </thead>
             <tbody>
               {Object.values(tokens).map(token => (
                 <tr key={token.symbol}>
                   <td>{token.symbol}</td>
                   <td>${token.price.toFixed(2)}</td>
                   <td className={token.change24h >= 0 ? 'positive' : 'negative'}>
                     {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
       </div>
     );
   };

   export default MarketDataComponent;
   ```

   3. Portfolio Component with Authentication:
   ```jsx
   import React, { useEffect } from 'react';
   import { useWebSocket } from './hooks/useWebSocket';

   const PortfolioComponent = ({ authToken }) => {
     const wsUrl = process.env.NODE_ENV === 'production' 
       ? 'wss://degenduel.me/api/v69/ws'
       : `ws://${window.location.hostname}:${window.location.port}/api/v69/ws`;
     
     const { connected, messages, connect, disconnect, send } = useWebSocket(wsUrl);
     const [portfolio, setPortfolio] = useState(null);

     // Connect on component mount
     useEffect(() => {
       connect();
       return () => disconnect();
     }, [connect, disconnect]);

     // Subscribe to portfolio data when connected
     useEffect(() => {
       if (connected && authToken) {
         send({
           type: 'SUBSCRIBE',
           topics: ['portfolio'],
           authToken: authToken
         });
       }
     }, [connected, authToken, send]);

     // Process incoming messages
     useEffect(() => {
       if (messages.length > 0) {
         const latestMessage = messages[messages.length - 1];
         
         // Handle portfolio data
         if (latestMessage.type === 'DATA' && latestMessage.topic === 'portfolio') {
           setPortfolio(latestMessage.data);
         }
       }
     }, [messages]);

     if (!connected) {
       return <div>Connecting to WebSocket...</div>;
     }

     if (!portfolio) {
       return <div>Loading portfolio data...</div>;
     }

     return (
       <div className="portfolio">
         <h2>Your Portfolio</h2>
         <div className="portfolio-summary">
           <div className="total-value">
             <h3>Total Value</h3>
             <div className="value">${portfolio.totalValue.toFixed(2)}</div>
           </div>
           <div className="performance">
             <h3>24h Performance</h3>
             <div className={portfolio.performance24h >= 0 ? 'positive' : 'negative'}>
               {portfolio.performance24h >= 0 ? '+' : ''}
               {portfolio.performance24h.toFixed(2)}%
             </div>
           </div>
         </div>
         
         <h3>Holdings</h3>
         <div className="holdings-list">
           {portfolio.holdings.map(holding => (
             <div key={holding.symbol} className="holding-item">
               <div className="holding-symbol">{holding.symbol}</div>
               <div className="holding-amount">{holding.amount}</div>
               <div className="holding-value">${holding.value.toFixed(2)}</div>
             </div>
           ))}
         </div>
       </div>
     );
   };

   export default PortfolioComponent;
   ```

   4. Handling Reconnection:
   ```jsx
   import { useState, useEffect, useRef, useCallback } from 'react';

   export const useWebSocketWithReconnect = (url, reconnectOptions = {}) => {
     const [connected, setConnected] = useState(false);
     const [messages, setMessages] = useState([]);
     const socketRef = useRef(null);
     const reconnectTimeoutRef = useRef(null);
     
     const options = {
       reconnectInterval: 2000,
       maxReconnectAttempts: 5,
       ...reconnectOptions
     };
     
     const [reconnectCount, setReconnectCount] = useState(0);

     // Connect to WebSocket
     const connect = useCallback(() => {
       if (socketRef.current) return;

       socketRef.current = new WebSocket(url);

       socketRef.current.onopen = () => {
         setConnected(true);
         setReconnectCount(0);
         console.log('WebSocket connected');
       };

       socketRef.current.onmessage = (event) => {
         const message = JSON.parse(event.data);
         setMessages(prev => [...prev, message]);
       };

       socketRef.current.onclose = (event) => {
         setConnected(false);
         socketRef.current = null;
         console.log(`WebSocket disconnected: ${event.code} ${event.reason}`);
         
         // Attempt reconnection for non-intentional closes
         if (event.code !== 1000) {
           attemptReconnect();
         }
       };

       socketRef.current.onerror = (error) => {
         console.error('WebSocket error:', error);
       };
     }, [url]);

     // Attempt to reconnect
     const attemptReconnect = useCallback(() => {
       if (reconnectCount >= options.maxReconnectAttempts) {
         console.log('Max reconnection attempts reached');
         return;
       }
       
       clearTimeout(reconnectTimeoutRef.current);
       
       reconnectTimeoutRef.current = setTimeout(() => {
         setReconnectCount(prev => prev + 1);
         console.log(`Attempting reconnect ${reconnectCount + 1}/${options.maxReconnectAttempts}`);
         connect();
       }, options.reconnectInterval);
     }, [connect, options.maxReconnectAttempts, options.reconnectInterval, reconnectCount]);

     // Disconnect WebSocket
     const disconnect = useCallback(() => {
       clearTimeout(reconnectTimeoutRef.current);
       if (!socketRef.current) return;
       socketRef.current.close(1000, 'User initiated disconnect');
     }, []);

     // Send message to WebSocket
     const send = useCallback((message) => {
       if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
         console.error('WebSocket not connected');
         return false;
       }
       socketRef.current.send(JSON.stringify(message));
       return true;
     }, []);

     // Clean up on unmount
     useEffect(() => {
       return () => {
         clearTimeout(reconnectTimeoutRef.current);
         if (socketRef.current) {
           socketRef.current.close();
         }
       };
     }, []);

     return { 
       connected, 
       reconnecting: reconnectCount > 0,
       reconnectCount,
       messages, 
       connect, 
       disconnect, 
       send 
     };
   };
   ```

   5. Integrating with Redux:
   ```jsx
   // marketDataSlice.js
   import { createSlice } from '@reduxjs/toolkit';

   const initialState = {
     tokens: {},
     connected: false,
     loading: false,
     error: null
   };

   export const marketDataSlice = createSlice({
     name: 'marketData',
     initialState,
     reducers: {
       connectionEstablished: (state) => {
         state.connected = true;
         state.error = null;
       },
       connectionClosed: (state) => {
         state.connected = false;
       },
       connectionError: (state, action) => {
         state.error = action.payload;
       },
       tokensReceived: (state, action) => {
         action.payload.forEach(token => {
           state.tokens[token.symbol] = token;
         });
         state.loading = false;
       },
       tokenUpdated: (state, action) => {
         const token = action.payload;
         state.tokens[token.symbol] = token;
       }
     }
   });

   export const { 
     connectionEstablished, 
     connectionClosed, 
     connectionError,
     tokensReceived, 
     tokenUpdated 
   } = marketDataSlice.actions;

   export default marketDataSlice.reducer;

   // WebSocketMiddleware.js
   const createWebSocketMiddleware = () => {
     let socket = null;
     let url = '';
     let reconnectTimer = null;
     let reconnectCount = 0;
     const MAX_RECONNECT_ATTEMPTS = 5;
     const RECONNECT_INTERVAL = 2000;

     const connect = ({ dispatch, getState }) => {
       if (socket !== null) {
         socket.close();
       }

       // Create the WebSocket connection
       socket = new WebSocket(url);

       socket.onopen = () => {
         dispatch(connectionEstablished());
         reconnectCount = 0;
         
         // Subscribe to market data on connection
         socket.send(JSON.stringify({
           type: 'SUBSCRIBE',
           topics: ['market-data']
         }));
         
         // Request initial data
         socket.send(JSON.stringify({
           type: 'REQUEST',
           topic: 'market-data',
           action: 'getAllTokens',
           requestId: 'initial-load'
         }));
       };

       socket.onclose = (event) => {
         dispatch(connectionClosed());
         
         // Only attempt reconnect for unexpected disconnects
         if (event.code !== 1000 && reconnectCount < MAX_RECONNECT_ATTEMPTS) {
           clearTimeout(reconnectTimer);
           reconnectTimer = setTimeout(() => {
             reconnectCount++;
             connect({ dispatch, getState });
           }, RECONNECT_INTERVAL);
         }
       };

       socket.onmessage = (event) => {
         const message = JSON.parse(event.data);
         
         if (message.type === 'DATA' && message.topic === 'market-data') {
           if (Array.isArray(message.data)) {
             dispatch(tokensReceived(message.data));
           } else if (message.data && message.data.symbol) {
             dispatch(tokenUpdated(message.data));
           }
         }
       };

       socket.onerror = (error) => {
         dispatch(connectionError(error.message));
       };
     };

     return store => next => action => {
       switch (action.type) {
         case 'WEBSOCKET_CONNECT':
           url = action.payload.url;
           connect(store);
           break;
           
         case 'WEBSOCKET_DISCONNECT':
           if (socket !== null) {
             socket.close(1000, 'User initiated disconnect');
             clearTimeout(reconnectTimer);
           }
           break;
           
         case 'WEBSOCKET_SEND':
           if (socket && socket.readyState === WebSocket.OPEN) {
             socket.send(JSON.stringify(action.payload));
           } else {
             console.error('WebSocket not connected, message not sent');
           }
           break;
           
         default:
           return next(action);
       }
     };
   };

   export const connectWebSocket = (url) => ({
     type: 'WEBSOCKET_CONNECT',
     payload: { url }
   });

   export const disconnectWebSocket = () => ({
     type: 'WEBSOCKET_DISCONNECT'
   });

   export const sendWebSocketMessage = (message) => ({
     type: 'WEBSOCKET_SEND',
     payload: message
   });

   // Setup in store.js
   import { configureStore } from '@reduxjs/toolkit';
   import createWebSocketMiddleware from './middleware/WebSocketMiddleware';
   import marketDataReducer from './slices/marketDataSlice';

   const webSocketMiddleware = createWebSocketMiddleware();

   export const store = configureStore({
     reducer: {
       marketData: marketDataReducer,
       // other reducers...
     },
     middleware: (getDefaultMiddleware) =>
       getDefaultMiddleware().concat(webSocketMiddleware)
   });

   // App.jsx - Initialize WebSocket
   import { useEffect } from 'react';
   import { useDispatch } from 'react-redux';
   import { connectWebSocket } from './store/middleware/WebSocketMiddleware';

   function App() {
     const dispatch = useDispatch();
     
     useEffect(() => {
       const wsUrl = process.env.NODE_ENV === 'production' 
         ? 'wss://degenduel.me/api/v69/ws'
         : `ws://${window.location.hostname}:${window.location.port}/api/v69/ws`;
       
       dispatch(connectWebSocket(wsUrl));
       
       // Disconnect on unmount
       return () => {
         dispatch(disconnectWebSocket());
       };
     }, [dispatch]);
     
     // Rest of your app...
   }
   ```
*/

/* 
   How to use this component in your React app:
   
   1. Copy this file to your project.
   2. Import it in a route or page where you want to show the WebSocket guide and demo:
      
      import WebSocketAPIGuide from './path/to/_WEBSOCKET_API_GUIDE';
      
      function WebSocketTestPage() {
        return (
          <div>
            <h1>WebSocket API Test</h1>
            <WebSocketAPIGuide />
          </div>
        );
      }
      
      export default WebSocketTestPage;
      
   3. Add it to your router:
      
      <Route path="/websocket-api" element={<WebSocketTestPage />} />
      
   4. Now you can access it at /websocket-api in your app.
*/