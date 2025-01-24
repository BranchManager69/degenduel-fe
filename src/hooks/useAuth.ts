import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";

interface AuthState {
  user: any | null; // Using any temporarily since we're getting user from store
  loading: boolean;
  error: Error | null;
}

export function useAuth() {
  const store = useStore();
  const [authState, setAuthState] = useState<AuthState>({
    user: store.user,
    loading: false,
    error: null,
  });

  useEffect(() => {
    // Update auth state when store user changes
    setAuthState((state) => ({
      ...state,
      user: store.user,
      loading: false,
    }));
  }, [store.user]);

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
