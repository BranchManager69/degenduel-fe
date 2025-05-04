# WebSocket Type System Migration Guide

## Overview

We're transitioning from string-based WebSocket message types to enum-based types for improved type safety. This document provides a step-by-step guide for updating components to the new type system.

## Quick Start

For files that need immediate fixing, you have three options:

### Option 1: Use the Migration Helper Functions (Recommended)

```typescript
import { isMessageType, WS_MESSAGE_TYPES } from '../hooks/websocket';

// Before:
if (message.type === 'SYSTEM') {
  // Handle system message
}

// After:
if (isMessageType(message.type, WS_MESSAGE_TYPES.SYSTEM)) {
  // Handle system message
}
```

### Option 2: Type Cast When Sending Messages

```typescript
import { DDExtendedMessageType } from '../hooks/websocket';

// Before:
socket.send(JSON.stringify({
  type: 'SUBSCRIBE',
  topics: ['market-data']
}));

// After:
socket.send(JSON.stringify({
  type: DDExtendedMessageType.SUBSCRIBE,
  topics: ['market-data']
}));
```

### Option 3: Use the createMessage Utility

```typescript
import { createMessage, DDExtendedMessageType } from '../hooks/websocket';

// Before:
const message = {
  type: 'REQUEST',
  topic: 'market-data',
  action: 'getTokens'
};

// After:
const message = createMessage(
  DDExtendedMessageType.REQUEST,
  {
    topic: 'market-data',
    action: 'getTokens'
  }
);
```

## Common Type Errors and Their Fixes

### Error 1: String vs Enum Comparison

**Error message:** `This comparison appears to be unintentional because the types 'string' and 'DDExtendedMessageType.SYSTEM' have no overlap`

**Fix:**
```typescript
// Before:
if (message.type === 'SYSTEM') {
  // ...
}

// After:
import { isMessageType, WS_MESSAGE_TYPES } from '../hooks/websocket';

if (isMessageType(message.type, WS_MESSAGE_TYPES.SYSTEM)) {
  // ...
}
```

### Error 2: Type Assignment Error

**Error message:** `Type 'DDExtendedMessageType' is not assignable to type 'string'`

**Fix:**
```typescript
// Before:
const message: WebSocketMessage = {
  type: DDExtendedMessageType.SUBSCRIBE,
  // ...
};

// After:
import { createMessage, WS_MESSAGE_TYPES } from '../hooks/websocket';

const message = createMessage(
  WS_MESSAGE_TYPES.SUBSCRIBE,
  {
    // other fields...
  }
);
```

### Error 3: Missing Shared Type

**Error message:** `Module '"degenduel-shared"' has no exported member 'DDWebSocketTopic'`

**Fix:**

Import from our local types system instead:
```typescript
// Before:
import { DDWebSocketTopic } from 'degenduel-shared';

// After:
import { TopicType } from '../hooks/websocket';
```

## Long-Term Migration Strategy

This is a transition period. We're moving towards full enum-based typing, but need to support both string and enum approaches temporarily. The `WebSocketMessage` interface has been updated to accept both:

```typescript
export interface WebSocketMessage {
  type: DDExtendedMessageType | string; // Support both enum and string during transition
  // other fields...
}
```

We've also added utility functions to ease the transition. In the future, we'll tighten the type system to only accept enum values.

## Command-Line Helper Script

You can use this simple shell command to find files that need migration:

```bash
grep -r "type: '[A-Z_]*'" --include="*.ts" --include="*.tsx" src
```

This will find hardcoded string literals being used for WebSocket message types.