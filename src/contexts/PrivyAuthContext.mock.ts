// src/contexts/PrivyAuthContext.mock.ts
// This file provides mock implementations of PrivyAuthContext hooks for Storybook

// Mock data for the Privy auth context
export const mockPrivyAuthContextValue = {
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

// Mock implementation of the usePrivyAuth hook
export const usePrivyAuth = () => mockPrivyAuthContextValue;