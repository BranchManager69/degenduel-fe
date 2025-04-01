import type { Meta, StoryObj } from '@storybook/react';
import React, { useEffect } from 'react';
import WalletBalanceAnalytics from '../components/admin/WalletBalanceAnalytics';

// Mock data for wallet balances
const mockBalances = [
  {
    id: 1,
    wallet_address: "BPuRhkeCkor7DxMrcPVsB4AdW6Pmp5oACjVzpPb72Mhp",
    nickname: "CryptoDegen42",
    username: "degen42",
    role: "user",
    experience_points: 3500,
    balance_lamports: "5000000000",
    balance_sol: 5.0,
    last_updated: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
  },
  {
    id: 2,
    wallet_address: "9oQ56KmYuXAKFZG4FeQNmaz7moW1rZ1qLgS43rLmHfLp",
    nickname: "MobileTrader",
    username: "mobiletrader",
    role: "admin",
    experience_points: 12500,
    balance_lamports: "125000000000",
    balance_sol: 125.0,
    last_updated: new Date(Date.now() - 86400000).toISOString() // 1 day ago
  },
  {
    id: 3,
    wallet_address: "5kWUwgSEaRbFzAunhXzbD6a3V4jvv7CMT9gJ7GXC63NX",
    nickname: "AndroidUser99",
    username: "android99",
    role: "user",
    experience_points: 750,
    balance_lamports: "7500000",
    balance_sol: 0.0075,
    last_updated: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
  },
  {
    id: 4,
    wallet_address: "3FH8BNvttHbxVJsBvZPeePNBntGgJcbKVSzHkJgMsWGn",
    nickname: "FirefoxDegen",
    username: "ffdegen",
    role: "user",
    experience_points: 1800,
    balance_lamports: "0",
    balance_sol: 0.0,
    last_updated: new Date(Date.now() - 259200000).toISOString() // 3 days ago
  },
  {
    id: 5,
    wallet_address: "7JKSf2Vg7N4RgJMKncHUbr8AVezW8ZZRKDFcZDP9y3tj",
    nickname: null,
    username: null,
    role: "user",
    experience_points: 0,
    balance_lamports: "12500000",
    balance_sol: 0.0125,
    last_updated: new Date(Date.now() - 18000000).toISOString() // 5 hours ago
  },
  {
    id: 6,
    wallet_address: "F9VrQBJHqbfn6xPgz9VykGgYM4JLRCKDtnQopC6W9rGw",
    nickname: "WhaleAccount",
    username: "whale1",
    role: "superadmin",
    experience_points: 25000,
    balance_lamports: "250000000000",
    balance_sol: 250.0,
    last_updated: new Date(Date.now() - 1800000).toISOString() // 30 minutes ago
  },
  {
    id: 7,
    wallet_address: "AGrZ9v97MYJAYcF6Kh1ccQMkdR5w5uGsGrSL9bM7sqYQ",
    nickname: "MicroHolder",
    username: "micro42",
    role: "user",
    experience_points: 120,
    balance_lamports: "500000",
    balance_sol: 0.0005,
    last_updated: new Date(Date.now() - 43200000).toISOString() // 12 hours ago
  }
];

// Mock summary data
const mockSummary = {
  totalWallets: 7,
  nonZeroWallets: 6,
  zeroWallets: 1,
  totalSol: 380.0205,
  avgSol: 54.2886
};

// Mock pagination
const generateMockPagination = (page: number, limit: number, total: number) => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    totalBalances: total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
};

// Mock component that wraps WalletBalanceAnalytics with mock data
const MockWalletBalanceAnalytics: React.FC<{
  mockData?: any[];
  mockError?: string | null;
  mockRefreshCacheSuccess?: boolean;
}> = ({ 
  mockData = mockBalances, 
  mockError = null,
  mockRefreshCacheSuccess = true 
}) => {
  // Set up the mock fetch before rendering the component
  useEffect(() => {
    // Save the original fetch
    const originalFetch = window.fetch;
    
    // Mock fetch implementation
    window.fetch = async (url, options) => {
      if (typeof url === 'string') {
        // Handle different API endpoints
        
        // Wallet balances endpoint
        if (url.includes('/api/admin/wallet-monitoring/current-balances')) {
          if (mockError) {
            return {
              ok: false,
              status: 500,
              json: async () => ({ success: false, error: mockError })
            } as Response;
          }
          
          // Parse query parameters
          const urlObj = new URL(url, window.location.origin);
          const page = parseInt(urlObj.searchParams.get('page') || '1');
          const limit = parseInt(urlObj.searchParams.get('limit') || '100');
          const nonZeroOnly = urlObj.searchParams.get('nonZeroOnly') === 'true';
          const sortBy = urlObj.searchParams.get('sortBy') || 'balance';
          const sortOrder = urlObj.searchParams.get('sortOrder') || 'desc';
          
          // Filter data based on parameters
          let filteredData = nonZeroOnly 
            ? mockData.filter(wallet => wallet.balance_sol > 0)
            : mockData;
            
          // Sort data
          filteredData = [...filteredData].sort((a, b) => {
            if (sortBy === 'balance') {
              return sortOrder === 'desc' 
                ? b.balance_sol - a.balance_sol
                : a.balance_sol - b.balance_sol;
            } else if (sortBy === 'username') {
              const usernameA = a.username || '';
              const usernameB = b.username || '';
              return sortOrder === 'desc'
                ? usernameB.localeCompare(usernameA)
                : usernameA.localeCompare(usernameB);
            } else if (sortBy === 'updated') {
              return sortOrder === 'desc'
                ? new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
                : new Date(a.last_updated).getTime() - new Date(b.last_updated).getTime();
            }
            return 0;
          });
          
          // Calculate pagination
          const startIndex = (page - 1) * limit;
          const endIndex = startIndex + limit;
          const paginatedData = filteredData.slice(startIndex, endIndex);
          
          // Calculate summary based on filtered data
          const calculatedSummary = {
            ...mockSummary,
            totalWallets: filteredData.length,
            nonZeroWallets: filteredData.filter(w => w.balance_sol > 0).length,
            zeroWallets: filteredData.filter(w => w.balance_sol === 0).length
          };
          
          return {
            ok: true,
            json: async () => ({
              success: true,
              balances: paginatedData,
              pagination: generateMockPagination(page, limit, filteredData.length),
              summary: calculatedSummary
            })
          } as Response;
        }
        
        // Refresh cache endpoint
        if (url.includes('/api/admin/wallet-monitoring/refresh-cache')) {
          if (mockRefreshCacheSuccess) {
            return {
              ok: true,
              json: async () => ({
                success: true,
                message: "Cache refreshed successfully! Data updated from blockchain."
              })
            } as Response;
          } else {
            return {
              ok: false,
              status: 500,
              json: async () => ({
                success: false,
                error: "Failed to refresh cache. Service unavailable."
              })
            } as Response;
          }
        }
      }
      
      // Pass through any other requests to the original fetch
      return originalFetch(url, options);
    };
    
    // Clean up the mock
    return () => {
      window.fetch = originalFetch;
    };
  }, [mockData, mockError, mockRefreshCacheSuccess]);
  
  return <WalletBalanceAnalytics />;
};

const meta: Meta<typeof MockWalletBalanceAnalytics> = {
  title: 'Admin/WalletBalanceAnalytics',
  component: MockWalletBalanceAnalytics,
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
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-gray-200 mb-4">
          <h1 className="text-2xl font-bold mb-2">Wallet Balance Analytics</h1>
          <p className="text-gray-400">
            Dashboard for monitoring and analyzing wallet balances across the platform
          </p>
        </div>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MockWalletBalanceAnalytics>;

// The default story
export const Default: Story = {};

// Story with error state
export const ErrorState: Story = {
  args: {
    mockError: "Failed to fetch wallet balances: Internal server error"
  }
};

// Story with no wallets
export const NoWallets: Story = {
  args: {
    mockData: []
  }
};

// Story with non-zero balances only
export const NonZeroBalancesOnly: Story = {
  args: {
    mockData: mockBalances.filter(wallet => wallet.balance_sol > 0)
  }
};

// Story with cache refresh failure
export const CacheRefreshFailure: Story = {
  args: {
    mockRefreshCacheSuccess: false
  }
};

// Story with various balance tiers
export const VariousBalanceTiers: Story = {
  args: {
    mockData: [
      // Zero tier
      {
        id: 101,
        wallet_address: "Zero000000000000000000000000000000000000000",
        nickname: "ZeroBalance",
        username: "zero_user",
        role: "user",
        experience_points: 100,
        balance_lamports: "0",
        balance_sol: 0.0,
        last_updated: new Date().toISOString()
      },
      // Micro tier
      {
        id: 102,
        wallet_address: "Micro00000000000000000000000000000000000000",
        nickname: "MicroBalance",
        username: "micro_user",
        role: "user",
        experience_points: 200,
        balance_lamports: "50000",
        balance_sol: 0.00005,
        last_updated: new Date().toISOString()
      },
      // Small tier
      {
        id: 103,
        wallet_address: "Small00000000000000000000000000000000000000",
        nickname: "SmallBalance",
        username: "small_user",
        role: "user",
        experience_points: 500,
        balance_lamports: "500000000",
        balance_sol: 0.5,
        last_updated: new Date().toISOString()
      },
      // Medium tier
      {
        id: 104,
        wallet_address: "Medium0000000000000000000000000000000000000",
        nickname: "MediumBalance",
        username: "medium_user",
        role: "user",
        experience_points: 1000,
        balance_lamports: "5000000000",
        balance_sol: 5.0,
        last_updated: new Date().toISOString()
      },
      // Large tier
      {
        id: 105,
        wallet_address: "Large00000000000000000000000000000000000000",
        nickname: "LargeBalance",
        username: "large_user",
        role: "admin",
        experience_points: 5000,
        balance_lamports: "50000000000",
        balance_sol: 50.0,
        last_updated: new Date().toISOString()
      },
      // Whale tier
      {
        id: 106,
        wallet_address: "Whale00000000000000000000000000000000000000",
        nickname: "WhaleBalance",
        username: "whale_user",
        role: "superadmin",
        experience_points: 10000,
        balance_lamports: "500000000000",
        balance_sol: 500.0,
        last_updated: new Date().toISOString()
      }
    ]
  }
};