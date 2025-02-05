// src/hooks/useAuth.ts

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useCallback, useEffect, useState } from "react";
import { API_URL, DDAPI_DEBUG_MODE } from "../config/config";
import { useStore } from "../store/useStore";
import { useDebounce } from "./useDebounce";

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
  const debouncedShouldCheck = useDebounce(shouldCheck, 5000);
  const [authState, setAuthState] = useState<AuthState>({
    user: store.user,
    loading: false,
    error: null,
    isWalletConnected: false,
    walletAddress: undefined,
  });

  // Check auth
  const checkAuth = useCallback(async () => {
    try {
      // If debug mode is enabled, log the request
      if (DDAPI_DEBUG_MODE === "true") {
        console.log("[Auth Debug] Starting auth check");
      }

      // Set loading to true
      setAuthState((prev) => ({ ...prev, loading: true }));

      // Check auth
      const response = await fetch(`${API_URL}/auth/session`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      // If auth check fails, just update local state
      if (!response.ok) {
        setAuthState((prev) => ({
          ...prev,
          user: null,
          loading: false,
          error: new Error("Session expired"),
        }));
        return;
      }

      // Get the data
      const data = await response.json();

      // Update the auth state based on response
      if (!data.authenticated) {
        setAuthState((prev) => ({
          ...prev,
          user: null,
          loading: false,
          error: new Error("Session expired"),
        }));
      } else {
        setAuthState((prev) => ({
          ...prev,
          user: data.user,
          loading: false,
          error: null,
        }));
      }
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        user: null,
        loading: false,
        error: error instanceof Error ? error : new Error("Auth check failed"),
      }));
    } finally {
      setShouldCheck(false);
    }
  }, []);

  // Run auth check when debounced flag changes
  useEffect(() => {
    if (debouncedShouldCheck) {
      checkAuth();
    }
  }, [debouncedShouldCheck, checkAuth]);

  // Initialize auth - only run once on mount
  useEffect(() => {
    setShouldCheck(true);
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
  };
}
