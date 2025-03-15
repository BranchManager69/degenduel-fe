/**
 * WebSocketManager Component
 * 
 * Central component for initializing, monitoring and managing all WebSocket connections
 * in the application. This component should be rendered at the app root level.
 */

import React, { useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { initializeWebSocketTracking, dispatchWebSocketEvent } from '../../utils/wsMonitor';

// Import all WebSocket hooks that should be initialized at app start
// Import our standardized v69 WebSocket hooks
import { useServerStatusWebSocket } from './useServerStatusWebSocket';
import { useTokenDataWebSocket } from './useTokenDataWebSocket';
// These hooks will be implemented later using the same pattern
// import { useSystemSettingsWebSocket } from './useSystemSettingsWebSocket';
// import { useNotificationWebSocket } from './useNotificationWebSocket';

export const WebSocketManager: React.FC = () => {
  const { user } = useStore();
  const isLoggedIn = !!user;
  
  // Initialize core WebSockets that should always be connected
  const serverStatus = useServerStatusWebSocket();
  const tokenData = useTokenDataWebSocket();
  // These hooks will be implemented later using the same pattern
  // const systemSettings = useSystemSettingsWebSocket();
  
  // Initialize user-specific WebSockets only when logged in
  // const notifications = isLoggedIn ? useNotificationWebSocket() : null;
  
  // Initialize WebSocket tracking on mount
  useEffect(() => {
    // Initialize WebSocket tracking
    initializeWebSocketTracking();
    
    // Log initialization
    dispatchWebSocketEvent('init', {
      message: 'WebSocketManager initialized',
      timestamp: new Date().toISOString()
    });
    
    // Clean up on unmount
    return () => {
      // Close all WebSocket connections managed by this component
      serverStatus.close();
      tokenData.close();
      // These hooks will be implemented later
      // systemSettings.close();
      
      // if (notifications) {
      //   notifications.close();
      // }
      
      dispatchWebSocketEvent('cleanup', {
        message: 'WebSocketManager cleanup on unmount',
        timestamp: new Date().toISOString()
      });
    };
  }, []);
  
  // Log user authentication changes
  useEffect(() => {
    if (isLoggedIn && user) {
      dispatchWebSocketEvent('auth', {
        message: 'User authenticated, updating WebSocket connections',
        userId: user.wallet_address,
        hasSessionToken: !!user.session_token,
        timestamp: new Date().toISOString()
      });
    }
  }, [isLoggedIn, user?.wallet_address, user?.session_token]);
  
  // This is a utility component that doesn't render anything visible
  return null;
};

export default WebSocketManager;