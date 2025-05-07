# DegenDuel Authentication System Architecture

## System Overview Diagram

```
┌───────────────────────────┐
│      App Entry Points     │
│  ┌────────────────────┐   │
│  │     App.tsx        │◄──┼── Uses UnifiedAuthContext primarily
│  └────────────────────┘   │
└───────────────────────────┘
           │
           ▼  
┌────────────────────────────────────┐    ┌──────────────────────────┐
│            Context Layer           │    │    Provider Integration   │
│                                    │    │ ┌─────────────────────┐  │
│    Auth Contexts         WS Contexts    │ │   PrivyProvider     │  │
│  ┌─────────────────┐  ┌─────────────┐   │ │   (from SDK)        │  │
│  │UnifiedAuthContext├─►UnifiedWebSocket│◄┼─┤                     │  │
│  └─────────────────┘  │   Context    │   │ └─────────────────────┘  │
│                       └─────────────┘   │ ┌─────────────────────┐  │
│  (Legacy - TBD/Removed)                 │ │  WalletProvider     │  │
│  ┌─────────────────┐  (Legacy - TBD/Removed) │ │  (@solana/         │  │
│  │PrivyAuthContext │  ┌─────────────┐   │ │   wallet-adapter-   │  │
│  └─────────────────┘  │ WebSocket   │   │ │   react-ui)         │  │
│                       │  Context    │◄──┼─┤                     │  │
│                       └─────────────┘   │ └─────────────────────┘  │
└────────────────────────────────────┘    └──────────────────────────┘
           │
           ▼
┌──────────────────────────┐
│      Hook Layer          │
│┌────────────────────────┐│
││  useMigratedAuth.ts    ││◄─── Primary auth hook, uses UnifiedAuthContext
│└────────────────────────┘│
│┌────────────────────────┐│
││ useSolanaKitWallet.ts  ││◄─── For Solana wallet operations
│└────────────────────────┘│
└──────────────────────────┘
           │
           ▼
┌──────────────────────────┐
│     Service Layer        │
│┌────────────────────────┐│
││   AuthService.ts       ││◄─── Unified service
│└────────────────────────┘│
│┌────────────────────────┐│
││   TokenManager.ts      ││◄─── Used by AuthService
│└────────────────────────┘│
└──────────────────────────┘
           │
           ▼
┌──────────────────────────┐
│      API Layer           │
│┌────────────────────────┐│
││     api/auth.ts        ││◄─── Backend API integration
│└────────────────────────┘│
└──────────────────────────┘
           │
           ▼
┌──────────────────────────┐
│      Type Definitions    │
│┌────────────────────────┐│
││     types/user.ts      ││◄─── User type
│└────────────────────────┘│
└──────────────────────────┘
```

## Core Files

1. **User Type Definitions**:
   - `/src/types/user.ts` - Main User interface
   - `/src/types/index.ts` - Exports various types including legacy ones (review for cleanup)

2. **Authentication Contexts**:
   - `/src/contexts/UnifiedAuthContext.tsx` - New unified auth context
   - `/src/contexts/PrivyAuthContext.tsx` - (Legacy - To Be Removed/Refactored)

3. **WebSocket Contexts**:
   - `/src/contexts/UnifiedWebSocketContext.tsx` - New unified WebSocket context
   - `/src/contexts/WebSocketContext.tsx` - (Legacy - To Be Removed/Refactored)

4. **Authentication Services**:
   - `/src/services/AuthService.ts` - New unified auth service
   - `/src/services/TokenManager.ts` - Handles token storage and management

5. **Authentication Hooks**:
   - `/src/hooks/auth/useMigratedAuth.ts` - Primary bridge to the unified auth system.
   - `/src/hooks/wallet/useSolanaKitWallet.ts` - Hook for new Solana wallet interactions.

6. **WebSocket Hooks**:
   - `/src/hooks/websocket/useUnifiedWebSocket.ts` - Hook for the unified WebSocket system.
   - `/src/hooks/websocket/topic-hooks/*` - Topic-specific WebSocket hooks.

7. **Route Guards**:
   - `/src/components/routes/AuthenticatedRoute.unified.tsx` (and similar for Admin, SuperAdmin) - New route guards.

8. **Authentication API/Integration**:
   - `/src/services/api/auth.ts` - Auth API endpoints integration.
   - `/src/App.tsx` - Contains `UnifiedAuthProvider` and `WalletProvider` (from `@solana/wallet-adapter-react`).

## Data Flow

1. **Authentication Flow**:
   - User interacts with login UI (PrivyLoginButton, ConnectWalletButton, etc.)
   - This triggers Privy or wallet provider authentication
   - Auth service (new AuthService or legacy authService) verifies with backend
   - User data is stored in context state
   - Components use the user data for rendering and permissions

2. **WebSocket Authentication Flow**:
   - UnifiedWebSocketContext depends on UnifiedAuthContext for authentication
   - Auth tokens are retrieved from AuthService and sent with WebSocket messages
   - WebSocket connections are automatically authenticated when user logs in
   - WebSocket reconnections automatically re-authenticate using current tokens
   - User-specific data is delivered via authenticated WebSocket subscriptions

3. **Hooks Usage**:
   - Old components use `useAuth()` from legacy context
   - Transitional components use `useMigratedAuth()` which picks correct hook
   - New components use `useAuth()` from the unified context
   - WebSocket data access through topic-specific hooks (e.g., `useTokenData()`)

4. **Route Protection**:
   - Route guards check auth status from context
   - Redirects unauthenticated users to login
   - AdminRoute/SuperAdminRoute check role-specific permissions

## Migration Path

```
┌─────────────────────┐     ┌─────────────────────┐     ┌────────────────────────┐
│    Legacy System    │ ──► │  Transition System  │ ──► │    Unified System      │
│                     │     │                     │     │                        │
│ - AuthContext       │     │ - useMigratedAuth   │     │ - UnifiedAuthContext   │
│ - authService       │     │   (bridge)          │     │ - AuthService          │
│ - WebSocketContext  │     │ - support both      │     │ - UnifiedWebSocket     │
│ - multiple providers│     │   patterns          │     │   Context              │
│ - separate auth +   │     │ - deprecation       │     │ - Integrated auth +    │
│   WebSocket systems │     │   warnings          │     │   WebSocket systems    │
└─────────────────────┘     └─────────────────────┘     └────────────────────────┘
```

Components are gradually moving from using the legacy system directly to the unified system, with the migration hook providing a bridge during transition. The same process applies to WebSocket usage, with the new UnifiedWebSocketContext integrated with the UnifiedAuthContext.

## Authentication Requirements

- Every user MUST have a wallet address (required property)
- Privy creates/manages wallets for users who don't connect their own
- Twitter/Discord can be linked only after wallet authentication
- Authentication tokens are managed centrally through TokenManager

## WebSocket Authentication Requirements

- WebSocket connections use specialized WebSocket tokens
- Tokens are requested and managed by the AuthService
- UnifiedWebSocketContext automatically handles authentication with the WebSocket server
- User-specific channels/topics require authentication
- Public data can be accessed without authentication
- When authentication status changes, WebSocket connections are updated automatically

## Deprecation Warnings

The system includes built-in deprecation warnings for older function-based authentication checks:
- `isAuthenticated()` → `isAuthenticated` (boolean property)
- `isAdmin()` → `user?.is_admin` (direct property access)
- `isSuperAdmin()` → `user?.is_superadmin` (direct property access)

These warnings guide developers toward the new patterns without breaking existing code.