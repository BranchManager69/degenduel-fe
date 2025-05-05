# DegenDuel WebSocket System

## Overview

The DegenDuel WebSocket system uses a unified architecture (v69) that provides real-time data through a single WebSocket connection with topic-based subscriptions.

```
┌────────────────────────────────────────────────────────────────┐
│                          App                                    │
│                                                                 │
│  ┌─────────────┐  ┌──────────────────┐  ┌───────────────────┐  │
│  │TokenData    │  │Contest           │  │Terminal           │  │
│  │Context      │  │Context           │  │Context            │  │
│  └─────┬───────┘  └────────┬─────────┘  └─────────┬─────────┘  │
│        │                   │                      │            │
│        │                   │                      │            │
│        ▼                   ▼                      ▼            │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                    Unified WebSocket                    │    │
│  │                (useUnifiedWebSocket.ts)                 │    │
│  └───────────────────────────┬────────────────────────────┘    │
│                              │                                  │
│                              │                                  │
│                              ▼                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                  WebSocketManager                       │    │
│  │              (single connection to server)              │    │
│  └────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────┘
```

## Core Components

### WebSocketManager (Component)
- Creates and manages a single WebSocket connection
- Handles authentication, reconnection, and message routing
- Located in `/components/websocket/WebSocketManager.tsx`

### useUnifiedWebSocket (Hook)
- Provides a hook interface to the unified WebSocket system
- Allows components to subscribe to specific message types and topics
- Located in `/hooks/websocket/useUnifiedWebSocket.ts`

### Topic-Specific Hooks
- Built on top of useUnifiedWebSocket for specific topics
- Located in `/hooks/websocket/topic-hooks/`
- Examples: `useTokenData`, `useContests`, `useNotifications`

## Available Topics

The WebSocket system supports these topics:

| Topic ID | Name | Description | Authentication Required |
|----------|------|-------------|-------------------------|
| `market-data` | Market Data | Real-time market data for tokens | No |
| `token-data` | Token Data | Specific token information | No |
| `portfolio` | Portfolio | User portfolio information | Yes |
| `system` | System | System-wide notifications and events | No |
| `contest` | Contest | Contest information and updates | No (Public), Yes (User-specific) |
| `contest-chat` | Contest Chat | Chat for specific contests | Yes |
| `user` | User | User profile and statistics | Yes |
| `admin` | Admin | Administrative functions | Yes (Admin role) |
| `wallet` | Wallet | Wallet information and transactions | Yes |
| `skyduel` | SkyDuel | SkyDuel game data | No (Public), Yes (User-specific) |
| `logs` | Logs | Client logging facility | No |
| `notification` | Notifications | User notifications | Yes |
| `achievement` | Achievements | User achievements and progress | Yes |
| `server-status` | Server Status | Server status information | No |
| `analytics` | Analytics | Admin analytics and metrics | Yes (Admin) |
| `circuit-breaker` | Circuit Breaker | Circuit breaker monitoring | Yes (Admin) |
| `service` | Service | Service status monitoring | Yes (Admin) |
| `terminal` | Terminal | Terminal data and interaction | No |

## Using WebSocket Hooks

### Available Hooks

| Hook Name | Purpose | Topics | Auth Required |
|-----------|---------|--------|---------------|
| `useTokenData` | Token data and prices | token-data, market-data | No |
| `useMarketData` | Global market statistics | market-data | No |
| `useContests` | Contest information | contest | Public/User |
| `useContestChat` | Chat for contests | contest-chat | Yes |
| `usePortfolio` | Portfolio management | portfolio | Yes |
| `useWallet` | Wallet information | wallet | Yes |
| `useAchievements` | User achievements | achievement | Yes |
| `useNotifications` | User notifications | notification | Yes |
| `useServerStatus` | Server status | server-status | No |
| `useSystemSettings` | System settings | system | No |
| `useAnalytics` | Admin analytics | admin, analytics | Yes (Admin) |
| `useSkyDuel` | SkyDuel system | skyduel | Public/Admin |
| `useCircuitBreaker` | Circuit breaker | circuit-breaker | Yes (Admin) |
| `useService` | Service status | service | Yes (Admin) |
| `useRPCBenchmark` | RPC benchmarks | admin | Yes (Admin) |
| `useTerminalData` | Terminal data | terminal | No |

### Type System

All WebSocket messages use TypeScript enums for message types:

```typescript
import { DDExtendedMessageType, WS_MESSAGE_TYPES } from '../hooks/websocket';

// Use enum values for type safety
const message = {
  type: DDExtendedMessageType.SUBSCRIBE,
  topics: ['market-data']
};

// Or use constants for convenience
const message = {
  type: WS_MESSAGE_TYPES.SUBSCRIBE,
  topics: ['market-data']
};
```

For handling message types in comparisons:

```typescript
import { isMessageType, WS_MESSAGE_TYPES } from '../hooks/websocket';

// Type-safe message type comparison
if (isMessageType(message.type, WS_MESSAGE_TYPES.SYSTEM)) {
  // Handle system message
}
```

## Standard Hook Pattern

All topic-specific hooks follow this standardized pattern:

```typescript
import { useCallback, useEffect, useState } from 'react';
import { useUnifiedWebSocket } from '../useUnifiedWebSocket';
import { MessageType } from '../types';
import { TopicType } from '../index';

export function useFeatureName(options) {
  // State management
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Message handler
  const handleMessage = useCallback((message) => {
    if (message.topic === TopicType.FEATURE && message.data) {
      setData(message.data);
      setIsLoading(false);
      setLastUpdate(new Date());
    }
  }, []);

  // Connect to WebSocket
  const ws = useUnifiedWebSocket(
    'feature-hook-id',
    [MessageType.DATA, MessageType.ERROR],
    handleMessage,
    [TopicType.FEATURE]
  );

  // Request initial data
  useEffect(() => {
    if (ws.isConnected && isLoading) {
      ws.request(TopicType.FEATURE, 'get_data', options);
    }
  }, [ws.isConnected, isLoading, options]);

  // Return the hook API
  return {
    data,
    isLoading,
    isConnected: ws.isConnected,
    error: ws.error,
    lastUpdate,
    refresh: () => {
      setIsLoading(true);
      ws.request(TopicType.FEATURE, 'get_data', options);
    }
  };
}
```

## Standard Message Format

All WebSocket messages follow this standard format:

```typescript
// Client to Server
{
  type: 'SUBSCRIBE',           // Message type (enum)
  topics: ['market-data'],     // Topics to subscribe to
  authToken: 'jwt-token'       // Optional auth token
}

// Server to Client
{
  type: 'DATA',                // Message type (enum)
  topic: 'market-data',        // Topic identifier
  subtype: 'update',           // Optional subtype
  action: 'update',            // Action being performed
  data: {                      // Topic-specific data
    // Payload depends on the topic
  },
  timestamp: "2025-04-10T12:34:56.789Z"
}
```

## Usage Examples

### Token Data Example

```typescript
import { useTokenData } from '../hooks/websocket/topic-hooks/useTokenData';

function TokensList() {
  const { 
    tokens,           // Array of token data
    isLoading,        // Loading state
    isConnected,      // Connection state
    lastUpdate,       // Last update timestamp
    refresh           // Function to refresh data
  } = useTokenData();

  return (
    <div>
      {isLoading ? (
        <p>Loading tokens...</p>
      ) : (
        <ul>
          {tokens.map(token => (
            <li key={token.symbol}>
              {token.name}: ${token.price}
            </li>
          ))}
        </ul>
      )}
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

### Contests Example

```typescript
import { useContests } from '../hooks/websocket/topic-hooks/useContests';

function ContestBrowser() {
  const { 
    contests,
    activeContests,
    upcomingContests,
    isLoading,
    isConnected,
    refreshContests,
    joinContest
  } = useContests();

  return (
    <div>
      {isLoading ? (
        <p>Loading contests...</p>
      ) : (
        <div>
          <h2>Active Contests ({activeContests.length})</h2>
          <ul>
            {activeContests.map(contest => (
              <li key={contest.contest_id}>
                {contest.name} - Prize Pool: ${contest.prize_pool}
              </li>
            ))}
          </ul>
          
          <h2>Upcoming Contests</h2>
          <ul>
            {upcomingContests.map(contest => (
              <li key={contest.contest_id}>
                {contest.name} - Starts: {new Date(contest.start_time).toLocaleString()}
                <button onClick={() => joinContest(contest.contest_id)}>Join</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <button onClick={refreshContests}>Refresh</button>
    </div>
  );
}
```

### Notifications Example

```typescript
import { useNotifications } from '../hooks/websocket/topic-hooks/useNotifications';

function NotificationsPanel() {
  const { 
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refreshNotifications
  } = useNotifications();

  return (
    <div>
      <h2>Notifications ({unreadCount} unread)</h2>
      
      {isLoading ? (
        <p>Loading notifications...</p>
      ) : (
        <div>
          {notifications.length === 0 ? (
            <p>No notifications</p>
          ) : (
            <ul>
              {notifications.map(notification => (
                <li 
                  key={notification.id}
                  className={notification.isRead ? 'read' : 'unread'}
                >
                  <h3>{notification.title}</h3>
                  <p>{notification.content}</p>
                  <button 
                    onClick={() => markAsRead(notification.id)}
                    disabled={notification.isRead}
                  >
                    Mark as Read
                  </button>
                </li>
              ))}
            </ul>
          )}
          
          <button onClick={markAllAsRead}>Mark All as Read</button>
          <button onClick={refreshNotifications}>Refresh</button>
        </div>
      )}
    </div>
  );
}
```

## Advanced Features

### Authentication

The WebSocket system automatically handles authentication when required:

1. First connection attempt is made without authentication
2. If a hook requires authentication, it adds the token to the connection
3. The system uses JWT from the auth state for authentication
4. Token refresh is handled automatically

### Reconnection

The WebSocket system handles reconnection automatically:

1. Detects disconnections
2. Implements exponential backoff for reconnection attempts
3. Resubscribes to topics after reconnection
4. Refreshes data automatically

### Error Handling

Error handling is built into each hook:

1. Connection errors are exposed via `error` property
2. Request errors are handled in the message callbacks
3. Timeouts prevent infinite loading states

## Troubleshooting

If you encounter issues with WebSocket connections:

1. Check connection status with `isConnected` property
2. Verify authentication for protected topics
3. Check for errors in the `error` property
4. Monitor connections using browser devtools
5. Check server logs for connection issues

## Legacy Support

All legacy WebSocket hooks are deprecated but still available in the `legacy` directory for backward compatibility. New components should use the standardized hooks from `/hooks/websocket/topic-hooks/`.

---

Last updated: May 5, 2025