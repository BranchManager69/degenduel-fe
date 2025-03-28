# WebSocket System Documentation

Generated on Thu Mar 13 08:25:26 PM EDT 2025

## Frontend WebSocket System

### Core WebSocket Components

## File: /home/websites/degenduel-fe/src/hooks/useBaseWebSocket.ts

```typescript
import { useEffect, useRef } from "react";

import { useStore } from "../store/useStore";
import { trackWebSocketConnection, untrackWebSocketConnection } from "../utils/wsMonitor";

export interface WebSocketConfig {
  url: string;
  endpoint: string;
  socketType: string;
  onMessage: (message: any) => void;
  onError?: (error: Error) => void;
  onReconnect?: () => void;
  heartbeatInterval?: number;
  maxReconnectAttempts?: number;
  reconnectBackoff?: boolean;
  requiresAuth?: boolean; // New option to make auth optional for public endpoints
}

export type ServiceStatus = "online" | "offline" | "degraded" | "error";

export const useBaseWebSocket = (config: WebSocketConfig) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const { user } = useStore();

  const dispatchDebugEvent = (type: string, data?: any) => {
    // Add more detailed logging for debugging purposes
    console.log(`[WebSocket:${config.socketType}] [${type}]`, {
      endpoint: config.endpoint,
      timestamp: new Date().toISOString(),
      ...data,
    });

    // Also dispatch event for potential WebSocket monitoring tools
    window.dispatchEvent(
      new CustomEvent("ws-debug", {
        detail: {
          type,
          socketType: config.socketType,
          endpoint: config.endpoint,
          timestamp: new Date().toISOString(),
          data,
        },
      }),
    );
  };

  useEffect(() => {
    console.log(`[BaseWebSocket:${config.socketType}] Initializing WebSocket (endpoint: ${config.endpoint})`);
    
    // Only check for authentication if the WebSocket endpoint requires it
    if (config.requiresAuth !== false && !user?.session_token) {
      dispatchDebugEvent("error", { 
        message: "No session token available for authenticated WebSocket", 
        requiresAuth: config.requiresAuth,
        endpoint: config.endpoint,
        socketType: config.socketType
      });
      return;
    }

    const connect = () => {
      // Determine the WebSocket URL based on the current domain
      let baseWsUrl;

      // Check if we're on the production domain
      const isProdDomain = window.location.hostname === "degenduel.me";

      if (isProdDomain) {
        // In production on the main domain, use the same domain for WebSockets
        baseWsUrl = `wss://${window.location.hostname}`;
      } else if (config.url) {
        // Use the provided URL from config (for dev environments)
        baseWsUrl = config.url;
      } else {
        // Fallback to current host
        baseWsUrl = `wss://${window.location.host}`;
      }

      console.log(
        `[WebSocket:${config.socketType}] [Connecting] [URL: ${baseWsUrl}${config.endpoint}] [Token available: ${!!user?.session_token}]`,
      );

      // Create the WebSocket connection with token as subprotocol if auth is required
      const ws = config.requiresAuth !== false && user?.session_token
        ? new WebSocket(
            `${baseWsUrl}${config.endpoint}`,
            user.session_token,
          )
        : new WebSocket(`${baseWsUrl}${config.endpoint}`);
        
      // Add detailed debug info
      console.debug(`[WebSocket:${config.socketType}] Connection details:`, {
        url: `${baseWsUrl}${config.endpoint}`,
        requiresAuth: config.requiresAuth,
        usingAuth: config.requiresAuth !== false && !!user?.session_token,
        tokenLength: user?.session_token ? user.session_token.length : 0,
        readyState: ws.readyState,
        protocol: ws.protocol,
        timestamp: new Date().toISOString()
      });

      ws.onopen = () => {
        reconnectAttempts.current = 0;
        console.log(
          `[WebSocket:${config.socketType}] [Connected] [${config.endpoint}]`,
        );
        dispatchDebugEvent("connection");
        
        // Track this connection in our monitoring system
        trackWebSocketConnection(config.socketType);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          dispatchDebugEvent("message", message);
          // Handle message will be implemented by child hooks
          if (typeof config.onMessage === "function") {
            config.onMessage(message);
          }
        } catch (error) {
          dispatchDebugEvent("error", { type: "parse_error", error });
        }
      };

      ws.onclose = (event) => {
        console.log(
          `[WebSocket:${config.socketType}] [Closed] [${config.endpoint}] [Code: ${event.code}] [Reason: ${event.reason || "No reason provided"}]`,
        );
        dispatchDebugEvent("close", { code: event.code, reason: event.reason });
        
        // Untrack this connection from our monitoring system
        untrackWebSocketConnection(config.socketType);
        
        handleReconnection();
      };

      ws.onerror = (error) => {
        console.error(
          `[WebSocket:${config.socketType}] [Error] [${config.endpoint}]`,
          error,
        );
        dispatchDebugEvent("error", error);
      };

      wsRef.current = ws;
    };

    const handleReconnection = () => {
      if (reconnectAttempts.current < (config.maxReconnectAttempts || 5)) {
        const delay = Math.min(
          1000 * Math.pow(2, reconnectAttempts.current),
          30000,
        );
        reconnectAttempts.current++;
        setTimeout(connect, delay);
        dispatchDebugEvent("reconnect", {
          attempt: reconnectAttempts.current,
          delay,
        });
      } else {
        dispatchDebugEvent("error", {
          type: "max_reconnect_attempts",
          attempts: reconnectAttempts.current,
        });
      }
    };

    connect();

    // Cleanup
    return () => {
      if (wsRef.current) {
        console.log(`[BaseWebSocket:${config.socketType}] Closing WebSocket (endpoint: ${config.endpoint})`);
        
        // Make sure we untrack this connection when the component unmounts
        if (wsRef.current.readyState === WebSocket.OPEN) {
          untrackWebSocketConnection(config.socketType);
        }
        
        wsRef.current.close();
        wsRef.current = null;
      } else {
        console.log(`[BaseWebSocket:${config.socketType}] No WebSocket to close (endpoint: ${config.endpoint})`);
      }
    };
  }, [config.url, config.endpoint, config.requiresAuth, user?.session_token]);

  // Implement heartbeat if interval is specified
  useEffect(() => {
    if (!config.heartbeatInterval) return;

    const interval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "ping",
            timestamp: new Date().toISOString(),
          }),
        );
        dispatchDebugEvent("heartbeat");
      }
    }, config.heartbeatInterval);

    return () => clearInterval(interval);
  }, [config.heartbeatInterval]);

  // Public API
  const connect = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    reconnectAttempts.current = 0;
    // Implementation is handled in the useEffect
  };

  const close = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const getStatus = (): ServiceStatus => {
    if (!wsRef.current) return "offline";

    switch (wsRef.current.readyState) {
      case WebSocket.CONNECTING:
        return "degraded";
      case WebSocket.OPEN:
        return "online";
      case WebSocket.CLOSING:
      case WebSocket.CLOSED:
      default:
        return "offline";
    }
  };

  return {
    wsRef,
    status: getStatus(),
    connect,
    close,
  };
};
```

---

## File: /home/websites/degenduel-fe/src/utils/wsMonitor.ts

```typescript
/**
 * WebSocket Monitoring and Management Utilities
 * 
 * This file contains utilities for monitoring, tracking, and managing WebSocket connections
 * across the application. It provides a centralized way to track active connections,
 * log events, and help debug WebSocket-related issues.
 */

// Type declarations to extend Window interface
declare global {
  interface Window {
    DDActiveWebSockets: {
      [key: string]: number;
      total: number;
    };
  }
}

// Initialize global WebSocket tracking if it doesn't exist
export const initializeWebSocketTracking = (): void => {
  if (!window.DDActiveWebSockets) {
    window.DDActiveWebSockets = {
      total: 0
    };
    
    console.log('[WSMonitor] WebSocket tracking initialized');
  }
};

// Track a new WebSocket connection
export const trackWebSocketConnection = (type: string): void => {
  initializeWebSocketTracking();
  
  // Initialize counter for this type if it doesn't exist
  if (typeof window.DDActiveWebSockets[type] !== 'number') {
    window.DDActiveWebSockets[type] = 0;
  }
  
  // Ensure total is initialized
  if (typeof window.DDActiveWebSockets.total !== 'number') {
    window.DDActiveWebSockets.total = 0;
  }
  
  // Increment counters
  window.DDActiveWebSockets[type]++;
  window.DDActiveWebSockets.total++;
  
  console.log(`[WSMonitor] ${type} connection opened. Active: ${window.DDActiveWebSockets[type]}, Total: ${window.DDActiveWebSockets.total}`);
  
  dispatchWebSocketEvent('connection-tracking', {
    socketType: type,
    activeCount: window.DDActiveWebSockets[type],
    totalCount: window.DDActiveWebSockets.total
  });
};

// Untrack a WebSocket connection (when it's closed)
export const untrackWebSocketConnection = (type: string): void => {
  if (!window.DDActiveWebSockets) {
    window.DDActiveWebSockets = { total: 0 };
  }
  
  // Initialize counter for this type if it doesn't exist
  if (typeof window.DDActiveWebSockets[type] !== 'number') {
    window.DDActiveWebSockets[type] = 0;
    console.warn(`[WSMonitor] Trying to untrack ${type} connection, but it's not being tracked - initializing to 0`);
  }
  
  // Ensure total is initialized
  if (typeof window.DDActiveWebSockets.total !== 'number') {
    window.DDActiveWebSockets.total = 0;
  }
  
  // Decrement counters, ensuring they don't go below 0
  window.DDActiveWebSockets[type] = Math.max(0, window.DDActiveWebSockets[type] - 1);
  window.DDActiveWebSockets.total = Math.max(0, window.DDActiveWebSockets.total - 1);
  
  console.log(`[WSMonitor] ${type} connection closed. Active: ${window.DDActiveWebSockets[type]}, Total: ${window.DDActiveWebSockets.total}`);
  
  dispatchWebSocketEvent('connection-tracking', {
    socketType: type,
    activeCount: window.DDActiveWebSockets[type],
    totalCount: window.DDActiveWebSockets.total
  });
};

// Get count of active WebSocket connections by type
export const getWebSocketCount = (type?: string): number => {
  if (!window.DDActiveWebSockets) {
    return 0;
  }
  
  if (type) {
    return window.DDActiveWebSockets[type] || 0;
  }
  
  return window.DDActiveWebSockets.total || 0;
};

// Get all active WebSocket connection counts
export const getAllWebSocketCounts = (): Record<string, number> => {
  if (!window.DDActiveWebSockets) {
    return { total: 0 };
  }
  
  return { ...window.DDActiveWebSockets };
};

// Dispatch WebSocket event for monitoring
export const dispatchWebSocketEvent = (type: string, data?: any): void => {
  window.dispatchEvent(
    new CustomEvent('ws-debug', {
      detail: {
        type,
        timestamp: new Date().toISOString(),
        data
      }
    })
  );
};

// Log WebSocket event with consistent formatting
export const logWebSocketEvent = (type: string, socketType: string, message: string, data?: any): void => {
  console.log(`[WebSocket:${socketType}] [${type}] ${message}`, data);
  
  dispatchWebSocketEvent(type, {
    socketType,
    message,
    ...data
  });
};

// Reset all WebSocket tracking (useful for testing or recovering from errors)
export const resetWebSocketTracking = (): void => {
  if (!window.DDActiveWebSockets) {
    window.DDActiveWebSockets = { total: 0 };
    return;
  }
  
  const previousCounts = { ...window.DDActiveWebSockets };
  
  // Reset all counters
  Object.keys(window.DDActiveWebSockets).forEach(key => {
    window.DDActiveWebSockets[key] = 0;
  });
  
  console.log('[WSMonitor] WebSocket tracking reset. Previous counts:', previousCounts);
  
  dispatchWebSocketEvent('reset', {
    previousCounts
  });
};

// Initialize tracking when this module is imported
initializeWebSocketTracking();```

---

## File: /home/websites/degenduel-fe/src/components/debug/websocket/WebSocketMonitor.tsx

```typescript
/**
 * WebSocketMonitor Component
 * 
 * This component provides a real-time view of all active WebSocket connections in the application.
 * It shows connection status, counts by type, and recent events to help with debugging.
 * V69 version - Compatible with centralized WebSocket tracking
 */

import React, { useState, useEffect } from 'react';
import { 
  getAllWebSocketCounts, 
  resetWebSocketTracking,
  dispatchWebSocketEvent
} from '../../../utils/wsMonitor';

interface WebSocketEvent {
  id: string;
  timestamp: string;
  type: string;
  socketType?: string;
  data?: any;
}

export const WebSocketMonitor: React.FC = () => {
  const [connectionCounts, setConnectionCounts] = useState<Record<string, number>>({});
  const [events, setEvents] = useState<WebSocketEvent[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  
  // Update connection counts
  useEffect(() => {
    const updateCounts = () => {
      setConnectionCounts(getAllWebSocketCounts());
    };
    
    // Initialize
    updateCounts();
    
    // Set up interval for auto-refresh
    let interval: number | undefined;
    if (autoRefresh) {
      interval = window.setInterval(updateCounts, 1000);
    }
    
    // Listen for WebSocket events
    const handleWsEvent = (event: CustomEvent) => {
      const { type, socketType, timestamp, data } = event.detail;
      
      // Add event to list
      setEvents(prev => {
        const newEvent: WebSocketEvent = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: timestamp || new Date().toISOString(),
          type,
          socketType,
          data
        };
        
        // Keep only the most recent 100 events
        const updated = [newEvent, ...prev].slice(0, 100);
        return updated;
      });
      
      // Update counts
      updateCounts();
    };
    
    window.addEventListener('ws-debug', handleWsEvent as EventListener);
    
    // Cleanup
    return () => {
      if (interval) {
        clearInterval(interval);
      }
      window.removeEventListener('ws-debug', handleWsEvent as EventListener);
    };
  }, [autoRefresh]);
  
  // Format the timestamp for display
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
  
  // Get CSS class for status indicator
  const getStatusClass = (count: number) => {
    if (count === 0) return 'bg-gray-400';
    if (count === 1) return 'bg-green-500';
    return 'bg-yellow-500';
  };
  
  // Handle reset button click
  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset WebSocket tracking? This is for debugging purposes only.')) {
      resetWebSocketTracking();
      setEvents([]);
      
      // Dispatch a custom event to notify about reset
      dispatchWebSocketEvent('system', {
        message: 'WebSocket tracking reset by administrator',
        timestamp: new Date().toISOString()
      });
    }
  };
  
  // Filter events by type if selected
  const filteredEvents = selectedType 
    ? events.filter(event => event.socketType === selectedType)
    : events;
  
  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">WebSocket Monitor</h2>
      
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <button 
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 rounded mr-3 ${autoRefresh ? 'bg-green-600' : 'bg-gray-600'}`}
          >
            {autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
          </button>
          
          <button 
            onClick={handleReset}
            className="px-3 py-1 bg-red-600 rounded"
          >
            Reset Tracking
          </button>
        </div>
        
        <div>
          <select 
            value={selectedType || ''}
            onChange={(e) => setSelectedType(e.target.value || null)}
            className="bg-gray-700 text-white p-1 rounded"
          >
            <option value="">All Types</option>
            {Object.keys(connectionCounts)
              .filter(key => key !== 'total')
              .map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
          </select>
        </div>
      </div>
      
      {/* Connection Stats */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Active Connections</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(connectionCounts)
            .filter(([key]) => key !== 'total')
            .map(([type, count]) => (
              <div 
                key={type}
                className="flex items-center bg-gray-700 px-3 py-1 rounded"
                onClick={() => setSelectedType(type !== selectedType ? type : null)}
                style={{ cursor: 'pointer' }}
              >
                <div className={`w-3 h-3 rounded-full mr-2 ${getStatusClass(count)}`}></div>
                <span className="font-medium">{type}:</span>
                <span className="ml-1">{count}</span>
              </div>
            ))}
          <div className="flex items-center bg-gray-900 px-3 py-1 rounded">
            <div className={`w-3 h-3 rounded-full mr-2 ${connectionCounts.total > 0 ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
            <span className="font-medium">Total:</span>
            <span className="ml-1">{connectionCounts.total || 0}</span>
          </div>
        </div>
      </div>
      
      {/* Events Log */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Recent Events {selectedType ? `(${selectedType})` : ''}</h3>
        <div className="bg-gray-900 rounded p-2 h-80 overflow-auto">
          {filteredEvents.length === 0 ? (
            <div className="text-gray-400 text-center py-4">No events recorded</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-left">
                  <th className="p-1">Time</th>
                  <th className="p-1">Type</th>
                  <th className="p-1">Socket</th>
                  <th className="p-1">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map(event => (
                  <tr key={event.id} className="border-t border-gray-800">
                    <td className="p-1 text-gray-300">{formatTime(event.timestamp)}</td>
                    <td className="p-1">{event.type}</td>
                    <td className="p-1">{event.socketType || '-'}</td>
                    <td className="p-1 truncate max-w-xs">
                      {event.data ? (
                        <details>
                          <summary className="cursor-pointer text-blue-400">View Details</summary>
                          <pre className="mt-1 text-xs bg-gray-800 p-2 rounded overflow-auto max-h-32">
                            {JSON.stringify(event.data, null, 2)}
                          </pre>
                        </details>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebSocketMonitor;```

---

## File: /home/websites/degenduel-fe/src/components/core/WebSocketManager.tsx

```typescript
// src/components/core/WebSocketManager.tsx

/**
 * This component is used to manage all WebSocket connections for the application.
 * V69 - Updated with centralized WebSocket tracking and management
 *
 * NOTES:
 * - Some WebSocket connections (like contest chat) are managed at the component level
 * - This component manages global/application-level WebSocket connections
 * - Each WebSocket hook is responsible for tracking its own connections
 */

import React, { useEffect } from "react";

import { useAchievementWebSocket } from "../../hooks/useAchievementWebSocket";
import { useAnalyticsWebSocket } from "../../hooks/useAnalyticsWebSocket";
import { useAuth } from "../../hooks/useAuth";
import { useCircuitBreakerSocket } from "../../hooks/useCircuitBreakerSocket";
import { useMarketDataWebSocket } from "../../hooks/useMarketDataWebSocket";
import { usePortfolioWebSocket } from "../../hooks/usePortfolioWebSocket";
import { useServiceWebSocket } from "../../hooks/useServiceWebSocket";
import { useWalletWebSocket } from "../../hooks/useWalletWebSocket";
import { useStore } from "../../store/useStore";

// Import centralized WebSocket monitoring utilities
import { 
  logWebSocketEvent, 
  getAllWebSocketCounts
} from "../../utils/wsMonitor";

// Debug options
const WS_DEBUG = true;

export const WebSocketManager: React.FC = () => {
  const { user } = useStore();
  const { isAdmin } = useAuth();
  const isAuthenticated = !!user?.session_token;
  
  // Reference to track active WebSocket hook instances
  const hooksRef = React.useRef<Record<string, any>>({});

  // Setup global WebSocket event listener for monitoring
  useEffect(() => {
    if (!WS_DEBUG) return;
    
    const handleWsDebugEvent = (event: CustomEvent) => {
      // Check if this is a connection tracking event
      if (event.detail?.type === 'connection-tracking') {
        // Report current connection counts periodically
        console.log(`[WebSocketManager] WebSocket Connections:`, getAllWebSocketCounts());
      }
    };
    
    // Add event listener for WebSocket debug events
    window.addEventListener('ws-debug', handleWsDebugEvent as EventListener);
    
    // Log initial connection status
    logWebSocketEvent('init', 'manager', 'WebSocketManager initialized');
    
    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener('ws-debug', handleWsDebugEvent as EventListener);
    };
  }, []);

  // Initialize and manage WebSocket connections
  useEffect(() => {
    // Only initialize certain WebSocket connections at app level if user is authenticated
    if (!isAuthenticated) {
      logWebSocketEvent('auth', 'manager', 'User not authenticated, skipping global WebSocket connections');
      return;
    }

    logWebSocketEvent('init', 'manager', 'Initializing essential WebSocket connections');
    
    // Create a container to hold all hook references for cleanup
    const hooks: Record<string, any> = {};
    
    // Initialize core user WebSocket connections
    hooks.portfolio = usePortfolioWebSocket();
    hooks.wallet = useWalletWebSocket();
    hooks.achievements = useAchievementWebSocket();

    // Initialize market data WebSocket for key tokens
    const symbols = ["SOL", "BULLY", "BONK", "WIF", "JUP"];
    hooks.marketData = useMarketDataWebSocket(symbols);
    
    // Initialize admin-only connections
    if (isAdmin()) {
      logWebSocketEvent('init', 'manager', 'Initializing admin-only WebSocket connections');
      hooks.service = useServiceWebSocket();
      hooks.circuit = useCircuitBreakerSocket();
      hooks.analytics = useAnalyticsWebSocket();
    }
    
    // Store all the hooks for access during cleanup
    hooksRef.current = hooks;

    // Log connection summary
    if (WS_DEBUG) {
      console.log(`[WebSocketManager] Active connections summary:`, getAllWebSocketCounts());
    }

    // Cleanup function
    return () => {
      logWebSocketEvent('cleanup', 'manager', 'Cleaning up WebSocket connections');
      
      // Close all active connections
      Object.entries(hooksRef.current).forEach(([name, hook]) => {
        if (hook && typeof hook.close === 'function') {
          logWebSocketEvent('close', name, `Closing ${name} connection`);
          hook.close();
        }
      });
      
      logWebSocketEvent('cleanup', 'manager', 'All WebSocket connections closed');
      
      // Final connection check
      const remainingConnections = getAllWebSocketCounts();
      if (remainingConnections.total > 0) {
        console.warn(`[WebSocketManager] Warning: ${remainingConnections.total} WebSocket connections still active after cleanup:`, remainingConnections);
      }
    };
  }, [isAuthenticated, isAdmin]);

  // This component doesn't render anything
  return null;
};
```

---

### Specialized WebSocket Hooks

## File: /home/websites/degenduel-fe/src/hooks/useTokenDataWebSocket.ts

```typescript
// src/hooks/useTokenDataWebSocket.ts

/**
 * This hook is used to get the token data from the token service.
 * It uses a WebSocket connection to get the data and a fallback to the Admin API if the WebSocket connection fails.
 * V69 version - Compatible with new token-data-ws.js WebSocket server
 *
 * @returns {Object} An object containing the token data, loading state, error state, and a function to refresh the data.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "./useAuth"; // Keeping this for authentication
import { NODE_ENV, WS_URL } from "../config/config";
import { useStore } from "../store/useStore";

// Import toast system for connection error notifications
// To avoid excessive toasts, we'll use a global last error tracker
let lastTokenDataErrorToast: number = 0;

// Config for WebSocket - using ONLY the new v69 endpoint
//    No fallbacks, no progressive attempts - just the one we want

// Enable for detailed WebSocket debugging (used in debug console.log statements)
// Uncomment to enable detailed debugging
// const WS_DEBUG = true;

// Token data WebSocket endpoint path - updated to match v69 documentation
const TOKEN_DATA_WSS_PATH = `/api/v69/ws/token-data`;

// Local development settings (only used when USE_LOCAL_SERVER is true)
//     Can set to true when testing with localhost (but I choose to favor dev.degenduel.me over localhost)
const USE_LOCAL_SERVER = false;
const TOKEN_DATA_LOCAL_URL =
  NODE_ENV === "development" ? `localhost:3005` : `localhost:3004`;
  
// Optional registry tracking active connections for debugging
window.DDActiveWebSockets = window.DDActiveWebSockets || {total: 0};
window.DDActiveWebSockets.tokenData = window.DDActiveWebSockets.tokenData || 0;
window.DDActiveWebSockets.total = window.DDActiveWebSockets.total || 0;

export interface TokenData {
  symbol: string;
  name: string;
  price: string;
  marketCap: string;
  volume24h: string;
  volume5m?: string;
  change24h: string; // missing many fields
  change5m?: string;
  change1h?: string;
  imageUrl?: string;
  // "Additional fields from WebSocket" // TODO: WHAT???
  liquidity?: number;
  status?: "active" | "inactive";
}

interface TokenDataMessage {
  type: string;
  symbol?: string; // v69 uses 'symbol' instead of 'token' for token identifiers
  symbols?: string[]; // v69 uses 'symbols' for subscription arrays
  token?: string; // Legacy field, kept for backward compatibility
  tokens?: TokenData[]; // Legacy field, kept for backward compatibility
  data?: any; // The v69 server places token data in the 'data' field
  timestamp?: string; // ISO timestamp for when the message was sent
  error?: string; // Error message
  code?: string; // Error code
  count?: number; // Number of tokens in subscription/operation responses
}

// Simulated token data for fallback when no actual data is available
// TODO: ELIMINATE THESE!!!
const FALLBACK_TOKENS: TokenData[] = [
  {
    symbol: "SOL",
    name: "Solana",
    price: "112.50",
    marketCap: "50000000000",
    volume24h: "3500000000",
    volume5m: "75000000",
    change24h: "2.5",
    change5m: "0.75",
    change1h: "1.2",
    imageUrl: "https://solana.com/src/img/branding/solanaLogoMark.svg",
    status: "active",
  },
  {
    symbol: "BONK",
    name: "Bonk",
    price: "0.00002156",
    marketCap: "1250000000",
    volume24h: "450000000",
    volume5m: "25000000",
    change24h: "5.2",
    change5m: "1.8",
    change1h: "3.1",
    status: "active",
  },
  {
    symbol: "JUP",
    name: "Jupiter",
    price: "0.95",
    marketCap: "3800000000",
    volume24h: "980000000",
    volume5m: "30000000",
    change24h: "-0.75",
    change5m: "0.4",
    change1h: "-0.2",
    status: "active",
  },
  {
    symbol: "WIF",
    name: "Dogwifhat",
    price: "1.85",
    marketCap: "1850000000",
    volume24h: "550000000",
    volume5m: "20000000",
    change24h: "-2.1",
    change5m: "-0.5",
    change1h: "-1.1",
    status: "active",
  },
];

// Function to show token data connection error toast
const showTokenDataErrorToast = (message: string): void => {
  // Check if there is a global toast dispatcher
  const customEvent = new CustomEvent('show-toast', {
    detail: {
      type: 'error',
      title: 'Token Data Connection',
      message: message
    }
  });
  window.dispatchEvent(customEvent);
  
  // Record that we showed a toast recently
  lastTokenDataErrorToast = Date.now();
};

export function useTokenDataWebSocket(
  tokensToSubscribe: string[] | "all" = "all",
) {
  const [isConnected, setIsConnected] = useState(false);
  const [tokens, setTokens] = useState<TokenData[]>(FALLBACK_TOKENS); // Initialize with fallback data // TODO: ELIMINATE THIS!!!
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(new Date()); // Initialize with current date

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number>();
  const simulationIntervalRef = useRef<number>();
  const reconnectAttempts = useRef(0);

  const { getAccessToken } = useAuth();
  const { maintenanceMode } = useStore();

  const connect = useCallback(async () => {
    try {
      // Return if maintenance mode is active
      if (maintenanceMode) {
        console.log('[TokenDataWebSocket] Maintenance mode active, skipping connection');
        return;
      }

      // Clear any existing reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = undefined;
      }

      // Clean up existing connection
      if (wsRef.current) {
        console.log('[TokenDataWebSocket] Closing existing connection before reconnect');
        try {
          wsRef.current.close();
        } catch (e) {
          console.error('[TokenDataWebSocket] Error closing existing connection:', e);
        }
        wsRef.current = null;
        
        // Update connection counter
        if (window.DDActiveWebSockets) {
          window.DDActiveWebSockets.tokenData--;
          console.log(`[TokenDataWebSocket] Active connections: ${window.DDActiveWebSockets.tokenData}`);
        }
      }

      // Get authentication token - v69 supports auth but doesn't require it
      const token = await getAccessToken().catch(() => null);

      // Determine WebSocket URL based on configuration
      let wsUrl: string;

      if (USE_LOCAL_SERVER) {
        // Use localhost for testing - note: must include ws:// protocol
        const baseWsUrl = `ws://${TOKEN_DATA_LOCAL_URL}`;
        wsUrl = `${baseWsUrl}${TOKEN_DATA_WSS_PATH}`;
      } else {
        // Use production WebSocket URL from config (wss://domain.com)
        const baseWsUrl = WS_URL;
        wsUrl = `${baseWsUrl}${TOKEN_DATA_WSS_PATH}`;
      }

      console.log(`[TokenDataWebSocket] Connecting to v69 endpoint [${wsUrl}] [Token available: ${!!token}]`);

      // Create WebSocket connection
      wsRef.current = new WebSocket(wsUrl);
      
      // Update connection counter
      window.DDActiveWebSockets = window.DDActiveWebSockets || {total: 0};
      window.DDActiveWebSockets.tokenData = window.DDActiveWebSockets.tokenData || 0;
      window.DDActiveWebSockets.total = window.DDActiveWebSockets.total || 0;
      window.DDActiveWebSockets.tokenData++;
      window.DDActiveWebSockets.total++;
      console.log(`[TokenDataWebSocket] Active connections: ${window.DDActiveWebSockets.tokenData}, Total: ${window.DDActiveWebSockets.total}`);

      // Dispatch debug event
      window.dispatchEvent(
        new CustomEvent("ws-debug", {
          detail: {
            type: "connection",
            socketType: "token-data",
            endpoint: TOKEN_DATA_WSS_PATH,
            timestamp: new Date().toISOString(),
            data: { 
              connecting: true,
              hasToken: !!token,
              tokensToSubscribe: tokensToSubscribe === "all" ? "all" : tokensToSubscribe.length
            }
          },
        })
      );

      // Handle connection open
      wsRef.current.onopen = () => {
        console.log("[TokenDataWebSocket] Connected successfully");
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;

        // Dispatch debug event for successful connection
        window.dispatchEvent(
          new CustomEvent("ws-debug", {
            detail: {
              type: "connection",
              socketType: "token-data",
              endpoint: TOKEN_DATA_WSS_PATH,
              timestamp: new Date().toISOString(),
              data: { connected: true }
            },
          })
        );

        // v69 server requires different messages for authentication and subscription
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          // Send authentication first if token is available
          if (token) {
            console.log("[TokenDataWebSocket] Sending authentication");
            wsRef.current.send(
              JSON.stringify({
                type: "authenticate",
                token: token,
              }),
            );
          }

          // After auth, request all tokens
          console.log("[TokenDataWebSocket] Requesting all tokens");
          wsRef.current.send(
            JSON.stringify({
              type: "get_all_tokens",
            }),
          );

          // Then subscribe to specific tokens if specified
          if (tokensToSubscribe !== "all") {
            console.log(`[TokenDataWebSocket] Subscribing to ${tokensToSubscribe.length} tokens`);
            wsRef.current.send(
              JSON.stringify({
                type: "subscribe_tokens", // v69 uses 'subscribe_tokens' instead of 'subscribe'
                symbols: tokensToSubscribe, // v69 uses 'symbols' instead of 'tokens'
              }),
            );
          }
        }
      };

      // Handle incoming messages
      wsRef.current.onmessage = (event) => {
        try {
          const message: TokenDataMessage = JSON.parse(event.data);

          // Log received message type
          console.log(`[TokenDataWebSocket] Received message type: ${message.type}`);

          // Dispatch debug event for monitoring
          window.dispatchEvent(
            new CustomEvent("ws-debug", {
              detail: {
                type: "message",
                socketType: "token-data",
                endpoint: TOKEN_DATA_WSS_PATH,
                timestamp: new Date().toISOString(),
                data: { 
                  messageType: message.type,
                  hasData: !!message.data,
                  symbol: message.symbol || null,
                  count: message.count || null
                }
              },
            })
          );

          // Handle different message types - adapted for v69 WebSocket format
          switch (message.type) {
            case "token_update":
              // v69 version sends data in the 'data' field, not 'tokens' field
              if (message.data && Array.isArray(message.data)) {
                console.log(`[TokenDataWebSocket] Processing token update with ${message.data.length} tokens`);
                
                // Enhanced token data with more realistic changes for animations
                const enhancedTokens = message.data.map((token) => {
                  // Generate 5-minute change if not provided
                  // This ensures our animations respond to shorter timeframe changes
                  if (!token.change5m) {
                    // Base 5m change on 24h change but with higher volatility
                    const baseChange = parseFloat(token.change24h || "0");
                    // More volatile in short timeframe but in same direction typically
                    const volatilityFactor = 0.5 + Math.random(); // 0.5 to 1.5
                    const fiveMinChange = (
                      (baseChange * volatilityFactor) /
                      4.8
                    ).toFixed(2);
                    token.change5m = fiveMinChange;
                  }

                  // Generate 1-hour change if not provided
                  if (!token.change1h) {
                    const baseChange = parseFloat(token.change24h || "0");
                    const volatilityFactor = 0.6 + Math.random() * 0.8; // 0.6 to 1.4
                    const hourChange = (
                      (baseChange * volatilityFactor) /
                      2.4
                    ).toFixed(2);
                    token.change1h = hourChange;
                  }

                  return token;
                });

                setTokens(enhancedTokens);
                setLastUpdate(new Date());

                // Dispatch custom event for debugging
                window.dispatchEvent(
                  new CustomEvent("webSocketDebug", {
                    detail: {
                      type: "message",
                      message: "Token data update received",
                      data: {
                        tokenCount: enhancedTokens.length,
                        timestamp: message.timestamp || new Date().toISOString(),
                      },
                    },
                  }),
                );

                // Simulate frequent 5-minute changes to make animations more dynamic
                startSimulating5MinChanges();
              }
              break;

            // v69 uses 'token_data' for single token updates
            case "token_data":
              if (message.symbol && message.data) {
                console.log(`[TokenDataWebSocket] Processing token data for ${message.symbol}`);
                
                // Update single token price with enhanced 5m data
                setTokens((prev) => {
                  const updatedTokens = prev.map((token) => {
                    if (token.symbol === message.symbol) {
                      // Calculate new 5m change - sometimes opposite direction from 24h for realism
                      const baseChange = parseFloat(
                        message.data.change24h || "0",
                      );
                      const randomFactor = Math.random() > 0.7 ? -1 : 1; // 30% chance of opposite direction
                      const volatilityFactor = 0.5 + Math.random(); // 0.5 to 1.5
                      const fiveMinChange = (
                        (baseChange * randomFactor * volatilityFactor) /
                        4.8
                      ).toFixed(2);

                      return {
                        ...token,
                        ...message.data, // Apply all the new data
                        // Add dynamic changes if not provided
                        change5m: message.data.change5m || fiveMinChange,
                        change1h:
                          message.data.change1h ||
                          ((baseChange * volatilityFactor) / 2.4).toFixed(2),
                      };
                    }
                    return token;
                  });

                  // Keep simulating changes for these tokens
                  startSimulating5MinChanges();
                  return updatedTokens;
                });
                setLastUpdate(new Date());
              }
              break;

            // v69 uses 'token_metadata' for metadata updates (same as original)
            case "token_metadata":
              if (message.symbol && message.data) {
                console.log(`[TokenDataWebSocket] Processing token metadata for ${message.symbol}`);
                
                // Update token metadata - note the change from message.token to message.symbol
                setTokens((prev) =>
                  prev.map((token) =>
                    token.symbol === message.symbol
                      ? { ...token, ...message.data }
                      : token,
                  ),
                );
              }
              break;

            // v69 token subscription success notification
            case "tokens_subscribed":
              console.log(`[TokenDataWebSocket] Successfully subscribed to ${message.count} tokens`);
              break;

            // v69 subscription errors are sent as custom error types
            case "error":
              const errorMsg = message.error || "Unknown WebSocket error";
              const errorCode = message.code || "UNKNOWN";

              console.error(`[TokenDataWebSocket] Error: ${errorCode} - ${errorMsg}`);
              setError(errorMsg);
              
              // Dispatch error event for monitoring
              window.dispatchEvent(
                new CustomEvent("ws-debug", {
                  detail: {
                    type: "error",
                    socketType: "token-data",
                    endpoint: TOKEN_DATA_WSS_PATH,
                    timestamp: new Date().toISOString(),
                    data: { 
                      code: errorCode,
                      message: errorMsg
                    }
                  },
                })
              );

              // Even on error, maintain fallback data for animations
              if (tokens.length === 0) {
                setTokens(FALLBACK_TOKENS);
                setLastUpdate(new Date());
                startSimulating5MinChanges();
              }
              break;

            // Handle market updates (similar to token updates but for market overview)
            case "market_update":
              if (message.data && Array.isArray(message.data)) {
                console.log(`[TokenDataWebSocket] Processing market update with ${message.data.length} items`);
                
                // Process the same as token_update
                const enhancedTokens = message.data.map((token) => {
                  // Enhancement logic (same as token_update)
                  if (!token.change5m) {
                    const baseChange = parseFloat(token.change24h || "0");
                    const volatilityFactor = 0.5 + Math.random();
                    token.change5m = (
                      (baseChange * volatilityFactor) /
                      4.8
                    ).toFixed(2);
                  }

                  if (!token.change1h) {
                    const baseChange = parseFloat(token.change24h || "0");
                    const volatilityFactor = 0.6 + Math.random() * 0.8;
                    token.change1h = (
                      (baseChange * volatilityFactor) /
                      2.4
                    ).toFixed(2);
                  }

                  return token;
                });

                setTokens(enhancedTokens);
                setLastUpdate(new Date());
                startSimulating5MinChanges();
              }
              break;
              
            // Handle authentication response
            case "auth_success":
              console.log("[TokenDataWebSocket] Authentication successful");
              break;
              
            case "auth_error":
              console.error("[TokenDataWebSocket] Authentication failed:", message.error);
              break;
              
            default:
              console.warn("[TokenDataWebSocket] Unknown message type:", message.type);
          }
        } catch (err) {
          console.error("[TokenDataWebSocket] Failed to parse message:", err);
          
          // Dispatch error event for monitoring
          window.dispatchEvent(
            new CustomEvent("ws-debug", {
              detail: {
                type: "error",
                socketType: "token-data",
                endpoint: TOKEN_DATA_WSS_PATH,
                timestamp: new Date().toISOString(),
                data: { 
                  parseError: true,
                  message: (err as Error).message
                }
              },
            })
          );

          // On parsing error, maintain fallback data for animations
          if (tokens.length === 0) {
            setTokens(FALLBACK_TOKENS);
            setLastUpdate(new Date());
            startSimulating5MinChanges();
          }
        }
      };

      // Function to simulate frequent 5-minute change updates for more dynamic animations
      // This creates small price movements every few seconds to keep visualizations active
      function startSimulating5MinChanges() {
        // Clear any existing simulation interval
        if (simulationIntervalRef.current) {
          clearInterval(simulationIntervalRef.current);
        }

        // Create new simulation interval that updates 5m changes every few seconds
        simulationIntervalRef.current = window.setInterval(() => {
          if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)
            return;

          setTokens((prev) =>
            prev.map((token) => {
              // Get current 5m change value
              const currentChange = parseFloat(token.change5m || "0");

              // Random movement with slight mean reversion
              const direction = Math.random() > 0.5 ? 1 : -1;
              // Mean reversion tendency - drift toward zero if far from it
              const reversion =
                currentChange !== 0 ? -Math.sign(currentChange) * 0.1 : 0;
              const randomWalk = Math.random() * 0.5 * direction;
              const smallChange = randomWalk + reversion;

              // Apply small change to current value
              const newChange = (currentChange + smallChange).toFixed(2);

              return {
                ...token,
                change5m: newChange,
              };
            }),
          );

          setLastUpdate(new Date());
        }, 5000); // Update every 5 seconds for smooth animation changes
      }

      wsRef.current.onclose = (event) => {
        console.log(`[TokenDataWebSocket] Connection closed with code ${event.code}`);
        setIsConnected(false);
        
        // Update connection counter
        window.DDActiveWebSockets = window.DDActiveWebSockets || {total: 0};
        window.DDActiveWebSockets.tokenData = window.DDActiveWebSockets.tokenData || 0;
        window.DDActiveWebSockets.total = window.DDActiveWebSockets.total || 0;
        window.DDActiveWebSockets.tokenData = Math.max(0, window.DDActiveWebSockets.tokenData - 1);
        window.DDActiveWebSockets.total = Math.max(0, window.DDActiveWebSockets.total - 1);
        console.log(`[TokenDataWebSocket] Active connections: ${window.DDActiveWebSockets.tokenData}, Total: ${window.DDActiveWebSockets.total}`);
        
        // Dispatch close event for monitoring
        window.dispatchEvent(
          new CustomEvent("ws-debug", {
            detail: {
              type: "close",
              socketType: "token-data",
              endpoint: TOKEN_DATA_WSS_PATH,
              timestamp: new Date().toISOString(),
              data: { 
                code: event.code,
                reason: event.reason || "No reason provided",
                wasClean: event.wasClean
              }
            },
          })
        );

        // Handle abnormal closures - code 1006 indicates abnormal closure
        if (event.code === 1006) {
          console.error(`[TokenDataWebSocket] Connection closed unexpectedly`);
        }

        // Clear any existing reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }

        // Simple reconnection with exponential backoff (only if not normal closure and not in maintenance mode)
        if (event.code !== 1000 && !maintenanceMode) {
          const delay = Math.min(
            30000, // Maximum delay of 30 seconds
            Math.pow(1.5, reconnectAttempts.current) * 1000 // Exponential backoff
          );
          
          console.log(`[TokenDataWebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1})`);
          
          // Schedule reconnection
          reconnectTimeoutRef.current = window.setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }

        // Even when disconnected, maintain fallback data and animations for UI
        if (tokens.length === 0) {
          setTokens(FALLBACK_TOKENS);
          setLastUpdate(new Date());
          startSimulating5MinChanges();
        }
      };

      wsRef.current.onerror = () => {
        console.error(`[TokenDataWebSocket] Connection error on ${TOKEN_DATA_WSS_PATH}`);
        
        // Dispatch error event for monitoring
        window.dispatchEvent(
          new CustomEvent("ws-debug", {
            detail: {
              type: "error",
              socketType: "token-data",
              endpoint: TOKEN_DATA_WSS_PATH,
              timestamp: new Date().toISOString(),
              data: { 
                connectionError: true,
                wsUrl: wsUrl,
                hostname: window.location.hostname
              }
            },
          })
        );
        
        setError(`WebSocket connection error`);
        
        // Show toast notification for token data connection error (rate-limited)
        // Only show once every 30 seconds to prevent excessive notifications
        if (Date.now() - lastTokenDataErrorToast > 30000) {
          showTokenDataErrorToast("Token data connection error. Attempting to reconnect...");
        }
        
        // Log detailed connection information for debugging
        console.debug(`[TokenDataWebSocket] Connection details:
          - Endpoint: ${TOKEN_DATA_WSS_PATH}
          - URL: ${wsUrl}
          - Hostname: ${window.location.hostname}
          - Protocol: ${window.location.protocol}
          - Ready State: ${wsRef.current ? wsRef.current.readyState : 'no connection'}
          - Timestamp: ${new Date().toISOString()}`
        );

        // Provide fallback data on WebSocket error to ensure UI remains functional
        if (tokens.length === 0) {
          setTokens(FALLBACK_TOKENS);
          setLastUpdate(new Date());
          startSimulating5MinChanges();
        }
      };
    } catch (err) {
      console.error(`[TokenDataWebSocket] Connection initialization error:`, err);
      
      // Dispatch error event for monitoring
      window.dispatchEvent(
        new CustomEvent("ws-debug", {
          detail: {
            type: "error",
            socketType: "token-data",
            endpoint: TOKEN_DATA_WSS_PATH,
            timestamp: new Date().toISOString(),
            data: { 
              initError: true,
              message: err instanceof Error ? err.message : String(err)
            }
          },
        })
      );
      
      setError(err instanceof Error ? err.message : "Failed to connect");

      // Provide fallback data on connection error to ensure UI remains functional
      if (tokens.length === 0) {
        console.log('[TokenDataWebSocket] Setting fallback token data for UI');
        setTokens(FALLBACK_TOKENS);
        setLastUpdate(new Date());

        // Create a local function to simulate changes for UI animations
        function startLocalSimulation() {
          console.log('[TokenDataWebSocket] Starting local simulation for UI animation');
          
          // Clear any existing simulation interval
          if (simulationIntervalRef.current) {
            clearInterval(simulationIntervalRef.current);
          }

          // Create new simulation interval with only 5m changes
          simulationIntervalRef.current = window.setInterval(() => {
            setTokens((prev) =>
              prev.map((token) => {
                const currentChange = parseFloat(token.change5m || "0");
                // Random direction for pure brownian motion
                const direction = Math.random() > 0.5 ? 1 : -1;
                const smallChange = Math.random() * 0.5 * direction;
                const newChange = (currentChange + smallChange).toFixed(2);

                return {
                  ...token,
                  change5m: newChange,
                };
              }),
            );

            setLastUpdate(new Date());
          }, 5000);
        }

        startLocalSimulation();
      }
      
      // Schedule a reconnection attempt using the same exponential backoff as in onclose
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      const delay = Math.min(
        30000,
        Math.pow(1.5, reconnectAttempts.current) * 1000
      );
      reconnectAttempts.current++;
      
      console.log(`[TokenDataWebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
      reconnectTimeoutRef.current = window.setTimeout(connect, delay);
    }
  }, [getAccessToken, maintenanceMode, tokensToSubscribe, tokens.length]);

  // Connect on mount, reconnect if tokens change
  useEffect(() => {
    console.log('[TokenDataWebSocket] Initializing token data WebSocket');
    connect();

    // Start with fallback data if needed (for immediate visuals)
    if (tokens.length === 0) {
      setTokens(FALLBACK_TOKENS);
      setLastUpdate(new Date());
    }

    return () => {
      console.log('[TokenDataWebSocket] Cleaning up token data WebSocket');
      
      if (wsRef.current) {
        console.log('[TokenDataWebSocket] Closing WebSocket connection');
        try {
          wsRef.current.close();
          wsRef.current = null;
        } catch (e) {
          console.error('[TokenDataWebSocket] Error during WebSocket close:', e);
        }
      } else {
        console.log('[TokenDataWebSocket] No WebSocket to close');
      }
      
      if (reconnectTimeoutRef.current) {
        console.log('[TokenDataWebSocket] Clearing reconnect timeout');
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = undefined;
      }
      
      if (simulationIntervalRef.current) {
        console.log('[TokenDataWebSocket] Clearing simulation interval');
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = undefined;
      }
    };
  }, [connect, tokens.length]);

  // Expose more complete API for the component using this hook
  return {
    tokens,                    // Token data array
    isConnected,               // Whether we have an active connection
    error,                     // Any error that occurred
    lastUpdate,                // When the data was last updated
    connect,                   // Function to manually attempt reconnection
    close: () => {             // Function to manually close the connection
      console.log('[TokenDataWebSocket] Manual close requested');
      
      if (wsRef.current) {
        try {
          wsRef.current.close();
          wsRef.current = null;
          
          // Update connection counter
          window.DDActiveWebSockets = window.DDActiveWebSockets || {total: 0};
          window.DDActiveWebSockets.tokenData = window.DDActiveWebSockets.tokenData || 0;
          window.DDActiveWebSockets.total = window.DDActiveWebSockets.total || 0;
          window.DDActiveWebSockets.tokenData = Math.max(0, window.DDActiveWebSockets.tokenData - 1);
          window.DDActiveWebSockets.total = Math.max(0, window.DDActiveWebSockets.total - 1);
          console.log(`[TokenDataWebSocket] Active connections: ${window.DDActiveWebSockets.tokenData}, Total: ${window.DDActiveWebSockets.total}`);
          
          console.log('[TokenDataWebSocket] Connection closed successfully');
        } catch (e) {
          console.error('[TokenDataWebSocket] Error while closing connection:', e);
        }
      }
      
      // Clear any reconnection timers
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = undefined;
      }
      
      // Clear simulation interval
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = undefined;
      }
    }
  };
}
```

---

## File: /home/websites/degenduel-fe/src/hooks/useContestChatWebSocket.ts

```typescript
// src/hooks/useContestChatWebSocket.ts

/**
 * This hook is used to connect to the contest chat WebSocket.
 * It is used to send and receive messages to and from the contest chat.
 * It is also used to join and leave the contest chat.
 *
 * @param contestId - The ID of the contest to connect to.
 * @returns An object containing the participants, messages, isRateLimited, error, sendMessage, joinRoom, and leaveRoom functions.
 */

import { useCallback, useEffect, useState } from "react";

import { useBaseWebSocket } from "./useBaseWebSocket";
import { useStore } from "../store/useStore";

/* Contest chat WebSocket */

// Message types from server
interface RoomStateMessage {
  type: "ROOM_STATE";
  participants: Array<{
    userId: string;
    nickname: string;
    isAdmin: boolean;
    profilePicture?: string;
  }>;
}

interface ChatMessage {
  type: "CHAT_MESSAGE";
  messageId: string;
  userId: string;
  nickname: string;
  isAdmin: boolean;
  text: string;
  timestamp: string;
  profilePicture?: string;
}

interface ParticipantJoinedMessage {
  type: "PARTICIPANT_JOINED";
  participant: {
    userId: string;
    nickname: string;
    isAdmin: boolean;
    profilePicture?: string;
  };
}

interface ParticipantLeftMessage {
  type: "PARTICIPANT_LEFT";
  userId: string;
}

// Error message from server
interface ErrorMessage {
  type: "ERROR";
  error: string;
  code: number;
}

// Message types to server
interface JoinRoomMessage {
  type: "JOIN_ROOM";
  contestId: string;
}

// Leave room message to server
interface LeaveRoomMessage {
  type: "LEAVE_ROOM";
  contestId: string;
}

// Send chat message to server
interface SendChatMessage {
  type: "SEND_CHAT_MESSAGE";
  contestId: string;
  text: string;
}

// Participant activity message from server
// interface ParticipantActivityMessage {
//   type: "PARTICIPANT_ACTIVITY";
//   contestId: string;
//   activityType: string;
//   details?: Record<string, any>;
// }

// Data structure for a server message
type ServerMessage =
  | RoomStateMessage
  | ChatMessage
  | ParticipantJoinedMessage
  | ParticipantLeftMessage
  | ErrorMessage;
// Client message types
// | JoinRoomMessage
// | LeaveRoomMessage
// | SendChatMessage
// | ParticipantActivityMessage

// Data structure for a chat participant
export interface ChatParticipant {
  userId: string;
  nickname: string;
  isAdmin: boolean;
  profilePicture?: string;
}

// Data structure for a chat message
export interface ChatMessageData {
  messageId: string;
  userId: string;
  nickname: string;
  isAdmin: boolean;
  text: string;
  timestamp: string;
  profilePicture?: string;
}

// Custom hook for the contest chat WebSocket connection
export const useContestChatWebSocket = (contestId: string) => {
  const { user } = useStore();
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle incoming messages from the server
  const handleMessage = useCallback((message: ServerMessage) => {
    switch (message.type) {
      case "ROOM_STATE":
        setParticipants(message.participants);
        break;
      case "CHAT_MESSAGE":
        setMessages((prev) => [
          ...prev,
          {
            messageId: message.messageId,
            userId: message.userId,
            nickname: message.nickname,
            isAdmin: message.isAdmin,
            text: message.text,
            timestamp: message.timestamp,
            profilePicture: message.profilePicture,
          },
        ]);
        break;
      case "PARTICIPANT_JOINED":
        setParticipants((prev) => [...prev, message.participant]);
        break;
      case "PARTICIPANT_LEFT":
        setParticipants((prev) =>
          prev.filter((p) => p.userId !== message.userId),
        );
        break;
      case "ERROR":
        setError(message.error);
        if (message.code === 4290) {
          setIsRateLimited(true);
          // Reset rate limit after 10 seconds
          setTimeout(() => setIsRateLimited(false), 10000);
        }
        break;
    }
  }, []);

  // Initialize the WebSocket connection using the v69 endpoint structure
  const ws = useBaseWebSocket({
    url: import.meta.env.VITE_WS_URL,
    endpoint: `/api/v69/ws/contest-chat`,
    socketType: "contest-chat",
    onMessage: handleMessage,
    heartbeatInterval: 30000, // 30 second heartbeat
    maxReconnectAttempts: 5,
  });

  // Join the room
  const joinRoom = useCallback(() => {
    const socket = ws.wsRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      const message: JoinRoomMessage = {
        type: "JOIN_ROOM",
        contestId: contestId.toString(),
      };
      socket.send(JSON.stringify(message));
    }
  }, [ws, contestId]);

  // Leave the room
  const leaveRoom = useCallback(() => {
    const socket = ws.wsRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      const message: LeaveRoomMessage = {
        type: "LEAVE_ROOM",
        contestId: contestId.toString(),
      };
      socket.send(JSON.stringify(message));
    }
  }, [ws, contestId]);

  // Send a message to the room
  const sendMessage = useCallback(
    (text: string) => {
      if (isRateLimited) {
        setError("You're sending messages too quickly. Please wait a moment.");
        return;
      }

      if (text.length > 200) {
        setError("Message too long (max 200 characters)");
        return;
      }

      const socket = ws.wsRef.current;
      if (socket && socket.readyState === WebSocket.OPEN) {
        const message: SendChatMessage = {
          type: "SEND_CHAT_MESSAGE",
          contestId: contestId.toString(),
          text,
        };
        socket.send(JSON.stringify(message));
      }
    },
    [ws, contestId, isRateLimited],
  );

  // Join room when component mounts and WebSocket is ready
  useEffect(() => {
    const socket = ws.wsRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      joinRoom();
    }

    // Leave room when component unmounts
    return () => {
      const socket = ws.wsRef.current;
      if (socket && socket.readyState === WebSocket.OPEN) {
        leaveRoom();
      }
    };
  }, [ws, joinRoom, leaveRoom]);

  return {
    participants,
    messages,
    isRateLimited,
    error,
    sendMessage,
    joinRoom,
    leaveRoom,
    // Expose the close method from the base WebSocket hook
    close: ws.close,
    currentUserId: user?.wallet_address || "",
  };
};
```

---

## File: /home/websites/degenduel-fe/src/hooks/useWalletWebSocket.ts

```typescript
import { useBaseWebSocket } from "./useBaseWebSocket";
import { useStore } from "../store/useStore";

interface WalletUpdate {
  type: "WALLET_UPDATED";
  data: {
    type: "created" | "statusChanged" | "balanceChanged";
    publicKey: string;
    balance?: number;
    status?: "active" | "inactive" | "locked";
    timestamp: string;
  };
}

interface TransferStarted {
  type: "TRANSFER_STARTED";
  data: {
    transfer_id: string;
    from: string;
    to: string;
    amount: number;
    token?: string;
    estimated_completion?: string;
    timestamp: string;
  };
}

interface TransferComplete {
  type: "TRANSFER_COMPLETE";
  data: {
    transfer_id: string;
    from: string;
    to: string;
    amount: number;
    status: "success" | "failed";
    final_amount?: number;
    fee?: number;
    error?: string;
    timestamp: string;
  };
}

interface WalletActivity {
  type: "WALLET_ACTIVITY";
  data: {
    wallet: string;
    activity_type: "login" | "logout" | "connect" | "disconnect";
    device_info?: string;
    ip_address?: string;
    location?: string;
    timestamp: string;
  };
}

type WalletMessage =
  | WalletUpdate
  | TransferStarted
  | TransferComplete
  | WalletActivity;

export const useWalletWebSocket = () => {
  const { updateWalletStatus, trackTransfer, updateWalletActivity } =
    useStore();

  const handleMessage = (message: WalletMessage) => {
    switch (message.type) {
      case "WALLET_UPDATED":
        updateWalletStatus(message.data);
        break;
      case "TRANSFER_STARTED":
        trackTransfer({
          transfer_id: message.data.transfer_id,
          from: message.data.from,
          to: message.data.to,
          amount: message.data.amount,
          token: message.data.token,
          timestamp: message.data.timestamp,
        });
        break;
      case "TRANSFER_COMPLETE":
        trackTransfer({
          transfer_id: message.data.transfer_id,
          from: message.data.from,
          to: message.data.to,
          amount: message.data.amount,
          status: message.data.status,
          error: message.data.error,
          timestamp: message.data.timestamp,
        });
        break;
      case "WALLET_ACTIVITY":
        updateWalletActivity(message.data);
        break;
    }
  };

  return useBaseWebSocket({
    url: import.meta.env.VITE_WS_URL,
    endpoint: "/api/v69/ws/wallet",
    socketType: "wallet",
    onMessage: handleMessage,
    heartbeatInterval: 30000, // 30 second heartbeat
    maxReconnectAttempts: 5,
  });
};
```

---

## File: /home/websites/degenduel-fe/src/hooks/useAnalyticsWebSocket.ts

```typescript
import { useBaseWebSocket } from "./useBaseWebSocket";
import { useStore } from "../store/useStore";

interface UserActivityUpdate {
  type: "user_activity_update";
  users: Array<{
    wallet: string;
    nickname: string;
    avatar_url: string;
    current_zone:
      | "TRADING"
      | "CONTESTS"
      | "PORTFOLIO"
      | "TOKENS"
      | "PROFILE"
      | "LEADERBOARD";
    previous_zone: string | null;
    wallet_balance: number;
    last_action: string;
    last_active: string;
    session_duration: number;
    is_whale: boolean;
  }>;
  timestamp: string;
}

interface SystemMetrics {
  type: "system_metrics";
  data: {
    active_users: number;
    total_contests: number;
    total_trades_24h: number;
    total_volume_24h: number;
    peak_concurrent_users: number;
    average_response_time: number;
    error_rate: number;
    timestamp: string;
  };
}

interface UserSegmentUpdate {
  type: "user_segment_update";
  data: {
    segment: string;
    user_count: number;
    average_balance: number;
    activity_score: number;
    retention_rate: number;
    timestamp: string;
  };
}

type AnalyticsMessage = UserActivityUpdate | SystemMetrics | UserSegmentUpdate;

export const useAnalyticsWebSocket = () => {
  const { updateUserActivity, updateSystemMetrics, updateUserSegments } =
    useStore();

  const handleMessage = (message: AnalyticsMessage) => {
    switch (message.type) {
      case "user_activity_update":
        updateUserActivity(message.users);
        break;
      case "system_metrics":
        updateSystemMetrics(message.data);
        break;
      case "user_segment_update":
        updateUserSegments(message.data);
        break;
    }
  };

  return useBaseWebSocket({
    url: import.meta.env.VITE_WS_URL,
    endpoint: "/api/v69/ws/analytics",
    socketType: "analytics",
    onMessage: handleMessage,
    heartbeatInterval: 30000, // 30 second heartbeat
    maxReconnectAttempts: 5,
  });
};
```

---

## File: /home/websites/degenduel-fe/src/hooks/useServiceWebSocket.ts

```typescript
import { useRef } from "react";

import { useBaseWebSocket } from "./useBaseWebSocket";
import { useStore } from "../store/useStore";

interface ServiceMessage {
  type: "service:state" | "service:metrics" | "service:alert";
  service: string;
  data: {
    status: string;
    metrics?: {
      uptime: number;
      latency: number;
      activeUsers: number;
    };
    alert?: {
      type: "info" | "warning" | "error";
      message: string;
    };
  };
  timestamp: string;
}

interface ServiceState {
  enabled: boolean;
  status: "active" | "stopped" | "error";
  last_started: string | null;
  last_stopped: string | null;
  last_error: string | null;
  stats: {
    operations: {
      total: number;
      successful: number;
      failed: number;
    };
    performance: {
      averageOperationTimeMs: number;
    };
    circuitBreaker?: {
      failures: number;
      isOpen: boolean;
      lastFailure: string | null;
    };
  };
}

// Map service status to store status
const mapServiceStatus = (
  status: ServiceState["status"],
): "online" | "offline" | "degraded" => {
  switch (status) {
    case "active":
      return "online";
    case "stopped":
      return "offline";
    case "error":
      return "degraded";
    default:
      return "offline";
  }
};

// Map alert severity to store alert type
const mapAlertType = (severity: string): "info" | "warning" | "error" => {
  switch (severity) {
    case "critical":
      return "error";
    case "warning":
      return "warning";
    default:
      return "info";
  }
};

// Add helper function for dispatching debug events
const dispatchDebugEvent = (
  type: "connection" | "state" | "alert" | "error" | "metrics",
  message: string,
  data?: any,
) => {
  window.dispatchEvent(
    new CustomEvent("ws-debug", {
      detail: {
        type,
        service: "service-websocket",
        message,
        data,
        timestamp: new Date().toISOString(),
      },
    }),
  );
};

export const useServiceWebSocket = () => {
  const { setServiceState, addServiceAlert } = useStore();
  const reconnectAttempts = useRef(0);
  const maxReconnectDelay = 30000; // 30 seconds

  const handleConnectionError = (error: Error) => {
    console.warn("[ServiceWebSocket] Connection error:", error);

    // Calculate exponential backoff delay
    const delay = Math.min(
      1000 * Math.pow(2, reconnectAttempts.current),
      maxReconnectDelay,
    );
    reconnectAttempts.current++;

    addServiceAlert(
      "error",
      `WebSocket connection lost. Retrying in ${Math.round(
        delay / 1000,
      )} seconds...`,
    );

    // Update service state to show disconnected status
    setServiceState("offline", {
      uptime: 0,
      latency: -1,
      activeUsers: 0,
    });
  };

  const handleReconnect = () => {
    reconnectAttempts.current = 0;
    addServiceAlert("info", "WebSocket connection restored");
  };

  const handleMessage = (message: ServiceMessage) => {
    try {
      dispatchDebugEvent("state", "Received service message", message);

      switch (message.type) {
        case "service:state": {
          const serviceState = message.data as ServiceState;
          const mappedStatus = mapServiceStatus(serviceState.status);

          dispatchDebugEvent(
            "state",
            `Service status mapped: ${serviceState.status} -> ${mappedStatus}`,
            { original: serviceState.status, mapped: mappedStatus },
          );

          setServiceState(
            mappedStatus,
            message.data.metrics || {
              uptime: 0,
              latency: 0,
              activeUsers: 0,
            },
          );
          break;
        }
        case "service:alert":
          if (message.data.alert) {
            const mappedType = mapAlertType(message.data.alert.type);

            dispatchDebugEvent(
              "alert",
              `Service alert mapped: ${message.data.alert.type} -> ${mappedType}`,
              { original: message.data.alert.type, mapped: mappedType },
            );

            addServiceAlert(mappedType, message.data.alert.message);
          }
          break;
        case "service:metrics":
          dispatchDebugEvent(
            "metrics",
            "Received service metrics",
            message.data.metrics,
          );
          break;
      }
    } catch (error) {
      console.error("[ServiceWebSocket] Error processing message:", error);
      addServiceAlert("error", "Error processing WebSocket message");
    }
  };

  return useBaseWebSocket({
    url: import.meta.env.VITE_WS_URL,
    endpoint: "/api/v69/ws/admin/services",
    socketType: "service",
    onMessage: handleMessage,
    onError: handleConnectionError,
    onReconnect: handleReconnect,
    heartbeatInterval: 30000, // 30 second heartbeat
    maxReconnectAttempts: 10,
    reconnectBackoff: true,
  });
};
```

---

## File: /home/websites/degenduel-fe/src/hooks/useSkyDuelWebSocket.ts

```typescript
import { useRef } from "react";

import { useBaseWebSocket } from "./useBaseWebSocket";
import { useStore } from "../store/useStore";

// SkyDuel service types
export interface ServiceNode {
  id: string;
  name: string;
  type: "api" | "worker" | "websocket" | "database" | "cache";
  status: "online" | "offline" | "degraded" | "restarting";
  health: number; // 0-100
  uptime: number; // seconds
  lastRestart: string | null;
  metrics: {
    cpu: number; // percentage
    memory: number; // percentage
    connections: number;
    requestsPerMinute: number;
    errorRate: number;
  };
  alerts: ServiceAlert[];
}

export interface ServiceAlert {
  id: string;
  severity: "info" | "warning" | "error" | "critical";
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface ServiceConnection {
  source: string;
  target: string;
  status: "active" | "degraded" | "failed";
  latency: number; // milliseconds
  throughput: number; // requests per second
}

interface SkyDuelState {
  nodes: ServiceNode[];
  connections: ServiceConnection[];
  systemStatus: {
    overall: "operational" | "degraded" | "outage";
    timestamp: string;
    message: string;
  };
}

// WebSocket message types
interface SkyDuelMessage {
  type:
    | "state_update"
    | "node_update"
    | "connection_update"
    | "alert"
    | "command_response";
  data: any;
  timestamp: string;
}

// Helper function for dispatching debug events
const dispatchDebugEvent = (
  type: "connection" | "state" | "alert" | "error" | "metrics" | "command",
  message: string,
  data?: any,
) => {
  window.dispatchEvent(
    new CustomEvent("ws-debug", {
      detail: {
        type,
        service: "skyduel-websocket",
        message,
        data,
        timestamp: new Date().toISOString(),
      },
    }),
  );
};

export const useSkyDuelWebSocket = () => {
  const { setSkyDuelState, addServiceAlert } = useStore();
  const reconnectAttempts = useRef(0);
  const maxReconnectDelay = 30000; // 30 seconds

  const handleConnectionError = (error: Error) => {
    console.warn("[SkyDuelWebSocket] Connection error:", error);

    // Calculate exponential backoff delay
    const delay = Math.min(
      1000 * Math.pow(2, reconnectAttempts.current),
      maxReconnectDelay,
    );
    reconnectAttempts.current++;

    addServiceAlert(
      "error",
      `SkyDuel WebSocket connection lost. Retrying in ${Math.round(
        delay / 1000,
      )} seconds...`,
    );

    dispatchDebugEvent("error", "Connection error", { error: error.message });
  };

  const handleReconnect = () => {
    reconnectAttempts.current = 0;
    addServiceAlert("info", "SkyDuel WebSocket connection restored");
    dispatchDebugEvent("connection", "Connection restored");
  };

  const handleMessage = (message: SkyDuelMessage) => {
    try {
      dispatchDebugEvent("state", "Received SkyDuel message", message);

      switch (message.type) {
        case "state_update":
          const skyDuelState = message.data as SkyDuelState;
          setSkyDuelState(skyDuelState);
          dispatchDebugEvent("state", "SkyDuel state updated", skyDuelState);
          break;

        case "node_update":
          dispatchDebugEvent("state", "Node update received", message.data);
          // We'll handle individual node updates in the store
          break;

        case "connection_update":
          dispatchDebugEvent(
            "state",
            "Connection update received",
            message.data,
          );
          // We'll handle individual connection updates in the store
          break;

        case "alert":
          if (message.data.alert) {
            const { severity, content } = message.data.alert;
            addServiceAlert(severity, content);
            dispatchDebugEvent(
              "alert",
              "SkyDuel alert received",
              message.data.alert,
            );
          }
          break;

        case "command_response":
          dispatchDebugEvent(
            "command",
            "Command response received",
            message.data,
          );
          break;
      }
    } catch (error) {
      console.error("[SkyDuelWebSocket] Error processing message:", error);
      addServiceAlert("error", "Error processing SkyDuel WebSocket message");
      dispatchDebugEvent("error", "Message processing error", { error });
    }
  };

  const webSocket = useBaseWebSocket({
    url: import.meta.env.VITE_WS_URL,
    endpoint: "/api/v69/ws/admin/skyduel",
    socketType: "skyduel",
    onMessage: handleMessage,
    onError: handleConnectionError,
    onReconnect: handleReconnect,
    heartbeatInterval: 15000, // 15 second heartbeat
    maxReconnectAttempts: 10,
    reconnectBackoff: true,
  });

  // Send a command to the SkyDuel system
  const sendCommand = (command: string, params: Record<string, any> = {}) => {
    const socket = webSocket.wsRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error(
        "[SkyDuelWebSocket] Cannot send command: socket not connected",
      );
      return false;
    }

    try {
      const commandMessage = {
        type: "command",
        command,
        params,
        timestamp: new Date().toISOString(),
      };

      socket.send(JSON.stringify(commandMessage));
      dispatchDebugEvent("command", `Command sent: ${command}`, {
        command,
        params,
      });
      return true;
    } catch (error) {
      console.error("[SkyDuelWebSocket] Error sending command:", error);
      dispatchDebugEvent("error", "Error sending command", {
        command,
        params,
        error,
      });
      return false;
    }
  };

  return {
    ...webSocket,
    sendCommand,
  };
};
```

---

## File: /home/websites/degenduel-fe/src/hooks/useSystemSettingsWebSocket.ts

```typescript
// src/hooks/useSystemSettingsWebSocket.ts

/**
 * This hook is used to get the system settings from the admin API.
 * It uses a WebSocket connection to get the settings and a fallback to the Admin API if the WebSocket connection fails.
 *
 * @returns {Object} An object containing the system settings, loading state, error state, and a function to refresh the settings.
 */

import { useEffect, useState } from "react";

import { useBaseWebSocket } from "./useBaseWebSocket";
import { WS_URL } from "../config/config";

// SPECIFICALLY FOR BACKGROUND SCENE SETTINGS
interface SystemSettings {
  background_scene?:
    | string
    | {
        enabled: boolean;
        scenes: Array<{
          name: string;
          enabled: boolean;
          zIndex: number;
          blendMode: string;
        }>;
      };
  [key: string]: any;
}

export function useSystemSettingsWebSocket() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Use the proper WebSocket URL from config
  //const { WS_URL } = require("../config/config"); // Moved to imports (top of file)

  // Connect to the admin WebSocket endpoint
  const { wsRef, status, close } = useBaseWebSocket({
    url: WS_URL,
    endpoint: "/api/v69/ws/admin/system-settings",
    socketType: "system-settings",
    onMessage: (message) => {
      try {
        // Only process relevant messages
        if (message.type === "SYSTEM_SETTINGS_UPDATE") {
          console.log("Received system settings update:", message.data);
          setSettings(message.data);
          setLoading(false);
          setLastUpdated(new Date());
        }
      } catch (err) {
        console.error("Error processing system settings update:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
      }
    },
  });

  // Request settings when connection is established
  useEffect(() => {
    const requestSettings = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN && loading) {
        wsRef.current.send(
          JSON.stringify({
            type: "GET_SYSTEM_SETTINGS",
            timestamp: Date.now(),
          }),
        );
      }
    };

    if (status === "online") {
      requestSettings();
    }
  }, [status, loading, wsRef]);

  // Fallback to REST API if WebSocket fails
  useEffect(() => {
    // Only use fallback if WebSocket is not connected after a timeout
    const fallbackTimer = setTimeout(async () => {
      if (loading && status !== "online") {
        try {
          console.log(
            "WebSocket fallback: Fetching system settings via Admin API",
          );
          const { admin } = await import("../services/api/admin");
          const data = await admin.getSystemSettings();
          setSettings(data);
          setLastUpdated(new Date());
        } catch (err) {
          console.error("Fallback fetch error:", err);
          setError(err instanceof Error ? err : new Error("Unknown error"));
        } finally {
          setLoading(false);
        }
      }
    }, 3000); // 3 second timeout before fallback

    return () => clearTimeout(fallbackTimer);
  }, [loading, status]);

  // Safety: Add function to manually refresh settings
  const refreshSettings = () => {
    setLoading(true);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "GET_SYSTEM_SETTINGS",
          timestamp: Date.now(),
        }),
      );
    } else {
      // Fallback to API if WebSocket is not connected
      import("../services/api/admin")
        .then(({ admin }) => admin.getSystemSettings())
        .then((data) => {
          setSettings(data);
          setLastUpdated(new Date());
          setLoading(false);
        })
        .catch((err) => {
          setError(err instanceof Error ? err : new Error("Unknown error"));
          setLoading(false);
        });
    }
  };

  // Utility method to update background scene settings
  const updateBackgroundScene = async (value: any) => {
    try {
      setLoading(true);
      const { admin } = await import("../services/api/admin");
      const result = await admin.updateSystemSettings(
        "background_scene",
        value,
      );
      setSettings((prev) =>
        prev
          ? { ...prev, background_scene: value }
          : { background_scene: value },
      );
      setLastUpdated(new Date());
      setLoading(false);
      return result;
    } catch (err) {
      console.error("Error updating background scene:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
      setLoading(false);
      throw err;
    }
  };

  return {
    settings,
    loading,
    error,
    lastUpdated,
    refreshSettings,
    updateBackgroundScene,
    close, // Expose the WebSocket close method
  };
}
```

---

## File: /home/websites/degenduel-fe/src/hooks/useServerStatusWebSocket.ts

```typescript
// src/hooks/useServerStatusWebSocket.ts

import { useState, useEffect } from "react";

import { useBaseWebSocket } from "./useBaseWebSocket";
import { ddApi } from "../services/dd-api";
import { useStore } from "../store/useStore";

export type ServerStatus = "online" | "maintenance" | "offline" | "error";

interface ServerStatusData {
  status: ServerStatus;
  message: string;
  timestamp: string;
  lastChecked: string;
}

/**
 * Hook for monitoring server status via WebSocket with HTTP fallback
 * Uses the new v69 Monitor WebSocket endpoint for real-time status updates
 */
export function useServerStatusWebSocket() {
  const [statusData, setStatusData] = useState<ServerStatusData>({
    status: "online",
    message: "Connecting to server...",
    timestamp: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);
  const { maintenanceMode } = useStore();

  // If maintenance mode is active in the store, always show maintenance status
  useEffect(() => {
    if (maintenanceMode) {
      setStatusData((prevData) => ({
        ...prevData,
        status: "maintenance",
        message: "System is in scheduled maintenance mode",
        lastChecked: new Date().toISOString(),
      }));
    }
  }, [maintenanceMode]);

  // Message handler for WebSocket data
  const handleMessage = (message: any) => {
    try {
      // Only process relevant status update messages
      if (message.type === "SERVER_STATUS_UPDATE" && message.data) {
        const { status, message: statusMessage, timestamp } = message.data;

        // Update status with the data from the WebSocket
        setStatusData({
          status: status as ServerStatus,
          message: statusMessage || getDefaultMessage(status as ServerStatus),
          timestamp,
          lastChecked: new Date().toISOString(),
        });

        setLoading(false);
      }
    } catch (err) {
      console.error("Error processing server status update:", err);
      setStatusData((prevData) => ({
        ...prevData,
        status: "error",
        message: "Error processing status data",
        lastChecked: new Date().toISOString(),
      }));
    }
  };

  // Handle WebSocket errors
  const handleError = (error: Error) => {
    console.warn("Server status WebSocket error:", error);

    // If we get a WebSocket error, don't immediately set status to error
    // Instead, fall back to HTTP polling in the useEffect below
  };

  // Connect to the status WebSocket using v69 endpoint
  const { status: socketStatus, close } = useBaseWebSocket({
    url: "", // Base URL will be determined by useBaseWebSocket
    endpoint: "/api/v69/ws/monitor",
    socketType: "server-status",
    onMessage: handleMessage,
    onError: handleError,
    heartbeatInterval: 30000, // 30-second heartbeat to keep connection alive
    maxReconnectAttempts: 5,
    reconnectBackoff: true,
    requiresAuth: false, // Status information should be public, no auth needed
  });

  // Fallback HTTP polling when WebSocket is not available
  useEffect(() => {
    // Skip if WebSocket is connected
    if (socketStatus === "online" || maintenanceMode) {
      return;
    }

    // Define the polling function
    const checkServerStatus = async () => {
      try {
        const response = await ddApi.fetch("/status");

        // Update status based on response
        if (response.status === 503) {
          setStatusData({
            status: "maintenance",
            message: "System is in scheduled maintenance mode",
            timestamp: new Date().toISOString(),
            lastChecked: new Date().toISOString(),
          });
        } else {
          setStatusData({
            status: "online",
            message: "Server is operating normally",
            timestamp: new Date().toISOString(),
            lastChecked: new Date().toISOString(),
          });
        }
      } catch (err) {
        // Differentiate between complete offline and other errors
        if (err instanceof Error && err.message.includes("Failed to fetch")) {
          setStatusData({
            status: "offline",
            message: "Unable to connect to server",
            timestamp: new Date().toISOString(),
            lastChecked: new Date().toISOString(),
          });
        } else if (err instanceof Error && err.message.includes("503")) {
          setStatusData({
            status: "maintenance",
            message: "System is in scheduled maintenance mode",
            timestamp: new Date().toISOString(),
            lastChecked: new Date().toISOString(),
          });
        } else {
          setStatusData({
            status: "error",
            message: "Server is experiencing issues",
            timestamp: new Date().toISOString(),
            lastChecked: new Date().toISOString(),
          });
        }
        console.error("Failed to check server status:", err);
      } finally {
        setLoading(false);
      }
    };

    // Initial check
    checkServerStatus();

    // Polling interval - 5 seconds when offline, 30 seconds when online
    const interval = setInterval(
      checkServerStatus,
      statusData.status === "offline" || statusData.status === "error"
        ? 5000
        : 30000,
    );

    return () => clearInterval(interval);
  }, [socketStatus, statusData.status, maintenanceMode]);

  // Utility function to get default status messages
  const getDefaultMessage = (status: ServerStatus): string => {
    switch (status) {
      case "online":
        return "Server is operating normally";
      case "maintenance":
        return "System is in scheduled maintenance mode";
      case "offline":
        return "Unable to connect to server";
      case "error":
        return "Server is experiencing issues";
      default:
        return "Unknown server status";
    }
  };

  return {
    status: statusData.status,
    message: statusData.message,
    timestamp: statusData.timestamp,
    lastChecked: statusData.lastChecked,
    loading,
    isWebSocketConnected: socketStatus === "online",
    close, // Expose the WebSocket close method
  };
}
```

---

## File: /home/websites/degenduel-fe/src/hooks/usePortfolioWebSocket.ts

```typescript
// src/hooks/usePortfolioWebSocket.ts

/**
 * This hook is used to get the portfolio updates from the portfolio service.
 * It uses a WebSocket connection to get the updates and a fallback to the Admin API if the WebSocket connection fails.
 * V69 version - Compatible with new v69 WebSocket server
 *
 * @returns {Object} An object containing the portfolio updates, loading state, error state, and a function to refresh the updates.
 */

import { useBaseWebSocket } from "./useBaseWebSocket";
import { WS_URL } from "../config/config";
import { useStore } from "../store/useStore";
import { useRef, useEffect } from "react";

// Enable for detailed WebSocket debugging
const WS_DEBUG = true;

// Portfolio WebSocket endpoint path - updated to match v69 documentation
const PORTFOLIO_WSS_PATH = `/api/v69/ws/portfolio`;

// Optional registry tracking active connections for debugging
window.DDActiveWebSockets = window.DDActiveWebSockets || {};
window.DDActiveWebSockets.portfolio = window.DDActiveWebSockets.portfolio || 0;

interface PortfolioUpdate {
  type: "PORTFOLIO_UPDATED";
  data: {
    tokens: Array<{
      symbol: string;
      name: string;
      amount: number;
      value: number;
    }>;
    total_value: number;
    performance_24h: number;
  };
  timestamp: string;
}

interface TradeExecution {
  type: "TRADE_EXECUTED";
  data: {
    trade_id: string;
    wallet_address: string;
    symbol: string;
    amount: number;
    price: number;
    timestamp: string;
    contest_id?: string;
  };
}

interface PriceUpdate {
  type: "PRICE_UPDATED";
  data: {
    symbol: string;
    price: number;
    change_24h: number;
    timestamp: string;
  };
}

type PortfolioMessage = PortfolioUpdate | TradeExecution | PriceUpdate;

export const usePortfolioWebSocket = () => {
  const { updatePortfolio, updateTokenPrice, addTradeNotification } =
    useStore();
  
  const wsRef = useRef<ReturnType<typeof useBaseWebSocket> | null>(null);

  const handleMessage = (message: PortfolioMessage) => {
    if (WS_DEBUG) {
      console.log(`[PortfolioWebSocket] Received message type: ${message.type}`);
    }
    
    switch (message.type) {
      case "PORTFOLIO_UPDATED":
        updatePortfolio(message.data);
        break;
      case "TRADE_EXECUTED":
        addTradeNotification(message.data);
        break;
      case "PRICE_UPDATED":
        updateTokenPrice(message.data);
        break;
    }
  };

  // Use WS_URL from config which handles proper environment detection
  const baseWsHook = useBaseWebSocket({
    url: WS_URL,
    endpoint: PORTFOLIO_WSS_PATH, // Updated to v69 endpoint
    socketType: "portfolio",
    onMessage: handleMessage,
    heartbeatInterval: 30000, // 30 second heartbeat
    maxReconnectAttempts: 5,
  });
  
  // Store the hook reference for cleanup
  wsRef.current = baseWsHook;

  // Update connection tracking count
  useEffect(() => {
    // Increment counter on mount
    window.DDActiveWebSockets.portfolio++;
    
    if (WS_DEBUG) {
      console.log(`[PortfolioWebSocket] Active connections: ${window.DDActiveWebSockets.portfolio}`);
    }
    
    // Dispatch connection event for monitoring
    window.dispatchEvent(
      new CustomEvent("ws-debug", {
        detail: {
          type: "connection-tracking",
          socketType: "portfolio",
          endpoint: PORTFOLIO_WSS_PATH,
          timestamp: new Date().toISOString(),
          data: { 
            activeCount: window.DDActiveWebSockets.portfolio
          }
        },
      })
    );
    
    // Decrement counter on unmount
    return () => {
      window.DDActiveWebSockets.portfolio--;
      
      if (WS_DEBUG) {
        console.log(`[PortfolioWebSocket] Active connections: ${window.DDActiveWebSockets.portfolio}`);
      }
      
      // Dispatch connection event for monitoring
      window.dispatchEvent(
        new CustomEvent("ws-debug", {
          detail: {
            type: "connection-tracking",
            socketType: "portfolio",
            endpoint: PORTFOLIO_WSS_PATH,
            timestamp: new Date().toISOString(),
            data: { 
              activeCount: window.DDActiveWebSockets.portfolio
            }
          },
        })
      );
      
      // Ensure the WebSocket is closed
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    ...baseWsHook,
    close: () => {
      if (WS_DEBUG) {
        console.log('[PortfolioWebSocket] Manual close requested');
      }
      
      if (wsRef.current) {
        wsRef.current.close();
        
        // Update connection counter on manual close
        window.DDActiveWebSockets.portfolio--;
        
        if (WS_DEBUG) {
          console.log(`[PortfolioWebSocket] Active connections: ${window.DDActiveWebSockets.portfolio}`);
        }
      }
    }
  };
};
```

---

## File: /home/websites/degenduel-fe/src/hooks/useMarketDataWebSocket.ts

```typescript
// src/hooks/useMarketDataWebSocket.ts

/**
 * This hook is used to connect to the market data WebSocket.
 * It is used to receive market data for a given symbol.
 * V69 version - Compatible with new v69 WebSocket server
 *
 * @param symbols - An array of symbols to subscribe to.
 * @returns An object containing the market price, volume, and sentiment functions.
 */

import { useBaseWebSocket } from "./useBaseWebSocket";
import { useStore } from "../store/useStore";
import { useRef, useEffect } from "react";
import { WS_URL } from "../config/config";

// Enable for detailed WebSocket debugging
const WS_DEBUG = true;

// Market data WebSocket endpoint path - updated to match v69 documentation
const MARKET_DATA_WSS_PATH = `/api/v69/ws/market`;

// Optional registry tracking active connections for debugging
window.DDActiveWebSockets = window.DDActiveWebSockets || {};
window.DDActiveWebSockets.market = window.DDActiveWebSockets.market || 0;

/* Market data WebSocket */

// Data structure for a market price message
interface MarketPrice {
  type: "MARKET_PRICE";
  data: {
    symbol: string;
    price: number;
    change_24h: number;
    volume_24h: number;
    high_24h: number;
    low_24h: number;
    timestamp: string;
  };
}

// Data structure for a market volume message
interface MarketVolume {
  type: "MARKET_VOLUME";
  data: {
    symbol: string;
    volume: number;
    trades_count: number;
    buy_volume: number;
    sell_volume: number;
    interval: "1m" | "5m" | "15m" | "1h" | "4h" | "1d";
    timestamp: string;
  };
}

// Data structure for a market sentiment message
interface MarketSentiment {
  type: "MARKET_SENTIMENT";
  data: {
    symbol: string;
    sentiment_score: number; // -1 to 1
    buy_pressure: number; // 0 to 1
    sell_pressure: number; // 0 to 1
    volume_trend: "increasing" | "decreasing" | "stable";
    timestamp: string;
  };
}

// Data structure for a market data message
type MarketDataMessage = MarketPrice | MarketVolume | MarketSentiment;

export const useMarketDataWebSocket = (symbols: string[]) => {
  const { updateMarketPrice, updateMarketVolume, updateMarketSentiment } =
    useStore();
    
  const wsRef = useRef<ReturnType<typeof useBaseWebSocket> | null>(null);

  // Handle incoming messages from the server
  const handleMessage = (message: MarketDataMessage) => {
    if (WS_DEBUG) {
      console.log(`[MarketDataWebSocket] Received message type: ${message.type}`);
    }
    
    switch (message.type) {
      case "MARKET_PRICE":
        updateMarketPrice(message.data);
        break;
      case "MARKET_VOLUME":
        updateMarketVolume(message.data);
        break;
      case "MARKET_SENTIMENT":
        updateMarketSentiment(message.data);
        break;
    }
  };

  // Initialize the WebSocket connection with v69 endpoint
  // V69 API uses a different pattern for symbol subscription
  // We include the symbols in the query string for backward compatibility
  // but also send a subscribe message after connection is established
  const endpoint = symbols.length ? 
    `${MARKET_DATA_WSS_PATH}?symbols=${symbols.join(",")}` : 
    MARKET_DATA_WSS_PATH;
    
  const baseWsHook = useBaseWebSocket({
    url: WS_URL,
    endpoint: endpoint,
    socketType: "market",
    onMessage: handleMessage,
    heartbeatInterval: 15000, // 15 second heartbeat for market data
    maxReconnectAttempts: 5,
  });
  
  // Store the hook reference for cleanup
  wsRef.current = baseWsHook;
  
  // Send subscription message after connection is established
  useEffect(() => {
    if (baseWsHook.wsRef.current?.readyState === WebSocket.OPEN && symbols.length > 0) {
      if (WS_DEBUG) {
        console.log(`[MarketDataWebSocket] Sending subscription for symbols: ${symbols.join(", ")}`);
      }
      
      baseWsHook.wsRef.current.send(
        JSON.stringify({
          type: "subscribe",
          symbols: symbols
        })
      );
    }
  }, [symbols, baseWsHook.wsRef.current?.readyState]);

  // Update connection tracking count
  useEffect(() => {
    // Increment counter on mount
    window.DDActiveWebSockets.market++;
    
    if (WS_DEBUG) {
      console.log(`[MarketDataWebSocket] Active connections: ${window.DDActiveWebSockets.market}`);
    }
    
    // Dispatch connection event for monitoring
    window.dispatchEvent(
      new CustomEvent("ws-debug", {
        detail: {
          type: "connection-tracking",
          socketType: "market",
          endpoint: endpoint,
          timestamp: new Date().toISOString(),
          data: { 
            activeCount: window.DDActiveWebSockets.market,
            symbolsCount: symbols.length
          }
        },
      })
    );
    
    // Decrement counter on unmount
    return () => {
      window.DDActiveWebSockets.market--;
      
      if (WS_DEBUG) {
        console.log(`[MarketDataWebSocket] Active connections: ${window.DDActiveWebSockets.market}`);
      }
      
      // Dispatch connection event for monitoring
      window.dispatchEvent(
        new CustomEvent("ws-debug", {
          detail: {
            type: "connection-tracking",
            socketType: "market",
            endpoint: endpoint,
            timestamp: new Date().toISOString(),
            data: { 
              activeCount: window.DDActiveWebSockets.market
            }
          },
        })
      );
      
      // Ensure the WebSocket is closed
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [endpoint, symbols.length]);

  return {
    ...baseWsHook,
    close: () => {
      if (WS_DEBUG) {
        console.log('[MarketDataWebSocket] Manual close requested');
      }
      
      if (wsRef.current) {
        wsRef.current.close();
        
        // Update connection counter on manual close
        window.DDActiveWebSockets.market--;
        
        if (WS_DEBUG) {
          console.log(`[MarketDataWebSocket] Active connections: ${window.DDActiveWebSockets.market}`);
        }
      }
    }
  };
};
```

---

### UI Components

## File: /home/websites/degenduel-fe/src/components/contest-chat/ContestChat.tsx

```typescript
import { formatDistanceToNow } from "date-fns";
import React, { useEffect, useRef, useState } from "react";

import { useContestChatWebSocket } from "../../hooks/useContestChatWebSocket";

// Default profile picture URL
const DEFAULT_PROFILE_PICTURE =
  "https://api.dicebear.com/7.x/avataaars/svg?seed=";

interface ContestChatProps {
  contestId: string;
  className?: string;
  onNewMessage?: () => void;
  adminType?: "admin" | "superadmin"; // Optional admin type for styling
}

export const ContestChat: React.FC<ContestChatProps> = ({
  contestId,
  className = "",
  onNewMessage,
  adminType,
}) => {
  const {
    participants,
    messages,
    isRateLimited,
    error,
    sendMessage,
    currentUserId,
    close, // Get the close function from the hook
  } = useContestChatWebSocket(contestId);
  
  // Properly clean up the WebSocket connection when component unmounts
  useEffect(() => {
    return () => {
      console.log(`[ContestChat] Closing WebSocket for contest ${contestId}`);
      close(); // Close the WebSocket connection
    };
  }, [contestId, close]);

  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }

    // Call onNewMessage if messages length increased and callback exists
    if (messages.length > prevMessagesLengthRef.current && onNewMessage) {
      onNewMessage();
    }

    prevMessagesLengthRef.current = messages.length;
  }, [messages, onNewMessage]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    // Add event listener for clicking outside the emoji picker
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+Enter to send message
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim() && !isRateLimited && !isSending) {
      setIsSending(true);
      sendMessage(messageText.trim());
      setMessageText("");

      // Reset sending state after a short delay
      setTimeout(() => {
        setIsSending(false);
        // Focus the input after sending
        if (messageInputRef.current) {
          messageInputRef.current.focus();
        }
      }, 300);
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setMessageText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    // Focus the input after selecting emoji
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (e) {
      return "just now";
    }
  };

  // Get profile picture URL, using default if none provided
  const getProfilePicture = (userId: string, profilePicture?: string) => {
    return profilePicture || `${DEFAULT_PROFILE_PICTURE}${userId}`;
  };

  // Get admin badge styling based on admin type
  const getAdminBadgeStyle = () => {
    if (adminType === "superadmin") {
      return "bg-yellow-900/50 text-yellow-300 border border-yellow-700/30";
    } else if (adminType === "admin") {
      return "bg-red-900/50 text-red-300 border border-red-700/30";
    } else {
      return "bg-purple-900/50 text-purple-300";
    }
  };

  // Get admin message styling based on admin type
  const getAdminMessageStyle = () => {
    if (adminType === "superadmin") {
      return "bg-yellow-900/20 border-l-2 border-yellow-500";
    } else if (adminType === "admin") {
      return "bg-red-900/20 border-l-2 border-red-500";
    } else {
      return "bg-purple-900/20 border-l-2 border-purple-500";
    }
  };

  // Get admin text color based on admin type
  const getAdminTextColor = () => {
    if (adminType === "superadmin") {
      return "text-yellow-400";
    } else if (adminType === "admin") {
      return "text-red-400";
    } else {
      return "text-purple-400";
    }
  };

  // Get send button gradient based on admin type
  const getSendButtonGradient = () => {
    if (adminType === "superadmin") {
      return "bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500";
    } else if (adminType === "admin") {
      return "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400";
    } else {
      return "bg-gradient-to-r from-brand-600 to-cyber-600 hover:from-brand-500 hover:to-cyber-500";
    }
  };

  // Get focus ring color based on admin type
  const getFocusRingColor = () => {
    if (adminType === "superadmin") {
      return "focus:ring-yellow-500";
    } else if (adminType === "admin") {
      return "focus:ring-red-500";
    } else {
      return "focus:ring-brand-500";
    }
  };

  // Get admin badge text
  const getAdminBadgeText = () => {
    if (adminType === "superadmin") {
      return "Super Admin";
    } else if (adminType === "admin") {
      return "Admin";
    } else {
      return "Admin";
    }
  };

  return (
    <div
      className={`contest-chat flex flex-col h-full bg-gray-900 rounded-lg shadow-lg overflow-hidden ${className}`}
    >
      {/* Header with room info */}
      <div className="chat-header bg-gray-800/90 p-3 border-b border-gray-700/80 flex justify-between items-center backdrop-blur-sm">
        <h3 className="text-lg font-bold text-white">Contest Chat</h3>
        <div className="text-sm text-gray-400 flex items-center">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
          {participants.length} online
          {adminType && (
            <span
              className={`ml-2 px-2 py-0.5 rounded text-xs ${getAdminBadgeStyle()}`}
            >
              {getAdminBadgeText()}
            </span>
          )}
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className={`ml-2 p-1 rounded transition-colors ${
              showParticipants
                ? "bg-brand-600 text-white"
                : "bg-gray-700 hover:bg-gray-600 text-gray-300"
            }`}
            title="Toggle participants list"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Participants sidebar - conditionally shown */}
        {showParticipants && (
          <div className="participants-sidebar w-1/3 max-w-[200px] bg-gray-800/70 border-r border-gray-700/50 p-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
              Participants
            </h4>
            <div className="space-y-1">
              {participants.map((participant) => (
                <div
                  key={participant.userId}
                  className="flex items-center p-2 rounded-md hover:bg-gray-700/50 transition-colors"
                >
                  <img
                    src={getProfilePicture(
                      participant.userId,
                      participant.profilePicture,
                    )}
                    alt={participant.nickname}
                    className="w-6 h-6 rounded-full mr-2"
                  />
                  <span className="text-sm text-gray-300 truncate">
                    {participant.nickname}
                  </span>
                  {participant.isAdmin && (
                    <span className="ml-1 text-xs text-purple-400">★</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages container */}
        <div
          className={`messages-container flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 ${
            showParticipants ? "w-2/3" : "w-full"
          }`}
        >
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 my-8">
              <div className="mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto text-gray-600 animate-pulse-slow"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p>No messages yet. Be the first to say hello!</p>
              <p className="text-xs mt-2 text-gray-600">
                Press Ctrl+Enter to send messages quickly
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.messageId}
                  className={`message mb-4 rounded-lg p-3 transition-all duration-300 hover:shadow-md ${
                    msg.isAdmin
                      ? getAdminMessageStyle()
                      : msg.userId === currentUserId
                        ? "self-message bg-brand-900/20 border-l-2 border-brand-500"
                        : "bg-gray-800/50"
                  } animate-fade-in`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      <img
                        src={getProfilePicture(msg.userId, msg.profilePicture)}
                        alt={msg.nickname}
                        className={`w-8 h-8 rounded-full ${
                          msg.isAdmin
                            ? "ring-2 ring-purple-500"
                            : msg.userId === currentUserId
                              ? "ring-2 ring-brand-500"
                              : ""
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span
                          className={`font-medium ${
                            msg.isAdmin
                              ? getAdminTextColor()
                              : msg.userId === currentUserId
                                ? "text-brand-400"
                                : "text-white"
                          }`}
                        >
                          {msg.nickname}
                        </span>
                        {msg.isAdmin && (
                          <span
                            className={`ml-2 px-1.5 py-0.5 rounded text-xs ${getAdminBadgeStyle()}`}
                          >
                            {getAdminBadgeText()}
                          </span>
                        )}
                        <span className="ml-2 text-xs text-gray-500">
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                      <p className="mt-1 text-gray-300 break-words">
                        {msg.text}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Message input form */}
      <form
        onSubmit={handleSubmit}
        className="p-3 bg-gray-800/90 border-t border-gray-700/80 backdrop-blur-sm"
      >
        {error && (
          <div className="mb-2 text-red-500 text-sm bg-red-900/20 p-2 rounded">
            {error}
          </div>
        )}
        {isRateLimited && (
          <div className="mb-2 text-yellow-500 text-sm bg-yellow-900/20 p-2 rounded">
            Please wait a moment before sending another message.
          </div>
        )}
        <div className="relative">
          <textarea
            ref={messageInputRef}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className={`w-full bg-gray-700 text-white rounded-md px-3 py-2 pr-24 resize-none focus:outline-none focus:ring-2 ${getFocusRingColor()} transition-all`}
            rows={2}
            disabled={isRateLimited || isSending}
          />

          {/* Emoji picker button */}
          <div className="absolute right-16 bottom-2">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-gray-400 hover:text-white p-1 rounded transition-colors"
              title="Add emoji"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>

            {/* Simple emoji picker */}
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="absolute bottom-10 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-2 w-64 z-10"
              >
                <div className="grid grid-cols-8 gap-1">
                  {[
                    "😀",
                    "😂",
                    "😊",
                    "😍",
                    "🤔",
                    "😎",
                    "👍",
                    "👏",
                    "🎉",
                    "🔥",
                    "❤️",
                    "👋",
                    "🙏",
                    "🤝",
                    "💪",
                    "🚀",
                    "✅",
                    "⭐",
                  ].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleEmojiSelect(emoji)}
                      className="text-xl p-1 hover:bg-gray-700 rounded transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!messageText.trim() || isRateLimited || isSending}
            className={`absolute right-2 bottom-2 ${getSendButtonGradient()} text-white px-3 py-1 rounded transition-all duration-300 
              ${
                !messageText.trim() || isRateLimited || isSending
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:shadow-md"
              }`}
          >
            {isSending ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Sending
              </span>
            ) : (
              <span className="flex items-center">
                Send
                <span className="ml-1 text-xs opacity-70">(Ctrl+Enter)</span>
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
```

---

## File: /home/websites/degenduel-fe/src/components/contest-chat/ContestChatManager.tsx

```typescript
import React, { useCallback, useEffect, useRef, useState } from "react";

import { FloatingContestChat } from "./FloatingContestChat";
import { useCustomToast } from "../../components/toast";
import { useUserContests } from "../../hooks/useUserContests";
import { UserContest } from "../../services/contestService";

export const ContestChatManager: React.FC = () => {
  const { contests, loading } = useUserContests();
  const { addToast } = useCustomToast();
  const [openChats, setOpenChats] = useState<string[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [minimizedChats] = useState<Record<string, boolean>>({});
  const [isButtonExpanded, setIsButtonExpanded] = useState(false);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showContestSelector, setShowContestSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const contestSelectorRef = useRef<HTMLDivElement>(null);
  const chatButtonRef = useRef<HTMLButtonElement>(null);
  const lastToastRef = useRef<string | null>(null); // Track last error to prevent duplicate toasts

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  // When contests change, don't auto-open chats - just update state
  useEffect(() => {
    if (!loading && contests.length > 0) {
      // No longer auto-open chats - only initialize active chat if needed
      if (!activeChat && contests.length > 0) {
        setActiveChat(contests[0].contestId);
      }
    }
  }, [contests, loading, activeChat]);

  // Update total unread count
  useEffect(() => {
    // This would be updated by the FloatingContestChat components
    const handleUnreadUpdate = (e: CustomEvent) => {
      setTotalUnreadCount((prev) => {
        const { contestId, count, action } = e.detail;
        if (action === "set") {
          return (
            prev -
            (minimizedChats[contestId]
              ? Number(minimizedChats[contestId])
              : 0) +
            Number(count)
          );
        } else if (action === "increment") {
          return prev + 1;
        } else if (action === "reset") {
          return (
            prev -
            (minimizedChats[contestId] ? Number(minimizedChats[contestId]) : 0)
          );
        }
        return prev;
      });
    };

    window.addEventListener(
      "contest-chat-unread" as any,
      handleUnreadUpdate as EventListener,
    );

    return () => {
      window.removeEventListener(
        "contest-chat-unread" as any,
        handleUnreadUpdate as EventListener,
      );
    };
  }, [minimizedChats]);

  // Handle WebSocket connection errors
  useEffect(() => {
    const handleWSError = (e: CustomEvent) => {
      if (e.detail?.type === "error") {
        console.log("Connection error");
        // If the connection error is due to a missing contestId, show a different message
        if (e.detail?.message && typeof e.detail.message === 'string' && e.detail.message.includes("Missing contestId")) {
          console.log("Missing contestId");
          const errorMsg = "Please select a contest to start chatting.";
          setConnectionError(errorMsg);
          
          // Only show toast if we haven't shown this error recently
          if (lastToastRef.current !== errorMsg) {
            addToast("info", errorMsg, "Contest Chat");
            lastToastRef.current = errorMsg;
          }
        } else {
          console.log("Chat connection lost. Trying to reconnect...");
          const errorMsg = "Chat connection lost. Trying to reconnect...";
          setConnectionError(errorMsg);
          
          // Only show toast if we haven't shown this error recently
          if (lastToastRef.current !== errorMsg) {
            
            // DEBUG
            console.log("PREV:", lastToastRef.current);

            addToast("warning", errorMsg, "WebSocket Connection");
            lastToastRef.current = errorMsg;

            // DEBUG
            console.log(" NEW:", errorMsg)

            // Reset the last toast after a delay to allow showing again if the error persists
            setTimeout(() => {
              lastToastRef.current = null;
            }, 10 * 1000); // 10 seconds cooldown
          }
        }
      } else if (e.detail?.type === "connection") {
        console.log("Connection established");
        setConnectionError(null);
        
        // If we had an error before, show connection success toast
        if (lastToastRef.current !== null) {
          addToast("success", "Chat connection restored", "WebSocket Connection");
          lastToastRef.current = null;
        }
      }
    };

    window.addEventListener("ws-debug" as any, handleWSError as EventListener);
    console.log("WebSocket connection listener added");

    return () => {
      window.removeEventListener(
        "ws-debug" as any,
        handleWSError as EventListener,
      );
      console.log("WebSocket connection listener removed");
    };
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+C to toggle chat selector
      if (e.altKey && e.key === "c") {
        e.preventDefault();
        setShowContestSelector((prev) => !prev);
        if (!showContestSelector && searchInputRef.current) {
          setTimeout(() => searchInputRef.current?.focus(), 100);
        }
      }

      // Escape to close contest selector
      if (e.key === "Escape" && showContestSelector) {
        setShowContestSelector(false);
      }

      // Alt+M to mark all as read
      if (e.altKey && e.key === "m" && totalUnreadCount > 0) {
        e.preventDefault();
        handleMarkAllAsRead();
      }

      // Alt+1-9 to switch between open chats
      if (e.altKey && !isNaN(parseInt(e.key)) && parseInt(e.key) > 0) {
        const chatIndex = parseInt(e.key) - 1;
        if (chatIndex < openChats.length) {
          e.preventDefault();
          handleActivateChat(openChats[chatIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showContestSelector, openChats, totalUnreadCount]);

  // Close contest selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showContestSelector &&
        contestSelectorRef.current &&
        !contestSelectorRef.current.contains(e.target as Node) &&
        chatButtonRef.current &&
        !chatButtonRef.current.contains(e.target as Node)
      ) {
        setShowContestSelector(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showContestSelector]);

  // Handle closing a chat
  const handleCloseChat = (contestId: string) => {
    setOpenChats((prev) => prev.filter((id) => id !== contestId));

    // If the closed chat was active, set a new active chat
    if (activeChat === contestId) {
      const remainingChats = openChats.filter((id) => id !== contestId);
      setActiveChat(remainingChats.length > 0 ? remainingChats[0] : null);
    }
  };

  // Handle activating a chat
  const handleActivateChat = (contestId: string) => {
    // If the chat isn't already open, add it to openChats
    if (!openChats.includes(contestId)) {
      setOpenChats((prev) => [...prev, contestId]);
    }
    setActiveChat(contestId);

    // On mobile, close the contest selector after selecting a chat
    if (isMobile) {
      setShowContestSelector(false);
    }
  };

  // Find contest by ID
  const getContestById = (contestId: string): UserContest | undefined => {
    return contests.find((contest) => contest.contestId === contestId);
  };

  // Mark all chats as read
  const handleMarkAllAsRead = useCallback(() => {
    setTotalUnreadCount(0);
    // Dispatch event to reset all unread counts
    window.dispatchEvent(new CustomEvent("contest-chat-mark-all-read"));
  }, []);

  // Filter contests based on search query
  const filteredContests = contests.filter((contest) =>
    contest.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Group contests by status
  const groupedContests = {
    active: filteredContests.filter((contest) => contest.status === "active"),
    upcoming: filteredContests.filter(
      (contest) => contest.status === "upcoming",
    ),
    completed: filteredContests.filter(
      (contest) => contest.status === "completed",
    ),
    other: filteredContests.filter(
      (contest) =>
        !["active", "upcoming", "completed"].includes(contest.status || ""),
    ),
  };

  // If no contests or all chats are closed, don't render anything
  if (loading || contests.length === 0) {
    return null;
  }

  return (
    <>
      {/* Connection error notification */}
      {connectionError && (
        <div className="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg z-50 animate-pulse">
          {connectionError}
        </div>
      )}

      {/* Chat toggle button - positioned higher on the page */}
      <div className="fixed bottom-1/3 right-4 z-50">
        <button
          ref={chatButtonRef}
          className={`group relative flex items-center ${
            isButtonExpanded ? "pr-4" : "pr-3"
          } pl-3 py-3 
            bg-gradient-to-r from-brand-600/90 to-cyber-600/90 hover:from-brand-500 hover:to-cyber-500
            text-white rounded-full shadow-lg transition-all duration-300 ease-in-out
            hover:shadow-xl hover:shadow-brand-500/20 transform hover:-translate-y-0.5`}
          onClick={() => {
            // Toggle contest selector
            setShowContestSelector(!showContestSelector);
            if (!showContestSelector && searchInputRef.current) {
              setTimeout(() => searchInputRef.current?.focus(), 100);
            }
          }}
          onMouseEnter={() => setIsButtonExpanded(true)}
          onMouseLeave={() => setIsButtonExpanded(false)}
          aria-label="Toggle chat"
          title="Toggle chat (Alt+C)"
        >
          {/* Animated glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-400/20 to-cyber-400/20 animate-pulse-slow"></div>

          {/* Icon */}
          <div className="relative z-10 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-6 w-6 ${
                isButtonExpanded ? "mr-2" : ""
              } transition-all duration-300`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>

            {/* Text that appears on hover */}
            <span
              className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out
                ${
                  isButtonExpanded
                    ? "max-w-24 opacity-100"
                    : "max-w-0 opacity-0"
                }`}
            >
              {contests.length} Contest{contests.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Notification badge */}
          {totalUnreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
              {totalUnreadCount > 9 ? "9+" : totalUnreadCount}
            </div>
          )}
        </button>
      </div>

      {/* Contest selector dropdown */}
      {showContestSelector && (
        <div
          ref={contestSelectorRef}
          className={`fixed z-40 bg-gray-900/95 backdrop-blur-md rounded-lg shadow-2xl border border-brand-500/30 transition-all duration-300 ease-in-out
            ${
              isMobile
                ? "bottom-0 left-0 right-0 rounded-b-none max-h-[70vh] overflow-y-auto"
                : "bottom-1/3 right-16 w-72"
            }`}
          style={{
            transform: showContestSelector
              ? "translateY(0)"
              : "translateY(20px)",
            opacity: showContestSelector ? 1 : 0,
          }}
        >
          {/* Header with search */}
          <div className="p-3 border-b border-gray-700/50 sticky top-0 bg-gray-900/95 backdrop-blur-md z-10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-bold">Contest Chats</h3>
              {totalUnreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded transition-colors"
                  title="Mark all as read (Alt+M)"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div
              className={`relative ${
                isSearchFocused ? "ring-2 ring-brand-500/50 rounded-md" : ""
              }`}
            >
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search contests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-md px-3 py-2 pr-8 focus:outline-none focus:border-brand-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1 flex justify-between">
              <span>
                {filteredContests.length} contest
                {filteredContests.length !== 1 ? "s" : ""}
              </span>
              <span className="text-gray-500">Alt+C to toggle</span>
            </div>
          </div>

          {/* Contest groups */}
          <div className="p-2 max-h-[50vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {/* Active contests */}
            {groupedContests.active.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center px-2 py-1 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <h4 className="text-green-400 text-xs font-semibold uppercase tracking-wider">
                    Active
                  </h4>
                </div>
                {groupedContests.active.map((contest, index) => (
                  <button
                    key={contest.contestId}
                    onClick={() => handleActivateChat(contest.contestId)}
                    className={`w-full text-left px-3 py-2 rounded-md mb-1 transition-all flex items-center justify-between
                      ${
                        openChats.includes(contest.contestId) &&
                        activeChat === contest.contestId
                          ? "bg-brand-600/30 text-white"
                          : "text-gray-300 hover:bg-gray-800/80"
                      }`}
                  >
                    <div className="flex items-center">
                      <span className="text-sm truncate max-w-[180px]">
                        {contest.name}
                      </span>
                      {index < 9 && (
                        <span className="ml-2 text-xs text-gray-500">
                          Alt+{index + 1}
                        </span>
                      )}
                    </div>
                    {openChats.includes(contest.contestId) && (
                      <span className="w-2 h-2 bg-brand-500 rounded-full"></span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Upcoming contests */}
            {groupedContests.upcoming.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center px-2 py-1 mb-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                  <h4 className="text-yellow-400 text-xs font-semibold uppercase tracking-wider">
                    Upcoming
                  </h4>
                </div>
                {groupedContests.upcoming.map((contest) => (
                  <button
                    key={contest.contestId}
                    onClick={() => handleActivateChat(contest.contestId)}
                    className={`w-full text-left px-3 py-2 rounded-md mb-1 transition-all flex items-center justify-between
                      ${
                        openChats.includes(contest.contestId) &&
                        activeChat === contest.contestId
                          ? "bg-brand-600/30 text-white"
                          : "text-gray-300 hover:bg-gray-800/80"
                      }`}
                  >
                    <span className="text-sm truncate max-w-[180px]">
                      {contest.name}
                    </span>
                    {openChats.includes(contest.contestId) && (
                      <span className="w-2 h-2 bg-brand-500 rounded-full"></span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Completed contests */}
            {groupedContests.completed.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center px-2 py-1 mb-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
                  <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                    Completed
                  </h4>
                </div>
                {groupedContests.completed.map((contest) => (
                  <button
                    key={contest.contestId}
                    onClick={() => handleActivateChat(contest.contestId)}
                    className={`w-full text-left px-3 py-2 rounded-md mb-1 transition-all flex items-center justify-between
                      ${
                        openChats.includes(contest.contestId) &&
                        activeChat === contest.contestId
                          ? "bg-brand-600/30 text-white"
                          : "text-gray-300 hover:bg-gray-800/80"
                      }`}
                  >
                    <span className="text-sm truncate max-w-[180px]">
                      {contest.name}
                    </span>
                    {openChats.includes(contest.contestId) && (
                      <span className="w-2 h-2 bg-brand-500 rounded-full"></span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Other contests */}
            {groupedContests.other.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center px-2 py-1 mb-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  <h4 className="text-purple-400 text-xs font-semibold uppercase tracking-wider">
                    Other
                  </h4>
                </div>
                {groupedContests.other.map((contest) => (
                  <button
                    key={contest.contestId}
                    onClick={() => handleActivateChat(contest.contestId)}
                    className={`w-full text-left px-3 py-2 rounded-md mb-1 transition-all flex items-center justify-between
                      ${
                        openChats.includes(contest.contestId) &&
                        activeChat === contest.contestId
                          ? "bg-brand-600/30 text-white"
                          : "text-gray-300 hover:bg-gray-800/80"
                      }`}
                  >
                    <span className="text-sm truncate max-w-[180px]">
                      {contest.name}
                    </span>
                    {openChats.includes(contest.contestId) && (
                      <span className="w-2 h-2 bg-brand-500 rounded-full"></span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* No results */}
            {filteredContests.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto mb-2 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p>No contests found matching "{searchQuery}"</p>
              </div>
            )}
          </div>

          {/* Mobile drawer handle */}
          {isMobile && (
            <div className="w-full flex justify-center py-1 border-t border-gray-800">
              <div className="w-10 h-1 bg-gray-700 rounded-full"></div>
            </div>
          )}
        </div>
      )}

      {/* Floating chat windows */}
      {openChats.map((contestId, index) => {
        const contest = getContestById(contestId);
        if (!contest) return null;

        // On mobile, only show the active chat
        if (isMobile && activeChat !== contestId) return null;

        // Render the floating chat window
        return (
          <FloatingContestChat
            key={contestId}
            contest={contest}
            position={isMobile ? 0 : index}
            isActive={activeChat === contestId}
            onActivate={() => handleActivateChat(contestId)}
            onClose={() => handleCloseChat(contestId)}
            className={isMobile ? "w-full left-0 right-0 mx-auto" : ""}
          />
        );
      })}
    </>
  );
};
```

---

## Backend WebSocket System

## File: /path/to/api/websocket/server.js (File not found)

This file was listed in the documentation script but could not be found on the system

---

## File: /path/to/api/websocket/tokenDataService.js (File not found)

This file was listed in the documentation script but could not be found on the system

---

## File: /path/to/api/websocket/contestChatService.js (File not found)

This file was listed in the documentation script but could not be found on the system

---

## File: /path/to/api/websocket/walletService.js (File not found)

This file was listed in the documentation script but could not be found on the system

---

## File: /path/to/api/websocket/analyticsService.js (File not found)

This file was listed in the documentation script but could not be found on the system

---

## File: /path/to/api/websocket/healthMonitor.js (File not found)

This file was listed in the documentation script but could not be found on the system

---

