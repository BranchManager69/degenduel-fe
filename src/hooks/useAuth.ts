// src/hooks/useAuth.ts

/**
 * This hook is used to check the user's authentication state and get an access token for WebSocket authentication.
 * It is used in the App component to initialize the auth state and get the access token for WebSocket authentication.
 */

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";

import { useDebounce } from "./useDebounce";
import { useStore } from "../store/useStore";

const NODE_ENV = import.meta.env.VITE_NODE_ENV;

interface AuthState {
  user: any | null; // Using any temporarily since we're getting user from store
  loading: boolean;
  error: Error | null;
  isWalletConnected: boolean;
  walletAddress: string | undefined;
}

// Auth hook
export function useAuth() {
  const store = useStore();
  const { account, connected } = useWallet();
  const [shouldCheck, setShouldCheck] = useState<boolean>(true);
  const [authState, setAuthState] = useState<AuthState>({
    user: store.user,
    loading: false,
    error: null,
    isWalletConnected: false,
    walletAddress: undefined,
  });

  // Track if a check is in progress
  const checkInProgress = React.useRef(false);
  const lastCheckTime = React.useRef(0);
  const MIN_CHECK_INTERVAL = 1000; // Minimum 1 second between checks

  // Check auth
  const checkAuth = useCallback(async () => {
    // Prevent multiple simultaneous checks and respect minimum interval
    const now = Date.now();
    if (
      checkInProgress.current ||
      authState.loading ||
      now - lastCheckTime.current < MIN_CHECK_INTERVAL
    ) {
      console.log("[Auth] Skipping check - too soon or already in progress");
      return;
    }

    try {
      checkInProgress.current = true;
      lastCheckTime.current = now;
      console.log("[Auth] Checking session...");
      setAuthState((prev) => ({ ...prev, loading: true }));

      const response = await axios.get("/api/auth/session");
      console.log("[Auth] Session response:", {
        status: response.status,
        data: response.data,
      });

      if (response.data?.user) {
        setAuthState((prev) => ({
          ...prev,
          user: response.data.user,
          loading: false,
          error: null,
        }));
        console.log("[Auth] Session valid - user:", response.data.user.email);
        // Clear the should check flag since we have a user
        setShouldCheck(false);
      } else {
        setAuthState((prev) => ({
          ...prev,
          user: null,
          loading: false,
          error: null,
        }));
        console.log("[Auth] No active session");
      }
    } catch (error: any) {
      // Only log detailed error if it's not a 401
      if (error?.response?.status !== 401) {
        console.error("[Auth] Session check failed:", {
          message: error?.message,
          status: error?.response?.status,
          data: error?.response?.data,
        });
      } else {
        console.log("[Auth] No session available");
      }

      setAuthState((prev) => ({
        ...prev,
        user: null,
        loading: false,
        error: error?.message,
      }));
    } finally {
      checkInProgress.current = false;
    }
  }, []);

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
    // Only trigger initial check if we don't have a user and no check is in progress
    if (!authState.user && !checkInProgress.current) {
      setShouldCheck(true);
    }
  }, []); // Empty dependency array for initialization

  // Update auth state when store user or wallet state changes
  // This effect now only updates local state without triggering auth checks
  useEffect(() => {
    const newState = {
      user: store.user,
      isWalletConnected: connected && !!account?.address,
      walletAddress: account?.address,
    };

    setAuthState((prev) => ({
      ...prev,
      ...newState,
    }));
  }, [store.user, connected, account?.address]);

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

      // Append timestamp to prevent caching
      const timestamp = new Date().getTime();
      const url = `/api/auth/token?_t=${timestamp}`; // TODO: This previously led to 404. Has it been fixed?

      // Try to get the token from the session with detailed logging
      const response = await axios.get(url, {
        headers: {
          // Ensure credentials are sent
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        withCredentials: true,
        timeout: 5000, // 5 second timeout
      });
      if (NODE_ENV === "development") {
        const stringifiedWSTokenResponse = JSON.stringify(response.data);
        console.log(
          `[AUTHDEBUG] \n[useAuth] [getAccessToken] \n[${url}] \n[${stringifiedWSTokenResponse}]`,
        );
        console.log(`
          [WS TOKEN  ] ${response.data?.token}
          [WS EXPIRES] ${response.data?.expiresIn}
          `);
      }

      // Return the token or null if no token is available
      return response.data?.token || null;
    } catch (error: any) {
      // Log the error
      console.error("[Auth] Failed to get WSS access token:", {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
        config: error?.config?.url,
      });

      return null;
    }
  }, []);

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    isWalletConnected: authState.isWalletConnected,
    walletAddress: authState.walletAddress,
    isSuperAdmin,
    isAdmin,
    isFullyConnected,
    checkAuth: triggerAuthCheck, // Replace checkAuth with the debounced version
    getAccessToken, // New WSS getAccessToken function
  };
}
