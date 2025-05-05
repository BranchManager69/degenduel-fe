# WebSocket System Type Migration Guide

## Overview

We're moving from using string literals for WebSocket message types to using proper TypeScript enums. This improves type safety and helps catch bugs earlier.

## Key Changes

1. **Message Type Enums**: We now use `DDExtendedMessageType` enum instead of string literals
2. **Type Safety**: TypeScript will catch type mismatches at compile time
3. **Utility Functions**: New helper functions for type-safe message creation and comparison

## Migration Steps

### 1. Replace String Literals with Enum Values

**Before:**
```typescript
socket.send(JSON.stringify({
  type: 'SUBSCRIBE',
  topics: ['market-data']
}));
```

**After:**
```typescript
import { DDExtendedMessageType } from '../hooks/websocket/types';

socket.send(JSON.stringify({
  type: DDExtendedMessageType.SUBSCRIBE,
  topics: ['market-data']
}));
```

### 2. Use Type-Safe Message Creation

**Before:**
```typescript
const message = {
  type: 'REQUEST',
  topic: 'market-data',
  action: 'getTokens'
};
```

**After:**
```typescript
import { DDExtendedMessageType, createMessage } from '../hooks/websocket/types';

const message = createMessage(
  DDExtendedMessageType.REQUEST,
  {
    topic: 'market-data',
    action: 'getTokens'
  }
);
```

### 3. Update Type Comparisons

**Before:**
```typescript
if (message.type === 'SYSTEM') {
  // Handle system message
}
```

**After:**
```typescript
import { DDExtendedMessageType, isMessageType } from '../hooks/websocket/types';

if (isMessageType(message.type, DDExtendedMessageType.SYSTEM)) {
  // Handle system message
}
```

## Utility Functions

We've added several utility functions to help with the migration:

- `createMessage(type, payload)` - Creates a type-safe message
- `isMessageType(messageType, expectedType)` - Safely compares message types
- `isValidMessageType(value)` - Type guard to check if a value is a valid message type

## Timeline

The transition to enum-based message types is happening now. While the codebase is in transition, we've updated interfaces to support both string literals and enum values, but all new code should use the enum values exclusively.

Once the migration is complete, we'll update the interfaces to only accept enum values.