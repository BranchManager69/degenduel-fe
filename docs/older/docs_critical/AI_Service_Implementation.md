# AI Service Implementation Instructions (UPDATED)

## Overview
This document provides instructions for implementing the AI service for DegenDuel, focusing on the backend implementation required to support the frontend integration. The frontend interfaces have been designed and implemented (using `/src/services/ai.ts` and `/src/services/api/ai.ts`), and now the backend needs to be developed to handle the AI requests securely.

⚠️ **IMPORTANT UPDATE**: The API has been simplified to provide a cleaner interface between frontend and backend. Server-side configuration now handles model selection, token limits, and system prompts.

## API Endpoints to Implement

### AI Chat Endpoint
- **Endpoint**: `POST /api/ai/chat` (proxied through `/api/ai/chat` on frontend)
- **Purpose**: Process AI chat completions securely via backend
- **Request Format**:
  ```json
  {
    "messages": [
      {"role": "user", "content": "Hello, how are you?"},
      {"role": "assistant", "content": "I'm doing well, how can I help you today?"},
      {"role": "user", "content": "Tell me about DegenDuel"}
    ],
    "context": "default",        // Optional - determines system prompt (default or trading)
    "conversationId": "user123"  // Optional - for tracking conversations
  }
  ```
  
  > **Note**: System prompts are now automatically added by the backend - do not include messages with role "system"

- **Response Format**:
  ```json
  {
    "content": "DegenDuel is a cryptocurrency trading platform where users can...",
    "usage": {
      "promptTokens": 42,
      "completionTokens": 85,
      "totalTokens": 127
    },
    "conversationId": "user123"
  }
  ```
- **Status Codes**:
  - `200`: Success
  - `400`: Invalid request
  - `401`: Authentication error
  - `429`: Rate limit exceeded
  - `500`: Server error

## Security Requirements

1. **API Key Management**
   - Store OpenAI API key in server environment variables (NEVER in code)
   - Implement key rotation mechanism
   - Consider using a secrets manager for production

2. **Rate Limiting**
   - Implement per-user request rate limiting
   - Set reasonable token usage limits per user
   - Log rate limit events for monitoring

3. **Error Handling**
   - Sanitize all error messages before returning to client
   - Log detailed errors server-side for debugging
   - Special handling for quota exceeded errors with custom message

## Implementation Details

### OpenAI Integration

```javascript
// Using Node.js with OpenAI SDK v4
import OpenAI from 'openai';
import { logApi } from '../utils/logger-suite/logger.js';

// Server-side configuration - hardcoded constants
const AI_CONFIG = {
  // Default model configuration (NEVER use gpt-3.5-turbo)
  defaultModel: 'gpt-4o',
  
  // Token limits
  maxTokens: 200,
  
  // System prompts
  systemPrompts: {
    default: "You are DegenDuel's AI assistant. You provide helpful, accurate, and concise information about cryptocurrency, trading, and the DegenDuel platform. Keep your responses friendly and informative.",
    trading: "You are DegenDuel's trading assistant. You provide analysis and information about cryptocurrencies, market trends, and trading strategies. Your advice is educational and never financial advice.",
  },
  
  // Temperature settings
  temperature: 0.7
};

// Initialize OpenAI client with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateChatCompletion(messages, options = {}) {
  try {
    // Determine conversation context
    const conversationContext = options.context || 'default';
    
    // Add system prompt if not already present
    const messagesWithSystem = messages.some(msg => msg.role === 'system') ? 
      messages : 
      [{ role: 'system', content: AI_CONFIG.systemPrompts[conversationContext] }, ...messages];
    
    // Make API request to OpenAI
    const response = await openai.chat.completions.create({
      model: AI_CONFIG.defaultModel,
      messages: messagesWithSystem,
      temperature: AI_CONFIG.temperature,
      max_tokens: AI_CONFIG.maxTokens,
      user: options.userId || 'anonymous'
    });
    
    return {
      content: response.choices[0].message.content,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
      },
      conversationId: options.conversationId
    };
  } catch (error) {
    // Handle OpenAI-specific errors
    logApi.error('OpenAI API error:', error);
    
    // Special handling for billing/quota errors
    if (error.status === 429 && error.message && error.message.includes('exceeded your current quota')) {
      throw { status: 429, message: 'Sorry, the dev didn\'t pay the AI bill but the server is functioning properly' };
    }
    
    // Handle other errors
    if (error.status === 401) {
      throw { status: 401, message: 'Authentication error with AI service' };
    } else if (error.status === 429) {
      throw { status: 429, message: 'Rate limit exceeded for AI service' };
    } else {
      throw { status: 500, message: 'AI service error' };
    }
  }
}
```

### Rate Limiting Implementation

```javascript
// Using Express with rate-limit middleware
import rateLimit from 'express-rate-limit';

// Configure rate limiter
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID for authenticated users, IP for others
    return req.user?.id || req.ip;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded for AI service',
      type: 'rate_limit'
    });
  }
});

// Apply to AI routes
app.use('/api/ai/*', aiLimiter);
```

### Express Controller Implementation

```javascript
// Express controller for AI chat
router.post('/chat', aiLimiter, async (req, res) => {
  try {
    // Extract request parameters - we only need messages and optional context/conversationId
    const { messages, conversationId, context } = req.body;
    
    // Validation
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid request: messages array is required',
        type: 'invalid_request'
      });
    }
    
    // Get user ID if available (for authenticated users)
    const userId = req.user?.id || 'anonymous';
    
    // Process chat completion with simplified options
    const result = await generateChatCompletion(messages, {
      conversationId,
      userId,
      context
    });
    
    // Return response
    return res.status(200).json(result);
  } catch (error) {
    // Handle errors based on type
    const status = error.status || 500;
    const message = error.message || 'Internal server error';
    
    return res.status(status).json({
      error: message,
      type: getErrorType(status)
    });
  }
});

// Map status codes to error types
function getErrorType(status) {
  switch (status) {
    case 400: return 'invalid_request';
    case 401: case 403: return 'authentication';
    case 429: return 'rate_limit';
    case 500: case 502: case 503: case 504: return 'server';
    default: return 'unknown';
  }
}
```

## Front-End Implementation Guidelines

The front-end implementation should be updated to match the simplified API:

1. **Message Structure**:
   - Only include user and assistant messages
   - Do NOT include system messages (these are added by the backend)

2. **Request Parameters**:
   - `messages`: Array of message objects with role and content
   - `context`: Optional context for the conversation ("default" or "trading")
   - `conversationId`: Optional ID for tracking conversations

3. **Error Handling**:
   - Handle 429 errors (rate limiting) with appropriate user feedback
   - Implement retry logic for transient errors

Example front-end implementation:

```typescript
// Example TypeScript implementation
async function sendChatRequest(messages: Message[], options?: ChatOptions) {
  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages,
        context: options?.context || 'default',
        conversationId: options?.conversationId
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get AI response');
    }
    
    return await response.json();
  } catch (error) {
    console.error('AI chat error:', error);
    throw error;
  }
}
```

## Monitoring & Logging

1. **Request Logging**
   - Log each request with anonymized user data
   - Track token usage for cost analysis
   - Monitor response times and error rates

2. **Error Alerting**
   - Set up alerts for unusual error rates
   - Monitor for API key and quota issues
   - Track rate limit hits

## Implementation Timeline

1. **Phase 1: Core Implementation (Complete)**
   - Basic AI chat endpoint implemented
   - OpenAI integration with gpt-4o model
   - Rate limiting implemented

2. **Phase 2: Frontend Updates (Next)**
   - Update frontend to use simplified API
   - Implement proper error handling
   - Add conversation context support

3. **Phase 3: Monitoring (Future)**
   - Add comprehensive usage tracking
   - Implement cost monitoring dashboard
   - Add user tier support if needed

## Support & Maintenance

The backend team will be available to assist with integration questions and to test the frontend implementation. Regular sync meetings during development are recommended to ensure alignment.