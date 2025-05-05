/**
 * Services index file
 * 
 * Centralizes exports from service files to help manage imports
 * and avoid case-sensitivity issues.
 * 
 * @updated 2025-05-05 - Updated for unified auth system
 */

// CASING NOTE: TypeScript on case-sensitive file systems will report 
// errors if we import both './legacyAuthService' and './AuthService' directly.
// To work around this, we need to use the fully qualified paths with extensions.
// The error is: "File name differs from already included file name only in casing"

// UNIFIED AUTH SYSTEM - PREFERRED EXPORTS
// Export these as the primary/preferred auth system implementation
import type { AuthEvent, AuthMethod, SignMessageOutput } from './AuthService';
import { AuthEventType, AuthService, authService } from './AuthService';

// Export TokenManager utilities
import { TokenManager, TokenType } from './TokenManager';

// LEGACY AUTH SYSTEM - DEPRECATED EXPORTS
// These are only maintained for backward compatibility and will be removed in future
import * as authenticationServiceFunctions from './authenticationService';
import * as legacyAuthServiceFunctions from './legacyAuthService';

// Export both preferred and deprecated types/functions with clear naming
// Preferred auth system - use these for new code
export {
  AuthEventType, // Auth event type enum
  AuthService, // The auth service class
  authService // The new auth service instance
};

  export type {
    AuthEvent, // Auth event interface
    AuthMethod, // Auth method type
    SignMessageOutput // Signature output interface
  };

// Export TokenManager
  export { TokenManager, TokenType };

// Legacy/deprecated auth systems - avoid using in new code
// Name exports to make it clear they are deprecated
  export {
    legacyAuthServiceFunctions as legacyAuth,
    authenticationServiceFunctions as legacyWalletAuth
  };

// Re-export API services
  export * from './api';

// Export other services
export * from './clientLogService';
export * from './contestService';
export * from './systemReportsService';
export * from './userService';

