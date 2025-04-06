// src/stories/footer-websocket-diagnostics.stories.tsx

// We need React for JSX, even if it's not directly referenced
// @ts-ignore
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Footer } from '../components/layout/Footer';
import { BrowserRouter } from 'react-router-dom';
import { useState } from 'react';

// Create a wrapper component that allows toggling compact mode
const FooterWithCompactToggle = ({ isCompactInitial = false }) => {
  const [isCompact, setIsCompact] = useState(isCompactInitial);
  
  return (
    <div className="relative">
      {/* Toggle button */}
      <button 
        className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-10 
                  bg-gray-800 text-white px-3 py-1 rounded-md text-xs z-10
                  hover:bg-gray-700 transition-colors"
        onClick={() => setIsCompact(!isCompact)}
      >
        Toggle {isCompact ? "Expanded" : "Compact"} Mode
      </button>
      
      {/* Mock useScrollFooter hook by providing the compact state directly */}
      <div className={`${isCompact ? 'compact-footer' : 'expanded-footer'}`}>
        {(() => {
          // Override the useScrollFooter hook for our story
          if (typeof window !== 'undefined') {
            (window as any).useScrollFooterMock = () => ({ 
              isCompact, 
              scrollDirection: isCompact ? 'up' : 'down' 
            });
          }
          return <Footer />;
        })()}
      </div>
    </div>
  );
};

// Mock the necessary hooks and context data for Storybook
if (typeof window !== 'undefined') {
  // Unified WebSocket mock
  (window as any).useUnifiedWebSocketMock = (_id: string, _types: string[], _callback: Function, _topics?: string[]) => ({
    isConnected: true,
    isAuthenticated: true,
    connectionState: 'CONNECTED',
    error: null,
    subscribe: () => console.log('Mock subscribe called'),
    unsubscribe: () => console.log('Mock unsubscribe called'),
    send: () => console.log('Mock send called'),
    request: () => console.log('Mock request called')
  });
  
  // RPC Benchmark mock with test data
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
    isBenchmarkRunning: false,
    triggerBenchmark: () => {
      console.log('Mock trigger benchmark called');
      return true;
    },
    refreshData: () => console.log('Mock refresh data called')
  });
  
  // Mock useAuth for admin status
  (window as any).useAuth = () => ({
    user: {
      id: "test-user-id",
      username: "admin",
      role: "admin"
    },
    isAdmin: () => true,
    isSuperAdmin: () => false,
    getAuthToken: () => "mock-token"
  });
  
  // Mock useStore for basic state
  (window as any).useStore = () => ({
    user: {
      id: "test-user-id",
      username: "admin",
      role: "admin"
    },
    setUser: () => {},
    isWalletConnected: true,
    walletAddress: "0x1234",
    maintenanceMode: false
  });
}

const meta = {
  title: 'components/footer-websocket-diagnostics',
  component: FooterWithCompactToggle,
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
      <BrowserRouter>
        <div className="h-screen flex flex-col">
          <main className="flex-1 bg-gray-900">
            {/* Content placeholder */}
            <div className="h-full flex items-center justify-center text-gray-500">
              Main content area
            </div>
          </main>
          <Story />
        </div>
      </BrowserRouter>
    ),
  ],
  tags: ['autodocs'],
  argTypes: {
    isCompactInitial: {
      control: 'boolean',
      description: 'Initial compact state of the footer',
      defaultValue: false
    }
  }
} satisfies Meta<typeof FooterWithCompactToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story with all WebSocket diagnostics connected
export const AllConnected: Story = {
  // Adding Online as a story alias to maintain compatibility with new naming scheme while
  // keeping the original ID for any existing references
  storyName: 'Online',
  args: {
    isCompactInitial: false
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'The new sleek design of the status indicator spans the full height of the footer with a smooth gradient effect and subtle animation. The indicator displays the "ONLINE" state with a green color scheme. Use the toggle button to switch between compact and expanded modes.'
      }
    }
  },
  render: (args) => {
    // Explicitly set the server status to online for this story
    (window as any).serverStatusState = {
      status: 'online',
      message: 'Server is operating normally',
      timestamp: new Date().toISOString(),
      lastChecked: new Date().toISOString(),
      loading: false
    };
    
    // Reset the WebSocket mock to proper online state
    (window as any).useUnifiedWebSocketMock = (_id: string, _types: string[], callback: Function, _topics?: string[]) => {
      // Call the callback immediately with an online message
      callback({
        type: "DATA",
        topic: "SYSTEM",
        data: {
          status: 'online',
          message: 'Server is operating normally'
        }
      });
      
      return {
        isConnected: true,
        isAuthenticated: true,
        connectionState: 'CONNECTED',
        error: null,
        subscribe: () => console.log('Mock subscribe called'),
        unsubscribe: () => console.log('Mock unsubscribe called'),
        send: () => console.log('Mock send called'),
        request: () => console.log('Mock request called')
      };
    };
    
    return <FooterWithCompactToggle isCompactInitial={args.isCompactInitial} />;
  }
};

// Server in maintenance mode
export const Maintenance: Story = {
  args: {
    isCompactInitial: false
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Shows the footer with the server in "MAINTENANCE" state with a yellow caution-tape style animation that visually indicates maintenance work is in progress.'
      }
    }
  },
  render: (args) => {
    // Override the useUnifiedWebSocket mock for this specific story
    
    // Override the global state to maintenance status
    (window as any).serverStatusState = {
      status: 'maintenance',
      message: 'Scheduled maintenance in progress',
      timestamp: new Date().toISOString(),
      lastChecked: new Date().toISOString(),
      loading: false
    };
    
    (window as any).useUnifiedWebSocketMock = (_id: string, _types: string[], callback: Function, _topics?: string[]) => {
      // Call the callback immediately with a mock maintenance message
      callback({
        type: "DATA",
        topic: "SYSTEM",
        data: {
          status: 'maintenance',
          message: 'Scheduled maintenance in progress'
        }
      });
      
      return {
        // Don't use the original mock as it may have default values
        isConnected: true,
        isAuthenticated: true,
        connectionState: 'CONNECTED',
        error: null,
        subscribe: () => console.log('Mock subscribe called'),
        unsubscribe: () => console.log('Mock unsubscribe called'),
        send: () => console.log('Mock send called'),
        request: () => console.log('Mock request called')
      };
    };
    
    return <FooterWithCompactToggle isCompactInitial={args.isCompactInitial} />;
  }
};

// Server in error state
export const Error: Story = {
  args: {
    isCompactInitial: false
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Shows the footer with the server in "ERROR" state with an orange color scheme.'
      }
    }
  },
  render: (args) => {
    // Override the useUnifiedWebSocket mock for this specific story
    
    // Override the global state to error status
    (window as any).serverStatusState = {
      status: 'error',
      message: 'Service degradation detected',
      timestamp: new Date().toISOString(),
      lastChecked: new Date().toISOString(),
      loading: false
    };
    
    (window as any).useUnifiedWebSocketMock = (_id: string, _types: string[], callback: Function, _topics?: string[]) => {
      // Call the callback immediately with a mock error message
      callback({
        type: "DATA",
        topic: "SYSTEM",
        data: {
          status: 'error',
          message: 'Service degradation detected'
        }
      });
      
      return {
        // Don't use the original mock
        isConnected: true,
        isAuthenticated: true,
        connectionState: 'CONNECTED',
        error: null,
        subscribe: () => console.log('Mock subscribe called'),
        unsubscribe: () => console.log('Mock unsubscribe called'),
        send: () => console.log('Mock send called'),
        request: () => console.log('Mock request called')
      };
    };
    
    return <FooterWithCompactToggle isCompactInitial={args.isCompactInitial} />;
  }
};

// Server offline
export const Offline: Story = {
  args: {
    isCompactInitial: false
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Shows the footer with the server in "OFFLINE" state with a red color scheme.'
      }
    }
  },
  render: (args) => {
    // Override the useUnifiedWebSocket mock for this specific story
    
    // Override the global state to offline status
    (window as any).serverStatusState = {
      status: 'offline',
      message: 'Connection to server lost',
      timestamp: new Date().toISOString(),
      lastChecked: new Date().toISOString(),
      loading: false
    };
    
    (window as any).useUnifiedWebSocketMock = (_id: string, _types: string[], callback: Function, _topics?: string[]) => {
      // Call the callback immediately with a mock offline message
      callback({
        type: "DATA",
        topic: "SYSTEM",
        data: {
          status: 'offline',
          message: 'Connection to server lost'
        }
      });
      
      return {
        // Complete override with offline state
        isConnected: false,
        isAuthenticated: false,
        connectionState: 'DISCONNECTED',
        error: 'Connection lost',
        subscribe: () => console.log('Mock subscribe called'),
        unsubscribe: () => console.log('Mock unsubscribe called'),
        send: () => console.log('Mock send called'),
        request: () => console.log('Mock request called')
      };
    };
    
    return <FooterWithCompactToggle isCompactInitial={args.isCompactInitial} />;
  }
};

// Story where the system settings have diagnostics enabled showing RPC benchmarks
export const WithRpcBenchmark: Story = {
  args: {
    isCompactInitial: false
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Shows the footer with RPC benchmark information visible for admin users. The toggle button allows switching between compact and expanded modes.'
      }
    }
  },
  render: (args) => {
    // Override the useUnifiedWebSocket mock for this specific story
    // to include system settings that enable diagnostics
    const originalUnifiedWebSocketMock = (window as any).useUnifiedWebSocketMock;
    
    (window as any).useUnifiedWebSocketMock = (_id: string, _types: string[], callback: Function, _topics?: string[]) => {
      // Call the callback with a mock message that includes system settings
      setTimeout(() => {
        callback({
          type: "SYSTEM",
          data: {
            showDiagnostics: true,
            diagOptions: ['rpc_benchmarks', 'websocket_stats', 'network_monitor']
          }
        });
      }, 100);
      
      return {
        ...originalUnifiedWebSocketMock(_id, _types, callback, _topics),
        // Override any properties needed
      };
    };
    
    return <FooterWithCompactToggle isCompactInitial={args.isCompactInitial} />;
  }
};

// Story where user is not an admin (no diagnostics shown)
export const NonAdmin: Story = {
  args: {
    isCompactInitial: false
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Shows the footer for a non-admin user, without any diagnostics information. The toggle button allows switching between compact and expanded modes.'
      }
    }
  },
  render: (args) => {
    // Override the useAuth mock to return non-admin status
    (window as any).useAuth = () => ({
      user: {
        id: "test-user-id",
        username: "user",
        role: "user"
      },
      isAdmin: () => false,
      isSuperAdmin: () => false,
      getAuthToken: () => "mock-token"
    });
    
    return <FooterWithCompactToggle isCompactInitial={args.isCompactInitial} />;
  }
};