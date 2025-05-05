# AI Service Endpoints Detailed Technical Guide

## 1. /api/ai/response - Standard AI Response Endpoint

This endpoint provides complete AI responses in a single request-response cycle.

**Purpose:** For standard AI interactions when you don't need real-time streaming.

### Request:
```json
{
  "messages": [{ "role": "user", "content": "What is SOL price?" }],
  "conversationId": "optional-uuid-for-continuing-conversations",
  "context": "terminal" // Options: "default", "trading", "terminal"
}
```

### Response:
```json
{
  "content": "The current price of Solana (SOL) is $145.37...",
  "functionCalled": "getTokenPrice", // Optional
  "conversationId": "uuid-for-this-conversation"
}
```

### Technical Notes:
- Always use proper authentication headers
- For long responses, consider using the streaming endpoint instead
- Cache the conversationId for follow-up exchanges

## 2. /api/ai/stream - Streaming AI Response Endpoint

This endpoint streams the AI response in chunks as it's being generated.

**Purpose:** For interactive UIs where you want to show the response being typed out.

### Request:
Identical to the `/api/ai/response` endpoint.

### Response:
A stream of events, each containing a chunk of the response.

### Handling Streaming Responses:
```javascript
// Fetch API example
const response = await fetch('/api/ai/stream', {
  method: 'POST',
  headers: { /* ... */ },
  body: JSON.stringify({ /* ... */ })
});

// Create a reader for the stream
const reader = response.body.getReader();
let result = '';

// Process the stream chunks
while (true) {
  const {done, value} = await reader.read();
  if (done) break;

  // Convert chunk to text
  const chunk = new TextDecoder().decode(value);

  // Update UI with this chunk
  result += chunk;
  updateUI(result); // Your function to update the UI
}
```

### Technical Notes:
- The frontend must handle the stream closure properly
- Attach event listeners to process each chunk as it arrives
- Consider showing a "typing" indicator during streaming
- WebSocket streaming is more efficient for lengthy exchanges

## 3. /api/ai/data/:addressOrSymbol - Token Data Endpoint

This endpoint provides structured cryptocurrency token data directly.

**Purpose:** For fetching standardized token data without natural language processing.

### Request:
Simple GET request with the token address or symbol in the URL.
```
GET /api/ai/data/SOL
GET /api/ai/data/So11111111111111111111111111111111111111112
```

### Response:
Structured JSON data about the token.
```json
{
  "symbol": "SOL",
  "name": "Solana",
  "address": "So11111111111111111111111111111111111111112",
  "price": "145.37",
  "price_change_24h": "3.7",
  "market_cap": "18.75B",
  "volume_24h": "750M",
  "social_links": { /* ... */ },
  "tags": ["layer1", "smart-contracts"],
  "is_monitored": true
}
```

### Technical Notes:
- This endpoint returns 100% structured data with a consistent schema
- The design using a single `:addressOrSymbol` parameter is intentional:
  - It's RESTful and follows standard API design patterns
  - It's flexible, accepting either token addresses or symbols
  - It simplifies frontend implementation (no need for different endpoints)
- Response is cached for performance
- No authentication required for this endpoint

## Implementation Priorities

When implementing these endpoints in the frontend:

1. Start with the `/api/ai/data` endpoint for token displays, as it's the simplest
2. Then implement `/api/ai/response` for basic AI interactions
3. Finally, enhance the UI with streaming responses via `/api/ai/stream`

Let me know if you need any specific implementation help with these endpoints.