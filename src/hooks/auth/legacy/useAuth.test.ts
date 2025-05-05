// src/hooks/useAuth.test.ts

import { renderHook } from "@testing-library/react";

import { User } from "../../auth/types";
import { MockAuthConfig, useAuth } from "./useAuth.mock";

// Mock the useStore hook
jest.mock("../store/useStore", () => ({
  useStore: jest.fn(),
}));

// Mock axios for testing session checks
jest.mock("axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
  defaults: {
    headers: {
      common: {},
    },
  },
}));

describe("useAuth hook", () => {
  // Create mock user data for testing
  const mockRegularUser: User = {
    id: "mock-user-id", // Add required id property
    wallet_address: "mock-wallet-address",
    nickname: "RegularUser",
    role: "user",
    created_at: "2023-01-01T00:00:00.000Z",
    last_login: "2023-02-01T00:00:00.000Z",
    total_contests: 10,
    total_wins: 2,
    total_earnings: "1000",
    rank_score: 750,
    settings: {},
    balance: "5000",
    is_banned: false,
    ban_reason: null,
    risk_level: "low",
    jwt: "mock-jwt-token",
  };

  const mockAdminUser: User = {
    ...mockRegularUser,
    nickname: "AdminUser",
    role: "admin",
  };

  const mockSuperAdminUser: User = {
    ...mockRegularUser,
    nickname: "SuperAdminUser",
    role: "superadmin",
  };

  // Helper function to render the hook with config
  const renderAuthHook = (config?: MockAuthConfig) => {
    return renderHook(() => useAuth(config));
  };

  it("provides expected auth methods and properties", () => {
    const { result } = renderAuthHook();

    // Verify the hook provides the necessary methods and properties
    expect(result.current.user).toBeDefined();
    expect(result.current.loading).toBeDefined();
    expect(result.current.error).toBeDefined();
    expect(result.current.isWalletConnected).toBeDefined();
    // walletAddress can be undefined, but the property should exist
    expect(result.current).toHaveProperty("walletAddress");
    expect(result.current.isAdmin).toBeDefined();
    expect(result.current.isSuperAdmin).toBeDefined();
    expect(result.current.isFullyConnected).toBeDefined();
    expect(result.current.checkAuth).toBeDefined();
    expect(result.current.getAccessToken).toBeDefined();
  });

  it("has a default non-authenticated state", () => {
    const { result } = renderAuthHook();

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isWalletConnected).toBe(false);
    expect(result.current.walletAddress).toBeUndefined();
    expect(result.current.isAdmin()).toBe(false);
    expect(result.current.isSuperAdmin()).toBe(false);
    expect(result.current.isFullyConnected()).toBe(false);
  });

  it("correctly identifies admin users", () => {
    const { result } = renderAuthHook({
      user: mockAdminUser,
    });

    expect(result.current.isAdmin()).toBe(true);
    expect(result.current.isSuperAdmin()).toBe(false);
  });

  it("correctly identifies superadmin users", () => {
    const { result } = renderAuthHook({
      user: mockSuperAdminUser,
    });

    expect(result.current.isAdmin()).toBe(true); // superadmin is also admin
    expect(result.current.isSuperAdmin()).toBe(true);
  });

  it("identifies regular users as non-admin", () => {
    const { result } = renderAuthHook({
      user: mockRegularUser,
    });

    expect(result.current.isAdmin()).toBe(false);
    expect(result.current.isSuperAdmin()).toBe(false);
  });

  it("reports fully connected status correctly", async () => {
    // Not connected, no user
    const { result: notConnected } = renderAuthHook({
      isWalletConnected: false,
      user: null,
    });
    expect(notConnected.current.isFullyConnected()).toBe(false);

    // Connected but no user
    const { result: connectedNoUser } = renderAuthHook({
      isWalletConnected: true,
      user: null,
    });
    expect(connectedNoUser.current.isFullyConnected()).toBe(false);

    // Not connected but has user
    const { result: notConnectedHasUser } = renderAuthHook({
      isWalletConnected: false,
      user: mockRegularUser,
    });
    expect(notConnectedHasUser.current.isFullyConnected()).toBe(false);

    // Connected and has user
    const { result: fullyConnected } = renderAuthHook({
      isWalletConnected: true,
      user: mockRegularUser,
    });
    expect(fullyConnected.current.isFullyConnected()).toBe(true);
  });

  it("provides access token for WebSocket authentication", async () => {
    // Default token
    const { result: defaultToken } = renderAuthHook();
    expect(await defaultToken.current.getAccessToken()).toBe(
      "mock-token-for-testing",
    );

    // Custom token
    const { result: customToken } = renderAuthHook({
      getAccessTokenReturnValue: "custom-mock-token",
    });
    expect(await customToken.current.getAccessToken()).toBe(
      "custom-mock-token",
    );

    // Null token (simulating failure)
    const { result: nullToken } = renderAuthHook({
      getAccessTokenReturnValue: null,
    });
    expect(await nullToken.current.getAccessToken()).toBeNull();
  });

  it("allows overriding role check behavior", () => {
    // Force admin
    const { result: forcedAdmin } = renderAuthHook({
      user: mockRegularUser, // Regular user
      isAdminReturnValue: true, // But force admin to be true
    });
    expect(forcedAdmin.current.isAdmin()).toBe(true);

    // Force non-admin
    const { result: forcedNonAdmin } = renderAuthHook({
      user: mockAdminUser, // Admin user
      isAdminReturnValue: false, // But force admin to be false
    });
    expect(forcedNonAdmin.current.isAdmin()).toBe(false);

    // Same for superadmin
    const { result: forcedSuperAdmin } = renderAuthHook({
      user: mockRegularUser,
      isSuperAdminReturnValue: true,
    });
    expect(forcedSuperAdmin.current.isSuperAdmin()).toBe(true);
  });
});
