// src/hooks/useAuth.mock.ts

import { useState } from "react";

// Import User type from the main application
import { User } from "../types";

// This is a mock version of useAuth for testing
// Export an interface that matches the expected return type
export interface UseAuthReturnType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  isWalletConnected: boolean;
  walletAddress: string | undefined;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  isFullyConnected: () => boolean;
  checkAuth: () => void;
  getAccessToken: () => Promise<string | null>;
}

// For creating customizable mock implementations
export interface MockAuthConfig {
  user?: User | null;
  loading?: boolean;
  error?: Error | null;
  isWalletConnected?: boolean;
  walletAddress?: string;
  isAdminReturnValue?: boolean;
  isSuperAdminReturnValue?: boolean;
  getAccessTokenReturnValue?: string | null;
}

// Default mock implementation
export function useAuth(config: MockAuthConfig = {}): UseAuthReturnType {
  // Use useState to allow tests to update values
  const [user, setUser] = useState<User | null>(config.user || null);
  const [loading, setLoading] = useState<boolean>(config.loading || false);
  const [error, setError] = useState<Error | null>(config.error || null);
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(config.isWalletConnected || false);
  const [walletAddress, setWalletAddress] = useState<string | undefined>(config.walletAddress);

  // Default role check functions
  const isSuperAdmin = () => {
    return config.isSuperAdminReturnValue !== undefined 
      ? config.isSuperAdminReturnValue 
      : user?.role === "superadmin";
  };

  const isAdmin = () => {
    return config.isAdminReturnValue !== undefined
      ? config.isAdminReturnValue
      : user?.role === "admin" || user?.role === "superadmin";
  };

  const isFullyConnected = () => {
    return isWalletConnected && !!user;
  };

  // Mock checkAuth - doesn't do anything in the mock
  const checkAuth = () => {
    // Do nothing in the mock
  };

  // Mock getAccessToken - returns provided value or a default
  const getAccessToken = async (): Promise<string | null> => {
    return config.getAccessTokenReturnValue !== undefined
      ? config.getAccessTokenReturnValue
      : "mock-token-for-testing";
  };

  return {
    user,
    loading,
    error,
    isWalletConnected,
    walletAddress,
    isAdmin,
    isSuperAdmin,
    isFullyConnected,
    checkAuth,
    getAccessToken,
  };
}