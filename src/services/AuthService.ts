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

import { API_URL, authDebug } from '../config/config';
import axiosInstance from '../lib/axiosInstance';
import { useStore } from '../store/useStore';
import { User } from '../types/user';
import { tokenManagerService, TokenType } from './tokenManagerService';

// Auth method types
export type AuthMethod =
  | 'wallet'
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
      // Check if user explicitly logged out (prevent auto-restore after explicit logout)
      const explicitLogout = localStorage.getItem('degen_explicit_logout');
      if (explicitLogout === 'true') {
        authDebug('AuthService', 'Skipping session restore - user explicitly logged out');
        return;
      }

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

    // Also update the store immediately to prevent race conditions
    // This ensures TokenManagerService can access the user when setting tokens
    try {
      const store = useStore.getState();
      if (store.setUser) {
        store.setUser(user);
        authDebug('AuthService', `Updated store with user: ${user ? `${user.id} (${user.wallet_address})` : 'null'}`);
      } else {
        authDebug('AuthService', 'Warning: setUser not found in store during user update');
      }
    } catch (error) {
      authDebug('AuthService', 'Error updating store with user', error);
    }

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
    let retryCount = 0;
    const maxRetries = 2; // Example: Retry up to 2 times for server errors
    const retryDelay = 1500; // Example: 1.5 seconds delay

    while (retryCount <= maxRetries) {
      try {
        authDebug('AuthService', `Checking authentication status (attempt ${retryCount + 1})`);
        const statusUrl = `${API_URL}/auth/status`;
        const response = await axiosInstance.get(statusUrl);
        const isAuthenticated = response.data?.authenticated || false;
        const authMethods = response.data?.methods || {};
        let activeMethod: AuthMethod | null = null;
        for (const [method, status] of Object.entries(authMethods)) {
          if (status && (status as any).active) {
            activeMethod = method as AuthMethod;
            break;
          }
        }
        const user = (activeMethod && authMethods[activeMethod]?.details) || response.data?.user || null;

        if (isAuthenticated && user) {
          if (!user.wallet_address) {
            authDebug('AuthService', 'User from auth check missing wallet_address', { user_id: user.id });
            if (this.user) this.setUser(null); // Clear user if data is invalid
            return false;
          }
          authDebug('AuthService', 'User is authenticated', { method: activeMethod, userId: user.id, wallet: user.wallet_address });
          const currentUserId = this.user?.id;
          if (currentUserId !== user.id || !this.user) {
            this.setUser(user, activeMethod || undefined);
          }
          // Sync tokens (ensure tokenManagerService is used correctly here)
          if (user.jwt) tokenManagerService.setToken(TokenType.JWT, user.jwt, tokenManagerService.estimateExpiration(user.jwt), activeMethod || 'server');
          if (user.wsToken) tokenManagerService.setToken(TokenType.WS_TOKEN, user.wsToken, tokenManagerService.estimateExpiration(user.wsToken), activeMethod || 'server');
          if (user.session_token) tokenManagerService.setToken(TokenType.SESSION, user.session_token, tokenManagerService.estimateExpiration(user.session_token, 30), activeMethod || 'server');
          return true; // Successfully authenticated or confirmed existing session
        } else {
          authDebug('AuthService', 'User is not authenticated per /auth/status');
          if (this.user) this.setUser(null); // Clear if previously logged in
          return false;
        }
      } catch (error: any) {
        const status = error?.response?.status;
        authDebug('AuthService', 'Error checking auth status', { status, errorMsg: error?.response?.data || error?.message || String(error) });

        if (status === 401 || status === 403) {
          authDebug('AuthService', `Received ${status} on status check, definitive logout.`);
          if (this.user) this.setUser(null);
          tokenManagerService.clearAllTokens(); // Ensure tokens are cleared on 401/403
          // Clear explicit logout flag so session can be restored if valid tokens exist
          localStorage.removeItem('degen_explicit_logout');
          return false; // Definitive unauthenticated state
        }

        // For 5xx server errors or network errors, retry with backoff
        if (retryCount < maxRetries) {
          retryCount++;
          authDebug('AuthService', `Attempt ${retryCount}/${maxRetries + 1} failed. Retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount)); // Incremental backoff
          continue; // Continue to next iteration of the while loop
        } else {
          authDebug('AuthService', 'Max retries reached for /auth/status. Assuming indeterminate auth state, but not logging out yet unless tokens were already bad.');
          // After max retries for server/network errors, don't immediately log out.
          // Maintain current client-side auth state but signal that status is unknown/degraded.
          // The caller or other parts of the system might decide to log out after prolonged inability to check status.
          // For now, return current state (if user exists, assume valid until proven otherwise by a 401/403).
          // However, if we had no user to begin with, then we are indeed not authenticated.
          this.dispatchEvent({
            type: AuthEventType.AUTH_ERROR,
            error: new Error('Failed to verify auth status after multiple retries.'),
          });
          return !!this.user; // Return current known auth state
        }
      }
    }
    return !!this.user; // Should not be reached if loop logic is correct, but as a fallback
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
            endpoint = '/auth/token';
            break;
          case TokenType.JWT:
          case TokenType.SESSION:
          default:
            endpoint = '/auth/token';
            break;
        }

        const timestamp = new Date().getTime();
        const url = `${endpoint}?_t=${timestamp}`;
        const tokenUrl = `${API_URL}${url}`;
        const response = await axiosInstance.get(tokenUrl, {
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
      const challengeUrl = `${API_URL}/auth/challenge?wallet=${encodeURIComponent(walletAddress)}`;
      const nonceResponse = await axiosInstance.get(challengeUrl);

      const nonce = nonceResponse.data.nonce || nonceResponse.data.challenge;

      if (!nonce) {
        throw new Error('Failed to get authentication nonce from server');
      }

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
      const verifyUrl = `${API_URL}/auth/verify-wallet`;
      const authResponse = await axiosInstance.post(verifyUrl, {
        wallet: walletAddress,
        signature,
        message
      }, {
        headers: {
          'X-Debug': 'true' // Remove unsafe Origin header
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

      // Clear explicit logout flag (user is now logged in)
      localStorage.removeItem('degen_explicit_logout');

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
      const twitterLinkUrl = `${API_URL}/auth/twitter/link`;
      const response = await axiosInstance.get(twitterLinkUrl);
      return response.data.redirectUrl;
    } catch (error: any) {
      authDebug('AuthService', 'Twitter linking failed', {
        error: error?.response?.data || error?.message || String(error)
      });
      throw error;
    }
  }


  /**
   * Logout the current user
   */
  public async logout(): Promise<void> {
    try {
      authDebug('AuthService', 'Logging out user');

      // Mark that user explicitly logged out (prevent auto-restore)
      localStorage.setItem('degen_explicit_logout', 'true');

      // Use the configured instance
      const logoutUrl = `${API_URL}/auth/logout`;
      await axiosInstance.post(logoutUrl, {});

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

  /**
   * Nuclear reset - clears all auth data and forces clean state
   * Use this for fixing stuck auth states
   */
  public hardReset(): void {
    authDebug('AuthService', 'Performing hard reset of auth state');

    // Clear all tokens
    tokenManagerService.clearAllTokens();

    // Clear user
    this.setUser(null);

    // Clear explicit logout flag
    localStorage.removeItem('degen_explicit_logout');

    // Clear any other auth-related localStorage items
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.includes('auth') || key.includes('token') || key.includes('degen'))) {
        localStorage.removeItem(key);
      }
    }

    authDebug('AuthService', 'Hard reset complete - page refresh recommended');
  }

  // setupTokenRefreshHandlers remains the same (currently empty)
  private setupTokenRefreshHandlers() { /* ... */ }
}

// Export singleton instance
export const authService = AuthService.getInstance();