import type { Meta, StoryObj } from '@storybook/react';
import React, { useEffect } from 'react';
import AdminLogsPanel from '../components/admin/AdminLogsPanel';

// Mock data for admin logs
const mockLogs = [
  {
    id: 101,
    admin_address: "BPuRhkeCkor7DxMrcPVsB4AdW6Pmp5oACjVzpPb72Mhp",
    action: "BAN_USER",
    details: {
      user_id: 123,
      username: "spammer42",
      reason: "Repeated spam in chat",
      ip_address: "192.168.1.100"
    },
    created_at: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
    ip_address: "192.168.1.42",
    user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/112.0.0.0"
  },
  {
    id: 102,
    admin_address: "9oQ56KmYuXAKFZG4FeQNmaz7moW1rZ1qLgS43rLmHfLp",
    action: "UPDATE_CONTEST",
    details: {
      contest_id: 42,
      contest_name: "Weekend Warrior Duel",
      field: "prize_pool",
      old_value: "100",
      new_value: "200"
    },
    created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    ip_address: "192.168.1.43",
    user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/112.0.0.0"
  },
  {
    id: 103,
    admin_address: "5kWUwgSEaRbFzAunhXzbD6a3V4jvv7CMT9gJ7GXC63NX",
    action: "ADD_WHITELIST",
    details: {
      token_symbol: "DEGEN",
      token_address: "0x1234567890abcdef1234567890abcdef12345678",
      reason: "Community request"
    },
    created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    ip_address: "192.168.1.44",
    user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_4) AppleWebKit/605.1.15"
  },
  {
    id: 104,
    admin_address: "SYSTEM",
    action: "RESET_PASSWORD",
    details: {
      user_id: 456,
      username: "lostPassword",
      reset_token: "d41d8cd98f00b204e9800998ecf8427e"
    },
    created_at: new Date(Date.now() - 18000000).toISOString(), // 5 hours ago
    ip_address: null,
    user_agent: null
  },
  {
    id: 105,
    admin_address: "3FH8BNvttHbxVJsBvZPeePNBntGgJcbKVSzHkJgMsWGn",
    action: "DELETE_CONTEST",
    details: {
      contest_id: 37,
      contest_name: "Invalid Test Contest",
      reason: "Created by mistake"
    },
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    ip_address: "192.168.1.45",
    user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Firefox/112.0"
  },
  {
    id: 106,
    admin_address: "F9VrQBJHqbfn6xPgz9VykGgYM4JLRCKDtnQopC6W9rGw",
    action: "MODIFY_USER_ROLE",
    details: {
      user_id: 789,
      username: "newModerator",
      old_role: "user",
      new_role: "moderator"
    },
    created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    ip_address: "192.168.1.46",
    user_agent: "Mozilla/5.0 (Linux; Android 13) Chrome/112.0.0.0"
  }
];

// Mock the fetch API for the component
const MockAdminLogsPanel: React.FC<{
  mockData?: any[];
  mockError?: string | null;
}> = ({ mockData = mockLogs, mockError = null }) => {
  // Set up the mock fetch before rendering the component
  useEffect(() => {
    // Save the original fetch
    const originalFetch = window.fetch;
    
    // Mock fetch implementation
    window.fetch = async (url, options) => {
      if (typeof url === 'string' && url.includes('/api/admin/admin-logs')) {
        // If we want to simulate an error
        if (mockError) {
          return {
            ok: false,
            status: 500,
            json: async () => ({ success: false, error: mockError })
          } as Response;
        }
        
        // Parse query parameters from url
        const urlObj = new URL(url, window.location.origin);
        const page = parseInt(urlObj.searchParams.get('page') || '1');
        const limit = parseInt(urlObj.searchParams.get('limit') || '10');
        
        // Calculate pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = mockData.slice(startIndex, endIndex);
        
        return {
          ok: true,
          json: async () => ({
            success: true,
            logs: paginatedData,
            pagination: {
              page,
              limit,
              totalLogs: mockData.length,
              totalPages: Math.ceil(mockData.length / limit),
              hasNextPage: endIndex < mockData.length,
              hasPrevPage: page > 1
            }
          })
        } as Response;
      }
      
      // Pass through any other requests to the original fetch
      return originalFetch(url, options);
    };
    
    // Clean up the mock
    return () => {
      window.fetch = originalFetch;
    };
  }, [mockData, mockError]);
  
  return <AdminLogsPanel />;
};

const meta: Meta<typeof MockAdminLogsPanel> = {
  title: 'Admin/AdminLogsPanel',
  component: MockAdminLogsPanel,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#111827' },
      ],
    },
  },
  decorators: [
    (Story) => (
      <div className="p-6 bg-gray-900 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="text-gray-200 mb-4">
            <h1 className="text-2xl font-bold mb-2">Admin Logs Panel</h1>
            <p className="text-gray-400">
              Displays recent admin actions with detailed information
            </p>
          </div>
          <div className="w-full md:w-1/3">
            <Story />
          </div>
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MockAdminLogsPanel>;

// The default story
export const Default: Story = {};

// Story with error state
export const ErrorState: Story = {
  args: {
    mockError: "Failed to fetch admin logs: Internal server error"
  }
};

// Story with no logs
export const NoLogs: Story = {
  args: {
    mockData: []
  }
};

// Story with many logs
export const ManyLogs: Story = {
  args: {
    mockData: Array(20).fill(null).map((_, index) => ({
      ...mockLogs[index % mockLogs.length],
      id: 1000 + index,
      created_at: new Date(Date.now() - (index * 3600000)).toISOString() // Spread out over time
    }))
  }
};