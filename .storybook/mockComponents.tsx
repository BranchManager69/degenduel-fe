import React from 'react';
import { Contest, TokenData } from '../src/types';
import { Button } from '../src/components/ui/Button';
import { FaTwitter } from 'react-icons/fa';

// Mock TokenDataContext
export const TokenDataContext = React.createContext({
  tokens: [
    {
      symbol: 'ETH',
      name: 'Ethereum',
      price: '3500.00',
      marketCap: '423000000000',
      volume24h: '15000000',
      change24h: '4.2',
    },
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      price: '42000.00',
      marketCap: '850000000000',
      volume24h: '25000000',
      change24h: '-2.5',
    },
    {
      symbol: 'SOL',
      name: 'Solana',
      price: '120.00',
      marketCap: '58000000000',
      volume24h: '5000000',
      change24h: '8.1',
    },
  ] as TokenData[],
  isConnected: true,
  error: null,
  _refresh: () => console.log('Mock TokenData refresh called')
});

// Props type for MockedUnifiedTicker
interface MockedUnifiedTickerProps {
  contests: Contest[];
  loading: boolean;
  isCompact?: boolean;
  maxTokens?: number;
}

// Import the actual UnifiedTicker component
import { UnifiedTicker as RealUnifiedTicker } from '../src/components/layout/UnifiedTicker';

// Mock UnifiedTicker component wrapper
export const MockedUnifiedTicker: React.FC<MockedUnifiedTickerProps> = ({ 
  contests, 
  loading, 
  isCompact = false,
  maxTokens = 8
}) => {
  // Add a useTokenData mock for the component to use
  window.useTokenDataMock = () => ({
    tokens: [
      {
        symbol: 'ETH',
        name: 'Ethereum',
        price: '3500.00',
        marketCap: '423000000000',
        volume24h: '15000000',
        change24h: '4.2',
      },
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        price: '42000.00',
        marketCap: '850000000000',
        volume24h: '25000000',
        change24h: '-2.5',
      },
      {
        symbol: 'SOL',
        name: 'Solana',
        price: '120.00',
        marketCap: '58000000000',
        volume24h: '5000000',
        change24h: '8.1',
      },
      {
        symbol: 'DOGE',
        name: 'Dogecoin',
        price: '0.15',
        marketCap: '20000000000',
        volume24h: '2500000',
        change24h: '12.3',
      },
      {
        symbol: 'ADA',
        name: 'Cardano',
        price: '0.45',
        marketCap: '16000000000',
        volume24h: '1800000',
        change24h: '-1.7',
      },
      {
        symbol: 'AVAX',
        name: 'Avalanche',
        price: '35.25',
        marketCap: '12000000000',
        volume24h: '950000',
        change24h: '3.8',
      },
      {
        symbol: 'MATIC',
        name: 'Polygon',
        price: '0.75',
        marketCap: '7500000000',
        volume24h: '850000',
        change24h: '5.2',
      },
      {
        symbol: 'LINK',
        name: 'Chainlink',
        price: '14.50',
        marketCap: '7800000000',
        volume24h: '750000',
        change24h: '2.1',
      },
    ],
    isConnected: true, 
    error: null,
    _refresh: () => console.log('TokenData refresh called')
  });

  // Mock the store context
  window.useStoreMock = () => ({
    maintenanceMode: false,
    setMaintenanceMode: () => {}
  });

  return (
    <>
      {/* Add global styles for animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Ticker animation keyframes */
          @keyframes ticker {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }
          
          /* Ticker scanning effects */
          @keyframes scan-fast {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
          
          /* Cyber scanning effect animation */
          @keyframes cyber-scan {
            0% {
              transform: translateY(-100%);
            }
            50% {
              transform: translateY(100%);
            }
            100% {
              transform: translateY(-100%);
            }
          }
          
          /* Data stream animation for items */
          @keyframes data-stream {
            0% {
              background-position: -200% center;
            }
            100% {
              background-position: 200% center;
            }
          }
          
          /* Shine effect for progress bars */
          @keyframes shine {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
          
          /* Additional animations */
          @keyframes gradientX {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          
          .animate-gradientX {
            animation: gradientX 2s ease infinite;
            background-size: 200% auto;
          }
          
          .ticker-animation {
            display: flex !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            width: 100% !important;
          }
          
          /* Shadow effects */
          .shadow-brand {
            box-shadow: 0 0 5px rgba(153, 51, 255, 0.3);
          }
          
          .shadow-cyber {
            box-shadow: 0 0 5px rgba(0, 225, 255, 0.3);
          }
          
          .hide-scrollbar {
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
            overflow-x: auto;
          }
          
          .hide-scrollbar::-webkit-scrollbar {
            display: none !important;
            width: 0px !important;
            height: 0px !important;
          }
        `
      }} />

      {/* Use the actual UnifiedTicker component directly */}
      <div className="relative bg-dark-200 backdrop-blur min-h-[60px]">
        <div className="w-full">
          <RealUnifiedTicker
            contests={contests}
            loading={loading}
            isCompact={isCompact}
            maxTokens={maxTokens}
          />
        </div>
      </div>
    </>
  );
};

// Export mocked hooks
export const mockedHooks = {
  useTokenData: () => ({
    tokens: [
      {
        symbol: 'ETH',
        name: 'Ethereum',
        price: '3500.00',
        marketCap: '423000000000',
        volume24h: '15000000',
        change24h: '4.2',
      },
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        price: '42000.00',
        marketCap: '850000000000',
        volume24h: '25000000',
        change24h: '-2.5',
      },
      {
        symbol: 'SOL',
        name: 'Solana',
        price: '120.00',
        marketCap: '58000000000',
        volume24h: '5000000',
        change24h: '8.1',
      },
    ] as TokenData[],
    isConnected: true,
    error: null,
    _refresh: () => console.log('TokenData refresh called')
  }),
  useStore: () => ({
    maintenanceMode: false,
    setMaintenanceMode: () => {}
  }),
  // Enhanced mock implementation of useSystemSettingsWebSocket
  useSystemSettingsWebSocket: () => ({
    settings: {
      background_scene: {
        enabled: true,
        scenes: [
          { name: 'CyberGrid', enabled: true, zIndex: 0, blendMode: 'normal' },
          { name: 'MarketBrain', enabled: true, zIndex: 1, blendMode: 'screen' }
        ]
      },
      maintenance_mode: false,
      feature_flags: {
        enable_animations: true,
        enable_achievements: true
      }
    },
    loading: false,
    error: null,
    lastUpdated: new Date(),
    refreshSettings: () => console.log('Mock refreshSettings called'),
    updateBackgroundScene: () => console.log('Mock updateBackgroundScene called'),
    connect: () => console.log('Mock connect called'),
    close: () => console.log('Mock close called'),
    webSocketConnected: true
  }),
  // Mock implementation of useUnifiedWebSocket for the Footer component
  useUnifiedWebSocket: (id: string, types: string[] = [], callback: Function, topics?: string[]) => {
    // Immediately invoke callback with mock data if we have a system settings request
    if (id.includes('system') && topics && topics.includes('system')) {
      setTimeout(() => {
        callback({
          type: "SYSTEM_SETTINGS_UPDATE",
          data: {
            background_scene: {
              enabled: true,
              scenes: [
                { name: 'CyberGrid', enabled: true, zIndex: 0, blendMode: 'normal' },
                { name: 'MarketBrain', enabled: true, zIndex: 1, blendMode: 'screen' }
              ]
            },
            maintenance_mode: false,
            feature_flags: {
              enable_animations: true,
              enable_achievements: true
            }
          }
        });
      }, 50);
    }
    
    return {
      sendMessage: (message: any) => {
        console.log('Mock sendMessage:', message);
        return true;
      },
      isConnected: true,
      isAuthenticated: true,
      connectionState: 'AUTHENTICATED',
      error: null,
      subscribe: (topics: string[]) => {
        console.log('Mock subscribe to topics:', topics);
        return true;
      },
      unsubscribe: (topics: string[]) => {
        console.log('Mock unsubscribe from topics:', topics);
        return true;
      },
      request: (topic: string, action: string, params: any = {}) => {
        console.log('Mock request:', { topic, action, params });
        return true;
      }
    };
  }
};

// Mock AuthContext provider for Storybook
export const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Set up mock auth context values
  const mockAuthValue = {
    user: null,
    loading: false,
    error: null,
    isWalletConnected: false,
    walletAddress: undefined,
    isConnecting: false,
    connectWallet: () => console.log('Mock connectWallet called'),
    disconnectWallet: () => console.log('Mock disconnectWallet called'),
    isSuperAdmin: () => false,
    isAdmin: () => false,
    isFullyConnected: () => false,
    checkAuth: () => console.log('Mock checkAuth called'),
    getAccessToken: async () => null
  };

  // Set up mock Privy auth context values
  const mockPrivyAuthValue = {
    isAuthenticated: false,
    isLoading: false,
    isPrivyLinked: false,
    user: null,
    login: () => console.log('Mock Privy login called'),
    logout: () => console.log('Mock Privy logout called'),
    getAuthToken: async () => null,
    linkPrivyToWallet: async () => {
      console.log('Mock linkPrivyToWallet called');
      return true;
    },
    checkAuthStatus: async () => {}
  };

  // Set the global window mocks
  if (typeof window !== 'undefined') {
    (window as any).useAuthContext = () => mockAuthValue;
    (window as any).usePrivyAuth = () => mockPrivyAuthValue;
  }

  return (
    <div className="mock-auth-provider">
      {children}
    </div>
  );
};

// Mock auth decorator for Storybook
export const withAuthMock = (StoryFn: React.ComponentType) => {
  return (
    <MockAuthProvider>
      <StoryFn />
    </MockAuthProvider>
  );
};

// Mock Twitter Login Button component
export const MockTwitterLoginButton: React.FC<{
  linkMode?: boolean;
  className?: string;
  onClick?: () => void;
}> = ({ 
  linkMode = false, 
  className = "",
  onClick 
}) => {
  const handleTwitterAuth = () => {
    console.log('Mock Twitter auth called');
    if (onClick) onClick();
  };

  return (
    <Button
      onClick={handleTwitterAuth}
      variant={linkMode ? "outline" : "secondary"}
      className={`flex items-center justify-center gap-2 ${className}`}
      aria-label={linkMode ? "Link Twitter Account" : "Login with Twitter"}
    >
      <FaTwitter className="text-[#1DA1F2]" />
      {linkMode ? "Link Twitter Account" : "Login with Twitter"}
    </Button>
  );
};

// Mock Privy Login Button
export const MockPrivyLoginButton: React.FC<{
  linkMode?: boolean;
  className?: string;
  onClick?: () => void;
}> = ({ 
  linkMode = false, 
  className = "",
  onClick 
}) => {
  const handlePrivyAuth = () => {
    console.log('Mock Privy auth called');
    if (onClick) onClick();
  };

  return (
    <Button
      onClick={handlePrivyAuth}
      variant={linkMode ? "outline" : "primary"}
      className={`flex items-center justify-center gap-2 ${className}`}
      aria-label={linkMode ? "Link Privy Account" : "Login with Privy"}
    >
      <svg 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="mr-2"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" fill="currentColor" />
      </svg>
      {linkMode ? "Link Email Account" : "Continue with Email"}
    </Button>
  );
};

// Mock LoginOptions component
export const MockLoginOptions: React.FC<{
  className?: string;
}> = ({ 
  className = ""
}) => {
  return (
    <div className={`space-y-4 w-full max-w-md mx-auto ${className}`}>
      <MockPrivyLoginButton />
      <div className="flex items-center my-4">
        <div className="flex-1 h-px bg-gray-700"></div>
        <div className="px-4 text-sm text-gray-400">or</div>
        <div className="flex-1 h-px bg-gray-700"></div>
      </div>
      <MockTwitterLoginButton />
      <div className="flex items-center my-4">
        <div className="flex-1 h-px bg-gray-700"></div>
        <div className="px-4 text-sm text-gray-400">or</div>
        <div className="flex-1 h-px bg-gray-700"></div>
      </div>
      <Button
        onClick={() => console.log('Mock wallet connect called')}
        variant="outline"
        className="w-full flex items-center justify-center gap-2"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 7.5V6.75C21 5.51 20.38 4.26 19.5 3.37C18.62 2.49 17.38 2 16.12 2H7.88C6.62 2 5.38 2.49 4.5 3.37C3.62 4.26 3 5.51 3 6.75V17.25C3 19.45 4.8 21.25 7 21.25H17C19.2 21.25 21 19.45 21 17.25V16.5C21.83 16.5 22.5 15.83 22.5 15V9C22.5 8.17 21.83 7.5 21 7.5ZM19.5 8.25V15H15.75C14.5 15 13.5 16 13.5 17.25C13.5 17.87 13.19 18.64 12.03 18.64C10.86 18.64 10.5 17.87 10.5 17.25V11.37C10.5 10.03 9.34 9 8.01 9H4.5V6.75C4.5 6.04 4.8 5.37 5.34 4.87C5.88 4.37 6.62 4.1 7.37 4.1H16.13C16.88 4.1 17.62 4.37 18.16 4.87C18.7 5.37 19 6.04 19 6.75V7.5C19.16 7.5 19.34 7.53 19.5 7.58V8.25Z" fill="currentColor"/>
        </svg>
        Connect Wallet
      </Button>
    </div>
  );
};