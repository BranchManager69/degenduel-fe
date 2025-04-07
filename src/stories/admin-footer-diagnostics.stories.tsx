// src/stories/admin-footer-diagnostics.stories.tsx
// This file has been replaced by footer-websocket-diagnostics.stories.tsx which now includes all Footer diagnostics stories.
// Keeping this file temporarily to avoid breaking existing references.

import type { Meta, StoryObj } from '@storybook/react';
import FooterDiagnostics from '../components/admin/FooterDiagnostics';

// Setup mock for Storybook
if (typeof window !== 'undefined') {
  // Mark we're in Storybook environment
  (window as any).STORYBOOK_ENV = true;
  
  // Mock the RPC benchmark WebSocket hook
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
    refreshData: () => console.log('Refresh data mock called')
  });
}

// Mock useStore for admin detection
if (typeof window !== 'undefined') {
  (window as any).useStore = () => ({
    user: { is_admin: true }
  });
}

// Define metadata for the component
const meta = {
  title: 'Admin/Footer/Diagnostics',
  component: FooterDiagnostics,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#111827' },
      ],
    },
    docs: {
      description: {
        component: 'Displays RPC benchmark data for admin and superadmin users in the footer'
      }
    }
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
} satisfies Meta<typeof FooterDiagnostics>;

export default meta;
type Story = StoryObj<typeof meta>;

// Main story
export const AllConnected: Story = {
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

// Loading state story
export const Loading: Story = {
  render: () => {
    // Override the mock for this specific story
    if (typeof window !== 'undefined') {
      const originalMock = (window as any).useRPCBenchmarkWebSocket;
      (window as any).useRPCBenchmarkWebSocket = () => ({
        ...originalMock(),
        isLoading: true,
        data: null
      });
    }
    
    return <FooterDiagnostics />;
  }
};

// Error state story
export const Error: Story = {
  render: () => {
    // Override the mock for this specific story
    if (typeof window !== 'undefined') {
      const originalMock = (window as any).useRPCBenchmarkWebSocket;
      (window as any).useRPCBenchmarkWebSocket = () => ({
        ...originalMock(),
        error: "Failed to fetch benchmark data",
        data: null,
        isLoading: false
      });
    }
    
    return <FooterDiagnostics />;
  }
};

// Not Connected story
export const NotConnected: Story = {
  render: () => {
    // Override the mock for this specific story
    if (typeof window !== 'undefined') {
      const originalMock = (window as any).useRPCBenchmarkWebSocket;
      (window as any).useRPCBenchmarkWebSocket = () => ({
        ...originalMock(),
        isConnected: false,
        isAuthenticated: false
      });
    }
    
    return <FooterDiagnostics />;
  }
};