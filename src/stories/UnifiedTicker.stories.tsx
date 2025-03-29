import type { Meta, StoryObj } from '@storybook/react';
import { UnifiedTicker } from '../components/layout/UnifiedTicker';
import { Contest } from '../types';

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

// Define component metadata
const meta = {
  title: 'Components/UnifiedTicker',
  component: UnifiedTicker,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
  argTypes: {
    contests: { control: 'object' },
    loading: { control: 'boolean' },
    isCompact: { control: 'boolean' },
    significantChangeThreshold: { control: 'number' },
    maxTokens: { control: 'number' },
  },
  decorators: [
    (Story) => (
      <div className="bg-dark-200 p-4 w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof UnifiedTicker>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  args: {
    contests: mockContests,
    loading: false,
    isCompact: false,
    significantChangeThreshold: 3,
    maxTokens: 8,
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

// Compact mode
export const Compact: Story = {
  args: {
    contests: mockContests,
    loading: false,
    isCompact: true,
    significantChangeThreshold: 3,
    maxTokens: 8,
  },
};

// No contests available
export const NoContests: Story = {
  args: {
    contests: [],
    loading: false,
    isCompact: false,
    significantChangeThreshold: 3,
    maxTokens: 8,
  },
};