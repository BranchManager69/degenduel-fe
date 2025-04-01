// src/contexts/AuthContext.mock.ts
// This file provides mock implementations of AuthContext hooks for Storybook

import { AuthContextType } from './AuthContext';

// Mock data for the auth context
export const mockAuthContextValue: AuthContextType = {
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
  connectWallet: () => console.log('Mock connectWallet called'),
  disconnectWallet: () => console.log('Mock disconnectWallet called'),
  
  // Role checks
  isSuperAdmin: () => false,
  isAdmin: () => false,
  isFullyConnected: () => false,
  
  // Auth utilities
  checkAuth: () => console.log('Mock checkAuth called'),
  getAccessToken: async () => null
};

// Mock implementation of the useAuthContext hook
export const useAuthContext = () => mockAuthContextValue;