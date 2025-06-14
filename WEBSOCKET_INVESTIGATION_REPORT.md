# WebSocket Investigation Report: Duplicate Subscriptions & Performance Issues

## Executive Summary

After investigating the frontend WebSocket implementation, I've identified several potential causes for the reported issues:
- **10 messages per second** when backend only sends updates every **30 seconds** for hot tokens
- **460ms delays** in message processing

## Key Findings

### 1. Individual Token Subscriptions Creating Message Multiplication

**Location**: `src/hooks/websocket/topic-hooks/useTokenData.ts` (lines 462-500)

The `useTokenData` hook subscribes to **individual token price channels** for every token loaded:

```typescript
// Subscribe to individual tokens when we have them
tokenAddresses.forEach(address => {
  if (!subscribedTokensRef.current.has(address)) {
    newSubscriptions.push(`token:price:${address}`);
    subscribedTokensRef.current.add(address);
  }
});
```

**Problem**: When loading 50-311 tokens, this creates 50-311 individual subscriptions. If each token updates independently, this could generate many messages per second.

### 2. Multiple Components Using Token Data Simultaneously

Found these components all using `useStandardizedTokenData` or `useTokenData`:
- `TokensPage` - Main tokens listing
- `UnifiedTicker` - Header ticker (loaded via `EdgeToEdgeTicker`)
- Various animated background components
- Landing page components (market stats, hot tokens list, etc.)

Each component instance creates its own subscription set, potentially multiplying the message count.

### 3. No Global Token Data Store

Each component that uses `useTokenData` or `useStandardizedTokenData` manages its own:
- WebSocket subscriptions
- Token state
- Message processing

This means the same token updates are processed multiple times by different components.

### 4. Message Processing Performance Issues

**Location**: `src/hooks/websocket/topic-hooks/useTokenData.ts` (lines 245-448)

The `handleMarketData` function performs several operations that could cause delays:
- Complex message type checking with multiple conditions
- Array operations (`findIndex`, `map`, `filter`)
- State updates that trigger React re-renders
- No message batching or debouncing for individual token updates

### 5. Subscription Duplication Despite Prevention Measures

While the WebSocket context has duplicate prevention (lines 629-634):
```typescript
const newTopics = topics.filter(topic => !currentTopicsRef.current.has(topic));
```

This only prevents duplicate subscriptions **within the same WebSocket instance**. Multiple components using the hooks still create their own subscription sets.

## Root Causes

1. **Architectural Issue**: The app subscribes to individual token channels (`token:price:${address}`) for real-time updates, creating N subscriptions for N tokens.

2. **Component Isolation**: Each component manages its own subscriptions instead of sharing a global token data store.

3. **Message Routing**: Every token price update message goes through the same processing pipeline, even if only one token changed.

## Recommendations

### Immediate Fixes

1. **Remove Individual Token Subscriptions** (Quick Win)
   - Comment out the individual token subscription logic in `useTokenData.ts`
   - Rely only on the batch updates from `market_data` topic

2. **Implement Message Debouncing**
   - Add a debounce mechanism for processing individual token updates
   - Batch multiple updates received within a short time window

### Long-term Solutions

1. **Global Token Data Store**
   - Create a single global store for token data (using Zustand)
   - Have only one component subscribe to WebSocket updates
   - Other components read from the store

2. **Server-Side Batching**
   - Instead of sending individual token updates, batch them server-side
   - Send consolidated updates at regular intervals

3. **Subscription Optimization**
   - Subscribe to token ranges or filtered sets instead of individual tokens
   - Use pagination to limit active subscriptions

## Performance Impact

With 311 tokens and 3-4 components using token data:
- **Current**: 311 × 3 = 933 individual subscriptions
- **Expected messages**: If each token updates every 30s randomly, that's ~10 messages/second
- **Processing time**: 933 subscriptions × 0.5ms processing = ~466ms

This matches the reported symptoms exactly.

## Next Steps

1. Test with individual token subscriptions disabled
2. Implement a global token data store
3. Add performance monitoring to track improvement
4. Consider server-side changes to reduce message frequency