import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
// Import from the correct Terminal export file with createConfig
// This is the production-ready approach used throughout the codebase
import { Terminal, createConfig, Config } from '../components/terminal/index';

// Create a default configuration for the Terminal using the provided utility function
// This ensures type compatibility and proper defaults
const defaultConfig = createConfig({
  RELEASE_DATE: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  CONTRACT_ADDRESS: '0x1111111111111111111111111111111111111111', // Default from config
  DISPLAY: {
    DATE_SHORT: 'Apr 1, 2025',
    DATE_FULL: 'April 1, 2025',
    TIME: '15:00:00',
  }
});

// Define metadata for the component with enhanced documentation
const meta: Meta<typeof Terminal> = {
  title: 'Components/Terminal',
  component: Terminal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Terminal Component
A sophisticated terminal interface with countdown timer, multiple animation styles, and different urgency levels.

## Key Features
- Smooth typing animations or bouncy reveals when countdown completes
- Four urgency levels with distinct visual styles (normal, warning, critical, complete)
- Configurable countdown durations
- Command input capabilities with AI-powered responses

## Usage
\`\`\`tsx
import { Terminal, createConfig } from '../components/terminal';

const config = createConfig({
  RELEASE_DATE: new Date('2025-04-01T15:00:00'),
  CONTRACT_ADDRESS: '0x1111111111111111111111111111111111111111',
  DISPLAY: {
    DATE_SHORT: 'Apr 1, 2025',
    DATE_FULL: 'April 1, 2025',
    TIME: '15:00:00',
  }
});

const MyTerminal = () => (
  <Terminal config={config} onCommandExecuted={(cmd, response) => console.log(cmd, response)} />
);
\`\`\`
        `
      }
    },
  },
  tags: ['autodocs'],
  argTypes: {
    config: { 
      control: 'object',
      description: 'Terminal configuration including release date and contract address'
    },
    onCommandExecuted: { 
      action: 'commandExecuted',
      description: 'Callback fired when a command is executed in the terminal'
    }
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story - Terminal with countdown in progress
export const Default: Story = {
  args: {
    config: defaultConfig,
  },
  parameters: {
    docs: {
      description: {
        story: 'Terminal in countdown mode, showing time remaining until contract reveal.'
      }
    }
  }
};

// Released version - Displays the revealed contract address
export const Released: Story = {
  args: {
    config: createConfig({
      RELEASE_DATE: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Terminal with countdown complete and contract address revealed. Shows the post-countdown state with ACCESS GRANTED message.'
      }
    }
  }
};

// Define proper types for the component props using the actual Config type
interface TerminalProps {
  config: Config;
  onCommandExecuted?: (command: string, response: string) => void;
}

// Countdown-to-Reveal Story Component
// This is a wrapper component that will allow us to demonstrate the countdown sequence
const CountdownToRevealComponent = ({ config, onCommandExecuted }: TerminalProps) => {
  // State to track remaining seconds and control UI
  const [remainingSeconds, setRemainingSeconds] = useState(10);
  const [shouldReset, setShouldReset] = useState(false);
  const [hasRevealed, setHasRevealed] = useState(false);
  const [useSmoothRelease, setUseSmoothRelease] = useState(false);
  const [countdownDuration, setCountdownDuration] = useState(10);
  
  // State to track the current config with dynamic RELEASE_DATE
  const [currentConfig, setCurrentConfig] = useState(createConfig({
    ...config,
    RELEASE_DATE: new Date(Date.now() + 10000), // Start 10 seconds from now
  }));

  // Function to reset the countdown
  const resetCountdown = () => {
    // Start a new countdown with the selected duration
    setCurrentConfig(createConfig({
      ...config,
      RELEASE_DATE: new Date(Date.now() + countdownDuration * 1000),
    }));
    setRemainingSeconds(countdownDuration);
    setHasRevealed(false);
    setShouldReset(false);
    
    // Also store the smooth release preference in localStorage for the terminal component to read
    if (typeof window !== 'undefined') {
      localStorage.setItem('useTerminalSmoothRelease', useSmoothRelease ? 'true' : 'false');
    }
  };

  // When mounted, set an effect to monitor time and update after countdown completes
  useEffect(() => {
    // Initialize the smooth release preference from localStorage
    if (typeof window !== 'undefined') {
      const storedPreference = localStorage.getItem('useTerminalSmoothRelease') === 'true';
      setUseSmoothRelease(storedPreference);
    }
    
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
        
        {/* Animation style selector */}
        <div className="mb-4">
          <label className="text-gray-300 text-sm block mb-2">Reveal Animation:</label>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="smoothRevealToggle"
              checked={useSmoothRelease}
              onChange={() => setUseSmoothRelease(!useSmoothRelease)}
              className="mr-2 h-4 w-4 accent-purple-500"
            />
            <label htmlFor="smoothRevealToggle" className="text-sm">
              {useSmoothRelease ? 'Smooth Typing Animation' : 'Bouncy Animation'}
            </label>
          </div>
        </div>
        
        {/* Countdown duration control */}
        <div className="mb-4">
          <label className="text-gray-300 text-sm block mb-2">Countdown Duration:</label>
          <div className="flex items-center">
            <input
              type="range"
              value={countdownDuration}
              onChange={(e) => setCountdownDuration(parseInt(e.target.value))}
              min="5"
              max="20"
              step="1"
              className="w-full accent-purple-500"
            />
            <span className="ml-2 text-sm w-8 text-center">{countdownDuration}s</span>
          </div>
        </div>
        
        {/* Reset button */}
        <button
          onClick={resetCountdown}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded transition-colors"
        >
          {shouldReset ? 'Restart Countdown' : 'Reset Timer'}
        </button>
        
        <div className="text-xs text-gray-400 mt-3 text-center italic">
          {hasRevealed ? 'Contract revealed!' : 'Watching contract reveal sequence'}
        </div>
      </div>
      
      {/* The actual Terminal component */}
      <Terminal config={currentConfig} onCommandExecuted={onCommandExecuted} />
    </div>
  );
};

// Interactive Countdown-to-Reveal story with configurable animation style and duration
export const CountdownToReveal: Story = {
  args: {
    config: defaultConfig,
  },
  // Use the render function to use our custom wrapper component
  render: (args) => {
    // Ensure args contains the required 'config' property
    const safeArgs = { 
      ...args,
      config: args.config || defaultConfig
    };
    return <CountdownToRevealComponent {...safeArgs} />;
  },
  parameters: {
    docs: {
      description: {
        story: `
### Interactive Countdown Demo
- **Animation Toggle**: Switch between smooth typing animation and bouncy animation styles
- **Duration Control**: Adjust the countdown duration from 5-20 seconds
- **Auto-Reset**: After reveal, the countdown will offer to reset after 5 seconds
- **Visual States**: Experience the full countdown sequence in an accelerated timeframe
`
      }
    }
  }
};

// Component to demonstrate all urgency levels
const UrgencyLevelsComponent = ({ config, onCommandExecuted }: TerminalProps) => {
  // State for selecting urgency level
  const [selectedUrgencyLevel, setSelectedUrgencyLevel] = useState(0);
  
  // Create custom configs for each urgency level using the production-ready createConfig function
  const urgencyConfigs = [
    // Level 0: Normal (>60s)
    createConfig({
      ...config,
      RELEASE_DATE: new Date(Date.now() + 120 * 1000), // 2 minutes from now
    }),
    // Level 1: Warning (<60s)
    createConfig({
      ...config,
      RELEASE_DATE: new Date(Date.now() + 45 * 1000), // 45 seconds from now
    }),
    // Level 2: Critical (<10s)
    createConfig({
      ...config,
      RELEASE_DATE: new Date(Date.now() + 8 * 1000), // 8 seconds from now
    }),
    // Level 3: Complete (0s)
    createConfig({
      ...config,
      RELEASE_DATE: new Date(Date.now() - 1000), // 1 second ago
    })
  ];
  
  return (
    <div className="flex flex-col items-center">
      {/* Controls panel */}
      <div className="fixed top-4 right-4 z-50 bg-gray-800 text-white p-4 rounded-lg shadow-lg border-2 border-purple-500 max-w-xs">
        <div className="mb-2 font-bold text-center border-b border-purple-400 pb-2">
          Countdown Urgency Levels
        </div>
        
        <div className="mb-4">
          <label className="text-gray-300 text-sm block mb-2">Select Urgency Level:</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSelectedUrgencyLevel(0)}
              className={`py-1 px-2 rounded transition-colors text-sm ${selectedUrgencyLevel === 0 ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              0: Normal
            </button>
            <button
              onClick={() => setSelectedUrgencyLevel(1)}
              className={`py-1 px-2 rounded transition-colors text-sm ${selectedUrgencyLevel === 1 ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              1: Warning (&lt;60s)
            </button>
            <button
              onClick={() => setSelectedUrgencyLevel(2)}
              className={`py-1 px-2 rounded transition-colors text-sm ${selectedUrgencyLevel === 2 ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              2: Critical (&lt;10s)
            </button>
            <button
              onClick={() => setSelectedUrgencyLevel(3)}
              className={`py-1 px-2 rounded transition-colors text-sm ${selectedUrgencyLevel === 3 ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              3: Complete (0s)
            </button>
          </div>
        </div>
        
        <div className="text-xs text-gray-400 mt-3 text-center italic">
          Demonstrates different countdown visual states
        </div>
      </div>
      
      {/* Terminal with selected urgency level */}
      <Terminal config={urgencyConfigs[selectedUrgencyLevel]} onCommandExecuted={onCommandExecuted} />
    </div>
  );
};

// Interactive Urgency Levels demonstration showing all possible visual states
export const UrgencyLevels: Story = {
  args: {
    config: defaultConfig,
  },
  render: (args) => {
    // Ensure args contains the required 'config' property
    const safeArgs = { 
      ...args,
      config: args.config || defaultConfig
    };
    return <UrgencyLevelsComponent {...safeArgs} />;
  },
  parameters: {
    docs: {
      description: {
        story: `
### Urgency Level Visualization
Demonstrates all four visual states of the countdown timer:

1. **Normal** (>60s): Standard styling with purple/mauve accents
2. **Warning** (<60s): Yellow-tinged styling for approaching deadline 
3. **Critical** (<10s): Red-tinged styling with faster animations for imminent completion
4. **Complete** (0s): Green success styling with contract revealed

Use the buttons to toggle between states without waiting for the actual countdown to progress.
`
      }
    }
  }
};