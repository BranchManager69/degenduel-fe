import React from 'react';

// Mock TokenDataContext
export const TokenDataContext = React.createContext({
  tokens: [
    {
      symbol: 'ETH',
      name: 'Ethereum',
      price: '3500.00',
      marketCap: '423000000000',
      volume24h: '15000000',
      change24h: '4.2',
    },
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      price: '42000.00',
      marketCap: '850000000000',
      volume24h: '25000000',
      change24h: '-2.5',
    },
    {
      symbol: 'SOL',
      name: 'Solana',
      price: '120.00',
      marketCap: '58000000000',
      volume24h: '5000000',
      change24h: '8.1',
    },
  ],
  isConnected: true,
  error: null,
  _refresh: () => console.log('Mock TokenData refresh called')
});

// Mock UnifiedTicker component wrapper
export const MockedUnifiedTicker = ({ contests, loading, isCompact, significantChangeThreshold, maxTokens }) => {
  // Render the children with mocked context
  return (
    <div className="p-4 bg-gray-800">
      <div className="text-sm text-gray-400 mb-2">Mock Ticker Component (Wrapped)</div>
      <div className="border border-dashed border-gray-600 p-4 rounded">
        {loading ? (
          <div className="py-2 text-gray-400">Loading...</div>
        ) : contests.length === 0 ? (
          <div className="py-2 text-gray-400">No contests available</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {contests.map(contest => (
              <div key={contest.id} className="bg-gray-700 rounded p-2 text-white">
                <div className="font-bold">{contest.name}</div>
                <div className="text-xs">{contest.status} - {contest.entry_fee} SOL</div>
                <div className="text-xs">{contest.participant_count}/{contest.max_participants} participants</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Export mocked hooks
export const mockedHooks = {
  useTokenData: () => ({
    tokens: [
      {
        symbol: 'ETH',
        name: 'Ethereum',
        price: '3500.00',
        marketCap: '423000000000',
        volume24h: '15000000',
        change24h: '4.2',
      },
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        price: '42000.00',
        marketCap: '850000000000',
        volume24h: '25000000',
        change24h: '-2.5',
      },
      {
        symbol: 'SOL',
        name: 'Solana',
        price: '120.00',
        marketCap: '58000000000',
        volume24h: '5000000',
        change24h: '8.1',
      },
    ],
    isConnected: true,
    error: null,
    _refresh: () => console.log('TokenData refresh called')
  }),
  useStore: () => ({
    maintenanceMode: false,
    setMaintenanceMode: () => {}
  })
};