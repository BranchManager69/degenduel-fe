# WebSocket Standardization (V69)

This document describes the standardized approach for WebSocket connections in DegenDuel's frontend. The V69 standardization ensures consistent connection management, proper cleanup, and comprehensive monitoring.

## Key Features

- **V69 Endpoints**: All WebSocket hooks use the same endpoint pattern (`/api/v69/ws/{service}`)
- **Connection Tracking**: Active connections are tracked via `window.DDActiveWebSockets`
- **Proper Cleanup**: All hooks expose a `close()` method for explicit cleanup
- **Comprehensive Logging**: Consistent log format and debug events for monitoring
- **Error Handling**: Consistent approach to error handling with exponential backoff

## WebSocket Hook Structure

All WebSocket hooks follow this standard pattern:

```typescript
const useServiceWebSocket = (params) => {
  // 1. Setup state and refs
  const wsRef = useRef<ReturnType<typeof useBaseWebSocket> | null>(null);
  
  // 2. Define message handler
  const handleMessage = (message) => {
    // Process messages from server
  };
  
  // 3. Initialize WebSocket with baseWebSocket
  const baseWsHook = useBaseWebSocket({
    url: WS_URL,
    endpoint: `/api/v69/ws/service`,
    socketType: "service",
    onMessage: handleMessage,
    // ...other options
  });
  
  // 4. Store hook reference for cleanup
  wsRef.current = baseWsHook;
  
  // 5. Update connection tracking
  useEffect(() => {
    // Increment counter on mount
    window.DDActiveWebSockets.service++;
    
    // Decrement counter on unmount
    return () => {
      window.DDActiveWebSockets.service--;
      
      // Ensure WebSocket is closed
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);
  
  // 6. Return the hook API with explicit close method
  return {
    ...baseWsHook,
    close: () => {
      if (wsRef.current) {
        wsRef.current.close();
        
        // Update connection counter on manual close
        window.DDActiveWebSockets.service--;
      }
    }
  };
};
```

## Monitoring

WebSocket connections can be monitored through:

1. **WebSocket Monitor Component**: Available in admin tools, provides real-time view of connections
2. **Console Logging**: Each connection logs its lifecycle events with consistent format
3. **Custom Events**: `ws-debug` events are dispatched for monitoring

## Connection Tracking

The `window.DDActiveWebSockets` object tracks active connections by type:

```javascript
window.DDActiveWebSockets = {
  total: 5,        // Total active connections
  portfolio: 1,    // Active portfolio WebSockets
  token: 1,        // Active token WebSockets
  market: 1,       // Active market WebSockets
  achievement: 1,  // Active achievement WebSockets
  contest: 1       // Active contest WebSockets
};
```

This allows monitoring orphaned connections that weren't properly closed.

## Debug Events

WebSocket hooks dispatch custom events for monitoring:

```javascript
window.dispatchEvent(
  new CustomEvent("ws-debug", {
    detail: {
      type: "connection",          // Event type (connection, message, error, close)
      socketType: "portfolio",     // WebSocket type
      endpoint: "/api/v69/ws/portfolio",
      timestamp: new Date().toISOString(),
      data: { /* Additional debug data */ }
    },
  })
);
```

## Utility Functions

The `wsMonitor.ts` utility provides helper functions:

- `trackWebSocketConnection(type)`: Track new connection
- `untrackWebSocketConnection(type)`: Untrack closed connection
- `getAllWebSocketCounts()`: Get counts of all connection types
- `resetWebSocketTracking()`: Reset tracking (for debugging)
- `dispatchWebSocketEvent(type, data)`: Dispatch debug event

## Component Integration

Components using WebSocket hooks should:

1. Call `close()` in cleanup function
2. Avoid keeping references to old WebSocket connections
3. Ensure WebSocket connections are properly managed during component lifecycle

Example:

```tsx
const MyComponent = () => {
  const wsHook = useServiceWebSocket();
  
  useEffect(() => {
    // Component mount logic
    
    return () => {
      // Component cleanup
      wsHook.close();
    };
  }, []);
  
  return <div>My Component</div>;
};
```

## Global WebSocket Management

The `WebSocketManager` component manages application-level WebSocket connections:

1. Core connections are initialized on app mount
2. All connections are properly closed on app unmount
3. Connections are only established when needed

## Troubleshooting

If orphaned connections are detected:

1. Check the WebSocket Monitor to identify which connection types are orphaned
2. Ensure components are calling `close()` in cleanup functions
3. Check that proper dependencies are specified in effect hooks
4. Verify that routing doesn't cause premature unmounting

## V69 Migration Checklist

- [x] Update all WebSocket hooks to use V69 endpoints
- [x] Implement connection tracking for all hook types
- [x] Ensure all hooks expose close() method
- [x] Add consistent logging across all hooks
- [x] Create WebSocketMonitor component for debugging
- [x] Update WebSocketManager to use centralized utilities
- [x] Document standardization approach
- [x] Standardize all WebSocket hooks (April 10, 2025)

## Standardized WebSocket Hooks

All WebSocket hooks have been standardized to follow the V69 pattern:

| Original Hook | Standardized Hook | Status |
|---------------|-------------------|--------|
| useTokenDataWebSocket | useTokenData | ✅ Complete |
| useMarketDataWebSocket | useMarketData | ✅ Complete |
| useContestWebSocket | useContests | ✅ Complete |
| useContestChatWebSocket | useContestChat | ✅ Complete |
| usePortfolioWebSocket | usePortfolio | ✅ Complete |
| useWalletWebSocket | useWallet | ✅ Complete |
| useAchievementWebSocket | useAchievements | ✅ Complete |
| useNotificationWebSocket | useNotifications | ✅ Complete |
| useServerStatusWebSocket | useServerStatus | ✅ Complete |
| useSystemSettingsWebSocket | useSystemSettings | ✅ Complete |
| useAnalyticsWebSocket | useAnalytics | ✅ Complete |
| useSkyDuelWebSocket | useSkyDuel | ✅ Complete |
| useCircuitBreakerSocket | useCircuitBreaker | ✅ Complete |
| useServiceWebSocket | useService | ✅ Complete |
| useRPCBenchmarkWebSocket | useRPCBenchmark | ✅ Complete |
| N/A (New) | useTerminalData | ✅ Complete |

All standardized hooks are located in `/src/hooks/websocket/topic-hooks/` and use the unified WebSocket system through `useUnifiedWebSocket`.