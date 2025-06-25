// Mock useMigratedAuth for Storybook
console.log('[Storybook] Loading mock useMigratedAuth');

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

// Mock the normalized auth API interface
interface NormalizedAuthAPI {
  user: any | null;
  isLoading: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  isAdministrator: boolean;
  isSuperAdmin: boolean;
  isWalletAuth: () => boolean;
  isTwitterAuth: () => boolean;
  checkAuth: () => Promise<boolean> | void;
  getToken: (type?: string) => Promise<string | null>;
  loginWithWallet: (walletAddress: string, signMessage: (message: Uint8Array) => Promise<any>) => Promise<any>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  linkTwitter: () => Promise<string>;
  isTwitterLinked: () => boolean;
  linkDiscord: () => Promise<string>;
  isDiscordLinked: () => boolean;
  linkTelegram: () => Promise<string>;
  isTelegramLinked: () => boolean;
  linkPasskey: () => Promise<void>;
  isPasskeyLinked: () => boolean;
  activeMethod: string | null;
  error: Error | null;
}

// Mock implementation
export function useMigratedAuth(): NormalizedAuthAPI {
  console.log('[Storybook] Using mock useMigratedAuth hook');

  return {
    user: mockUser,
    isLoading: false,
    loading: false,
    isAuthenticated: true,
    isAdministrator: false,
    isSuperAdmin: false,
    activeMethod: 'wallet',
    error: null,

    // Methods
    isWalletAuth: () => true,
    isTwitterAuth: () => false,
    checkAuth: async () => true,
    getToken: async () => 'mock-token',
    loginWithWallet: async () => mockUser,
    logout: async () => { },
    getAccessToken: async () => 'mock-token',
    linkTwitter: async () => 'mock-url',
    isTwitterLinked: () => false,
    linkDiscord: async () => 'mock-url',
    isDiscordLinked: () => false,
    linkTelegram: async () => 'mock-url',
    isTelegramLinked: () => false,
    linkPasskey: async () => { },
    isPasskeyLinked: () => false,
  };
} 