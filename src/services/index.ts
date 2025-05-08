// src/services/index.ts

/**
 * Auth Services Index
 * 
 * @description Centralizes exports from service files to help manage imports
 * and avoid case-sensitivity issues.
 * 
 * @author BranchManager69
 * @version 2.0.0 // Updated version after removing all legacy auth
 * @updated 2025-05-05 - Added unified auth system with fallback to legacy system
 * @updated 2025-05-08 // Updated date to reflect removal of legacy auth
 */

// UNIFIED AUTH SYSTEM - PREFERRED EXPORTS
// Export these as the primary/preferred auth system implementation
import type { AuthEvent, AuthMethod, SignMessageOutput } from './AuthService';
import { AuthEventType, AuthService, authService } from './AuthService';

// Export TokenManager utilities
// Import from the renamed file and export the corrected identifiers
import type { TokenInfo } from './tokenManagerService';
import { tokenManagerService, TokenType } from './tokenManagerService';

// LEGACY AUTH SYSTEM - DEPRECATED EXPORTS - ALL REMOVED
// These are only maintained for backward compatibility and will be removed in future
// import * as authenticationServiceFunctions from './authenticationService'; // REMOVED
// import * as legacyAuthServiceFunctions from './legacyAuthService'; // REMOVED

// Export both preferred and deprecated types/functions with clear naming
// Preferred auth system - use these for new code
export {
  AuthEventType, // Auth event type enum
  AuthService, // The auth service class
  authService // The new auth service instance
};

// Use 'export type' for re-exporting pure types
  export type {
    AuthEvent, // Auth event interface
    AuthMethod, // Auth method type
    SignMessageOutput // Signature output interface
  };

// Export tokenManagerService instance and its types/enums
  export { tokenManagerService, TokenType };
  export type { TokenInfo };

// Legacy/deprecated auth systems - avoid using in new code // ALL REMOVED
// Name exports to make it clear they are deprecated
  // export { // REMOVED
    // legacyAuthServiceFunctions as legacyAuth, // REMOVED
    // authenticationServiceFunctions as legacyWalletAuth // REMOVED
  // }; // REMOVED

// Re-export API services
  export * from './api';

// Export other services
export * from './clientLogService';
export * from './contestService';
export * from './systemReportsService';
export * from './userService';

