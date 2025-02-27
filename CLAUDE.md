# DegenDuel Frontend Development Guide

## Build & Test Commands

- `npm run build:prod` - Build for production
- `npm run build:dev` - Build for development (unminified)
- `npm run build:local` - Build unminified development version and serve on port 3010
- `npm run dev` - Start development server
- `npm run dev:local` - Start development server in local mode (connects to dev.degenduel.me API)
- `npm run type-check` - Run TypeScript checks
- `npm run test` - Run all tests
- `npm test -- -t "test name"` - Run specific test
- `npm test -- src/path/to/file.test.tsx` - Run tests in specific file

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
