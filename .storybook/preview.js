/** @type { import('@storybook/react').Preview } */
import React from 'react';
import '../src/index.css';
import { withTokenDataMock, withStoreMock } from './decorators';

// Create a decorator for mocking hooks
const withMockedHooks = (Story) => {
  // Mock the TokenDataContext
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
      }
    ],
    isConnected: true,
    error: null,
    _refresh: () => console.log('TokenData refresh called')
  };

  // Override the useTokenData function
  window.useTokenDataMock = () => tokenDataContextValue;
  window.useStoreMock = () => ({ maintenanceMode: false });

  // In a real implementation, we would use a Provider here
  return <Story />;
};

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
    withMockedHooks
  ],
};

export default preview;
