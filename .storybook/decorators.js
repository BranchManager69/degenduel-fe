import React from 'react';

// Create a mock context for TokenDataContext
export const TokenDataContextMock = React.createContext({
  tokens: [
    {
      symbol: 'ETH',
      name: 'Ethereum',
      price: '3500.00',
      marketCap: '423000000000',
      volume24h: '15000000',
      change24h: '4.2',
      change5m: '0.1',
      change1h: '1.2',
      imageUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png'
    },
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      price: '42000.00',
      marketCap: '850000000000',
      volume24h: '25000000',
      change24h: '-2.5',
      change5m: '-0.2',
      change1h: '-0.8',
      imageUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png'
    },
    {
      symbol: 'SOL',
      name: 'Solana',
      price: '120.00',
      marketCap: '58000000000',
      volume24h: '5000000',
      change24h: '8.1',
      change5m: '0.5',
      change1h: '2.1',
      imageUrl: 'https://cryptologos.cc/logos/solana-sol-logo.png'
    },
    {
      symbol: 'DOGE',
      name: 'Dogecoin',
      price: '0.12',
      marketCap: '16000000000',
      volume24h: '2000000',
      change24h: '-5.3',
      change5m: '-0.4',
      change1h: '-1.2',
      imageUrl: 'https://cryptologos.cc/logos/dogecoin-doge-logo.png'
    },
    {
      symbol: 'PEPE',
      name: 'Pepe',
      price: '0.00001205',
      marketCap: '5000000000',
      volume24h: '1500000',
      change24h: '15.8',
      change5m: '1.2',
      change1h: '3.5',
      imageUrl: 'https://cryptologos.cc/logos/pepe-pepe-logo.png'
    },
    {
      symbol: 'BONK',
      name: 'Bonk',
      price: '0.00000205',
      marketCap: '1200000000',
      volume24h: '750000',
      change24h: '25.3',
      change5m: '2.1',
      change1h: '5.2',
      imageUrl: 'https://cryptologos.cc/logos/bonk-bonk-logo.png'
    },
    {
      symbol: 'SHIB',
      name: 'Shiba Inu',
      price: '0.00001850',
      marketCap: '10900000000',
      volume24h: '480000000',
      change24h: '-3.7',
      change5m: '-0.3',
      change1h: '-0.9',
      imageUrl: 'https://cryptologos.cc/logos/shiba-inu-shib-logo.png'
    },
    {
      symbol: 'WIF',
      name: 'Dogwifhat',
      price: '2.35',
      marketCap: '2350000000',
      volume24h: '120000000',
      change24h: '12.4',
      change5m: '0.8',
      change1h: '2.7',
      imageUrl: 'https://cryptologos.cc/logos/dogwifhat-wif-logo.png'
    }
  ],
  isConnected: true,
  error: null,
  _refresh: () => console.log('TokenData refresh called')
});

// Mock for useTokenData hook
export const withTokenDataMock = (StoryFn) => {
  return (
    <TokenDataContextMock.Provider value={{
      tokens: [
        {
          symbol: 'ETH',
          name: 'Ethereum',
          price: '3500.00',
          marketCap: '423000000000',
          volume24h: '15000000',
          change24h: '4.2',
          change5m: '0.1',
          change1h: '1.2',
          imageUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png'
        },
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          price: '42000.00',
          marketCap: '850000000000',
          volume24h: '25000000',
          change24h: '-2.5',
          change5m: '-0.2',
          change1h: '-0.8',
          imageUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png'
        },
        {
          symbol: 'SOL',
          name: 'Solana',
          price: '120.00',
          marketCap: '58000000000',
          volume24h: '5000000',
          change24h: '8.1',
          change5m: '0.5',
          change1h: '2.1',
          imageUrl: 'https://cryptologos.cc/logos/solana-sol-logo.png'
        },
        {
          symbol: 'DOGE',
          name: 'Dogecoin',
          price: '0.12',
          marketCap: '16000000000',
          volume24h: '2000000',
          change24h: '-5.3',
          change5m: '-0.4',
          change1h: '-1.2',
          imageUrl: 'https://cryptologos.cc/logos/dogecoin-doge-logo.png'
        },
        {
          symbol: 'PEPE',
          name: 'Pepe',
          price: '0.00001205',
          marketCap: '5000000000',
          volume24h: '1500000',
          change24h: '15.8',
          change5m: '1.2',
          change1h: '3.5',
          imageUrl: 'https://cryptologos.cc/logos/pepe-pepe-logo.png'
        },
        {
          symbol: 'BONK',
          name: 'Bonk',
          price: '0.00000205',
          marketCap: '1200000000',
          volume24h: '750000',
          change24h: '25.3',
          change5m: '2.1',
          change1h: '5.2',
          imageUrl: 'https://cryptologos.cc/logos/bonk-bonk-logo.png'
        },
        {
          symbol: 'SHIB',
          name: 'Shiba Inu',
          price: '0.00001850',
          marketCap: '10900000000',
          volume24h: '480000000',
          change24h: '-3.7',
          change5m: '-0.3',
          change1h: '-0.9',
          imageUrl: 'https://cryptologos.cc/logos/shiba-inu-shib-logo.png'
        },
        {
          symbol: 'WIF',
          name: 'Dogwifhat',
          price: '2.35',
          marketCap: '2350000000',
          volume24h: '120000000',
          change24h: '12.4',
          change5m: '0.8',
          change1h: '2.7',
          imageUrl: 'https://cryptologos.cc/logos/dogwifhat-wif-logo.png'
        }
      ],
      isConnected: true,
      error: null,
      _refresh: () => console.log('TokenData refresh called')
    }}>
      <StoryFn />
    </TokenDataContextMock.Provider>
  );
};

// Mock for useStore (if needed)
export const withStoreMock = (StoryFn) => {
  // Mock implementation of useStore
  const mockStore = {
    maintenanceMode: false,
    setMaintenanceMode: () => {}
  };
  
  return (
    <div data-testid="store-mock-wrapper">
      <StoryFn />
    </div>
  );
};