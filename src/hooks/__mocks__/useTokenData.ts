// Mock implementation for useTokenData
export const useTokenData = () => {
  if (typeof window !== 'undefined' && window.useTokenDataMock) {
    return window.useTokenDataMock();
  }
  
  return {
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
      }
    ],
    isConnected: true,
    error: null,
    _refresh: () => console.log('TokenData refresh called')
  };
};

export default useTokenData;