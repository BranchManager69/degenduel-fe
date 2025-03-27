/**
 * WebSocketManager Component - V69 Standardized Version
 * 
 * Central component for initializing, monitoring and managing all WebSocket connections
 * in the application. This component should be rendered at the app root level.
 * 
 * IMPORTANT NOTE ON WEBSOCKET COMPRESSION:
 * Modern browsers automatically request WebSocket compression via the "permessage-deflate"
 * extension in the sec-websocket-extensions header. This can cause issues with some WebSocket
 * implementations. If experiencing connection problems, ensure the server is configured
 * to disable compression by setting "perMessageDeflate: false" in the WebSocket server options.
 * 
 * The browser's request for compression cannot be disabled on the client side using
 * the standard WebSocket API. This is a server-side configuration issue.
 */

import React, { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useStore } from '../../store/useStore';
import { dispatchWebSocketEvent, initializeWebSocketTracking } from '../../utils/wsMonitor';

// Import all V69 WebSocket hooks
import { useAchievementWebSocket } from './useAchievementWebSocket';
import { useMarketDataWebSocket } from './useMarketDataWebSocket';
import { useNotificationWebSocket } from './useNotificationWebSocket';
import { usePortfolioWebSocket } from './usePortfolioWebSocket';
import { useServerStatusWebSocket } from './useServerStatusWebSocket';
import { useSystemSettingsWebSocket } from './useSystemSettingsWebSocket';
import { useTokenDataWebSocket } from './useTokenDataWebSocket';
import { useWalletWebSocket } from './useWalletWebSocket';
// this list is incomplete!

// Admin-only WebSocket hooks
import { useAnalyticsWebSocket } from './useAnalyticsWebSocket';
import { useCircuitBreakerSocket } from './useCircuitBreakerSocket';
import { useServiceWebSocket } from './useServiceWebSocket';
import { useSkyDuelWebSocket } from './useSkyDuelWebSocket';
// this list is inaccurate!

const WebSocketManagerComponent: React.FC = () => {
  // Get auth state only once - prevent re-renders with useMemo
  const user = useStore(state => state.user);
  const authContext = useAuth();
  
  // Memoize all authentication state values
  const authState = React.useMemo(() => ({
    isLoggedIn: !!user,
    isAdmin: authContext.isAdmin(),
    hasWsToken: !!user?.wsToken, // Check for WebSocket token specifically
    hasJwt: !!user?.jwt,         // Keep this for compatibility
    // Add a new property to determine if authentication is possible
    canAuthenticate: !!user // If we have a user, we can authenticate
  }), [user?.wallet_address, user?.jwt, user?.wsToken, authContext]);
  
  // Memoize market tokens to prevent unnecessary re-renders
  const marketTokens = React.useMemo(() => ["SOL", "BULLY", "JUP"], []); // TODO: FIX!!!
  
  // Log once on mount for debugging
  React.useEffect(() => {
    console.log("WebSocketManager mounted with auth state:", {
      isLoggedIn: authState.isLoggedIn,
      isAdmin: authState.isAdmin,
      hasJwt: authState.hasJwt,
      hasWsToken: authState.hasWsToken,
      canAuthenticate: authState.canAuthenticate
    });
    
    return () => {
      console.log("WebSocketManager unmounted");
    };
  }, []);
  
  // Initialize core WebSockets only when appropriate
  
  // Token data is public and can be used without auth
  const tokenData = useTokenDataWebSocket();
  
  // System settings WebSocket for background scene and other settings
  const systemSettings = useSystemSettingsWebSocket();

  // Default market tokens (using memoized value)
  const marketData = useMarketDataWebSocket(marketTokens);
  
  // Server status WebSocket needs auth - use wsToken if available
  const serverStatus = authState.isLoggedIn && (authState.hasWsToken || authState.canAuthenticate) 
    ? useServerStatusWebSocket() 
    : null;
  
  // Initialize user-specific WebSockets only when user is logged in
  const notifications = authState.isLoggedIn ? useNotificationWebSocket() : null;
  const portfolio = authState.isLoggedIn ? usePortfolioWebSocket() : null;
  const wallet = authState.isLoggedIn ? useWalletWebSocket() : null;
  const achievements = authState.isLoggedIn ? useAchievementWebSocket() : null;
  
  // Initialize admin-only WebSockets only if user is admin
  const service = authState.isAdmin ? useServiceWebSocket() : null;
  const circuitBreaker = authState.isAdmin ? useCircuitBreakerSocket() : null;
  const analytics = authState.isAdmin ? useAnalyticsWebSocket() : null;
  const skyDuel = authState.isAdmin ? useSkyDuelWebSocket() : null;
  
  // Add automatic token retrieval mechanism
  useEffect(() => {
    // When user is logged in but doesn't have a WebSocket token, fetch one
    const fetchTokenIfNeeded = async () => {
      if (authState.isLoggedIn && !authState.hasWsToken) {
        try {
          console.log("WebSocketManager: Requesting WebSocket token...");
          const token = await authContext.getAccessToken();
          if (token) {
            console.log("WebSocketManager: Token received, updating user");
            // Check if we have a valid user with required properties
            if (user && user.wallet_address) {
              // Use the store's setUser method with the correct typing
              useStore.getState().setUser({
                ...user,
                wsToken: token // Store in dedicated wsToken field
              });
            }
          } else {
            console.warn("WebSocketManager: No token received from getAccessToken");
          }
        } catch (error) {
          console.error("WebSocketManager: Failed to get WebSocket token:", error);
        }
      }
    };
    
    fetchTokenIfNeeded();
  }, [authState.isLoggedIn, authState.hasWsToken, authContext, user]);

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