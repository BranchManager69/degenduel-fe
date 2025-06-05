# Backend Integration Issue: Tokens API Response Format Change

**Date:** December 6, 2024  
**From:** Frontend Team  
**To:** Backend Development Team  
**Subject:** Critical API Response Format Mismatch Breaking Infinity Scroll Functionality

---

## Issue Summary

We've identified a critical integration issue with the `/api/tokens` endpoint that has broken the infinity scroll functionality on the main tokens page. The response format appears to have changed, causing a mismatch between what the frontend expects and what the backend currently provides.

## Current Backend Response Format

**Endpoint:** `GET /api/tokens?limit=50`

**Current Response Structure:**
```json
{
  "data": [
    {
      "id": 1249906,
      "address": "CQQaY9ctTxTzCdhkJWkG5r6Hk9uftcerJwRfguwNgYa4",
      "symbol": "SUGI",
      "name": "Sugi The Dog",
      "decimals": 6,
      "is_active": true,
      "token_prices": {
        "price": "77909.89",
        "updated_at": "2025-06-04T10:29:51.745Z",
        "change_24h": "89139412932",
        "market_cap": "77909891068528"
      }
      // ... other token fields
    }
    // ... more tokens
  ]
}
```

## Expected Frontend Response Format

**What the frontend code expects:**
```json
{
  "tokens": [
    // ... token array
  ],
  "pagination": {
    "total": 1500,
    "offset": 0,
    "limit": 50,
    "hasMore": true
  }
}
```

## Impact Analysis

### ✅ What Still Works
- **Basic token display** - Tokens load and display correctly on the page
- **Token data structure** - Individual token objects have the correct fields
- **DUEL token search** - `/api/tokens/search` endpoint works perfectly
- **Token detail pages** - Individual token data displays properly

### ❌ What's Broken
1. **Infinity scroll completely broken** - Users can only see initial batch of tokens
2. **No pagination metadata** - Frontend has no way to know if more tokens exist
3. **`hasMoreTokens` always false** - Load more trigger never appears
4. **Poor user experience** - Users think there are only ~50 tokens when there are 1000+

### Code Evidence
**Frontend expects pagination:**
```typescript
// In TokensPage.tsx line 267
const hasMoreTokens = pagination?.hasMore ?? false;

// In useStandardizedTokenData.ts 
const { pagination, loadMore } = useTokenData(tokensToSubscribe, backendFilters);
```

**Current backend provides none:**
```bash
curl -s "http://localhost:3004/api/tokens?limit=50" | jq '.pagination'
# Result: null
```

## Historical Context

This appears to be a recent change. The frontend code was originally written expecting:
- Paginated responses with metadata
- Ability to load more tokens progressively  
- Total count and "hasMore" indicators

The current backend response format suggests either:
1. **Pagination was removed/changed** in a recent backend update
2. **Different endpoint** should be used for paginated results
3. **Query parameters missing** to enable pagination mode

## Questions for Backend Team

1. **Was pagination intentionally removed** from `/api/tokens`?
2. **Is there a different endpoint** we should use for paginated token lists?
3. **Are there query parameters** we should include to get pagination metadata?
4. **What's the recommended approach** for loading large token lists (1000+ tokens)?
5. **Should we implement client-side pagination** instead of server-side?

## Proposed Solutions

### Option A: Backend Adds Pagination Metadata (Preferred)
**Backend changes response to:**
```json
{
  "tokens": [...],
  "pagination": {
    "total": 1500,
    "offset": 0, 
    "limit": 50,
    "hasMore": true
  }
}
```

### Option B: Frontend Adapts to Current Format
**Frontend changes to:**
- Remove pagination expectations
- Load all tokens at once or implement client-side pagination
- Adapt to `{data: [...]}` format instead of `{tokens: [...]}`

### Option C: New Paginated Endpoint
**Create dedicated endpoint:**
- `/api/tokens/paginated?offset=0&limit=50` 
- Returns proper pagination metadata
- Maintains backward compatibility

## Technical Details

### Frontend Token Data Hook Chain
```
TokensPage.tsx 
  → useStandardizedTokenData.ts 
    → useTokenData.ts (websocket topic hook)
      → expects pagination metadata
```

### Backend Response Inspection
- **Total tokens available:** 1000+ (confirmed via API test)
- **Current limit:** No limit enforcement visible
- **No pagination params:** offset/limit don't seem to affect response
- **Response size:** Large (all tokens returned at once?)

## Request for Guidance

We need backend team guidance on:

1. **Preferred solution approach** - Should backend add pagination or should frontend adapt?
2. **Timeline** - How quickly can this be addressed?
3. **Breaking changes** - Are there other API format changes we should know about?
4. **Testing coordination** - Can we coordinate testing of pagination fixes?

## User Impact

**Current State:** Users see limited token selection and think that's all available
**Desired State:** Users can scroll through all 1000+ tokens with smooth infinite loading

This is a **high-priority user experience issue** affecting the core tokens browsing functionality.

---

**Contact:** Frontend Development Team  
**Next Steps:** Awaiting backend team response and preferred solution approach

Please let us know how you'd like to proceed with resolving this integration issue.