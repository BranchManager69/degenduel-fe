// Mock the dd-api module
jest.mock('./dd-api', () => ({
  ddApi: {
    auth: {
      getNonce: jest.fn(),
      verifySignature: jest.fn(),
      getWebSocketToken: jest.fn()
    },
    users: {
      getOne: jest.fn(),
      update: jest.fn()
    },
    tokens: {
      getPrice: jest.fn(),
      getHistoricalPrices: jest.fn()
    }
  },
  formatBonusPoints: jest.fn()
}));

// Import after mocking
import { ddApi, formatBonusPoints } from './dd-api';

// Mock the fetch function
global.fetch = jest.fn();

describe('DegenDuel API Service', () => {
  const mockResponse = (status: number, data: any) => 
    Promise.resolve({
      status,
      ok: status >= 200 && status < 300,
      json: () => Promise.resolve(data),
      headers: new Headers(),
    }) as Response;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication flows', () => {
    it('should generate a nonce for wallet signing', async () => {
      const walletAddress = 'wallet-address-123';
      const mockNonceResponse = { nonce: 'random-nonce-string-123' };

      // Setup the mock to return success response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse(200, mockNonceResponse)
      );

      // Call the function
      const result = await ddApi.auth.getNonce(walletAddress);

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/auth/nonce?wallet_address=${walletAddress}`,
        expect.objectContaining({
          method: 'GET'
        })
      );

      // Verify result matches the mock response
      expect(result).toEqual(mockNonceResponse);
    });

    it('should verify a signature and return an auth token', async () => {
      const walletAddress = 'wallet-address-123';
      const signature = 'signed-message-data';
      const mockVerifyResponse = { 
        token: 'jwt-auth-token',
        user: {
          wallet_address: walletAddress,
          nickname: 'Trader1',
          role: 'user'
        }
      };

      // Setup the mock to return success response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse(200, mockVerifyResponse)
      );

      // Call the function
      const result = await ddApi.auth.verifySignature(walletAddress, signature);

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/verify',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            wallet_address: walletAddress,
            signature
          })
        })
      );

      // Verify result matches the mock response
      expect(result).toEqual(mockVerifyResponse);
    });

    it('should handle invalid signature verification', async () => {
      const walletAddress = 'wallet-address-123';
      const invalidSignature = 'invalid-signature';
      const errorResponse = { 
        error: 'Invalid signature',
        message: 'The signature could not be verified'
      };

      // Setup the mock to return error response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse(401, errorResponse)
      );

      // Expect function to throw an error
      await expect(ddApi.auth.verifySignature(walletAddress, invalidSignature))
        .rejects.toThrow(/Invalid signature/);

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/verify',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            wallet_address: walletAddress,
            signature: invalidSignature
          })
        })
      );
    });
  });

  describe('User profile management', () => {
    it('should fetch user profile data', async () => {
      const walletAddress = 'wallet-address-123';
      const mockUserData = {
        wallet_address: walletAddress,
        nickname: 'Trader1',
        created_at: '2023-01-01T00:00:00Z',
        rank_score: 1500,
        role: 'user'
      };

      // Setup the mock to return success response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse(200, mockUserData)
      );

      // Call the function
      const result = await ddApi.users.getOne(walletAddress);

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/users/${walletAddress}`,
        expect.objectContaining({
          method: 'GET'
        })
      );

      // Verify result matches the mock response
      expect(result).toEqual(mockUserData);
    });

    it('should update user profile data', async () => {
      const walletAddress = 'wallet-address-123';
      const updateData = {
        nickname: 'NewNickname',
        profile_image: 'image-url'
      };
      const mockResponse = {
        ...updateData,
        wallet_address: walletAddress,
        updated_at: '2023-02-01T00:00:00Z'
      };

      // Setup the mock to return success response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse(200, { success: true })
      );

      // Call the function
      const result = await ddApi.users.update(walletAddress, updateData);

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/users/${walletAddress}`,
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(updateData)
        })
      );

      // Verify result matches the mock response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Token management', () => {
    it('should fetch token price data', async () => {
      const tokenId = 'token-123';
      const mockPriceData = {
        id: tokenId,
        symbol: 'TKN',
        name: 'Test Token',
        current_price: 1.23,
        price_change_24h: 0.05,
        price_change_percentage_24h: 4.2
      };

      // Setup the mock to return success response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse(200, mockPriceData)
      );

      // Call the function
      const result = await ddApi.tokens.getPrice(tokenId);

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/tokens/${tokenId}/price`,
        expect.objectContaining({
          method: 'GET'
        })
      );

      // Verify result matches the mock response
      expect(result).toEqual(mockPriceData);
    });

    it('should fetch historical price data for a token', async () => {
      const tokenId = 'token-123';
      const timeframe = '7d';
      const mockHistoricalData = {
        id: tokenId,
        timeframe,
        prices: [
          { timestamp: '2023-01-01T00:00:00Z', price: 1.0 },
          { timestamp: '2023-01-02T00:00:00Z', price: 1.1 },
          { timestamp: '2023-01-03T00:00:00Z', price: 1.2 }
        ]
      };

      // Setup the mock to return success response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse(200, mockHistoricalData)
      );

      // Call the function
      const result = await ddApi.tokens.getHistoricalPrices(tokenId, timeframe);

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/tokens/${tokenId}/historical-prices?timeframe=${timeframe}`,
        expect.objectContaining({
          method: 'GET'
        })
      );

      // Verify result matches the mock response
      expect(result).toEqual(mockHistoricalData);
    });
  });

  describe('Utility functions', () => {
    it('should format bonus points correctly', () => {
      expect(formatBonusPoints(1234)).toBe('1,234.00');
      expect(formatBonusPoints(1234.5678)).toBe('1,234.57');
      expect(formatBonusPoints(0)).toBe('0.00');
      expect(formatBonusPoints(1000000)).toBe('1,000,000.00');
    });
  });

  describe('Error handling', () => {
    it('should handle network errors gracefully', async () => {
      // Setup the mock to simulate a network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      // Expect function to throw an error with appropriate message
      await expect(ddApi.users.getOne('wallet-123'))
        .rejects.toThrow('Network error');
    });

    it('should handle API errors with structured error responses', async () => {
      const errorResponse = {
        error: 'Resource not found',
        message: 'The requested resource could not be found',
        code: 'NOT_FOUND'
      };

      // Setup the mock to return error response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse(404, errorResponse)
      );

      // Expect function to throw an error containing the API error details
      try {
        await ddApi.users.getOne('nonexistent-wallet');
        fail('Expected an error to be thrown');
      } catch (error: any) {
        expect(error.message).toContain('Resource not found');
        expect(error.response).toEqual(errorResponse);
      }
    });
  });
});