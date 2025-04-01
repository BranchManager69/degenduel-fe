// Import the Terminal component first
import { Terminal, DecryptionTimer } from './Terminal';

// Then export
export { Terminal, DecryptionTimer };

// Define Config interface
export interface Config {
  RELEASE_DATE: Date;
  CONTRACT_ADDRESS: string;
  DISPLAY: {
    DATE_SHORT: string;
    DATE_FULL: string;
    TIME: string;
  };
}

// Create default configuration
export const DEFAULT_CONFIG: Config = {
  RELEASE_DATE: new Date('2025-04-01T15:00:00Z'),
  CONTRACT_ADDRESS: '0x1111111111111111111111111111111111111111',
  DISPLAY: {
    DATE_SHORT: 'Apr 1, 2025',
    DATE_FULL: 'April 1, 2025',
    TIME: '15:00:00',
  }
};

// Helper function to get environment variables with fallbacks
export function getEnvVar(name: string, defaultValue = ''): string {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[name] || defaultValue;
  }
  return defaultValue;
}

// Function to create a configuration with overrides
export function createConfig(overrides: Partial<Config> = {}): Config {
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    DISPLAY: {
      ...DEFAULT_CONFIG.DISPLAY,
      ...(overrides.DISPLAY || {}),
    }
  };
}

// Also export Terminal as default
export default Terminal;