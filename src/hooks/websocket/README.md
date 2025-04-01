# DegenDuel WebSocket System

## Architecture Overview

The DegenDuel WebSocket system uses a unified architecture to provide real-time data through a single WebSocket connection:

```
  ┌────────────────────────────────────────────────────────────────┐
  │                          App                                    │
  │                                                                 │
  │  ┌─────────────┐  ┌──────────────────┐  ┌───────────────────┐  │
  │  │TokenData    │  │Contest           │  │Wallet             │  │
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

### TokenDataContext

- Provides token data to the application
- Uses the unified WebSocket system through useUnifiedWebSocket
- Located in `/contexts/TokenDataContext.tsx`

## Migration from Multiple Connections to Unified System

The system previously had multiple independent WebSocket connections:

1. The WebSocketManager created one connection
2. TokenDataContext created another separate connection via useTokenDataWebSocket

This caused:
- Duplicate connections to the same server
- Authentication confusion on the server side
- Inefficient network usage
- Potential race conditions

### Migration Strategy

1. Updated TokenDataContext to use useUnifiedWebSocket instead of useTokenDataWebSocket
2. Created a compatibility version of useTokenDataWebSocket that uses the unified system
3. Kept APIs consistent to avoid breaking changes

### Legacy Components

For backward compatibility, legacy hooks have been preserved but updated to use the unified system:

- `useTokenDataWebSocket.ts` - Now uses useUnifiedWebSocket internally
- Original implementation preserved as `deprecated-useTokenDataWebSocket.ts`

## Usage Guidelines

### For New Components

Always use the unified WebSocket system:

```typescript
import { useUnifiedWebSocket } from '../hooks/websocket/useUnifiedWebSocket';
import { MessageType } from '../hooks/websocket/types';

// Inside your component:
const { 
  isConnected, 
  sendMessage, 
  subscribe, 
  request 
} = useUnifiedWebSocket('your-component-id', 
  [MessageType.DATA], // Message types to listen for
  (message) => {
    // Handle incoming messages
    console.log('Received message:', message);
  },
  ['market-data'] // Optional topic filter
);

// Subscribe to topics when connected
useEffect(() => {
  if (isConnected) {
    subscribe(['market-data']);
    request('market-data', 'getAllTokens');
  }
}, [isConnected]);
```

### For Existing Components

Existing components using the old hooks will continue to work as they now use the unified system internally, but they will log deprecation warnings.

## Authentication

All authentication in the unified system happens through the WebSocketManager. The system will:

1. Attempt to authenticate with the most suitable token
2. Use token priority: wsToken || jwt || sessionToken
3. Handle token expiration and refresh automatically