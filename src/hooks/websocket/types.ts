// src/hooks/websocket/types.ts

/**
 * Common Types for WebSocket System v69
 * 
 * This file contains standardized interfaces and types used across the WebSocket system.
 * All endpoints and types have been verified against backend API documentation.
 * Last updated: March 27, 2025
 */

// Standardized message types from the server - all uppercase as expected by the server
export enum MessageType {
  // System & status messages
  SYSTEM = 'SYSTEM',
  ERROR = 'ERROR',
  PING = 'PING',
  PONG = 'PONG',
  AUTH = 'AUTH',
  AUTH_SUCCESS = 'AUTH_SUCCESS',
  ACKNOWLEDGMENT = 'ACKNOWLEDGMENT',
  
  // Data messages
  DATA = 'DATA',
  SUBSCRIBE = 'SUBSCRIBE',
  UNSUBSCRIBE = 'UNSUBSCRIBE',
  REQUEST = 'REQUEST',
  COMMAND = 'COMMAND'
}
  
// Standardized WebSocket connection status types
export type WebSocketStatus = 'connecting' | 'online' | 'offline' | 'error' | 'reconnecting';

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
  SYSTEM_SETTINGS: 'system-settings',
  
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
  ANALYTICS: 'analytics',
  CIRCUIT_BREAKER: 'circuit-breaker',
  SERVICE: 'service',
  SKYDUEL: 'skyduel',
  
  // Testing socket
  TEST: 'test',
};