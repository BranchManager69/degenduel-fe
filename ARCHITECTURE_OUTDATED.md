# DegenDuel Frontend Architecture

This document provides a comprehensive overview of the interconnections between key components in the DegenDuel frontend architecture, focusing on authentication, data flow, and component relationships.

## 1. Core Authentication and Connection System

```
┌───────────────┐       ┌─────────────────────┐
│               │       │                     │
│    useAuth    │◄──────│  useJupiterWallet   │
│               │       │                     │
└─────┬─────────┘       └─────────────────────┘
      │
      │ provides auth status
      ▼
┌─────────────────┐     ┌────────────────────┐
│                 │     │                    │
│  WebSocketCtx   │     │  SolanaConnectCtx  │
│                 │     │                    │
└────────┬────────┘     └──────────┬─────────┘
         │                         │
         │ powers                  │ powers
         ▼                         ▼
┌────────────────┐      ┌───────────────────────┐
│                │      │                       │
│ WS Data Hooks  │      │ Solana Data Hooks     │
│                │      │ (useSolanaTokenData,  │
└────────────────┘      │ useSolanaWalletData)  │
                        │                       │
                        └───────────┬───────────┘
                                    │ uses
                                    ▼
                        ┌───────────────────────┐
                        │                       │
                        │   useSolanaWallet     │
                        │                       │
                        └───────────────────────┘
```

## 2. Data Flow & Component Relationships

```
                  ┌─── App.tsx ───┐
                  │               │
                  │ Provides all  │
                  │ contexts      │
                  └───────┬───────┘
                          │
            ┌─────────────┴─────────────┐
            │                           │
┌───────────▼───────────┐   ┌───────────▼───────────┐
│                       │   │                       │
│  WebSocketContext     │   │  SolanaConnectionCtx  │
│  (real-time data)     │   │  (blockchain access)  │
│                       │   │                       │
└───────────┬───────────┘   └───────────┬───────────┘
            │                           │
            │                           │
┌───────────▼───────────┐   ┌───────────▼───────────┐
│                       │   │                       │
│ WebSocket-based hooks │   │ Solana-based hooks    │
│ (useTokenData, etc.)  │   │ (useSolanaTokenData)  │
│                       │   │                       │
└───────────┬───────────┘   └───────────┬───────────┘
            │                           │
            │                           │
┌───────────▼───────────┐   ┌───────────▼───────────┐
│                       │   │                       │
│ UI Components         │   │ UI Components         │
│ (TokensGrid, etc.)    │   │ (SolanaTokenDisplay)  │
│                       │   │                       │
└───────────────────────┘   └───────────────────────┘
```

## 3. Authentication Flow

```
          User Login
              │
              ▼
┌─────────────────────────┐
│      useAuth Hook       │
│                         │
│ - Manages login state   │
│ - Handles auth methods  │
│ - Provides credentials  │
└───────────┬─────────────┘
            │
┌───────────▼─────────────┐
│  Authentication Sources │
├─────────────────────────┤
│                         │
│ ┌─────────────────────┐ │
│ │ useJupiterWallet    │ │
│ │ (Solana connection) │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ Twitter Auth        │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ Privy Auth          │ │
│ └─────────────────────┘ │
│                         │
└─────────────────────────┘
```

## 4. Data Access System

```
┌────────────────────────────────┐
│       Authentication Hub        │
│                                │
│  ┌─────────────┐               │
│  │   useAuth   │               │
│  └──────┬──────┘               │
│         │                      │
└─────────┼──────────────────────┘
          │
┌─────────▼──────────────────────┐
│    Connection Providers         │
│                                │
│  ┌─────────────┐ ┌───────────┐ │
│  │ WebSocketCtx│ │SolanaCtx  │ │
│  └──────┬──────┘ └─────┬─────┘ │
│         │              │       │
└─────────┼──────────────┼───────┘
          │              │
┌─────────▼──────┐ ┌─────▼───────┐
│ WebSocket      │ │ Blockchain  │
│ Data Layer     │ │ Data Layer  │
│                │ │             │
│ useTokenData   │ │ useSolanaT..│
│ useContestWS   │ │ useSolanaW..│
│ usePortfolioWS │ │             │
└────────────────┘ └─────────────┘
```

## WebSocket Unified System (v69)

The DegenDuel frontend uses a unified WebSocket system (v69) that manages a single WebSocket connection with topic-based subscriptions:

### Connection & Authentication

- **Single Connection**: One WebSocket connection for all data types at `/api/v69/ws`
- **Topic Subscriptions**: Components subscribe to specific data channels
- **Authentication Flow**:
  ```javascript
  // Priority-based authentication
  const authToken = wsToken || jwt || sessionToken;
  
  // Subscribe to restricted topics with auth token
  const message = {
    type: MessageType.SUBSCRIBE,
    topics: [SOCKET_TYPES.PORTFOLIO, SOCKET_TYPES.NOTIFICATION],
    authToken
  };
  ```

### Available Topics

| Topic ID | Description | Authentication |
|----------|-------------|----------------|
| `market-data` | Real-time token prices | No |
| `portfolio` | User portfolio info | Yes |
| `system` | System notifications | No |
| `contest` | Contest updates | Mixed |
| `user` | User profile data | Yes |
| `admin` | Admin functions | Yes (Admin) |
| `wallet` | Wallet information | Yes |
| `skyduel` | Game data | Mixed |

### Hook Implementation

The WebSocket hooks follow a standardized pattern:
```typescript
const useTokenData = (options) => {
  // Connect to unified WebSocket
  const ws = useUnifiedWebSocket(
    'token-data-hook',
    [MessageType.DATA, MessageType.ERROR],
    handleMessage,
    [TopicType.MARKET_DATA, TopicType.TOKEN_DATA]
  );
  
  // Subscribe when connected
  useEffect(() => {
    if (ws.isConnected) {
      ws.subscribe([TopicType.MARKET_DATA]);
      ws.request(TopicType.MARKET_DATA, 'getAllTokens');
    }
  }, [ws.isConnected]);
  
  // Return processed data
  return { tokens, loading, error, refresh };
};
```

## Solana Connection System

The application provides direct blockchain access through a tiered system based on user roles:

### Connection Tiers

- **Public Tier**: Limited access with basic rate limits
- **User Tier**: Standard access with higher limits
- **Admin Tier**: Highest throughput for administrative functions

### Implementation

```typescript
// Connection tier selection
const connectionInfo = useMemo(() => {
  let tier = 'public';
  if (isAdminUser || isSuperAdminUser) {
    tier = 'admin';
  } else if (user) {
    tier = 'user';
  }
  
  const endpoint = tier === 'admin'
    ? `${baseEndpoint}/admin`
    : tier === 'user'
      ? baseEndpoint
      : `${baseEndpoint}/public`;
  
  return new Connection(endpoint, { 
    commitment: 'confirmed' 
  });
}, [isAdminUser, isSuperAdminUser, user]);
```

## Component Integration Examples

### 1. Landing Page Components

Landing page components like `MarketStatsPanel` and `HotTokensList` use WebSocket data for real-time updates:

```typescript
// HotTokensList.tsx
const HotTokensList = () => {
  const { tokens, loading, error } = useTokenData({ 
    filter: 'popular' 
  });
  
  // Component renders tokens with real-time price updates
};
```

### 2. Blockchain Components

Detailed token information comes directly from the blockchain:

```typescript
// SolanaTokenDisplay.tsx
const SolanaTokenDisplay = ({ mintAddress }) => {
  const { tokenData, loading, error } = useSolanaTokenData(mintAddress);
  
  // Component shows on-chain information like supply and decimals
};
```

### 3. Dual Data Source Components

Some advanced components combine both data sources:

```typescript
// TokenDetailModal.tsx
const TokenDetailModal = ({ symbol }) => {
  // Real-time price data from WebSocket
  const { token } = useTokenData({ symbols: [symbol] });
  
  // On-chain details from Solana
  const { tokenData } = useSolanaTokenData(token?.mintAddress);
  
  // Component combines both data sources
};
```

## File Dependency Map

### Core Context Providers

1. **WebSocketContext.tsx**
   - Used by:
     - App.tsx
     - hooks/websocket/useUnifiedWebSocket.ts
     - hooks/useWebSocketMonitor.ts
     - Multiple WebSocket hook files
     - Components using WebSocket data

2. **SolanaConnectionContext.tsx**
   - Used by:
     - hooks/useSolanaWalletData.ts
     - hooks/useSolanaTokenData.ts
     - App.tsx
     - pages/public/general/SolanaBlockchainDemo.tsx

### Authentication Hooks

3. **useAuth.ts**
   - Used by:
     - App.tsx
     - routes/AdminRoute.tsx
     - routes/AuthenticatedRoute.tsx
     - routes/SuperAdminRoute.tsx
     - layout/user-menu/UserMenu.tsx
     - WebSocketContext.tsx
     - SolanaConnectionContext.tsx
     - AuthContext.tsx

4. **useJupiterWallet.ts**
   - Used by:
     - components/auth/ConnectWalletButton.tsx
     - hooks/useAuth.ts

### Solana Integration Hooks

5. **useSolanaWallet.ts**
   - Used by:
     - hooks/useSolanaWalletData.ts
     - stories/SolanaBlinks.stories.tsx
     - pages/public/general/BlinksDemo.tsx
     - components/blinks/* (several components)
     - components/SolanaWalletDisplay.tsx

6. **useSolanaWalletData.ts**
   - Used by:
     - components/SolanaWalletDisplay.tsx
     - (indirectly) pages using SolanaWalletDisplay

7. **useSolanaTokenData.ts**
   - Used by:
     - components/SolanaTokenDisplay.tsx

### UI Components

8. **SolanaTokenDisplay.tsx**
   - Used by:
     - pages/public/general/SolanaBlockchainDemo.tsx
     - pages/authenticated/WalletPage.tsx
     - components/layout/user-menu/UserMenu.tsx

9. **SolanaWalletDisplay.tsx**
   - Used by:
     - pages/public/general/SolanaBlockchainDemo.tsx
     - pages/authenticated/WalletPage.tsx
     - components/layout/user-menu/UserMenu.tsx

10. **UnifiedTicker.tsx**
    - Used by:
      - components/layout/Header.tsx
      - pages/public/general/LandingPage.tsx
    - Combines WebSocket data from multiple topics

## Key Design Insights

1. **Authentication Hub**
   - `useAuth` functions as the central hub for all authentication
   - Supports multiple login methods (wallet, Twitter, Privy)
   - Provides role-based access control
   - Implements token-based authentication for WebSocket connections

2. **Dual Data Sources Pattern**
   - WebSocket system provides fast, real-time market data for lists and tickers
   - Direct Solana connection provides authoritative on-chain data for detailed views
   - Components select the appropriate data source based on their needs:
     - Tickers and lists use WebSockets for responsiveness
     - Detailed token views use direct Solana calls for accuracy
     - Some components combine both sources (WebSocket for price, Solana for supply)

3. **Connection Contexts**
   - `WebSocketContext`: Manages unified WebSocket connection with topic subscriptions
   - `SolanaConnectionContext`: Provides tiered RPC connections based on user roles
   - Both contexts implement defensive programming with error handling and reconnection logic

4. **Data Hook Layers**
   - WebSocket hooks implement standardized topic subscriptions and data transformation
   - Solana hooks provide direct blockchain queries with auto-retry and refresh capabilities
   - Component-specific hooks build on these primitives for specialized functionality

5. **Security & Tier System**
   - Progressive enhancement ensures core functionality works even without authentication
   - Advanced features and personal data require authentication
   - Administrative capabilities require specific role validation at multiple levels

## Architecture Benefits

This architecture provides several benefits:

1. **Performance Optimization**
   - Single WebSocket connection for all real-time data reduces overhead
   - Tiered RPC connections prevent rate limiting and prioritize important operations
   - Connection pooling and resource sharing improves efficiency

2. **Resilience**
   - Defensive programming with extensive error handling
   - Fallback mechanisms when primary data sources fail
   - Auto-reconnection with exponential backoff

3. **Developer Experience**
   - Consistent hook patterns make adding new features straightforward
   - Separation of concerns simplifies maintenance
   - Clear dependency flow makes debugging easier

4. **User Experience**
   - Real-time data for responsive interface
   - Transparent blockchain integration
   - Role-appropriate capabilities

This design allows the app to seamlessly blend real-time WebSocket data with direct blockchain data, while maintaining appropriate security and performance characteristics based on user roles.

## Future Architecture Directions

- Further microservices integration
- Enhanced WebSocket compression
- Circuit breaker patterns for system stability
- Expanded Solana program integration
- Simplified developer onboarding with standardized hook generation