// Mock UnifiedAuthContext for Storybook
import React, { ReactNode } from 'react';

// Mock user for stories
const mockUser = {
  id: 'mock-user-123',
  username: 'DegenTester',
  nickname: 'DegenTester',
  wallet_address: 'mockwallet123456789',
  email: 'tester@degenduel.com',
  role: 'user',
  auth_method: 'wallet',
  is_admin: false,
  is_superadmin: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Mock auth context type
export interface UnifiedAuthContextType {
  loading: boolean;
  isAuthenticated: boolean;
  user: any;
  activeMethod: string | null;
  error: Error | null;
  loginWithWallet: (walletAddress: string, signMessage: (message: Uint8Array) => Promise<any>) => Promise<any>;
  logout: () => Promise<void>;
  getToken: (type?: string) => Promise<string | null>;
  getAccessToken: () => Promise<string | null>;
  linkTwitter: () => Promise<string>;
  linkDiscord: () => Promise<string>;
  linkTelegram: () => Promise<string>;
  linkPasskey: () => Promise<void>;
  isWalletAuth: boolean;
  isTwitterAuth: boolean;
  isTwitterLinked: boolean;
  isDiscordAuth: boolean;
  isDiscordLinked: boolean;
  isTelegramAuth: boolean;
  isTelegramLinked: boolean;
  isPasskeyAuth: boolean;
  isPasskeyLinked: boolean;
  checkAuth: () => Promise<boolean>;
  hardReset: () => void;
}

// Mock auth context value
const mockAuthValue: UnifiedAuthContextType = {
  loading: false,
  isAuthenticated: true,
  user: mockUser,
  activeMethod: 'wallet',
  error: null,
  loginWithWallet: async () => mockUser,
  logout: async () => { },
  getToken: async () => 'mock-token',
  getAccessToken: async () => 'mock-token',
  linkTwitter: async () => 'mock-url',
  linkDiscord: async () => 'mock-url',
  linkTelegram: async () => 'mock-url',
  linkPasskey: async () => { },
  isWalletAuth: true,
  isTwitterAuth: false,
  isTwitterLinked: false,
  isDiscordAuth: false,
  isDiscordLinked: false,
  isTelegramAuth: false,
  isTelegramLinked: false,
  isPasskeyAuth: false,
  isPasskeyLinked: false,
  checkAuth: async () => true,
  hardReset: () => { },
};

// Mock context
const UnifiedAuthContext = React.createContext<UnifiedAuthContextType>(mockAuthValue);

// Mock provider
export const UnifiedAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  console.log('[Storybook] Using mock UnifiedAuthProvider');
  return React.createElement(
    UnifiedAuthContext.Provider,
    { value: mockAuthValue },
    children
  );
};

// Mock useAuth hook
export function useAuth(): UnifiedAuthContextType {
  console.log('[Storybook] Using mock useAuth hook');
  return mockAuthValue;
} 