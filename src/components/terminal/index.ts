// src/components/terminal/index.ts

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
 * @author BranchManager69
 * @version 2.0.0
 * @created 2025-04-14
 * @updated 2025-05-07
 */

// Config
import { config } from '../../config/config';
const CONTRACT_ADDRESS_REAL = config.CONTRACT_ADDRESS.REAL;
const CONTRACT_ADDRESS_FAKE = config.CONTRACT_ADDRESS.FAKE;
const RELEASE_DATE_TOKEN_LAUNCH_DATETIME = config.RELEASE_DATE.TOKEN_LAUNCH_DATETIME;
const RELEASE_DATE_DISPLAY_LAUNCH_DATE_SHORT = config.RELEASE_DATE.DISPLAY.LAUNCH_DATE_SHORT;
const RELEASE_DATE_DISPLAY_LAUNCH_DATE_FULL = config.RELEASE_DATE.DISPLAY.LAUNCH_DATE_FULL;
const RELEASE_DATE_DISPLAY_LAUNCH_TIME = config.RELEASE_DATE.DISPLAY.LAUNCH_TIME;

// Main Terminal component
export { Terminal } from './Terminal';
export type { TerminalProps, TerminalSize } from './types';

// Timer components
////export { DecryptionTimer } from '../layout/DecryptionTimer';
////export { MiniDecryptionTimer } from '../layout/DecryptionTimerMini';
////export { TimeUnit } from './components/TimeUnit';

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
  RELEASE_DATE: RELEASE_DATE_TOKEN_LAUNCH_DATETIME,
  CONTRACT_ADDRESS: CONTRACT_ADDRESS_REAL || CONTRACT_ADDRESS_FAKE || '0x0000000000000000000000000000000000000069',
  DISPLAY: {
    DATE_SHORT: RELEASE_DATE_DISPLAY_LAUNCH_DATE_SHORT,
    DATE_FULL: RELEASE_DATE_DISPLAY_LAUNCH_DATE_FULL,
    TIME: RELEASE_DATE_DISPLAY_LAUNCH_TIME,
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