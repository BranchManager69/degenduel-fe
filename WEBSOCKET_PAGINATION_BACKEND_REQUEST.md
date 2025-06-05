# 📨 WebSocket Pagination Backend Implementation Request

**Date:** December 6, 2024  
**From:** Frontend Team  
**To:** Backend Team  
**Subject:** WebSocket `getDegenDuelRanked` Action Implementation

## 🎯 Summary

The frontend has implemented professional WebSocket-based pagination for token data, but we're not receiving responses from the backend for the `getDegenDuelRanked` action. The REST API fallback is working perfectly, but we need the WebSocket implementation to provide the real-time trading platform experience.

## 📡 What Frontend is Sending

```javascript
{
  "type": "REQUEST",
  "topic": "market_data",
  "action": "getDegenDuelRanked",
  "requestId": "uuid-here",
  "data": {
    "limit": 100,
    "offset": 0,
    "format": "paginated"
  }
}
```

## 📥 Expected Response Format

```javascript
{
  "type": "DATA",
  "topic": "market_data",
  "action": "degenDuelRanked",
  "success": true,
  "tokens": [...],        // Array of token objects
  "pagination": {         // Pagination metadata
    "total": 311,
    "limit": 100,
    "offset": 0,
    "hasMore": true
  }
}
```

## ❓ Questions for Backend Team

### 1. **Is `getDegenDuelRanked` Implemented?**
- We're sending WebSocket requests but not getting responses
- Is this action implemented on the backend WebSocket handler?
- If not, when can we expect it to be available?

### 2. **Correct Action Name?**
- Are we using the correct action name: `getDegenDuelRanked`?
- Should it be something else like `getTokensPaginated` or `getRankedTokens`?

### 3. **Message Format Confirmation**
- Is our request format correct?
- Do you need additional fields in the `data` object?
- Should we be using a different `topic` than `market_data`?

### 4. **Authentication Requirements**
- Does this action require authentication?
- Should we include an `authToken` in the request?
- Is it available for public/unauthenticated users?

### 5. **Current Implementation Status**
- Is WebSocket pagination currently live on production?
- Is it only available on dev/staging environments?
- Are there any feature flags we need to enable?

## 🔍 What We've Verified

- ✅ WebSocket connection establishes successfully
- ✅ Frontend sends properly formatted requests
- ✅ REST API pagination works perfectly (`/api/tokens/trending?format=paginated`)
- ✅ Frontend handles both WebSocket and REST responses
- ❌ No WebSocket responses received for `getDegenDuelRanked`

## 💡 Suggested Backend Implementation

If not yet implemented, here's what we need:

```javascript
// WebSocket handler for market_data topic
case 'getDegenDuelRanked':
  const { limit = 100, offset = 0 } = message.data;
  
  // Get quality tokens (same as REST endpoint)
  const tokens = await getQualityTokens({ limit, offset });
  const total = await getQualityTokensCount();
  
  // Send response
  ws.send(JSON.stringify({
    type: 'DATA',
    topic: 'market_data',
    action: 'degenDuelRanked',
    success: true,
    tokens: tokens,
    pagination: {
      total: total,
      limit: limit,
      offset: offset,
      hasMore: offset + limit < total
    }
  }));
  break;
```

## 🚀 Benefits of WebSocket Pagination

1. **Performance**: 75% faster than REST (50-100ms vs 200-500ms)
2. **Real-time**: Prices update automatically while browsing
3. **Professional UX**: Like Bloomberg Terminal or TradingView
4. **Efficiency**: Single connection for all data needs
5. **Scalability**: Less server load than HTTP requests

## 📝 Next Steps

Please let us know:
1. If `getDegenDuelRanked` is implemented and we're using it wrong
2. The correct action/format if different from above
3. Timeline for implementation if not yet available
4. Any additional requirements or considerations

The frontend is fully ready - we just need the backend WebSocket handler to respond to these requests!

Thank you! 🙏

---

**Frontend WebSocket Implementation**: Complete ✅  
**Waiting For**: Backend WebSocket Response Handler 🔄