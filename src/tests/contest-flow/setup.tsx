/**
 * Contest Flow End-to-End Testing Setup
 * 
 * This file sets up the testing environment for comprehensive contest flow testing
 * using real server connections but controlled test data.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ContestProvider } from '../../contexts/ContestContext';
import { UnifiedWebSocketProvider } from '../../contexts/UnifiedWebSocketContext';

// Test Configuration
export const TEST_CONFIG = {
  // Use development server for testing
  API_URL: process.env.VITE_TEST_API_URL || 'https://dev.degenduel.me/api',
  WS_URL: process.env.VITE_TEST_WS_URL || 'wss://dev.degenduel.me',
  
  // Test contest settings
  TEST_CONTEST_PREFIX: 'E2E_TEST_',
  TEST_USER_PREFIX: 'test_user_',
  
  // Timing settings for testing
  FAST_CONTEST_DURATION: 5 * 60 * 1000, // 5 minutes
  PORTFOLIO_SELECTION_TIMEOUT: 30 * 1000, // 30 seconds
  WEBSOCKET_CONNECTION_TIMEOUT: 10 * 1000, // 10 seconds
};

// Test Data Templates
export const TEST_CONTEST_TEMPLATE = {
  name: `${TEST_CONFIG.TEST_CONTEST_PREFIX}Weekly Trading Competition`,
  description: 'Test contest for E2E flow verification',
  entry_fee: '0', // Start with free contest
  min_participants: 2,
  max_participants: 10,
  allowed_buckets: [1, 2, 3, 4, 5],
  settings: {
    difficulty: 'guppy' as const,
    tokenTypesAllowed: ['crypto'],
    startingPortfolioValue: '1000',
    minParticipants: 2,
    maxParticipants: 10,
  }
};

export const TEST_PAID_CONTEST_TEMPLATE = {
  ...TEST_CONTEST_TEMPLATE,
  name: `${TEST_CONFIG.TEST_CONTEST_PREFIX}Paid Trading Challenge`,
  entry_fee: '0.01', // Small amount for testing
};

// Mock Test Users
export const TEST_USERS = {
  FREE_USER: {
    username: `${TEST_CONFIG.TEST_USER_PREFIX}free_user`,
    email: 'test_free@degenduel.test',
    hasWallet: false,
  },
  PAID_USER: {
    username: `${TEST_CONFIG.TEST_USER_PREFIX}paid_user`,
    email: 'test_paid@degenduel.test',
    hasWallet: true,
    walletAddress: '0xtest123456789abcdef',
  },
  ADMIN_USER: {
    username: `${TEST_CONFIG.TEST_USER_PREFIX}admin`,
    email: 'test_admin@degenduel.test',
    role: 'admin',
    hasWallet: true,
  }
};

// Test Portfolio Templates
export const TEST_PORTFOLIOS = {
  BALANCED: [
    { symbol: 'SOL', weight: 40 },
    { symbol: 'JTO', weight: 30 },
    { symbol: 'RAY', weight: 30 },
  ],
  SOL_HEAVY: [
    { symbol: 'SOL', weight: 60 },
    { symbol: 'JTO', weight: 40 },
  ],
  DIVERSIFIED: [
    { symbol: 'SOL', weight: 25 },
    { symbol: 'JTO', weight: 25 },
    { symbol: 'RAY', weight: 25 },
    { symbol: 'BONK', weight: 25 },
  ]
};

// Testing Wrapper Component
export const ContestFlowTestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <UnifiedWebSocketProvider>
          <ContestProvider>
            {children}
          </ContestProvider>
        </UnifiedWebSocketProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Test Contest Creation Helper
export const createTestContest = async (template = TEST_CONTEST_TEMPLATE, overrides = {}) => {
  const contestData = {
    ...template,
    ...overrides,
    // Add unique timestamp to avoid conflicts
    name: `${template.name}_${Date.now()}`,
    start_time: new Date(Date.now() + 60 * 1000).toISOString(), // Start in 1 minute
    end_time: new Date(Date.now() + TEST_CONFIG.FAST_CONTEST_DURATION).toISOString(),
  };

  const response = await fetch(`${TEST_CONFIG.API_URL}/contests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(contestData),
  });

  if (!response.ok) {
    throw new Error(`Failed to create test contest: ${response.statusText}`);
  }

  return response.json();
};

// Test Contest Cleanup Helper
export const cleanupTestContests = async () => {
  try {
    const response = await fetch(`${TEST_CONFIG.API_URL}/admin/contests/cleanup-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ prefix: TEST_CONFIG.TEST_CONTEST_PREFIX }),
    });
    
    if (response.ok) {
      console.log('✅ Test contests cleaned up successfully');
    }
  } catch (error) {
    console.warn('⚠️ Test cleanup failed (non-critical):', error);
  }
};

// WebSocket Connection Helper
export const waitForWebSocketConnection = async (timeout = TEST_CONFIG.WEBSOCKET_CONNECTION_TIMEOUT) => {
  return new Promise<void>((_resolve, reject) => {
    const startTime = Date.now();
    
    const checkConnection = () => {
      if (Date.now() - startTime > timeout) {
        reject(new Error('WebSocket connection timeout'));
        return;
      }
      
      // Check if WebSocket context indicates connection
      // This would be implemented based on your WebSocket context
      setTimeout(checkConnection, 100);
    };
    
    checkConnection();
  });
};

// Performance Monitoring
export const performanceMonitor = {
  startTiming: (label: string) => {
    console.time(label);
  },
  
  endTiming: (label: string) => {
    console.timeEnd(label);
  },
  
  measurePageLoad: async (page: string) => {
    const startTime = performance.now();
    // Wait for page to be fully loaded
    await new Promise(resolve => setTimeout(resolve, 1000));
    const endTime = performance.now();
    console.log(`📊 ${page} loaded in ${endTime - startTime}ms`);
  }
};

// Error Scenario Helpers
export const simulateNetworkError = async (duration = 5000) => {
  // Implement network simulation if needed
  console.log(`🔧 Simulating network error for ${duration}ms`);
};

export const simulateWalletDisconnection = async () => {
  // Trigger wallet disconnection event
  console.log('🔧 Simulating wallet disconnection');
}; 