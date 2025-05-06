# WebSocket Action Names Standardization Guide

## Overview

This guide explains how we've standardized WebSocket action names between the frontend and backend to ensure reliable communication. The shared type definitions are now located in both:

1. `@branchmanager69/degenduel-shared` package (for shared types between FE and BE)
2. `/src/websocket-types-implementation.ts` (for frontend-specific extensions)

## Key Principles

1. **Enum Keys**: Use `UPPERCASE_WITH_UNDERSCORES` for easy access in code (type safety)
2. **String Values**: Use `camelCase` to match backend handler expectations
3. **Organization**: Group actions by topic with clear comments
4. **Consistency**: Use standard prefixes like `GET_`, `UPDATE_`, `CREATE_` when appropriate

## Example Usage

### Before (problematic)
```typescript
// Hard-coded strings with inconsistent naming
ws.request(TopicType.TERMINAL, 'GET_TERMINAL_DATA');  // Doesn't match backend's 'getData'
```

### After (standardized)
```typescript
import { DDWebSocketActions } from '../../../websocket-types-implementation';

// Use enum constants for consistent action names
ws.request(TopicType.TERMINAL, DDWebSocketActions.GET_DATA);  // Matches backend's 'getData'
```

## Naming Patterns

| Frontend Enum Key | Backend Handler String | Usage |
|-------------------|------------------------|-------|
| GET_DATA          | getData                | Request data from a topic |
| UPDATE_SETTINGS   | updateSettings         | Update user/system settings |
| CREATE_CONTEST    | createContest          | Create a new resource |
| GET_USER_CONTESTS | getUserContests        | Get user-specific data |

## Common Actions Across Topics

Some common action patterns are reused across topics:
- GET_DATA, GET_STATUS, GET_SETTINGS
- CREATE_*, UPDATE_*, DELETE_*
- REFRESH_*

## Best Practices

1. **Always use the enum**: Never use string literals for action names
2. **Check the enum first**: Before defining a new action, check if it already exists
3. **Follow naming patterns**: Be consistent with existing action names
4. **Update both places**: If you add a new action, ensure it's added to both frontend and backend
5. **Test with backend**: Verify new actions work with the backend implementation

## Migration Guide

When migrating existing code:

1. Find hardcoded action strings: `ws.request(TopicType.X, 'actionName')`
2. Replace with constants: `ws.request(TopicType.X, DDWebSocketActions.ACTION_NAME)`
3. Verify backend handler names match the action value: `'actionName'`

## Troubleshooting

If WebSocket requests aren't working:
1. Check browser console for missing/invalid action errors
2. Verify the action string value matches exactly what the backend expects
3. Look at the backend handler to confirm the expected action name