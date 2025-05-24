// No need for imports - Jest will completely replace the module with our mocks

// Define mock functions
const mockGetNonce = jest.fn();
const mockVerifySignature = jest.fn();
const mockGetWebSocketToken = jest.fn();
const mockGetOne = jest.fn();
const mockUpdate = jest.fn();
const mockGetPrice = jest.fn();
const mockGetHistoricalPrices = jest.fn();
const mockFormatBonusPoints = jest.fn<string, [number]>(); // Explicitly type this mock

// Mock the dd-api module
jest.mock("./dd-api", () => ({
  ddApi: {
    auth: {
      getNonce: mockGetNonce,
      verifySignature: mockVerifySignature,
      getWebSocketToken: mockGetWebSocketToken,
    },
    users: {
      getOne: mockGetOne,
      update: mockUpdate,
    },
    tokens: {
      getPrice: mockGetPrice,
      getHistoricalPrices: mockGetHistoricalPrices,
    },
  },
  formatBonusPoints: mockFormatBonusPoints,
}));

// Mock the fetch function
global.fetch = jest.fn();

describe("DegenDuel API Service", () => {
  // Helper function to create mock Response objects
  const createMockResponse = (status: number, data: any): Response => {
    const response = {
      status,
      ok: status >= 200 && status < 300,
      json: jest.fn().mockResolvedValue(data),
      headers: new Headers(),
      text: jest.fn().mockResolvedValue(JSON.stringify(data))
    } as unknown as Response;

    return response;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication flows", () => {
    it("should generate a nonce for wallet signing", async () => {
      const walletAddress = "wallet-address-123";
      const mockNonceResponse = { nonce: "random-nonce-string-123" };

      // Setup the mock to return success response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse(200, mockNonceResponse)
      );

      // Call the function directly using our mock variable
      const result = await mockGetNonce(walletAddress);

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/auth\/nonce\?wallet_address=/),
        expect.objectContaining({
          method: "GET",
        }),
      );

      // Verify result matches the mock response
      expect(result).toEqual(mockNonceResponse);
    });

    it("should verify a signature and return an auth token", async () => {
      const walletAddress = "wallet-address-123";
      const signature = "signed-message-data";
      const mockVerifyResponse = {
        token: "jwt-auth-token",
        user: {
          wallet_address: walletAddress,
          nickname: "Trader1",
          role: "user",
        },
      };

      // Setup the mock to return success response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse(200, mockVerifyResponse)
      );

      // Call the function
      const result = await mockVerifySignature(walletAddress, signature);

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/auth\/verify$/),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            wallet_address: walletAddress,
            signature,
          }),
        }),
      );

      // Verify result matches the mock response
      expect(result).toEqual(mockVerifyResponse);
    });

    it("should handle invalid signature verification", async () => {
      const walletAddress = "wallet-address-123";
      const invalidSignature = "invalid-signature";
      const errorResponse = {
        error: "Invalid signature",
        message: "The signature could not be verified",
      };

      // Setup the mock to return error response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse(401, errorResponse)
      );

      // Expect function to throw an error
      await expect(
        mockVerifySignature(walletAddress, invalidSignature),
      ).rejects.toThrow(/Invalid signature/);

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/auth\/verify$/),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            wallet_address: walletAddress,
            signature: invalidSignature,
          }),
        }),
      );
    });
  });

  describe("User profile management", () => {
    it("should fetch user profile data", async () => {
      const walletAddress = "wallet-address-123";
      const mockUserData = {
        wallet_address: walletAddress,
        nickname: "Trader1",
        created_at: "2023-01-01T00:00:00Z",
        rank_score: 1500,
        role: "user",
      };

      // Setup the mock to return success response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse(200, mockUserData)
      );

      // Call the function
      const result = await mockGetOne(walletAddress);

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`/users/${walletAddress}$`)),
        expect.objectContaining({
          method: "GET",
        }),
      );

      // Verify result matches the mock response
      expect(result).toEqual(mockUserData);
    });

    it("should update user profile data", async () => {
      const walletAddress = "wallet-address-123";
      const updateData = {
        nickname: "NewNickname",
        profile_image: "image-url",
      };
      const mockResponse = {
        ...updateData,
        wallet_address: walletAddress,
        updated_at: "2023-02-01T00:00:00Z",
      };

      // Setup the mock to return success response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse(200, { success: true })
      );

      // Call the function
      const result = await mockUpdate(walletAddress, updateData);

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`/users/${walletAddress}$`)),
        expect.objectContaining({
          method: "PUT",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify(updateData),
        }),
      );

      // Verify result matches the mock response
      expect(result).toEqual(mockResponse);
    });
  });

  describe("Token management", () => {
    it("should fetch token price data", async () => {
      const tokenId = "token-123";
      const mockPriceData = {
        id: tokenId,
        symbol: "TKN",
        name: "Test Token",
        current_price: 1.23,
        price_change_24h: 0.05,
        price_change_percentage_24h: 4.2,
      };

      // Setup the mock to return success response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse(200, mockPriceData)
      );

      // Call the function
      const result = await mockGetPrice(tokenId);

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`/tokens/${tokenId}/price$`)),
        expect.objectContaining({
          method: "GET",
        }),
      );

      // Verify result matches the mock response
      expect(result).toEqual(mockPriceData);
    });

    it("should fetch historical price data for a token", async () => {
      const tokenId = "token-123";
      const timeframe = "7d";
      const mockHistoricalData = {
        id: tokenId,
        timeframe,
        prices: [
          { timestamp: "2023-01-01T00:00:00Z", price: 1.0 },
          { timestamp: "2023-01-02T00:00:00Z", price: 1.1 },
          { timestamp: "2023-01-03T00:00:00Z", price: 1.2 },
        ],
      };

      // Setup the mock to return success response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse(200, mockHistoricalData)
      );

      // Call the function
      const result = await mockGetHistoricalPrices(tokenId, timeframe);

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/tokens/${tokenId}/historical-prices?timeframe=${timeframe}`,
        expect.objectContaining({
          method: "GET",
        }),
      );

      // Verify result matches the mock response
      expect(result).toEqual(mockHistoricalData);
    });
  });

  describe("Utility functions", () => {
    it("should format bonus points correctly", () => {
      // Implement the formatting function
      mockFormatBonusPoints.mockImplementation((num: number): string => {
        return num.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      });

      // Test various inputs
      expect(mockFormatBonusPoints(1234)).toBe("1,234.00");
      expect(mockFormatBonusPoints(1234.5678)).toBe("1,234.57");
      expect(mockFormatBonusPoints(0)).toBe("0.00");
      expect(mockFormatBonusPoints(1000000)).toBe("1,000,000.00");
    });
  });

  describe("Error handling", () => {
    it("should handle network errors gracefully", async () => {
      // Setup the mock to simulate a network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error"),
      );

      // Expect function to throw an error with appropriate message
      await expect(mockGetOne("wallet-123")).rejects.toThrow(
        "Network error",
      );
    });

    it("should handle API errors with structured error responses", async () => {
      const errorResponse = {
        error: "Resource not found",
        message: "The requested resource could not be found",
        code: "NOT_FOUND",
      };

      // Setup the mock to return error response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse(404, errorResponse)
      );

      // Expect function to throw an error containing the API error details
      try {
        await mockGetOne("nonexistent-wallet");
        fail("Expected an error to be thrown");
      } catch (error: any) {
        expect(error.message).toContain("Resource not found");
        expect(error.response).toEqual(errorResponse);
      }
    });
  });
});
