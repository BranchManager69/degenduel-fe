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

// Interface imports are no longer needed due to our normalized interface

// No need to import User types directly as they come through the context types

// Create an interface that represents the normalized auth API
// This way we ensure consistent behavior regardless of which system is used
interface NormalizedAuthAPI {
  user: any | null;
  isLoading: boolean;
  loading: boolean; // For backward compatibility
  isAuthenticated: boolean;
  
  // Role checks as functions
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  
  // Auth method checks
  isWalletAuth: () => boolean;
  isPrivyAuth: () => boolean;
  isTwitterAuth: () => boolean;
  
  // Other methods
  checkAuth: () => Promise<boolean>;
  getToken: (type?: any) => Promise<string | null>;
  [key: string]: any; // Allow other properties
}

// Create a hook that returns a normalized auth API
export function useMigratedAuth(): NormalizedAuthAPI {
  // Use dynamic imports to avoid circular dependencies
  const useAuthHook = () => {
    // Check feature flag
    const useUnifiedAuth = getFeatureFlag("useUnifiedAuth");
    
    if (useUnifiedAuth) {
      // Use the new unified auth hook
      const { useAuth } = require("../contexts/UnifiedAuthContext");
      const auth = useAuth();
      
      // Normalize the new auth API
      return {
        ...auth,
        isLoading: auth.isLoading,
        loading: auth.isLoading, // For backward compatibility
        isAuthenticated: !!auth.isAuthenticated, // Ensure boolean
      };
    } else {
      // Use the old auth hook
      const { useAuth } = require("../hooks/useAuth");
      const auth = useAuth();
      
      // Normalize the old auth API
      return {
        ...auth,
        isLoading: auth.loading,
        loading: auth.loading,
        // Convert function to boolean if needed
        isAuthenticated: typeof auth.isAuthenticated === 'function' 
          ? auth.isAuthenticated() 
          : !!auth.isAuthenticated,
      };
    }
  };
  
  // Call the appropriate hook with normalized interface
  return useAuthHook();
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