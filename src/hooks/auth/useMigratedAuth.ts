// src/hooks/useMigratedAuth.ts

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
// import { getFeatureFlag } from "../../config/featureFlags"; // Removed
import { useAuth as useUnifiedAuth } from "../../contexts/UnifiedAuthContext";
// import { useAuth as useLegacyAuth } from "./legacy/useAuth"; // Removed

// Create an interface that represents the normalized auth API
// This way we ensure consistent behavior regardless of which system is used
interface NormalizedAuthAPI {
  user: any | null;
  isLoading: boolean;
  loading: boolean; // For backward compatibility (maps to isLoading)
  isAuthenticated: boolean;
  
  // Role properties (normalized to boolean values)
  isAdmin: boolean;
  isSuperAdmin: boolean;
  
  // Auth method checks
  isWalletAuth: () => boolean;
  isPrivyAuth: () => boolean;
  isTwitterAuth: () => boolean;
  
  // Other methods
  checkAuth: () => Promise<boolean> | void;  // Handle both return types properly
  getToken: (type?: any) => Promise<string | null>;
  [key: string]: any; // Allow other properties
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
  const auth = useUnifiedAuth();
  
  // Create normalized auth API with consistent property types
  // This normalization layer might still be useful if UnifiedAuthContext's useAuth hook
  // doesn't perfectly match NormalizedAuthAPI, or for future flexibility.
  return {
    ...auth,
    // Loading state - ensure 'loading' (legacy) maps to 'isLoading'
    isLoading: auth.isLoading,
    loading: auth.isLoading, // Backward compatibility
    
    // Authentication state - ensure it's a boolean
    // Assuming auth.isAuthenticated from UnifiedAuthContext is already a boolean
    isAuthenticated: !!auth.isAuthenticated, 
    
    // Role checks - ensure they're booleans
    // Assuming auth.isAdmin & auth.isSuperAdmin from UnifiedAuthContext are already booleans
    isAdmin: !!auth.isAdmin,
    isSuperAdmin: !!auth.isSuperAdmin,
    
    // Normalize method names between the two auth systems (if needed, though less relevant now)
    // Assuming UnifiedAuthContext provides these methods directly or they are part of ...auth
    checkAuth: auth.checkAuth || (() => Promise.resolve(true)), // Fallback if not present
    getToken: auth.getToken || (() => Promise.resolve(null)),   // Fallback if not present
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