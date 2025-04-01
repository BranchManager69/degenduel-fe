// Mock implementations of hooks for Storybook stories

// Mock the useStore hooks
export const mockUseStore = {
  user: null,
  isConnecting: false,
  connectWallet: () => console.log('Mock connectWallet called'),
  disconnectWallet: () => console.log('Mock disconnectWallet called'),
  setUser: () => {},
  walletBalance: '1000',
  achievements: {
    userProgress: {
      level: 5,
      xp: 500,
      nextLevelXp: 1000
    }
  }
};

// Mock AuthContext hook
export const mockAuthData = {
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

// Mock for useAuthContext hook
export const useAuthContext = () => mockAuthData;

// Mock for Privy auth
export const mockPrivyAuthData = {
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

// Mock for usePrivyAuth hook
export const usePrivyAuth = () => mockPrivyAuthData;