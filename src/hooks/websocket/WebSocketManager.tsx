/**
 * WebSocketManager Component - V69 Standardized Version
 * 
 * Central component for initializing, monitoring and managing all WebSocket connections
 * in the application. This component should be rendered at the app root level.
 */

import React, { useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { useAuth } from '../../hooks/useAuth';
import { initializeWebSocketTracking, dispatchWebSocketEvent } from '../../utils/wsMonitor';

// Import all V69 WebSocket hooks
import { useServerStatusWebSocket } from './useServerStatusWebSocket';
import { useTokenDataWebSocket } from './useTokenDataWebSocket';
import { usePortfolioWebSocket } from './usePortfolioWebSocket';
import { useWalletWebSocket } from './useWalletWebSocket';
import { useNotificationWebSocket } from './useNotificationWebSocket';
import { useAchievementWebSocket } from './useAchievementWebSocket';
import { useMarketDataWebSocket } from './useMarketDataWebSocket';
import { useSystemSettingsWebSocket } from './useSystemSettingsWebSocket';

// Admin-only WebSocket hooks
import { useServiceWebSocket } from './useServiceWebSocket';
import { useCircuitBreakerSocket } from './useCircuitBreakerSocket';
import { useAnalyticsWebSocket } from './useAnalyticsWebSocket';
import { useSkyDuelWebSocket } from './useSkyDuelWebSocket';

const WebSocketManagerComponent: React.FC = () => {
  // Get auth state only once - prevent re-renders with useMemo
  const user = useStore(state => state.user);
  const authContext = useAuth();
  
  // Memoize all authentication state values
  const authState = React.useMemo(() => ({
    isLoggedIn: !!user,
    isAdmin: authContext.isAdmin(),
    hasJwt: !!user?.jwt
  }), [user?.wallet_address, user?.jwt, authContext]);
  
  // Memoize market tokens to prevent unnecessary re-renders
  const marketTokens = React.useMemo(() => ["SOL", "BULLY", "JUP"], []);
  
  // Log once on mount for debugging
  React.useEffect(() => {
    console.log("WebSocketManager mounted with auth state:", {
      isLoggedIn: authState.isLoggedIn,
      isAdmin: authState.isAdmin,
      hasJwt: authState.hasJwt
    });
    
    return () => {
      console.log("WebSocketManager unmounted");
    };
  }, []);
  
  // Initialize core WebSockets only when appropriate
  
  // Server status WebSocket needs auth - don't connect when not logged in
  const serverStatus = authState.isLoggedIn && authState.hasJwt ? useServerStatusWebSocket() : null;
  
  // Token data is public and can be used without auth
  const tokenData = useTokenDataWebSocket();
  
  // System settings WebSocket for background scene and other settings
  const systemSettings = useSystemSettingsWebSocket();
  
  // Initialize user-specific WebSockets only when logged in
  const notifications = authState.isLoggedIn ? useNotificationWebSocket() : null;
  const portfolio = authState.isLoggedIn ? usePortfolioWebSocket() : null;
  const wallet = authState.isLoggedIn ? useWalletWebSocket() : null;
  const achievements = authState.isLoggedIn ? useAchievementWebSocket() : null;
  
  // Default market tokens (using memoized value)
  const marketData = useMarketDataWebSocket(marketTokens);
  
  // Admin-only WebSockets
  const service = authState.isAdmin ? useServiceWebSocket() : null;
  const circuitBreaker = authState.isAdmin ? useCircuitBreakerSocket() : null;
  const analytics = authState.isAdmin ? useAnalyticsWebSocket() : null;
  const skyDuel = authState.isAdmin ? useSkyDuelWebSocket() : null;
  
  // Initialize WebSocket tracking on mount
  useEffect(() => {
    // Initialize WebSocket tracking
    initializeWebSocketTracking();
    
    // Log initialization
    dispatchWebSocketEvent('init', {
      message: 'WebSocketManager initialized (V69)',
      timestamp: new Date().toISOString()
    });
    
    // Clean up on unmount
    return () => {
      // Close all WebSocket connections managed by this component
      if (serverStatus) {
        serverStatus.close();
      }
      
      tokenData.close();
      systemSettings.close();
      
      if (notifications) {
        notifications.close();
      }
      
      if (portfolio) {
        portfolio.close();
      }
      
      if (wallet) {
        wallet.close();
      }
      
      if (achievements) {
        achievements.close();
      }
      
      marketData.close();
      
      // Admin-only connections
      if (service) {
        service.close();
      }
      
      if (circuitBreaker) {
        circuitBreaker.close();
      }
      
      if (analytics) {
        analytics.close();
      }
      
      if (skyDuel) {
        skyDuel.close();
      }
      
      dispatchWebSocketEvent('cleanup', {
        message: 'WebSocketManager cleanup on unmount',
        timestamp: new Date().toISOString()
      });
    };
  }, []);
  
  // Log user authentication changes
  useEffect(() => {
    if (authState.isLoggedIn && user) {
      dispatchWebSocketEvent('auth', {
        message: 'User authenticated, updating WebSocket connections',
        userId: user.wallet_address,
        hasJWT: !!user.jwt,
        hasSessionToken: !!user.session_token,
        timestamp: new Date().toISOString()
      });
    }
  }, [authState.isLoggedIn, user?.wallet_address, user?.jwt, user?.session_token]);
  
  // This is a utility component that doesn't render anything visible
  return null;
};

// Use React.memo to prevent unnecessary re-renders
export const WebSocketManager = React.memo(WebSocketManagerComponent, () => true);

// Also keep the default export for backward compatibility
export default WebSocketManager;