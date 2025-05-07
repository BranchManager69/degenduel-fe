// src/hooks/auth/index.ts
// Auth-related hooks

// Export current auth hook
export { useMigratedAuth } from './useMigratedAuth';

// Legacy exports (deprecated but maintained for backward compatibility)
// export { useAuth } from './legacy/useAuth'; // Removed legacy export

// Export types
export type { AuthState, MigratedAuthState, MigratedAuthUser, User } from './types';

