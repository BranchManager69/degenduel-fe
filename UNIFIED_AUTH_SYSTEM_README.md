# Unified Authentication System

## Overview

The DegenDuel Unified Authentication System provides a single, consistent interface for all authentication methods (wallet, Privy, Twitter) while maintaining backward compatibility with the previous fragmented authentication system.

## Motivation

The previous authentication system had several issues:
- Multiple overlapping providers (AuthContext, PrivyAuthContext, TwitterAuthContext)
- Inconsistent interfaces between different auth methods
- Duplicated logic across different auth providers
- No clear path for adding new auth methods

The Unified Auth System addresses these issues by:
- Providing a single source of truth for auth state
- Centralizing authentication logic in a single service
- Using a clear, consistent interface for all auth methods
- Making it easier to add new auth methods in the future

## Architecture

The Unified Auth System consists of the following components:

### 1. AuthService

The `AuthService` class in `src/services/AuthService.ts` provides a singleton service that handles all authentication operations:
- Authentication with different methods (wallet, Privy, Twitter)
- Token management and refresh
- User profile management
- Role-based access control
- Auth state change events

### 2. UnifiedAuthContext

The `UnifiedAuthContext` in `src/contexts/UnifiedAuthContext.tsx` provides a React context that wraps the `AuthService` and makes it available to all components through the `useAuth` hook.

### 3. TokenManager

The `TokenManager` class in `src/services/TokenManager.ts` handles token storage, retrieval, and validation across different token types (JWT, WebSocket, Session).

### 4. Route Guards

Updated route guards (`AuthenticatedRoute.unified.tsx`, `AdminRoute.unified.tsx`, `SuperAdminRoute.unified.tsx`) use the Unified Auth System to protect routes based on authentication status and user roles.

### 5. Migration Utilities

The `useMigratedAuth` hook in `src/hooks/useMigratedAuth.ts` provides a bridge between the old and new auth systems, allowing for a gradual migration.

## Usage

### Basic Auth Operations

```tsx
import { useAuth } from '../contexts/UnifiedAuthContext';

function MyComponent() {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    loginWithWallet, 
    loginWithPrivy, 
    logout 
  } = useAuth();

  // Authentication status
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <LoginPrompt />;

  // Login with wallet
  const handleWalletLogin = async (walletAddress) => {
    try {
      const signMessage = async (message) => {
        // Your wallet message signing implementation
        return walletAdapter.signMessage(message);
      };
      
      await loginWithWallet(walletAddress, signMessage);
      // User is now logged in
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  // Logout
  const handleLogout = async () => {
    await logout();
    // User is now logged out
  };

  return (
    <div>
      <h1>Welcome, {user.username}!</h1>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
```

### Role Checks

```tsx
import { useAuth } from '../contexts/UnifiedAuthContext';

function AdminComponent() {
  const { isAdmin, isSuperAdmin } = useAuth();

  if (!isAdmin()) {
    return <AccessDenied />;
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>
      {isSuperAdmin() && <SuperAdminControls />}
    </div>
  );
}
```

### Auth Method Checks

```tsx
import { useAuth } from '../contexts/UnifiedAuthContext';

function ProfileComponent() {
  const { 
    isWalletAuth, 
    isPrivyAuth, 
    isTwitterAuth,
    isPrivyLinked,
    isTwitterLinked,
    linkTwitter,
    linkPrivy
  } = useAuth();

  return (
    <div>
      <h1>Your Authentication Methods</h1>
      
      {isWalletAuth() && <p>✅ Logged in with Wallet</p>}
      {isPrivyAuth() && <p>✅ Logged in with Privy</p>}
      {isTwitterAuth() && <p>✅ Logged in with Twitter</p>}
      
      <h2>Linked Accounts</h2>
      
      {isPrivyLinked() ? (
        <p>✅ Privy account linked</p>
      ) : (
        <button onClick={() => linkPrivy()}>Link Privy Account</button>
      )}
      
      {isTwitterLinked() ? (
        <p>✅ Twitter account linked</p>
      ) : (
        <button onClick={() => linkTwitter()}>Link Twitter Account</button>
      )}
    </div>
  );
}
```

### Token Management

```tsx
import { useAuth } from '../contexts/UnifiedAuthContext';
import { TokenType } from '../services';

function ApiComponent() {
  const { getToken } = useAuth();
  
  const fetchData = async () => {
    // Get JWT token for API requests
    const token = await getToken(TokenType.JWT);
    
    // Use token in API request
    const response = await fetch('/api/data', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.json();
  };
  
  return (
    <button onClick={fetchData}>Fetch Data</button>
  );
}
```

## Migration

See the [Auth Migration Guide](./src/AUTH_MIGRATION_GUIDE.md) for detailed instructions on migrating from the legacy auth system to the Unified Auth System.

## Feature Flags

The Unified Auth System uses feature flags to enable gradual rollout and testing:

```js
// src/config/featureFlags.ts
export const featureFlags = {
  // When true, components will use the UnifiedAuthContext
  // When false, components will use the legacy auth contexts
  useUnifiedAuth: false,
};
```

During the transition period, you can use the `useMigratedAuth` hook which will automatically use the appropriate auth system based on the feature flag:

```tsx
import { useMigratedAuth } from '../hooks/useMigratedAuth';

function MyComponent() {
  const { user, isAuthenticated } = useMigratedAuth();
  
  // Rest of the component...
}
```

## Testing

The Unified Auth System includes comprehensive tests for all components:

- `src/contexts/UnifiedAuthContext.test.tsx` - Tests for the auth context
- `src/services/AuthService.test.ts` - Tests for the auth service
- `src/components/routes/AuthenticatedRoute.unified.test.tsx` - Tests for route guards

## Future Development

Planned enhancements for the Unified Auth System:

1. Add support for more authentication methods
2. Improve token refresh logic to handle token expiration more gracefully
3. Add more comprehensive role-based access control
4. Enhance security features like session timeouts and device management