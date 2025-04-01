// src/contexts/TwitterAuthContext.tsx

/**
 * This context is used to manage the Twitter authentication state.
 * It handles Twitter login, account linking, and status checking.
 */

import React, { createContext, ReactNode, useContext, useEffect } from 'react';
import {
  getTwitterAuthUrl,
  linkTwitterAccount,
  checkTwitterLinkStatus
} from '../services/api/auth';
import { useAuthContext } from './AuthContext';
import { authDebug } from '../config/config';

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

// Provider component
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
  const login = async () => {
    authDebug('TwitterAuth', 'Initiating Twitter login');
    try {
      const authUrl = await getTwitterAuthUrl();
      authDebug('TwitterAuth', 'Received Twitter auth URL', { authUrl });
      window.location.href = authUrl;
    } catch (error) {
      authDebug('TwitterAuth', 'Login failed, using fallback URL', { error });
      console.error('[Twitter] Login failed:', error);
      // Fallback to default URL
      window.location.href = '/api/auth/twitter/login';
    }
  };

  // Function to link Twitter account to existing user
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
    } catch (error) {
      authDebug('TwitterAuth', 'Failed to check Twitter status', { error });
      console.error('[Twitter] Failed to check auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check for URL parameters on component mount
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
      
      // Remove the query parameter to prevent checking again on refresh
      const url = new URL(window.location.href);
      url.searchParams.delete("twitter_linked");
      window.history.replaceState({}, "", url);
      authDebug('TwitterAuth', 'Removed twitter_linked parameter from URL');
    }
    
    if (urlParams.get("twitter") === "pending") {
      // Show a message if wallet connection is needed to complete Twitter linking
      authDebug('TwitterAuth', 'Found twitter=pending parameter, wallet connection needed');
      console.log("Please connect your wallet to complete Twitter linking");
    }
  }, []);

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
export const useTwitterAuth = () => {
  const context = useContext(TwitterAuthContext);
  if (context === undefined) {
    throw new Error('useTwitterAuth must be used within a TwitterAuthProvider');
  }
  return context;
};