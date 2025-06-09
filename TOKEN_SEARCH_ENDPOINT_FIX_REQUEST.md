# URGENT: Token Search Endpoint Data Inconsistency

## Issue
The `/api/tokens/search` endpoint returns incomplete token data compared to other token endpoints.

## Current Problem
When searching for DUEL token (or any token), the search endpoint returns:
```json
{
  "address": "F4e7axJDGLk5WpNGEL2ZpxTP9STdk7L9iSoJX7utHHHX",
  "symbol": "DUEL",
  "name": "DegenDuel",
  "current_price": "0.0001897",  // ← INCONSISTENT FIELD NAME
  "market_cap": "192750",
  "volume_24h": "29730",
  "change_24h": "-11.99"
}
```

## Missing Critical Fields
The search endpoint is missing:
- `priceChanges` object (5m, 1h, 6h, 24h changes)
- `transactions` object (buy/sell counts)
- `liquidity`
- `fdv`
- `volumes` object
- `degenduel_score`
- `price` field (uses `current_price` instead)

## Required Fix
The `/api/tokens/search` endpoint should return the EXACT same token structure as:
- `/api/tokens/trending`
- WebSocket `market_data` topic
- All other token endpoints

## Impact
This inconsistency prevents proper display of tokens in the UI, specifically:
- Cannot show 5m/1h price changes
- Cannot show trading activity
- Cannot show liquidity/FDV
- Requires special handling for field name differences

## Priority
HIGH - This affects the tokens page where we need to feature DUEL token with full data.

Please standardize the token data structure across ALL endpoints.## FIX COMPLETED - Mon Jun  9 18:11:20 UTC 2025
The /api/tokens/search endpoint has been updated to resolve all data inconsistencies. Now returns the same comprehensive structure as trending endpoint.
