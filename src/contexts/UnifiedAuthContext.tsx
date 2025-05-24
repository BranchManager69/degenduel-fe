// src/contexts/UnifiedAuthContext.tsx

/**
 * UnifiedAuthContext.tsx
 * 
 * @description A single unified authentication context for DegenDuel that replaces the multiple
 * overlapping authentication providers (AuthContext, TwitterAuthContext, etc.).
 * 
 * This context provides state and methods for all authentication operations across different 
 * authentication methods (wallet, Twitter, etc.) through a single, consistent interface.
 * 
 * @author BranchManager69
 * @version 1.0.0
 * @created 2025-05-05
 * @updated 2025-05-06
 */

import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { AuthEventType, AuthMethod, authService, TokenType } from '../services';
import { User } from '../types/user';

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
  // Authentication methods
  loginWithWallet: (walletAddress: string, signMessage: (message: Uint8Array) => Promise<any>) => Promise<User>;
  logout: () => Promise<void>;
  
  // Token management
  getToken: (type?: TokenType) => Promise<string | null>;
  getAccessToken: () => Promise<string | null>; // Legacy compatibility
  
  // Account linking
  linkTwitter: () => Promise<string>;
  
  // Auth method status - use direct property checks
  isWalletAuth: boolean;
  isTwitterAuth: boolean;
  isTwitterLinked: boolean;
  
  // Auth refresh
  checkAuth: () => Promise<boolean>;
  hardReset: () => void;
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
  
  // Create context value
  const contextValue: UnifiedAuthContextType = {
    // Auth status
    ...status,
    
    // Auth methods
    loginWithWallet: authService.loginWithWallet.bind(authService),
    logout: authService.logout.bind(authService),
    
    // Token management
    getToken: authService.getToken.bind(authService),
    // For backward compatibility with old getAccessToken
    getAccessToken: () => authService.getToken(TokenType.JWT),
    
    // Account linking
    linkTwitter: authService.linkTwitter.bind(authService),
    
    // Auth method status
    isWalletAuth: methodStatuses.wallet,
    isTwitterAuth: methodStatuses.twitter,
    isTwitterLinked: methodStatuses.twitterLinked,
    
    // Auth refresh
    checkAuth: authService.checkAuth.bind(authService),
    hardReset: authService.hardReset.bind(authService)
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