# DegenDuel Frontend Service Architecture

This document provides a comprehensive reference for the service architecture in the DegenDuel frontend codebase. It outlines the organization, responsibilities, and interactions between various service components.

## Table of Contents

1. [Overview](#overview)
2. [API Services Layer](#api-services-layer)
3. [Higher-Level Services](#higher-level-services)
4. [WebSocket System](#websocket-system)
5. [Integration Patterns](#integration-patterns)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Overview

The DegenDuel frontend uses a multi-layered service architecture:

- **API Services Layer**: Low-level modules for direct API communication (`src/services/api/`)
- **Higher-Level Services Layer**: Business logic on top of API services (`src/services/`)
- **WebSocket System**: Real-time data communication (`src/hooks/use*WebSocket.ts`)

This separation provides several benefits:
- Modularity and maintainability
- Clear separation of concerns
- Reusability across components
- Consistent API access patterns

## API Services Layer

Located in `src/services/api/`, these services handle direct API communication for specific resource types.

### Organization Pattern

Each resource type has its own dedicated file:

```
src/services/api/
├── admin.ts         # Admin operations
├── balance.ts       # User balance operations
├── contests.ts      # Contest management
├── index.ts         # Entry point that exports all API services
├── portfolio.ts     # Portfolio management
├── stats.ts         # User and platform statistics
├── tokens.ts        # Token operations
├── transactions.ts  # Transaction history
├── users.ts         # User management
└── utils.ts         # Shared utilities
```

### Key Service Files

#### `balance.ts`

Handles user balance retrieval:

```typescript
// Simple focused service with environment-aware logging
export const balance = {
  get: async (walletAddress: string): Promise<{ balance: string }> => {
    if (NODE_ENV === "development") {
      console.log("Fetching balance for wallet:", walletAddress);
    }
    
    // Implementation...
  }
};
```

#### `contests.ts`

Manages contest operations:

```typescript
export const contests = {
  getActive: async (): Promise<Contest[]> => { /* ... */ },
  getAll: async (sortOptions?: SortOptions): Promise<Contest[]> => { /* ... */ },
  getContestById: async (id: string): Promise<Contest> => { /* ... */ },
  getParticipants: async (contestId: string): Promise<any[]> => { /* ... */ },
  createContest: async (contestData: any): Promise<Contest> => { /* ... */ },
  // Other methods...
};
```

#### `tokens.ts`

Manages token data:

```typescript
export const tokens = {
  getAll: async (filters?: TokenFilter): Promise<Token[]> => { /* ... */ },
  getTokenDetails: async (id: number): Promise<TokenDetails> => { /* ... */ },
  getTokenPrices: async (ids: number[]): Promise<TokenPrice[]> => { /* ... */ },
  getTokenHistory: async (id: number, period: string): Promise<any[]> => { /* ... */ },
  // Other methods...
};
```

#### `utils.ts`

Provides shared functionality for API services:

```typescript
// API client factory
export const createApiClient = () => {
  return {
    fetch: async (endpoint: string, options: RequestInit = {}) => {
      // Implementation with standard options...
    }
  };
};

// Participation cache
export const checkContestParticipation = async (
  contestId: number | string,
  userWallet?: string
): Promise<boolean> => {
  // Implementation with caching...
};

// Error logging
export const logError = (
  endpoint: string,
  error: any,
  context?: Record<string, any>
) => {
  // Implementation...
};
```

## Higher-Level Services

Located in `src/services/`, these services provide business logic on top of the API services.

### Key Service Files

#### `dd-api.ts`

Central aggregation point for all API services:

```typescript
// Imports all API services
import { admin } from "./api/admin";
import { balance } from "./api/balance";
// Other imports...

// Exports a unified API object
export const ddApi = {
  admin,
  balance,
  contests,
  portfolio,
  stats,
  tokens,
  transactions,
  users,
  // Additional helper methods and utilities
};

// Exports utility functions
export { formatBonusPoints } from "./api/utils";
```

#### `adminService.ts`

Class-based service for administrative operations:

```typescript
class AdminService {
  // Private API client with detailed logging
  private apiClient = {
    fetch: async (endpoint: string, options: RequestInit = {}) => {
      // Implementation with enhanced debugging...
    }
  };

  // Administrative methods
  async getAdminActivities(filters?: AdminActivityFilters): Promise<AdminActivitiesResponse> {
    // Implementation...
  }

  async adjustUserBalance(data: {
    wallet_address: string;
    amount: string;
    reason: string;
  }): Promise<BalanceAdjustmentResponse> {
    // Implementation...
  }
  
  // Other methods...
}
```

#### `contestService.ts`

Focused on contest participation functionality:

```typescript
// Efficient bulk retrieval of user contests
export const getUserContests = async (): Promise<UserContest[]> => {
  // Implementation...
};

// Gets detailed participation information
export const getUserParticipations = async (): Promise<ContestParticipation[]> => {
  // Implementation...
};
```

#### `systemReportsService.ts`

Manages system report generation and retrieval:

```typescript
class SystemReportsService {
  private apiClient = { /* ... */ };

  async getReports(filters: SystemReportFilters = {}): Promise<SystemReportListResponse> {
    // Implementation with query parameters...
  }

  async generateReport(request: GenerateReportRequest): Promise<GenerateReportResponse> {
    // Implementation...
  }
  
  // Report-specific methods
  async getServiceReport(id: string): Promise<ServiceReportResponse> { /* ... */ }
  async getDbReport(id: string): Promise<DbReportResponse> { /* ... */ }
  async getPrismaReport(id: string): Promise<any> { /* ... */ }
}
```

## WebSocket System

The codebase implements a comprehensive WebSocket system for real-time data.

### Base WebSocket Hook

`useBaseWebSocket.ts` provides the foundation for all WebSocket connections:

```typescript
export const useBaseWebSocket = (config: WebSocketConfig) => {
  // Socket reference and state
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  
  // Debugging support
  const dispatchDebugEvent = (type: string, data?: any) => {
    // Implementation...
  };
  
  // Connection management
  useEffect(() => {
    // Authentication check
    if (!user?.session_token) {
      dispatchDebugEvent("error", { message: "No session token available" });
      return;
    }
    
    // Connection setup with authentication and reconnection logic
    // ...
    
    // Cleanup
    return () => {
      // Socket cleanup logic
    };
  }, [config.url, config.endpoint, user?.session_token]);
  
  // Return connection status and methods
  return {
    status,
    sendMessage,
    // Other properties...
  };
};
```

### Specialized WebSocket Hooks

Each data domain has its own dedicated WebSocket hook:

- `useTokenDataWebSocket.ts` - Real-time token price updates
- `useContestWebSocket.ts` - Contest status and updates
- `usePortfolioWebSocket.ts` - Portfolio performance tracking
- `useNotificationWebSocket.ts` - User notifications
- And many others...

Example of a specialized hook:

```typescript
export const useTokenDataWebSocket = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [status, setStatus] = useState<ServiceStatus>("offline");
  
  // Message handler
  const handleMessage = useCallback((data: any) => {
    // Token-specific message processing
    // ...
  }, []);
  
  // Use the base WebSocket hook with specialized configuration
  const wsStatus = useBaseWebSocket({
    url: WS_URL,
    endpoint: "/api/v69/ws/token-data",
    socketType: "token-data",
    onMessage: handleMessage,
    // Other configuration...
  });
  
  // Return specialized interface
  return {
    tokens,
    status: wsStatus.status,
    // Other token-specific properties...
  };
};
```

## Integration Patterns

### Component Integration

Components typically use services through hooks or direct imports:

```typescript
// Direct service import
import { ddApi } from "../../services/dd-api";

const MyComponent = () => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      const result = await ddApi.contests.getActive();
      setData(result);
    };
    
    fetchData();
  }, []);
  
  // Component implementation...
};
```

```typescript
// WebSocket hook usage
import { useTokenDataWebSocket } from "../../hooks/useTokenDataWebSocket";

const PriceDisplay = () => {
  const { tokens, status } = useTokenDataWebSocket();
  
  // Component implementation using real-time token data...
};
```

### State Management Integration

Services interact with global state through the Zustand store:

```typescript
// Get state from store
const { user } = useStore.getState();

// Update state in store
const store = useStore.getState();
store.setUser({ ...data });
```

## Best Practices

### API Service Development

1. **Consistent Error Handling**
   - Use try/catch blocks for all async operations
   - Log errors with context information
   - Return meaningful error messages to callers

2. **Resource Isolation**
   - Each resource type should have its own dedicated file
   - Don't mix concerns between resource types

3. **Caching Strategy**
   - Use caching for frequently accessed data
   - Implement time-based cache invalidation
   - Document caching behavior in comments

4. **Environment Awareness**
   - Use conditional logging based on environment
   - Implement different behavior for dev/prod where appropriate

### WebSocket Development

1. **Message Handling**
   - Define clear message types and structures
   - Handle reconnection gracefully
   - Process messages efficiently

2. **Error Handling**
   - Log connection errors with context
   - Implement progressive reconnection backoff
   - Provide fallback data when connections fail

3. **Performance Optimization**
   - Minimize unnecessary message processing
   - Batch updates when possible
   - Use memoization for handlers

## Troubleshooting

### Common Issues

1. **API Connection Problems**
   - Check authentication (session cookies)
   - Verify correct API URL configuration
   - Ensure proper CORS headers

2. **WebSocket Connection Issues**
   - Verify WebSocket URL configuration
   - Check authentication token validity
   - Look for connection blocked by network policies

3. **Data Sync Problems**
   - Check for stale cached data
   - Verify WebSocket connection status
   - Ensure message handlers are updating state correctly

### Debugging Tools

1. **Console Logging**
   - API services include detailed logging
   - WebSocket connections emit debug events
   - Error details include context information

2. **Network Monitoring**
   - Check browser Network tab for API calls
   - Monitor WebSocket messages in browser devtools
   - Verify proper request/response cycles

3. **Event Monitoring**
   - WebSocket connections dispatch custom events
   - Use event listeners for debugging
   - Monitor state updates after service calls