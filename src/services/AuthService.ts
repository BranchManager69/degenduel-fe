// src/services/AuthService.ts
//
// NOTE: There are multiple auth service files with case-sensitive differences:
// - authService.ts (lowercase, DEPRECATED)
// - AuthService.ts (this file, uppercase, NEW UNIFIED AUTH SYSTEM - PREFERRED)
//
// To avoid confusion, use imports from services/index.ts which handles these differences.

/**
 * AuthService.ts
 * 
 * @description Unified Authentication Service for DegenDuel
 * 
 * This service centralizes all authentication logic that was previously spread across multiple
 * services, hooks, and components. It provides a single interface for all authentication-related
 * operations and manages token storage, retrieval, and validation.
 * 
 * @author BranchManager69
 * @version 1.9.1
 * @created 2025-05-05 - Added Unified auth system
 * @updated 2025-05-08 - Cleaned up legacy comments and refined types.
 */

import { authDebug } from '../config/config';
import axiosInstance from '../lib/axiosInstance';
import { User } from '../types/user';
import { tokenManagerService, TokenType } from './index';

// Auth method types - EXPANDED based on Privy config
export type AuthMethod = 
  | 'wallet' 
  | 'privy' 
  | 'twitter' 
  | 'session' 
  | 'email' 
  | 'sms' 
  | 'google' 
  | 'discord' 
  | 'github' 
  | 'apple' 
  | 'telegram' 
  | 'passkey'; 

// Authentication event types
export enum AuthEventType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  AUTH_STATE_CHANGED = 'auth_state_changed',
  TOKEN_REFRESHED = 'token_refreshed',
  AUTH_ERROR = 'auth_error'
}

// Event payload typing
export interface AuthEvent {
  type: AuthEventType;
  method?: AuthMethod;
  user?: User | null;
  error?: Error | null;
  token?: string;
  tokenType?: TokenType;
}

// Authentication response
export interface AuthResponse {
  user: User;
  token: string; 
  expiresIn?: number;
  refreshToken?: string;
}

// Types for signature formats
export interface SignMessageOutput {
  signature?: Uint8Array;
  signatureBytes?: Uint8Array;
}

/**
 * Central Authentication Service for DegenDuel
 * 
 * This class provides a unified interface for all authentication operations,
 * replacing the previous fragmented system of multiple services and hooks.
 */
export class AuthService {
  private user: User | null = null;
  private eventListeners: Map<AuthEventType, Set<(event: AuthEvent) => void>> = new Map();
  private static instance: AuthService;
  private isInitialized: boolean = false; // Flag to track initialization
  
  /**
   * Get the singleton instance of the AuthService
   */
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
      // Call initialization AFTER the instance is created and assigned
      AuthService.instance.initialize(); 
    }
    return AuthService.instance;
  }
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Handle window events related to auth
    if (typeof window !== 'undefined') {
      // Create a debug function on window
      (window as any).debugAuth = () => this.debugState();
    }
  }
  
  /**
   * New async initialization method
   */
  private async initialize() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true; // Prevent double initialization
    authDebug('AuthService', 'Initializing and restoring session...');
    await this.restoreSession(); 
    this.setupTokenRefreshHandlers();
    authDebug('AuthService', 'Initialization complete.');
  }
  
  /**
   * Debug helper function
   */
  private debugState() {
    const state = {
      user: this.user,
      isAuthenticated: !!this.user,
      jwtToken: tokenManagerService.getToken(TokenType.JWT),
      wsToken: tokenManagerService.getToken(TokenType.WS_TOKEN),
      sessionToken: tokenManagerService.getToken(TokenType.SESSION)
    };
    
    authDebug('AuthService', 'Current auth state', state);
    return state;
  }
  
  /**
   * Restore session from stored tokens if available
   */
  private async restoreSession() {
    try {
      // Ensure tokenManagerService is ready before using it
      if (tokenManagerService) { 
        if (tokenManagerService.getToken(TokenType.JWT)) {
          authDebug('AuthService', 'Found stored JWT token, attempting to restore session');
          const sessionResult = await this.checkAuth();
          
          if (sessionResult) {
            authDebug('AuthService', 'Successfully restored session');
          } else {
            authDebug('AuthService', 'Failed to restore session, tokens may be invalid');
            // Clear invalid tokens
            tokenManagerService.clearAllTokens();
          }
        }
      } else {
        // This case should ideally not happen if imports are correct,
        // but handle it defensively.
        authDebug('AuthService', 'TokenManagerService not available during restoreSession');
      }
    } catch (error) {
      authDebug('AuthService', 'Error restoring session', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Register an event listener
   * 
   * @param eventType Type of event to listen for
   * @param callback Callback to invoke when event occurs
   * @returns Function to unregister the listener
   */
  public on(eventType: AuthEventType, callback: (event: AuthEvent) => void): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    
    this.eventListeners.get(eventType)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(eventType);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }
  
  /**
   * Dispatch an event to all registered listeners
   * 
   * @param event Event to dispatch
   */
  private dispatchEvent(event: AuthEvent) {
    const listeners = this.eventListeners.get(event.type);
    
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in auth event listener:', error);
        }
      });
    }
    
    // Also dispatch AUTH_STATE_CHANGED for login/logout events
    if (event.type === AuthEventType.LOGIN || event.type === AuthEventType.LOGOUT) {
      this.dispatchEvent({
        type: AuthEventType.AUTH_STATE_CHANGED,
        user: this.user,
        method: event.method
      });
    }
  }
  
  /**
   * Set the current authenticated user
   * 
   * @param user User object
   * @param method Auth method used
   */
  private setUser(user: User | null, method?: AuthMethod) {
    this.user = user;
    
    // Dispatch appropriate event
    if (user) {
      this.dispatchEvent({
        type: AuthEventType.AUTH_STATE_CHANGED,
        user,
        method
      });
    } else {
      this.dispatchEvent({
        type: AuthEventType.AUTH_STATE_CHANGED,
        user: null,
        method
      });
    }
  }
  
  /**
   * Get the currently authenticated user
   * 
   * @returns Current user or null if not authenticated
   */
  public getUser(): User | null {
    return this.user;
  }
  
  /**
   * Check if user is authenticated
   * 
   * @returns True if authenticated, false otherwise
   */
  public isAuthenticated(): boolean {
    return !!this.user;
  }
  
  /**
   * Check if user has a specific role
   * 
   * @param role Role to check for
   * @returns True if user has the specified role
   */
  public hasRole(role: string): boolean {
    if (!this.user) return false;
    
    if (role === 'superadmin') {
      return this.user.role === 'superadmin';
    } else if (role === 'admin') {
      return this.user.role === 'admin' || this.user.role === 'superadmin';
    }
    
    return this.user.role === role;
  }
  
  /**
   * Check authentication status with the server
   * 
   * @returns Promise that resolves to true if authenticated, false otherwise
   */
  public async checkAuth(): Promise<boolean> {
    try {
      authDebug('AuthService', 'Checking authentication status');
      
      const response = await axiosInstance.get('/auth/status');
      
      const isAuthenticated = response.data?.authenticated || false;
      const authMethods = response.data?.methods || {};
      
      // Find active authentication method
      let activeMethod: AuthMethod | null = null;
      for (const [method, status] of Object.entries(authMethods)) {
        if (status && (status as any).active) {
          activeMethod = method as AuthMethod;
          break;
        }
      }
      
      // Get user from active method or from response directly
      const user = 
        (activeMethod && authMethods[activeMethod]?.details) || 
        response.data?.user || 
        null;
      
      if (isAuthenticated && user) {
        // Ensure user has a wallet address (required field)
        if (!user.wallet_address) {
          authDebug('AuthService', 'User from auth check missing wallet_address', { 
            user_id: user.id 
          });
          // Don't throw here - log and return false to trigger a re-auth
          return false;
        }
        
        authDebug('AuthService', 'User is authenticated', {
          method: activeMethod,
          userId: user.id,
          wallet: user.wallet_address
        });
        
        // Update user but don't notify if it's the same user to avoid unnecessary updates
        const currentUserId = this.user?.id;
        const newUserId = user.id;
        
        if (currentUserId !== newUserId || !this.user) {
          this.setUser(user, activeMethod || undefined);
        }
        
        // Sync any tokens in the response with TokenManager
        if (user.jwt) {
          tokenManagerService.setToken(
            TokenType.JWT, 
            user.jwt, 
            tokenManagerService.estimateExpiration(user.jwt),
            activeMethod || 'server'
          );
        }
        
        if (user.wsToken) {
          tokenManagerService.setToken(
            TokenType.WS_TOKEN, 
            user.wsToken, 
            tokenManagerService.estimateExpiration(user.wsToken),
            activeMethod || 'server'
          );
        }
        
        if (user.session_token) {
          tokenManagerService.setToken(
            TokenType.SESSION, 
            user.session_token, 
            tokenManagerService.estimateExpiration(user.session_token, 30), // Session tokens usually last longer
            activeMethod || 'server'
          );
        }
        
        return true;
      } else {
        authDebug('AuthService', 'User is not authenticated');
        
        // If we thought we were authenticated but server says no, clear user
        if (this.user) {
          this.setUser(null);
        }
        
        return false;
      }
    } catch (error: any) {
      authDebug('AuthService', 'Error checking auth status', {
        error: error?.response?.data || error?.message || String(error)
      });
      
      // Check if it was specifically a 401 (which the interceptor couldn't refresh)
      if (error?.response?.status === 401) {
        if (this.user) {
          authDebug('AuthService', 'Received 401 on status check, clearing user');
          // No need to call clearAllTokens here, as logout would have been triggered by interceptor
          this.setUser(null); 
        }
      } // Other errors (like network errors) don't automatically mean logout
      
      return false;
    }
  }
  
  /**
   * Get a token for authentication
   * 
   * @param type Type of token to get
   * @returns Promise that resolves to the token or null if not available
   */
  public async getToken(type: TokenType = TokenType.JWT): Promise<string | null> {
    let token = tokenManagerService.getToken(type);
    
    if (!token && this.isAuthenticated()) {
      try {
        authDebug('AuthService', `No ${type} token found, requesting from server`);
        
        let endpoint: string;
        switch (type) {
          case TokenType.WS_TOKEN:
            endpoint = '/api/auth/ws-token';
            break;
          case TokenType.JWT:
          case TokenType.SESSION:
          default:
            endpoint = '/api/auth/token';
            break;
        }
        
        const timestamp = new Date().getTime();
        const url = `${endpoint}?_t=${timestamp}`;
        
        const response = await axiosInstance.get(url, {
          timeout: 5000 
        }); 
        
        token = response.data.token;
        
        if (token) {
          tokenManagerService.setToken(
            type,
            token,
            tokenManagerService.estimateExpiration(token),
            'server'
          );
          
          if (this.user) {
            const updatedUser = { ...this.user };
            switch (type) {
              case TokenType.JWT: updatedUser.jwt = token; break;
              case TokenType.WS_TOKEN: updatedUser.wsToken = token; break;
              case TokenType.SESSION: updatedUser.session_token = token; break;
            }
            this.user = updatedUser;
          }
          
          this.dispatchEvent({
            type: AuthEventType.TOKEN_REFRESHED,
            token,
            tokenType: type
          });
        }
      } catch (error: any) {
        authDebug('AuthService', `Error getting ${type} token`, {
           error: error?.response?.data || error?.message || String(error)
        });
        this.dispatchEvent({
          type: AuthEventType.AUTH_ERROR,
          error: error instanceof Error ? error : new Error(String(error))
        });
      }
    }
    return token;
  }
  
  /**
   * Login with wallet by signing a message
   * 
   * @param walletAddress Wallet address
   * @param signMessage Function to sign a message
   * @returns Promise that resolves to the authenticated user
   */
  public async loginWithWallet(
    walletAddress: string,
    signMessage: (message: Uint8Array) => Promise<SignMessageOutput>
  ): Promise<User> {
    try {
      authDebug('AuthService', 'Starting wallet authentication', { walletAddress });
      
      // Use the configured instance for challenge
      const nonceResponse = await axiosInstance.get('/auth/challenge', { 
        params: { wallet: walletAddress }
      });
      
      const nonce = nonceResponse.data.nonce || nonceResponse.data.challenge;
      
      // Create message to sign
      const message = `DegenDuel Authentication\nWallet: ${walletAddress}\nNonce: ${nonce}\nTimestamp: ${Date.now()}`;
      const encodedMessage = new TextEncoder().encode(message);
      
      // Sign message
      const signatureResult = await signMessage(encodedMessage);
      
      // Extract signature based on format
      let signature;
      if (signatureResult.signatureBytes) {
        // Jupiter wallet format
        signature = Array.from(signatureResult.signatureBytes);
      } else if (signatureResult.signature) {
        // Legacy format
        signature = Array.from(signatureResult.signature);
      } else {
        // Fallback for other wallet implementations
        signature = Array.from(signatureResult as unknown as Uint8Array);
      }
      
      // Use the configured instance for verification
      const authResponse = await axiosInstance.post('/auth/verify-wallet', { 
        wallet: walletAddress,
        signature,
        message
      }, {
        headers: {
            'X-Debug': 'true', // Keep specific headers if needed
             Origin: window.location.origin
        }
      });
      
      const { token, user } = authResponse.data;
      
      if (!user) {
        throw new Error('No user returned from authentication');
      }
      
      // Store JWT token
      if (token) {
        tokenManagerService.setToken(
          TokenType.JWT,
          token,
          tokenManagerService.estimateExpiration(token),
          'wallet'
        );
      }
      
      // Store user
      this.setUser(user, 'wallet');
      
      // Request WebSocket token
      tokenManagerService.refreshToken(TokenType.WS_TOKEN);
      
      // Dispatch login event
      this.dispatchEvent({
        type: AuthEventType.LOGIN,
        user,
        method: 'wallet'
      });
      
      return user;
    } catch (error: any) {
      authDebug('AuthService', 'Wallet authentication failed', {
        error: error?.response?.data || error?.message || String(error),
        walletAddress
      });
      this.dispatchEvent({
        type: AuthEventType.AUTH_ERROR,
        error: error instanceof Error ? error : new Error(String(error)),
        method: 'wallet'
      });
      throw error;
    }
  }
  
  /**
   * Login with Privy
   * 
   * @param token Privy token
   * @param userId Privy user ID
   * @returns Promise that resolves to the authenticated user
   */
  public async loginWithPrivy(token: string, userId: string): Promise<User> {
    try {
      authDebug('AuthService', 'Starting Privy authentication', { userId });
      
      // Use the configured instance
      const response = await axiosInstance.post('/auth/verify-privy', { 
        token,
        userId
      }); 
      
      const { user, token: jwtToken } = response.data;
      
      if (!user) {
        throw new Error('No user returned from Privy authentication');
      }
      
      // Ensure user has a wallet_address (required field)
      if (!user.wallet_address) {
        authDebug('AuthService', 'User from Privy authentication missing wallet_address', { 
          userId, 
          user_id: user.id 
        });
        throw new Error('Invalid user data: wallet_address is required');
      }
      
      // Store JWT token
      if (jwtToken) {
        tokenManagerService.setToken(
          TokenType.JWT,
          jwtToken,
          tokenManagerService.estimateExpiration(jwtToken),
          'privy'
        );
      }
      
      // Store user
      this.setUser(user, 'privy');
      
      // Request WebSocket token
      tokenManagerService.refreshToken(TokenType.WS_TOKEN);
      
      // Dispatch login event
      this.dispatchEvent({
        type: AuthEventType.LOGIN,
        user,
        method: 'privy'
      });
      
      return user;
    } catch (error: any) {
      authDebug('AuthService', 'Privy authentication failed', {
        error: error?.response?.data || error?.message || String(error),
        userId
      });
      this.dispatchEvent({
        type: AuthEventType.AUTH_ERROR,
        error: error instanceof Error ? error : new Error(String(error)),
        method: 'privy'
      });
      throw error;
    }
  }
  
  /**
   * Link Twitter account to existing user
   * 
   * @returns Promise that resolves to the redirect URL
   */
  public async linkTwitter(): Promise<string> {
    if (!this.isAuthenticated()) {
      throw new Error('Must be authenticated to link Twitter account');
    }
    
    try {
      // Use the configured instance
      const response = await axiosInstance.get('/api/auth/twitter/link'); 
      return response.data.redirectUrl;
    } catch (error: any) { 
      authDebug('AuthService', 'Twitter linking failed', {
        error: error?.response?.data || error?.message || String(error)
      });
      throw error;
    }
  }
  
  /**
   * Link Privy account to existing user
   * 
   * @param token Privy token
   * @param userId Privy user ID
   * @returns Promise that resolves to true if successful
   */
  public async linkPrivy(token: string, userId: string): Promise<boolean> {
    if (!this.isAuthenticated()) {
      throw new Error('Must be authenticated to link Privy account');
    }
    
    try {
      // Use the configured instance
      const response = await axiosInstance.post('/api/auth/privy/link', { 
        token,
        userId
      });
      
      // Update user if returned
      if (response.data.user) {
        this.setUser(response.data.user);
      }
      
      return true;
    } catch (error: any) { 
      authDebug('AuthService', 'Privy linking failed', {
        error: error?.response?.data || error?.message || String(error)
      });
      return false;
    }
  }
  
  /**
   * Logout the current user
   */
  public async logout(): Promise<void> {
    try {
      authDebug('AuthService', 'Logging out user');
      
      // Use the configured instance
      await axiosInstance.post('/api/auth/logout', {}); 
      
      // Clear all tokens
      tokenManagerService.clearAllTokens();
      
      // Clear user
      const previousUser = this.user;
      this.setUser(null);
      
      // Dispatch logout event
      this.dispatchEvent({
        type: AuthEventType.LOGOUT,
        user: previousUser
      });
      
    } catch (error: any) {
      authDebug('AuthService', 'Error during logout', {
        error: error?.response?.data || error?.message || String(error)
      });
      // Still clear tokens/user even if API fails
      tokenManagerService.clearAllTokens(); 
      this.setUser(null);
    }
  }

  // setupTokenRefreshHandlers remains the same (currently empty)
  private setupTokenRefreshHandlers() { /* ... */ }
}

// Export singleton instance
export const authService = AuthService.getInstance();