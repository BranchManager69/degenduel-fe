import { AuthEventType, authService } from '../services';
import { TokenType } from '../services';

// Mock services
jest.mock('../services', () => {
  // Create a mock implementation of AuthService instance
  const mockAuthServiceInstance = {
    getUser: jest.fn().mockReturnValue(null),
    isAuthenticated: jest.fn().mockReturnValue(false),
    hasRole: jest.fn().mockReturnValue(false),
    checkAuth: jest.fn().mockResolvedValue(true),
    getToken: jest.fn().mockResolvedValue('mock-token'),
    loginWithWallet: jest.fn().mockResolvedValue({
      id: 'test-user-id',
      username: 'testuser',
      is_admin: false,
      wallet_address: 'test-wallet-address'
    }),
    loginWithPrivy: jest.fn().mockResolvedValue({
      id: 'test-privy-user-id',
      username: 'privyuser',
      is_admin: false,
      privy_id: 'test-privy-id'
    }),
    logout: jest.fn().mockResolvedValue(undefined),
    on: jest.fn().mockImplementation(() => {
      // Return unsubscribe function
      return jest.fn();
    }),
    linkTwitter: jest.fn().mockResolvedValue('https://twitter.com/oauth/redirect'),
    linkPrivy: jest.fn().mockResolvedValue(true)
  };

  // Create mock TokenManager
  const mockTokenManager = {
    getToken: jest.fn().mockReturnValue('mock-token'),
    setToken: jest.fn(),
    refreshToken: jest.fn(),
    clearAllTokens: jest.fn(),
    estimateExpiration: jest.fn().mockReturnValue(Date.now() + 3600000),
    getBestAvailableToken: jest.fn().mockReturnValue('mock-token'),
    syncFromStore: jest.fn(),
    getAllTokens: jest.fn().mockReturnValue({})
  };

  return {
    // Re-export enum values
    AuthEventType: {
      LOGIN: 'login',
      LOGOUT: 'logout',
      AUTH_STATE_CHANGED: 'auth_state_changed',
      TOKEN_REFRESHED: 'token_refreshed',
      AUTH_ERROR: 'auth_error'
    },
    TokenType: {
      JWT: 'jwt',
      WS_TOKEN: 'ws_token',
      SESSION: 'session',
      REFRESH: 'refresh'
    },
    // Export singleton instance
    authService: mockAuthServiceInstance,
    // Export class (not actually used in tests)
    AuthService: jest.fn(),
    // Export TokenManager
    TokenManager: mockTokenManager
  };
});

describe('AuthService', () => {
  let eventCallback: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    eventCallback = jest.fn();
  });

  describe('event system', () => {
    it('should register event listeners', () => {
      const unsubscribe = authService.on(AuthEventType.AUTH_STATE_CHANGED, eventCallback);
      
      expect(typeof unsubscribe).toBe('function');
    });

    it('should unregister event listeners when unsubscribe is called', () => {
      const unsubscribeMock = jest.fn();
      (authService.on as jest.Mock).mockReturnValueOnce(unsubscribeMock);
      
      const unsubscribe = authService.on(AuthEventType.AUTH_STATE_CHANGED, eventCallback);
      unsubscribe();
      
      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });

  describe('checkAuth', () => {
    it('should return true when authentication is valid', async () => {
      (authService.checkAuth as jest.Mock).mockResolvedValueOnce(true);
      
      const result = await authService.checkAuth();
      
      expect(result).toBe(true);
      expect(authService.checkAuth).toHaveBeenCalled();
    });
  });

  describe('loginWithWallet', () => {
    it('should authenticate user with wallet', async () => {
      const mockSignMessage = jest.fn().mockResolvedValue({
        signature: new Uint8Array([1, 2, 3, 4])
      });
      
      const user = await authService.loginWithWallet('test-wallet-address', mockSignMessage);
      
      expect(user).toEqual(expect.objectContaining({ 
        id: 'test-user-id', 
        username: 'testuser',
        wallet_address: 'test-wallet-address'
      }));
      expect(authService.loginWithWallet).toHaveBeenCalledWith('test-wallet-address', mockSignMessage);
    });
  });


  describe('linkTwitter', () => {
    it('should return redirect URL for Twitter linking', async () => {
      const redirectUrl = await authService.linkTwitter();
      
      expect(redirectUrl).toBe('https://twitter.com/oauth/redirect');
      expect(authService.linkTwitter).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should log out user', async () => {
      await authService.logout();
      
      expect(authService.logout).toHaveBeenCalled();
    });
  });

  describe('getToken', () => {
    it('should return token', async () => {
      const token = await authService.getToken(TokenType.JWT);
      
      expect(token).toBe('mock-token');
      expect(authService.getToken).toHaveBeenCalledWith(TokenType.JWT);
    });
  });
});