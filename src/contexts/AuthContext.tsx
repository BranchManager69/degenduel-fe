import React, { createContext, useContext, ReactNode } from "react";

import { useAuth } from "../hooks/useAuth";
import { useStore } from "../store/useStore";

// Create a type for the context
export interface AuthContextType {
  // User state
  user: any | null;
  loading: boolean;
  error: Error | null;

  // Wallet connection state
  isWalletConnected: boolean;
  walletAddress: string | undefined;
  isConnecting: boolean;

  // Auth methods
  connectWallet: () => void;
  disconnectWallet: () => void;

  // Role checks
  isSuperAdmin: () => boolean;
  isAdmin: () => boolean;
  isFullyConnected: () => boolean;

  // Auth utilities
  checkAuth: () => void;
  getAccessToken: () => Promise<string | null>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Use the existing useAuth hook
  const auth = useAuth();

  // Get wallet connection methods from store
  const {
    connectWallet,
    disconnectWallet,
    isConnecting,
    user: storeUser,
  } = useStore();

  // Combine auth from useAuth and wallet methods from useStore
  const authContext: AuthContextType = {
    ...auth,
    user: auth.user || storeUser, // Prioritize auth user, fall back to store user
    isConnecting,
    connectWallet,
    disconnectWallet,
  };

  return (
    <AuthContext.Provider value={authContext}>{children}</AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuthContext = () => {
  // For Storybook support, use a mock if defined on window
  if (typeof window !== 'undefined' && (window as any).useAuthContext) {
    return (window as any).useAuthContext();
  }
  
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
