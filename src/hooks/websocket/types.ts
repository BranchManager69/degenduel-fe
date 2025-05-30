// src/hooks/websocket/types.ts

/**
 * ✨ UNIFIED WEBSOCKET SYSTEM ✨
 * This file uses DegenDuel shared types from the degenduel-shared package.
 * These types are the official standard for frontend-backend communication.
 * 
 * Common Types for WebSocket System v69
 * 
 * This file contains standardized interfaces and types used across the WebSocket system.
 * All endpoints and types have been verified against backend API documentation.
 * Last updated: April 25, 2025
 * 
 * IMPORTANT NOTE: This file is actively being updated as part of the v69 WebSocket system rollout.
 * Some topic types might be missing or in flux as new features are implemented.
 * If you notice missing topic types, please coordinate with the team before making changes.
 * The SOCKET_TYPES constant below should be used as the source of truth for available topics.
 */

// Import the base types from the degenduel-shared package
import { DDWebSocketMessageType } from '@branchmanager69/degenduel-shared';

/**
 * Extended MessageType enum that includes frontend-specific types.
 * 
 * This extends the standard DDWebSocketMessageType with additional types 
 * needed for the frontend but not yet added to the shared package.
 * 
 * NOTE: This should be temporary until the shared package is updated.
 */
export enum DDExtendedMessageType {
  // Forward all the standard types from DDWebSocketMessageType
  SUBSCRIBE = DDWebSocketMessageType.SUBSCRIBE,
  UNSUBSCRIBE = DDWebSocketMessageType.UNSUBSCRIBE,
  REQUEST = DDWebSocketMessageType.REQUEST,
  COMMAND = DDWebSocketMessageType.COMMAND,
  DATA = DDWebSocketMessageType.DATA,
  ERROR = DDWebSocketMessageType.ERROR,
  SYSTEM = DDWebSocketMessageType.SYSTEM,
  ACKNOWLEDGMENT = DDWebSocketMessageType.ACKNOWLEDGMENT,
  
  // Add additional types used in the frontend
  LOGS = 'LOGS',
  PING = 'PING',
  PONG = 'PONG',
  AUTH = 'AUTH',
  AUTH_SUCCESS = 'AUTH_SUCCESS'
}

/**
 * WebSocket Message Type Utilities
 * 
 * These utilities help ensure type safety while maintaining compatibility
 * with both string literals and enum values throughout the codebase.
 */

// Type guard to check if a value is a valid message type
export function isValidMessageType(value: any): value is DDExtendedMessageType {
  return Object.values(DDExtendedMessageType).includes(value);
}

// Create a type-safe message with proper enum values
export function createMessage<T extends Record<string, any>>(
  type: DDExtendedMessageType, 
  payload: T
): { type: DDExtendedMessageType } & T {
  return { type, ...payload };
}

// WebSocket message interface for typing
export interface WebSocketMessage {
  type: DDExtendedMessageType;
  [key: string]: any;
}

// Safe comparison function for message types
export function isMessageType(
  message: string | DDExtendedMessageType | WebSocketMessage | { type: DDExtendedMessageType }, 
  expectedType: DDExtendedMessageType
): boolean {
  if (typeof message === 'object' && message !== null && 'type' in message) {
    return message.type === expectedType;
  }
  return message === expectedType;
}

// Utility function to convert DDExtendedMessageType to string for scenarios where a string is required
export function messageTypeToString(type: DDExtendedMessageType): string {
  return type.toString();
}

// DEPRECATED: The MessageType enum has been replaced by DDExtendedMessageType.
// All references should use MessageType from the index export, which points to DDExtendedMessageType.
// This comment is left here to explain the transition for developers encountering old code.
  
// Standardized WebSocket connection status types
export type WebSocketStatus = 'connecting' | 'online' | 'offline' | 'error' | 'reconnecting';

// WebSocket connection states for the unified system
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  AUTHENTICATING = 'authenticating',
  AUTHENTICATED = 'authenticated',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

// Base message interface for all WebSocket messages
export interface WebSocketMessage {
  type: DDExtendedMessageType; // Use enum type directly for proper type safety
  timestamp?: string;
  data?: any;
  error?: string;
  message?: string;
  code?: number;
  topic?: string;
  action?: string;
  authToken?: string;
  topics?: string[];
  initialData?: boolean;
  requestId?: string;
  direction?: 'in' | 'out';
  id?: string; // For message tracking
}

// Standardized error message structure
export interface WebSocketError {
  type: DDExtendedMessageType.ERROR;
  code?: number;
  message: string;
  details?: string;
  timestamp: string;
}

// Authentication response message
export interface WebSocketAuthMessage {
  type: DDExtendedMessageType.AUTH_SUCCESS;
  message: string;
  timestamp: string;
}

/**
 * Unified WebSocket endpoint - March 2025 WebSocket System
 * All communication now goes through a single WebSocket endpoint
 */
export const WEBSOCKET_ENDPOINT = '/api/v69/ws';

/**
 * Socket types for tracking and monitoring
 * These identifiers are used in the WebSocket monitoring system to track
 * connection status and performance metrics.
 */
export const SOCKET_TYPES = {
  // Core system sockets
  MONITOR: 'monitor',
  SERVER_STATUS: 'server-status',
  SYSTEM_SETTINGS: 'system', // Updated to use 'system' instead of 'system-settings' per v69 API changes
  SYSTEM: 'system', // Add new proper name, but keep SYSTEM_SETTINGS for backward compatibility
  
  // Market data sockets
  TOKEN_DATA: 'token-data',
  MARKET_DATA: 'market-data',
  TOKEN_PROFILES: 'token-profiles',
  
  // User data sockets
  PORTFOLIO: 'portfolio',
  WALLET: 'wallet',
  NOTIFICATION: 'notification',
  ACHIEVEMENT: 'achievement',
  
  // Contest sockets
  CONTEST: 'contest',
  CONTEST_CHAT: 'contest-chat', // Being deprecated in favor of unified CONTEST socket
  
  // Admin sockets
  ADMIN: 'admin',
  ANALYTICS: 'analytics',
  CIRCUIT_BREAKER: 'circuit-breaker',
  SERVICE: 'service',
  SKYDUEL: 'skyduel',
  
  // Testing socket
  TEST: 'test',
  
  // Terminal data socket
  TERMINAL: 'terminal',

  // Liquidity simulation socket
  LIQUIDITY_SIM: 'liquidity-sim',
};