// src/services/api/auth.test.ts

import axios from "axios";

import { useStore } from "../../store/useStore";

// Mock axios
jest.mock("axios");
const mockAxios = axios as jest.Mocked<typeof axios>;

// Mock the useStore hook
jest.mock("../../store/useStore", () => ({
  useStore: {
    getState: jest.fn(),
  },
}));

// Mock config values
jest.mock("../../config/config", () => ({
  API_URL: "/api",
  DDAPI_DEBUG_MODE: "false",
}));

// Import the functions to test after mocking
import {
  getSessionData,
  getWebSocketToken,
  verifyWalletSignature,
} from "./auth";

describe("Authentication API Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default useStore mock
    (useStore.getState as jest.Mock).mockReturnValue({
      user: null,
      setUser: jest.fn(),
    });
  });

  describe("getSessionData", () => {
    it("should fetch the current session data", async () => {
      // Mock successful response
      mockAxios.get.mockResolvedValueOnce({
        status: 200,
        data: {
          user: {
            wallet_address: "test-wallet",
            nickname: "TestUser",
            role: "user",
          },
          session: {
            expires: "2025-01-01T00:00:00.000Z",
          },
        },
      });

      const result = await getSessionData();

      // Verify axios was called with correct parameters
      expect(mockAxios.get).toHaveBeenCalledWith(
        expect.stringMatching(/\/auth\/session$/),
        expect.objectContaining({
          withCredentials: true,
        }),
      );

      // Verify result contains user data
      expect(result).toHaveProperty("user");
      expect(result.user).toHaveProperty("wallet_address", "test-wallet");
    });

    it("should handle session expiration", async () => {
      // Mock 401 response
      mockAxios.get.mockRejectedValueOnce({
        response: {
          status: 401,
          data: {
            error: "Unauthorized",
            message: "Session expired",
          },
        },
      });

      const result = await getSessionData();

      // When session is expired or unauthorized, should return null user
      expect(result).toHaveProperty("user", null);
      expect(result).toHaveProperty("error");
      expect(result.error).toContain("Session expired");
    });

    it("should handle network errors", async () => {
      // Mock network error
      mockAxios.get.mockRejectedValueOnce(new Error("Network Error"));

      const result = await getSessionData();

      // Should handle network errors gracefully
      expect(result).toHaveProperty("user", null);
      expect(result).toHaveProperty("error");
      expect(result.error).toContain("Network Error");
    });
  });

  describe("getWebSocketToken", () => {
    it("should fetch a WebSocket authentication token", async () => {
      // Mock successful response
      mockAxios.get.mockResolvedValueOnce({
        status: 200,
        data: {
          token: "test-ws-token",
          expiresIn: 3600,
        },
      });

      const result = await getWebSocketToken();

      // Verify axios was called with correct parameters
      expect(mockAxios.get).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/auth\/token\?_t=\d+/),
        expect.objectContaining({
          withCredentials: true,
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      );

      // Verify result contains token
      expect(result).toBe("test-ws-token");
    });

    it("should handle authentication errors for WebSocket token", async () => {
      // Mock 401 response
      mockAxios.get.mockRejectedValueOnce({
        response: {
          status: 401,
          data: {
            error: "Unauthorized",
            message: "User not authenticated",
          },
        },
      });

      const result = await getWebSocketToken();

      // Should return null if not authenticated
      expect(result).toBeNull();
    });

    it("should handle network errors", async () => {
      // Mock network error
      mockAxios.get.mockRejectedValueOnce(new Error("Network Error"));

      const result = await getWebSocketToken();

      // Should handle network errors gracefully
      expect(result).toBeNull();
    });
  });

  describe("verifyWalletSignature", () => {
    const mockWallet = "test-wallet-address";
    const mockSignature = new Uint8Array([1, 2, 3, 4]); // Mock signature bytes
    const mockMessage = "Test message to sign";

    it("should verify a wallet signature and return user data", async () => {
      // Setup mock store
      const mockSetUser = jest.fn();
      (useStore.getState as jest.Mock).mockReturnValue({
        setUser: mockSetUser,
      });

      // Mock successful response
      mockAxios.post.mockResolvedValueOnce({
        status: 200,
        data: {
          user: {
            wallet_address: mockWallet,
            nickname: "TestUser",
            role: "user",
            jwt: "jwt-auth-token",
          },
          token: "jwt-auth-token",
        },
      });

      const result = await verifyWalletSignature(
        mockWallet,
        mockSignature,
        mockMessage,
      );

      // Verify axios was called with correct parameters
      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.stringMatching(/\/auth\/verify-wallet$/),
        expect.objectContaining({
          wallet: mockWallet,
          signature: Array.from(mockSignature), // Converted to array for JSON
          message: mockMessage,
        }),
        expect.objectContaining({
          withCredentials: true,
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      );

      // Verify user is set in store
      expect(mockSetUser).toHaveBeenCalledWith(
        expect.objectContaining({
          wallet_address: mockWallet,
          jwt: "jwt-auth-token", // Match the token in the mock response
        }),
      );

      // Verify result contains user data
      expect(result).toHaveProperty("user");
      expect(result.user).toHaveProperty("wallet_address", mockWallet);
    });

    it("should handle verification errors", async () => {
      // Mock 401 response
      mockAxios.post.mockRejectedValueOnce({
        response: {
          status: 401,
          data: {
            error: "Unauthorized",
            message: "Invalid signature",
          },
        },
      });

      // Expect function to throw an error with appropriate message
      await expect(
        verifyWalletSignature(mockWallet, mockSignature, mockMessage),
      ).rejects.toThrow("Invalid signature");
    });

    it("should handle network errors during verification", async () => {
      // Mock network error
      mockAxios.post.mockRejectedValueOnce(new Error("Network Error"));

      // Expect function to throw the network error
      await expect(
        verifyWalletSignature(mockWallet, mockSignature, mockMessage),
      ).rejects.toThrow("Network Error");
    });

    it("should handle server unavailability", async () => {
      // Mock 502 Bad Gateway response
      mockAxios.post.mockRejectedValueOnce({
        response: {
          status: 502,
          data: "Bad Gateway",
        },
      });

      // Expect function to throw a user-friendly error
      await expect(
        verifyWalletSignature(mockWallet, mockSignature, mockMessage),
      ).rejects.toThrow("Server is currently unavailable");
    });
  });
});
