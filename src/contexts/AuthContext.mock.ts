// src/contexts/AuthContext.mock.ts
// This file provides mock implementations of AuthContext hooks for Storybook

import { AuthContextType } from './AuthContext';

// Mock data for the auth context
export const mockAuthContextValue: AuthContextType = {
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

// Mock implementation of the useAuthContext hook
export const useAuthContext = () => mockAuthContextValue;