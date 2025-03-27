# AI Service Implementation Instructions

## Overview
This document provides instructions for implementing the AI service for DegenDuel, focusing on the backend implementation required to support the frontend integration. The frontend interfaces have been designed and implemented (using `/src/services/ai.ts` and `/src/services/api/ai.ts`), and now the backend needs to be developed to handle the AI requests securely.

## API Endpoints to Implement

### AI Chat Endpoint
- **Endpoint**: `POST /api/ai/chat` (proxied through `/api/ai/chat` on frontend)
- **Purpose**: Process AI chat completions securely via backend
- **Request Format**:
  ```json
  {
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Hello, how are you?"}
    ],
    "model": "gpt-4",           // Optional - default to your preferred model
    "temperature": 0.7,         // Optional - controls randomness
    "maxTokens": 150,           // Optional - controls response length
    "conversationId": "user123" // Optional - for tracking conversations
  }
  ```
- **Response Format**:
  ```json
  {
    "content": "Hello! I'm an AI assistant for DegenDuel. How can I help you today?",
    "usage": {
      "promptTokens": 15,
      "completionTokens": 13,
      "totalTokens": 28
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

2. **Authentication & Authorization**
   - Require valid session token for AI requests
   - Limit access based on user roles/permissions
   - Implement IP-based rate limiting for abuse prevention

3. **Rate Limiting**
   - Implement per-user request rate limiting
   - Set reasonable token usage limits per user
   - Add tiered limits based on user subscription level

4. **Error Handling**
   - Sanitize all error messages before returning to client
   - Log detailed errors server-side for debugging
   - Implement graceful degradation when AI service is unavailable

## Implementation Details

### OpenAI Integration

```javascript
// Using Node.js with OpenAI SDK v4
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateChatCompletion(messages, options = {}) {
  try {
    const response = await openai.chat.completions.create({
      model: options.model || 'gpt-3.5-turbo',
      messages: messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens || 150,
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
    console.error('OpenAI API error:', error);
    
    // Determine error type and rethrow with appropriate status
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
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

// Create Redis client
const redis = new Redis(process.env.REDIS_URL);

// Configure rate limiter
const aiLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args)
  }),
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
export async function handleChatRequest(req, res) {
  try {
    // Extract request parameters
    const { messages, model, temperature, maxTokens, conversationId } = req.body;
    
    // Validation
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid request: messages array is required',
        type: 'invalid_request'
      });
    }
    
    // Get user ID for tracking and rate limiting
    const userId = req.user?.id || 'anonymous';
    
    // Process chat completion
    const result = await generateChatCompletion(messages, {
      model,
      temperature,
      maxTokens,
      conversationId,
      userId
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
}

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

## Monitoring & Logging

1. **Request Logging**
   - Log each request with anonymized user data
   - Track token usage for cost analysis
   - Monitor response times and error rates

2. **Error Alerting**
   - Set up alerts for unusual error rates
   - Monitor for API key issues
   - Track rate limit hits

3. **Usage Analytics**
   - Implement dashboard for AI usage monitoring
   - Track cost per user/request
   - Identify potential abuse patterns

## Deployment Considerations

1. **Environment Configuration**
   - Set up proper environment variables for all environments
   - Use different API keys for development vs. production
   - Configure appropriate rate limits per environment

2. **Performance**
   - Consider caching common responses
   - Implement request queuing for high-load situations
   - Set appropriate timeouts for OpenAI requests

3. **Scalability**
   - Use horizontally scalable architecture
   - Consider serverless functions for AI processing
   - Implement proper connection pooling for Redis/databases

## Testing Guidelines

1. **Unit Tests**
   - Test request validation logic
   - Mock OpenAI responses for consistent testing
   - Verify error handling works correctly

2. **Integration Tests**
   - Test rate limiting functionality
   - Verify authentication flow
   - Test with actual OpenAI API in staging environment

3. **Load Testing**
   - Verify system under high concurrency
   - Test rate limiter effectiveness
   - Measure response times under load

## Cost Management

1. **Token Budgeting**
   - Set maximum tokens per request
   - Implement per-user quotas if needed
   - Consider implementing different tiers based on user roles

2. **Cost Monitoring**
   - Track OpenAI API costs daily/weekly/monthly
   - Set up alerts for unusual spending
   - Generate cost reports by user segment

## Implementation Timeline

1. **Phase 1: Core Implementation (1-2 weeks)**
   - Implement basic AI chat endpoint
   - Set up OpenAI integration
   - Implement authentication and rate limiting

2. **Phase 2: Monitoring & Optimization (1 week)**
   - Add logging and monitoring
   - Implement cost tracking
   - Performance optimization

3. **Phase 3: Testing & Deployment (1 week)**
   - Comprehensive testing
   - Staging deployment
   - Production rollout

## Support & Maintenance

The frontend team will be available to assist with integration questions and to test the backend implementation. Regular sync meetings during development are recommended to ensure alignment.