import * as React from 'react';
import { ReactNode } from 'react';
import { UnifiedWebSocketProvider } from '../contexts/UnifiedWebSocketContext';
import { AuthMethod, TokenType } from '../services';
import { User } from '../types/user';

// Mock UnifiedAuthContext to match the real interface exactly
interface MockUnifiedAuthContextType {
  // Auth status
  loading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  activeMethod: AuthMethod | null;
  error: Error | null;
  
  // Authentication methods
  loginWithWallet: (walletAddress: string, signMessage: (message: Uint8Array) => Promise<any>) => Promise<User>;
  logout: () => Promise<void>;
  
  // Token management
  getToken: (type?: TokenType) => Promise<string | null>;
  getAccessToken: () => Promise<string | null>;
  
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

// Mock user for stories
const mockUser: User = {
  id: 'mock-user-123',
  username: 'DegenTester',
  nickname: 'DegenTester',
  wallet_address: 'mockwallet123456789',
  email: 'tester@degenduel.com',
  role: 'user',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  auth_method: 'wallet' as AuthMethod,
  profile_image_url: undefined,
  twitter_id: undefined,
  discord_id: undefined,
  telegram_id: undefined,
  passkey_id: undefined,
  is_admin: false,
  is_superadmin: false,
  banned: false,
  stats: {
    total_contests: 12,
    contests_won: 3,
    win_rate: 0.25,
    total_winnings: 150.75,
    degen_level: 5,
    degen_points: 1250
  }
};

// Mock auth context value
const mockAuthContextValue: MockUnifiedAuthContextType = {
  // Auth status
  loading: false,
  isAuthenticated: true, // Set to true for stories
  user: mockUser,
  activeMethod: 'wallet' as AuthMethod,
  error: null,
  
  // Authentication methods
  loginWithWallet: async () => {
    console.log('[Storybook] Mock loginWithWallet called');
    return mockUser;
  },
  logout: async () => {
    console.log('[Storybook] Mock logout called');
  },
  
  // Token management
  getToken: async () => {
    console.log('[Storybook] Mock getToken called');
    return 'mock-jwt-token';
  },
  getAccessToken: async () => {
    console.log('[Storybook] Mock getAccessToken called');
    return 'mock-access-token';
  },
  
  // Account linking
  linkTwitter: async () => {
    console.log('[Storybook] Mock linkTwitter called');
    return 'mock-twitter-auth-url';
  },
  linkDiscord: async () => {
    console.log('[Storybook] Mock linkDiscord called');
    return 'mock-discord-auth-url';
  },
  linkTelegram: async () => {
    console.log('[Storybook] Mock linkTelegram called');
    return 'mock-telegram-auth-url';
  },
  linkPasskey: async () => {
    console.log('[Storybook] Mock linkPasskey called');
  },
  
  // Auth method status
  isWalletAuth: true,
  isTwitterAuth: false,
  isTwitterLinked: false,
  isDiscordAuth: false,
  isDiscordLinked: false,
  isTelegramAuth: false,
  isTelegramLinked: false,
  isPasskeyAuth: false,
  isPasskeyLinked: false,
  
  // Auth refresh
  checkAuth: async () => {
    console.log('[Storybook] Mock checkAuth called');
    return true;
  },
  hardReset: () => {
    console.log('[Storybook] Mock hardReset called');
  }
};

// Create the mock context - this needs to have the same name as the real one for module replacement to work
const UnifiedAuthContext = React.createContext<MockUnifiedAuthContextType | undefined>(undefined);

// Mock UnifiedAuthProvider that mimics the real one
export const MockUnifiedAuthProvider = ({ children }: { children: ReactNode }) => {
  return (
    <UnifiedAuthContext.Provider value={mockAuthContextValue}>
      {children}
    </UnifiedAuthContext.Provider>
  );
};

// Mock useAuth hook that matches the real one - this is the key piece
export const useAuth = (): MockUnifiedAuthContextType => {
  const context = React.useContext(UnifiedAuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within a UnifiedAuthProvider');
  }
  
  return context;
};

// Define type instead of importing to avoid import errors
// This mock AuthContextType might need to be updated to align with UnifiedAuthContextType if stores use it.
interface MockAuthContextType {
  user: any | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: () => boolean;
  activeAuthMethod: string | null;
  authMethods: Record<string, any>;
  isWalletConnected: boolean;
  walletAddress: string | undefined;
  isConnecting: boolean;
  isWalletAuth: () => boolean;
  isPrivyAuth: () => boolean;
  isTwitterAuth: () => boolean;
  isPrivyLinked: () => boolean;
  isTwitterLinked: () => boolean;
  connectWallet: () => void;
  disconnectWallet: () => void;
  isSuperAdmin: () => boolean;
  isAdmin: () => boolean;
  isFullyConnected: () => boolean;
  checkAuth: () => void;
  getAccessToken: () => Promise<string | null>;
}

// Mock AuthContext
const AuthContext = React.createContext<MockAuthContextType | undefined>(undefined); // Use local MockAuthContextType

const mockAuthContext: MockAuthContextType = {
  user: mockUser,
  loading: false,
  error: null,
  isAuthenticated: () => true,
  activeAuthMethod: 'wallet',
  authMethods: {},
  isWalletConnected: true,
  walletAddress: mockUser.wallet_address,
  isConnecting: false,
  isWalletAuth: () => true,
  isPrivyAuth: () => false,
  isTwitterAuth: () => false,
  isPrivyLinked: () => false,
  isTwitterLinked: () => false,
  connectWallet: () => console.log('connectWallet called'),
  disconnectWallet: () => console.log('disconnectWallet called'),
  isSuperAdmin: () => false,
  isAdmin: () => false,
  isFullyConnected: () => true,
  checkAuth: () => console.log('checkAuth called'),
  getAccessToken: async () => 'mock-token'
};

export const MockAuthProvider = ({ children }: { children: ReactNode }) => {
  return (
    <AuthContext.Provider value={mockAuthContext}>
      {children}
    </AuthContext.Provider>
  );
};

// Define PrivyAuthContextType locally for the mock provider
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

// Mock for the useStore hook
export const createMockUseStore = () => {
  if (typeof window !== 'undefined') {
    (window as any).useStore = () => ({
      user: mockUser,
      setUser: () => {},
      isWalletConnected: true,
      walletAddress: mockUser.wallet_address,
      maintenanceMode: false
    });
  }
};

// Use the real WebSocket Provider - it will fallback to REST API when WS fails
const MockWebSocketProvider = ({ children }: { children: ReactNode }) => {
  return (
    <UnifiedWebSocketProvider>
      {children}
    </UnifiedWebSocketProvider>
  );
};

// Combined provider for stories - CRITICAL: UnifiedAuthProvider must be the outermost auth provider
export const AllProviders = ({ children }: { children: ReactNode }) => {
  // Setup the mocks
  React.useEffect(() => {
    createMockUseStore();
    
    // Override the real useAuth with our mock at the global level
    if (typeof window !== 'undefined') {
      // This is the critical part - we need to replace the module-level import
      (window as any).__STORYBOOK_MOCK_AUTH__ = mockAuthContextValue;
      
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
    <MockWebSocketProvider>
      <MockUnifiedAuthProvider>
        <MockAuthProvider>
          <MockPrivyAuthProvider>
            <MockTwitterAuthProvider>
              {children}
            </MockTwitterAuthProvider>
          </MockPrivyAuthProvider>
        </MockAuthProvider>
      </MockUnifiedAuthProvider>
    </MockWebSocketProvider>
  );
};