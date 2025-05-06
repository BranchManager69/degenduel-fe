# Terminal Data WebSocket Integration Guide

## Overview

The terminal data is served exclusively through the WebSocket interface on topic `TERMINAL`. Instead of polling with REST API calls, use the WebSocket connection to get both initial data and real-time updates.

## Connection Details

-   **WebSocket URL:** `/api/v69/ws`
-   **Topic:** `TERMINAL`
-   **Authentication:** Not required (public data)

## Connection Flow

1.  **Connect to the unified WebSocket:**
    ```javascript
    const socket = new WebSocket('wss://degenduel.me/api/v69/ws');
    ```
2.  **Wait for socket to open:**
    ```javascript
    socket.onopen = () => {
      // Connection established, subscribe to TERMINAL topic
      subscribeToTerminalData();
    };
    ```
3.  **Subscribe to Terminal data:**
    ```javascript
    function subscribeToTerminalData() {
      socket.send(JSON.stringify({
        type: 'SUBSCRIBE',
        topic: 'TERMINAL',
        requestId: generateUniqueId() // Helper function to generate unique IDs
      }));
    }
    ```
4.  **Request initial data (immediately after subscribing):**
    ```javascript
    function requestTerminalData() {
      socket.send(JSON.stringify({
        type: 'REQUEST',
        topic: 'TERMINAL',
        action: 'getData',
        requestId: generateUniqueId()
      }));
    }
    ```
5.  **Handle incoming messages:**
    ```javascript
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      // Check if this is terminal data
      if (message.topic === 'TERMINAL') {
        if (message.type === 'DATA') {
          // This is a data update (either initial or real-time)
          handleTerminalData(message.data);
        } else if (message.type === 'RESPONSE') {
          // This is a response to our request
          if (message.action === 'getData') {
            handleTerminalData(message.data);
          }
        }
      }
    };
    ```
    ```javascript
    function handleTerminalData(data) {
      // Update your UI with the terminal data
      console.log('Terminal data received:', data);

      // The data structure includes:
      // - platformName
      // - platformDescription
      // - platformStatus
      // - features
      // - systemStatus
      // - stats
      // - token
      // - launch
      // - roadmap
      // - commands
    }
    ```
6.  **Handle connection issues and reconnect:**
    ```javascript
    socket.onclose = (event) => {
      console.log('WebSocket connection closed:', event.code, event.reason);
      // Implement reconnection logic with exponential backoff
      setTimeout(reconnect, getReconnectDelay());
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      // Socket will close after an error, onclose handler will handle reconnection
    };
    ```

## React Hook Example

```javascript
import { useState, useEffect, useCallback, useRef } from 'react';

export function useTerminalData() {
  const [terminalData, setTerminalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const reconnectAttemptRef = useRef(0);

  // Generate unique request IDs
  const generateRequestId = useCallback(() => {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Connect and set up event handlers
  const connectWebSocket = useCallback(() => {
    const wsUrl = window.location.protocol === 'https:'
      ? `wss://${window.location.host}/api/v69/ws`
      : `ws://${window.location.host}/api/v69/ws`;

    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onopen = () => {
      console.log('WebSocket connected');
      reconnectAttemptRef.current = 0;

      // Subscribe to terminal topic
      socketRef.current.send(JSON.stringify({
        type: 'SUBSCRIBE',
        topic: 'TERMINAL',
        requestId: generateRequestId()
      }));

      // Request initial data
      socketRef.current.send(JSON.stringify({
        type: 'REQUEST',
        topic: 'TERMINAL',
        action: 'getData',
        requestId: generateRequestId()
      }));
    };

    socketRef.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.topic === 'TERMINAL') {
          if (message.type === 'DATA' ||
             (message.type === 'RESPONSE' && message.action === 'getData')) {
            setTerminalData(message.data);
            setLoading(false);
            setError(null);
          }
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    socketRef.current.onclose = () => {
      // Reconnect with exponential backoff
      const reconnectDelay = Math.min(1000 * (2 ** reconnectAttemptRef.current), 30000);
      reconnectAttemptRef.current += 1;

      console.log(`WebSocket closed. Reconnecting in ${reconnectDelay}ms...`);
      setTimeout(connectWebSocket, reconnectDelay);
    };

    socketRef.current.onerror = (err) => {
      console.error('WebSocket error:', err);
      setError('Connection error');
    };
  }, [generateRequestId]);

  // Connect on component mount
  useEffect(() => {
    connectWebSocket();

    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connectWebSocket]);

  return { terminalData, loading, error };
}
```

## Usage in a React Component

```javascript
import React from 'react';
import { useTerminalData } from './hooks/useTerminalData';

function TerminalDashboard() {
  const { terminalData, loading, error } = useTerminalData();

  if (loading) return <div>Loading terminal data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!terminalData) return <div>No terminal data available</div>;

  return (
    <div className="terminal-dashboard">
      <h1>{terminalData.platformName}</h1>
      <p>{terminalData.platformDescription}</p>

      <div className="status-section">
        <h2>Platform Status: {terminalData.platformStatus}</h2>
        <div className="system-status">
          {Object.entries(terminalData.systemStatus || {}).map(([component, status]) => (
            <div key={component} className="status-item">
              <span className="component">{component}</span>
              <span className="status">{status}</span>
            </div>
          ))}
        </div>
      </div>

      {terminalData.token && (
        <div className="token-section">
          <h2>Token Information</h2>
          <p><strong>Symbol:</strong> {terminalData.token.symbol}</p>
          <p><strong>Address:</strong> {terminalData.token.address}</p>
          <p><strong>Initial Price:</strong> {terminalData.token.initialPrice}</p>
          {/* Add more token details as needed */}
        </div>
      )}

      {terminalData.roadmap && (
        <div className="roadmap-section">
          <h2>Roadmap</h2>
          {terminalData.roadmap.map((phase, index) => (
            <div key={index} className="roadmap-phase">
              <h3>{phase.quarter} {phase.year} - {phase.title}</h3>
              <ul>
                {phase.details.map((detail, i) => (
                  <li key={i}>{detail}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Add more sections as needed */}
    </div>
  );
}

export default TerminalDashboard;
```

## Important Notes

1.  **No Polling** - Don't use any polling with REST API calls. The WebSocket will:
    *   Deliver initial data when you first connect
    *   Automatically push updates in real-time when data changes
2.  **Reconnection Logic** - Always implement robust reconnection logic with exponential backoff.
3.  **Data Structure** - Terminal data contains these main sections:
    *   `platformName` - Name of the platform
    *   `platformDescription` - Short description of the platform
    *   `platformStatus` - Current operational status
    *   `features` - List of platform features
    *   `systemStatus` - Status of platform subsystems
    *   `stats` - Key platform metrics and statistics
    *   `token` - Token configuration information
    *   `launch` - Token launch information
    *   `roadmap` - Platform development roadmap
    *   `commands` - Available terminal commands
4.  **Data Freshness** - The data is refreshed on the server periodically. You'll get the latest data when you connect and receive real-time updates when anything changes.
5.  **Error Handling** - Make sure to implement proper error handling for all WebSocket events (connection errors, data parsing errors, etc.) 