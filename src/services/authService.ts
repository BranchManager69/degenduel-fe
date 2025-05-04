// src/services/authService.ts

/**
 * Authentication Service
 * 
 * Handles authentication-related functionality for the DegenDuel platform
 * 
 * WARNING: REFACTOR PENDING (May 2025)
 * This is one of THREE separate authentication services in the codebase.
 * This file handles token management and is used by the newer AI service.
 * The complete auth system will be consolidated into a single service.
 * 
 * @author BranchManager69
 * @version 1.8.9
 * @created 2025-05-03
 * @updated 2025-05-03
 */

// Config
//import { API_URL } from '../config/config';
//console.log('Auth Svc API_URL', API_URL);

// Store JWT in localStorage with constant key
const TOKEN_KEY = 'degenduel_jwt';

/**
 * Get the current JWT token
 * 
 * @returns Promise that resolves to the JWT token or null if not authenticated
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    // Check localStorage for cached token
    const cachedToken = localStorage.getItem(TOKEN_KEY);
    
    if (cachedToken) {
      // Verify token is not expired
      const decoded = parseJwt(cachedToken);
      
      if (decoded && decoded.exp && decoded.exp * 1000 > Date.now()) {
        return cachedToken;
      }
      
      // Token is expired, remove it
      localStorage.removeItem(TOKEN_KEY);
    }
    
    // For now, return a dummy JWT token or null
    // In a real implementation, we would check with the server to refresh the token
    // and return the refreshed token
    
    // TODO: Implement token refresh logic
    
    // For development, return a static token
    if (process.env.NODE_ENV === 'development') {
      return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhbm9ueW1vdXMiLCJpYXQiOjE3MTYwNTg1NzQsImV4cCI6MTcxNjY2MzM3NH0.z-9m2v-Q3_S_qYv2tFgZEyVxMaW9Xt0UWmbdG9u1b4s';
    }
    
    return null;
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
  localStorage.removeItem(TOKEN_KEY);
  
  // Reload the page to reset application state
  window.location.href = '/';
};

//
// Additional authentication methods would be implemented here
// For example: login, register, passwordReset, etc.
//