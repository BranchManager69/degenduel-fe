// src/stories/OptimizedTokensPage.stories.tsx

// OptimizedTokensPage stories
import { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';

// Import type declarations to help TypeScript recognize window properties
import { OptimizedTokensPage } from '../pages/public/tokens/OptimizedTokensPage';
import '../types/window.d.ts';
import { createMockTokensResponse } from './TokensPage.stories';

// Create a mock context wrapper
const MockContext: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Set up mocks directly in global window object
  React.useEffect(() => {
    // Store originals
    const originalFetch = window.fetch;
    const originalUseStore = window.useStore;
    const originalWebSocket = window.WebSocket;
    
    // Define a mock WebSocket class that does nothing
    const MockWebSocket = function(this: any) {
      console.log('[Storybook] WebSocket connection disabled');
      
      // Initialize with basic WebSocket properties
      this.readyState = 3; // CLOSED
      this.onclose = null;
      this.onopen = null;
      this.onerror = null;
      this.onmessage = null;
      this.url = "";
      this.protocol = "";
      this.extensions = "";
      this.binaryType = "blob";
      this.bufferedAmount = 0;
      
      // Call onclose if it's set later
      setTimeout(() => {
        if (this.onclose) {
          try {
            this.onclose(new CloseEvent('close'));
          } catch (e) {
            console.error('[Storybook] Mock WebSocket error:', e);
          }
        }
      }, 0);
      
      // Define methods
      this.send = function() {};
      this.close = function() {};
      
      return this;
    } as unknown as typeof WebSocket;
    
    // Replace the WebSocket constructor to prevent network requests
    // @ts-ignore - Intentional override for Storybook
    window.WebSocket = MockWebSocket;
    
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
      window.WebSocket = originalWebSocket;
    };
  }, []);
  
  return <>{children}</>;
};

const meta: Meta<typeof OptimizedTokensPage> = {
  title: 'Pages/Tokens/Optimized',
  component: OptimizedTokensPage,
  parameters: {
    layout: 'fullscreen',
    route: '/tokens',
  },
  decorators: [
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
    route: '/tokens',
  }
};

export const WithSelectedToken: Story = {
  parameters: {
    route: '/tokens?symbol=BTC',
  }
};