// src/services/authService.ts

/**
 * Authentication Service
 * 
 * Handles authentication-related functionality for the DegenDuel platform
 * 
 * This service now integrates with TokenManager for centralized token management.
 * 
 * @author BranchManager69
 * @version 2.0.0
 * @created 2025-05-03
 * @updated 2025-05-05
 */

import { TokenManager, TokenType } from './TokenManager';
import { authDebug } from '../config/config';

/**
 * Get the current JWT token
 * 
 * @returns Promise that resolves to the JWT token or null if not authenticated
 */
export const getAuthToken = async (): Promise<string | null> => {
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
 * @param token JWT token
 * @returns Decoded token payload or null if invalid
 */
export const parseJwt = (token: string): { exp?: number } | null => {
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
 * @returns Promise that resolves to true if authenticated, false otherwise
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getAuthToken();
  return !!token;
};

/**
 * Log out the current user
 */
export const logout = (): void => {
  // Clear all tokens from TokenManager
  TokenManager.clearAllTokens();
  
  // Reload the page to reset application state
  window.location.href = '/';
};

//
// Additional authentication methods would be implemented here
// For example: login, register, passwordReset, etc.
//