import { useEffect, useState } from "react";

interface User {
  id: string;
  walletAddress: string;
  role: "user" | "admin" | "superadmin";
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "include", // Important for cookies
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setAuthState({
              user: null,
              loading: false,
              error: new Error("Not authenticated"),
            });
            return;
          }
          throw new Error("Authentication check failed");
        }

        const data = await response.json();
        setAuthState({
          user: data.user,
          loading: false,
          error: null,
        });
      } catch (error) {
        setAuthState({
          user: null,
          loading: false,
          error:
            error instanceof Error
              ? error
              : new Error("Authentication check failed"),
        });
      }
    };

    checkAuth();
  }, []);

  const isSuperAdmin = (): boolean => {
    return authState.user?.role === "superadmin";
  };

  const isAdmin = (): boolean => {
    return (
      authState.user?.role === "admin" || authState.user?.role === "superadmin"
    );
  };

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    isSuperAdmin,
    isAdmin,
  };
}
