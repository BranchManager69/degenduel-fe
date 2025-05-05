// src/hooks/auth/index.ts
// Auth-related hooks

// Export current auth hook
export { useMigratedAuth } from './useMigratedAuth';

// Legacy exports (deprecated but maintained for backward compatibility)
export { useAuth } from './legacy/useAuth';

// Export types
export type { User, AuthState, MigratedAuthState, MigratedAuthUser } from './types';
