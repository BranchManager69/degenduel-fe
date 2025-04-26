import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { motion } from 'framer-motion';
import { 
  BlinkButton, 
  ShareBlinkButton, 
  SolanaWalletConnector 
} from '../components/blinks';

/**
 * @fileoverview
 * Storybook stories for Solana Blinks (Actions) components
 * 
 * @description
 * Showcases Solana Actions (Blinks) components with various configurations:
 * - Basic button for executing transactions
 * - Share buttons for creating shareable links
 * - Wallet connector for Solana wallet integration
 * - Interactive demos of common use cases
 * - Live wallet connection visualization
 * 
 * @author Claude
 */

// Define metadata for the component with enhanced documentation
const meta: Meta<typeof BlinkButton> = {
  title: 'Crypto/Solana Blinks',
  component: BlinkButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Solana Blinks (Actions) Components

A set of components for integrating Solana Actions (Blinks) into the DegenDuel platform.

## Key Components

### BlinkButton

Execute Solana transactions with a single click. Features automatic wallet connection,
transaction signing, and feedback for users.

\`\`\`tsx
import { BlinkButton } from '../components/blinks';

const MyComponent = () => (
  <BlinkButton
    blinkUrl="/api/blinks/join-contest"
    params={{ contestId: "123", entryFee: "0.1" }}
    onSuccess={(signature) => console.log(signature)}
    onError={(error) => console.error(error)}
  />
);
\`\`\`

### ShareBlinkButton

Create and share transaction links that others can execute.

\`\`\`tsx
import { ShareBlinkButton } from '../components/blinks';

const MyComponent = () => (
  <ShareBlinkButton
    blinkUrl="/blinks/join-contest"
    params={{ contestId: "123" }}
    label="Share Contest"
  />
);
\`\`\`

### SolanaWalletConnector

Standalone wallet connector for Solana wallets.

\`\`\`tsx
import { SolanaWalletConnector } from '../components/blinks';

const MyComponent = () => (
  <SolanaWalletConnector variant="full" />
);
\`\`\`
        `
      }
    },
  },
  tags: ['autodocs'],
  argTypes: {
    blinkUrl: {
      control: 'text',
      description: 'URL endpoint for the blink action'
    },
    params: {
      control: 'object',
      description: 'Parameters to pass to the blink endpoint'
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply to the button'
    },
    label: {
      control: 'text',
      description: 'Custom label text for the button'
    },
    onSuccess: {
      action: 'success',
      description: 'Callback fired when transaction is successful'
    },
    onError: {
      action: 'error',
      description: 'Callback fired when an error occurs'
    }
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Example mock server response for blink metadata
const mockMetadata = {
  title: 'Join Weekly Contest',
  description: 'Compete with other traders in our weekly contest',
  icon: 'https://via.placeholder.com/64',
  label: 'Join Now'
};

// Mock for successful transaction response
const mockTransaction = {
  transaction: 'base64_encoded_transaction_data'
};

// Helper function to mock API response
const mockFetch = (_url: string, options?: RequestInit): Promise<Response> => {
  // Simulate network delay
  return new Promise(resolve => {
    setTimeout(() => {
      // For GET requests, return metadata
      if (!options || options.method === 'GET' || !options.method) {
        return resolve({
          ok: true,
          json: () => Promise.resolve(mockMetadata)
        } as Response);
      }
      
      // For POST requests, return transaction
      if (options.method === 'POST') {
        return resolve({
          ok: true,
          json: () => Promise.resolve(mockTransaction)
        } as Response);
      }
      
      // Default response
      return resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ error: 'Not found' })
      } as Response);
    }, 500);
  });
};

// Basic BlinkButton Story
export const BasicBlinkButton: Story = {
  args: {
    blinkUrl: '/api/blinks/join-contest',
    params: { contestId: 'weekly-crypto-123' },
    label: 'Join Contest',
    className: 'bg-indigo-600 hover:bg-indigo-700'
  },
  parameters: {
    docs: {
      description: {
        story: 'Basic BlinkButton for executing Solana transactions. The button automatically handles wallet connection, transaction signing, and feedback.'
      }
    },
    mockData: [
      {
        url: '/api/blinks/join-contest',
        method: 'GET',
        status: 200,
        response: mockMetadata
      },
      {
        url: '/api/blinks/join-contest',
        method: 'POST',
        status: 200,
        response: mockTransaction
      }
    ]
  },
  render: (args) => {
    // Mock fetch for the story
    const originalFetch = window.fetch;
    window.fetch = mockFetch as any;
    
    // Cleanup when component unmounts
    React.useEffect(() => {
      return () => {
        window.fetch = originalFetch;
      };
    }, []);
    
    // Ensure required props are provided
    const safeArgs = {
      blinkUrl: '/api/blinks/join-contest',
      ...args
    };
    
    return (
      <div className="p-6 max-w-sm mx-auto bg-gray-800 rounded-xl shadow-md flex flex-col items-center">
        <h3 className="text-xl font-medium text-white mb-4">Contest Action</h3>
        <BlinkButton {...safeArgs} />
      </div>
    );
  }
};

// ShareBlinkButton Story
export const ShareButton: Story = {
  render: () => {
    return (
      <div className="p-6 max-w-sm mx-auto bg-gray-800 rounded-xl shadow-md flex flex-col items-center">
        <h3 className="text-xl font-medium text-white mb-4">Share Blink Link</h3>
        <ShareBlinkButton
          blinkUrl="/blinks/join-contest"
          params={{ contestId: 'weekly-crypto-123' }}
          label="Share"
          className="bg-blue-600 hover:bg-blue-700"
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'ShareBlinkButton for creating and sharing transaction links. The button generates a URL that can be shared with others.'
      }
    }
  }
};

// Wallet Connector Story
export const WalletConnector: Story = {
  render: () => {
    return (
      <div className="p-6 max-w-md mx-auto bg-gray-800 rounded-xl shadow-md flex flex-col items-center">
        <h3 className="text-xl font-medium text-white mb-4">Solana Wallet Connector</h3>
        <SolanaWalletConnector variant="full" />
        
        <div className="mt-6 border-t border-gray-700 pt-4 w-full">
          <h4 className="text-lg font-medium text-white mb-3">Minimal Variant</h4>
          <div className="flex justify-between items-center bg-gray-700 p-3 rounded-lg">
            <span className="text-gray-300">Connect your wallet:</span>
            <SolanaWalletConnector variant="minimal" />
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'SolanaWalletConnector provides an interface for connecting to Solana wallets. It supports both full and minimal variants.'
      }
    }
  }
};

// Interactive Contest Card with Blink components
const ContestCard = ({ 
  contest, 
  onJoin 
}: { 
  contest: {
    id: string;
    name: string;
    description: string;
    entryFee: string;
    prize: string;
    startDate: string;
    endDate: string;
  };
  onJoin: (contestId: string, signature: string) => void;
}) => {
  const [joined, setJoined] = useState(false);
  
  const handleSuccess = (signature: string) => {
    setJoined(true);
    onJoin(contest.id, signature);
  };
  
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 max-w-md">
      <h3 className="text-xl font-bold text-white mb-2">{contest.name}</h3>
      <p className="text-gray-400 mb-4">{contest.description}</p>
      
      <div className="flex justify-between text-sm text-gray-500 mb-4">
        <div>Entry: {contest.entryFee} SOL</div>
        <div>Prize: {contest.prize} SOL</div>
      </div>
      
      <div className="flex justify-between text-xs text-gray-500 mb-6">
        <div>Starts: {new Date(contest.startDate).toLocaleDateString()}</div>
        <div>Ends: {new Date(contest.endDate).toLocaleDateString()}</div>
      </div>
      
      <div className="flex space-x-4">
        {joined ? (
          <button 
            className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg cursor-not-allowed opacity-80"
            disabled
          >
            Joined ✓
          </button>
        ) : (
          <BlinkButton
            blinkUrl="/api/blinks/join-contest"
            params={{ 
              contestId: contest.id,
              contestName: contest.name,
              entryFee: contest.entryFee
            }}
            className="flex-1"
            label="Join Contest"
            onSuccess={handleSuccess}
            onError={(err) => console.error(err)}
          />
        )}
        
        <ShareBlinkButton
          blinkUrl="/blinks/join-contest"
          params={{ 
            contestId: contest.id,
            contestName: contest.name
          }}
          label="Share"
        />
      </div>
    </div>
  );
};

// Contest Page Story
export const ContestPage: Story = {
  render: () => {
    // Mock fetch for the story
    const originalFetch = window.fetch;
    window.fetch = mockFetch as any;
    
    // Sample contests
    const contests = [
      {
        id: 'weekly-crypto-123',
        name: 'Weekly Crypto Challenge',
        description: 'Compete with other traders to earn the highest returns on your portfolio.',
        entryFee: '0.1',
        prize: '5.0',
        startDate: '2025-04-05T00:00:00Z',
        endDate: '2025-04-12T00:00:00Z',
      },
      {
        id: 'altcoin-battle-456',
        name: 'Altcoin Battle Royale',
        description: 'Test your skills with alt coins in this high-stakes contest.',
        entryFee: '0.2',
        prize: '10.0',
        startDate: '2025-04-10T00:00:00Z',
        endDate: '2025-04-17T00:00:00Z',
      }
    ];
    
    const [joinedContests, setJoinedContests] = useState<string[]>([]);
    
    // Cleanup when component unmounts
    React.useEffect(() => {
      return () => {
        window.fetch = originalFetch;
      };
    }, []);
    
    const handleJoinContest = (contestId: string, signature: string) => {
      console.log(`Joined contest ${contestId} with signature ${signature}`);
      setJoinedContests(prev => [...prev, contestId]);
    };
    
    return (
      <div className="max-w-4xl mx-auto p-6 bg-gray-900 rounded-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Available Contests</h2>
          <SolanaWalletConnector variant="minimal" />
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {contests.map(contest => (
            <ContestCard 
              key={contest.id} 
              contest={contest} 
              onJoin={handleJoinContest} 
            />
          ))}
        </div>
        
        {joinedContests.length > 0 && (
          <div className="mt-6 p-4 bg-green-900/20 border border-green-700/30 rounded-lg">
            <h3 className="text-lg font-semibold text-green-400 mb-2">Joined Contests</h3>
            <ul className="list-disc list-inside text-gray-300">
              {joinedContests.map(id => (
                <li key={id}>
                  {contests.find(c => c.id === id)?.name} - Successfully joined
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Integration example showing how Blink components can be used in a contest listing page. Users can join contests and share contest links with friends.'
      }
    }
  }
};

// Interactive Token Betting with Blink Components
const TokenBettingCard = ({
  token,
  onBet
}: {
  token: {
    id: string;
    name: string;
    symbol: string;
    price: string;
    change24h: string;
    imageUrl?: string;
  };
  onBet: (tokenId: string, direction: 'up' | 'down', signature: string) => void;
}) => {
  const [activeBet, setActiveBet] = useState<'up' | 'down' | null>(null);
  
  const handleBetSuccess = (direction: 'up' | 'down', signature: string) => {
    setActiveBet(direction);
    onBet(token.id, direction, signature);
  };
  
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 max-w-md">
      <div className="flex items-center mb-4">
        {token.imageUrl && (
          <img 
            src={token.imageUrl} 
            alt={token.symbol} 
            className="w-10 h-10 rounded-full mr-4" 
          />
        )}
        <div>
          <h3 className="text-xl font-bold text-white">{token.name}</h3>
          <div className="text-gray-400 text-sm">{token.symbol}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-lg font-mono text-white">${token.price}</div>
          <div className={`text-sm font-mono ${token.change24h.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
            {token.change24h}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mt-4">
        {activeBet === 'up' ? (
          <button 
            className="py-2 px-4 bg-green-600 text-white rounded-lg cursor-not-allowed opacity-80"
            disabled
          >
            Bet UP ✓
          </button>
        ) : (
          <BlinkButton
            blinkUrl="/api/blinks/place-token-bet"
            params={{
              tokenId: token.id,
              tokenSymbol: token.symbol,
              amount: "0.1",
              direction: "up"
            }}
            className="bg-green-600 hover:bg-green-700"
            label="Bet UP"
            onSuccess={(signature) => handleBetSuccess('up', signature)}
            onError={(err) => console.error(err)}
          />
        )}
        
        {activeBet === 'down' ? (
          <button 
            className="py-2 px-4 bg-red-600 text-white rounded-lg cursor-not-allowed opacity-80"
            disabled
          >
            Bet DOWN ✓
          </button>
        ) : (
          <BlinkButton
            blinkUrl="/api/blinks/place-token-bet"
            params={{
              tokenId: token.id,
              tokenSymbol: token.symbol,
              amount: "0.1",
              direction: "down"
            }}
            className="bg-red-600 hover:bg-red-700"
            label="Bet DOWN"
            onSuccess={(signature) => handleBetSuccess('down', signature)}
            onError={(err) => console.error(err)}
          />
        )}
      </div>
      
      <div className="mt-4 text-center">
        <ShareBlinkButton
          blinkUrl="/blinks/place-token-bet"
          params={{
            tokenId: token.id,
            tokenSymbol: token.symbol,
            amount: "0.1",
            direction: activeBet || "up"
          }}
          label={`Share ${activeBet ? activeBet.toUpperCase() + ' Bet' : 'Bet'}`}
          className="text-xs bg-gray-700 hover:bg-gray-600"
        />
      </div>
    </div>
  );
};

// Token Betting Page Story
export const TokenBetting: Story = {
  render: () => {
    // Mock fetch for the story
    const originalFetch = window.fetch;
    window.fetch = mockFetch as any;
    
    // Sample tokens
    const tokens = [
      {
        id: 'solana',
        name: 'Solana',
        symbol: 'SOL',
        price: '166.42',
        change24h: '+2.5%',
        imageUrl: 'https://via.placeholder.com/40/9945FF/FFFFFF?text=SOL'
      },
      {
        id: 'bonk',
        name: 'Bonk',
        symbol: 'BONK',
        price: '0.00000225',
        change24h: '-1.2%',
        imageUrl: 'https://via.placeholder.com/40/F7931A/FFFFFF?text=BONK'
      },
      {
        id: 'jupiter',
        name: 'Jupiter',
        symbol: 'JUP',
        price: '8.76',
        change24h: '+4.7%',
        imageUrl: 'https://via.placeholder.com/40/16BDCA/FFFFFF?text=JUP'
      }
    ];
    
    const [activeBets, setActiveBets] = useState<Array<{tokenId: string, direction: 'up' | 'down'}>>([]);
    
    // Cleanup when component unmounts
    React.useEffect(() => {
      return () => {
        window.fetch = originalFetch;
      };
    }, []);
    
    const handleBet = (tokenId: string, direction: 'up' | 'down', signature: string) => {
      console.log(`Bet ${direction} on ${tokenId} with signature ${signature}`);
      setActiveBets(prev => [...prev, { tokenId, direction }]);
    };
    
    return (
      <div className="max-w-4xl mx-auto p-6 bg-gray-900 rounded-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Token Betting</h2>
          <SolanaWalletConnector variant="minimal" />
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {tokens.map(token => (
            <TokenBettingCard 
              key={token.id} 
              token={token} 
              onBet={handleBet} 
            />
          ))}
        </div>
        
        {activeBets.length > 0 && (
          <div className="mt-6 p-4 bg-indigo-900/20 border border-indigo-700/30 rounded-lg">
            <h3 className="text-lg font-semibold text-indigo-400 mb-2">Your Active Bets</h3>
            <ul className="list-disc list-inside text-gray-300">
              {activeBets.map((bet, index) => {
                const token = tokens.find(t => t.id === bet.tokenId);
                return (
                  <li key={index}>
                    {token?.name} ({token?.symbol}) - Betting price will go {bet.direction.toUpperCase()}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Integration example showing how Blink components can be used for token betting. Users can bet on token price movements and share bet links.'
      }
    }
  }
};

// Interactive Wallet Connection Demo
export const WalletConnectionDemo: Story = {
  render: () => {
    const [walletState, setWalletState] = useState({
      connected: false,
      publicKey: '',
      animations: {
        checking: false,
        connecting: false,
        success: false,
        error: false
      }
    });
    
    // Simulate wallet detection and connection
    const simulateWalletCheck = () => {
      setWalletState(prev => ({ ...prev, animations: { ...prev.animations, checking: true }}));
      
      setTimeout(() => {
        const hasWallet = Math.random() > 0.3; // 70% chance of success
        
        if (hasWallet) {
          setWalletState(prev => ({ 
            ...prev, 
            animations: { ...prev.animations, checking: false, connecting: true }
          }));
          
          // Simulate connection process
          setTimeout(() => {
            const connectSuccess = Math.random() > 0.2; // 80% chance of success
            
            if (connectSuccess) {
              // Generate mock public key
              const publicKey = Array.from({length: 44}, () => 
                '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'[
                  Math.floor(Math.random() * 62)
                ]
              ).join('');
              
              setWalletState(prev => ({ 
                ...prev, 
                connected: true,
                publicKey,
                animations: { ...prev.animations, connecting: false, success: true }
              }));
              
              // Reset success animation
              setTimeout(() => {
                setWalletState(prev => ({ 
                  ...prev, 
                  animations: { ...prev.animations, success: false }
                }));
              }, 2000);
            } else {
              setWalletState(prev => ({ 
                ...prev, 
                animations: { ...prev.animations, connecting: false, error: true }
              }));
              
              // Reset error animation
              setTimeout(() => {
                setWalletState(prev => ({ 
                  ...prev, 
                  animations: { ...prev.animations, error: false }
                }));
              }, 2000);
            }
          }, 1500);
        } else {
          // No wallet found
          setWalletState(prev => ({ 
            ...prev, 
            animations: { ...prev.animations, checking: false, error: true }
          }));
          
          // Reset error animation
          setTimeout(() => {
            setWalletState(prev => ({ 
              ...prev, 
              animations: { ...prev.animations, error: false }
            }));
          }, 2000);
        }
      }, 1000);
    };
    
    // Disconnect wallet
    const disconnectWallet = () => {
      setWalletState({
        connected: false,
        publicKey: '',
        animations: {
          checking: false,
          connecting: false,
          success: false,
          error: false
        }
      });
    };
    
    return (
      <div className="max-w-4xl mx-auto p-6 bg-gray-900 rounded-lg">
        <h2 className="text-2xl font-bold text-white mb-6">Wallet Connection Lifecycle</h2>
        
        <div className="grid md:grid-cols-2 gap-10">
          {/* Left side - connection visualization */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Connection Visualization</h3>
            
            <div className="relative flex flex-col items-center justify-center h-64 border border-gray-700 rounded-lg bg-gray-900">
              {/* Wallet Icon */}
              <div className={`mb-4 ${walletState.animations.connecting ? 'animate-pulse' : ''}`}>
                <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect
                    x="2"
                    y="4"
                    width="20"
                    height="16"
                    rx="2"
                    className={walletState.connected ? 'fill-indigo-600' : 'fill-gray-700'}
                  />
                  <rect
                    x="2"
                    y="7"
                    width="20"
                    height="10"
                    fill={walletState.connected ? '#4338ca' : '#374151'}
                  />
                  <circle 
                    cx="16" 
                    cy="12" 
                    r="2" 
                    className={`${walletState.connected ? 'fill-indigo-300' : 'fill-gray-500'} ${
                      walletState.animations.success ? 'animate-ping' : ''
                    }`}
                  />
                </svg>
              </div>
              
              {/* Connection Status */}
              <div className="text-center">
                <div className={`text-lg font-semibold mb-1 ${
                  walletState.connected ? 'text-green-400' : 
                  walletState.animations.error ? 'text-red-400' : 
                  'text-gray-400'
                }`}>
                  {walletState.connected ? 'Connected' : 
                   walletState.animations.checking ? 'Detecting Wallet...' :
                   walletState.animations.connecting ? 'Connecting...' :
                   walletState.animations.error ? 'Connection Failed' :
                   'Not Connected'}
                </div>
                {walletState.connected && (
                  <div className="text-xs text-gray-400 font-mono max-w-full truncate">
                    {walletState.publicKey.slice(0, 6)}...{walletState.publicKey.slice(-4)}
                  </div>
                )}
              </div>
              
              {/* Animation Overlays */}
              {walletState.animations.checking && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                  <div className="w-8 h-8 border-t-2 border-indigo-500 rounded-full animate-spin"></div>
                </div>
              )}
              
              {walletState.animations.success && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center bg-green-500/10 rounded-lg"
                >
                  <div className="bg-green-500 rounded-full p-2">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </motion.div>
              )}
              
              {walletState.animations.error && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center bg-red-500/10 rounded-lg"
                >
                  <div className="bg-red-500 rounded-full p-2">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </motion.div>
              )}
            </div>
            
            <div className="mt-6 flex justify-center space-x-4">
              <button
                onClick={simulateWalletCheck}
                disabled={walletState.connected || walletState.animations.checking || walletState.animations.connecting}
                className={`px-4 py-2 rounded-lg ${
                  walletState.connected || walletState.animations.checking || walletState.animations.connecting 
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                Connect Wallet
              </button>
              
              <button
                onClick={disconnectWallet}
                disabled={!walletState.connected}
                className={`px-4 py-2 rounded-lg ${
                  !walletState.connected
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                Disconnect
              </button>
            </div>
          </div>
          
          {/* Right side - actual implementation */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Actual Implementation</h3>
            
            <div className="flex flex-col items-center justify-center space-y-6 h-64 border border-gray-700 rounded-lg bg-gray-900 p-4">
              <SolanaWalletConnector />
              
              {/* Example Blink Button that requires wallet connection */}
              <div className="mt-4">
                <BlinkButton
                  blinkUrl="/api/blinks/sample-action"
                  params={{ action: 'test' }}
                  className="bg-indigo-600 hover:bg-indigo-700"
                  label="Execute Action"
                />
              </div>
            </div>
            
            <div className="mt-6 bg-gray-900 p-4 rounded-lg text-sm text-gray-400">
              <h4 className="text-white font-semibold mb-2">Implementation Notes</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Uses independent wallet hook system</li>
                <li>Auto-prompts for connection when needed</li>
                <li>Works with any Solana wallet extension</li>
                <li>Maintains state across component renders</li>
                <li>Handles connection errors gracefully</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-indigo-900/20 border border-indigo-700/30 rounded-lg">
          <h3 className="text-lg font-semibold text-indigo-400 mb-2">Developer Notes</h3>
          <p className="text-gray-300">
            The <code className="bg-gray-800 px-1 py-0.5 rounded">useSolanaWallet</code> hook handles automatic detection of wallet providers, connection state management, and transaction signing. It works independently from the main DegenDuel wallet system, providing a dedicated pathway for Solana Actions (Blinks).
          </p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'An interactive demonstration of the wallet connection lifecycle for Solana Blinks. Shows both a visualization of the process and the actual implementation.'
      }
    }
  }
};

// Comprehensive Blinks Demo with multiple examples
export const BlinksDashboard: Story = {
  render: () => {
    // Mock fetch for the story
    const originalFetch = window.fetch;
    window.fetch = mockFetch as any;
    
    // Setup tabs state
    const [activeTab, setActiveTab] = useState<'contests' | 'betting' | 'other'>('contests');
    
    // Sample data for contests
    const contests = [
      {
        id: 'weekly-crypto-123',
        name: 'Weekly Crypto Challenge',
        description: 'Test your trading skills in our flagship weekly contest.',
        entryFee: '0.05',
        prize: '2.5',
        startDate: '2025-04-05T00:00:00Z',
        endDate: '2025-04-12T00:00:00Z',
      },
      {
        id: 'defi-masters-456',
        name: 'DeFi Masters Tournament',
        description: 'Focus on DeFi tokens in this specialized contest format.',
        entryFee: '0.1',
        prize: '5.0',
        startDate: '2025-04-08T00:00:00Z',
        endDate: '2025-04-15T00:00:00Z',
      }
    ];
    
    // Sample data for tokens
    const tokens = [
      {
        id: 'solana',
        name: 'Solana',
        symbol: 'SOL',
        price: '168.25',
        change24h: '+3.2%',
        imageUrl: 'https://via.placeholder.com/40/9945FF/FFFFFF?text=SOL'
      },
      {
        id: 'jupiter',
        name: 'Jupiter',
        symbol: 'JUP',
        price: '8.92',
        change24h: '+5.1%',
        imageUrl: 'https://via.placeholder.com/40/16BDCA/FFFFFF?text=JUP'
      }
    ];
    
    // Sample data for other actions
    const otherActions = [
      {
        id: 'claim-rewards',
        name: 'Claim Contest Rewards',
        description: 'Claim your rewards from completed contests',
        url: '/api/blinks/claim-rewards',
        params: { userId: 'user-123' }
      },
      {
        id: 'upgrade-account',
        name: 'Upgrade to Premium',
        description: 'Unlock advanced features with a premium account',
        url: '/api/blinks/upgrade-account',
        params: { tier: 'premium' }
      }
    ];
    
    // State for activity log
    const [activityLog, setActivityLog] = useState<Array<{
      action: string;
      target: string;
      timestamp: string;
      signature?: string;
    }>>([]);
    
    // Log activity handler
    const logActivity = (action: string, target: string, signature?: string) => {
      const newActivity = {
        action,
        target,
        timestamp: new Date().toISOString(),
        signature
      };
      
      setActivityLog(prev => [newActivity, ...prev]);
    };
    
    // Cleanup when component unmounts
    React.useEffect(() => {
      return () => {
        window.fetch = originalFetch;
      };
    }, []);
    
    // Event handlers
    const handleJoinContest = (contestId: string, signature: string) => {
      const contest = contests.find(c => c.id === contestId);
      logActivity('join', contest?.name || contestId, signature);
    };
    
    const handleBet = (tokenId: string, direction: 'up' | 'down', signature: string) => {
      const token = tokens.find(t => t.id === tokenId);
      logActivity(`bet_${direction}`, token?.name || tokenId, signature);
    };
    
    const handleOtherAction = (actionId: string, signature: string) => {
      const action = otherActions.find(a => a.id === actionId);
      logActivity('execute', action?.name || actionId, signature);
    };
    
    return (
      <div className="max-w-6xl mx-auto p-6 bg-gray-900 rounded-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Solana Blinks Dashboard</h2>
          <SolanaWalletConnector variant="minimal" />
        </div>
        
        {/* Tabs Navigation */}
        <div className="flex border-b border-gray-700 mb-6">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'contests' 
                ? 'text-indigo-400 border-b-2 border-indigo-400' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('contests')}
          >
            Contests
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'betting' 
                ? 'text-indigo-400 border-b-2 border-indigo-400' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('betting')}
          >
            Token Betting
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'other' 
                ? 'text-indigo-400 border-b-2 border-indigo-400' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('other')}
          >
            Other Actions
          </button>
        </div>
        
        {/* Main content area */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Left column - Actions */}
          <div className="md:col-span-2">
            {/* Contests Tab */}
            {activeTab === 'contests' && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Available Contests</h3>
                <div className="grid gap-6">
                  {contests.map(contest => (
                    <ContestCard
                      key={contest.id}
                      contest={contest}
                      onJoin={handleJoinContest}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Betting Tab */}
            {activeTab === 'betting' && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Token Betting</h3>
                <div className="grid gap-6">
                  {tokens.map(token => (
                    <TokenBettingCard
                      key={token.id}
                      token={token}
                      onBet={handleBet}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Other Actions Tab */}
            {activeTab === 'other' && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Other Actions</h3>
                <div className="grid gap-6">
                  {otherActions.map(action => (
                    <div key={action.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                      <h4 className="text-lg font-bold text-white mb-2">{action.name}</h4>
                      <p className="text-gray-400 mb-4">{action.description}</p>
                      
                      <div className="flex space-x-4">
                        <BlinkButton
                          blinkUrl={action.url}
                          params={typeof action.params === 'object' ? 
                            Object.fromEntries(
                              // Ensure all values are strings
                              Object.entries(action.params).map(([k, v]) => [k, String(v)])
                            ) : 
                            undefined
                          }
                          className="flex-1"
                          label="Execute"
                          onSuccess={(signature) => handleOtherAction(action.id, signature)}
                          onError={(err) => console.error(err)}
                        />
                        
                        <ShareBlinkButton
                          blinkUrl={action.url.replace('/api/', '/')}
                          params={typeof action.params === 'object' ? 
                            Object.fromEntries(
                              // Ensure all values are strings
                              Object.entries(action.params).map(([k, v]) => [k, String(v)])
                            ) : 
                            undefined
                          }
                          label="Share"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Right column - Activity Log */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Activity Log</h3>
            <div className="bg-gray-800 rounded-lg border border-gray-700 h-96 overflow-y-auto">
              {activityLog.length === 0 ? (
                <div className="text-gray-500 text-center p-6">
                  No activity yet. Execute an action to see it logged here.
                </div>
              ) : (
                <div className="p-4">
                  {activityLog.map((activity, index) => (
                    <div key={index} className="border-b border-gray-700 py-3 last:border-b-0">
                      <div className="flex justify-between">
                        <div className="font-medium text-white">
                          {activity.action === 'join' && '🎮 Joined Contest'}
                          {activity.action === 'bet_up' && '📈 Bet UP on'}
                          {activity.action === 'bet_down' && '📉 Bet DOWN on'}
                          {activity.action === 'execute' && '⚡ Executed'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="text-gray-400 text-sm">
                        {activity.target}
                      </div>
                      {activity.signature && (
                        <div className="text-xs text-gray-500 font-mono mt-1">
                          Signature: {activity.signature.slice(0, 10)}...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Documentation Block */}
            <div className="mt-6 bg-gray-800 rounded-lg border border-gray-700 p-4">
              <h4 className="text-sm font-semibold text-white mb-2">About Solana Blinks</h4>
              <p className="text-xs text-gray-400 mb-3">
                Solana Blinks (Actions) allow you to execute blockchain transactions with a single click or share transaction links with others.
              </p>
              <div className="flex text-xs">
                <a href="#" className="text-indigo-400 hover:underline">Documentation</a>
                <span className="mx-2 text-gray-600">•</span>
                <a href="#" className="text-indigo-400 hover:underline">Developer Guide</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'A comprehensive demonstration of Solana Blinks in a dashboard-style interface. Shows multiple action types, logging of activities, and tabbed navigation.'
      }
    }
  }
};