/**
 * Unified WebSocket System v2
 * 
 * This directory contains the unified WebSocket implementation for the DegenDuel
 * frontend. All WebSocket connections are consolidated into a single WebSocket
 * connection, with message types determining routing.
 * 
 * CRITICAL UPDATE: The individual WebSocket connections have been replaced by
 * a single unified WebSocket. The HTTP fallbacks from the deprecated hooks
 * are still available for backward compatibility.
 */

// WebSocket System - Unified WebSocket Manager
export { ConnectionState, MessageType, SOCKET_TYPES } from './types';
export { default as WebSocketManager } from './WebSocketManager';
export { useUnifiedWebSocket };

// Import and re-export from types for backward compatibility (simplify someday)
////import { ConnectionState, MessageType, SOCKET_TYPES } from './types';
import { SOCKET_TYPES } from './types'; // (clunky)

// Define TopicType as both a namespace (for values) and a type (for type checking)
// This allows TopicType to be used both as a value (TopicType.SYSTEM) and as a type (param: TopicType)
export const TopicType = {
  // Core system topics
  SYSTEM: SOCKET_TYPES.SYSTEM, // Changed from SYSTEM_SETTINGS to SYSTEM per v69 API
  MONITOR: SOCKET_TYPES.MONITOR,
  SERVER_STATUS: SOCKET_TYPES.SERVER_STATUS,
  
  // Market data topics
  MARKET_DATA: SOCKET_TYPES.MARKET_DATA,
  TOKEN_DATA: SOCKET_TYPES.TOKEN_DATA,
  
  // User data topics
  USER: 'user',
  PORTFOLIO: SOCKET_TYPES.PORTFOLIO,
  WALLET: SOCKET_TYPES.WALLET,
  NOTIFICATION: SOCKET_TYPES.NOTIFICATION,
  ACHIEVEMENT: SOCKET_TYPES.ACHIEVEMENT,
  
  // Contest topics
  CONTEST: SOCKET_TYPES.CONTEST,
  CONTEST_CHAT: SOCKET_TYPES.CONTEST_CHAT,
  
  // Admin topics
  ADMIN: 'admin',
  ANALYTICS: SOCKET_TYPES.ANALYTICS,
  CIRCUIT_BREAKER: SOCKET_TYPES.CIRCUIT_BREAKER,
  SERVICE: SOCKET_TYPES.SERVICE,
  SKYDUEL: SOCKET_TYPES.SKYDUEL,
  
  // Special topics
  LOGS: 'logs',
  TEST: SOCKET_TYPES.TEST
};

// Type definition for TopicType
export type TopicType = keyof typeof TopicType | string;

// Import and re-export the WebSocket hook
import useUnifiedWebSocket from './useUnifiedWebSocket';

// We still export types for backward compatibility
  export * from './types';

// DEPRECATED - The individual WebSocket hooks are no longer in use
// They have been replaced by the unified WebSocket system
export const WEBSOCKET_SYSTEM_DEPRECATED = true;