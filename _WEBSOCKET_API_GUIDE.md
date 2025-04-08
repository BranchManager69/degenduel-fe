# DegenDuel WebSocket API Guide

## Overview

This document provides a comprehensive overview of the DegenDuel WebSocket API. The platform uses a unified WebSocket system where all data flows through a single connection with topic-based subscriptions.

## Quick Start

```javascript
// Connect to the WebSocket
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
};
```

## Connection Information

- **Main WebSocket endpoint**: `/api/v69/ws`
- **Authentication**: Required for private data (user, portfolio, wallet)
- **Protocol**: WebSocket (WSS)

## Authentication Flow

1. **Cookie-based authentication**: The server checks for a session cookie containing a JWT token
2. **Token verification**: The token is decoded and verified
3. **User lookup**: The user is looked up in the database
4. **Device verification**: For secure operations, device authentication may be required

Alternatively, you can authenticate by providing a token in your subscription message:

```javascript
socket.send(JSON.stringify({
  type: 'SUBSCRIBE',
  topics: ['portfolio', 'user'],
  authToken: 'your-jwt-token'
}));
```

## Available Topics

| Topic | Description | Auth Required |
|-------|-------------|---------------|
| `market-data` | Real-time market data including token prices and stats | No |
| `portfolio` | User's portfolio updates and performance | Yes |
| `system` | System status, announcements and heartbeats | No |
| `contest` | Contest updates, entries and results | No (public), Yes (personal) |
| `user` | User-specific notifications and data | Yes |
| `admin` | Administrative information | Yes (admin role) |
| `wallet` | Wallet updates and transaction information | Yes |
| `wallet-balance` | Real-time balance updates | Yes |
| `skyduel` | Game-specific information | No (public), Yes (personal) |
| `logs` | Client-side logs (special topic) | No |

## Message Types

### Client → Server

1. **SUBSCRIBE**: Subscribe to one or more topics
   ```json
   {
     "type": "SUBSCRIBE",
     "topics": ["market-data", "system"]
   }
   ```

2. **UNSUBSCRIBE**: Unsubscribe from topics
   ```json
   {
     "type": "UNSUBSCRIBE",
     "topics": ["portfolio"]
   }
   ```

3. **REQUEST**: Request specific data
   ```json
   {
     "type": "REQUEST",
     "topic": "market-data",
     "action": "getToken",
     "symbol": "btc",
     "requestId": "123"
   }
   ```

4. **COMMAND**: Execute an action (requires authentication)
   ```json
   {
     "type": "COMMAND",
     "topic": "portfolio",
     "action": "refreshBalance"
   }
   ```

5. **LOGS**: Send client logs to server
   ```json
   {
     "type": "LOGS",
     "logs": [
       { "level": "info", "message": "App initialized", "timestamp": "2025-04-07T15:30:00Z" }
     ]
   }
   ```

### Server → Client

1. **DATA**: Data response or update
   ```json
   {
     "type": "DATA",
     "topic": "market-data",
     "action": "getToken",
     "requestId": "123",
     "data": { /* token data */ },
     "timestamp": "2025-04-07T15:30:00Z"
   }
   ```

2. **ERROR**: Error message
   ```json
   {
     "type": "ERROR",
     "code": 4010,
     "message": "Authentication required for restricted topics",
     "timestamp": "2025-04-07T15:30:00Z"
   }
   ```

3. **SYSTEM**: System messages and heartbeats
   ```json
   {
     "type": "SYSTEM",
     "action": "heartbeat",
     "timestamp": "2025-04-07T15:30:00Z"
   }
   ```

4. **ACKNOWLEDGMENT**: Confirms subscription/unsubscription
   ```json
   {
     "type": "ACKNOWLEDGMENT",
     "operation": "subscribe",
     "topics": ["market-data", "system"],
     "timestamp": "2025-04-07T15:30:00Z"
   }
   ```

## Topic-Specific Data and Actions

### `market-data` Topic

**Actions**:
- `getToken`: Get data for a specific token
- `getAllTokens`: Get data for all available tokens

**Data structure**:
```json
{
  "symbol": "btc",
  "name": "Bitcoin",
  "price": 69420.12,
  "change24h": 2.5,
  "volume24h": 1234567890,
  "marketCap": 1234567890000
}
```

### `portfolio` Topic

**Actions**:
- `getProfile`: Get user's portfolio profile
- `getHoldings`: Get user's token holdings
- `getPerformance`: Get portfolio performance metrics

**Data structure**:
```json
{
  "totalValue": 12345.67,
  "change24h": 3.1,
  "holdings": [
    {
      "symbol": "btc",
      "amount": 0.5,
      "value": 34710.06
    }
  ]
}
```

### `system` Topic

**Actions**:
- `getStatus`: Get system status information
- `ping`: Heartbeat request
- `getMetrics`: Get system metrics (admin only)

**Data structure**:
```json
{
  "status": "operational",
  "version": "1.0.0",
  "serverTime": "2025-04-07T15:30:00Z",
  "uptime": 86400
}
```

### `user` Topic

**Actions**:
- `getProfile`: Get user profile information
- `getStats`: Get user statistics
- `getAuthStatus`: Get authentication status

**Data structure**:
```json
{
  "nickname": "Branch",
  "role": "superadmin",
  "wallet_address": "BPuRhk...",
  "created_at": "2025-01-01T00:00:00Z",
  "last_login": "2025-04-07T15:00:00Z"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 4000 | Invalid message format |
| 4001 | Missing message type |
| 4003 | Subscription requires at least one topic |
| 4010 | Authentication required for restricted topics |
| 4011 | Invalid authentication token |
| 4012 | Admin role required for admin topics |
| 4040 | Resource not found |
| 4401 | Token expired |
| 5000 | Internal server error |

## Interactive Demo

Below is an HTML file you can use as an interactive demo of the WebSocket API. Save it to `/public/websocket-demo.html` and access it at `http://localhost:port/websocket-demo.html` or `https://degenduel.me/websocket-demo.html`.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DegenDuel WebSocket Demo</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
      background-color: #f5f5f5;
    }
    h1, h2, h3 {
      color: #2a4b8d;
    }
    .container {
      display: flex;
      gap: 20px;
    }
    .panel {
      flex: 1;
      background: white;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .log-area {
      height: 400px;
      overflow-y: auto;
      background: #f8f8f8;
      padding: 10px;
      border-radius: 4px;
      border: 1px solid #ddd;
      font-family: monospace;
      font-size: 12px;
    }
    .log-entry {
      margin-bottom: 5px;
      padding: 5px;
      border-bottom: 1px solid #eee;
    }
    .log-entry.send {
      background-color: #e6f7ff;
    }
    .log-entry.receive {
      background-color: #f6ffed;
    }
    .log-entry.error {
      background-color: #fff2f0;
    }
    .log-entry.system {
      background-color: #f9f0ff;
    }
    button {
      background: #2a4b8d;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      margin: 5px;
    }
    button:hover {
      background: #3a5fa0;
    }
    input, select {
      padding: 8px;
      border-radius: 4px;
      border: 1px solid #ddd;
      margin: 5px;
    }
    .control-group {
      margin-bottom: 15px;
    }
    .status {
      font-weight: bold;
      margin-bottom: 10px;
    }
    .status.connected {
      color: green;
    }
    .status.disconnected {
      color: red;
    }
    .form-group {
      margin-bottom: 10px;
    }
    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    .json-viewer {
      overflow-y: auto;
      max-height: 400px;
      background: #1e1e1e;
      color: #dcdcdc;
      padding: 10px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
    }
    .info-box {
      background-color: #e6f7ff;
      border-left: 4px solid #1890ff;
      padding: 10px;
      margin-bottom: 15px;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <h1>DegenDuel WebSocket Demo</h1>
  
  <div class="info-box">
    <p><strong>Note:</strong> This demo allows you to interact with the DegenDuel WebSocket API. You can connect, subscribe to topics, send requests, and view real-time data.</p>
  </div>

  <div class="container">
    <div class="panel">
      <h2>Connection</h2>
      <div class="status disconnected" id="status">Disconnected</div>
      
      <div class="form-group">
        <label for="websocket-url">WebSocket URL:</label>
        <input type="text" id="websocket-url" value="/api/v69/ws" style="width: 300px;">
      </div>
      
      <div class="form-group">
        <label for="auth-token">Auth Token (optional):</label>
        <input type="text" id="auth-token" placeholder="JWT token for authenticated requests" style="width: 300px;">
      </div>
      
      <button id="connect-btn">Connect</button>
      <button id="disconnect-btn" disabled>Disconnect</button>
      
      <h2>Topics</h2>
      <div class="control-group">
        <select id="topic-select" multiple style="width: 300px; height: 100px;">
          <option value="market-data">market-data</option>
          <option value="portfolio">portfolio</option>
          <option value="system">system</option>
          <option value="contest">contest</option>
          <option value="user">user</option>
          <option value="admin">admin</option>
          <option value="wallet">wallet</option>
          <option value="wallet-balance">wallet-balance</option>
          <option value="skyduel">skyduel</option>
        </select>
        <button id="subscribe-btn" disabled>Subscribe</button>
        <button id="unsubscribe-btn" disabled>Unsubscribe</button>
      </div>
      
      <h2>Requests</h2>
      <div class="control-group">
        <select id="request-topic">
          <option value="market-data">market-data</option>
          <option value="portfolio">portfolio</option>
          <option value="system">system</option>
          <option value="user">user</option>
        </select>
        <select id="request-action">
          <option value="getToken">getToken</option>
          <option value="getAllTokens">getAllTokens</option>
          <option value="getStatus">getStatus</option>
          <option value="getProfile">getProfile</option>
          <option value="getStats">getStats</option>
          <option value="ping">ping</option>
        </select>
        <div class="form-group">
          <label for="request-params">Parameters (JSON):</label>
          <input type="text" id="request-params" placeholder='{"symbol": "btc"}' style="width: 300px;">
        </div>
        <button id="send-request-btn" disabled>Send Request</button>
      </div>
      
      <h2>System Commands</h2>
      <button id="ping-btn" disabled>Ping</button>
      <button id="clear-log-btn">Clear Log</button>
    </div>
    
    <div class="panel">
      <h2>Log</h2>
      <div class="log-area" id="log"></div>
    </div>
  </div>
  
  <div class="container" style="margin-top: 20px;">
    <div class="panel">
      <h2>Last Received Data</h2>
      <pre class="json-viewer" id="data-viewer">No data received yet</pre>
    </div>
  </div>

  <script>
    // Elements
    const statusEl = document.getElementById('status');
    const logEl = document.getElementById('log');
    const dataViewerEl = document.getElementById('data-viewer');
    const connectBtn = document.getElementById('connect-btn');
    const disconnectBtn = document.getElementById('disconnect-btn');
    const subscribeBtn = document.getElementById('subscribe-btn');
    const unsubscribeBtn = document.getElementById('unsubscribe-btn');
    const sendRequestBtn = document.getElementById('send-request-btn');
    const pingBtn = document.getElementById('ping-btn');
    const clearLogBtn = document.getElementById('clear-log-btn');
    const websocketUrlInput = document.getElementById('websocket-url');
    const authTokenInput = document.getElementById('auth-token');
    const topicSelect = document.getElementById('topic-select');
    const requestTopicSelect = document.getElementById('request-topic');
    const requestActionSelect = document.getElementById('request-action');
    const requestParamsInput = document.getElementById('request-params');
    
    // WebSocket connection
    let socket = null;
    
    // Update action options based on selected topic
    requestTopicSelect.addEventListener('change', updateActionOptions);
    
    function updateActionOptions() {
      const topic = requestTopicSelect.value;
      requestActionSelect.innerHTML = '';
      
      let actions = [];
      
      switch(topic) {
        case 'market-data':
          actions = ['getToken', 'getAllTokens'];
          break;
        case 'portfolio':
          actions = ['getProfile', 'getHoldings', 'getPerformance'];
          break;
        case 'system':
          actions = ['getStatus', 'ping', 'getMetrics'];
          break;
        case 'user':
          actions = ['getProfile', 'getStats', 'getAuthStatus'];
          break;
        case 'contest':
          actions = ['getActiveContests', 'getContestDetails'];
          break;
        default:
          actions = ['getStatus'];
      }
      
      actions.forEach(action => {
        const option = document.createElement('option');
        option.value = action;
        option.textContent = action;
        requestActionSelect.appendChild(option);
      });
      
      // Update params placeholder based on action
      updateParamsPlaceholder();
    }
    
    requestActionSelect.addEventListener('change', updateParamsPlaceholder);
    
    function updateParamsPlaceholder() {
      const topic = requestTopicSelect.value;
      const action = requestActionSelect.value;
      
      let placeholder = '{}';
      
      if (topic === 'market-data' && action === 'getToken') {
        placeholder = '{"symbol": "btc"}';
      } else if (action === 'getContestDetails') {
        placeholder = '{"contestId": "123"}';
      } else if (action === 'ping') {
        placeholder = '{"clientTime": "' + new Date().toISOString() + '"}';
      }
      
      requestParamsInput.placeholder = placeholder;
    }
    
    // Initialize
    updateActionOptions();
    
    // Event listeners
    connectBtn.addEventListener('click', connect);
    disconnectBtn.addEventListener('click', disconnect);
    subscribeBtn.addEventListener('click', subscribe);
    unsubscribeBtn.addEventListener('click', unsubscribe);
    sendRequestBtn.addEventListener('click', sendRequest);
    pingBtn.addEventListener('click', sendPing);
    clearLogBtn.addEventListener('click', clearLog);
    
    // Functions
    function connect() {
      if (socket) {
        log('Already connected', 'error');
        return;
      }
      
      const url = websocketUrlInput.value;
      const fullUrl = url.startsWith('/') ? 
        (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + 
        window.location.host + url : 
        url;
      
      log(`Connecting to ${fullUrl}...`, 'system');
      
      try {
        socket = new WebSocket(fullUrl);
        
        socket.onopen = () => {
          log('Connection established', 'system');
          statusEl.textContent = 'Connected';
          statusEl.className = 'status connected';
          connectBtn.disabled = true;
          disconnectBtn.disabled = false;
          subscribeBtn.disabled = false;
          unsubscribeBtn.disabled = false;
          sendRequestBtn.disabled = false;
          pingBtn.disabled = false;
        };
        
        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          log(`Received: ${JSON.stringify(data, null, 2)}`, 'receive');
          
          // Update data viewer
          dataViewerEl.textContent = JSON.stringify(data, null, 2);
          
          // Handle specific message types
          if (data.type === 'ERROR') {
            log(`Error (${data.code}): ${data.message}`, 'error');
          }
        };
        
        socket.onclose = (event) => {
          log(`Connection closed: ${event.code} ${event.reason}`, 'system');
          statusEl.textContent = 'Disconnected';
          statusEl.className = 'status disconnected';
          connectBtn.disabled = false;
          disconnectBtn.disabled = true;
          subscribeBtn.disabled = true;
          unsubscribeBtn.disabled = true;
          sendRequestBtn.disabled = true;
          pingBtn.disabled = true;
          socket = null;
        };
        
        socket.onerror = (error) => {
          log(`WebSocket error: ${error}`, 'error');
        };
      } catch (error) {
        log(`Failed to connect: ${error}`, 'error');
      }
    }
    
    function disconnect() {
      if (!socket) {
        log('Not connected', 'error');
        return;
      }
      
      socket.close(1000, 'User initiated disconnect');
    }
    
    function subscribe() {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        log('Not connected', 'error');
        return;
      }
      
      const selectedOptions = Array.from(topicSelect.selectedOptions).map(option => option.value);
      
      if (selectedOptions.length === 0) {
        log('No topics selected', 'error');
        return;
      }
      
      const message = {
        type: 'SUBSCRIBE',
        topics: selectedOptions
      };
      
      // Add auth token if provided
      const authToken = authTokenInput.value.trim();
      if (authToken) {
        message.authToken = authToken;
      }
      
      sendMessage(message);
    }
    
    function unsubscribe() {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        log('Not connected', 'error');
        return;
      }
      
      const selectedOptions = Array.from(topicSelect.selectedOptions).map(option => option.value);
      
      if (selectedOptions.length === 0) {
        log('No topics selected', 'error');
        return;
      }
      
      const message = {
        type: 'UNSUBSCRIBE',
        topics: selectedOptions
      };
      
      sendMessage(message);
    }
    
    function sendRequest() {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        log('Not connected', 'error');
        return;
      }
      
      const topic = requestTopicSelect.value;
      const action = requestActionSelect.value;
      let params = {};
      
      // Parse parameters as JSON
      try {
        const paramsStr = requestParamsInput.value.trim();
        if (paramsStr) {
          params = JSON.parse(paramsStr);
        }
      } catch (error) {
        log(`Invalid JSON parameters: ${error}`, 'error');
        return;
      }
      
      const requestId = 'req-' + Date.now();
      
      const message = {
        type: 'REQUEST',
        topic,
        action,
        requestId,
        ...params
      };
      
      sendMessage(message);
    }
    
    function sendPing() {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        log('Not connected', 'error');
        return;
      }
      
      const message = {
        type: 'REQUEST',
        topic: 'system',
        action: 'ping',
        clientTime: new Date().toISOString(),
        requestId: 'ping-' + Date.now()
      };
      
      sendMessage(message);
    }
    
    function sendMessage(message) {
      const messageString = JSON.stringify(message);
      socket.send(messageString);
      log(`Sent: ${JSON.stringify(message, null, 2)}`, 'send');
    }
    
    function log(message, type = 'info') {
      const entry = document.createElement('div');
      entry.className = `log-entry ${type}`;
      
      // Add timestamp
      const now = new Date();
      const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
      
      entry.textContent = `[${timestamp}] ${message}`;
      logEl.appendChild(entry);
      logEl.scrollTop = logEl.scrollHeight;
    }
    
    function clearLog() {
      logEl.innerHTML = '';
    }
  </script>
</body>
</html>
```

## Implementation Guide for Frontend Developers

If you're implementing WebSocket support in your frontend application, here's a guide to get you started:

### 1. Basic WebSocket Connection

```javascript
class DegenDuelWebSocket {
  constructor(url = '/api/v69/ws') {
    this.url = url;
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
    this.subscriptions = new Set();
    this.messageHandlers = new Map();
    this.authToken = null;
  }

  connect() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        const fullUrl = this.url.startsWith('/') ? 
          (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + 
          window.location.host + this.url : 
          this.url;
        
        this.socket = new WebSocket(fullUrl);
        
        this.socket.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          
          // Resubscribe to previous topics if any
          if (this.subscriptions.size > 0) {
            this.subscribe([...this.subscriptions]);
          }
          
          resolve();
        };
        
        this.socket.onmessage = (event) => this.handleMessage(event);
        
        this.socket.onclose = (event) => {
          console.log(`WebSocket disconnected: ${event.code} ${event.reason}`);
          this.attemptReconnect();
        };
        
        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        reject(error);
      }
    });
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.close(1000, 'Client initiated disconnect');
      this.socket = null;
    }
  }
  
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => this.connect(), delay);
  }
  
  setAuthToken(token) {
    this.authToken = token;
  }
  
  subscribe(topics) {
    if (!Array.isArray(topics)) {
      topics = [topics];
    }
    
    // Add to subscription set
    topics.forEach(topic => this.subscriptions.add(topic));
    
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, subscription will be sent on connect');
      return Promise.reject(new Error('WebSocket not connected'));
    }
    
    const message = {
      type: 'SUBSCRIBE',
      topics
    };
    
    if (this.authToken) {
      message.authToken = this.authToken;
    }
    
    return this.sendMessage(message);
  }
  
  unsubscribe(topics) {
    if (!Array.isArray(topics)) {
      topics = [topics];
    }
    
    // Remove from subscription set
    topics.forEach(topic => this.subscriptions.delete(topic));
    
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('WebSocket not connected'));
    }
    
    const message = {
      type: 'UNSUBSCRIBE',
      topics
    };
    
    return this.sendMessage(message);
  }
  
  request(topic, action, params = {}) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('WebSocket not connected'));
    }
    
    const requestId = `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    return new Promise((resolve, reject) => {
      // Set up one-time handler for this request
      this.once(`response:${requestId}`, (data) => {
        if (data.type === 'ERROR') {
          reject(new Error(`${data.message} (code: ${data.code})`));
        } else {
          resolve(data);
        }
      });
      
      const message = {
        type: 'REQUEST',
        topic,
        action,
        requestId,
        ...params
      };
      
      this.sendMessage(message);
    });
  }
  
  sendMessage(message) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('WebSocket not connected'));
    }
    
    return new Promise((resolve, reject) => {
      try {
        this.socket.send(JSON.stringify(message));
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
  
  handleMessage(event) {
    try {
      const message = JSON.parse(event.data);
      
      // Handle different message types
      switch (message.type) {
        case 'DATA':
          this.emit(`data:${message.topic}`, message);
          break;
        case 'ERROR':
          this.emit('error', message);
          break;
        case 'SYSTEM':
          this.emit(`system:${message.action || 'message'}`, message);
          break;
        case 'ACKNOWLEDGMENT':
          this.emit(`ack:${message.operation}`, message);
          break;
      }
      
      // If message has a requestId, emit a response event
      if (message.requestId) {
        this.emit(`response:${message.requestId}`, message);
      }
      
      // Emit a generic message event
      this.emit('message', message);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }
  
  on(event, handler) {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, []);
    }
    
    this.messageHandlers.get(event).push(handler);
    return this;
  }
  
  off(event, handler) {
    if (!this.messageHandlers.has(event)) {
      return this;
    }
    
    if (!handler) {
      this.messageHandlers.delete(event);
      return this;
    }
    
    const handlers = this.messageHandlers.get(event);
    const index = handlers.indexOf(handler);
    
    if (index !== -1) {
      handlers.splice(index, 1);
    }
    
    return this;
  }
  
  once(event, handler) {
    const onceHandler = (...args) => {
      this.off(event, onceHandler);
      handler(...args);
    };
    
    return this.on(event, onceHandler);
  }
  
  emit(event, ...args) {
    if (!this.messageHandlers.has(event)) {
      return false;
    }
    
    const handlers = this.messageHandlers.get(event);
    handlers.forEach(handler => {
      try {
        handler(...args);
      } catch (error) {
        console.error(`Error in handler for ${event}:`, error);
      }
    });
    
    return true;
  }
}
```

### 2. React Integration Example

```jsx
import React, { useEffect, useState, useCallback } from 'react';
import { DegenDuelWebSocket } from './websocket';

// Create WebSocket instance
const ws = new DegenDuelWebSocket('/api/v69/ws');

function TokenPrices() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Connect to WebSocket
    ws.connect().then(() => {
      // Subscribe to market data
      return ws.subscribe(['market-data']);
    }).catch(error => {
      console.error('Failed to initialize WebSocket:', error);
    });
    
    // Listen for market data updates
    const handleMarketData = (message) => {
      if (message.data && Array.isArray(message.data)) {
        setTokens(message.data);
        setLoading(false);
      }
    };
    
    ws.on('data:market-data', handleMarketData);
    
    // Request initial token data
    ws.request('market-data', 'getAllTokens')
      .then(response => {
        if (response.data) {
          setTokens(response.data);
          setLoading(false);
        }
      })
      .catch(error => {
        console.error('Failed to fetch tokens:', error);
        setLoading(false);
      });
    
    // Cleanup
    return () => {
      ws.off('data:market-data', handleMarketData);
    };
  }, []);
  
  if (loading) {
    return <div>Loading token data...</div>;
  }
  
  return (
    <div>
      <h2>Token Prices</h2>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Name</th>
            <th>Price</th>
            <th>24h Change</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map(token => (
            <tr key={token.symbol}>
              <td>{token.symbol.toUpperCase()}</td>
              <td>{token.name}</td>
              <td>${token.price.toFixed(2)}</td>
              <td className={token.change24h >= 0 ? 'positive' : 'negative'}>
                {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TokenPrices;
```

### 3. Vue Integration Example

```javascript
// websocket.js
import { DegenDuelWebSocket } from './websocket-client';

// Create a singleton instance
const ws = new DegenDuelWebSocket('/api/v69/ws');

export default ws;

// TokenPrices.vue
<template>
  <div>
    <h2>Token Prices</h2>
    <div v-if="loading">Loading token data...</div>
    <table v-else>
      <thead>
        <tr>
          <th>Symbol</th>
          <th>Name</th>
          <th>Price</th>
          <th>24h Change</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="token in tokens" :key="token.symbol">
          <td>{{ token.symbol.toUpperCase() }}</td>
          <td>{{ token.name }}</td>
          <td>${{ token.price.toFixed(2) }}</td>
          <td :class="token.change24h >= 0 ? 'positive' : 'negative'">
            {{ token.change24h >= 0 ? '+' : '' }}{{ token.change24h.toFixed(2) }}%
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import ws from './websocket';

export default {
  data() {
    return {
      tokens: [],
      loading: true
    };
  },
  created() {
    // Connect to WebSocket
    ws.connect().then(() => {
      // Subscribe to market data
      return ws.subscribe(['market-data']);
    }).catch(error => {
      console.error('Failed to initialize WebSocket:', error);
    });
    
    // Listen for market data updates
    ws.on('data:market-data', this.handleMarketData);
    
    // Request initial token data
    ws.request('market-data', 'getAllTokens')
      .then(response => {
        if (response.data) {
          this.tokens = response.data;
          this.loading = false;
        }
      })
      .catch(error => {
        console.error('Failed to fetch tokens:', error);
        this.loading = false;
      });
  },
  beforeUnmount() {
    // Clean up event listeners
    ws.off('data:market-data', this.handleMarketData);
  },
  methods: {
    handleMarketData(message) {
      if (message.data && Array.isArray(message.data)) {
        this.tokens = message.data;
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.positive { color: green; }
.negative { color: red; }
</style>
```

## Summary

The DegenDuel WebSocket API provides a powerful and efficient way to get real-time data from the platform. By using the topic-based unified WebSocket approach, you can:

1. Use a single connection for all your data needs
2. Subscribe only to the topics you need
3. Get real-time updates as data changes
4. Reduce server load and network traffic

For any questions or issues with the WebSocket API, please contact the DegenDuel development team.