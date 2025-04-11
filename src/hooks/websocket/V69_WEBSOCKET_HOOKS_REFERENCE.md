# DegenDuel v69 WebSocket Hooks Reference

This document serves as a reference for the standardized v69 WebSocket hooks in the DegenDuel frontend application. All hooks follow a consistent pattern using the unified WebSocket system.

## Overview

The v69 WebSocket system provides a standardized approach to real-time data communication using a single WebSocket connection with topic-based subscriptions. This system offers:

- Single connection for all data types
- Consistent authentication
- Standardized message formats
- Efficient resource usage
- Comprehensive monitoring

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

## Standard Hook Pattern

All hooks follow this standardized pattern:

```typescript
export function useHookName(params) {
  // State management
  const [data, setData] = useState(defaultData);
  const [isLoading, setIsLoading] = useState(true);
  
  // Message handler
  const handleMessage = useCallback((message) => {
    // Process messages based on type, topic, subtype, and action
  }, [dependencies]);
  
  // Connect to WebSocket
  const ws = useUnifiedWebSocket(
    'hook-identifier',
    [MessageType.DATA, MessageType.ERROR],
    handleMessage,
    [TopicType.TOPIC1, TopicType.TOPIC2]
  );
  
  // Initial data request
  useEffect(() => {
    if (ws.isConnected) {
      ws.request(TopicType.TOPIC, 'get_data', params);
    }
  }, [ws.isConnected, params]);
  
  // Handle loading timeout
  useEffect(() => {
    // Reset loading state after timeout
  }, [isLoading]);
  
  // Return hook API
  return {
    data,
    isLoading,
    isConnected: ws.isConnected,
    error: ws.error,
    // Additional functionality
  };
}
```

## Standard Message Format

The v69 WebSocket system uses a standardized message format for all topics:

```json
{
  "type": "DATA",
  "topic": "topic-name",
  "subtype": "category",
  "action": "action-name",
  "data": {
    // Topic-specific payload
  },
  "timestamp": "2025-04-10T12:34:56.789Z"
}
```

All hooks process messages with consistent type, topic, subtype, and action properties.

## Authentication

Hooks requiring authentication use the standard WebSocket authentication system. The `useUnifiedWebSocket` hook handles authentication tokens automatically through the global store.

## Usage Examples

See the `README.md` file in this directory for detailed usage examples of each hook.

## Migration from Legacy Hooks

Legacy hooks (e.g., `useTokenDataWebSocket`) are still available but marked as deprecated. New components should use the standardized hooks from `/hooks/websocket/topic-hooks/`.

## Implementation Status

All WebSocket hooks have been standardized as of April 10, 2025.

## Troubleshooting

If you encounter issues with WebSocket connections:

1. Check connection status with `isConnected` property
2. Verify authentication for protected topics
3. Check for errors in the `error` property
4. Use the WebSocket Monitor component for debugging

## Resources

- WebSocket API Documentation: `/docs/WEBSOCKET_UNIFIED_SYSTEM.md`
- WebSocket Standardization Guide: `/docs/docs_important/WebSockets_and_Services/_v69_WEBSOCKET_STANDARDIZATION.md`
- Implementation Progress: `/docs/docs_critical/_WEBSOCKET_OVERHAUL_PROGRESS.md`