// src/hooks/useMigratedAuth.ts

/**
 * useMigratedAuth Hook
 * 
 * @description This hook serves as a bridge between the old and new authentication 
 * systems. It uses the feature flag system to determine which authentication hook 
 * to use. During migration, components can use this hook instead of directly 
 * importing either the old or new auth hooks. This allows for a smooth transition 
 * between the two systems.
 * 
 * @author BranchManager69
 * @version 2.0.0
 * @created 2025-05-05
 * @updated 2025-05-05
 */

import { getFeatureFlag } from "../../config/featureFlags";
import { useAuth as useUnifiedAuth } from "../../contexts/UnifiedAuthContext";
import { useAuth as useLegacyAuth } from "./legacy/useAuth";

// Create an interface that represents the normalized auth API
// This way we ensure consistent behavior regardless of which system is used
interface NormalizedAuthAPI {
  user: any | null;
  isLoading: boolean;
  loading: boolean; // For backward compatibility
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
  // Check feature flag
  const useUnifiedAuthFlag = getFeatureFlag("useUnifiedAuth");
  
  // Get the appropriate auth object based on the feature flag
  const auth = useUnifiedAuthFlag ? useUnifiedAuth() : useLegacyAuth();
  
  // Create normalized auth API with consistent property types
  return {
    ...auth,
    // Loading state - handle both auth systems
    isLoading: 'isLoading' in auth ? auth.isLoading : (auth.loading || false),
    loading: 'isLoading' in auth ? auth.isLoading : (auth.loading || false),
    
    // Authentication state - ensure it's a boolean
    isAuthenticated: typeof auth.isAuthenticated === 'function' 
      ? auth.isAuthenticated() 
      : !!auth.isAuthenticated,
    
    // Role checks - ensure they're booleans
    isAdmin: typeof auth.isAdmin === 'function' ? auth.isAdmin() : !!auth.isAdmin,
    isSuperAdmin: typeof auth.isSuperAdmin === 'function' ? auth.isSuperAdmin() : !!auth.isSuperAdmin,
    
    // Normalize method names between the two auth systems
    checkAuth: auth.checkAuth || (() => Promise.resolve(true)),
    getToken: ('getToken' in auth) ? auth.getToken : 
              ('getAccessToken' in auth) ? auth.getAccessToken : 
              (() => Promise.resolve(null)),
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