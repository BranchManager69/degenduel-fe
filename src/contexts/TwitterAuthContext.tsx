// src/contexts/TwitterAuthContext.tsx

/**
 * This context is used to manage the Twitter authentication state.
 * It handles Twitter login, account linking, and status checking.
 * 
 * @author @BranchManager69
 * @version 1.0.1
 * @created 2025-04-02
 * @updated 2025-05-01
 * 
 */

import React, { createContext, ReactNode, useContext, useEffect } from 'react';
import { authDebug } from '../config/config';
import {
  checkTwitterLinkStatus,
  getTwitterAuthUrl,
  linkTwitterAccount
} from '../services/api/auth';
import { useAuthContext } from './AuthContext';

// Create context types
interface TwitterAuthContextType {
  isTwitterLinked: boolean;
  isLoading: boolean;
  twitterUsername: string | null;
  login: () => void;
  linkAccount: () => Promise<boolean>;
  checkStatus: () => Promise<void>;
}

// Create context with default values
const TwitterAuthContext = createContext<TwitterAuthContextType>({
  isTwitterLinked: false,
  isLoading: true,
  twitterUsername: null,
  login: () => {},
  linkAccount: async () => false,
  checkStatus: async () => {},
});

// TwitterAuthProvider component
/**
 * TwitterAuthProvider component
 * 
 * @param {React.ReactNode} children - The children of the TwitterAuthProvider
 * @returns {React.ReactNode} - The TwitterAuthProvider component
 */
export const TwitterAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuthContext();
  
  const [isTwitterLinked, setIsTwitterLinked] = React.useState<boolean>(false);
  const [twitterUsername, setTwitterUsername] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  // Add debugging object to window for inspection in console
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).debugTwitterAuth = () => ({
        isTwitterLinked,
        twitterUsername,
        isLoading,
        hasUser: !!user
      });
    }
    authDebug('TwitterAuth', 'Debug object attached to window.debugTwitterAuth()');
  }, [isTwitterLinked, twitterUsername, isLoading, user]);

  // Check Twitter link status when user changes
  useEffect(() => {
    if (user) {
      authDebug('TwitterAuth', 'User changed, checking Twitter status', { userId: user.id });
      checkStatus();
    } else {
      authDebug('TwitterAuth', 'No user, resetting Twitter state');
      setIsTwitterLinked(false);
      setTwitterUsername(null);
      setIsLoading(false);
    }
  }, [user]);

  // Function to initiate Twitter login
  /**
   * Function to initiate Twitter login
   */
  const login = async () => {
    authDebug('TwitterAuth', 'Initiating Twitter login');
    const authUrl = await getTwitterAuthUrl();
    authDebug('TwitterAuth', 'Using Twitter auth URL', { authUrl });
    window.location.href = authUrl;
  };

  // Function to link Twitter account to existing user
  /**
   * Function to link Twitter account to existing user
   * 
   * @returns {Promise<boolean>} - Whether the account was linked successfully
   */
  const linkAccount = async (): Promise<boolean> => {
    if (!user) {
      authDebug('TwitterAuth', 'Cannot link - user not authenticated');
      console.error('[Twitter] Cannot link - user not authenticated');
      return false;
    }
    
    try {
      authDebug('TwitterAuth', 'Linking Twitter account', { userId: user.id });
      setIsLoading(true);
      const result = await linkTwitterAccount();
      
      if (result.success) {
        authDebug('TwitterAuth', 'Twitter account linked successfully', { result });
        // Update status after successful linking
        await checkStatus();
        return true;
      }
      
      authDebug('TwitterAuth', 'Twitter account linking failed', { result });
      return false;
    } catch (error) {
      authDebug('TwitterAuth', 'Error linking Twitter account', { error });
      console.error('[Twitter] Failed to link account:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to check Twitter link status
  /**
   * Function to check Twitter link status
   * 
   * @returns {Promise<void>} - The status of the Twitter link
   */
  const checkStatus = async (): Promise<void> => {
    authDebug('TwitterAuth', 'Checking Twitter link status');
    try {
      setIsLoading(true);
      const status = await checkTwitterLinkStatus();
      
      setIsTwitterLinked(status.linked);
      setTwitterUsername(status.username || null);
      
      authDebug('TwitterAuth', 'Twitter status updated', {
        linked: status.linked,
        username: status.username
      });
      
      // If Twitter is linked, ensure we have WebSocket token
      // This proactively acquires a WebSocket token right after Twitter auth
      if (status.linked && user) {
        import('../services/TokenManager').then(({ TokenManager, TokenType }) => {
          // Request a WebSocket token from the server
          TokenManager.refreshToken(TokenType.WS_TOKEN);
          authDebug('TwitterAuth', 'Proactively requesting WebSocket token after Twitter auth success');
        }).catch(err => {
          authDebug('TwitterAuth', 'Error importing TokenManager', { error: err });
        });
      }
    } catch (error) {
      authDebug('TwitterAuth', 'Failed to check Twitter status', { error });
      console.error('[Twitter] Failed to check auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check for URL parameters on component mount
  /**
   * Check for URL parameters on component mount
   */
  useEffect(() => {
    // Check for twitter_linked success parameter
    const urlParams = new URLSearchParams(window.location.search);
    authDebug('TwitterAuth', 'Checking URL parameters', { 
      params: Object.fromEntries(urlParams.entries()) 
    });
    
    if (urlParams.get("twitter_linked") === "true") {
      // This would be set by your backend after successful linking
      authDebug('TwitterAuth', 'Found twitter_linked=true parameter, checking status');
      checkStatus();
      
      // Preserve any stored navigation path when cleaning up parameters
      const storedRedirectPath = localStorage.getItem("auth_redirect_path");
      
      // Remove the query parameter to prevent checking again on refresh
      const url = new URL(window.location.href);
      url.searchParams.delete("twitter_linked");
      
      // Preserve redirect path in URL state for the router if available
      if (storedRedirectPath) {
        authDebug('TwitterAuth', 'Preserving redirect path during parameter cleanup', {
          redirectPath: storedRedirectPath
        });
        // Path is already stored in localStorage and will be used by LoginPage
      }
      
      window.history.replaceState({}, "", url);
      authDebug('TwitterAuth', 'Removed twitter_linked parameter from URL');
    }
    
    if (urlParams.get("twitter") === "pending") {
      // Show a message if wallet connection is needed to complete Twitter linking
      authDebug('TwitterAuth', 'Found twitter=pending parameter, wallet connection needed');
      console.log("Please connect your wallet to complete Twitter linking");
    }
  }, []);

  // Provide the context value
  /**
   * Provide the context value
   */
  const value = {
    isTwitterLinked,
    isLoading,
    twitterUsername,
    login,
    linkAccount,
    checkStatus
  };

  return (
    <TwitterAuthContext.Provider value={value}>
      {children}
    </TwitterAuthContext.Provider>
  );
};

// Custom hook to use the Twitter auth context
/**
 * Custom hook to use the Twitter auth context
 * 
 * @returns {TwitterAuthContextType} - The Twitter auth context
 */
export const useTwitterAuth = () => {
  const context = useContext(TwitterAuthContext);
  if (context === undefined) {
    throw new Error('useTwitterAuth must be used within a TwitterAuthProvider');
  }
  return context;
};