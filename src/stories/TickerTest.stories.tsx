import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
// No imports needed for this test component

// Create a simple wrapper component to verify Storybook updates
const TickerTestWrapper: React.FC = () => {
  // Mock token data that would normally come from context
  const mockTokens = [
    {
      symbol: 'ETH',
      name: 'Ethereum',
      price: '3500.00',
      marketCap: '423000000000',
      volume24h: '15000000',
      change24h: '4.2',
    },
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      price: '42000.00',
      marketCap: '850000000000',
      volume24h: '25000000',
      change24h: '-2.5',
    },
    {
      symbol: 'SOL',
      name: 'Solana',
      price: '120.00',
      marketCap: '58000000000',
      volume24h: '5000000',
      change24h: '8.1',
    }
  ];

  // Removed unused mock contests

  // Add custom styles inside the component
  return (
    <div className="bg-purple-900 p-6 rounded-lg border-4 border-green-500">
      <h1 className="text-3xl font-bold text-white mb-4">THIS IS A BRAND NEW TEST COMPONENT</h1>
      <div className="bg-black p-3 rounded mb-4">
        <h2 className="text-yellow-400 text-xl">Ticker Test</h2>
        
        {/* Add animation keyframes */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes ticker {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .ticker-animation {
              display: flex !important;
              white-space: nowrap !important;
              overflow: hidden !important;
              width: 100% !important;
            }
            .animated-bg {
              background: linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff);
              background-size: 700% 700%;
              animation: rainbow 5s linear infinite;
            }
            @keyframes rainbow { 
              0% { background-position: 0% 50%; }
              100% { background-position: 100% 50%; }
            }
          `
        }} />
        
        <div className="animated-bg text-white p-4 rounded animate-pulse">
          This is a pulsing rainbow box to verify animations work
        </div>
        
        <div className="mt-4 text-white">
          {mockTokens.map(token => (
            <div key={token.symbol} className="flex gap-4 mb-2">
              <span>{token.symbol}</span>
              <span>${token.price}</span>
              <span className={token.change24h.startsWith('-') ? 'text-red-500' : 'text-green-500'}>
                {token.change24h}%
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-gray-900 rounded p-2">
        <div className="text-cyan-300 font-bold mb-2">Real UnifiedTicker Component:</div>
      </div>
    </div>
  );
};

// Define component metadata
const meta: Meta<typeof TickerTestWrapper> = {
  title: 'Test/TickerTest',
  component: TickerTestWrapper,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TickerTestWrapper>;

// Default story
export const Default: Story = {};