/**
 * Unified WebSocket System v69
 * 
 * This directory contains the standardized unified WebSocket implementation
 * for the DegenDuel frontend. All WebSocket connections are consolidated into
 * a single WebSocket connection, with topics and message types determining routing.
 * 
 * V69 UPDATE (2025-04-02): Moving all specialized hooks to topic-based pattern
 * where they use the unified WebSocket system internally.
 */

// Standard WebSocket System exports
export { ConnectionState, MessageType, SOCKET_TYPES } from './types';
export { default as WebSocketManager } from './WebSocketManager';
export { useUnifiedWebSocket };
export * from './types';

// Import from types
import { SOCKET_TYPES } from './types';

// Define TopicType as both a namespace (for values) and a type (for type checking)
// This allows TopicType to be used both as a value (TopicType.SYSTEM) and as a type (param: TopicType)
export const TopicType = {
  // Core system topics
  SYSTEM: SOCKET_TYPES.SYSTEM, 
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
  TEST: SOCKET_TYPES.TEST,
  
  // Terminal and platform data topics
  TERMINAL: 'terminal'
};

// Type definition for TopicType
export type TopicType = keyof typeof TopicType | string;

// Import and re-export the WebSocket hook
import useUnifiedWebSocket from './useUnifiedWebSocket';

// New standardized format hooks
export * from './topic-hooks/useNotifications';
export * from './topic-hooks/useTerminalData';
export * from './topic-hooks/useTokenData';
export * from './topic-hooks/useMarketData';
export * from './topic-hooks/useContests';
export * from './topic-hooks/usePortfolio';
export * from './topic-hooks/useWallet';
export * from './topic-hooks/useContestChat';
export * from './topic-hooks/useAchievements';
export * from './topic-hooks/useServerStatus';
export * from './topic-hooks/useSystemSettings';
export * from './topic-hooks/useSkyDuel';
export * from './topic-hooks/useCircuitBreaker';
export * from './topic-hooks/useService';
export * from './topic-hooks/useRPCBenchmark';

// DEPRECATED - The individual WebSocket hooks below will be replaced
// with topic-based hooks that use the unified WebSocket system
export const WEBSOCKET_SYSTEM_DEPRECATED = true;

// Legacy hooks (still exported for backward compatibility)
// These will gradually be replaced with standardized topic-based hooks
export * from './useAchievementWebSocket'; // DEPRECATED - use topic-hooks/useAchievements instead
export * from './useAnalyticsWebSocket';
export * from './useCircuitBreakerSocket'; // DEPRECATED - use topic-hooks/useCircuitBreaker instead
export * from './useContestChatWebSocket'; // DEPRECATED - use topic-hooks/useContestChat instead
export * from './useContestWebSocket'; // DEPRECATED - use topic-hooks/useContests instead
export * from './useMarketDataWebSocket'; // DEPRECATED - use topic-hooks/useMarketData instead
export * from './useNotificationWebSocket'; // DEPRECATED - use topic-hooks/useNotifications instead
export * from './usePortfolioWebSocket'; // DEPRECATED - use topic-hooks/usePortfolio instead
export * from './useRPCBenchmarkWebSocket'; // DEPRECATED - use topic-hooks/useRPCBenchmark instead
export * from './useServerStatusWebSocket'; // DEPRECATED - use topic-hooks/useServerStatus instead
export * from './useServiceWebSocket'; // DEPRECATED - use topic-hooks/useService instead
export * from './useSkyDuelWebSocket'; // DEPRECATED - use topic-hooks/useSkyDuel instead
export * from './useSystemSettingsWebSocket'; // DEPRECATED - use topic-hooks/useSystemSettings instead
export * from './useTokenDataWebSocket'; // DEPRECATED - use topic-hooks/useTokenData instead
export * from './useWalletWebSocket'; // DEPRECATED - use topic-hooks/useWallet instead
export * from './useWebSocket';