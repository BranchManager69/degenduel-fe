# DegenDuel Unified WebSocket System

## Overview

The DegenDuel frontend uses a unified WebSocket system that consolidates all real-time data connections into a single WebSocket connection. This approach reduces overhead and simplifies the data handling architecture.

## Key Components

1. **WebSocketManager**: (src/hooks/websocket/WebSocketManager.tsx)
   - Core component that manages a single WebSocket connection
   - Handles authentication, reconnection, and message distribution
   - Maintains a registry of message listeners
   - Separates public and authenticated topics

2. **useWebSocketTopic**: (src/hooks/websocket/useWebSocketTopic.ts)
   - Hook for interacting with a specific topic on the WebSocket
   - Handles subscription and message filtering
   - Provides connection state information

3. **Topic-specific hooks**: (src/hooks/websocket/*)
   - Built on top of useWebSocketTopic for specific data types
   - Examples: useTokenDataWebSocket, useContestWebSocket, etc.

4. **TokenDataContext**: (src/contexts/TokenDataContext.tsx)
   - Context provider for token data from WebSocket
   - Ensures data consistency across the application

5. **WebSocketMonitor**: (src/hooks/useWebSocketMonitor.ts)
   - Tracks WebSocket connection state, authentication status, and performance metrics
   - Used by debug components to provide detailed diagnostic information

## Authentication Flow

The WebSocket system now implements a robust authentication approach:

1. Initial connection is established without authentication
2. Authentication attempt is made using available token(s)
3. If authentication succeeds:
   - Full access to all topics (public and private) is granted
   - Connection state is set to 'authenticated'
   - User-specific data flows through the WebSocket

4. If authentication fails:
   - Connection remains open in 'connected' state
   - Public data (like token prices) continues to flow
   - Restricted topics are unavailable
   - Components display appropriate information for unauthenticated users
   - Debug components show "Public Only" authentication status

### Token Priority

The system tries multiple token types in this order:
1. WebSocket token (wsToken)
2. JWT token (jwt)
3. Session token (session_token)

## Common Issues and Solutions

### "Empty ticker" or "No data showing"

If the UnifiedTicker component appears empty or broken:

1. **Connection issues**: 
   - Check browser console for WebSocket connection errors
   - Verify the WebSocket endpoint in the environment configuration
   - Try refreshing the data with the refresh button in the ticker

2. **Data not arriving**: 
   - Ensure the backend services are running
   - Check if market data microservice is operational
   - Verify public data access is enabled for unauthenticated users

3. **WebSocket closed unexpectedly**:
   - Look for network interruptions
   - Check if backend enforces timeouts or connection limits

### WebSocket Authentication Issues

1. **Invalid authentication token**:
   - This error no longer prevents public data from flowing
   - System automatically operates in "public data mode" when authentication fails
   - No user intervention required for public data access

2. **Missing or expired tokens**: 
   - Verify user has valid tokens (wsToken, jwt, or sessionToken)
   - Check AuthContext and user state for proper token storage
   - System will maintain connection for public data even with invalid tokens

3. **Failed subscription to restricted topics**:
   - Check if authentication token is sent with subscription message
   - Verify backend permissions for the required topics
   - Debug components will show "Public Only" if restricted topics are unavailable

### Performance Considerations

1. **Message volume**: 
   - High-frequency data can cause performance issues
   - Consider throttling WebSocket messages on the backend
   - Debug components now show message rate per second

2. **Connection management**:
   - The system automatically handles reconnection with exponential backoff
   - Heartbeat checks occur every 30 seconds
   - Connection states are now more precise: connecting, connected, authenticated, reconnecting, error

## Debugging Tools

1. **Enhanced WebSocket debug components**: 
   - **TokenDataDebug**: Shows detailed connection state, authentication status, and message statistics
   - **UnifiedWebSocketMonitor**: For general WebSocket debugging

2. **WebSocketMonitor Hook**:
   - New useWebSocketMonitor hook provides detailed metrics
   - Tracks message counts, rates, and authentication status
   - Detects and displays authentication errors without disrupting connection

3. **Visual Indicators**:
   - Color-coded connection status (green for connected, yellow for connecting, red for errors)
   - Authentication status badges show whether operating in full or public-only mode
   - Message rate counters show real-time WebSocket activity

4. **Browser tools**:
   - Chrome/Firefox Network tab > WS filter to monitor WebSocket traffic
   - Look for the single connection to /api/v69/ws

## Adding New WebSocket Functionality

When adding new functionality:

1. Determine if the topic requires authentication:
   - Public topics work for all users
   - Restricted topics require successful authentication

2. Create a new topic-specific hook in src/hooks/websocket/
   - Build it on top of useWebSocketTopic
   - Follow the pattern of existing hooks like useTokenDataWebSocket
   - Make sure to handle both authenticated and unauthenticated states

3. Add the new topic to TopicType enum in WebSocketManager if needed

4. Consider implementing fallback behavior for unauthenticated users

## Troubleshooting Steps for Users

If users report empty or non-functional components that rely on WebSocket data:

1. Ask them to try the refresh button in the component
2. Have them reload the page if refresh doesn't work
3. Check if issue is isolated to one user (auth issue) or all users (service issue)
4. For authentication issues, check if they can at least see public data
5. Use TokenDataDebug component to diagnose specific connection problems
6. Verify backend services are operational

## Error Handling Summary

1. **Connection Failures**:
   - Automatic reconnection with exponential backoff
   - Clear visual indicators for users
   - Detailed error information in debug components

2. **Authentication Failures**:
   - Continue providing public data
   - Display appropriate UI for unauthenticated state
   - Log detailed diagnostics for debugging
   
3. **Data Refreshing**:
   - Manual refresh button provides direct control
   - Automatic periodic refreshes maintain data freshness
   - Visual feedback during refresh operations