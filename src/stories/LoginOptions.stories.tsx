import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import LoginOptions from '../components/auth/LoginOptions';

// Mock the necessary contexts for the real LoginOptions component
const LoginOptionsWrapper = () => {
  // Override the hooks directly before rendering component
  React.useEffect(() => {
    // Make sure we're showing the main login UI, not the linking UI
    if (typeof window !== 'undefined') {
      (window as any).useStore = () => ({
        user: null, // No user, so we see login options
        setUser: () => {},
        isWalletConnected: false,
        walletAddress: undefined,
        maintenanceMode: false
      });
    
      (window as any).usePrivyAuth = () => ({
        isAuthenticated: false,
        isLoading: false,
        isPrivyLinked: false,
        user: null,
        login: () => console.log('Mock Privy login called'),
        logout: () => console.log('Mock Privy logout called'),
        getAuthToken: async () => null,
        linkPrivyToWallet: async () => {
          console.log('Mock linkPrivyToWallet called');
          return true;
        },
        checkAuthStatus: async () => {}
      });
    }
  }, []);

  return React.createElement(
    'div',
    { className: "bg-dark-200 p-8 rounded-lg" },
    React.createElement(LoginOptions, null)
  );
};

const meta: Meta<typeof LoginOptionsWrapper> = {
  title: 'Auth/LoginOptions',
  component: LoginOptionsWrapper,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof LoginOptionsWrapper>;

export const Default: Story = {};

// For the "Link Account" version, create a wrapper that shows that state
const LinkAccountWrapper = () => {
  // Override the hooks directly before rendering component
  React.useEffect(() => {
    // Make user logged in but privy not linked
    if (typeof window !== 'undefined') {
      (window as any).useStore = () => ({
        user: { id: "mock-user-id", wallet: "0x123..." }, // Has user, so we see linking UI
        setUser: () => {},
        isWalletConnected: true,
        walletAddress: "0x123...",
        maintenanceMode: false
      });
    
      (window as any).usePrivyAuth = () => ({
        isAuthenticated: false,
        isLoading: false,
        isPrivyLinked: false, // Not linked yet
        user: null,
        login: () => console.log('Mock Privy login called'),
        logout: () => console.log('Mock Privy logout called'),
        getAuthToken: async () => null,
        linkPrivyToWallet: async () => {
          console.log('Mock linkPrivyToWallet called');
          return true;
        },
        checkAuthStatus: async () => {}
      });
    }
  }, []);

  return React.createElement(
    'div',
    { className: "bg-dark-200 p-8 rounded-lg" },
    React.createElement(LoginOptions, null)
  );
};

export const LinkAccount: Story = {
  render: () => React.createElement(LinkAccountWrapper, null)
};