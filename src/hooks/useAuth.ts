// src/hooks/useAuth.ts

/**
 * This hook is used to check the user's authentication state and get an access token for WebSocket authentication.
 * It is used in the App component to initialize the auth state and get the access token for WebSocket authentication.
 */

import { useWallet as useAptosWallet } from "@aptos-labs/wallet-adapter-react";
import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";

import { useDebounce } from "./useDebounce";
import { useStore } from "../store/useStore";
import { NODE_ENV, authDebug } from "../config/config";
import { env } from "../config/env";
import { useJupiterWallet } from "./useJupiterWallet";

interface AuthState {
  user: any | null; // Using any temporarily since we're getting user from store
  loading: boolean;
  error: Error | null;
  isWalletConnected: boolean;
  walletAddress: string | undefined;
  // Add auth method tracking
  authMethods: {
    wallet?: { active: boolean; details?: any };
    privy?: { active: boolean; linked?: boolean; details?: any };
    twitter?: { active: boolean; linked?: boolean; details?: any };
    [key: string]: { active: boolean; linked?: boolean; details?: any } | undefined;
  };
  // Add active auth method
  activeAuthMethod: string | null;
}

// Auth hook
export function useAuth() {
  const store = useStore();
  
  // Choose between Jupiter wallet and Aptos wallet based on feature flag
  const { account, connected } = useAptosWallet();
  const jupiterWallet = useJupiterWallet();
  
  // Use Jupiter wallet when feature flag is enabled
  const walletConnected = env.USE_JUPITER_WALLET 
    ? (jupiterWallet?.isConnected || false)
    : connected;
  
  const walletAddress = env.USE_JUPITER_WALLET
    ? (jupiterWallet?.walletAddress || null)
    : account?.address;
    
  const [shouldCheck, setShouldCheck] = useState<boolean>(true);
  const [authState, setAuthState] = useState<AuthState>({
    user: store.user,
    loading: false,
    error: null,
    isWalletConnected: false,
    walletAddress: undefined,
    authMethods: {},
    activeAuthMethod: null,
  });

  // Track if a check is in progress
  const checkInProgress = React.useRef(false);
  const lastCheckTime = React.useRef(0);
  const MIN_CHECK_INTERVAL = 1000; // Minimum 1 second between checks

  // Check auth using comprehensive status endpoint
  const checkAuth = useCallback(async () => {
    // Prevent multiple simultaneous checks and respect minimum interval
    const now = Date.now();
    if (
      checkInProgress.current ||
      authState.loading ||
      now - lastCheckTime.current < MIN_CHECK_INTERVAL
    ) {
      authDebug('useAuth', 'Skipping check - too soon or already in progress');
      return;
    }

    try {
      checkInProgress.current = true;
      lastCheckTime.current = now;
      authDebug('useAuth', 'Checking comprehensive auth status...');
      setAuthState((prev) => ({ ...prev, loading: true }));

      // Use the comprehensive auth status endpoint
      const response = await axios.get("/api/auth/status", {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      });
      
      authDebug('useAuth', 'Comprehensive status response:', {
        status: response.status,
        data: response.data,
      });

      const isAuthenticated = response.data?.authenticated || false;
      const authMethods = response.data?.methods || {};
      
      // Find the active authentication method
      let activeMethod: string | null = null;
      for (const [method, status] of Object.entries(authMethods)) {
        if (status && (status as any).active) {
          activeMethod = method;
          break;
        }
      }
      
      // Get the user from the active method or from the response directly
      const user = 
        (activeMethod && authMethods[activeMethod]?.details) || 
        response.data?.user || 
        null;

      if (isAuthenticated && user) {
        const newState = {
          user,
          authMethods,
          activeAuthMethod: activeMethod,
          loading: false,
          error: null,
        };
        
        setAuthState((prev) => ({
          ...prev,
          ...newState,
        }));
        
        // If we have a user, update store and clear should check flag
        store.setUser(user);
        authDebug('useAuth', `Session valid - authenticated via ${activeMethod}`, { 
          user: user.nickname || user.wallet_address,
          method: activeMethod,
          authMethods 
        });
        setShouldCheck(false);
        
        // Log detailed auth method info
        Object.entries(authMethods).forEach(([method, info]) => {
          authDebug('useAuth', `Auth method: ${method}`, info);
        });
      } else {
        const newState = {
          user: null,
          authMethods,
          activeAuthMethod: null,
          loading: false,
          error: null,
        };
        
        setAuthState((prev) => ({
          ...prev,
          ...newState,
        }));
        
        authDebug('useAuth', 'No active authentication found', { 
          isAuthenticated,
          authMethods,
          receivedUser: !!response.data?.user 
        });
      }
    } catch (error: any) {
      // Only log detailed error if it's not a 401
      if (error?.response?.status !== 401) {
        authDebug('useAuth', 'Auth status check failed:', {
          message: error?.message,
          status: error?.response?.status,
          data: error?.response?.data,
        });
      } else {
        authDebug('useAuth', 'No authenticated session available');
      }

      setAuthState((prev) => ({
        ...prev,
        user: null,
        authMethods: {},
        activeAuthMethod: null,
        loading: false,
        error: error?.message,
      }));
    } finally {
      checkInProgress.current = false;
    }
  }, [store]);

  // Use a more aggressive debounce for the initial check
  const debouncedInitialCheck = useDebounce(shouldCheck, 2000);

  // Run auth check when debounced flag changes
  useEffect(() => {
    if (debouncedInitialCheck && !checkInProgress.current && !authState.user) {
      checkAuth();
    }
  }, [debouncedInitialCheck, checkAuth, authState.user]);

  // Initialize auth - only run once on mount
  useEffect(() => {
    authDebug('useAuth', 'Initializing auth hook');
    
    // Check for auth redirect parameters from third-party auth providers
    const searchParams = new URLSearchParams(window.location.search);
    
    // Check for Twitter auth redirect parameters
    if (searchParams.has('twitter_login') || searchParams.has('twitter_linked')) {
      authDebug('useAuth', 'Detected Twitter auth redirect, checking auth status', {
        twitter_login: searchParams.get('twitter_login'),
        twitter_linked: searchParams.get('twitter_linked')
      });
      setShouldCheck(true);
      
      // Preserve any stored navigation path before cleanup
      const storedRedirectPath = localStorage.getItem("auth_redirect_path");
      authDebug('useAuth', 'Checking for stored redirect path during Twitter auth', {
        hasStoredPath: !!storedRedirectPath,
        path: storedRedirectPath || 'none'
      });
      
      // Clean up URL parameters
      const url = new URL(window.location.href);
      if (searchParams.has('twitter_login')) url.searchParams.delete('twitter_login');
      if (searchParams.has('twitter_linked')) url.searchParams.delete('twitter_linked');
      
      // We don't delete the stored path - it will be used by LoginPage
      window.history.replaceState({}, '', url);
      
      // Proactively request WebSocket token after Twitter auth
      // This ensures we have a valid WebSocket token before WebSocket connection attempts
      setTimeout(() => {
        authDebug('useAuth', 'Proactively requesting WebSocket token after Twitter auth');
        getAccessToken().then(token => {
          if (token) {
            authDebug('useAuth', 'Successfully obtained WebSocket token after Twitter auth');
          }
        }).catch(error => {
          authDebug('useAuth', 'Error getting WebSocket token after Twitter auth', { error });
        });
      }, 1000); // Small delay to ensure auth check completes first
    }
    
    // Check for Privy auth redirect parameters
    if (searchParams.has('privy_login') || searchParams.has('privy_linked')) {
      authDebug('useAuth', 'Detected Privy auth redirect, checking auth status', {
        privy_login: searchParams.get('privy_login'),
        privy_linked: searchParams.get('privy_linked')
      });
      setShouldCheck(true);
      
      // Preserve any stored navigation path before cleanup
      const storedRedirectPath = localStorage.getItem("auth_redirect_path");
      authDebug('useAuth', 'Checking for stored redirect path during Privy auth', {
        hasStoredPath: !!storedRedirectPath,
        path: storedRedirectPath || 'none'
      });
      
      // Clean up URL parameters
      const url = new URL(window.location.href);
      if (searchParams.has('privy_login')) url.searchParams.delete('privy_login');
      if (searchParams.has('privy_linked')) url.searchParams.delete('privy_linked');
      
      // We don't delete the stored path - it will be used by LoginPage
      window.history.replaceState({}, '', url);
    }
    
    // Only trigger initial check if we don't have a user and no check is in progress
    if (!authState.user && !checkInProgress.current) {
      authDebug('useAuth', 'No user found on initialization, triggering auth check');
      setShouldCheck(true);
    }
    
    // Create a global debug function to expose auth state
    if (typeof window !== 'undefined') {
      (window as any).debugAuth = () => {
        authDebug('debugAuth', 'Current auth state', {
          user: authState.user,
          isAuthenticated: !!authState.user && !!authState.activeAuthMethod,
          activeAuthMethod: authState.activeAuthMethod,
          authMethods: authState.authMethods,
          isWalletConnected: authState.isWalletConnected,
          walletAddress: authState.walletAddress,
        });
        return authState;
      };
    }
  }, []); // Empty dependency array for initialization

  // Update auth state when store user or wallet state changes
  // This effect now only updates local state without triggering auth checks
  useEffect(() => {
    const isWalletConnected = walletConnected && !!walletAddress;
    
    // If wallet connection status changes, trigger a full auth check
    if (isWalletConnected !== authState.isWalletConnected) {
      if (isWalletConnected) {
        authDebug('useAuth', 'Wallet connection detected, checking auth status', {
          address: walletAddress,
          connected: walletConnected,
          adapter: env.USE_JUPITER_WALLET ? 'jupiter' : 'aptos'
        });
        // Wait a short time for wallet connection to complete
        setTimeout(() => setShouldCheck(true), 500);
      } else if (authState.isWalletConnected) {
        authDebug('useAuth', 'Wallet disconnected', {
          previousAddress: authState.walletAddress
        });
      }
    }
    
    // Update local state with wallet info
    const newState = {
      user: store.user || authState.user, // Only update user from store if it exists
      isWalletConnected,
      walletAddress: walletAddress || undefined, // Convert null to undefined to satisfy type
    };
    
    setAuthState(prev => ({
      ...prev,
      ...newState,
    }));
    
    authDebug('useAuth', 'Updated wallet connection state', {
      isWalletConnected,
      walletAddress,
      storeUser: !!store.user,
      adapter: env.USE_JUPITER_WALLET ? 'jupiter' : 'aptos'
    });
  }, [store.user, walletConnected, walletAddress, authState.isWalletConnected, authState.user, authState.walletAddress]);

  // Memoize role check functions
  const isSuperAdmin = useCallback((): boolean => {
    return authState.user?.role === "superadmin";
  }, [authState.user?.role]);

  const isAdmin = useCallback((): boolean => {
    return (
      authState.user?.role === "admin" || authState.user?.role === "superadmin"
    );
  }, [authState.user?.role]);

  const isFullyConnected = useCallback((): boolean => {
    return authState.isWalletConnected && !!authState.user;
  }, [authState.isWalletConnected, authState.user]);

  // Expose a function to trigger a new auth check
  const triggerAuthCheck = useCallback(() => {
    setShouldCheck(true);
  }, []);

  // Function to get an access token for WebSocket authentication
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      if (NODE_ENV === "development") {
        console.log(
          "[Auth] Requesting access token for WebSocket authentication",
        );
      }
      
      // Check if we already have a valid token to avoid unnecessary API calls
      if (authState.user?.wsToken) {
        if (NODE_ENV === "development") {
          console.log("[Auth] Using existing WebSocket token from state");
        }
        return authState.user.wsToken;
      }

      // Append timestamp to prevent caching
      const timestamp = new Date().getTime();
      const url = `/api/auth/token?_t=${timestamp}`;

      // Get fresh token from the server
      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        withCredentials: true,
        timeout: 5000, // 5 second timeout
      });
      
      if (NODE_ENV === "development") {
        console.log(
          `[Auth] Token response received from ${url}`,
          {
            hasToken: !!response.data?.token,
            expiresIn: response.data?.expiresIn || 'not specified',
            tokenLength: response.data?.token?.length || 0
          }
        );
      }

      // If we have a token, store it in the user object
      const token = response.data?.token;
      if (token && authState.user) {
        const user = store.user;
        if (user) {
          // Update the token in the store
          store.setUser({
            ...user,
            wsToken: token
          } as any);
          
          // Also update our local state
          setAuthState(prev => ({
            ...prev,
            user: prev.user ? {
              ...prev.user,
              wsToken: token
            } : null
          }));
        }
      }

      // Return the token or null if no token is available
      return token || null;
    } catch (error: any) {
      // Check if we have a JWT to work with - this is expected by the WebSocket system
      if (authState.user?.jwt) {
        console.log("[Auth] WebSocket token request failed, but we have JWT for authentication");
        return authState.user.jwt;
      }
      
      // Log the error
      console.error("[Auth] Failed to get WebSocket access token:", {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
        config: error?.config?.url,
      });

      return null;
    }
  }, [authState.user, store]);

  // Helper function to check for a specific auth method
  const isAuthMethodActive = useCallback((method: string): boolean => {
    return !!(authState.authMethods[method]?.active);
  }, [authState.authMethods]);

  // Helper to check if a method is linked
  const isAuthMethodLinked = useCallback((method: string): boolean => {
    return !!(authState.authMethods[method]?.linked);
  }, [authState.authMethods]);

  // General function to check authentication by any method
  const isAuthenticated = useCallback((): boolean => {
    return !!authState.user && !!authState.activeAuthMethod;
  }, [authState.user, authState.activeAuthMethod]);
  
  return {
    // User data
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    
    // Auth status
    isAuthenticated,
    activeAuthMethod: authState.activeAuthMethod,
    authMethods: authState.authMethods,
    
    // Method-specific status functions
    isWalletConnected: authState.isWalletConnected,
    walletAddress: authState.walletAddress,
    isWalletAuth: () => isAuthMethodActive('wallet'),
    isPrivyAuth: () => isAuthMethodActive('privy'),
    isTwitterAuth: () => isAuthMethodActive('twitter'),
    
    // Method linking status
    isPrivyLinked: () => isAuthMethodLinked('privy'),
    isTwitterLinked: () => isAuthMethodLinked('twitter'),
    
    // Role checks
    isSuperAdmin,
    isAdmin,
    isFullyConnected,
    
    // Actions
    checkAuth: triggerAuthCheck,
    getAccessToken,
  };
}
