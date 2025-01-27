import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useEffect, useState } from "react";
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
    loading: false,
    error: null,
    isWalletConnected: false,
    walletAddress: undefined,
  });

  useEffect(() => {
    // Update auth state when store user or wallet state changes
    setAuthState((state) => ({
      ...state,
      user: store.user,
      loading: false,
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
  };
}
