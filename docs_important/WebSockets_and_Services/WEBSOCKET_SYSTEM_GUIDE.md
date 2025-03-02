# DegenDuel WebSocket System Guide

## Overview

This document provides a comprehensive guide to DegenDuel's WebSocket architecture, implementation, and usage patterns. It serves as the authoritative reference for all WebSocket-related functionality across the application.

## Table of Contents

1. [Architecture](#architecture)
2. [WebSocket Implementations](#websocket-implementations)
3. [Connection Management](#connection-management)
4. [Integration Guide](#integration-guide)
5. [Security & Performance](#security--performance)
6. [Monitoring & Debugging](#monitoring--debugging)
7. [Frontend Proxy Configuration](#frontend-proxy-configuration)
8. [Common Patterns](#common-patterns)
9. [Troubleshooting](#troubleshooting)

## Architecture

### System Overview

DegenDuel uses a hub-and-spoke WebSocket architecture with centralized connection management and specialized hooks for specific service needs:

```
┌────────────────────────────────────────────────────────────────────┐
│                            CLIENT                                  │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      useBaseWebSocket                        │   │
│  │  (manages connection, auth, reconnect, heartbeat, etc.)      │   │
│  └───────────────────────────┬─────────────────────────────────┘   │
│                              │                                      │
│  ┌────────────┬──────────────┼───────────────┬─────────────┬────┐  │
│  │            │              │               │             │    │  │
│  ▼            ▼              ▼               ▼             ▼    ▼  │
│ Market      Portfolio    Achievements      Contest     Services TokenData │
│  Hook         Hook          Hook            Hook         Hook   Hook     │
│                                                                    │
└───────┬──────────┬─────────────┬─────────────┬──────────┬─────────┘
        │          │             │             │          │
        ▼          ▼             ▼             ▼          ▼
┌────────────┐ ┌─────────┐ ┌───────────┐ ┌─────────┐ ┌─────────┐
│Market Svc  │ │Portfolio│ │Achievements│ │ Contest │ │TokenData│
│WebSocket   │ │Service  │ │Service    │ │ Service │ │ Service │
└────────────┘ └─────────┘ └───────────┘ └─────────┘ └─────────┘
```

### Core Principles

1. **Single Connection Per Service**: Each WebSocket service maintains one connection that's shared across the application
2. **Base Layer Abstraction**: The `useBaseWebSocket` hook provides foundational connection management
3. **Domain-Specific Hooks**: Specialized hooks for each service domain (market data, portfolio, etc.)
4. **Event-Based Communication**: Custom browser events are used for cross-component communication
5. **Secure Authentication**: Session token-based WebSocket authentication

## WebSocket Implementations

DegenDuel uses the following WebSocket services:

### Market Data

**Hook**: `useMarketDataWebSocket`  
**Endpoint**: `/v2/ws/market`  
**Purpose**: Real-time price updates, candles, and market statistics  
**Auth Required**: Yes  
**Response Format**: JSON with market updates

### Portfolio

**Hook**: `usePortfolioWebSocket`  
**Endpoint**: `/v2/ws/portfolio`  
**Purpose**: Real-time portfolio updates, positions, and P&L  
**Auth Required**: Yes  
**Response Format**: JSON with portfolio state

### Contest

**Hook**: `useContestWebSocket`  
**Endpoint**: `/v2/ws/contest/:contestId`  
**Purpose**: Contest updates, leaderboard changes, and event notifications  
**Auth Required**: Yes  
**Response Format**: JSON with contest state and events

### Contest Chat

**Hook**: `useContestChatWebSocket`  
**Endpoint**: `/v2/ws/contest`  
**Purpose**: Real-time chat messages for contest participants  
**Auth Required**: Yes  
**Response Format**: JSON with chat messages and room state

### Wallet

**Hook**: `useWalletWebSocket`  
**Endpoint**: `/v2/ws/wallet`  
**Purpose**: Wallet balance updates and transaction notifications  
**Auth Required**: Yes  
**Response Format**: JSON with wallet state

### Achievements

**Hook**: `useAchievementWebSocket`  
**Endpoint**: `/v2/ws/achievements`  
**Purpose**: Achievement unlocks and progress updates  
**Auth Required**: Yes  
**Response Format**: JSON with achievement events

### SkyDuel Admin

**Hook**: `useSkyDuelWebSocket`  
**Endpoint**: `/api/admin/skyduel`  
**Purpose**: Admin-only service monitoring and control  
**Auth Required**: Yes (Admin)  
**Response Format**: JSON with service state

### Circuit Breaker

**Hook**: `useCircuitBreakerSocket`  
**Endpoint**: `/api/admin/circuit-breaker`  
**Purpose**: Admin-only circuit breaker monitoring  
**Auth Required**: Yes (Admin)  
**Response Format**: JSON with circuit breaker state

### Services Admin

**Hook**: `useServiceWebSocket`  
**Endpoint**: `/api/admin/services`  
**Purpose**: Admin-only service monitoring  
**Auth Required**: Yes (Admin)  
**Response Format**: JSON with services state

### Analytics

**Hook**: `useAnalyticsWebSocket`  
**Endpoint**: `/analytics`  
**Purpose**: Admin-only analytics data  
**Auth Required**: Yes (Admin)  
**Response Format**: JSON with analytics data

### Token Data

**Hook**: `useTokenDataWebSocket`  
**Endpoint**: `/api/v2/ws/tokenData`  
**Purpose**: Real-time token price and market data for the entire application  
**Auth Required**: Optional  
**Response Format**: JSON with token data updates

## Connection Management

### Base WebSocket Hook

The foundation of our WebSocket architecture is the `useBaseWebSocket` hook, which provides:

- Connection establishment and maintenance
- Authentication via the session token
- Automatic reconnection with exponential backoff
- Heartbeat mechanism to keep connections alive
- Error handling and connection status tracking
- Message event dispatching

```typescript
// Basic usage of useBaseWebSocket
const webSocket = useBaseWebSocket({
  url: import.meta.env.VITE_WS_URL,
  endpoint: "/v2/ws/market",
  socketType: "market",
  onMessage: handleMessage,
  onError: handleError,
  onReconnect: handleReconnect,
  heartbeatInterval: 30000,
  maxReconnectAttempts: 5,
  reconnectBackoff: true,
});
```

### Authentication

WebSocket connections are authenticated using the session token as the WebSocket protocol:

```typescript
const ws = new WebSocket(
  `${config.url}${config.endpoint}`,
  user.session_token
);
```

### Reconnection Strategy

The base WebSocket hook implements exponential backoff for reconnection attempts:

```typescript
const delay = Math.min(
  1000 * Math.pow(2, reconnectAttempts.current),
  30000 // Max delay of 30 seconds
);
reconnectAttempts.current++;
setTimeout(connect, delay);
```

### Heartbeat Mechanism

To prevent connection timeouts, the system implements a heartbeat system:

```typescript
if (config.heartbeatInterval) {
  const interval = setInterval(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "ping",
          timestamp: new Date().toISOString(),
        })
      );
    }
  }, config.heartbeatInterval);
  
  return () => clearInterval(interval);
}
```

## Integration Guide

### Creating a New WebSocket Hook

To create a new hook for a specific WebSocket service:

1. **Create a new hook file**:

```typescript
// useYourServiceWebSocket.ts
import { useRef } from "react";
import { useStore } from "../store/useStore";
import { useBaseWebSocket } from "./useBaseWebSocket";

export const useYourServiceWebSocket = () => {
  const { updateYourServiceState } = useStore();
  const reconnectAttempts = useRef(0);

  const handleMessage = (message: any) => {
    // Process messages from the WebSocket
    // Update your store or local state
  };

  const handleError = (error: Error) => {
    // Handle connection errors
  };

  const handleReconnect = () => {
    // Handle successful reconnection
    reconnectAttempts.current = 0;
  };

  const webSocket = useBaseWebSocket({
    url: import.meta.env.VITE_WS_URL,
    endpoint: "/your-service-endpoint",
    socketType: "your-service",
    onMessage: handleMessage,
    onError: handleError,
    onReconnect: handleReconnect,
    heartbeatInterval: 15000,
  });

  return {
    ...webSocket,
    // Add any service-specific methods
  };
};
```

2. **Create a component to use your hook**:

```tsx
import React, { useEffect } from "react";
import { useYourServiceWebSocket } from "../hooks/useYourServiceWebSocket";
import { useStore } from "../store/useStore";

export const YourServiceComponent: React.FC = () => {
  const { status, connect } = useYourServiceWebSocket();
  const { yourServiceState } = useStore();

  useEffect(() => {
    // Connect when component mounts
    connect();
    // WebSocket connection will be closed when component unmounts
  }, [connect]);

  return (
    <div>
      <p>Connection status: {status}</p>
      {/* Render your component with data from the store */}
    </div>
  );
};
```

### Using WebSocket Debug Events

You can debug WebSocket events using the global event system:

```typescript
// Listen for WebSocket debug events
useEffect(() => {
  const handleDebugEvent = (event: CustomEvent) => {
    console.log("WebSocket Debug:", event.detail);
  };
  
  window.addEventListener("ws-debug", handleDebugEvent as EventListener);
  return () => {
    window.removeEventListener("ws-debug", handleDebugEvent as EventListener);
  };
}, []);

// Dispatch a debug event
window.dispatchEvent(
  new CustomEvent("ws-debug", {
    detail: {
      type: "message", // or "connection", "error", etc.
      socketType: "your-service",
      data: yourData,
      timestamp: new Date().toISOString(),
    },
  })
);
```

## Security & Performance

### Security Considerations

1. **Authentication**: All WebSockets use secure session token authentication
2. **HTTPS/WSS**: Only secure WebSocket connections (WSS) are used
3. **Error Sanitization**: Errors are sanitized before being displayed to users
4. **Rate Limiting**: Message sending is rate-limited to prevent abuse
5. **Authorization Checks**: Admin WebSockets verify user roles

### Performance Optimization

1. **Shared Connections**: One WebSocket connection per service type
2. **Minimal Payload**: Message payloads are kept as small as possible
3. **Selective Updates**: Components receive only the data they need
4. **Reconnection Backoff**: Exponential backoff prevents server hammering
5. **Connection Pooling**: Backend implements WebSocket connection pooling

## Monitoring & Debugging

### ConnectionDebugger

The `ConnectionDebugger` provides a comprehensive debugging interface for WebSocket connections, available at `/connection-debugger`. It includes:

1. **Connection Status**: Real-time status of all WebSocket connections
2. **Message Testing**: Interface to send test messages to WebSocket endpoints
3. **Live Monitor**: Real-time view of all WebSocket messages with filtering

![ConnectionDebugger](https://via.placeholder.com/800x400?text=ConnectionDebugger)

### ServiceCommandCenter

For admin users, the `ServiceCommandCenter` provides advanced service monitoring and control, available at `/superadmin/service-command-center`. It includes:

1. **Service Status**: Visual representation of service health and metrics
2. **Service Control**: Start, stop, and restart service capabilities
3. **Dependency Visualization**: Interactive graph of service dependencies 
4. **Performance Metrics**: Real-time service performance monitoring

![ServiceCommandCenter](https://via.placeholder.com/800x400?text=ServiceCommandCenter)

### WebSocketMonitor Component

The `WebSocketMonitor` component can be included in any page to provide WebSocket debugging:

```tsx
import { WebSocketMonitor } from "../components/debug/WebSocketMonitor";

// In your component:
<div className="debug-panel">
  <WebSocketMonitor />
</div>
```

## Frontend Proxy Configuration

### Vite Proxy Configuration

For local development, all WebSocket endpoints must be properly configured in `vite.config.ts`:

```typescript
// Proxy configuration in vite.config.ts
{
  "/api/v2/ws": {
    target: "wss://dev.degenduel.me",
    ws: true,
    changeOrigin: true,
    secure: true,
  },
  "/v2/ws/contest": {
    target: "wss://dev.degenduel.me",
    ws: true,
    changeOrigin: true,
    secure: true,
  },
  // ... other WebSocket endpoints
}
```

### Environment Configuration

WebSocket URLs are configured through environment variables:

- `.env.development`: Development environment settings
- `.env.production`: Production environment settings
- `.env.local`: Local development overrides

The main WebSocket URL is specified using:

```
VITE_WS_URL=wss://dev.degenduel.me
```

## Common Patterns

### State Synchronization

WebSockets are primarily used for state synchronization with the server. The typical pattern is:

1. User performs an action (e.g., places a trade)
2. Action is sent to the server via REST API
3. Server processes the action and broadcasts updates
4. WebSocket receives update and syncs the client state

### Subscription Management

Some WebSockets support topic subscription:

```typescript
// Subscribe to specific topics
webSocket.send(JSON.stringify({
  type: "subscribe",
  topics: ["BTC", "ETH", "SOL"],
}));

// Unsubscribe from topics
webSocket.send(JSON.stringify({
  type: "unsubscribe",
  topics: ["BTC"],
}));
```

### Error Handling

Standard error handling pattern:

```typescript
try {
  // WebSocket operations
} catch (error) {
  // Log error
  console.error("[WebSocket] Error:", error);
  
  // Dispatch debug event
  window.dispatchEvent(
    new CustomEvent("ws-debug", {
      detail: {
        type: "error",
        socketType: "your-service",
        data: error,
        timestamp: new Date().toISOString(),
      },
    })
  );
  
  // Update UI
  addAlert("error", "WebSocket connection failed");
}
```

## Troubleshooting

### Common Issues and Solutions

#### Connection Failures

**Symptoms**: WebSocket fails to connect, `status` remains "offline"

**Possible Causes and Solutions**:
- **Authentication Issue**: Ensure user is logged in and has a valid session
- **Network Issue**: Check internet connection
- **Backend Issue**: Verify backend services are running
- **Proxy Issue**: Ensure correct proxy configuration in development
- **CORS Issue**: Check CORS configuration on the server

#### Message Not Received

**Symptoms**: Actions on the server don't update the client state

**Possible Causes and Solutions**:
- **Connection Lost**: Check WebSocket connection status
- **Message Processing Error**: Inspect debug events for parsing errors
- **Permission Issue**: Verify user has permission to receive the data
- **Topic Subscription Issue**: Ensure proper topic subscription

#### Excessive Reconnections

**Symptoms**: WebSocket repeatedly disconnects and reconnects

**Possible Causes and Solutions**:
- **Network Instability**: Check network connection
- **Server Overload**: Backend may be dropping connections
- **Heartbeat Issue**: Check heartbeat mechanism and timing
- **Firewall/Proxy**: Network infrastructure may be dropping idle connections

#### Development Environment Issues

**Symptoms**: WebSockets work in production but not in development

**Possible Causes and Solutions**:
- **Missing Proxy Config**: Ensure all endpoints are correctly configured in vite.config.ts
- **HTTPS/WSS**: Development may be using HTTP instead of HTTPS
- **Environment Variables**: Verify correct environment variables

### Debugging Techniques

1. **Use the ConnectionDebugger**: Navigate to `/connection-debugger` to inspect connections
2. **Check Browser Console**: Look for WebSocket errors in browser console
3. **Enable WebSocket Debugging**: Use browser dev tools Network tab, filter for WS
4. **Add Debug Events**: Insert custom debug events in your WebSocket hooks
5. **Try Direct Connection**: Test connecting directly to WebSocket URL to bypass frontend

---

## Document Information

**Author**: DegenDuel Engineering Team  
**Last Updated**: February 27, 2025  
**Version**: 1.0.0

*All other WebSocket documentation should be considered deprecated in favor of this comprehensive guide.*