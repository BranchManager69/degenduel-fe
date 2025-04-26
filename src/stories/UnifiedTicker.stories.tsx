import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { UnifiedTicker } from '../components/layout/UnifiedTicker';
import { EdgeToEdgeTicker } from '../components/layout/EdgeToEdgeTicker';
import { Contest, TokenData } from '../types';

/**
 * # UnifiedTicker Component 2.0 🚀
 * 
 * A highly optimized ticker component that displays real-time information about active contests
 * and significant token price changes. Designed to provide at-a-glance market insights with
 * both visual appeal and performance.
 * 
 * ## Features
 * 
 * - Responsive design with mobile-first approach
 * - Automatic scrolling on desktop, swipeable on mobile
 * - Tab system to filter between All/Duels/Prices
 * - Visual indicators for contest status and price movements
 * - Error and maintenance mode handling
 * - Performance optimized with minimal re-renders
 */

// Create a wrapper for stories with all necessary context
const TickerStoryWrapper: React.FC<any> = (props) => {
  // Setup mock tokens with a range of price changes and volumes
  const generateMockTokens = (): TokenData[] => {
    const baseTokens = [
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        price: '42050.00',
        marketCap: '850000000000',
        volume24h: '25000000',
        change24h: props.extremePriceChanges ? '-18.5' : '-2.5',
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        price: '3480.75',
        marketCap: '423000000000',
        volume24h: '15000000',
        change24h: '4.2',
      },
      {
        symbol: 'SOL',
        name: 'Solana',
        price: '122.50',
        marketCap: '58000000000',
        volume24h: '5000000',
        change24h: props.extremePriceChanges ? '22.7' : '8.1',
      },
      {
        symbol: 'DOGE',
        name: 'Dogecoin',
        price: '0.148',
        marketCap: '20000000000',
        volume24h: '2500000',
        change24h: '12.3',
      },
      {
        symbol: 'PEPE',
        name: 'Pepe',
        price: '0.00000968',
        marketCap: '4200000000',
        volume24h: '750000000',
        change24h: props.extremePriceChanges ? '45.6' : '15.6',
      },
      {
        symbol: 'SHIB',
        name: 'Shiba Inu',
        price: '0.00002735',
        marketCap: '16100000000',
        volume24h: '820000000',
        change24h: '-5.2',
      },
      {
        symbol: 'AVAX',
        name: 'Avalanche',
        price: '35.45',
        marketCap: '13500000000',
        volume24h: '980000000',
        change24h: props.extremePriceChanges ? '-23.4' : '-3.4',
      },
      {
        symbol: 'LINK',
        name: 'Chainlink',
        price: '14.87',
        marketCap: '9300000000',
        volume24h: '650000000',
        change24h: '7.8',
      },
      {
        symbol: 'MATIC',
        name: 'Polygon',
        price: '0.68',
        marketCap: '6800000000',
        volume24h: '520000000',
        change24h: '-1.3',
      },
      {
        symbol: 'UNI',
        name: 'Uniswap',
        price: '8.92',
        marketCap: '5400000000',
        volume24h: '320000000',
        change24h: '2.1',
      },
      {
        symbol: 'DOT',
        name: 'Polkadot',
        price: '6.32',
        marketCap: '8700000000',
        volume24h: '410000000',
        change24h: props.extremePriceChanges ? '-16.9' : '-3.9',
      },
      {
        symbol: 'ADA',
        name: 'Cardano',
        price: '0.47',
        marketCap: '16500000000',
        volume24h: '390000000',
        change24h: '1.7',
      },
      {
        symbol: 'DEGEN',
        name: 'DegenCoin',
        price: '0.00042069',
        marketCap: '42000000',
        volume24h: '8900000',
        change24h: props.extremePriceChanges ? '69.9' : '16.9',
      },
      {
        symbol: 'MOON',
        name: 'MoonToken',
        price: '0.00000420',
        marketCap: '6900000',
        volume24h: '3300000',
        change24h: props.extremePriceChanges ? '120.0' : '30.0',
      }
    ];
    
    // Return tokens with random volume variations
    return baseTokens.map(token => ({
      ...token,
      volume24h: (parseFloat(token.volume24h) * (0.5 + Math.random())).toString()
    }));
  };

  // Create mock data and setup window objects
  window.useTokenDataMock = () => ({
    tokens: generateMockTokens(),
    error: props.showError ? 'Connection error' : null,
    _refresh: () => console.log('TokenData refresh called')
  });

  window.useStoreMock = () => ({
    maintenanceMode: props.maintenanceMode || false,
    setMaintenanceMode: () => {} // Required function
  });

  // Add all necessary CSS animations for the Ticker
  const cssAnimations = `
    /* Ticker animation for horizontal scrolling */
    @keyframes ticker {
      0% { transform: translateX(0); }
      100% { transform: translateX(calc(-50% - 1.5rem)); }
    }
    
    /* Scan effect for cyber aesthetic */
    @keyframes scan-fast {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    
    /* Vertical scanning animation */
    @keyframes cyber-scan {
      0% { transform: translateY(-100%); }
      50% { transform: translateY(100%); }
      100% { transform: translateY(-100%); }
    }
    
    /* Data stream effect for background */
    @keyframes data-stream {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    
    /* Shine effect for progress bars */
    @keyframes shine {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    
    /* Gradient cycling animation */
    @keyframes gradientX {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    
    /* Classes for the animations */
    .animate-gradientX {
      animation: gradientX 2s ease infinite;
      background-size: 200% auto;
    }
    
    .ticker-animation {
      white-space: nowrap;
      animation: ticker 30s linear infinite;
    }
    
    .ticker-animation:hover {
      animation-play-state: paused;
    }
    
    /* Shadow effects */
    .shadow-brand { box-shadow: 0 0 5px rgba(153, 51, 255, 0.3); }
    .shadow-cyber { box-shadow: 0 0 5px rgba(0, 225, 255, 0.3); }
    
    /* Hide scrollbars but keep scrolling */
    .hide-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }
  `;

  return (
    <BrowserRouter>
      <style dangerouslySetInnerHTML={{ __html: cssAnimations }} />
      
      {/* Dark theme background for proper context */}
      <div className="w-full" style={{ 
        background: 'linear-gradient(180deg, #13111C 0%, #0D0D13 100%)',
        minHeight: '200px',
        position: 'relative',
      }}>
        {/* Mock header (only shown for non-minimal views) */}
        {!props.minimal && (
          <div className="w-full bg-dark-300/30 backdrop-blur" style={{ 
            height: '64px', 
            borderBottom: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div className="w-full h-full flex items-center justify-between px-6">
              <div className="flex items-center space-x-3">
                <div className="text-brand-400 font-bold text-xl">DegenDuel</div>
                <div className="text-white/40 font-mono text-sm">DASHBOARD</div>
              </div>
              <div className="text-white/30 font-mono text-xs">STORYBOOK DEMO</div>
            </div>
          </div>
        )}
        
        {/* Ticker component (either standard or edge-to-edge) */}
        <div className="w-full relative">
          {props.edgeToEdge ? (
            <EdgeToEdgeTicker
              contests={props.contests || []}
              loading={props.loading || false}
              isCompact={props.isCompact || false}
              maxTokens={props.maxTokens || 10}
            />
          ) : (
            <UnifiedTicker
              contests={props.contests || []}
              loading={props.loading || false}
              isCompact={props.isCompact || false}
              maxTokens={props.maxTokens || 10}
            />
          )}
        </div>
        
        {/* Mock content below ticker (only for context) */}
        {!props.minimal && (
          <div className="w-full p-4 flex flex-col items-center justify-center space-y-4" style={{ minHeight: '150px' }}>
            <div className="text-white/50 font-mono text-sm border border-white/5 rounded p-2 bg-dark-800/50">
              PAGE CONTENT WOULD APPEAR BELOW THE TICKER
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-3xl">
              <div className="bg-dark-700/60 border border-dark-600 rounded p-3 text-xs text-white/70">
                This story demonstrates the updated UnifiedTicker component with its improved mobile response and visual design.
              </div>
              <div className="bg-dark-700/60 border border-dark-600 rounded p-3 text-xs text-brand-300/70">
                The ticker provides at-a-glance information about current contests and token price movements.
              </div>
              <div className="bg-dark-700/60 border border-dark-600 rounded p-3 text-xs text-cyber-300/70">
                Animation is automatically disabled on mobile devices in favor of a swipeable interface.
              </div>
            </div>
          </div>
        )}
      </div>
    </BrowserRouter>
  );
};

// Helper function to calculate contest prize pool
const calculatePrizePool = (entryFee: string, participantCount: number, maxParticipants: number, basePrize: string): string => {
  return (parseFloat(basePrize) * (participantCount / maxParticipants) + 
          (parseFloat(entryFee) * participantCount)).toFixed(2);
};

// Generate mock contest data with diverse examples
const generateMockContests = (): Contest[] => {
  return [
    {
      id: 1,
      name: 'Moon Shot Masters',
      description: 'Race to the moon with the hottest tokens',
      entry_fee: '1.50',
      prize_pool: '300.00',
      current_prize_pool: calculatePrizePool('1.50', 120, 200, '300.00'),
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
      name: 'Diamond Hands Challenge',
      description: 'Hold tight and show your diamond hands',
      entry_fee: '0.50',
      prize_pool: '100.00',
      current_prize_pool: calculatePrizePool('0.50', 75, 100, '100.00'),
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
      current_prize_pool: '450.00', // Already full
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
      current_prize_pool: calculatePrizePool('1.00', 45, 50, '100.00'),
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
      name: 'NFT Showdown',
      description: 'Contest focused only on NFT-related tokens',
      entry_fee: '2.00',
      prize_pool: '200.00',
      current_prize_pool: calculatePrizePool('2.00', 25, 75, '200.00'),
      start_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      end_time: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours from now
      allowed_buckets: [4, 5, 6], // NFT-specific buckets
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
      name: 'Micro Duels',
      description: 'Low-cost contest with partial SOL entry fee',
      entry_fee: '0.25',
      prize_pool: '25.00',
      current_prize_pool: calculatePrizePool('0.25', 15, 50, '25.00'),
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
      current_prize_pool: calculatePrizePool('1.75', 28, 100, '175.00'),
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
};

// Define component metadata for storybook
const meta: Meta<typeof TickerStoryWrapper> = {
  title: 'Components/Redesigned/UnifiedTicker',
  component: TickerStoryWrapper,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        component: 'A real-time market and contest ticker for the DegenDuel platform.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    contests: { control: 'object' },
    loading: { control: 'boolean' },
    isCompact: { control: 'boolean' },
    maxTokens: { control: 'number' },
    edgeToEdge: { control: 'boolean' },
    showError: { control: 'boolean' },
    maintenanceMode: { control: 'boolean' },
    extremePriceChanges: { control: 'boolean' },
    minimal: { control: 'boolean' }
  },
};

export default meta;
type Story = StoryObj<typeof TickerStoryWrapper>;

// Standard UnifiedTicker in default state
export const Default: Story = {
  args: {
    contests: generateMockContests(),
    loading: false,
    isCompact: false,
    maxTokens: 10,
    edgeToEdge: false,
    showError: false,
    maintenanceMode: false,
    extremePriceChanges: false,
    minimal: false
  },
  parameters: {
    docs: {
      description: {
        story: 'The standard UnifiedTicker component in its default state, showing both contest and token data.'
      }
    }
  }
};

// Enhanced EdgeToEdgeTicker with animated background effects
export const EdgeToEdgeDesign: Story = {
  args: {
    contests: generateMockContests(),
    loading: false,
    isCompact: false,
    maxTokens: 10,
    edgeToEdge: true,
    showError: false,
    maintenanceMode: false,
    extremePriceChanges: false,
    minimal: false
  },
  parameters: {
    docs: {
      description: {
        story: 'The enhanced EdgeToEdgeTicker design with animated gradients and visual effects.'
      }
    }
  }
};

// Compact version of the ticker (slim height)
export const CompactVersion: Story = {
  args: {
    contests: generateMockContests().slice(0, 3),
    loading: false,
    isCompact: true,
    maxTokens: 5,
    edgeToEdge: false,
    showError: false,
    maintenanceMode: false,
    extremePriceChanges: false,
    minimal: true
  },
  parameters: {
    docs: {
      description: {
        story: 'A compact version of the ticker with reduced height, ideal for embedding in tight spaces.'
      }
    }
  }
};

// Only showing tokens, no contests
export const TokensOnly: Story = {
  args: {
    contests: [], // No contests
    loading: false,
    isCompact: false,
    maxTokens: 15,
    edgeToEdge: false,
    showError: false,
    maintenanceMode: false,
    extremePriceChanges: true,
    minimal: false
  },
  parameters: {
    docs: {
      description: {
        story: 'Token-focused display with extreme price movements highlighted with visual cues.'
      }
    }
  }
};

// Only showing contests, no tokens
export const ContestsOnly: Story = {
  args: {
    contests: generateMockContests(),
    loading: false,
    isCompact: false,
    maxTokens: 0, // No tokens
    edgeToEdge: true,
    showError: false,
    maintenanceMode: false,
    extremePriceChanges: false,
    minimal: false
  },
  parameters: {
    docs: {
      description: {
        story: 'Contest-focused display showing only active and upcoming duels.'
      }
    }
  }
};

// Loading state while waiting for data
export const LoadingState: Story = {
  args: {
    contests: [],
    loading: true,
    isCompact: false,
    maxTokens: 10,
    edgeToEdge: false,
    showError: false,
    maintenanceMode: false,
    extremePriceChanges: false,
    minimal: false
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state shown while waiting for data to load.'
      }
    }
  }
};

// Error state when connection fails
export const ErrorState: Story = {
  args: {
    contests: [],
    loading: false,
    isCompact: false,
    maxTokens: 10,
    edgeToEdge: false,
    showError: true,
    maintenanceMode: false,
    extremePriceChanges: false,
    minimal: false
  },
  parameters: {
    docs: {
      description: {
        story: 'Error state displayed when the connection to the data service fails.'
      }
    }
  }
};

// Maintenance mode for platform downtime
export const MaintenanceMode: Story = {
  args: {
    contests: generateMockContests(),
    loading: false,
    isCompact: false,
    maxTokens: 10,
    edgeToEdge: true,
    showError: false,
    maintenanceMode: true,
    extremePriceChanges: false,
    minimal: false
  },
  parameters: {
    docs: {
      description: {
        story: 'Maintenance mode display shown during scheduled platform downtime.'
      }
    }
  }
};