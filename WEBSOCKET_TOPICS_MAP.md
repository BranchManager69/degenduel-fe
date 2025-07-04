# DegenDuel WebSocket Topics Complete Reference

This document provides a comprehensive mapping of all WebSocket topics used in the DegenDuel frontend v69 unified WebSocket system.

## 📊 Visual Topic Architecture

```
WebSocket Topics (/api/v69/ws)
│
├── 🌐 Core System Topics
│   ├── system ─────────────── System status, settings, maintenance mode
│   ├── monitor ────────────── WebSocket monitoring and diagnostics
│   ├── server-status ──────── Server health and status updates
│   └── logs ───────────────── Client logging and error reporting
│
├── 📈 Market Data Topics
│   ├── market_data / market-data ── General market data and token updates
│   ├── token-data ─────────────────── Token-specific data streams
│   ├── token-profiles ─────────────── Token profile information
│   └── token:price ────────────────── Batch token price updates
│       └── token:price:{address} ──── Individual token price subscription
│                                      Example: token:price:5hCgFoLE6hW1sRpJKUjjioNS9zJfVDyx5etZ1wvepump
│
├── 👤 User Data Topics (Auth Required)
│   ├── user ───────────────── User profile, stats, achievements, notifications
│   ├── portfolio ──────────── User portfolio data and updates
│   ├── wallet ─────────────── Wallet transactions and data
│   ├── wallet-balance ─────── Wallet balance updates
│   ├── notification ───────── User notifications
│   └── achievement ────────── User achievements
│
├── 🏆 Contest Topics
│   ├── contest ────────────── Contest data, listings, and lifecycle
│   ├── contest-chat ───────── Legacy contest chat (deprecated)
│   ├── leaderboard ────────── Contest leaderboard updates
│   └── contest-chat-{id} ──── Dynamic contest-specific chat
│                              Example: contest-chat-768
│
├── 🛡️ Admin Topics (Admin Auth Required)
│   ├── admin ──────────────── Admin dashboard and analytics
│   ├── analytics ──────────── Platform analytics data
│   ├── circuit-breaker ────── Circuit breaker status
│   ├── service ────────────── Microservice status
│   ├── skyduel / SKYDUEL ──── SkyDuel gaming feature
│   └── liquidity-sim ──────── Liquidity simulation
│
├── 💬 Chat Topics (Dynamic)
│   └── chat-{type}-{id} ───── General chat rooms
│                              Examples: chat-public-main
│                                       chat-private-123
│
└── 🚀 Special Topics
    ├── terminal ───────────── Terminal/console data
    ├── launch_events ──────── Token launch events
    └── test ───────────────── Testing endpoint
```

## 🔌 Topic Subscription Patterns

### Static Topics
Direct string subscriptions:
```typescript
ws.subscribe(['market-data', 'system', 'contest'])
```

### Dynamic Topics
Pattern-based subscriptions with runtime values:
```typescript
// Token price subscription
ws.subscribe([`token:price:${tokenAddress}`])

// Contest chat subscription
ws.subscribe([`contest-chat-${contestId}`])

// General chat room
ws.subscribe([`chat-${roomType}-${roomId}`])
```

## 🪝 Hook-to-Topic Mapping

| Hook | Topics | Auth Required |
|------|--------|---------------|
| `useTokenData` | `market-data`, `token:price:{address}` | No |
| `useWallet` | `wallet`, `wallet-balance` | Yes |
| `useContests` | `contest` | No |
| `useNotifications` | `user` | Yes |
| `useAchievements` | `user` | Yes |
| `usePortfolio` | `portfolio` | Yes |
| `useServerStatus` | `system` | No |
| `useDatabaseStats` | `system` | No |
| `useRPCBenchmark` | `system`, `admin` | Partial |
| `useAnalytics` | `admin` | Yes |
| `useContestScheduler` | `admin` | Yes |
| `useVanityDashboard` | `terminal` | No |
| `useLaunchEvent` | `launch_events`, `system` | No |
| `useContestChat` | `contest-chat-{contestId}` | No |
| `useGeneralChatRoom` | `chat-{roomType}-{roomId}` | No |
| `useContestViewUpdates` | `contest`, `user`, `leaderboard` | Partial |
| `useTokenBalance` | `wallet`, `wallet-balance` | Yes |
| `useSolanaBalance` | `wallet-balance` | Yes |
| `useContestLobbyWebSocket` | `contest` | No |
| `useContestParticipants` | `contest` | No |

## 📦 Message Types by Topic

### Market Data Topics

#### `market-data` / `market_data`
```typescript
{
  type: 'DATA',
  topic: 'market-data',
  subtype: 'tokens' | 'price_update' | 'volume_update',
  data: {
    tokens?: Token[],
    updates?: TokenUpdate[]
  }
}
```

#### `token:price:{address}`
```typescript
{
  type: 'DATA',
  topic: 'token:price:...',
  data: {
    address: string,
    price_sol: number,
    price_usd: number,
    change_24h: number,
    volume_24h: number,
    market_cap: number,
    timestamp: string
  }
}
```

### Contest Topics

#### `contest`
```typescript
{
  type: 'DATA',
  topic: 'contest',
  subtype: 'new' | 'update' | 'cancelled' | 'leaderboard' | 'portfolio_update',
  action?: 'CONTEST_ACTIVITY',
  data: {
    contestId?: number,
    contest?: Contest,
    leaderboard?: LeaderboardEntry[],
    participant?: Participant
  }
}
```

### User Topics

#### `portfolio`
```typescript
{
  type: 'DATA',
  topic: 'portfolio',
  subtype: 'update' | 'trade' | 'performance',
  data: {
    wallet_address: string,
    portfolio: Portfolio,
    trades?: Trade[],
    performance?: PerformanceMetrics
  }
}
```

#### `wallet-balance`
```typescript
{
  type: 'DATA',
  topic: 'wallet-balance',
  data: {
    wallet_address: string,
    sol_balance: number,
    token_balances: TokenBalance[]
  }
}
```

### System Topics

#### `system`
```typescript
{
  type: 'DATA' | 'SYSTEM',
  topic: 'system',
  subtype: 'status' | 'maintenance' | 'settings' | 'stats',
  data: {
    status?: SystemStatus,
    maintenance?: MaintenanceInfo,
    settings?: SystemSettings,
    stats?: DatabaseStats
  }
}
```

## 🔐 Authentication Requirements

### Public Topics (No Auth)
- All market data topics
- Contest viewing topics
- System status topics
- Public chat rooms

### Authenticated Topics (User Auth)
- `user` - Personal data and notifications
- `portfolio` - Portfolio management
- `wallet` - Wallet operations
- `achievement` - Achievement tracking

### Admin Topics (Admin Auth)
- `admin` - Admin dashboard
- `analytics` - Platform analytics
- `circuit-breaker` - System controls
- `service` - Service management

## 🎯 Best Practices

### 1. Topic Subscription
- Subscribe to the minimum required topics
- Use dynamic topics only when necessary
- Batch subscriptions when possible
- Unsubscribe when component unmounts

### 2. Message Handling
- Always check message type and topic
- Handle subtypes appropriately
- Implement error handling for malformed messages
- Use TypeScript discriminated unions

### 3. Performance
- Avoid subscribing to high-frequency topics unnecessarily
- Use `disableLiveUpdates` flag for token data when appropriate
- Implement debouncing for rapid updates
- Consider pagination for large data sets

### 4. Authentication
- Check auth requirements before subscribing
- Handle auth state changes gracefully
- Implement fallback for unauthenticated users
- Clean up authenticated subscriptions on logout

## 📝 Notes

1. **Naming Conventions**: The system supports both snake_case and kebab-case for topic names
2. **Dynamic Topics**: Use template literals for dynamic topic subscriptions
3. **Topic Limits**: No hard limit on subscriptions, but performance degrades with 300+ active topics
4. **Message Order**: Messages are processed in order within each topic
5. **Reconnection**: All subscriptions are automatically restored after reconnection

## 🔄 Migration Notes

The system is transitioning from multiple WebSocket connections to a unified topic-based system (v69). Legacy hooks are maintained for backward compatibility but should be migrated to the new unified approach.

---

*Last Updated: Based on codebase analysis as of the document creation date*
*WebSocket Version: v69*