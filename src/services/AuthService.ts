// src/services/AuthService.ts
//
// NOTE: There are multiple auth service files with case-sensitive differences:
// - authService.ts (lowercase, deprecated)
// - AuthService.ts (this file, uppercase, new unified system)
//
// To avoid confusion, use imports from services/index.ts which handles these differences.

/**
 * AuthService.ts
 * 
 * Unified Authentication Service for DegenDuel
 * 
 * This service centralizes all authentication logic that was previously spread across multiple
 * services, hooks, and components. It provides a single interface for all authentication-related
 * operations and manages token storage, retrieval, and validation.
 * 
 * @author BranchManager69
 * @version 1.0.0
 * @created 2025-05-05
 */

import axios from 'axios';
import { User } from '../types/user';
import { authDebug } from '../config/config';
import { TokenManager, TokenType } from './TokenManager';

// Auth method types
export type AuthMethod = 'wallet' | 'privy' | 'twitter' | 'session';

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
  
  // Singleton instance
  private static instance: AuthService;
  
  /**
   * Get the singleton instance of the AuthService
   */
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Initialize token manager
    this.setupTokenRefreshHandlers();
    
    // Handle window events related to auth
    if (typeof window !== 'undefined') {
      // Create a debug function on window
      (window as any).debugAuth = () => this.debugState();
      
      // Handle any stored session
      this.restoreSession();
    }
  }
  
  /**
   * Debug helper function
   */
  private debugState() {
    const state = {
      user: this.user,
      isAuthenticated: !!this.user,
      availableTokens: TokenManager.getAllTokens(),
      jwtToken: TokenManager.getToken(TokenType.JWT),
      wsToken: TokenManager.getToken(TokenType.WS_TOKEN),
      sessionToken: TokenManager.getToken(TokenType.SESSION)
    };
    
    authDebug('AuthService', 'Current auth state', state);
    return state;
  }
  
  /**
   * Set up token refresh handlers
   */
  private setupTokenRefreshHandlers() {
    // To be implemented once TokenManager refresh events are available
  }
  
  /**
   * Restore session from stored tokens if available
   */
  private async restoreSession() {
    try {
      // Sync tokens from any storage
      TokenManager.syncFromStore();
      
      // If we have valid tokens, try to restore session
      if (TokenManager.getBestAvailableToken()) {
        authDebug('AuthService', 'Found stored tokens, attempting to restore session');
        const sessionResult = await this.checkAuth();
        
        if (sessionResult) {
          authDebug('AuthService', 'Successfully restored session');
        } else {
          authDebug('AuthService', 'Failed to restore session, tokens may be invalid');
          // Clear invalid tokens
          TokenManager.clearAllTokens();
        }
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
      
      const response = await axios.get('/api/auth/status', {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
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
          TokenManager.setToken(
            TokenType.JWT, 
            user.jwt, 
            TokenManager.estimateExpiration(user.jwt),
            activeMethod || 'server'
          );
        }
        
        if (user.wsToken) {
          TokenManager.setToken(
            TokenType.WS_TOKEN, 
            user.wsToken, 
            TokenManager.estimateExpiration(user.wsToken),
            activeMethod || 'server'
          );
        }
        
        if (user.session_token) {
          TokenManager.setToken(
            TokenType.SESSION, 
            user.session_token, 
            TokenManager.estimateExpiration(user.session_token, 30), // Session tokens usually last longer
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
    } catch (error) {
      authDebug('AuthService', 'Error checking auth status', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Only clear user if we get a definitive 401 Unauthorized
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        if (this.user) {
          authDebug('AuthService', 'Received 401, clearing user');
          this.setUser(null);
        }
      }
      
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
    // First try to get from TokenManager
    let token = TokenManager.getToken(type);
    
    // If we don't have a token but are authenticated, try to get one from the server
    if (!token && this.isAuthenticated()) {
      try {
        authDebug('AuthService', `No ${type} token found, requesting from server`);
        
        let endpoint: string;
        switch (type) {
          case TokenType.WS_TOKEN:
            endpoint = '/api/auth/ws-token';
            break;
          case TokenType.REFRESH:
            endpoint = '/api/auth/refresh-token';
            break;
          case TokenType.JWT:
          default:
            endpoint = '/api/auth/token';
            break;
        }
        
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        const url = `${endpoint}?_t=${timestamp}`;
        
        const response = await axios.get(url, {
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          withCredentials: true,
          timeout: 5000 // 5 second timeout
        });
        
        token = response.data.token;
        
        if (token) {
          // Store token in TokenManager
          TokenManager.setToken(
            type,
            token,
            TokenManager.estimateExpiration(token),
            'server'
          );
          
          // If we have a user, update their tokens as well
          if (this.user) {
            const updatedUser = { ...this.user };
            
            switch (type) {
              case TokenType.JWT:
                updatedUser.jwt = token;
                break;
              case TokenType.WS_TOKEN:
                updatedUser.wsToken = token;
                break;
              case TokenType.SESSION:
                updatedUser.session_token = token;
                break;
            }
            
            this.user = updatedUser;
          }
          
          // Dispatch token refreshed event
          this.dispatchEvent({
            type: AuthEventType.TOKEN_REFRESHED,
            token,
            tokenType: type
          });
        }
      } catch (error) {
        authDebug('AuthService', `Error getting ${type} token`, {
          error: error instanceof Error ? error.message : String(error)
        });
        
        // Dispatch error event
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
      
      // Get nonce from backend
      const nonceResponse = await axios.get('/api/auth/challenge', {
        params: { wallet: walletAddress },
        withCredentials: true
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
      
      // Verify signature with backend
      const authResponse = await axios.post('/api/auth/verify-wallet', {
        wallet: walletAddress,
        signature,
        message
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Debug': 'true',
          'Origin': window.location.origin
        }
      });
      
      const { token, user } = authResponse.data;
      
      if (!user) {
        throw new Error('No user returned from authentication');
      }
      
      // Store JWT token
      if (token) {
        TokenManager.setToken(
          TokenType.JWT,
          token,
          TokenManager.estimateExpiration(token),
          'wallet'
        );
      }
      
      // Store user
      this.setUser(user, 'wallet');
      
      // Request WebSocket token
      TokenManager.refreshToken(TokenType.WS_TOKEN);
      
      // Dispatch login event
      this.dispatchEvent({
        type: AuthEventType.LOGIN,
        user,
        method: 'wallet'
      });
      
      return user;
    } catch (error) {
      authDebug('AuthService', 'Wallet authentication failed', {
        error: error instanceof Error ? error.message : String(error),
        walletAddress
      });
      
      // Dispatch error event
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
      
      // Call verify endpoint
      const response = await axios.post('/api/auth/verify-privy', {
        token,
        userId
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
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
        TokenManager.setToken(
          TokenType.JWT,
          jwtToken,
          TokenManager.estimateExpiration(jwtToken),
          'privy'
        );
      }
      
      // Store user
      this.setUser(user, 'privy');
      
      // Request WebSocket token
      TokenManager.refreshToken(TokenType.WS_TOKEN);
      
      // Dispatch login event
      this.dispatchEvent({
        type: AuthEventType.LOGIN,
        user,
        method: 'privy'
      });
      
      return user;
    } catch (error) {
      authDebug('AuthService', 'Privy authentication failed', {
        error: error instanceof Error ? error.message : String(error),
        userId
      });
      
      // Dispatch error event
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
      const response = await axios.get('/api/auth/twitter/link', {
        withCredentials: true
      });
      
      return response.data.redirectUrl;
    } catch (error) {
      authDebug('AuthService', 'Twitter linking failed', {
        error: error instanceof Error ? error.message : String(error)
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
      const response = await axios.post('/api/auth/privy/link', {
        token,
        userId
      }, {
        withCredentials: true
      });
      
      // Update user if returned
      if (response.data.user) {
        this.setUser(response.data.user);
      }
      
      return true;
    } catch (error) {
      authDebug('AuthService', 'Privy linking failed', {
        error: error instanceof Error ? error.message : String(error)
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
      
      // Call logout endpoint to invalidate session
      await axios.post('/api/auth/logout', {}, {
        withCredentials: true
      }).catch(err => {
        // Log but don't fail on error
        authDebug('AuthService', 'Error calling logout endpoint', {
          error: err instanceof Error ? err.message : String(err)
        });
      });
      
      // Clear all tokens
      TokenManager.clearAllTokens();
      
      // Clear user
      const previousUser = this.user;
      this.setUser(null);
      
      // Dispatch logout event
      this.dispatchEvent({
        type: AuthEventType.LOGOUT,
        user: previousUser
      });
      
    } catch (error) {
      authDebug('AuthService', 'Error during logout', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Still clear tokens and user even if API call fails
      TokenManager.clearAllTokens();
      this.setUser(null);
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();