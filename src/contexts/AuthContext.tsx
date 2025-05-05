/**
 * AuthContext.tsx
 * 
 * DEPRECATED - This context is scheduled for removal in the next major update.
 * Please use the UnifiedAuthContext instead.
 * 
 * @author @BranchManager69
 * @last-modified 2025-05-05
 * @deprecated Use UnifiedAuthContext instead
 * 
 * This file contains the AuthContext component, which is used to manage the authentication state of the application.
 */

import React, { createContext, ReactNode, useContext } from "react";
import { useAuth } from "../hooks/auth/legacy/useAuth";
import { useStore } from "../store/useStore";

// Create a type for the context
export interface AuthContextType {
  // User state
  user: any | null;
  loading: boolean;
  error: Error | null;

  // Unified auth state
  isAuthenticated: () => boolean;
  activeAuthMethod: string | null;
  authMethods: Record<string, any>;

  // Wallet connection state
  isWalletConnected: boolean;
  walletAddress: string | undefined;
  isConnecting: boolean;
  
  // Auth method checks
  isWalletAuth: () => boolean;
  isPrivyAuth: () => boolean;
  isTwitterAuth: () => boolean;
  
  // Auth method linking
  isPrivyLinked: () => boolean;
  isTwitterLinked: () => boolean;

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
/**
 * AuthProvider component
 * 
 * @param {React.ReactNode} children - The children of the AuthProvider
 * @returns {React.ReactNode} - The AuthProvider component
 * @deprecated Use UnifiedAuthProvider from UnifiedAuthContext instead
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Log deprecation warning on each mount
  React.useEffect(() => {
    console.warn(
      "%c[DEPRECATED] AuthProvider is deprecated and will be removed in the next release. " +
      "Please use the UnifiedAuthProvider from UnifiedAuthContext instead. " +
      "See UNIFIED_AUTH_SYSTEM_README.md and src/AUTH_MIGRATION_PLAN.md for detailed migration instructions.",
      "color: red; font-weight: bold; background-color: yellow; padding: 2px 4px;"
    );
    console.info(
      "Migration steps:\n" +
      "1. Replace <AuthProvider> with <UnifiedAuthProvider> in your app component\n" +
      "2. Remove <PrivyAuthProvider> and <TwitterAuthProvider> as they are no longer needed\n" +
      "3. Update usage of useAuthContext() to useAuth() from UnifiedAuthContext\n" +
      "4. See App.unified.tsx for reference implementation\n" +
      "5. Reference: https://github.com/company/degenduel-fe/wiki/auth-migration"
    );
  }, []);

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
/**
 * Custom hook to use the auth context
 * 
 * @deprecated Use the useAuth hook from UnifiedAuthContext instead
 * @returns {AuthContextType} - The auth context
 */
export const useAuthContext = () => {
  // Log deprecation warning
  React.useEffect(() => {
    console.warn(
      "%c[DEPRECATED] useAuthContext hook is deprecated and will be removed in the next release. " +
      "Please use the useAuth hook from UnifiedAuthContext instead. " +
      "See UNIFIED_AUTH_SYSTEM_README.md and src/AUTH_MIGRATION_PLAN.md for detailed migration instructions.",
      "color: red; font-weight: bold; background-color: yellow; padding: 2px 4px;"
    );
    console.info(
      "Migration steps:\n" +
      "1. Import from new location: import { useAuth } from '../contexts/UnifiedAuthContext'\n" +
      "2. Replace useAuthContext() with useAuth()\n" +
      "3. Update property access (isAuthenticated is now a boolean not a function)\n" +
      "4. See examples in src/examples/AuthMigrationExample.tsx"
    );
  }, []);

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
