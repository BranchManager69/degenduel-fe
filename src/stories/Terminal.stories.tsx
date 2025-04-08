import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { motion } from 'framer-motion';
// Import from the correct Terminal export file with createConfig and DecryptionTimer
import { Terminal, DecryptionTimer, createConfig, Config } from '../components/terminal/index';
/**
 * @fileoverview
 * Storybook stories for the Terminal component
 * 
 * @description
 * Showcases the Terminal component with various configurations:
 * - Standard countdown
 * - Released state with contract address revealed
 * - Interactive countdown with configurable duration
 * - Different urgency levels (normal, warning, critical, complete)
 * - Multiple size options for the terminal
 * - Standalone countdown timer for use outside the terminal
 * 
 * @author Branch Manager
 */

// Create a default configuration for the Terminal using the provided utility function
// This ensures type compatibility and proper defaults
const defaultConfig = createConfig({
  RELEASE_DATE: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  CONTRACT_ADDRESS: '0x1111111111111111111111111111111111111111', // Default from config
  DISPLAY: {
    DATE_SHORT: import.meta.env.VITE_RELEASE_DATE_DISPLAY_LAUNCH_DATE_SHORT || 'Dec 31, 2025',
    DATE_FULL: import.meta.env.VITE_RELEASE_DATE_DISPLAY_LAUNCH_DATE_FULL || 'December 31, 2025',
    TIME: import.meta.env.VITE_RELEASE_DATE_DISPLAY_LAUNCH_TIME || '23:59:59',
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
- Countdown timer with visual time segments (days, hours, minutes, seconds)
- Smooth typing animations or bouncy reveals when countdown completes
- Four urgency levels with distinct visual styles (normal, warning, critical, complete)
- Configurable countdown durations and animation preferences
- Command input capabilities with AI-powered responses
- CONTRACT_ADDRESS injection with animated reveal sequence

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

## DecryptionTimer Component
The Terminal exports a standalone \`DecryptionTimer\` component that can be used separately:

\`\`\`tsx
import { DecryptionTimer } from '../components/terminal';

const MyCountdown = () => (
  <DecryptionTimer 
    targetDate={new Date('2025-04-01T15:00:00')} 
    contractAddress="0x1111111111111111111111111111111111111111"
  />
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
    size: 'middle',
  },
  parameters: {
    docs: {
      description: {
        story: 'Terminal in countdown mode, showing time remaining until contract reveal. Features edge-to-edge layout, animated time elements, and pulsing separators. Click the resize button (↔️) in the terminal header to cycle through different size options.'
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
        story: 'Terminal with countdown complete and contract address revealed. Shows the post-countdown state with ACCESS GRANTED message and animated contract address reveal.'
      }
    }
  }
};

// Define proper types for the component props using the actual Config type
interface TerminalProps {
  config: Config;
  onCommandExecuted?: (command: string, response: string) => void;
}

// Standalone DecryptionTimer story for the countdown component
export const StandaloneCountdown: Story = {
  render: () => {
    // We're using the component directly here to show it can be used standalone
    return (
      <div className="p-8 bg-gray-900 rounded-lg">
        <h3 className="text-xl text-white mb-4 font-bold">Standalone Countdown Timer</h3>
        <DecryptionTimer 
          targetDate={new Date(Date.now() + 24 * 60 * 60 * 1000)} 
          contractAddress="0x1111111111111111111111111111111111111111" 
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'The DecryptionTimer component can be used independently from the full Terminal. This is useful for creating standalone countdown timers for launches, events, or other time-based scenarios.'
      }
    }
  }
};

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
- **Smooth Release Animation**: When checked, shows a more elaborate typing animation sequence
- **Standard Animation**: When unchecked, shows a bouncy, simpler animation
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

// Story for standalone CountdownTimer that allows easy configuration
export const StandaloneCountdownConfigurable: Story = {
  render: () => {
    const [targetDate, setTargetDate] = useState<Date>(new Date(Date.now() + 2 * 60 * 60 * 1000)); // Default 2 hours from now
    const [dateString, setDateString] = useState<string>(() => {
      const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
      return d.toISOString().slice(0, 16); // Format for datetime-local input
    });
    
    // Update target date when input changes
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setDateString(e.target.value);
      setTargetDate(new Date(e.target.value));
    };
    
    return (
      <div className="p-8 bg-gray-900 rounded-lg max-w-lg">
        <h3 className="text-xl text-white mb-4 font-bold">Configurable Countdown Timer</h3>
        
        <div className="mb-6 bg-gray-800 p-4 rounded-lg">
          <label className="block text-white text-sm mb-2">Target Date & Time:</label>
          <input 
            type="datetime-local"
            value={dateString}
            onChange={handleDateChange}
            className="w-full bg-gray-700 text-white p-2 rounded border border-purple-500 focus:border-purple-400"
          />
          <div className="mt-2 text-xs text-gray-400">
            Currently set to: {targetDate.toLocaleString()}
          </div>
        </div>
        
        <div className="border-2 border-purple-500/30 rounded-lg p-4 bg-gray-850">
          <DecryptionTimer 
            targetDate={targetDate}
            contractAddress="0xD3G3NDu3L69420C0nTr4c7"
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
### Configurable Standalone Countdown
This example demonstrates how to use the DecryptionTimer component with a configurable target date:

- Use the datetime picker to set a custom target date and time
- The countdown updates in real-time as you change the target
- This component can be used independently in any part of your application
- Perfect for embedded timers on landing pages or promotional materials
`
      }
    }
  }
};

// Story showcasing the Separated Layout with Countdown outside Terminal
// Story showcasing all three size options
export const SizeOptions: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-8">
        <div>
          <h3 className="text-xl text-white mb-2 font-bold">Contracted Size</h3>
          <Terminal config={defaultConfig} size="contracted" />
        </div>
        <div>
          <h3 className="text-xl text-white mb-2 font-bold">Middle Size (Default)</h3>
          <Terminal config={defaultConfig} size="middle" />
        </div>
        <div>
          <h3 className="text-xl text-white mb-2 font-bold">Large Size</h3>
          <Terminal config={defaultConfig} size="large" />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
### Terminal Size Options

This demonstrates the three different size options for the terminal:

- **Contracted**: Compact view for smaller screens or minimal UI footprint
- **Middle**: Default balanced size for most use cases
- **Large**: Expanded view with more space for console output

The terminal includes a resize button (in the header) that allows users to cycle through these options.
`
      }
    }
  }
};

export const SeparatedLayout: Story = {
  render: () => {
    const [targetDate] = useState<Date>(new Date(Date.now() + 3 * 60 * 1000)); // 3 min from now
    const [consoleOutput, setConsoleOutput] = useState<string[]>([
      "Welcome to DegenDuel Terminal. Type 'help' for available commands."
    ]);
    // Add state for command tray visibility and user input
    const [showCommands, setShowCommands] = useState(false);
    const [userInput, setUserInput] = useState('');
    
    // Command responses for the demo
    const commandResponses: Record<string, string> = {
      help: "Available commands: help, status, info, contract, stats, clear",
      status: "Platform status: Ready for launch on scheduled date.",
      info: "DegenDuel: Next-generation competitive crypto trading platform.",
      contract: "Contract address will be revealed at launch.",
      stats: "Current users: 0\nUpcoming contests: 3\nTotal prize pool: $50,000",
      clear: ""
    };
    
    // Function to execute a command in the terminal demo
    const executeCommand = (command: string) => {
      // Add the command to the console output
      setConsoleOutput(prev => [...prev, `$ ${command}`]);
      
      // For the clear command, clear the console
      if (command.toLowerCase() === 'clear') {
        setConsoleOutput([]);
        return;
      }
      
      // Add the response
      const response = commandResponses[command.toLowerCase()] || "Command not recognized. Type 'help' for available commands.";
      setConsoleOutput(prev => [...prev, response]);
    };


    return (
      <div className="flex flex-col gap-6 p-8 bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg max-w-4xl mx-auto" 
        style={{ 
          backgroundImage: "radial-gradient(circle at 50% 50%, rgba(120, 80, 200, 0.07) 0%, rgba(0, 0, 0, 0) 70%)",
          boxShadow: "0 0 40px rgba(0, 0, 0, 0.6)"
        }}>
        {/* Header section with project info */}
        <div className="flex justify-between items-center">
          <div className="text-white/90 font-bold tracking-wide">
            <span className="text-lg text-purple-400">DEGEN</span>
            <span className="text-lg text-white">DUEL</span>
            <span className="text-sm text-gray-400 ml-2">PLATFORM INTERFACE</span>
          </div>
          <div className="text-xs text-gray-500 font-mono">
            Environment: Development • Version: 6.9.0
          </div>
        </div>
        
        {/* Countdown timer directly on background */}
        <div className="mb-8 mt-2">
          <div className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-3 text-center">
            Platform Launch Countdown
          </div>
          
          <DecryptionTimer 
            targetDate={targetDate}
            contractAddress="0xD3G3NDu3L69420C0nTr4c7"
          />
        </div>
        
        {/* Terminal component (slimmer without countdown) */}
        <div className="relative w-full bg-gray-800/90 border border-purple-500/30 rounded-md overflow-hidden" 
          style={{ 
            minHeight: "350px",
            boxShadow: "0 0 15px rgba(157, 78, 221, 0.15)"
          }}
        >
          {/* Terminal Header */}
          <div className="flex justify-between items-center px-4 py-2 bg-black/20 border-b border-purple-500/20">
            <div className="text-xs font-bold">
              <span className="text-purple-400">DEGEN</span>
              <span className="text-white">TERMINAL</span>
              <span className="text-purple-300/60 mx-2">v6.9</span>
            </div>
            <div className="flex space-x-2">
              <button 
                type="button"
                onClick={() => setShowCommands(!showCommands)}
                className="px-1 py-0.5 text-xs text-purple-300/70 hover:text-white border border-purple-500/30 hover:border-purple-500/50 rounded bg-purple-900/20 hover:bg-purple-900/40 transition-colors"
              >
                {showCommands ? 'Hide Commands' : 'Show Commands'}
              </button>
              
              <button
                type="button"
                className="text-xs text-purple-400/50 hover:text-purple-400 transition-colors"
              >
                _
              </button>
            </div>
          </div>
          
          {/* Command Tray */}
          {showCommands && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-black/40 rounded p-2 mx-4 mt-2 mb-3 text-xs border border-purple-500/20"
            >
              <div className="text-purple-300/70 mb-1 font-bold">Available Commands:</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1">
                <div 
                  className="text-purple-300/90 hover:text-white cursor-pointer transition-colors"
                  onClick={() => executeCommand('help')}
                >
                  $ help
                </div>
                <div 
                  className="text-purple-300/90 hover:text-white cursor-pointer transition-colors"
                  onClick={() => executeCommand('status')}
                >
                  $ status
                </div>
                <div 
                  className="text-purple-300/90 hover:text-white cursor-pointer transition-colors"
                  onClick={() => executeCommand('info')}
                >
                  $ info
                </div>
                <div 
                  className="text-purple-300/90 hover:text-white cursor-pointer transition-colors"
                  onClick={() => executeCommand('contract')}
                >
                  $ contract
                </div>
                <div 
                  className="text-purple-300/90 hover:text-white cursor-pointer transition-colors"
                  onClick={() => executeCommand('stats')}
                >
                  $ stats
                </div>
                <div 
                  className="text-purple-300/90 hover:text-white cursor-pointer transition-colors"
                  onClick={() => executeCommand('clear')}
                >
                  $ clear
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Console output area */}
          <div className="p-4 h-72 overflow-y-auto font-mono text-sm text-gray-300" style={{ scrollbarWidth: 'thin' }}>
            {consoleOutput.map((line, index) => (
              <div key={index} className="mb-1 whitespace-pre-wrap">{line}</div>
            ))}
          </div>
          
          {/* Input area */}
          <div className="flex items-center border-t border-purple-500/20 px-4 py-2">
            <span className="text-purple-400 mr-2">$</span>
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && userInput.trim()) {
                  executeCommand(userInput.trim());
                  setUserInput('');  
                }
              }}
              placeholder="Enter command or ask a question..."
              className="w-full bg-transparent outline-none border-none text-white placeholder-purple-300/30 focus:ring-0"
            />
          </div>
        </div>
        
        {/* Status message below terminal - directly on background */}
        <div className="w-full flex justify-center items-center mt-3">
          <div className="text-xs text-purple-300/70 font-mono flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-purple-400 animate-pulse"></div>
            <div>System Status: Awaiting countdown completion...</div>
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
### Separated Layout Design
This demonstrates an improved layout with the countdown timer floating freely on the background:

- Countdown timer positioned directly on the main background for maximum impact
- No container around the countdown, letting it breathe visually on the page
- Status indicator as a subtle footer below the terminal
- Terminal focuses exclusively on input/output functionality
- Clean visual hierarchy with each element in its natural place
- More vertical space available in the terminal for user interaction
- Consistent subtle animations without disruptive bouncing effects
`
      }
    }
  }
};