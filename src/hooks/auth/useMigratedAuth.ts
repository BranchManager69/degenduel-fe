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

import { useCallback, useMemo, useRef } from "react";
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
  linkDiscord: () => Promise<string>;
  isDiscordLinked: () => boolean;
  linkTelegram: () => Promise<string>;
  isTelegramLinked: () => boolean;
  linkPasskey: () => Promise<void>;
  isPasskeyLinked: () => boolean;

  // Properties from UnifiedAuthContextType
  activeMethod: AuthMethod | null;
  error: Error | null;
}

// Create a hook that returns a normalized auth API
export function useMigratedAuth(): NormalizedAuthAPI {
  // Use a ref to track if we've already logged the mount message (proper React pattern)
  const hasLoggedRef = useRef(false);

  // Log which auth system is being used (only once per hook instance)
  if (!hasLoggedRef.current) {
    console.log(
      `%c[AUTH SYSTEM] Mounting Normalized Auth API (useMigratedAuth.ts).`,
      `color: black; background-color: #4caf50; padding: 4px 8px; border-radius: 4px; font-weight: bold;`
    );
    hasLoggedRef.current = true;
  }

  // Always use the Unified Auth system
  const authContextValue = useUnifiedAuth();

  // FIXED: Memoize role-based computed values to prevent unnecessary re-computation and component unmounting
  const isAdministrator = useMemo(() => {
    return authContextValue.user?.role === 'admin' || authContextValue.user?.role === 'superadmin' || false;
  }, [authContextValue.user?.role]);

  const isSuperAdmin = useMemo(() => {
    return authContextValue.user?.role === 'superadmin' || false;
  }, [authContextValue.user?.role]);

  // Memoize functions to prevent new references on every render
  const isWalletAuth = useCallback(() => authContextValue.activeMethod === 'wallet', [authContextValue.activeMethod]);
  const isTwitterAuth = useCallback(() => authContextValue.activeMethod === 'twitter', [authContextValue.activeMethod]);
  const isTwitterLinked = useCallback(() => authContextValue.isTwitterLinked, [authContextValue.isTwitterLinked]);
  const isDiscordLinked = useCallback(() => authContextValue.isDiscordLinked, [authContextValue.isDiscordLinked]);
  const isTelegramLinked = useCallback(() => authContextValue.isTelegramLinked, [authContextValue.isTelegramLinked]);
  const isPasskeyLinked = useCallback(() => authContextValue.isPasskeyLinked, [authContextValue.isPasskeyLinked]);

  // Memoize the entire return object to prevent new object references
  return useMemo(() => ({
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

    // Methods (use memoized functions to prevent new references)
    isWalletAuth,
    isTwitterAuth,
    checkAuth: authContextValue.checkAuth,
    getToken: authContextValue.getToken,
    loginWithWallet: authContextValue.loginWithWallet,
    logout: authContextValue.logout,
    getAccessToken: authContextValue.getAccessToken,
    linkTwitter: authContextValue.linkTwitter,
    isTwitterLinked,
    linkDiscord: authContextValue.linkDiscord,
    isDiscordLinked,
    linkTelegram: authContextValue.linkTelegram,
    isTelegramLinked,
    linkPasskey: authContextValue.linkPasskey,
    isPasskeyLinked,
  }), [
    authContextValue.user,
    authContextValue.loading,
    authContextValue.isAuthenticated,
    isAdministrator,
    isSuperAdmin,
    authContextValue.activeMethod,
    authContextValue.error,
    isWalletAuth,
    isTwitterAuth,
    authContextValue.checkAuth,
    authContextValue.getToken,
    authContextValue.loginWithWallet,
    authContextValue.logout,
    authContextValue.getAccessToken,
    authContextValue.linkTwitter,
    isTwitterLinked,
    authContextValue.linkDiscord,
    isDiscordLinked,
    authContextValue.linkTelegram,
    isTelegramLinked,
    authContextValue.linkPasskey,
    isPasskeyLinked,
  ]);
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