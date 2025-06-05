# WebSocket Authentication Middleware Inquiry

**To**: DegenDuel Backend Team  
**From**: Frontend Development Team  
**Date**: January 6, 2025  
**Subject**: WebSocket Authentication and Middleware Implementation Details

## Background

We're documenting the complete WebSocket authentication flow for the DegenDuel platform and need to understand how the backend handles authentication and authorization before publishing/broadcasting messages. This will help us ensure proper frontend-backend integration and create comprehensive documentation.

## Current Frontend Implementation

Based on our frontend code analysis, here's what we understand about the client-side flow:

### 1. Connection Flow
```javascript
// Connect to WebSocket
const socket = new WebSocket('wss://degenduel.me/api/v69/ws');

// After connection opens, send AUTH message
const authMessage = {
  type: 'AUTH',
  authToken: token  // JWT or WebSocket token from authService.getToken(TokenType.WS_TOKEN)
};
socket.send(JSON.stringify(authMessage));
```

### 2. Topic Subscription
```javascript
// Subscribe to topics with optional auth token
const subscribeMessage = {
  type: 'SUBSCRIBE',
  topics: ['portfolio', 'user'],
  authToken: authToken  // Required for protected topics
};
```

### 3. Protected Topics We've Identified
- **Require Authentication**: `USER`, `WALLET`, `WALLET_BALANCE`, `PORTFOLIO`, `LOGS`, `TERMINAL`, `CONTEST_CHAT`
- **Require Admin Role**: `ADMIN`
- **Public Topics**: `SYSTEM`, `MARKET_DATA`, `CONTEST` (partial public access)

### 4. Error Codes We Handle
- `4401`: Authentication errors
  - `token_required`: Authentication token is required
  - `token_expired`: Session expired
  - `token_invalid`: Invalid authentication token

## Questions for Backend Team

### 1. Authentication Middleware Architecture

1. **How is the authentication middleware structured?**
   - Is there a specific middleware that runs before all WebSocket message handlers?
   - How do you validate JWT/WebSocket tokens on incoming connections?
   - Is there a separate tenant/multi-tenant middleware layer?

2. **Connection State Management**
   - How do you track authenticated vs unauthenticated connections?
   - Where is the user context stored on the WebSocket connection object?
   - How do you handle connection state transitions (CONNECTED → AUTHENTICATED)?

### 2. Message Publishing/Broadcasting

3. **Pre-publish Authentication Checks**
   - What middleware or checks run before a message is published to a topic?
   - How do you filter recipients based on authentication status?
   - Is there a specific function/middleware that validates permissions before broadcast?

4. **Topic-based Authorization**
   - How do you determine which topics require authentication?
   - Where is the topic ACL (Access Control List) defined?
   - How do you handle partial access (e.g., public contest info vs. user-specific contest data)?

### 3. Implementation Details

5. **Code Structure**
   - What WebSocket library are you using (ws, socket.io, etc.)?
   - Can you share the general structure of your WebSocket middleware chain?
   - Example pseudo-code would be helpful:
     ```javascript
     websocket.use(authMiddleware);
     websocket.use(tenantMiddleware);
     websocket.on('message', messageHandler);
     websocket.publish(topic, data, authFilter);
     ```

6. **Token Validation**
   - How do you validate the `authToken` from the AUTH message?
   - Do you support both JWT and custom WebSocket tokens?
   - How often do you re-validate tokens during a connection's lifetime?

### 4. Security Considerations

7. **Rate Limiting and DDoS Protection**
   - Is there rate limiting per authenticated user vs unauthenticated connections?
   - How do you handle authentication failures (e.g., multiple invalid token attempts)?

8. **Message Filtering**
   - How do you ensure users only receive messages they're authorized to see?
   - Is filtering done at the topic level, message level, or both?

## Additional Information That Would Help

- Any existing backend documentation about WebSocket authentication
- Code snippets showing the middleware chain
- The actual error code definitions and when each is triggered
- Any special handling for admin users or system messages
- How you handle WebSocket reconnections with existing auth tokens

## Purpose

This information will help us:
1. Create accurate frontend documentation
2. Better handle edge cases in authentication flow
3. Improve error handling and user experience
4. Ensure proper security practices are followed
5. Debug authentication issues more effectively

Thank you for your assistance in documenting this critical part of our system architecture!

---

**Note**: If there are any security-sensitive details that shouldn't be in frontend documentation, please indicate what should remain internal only.