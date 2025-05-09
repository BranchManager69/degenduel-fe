// src/hooks/auth/index.ts
// Auth-related hooks

// Export current auth hook
export { useMigratedAuth } from './useMigratedAuth';

// Export biometric auth hook (from legacy for now)
export { useBiometricAuth } from './legacy/useBiometricAuth';

// Export QR Code auth hook
export { useQRCodeAuth } from './useQRCodeAuth';

// Legacy exports (deprecated but maintained for backward compatibility)
// export { useAuth } from './legacy/useAuth'; // Removed legacy export

// Export types
export type { AuthState, MigratedAuthState, MigratedAuthUser, User } from './types';

