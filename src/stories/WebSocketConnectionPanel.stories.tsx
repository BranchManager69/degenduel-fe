import type { Meta, StoryObj } from '@storybook/react';
import React, { useEffect } from 'react';
import WebSocketConnectionPanel from '../components/admin/WebSocketConnectionPanel';

// Mock data for the WebSocket connections
const mockConnections = [
  {
    id: 101,
    connection_id: "conn-abc123def456",
    ip_address: "192.168.1.100",
    user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36",
    wallet_address: "BPuRhkeCkor7DxMrcPVsB4AdW6Pmp5oACjVzpPb72Mhp",
    nickname: "CryptoDegen42",
    is_authenticated: true,
    environment: "production",
    origin: "https://degenduel.me",
    connected_at: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
    disconnected_at: null,
    duration_seconds: null,
    close_code: null,
    close_reason: null,
    subscribed_topics: ["market_data", "portfolio", "system"],
    messages_received: 42,
    messages_sent: 78,
    connection_error: null,
    country: "US",
    region: "California", 
    city: "San Francisco",
    metadata: {}
  },
  {
    id: 102,
    connection_id: "conn-ghi789jkl012",
    ip_address: "192.168.1.101",
    user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36",
    wallet_address: null,
    nickname: null,
    is_authenticated: false,
    environment: "production",
    origin: "https://degenduel.me",
    connected_at: new Date(Date.now() - 1200000).toISOString(), // 20 minutes ago
    disconnected_at: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
    duration_seconds: 300,
    close_code: 1000,
    close_reason: "Normal closure",
    subscribed_topics: ["market_data"],
    messages_received: 12,
    messages_sent: 5,
    connection_error: null,
    country: "UK",
    region: "England",
    city: "London",
    metadata: {}
  },
  {
    id: 103,
    connection_id: "conn-mno345pqr678",
    ip_address: "192.168.1.102",
    user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Mobile/15E148 Safari/604.1",
    wallet_address: "9oQ56KmYuXAKFZG4FeQNmaz7moW1rZ1qLgS43rLmHfLp",
    nickname: "MobileTrader",
    is_authenticated: true,
    environment: "production",
    origin: "https://degenduel.me",
    connected_at: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    disconnected_at: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    duration_seconds: 1500,
    close_code: 1006,
    close_reason: "Abnormal closure",
    subscribed_topics: ["market_data", "portfolio", "contest"],
    messages_received: 67,
    messages_sent: 24,
    connection_error: "Connection lost unexpectedly",
    country: "JP",
    region: "Tokyo",
    city: "Tokyo",
    metadata: {}
  },
  {
    id: 104,
    connection_id: "conn-stu901vwx234",
    ip_address: "192.168.1.103",
    user_agent: "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36",
    wallet_address: "5kWUwgSEaRbFzAunhXzbD6a3V4jvv7CMT9gJ7GXC63NX",
    nickname: "AndroidUser99",
    is_authenticated: true,
    environment: "production",
    origin: "https://degenduel.me",
    connected_at: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    disconnected_at: null,
    duration_seconds: null,
    close_code: null,
    close_reason: null,
    subscribed_topics: ["market_data", "system", "contest", "notification"],
    messages_received: 23,
    messages_sent: 17,
    connection_error: null,
    country: "DE",
    region: "Bavaria",
    city: "Munich",
    metadata: {}
  },
  {
    id: 105,
    connection_id: "conn-yz567abc890",
    ip_address: "192.168.1.104",
    user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/112.0",
    wallet_address: "3FH8BNvttHbxVJsBvZPeePNBntGgJcbKVSzHkJgMsWGn",
    nickname: "FirefoxDegen",
    is_authenticated: true,
    environment: "production",
    origin: "https://degenduel.me",
    connected_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    disconnected_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    duration_seconds: 3600,
    close_code: 1001,
    close_reason: "Going away",
    subscribed_topics: ["market_data", "portfolio", "system", "contest"],
    messages_received: 145,
    messages_sent: 87,
    connection_error: null,
    country: "CA",
    region: "British Columbia",
    city: "Vancouver",
    metadata: {}
  }
];

// Mock the fetch API for the component
const MockWebSocketConnectionPanel: React.FC<{
  initialExpanded?: boolean;
  mockData?: any[];
  mockError?: string | null;
}> = ({ initialExpanded = false, mockData = mockConnections, mockError = null }) => {
  // Set up the mock fetch before rendering the component
  useEffect(() => {
    // Save the original fetch
    const originalFetch = window.fetch;
    
    // Mock fetch implementation
    window.fetch = async (url, options) => {
      if (typeof url === 'string' && url.includes('/api/admin/websocket-monitor/connections')) {
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
        const activeOnly = urlObj.searchParams.get('activeOnly') === 'true';
        
        // Filter connections based on activeOnly
        let filteredData = activeOnly 
          ? mockData.filter(conn => conn.disconnected_at === null)
          : mockData;
          
        // Calculate pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = filteredData.slice(startIndex, endIndex);
        
        return {
          ok: true,
          json: async () => ({
            success: true,
            connections: paginatedData,
            pagination: {
              page,
              limit,
              totalConnections: filteredData.length,
              totalPages: Math.ceil(filteredData.length / limit),
              hasNextPage: endIndex < filteredData.length,
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
  
  return <WebSocketConnectionPanel initialExpanded={initialExpanded} />;
};

const meta: Meta<typeof MockWebSocketConnectionPanel> = {
  title: 'Admin/WebSocketConnectionPanel',
  component: MockWebSocketConnectionPanel,
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
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-gray-200 mb-4">
          <h1 className="text-2xl font-bold mb-2">WebSocket Connection Panel</h1>
          <p className="text-gray-400">
            Displays realtime WebSocket connections with status indicators and detailed information
          </p>
        </div>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MockWebSocketConnectionPanel>;

// The default story
export const Default: Story = {};

// Story with panel expanded by default
export const Expanded: Story = {
  args: {
    initialExpanded: true
  }
};

// Story with active connections only
export const ActiveConnectionsOnly: Story = {
  args: {
    mockData: mockConnections.filter(conn => conn.disconnected_at === null)
  }
};

// Story with error state
export const ErrorState: Story = {
  args: {
    mockError: "Failed to fetch WebSocket connections: Internal server error"
  }
};

// Story with no connections
export const NoConnections: Story = {
  args: {
    mockData: []
  }
};

// Story with a dark theme (using Tailwind classes)
export const DarkTheme: Story = {
  decorators: [
    (Story) => (
      <div className="p-6 max-w-4xl mx-auto bg-gray-900">
        <div className="text-gray-200 mb-4">
          <h1 className="text-2xl font-bold mb-2">WebSocket Connection Panel (Dark Theme)</h1>
          <p className="text-gray-400">
            Displays realtime WebSocket connections with status indicators
          </p>
        </div>
        <Story />
      </div>
    ),
  ],
};