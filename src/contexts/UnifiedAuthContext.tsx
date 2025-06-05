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

import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
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
  linkDiscord: () => Promise<string>;
  linkPasskey: () => Promise<void>;
  
  // Auth method status - use direct property checks
  isWalletAuth: boolean;
  isTwitterAuth: boolean;
  isTwitterLinked: boolean;
  isDiscordAuth: boolean;
  isDiscordLinked: boolean;
  isPasskeyAuth: boolean;
  isPasskeyLinked: boolean;
  
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
    discord: boolean;
    discordLinked: boolean;
    passkey: boolean;
    passkeyLinked: boolean;
  }>({
    wallet: false,
    twitter: false,
    twitterLinked: false,
    discord: false,
    discordLinked: false,
    passkey: false,
    passkeyLinked: false
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
    if (user.discord_id) return 'discord';
    if (user.passkey_id) return 'passkey';
    
    // Default to session if no other indicators
    return 'session';
  };
  
  // Update method statuses based on user
  const updateMethodStatuses = (user: User | null) => {
    if (!user) {
      setMethodStatuses({
        wallet: false,
        twitter: false,
        twitterLinked: false,
        discord: false,
        discordLinked: false,
        passkey: false,
        passkeyLinked: false
      });
      return;
    }
    
    const activeMethod = determineActiveMethod(user);
    
    setMethodStatuses({
      wallet: activeMethod === 'wallet',
      twitter: activeMethod === 'twitter',
      discord: activeMethod === 'discord',
      passkey: activeMethod === 'passkey',
      // For linking status, check for IDs regardless of active method
      twitterLinked: !!user.twitter_id,
      discordLinked: !!user.discord_id,
      passkeyLinked: !!user.passkey_id
    });
  };
  
  // Create context value
  const contextValue: UnifiedAuthContextType = useMemo(() => ({
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
    linkDiscord: async () => {
      window.location.href = '/api/auth/discord/link';
      return 'redirect_initiated';
    },
    linkPasskey: async () => {
      // Call the WebAuthn registration endpoint
      const response = await fetch('/api/auth/passkey/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await authService.getToken(TokenType.JWT)}`
        }
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to initiate passkey registration: ${error}`);
      }
      
      const { challenge, user: userInfo } = await response.json();
      
      // Create WebAuthn credential
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(Object.values(challenge)),
          rp: {
            name: "DegenDuel",
            id: window.location.hostname
          },
          user: userInfo,
          pubKeyCredParams: [{ alg: -7, type: "public-key" }],
          timeout: 60000,
          attestation: "direct"
        }
      });
      
      if (!credential) {
        throw new Error('Failed to create passkey credential');
      }
      
      // Send credential to server for verification
      const verifyResponse = await fetch('/api/auth/passkey/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await authService.getToken(TokenType.JWT)}`
        },
        body: JSON.stringify({ credential })
      });
      
      if (!verifyResponse.ok) {
        const error = await verifyResponse.text();
        throw new Error(`Failed to verify passkey: ${error}`);
      }
      
      // Refresh auth state to pick up the new passkey
      await authService.checkAuth();
    },
    
    // Auth method status
    isWalletAuth: methodStatuses.wallet,
    isTwitterAuth: methodStatuses.twitter,
    isTwitterLinked: methodStatuses.twitterLinked,
    isDiscordAuth: methodStatuses.discord,
    isDiscordLinked: methodStatuses.discordLinked,
    isPasskeyAuth: methodStatuses.passkey,
    isPasskeyLinked: methodStatuses.passkeyLinked || false,
    
    // Auth refresh
    checkAuth: authService.checkAuth.bind(authService),
    hardReset: authService.hardReset.bind(authService)
  }), [status, methodStatuses]);
  
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