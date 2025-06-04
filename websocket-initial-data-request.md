# WebSocket Market-Data Initial Load Issue

## Current Behavior
When a client subscribes to the `market-data` topic, they don't always receive the current market data immediately. Instead, they have to wait for the next 60-second broadcast cycle, which can leave the UI empty for up to a minute.

## Expected Behavior (Best Practice)
When a client subscribes to any data topic, they should immediately receive the current state of that data. This is a standard WebSocket pattern called "initial state sync" or "snapshot on subscribe".

## Specific Request for `market-data` Topic

When a client sends:
```json
{
  "type": "SUBSCRIBE",
  "topics": ["market-data"]
}
```

The server should immediately respond with:
```json
{
  "type": "DATA",
  "topic": "market-data",
  "data": [/* current filtered token data */]
}
```

Then continue with the regular 60-second broadcast cycle.

## Why This Matters
1. **User Experience**: Users see data immediately instead of a loading spinner for up to 60 seconds
2. **Consistency**: All clients get synchronized data regardless of when they connect
3. **Reduced Support**: Fewer "why is my data not loading" complaints
4. **Industry Standard**: This is how most real-time systems work (Discord, Slack, trading platforms, etc.)

## Implementation Suggestion
In your WebSocket handler for SUBSCRIBE messages:

```javascript
// When client subscribes to market-data
if (topics.includes('market-data')) {
  // Send current market data immediately
  const currentData = await marketDataService.getAllTokens();
  ws.send(JSON.stringify({
    type: 'DATA',
    topic: 'market-data',
    data: currentData
  }));
  
  // Then add them to the broadcast list for future updates
  addToMarketDataBroadcastList(ws);
}
```

## Other Topics That Should Follow This Pattern
- `portfolio` - Send user's current portfolio on subscribe
- `contests` - Send active contests on subscribe
- `system` - Send current system status on subscribe
- Any other stateful topics

This would eliminate the need for frontend workarounds and provide a much better user experience.