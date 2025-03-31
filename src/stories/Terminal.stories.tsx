import type { Meta, StoryObj } from '@storybook/react';
import { Terminal } from '../components/terminal/Terminal';
import { useEffect, useState } from 'react';

// Default configuration for the Terminal
const defaultConfig = {
  RELEASE_DATE: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  CONTRACT_ADDRESS: '0x1234...5678',
  DISPLAY: {
    DATE_SHORT: '2025-03-30',
    DATE_FULL: 'March 30, 2025',
    TIME: '12:00 UTC',
  }
};

// Define metadata for the component
const meta = {
  title: 'Components/Terminal',
  component: Terminal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    config: { control: 'object' },
    onCommandExecuted: { action: 'commandExecuted' }
  },
} satisfies Meta<typeof Terminal>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  args: {
    config: defaultConfig,
  }
};

// Released version
export const Released: Story = {
  args: {
    config: {
      ...defaultConfig,
      RELEASE_DATE: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    },
  }
};

// Define proper types for the component props
interface TerminalProps {
  config: {
    RELEASE_DATE: Date;
    CONTRACT_ADDRESS: string;
    DISPLAY: {
      DATE_SHORT: string;
      DATE_FULL: string;
      TIME: string;
    };
  };
  onCommandExecuted?: (command: string, response: string) => void;
}

// Countdown-to-Reveal Story Component
// This is a wrapper component that will allow us to demonstrate the countdown sequence
const CountdownToRevealComponent = ({ config, onCommandExecuted }: TerminalProps) => {
  // State to track remaining seconds and control UI
  const [remainingSeconds, setRemainingSeconds] = useState(10);
  const [shouldReset, setShouldReset] = useState(false);
  const [hasRevealed, setHasRevealed] = useState(false);
  
  // State to track the current config with dynamic RELEASE_DATE
  const [currentConfig, setCurrentConfig] = useState({
    ...config,
    RELEASE_DATE: new Date(Date.now() + 10000), // Start 10 seconds from now
  });

  // Function to reset the countdown
  const resetCountdown = () => {
    // Start a new 10-second countdown
    setCurrentConfig({
      ...config,
      RELEASE_DATE: new Date(Date.now() + 10000),
    });
    setRemainingSeconds(10);
    setHasRevealed(false);
    setShouldReset(false);
  };

  // When mounted, set an effect to monitor time and update after countdown completes
  useEffect(() => {
    // Notify when we're watching the sequence
    console.log('Countdown sequence starting: 10 seconds until reveal');
    console.log('Current time:', new Date().toISOString());
    console.log('Target reveal time:', currentConfig.RELEASE_DATE.toISOString());
    
    // Check every 100ms if we've passed the release date
    const intervalId = setInterval(() => {
      const now = new Date();
      const timeRemaining = currentConfig.RELEASE_DATE.getTime() - now.getTime();
      
      if (timeRemaining > 0) {
        const seconds = Math.ceil(timeRemaining / 1000);
        setRemainingSeconds(seconds);
      } else {
        // We've hit zero, stop the interval
        setRemainingSeconds(0);
        setHasRevealed(true);
        
        // After 5 seconds of showing the revealed state, offer to reset
        if (!shouldReset) {
          setTimeout(() => {
            setShouldReset(true);
          }, 5000);
        }
      }
    }, 100);

    // Clean up interval
    return () => clearInterval(intervalId);
  }, [currentConfig, config, shouldReset]);

  // Auto-reset handler
  useEffect(() => {
    if (shouldReset) {
      const autoResetTimeout = setTimeout(() => {
        resetCountdown();
      }, 10000); // Auto-reset after 10 seconds

      return () => clearTimeout(autoResetTimeout);
    }
  }, [shouldReset, config]);

  return (
    <div className="flex flex-col items-center">
      {/* Storybook controls for the countdown sequence */}
      <div className="fixed top-4 right-4 z-50 bg-gray-800 text-white p-4 rounded-lg shadow-lg border-2 border-purple-500 max-w-xs">
        <div className="mb-2 font-bold text-center border-b border-purple-400 pb-2">
          Terminal Countdown Demo
        </div>
        
        <div className="flex justify-between mb-4">
          <div>
            <span className="text-gray-300 text-sm">Status:</span>
            <span className={`ml-2 font-mono ${hasRevealed ? 'text-green-400' : 'text-yellow-400'}`}>
              {hasRevealed ? 'REVEALED' : 'COUNTING DOWN'}
            </span>
          </div>
          
          <div className="font-mono text-lg">
            {!hasRevealed && (
              <span className={`${remainingSeconds <= 3 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                {remainingSeconds}s
              </span>
            )}
            {hasRevealed && <span className="text-green-400">0s</span>}
          </div>
        </div>
        
        {shouldReset && (
          <button
            onClick={resetCountdown}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded transition-colors"
          >
            Restart Countdown
          </button>
        )}
        
        <div className="text-xs text-gray-400 mt-3 text-center italic">
          Watching contract reveal sequence
        </div>
      </div>
      
      {/* The actual Terminal component */}
      <Terminal config={currentConfig} onCommandExecuted={onCommandExecuted} />
    </div>
  );
};

// Countdown-to-Reveal story
export const CountdownToReveal: Story = {
  args: {
    config: {
      ...defaultConfig,
      CONTRACT_ADDRESS: '0xDeC0dE887766De1e96b3A3e5031F5AD34603325C', // More realistic contract address
    },
  },
  // Use the render function to use our custom wrapper component
  render: (args) => <CountdownToRevealComponent {...args} />,
};
