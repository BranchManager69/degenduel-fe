# DegenDuel Frontend Development Guide

## CRITICAL WEBSOCKET DEVELOPMENT APPROACH

NEVER REWRITE THE WEBSOCKET SYSTEM FROM SCRATCH. Always work incrementally with the existing implementation:
- Diagnose issues methodically by tracing the chain of events in the existing code
- Fix problems through careful, targeted changes that maintain compatibility
- Understand the interconnections between components before making changes
- Address false positives and edge cases in indicators without disrupting core functionality
- Test all modifications thoroughly to ensure they fix the specific issue without introducing new ones
- Document changes clearly for future maintenance

## IMPORTANT - COMMAND EXECUTION POLICY FOR CLAUDE

# STRONGLY ENCOURAGED:
- `npm run type-check` - Claude SHOULD run this frequently after making code changes
 
# STRICTLY PROHIBITED WITHOUT EXPLICIT REQUEST:
- Any build commands (`npm run build:*`)
- Any server commands (`npm run dev*`)
- Any test commands (`npm test*`)

## Build & Test Commands

- `npm run build:prod &` - Build for production and output to `dist/` (ALWAYS RUN IN BACKGROUND, BUT ONLY WHEN EXPLICITLY REQUESTED)
- `npm run build:dev &` - Build for development (unminified) and output to `dist-dev/` (ALWAYS RUN IN BACKGROUND, BUT ONLY WHEN EXPLICITLY REQUESTED)
- `npm run dev` - Start development server (NEVER RUN WITHOUT EXPLICIT REQUEST)
- `npm run type-check` - Run TypeScript checks (STRONGLY ENCOURAGED after code changes)
- `npm run test` - Run all tests (NEVER RUN WITHOUT EXPLICIT REQUEST)
- `npm test -- -t "test name"` - Run specific test (NEVER RUN WITHOUT EXPLICIT REQUEST)
- `npm test -- src/path/to/file.test.tsx` - Run tests in specific file (NEVER RUN WITHOUT EXPLICIT REQUEST)

## Deployment Architecture

- NGINX is configured to serve `dist-dev/` content at https://dev.degenduel.me
- NGINX is configured to serve `dist/` content at https://degenduel.me
- After running a build command, changes are immediately available at the corresponding domain
- No need to restart servers - just run the build command and refresh the site

## Server Operations

### Background Processes
- ALWAYS run build commands and pm2 operations in the background by appending `&` to the command
- Example: `npm run build:prod &`
- Example: `pm2 start app.js &`

### Process Management
- `pm2 start <app> &` - Start process in background
- `pm2 list` - List all running processes
- `pm2 stop <id|name>` - Stop a process
- `pm2 restart <id|name>` - Restart a process
- `pm2 delete <id|name>` - Delete a process

## Code Style Guidelines

- **Imports**: Ordered by builtin → external → internal → parent/sibling → index
- **TypeScript**: Strict mode enabled; avoid `any` types; prefer explicit return types
- **Formatting**: 120 character line limit; use ESLint + Prettier
- **Naming**: PascalCase for components; camelCase for variables/functions; UPPER_CASE for constants
- **Components**: Function components with hooks; no class components
- **Error Handling**: Use try/catch blocks with specific error types; centralized error handling
- **State Management**: Prefer hooks for local state; Zustand for global state
- **File Structure**: One component per file; related utilities in separate files
- **Testing**: Jest + React Testing Library; test UI interactions; mock external dependencies

## WebSocket & API Conventions

- Authentication via wallet signature
- Error responses follow consistent format
- Realtime updates use WebSockets
- WebSocket URL is configurable via VITE_WS_URL environment variable (set to wss://dev.degenduel.me by default)
- API endpoints proxy through /api to the configured backend
- All WebSocket connections use secure wss:// protocol

## Unified WebSocket System (v69)

> **IMPORTANT**: This documentation is based on WEBSOCKET_UNIFIED_SYSTEM.md as of commit 717a481 (March 28, 2025). Refer to the original document for the most up-to-date information.

### Overview

The DegenDuel Unified WebSocket System provides a centralized WebSocket implementation using a topic-based subscription model through a single connection.

- **Connection Path**: `/api/v69/ws`
- **Max Payload Size**: 50KB

### Key Features

- **Single Connection**: One WebSocket connection for all data types
- **Topic-Based Subscriptions**: Subscribe to specific data channels
- **Unified Authentication**: JWT-based authentication across all topics
- **Centralized Error Handling**: Consistent error management with error codes
- **Rate Limiting**: Built-in protection against excessive requests
- **No Compression**: Explicitly disables frame compression for client compatibility
- **Heartbeats**: Automatic heartbeat messages to keep connections alive

### Available Topics

| Topic ID | Name | Description | Authentication Required |
|----------|------|-------------|-------------------------|
| `market-data` | Market Data | Real-time market data for tokens | No |
| `portfolio` | Portfolio | User portfolio information | Yes |
| `system` | System | System-wide notifications and events | No |
| `contest` | Contest | Contest information and updates | No (Public), Yes (User-specific) |
| `user` | User | User profile and statistics | Yes |
| `admin` | Admin | Administrative functions | Yes (Admin role) |
| `wallet` | Wallet | Wallet information and transactions | Yes |
| `skyduel` | SkyDuel | SkyDuel game data | No (Public), Yes (User-specific) |

### Message Types

#### Client to Server

| Type | Description | Example Use |
|------|-------------|-------------|
| `SUBSCRIBE` | Subscribe to topics | Subscribe to market data |
| `UNSUBSCRIBE` | Unsubscribe from topics | Stop receiving portfolio updates |
| `REQUEST` | Request specific data | Get token details |
| `COMMAND` | Execute an action | Execute a trade |

#### Server to Client

| Type | Description | Example Use |
|------|-------------|-------------|
| `DATA` | Data payload | Market data updates |
| `ERROR` | Error information | Authentication failure |
| `SYSTEM` | System messages | Connection status |
| `ACKNOWLEDGMENT` | Confirm client action | Subscription confirmation |

### Connection & Authentication

1. **Connect to WebSocket**:
   ```javascript
   const socket = new WebSocket('wss://degenduel.me/api/v69/ws');
   ```

2. **Authentication**:
   - Include auth token when subscribing to restricted topics:
   ```javascript
   socket.send(JSON.stringify({
     type: 'SUBSCRIBE',
     topics: ['portfolio', 'user'],
     authToken: 'your-jwt-token'
   }));
   ```
   - Authentication required for: `portfolio`, `user`, `wallet`, and `admin` topics

### Error Codes

| Code Range | Type | Description |
|------------|------|-------------|
| 4000-4099 | Client Error | Issues with client requests |
| 5000-5099 | Server Error | Server-side issues |

Key client errors:
- 4000: Invalid message format
- 4010: Authentication required for restricted topics
- 4011: Invalid authentication token
- 4012: Admin role required for admin topics

Key server errors:
- 5000: Internal server error
- 5002: Error processing request
- 5004: Error processing command

## Environment Setup

- `.env` - Production configuration
- `.env.development` - Development configuration
- `.env.local` - Local overrides (not committed to Git)
