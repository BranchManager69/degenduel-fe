import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useEffect, useState } from "react";
import { API_URL } from "../config/config";
import { useStore } from "../store/useStore";

interface AuthState {
  user: any | null; // Using any temporarily since we're getting user from store
  loading: boolean;
  error: Error | null;
  isWalletConnected: boolean;
  walletAddress: string | undefined;
}

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

  // Add checkAuth function
  const checkAuth = async () => {
    try {
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

      setAuthState((prev) => ({ ...prev, loading: true }));
      const response = await fetch(`${API_URL}/auth/session`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      console.log("[Auth Debug] Session check response:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers]),
        url: response.url,
      });

      if (!response.ok) {
        console.log("[Auth Debug] Session check failed", {
          status: response.status,
          statusText: response.statusText,
        });
        // If auth check fails, clear the stored state
        store.disconnectWallet();
        setAuthState((prev) => ({
          ...prev,
          user: null,
          loading: false,
          error: new Error("Session expired"),
        }));
        return;
      }

      const data = await response.json();
      console.log("[Auth Debug] Session check data:", data);

      if (!data.authenticated) {
        console.log("[Auth Debug] Not authenticated");
        store.disconnectWallet();
        setAuthState((prev) => ({
          ...prev,
          user: null,
          loading: false,
          error: new Error("Session expired"),
        }));
      } else {
        console.log("[Auth Debug] Successfully authenticated", {
          user: data.user,
          currentCookies: document.cookie,
        });
        setAuthState((prev) => ({
          ...prev,
          user: data.user,
          loading: false,
          error: null,
        }));
      }
    } catch (error) {
      console.error("[Auth Debug] Auth check error:", error);
      store.disconnectWallet();
      setAuthState((prev) => ({
        ...prev,
        user: null,
        loading: false,
        error: error instanceof Error ? error : new Error("Auth check failed"),
      }));
    }
  };

  useEffect(() => {
    // Check auth immediately on mount, regardless of store.user state
    const initializeAuth = async () => {
      console.log("[Auth Debug] Initializing auth state", {
        currentCookies: document.cookie,
        hasUser: !!store.user,
        origin: window.location.origin,
      });

      try {
        const response = await fetch(`${API_URL}/auth/session`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Session check failed");
        }

        const data = await response.json();
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
          store.disconnectWallet();
          setAuthState((prev) => ({
            ...prev,
            user: null,
            loading: false,
            error: new Error("Not authenticated"),
          }));
        }
      } catch (error) {
        console.error("[Auth Debug] Initial auth check failed:", error);
        store.disconnectWallet();
        setAuthState((prev) => ({
          ...prev,
          user: null,
          loading: false,
          error:
            error instanceof Error ? error : new Error("Auth check failed"),
        }));
      }
    };

    initializeAuth();
  }, []); // Run once on mount

  useEffect(() => {
    // Additional auth check when user state changes
    if (store.user) {
      checkAuth();
    }
  }, [store.user]);

  useEffect(() => {
    // Update auth state when store user or wallet state changes
    setAuthState((state) => ({
      ...state,
      user: store.user,
      isWalletConnected: connected && !!account?.address,
      walletAddress: account?.address,
    }));
  }, [store.user, connected, account?.address]);

  const isSuperAdmin = (): boolean => {
    return authState.user?.role === "superadmin";
  };

  const isAdmin = (): boolean => {
    return (
      authState.user?.role === "admin" || authState.user?.role === "superadmin"
    );
  };

  const isFullyConnected = (): boolean => {
    return authState.isWalletConnected && !!authState.user;
  };

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
