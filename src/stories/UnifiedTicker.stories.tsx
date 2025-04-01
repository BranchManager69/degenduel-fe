import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { UnifiedTicker } from '../components/layout/UnifiedTicker';
import { Contest } from '../types';

// Create a wrapper component that directly uses the real UnifiedTicker
const DirectUnifiedTicker: React.FC<any> = (props) => {
  // Create mock data for the hooks that UnifiedTicker uses
  window.useTokenDataMock = () => ({
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
      {
        symbol: 'DOGE',
        name: 'Dogecoin',
        price: '0.15',
        marketCap: '20000000000',
        volume24h: '2500000',
        change24h: '12.3',
      },
    ],
    isConnected: true,
    error: null,
    _refresh: () => console.log('TokenData refresh called')
  });

  window.useStoreMock = () => ({
    maintenanceMode: false,
    setMaintenanceMode: () => {} // Add missing required function
  });

  // Add required styles for animations and wrap in BrowserRouter
  return (
    <BrowserRouter>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes ticker {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @keyframes scan-fast {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes cyber-scan {
            0% { transform: translateY(-100%); }
            50% { transform: translateY(100%); }
            100% { transform: translateY(-100%); }
          }
          @keyframes data-stream {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          @keyframes shine {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes gradientX {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .animate-gradientX {
            animation: gradientX 2s ease infinite;
            background-size: 200% auto;
          }
          .ticker-animation {
            display: flex !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            width: 100% !important;
          }
          .shadow-brand { box-shadow: 0 0 5px rgba(153, 51, 255, 0.3); }
          .shadow-cyber { box-shadow: 0 0 5px rgba(0, 225, 255, 0.3); }
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
      {/* Edge-to-edge layout below a mock header */}
      <div className="w-full" style={{ 
        background: 'linear-gradient(180deg, #13111C 0%, #0D0D13 100%)',
      }}>
        {/* Mock header to show context */}
        <div className="w-full bg-dark-300/30 backdrop-blur" style={{ 
          height: '64px', 
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div className="w-full h-full flex items-center justify-between px-6">
            <div className="text-white opacity-40 font-mono text-sm">MOCK HEADER</div>
            <div className="text-white opacity-20 font-mono text-xs">DEMO ENVIRONMENT</div>
          </div>
        </div>
        
        {/* UnifiedTicker now as a full-width component below the header */}
        <div className="w-full">
          <UnifiedTicker {...props} />
        </div>
        
        {/* Page content placeholder */}
        <div className="w-full h-64 flex items-center justify-center">
          <div className="text-white opacity-30 font-mono text-sm">PAGE CONTENT WOULD GO HERE</div>
        </div>
      </div>
    </BrowserRouter>
  );
};

// Helper function to calculate current prize pool based on participants
const calculateCurrentPrizePool = (
  entryFee: string, 
  participantCount: number, 
  maxParticipants: number, 
  basePrizePool: string
): string => {
  // Convert to numbers for calculation
  const entryFeeNum = parseFloat(entryFee);
  const basePrizePoolNum = parseFloat(basePrizePool);
  
  // Calculate ratio of current participants to max participants
  const ratio = participantCount / maxParticipants;
  
  // Calculate current prize pool
  // Base prize + (entry fee * participant count)
  const currentPool = basePrizePoolNum * ratio + (entryFeeNum * participantCount);
  
  // Ensure we always return with 2 decimal places for Solana amounts
  return currentPool.toFixed(2);
};

// Mock data for contests with all required properties based on Contest type
const mockContests: Contest[] = [
  {
    id: 1,
    name: 'Moon Shot Masters',
    description: 'Race to the moon with the hottest tokens',
    entry_fee: '1.50',
    prize_pool: '300.00',
    current_prize_pool: calculateCurrentPrizePool('1.50', 120, 200, '300.00'),
    start_time: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
    end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    allowed_buckets: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    participant_count: 120,
    status: 'active',
    settings: {
      difficulty: 'dolphin',
      min_trades: 1,
      token_types: ['all'],
      rules: [{ id: '1', title: 'Rule 1', description: 'Description 1' }]
    },
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    min_participants: 10,
    max_participants: 200,
    contest_code: 'MSM001'
  },
  {
    id: 2,
    name: 'Diamond Hands Showdown',
    description: 'Hold tight and show your diamond hands',
    entry_fee: '0.50',
    prize_pool: '100.00',
    current_prize_pool: calculateCurrentPrizePool('0.50', 75, 100, '100.00'),
    start_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
    end_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
    allowed_buckets: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    participant_count: 75,
    status: 'pending',
    settings: {
      difficulty: 'squid',
      min_trades: 2,
      token_types: ['defi', 'gaming'],
      rules: [{ id: '1', title: 'Rule 1', description: 'Description 1' }]
    },
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    min_participants: 5,
    max_participants: 100,
    contest_code: 'DHS002'
  },
  {
    id: 3,
    name: 'Crypto Titans',
    description: 'The ultimate battle of crypto giants',
    entry_fee: '3.00',
    prize_pool: '450.00',
    // This one has reached max participants, so current prize pool equals prize pool
    current_prize_pool: '450.00',
    start_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    end_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
    allowed_buckets: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    participant_count: 50,
    status: 'active',
    settings: {
      difficulty: 'whale',
      min_trades: 3,
      token_types: ['all'],
      rules: [{ id: '1', title: 'Rule 1', description: 'Description 1' }]
    },
    created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    min_participants: 20,
    max_participants: 50,
    contest_code: 'CTT003'
  },
  {
    id: 4,
    name: 'Weekend Warriors',
    description: 'Weekend trading competition for casual traders',
    entry_fee: '1.00',
    prize_pool: '100.00',
    current_prize_pool: calculateCurrentPrizePool('1.00', 45, 50, '100.00'),
    start_time: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    end_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    allowed_buckets: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    participant_count: 45,
    status: 'completed',
    settings: {
      difficulty: 'tadpole',
      min_trades: 1,
      token_types: ['meme', 'gaming'],
      rules: [{ id: '1', title: 'Rule 1', description: 'Description 1' }]
    },
    created_at: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    min_participants: 10,
    max_participants: 50,
    contest_code: 'WW004'
  },
  {
    id: 5,
    name: 'NFT Specialists',
    description: 'Contest focused only on NFT-related tokens',
    entry_fee: '2.00',
    prize_pool: '200.00',
    current_prize_pool: calculateCurrentPrizePool('2.00', 25, 75, '200.00'),
    start_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    end_time: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours from now
    // This specialized contest only allows buckets 4-6 which contain NFT-related tokens
    allowed_buckets: [4, 5, 6],
    participant_count: 25,
    status: 'active',
    settings: {
      difficulty: 'squid',
      min_trades: 2,
      token_types: ['nft', 'gaming'],
      rules: [
        { id: '1', title: 'NFT Focus', description: 'Only NFT-related tokens allowed' },
        { id: '2', title: 'Min Hold Time', description: 'Must hold tokens for at least 1 hour' }
      ]
    },
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    min_participants: 15,
    max_participants: 75,
    contest_code: 'NFTS005'
  },
  {
    id: 6,
    name: 'Micro Traders',
    description: 'Low-cost contest with partial SOL entry fee',
    entry_fee: '0.25',
    prize_pool: '25.00',
    current_prize_pool: calculateCurrentPrizePool('0.25', 15, 50, '25.00'),
    start_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
    end_time: new Date(Date.now() + 30 * 60 * 60 * 1000).toISOString(), // 30 hours from now
    allowed_buckets: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    participant_count: 15,
    status: 'pending',
    settings: {
      difficulty: 'guppy',
      min_trades: 1,
      token_types: ['all'],
      rules: [{ id: '1', title: 'Low Stakes', description: 'Perfect for beginners' }]
    },
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    min_participants: 5,
    max_participants: 50,
    contest_code: 'MICRO006'
  },
  {
    id: 7,
    name: 'Precision Traders',
    description: 'Contest with non-standard entry fee',
    entry_fee: '1.75',
    prize_pool: '175.00',
    current_prize_pool: calculateCurrentPrizePool('1.75', 28, 100, '175.00'),
    start_time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    end_time: new Date(Date.now() + 21 * 60 * 60 * 1000).toISOString(), // 21 hours from now
    allowed_buckets: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    participant_count: 28,
    status: 'active',
    settings: {
      difficulty: 'dolphin',
      min_trades: 2,
      token_types: ['defi', 'layer1'],
      rules: [{ id: '1', title: 'Rule 1', description: 'Description 1' }]
    },
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    min_participants: 10,
    max_participants: 100,
    contest_code: 'PREC007'
  }
];

// Define component metadata - now using our direct wrapper
const meta: Meta<typeof DirectUnifiedTicker> = {
  title: 'Components/UnifiedTicker',
  component: DirectUnifiedTicker, // Use our direct wrapper instead of the mock
  parameters: {
    layout: 'fullscreen', // Make it span the full width in Storybook
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
  argTypes: {
    contests: { control: 'object' },
    loading: { control: 'boolean' },
    isCompact: { control: 'boolean' },
    maxTokens: { control: 'number' },
  },
  // No decorators needed since we're handling the styling in our wrapper component
};

export default meta;
type Story = StoryObj<typeof DirectUnifiedTicker>;

// Full Showcase - Ticker below header with both contests and tokens
export const BelowHeader: Story = {
  args: {
    contests: mockContests,
    loading: false,
    isCompact: false,
    maxTokens: 20, // Show more tokens to see variety
  },
};

// Minimal - Just a simple thin ticker (original design)
export const Minimal: Story = {
  args: {
    contests: mockContests.slice(0, 3), // Fewer contests
    loading: false,
    isCompact: true,
    maxTokens: 5,
  },
  // Override the wrapper with a minimal container
  render: (args) => (
    <BrowserRouter>
      <div className="w-full p-4 bg-dark-200" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h3 className="text-white opacity-70 mb-2 text-sm font-mono">COMPACT VERSION (ORIGINAL DESIGN)</h3>
        <UnifiedTicker 
          contests={args.contests} 
          loading={args.loading}
          isCompact={args.isCompact}
          maxTokens={args.maxTokens}
        />
      </div>
    </BrowserRouter>
  ),
};

// Token-focused - Only shows token prices, no contests
export const TokensOnly: Story = {
  args: {
    contests: [], // No contests
    loading: false,
    isCompact: false,
    maxTokens: 15,
  },
  render: (args) => {
    // We need to customize the mock for token data
    const TokensOnlyWrapper = () => {
      window.useTokenDataMock = () => ({
        tokens: [
          {
            symbol: 'BTC',
            name: 'Bitcoin',
            price: '42000.00',
            marketCap: '850000000000',
            volume24h: '25000000',
            change24h: '-2.5',
          },
          {
            symbol: 'ETH',
            name: 'Ethereum',
            price: '3500.00',
            marketCap: '423000000000',
            volume24h: '15000000',
            change24h: '4.2',
          },
          {
            symbol: 'SOL',
            name: 'Solana',
            price: '120.00',
            marketCap: '58000000000',
            volume24h: '5000000',
            change24h: '8.1',
          },
          {
            symbol: 'DOGE',
            name: 'Dogecoin',
            price: '0.15',
            marketCap: '20000000000',
            volume24h: '2500000',
            change24h: '12.3',
          },
        ],
        isConnected: true,
        error: null,
        _refresh: () => console.log('TokenData refresh called')
      });
      
      return (
        <BrowserRouter>
          <style dangerouslySetInnerHTML={{
            __html: `
              @keyframes ticker {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
              .ticker-animation {
                display: flex !important;
                white-space: nowrap !important;
                overflow: hidden !important;
                width: 100% !important;
              }
            `
          }} />
          <div className="w-full bg-dark-200" style={{ padding: '16px' }}>
            <UnifiedTicker 
              contests={args.contests}
              loading={args.loading}
              isCompact={args.isCompact}
              maxTokens={args.maxTokens}
            />
          </div>
        </BrowserRouter>
      );
    };
    
    return <TokensOnlyWrapper />;
  }
};

// Contest-focused - Only shows contests, no token prices
export const ContestsOnly: Story = {
  args: {
    contests: mockContests,
    loading: false,
    isCompact: false,
    maxTokens: 0, // No tokens
  },
};

// Loading state
export const Loading: Story = {
  args: {
    contests: [],
    loading: true,
    isCompact: false,
  },
};

// Maintenance mode
export const MaintenanceMode: Story = {
  args: {
    contests: mockContests,
    loading: false,
    isCompact: false,
    maxTokens: 8,
  },
  // Override to enable maintenance mode
  render: (args) => {
    // We need to customize the mock to enable maintenance mode
    const DirectMaintenanceTickerWrapper = () => {
      window.useStoreMock = () => ({
        maintenanceMode: true,
        setMaintenanceMode: () => {} // Add missing required function
      });
      
      return (
        <BrowserRouter>
          <div className="w-full" style={{ background: '#13111C' }}>
            <UnifiedTicker 
              contests={args.contests}
              loading={args.loading}
              isCompact={args.isCompact}
              maxTokens={args.maxTokens}
            />
          </div>
        </BrowserRouter>
      );
    };
    
    return <DirectMaintenanceTickerWrapper />;
  },
};