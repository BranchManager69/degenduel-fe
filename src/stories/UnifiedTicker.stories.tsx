import type { Meta, StoryObj } from '@storybook/react';
import { UnifiedTicker } from '../components/layout/UnifiedTicker';

// Mock data for contests
const mockContests = [
  {
    id: '1',
    name: 'Moon Shot Masters',
    entry_fee: '1.5',
    participant_count: 120,
    max_participants: 200,
    status: 'active',
    start_time: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
    end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
  },
  {
    id: '2',
    name: 'Diamond Hands Showdown',
    entry_fee: '0.5',
    participant_count: 75,
    max_participants: 100,
    status: 'pending',
    start_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
    end_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
  },
  {
    id: '3',
    name: 'Crypto Titans',
    entry_fee: '3.0',
    participant_count: 50,
    max_participants: 50,
    status: 'active',
    start_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    end_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
  },
  {
    id: '4',
    name: 'Weekend Warriors',
    entry_fee: '1.0',
    participant_count: 45,
    max_participants: 50,
    status: 'completed',
    start_time: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    end_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
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