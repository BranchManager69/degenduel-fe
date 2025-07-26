/**
 * Terminal Types
 * 
 * @fileoverview
 * This file contains types used by the terminal components
 * 
 * @description
 * Centralized type definitions for the terminal system
 * 
 * @author Branch Manager
 */

import { AIMessage } from "../../services/ai"; // Import AIMessage

// Size option for the Terminal component
export type TerminalSize = 'contracted' | 'middle' | 'large' | 'flexible';

// Layout mode options for the Terminal component
export type TerminalLayoutMode = 'bottom-fixed' | 'sidebar' | 'floating' | 'inline' | 'modal';

// NEW: Terminal operation modes
export type TerminalMode = 'ai' | 'chat-room' | 'admin-chat' | 'debug';

// NEW: Chat room configuration
export interface ChatRoomConfig {
  roomId: string;
  roomName?: string;
  roomType?: 'contest' | 'general' | 'private' | 'trading';
  maxParticipants?: number;
}

// Position options for different layout modes
export interface TerminalPosition {
  side?: 'left' | 'right';
  x?: number;
  y?: number;
}

// For the Terminal component props
export interface TerminalProps {
  config: {
    RELEASE_DATE: Date;
    CONTRACT_ADDRESS: string;
    DISPLAY: {
      DATE_SHORT: string;
      DATE_FULL: string;
      TIME: string;
    }
  };
  onCommandExecuted?: (command: string, response: string) => void;
  size?: TerminalSize; // Size prop for controlling terminal dimensions
  isInitiallyMinimized?: boolean;
  onStateChange?: (state: { minimized: boolean; size: TerminalSize }) => void;
  onCommand?: (command: string) => void;
  // NEW: Alter ego props
  mode?: TerminalMode;
  onModeChange?: (mode: TerminalMode) => void;
}

// Define a union type for console output items - can be string or JSX
export type ConsoleOutputItem = string | React.ReactNode;

// Props for the DecryptionTimer component
export interface DecryptionTimerProps {
  targetDate?: Date;
  contractAddress?: string;
}

// Props for the TimeUnit component
export interface TimeUnitProps {
  value: number;
  label: string;
  urgencyLevel?: number;
}

// Props for the ContractDisplay component
export interface ContractDisplayProps {
  isRevealed: boolean;
  contractAddress?: string;
}

// Props for the TerminalConsole component
export interface TerminalConsoleProps {
  messages: AIMessage[];
  size: TerminalSize;
}

// Props for the TerminalInput component
export interface TerminalInputProps {
  userInput: string;
  setUserInput: (input: string) => void;
  onEnter: (command: string) => void;
  glitchActive?: boolean;
  size?: TerminalSize;
  mode?: TerminalMode;
}

// Props for the CommandTray component
export interface CommandTrayProps {
  commands: string[];
  setUserInput: (input: string) => void;
  onExecuteCommand?: (command: string) => void;
  easterEggActivated?: boolean;
}