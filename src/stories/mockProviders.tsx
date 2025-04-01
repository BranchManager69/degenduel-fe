import * as React from 'react';
import { ReactNode } from 'react';
import { AuthContextType } from '../contexts/AuthContext';

// Define type instead of importing to avoid import errors
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

// Mock AuthContext
const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const mockAuthContext: AuthContextType = {
  // User state
  user: null,
  loading: false,
  error: null,
  
  // Unified auth state
  isAuthenticated: () => false,
  activeAuthMethod: null,
  authMethods: {},
  
  // Wallet connection state
  isWalletConnected: false,
  walletAddress: undefined,
  isConnecting: false,
  
  // Auth method checks
  isWalletAuth: () => false,
  isPrivyAuth: () => false,
  isTwitterAuth: () => false,
  
  // Auth method linking
  isPrivyLinked: () => false,
  isTwitterLinked: () => false,
  
  // Auth methods
  connectWallet: () => console.log('connectWallet called'),
  disconnectWallet: () => console.log('disconnectWallet called'),
  
  // Role checks
  isSuperAdmin: () => false,
  isAdmin: () => false,
  isFullyConnected: () => false,
  
  // Auth utilities
  checkAuth: () => console.log('checkAuth called'),
  getAccessToken: async () => null
};

export const MockAuthProvider = ({ children }: { children: ReactNode }) => {
  return (
    <AuthContext.Provider value={mockAuthContext}>
      {children}
    </AuthContext.Provider>
  );
};

// Mock PrivyAuthContext
const PrivyAuthContext = React.createContext<PrivyAuthContextType>({
  isAuthenticated: false,
  isLoading: false,
  isPrivyLinked: false,
  user: null,
  login: () => {},
  logout: () => {},
  getAuthToken: async () => null,
  linkPrivyToWallet: async () => false,
  checkAuthStatus: async () => {}
});

// Define TwitterAuthContextType
interface TwitterAuthContextType {
  isTwitterLinked: boolean;
  isLoading: boolean;
  twitterUsername: string | null;
  login: () => void;
  linkAccount: () => Promise<boolean>;
  checkStatus: () => Promise<void>;
}

// Mock TwitterAuthContext
const TwitterAuthContext = React.createContext<TwitterAuthContextType>({
  isTwitterLinked: false,
  isLoading: false,
  twitterUsername: null,
  login: () => {},
  linkAccount: async () => false,
  checkStatus: async () => {}
});

export const MockPrivyAuthProvider = ({ children }: { children: ReactNode }) => {
  return (
    <PrivyAuthContext.Provider 
      value={{
        isAuthenticated: false,
        isLoading: false,
        isPrivyLinked: false,
        user: null,
        login: () => console.log('Privy login called'),
        logout: () => console.log('Privy logout called'),
        getAuthToken: async () => null,
        linkPrivyToWallet: async () => {
          console.log('linkPrivyToWallet called');
          return true;
        },
        checkAuthStatus: async () => console.log('checkAuthStatus called')
      }}
    >
      {children}
    </PrivyAuthContext.Provider>
  );
};

export const MockTwitterAuthProvider = ({ children }: { children: ReactNode }) => {
  return (
    <TwitterAuthContext.Provider 
      value={{
        isTwitterLinked: false,
        isLoading: false,
        twitterUsername: null,
        login: () => console.log('Twitter login called'),
        linkAccount: async () => {
          console.log('Twitter linkAccount called');
          return true;
        },
        checkStatus: async () => console.log('Twitter checkStatus called')
      }}
    >
      {children}
    </TwitterAuthContext.Provider>
  );
};

// Mock for the useStore hook - no user by default
export const createMockUseStore = () => {
  if (typeof window !== 'undefined') {
    (window as any).useStore = () => ({
      user: null, // No user, so we see login options
      setUser: () => {},
      isWalletConnected: false,
      walletAddress: undefined,
      maintenanceMode: false
    });
  }
};

// Combined provider for stories
export const AllProviders = ({ children }: { children: ReactNode }) => {
  // Setup the mocks
  React.useEffect(() => {
    createMockUseStore();
    
    // Make sure we have hooks available globally
    if (typeof window !== 'undefined') {
      // Mock auth context
      (window as any).useAuthContext = () => mockAuthContext;
      
      // Mock privy auth
      (window as any).usePrivyAuth = () => ({
        isAuthenticated: false,
        isLoading: false,
        isPrivyLinked: false,
        user: null,
        login: () => console.log('Privy login called'),
        logout: () => console.log('Privy logout called'),
        getAuthToken: async () => null,
        linkPrivyToWallet: async () => {
          console.log('linkPrivyToWallet called');
          return true;
        },
        checkAuthStatus: async () => console.log('checkAuthStatus called')
      });
      
      // Mock twitter auth
      (window as any).useTwitterAuth = () => ({
        isTwitterLinked: false,
        isLoading: false,
        twitterUsername: null,
        login: () => console.log('Twitter login called'),
        linkAccount: async () => {
          console.log('Twitter linkAccount called');
          return true;
        },
        checkStatus: async () => console.log('Twitter checkStatus called')
      });
    }
  }, []);

  return (
    <MockAuthProvider>
      <MockPrivyAuthProvider>
        <MockTwitterAuthProvider>
          {children}
        </MockTwitterAuthProvider>
      </MockPrivyAuthProvider>
    </MockAuthProvider>
  );
};