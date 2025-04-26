/**
 * Terminal Component Exports
 * 
 * @fileoverview
 * This file exports all terminal-related components
 * 
 * @description
 * The terminal components are organized into modular components
 * for better maintainability and reusability.
 * 
 * @author Branch Manager
 */

// Main Terminal component
export { Terminal } from './Terminal';
export type { TerminalProps, TerminalSize } from './types';

// Timer components
export { DecryptionTimer } from './components/DecryptionTimer';
export { TimeUnit } from './components/TimeUnit';

// Console components
export { CommandTray } from './components/CommandTray';
export { TerminalConsole } from './components/TerminalConsole';
export { TerminalInput } from './components/TerminalInput';

// Helper components
export { ContractDisplay } from './components/ContractDisplay';

// Commands
export { commandMap } from './commands';

// Configuration
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
  RELEASE_DATE: new Date(import.meta.env.VITE_RELEASE_DATE_TOKEN_LAUNCH_DATETIME || '2025-12-31T23:59:59-05:00'),
  CONTRACT_ADDRESS: '0x1111111111111111111111111111111111111111',
  DISPLAY: {
    DATE_SHORT: import.meta.env.VITE_RELEASE_DATE_DISPLAY_LAUNCH_DATE_SHORT || 'Dec 31, 2025',
    DATE_FULL: import.meta.env.VITE_RELEASE_DATE_DISPLAY_LAUNCH_DATE_FULL || 'December 31, 2025',
    TIME: import.meta.env.VITE_RELEASE_DATE_DISPLAY_LAUNCH_TIME || '23:59:59',
  }
};

// Helper function to get environment variables with fallbacks
export function getEnvVar(name: string, defaultValue = ''): string {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore - Dynamically access the property
    return import.meta.env[name] || defaultValue;
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

// Types
export * from './types';

// Also export Terminal as default
//export default Terminal; // (now done at the top)