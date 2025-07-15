# Token Fetching Approaches Analysis

## Overview
The DegenDuel frontend implements multiple token-fetching strategies, each optimized for different use cases. Here's a comprehensive analysis of the approaches found in the codebase.

## 1. `useBatchTokens` - Efficient Batch Fetching
**Location**: `/src/hooks/websocket/topic-hooks/useBatchTokens.ts`

### Purpose
- Fetches multiple specific tokens in a single REST request
- Subscribes to individual WebSocket updates for each token
- ~98% bandwidth reduction compared to market-data topic

### Key Features
- **REST Endpoint**: `/api/v2/tokens/prices/batch` (POST)
- **Input**: Array of token addresses
- **Output**: Map of token address → price data
- **WebSocket**: Individual `token:price:{address}` subscriptions
- **Use Case**: When you need specific tokens (e.g., DUEL, SOL, USDC, WBTC)

### Architecture
```typescript
// 1. Batch fetch price data
POST /api/v2/tokens/prices/batch
Body: { addresses: ['address1', 'address2'] }

// 2. Fetch full token details individually
GET /api/tokens/{address}

// 3. Subscribe to individual updates
WS: token:price:{address}
```

### Pros
- Minimal bandwidth usage
- Targeted subscriptions
- Efficient for known token sets
- No unnecessary data transfer

### Cons
- Requires two-step process (prices then details)
- Not suitable for dynamic/large token lists

## 2. `useTokenData` - Full Market Data with Pagination
**Location**: `/src/hooks/websocket/topic-hooks/useTokenData.ts`

### Purpose
- Professional-grade WebSocket-first token data with pagination
- Used for main token lists and infinite scroll experiences
- Real-time updates for all visible tokens

### Key Features
- **REST Fallback**: `/api/tokens/trending?format=paginated`
- **WebSocket**: `market-data` topic subscription
- **Pagination**: Supports infinite scroll
- **Live Updates**: Can be disabled with `disableLiveUpdates` flag
- **Use Case**: Token listing pages, search results

### Architecture
```typescript
// 1. REST API for initial load
GET /api/tokens/trending?limit=50&offset=0&format=paginated

// 2. WebSocket for real-time updates
WS: market-data (full updates every minute)
WS: market-data with subtype=price_update (price-only every 5 seconds)

// 3. Individual token subscriptions for visible tokens
WS: token:price:{address}
```

### Pros
- Professional trading platform UX
- Seamless pagination
- Real-time price updates
- Fallback to REST if WebSocket fails

### Cons
- Higher bandwidth for market-data subscription
- Complex state management
- May receive updates for tokens not displayed

## 3. `useIndividualToken` - Single Token Focus
**Location**: `/src/hooks/websocket/topic-hooks/useIndividualToken.ts`

### Purpose
- Subscribes to a single token for detailed real-time updates
- Perfect for token detail pages or specific token monitoring

### Key Features
- **REST Endpoint**: `/api/tokens/{address}`
- **WebSocket**: Single `token:price:{address}` subscription
- **Use Case**: Token detail pages, focused token display

### Architecture
```typescript
// 1. Fetch full token data
GET /api/tokens/{address}

// 2. Subscribe to updates
WS: token:price:{address}
```

### Pros
- Minimal bandwidth
- Focused updates
- Simple implementation

### Cons
- Not efficient for multiple tokens
- Requires separate call per token

## 4. `useVisibleTokenSubscriptions` - Dynamic Visible-Only Updates
**Location**: `/src/hooks/websocket/topic-hooks/useVisibleTokenSubscriptions.ts`

### Purpose
- Subscribes only to tokens currently visible on screen
- Dynamically manages subscriptions as user scrolls
- Lightweight alternative to full market data

### Key Features
- **No REST calls** - Works with existing token data
- **WebSocket**: Dynamic `token:price:{address}` subscriptions
- **Use Case**: Optimizing updates for large token lists

### Architecture
```typescript
// Only WebSocket subscriptions
// Subscribes/unsubscribes as tokens enter/leave viewport
WS: token:price:{address} (per visible token)
```

### Pros
- Extremely bandwidth efficient
- Dynamic subscription management
- No wasted updates

### Cons
- Requires external token data source
- Complex subscription management

## 5. `useSpecificTokens` - Known Token Set
**Location**: `/src/hooks/data/useSpecificTokens.ts`

### Purpose
- Fetches specific tokens by filtering from all tokens
- Subscribes to updates for just those tokens

### Key Features
- **REST**: Fetches all tokens then filters client-side
- **WebSocket**: Individual token subscriptions
- **Use Case**: Landing page (DUEL + SOL tokens)

### Limitations
- Inefficient - fetches 2000+ tokens to get 2
- Should be replaced with `useBatchTokens`

## Architectural Patterns

### 1. REST-First with WebSocket Updates
Most hooks follow this pattern:
1. Fetch initial data via REST for immediate display
2. Subscribe to WebSocket for real-time updates
3. Handle reconnection by re-fetching if needed

### 2. WebSocket Message Types
- `market-data` topic with `full_update` - Complete token list (once per minute)
- `market-data` topic with `price_update` - Price-only updates (every 5 seconds)
- `token:price:{address}` - Individual token updates (real-time)

### 3. Bandwidth Optimization Strategies
1. **Batch fetching** - Multiple tokens in one request
2. **Individual subscriptions** - Only subscribe to needed tokens
3. **Visible-only updates** - Subscribe based on viewport
4. **Disable live updates** - Option to turn off WebSocket updates

## Recommendations

### When to Use Each Approach

1. **Use `useBatchTokens` when:**
   - You have a known set of tokens (e.g., portfolio)
   - Bandwidth efficiency is critical
   - You need specific tokens, not all tokens

2. **Use `useTokenData` when:**
   - Building token listing pages
   - Need pagination support
   - Want professional trading platform UX

3. **Use `useIndividualToken` when:**
   - Displaying a single token detail page
   - Need all token fields including metadata

4. **Use `useVisibleTokenSubscriptions` when:**
   - Optimizing existing token lists
   - Have virtualized/windowed lists
   - Want to minimize bandwidth

### Best Practices

1. **Always use REST for initial load** - Don't wait for WebSocket data
2. **Consider bandwidth** - Individual subscriptions are more efficient than market-data
3. **Handle reconnection** - Re-fetch data when WebSocket reconnects
4. **Provide refresh capability** - Users should be able to force refresh
5. **Use appropriate endpoints** - Batch endpoints for multiple tokens

### Performance Considerations

- `market-data` subscription: ~1-2MB every 5 seconds (all tokens)
- Individual subscriptions: ~1-2KB per token update
- Batch fetching: Single request for multiple tokens
- Consider `disableLiveUpdates` for static displays

## Migration Path

For components currently using inefficient patterns:
1. Replace `useSpecificTokens` with `useBatchTokens`
2. Add `useVisibleTokenSubscriptions` to token lists
3. Use `disableLiveUpdates` flag when real-time isn't needed
4. Implement proper error handling and retry logic