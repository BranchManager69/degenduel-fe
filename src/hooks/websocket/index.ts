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
export { 
  WebSocketManager, 
  useUnifiedWebSocket,
  MessageType,
  TopicType,
  default as WebSocketManagerComponent 
} from './WebSocketManager';

// We still export types for backward compatibility
export * from './types';

// DEPRECATED - The individual WebSocket hooks are no longer in use
// They have been replaced by the unified WebSocket system
export const WEBSOCKET_SYSTEM_DEPRECATED = true;