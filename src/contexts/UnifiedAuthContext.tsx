// src/contexts/UnifiedAuthContext.tsx

/**
 * UnifiedAuthContext.tsx
 * 
 * @description A single unified authentication context for DegenDuel that replaces the multiple
 * overlapping authentication providers (AuthContext, TwitterAuthContext).
 * 
 * This context provides state and methods for all authentication operations across different 
 * authentication methods (wallet, Twitter) through a single, consistent interface.
 * 
 * @author BranchManager69
 * @version 1.0.0
 * @created 2025-05-05
 * @updated 2025-05-06
 */

import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { authDebug } from '../config/config';
import { AuthEventType, AuthMethod, authService, TokenType } from '../services';
import { User } from '../types/user';
import { deprecatedFunction } from '../utils/deprecationWarning';

// Auth status interface
export interface AuthStatus {
  loading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  activeMethod: AuthMethod | null;
  error: Error | null;
}

// Complete context interface
export interface UnifiedAuthContextType extends AuthStatus {
  // For compatibility with old useAuth hook
  isLoading: boolean;
  
  // Authentication methods
  loginWithWallet: (walletAddress: string, signMessage: (message: Uint8Array) => Promise<any>) => Promise<User>;
  logout: () => Promise<void>;
  
  // Token management
  getToken: (type?: TokenType) => Promise<string | null>;
  getAccessToken: () => Promise<string | null>; // Legacy compatibility
  
  // Account linking
  linkTwitter: () => Promise<string>;
  
  // Role checks - support both function and property forms
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  
  // For backward compatibility - function versions of auth state
  isAuthenticated: boolean & (() => boolean); // Support both property and function
  
  // Auth method status
  isWalletAuth: () => boolean;
  isTwitterAuth: () => boolean;
  
  // Method linking status
  isTwitterLinked: () => boolean;
  
  // Auth refresh
  checkAuth: () => Promise<boolean>;
}

// Create context with default values
const UnifiedAuthContext = createContext<UnifiedAuthContextType | undefined>(undefined);

/**
 * UnifiedAuthProvider component
 * 
 * This component provides authentication state and methods to all child components
 * through the UnifiedAuthContext.
 */
export const UnifiedAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State
  const [status, setStatus] = useState<AuthStatus>({
    loading: true,
    isAuthenticated: false,
    user: null,
    activeMethod: null,
    error: null
  });
  
  // Cached auth method statuses
  const [methodStatuses, setMethodStatuses] = useState<{
    wallet: boolean;
    twitter: boolean;
    twitterLinked: boolean;
  }>({
    wallet: false,
    twitter: false,
    twitterLinked: false
  });
  
  // Handle auth state changes
  useEffect(() => {
    // Check initial auth state
    const checkInitialAuth = async () => {
      try {
        setStatus(prev => ({ ...prev, loading: true }));
        
        // Check auth state
        await authService.checkAuth();
        
        // Get current user from auth service
        const user = authService.getUser();
        
        // Set auth status
        setStatus({
          loading: false,
          isAuthenticated: !!user,
          user,
          activeMethod: user ? determineActiveMethod(user) : null,
          error: null
        });
        
        // Update auth method statuses
        updateMethodStatuses(user);
      } catch (error) {
        setStatus({
          loading: false,
          isAuthenticated: false,
          user: null,
          activeMethod: null,
          error: error instanceof Error ? error : new Error(String(error))
        });
      }
    };
    
    checkInitialAuth();
    
    // Set up listeners for auth events
    const authStateListener = (event: any) => {
      const user = event.user;
      
      setStatus({
        loading: false,
        isAuthenticated: !!user,
        user,
        activeMethod: user ? determineActiveMethod(user) : null,
        error: null
      });
      
      // Update method statuses
      updateMethodStatuses(user);
    };
    
    const authErrorListener = (event: any) => {
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: event.error
      }));
    };
    
    // Register listeners
    const unsubscribeStateChange = authService.on(
      AuthEventType.AUTH_STATE_CHANGED,
      authStateListener
    );
    
    const unsubscribeError = authService.on(
      AuthEventType.AUTH_ERROR,
      authErrorListener
    );
    
    // Clean up listeners on unmount
    return () => {
      unsubscribeStateChange();
      unsubscribeError();
    };
  }, []);
  
  // Determine active auth method from user object (is this really the best way to do this?)
  const determineActiveMethod = (user: User): AuthMethod | null => {
    if (!user) return null;
    
    // Look at the auth_method field if present
    if (user.auth_method) {
      return user.auth_method as AuthMethod;
    }
    
    // Otherwise infer from available data (???)
    if (user.wallet_address) return 'wallet';
    if (user.twitter_id) return 'twitter';
    
    // Default to session if no other indicators
    return 'session';
  };
  
  // Update method statuses based on user
  const updateMethodStatuses = (user: User | null) => {
    if (!user) {
      setMethodStatuses({
        wallet: false,
        twitter: false,
        twitterLinked: false
      });
      return;
    }
    
    const activeMethod = determineActiveMethod(user);
    
    setMethodStatuses({
      wallet: activeMethod === 'wallet',
      twitter: activeMethod === 'twitter',
      // For linking status, check for IDs regardless of active method
      twitterLinked: !!user.twitter_id
    });
  };
  
  // Role check methods
  const isAdmin = () => {
    return authService.hasRole('admin');
  };

  // Check if user is superadmin
  const isSuperAdmin = () => {
    return authService.hasRole('superadmin');
  };
  
  // Auth method status checks
  const isWalletAuth = () => methodStatuses.wallet;
  const isTwitterAuth = () => methodStatuses.twitter;
  
  // Method linking status checks
  const isTwitterLinked = () => methodStatuses.twitterLinked;
  
  // Check URL parameters for redirects on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const searchParams = new URLSearchParams(window.location.search);
    
    // Check for Twitter auth redirect parameters
    if (searchParams.has('twitter_login') || searchParams.has('twitter_linked')) {
      authDebug('UnifiedAuthContext', 'Detected Twitter auth redirect', {
        twitter_login: searchParams.get('twitter_login'),
        twitter_linked: searchParams.get('twitter_linked')
      });
      
      // Trigger auth check
      authService.checkAuth();
      
      // Clean up URL parameters
      const url = new URL(window.location.href);
      if (searchParams.has('twitter_login')) url.searchParams.delete('twitter_login');
      if (searchParams.has('twitter_linked')) url.searchParams.delete('twitter_linked');
      
      window.history.replaceState({}, '', url);
    }
    
  }, []);
  
  // Create context value
  
  // Create a function version that logs deprecation warning when called
  const isAuthenticatedFunc = deprecatedFunction(
    function() { return status.isAuthenticated; },
    'isAuthenticated()',
    'isAuthenticated',
    'The function version is deprecated in favor of the boolean property.'
  );
  
  // Combine them into a hybrid property/function
  // @ts-ignore - Hybrid object for backward compatibility
  const isAuthenticatedHybrid = Object.assign(isAuthenticatedFunc, {
    valueOf: () => status.isAuthenticated,
    toString: () => String(status.isAuthenticated)
  });
  
  // Create deprecated function versions of admin role checks
  const isAdminFunc = deprecatedFunction(
    isAdmin,
    'isAdmin()',
    'user?.is_admin',
    'Direct property access is recommended for performance reasons.'
  );
  
  const isSuperAdminFunc = deprecatedFunction(
    isSuperAdmin,
    'isSuperAdmin()',
    'user?.is_superadmin',
    'Direct property access is recommended for performance reasons.'
  );
  
  // Create deprecated function versions of auth method checks
  const isWalletAuthFunc = deprecatedFunction(
    isWalletAuth,
    'isWalletAuth()',
    'user?.auth_method === "wallet"',
    'Direct property check is recommended for performance reasons.'
  );
  
  
  const isTwitterAuthFunc = deprecatedFunction(
    isTwitterAuth,
    'isTwitterAuth()',
    'user?.auth_method === "twitter"',
    'Direct property check is recommended for performance reasons.'
  );
  
  const contextValue: UnifiedAuthContextType = {
    // Auth status
    ...status,
    // For compatibility with old useAuth hook
    isLoading: status.loading,
    
    // Auth methods
    loginWithWallet: authService.loginWithWallet.bind(authService),
    logout: authService.logout.bind(authService),
    
    // Token management
    getToken: authService.getToken.bind(authService),
    // For backward compatibility with old getAccessToken
    getAccessToken: () => authService.getToken(TokenType.JWT),
    
    // Account linking
    linkTwitter: authService.linkTwitter.bind(authService),
    
    // Hybrid isAuthenticated that works as both property and function
    // @ts-ignore - Hybrid property/function for backward compatibility
    isAuthenticated: isAuthenticatedHybrid,
    
    // Role checks with deprecation warnings
    isAdmin: isAdminFunc,
    isSuperAdmin: isSuperAdminFunc,
    
    // Auth method status with deprecation warnings
    isWalletAuth: isWalletAuthFunc,
    isTwitterAuth: isTwitterAuthFunc,
    
    // Method linking status with deprecation warnings
    isTwitterLinked: deprecatedFunction(
      isTwitterLinked,
      'isTwitterLinked()',
      'user?.twitter_id !== undefined',
      'Direct property check is recommended for performance reasons.'
    ),
    
    // Auth refresh
    checkAuth: authService.checkAuth.bind(authService)
  };
  
  return (
    <UnifiedAuthContext.Provider value={contextValue}>
      {children}
    </UnifiedAuthContext.Provider>
  );
};

/**
 * Hook to use the unified auth context
 * 
 * @returns UnifiedAuthContextType
 */
export const useAuth = (): UnifiedAuthContextType => {
  const context = useContext(UnifiedAuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within a UnifiedAuthProvider');
  }
  
  return context;
};