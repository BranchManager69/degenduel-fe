// src/services/authService.ts
//
// NOTE: There are multiple auth service files with case-sensitive differences:
// - authService.ts (this file, lowercase, deprecated)
// - AuthService.ts (uppercase, new unified system)
//
// To avoid confusion, use imports from services/index.ts which handles these differences.

/**
 * DEPRECATED Authentication Service
 * 
 * This file is deprecated and will be removed in the next major release.
 * Please use the new unified AuthService from AuthService.ts instead.
 * 
 * @author BranchManager69
 * @version 2.0.0
 * @created 2025-05-03
 * @updated 2025-05-05
 * @deprecated Use the unified auth system from AuthService.ts
 */

// Display warning in console
console.warn(
  "%c[DEPRECATED] authService.ts is deprecated and will be removed in a future release. " +
  "Please use the unified auth system from AuthService.ts instead. " +
  "See UNIFIED_AUTH_SYSTEM_README.md for detailed migration instructions.",
  "color: red; font-weight: bold; background-color: yellow; padding: 2px 4px;"
);

import { TokenManager, TokenType } from './TokenManager';
import { authDebug } from '../config/config';

/**
 * Get the current JWT token
 * 
 * @deprecated Use authService.getToken() from the unified auth system
 * @returns Promise that resolves to the JWT token or null if not authenticated
 */
export const getAuthToken = async (): Promise<string | null> => {
  console.warn('[DEPRECATED] getAuthToken is deprecated. Use authService.getToken() instead.');
  try {
    // First try to get a JWT token specifically
    let token = TokenManager.getToken(TokenType.JWT);
    
    // If no JWT token is available, fall back to the best available token
    if (!token) {
      token = TokenManager.getBestAvailableToken();
      
      if (token) {
        authDebug('authService', 'Using alternative token type as no JWT is available');
      }
    }
    
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Parse a JWT token
 * 
 * @deprecated Use TokenManager utility methods instead
 * @param token JWT token
 * @returns Decoded token payload or null if invalid
 */
export const parseJwt = (token: string): { exp?: number } | null => {
  console.warn('[DEPRECATED] parseJwt is deprecated. Use TokenManager utilities instead.');
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT:', error);
    return null;
  }
};

/**
 * Check if the user is authenticated
 * 
 * @deprecated Use authService.isAuthenticated() from the unified auth system
 * @returns Promise that resolves to true if authenticated, false otherwise
 */
export const isAuthenticated = async (): Promise<boolean> => {
  console.warn('[DEPRECATED] isAuthenticated is deprecated. Use authService.isAuthenticated() instead.');
  const token = await getAuthToken();
  return !!token;
};

/**
 * Log out the current user
 * 
 * @deprecated Use authService.logout() from the unified auth system
 */
export const logout = (): void => {
  console.warn('[DEPRECATED] logout is deprecated. Use authService.logout() instead.');
  // Clear all tokens from TokenManager
  TokenManager.clearAllTokens();
  
  // Reload the page to reset application state
  window.location.href = '/';
};

//
// Additional authentication methods would be implemented here
// For example: login, register, passwordReset, etc.
//