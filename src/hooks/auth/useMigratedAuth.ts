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
import { useAuth as useUnifiedAuth } from "../../contexts/UnifiedAuthContext";
import { User } from "../../types/user";
// import { TokenType } from "../../services/authTokenManagerService"; // Old direct import
import { TokenType } from "../../services"; // Import from service index

// Create an interface that represents the normalized auth API
// This way we ensure consistent behavior regardless of which system is used
interface NormalizedAuthAPI {
  user: User | null;
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
  getToken: (type?: TokenType) => Promise<string | null>;
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
  
  // Destructure the necessary parts from the auth context result
  const {
    // Get the functions explicitly
    isAdmin: isAdminFunc, 
    isSuperAdmin: isSuperAdminFunc,
    // Get other states we need to normalize/pass through
    isLoading: authIsLoading, 
    isAuthenticated: authIsAuthenticated,
    // Capture the rest of the properties to spread later
    ...restAuth 
  } = auth;
  
  // Create the normalized API return object
  return {
    ...restAuth, // Spread the remaining properties from the context
    
    // Normalized loading state
    isLoading: authIsLoading,
    loading: authIsLoading, // Backward compatibility
    
    // Normalized authentication state (ensure boolean)
    isAuthenticated: !!authIsAuthenticated, 
    
    // Normalized role checks (call the original functions)
    isAdmin: isAdminFunc(), 
    isSuperAdmin: isSuperAdminFunc(),

    // Fallbacks for checkAuth and getToken are handled by restAuth spread
    // If they don't exist on auth context, they won't be in restAuth
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