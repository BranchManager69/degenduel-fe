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

import { useWallet } from "@solana/wallet-adapter-react";
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
  linkTelegram: () => Promise<string>;
  linkPasskey: () => Promise<void>;
  
  // Auth method status - use direct property checks
  isWalletAuth: boolean;
  isTwitterAuth: boolean;
  isTwitterLinked: boolean;
  isDiscordAuth: boolean;
  isDiscordLinked: boolean;
  isTelegramAuth: boolean;
  isTelegramLinked: boolean;
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
    telegram: boolean;
    telegramLinked: boolean;
    passkey: boolean;
    passkeyLinked: boolean;
  }>({
    wallet: false,
    twitter: false,
    twitterLinked: false,
    discord: false,
    discordLinked: false,
    telegram: false,
    telegramLinked: false,
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
        
        // If authenticated, fetch full profile data
        if (user) {
          // Fetch profile in the background without blocking
          authService.fetchAndUpdateUserProfile().then(success => {
            if (success) {
              // Re-get the updated user
              const updatedUser = authService.getUser();
              if (updatedUser) {
                setStatus(prev => ({ ...prev, user: updatedUser }));
                updateMethodStatuses(updatedUser);
              }
            }
          });
        }
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
      
      // If this is a login event (user went from null to authenticated), fetch profile
      if (user && event.type === AuthEventType.LOGIN) {
        // Small delay to ensure auth is fully established
        setTimeout(() => {
          authService.fetchAndUpdateUserProfile().then(success => {
            if (success) {
              // Re-get the updated user
              const updatedUser = authService.getUser();
              if (updatedUser) {
                setStatus(prev => ({ ...prev, user: updatedUser }));
                updateMethodStatuses(updatedUser);
              }
            }
          });
        }, 500);
      }
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

  // WALLET DISCONNECT MONITORING - Prevents split-brain authentication
  // 
  // Problem: Users authenticated via wallet can appear "logged in" even after their wallet
  // disconnects (e.g., after 24 hours, browser restart, etc.). This creates a "split-brain"
  // state where:
  // - User session state says "authenticated" (JWT still valid)
  // - Wallet adapter state says "disconnected" 
  // - Result: User appears logged in but can't perform wallet operations
  //
  // Solution: Monitor wallet connection state and auto-logout wallet-authenticated users
  // when their wallet disconnects. This keeps the two auth systems synchronized.
  //
  // Note: This ONLY affects users who authenticated via wallet. Social auth users 
  // (Twitter, Discord, etc.) are unaffected by wallet disconnection.
  
  // Only try to access wallet context if we have a wallet-authenticated user
  const shouldMonitorWallet = status.isAuthenticated && status.user?.auth_method === 'wallet';
  
  // Always call useWallet (hooks must be called unconditionally)
  // but handle the case where WalletProvider isn't available yet
  let walletState = { connected: false, publicKey: null as any, wallet: null as any };
  let walletContextAvailable = false;
  
  try {
    const walletContext = useWallet();
    
    // Check if we have a proper wallet context before accessing properties
    // The wallet adapter logs errors when accessing properties without a provider
    // We can detect this by checking if the context has the expected structure
    const hasValidContext = walletContext && typeof walletContext === 'object';
    
    if (hasValidContext) {
      // Safely access properties - if they throw, we'll catch it
      try {
        walletState = {
          connected: walletContext.connected || false,
          publicKey: walletContext.publicKey, 
          wallet: walletContext.wallet
        };
        walletContextAvailable = true;
      } catch (propertyError) {
        // Properties threw an error - WalletProvider not properly initialized
        walletContextAvailable = false;
      }
    }
  } catch (error) {
    // WalletProvider not available - this is expected during initial renders
    walletContextAvailable = false;
  }
  
  // Enhanced wallet disconnect detection
  useEffect(() => {
    // Only monitor if we should be monitoring and wallet context is available
    if (!shouldMonitorWallet || !walletContextAvailable) {
      return;
    }
    
    const { connected: walletConnected, publicKey, wallet } = walletState;
    
    // Skip if wallet context values aren't properly initialized
    if (walletConnected === undefined || publicKey === undefined || wallet === undefined) {
      return;
    }
    
    // Check multiple indicators of disconnection
    const isWalletDisconnected = (
      !walletConnected ||           // Adapter reports disconnected
      !publicKey ||                 // No public key available
      !wallet                       // No wallet selected
    );
    
    // Additional check: Verify the current wallet matches the authenticated wallet
    const authenticatedWallet = status.user?.wallet_address;
    const currentWallet = publicKey?.toBase58?.();
    const walletMismatch = authenticatedWallet && currentWallet && authenticatedWallet !== currentWallet;
    
    if (isWalletDisconnected || walletMismatch) {
      console.group('🚨 [UnifiedAuthContext] Wallet Disconnect Detected');
      console.log('Disconnect Reasons:', {
        walletConnected,
        hasPublicKey: !!publicKey,
        hasWallet: !!wallet,
        authenticatedWallet,
        currentWallet,
        walletMismatch
      });
      console.log('Triggering logout to prevent ghost authentication');
      console.groupEnd();
      
      authService.logout();
    }
  }, [
    shouldMonitorWallet,
    walletContextAvailable,
    walletState.connected, 
    walletState.publicKey, 
    walletState.wallet, 
    status.user?.wallet_address
  ]);
  
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
    if (user.telegram_id) return 'telegram';
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
        telegram: false,
        telegramLinked: false,
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
      telegram: activeMethod === 'telegram',
      passkey: activeMethod === 'passkey',
      // For linking status, check for IDs regardless of active method
      twitterLinked: !!user.twitter_id,
      discordLinked: !!user.discord_id,
      telegramLinked: !!user.telegram_id,
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
    linkTelegram: async () => {
      // For now, redirect to the Telegram login endpoint
      // This can be enhanced later with token generation
      window.location.href = '/api/auth/telegram/login';
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
    isTelegramAuth: methodStatuses.telegram,
    isTelegramLinked: methodStatuses.telegramLinked,
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
export function useAuth(): UnifiedAuthContextType {
  const context = useContext(UnifiedAuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within a UnifiedAuthProvider');
  }
  
  return context;
}

// Default export for the provider (helps with Fast Refresh)
export default UnifiedAuthProvider;