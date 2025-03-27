// src/hooks/websocket/types.ts

/**
 * 
 * THIS FILE IS WOEFULLY IN NEED OF AN UPDATE AND OVERHAUL!
 * ALL WSS ENDPOINTS AND SOCKET TYPES ARE NOT UP TO DATE!
 * 
 */

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

// Standard WebSocket endpoints - verified against backend team feedback
export const WEBSOCKET_ENDPOINTS = {
  MONITOR: '/api/v69/ws/monitor',
  TOKEN_DATA: '/api/v69/ws/token-data',
  MARKET_DATA: '/api/v69/ws/market-data',
  PORTFOLIO: '/api/v69/ws/portfolio', // Note: This endpoint might need verification with backend
  CONTEST: '/api/v69/ws/contest',
  CONTEST_CHAT: '/api/v69/ws/contest', // Contest chat uses the contest endpoint // TODO: Deprecate this endpoint; use CONTEST instead
  NOTIFICATION: '/api/v69/ws/notifications',
  WALLET: '/api/v69/ws/wallet', // Note: This endpoint might need verification with backend
  SYSTEM_SETTINGS: '/api/v69/ws/system-settings',
  ANALYTICS: '/api/v69/ws/analytics',
  CIRCUIT_BREAKER: '/api/v69/ws/circuit-breaker',
  // SERVICE endpoint doesn't exist - service monitoring is handled by CIRCUIT_BREAKER and SERVER_STATUS
  SERVICE: '/api/v69/ws/circuit-breaker', // Redirected to circuit-breaker as per backend team guidance
  SKYDUEL: '/api/v69/ws/skyduel',
  SERVER_STATUS: '/api/v69/ws/monitor',
};

// Socket types for tracking
export const SOCKET_TYPES = {
  MONITOR: 'monitor',
  TOKEN_DATA: 'token-data',
  MARKET_DATA: 'market-data',
  PORTFOLIO: 'portfolio',
  CONTEST: 'contest',
  CONTEST_CHAT: 'contest-chat', // deprecating; use CONTEST instead
  NOTIFICATION: 'notification',
  WALLET: 'wallet',
  SYSTEM_SETTINGS: 'system-settings',
  ANALYTICS: 'analytics',
  CIRCUIT_BREAKER: 'circuit-breaker',

  SERVICE: 'service',
  SKYDUEL: 'skyduel',
  SERVER_STATUS: 'server-status',

  TEST: 'test',
};