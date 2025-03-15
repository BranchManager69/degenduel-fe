/**
 * Common Types for WebSocket System
 * 
 * This file contains shared interfaces and types used across the WebSocket system.
 */

// Standard message types from the server
export type MessageType = 
  // System & status messages
  | 'system' 
  | 'error'
  | 'status'
  | 'ping'
  | 'pong'
  // Data messages
  | 'data'
  | 'update'
  | 'price'
  | 'price_update'
  | 'token_data'
  | 'portfolio'
  | 'contest'
  | 'chat'
  | 'achievement'
  | 'server_status'
  | 'notification'
  | 'settings'
  | 'wallet'
  // Admin messages
  | 'admin'
  | 'circuit_breaker'
  | 'service_status';
  
// Standard WebSocket status types
export type WebSocketStatus = 'connecting' | 'online' | 'offline' | 'error' | 'reconnecting';

// Base message interface
export interface WebSocketMessage {
  type: MessageType;
  timestamp?: string;
  data?: any;
}

// Standard error message
export interface WebSocketError {
  type: 'error';
  code?: number;
  message: string;
  details?: string;
  timestamp: string;
}

// Standard WebSocket endpoints
export const WEBSOCKET_ENDPOINTS = {
  SERVER_STATUS: '/api/v69/ws/monitor',
  TOKEN_DATA: '/api/v69/ws/token-data',
  PORTFOLIO: '/api/v69/ws/portfolio',
  CONTEST: '/api/v69/ws/contest',
  CONTEST_CHAT: '/api/v69/ws/contest-chat',
  NOTIFICATION: '/api/v69/ws/notifications',
  WALLET: '/api/v69/ws/wallet',
  ACHIEVEMENT: '/api/v69/ws/achievements',
  SYSTEM_SETTINGS: '/api/v69/ws/settings',
  ANALYTICS: '/api/v69/ws/analytics',
  CIRCUIT_BREAKER: '/api/v69/ws/circuit-breaker',
  SERVICE: '/api/v69/ws/service',
  SKYDUEL: '/api/v69/ws/skyduel',
};

// Socket types for tracking
export const SOCKET_TYPES = {
  SERVER_STATUS: 'server-status',
  TOKEN_DATA: 'token-data',
  PORTFOLIO: 'portfolio',
  CONTEST: 'contest',
  CONTEST_CHAT: 'contest-chat',
  NOTIFICATION: 'notification',
  WALLET: 'wallet',
  ACHIEVEMENT: 'achievement',
  SYSTEM_SETTINGS: 'system-settings',
  ANALYTICS: 'analytics',
  CIRCUIT_BREAKER: 'circuit-breaker',
  SERVICE: 'service',
  SKYDUEL: 'skyduel',
};