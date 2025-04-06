// src/stories/admin-rpc-benchmark-footer.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import RPCBenchmarkFooter from '../components/admin/RPCBenchmarkFooter';

// Setup mock for Storybook
if (typeof window !== 'undefined') {
  // Setup mock for the RPC benchmark WebSocket hook
  (window as any).useRPCBenchmarkWebSocket = () => ({
    data: {
      test_run_id: "mock-test-123",
      timestamp: new Date().toISOString(),
      methods: {
        getLatestBlockhash: {
          providers: [
            {
              provider: "BranchRPC",
              median_latency: 45.2,
              avg_latency: 48.7,
              min_latency: 38.1,
              max_latency: 68.3,
              success_count: 50,
              failure_count: 0
            },
            {
              provider: "Helius",
              median_latency: 52.8,
              avg_latency: 55.3,
              min_latency: 42.5,
              max_latency: 72.1,
              success_count: 49,
              failure_count: 1,
              percent_slower: 16.8
            },
            {
              provider: "SolanaGPT",
              median_latency: 58.7,
              avg_latency: 60.2,
              min_latency: 45.3,
              max_latency: 80.1,
              success_count: 48,
              failure_count: 2,
              percent_slower: 30.0
            }
          ]
        },
        getBalance: {
          providers: [
            {
              provider: "BranchRPC",
              median_latency: 35.1,
              avg_latency: 38.2,
              min_latency: 28.9,
              max_latency: 55.4,
              success_count: 50,
              failure_count: 0
            },
            {
              provider: "Helius",
              median_latency: 42.3,
              avg_latency: 45.1,
              min_latency: 32.7,
              max_latency: 60.2,
              success_count: 50,
              failure_count: 0,
              percent_slower: 20.5
            }
          ]
        }
      },
      overall_fastest_provider: "BranchRPC",
      performance_advantage: [
        {
          method: "getLatestBlockhash",
          vs_second_place: 16.8,
          vs_third_place: 30.2,
          second_place_provider: "Helius",
          third_place_provider: "SolanaGPT"
        }
      ]
    },
    isLoading: false,
    error: null,
    isConnected: true,
    isAuthenticated: true,
    refreshData: () => console.log('Refresh data mock called in mock')
  });
}

// Define metadata for the component
const meta = {
  title: 'Admin/RPCBenchmarkFooter',
  component: RPCBenchmarkFooter,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#111827' },
      ],
    },
  },
  decorators: [
    (Story) => (
      <div className="p-4 bg-gray-900 max-w-4xl">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
  argTypes: {
    compactMode: { 
      control: 'boolean',
      description: 'Display in compact mode for smaller footers'
    }
  }
} satisfies Meta<typeof RPCBenchmarkFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

// Main story
export const Default: Story = {
  args: {
    compactMode: false
  }
};

// Compact mode story
export const Compact: Story = {
  args: {
    compactMode: true
  }
};

// Mock different states
export const Loading: Story = {
  render: () => {
    // Override the mock for this specific story
    const originalFn = (window as any).useRPCBenchmarkWebSocket;
    (window as any).useRPCBenchmarkWebSocket = () => ({
      ...originalFn(),
      isLoading: true,
      data: null
    });
    
    return <RPCBenchmarkFooter />;
  }
};

export const Error: Story = {
  render: () => {
    // Override the mock for this specific story
    const originalFn = (window as any).useRPCBenchmarkWebSocket;
    (window as any).useRPCBenchmarkWebSocket = () => ({
      ...originalFn(),
      error: "Failed to fetch benchmark data",
      data: null,
      isLoading: false
    });
    
    return <RPCBenchmarkFooter />;
  }
};

export const NotConnected: Story = {
  render: () => {
    // Override the mock for this specific story
    const originalFn = (window as any).useRPCBenchmarkWebSocket;
    (window as any).useRPCBenchmarkWebSocket = () => ({
      ...originalFn(),
      isConnected: false,
      isAuthenticated: false
    });
    
    return <RPCBenchmarkFooter />;
  }
};