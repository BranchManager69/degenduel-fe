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
 * Official WebSocket endpoints - verified against backend API documentation
 * All endpoints use the v69 API version and are relative paths that should be
 * appended to the base WebSocket URL.
 * 
 * Example: wss://degenduel.me/api/v69/ws/monitor
 */
export const WEBSOCKET_ENDPOINTS = {
  // Core platform monitoring WebSockets
  MONITOR: '/api/v69/ws/monitor',
  SERVER_STATUS: '/api/v69/ws/monitor', // Same as MONITOR
  SYSTEM_SETTINGS: '/api/v69/ws/system-settings',
  
  // Market and token data WebSockets
  TOKEN_DATA: '/api/v69/ws/token-data',
  MARKET_DATA: '/api/v69/ws/market-data',
  
  // User-related WebSockets
  PORTFOLIO: '/api/v69/ws/portfolio',
  WALLET: '/api/v69/ws/wallet',
  NOTIFICATION: '/api/v69/ws/notifications',
  ACHIEVEMENT: '/api/v69/ws/achievements', // New in v69
  
  // Contest-related WebSockets
  CONTEST: '/api/v69/ws/contest',
  CONTEST_CHAT: '/api/v69/ws/contest', // Shared endpoint with CONTEST
  
  // Admin and analytics WebSockets
  ANALYTICS: '/api/v69/ws/analytics',
  CIRCUIT_BREAKER: '/api/v69/ws/circuit-breaker',
  SERVICE: '/api/v69/ws/circuit-breaker', // Alias for CIRCUIT_BREAKER
  SKYDUEL: '/api/v69/ws/skyduel',
};

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