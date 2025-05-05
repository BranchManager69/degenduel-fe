# DegenDuel v69 WebSocket Hooks Reference

This document serves as a concise reference for the standardized v69 WebSocket hooks in the DegenDuel frontend application.

## Available Hooks

| Hook Name | Purpose | Topics | Authentication Required |
|-----------|---------|--------|-------------------------|
| `useTokenData` | Real-time token data and prices | market-data, token-data | No |
| `useMarketData` | Global market statistics | market-data | No |
| `useContests` | Contest information and updates | contest | No (public), Yes (user-specific) |
| `useContestChat` | Chat for contests | contest-chat | Yes |
| `usePortfolio` | User portfolio management | portfolio | Yes |
| `useWallet` | Wallet information and transactions | wallet | Yes |
| `useAchievements` | User achievements and progress | user, achievement | Yes |
| `useNotifications` | User notifications | notification, system, user | Yes |
| `useServerStatus` | Server status and maintenance | system | No |
| `useSystemSettings` | System-wide settings | system | No |
| `useAnalytics` | Admin analytics and metrics | admin | Yes (Admin) |
| `useSkyDuel` | SkyDuel visualization system | skyduel | No (public), Yes (admin features) |
| `useCircuitBreaker` | Circuit breaker monitoring | circuit-breaker | Yes (Admin) |
| `useService` | Service status monitoring | service | Yes (Admin) |
| `useRPCBenchmark` | RPC benchmark tools | admin | Yes (Admin) |
| `useTerminalData` | Terminal data and interaction | terminal | No |

## Quick API Reference

### useUnifiedWebSocket

```typescript
function useUnifiedWebSocket<T = any>(
  id: string,
  types: MessageType[] = [MessageType.DATA],
  onMessage: (message: T) => void,
  topics?: TopicType[]
): {
  sendMessage: (message: any) => boolean;
  isConnected: boolean;
  isAuthenticated: boolean;
  error: string | null;
  subscribe: (topics: TopicType[]) => boolean;
  unsubscribe: (topics: TopicType[]) => boolean;
  request: (topic: TopicType, action: string, params?: any) => boolean;
}
```

### Topic-Based Hooks (Common Return Values)

Most topic-based hooks return these common properties:

```typescript
{
  data: T;              // Topic-specific data structure
  isLoading: boolean;   // Whether data is loading
  isConnected: boolean; // WebSocket connection status
  error: string | null; // Error message if any
  lastUpdate: Date;     // Last update timestamp
  refresh: () => void;  // Function to refresh data
}
```

### useTokenData

```typescript
function useTokenData(symbols?: string[]): {
  tokens: Token[];             // All tokens or filtered by symbols
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refresh: () => void;
  getToken: (symbol: string) => Token | undefined;
  getTokenPrice: (symbol: string) => number | undefined;
}
```

### useContests

```typescript
function useContests(): {
  contests: Contest[];
  activeContests: Contest[];
  upcomingContests: Contest[];
  completedContests: Contest[];
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  refreshContests: () => void;
  joinContest: (contestId: string) => Promise<boolean>;
  getContest: (contestId: string) => Contest | undefined;
}
```

### useNotifications

```typescript
function useNotifications(): {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  refreshNotifications: () => void;
}
```

See the main [README.md](./README.md) for full documentation and examples.

Last updated: May 5, 2025