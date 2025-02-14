# Circuit Breaker System Specification

## Overview

The Circuit Breaker system provides real-time monitoring and protection for DegenDuel's microservices architecture. It includes automatic service protection, performance monitoring, and incident management through a dedicated WebSocket connection and REST API endpoints.

## WebSocket Protocol

### Connection Details

- **Endpoint**: `wss://api.degenduel.me/api/admin/circuit-breaker`
- **Authentication**: Requires admin session token in WebSocket protocol
- **Heartbeat Interval**: 30 seconds
- **Auto-reconnect**: Yes, with exponential backoff

### Message Types

#### Client → Server

```typescript
interface ClientMessage {
  type: "init" | "ping" | "ack" | "config_update";
  timestamp: string;
  data?: {
    service?: string;
    config?: CircuitBreakerConfig;
  };
}
```

#### Server → Client

```typescript
interface ServerMessage {
  type:
    | "health:update"
    | "breaker:trip"
    | "breaker:reset"
    | "incident:new"
    | "metrics:update";
  service?: string;
  timestamp: string;
  data: {
    // Health Update
    status?: "healthy" | "degraded" | "failed";

    // Incident Data
    incident?: {
      id: string;
      type: string;
      severity: "warning" | "critical";
      message: string;
      details?: Record<string, any>;
    };

    // Metrics Data
    metrics?: {
      requestRate: number; // requests per second
      errorRate: number; // percentage
      responseTime: number; // milliseconds
      cpuUsage: number; // percentage
      memoryUsage: number; // bytes
      activeConnections: number;
    };

    // Circuit State
    circuit?: {
      state: "closed" | "open" | "half-open";
      failureCount: number;
      lastFailure: string | null;
      recoveryAttempts: number;
      nextRetryTime?: string;
    };
  };
}
```

### Event Flow

1. Client establishes WebSocket connection with session token
2. Server validates token and accepts connection
3. Client sends 'init' message
4. Server responds with current system state
5. Server pushes updates as they occur
6. Client acknowledges critical updates with 'ack'
7. Both sides maintain connection with ping/pong

## REST API Endpoints

### Circuit Breaker State

\`\`\`
GET /api/admin/circuit-breaker/states
\`\`\`
Returns current state of all service circuit breakers

**Response**:

```typescript
interface CircuitBreakerStates {
  services: {
    [serviceName: string]: {
      status: "healthy" | "degraded" | "failed";
      metrics: {
        requestCount: number;
        errorCount: number;
        lastError: string | null;
        meanResponseTime: number;
        failurePercentage: number;
      };
      circuit: {
        state: "closed" | "open" | "half-open";
        failureCount: number;
        lastFailure: string | null;
        recoveryAttempts: number;
      };
      config: {
        failureThreshold: number;
        recoveryTimeout: number;
        requestLimit: number;
      };
    };
  };
  systemHealth: {
    status: "operational" | "degraded" | "critical";
    activeIncidents: number;
    lastIncident: string | null;
  };
}
```

### Performance Metrics

\`\`\`
GET /api/admin/performance-metrics
\`\`\`
Returns system-wide performance metrics

**Response**:

```typescript
interface PerformanceMetrics {
  timestamp: string;
  overall: {
    requestRate: number;
    errorRate: number;
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
  };
  services: {
    [serviceName: string]: {
      requestCount: number;
      successCount: number;
      errorCount: number;
      meanResponseTime: number;
      maxResponseTime: number;
      minResponseTime: number;
      standardDeviation: number;
    };
  };
}
```

### System Resources

\`\`\`
GET /api/admin/system-resources
\`\`\`
Returns current system resource utilization

**Response**:

```typescript
interface SystemResources {
  timestamp: string;
  cpu: {
    usage: number;
    load: number[];
    temperature?: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    cached: number;
    heapTotal: number;
    heapUsed: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    connectionsOpen: number;
  };
}
```

### Circuit Breaker Configuration

\`\`\`
POST /api/admin/circuit-breaker/{service}/config
\`\`\`
Updates circuit breaker configuration for a service

**Request**:

```typescript
interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  recoveryTimeout: number; // Time in ms before retry
  requestLimit: number; // Rate limit per minute
  monitoringWindow: number; // Time window for failure calculation
  minimumRequests: number; // Minimum requests before triggering
}
```

### Incident Management

\`\`\`
GET /api/admin/circuit-breaker/incidents
\`\`\`
Returns incident history with optional filtering

**Query Parameters**:

- `start_date`: ISO timestamp
- `end_date`: ISO timestamp
- `service`: Service name
- `severity`: 'warning' | 'critical'
- `status`: 'active' | 'resolved'
- `limit`: number
- `offset`: number

**Response**:

```typescript
interface IncidentHistory {
  total: number;
  incidents: Array<{
    id: string;
    service: string;
    type: string;
    severity: "warning" | "critical";
    status: "active" | "resolved";
    message: string;
    startTime: string;
    endTime?: string;
    resolution?: string;
    metrics: {
      requestsFailed: number;
      usersAffected: number;
      duration: number;
    };
  }>;
}
```

### Manual Controls

\`\`\`
POST /api/admin/circuit-breaker/{service}/reset
\`\`\`
Manually resets circuit breaker for a service

**Request**:

```typescript
interface ResetRequest {
  reason: string;
  force?: boolean;
}
```

## Implementation Requirements

### Backend Requirements

1. **Real-time Monitoring**

   - Monitor service health metrics every 5 seconds
   - Track request rates, error rates, and response times
   - Maintain sliding window of performance metrics
   - Calculate statistical measures (mean, p95, p99)

2. **Circuit Breaker Logic**

   - Implement state machine (closed → open → half-open)
   - Track failure thresholds per service
   - Handle recovery attempts with exponential backoff
   - Maintain incident history

3. **Resource Monitoring**

   - Track system resource utilization
   - Monitor memory usage and garbage collection
   - Track network I/O and connections
   - Monitor disk usage and I/O

4. **WebSocket Management**

   - Handle multiple admin connections
   - Implement connection authentication
   - Manage connection lifecycle
   - Handle reconnection scenarios

5. **Data Persistence**
   - Store incident history
   - Maintain configuration
   - Log state changes
   - Archive metrics data

### Security Requirements

1. **Authentication**

   - Require admin session token
   - Validate token on connection
   - Refresh token handling
   - Rate limiting

2. **Authorization**

   - Role-based access control
   - Action logging
   - Audit trail
   - IP whitelisting

3. **Data Protection**
   - Sanitize error messages
   - Encrypt sensitive data
   - Validate input
   - Prevent data leakage

## Error Handling

### WebSocket Errors

```typescript
interface WebSocketError {
  code: number;
  reason: string;
  timestamp: string;
  recoverable: boolean;
  retryAfter?: number;
}
```

### HTTP Error Responses

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId: string;
  };
}
```

## Metrics and Monitoring

### Key Metrics

1. **Service Health**

   - Request success rate
   - Error rate
   - Average response time
   - Circuit breaker state changes

2. **System Resources**

   - CPU utilization
   - Memory usage
   - Network I/O
   - Disk usage

3. **Incidents**
   - Number of active incidents
   - Mean time between failures
   - Mean time to recovery
   - Incident resolution time

### Alerting Thresholds

1. **Warning Levels**

   - Error rate > 5%
   - Response time > 1000ms
   - CPU usage > 70%
   - Memory usage > 80%

2. **Critical Levels**
   - Error rate > 20%
   - Response time > 5000ms
   - CPU usage > 90%
   - Memory usage > 90%

## Migration Plan

1. Deploy WebSocket endpoint
2. Implement basic monitoring
3. Add circuit breaker logic
4. Enable metrics collection
5. Implement incident tracking
6. Enable manual controls
7. Add advanced features

## Testing Requirements

1. Unit tests for circuit breaker logic
2. Integration tests for WebSocket
3. Load testing for metrics collection
4. Chaos testing for failure scenarios
5. Security testing for authentication
