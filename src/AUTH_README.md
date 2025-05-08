# DegenDuel Unified Authentication System

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Core Components](#core-components)
4. [Implementation Status](#implementation-status)
5. [Migration Plan](#migration-plan)
6. [Developer Guide](#developer-guide)
7. [File Structure](#file-structure)
8. [Testing](#testing)
9. [Future Improvements](#future-improvements)

## Overview

The Unified Authentication System is a complete redesign of DegenDuel's authentication architecture. It consolidates multiple overlapping authentication providers into a single, cohesive system that is easier to maintain, test, and extend.

This refactor addresses several issues with the original authentication implementation:
- Circular dependencies between components
- Multiple overlapping providers (AuthContext, PrivyAuthContext, TwitterAuthContext were legacy)
- Repeated logic across multiple files
- Direct store manipulations causing infinite render loops
- Inconsistent API for authentication methods

## Key Features

- **Single Authentication Service:** Centralized logic for all authentication operations (`AuthService.ts`)
- **Unified Context Provider:** One React context for all authentication state (`UnifiedAuthContext.tsx`)
- **Integrated WebSocket Authentication:** WebSocket system that works seamlessly with auth (`UnifiedWebSocketContext.tsx`)
- **Support for Multiple Auth Methods:** Wallet, Privy, and Twitter authentication (managed via `AuthService`)
- **Token Management:** Unified token handling for JWT, WebSocket, and session tokens (`authTokenManagerService.ts`)
- **Event-Based Architecture:** Subscribe to auth events for reactive components
- **Consistent Error Handling:** Standardized error responses across the system
- **Improved TypeScript Support:** Better type definitions and interfaces
- **Comprehensive Testing:** Unit and integration tests for core unified components

## Core Components

### 1. AuthService

`AuthService` is a singleton class that centralizes all authentication logic:

```typescript
import { authService } from '../services';

// Check if user is authenticated
const isAuthenticated = await authService.checkAuth();

// Get a token
const token = await authService.getToken(TokenType.JWT);

// Login with wallet
const user = await authService.loginWithWallet(walletAddress, signMessage);

// Logout
await authService.logout();
```

### 2. UnifiedAuthContext

`UnifiedAuthContext` provides a React hook for components to access authentication state:

```typescript
import { useAuth } from '../contexts/UnifiedAuthContext'; // Corrected path for new components

function MyComponent() {
  const { user, isLoading, isAuthenticated, loginWithWallet, logout } = useAuth();
  
  // Use auth state and methods
}
```

### 3. UnifiedWebSocketContext

`UnifiedWebSocketContext` provides WebSocket functionality with integrated auth:

```typescript
import { useWebSocket } from '../contexts/UnifiedWebSocketContext'; // Corrected path for new components

function MyComponent() {
  const { isConnected, isAuthenticated, send, subscribe } = useWebSocket();
  
  // Use WebSocket functions
}
```

### 4. Route Guards

Updated route guards for protected routes:

```tsx
import { AuthenticatedRoute } from '../components/routes/AuthenticatedRoute.unified'; // Assuming this is the new path

<Route element={<AuthenticatedRoute />}>
  <Route path="/protected" element={<ProtectedComponent />} />
</Route>
```

## Implementation Status

The core components of the new unified authentication system have been implemented and integrated:

1. **Core Components Created & Integrated:**
   - ✅ `AuthService.ts` - Central authentication service
   - ✅ `UnifiedAuthContext.tsx` - Unified authentication provider
   - ✅ `UnifiedWebSocketContext.tsx` - WebSocket provider integrated with auth
   - ✅ `App.tsx` - Reimplemented App component using the new system
   - ✅ Unified route guards (e.g., `AuthenticatedRoute.unified.tsx`) are in place.
   - ✅ `useMigratedAuth.ts` now exclusively uses `UnifiedAuthContext`.

2. **Legacy Systems Cleanup:**
   - ✅ Deleted legacy `AuthContext.tsx`, `TwitterAuthContext.tsx`.
   - ✅ Deleted legacy `useAuth.ts` (from `hooks/auth/legacy/`), `useJupiterWallet.ts`, `useSolanaWallet.ts`.
   - ✅ Deleted legacy `ConnectWalletButton.tsx`, `SolanaWalletConnector.tsx`.
   - ✅ Deleted legacy `useTokenData.ts` (from `hooks/data/legacy/`).
   - 🟡 `PrivyAuthContext.tsx` and legacy `WebSocketContext.tsx` are deprecated and pending removal.
   - 🟡 Several components consuming legacy hooks/contexts have been refactored (e.g., `TwitterLoginButton`, `LivePriceTicker`, `TokensPreviewSection`, `MarketStatsPanel`, `WebSocketStatus`, `SolanaConnectionContext`, `ContestCreditsPage`, `LoginPage`).

3. **Remaining TypeScript/Build Issues & Tasks:**
   - 🟡 Test mocking issues: `authFlow.test.tsx` commented out, needs update/removal. Storybook mocks (e.g., `src/stories/mockProviders.tsx`) may need updates for deleted contexts.
   - 🟡 Review and potentially remove/refactor remaining files importing deleted modules (e.g., Blinks components, Privy-related components if `PrivyAuthContext` is removed).
   - 🟡 Update `src/AUTH_SYSTEM_ARCHITECTURE.md` to reflect all changes.
   - 🟡 Refactor Blinks functionality (`BlinkButton.tsx`, `BlinkResolver.tsx`) to fully utilize `useSolanaKitWallet.ts`.

## Migration Plan

The initial migration to the unified system is largely complete. The focus is now on cleaning up remaining legacy parts and ensuring full adoption.

### Phase 1 & 2: Core Components & Incremental Implementation (Largely Completed)
- Core unified auth components are live.
- `useMigratedAuth` acts as the primary auth hook, using the unified system.
- Route guards have been updated.
- Key login components and several other components have been migrated.

### Phase 3: Finalizing Integration & Cleanup (Current Focus)
1. **Complete Removal of Deprecated Contexts/Hooks:**
   - Remove `PrivyAuthContext.tsx` after ensuring its functionality is covered by `UnifiedAuthContext` or is no longer needed.
   - Remove legacy `WebSocketContext.tsx` after ensuring all WebSocket interactions use `UnifiedWebSocketContext` or topic-specific hooks.
   - Remove any remaining components solely dependent on these deleted legacy items.
2. **Refactor Blinks:** Fully integrate `BlinkButton.tsx` and related components with `useSolanaKitWallet.ts`.
3. **Update Tests and Storybook:**
   - Rewrite or remove tests for legacy contexts (e.g., `authFlow.test.tsx`).
   - Update Storybook mocks and stories to use the new unified auth system.

### Phase 4: Cleanup & Optimization (Future)
1. **Code Cleanup:**
   - Remove any remaining deprecated files and code.
   - Update all documentation and comments to reflect the final unified system.
2. **Performance Optimization:**
   - Profile the unified authentication system for performance.
   - Optimize render cycles and state updates.

## Developer Guide

### Importing the Auth Hook

Always use `useMigratedAuth` or directly `useAuth` from `UnifiedAuthContext`:
```typescript
// Recommended for most components:
import { useMigratedAuth } from '../hooks/auth/useMigratedAuth'; // Or its direct export from hooks/auth

// Or directly if within a structure that ensures UnifiedAuthProvider is above:
import { useAuth } from '../contexts/UnifiedAuthContext';
```

### Using Authentication State

```typescript
// Use with useMigratedAuth or useAuth from UnifiedAuthContext
const { user, isLoading, isAuthenticated } = useAuth(); // or useMigratedAuth()
```
> Note: `isLoading` is the current property. `loading` is provided by `useMigratedAuth` for compatibility during transition but maps to `isLoading`.

### WebSocket Authentication

```typescript
// New System
import { useWebSocket } from '../contexts/UnifiedWebSocketContext'; // Or topic-specific hooks
```

### Route Guards

```tsx
// New System
import { AuthenticatedRoute } from '../components/routes/AuthenticatedRoute.unified'; // Example

<Route element={<AuthenticatedRoute />}>
  <Route path="/protected" element={<ProtectedComponent />} />
</Route>
```

## File Structure (Reflects Current State & Goals)

```
src/
├── services/
│   ├── AuthService.ts            // Central auth service
│   ├── AuthService.test.ts       // Tests for auth service
│   ├── authTokenManagerService.ts           // Token management
│   └── index.ts                  // Service exports
├── contexts/
│   ├── UnifiedAuthContext.tsx    // Auth context/provider
│   ├── UnifiedAuthContext.test.tsx // Tests for auth context
│   ├── UnifiedWebSocketContext.tsx // WebSocket integration
│   ├── UnifiedWebSocketContext.test.tsx // Tests for WebSocket context
│   ├── SolanaConnectionContext.tsx // Uses useMigratedAuth
│   └── (legacy - to be removed)
│       ├── PrivyAuthContext.tsx    // Deprecated
│       └── WebSocketContext.tsx    // Deprecated
├── components/
│   ├── auth/                     // Auth related UI components, refactored or new
│   │   └── LoginOptions.tsx      // Uses WalletMultiButton etc.
│   └── routes/
│       ├── AuthenticatedRoute.unified.tsx  // Protected route
│       ├── AdminRoute.unified.tsx          // Admin route
│       └── SuperAdminRoute.unified.tsx     // SuperAdmin route
├── hooks/
│   ├── auth/
│   │   ├── useMigratedAuth.ts    // Primary auth hook for components
│   │   └── index.ts
│   └── wallet/
│       └── useSolanaKitWallet.ts // Preferred Solana wallet hook
└── App.tsx                       // App with unified auth & WS providers
```

### Files Status:
- 🟢 **NEW/UNIFIED Files**: `AuthService.ts`, `UnifiedAuthContext.tsx`, `UnifiedWebSocketContext.tsx`, `useMigratedAuth.ts`, `useSolanaKitWallet.ts`, `AuthenticatedRoute.unified.tsx` (and similar for admin/superadmin).
- 🔴 **DELETED Files (from old system)**: `AuthContext.tsx`, `TwitterAuthContext.tsx`, legacy `useAuth.ts`, `useJupiterWallet.ts`, `useSolanaWallet.ts` (from `hooks/data`), `ConnectWalletButton.tsx`, `SolanaWalletConnector.tsx`, legacy `useTokenData.ts`.
- 🟡 **TO BE DELETED/REFACTORED**: `PrivyAuthContext.tsx`, legacy `WebSocketContext.tsx`, Blinks components, remaining Storybook/test mocks tied to deleted files.
- 🟡 **UPDATED Files**: Many components now use `useMigratedAuth` or `useStandardizedTokenData`.

## Testing

Run the tests for the new authentication system:

```bash
npm test -- src/services/AuthService.test.ts
npm test -- src/contexts/UnifiedAuthContext.test.tsx
npm test -- src/contexts/UnifiedWebSocketContext.test.tsx
# Add tests for unified route guards if available
```
> Note: `authFlow.test.tsx` is currently commented out and needs refactoring/removal.

## Future Improvements

- Add refresh token functionality
- Improve error handling and recovery
- Add more authentication methods (if needed beyond current scope)
- Enhance security features
- Complete Blinks integration with `useSolanaKitWallet`.

---

## Implementation Decisions

1. **Singleton Pattern for AuthService:**
   - Ensures there is only one instance of the auth service
   - Prevents multiple instances from causing state conflicts
   - Provides a global access point with `AuthService.getInstance()`

2. **Event System for Auth State Changes:**
   - Components can subscribe to auth events
   - Reduces tight coupling between components
   - Makes the system more maintainable and testable

3. **Token Management:**
   - Centralized in authTokenManagerService
   - Supports multiple token types (JWT, WebSocket, Session)
   - Handles token expiration and refresh

4. **React Router Integration:**
   - Uses the Outlet pattern for route guards
   - Makes route configuration more declarative and maintainable

5. **Backward Compatibility:**
   - Old properties are still available (`loading` in addition to `isLoading`)
   - Same method signatures to minimize refactoring
   - Gradual migration path to avoid breaking changes