// TokensPage stories
import { Meta, StoryObj } from '@storybook/react';
import { TokensPage } from '../pages/public/tokens/TokensPage';
import { withRouter } from 'storybook-addon-react-router-v6';
import * as React from 'react';

// Import type declarations to help TypeScript recognize window properties
import '../types/window.d.ts';

// Ensure TypeScript recognizes window.useStore
declare global {
  interface Window {
    useStore: () => {
      user: any | null;
      setUser: (user: any) => void;
      isWalletConnected: boolean;
      walletAddress: string | undefined;
      maintenanceMode: boolean;
      [key: string]: any; // Allow other props
    };
  }
}

// Create mock tokens for the API response
const createMockTokensResponse = () => {
  const baseTokens = [
    {
      contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
      name: 'Solana',
      symbol: 'SOL',
      price: 103.45,
      marketCap: 42000000000,
      volume24h: 1500000000,
      change24h: 5.63,
      liquidity: {
        usd: 120000000,
        base: 1000000,
        quote: 2000000,
      },
      images: {
        imageUrl: 'https://cryptologos.cc/logos/solana-sol-logo.png',
        headerImage: 'https://www.exodus.com/img/news/content/2022/09/solana-min.png',
        openGraphImage: '',
      },
      socials: {
        twitter: { url: 'https://twitter.com/solana', count: null },
        telegram: { url: 'https://t.me/solanaio', count: null },
        discord: { url: 'https://discord.com/invite/solana', count: null },
      },
      websites: [{ url: 'https://solana.com', label: 'Website' }],
    },
    // Bitcoin
    {
      contractAddress: '0x2345678901abcdef2345678901abcdef23456789',
      name: 'Bitcoin',
      symbol: 'BTC',
      price: 67245.21,
      marketCap: 1320000000000,
      volume24h: 28500000000,
      change24h: -2.34,
      liquidity: {
        usd: 820000000,
        base: 12000000,
        quote: 18000000,
      },
      images: {
        imageUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
        headerImage: 'https://bitcoinmagazine.com/.image/t_share/MTk2MDIyNzQ3NTc4NzUxNzQx/bitcoin-magazine-new-website.png',
        openGraphImage: '',
      },
      socials: {
        twitter: { url: 'https://twitter.com/bitcoin', count: null },
        telegram: { url: 'https://t.me/bitcoin', count: null },
        discord: { url: 'https://discord.com/invite/bitcoin', count: null },
      },
      websites: [{ url: 'https://bitcoin.org', label: 'Website' }],
    },
    // Ethereum
    {
      contractAddress: '0x3456789012abcdef3456789012abcdef34567890',
      name: 'Ethereum',
      symbol: 'ETH',
      price: 3420.89,
      marketCap: 410000000000,
      volume24h: 12500000000,
      change24h: 2.25,
      liquidity: {
        usd: 450000000,
        base: 8000000,
        quote: 10000000,
      },
      images: {
        imageUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
        headerImage: 'https://ethereum.org/static/28214bb68eb5445dcb063a72535bc90c/9019e/hero.png',
        openGraphImage: '',
      },
      socials: {
        twitter: { url: 'https://twitter.com/ethereum', count: null },
        telegram: { url: 'https://t.me/ethereum', count: null },
        discord: { url: 'https://discord.com/invite/ethereum', count: null },
      },
      websites: [{ url: 'https://ethereum.org', label: 'Website' }],
    }
  ];

  // Add metadata
  return {
    timestamp: new Date().toISOString(),
    _cached: false,
    _stale: false,
    _cachedAt: new Date().toISOString(),
    data: baseTokens
  };
};

const mockTokensResponse = createMockTokensResponse();

// Create a mock context wrapper
const MockContext: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Set up mocks directly in global window object
  React.useEffect(() => {
    // Store originals
    const originalFetch = window.fetch;
    const originalUseStore = window.useStore;
    
    // Set up mocks with proper Response type
    window.fetch = () => Promise.resolve(new Response(
      JSON.stringify(mockTokensResponse),
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

const meta: Meta<typeof TokensPage> = {
  title: 'Pages/Tokens/TokensPage',
  component: TokensPage,
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
type Story = StoryObj<typeof TokensPage>;

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

export const WithNonExistentToken: Story = {
  parameters: {
    reactRouter: {
      routePath: '/tokens',
      browserPath: '/tokens?symbol=NOTFOUND',
      searchParams: { symbol: 'NOTFOUND' },
    },
  },
};