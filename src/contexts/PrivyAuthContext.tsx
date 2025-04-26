// src/contexts/PrivyAuthContext.tsx

/**
 * This context is used to manage the Privy authentication state.
 * It is intended to be used to verify the Privy token with our backend and set the authenticated user.
 * 
 * @author @BranchManager69
 * @last-modified 2025-04-02
 */

import { usePrivy } from '@privy-io/react-auth';
import React, { createContext, ReactNode, useContext, useEffect } from 'react';
import { authDebug } from '../config/config';
import { getAuthStatus, linkPrivyAccount, verifyPrivyToken } from '../services/api/auth';

// Note: Actual Privy configuration will be set in the App.tsx 
// using the PrivyProvider component from @privy-io/react-auth

// Create context types
interface PrivyAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isPrivyLinked: boolean;
  user: any | null;
  login: () => void;
  logout: () => void;
  getAuthToken: () => Promise<string | null>;
  linkPrivyToWallet: () => Promise<boolean>;
  checkAuthStatus: () => Promise<void>;
}

// Create context with default values
const PrivyAuthContext = createContext<PrivyAuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  isPrivyLinked: false,
  user: null,
  login: () => {},
  logout: () => {},
  getAuthToken: async () => null,
  linkPrivyToWallet: async () => false,
  checkAuthStatus: async () => {},
});

// Provider component
export const PrivyAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { 
    ready,
    authenticated,
    user: privyUser,
    login: privyLogin,
    logout: privyLogout,
    getAccessToken
  } = usePrivy();
  
  const [authUser, setAuthUser] = React.useState<any>(null);
  const [isPrivyLinked, setIsPrivyLinked] = React.useState<boolean>(false);

  // Add debugging object to window for inspection in console
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).debugPrivyAuth = () => ({
        ready,
        authenticated,
        hasPrivyUser: !!privyUser,
        privyUserId: privyUser?.id,
        hasAuthUser: !!authUser,
        isPrivyLinked,
      });
    }
    authDebug('PrivyAuth', 'Debug object attached to window.debugPrivyAuth()');
  }, [ready, authenticated, privyUser, authUser, isPrivyLinked]);

  // Sync with backend when Privy auth state changes
  /**
   * Sync with backend when Privy auth state changes
   */
  useEffect(() => {
    const syncWithBackend = async () => {
      // Only proceed if Privy is authenticated and ready
      if (!ready || !authenticated || !privyUser) {
        authDebug('PrivyAuth', 'Skipping backend sync - not ready or authenticated', { 
          ready, authenticated, hasPrivyUser: !!privyUser 
        });
        return;
      }
      
      authDebug('PrivyAuth', 'Syncing Privy session with backend');
      try {
        // Get the access token
        const token = await getAccessToken();
        const userId = privyUser.id;
        
        if (!token || !userId) {
          authDebug('PrivyAuth', 'No access token or user ID available');
          console.error('[Privy] No access token or user ID available');
          return;
        }
        
        // Get optional device info
        const deviceInfo = {
          device_id: localStorage.getItem('dd_device_id') || undefined,
          device_name: navigator.userAgent,
          device_type: 'browser'
        };
        
        authDebug('PrivyAuth', 'Verifying Privy token with backend', { 
          userId, deviceInfo: { ...deviceInfo, device_id: deviceInfo.device_id ? '[REDACTED]' : undefined } 
        });
        
        // Add error handling with longer timeout and retry mechanism
        const MAX_RETRIES = 3;
        const TIMEOUT_MS = 45000; // Increased to 45 seconds
        
        let lastError: any = null;
        let attempt = 0;
        let authResult = null;
        
        // Try multiple times with exponential backoff
        while (attempt < MAX_RETRIES) {
          try {
            authDebug('PrivyAuth', `Verification attempt ${attempt + 1}/${MAX_RETRIES}`);
            
            // Set up timeout for this attempt
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error(`Privy verification timed out after ${TIMEOUT_MS/1000} seconds`)), TIMEOUT_MS)
            );
            
            // Race between the actual request and the timeout
            authResult = await Promise.race([
              verifyPrivyToken(token, userId, deviceInfo),
              timeoutPromise
            ]) as any;
            
            // If we got here, the request succeeded - break out of retry loop
            authDebug('PrivyAuth', 'Verification succeeded on attempt', { attempt: attempt + 1 });
            break;
          } catch (error) {
            lastError = error;
            authDebug('PrivyAuth', `Attempt ${attempt + 1} failed`, { error });
            
            // Only retry on network errors or timeouts, not on auth failures
            const errorMsg = error instanceof Error ? error.message : String(error);
            if (!errorMsg.includes('timed out') && !errorMsg.includes('network') && !errorMsg.includes('connection')) {
              // Don't retry if it's not a timeout or network error
              authDebug('PrivyAuth', 'Not retrying - not a network/timeout error');
              break;
            }
            
            attempt++;
            if (attempt < MAX_RETRIES) {
              const delayMs = Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff up to 10 seconds
              authDebug('PrivyAuth', `Retrying in ${delayMs}ms`);
              await new Promise(resolve => setTimeout(resolve, delayMs));
            }
          }
        }
        
        // If we didn't get a successful result after all retries
        if (!authResult) {
          authDebug('PrivyAuth', 'All verification attempts failed');
          throw lastError || new Error("Privy verification failed after multiple attempts");
        }
        
        // If we got here, we have a successful result
        authDebug('PrivyAuth', 'Verification successful after retries', { 
          attempts: attempt + 1,
          userId: authResult.user?.id 
        });
        
        // Set the authenticated user
        setAuthUser(authResult.user);
        
        // Store device ID if returned
        if (authResult.device?.device_id) {
          localStorage.setItem('dd_device_id', authResult.device.device_id);
          authDebug('PrivyAuth', 'Stored device ID from auth result');
        }
        
        authDebug('PrivyAuth', 'Session verification successful', {
          userId: authResult.user?.id,
          username: authResult.user?.username
        });
        console.log('[Privy] Session verification successful');
      } catch (error: any) {
        // Provide more user-friendly error message
        const errorMessage = error.message || 'Unknown error';
        const isTimeout = errorMessage.includes('timed out');
        const friendlyMessage = isTimeout 
          ? 'Privy server is not responding. Please try again later.'
          : 'Failed to verify Privy login. Please try a different login method.';
          
        authDebug('PrivyAuth', 'Session verification failed', { 
          error, 
          isTimeout, 
          friendlyMessage 
        });
        
        // Show error to user
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('privy-auth-error', { 
            detail: { message: friendlyMessage }
          }));
        }
        
        console.error('[Privy] Session verification failed:', error);
        // If verification fails, log out
        privyLogout();
        setAuthUser(null);
      }
    };
    
    syncWithBackend();
  }, [ready, authenticated, privyUser, getAccessToken, privyLogout]);
  
  // Check comprehensive auth status including Privy link status
  /**
   * Check comprehensive auth status including Privy link status
   */
  const checkAuthStatus = async (): Promise<void> => {
    authDebug('PrivyAuth', 'Checking auth status');
    try {
      const status = await getAuthStatus();
      
      // Update Privy linked status
      setIsPrivyLinked(!!status.methods?.privy?.linked);
      
      authDebug('PrivyAuth', 'Auth status updated', {
        authenticated: status.authenticated,
        privyLinked: status.methods?.privy?.linked || false,
        methods: status.methods
      });
      console.log('[Privy] Auth status checked', {
        authenticated: status.authenticated,
        privyLinked: status.methods?.privy?.linked || false
      });
    } catch (error) {
      authDebug('PrivyAuth', 'Failed to check auth status', { error });
      console.error('[Privy] Failed to check auth status:', error);
    }
  };
  
  // Call check auth status on mount
  /**
   * Call check auth status on mount
   */
  useEffect(() => {
    if (ready) {
      authDebug('PrivyAuth', 'Privy SDK ready, checking auth status');
      checkAuthStatus();
    } else {
      authDebug('PrivyAuth', 'Waiting for Privy SDK to be ready');
    }
  }, [ready]);
  
  // Link Privy to existing wallet
  /**
   * Link Privy to existing wallet
   * 
   * @returns {Promise<boolean>} - Whether the account was linked successfully
   */
  const linkPrivyToWallet = async (): Promise<boolean> => {
    if (!authenticated || !privyUser) {
      authDebug('PrivyAuth', 'Cannot link - user not authenticated with Privy');
      console.error('[Privy] Cannot link - user not authenticated with Privy');
      return false;
    }
    
    authDebug('PrivyAuth', 'Linking Privy account to wallet', { 
      authenticated, privyUserId: privyUser.id 
    });
    
    try {
      const token = await getAccessToken();
      const userId = privyUser.id;
      
      if (!token || !userId) {
        authDebug('PrivyAuth', 'No access token or user ID available for linking');
        console.error('[Privy] No access token or user ID available for linking');
        return false;
      }
      
      // Call link endpoint
      authDebug('PrivyAuth', 'Calling link endpoint');
      const result = await linkPrivyAccount(token, userId);
      
      if (result.success) {
        authDebug('PrivyAuth', 'Privy account linked successfully', { result });
        setIsPrivyLinked(true);
        // Refresh auth status to get updated info
        await checkAuthStatus();
        return true;
      }
      
      authDebug('PrivyAuth', 'Privy account linking failed', { result });
      return false;
    } catch (error) {
      authDebug('PrivyAuth', 'Error linking Privy account', { error });
      console.error('[Privy] Failed to link account:', error);
      return false;
    }
  };

  // Get the auth token function
  /**
   * Get the auth token function
   * 
   * @returns {Promise<string | null>} - The auth token
   */
  const getAuthToken = async (): Promise<string | null> => {
    if (!authenticated) {
      authDebug('PrivyAuth', 'Cannot get auth token - not authenticated');
      return null;
    }
    
    authDebug('PrivyAuth', 'Getting Privy auth token');
    try {
      const token = await getAccessToken();
      authDebug('PrivyAuth', 'Retrieved auth token successfully', { 
        hasToken: !!token, 
        tokenLength: token ? token.length : 0 
      });
      return token;
    } catch (error) {
      authDebug('PrivyAuth', 'Failed to get auth token', { error });
      console.error('[Privy] Failed to get auth token:', error);
      return null;
    }
  };

  // Provide the context value
  /**
   * Provide the context value
   */
  const value = {
    isAuthenticated: authenticated && !!authUser,
    isLoading: !ready,
    isPrivyLinked,
    user: authUser,
    login: privyLogin,
    logout: privyLogout,
    getAuthToken,
    linkPrivyToWallet,
    checkAuthStatus
  };

  return (
    <PrivyAuthContext.Provider value={value}>
      {children}
    </PrivyAuthContext.Provider>
  );
};

// Custom hook to use the privy auth context
/**
 * Custom hook to use the privy auth context
 * 
 * @returns {PrivyAuthContextType} - The privy auth context
 */
export const usePrivyAuth = () => {
  // For Storybook support, use a mock if defined on window
  if (typeof window !== 'undefined' && (window as any).usePrivyAuth) {
    return (window as any).usePrivyAuth();
  }
  
  const context = useContext(PrivyAuthContext);
  if (context === undefined) {
    throw new Error('usePrivyAuth must be used within a PrivyAuthProvider');
  }
  return context;
};