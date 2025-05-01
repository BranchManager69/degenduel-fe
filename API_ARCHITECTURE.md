# DegenDuel API Architecture

This document outlines the architecture and organization of the API client implementations in the DegenDuel frontend.

## Overview

The codebase contains two different approaches to API client implementation:

1. **Monolithic API Client** (`src/services/dd-api.ts`)
2. **Modular API Client** (`src/services/api/` directory)

While the modular approach is more modern in structure, there appears to be a migration back to the monolithic approach as evidenced by deprecation notices.

## Monolithic API Client (dd-api.ts)

The `dd-api.ts` file (approximately 1800 lines) implements a comprehensive API client with advanced reliability features.

### Organization

The file is organized in layers:

1. **Infrastructure Layer**
   - Circuit breaker implementation
   - Server status tracking 
   - Error handling
   - API client factory (createApiClient)
   - Ban status tracking

2. **Core Utilities**
   - Participation checking with caching
   - Formatting utilities
   - Maintenance mode checking

3. **Domain-Specific API Modules**
   - Organized as properties of the exported `ddApi` object
   - Domains: users, tokens, stats, admin, contests, portfolio, balance, transactions, leaderboard
   - Each domain has methods for specific API operations

4. **Generic Access**
   - `ddApi.fetch` for generic endpoint access

### Circuit Breaker Pattern

A notable feature is the sophisticated circuit breaker implementation:

- Tracks failures by service endpoint
- "Opens the circuit" after a threshold of failures (default: 5)
- Prevents further calls during a cooldown period (default: 30 seconds)
- Attempts recovery after cooldown
- Collects analytics about failures and recovery
- Dispatches custom events for admin dashboards

Example usage in API calls:
```typescript
const api = createApiClient();
const response = await api.fetch('/endpoint/path');
```

The circuit breaker wraps all API calls made through the client, providing consistent failure handling.

### Server Status Monitoring

The implementation also tracks global server status:
- Detects repeated 502 errors (Bad Gateway)
- After threshold (3 failures), marks server as down
- Prevents further requests when server is down
- Dispatches global events for UI components to display server status

## Modular API Client (api/ directory)

The modular approach separates concerns into individual files:

- `api/index.ts` - Central export point (37 lines)
- Domain-specific modules: users.ts, tokens.ts, contests.ts, etc.
- Utility functions in utils.ts

Each module focuses on a specific domain's API calls, making the code more maintainable and focused.

## Evolution Path

Despite the modular structure being a more modern approach, the codebase appears to be centralizing back to the dd-api.ts implementation:

```typescript
/**
 * DEPRECATION NOTICE:
 * This file is being phased out in favor of centralizing API utilities in src/services/dd-api.ts.
 * All utilities in this file should be considered deprecated and will be removed in a future update.
 */
```

This suggests that the advanced reliability features in dd-api.ts (circuit breaker, error handling) are considered more important than the cleaner code organization of the modular approach.

## Recommendations

For future development:

1. **If maintaining the monolithic approach:**
   - Consider breaking the file into logical sections with clear comments
   - Extract the circuit breaker into its own module for better maintainability
   - Document the design decisions and reliability features

2. **If preferring the modular approach:**
   - Extract the circuit breaker and reliability features into shared utilities
   - Implement these features in the modular architecture
   - Gradually migrate from dd-api.ts to the modular approach

The ideal solution would combine the reliability features of dd-api.ts with the cleaner organization of the modular approach.