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

## Environment Setup

- `.env` - Production configuration
- `.env.development` - Development configuration
- `.env.local` - Local overrides (not committed to Git)
