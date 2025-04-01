// Mock all the hooks needed for Storybook
import React from 'react';

// Mock the Auth Context hooks
const mockAuthContext = {
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

// Mock the Privy Auth hooks
const mockPrivyAuth = {
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

// Mock the context hooks for components to use
export const useAuthContext = () => mockAuthContext;
export const usePrivyAuth = () => mockPrivyAuth;

// Mock store with user data
export const mockStore = {
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

// Other mock hooks as needed
export const useStore = (selector) => (selector ? selector(mockStore) : mockStore);