// src/contexts/PrivyAuthContext.tsx

/**
 * This context is used to manage the Privy authentication state.
 * It is intended to be used to verify the Privy token with our backend and set the authenticated user.
*/

import { usePrivy } from '@privy-io/react-auth';
import React, { createContext, ReactNode, useContext, useEffect } from 'react';
import { verifyPrivyToken, linkPrivyAccount, getAuthStatus } from '../services/api/auth';

// Note: Actual Privy configuration will be set in the App.tsx 
// using the PrivyProvider component from @privy-io/react-auth
// The client key is used server-side for token verification

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

  // Sync with backend when Privy auth state changes
  useEffect(() => {
    const syncWithBackend = async () => {
      // Only proceed if Privy is authenticated and ready
      if (!ready || !authenticated || !privyUser) return;
      
      try {
        // Get the access token
        const token = await getAccessToken();
        const userId = privyUser.id;
        
        if (!token || !userId) {
          console.error('[Privy] No access token or user ID available');
          return;
        }
        
        // Get optional device info
        const deviceInfo = {
          device_id: localStorage.getItem('dd_device_id') || undefined,
          device_name: navigator.userAgent,
          device_type: 'browser'
        };
        
        // Verify the token with our backend
        const authResult = await verifyPrivyToken(token, userId, deviceInfo);
        
        // Set the authenticated user
        setAuthUser(authResult.user);
        
        // Store device ID if returned
        if (authResult.device?.device_id) {
          localStorage.setItem('dd_device_id', authResult.device.device_id);
        }
        
        console.log('[Privy] Session verification successful');
      } catch (error) {
        console.error('[Privy] Session verification failed:', error);
        // If verification fails, log out
        privyLogout();
        setAuthUser(null);
      }
    };
    
    syncWithBackend();
  }, [ready, authenticated, privyUser, getAccessToken]);
  
  // Check comprehensive auth status including Privy link status
  const checkAuthStatus = async (): Promise<void> => {
    try {
      const status = await getAuthStatus();
      
      // Update Privy linked status
      setIsPrivyLinked(!!status.methods?.privy?.linked);
      
      console.log('[Privy] Auth status checked', {
        authenticated: status.authenticated,
        privyLinked: status.methods?.privy?.linked || false
      });
    } catch (error) {
      console.error('[Privy] Failed to check auth status:', error);
    }
  };
  
  // Call check auth status on mount
  useEffect(() => {
    if (ready) {
      checkAuthStatus();
    }
  }, [ready]);
  
  // Link Privy to existing wallet
  const linkPrivyToWallet = async (): Promise<boolean> => {
    if (!authenticated || !privyUser) {
      console.error('[Privy] Cannot link - user not authenticated with Privy');
      return false;
    }
    
    try {
      const token = await getAccessToken();
      const userId = privyUser.id;
      
      if (!token || !userId) {
        console.error('[Privy] No access token or user ID available for linking');
        return false;
      }
      
      // Call link endpoint
      const result = await linkPrivyAccount(token, userId);
      
      if (result.success) {
        setIsPrivyLinked(true);
        // Refresh auth status to get updated info
        await checkAuthStatus();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[Privy] Failed to link account:', error);
      return false;
    }
  };

  // Get the auth token function
  const getAuthToken = async (): Promise<string | null> => {
    if (!authenticated) return null;
    try {
      return await getAccessToken();
    } catch (error) {
      console.error('[Privy] Failed to get auth token:', error);
      return null;
    }
  };

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