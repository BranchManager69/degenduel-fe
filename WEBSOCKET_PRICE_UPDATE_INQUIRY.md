# WebSocket Price Update Inquiry

**To**: DegenDuel Backend Team  
**From**: Frontend Team  
**Date**: January 10, 2025  
**Re**: Real-time Price Updates via WebSocket for Manual Database Changes

Dear Backend Team,

We need clarification on how the WebSocket `market_data` topic handles price updates, specifically for manual database modifications.

## Current Frontend Implementation

Our frontend listens for WebSocket messages with this structure:

```javascript
{
  type: 'DATA',
  topic: 'market_data',
  data: [
    {
      address: "token_contract_address",
      price: 0.123,
      market_cap: 1000000,
      volume_24h: 500000,
      change_24h: 15.5,
      liquidity: 250000,
      fdv: 2000000,
      // ... other token fields
    }
  ]
}
```

When received, we update the following fields in real-time:
- `price`
- `market_cap` / `marketCap`
- `volume_24h` / `volume24h` 
- `change_24h` / `change24h`
- `liquidity`
- `fdv`

## Questions

1. **Manual Database Updates**: If we manually update a token's price in the database (e.g., for testing or corrections), will this trigger a WebSocket broadcast to all connected clients on the `market_data` topic?

2. **Update Source**: Does the WebSocket system differentiate between:
   - External market data updates (from price feeds)
   - Manual database modifications
   - Admin panel updates

3. **Broadcast Mechanism**: What triggers a `market_data` WebSocket broadcast? Is it:
   - Database triggers on price-related columns?
   - Scheduled polling of changed records?
   - Manual emit calls in the backend code?
   - Only external API price updates?

4. **Testing Capability**: Is there an admin endpoint or method we can use to trigger test price updates that will broadcast via WebSocket?

## Use Case

We want to verify that our token detail pages update in real-time during:
- Live market price changes
- Manual price corrections
- Testing scenarios

## Current Behavior

The frontend is fully equipped to handle real-time updates. We just need to understand when and how these updates are triggered on your end.

Could you please provide:
1. Documentation on what triggers `market_data` broadcasts
2. Whether manual DB changes are included
3. Any special considerations or limitations

This will help us properly set expectations for real-time behavior and testing procedures.

Best regards,  
Frontend Team

---

**Note**: The frontend implementation is in `/src/hooks/websocket/topic-hooks/useTokenData.ts` lines 297-366 if you need to review our handler.