# DegenDuel Frontend Development Guide for AI Agents

## Project Overview
DegenDuel is a Solana-based trading competition platform with real-time WebSocket connections, contest management, and wallet integration.

## Key Directories & Files
- `src/components/` - React components organized by feature
- `src/pages/` - Page-level components with routing
- `src/hooks/` - Custom React hooks, especially WebSocket hooks
- `src/services/` - API services and data management
- `src/types/` - TypeScript type definitions
- `src/config/` - Configuration and environment setup
- `docs/` - Any and all documentation MAY OR MAY NOT BE OUTDATED!

## Development Environment
- **Framework**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand for global state, React hooks for local
- **WebSocket**: Unified WebSocket system (v69) for real-time data
- **Testing**: Jest + React Testing Library

## Critical Commands
- `npm run type-check` - TypeScript validation (RUN FREQUENTLY)
- `npm run build:dev &` - Development build (background)
- `npm run build:prod &` - Production build (background)

## Testing & Validation
1. Always run `npm run type-check` after code changes
2. Test WebSocket connections using the monitoring tools in admin panels
3. Verify wallet connections work across different adapters
4. Check responsive design on mobile/desktop

## Code Standards
- **Imports**: builtin → external → internal → parent/sibling → index
- **Components**: Function components with hooks, PascalCase naming
- **Files**: One component per file, related utilities separate
- **WebSocket**: Use unified WebSocket hooks from `src/hooks/websocket/`
- **Error Handling**: Try/catch with specific error types

## WebSocket System (Critical)
- **NEVER rewrite WebSocket system from scratch**
- Use existing hooks from `src/hooks/websocket/topic-hooks/`
- Connection path: `/api/v69/ws`
- Topic-based subscriptions for different data types
- Authentication via JWT for restricted topics

## Environment Configuration
- Production: `.env` with `wss://degenduel.me`
- Development: `.env.development` with `wss://dev.degenduel.me`
- All API calls proxy through `/api/` endpoints

## Common Issues & Solutions
1. **WebSocket disconnections**: Check authentication tokens and topic subscriptions
2. **Type errors**: Ensure proper imports from centralized type files
3. **Build failures**: Verify all imports are correctly typed
4. **Wallet issues**: Test different wallet adapters (Phantom, Jupiter, Privy)

## PR Guidelines
- Title format: `[Component/Feature] Description`
- Include type checking validation
- Test WebSocket functionality if modified
- Verify responsive design changes
- Document any breaking changes

## Deployment
- Development builds deploy to `https://dev.degenduel.me`
- Production builds deploy to `https://degenduel.me`
- NGINX serves static files from `dist/` and `dist-dev/`