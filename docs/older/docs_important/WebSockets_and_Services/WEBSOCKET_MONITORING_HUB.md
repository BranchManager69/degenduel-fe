# [DEPRECATED] WebSocket Monitoring Hub Documentation

> **DEPRECATED**: This document is outdated. Please refer to the new [WebSocket System Guide](./WEBSOCKET_SYSTEM_GUIDE.md) for comprehensive WebSocket documentation.

## Overview

The WebSocket Monitoring Hub provides SuperAdmins with a comprehensive real-time dashboard to monitor and control all WebSocket services within the DegenDuel platform. This system offers detailed metrics, service dependencies visualization, and direct control capabilities.

## System Architecture

### Frontend Components

1. **WebSocketMonitoringHub**
   - Main page component at `/superadmin/websocket-monitoring`
   - Displays service cards, metrics, and overall system health
   - Provides service dependencies visualization
   - Includes transition test functionality for visual testing

2. **WebSocketCard**
   - Visual representation of each WebSocket service
   - Real-time metrics display with 3D visualization
   - Service control buttons (start/stop/restart)
   - Performance indicators and status tracking

3. **WebSocketDebugPanel**
   - Debug console for WebSocket events
   - Log filtering and display
   - Event history tracking

### Backend Integration

The system connects to a dedicated WebSocket endpoint:
```
wss://${window.location.host}/api/superadmin/ws/monitor
```

This endpoint requires SuperAdmin authentication and provides real-time monitoring capabilities.

## Message Protocol

### Client to Server Messages

1. **Get Initial State**
   ```json
   {
     "type": "get_initial_state"
   }
   ```

2. **Service Control**
   ```json
   {
     "type": "service_control",
     "service": "market",
     "action": "start" | "stop" | "restart"
   }
   ```

### Server to Client Messages

1. **Services Status**
   ```json
   {
     "type": "services_status",
     "services": [
       {
         "name": "Market WebSocket",
         "status": "operational" | "degraded" | "error",
         "metrics": {
           "totalConnections": 120,
           "activeSubscriptions": 50,
           "messageCount": 15000,
           "errorCount": 20,
           "cacheHitRate": 95.5,
           "averageLatency": 45,
           "lastUpdate": "2023-11-15T12:34:56Z"
         },
         "performance": {
           "messageRate": 25,
           "errorRate": 0.5,
           "latencyTrend": [45, 48, 42, 44, 45]
         },
         "config": {
           "maxMessageSize": 32768,
           "rateLimit": 60,
           "requireAuth": true
         }
       }
       // ... other services
     ]
   }
   ```

2. **Service Update**
   ```json
   {
     "type": "service_update",
     "service": "Market WebSocket",
     "updates": {
       "status": "operational",
       "metrics": {
         "totalConnections": 125,
         // ... updated metrics
       }
     }
   }
   ```

3. **Alert**
   ```json
   {
     "type": "alert",
     "message": "Circuit Breaker WebSocket service is degraded"
   }
   ```

## Monitored Services

The system monitors these core WebSocket services:

1. **Analytics WebSocket** - User activity and analytics data
2. **Base WebSocket** - Core WebSocket functionality and authentication
3. **Circuit Breaker WebSocket** - Trading circuit breaker status and controls
4. **Contest WebSocket** - Contest updates and participant data
5. **Market WebSocket** - Market data and price updates
6. **Monitor WebSocket** - System monitoring and metrics
7. **Wallet WebSocket** - Wallet updates and transaction tracking
8. **Portfolio WebSocket** - Portfolio updates and performance metrics

## Service Dependencies

The system visualizes these service dependencies:

```
market → base
contest → market, base
portfolio → market, wallet
wallet → base
analytics → market, contest, wallet
monitor → base
circuit-breaker → base
```

## Metrics Description

1. **Connection Metrics**
   - `totalConnections`: Total lifetime connections
   - `activeSubscriptions`: Currently active subscriptions
   - `cacheHitRate`: Percentage of cached responses

2. **Performance Metrics**
   - `messageRate`: Messages processed per second
   - `errorRate`: Percentage of messages resulting in errors
   - `averageLatency`: Average message processing time in milliseconds
   - `latencyTrend`: Recent latency measurements

3. **Volume Metrics**
   - `messageCount`: Total messages processed
   - `errorCount`: Total errors encountered

4. **Configuration Settings**
   - `maxMessageSize`: Maximum allowed message size in bytes
   - `rateLimit`: Maximum messages per minute
   - `requireAuth`: Whether authentication is required

## Service Control

SuperAdmins can perform these actions on each service:

1. **Start** - Activates a stopped service
2. **Stop** - Gracefully stops an active service
3. **Restart** - Stops and restarts a service

## Implementation Requirements

### Backend

1. WebSocket server must authenticate SuperAdmin roles
2. Implement service status monitoring for all WebSocket services
3. Provide comprehensive metrics collection
4. Support service control operations
5. Track and report service dependencies
6. Implement service alerts and notifications

### Frontend

1. Establish secure WebSocket connection
2. Handle authentication and reconnection
3. Process and visualize real-time metrics
4. Provide intuitive service control interface
5. Display service dependencies
6. Show alerts and system status
7. Support visual transition testing

## Security Considerations

1. Only SuperAdmins can access monitoring hub
2. WebSocket connection is secured with WSS
3. Authentication uses HTTP-only secure cookies
4. Service control operations require confirmation
5. Rate limiting prevents abuse
6. Connection closes on unauthorized access with code 4003

## Testing

1. **Visual Transition Testing**
   - Power Up: Service activation simulation
   - Power Down: Service shutdown simulation
   - Degrading: Progressive service degradation
   - Recovering: Service recovery simulation
   - Failing: Service failure simulation
   - Healing: Service healing simulation

2. **Performance Testing**
   - Monitor rendering performance
   - Test with varying metrics loads
   - Verify WebGL fallback functionality

## Error Handling

1. WebGL context loss detection and fallback
2. Connection error recovery
3. Authentication failure handling
4. Service control error feedback
5. Data parsing error management