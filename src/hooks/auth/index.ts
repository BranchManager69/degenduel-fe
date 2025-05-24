// src/hooks/auth/index.ts
// Auth-related hooks

// Export the primary auth hook
export { useAuth } from '../../contexts/UnifiedAuthContext';

// Export other auth-related hooks
export { useBiometricAuth } from './legacy/useBiometricAuth';

// Export QR Code auth hook
export { useQRCodeAuth } from './useQRCodeAuth';

// Legacy exports (deprecated but maintained for backward compatibility)
// export { useAuth } from './legacy/useAuth'; // Removed legacy export

// Export types
export type { AuthState, MigratedAuthState, MigratedAuthUser, User } from './types';

