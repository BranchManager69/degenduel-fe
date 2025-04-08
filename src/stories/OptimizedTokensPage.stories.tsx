// OptimizedTokensPage stories
import { Meta, StoryObj } from '@storybook/react';
import { withRouter } from 'storybook-addon-react-router-v6';
import * as React from 'react';

// Import type declarations to help TypeScript recognize window properties
import '../types/window.d.ts';
import { OptimizedTokensPage } from '../pages/public/tokens/OptimizedTokensPage';
import { createMockTokensResponse } from './TokensPage.stories';

// Create a mock context wrapper
const MockContext: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Set up mocks directly in global window object
  React.useEffect(() => {
    // Store originals
    const originalFetch = window.fetch;
    const originalUseStore = window.useStore;
    
    // Set up mocks with proper Response type
    window.fetch = () => Promise.resolve(new Response(
      JSON.stringify(createMockTokensResponse()),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    ));
    
    window.useStore = () => ({
      user: { is_admin: true },
      setUser: () => {},
      isWalletConnected: false,
      walletAddress: undefined,
      maintenanceMode: false
    });
    
    // Clean up when unmounting
    return () => {
      window.fetch = originalFetch;
      window.useStore = originalUseStore;
    };
  }, []);
  
  return <>{children}</>;
};

const meta: Meta<typeof OptimizedTokensPage> = {
  title: 'Pages/Tokens/Optimized',
  component: OptimizedTokensPage,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    withRouter,
    (Story) => (
      <MockContext>
        <div className="bg-dark-100 min-h-screen">
          <Story />
        </div>
      </MockContext>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof OptimizedTokensPage>;

export const Default: Story = {
  parameters: {
    reactRouter: {
      routePath: '/tokens',
      browserPath: '/tokens',
    },
  },
};

export const WithSelectedToken: Story = {
  parameters: {
    reactRouter: {
      routePath: '/tokens',
      browserPath: '/tokens?symbol=BTC',
      searchParams: { symbol: 'BTC' },
    },
  },
};