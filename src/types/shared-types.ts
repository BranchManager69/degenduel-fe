/**
 * Shared types extracted from degenduel-shared package
 * 
 * This provides the critical types needed for the build without
 * requiring the external package during CI.
 * 
 * IMPORTANT: This is a temporary solution until we properly publish
 * the shared package to GitHub Packages and use it as a dependency.
 */

// WebSocket related enums and types
export enum DDWebSocketMessageType {
  // Client -> Server messages
  SUBSCRIBE = 'SUBSCRIBE',
  UNSUBSCRIBE = 'UNSUBSCRIBE',
  REQUEST = 'REQUEST',
  COMMAND = 'COMMAND',
  
  // Server -> Client messages
  DATA = 'DATA',
  ERROR = 'ERROR',
  SYSTEM = 'SYSTEM',
  ACKNOWLEDGMENT = 'ACKNOWLEDGMENT'
}

export interface DDWebSocketMessage {
  type: DDWebSocketMessageType;
  requestId?: string;
}

export enum DDWebSocketTopic {
  MARKET_DATA = 'market-data',
  PORTFOLIO = 'portfolio',
  SYSTEM = 'system',
  CONTEST = 'contest', 
  USER = 'user',
  ADMIN = 'admin',
  WALLET = 'wallet',
  SKYDUEL = 'skyduel',
  LOGS = 'logs'
}

export enum ContestStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  ENDED = 'ended',
  CANCELED = 'canceled'
}

// Type to represent general WebSocket message payloads
export type WebSocketMessagePayload = Record<string, any>;

// Type to represent WebSocket subscriptions
export type WebSocketSubscription = {
  topic: string;
  subtopic?: string;
};