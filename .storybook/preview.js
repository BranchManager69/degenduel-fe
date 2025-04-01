/** @type { import('@storybook/react').Preview } */
import React from 'react';
import '../src/index.css';
import { withTokenDataMock, withStoreMock } from './decorators';
import { withAuthMock, MockAuthProvider } from './mockComponents.tsx';

// No TypeScript declarations in JS files

// Create a decorator for mocking hooks
const withMockedHooks = (Story) => {
  // Mock the TokenDataContext with rich crypto data
  const tokenDataContextValue = {
    tokens: [
      {
        symbol: 'ETH',
        name: 'Ethereum',
        price: '3500.00',
        marketCap: '423000000000',
        volume24h: '15000000',
        change24h: '4.2',
        imageUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png'
      },
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        price: '42000.00',
        marketCap: '850000000000',
        volume24h: '25000000',
        change24h: '-2.5',
        imageUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png'
      },
      {
        symbol: 'SOL',
        name: 'Solana',
        price: '120.00',
        marketCap: '58000000000',
        volume24h: '5000000',
        change24h: '8.1',
        imageUrl: 'https://cryptologos.cc/logos/solana-sol-logo.png'
      },
      {
        symbol: 'DOGE',
        name: 'Dogecoin',
        price: '0.15',
        marketCap: '20000000000',
        volume24h: '2500000',
        change24h: '12.3',
        imageUrl: 'https://cryptologos.cc/logos/dogecoin-doge-logo.png'
      },
      {
        symbol: 'PEPE',
        name: 'Pepe',
        price: '0.00001205',
        marketCap: '5000000000',
        volume24h: '1500000',
        change24h: '15.8',
        imageUrl: 'https://cryptologos.cc/logos/pepe-pepe-logo.png'
      },
      {
        symbol: 'BONK',
        name: 'Bonk',
        price: '0.00000205',
        marketCap: '1200000000',
        volume24h: '750000',
        change24h: '25.3',
        imageUrl: 'https://cryptologos.cc/logos/bonk-bonk-logo.png'
      },
      {
        symbol: 'SHIB',
        name: 'Shiba Inu',
        price: '0.00001850',
        marketCap: '10900000000',
        volume24h: '480000000',
        change24h: '-3.7',
        imageUrl: 'https://cryptologos.cc/logos/shiba-inu-shib-logo.png'
      },
      {
        symbol: 'WIF',
        name: 'Dogwifhat',
        price: '2.35',
        marketCap: '2350000000',
        volume24h: '120000000',
        change24h: '12.4',
        imageUrl: 'https://cryptologos.cc/logos/dogwifhat-wif-logo.png'
      }
    ],
    isConnected: true,
    error: null,
    _refresh: () => console.log('TokenData refresh called')
  };

  // Override the useTokenData function
  window.useTokenDataMock = () => tokenDataContextValue;
  window.useStoreMock = () => ({ maintenanceMode: false });
  
  // Mock the context hooks
  // This is a global override that will make all instances of useAuthContext in the app
  // return the mock data instead of trying to access the real context
  window.useAuthContext = () => ({
    user: null,
    loading: false,
    error: null,
    isWalletConnected: false,
    walletAddress: undefined,
    isConnecting: false,
    connectWallet: () => console.log('Mock connectWallet called'),
    disconnectWallet: () => console.log('Mock disconnectWallet called'),
    isSuperAdmin: () => false,
    isAdmin: () => false,
    isFullyConnected: () => false,
    checkAuth: () => console.log('Mock checkAuth called'),
    getAccessToken: async () => null
  });
  
  // Mock the Privy Auth hooks
  window.usePrivyAuth = () => ({
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

  // Add global styles for animations needed by components
  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Ticker animation keyframes */
          @keyframes ticker {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          
          /* Ticker scanning effects */
          @keyframes scan-fast {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          
          /* Cyber scanning effect animation */
          @keyframes cyber-scan {
            0% { transform: translateY(-100%); }
            50% { transform: translateY(100%); }
            100% { transform: translateY(-100%); }
          }
          
          /* Data stream animation for items */
          @keyframes data-stream {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          
          /* Shine effect for progress bars */
          @keyframes shine {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          
          /* Add brand and cyber colors */
          :root {
            --color-brand-50: #f3e6ff;
            --color-brand-100: #e5ccff;
            --color-brand-200: #cc99ff;
            --color-brand-300: #b266ff;
            --color-brand-400: #9933ff;
            --color-brand-500: #7f00ff;
            --color-brand-600: #6600cc;
            --color-brand-700: #4c0099;
            --color-brand-800: #330066;
            --color-brand-900: #190033;
            --brand-rgb: 127, 0, 255;
            
            --color-cyber-500: #00e1ff;
            --cyber-rgb: 0, 225, 255;
          }
          
          /* Common animation classes */
          .ticker-animation {
            display: flex !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            width: 100% !important;
          }
          
          /* Shadow effects */
          .shadow-brand {
            box-shadow: 0 0 5px rgba(153, 51, 255, 0.3);
          }
          
          .shadow-cyber {
            box-shadow: 0 0 5px rgba(0, 225, 255, 0.3);
          }
          
          .animate-shine {
            animation: shine 2s linear infinite;
          }
          
          .animate-cyber-scan {
            animation: cyber-scan 3s linear infinite;
          }
          
          .animate-scan-fast {
            animation: scan-fast 2s linear infinite;
          }
          
          .animate-data-stream {
            animation: data-stream 3s linear infinite;
          }
          
          .bg-dark-200 { background-color: #1e1b2e; }
          .bg-dark-300 { background-color: #2d2a3e; }
          
          .text-brand-400 { color: #9933ff; }
          .text-cyber-400 { color: #00e1ff; }
          .text-yellow-400 { color: #facc15; }
          .text-green-400 { color: #4ade80; }
          .text-red-400 { color: #f87171; }
          
          .border-brand-400 { border-color: #9933ff; }
          .border-brand-500 { border-color: #7f00ff; }
          .border-brand-600 { border-color: #6600cc; }
          
          .hide-scrollbar {
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
            overflow-x: auto;
          }
          .hide-scrollbar::-webkit-scrollbar {
            display: none !important;
            width: 0px !important;
            height: 0px !important;
          }
        `
      }} />
      <MockAuthProvider>
        <Story />
      </MockAuthProvider>
    </>
  );
};

// Initial setup of global mocks (ensures they're available during Story initialization)
if (typeof window !== 'undefined') {
  // Auth context mock
  window.useAuthContext = () => ({
    user: null,
    loading: false,
    error: null,
    isWalletConnected: false,
    walletAddress: undefined,
    isConnecting: false,
    connectWallet: () => console.log('Mock connectWallet called'),
    disconnectWallet: () => console.log('Mock disconnectWallet called'),
    isSuperAdmin: () => false,
    isAdmin: () => false,
    isFullyConnected: () => false,
    checkAuth: () => console.log('Mock checkAuth called'),
    getAccessToken: async () => null
  });

  // Privy auth context mock
  window.usePrivyAuth = () => ({
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

const preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#13111c',
        },
        {
          name: 'light',
          value: '#f8f8f8',
        },
      ],
    },
  },
  decorators: [
    withMockedHooks,
    withAuthMock,
  ],
};

export default preview;