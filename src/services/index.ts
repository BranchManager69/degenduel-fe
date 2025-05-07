// src/services/index.ts

/**
 * Auth Services Index
 * 
 * @description Centralizes exports from service files to help manage imports
 * and avoid case-sensitivity issues.
 * 
 * @author BranchManager69
 * @version 1.9.0
 * @updated 2025-05-05 - Added unified auth system with fallback to legacy system
 * @updated 2025-05-07 - Legacy auth system is TO BE REMOVED TODAY! Haven't started stripping it out yet.
 */

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

