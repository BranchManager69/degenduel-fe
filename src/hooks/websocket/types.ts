/**
 * WebSocket Types
 * Shared type definitions for WebSocket implementation
 */

// WebSocket endpoints to connect to
export const WEBSOCKET_ENDPOINTS = {
  monitor: 'monitor',
  tokenData: 'token-data',
  market: 'market-data',
  circuit: 'circuit-breaker',
  contest: 'contest',
  notifications: 'notifications',
  portfolio: 'portfolio',
  serverStatus: 'server-status',
  achievements: 'achievements',
  wallet: 'wallet',
  analytics: 'analytics',
  services: 'services'
} as const;

// Type for WebSocket endpoint values
export type WebSocketEndpointType = typeof WEBSOCKET_ENDPOINTS[keyof typeof WEBSOCKET_ENDPOINTS];

// WebSocket options interface
export interface WebSocketOptions {
  token?: string;
  autoConnect?: boolean;
  reconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  maxReconnectInterval?: number;
  debug?: boolean;
  onMessage?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: (event: CloseEvent) => void;
  onError?: (error: any) => void;
}

// WebSocket hook return type
export interface WebSocketHookReturn {
  socket: WebSocket | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  reconnectAttempts: number;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: object | string) => boolean;
  subscribe: (channel: string) => boolean;
  unsubscribe: (channel: string) => boolean;
}