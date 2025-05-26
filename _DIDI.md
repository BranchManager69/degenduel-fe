Here's the complete frontend implementation guide for the unified `/api/ai/didi` endpoint:

## DegenDuel AI Didi Endpoint - Frontend Implementation Guide

### Endpoint Overview
**URL:** `POST /api/ai/didi`  
**Purpose:** Unified AI endpoint with streaming, function calling, role-based access, and UI generation

---

### Request Structure

```typescript
interface DidiRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  stream?: boolean;                    // Default: true
  requireRole?: 'user' | 'admin' | 'superadmin';  // Optional auth requirement
  conversationId?: string;             // Optional conversation tracking
  context?: 'default' | 'trading' | 'terminal' | 'ui_terminal';  // Default: 'terminal'
  ui_context?: {                       // For UI component generation
    available_components?: string[];   // e.g., ['portfolio_chart', 'token_watchlist']
    page?: string;                     // Current page context
  };
}
```

### Example Requests

```javascript
// Basic chat request (streaming by default)
const basicRequest = {
  messages: [
    { role: 'user', content: 'What are the top performing tokens?' }
  ]
};

// Non-streaming request
const nonStreamingRequest = {
  messages: [
    { role: 'user', content: 'Get platform activity data' }
  ],
  stream: false
};

// Admin-only request
const adminRequest = {
  messages: [
    { role: 'user', content: 'Show me service status' }
  ],
  requireRole: 'admin',
  stream: false
};

// UI component generation request
const uiRequest = {
  messages: [
    { role: 'user', content: 'Show my portfolio chart' }
  ],
  context: 'ui_terminal',
  ui_context: {
    available_components: ['portfolio_chart', 'token_watchlist'],
    page: 'dashboard'
  }
};
```

---

### Response Formats

#### Non-Streaming Response (stream: false)
```typescript
interface DidiResponse {
  content: string;           // AI-generated text response
  functionCalled?: string;   // Name of function that was called (if any)
  conversationId?: string;   // Conversation ID for tracking
}
```

**Example:**
```json
{
  "content": "Currently, the platform is gearing up for several upcoming trading contests...",
  "functionCalled": "getPlatformActivity",
  "conversationId": "uuid-here"
}
```

#### Streaming Response (stream: true)
Server-Sent Events format with multiple event types:

```typescript
// Text chunks as AI types
interface ChunkEvent {
  type: 'chunk';
  content: string;
  delta: string;  // Same as content
}

// Function execution results
interface FunctionResultEvent {
  type: 'function_result';
  function: string;
  result: any;  // Function response data
}

// UI component creation
interface UIActionEvent {
  type: 'ui_action';
  action: {
    type: 'create_component';
    component: string;  // e.g., 'portfolio_chart'
    data: any;         // Component data
    placement: string; // e.g., 'below_terminal'
    id: string;        // Unique component ID
    title?: string;    // Optional title
  };
}

// Stream completion
interface DoneEvent {
  type: 'done';
  conversationId?: string;
  isComplete: true;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
}

// Error handling
interface ErrorEvent {
  type: 'error';
  message: string;
  isComplete: true;
}
```

---

### Frontend Implementation Examples

#### 1. Non-Streaming Implementation
```javascript
async function sendDidiMessage(messages, options = {}) {
  try {
    const response = await fetch('/api/ai/didi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}` // If authenticated
      },
      body: JSON.stringify({
        messages,
        stream: false,
        ...options
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Didi API Error:', error);
    throw error;
  }
}

// Usage
const result = await sendDidiMessage([
  { role: 'user', content: 'What are the top tokens?' }
]);
console.log(result.content);
```

#### 2. Streaming Implementation (Ready for when streaming is fixed)
```javascript
async function sendDidiMessageStreaming(messages, onChunk, onComplete, options = {}) {
  try {
    const response = await fetch('/api/ai/didi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}` // If authenticated
      },
      body: JSON.stringify({
        messages,
        stream: true,
        ...options
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            switch (data.type) {
              case 'chunk':
                onChunk(data.content);
                break;
              case 'function_result':
                console.log('Function executed:', data.function, data.result);
                break;
              case 'ui_action':
                handleUIAction(data.action);
                break;
              case 'done':
                onComplete(data);
                return;
              case 'error':
                throw new Error(data.message);
            }
          } catch (parseError) {
            console.warn('Failed to parse SSE data:', line);
          }
        }
      }
    }
  } catch (error) {
    console.error('Streaming Error:', error);
    throw error;
  }
}

// UI Action Handler
function handleUIAction(action) {
  if (action.type === 'create_component') {
    switch (action.component) {
      case 'portfolio_chart':
        createPortfolioChart(action.data, action.id, action.placement);
        break;
      case 'token_watchlist':
        createTokenWatchlist(action.data, action.id, action.placement);
        break;
    }
  }
}

// Usage
let fullResponse = '';
await sendDidiMessageStreaming(
  [{ role: 'user', content: 'Show my portfolio' }],
  (chunk) => {
    fullResponse += chunk;
    updateChatUI(fullResponse);
  },
  (completion) => {
    console.log('Stream complete:', completion);
  },
  {
    context: 'ui_terminal',
    ui_context: {
      available_components: ['portfolio_chart', 'token_watchlist']
    }
  }
);
```

#### 3. React Hook Example
```javascript
import { useState, useCallback } from 'react';

export function useDidiChat() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (messages, options = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/didi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          messages,
          stream: false,
          ...options
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Request failed');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { sendMessage, isLoading, error };
}
```

---

### Error Handling

```typescript
interface ErrorResponse {
  error: string;
  type: 'invalid_request' | 'authentication' | 'insufficient_permissions' | 'rate_limit' | 'server';
}
```

**Common Error Scenarios:**
- `400`: Invalid request (missing messages, invalid format)
- `401`: Authentication required (when `requireRole` is specified)
- `403`: Insufficient permissions (user doesn't have required role)
- `429`: Rate limit exceeded
- `500`: Server error

---

### Available AI Functions

The AI can automatically call these functions based on user queries:

**Token Functions:**
- `getTokenPrice` - Get current token price and info
- `getTokenPriceHistory` - Get historical price data
- `getTokenPools` - Get liquidity pool information
- `getTokenMetricsHistory` - Get comprehensive metrics

**User Functions:**
- `getUserProfile` - Get user profile information
- `getTopUsers` - Get leaderboard data
- `getUserContestHistory` - Get user's contest participation

**Contest Functions:**
- `getActiveContests` - Get current and upcoming contests

**Platform Functions:**
- `getPlatformActivity` - Get recent platform activity

**Admin Functions (require admin/superadmin role):**
- `getServiceStatus` - Get service health status
- `getSystemSettings` - Get system configuration
- `getWebSocketStats` - Get WebSocket connection stats
- `getIPBanStatus` - Get IP ban information
- `getDiscordWebhookEvents` - Get Discord notification events

---

### Streaming Status

**Current Status:** Streaming has a minor issue where it completes immediately without sending content chunks. Non-streaming mode works perfectly.

**Recommendation:** Implement non-streaming mode first, then add streaming support when the backend issue is resolved (should be soon).

**When Streaming is Ready:** The frontend code above will work immediately - just change `stream: false` to `stream: true` and use the streaming implementation.

---

### Integration Notes

1. **Authentication:** Include Bearer token in Authorization header for authenticated requests
2. **Rate Limiting:** 100 requests per 5 minutes for regular users, unlimited for admins
3. **Conversation Tracking:** Use `conversationId` to maintain conversation context
4. **UI Components:** When using `ui_context`, be ready to handle `ui_action` events to create dynamic components
5. **Function Calling:** The AI automatically chooses which functions to call - no need to specify them manually

This endpoint replaces all the individual AI endpoints and provides a unified, powerful interface for all AI interactions in DegenDuel.
