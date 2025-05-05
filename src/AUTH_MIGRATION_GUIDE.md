# Auth System Migration Guide

This document provides guidance on migrating from the legacy authentication system to the new Unified Auth System in DegenDuel.

## Overview

The DegenDuel authentication system has been redesigned to provide a single, unified interface for all authentication methods (wallet, Privy, Twitter). This migration guide will help developers transition smoothly from the old system to the new one.

## Migration Steps

### 1. Update Imports

**Old imports (to be replaced):**
```tsx
import { useAuth } from '../hooks/useAuth';
import { AuthContext, AuthProvider } from '../contexts/AuthContext';
import { PrivyAuthContext, PrivyAuthProvider } from '../contexts/PrivyAuthContext';
import { TwitterAuthContext, TwitterAuthProvider } from '../contexts/TwitterAuthContext';
```

**New imports:**
```tsx
import { useAuth, UnifiedAuthProvider } from '../contexts/UnifiedAuthContext';
```

For gradual migration, you can use the bridge hook:
```tsx
import { useMigratedAuth } from '../hooks/useMigratedAuth';
```

### 2. Replace Auth Providers

**Old providers (multiple nested providers):**
```tsx
<AuthProvider>
  <PrivyAuthProvider>
    <TwitterAuthProvider>
      {/* App content */}
    </TwitterAuthProvider>
  </PrivyAuthProvider>
</AuthProvider>
```

**New single provider:**
```tsx
<UnifiedAuthProvider>
  {/* App content */}
</UnifiedAuthProvider>
```

### 3. Update Route Guards

Replace the old route guards with their unified counterparts:

**Old route guards:**
- `AuthenticatedRoute.tsx`
- `AdminRoute.tsx` 
- `SuperAdminRoute.tsx`

**New route guards:**
- `AuthenticatedRoute.unified.tsx`
- `AdminRoute.unified.tsx`
- `SuperAdminRoute.unified.tsx`

### 4. Update Auth Service Usage

**Old auth services:**
```tsx
import { loginWithWallet } from '../services/authService';
import { linkTwitterAccount } from '../services/authenticationService';
```

**New auth service:**
```tsx
import { authService } from '../services';

// Then use methods on the service instance
authService.loginWithWallet(address, signMessage);
authService.linkTwitter();
```

### 5. Feature Flag Toggle

During migration, use the feature flag system to toggle between old and new systems:

```tsx
import { setFeatureFlag } from '../config/featureFlags';

// Enable the new auth system
setFeatureFlag('useUnifiedAuth', true);
```

The `useMigratedAuth` hook will automatically use the appropriate auth system based on the feature flag.

## API Differences

### User Interface

The User interface has been updated to include fields from all auth methods. The new interface is in `src/types/user.ts` and includes all fields from the old interface in `src/types/index.ts` for backward compatibility.

### Authentication Methods

The new system provides clear methods for different authentication types:

```tsx
// Wallet authentication
const { loginWithWallet } = useAuth();
await loginWithWallet(walletAddress, signMessage);

// Privy authentication
const { loginWithPrivy } = useAuth();
await loginWithPrivy(token, userId);

// Check auth method
const { isWalletAuth, isPrivyAuth, isTwitterAuth } = useAuth();
```

### Role Checks

```tsx
const { isAdmin, isSuperAdmin } = useAuth();

if (isAdmin()) {
  // Admin-only code
}

if (isSuperAdmin()) {
  // SuperAdmin-only code
}
```

### Token Management

```tsx
const { getToken } = useAuth();

// Get JWT token
const token = await getToken();

// Get WebSocket token
const wsToken = await getToken('ws_token');
```

## Testing

Update your test mocks to use the new auth context:

```tsx
// Old mock
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
  }),
}));

// New mock
jest.mock('../contexts/UnifiedAuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
    // Add any additional properties needed for your tests
  }),
}));
```

## Troubleshooting

### Circular Dependencies

If you encounter circular dependency warnings, use dynamic imports in your components:

```tsx
const { useAuth } = React.useMemo(() => {
  return require('../contexts/UnifiedAuthContext');
}, []);
```

### Type Errors

The unified auth system uses the updated User interface from `src/types/user.ts`. If you encounter type errors, make sure you're importing the correct User type:

```tsx
import { User } from '../types/user';
```

### Auth State Updates

The new system uses a centralized event system. Subscribe to auth events using the AuthService:

```tsx
import { authService, AuthEventType } from '../services';

const unsubscribe = authService.on(AuthEventType.AUTH_STATE_CHANGED, (event) => {
  console.log('Auth state changed:', event);
});

// Clean up on unmount
useEffect(() => {
  return () => unsubscribe();
}, []);
```

## Timeline

1. **Phase 1 (Current)**: Both systems available, feature flag set to `false` by default
2. **Phase 2 (Next Release)**: Feature flag enabled by default, legacy components still available
3. **Phase 3 (Future Release)**: Legacy components removed, only unified system available

## Questions?

Contact the authentication system team for assistance with migration or any questions about the new system.