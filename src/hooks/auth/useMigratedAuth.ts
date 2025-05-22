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

import React from "react";
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
  
  isAdmin: boolean; // Correctly a boolean
  isSuperAdmin: boolean; // Correctly a boolean
  
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
      `%c[AUTH SYSTEM] UNIFIED AUTH system is currently active`,
      `color: white; background-color: #4caf50; padding: 4px 8px; border-radius: 4px; font-weight: bold;`
    );
  }, []);
  
  // Always use the Unified Auth system
  const authContextValue = useUnifiedAuth();
  
  // Construct the normalized API object based on NormalizedAuthAPI interface
  return {
    // Properties
    user: authContextValue.user,
    isLoading: authContextValue.isLoading,
    loading: authContextValue.isLoading, // Backward compatibility
    isAuthenticated: authContextValue.isAuthenticated(), // Call function to get boolean
    isAdmin: authContextValue.isAdmin(), // Call function to get boolean
    isSuperAdmin: authContextValue.isSuperAdmin(), // Call function to get boolean
    activeMethod: authContextValue.activeMethod,
    error: authContextValue.error,

    // Methods (pass through directly)
    isWalletAuth: authContextValue.isWalletAuth,
    isTwitterAuth: authContextValue.isTwitterAuth,
    checkAuth: authContextValue.checkAuth,
    getToken: authContextValue.getToken,
    loginWithWallet: authContextValue.loginWithWallet,
    logout: authContextValue.logout,
    getAccessToken: authContextValue.getAccessToken,
    linkTwitter: authContextValue.linkTwitter,
    isTwitterLinked: authContextValue.isTwitterLinked,
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