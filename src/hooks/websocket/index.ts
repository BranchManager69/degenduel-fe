/**
 * WebSocket System - v69 Standardized Implementation
 * 
 * This directory contains the standardized WebSocket implementation for the DegenDuel
 * frontend. All WebSocket connections should use this system to ensure consistent
 * tracking, monitoring, and error handling.
 */

export { default as WebSocketManager } from './WebSocketManager';
export { default as useWebSocket } from './useWebSocket';
export * from './types';