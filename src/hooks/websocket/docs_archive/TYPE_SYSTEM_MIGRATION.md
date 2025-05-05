# WebSocket System Type Migration - May 2025

## Overview

As of May 5, 2025, the WebSocket system is undergoing a transition from string-based message types to enum-based types to improve type safety. This document explains what's happening and how to handle the transition.

## What Changed?

1. We've enhanced integration with the `degenduel-shared` package by adding proper local type declarations
2. Message types are now enums (`DDExtendedMessageType.SUBSCRIBE`) instead of string literals (`'SUBSCRIBE'`)
3. The codebase is in transition between these two approaches

## Benefits of This Change

- **Type Safety**: Compiler catches type errors before runtime
- **Autocomplete**: Enum values can be discovered via IDE autocompletion
- **Refactoring**: Changing enum values updates all usages
- **Documentation**: Types are self-documenting and clearly defined

## Tools We've Added to Help

1. **Helper Functions**:
   - `createMessage(type, payload)`: Creates a type-safe message
   - `isMessageType(messageType, expectedType)`: Safely compares message types
   - `isValidMessageType(value)`: Type guard for message types

2. **Constants Object**:
   - `WS_MESSAGE_TYPES`: A convenient object for accessing enum values

3. **Transitional Interface Updates**:
   - `WebSocketMessage.type` now accepts both string and enum values

## Example Usage

### Before:

```typescript
// Creating a message
const message = {
  type: 'SUBSCRIBE',
  topics: ['market-data']
};

// Checking message type
if (message.type === 'SYSTEM') {
  // Handle system message
}
```

### After:

```typescript
import { 
  createMessage, 
  isMessageType,
  WS_MESSAGE_TYPES
} from '../hooks/websocket';

// Creating a message
const message = createMessage(
  WS_MESSAGE_TYPES.SUBSCRIBE,
  {
    topics: ['market-data']
  }
);

// Checking message type
if (isMessageType(message.type, WS_MESSAGE_TYPES.SYSTEM)) {
  // Handle system message
}
```

## How to Fix TypeScript Errors

When you see errors like:
- `Type 'DDExtendedMessageType' is not assignable to type 'string'`
- `This comparison appears to be unintentional because the types 'string' and 'DDExtendedMessageType.SYSTEM' have no overlap`

Use these approaches:

### 1. For Type Comparison Errors:

```typescript
// Before:
if (message.type === 'SYSTEM') {
  // Do something
}

// After:
import { isMessageType, WS_MESSAGE_TYPES } from '../hooks/websocket';

if (isMessageType(message.type, WS_MESSAGE_TYPES.SYSTEM)) {
  // Do something
}
```

### 2. For Message Creation:

```typescript
// Before:
socket.send(JSON.stringify({
  type: 'SUBSCRIBE',
  topics: ['market-data']
}));

// After:
import { WS_MESSAGE_TYPES } from '../hooks/websocket';

socket.send(JSON.stringify({
  type: WS_MESSAGE_TYPES.SUBSCRIBE,
  topics: ['market-data']
}));
```

### 3. For Complex Messages:

```typescript
// Before:
const message = {
  type: 'REQUEST',
  topic: 'market-data',
  action: 'getTokens'
};

// After:
import { createMessage, WS_MESSAGE_TYPES } from '../hooks/websocket';

const message = createMessage(
  WS_MESSAGE_TYPES.REQUEST,
  {
    topic: 'market-data',
    action: 'getTokens'
  }
);
```

## Temporary Workaround

If you need to get the build working quickly for a production fix, you can use a temporary TypeScript directive:

```typescript
// @ts-ignore - To be updated in WebSocket type refactoring phase 2
if (message.type === 'SYSTEM') {
  // Do something
}
```

However, please add a JIRA ticket to properly fix it later!

## Path Forward

This is a gradual migration:

1. **Phase 1** (Current): Support both string literals and enums during transition
2. **Phase 2**: Update all code to consistently use enums
3. **Phase 3**: Tighten interfaces to only accept enum values

By completing this migration, we'll have a more robust and type-safe WebSocket system.

## Next Steps

See the more detailed [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for step-by-step instructions on updating specific components.