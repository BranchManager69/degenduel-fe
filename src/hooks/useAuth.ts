// src/hooks/useAuth.ts

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useEffect, useState } from "react";
import { API_URL, DDAPI_DEBUG_MODE } from "../config/config";
import { useStore } from "../store/useStore";

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
  const [authState, setAuthState] = useState<AuthState>({
    user: store.user,
    loading: true, // Start with loading true
    error: null,
    isWalletConnected: false,
    walletAddress: undefined,
  });

  // Check auth
  const checkAuth = async () => {
    try {
      // If debug mode is enabled, log the request
      if (DDAPI_DEBUG_MODE === "true") {
        console.log("[Auth Debug] Starting auth check", {
          currentCookies: document.cookie,
          parsedCookies: document.cookie.split(";").reduce((acc, cookie) => {
            const [key, value] = cookie.split("=").map((c) => c.trim());
            return { ...acc, [key]: value };
          }, {}),
          cookieEnabled: navigator.cookieEnabled,
          protocol: window.location.protocol,
          host: window.location.host,
          origin: window.location.origin,
        });
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

      // Log the response if debug mode is enabled
      if (DDAPI_DEBUG_MODE === "true") {
        console.log("[Auth Debug] Session check response:", {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries([...response.headers]),
          url: response.url,
        });
      }

      // If auth check fails, clear the stored state
      if (!response.ok) {
        // Log the failure if debug mode is enabled
        if (DDAPI_DEBUG_MODE === "true") {
          console.log("[Auth Debug] Session check failed", {
            status: response.status,
            statusText: response.statusText,
          });
        }
        // Clear the stored state
        store.disconnectWallet();
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

      // Log the data if debug mode is enabled
      if (DDAPI_DEBUG_MODE === "true") {
        console.log("[Auth Debug] Session check data:", data);
      }

      // If the user is not authenticated, clear the stored state
      if (!data.authenticated) {
        // Log the failure if debug mode is enabled
        if (DDAPI_DEBUG_MODE === "true") {
          console.log("[Auth Debug] Not authenticated");
        }
        store.disconnectWallet();
        setAuthState((prev) => ({
          ...prev,
          user: null,
          loading: false,
          error: new Error("Session expired"),
        }));
      } else {
        // Log the success if debug mode is enabled
        if (DDAPI_DEBUG_MODE === "true") {
          console.log("[Auth Debug] Successfully authenticated", {
            user: data.user,
            currentCookies: document.cookie,
          });
        }
        // Update the auth state
        setAuthState((prev) => ({
          ...prev,
          user: data.user,
          loading: false,
          error: null,
        }));
      }
    } catch (error) {
      // Log the error if debug mode is enabled
      if (DDAPI_DEBUG_MODE === "true") {
        console.error("[Auth Debug] Auth check error:", error);
      }
      // Clear the stored state
      store.disconnectWallet();
      setAuthState((prev) => ({
        ...prev,
        user: null,
        loading: false,
        error: error instanceof Error ? error : new Error("Auth check failed"),
      }));
    }
  };

  // Initialize auth
  useEffect(() => {
    // Check auth immediately on mount, regardless of store.user state
    const initializeAuth = async () => {
      // Log the initialization if debug mode is enabled
      if (DDAPI_DEBUG_MODE === "true") {
        console.log("[Auth Debug] Initializing auth state", {
          currentCookies: document.cookie,
          hasUser: !!store.user,
          origin: window.location.origin,
        });
      }

      try {
        // Check auth
        const response = await fetch(`${API_URL}/auth/session`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        // Log the response if debug mode is enabled
        if (DDAPI_DEBUG_MODE === "true") {
          console.log("[Auth Debug] Session check response:", {
            status: response.status,
            statusText: response.statusText,
          });
        }
        if (!response.ok) {
          throw new Error("Session check failed");
        }

        // Get the data
        const data = await response.json();

        // If the user is authenticated, update the store and local state
        if (data.authenticated && data.user) {
          // Update the store first
          store.setUser(data.user);
          // Then update local state
          setAuthState((prev) => ({
            ...prev,
            user: data.user,
            loading: false,
            error: null,
          }));
        } else {
          // If the user is not authenticated, clear the stored state
          store.disconnectWallet();
          setAuthState((prev) => ({
            ...prev,
            user: null,
            loading: false,
            error: new Error("Not authenticated"),
          }));
        }
      } catch (error) {
        // Log the error if debug mode is enabled
        if (DDAPI_DEBUG_MODE === "true") {
          console.error("[Auth Debug] Initial auth check failed:", error);
        }
        // Clear the stored state
        store.disconnectWallet();
        // Update the auth state
        setAuthState((prev) => ({
          ...prev,
          user: null,
          loading: false,
          error:
            error instanceof Error ? error : new Error("Auth check failed"),
        }));
      }
    };

    // Initialize auth
    initializeAuth();
  }, []); // Run once on mount

  // Additional auth check when user state changes
  useEffect(() => {
    // Check auth when the user state changes
    if (store.user) {
      checkAuth();
    }
  }, [store.user]);

  // Update auth state when store user or wallet state changes
  useEffect(() => {
    // Update the auth state
    setAuthState((state) => ({
      ...state,
      user: store.user,
      isWalletConnected: connected && !!account?.address,
      walletAddress: account?.address,
    }));
  }, [store.user, connected, account?.address]);

  // Check if the user is a superadmin
  const isSuperAdmin = (): boolean => {
    return authState.user?.role === "superadmin";
  };

  // Check if the user is an admin
  const isAdmin = (): boolean => {
    return (
      authState.user?.role === "admin" || authState.user?.role === "superadmin"
    );
  };

  // Check if the user is fully connected
  const isFullyConnected = (): boolean => {
    return authState.isWalletConnected && !!authState.user;
  };

  // Return the auth state
  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    isWalletConnected: authState.isWalletConnected,
    walletAddress: authState.walletAddress,
    isSuperAdmin,
    isAdmin,
    isFullyConnected,
    checkAuth, // Export checkAuth for manual checks
  };
}
