# DegenDuel WebSocket Standardization Guide

This guide outlines the process of standardizing all WebSocket usage in the DegenDuel frontend to use the v69 unified WebSocket system.

## Background

The DegenDuel frontend initially used multiple separate WebSocket connections for different features:
- Token data
- Notifications
- Contest updates
- User data
- Administrative features

This led to inefficiency, duplicated code, authentication issues, and difficulty maintaining consistent connection states across the application.

The v69 unified WebSocket system was created to solve these issues by providing a single WebSocket connection that handles all data streams through a topic-based subscription model.

## Migration Plan

All components should use hooks that connect to the unified WebSocket system through a standardized pattern. This document outlines that pattern and how to implement it.

## Core Components

The unified WebSocket system consists of the following core components:

1. **WebSocketContext.tsx** (`src/contexts/WebSocketContext.tsx`)
   - Provides a centralized WebSocket connection
   - Handles authentication, reconnection, and heartbeats
   - Exposes connection state and methods to the app

2. **useUnifiedWebSocket.ts** (`src/hooks/websocket/useUnifiedWebSocket.ts`)
   - React hook for components to use the WebSocket
   - Provides topic filtering, message type filtering
   - Handles subscription and message distribution

3. **Topic-Based Hooks** (`src/hooks/websocket/topic-hooks/`)
   - Specialized hooks built on top of useUnifiedWebSocket
   - Each provides a clean interface for specific features
   - Hide WebSocket complexity from UI components

## Standardized Pattern

### Step 1: Create a Topic-Based Hook

Specialized hooks should be placed in `src/hooks/websocket/topic-hooks/` and follow this pattern:

```typescript
// src/hooks/websocket/topic-hooks/useFeatureName.ts
import { useCallback, useEffect, useState } from 'react';
import { useUnifiedWebSocket } from '../useUnifiedWebSocket';
import { MessageType } from '../types';
import { TopicType } from '../index';

// Define types for your feature
interface FeatureData {
  // Feature-specific data structure
}

export function useFeatureName() {
  // State management
  const [data, setData] = useState<FeatureData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Connect to the unified WebSocket
  const ws = useUnifiedWebSocket(
    'feature-name-hook', // Unique identifier
    [MessageType.DATA], // Message types to listen for
    (message) => {
      // Handle incoming messages
      if (message.data?.type === "FEATURE_DATA_UPDATE") {
        setData(message.data.items);
        setIsLoading(false);
      }
    },
    [TopicType.FEATURE_TOPIC] // Topics to subscribe to
  );
  
  // Feature-specific methods
  const doSomething = useCallback((id: string) => {
    if (!ws.isConnected) return;
    
    ws.request(TopicType.FEATURE_TOPIC, 'DO_SOMETHING', { id });
  }, [ws.isConnected, ws.request]);
  
  // Request initial data
  useEffect(() => {
    if (ws.isConnected && isLoading) {
      ws.request(TopicType.FEATURE_TOPIC, 'GET_INITIAL_DATA');
      
      // Set timeout to avoid infinite loading state
      const timeoutId = setTimeout(() => {
        if (isLoading) setIsLoading(false);
      }, 10000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [ws.isConnected, isLoading, ws.request]);
  
  // Return the feature API
  return {
    data,
    isLoading,
    doSomething,
    isConnected: ws.isConnected,
    error: ws.error
  };
}
```

### Step 2: Update Component Imports

Replace imports from legacy WebSocket hooks with the new topic-based hooks:

```diff
- import { useFeatureWebSocket } from '../../hooks/websocket/useFeatureWebSocket';
+ import { useFeatureName } from '../../hooks/websocket/topic-hooks/useFeatureName';

const MyComponent = () => {
-  const { data, isLoading, doSomething } = useFeatureWebSocket();
+  const { data, isLoading, doSomething } = useFeatureName();
  
  // Rest of component remains the same
}
```

### Step 3: Update WebSocket Index

Update `src/hooks/websocket/index.ts` to export the new hook:

```diff
// Existing imports...

// New standardized hooks
export * from './topic-hooks/useNotifications';
+ export * from './topic-hooks/useFeatureName';

// DEPRECATED - Legacy hooks (will eventually be removed)
export * from './useFeatureWebSocket'; // DEPRECATED - use topic-hooks/useFeatureName instead
```

## Example Implementation: Notifications

The notifications system has been migrated to the new pattern:

### Hook Implementation

```typescript
// src/hooks/websocket/topic-hooks/useNotifications.ts
import { useCallback, useEffect, useState } from 'react';
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';
import { useUnifiedWebSocket } from '../useUnifiedWebSocket';
import { MessageType, SOCKET_TYPES } from '../types';
import { TopicType } from '../index';

// Define the Notification interface 
interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  priority: "low" | "medium" | "high" | "urgent";
  link?: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

// Message types from the server
type NotificationActionType = 
  | "NOTIFICATIONS_LIST"
  | "NEW_NOTIFICATION"
  | "NOTIFICATION_READ" 
  | "ALL_NOTIFICATIONS_READ";

interface NotificationData {
  type: NotificationActionType;
  notifications?: Notification[];
  notification?: Notification;
  notificationId?: string;
  timestamp?: string;
}

export function useNotifications() {
  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Message handler
  const handleMessage = useCallback((message: any) => {
    try {
      if (!message.data) return;
      
      const notificationData = message.data as NotificationData;
      const dataType = notificationData.type;
      
      switch (dataType) {
        case "NOTIFICATIONS_LIST":
          if (notificationData.notifications) {
            setNotifications(notificationData.notifications);
            setIsLoading(false);
            setLastUpdate(new Date());
          }
          break;
          
        case "NEW_NOTIFICATION":
          if (notificationData.notification) {
            setNotifications(prev => 
              [notificationData.notification!, ...prev]
            );
            setLastUpdate(new Date());
          }
          break;
          
        case "NOTIFICATION_READ":
          if (notificationData.notificationId) {
            setNotifications(prev => 
              prev.map(notification => 
                notification.id === notificationData.notificationId 
                  ? { ...notification, isRead: true } 
                  : notification
              )
            );
            setLastUpdate(new Date());
          }
          break;
          
        case "ALL_NOTIFICATIONS_READ":
          setNotifications(prev => 
            prev.map(notification => ({ ...notification, isRead: true }))
          );
          setLastUpdate(new Date());
          break;
      }
      
      if (isLoading) {
        setIsLoading(false);
      }
    } catch (err) {
      console.error('[Notifications] Error:', err);
    }
  }, [isLoading]);

  // Connect to WebSocket
  const ws = useUnifiedWebSocket(
    'notifications-hook',
    [MessageType.DATA, MessageType.ERROR],
    handleMessage,
    [TopicType.SYSTEM, TopicType.USER]
  );

  // Calculate unread count
  useEffect(() => {
    const count = notifications.filter(n => !n.isRead).length;
    setUnreadCount(count);
  }, [notifications]);

  // Request initial data
  useEffect(() => {
    if (ws.isConnected && isLoading) {
      ws.subscribe([TopicType.USER]);
      ws.request(TopicType.USER, 'GET_NOTIFICATIONS');
      
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
        }
      }, 10000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [ws.isConnected, isLoading, ws.subscribe, ws.request]);

  // Helper methods
  const markAsRead = useCallback((notificationId: string) => {
    if (!ws.isConnected) return;
    
    ws.request(TopicType.USER, 'MARK_READ', { notificationId });
    
    // Optimistic update
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true } 
          : notification
      )
    );
  }, [ws.isConnected, ws.request]);
  
  const markAllAsRead = useCallback(() => {
    if (!ws.isConnected) return;
    
    ws.request(TopicType.USER, 'MARK_ALL_READ');
    
    // Optimistic update
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  }, [ws.isConnected, ws.request]);
  
  const refreshNotifications = useCallback(() => {
    setIsLoading(true);
    
    if (ws.isConnected) {
      ws.request(TopicType.USER, 'GET_NOTIFICATIONS');
      
      setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
        }
      }, 10000);
    } else {
      setIsLoading(false);
    }
  }, [ws.isConnected, ws.request, isLoading]);
  
  return {
    notifications,
    unreadCount,
    isConnected: ws.isConnected,
    isLoading,
    error: ws.error,
    lastUpdate,
    markAsRead,
    markAllAsRead,
    refreshNotifications
  };
}
```

### Component Update

```diff
// src/pages/authenticated/NotificationsPage.tsx
import { format } from "date-fns";
import React, { useCallback } from "react";
import { FaBell, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaRegBell } from "react-icons/fa";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
- // DEPRECATED 2025-04-02:
- import { useNotificationWebSocket } from "../../hooks/websocket/useNotificationWebSocket";
- // REPLACE NOTIFICATION WITH UNIFIED WEBSOCKET
- /* eslint-disable no-unused-vars */
- import { useUnifiedWebSocket } from "../../hooks/websocket/useUnifiedWebSocket";
- // Log to stop this bitch ass eslint from deleting my code
- console.log(useUnifiedWebSocket.name);
+ // V69 Standardized Hook for Notifications
+ import { useNotifications } from "../../hooks/websocket/topic-hooks/useNotifications";

// Notifications Page
const NotificationsPage: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    isConnected,
-  } = useNotificationWebSocket();
+  } = useNotifications();

  // Rest of component remains unchanged
  // ...
}
```

## Priority Migration List

Hooks should be migrated in the following order:

1. ✅ `useNotificationWebSocket` → `useNotifications`
2. `useTokenDataWebSocket` → `useTokenData`
3. `useMarketDataWebSocket` → `useMarketData`
4. `useContestWebSocket` → `useContests`
5. `useContestChatWebSocket` → `useContestChat`
6. `usePortfolioWebSocket` → `usePortfolio`
7. `useWalletWebSocket` → `useWallet`
8. `useAchievementWebSocket` → `useAchievements`
9. `useSystemSettingsWebSocket` → `useSystemSettings`
10. `useServerStatusWebSocket` → `useServerStatus`

## API Reference

### useUnifiedWebSocket

```typescript
function useUnifiedWebSocket<T = any>(
  id: string,
  types: string[] = [MessageType.DATA],
  onMessage: (message: T) => void,
  topics?: string[]
): {
  sendMessage: (message: any) => boolean;
  isConnected: boolean;
  isAuthenticated: boolean;
  connectionState: ConnectionState;
  error: string | null;
  subscribe: (topics: string[]) => boolean;
  unsubscribe: (topics: string[]) => boolean;
  request: (topic: string, action: string, params?: any) => boolean;
}
```

Parameters:
- `id`: Unique identifier for this listener
- `types`: Array of message types to listen for (DATA, ERROR, SYSTEM, ACKNOWLEDGMENT)
- `onMessage`: Callback function to handle messages
- `topics`: Optional array of topics to filter messages by

Returns an object with:
- `sendMessage`: Send a raw message to the WebSocket
- `isConnected`: Boolean indicating if the WebSocket is connected
- `isAuthenticated`: Boolean indicating if the WebSocket is authenticated
- `connectionState`: Detailed connection state
- `error`: Error message if there is a connection error
- `subscribe`: Subscribe to topics
- `unsubscribe`: Unsubscribe from topics
- `request`: Send a request to a specific topic

### MessageType

```typescript
enum MessageType {
  SUBSCRIBE = 'SUBSCRIBE',
  UNSUBSCRIBE = 'UNSUBSCRIBE',
  REQUEST = 'REQUEST',
  COMMAND = 'COMMAND',
  DATA = 'DATA',
  ERROR = 'ERROR',
  SYSTEM = 'SYSTEM',
  ACKNOWLEDGMENT = 'ACKNOWLEDGMENT',
  PING = 'PING',
  PONG = 'PONG'
}
```

### TopicType

```typescript
const TopicType = {
  // Core system topics
  SYSTEM: 'system',
  MONITOR: 'monitor',
  SERVER_STATUS: 'server-status',
  
  // Market data topics
  MARKET_DATA: 'market-data',
  TOKEN_DATA: 'token-data',
  
  // User data topics
  USER: 'user',
  PORTFOLIO: 'portfolio',
  WALLET: 'wallet',
  NOTIFICATION: 'notification',
  ACHIEVEMENT: 'achievement',
  
  // Contest topics
  CONTEST: 'contest',
  CONTEST_CHAT: 'contest-chat',
  
  // Admin topics
  ADMIN: 'admin',
  ANALYTICS: 'analytics',
  CIRCUIT_BREAKER: 'circuit-breaker',
  SERVICE: 'service',
  SKYDUEL: 'skyduel',
  
  // Special topics
  LOGS: 'logs',
  TEST: 'test'
};
```

### ConnectionState

```typescript
enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  AUTHENTICATING = 'authenticating',
  AUTHENTICATED = 'authenticated',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}
```

## Testing

To test your WebSocket implementation:

1. Verify TypeScript types with `npm run type-check`
2. Test the hook in isolation
3. Test the component integration
4. Test reconnection handling
5. Test authentication verification

## Common Issues

### Topic Not Subscribed

If you're not receiving messages, check:
1. Is the WebSocket connected? `isConnected` should be true
2. Did you subscribe to the correct topics?
3. Are you filtering on the correct message types?

### Hook Not Re-rendering

If your hook doesn't update UI:
1. Ensure you're using proper state management
2. Check dependencies in useEffect/useCallback
3. Verify the component is actually using the hook's return values

### Authentication Issues

If you're not receiving authenticated data:
1. Verify the user is logged in
2. Check that the JWT token is valid
3. Ensure you're subscribing to topics AFTER the WebSocket is connected

## Best Practices

1. **Error Handling**: Always include proper error handling in message processing
2. **Loading States**: Provide clear loading states and timeouts
3. **Cleanup**: Use useEffect cleanup to prevent memory leaks
4. **Metrics**: Use dispatchWebSocketEvent for monitoring
5. **Optimistic Updates**: Use optimistic UI updates for commands
6. **Types**: Ensure proper TypeScript types for all data structures
7. **Documentation**: Document the hook's API clearly

---

Last Updated: April 4, 2025