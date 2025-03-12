// src/contexts/AuthContext.test.tsx
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuthContext, AuthContextType } from './AuthContext';
import { User } from '../types';

// Mock the hooks used by AuthContext
jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    user: null,
    loading: false,
    error: null,
    isWalletConnected: false,
    walletAddress: undefined,
    isAdmin: jest.fn(() => false),
    isSuperAdmin: jest.fn(() => false),
    isFullyConnected: jest.fn(() => false),
    checkAuth: jest.fn(),
    getAccessToken: jest.fn(() => Promise.resolve(null)),
  })),
}));

// Mock useStore
const mockConnectWallet = jest.fn();
const mockDisconnectWallet = jest.fn();
jest.mock('../store/useStore', () => ({
  useStore: jest.fn(() => ({
    connectWallet: mockConnectWallet,
    disconnectWallet: mockDisconnectWallet,
    isConnecting: false,
    user: null,
  })),
}));

// Test component that consumes the context
const TestConsumer: React.FC = () => {
  const auth = useAuthContext();
  return (
    <div>
      <div data-testid="auth-status">
        {auth.isWalletConnected ? 'connected' : 'disconnected'}
      </div>
      <div data-testid="user-info">
        {auth.user ? auth.user.nickname : 'no-user'}
      </div>
      <div data-testid="admin-status">
        {auth.isAdmin() ? 'admin' : 'not-admin'}
      </div>
      <button onClick={auth.connectWallet} data-testid="connect-button">
        Connect
      </button>
      <button onClick={auth.disconnectWallet} data-testid="disconnect-button">
        Disconnect
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides auth context to child components', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('disconnected');
    expect(screen.getByTestId('user-info')).toHaveTextContent('no-user');
    expect(screen.getByTestId('admin-status')).toHaveTextContent('not-admin');
  });

  it('connects wallet when requested', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    const connectButton = screen.getByTestId('connect-button');
    act(() => {
      connectButton.click();
    });

    expect(mockConnectWallet).toHaveBeenCalled();
  });

  it('disconnects wallet when requested', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    const disconnectButton = screen.getByTestId('disconnect-button');
    act(() => {
      disconnectButton.click();
    });

    expect(mockDisconnectWallet).toHaveBeenCalled();
  });

  it('throws an error when used outside of AuthProvider', () => {
    // Suppress console.error for this test to avoid noisy output
    const originalConsoleError = console.error;
    console.error = jest.fn();

    // Error should be thrown when rendering TestConsumer outside AuthProvider
    expect(() => {
      render(<TestConsumer />);
    }).toThrow('useAuthContext must be used within an AuthProvider');

    // Restore console.error
    console.error = originalConsoleError;
  });
});