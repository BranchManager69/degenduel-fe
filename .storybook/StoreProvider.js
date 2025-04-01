import React from 'react';

// Mock Zustand store
const mockStore = {
  user: null,
  isConnecting: false,
  connectWallet: () => console.log('connectWallet called'),
  disconnectWallet: () => console.log('disconnectWallet called'),
  setUser: () => console.log('setUser called'),
  maintenanceMode: false,
  setMaintenanceMode: () => {},
  walletBalance: '1000',
  achievements: {
    userProgress: {
      level: 5,
      xp: 500,
      nextLevelXp: 1000
    }
  }
};

// Mock for the useStore hook
const createMockStore = () => {
  const store = {
    ...mockStore,
    getState: () => store
  };
  return store;
};

// Mock the useStore implementation
jest.mock('../src/store/useStore', () => ({
  __esModule: true,
  useStore: jest.fn((selector) => 
    selector ? selector(mockStore) : mockStore
  ),
  default: createMockStore()
}));

// Mock for the auth context
const AuthContextMock = React.createContext({
  user: null,
  isAdmin: () => false,
  isSuperAdmin: () => false,
  checkAuth: async () => {}
});

// Mock for the Privy auth context
const PrivyAuthContextMock = React.createContext({
  isAuthenticated: false,
  isLoading: false,
  isPrivyLinked: false,
  user: null,
  login: () => console.log('Privy login called'),
  logout: () => console.log('Privy logout called'),
  getAuthToken: async () => null,
  linkPrivyToWallet: async () => {
    console.log('Link Privy to wallet called');
    return true;
  },
  checkAuthStatus: async () => {}
});

// Export the StoreProvider for Storybook
export const StoreProvider = ({ children }) => {
  return (
    <AuthContextMock.Provider value={{
      user: null,
      isAdmin: () => false,
      isSuperAdmin: () => false,
      checkAuth: async () => {}
    }}>
      <PrivyAuthContextMock.Provider value={{
        isAuthenticated: false,
        isLoading: false,
        isPrivyLinked: false,
        user: null,
        login: () => console.log('Privy login called'),
        logout: () => console.log('Privy logout called'),
        getAuthToken: async () => null,
        linkPrivyToWallet: async () => {
          console.log('Link Privy to wallet called');
          return true;
        },
        checkAuthStatus: async () => {}
      }}>
        {children}
      </PrivyAuthContextMock.Provider>
    </AuthContextMock.Provider>
  );
};

export default StoreProvider;