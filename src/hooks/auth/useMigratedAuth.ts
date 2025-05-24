// src/hooks/auth/useMigratedAuth.ts

/**
 * useMigratedAuth Hook
 * 
 * @description This hook serves as a bridge to the unified authentication system.
 * Components can use this hook to interact with the new auth system.
 * 
 * @author BranchManager69
 * @version 2.1.0
 * @created 2025-05-05
 * @updated 2025-05-07 // Updated to solely use UnifiedAuth
 */

import React, { useMemo } from "react";
import { useAuth as useUnifiedAuth } from "../../contexts/UnifiedAuthContext";
import { User } from "../../types/user";
// import { TokenType } from "../../services/authTokenManagerService"; // Old direct import
import { AuthMethod, TokenType } from "../../services"; // Import from service index, ADDED AuthMethod

// Interface defining the consistent API provided by this hook
interface NormalizedAuthAPI {
  user: User | null;
  isLoading: boolean;
  loading: boolean; // For backward compatibility (maps to isLoading)
  isAuthenticated: boolean; // Correctly a boolean

  isAdministrator: boolean; // Has administrator privileges (admin OR superadmin)
  isSuperAdmin: boolean; // Specifically has superadmin role

  // Auth method checks (these are functions on UnifiedAuthContextType)
  isWalletAuth: () => boolean;
  isTwitterAuth: () => boolean;

  // Other methods from UnifiedAuthContextType
  checkAuth: () => Promise<boolean> | void;
  getToken: (type?: TokenType) => Promise<string | null>;
  loginWithWallet: (walletAddress: string, signMessage: (message: Uint8Array) => Promise<any>) => Promise<User>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  linkTwitter: () => Promise<string>;
  isTwitterLinked: () => boolean;

  // Properties from UnifiedAuthContextType
  activeMethod: AuthMethod | null;
  error: Error | null;
}

// Create a hook that returns a normalized auth API
export function useMigratedAuth(): NormalizedAuthAPI {
  // Log which auth system is being used (only on initial mount)
  React.useEffect(() => {
    console.log(
      `%c[AUTH SYSTEM] Mounting Normalized Auth API (useMigratedAuth.ts).`,
      `color: black; background-color: #4caf50; padding: 4px 8px; border-radius: 4px; font-weight: bold;`
    );
  }, []);

  // Always use the Unified Auth system
  const authContextValue = useUnifiedAuth();

  // FIXED: Memoize role-based computed values to prevent unnecessary re-computation and component unmounting
  const isAdministrator = useMemo(() => {
    return authContextValue.user?.role === 'admin' || authContextValue.user?.role === 'superadmin' || false;
  }, [authContextValue.user?.role]);

  const isSuperAdmin = useMemo(() => {
    return authContextValue.user?.role === 'superadmin' || false;
  }, [authContextValue.user?.role]);

  // Construct the normalized API object based on NormalizedAuthAPI interface
  return {
    // Properties
    user: authContextValue.user,
    isLoading: authContextValue.loading,
    loading: authContextValue.loading, // Backward compatibility
    isAuthenticated: authContextValue.isAuthenticated,

    // FIXED: Use memoized values instead of inline computation
    isAdministrator,
    isSuperAdmin,

    activeMethod: authContextValue.activeMethod,
    error: authContextValue.error,

    // Methods (pass through directly)
    isWalletAuth: () => authContextValue.activeMethod === 'wallet',
    isTwitterAuth: () => authContextValue.activeMethod === 'twitter',
    checkAuth: authContextValue.checkAuth,
    getToken: authContextValue.getToken,
    loginWithWallet: authContextValue.loginWithWallet,
    logout: authContextValue.logout,
    getAccessToken: authContextValue.getAccessToken,
    linkTwitter: authContextValue.linkTwitter,
    isTwitterLinked: () => authContextValue.isTwitterLinked, // Wrap boolean in function
  };
}

/**
 * Example usage:
 * 
 * ```tsx
 * import { useMigratedAuth } from "../hooks/useMigratedAuth";
 * 
 * function MyComponent() {
 *   const { user, isLoading, isAuthenticated, loginWithWallet, logout } = useMigratedAuth();
 *   
 *   // Component logic using auth
 * }
 * ```
 */