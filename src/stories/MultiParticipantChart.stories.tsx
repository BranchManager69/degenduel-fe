import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { MultiParticipantChartV2 } from '../components/contest-lobby/MultiParticipantChartV2';

// Simple wrapper for styling
const StorybookWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-dark-500 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Chart Design Iteration</h1>
          <p className="text-gray-400">Experiment with different chart designs and data scenarios</p>
        </div>
        {children}
      </div>
    </div>
  );
};

// Mock data generators
const generateMockParticipants = (count: number = 8) => {
  const names = [
    'DegenCrypto', 'SolanaWhale', 'CryptoNinja', 'TokenHunter', 'DiamondsHands',
    'PumpMaster', 'CoinFlip', 'BlockchainBro', 'DefiFiend', 'SatoshiFan',
    'MoonShot', 'BitBull', 'CryptoQueen', 'SolKing', 'AltcoinAce'
  ];
  
  return Array.from({ length: count }, (_, i) => ({
    wallet_address: `mock_wallet_${i + 1}_${'abcdef123456'.slice(0, 8)}`,
    nickname: names[i] || `Player ${i + 1}`,
    is_current_user: i === 0, // First participant is current user
    performance_percentage: (Math.random() * 40 - 20).toFixed(2), // -20% to +20%
    portfolio_value: (10000 * (1 + Math.random() * 0.4 - 0.2)).toFixed(2) // $8k - $12k
  }));
};

const generatePerformanceData = (count: number) => {
  // Generate more realistic performance scenarios
  const scenarios = [
    { label: 'Tight Race', range: 5, min: undefined, max: undefined }, // ±5%
    { label: 'Moderate Spread', range: 15, min: undefined, max: undefined }, // ±15%
    { label: 'Wide Spread', range: 30, min: undefined, max: undefined }, // ±30%
    { label: 'Bull Market', range: undefined, min: -5, max: 25 }, // Mostly positive
    { label: 'Bear Market', range: undefined, min: -25, max: 5 }, // Mostly negative
  ];
  
  return scenarios.map(scenario => ({
    ...scenario,
    participants: generateMockParticipants(count).map((p, i) => ({
      ...p,
      performance_percentage: scenario.range 
        ? (Math.random() * scenario.range * 2 - scenario.range).toFixed(2)
        : (Math.random() * ((scenario.max || 0) - (scenario.min || 0)) + (scenario.min || 0)).toFixed(2)
    }))
  }));
};

// Story metadata
const meta: Meta<typeof MultiParticipantChartV2> = {
  title: 'Contest/MultiParticipantChart',
  component: MultiParticipantChartV2,
  decorators: [
    (Story) => (
      <StorybookWrapper>
        <Story />
      </StorybookWrapper>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#1a1a2e' },
      ],
    },
  },
  argTypes: {
    contestId: { control: 'text' },
    timeInterval: {
      control: 'select',
      options: ['5m', '15m', '1h', '4h', '24h']
    },
    maxParticipants: { control: { type: 'range', min: 3, max: 20, step: 1 } }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story - current implementation
export const Current: Story = {
  args: {
    contestId: 'mock-contest-123',
    participants: generateMockParticipants(8),
    timeInterval: '1h',
    maxParticipants: 10
  }
};

// Small contest (3-5 participants)
export const SmallContest: Story = {
  args: {
    contestId: 'mock-contest-small',
    participants: generateMockParticipants(4),
    timeInterval: '1h',
    maxParticipants: 4
  }
};

// Large contest (15+ participants)
export const LargeContest: Story = {
  args: {
    contestId: 'mock-contest-large',
    participants: generateMockParticipants(15),
    timeInterval: '1h',
    maxParticipants: 15
  }
};

// Performance scenarios
export const TightRace: Story = {
  args: {
    contestId: 'mock-contest-tight',
    participants: generatePerformanceData(8)[0].participants,
    timeInterval: '1h',
    maxParticipants: 10
  }
};

export const BullMarket: Story = {
  args: {
    contestId: 'mock-contest-bull',
    participants: generatePerformanceData(8)[3].participants,
    timeInterval: '1h',
    maxParticipants: 10
  }
};

export const BearMarket: Story = {
  args: {
    contestId: 'mock-contest-bear',
    participants: generatePerformanceData(8)[4].participants,
    timeInterval: '1h',
    maxParticipants: 10
  }
};

// Interactive playground
export const Playground: Story = {
  args: {
    contestId: 'mock-contest-playground',
    participants: generateMockParticipants(8),
    timeInterval: '1h',
    maxParticipants: 10
  },
  render: (args) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-dark-300/50 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">🎮 Design Playground</h3>
          <div className="space-y-2 text-sm text-gray-300">
            <p>• Adjust controls in Storybook panel →</p>
            <p>• Try different participant counts</p>
            <p>• Test various time intervals</p>
            <p>• See how the chart responds</p>
          </div>
        </div>
        <div className="bg-dark-300/50 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">📊 Current Issues</h3>
          <div className="space-y-1 text-sm text-red-300">
            <p>⚠️ Too many controls competing</p>
            <p>⚠️ Participant selection is verbose</p>
            <p>⚠️ Visual hierarchy unclear</p>
            <p>⚠️ "Spaghetti" line effect</p>
          </div>
        </div>
      </div>
      <MultiParticipantChartV2 
        contestId={args.contestId}
        participants={args.participants}
        timeInterval={args.timeInterval}
        maxParticipants={args.maxParticipants}
      />
    </div>
  )
};

// Edge cases
export const EmptyState: Story = {
  args: {
    contestId: 'mock-contest-empty',
    participants: [],
    timeInterval: '1h',
    maxParticipants: 10
  }
};

export const SingleParticipant: Story = {
  args: {
    contestId: 'mock-contest-single',
    participants: generateMockParticipants(1),
    timeInterval: '1h',
    maxParticipants: 10
  }
};

// Mock API responses for development
export const WithMockAPI: Story = {
  args: {
    contestId: 'mock-contest-api',
    participants: generateMockParticipants(8),
    timeInterval: '1h',
    maxParticipants: 10
  },
  parameters: {
    mockData: [
      {
        url: '/api/portfolio-analytics/contests/mock-contest-api/performance/timeline*',
        method: 'GET',
        status: 200,
        response: {
          snapshots: Array.from({ length: 24 }, (_, i) => ({
            timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
            participants: Object.fromEntries(
              generateMockParticipants(8).map((p, index) => [
                p.wallet_address,
                {
                  username: p.nickname,
                  value: 10000 + Math.sin(i * 0.5 + index) * 1000 + Math.random() * 500,
                  rank: index + 1
                }
              ])
            )
          }))
        }
      }
    ]
  }
}; 