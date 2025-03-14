/**
 * WebSocketManager.tsx
 * 
 * Central WebSocket management component that:
 * - Handles authentication
 * - Maintains connections to multiple WebSocket endpoints
 * - Provides connection status monitoring
 * - Ensures reliable reconnection
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { useAuth } from '../useAuth';
import { WEBSOCKET_ENDPOINTS, WebSocketEndpointType, WebSocketHookReturn } from './types';
import useWebSocket from './useWebSocket';

// Define interfaces for the context
interface WebSocketConnectionStatus {
  [key: string]: boolean;
}

interface WebSocketConnections {
  total: number;
  [key: string]: number | boolean;
}

interface WebSocketContextValue {
  // Core WebSockets
  monitor: WebSocketHookReturn;
  tokenData: WebSocketHookReturn;
  notifications: WebSocketHookReturn;
  portfolio: WebSocketHookReturn;
  circuit: WebSocketHookReturn;
  serverStatus: WebSocketHookReturn;
  
  // Additional WebSockets
  market: WebSocketHookReturn;
  contest: WebSocketHookReturn;
  achievements: WebSocketHookReturn;
  wallet: WebSocketHookReturn;
  analytics: WebSocketHookReturn;
  services: WebSocketHookReturn;

  // Connection status and utilities
  isConnected: WebSocketConnectionStatus;
  connections: WebSocketConnections;
  reconnectAll: () => void;
}

// Ensure endpoints are valid by validating them against the type
const validateEndpoint = (endpoint: string): endpoint is WebSocketEndpointType => {
  return Object.values(WEBSOCKET_ENDPOINTS).includes(endpoint as WebSocketEndpointType);
};

// Create the context
const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined);

interface WebSocketProviderProps {
  children: React.ReactNode;
}

/**
 * WebSocket Provider component
 * Sets up and manages all WebSocket connections
 */
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { user } = useStore();
  const { isAdmin } = useAuth();
  const token = user?.jwt || user?.session_token;
  const isAuthenticated = !!token;
  
  const [connections, setConnections] = useState<WebSocketConnections>({
    total: 0
  });
  
  // Validate all endpoints on mount (this uses the WebSocketEndpointType type)
  useEffect(() => {
    Object.values(WEBSOCKET_ENDPOINTS).forEach(endpoint => {
      if (!validateEndpoint(endpoint)) {
        console.error(`Invalid WebSocket endpoint: ${endpoint}`);
      }
    });
  }, []);
  
  // Create a WebSocket connection for each endpoint
  const monitorWs = useWebSocket(WEBSOCKET_ENDPOINTS.monitor, {
    token,
    reconnect: true,
    maxReconnectAttempts: 15,
    debug: true,
    onConnect: () => console.log('Monitor WebSocket connected'),
    onDisconnect: () => console.log('Monitor WebSocket disconnected'),
    autoConnect: isAuthenticated
  });
  
  const tokenDataWs = useWebSocket(WEBSOCKET_ENDPOINTS.tokenData, {
    token, 
    reconnect: true,
    maxReconnectAttempts: 15,
    debug: true,
    onConnect: () => console.log('Token Data WebSocket connected'),
    onDisconnect: () => console.log('Token Data WebSocket disconnected'),
    autoConnect: isAuthenticated
  });
  
  const notificationsWs = useWebSocket(WEBSOCKET_ENDPOINTS.notifications, {
    token,
    reconnect: true,
    maxReconnectAttempts: 15,
    debug: true,
    onConnect: () => console.log('Notifications WebSocket connected'),
    onDisconnect: () => console.log('Notifications WebSocket disconnected'),
    autoConnect: isAuthenticated
  });

  const portfolioWs = useWebSocket(WEBSOCKET_ENDPOINTS.portfolio , {
    token,
    reconnect: true,
    maxReconnectAttempts: 15,
    debug: true,
    onConnect: () => console.log('Portfolio WebSocket connected'),
    onDisconnect: () => console.log('Portfolio WebSocket disconnected'),
    autoConnect: isAuthenticated
  });

  const circuitWs = useWebSocket(WEBSOCKET_ENDPOINTS.circuit, {
    token,
    reconnect: true,
    maxReconnectAttempts: 15,
    debug: true,
    onConnect: () => console.log('Circuit Breaker WebSocket connected'),
    onDisconnect: () => console.log('Circuit Breaker WebSocket disconnected'),
    autoConnect: isAuthenticated && isAdmin()
  });

  const serverStatusWs = useWebSocket(WEBSOCKET_ENDPOINTS.serverStatus, {
    token,
    reconnect: true,
    maxReconnectAttempts: 15,
    debug: true,
    onConnect: () => console.log('Server Status WebSocket connected'),
    onDisconnect: () => console.log('Server Status WebSocket disconnected'),
    autoConnect: true // This one doesn't require auth
  });
  
  // Additional WebSocket connections
  const marketWs = useWebSocket(WEBSOCKET_ENDPOINTS.market, {
    token,
    reconnect: true,
    maxReconnectAttempts: 15,
    debug: true,
    onConnect: () => console.log('Market WebSocket connected'),
    onDisconnect: () => console.log('Market WebSocket disconnected'),
    autoConnect: isAuthenticated
  });
  
  const contestWs = useWebSocket(WEBSOCKET_ENDPOINTS.contest, {
    token,
    reconnect: true,
    maxReconnectAttempts: 15,
    debug: true,
    onConnect: () => console.log('Contest WebSocket connected'),
    onDisconnect: () => console.log('Contest WebSocket disconnected'),
    autoConnect: isAuthenticated
  });
  
  const achievementsWs = useWebSocket(WEBSOCKET_ENDPOINTS.achievements, {
    token,
    reconnect: true,
    maxReconnectAttempts: 15,
    debug: true,
    onConnect: () => console.log('Achievements WebSocket connected'),
    onDisconnect: () => console.log('Achievements WebSocket disconnected'),
    autoConnect: isAuthenticated
  });
  
  const walletWs = useWebSocket(WEBSOCKET_ENDPOINTS.wallet, {
    token,
    reconnect: true,
    maxReconnectAttempts: 15,
    debug: true,
    onConnect: () => console.log('Wallet WebSocket connected'),
    onDisconnect: () => console.log('Wallet WebSocket disconnected'),
    autoConnect: isAuthenticated
  });
  
  const analyticsWs = useWebSocket(WEBSOCKET_ENDPOINTS.analytics, {
    token,
    reconnect: true,
    maxReconnectAttempts: 15,
    debug: true,
    onConnect: () => console.log('Analytics WebSocket connected'),
    onDisconnect: () => console.log('Analytics WebSocket disconnected'),
    autoConnect: isAuthenticated && isAdmin()
  });
  
  const servicesWs = useWebSocket(WEBSOCKET_ENDPOINTS.services, {
    token,
    reconnect: true,
    maxReconnectAttempts: 15,
    debug: true,
    onConnect: () => console.log('Services WebSocket connected'),
    onDisconnect: () => console.log('Services WebSocket disconnected'),
    autoConnect: isAuthenticated && isAdmin()
  });
  
  // Track all connections for monitoring
  useEffect(() => {
    // Update connections status for monitoring
    setConnections({
      total: Object.keys(WEBSOCKET_ENDPOINTS).length,
      monitor: monitorWs.isConnected,
      tokenData: tokenDataWs.isConnected,
      notifications: notificationsWs.isConnected,
      portfolio: portfolioWs.isConnected,
      circuit: circuitWs.isConnected,
      serverStatus: serverStatusWs.isConnected,
      market: marketWs.isConnected,
      contest: contestWs.isConnected,
      achievements: achievementsWs.isConnected,
      wallet: walletWs.isConnected,
      analytics: analyticsWs.isConnected,
      services: servicesWs.isConnected
    });
    
    // Log connection status changes
    console.log('[WebSocketManager] WebSocket Connections:', connections);
  }, [
    // Core WebSockets
    monitorWs.isConnected,
    tokenDataWs.isConnected,
    notificationsWs.isConnected,
    portfolioWs.isConnected,
    circuitWs.isConnected,
    serverStatusWs.isConnected,
    
    // Additional WebSockets
    marketWs.isConnected,
    contestWs.isConnected,
    achievementsWs.isConnected,
    walletWs.isConnected,
    analyticsWs.isConnected,
    servicesWs.isConnected
  ]);

  // Reconnect all sockets when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      console.log('[WebSocketManager] Authentication state changed, reconnecting WebSockets');
      
      // Reconnect core WebSockets
      monitorWs.connect();
      tokenDataWs.connect();
      notificationsWs.connect();
      portfolioWs.connect();
      
      // Reconnect additional WebSockets
      marketWs.connect();
      contestWs.connect();
      achievementsWs.connect();
      walletWs.connect();
      
      // Admin-only connections
      if (isAdmin()) {
        circuitWs.connect();
        analyticsWs.connect();
        servicesWs.connect();
      }
    }
  }, [isAuthenticated, token, isAdmin]);
  
  // Provide WebSocket connections to children
  const wsContextValue: WebSocketContextValue = {
    // Core WebSocket connections
    monitor: monitorWs,
    tokenData: tokenDataWs,
    notifications: notificationsWs,
    portfolio: portfolioWs,
    circuit: circuitWs,
    serverStatus: serverStatusWs,
    
    // Additional WebSocket connections
    market: marketWs,
    contest: contestWs,
    achievements: achievementsWs,
    wallet: walletWs,
    analytics: analyticsWs,
    services: servicesWs,
    
    // Connection status
    isConnected: {
      monitor: monitorWs.isConnected,
      tokenData: tokenDataWs.isConnected,
      notifications: notificationsWs.isConnected,
      portfolio: portfolioWs.isConnected,
      circuit: circuitWs.isConnected,
      serverStatus: serverStatusWs.isConnected,
      market: marketWs.isConnected,
      contest: contestWs.isConnected,
      achievements: achievementsWs.isConnected,
      wallet: walletWs.isConnected,
      analytics: analyticsWs.isConnected,
      services: servicesWs.isConnected
    },
    
    // Overall status
    connections,
    
    // Helper function to reconnect all sockets
    reconnectAll: () => {
      // Reconnect core WebSockets
      monitorWs.connect();
      tokenDataWs.connect();
      notificationsWs.connect();
      portfolioWs.connect();
      circuitWs.connect();
      serverStatusWs.connect();
      
      // Reconnect additional WebSockets
      marketWs.connect();
      contestWs.connect();
      achievementsWs.connect();
      walletWs.connect();
      analyticsWs.connect();
      servicesWs.connect();
    }
  };
  
  return (
    <WebSocketContext.Provider value={wsContextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

/**
 * Hook to use WebSocket connections from any component
 */
export const useWebSocketManager = (): WebSocketContextValue => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketManager must be used within a WebSocketProvider');
  }
  return context;
};

export default WebSocketContext;