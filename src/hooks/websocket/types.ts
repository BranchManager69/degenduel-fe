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
import { DDWebSocketMessageType } from 'degenduel-shared';

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
  type: string; // Using string to catch all message types since it's an enum
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
}

// Standardized error message structure
export interface WebSocketError {
  type: 'ERROR';
  code?: number;
  message: string;
  details?: string;
  timestamp: string;
}

// Authentication response message
export interface WebSocketAuthMessage {
  type: 'auth_success' | 'authenticated';
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