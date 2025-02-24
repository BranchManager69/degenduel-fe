# DegenDuel Frontend Development Guide

## Build & Test Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
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