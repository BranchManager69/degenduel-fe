// Enhanced TokensPage stories - Using Storybook-first approach
import { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';

// Import type declarations to help TypeScript recognize window properties
import { OptimizedTokensPage } from '../../pages/public/tokens/OptimizedTokensPage.js';
import { StoryTokensPage } from '../../pages/public/tokens/StoryTokensPage.js';
import { TokensPage as OriginalTokensPage } from '../../pages/public/tokens/TokensPage.js';
import '../../types/window.js';

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

// Create mock tokens for the API response - enhanced with more tokens for better testing
export const createMockTokensResponse = () => {
  const baseTokens = [
    {
      contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
      name: 'Solana',
      symbol: 'SOL',
      price: 103.45,
      marketCap: 42000000000,
      volume24h: 1500000000,
      change24h: 5.63,
      status: 'active', // Add required status field
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
    },
    // Dogecoin
    {
      contractAddress: '0x4567890123abcdef4567890123abcdef45678901',
      name: 'Dogecoin',
      symbol: 'DOGE',
      price: 0.157,
      marketCap: 22000000000,
      volume24h: 1850000000,
      change24h: 8.75,
      liquidity: {
        usd: 95000000,
        base: 5000000,
        quote: 7000000,
      },
      images: {
        imageUrl: 'https://cryptologos.cc/logos/dogecoin-doge-logo.png',
        headerImage: 'https://dogecoin.com/assets/img/dogecoin-300.png',
        openGraphImage: '',
      },
      socials: {
        twitter: { url: 'https://twitter.com/dogecoin', count: null },
        telegram: { url: 'https://t.me/dogecoindiamond', count: null },
        discord: { url: 'https://discord.com/invite/dogecoin', count: null },
      },
      websites: [{ url: 'https://dogecoin.com', label: 'Website' }],
    },
    // Cardano
    {
      contractAddress: '0x5678901234abcdef5678901234abcdef56789012',
      name: 'Cardano',
      symbol: 'ADA',
      price: 0.457,
      marketCap: 16100000000,
      volume24h: 587000000,
      change24h: -1.89,
      liquidity: {
        usd: 78000000,
        base: 4200000,
        quote: 6500000,
      },
      images: {
        imageUrl: 'https://cryptologos.cc/logos/cardano-ada-logo.png',
        headerImage: 'https://cardano.org/static/ada-1b939746c1e7b3848e5d22393f698336.png',
        openGraphImage: '',
      },
      socials: {
        twitter: { url: 'https://twitter.com/cardano', count: null },
        telegram: { url: 'https://t.me/Cardano', count: null },
        discord: { url: 'https://discord.com/invite/cardano', count: null },
      },
      websites: [{ url: 'https://cardano.org', label: 'Website' }],
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
      window.WebSocket = originalWebSocket;
    };
  }, []);
  
  return <>{children}</>;
};

// Meta for original TokensPage
const metaOriginal: Meta<typeof OriginalTokensPage> = {
  title: 'Pages/Tokens/OriginalTokensPage',
  component: OriginalTokensPage,
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

export default metaOriginal;
type StoryOriginal = StoryObj<typeof OriginalTokensPage>;

export const OriginalDefault: StoryOriginal = {
  parameters: {
    route: '/tokens',
  }
};

export const OriginalWithSelectedToken: StoryOriginal = {
  parameters: {
    route: '/tokens?symbol=BTC',
  }
};

// Create a separate export for OptimizedTokensPage
export const optimizedMeta: Meta<typeof OptimizedTokensPage> = {
  title: 'Pages/Tokens/OptimizedTokensPage',
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

type StoryOptimized = StoryObj<typeof OptimizedTokensPage>;

export const OptimizedDefault: StoryOptimized = {
  parameters: {
    route: '/tokens',
  }
};

export const OptimizedWithSelectedToken: StoryOptimized = {
  parameters: {
    route: '/tokens?symbol=BTC',
  }
};

// Create a separate meta for StoryTokensPage - our new cyberpunk design
export const creativeTokensMeta: Meta<typeof StoryTokensPage> = {
  title: 'Pages/Tokens/CreativeTokensPage',
  component: StoryTokensPage,
  parameters: {
    layout: 'fullscreen',
    route: '/tokens',
  },
  decorators: [
    (Story) => (
      <div className="bg-dark-100 min-h-screen">
        <Story />
      </div>
    ),
  ],
};

type StoryCreative = StoryObj<typeof StoryTokensPage>;

export const CreativeTokensPageDefault: StoryCreative = {
  parameters: {
    route: '/tokens',
  }
};

export const CreativeTokensPageWithSelectedToken: StoryCreative = {
  parameters: {
    route: '/tokens?symbol=BTC',
  }
};