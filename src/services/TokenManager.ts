/**
 * TokenManager.ts
 * 
 * This service centralizes token management for all authentication methods.
 * It handles token storage, retrieval, refreshing, and synchronization across auth methods.
 */

import { getWebSocketToken } from './api/auth';
import { useStore } from '../store/useStore';
import { authDebug } from '../config/config';

// Define token types
export enum TokenType {
  JWT = 'jwt',           // Standard JWT token  
  WS_TOKEN = 'wsToken',  // WebSocket-specific token
  SESSION = 'session_token', // Session token
  REFRESH = 'refreshToken' // Refresh token
}

// Token information interface
export interface TokenInfo {
  value: string;
  expiresAt: number; // Timestamp when token expires
  type: TokenType;
  source: string; // Which auth method provided this token (wallet, privy, twitter)
}

// Token manager class
class TokenManagerService {
  private tokens: Map<TokenType, TokenInfo> = new Map();
  private refreshTimers: Map<TokenType, NodeJS.Timeout> = new Map();
  private refreshInProgress: Map<TokenType, boolean> = new Map();
  
  // Default refresh buffer (refresh 1 minute before expiration)
  private refreshBuffer: number = 60 * 1000; 
  
  constructor() {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      // Initialize from store if available when service is created
      this.syncFromStore();
      
      // Setup global debug function
      (window as any).debugTokens = () => this.debugTokens();
    }
  }
  
  /**
   * Debug function to expose token information
   */
  public debugTokens() {
    const tokenInfo: Record<string, any> = {};
    
    this.tokens.forEach((info, type) => {
      const expiresIn = info.expiresAt - Date.now();
      const timeLeft = expiresIn > 0 ? 
        `${Math.floor(expiresIn / 60000)} minutes, ${Math.floor((expiresIn % 60000) / 1000)} seconds` : 
        'Expired';
        
      tokenInfo[type] = {
        source: info.source,
        tokenLength: info.value.length,
        expiresAt: new Date(info.expiresAt).toISOString(),
        expiresIn: timeLeft,
        hasRefreshTimer: this.refreshTimers.has(type),
        refreshInProgress: this.refreshInProgress.get(type) || false
      };
    });
    
    authDebug('TokenManager', 'Token information:', tokenInfo);
    return tokenInfo;
  }
  
  /**
   * Synchronize tokens from the global store
   */
  public syncFromStore() {
    try {
      // Skip if window is not defined (SSR)
      if (typeof window === 'undefined') return;
      
      const user = useStore.getState()?.user;
      if (!user) return;
      
      // Get all possible tokens from user object
      if (user.jwt) {
        this.setToken(TokenType.JWT, user.jwt, this.estimateExpiration(user.jwt), 'store');
      }
      
      if (user.wsToken) {
        this.setToken(TokenType.WS_TOKEN, user.wsToken, this.estimateExpiration(user.wsToken), 'store');
      }
      
      if (user.session_token) {
        this.setToken(TokenType.SESSION, user.session_token, this.estimateExpiration(user.session_token), 'store');
      }
      
      // Handle refresh token (from custom fields if present)
      const refreshToken = (user as any).refreshToken;
      if (refreshToken) {
        this.setToken(TokenType.REFRESH, refreshToken, this.estimateExpiration(refreshToken, 30), 'store');
      }
      
      authDebug('TokenManager', 'Synchronized tokens from store', {
        hasJwt: !!user.jwt,
        hasWsToken: !!user.wsToken,
        hasSessionToken: !!user.session_token,
        hasRefreshToken: !!refreshToken
      });
    } catch (error) {
      authDebug('TokenManager', 'Error synchronizing tokens from store:', error instanceof Error ? error.message : String(error));
    }
  }
  
  /**
   * Estimate token expiration time based on JWT structure
   * @param token The token to estimate expiration for
   * @param defaultDaysValid Default days valid if expiration can't be extracted
   * @returns Timestamp for expiration
   */
  public estimateExpiration(token: string, defaultDaysValid: number = 1): number {
    try {
      // Try to parse as JWT
      const parts = token.split('.');
      if (parts.length === 3) {
        // Safe window handling for SSR
        const base64Decode = (str: string): string => {
          if (typeof window !== 'undefined') {
            // Browser environment
            return atob(str);
          } else {
            // Node environment (SSR)
            return Buffer.from(str, 'base64').toString('ascii');
          }
        };
        
        // Ensure padding for base64url format
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(base64Decode(base64));
        
        if (payload.exp) {
          // exp is in seconds, convert to milliseconds
          return payload.exp * 1000;
        }
      }
    } catch (e) {
      // Not a valid JWT or not parseable, use default
      authDebug('TokenManager', `Error estimating token expiration: ${e instanceof Error ? e.message : String(e)}`);
    }
    
    // Default: token valid for the specified number of days
    return Date.now() + (defaultDaysValid * 24 * 60 * 60 * 1000);
  }
  
  /**
   * Get a token by type
   * @param type The type of token to get
   * @returns The token value or null if not found or expired
   */
  public getToken(type: TokenType): string | null {
    const tokenInfo = this.tokens.get(type);
    
    // Check if token exists and is valid
    if (tokenInfo && tokenInfo.expiresAt > Date.now()) {
      return tokenInfo.value;
    }
    
    // Token doesn't exist or is expired
    if (tokenInfo) {
      authDebug('TokenManager', `Token ${type} expired, attempting refresh`);
      this.refreshToken(type);
    }
    
    return null;
  }
  
  /**
   * Set a token with expiration information
   * @param type Token type
   * @param value Token value
   * @param expiresAt Expiration timestamp
   * @param source Source of the token (auth method)
   */
  public setToken(type: TokenType, value: string, expiresAt: number, source: string) {
    // Clear any existing refresh timer
    if (this.refreshTimers.has(type)) {
      clearTimeout(this.refreshTimers.get(type));
      this.refreshTimers.delete(type);
    }
    
    // Store token
    this.tokens.set(type, { value, expiresAt, type, source });
    
    // Calculate when to refresh (before expiration)
    const now = Date.now();
    const timeUntilRefresh = Math.max(0, expiresAt - now - this.refreshBuffer);
    
    // Schedule refresh
    if (timeUntilRefresh > 0) {
      this.refreshTimers.set(type, setTimeout(() => {
        this.refreshToken(type);
      }, timeUntilRefresh));
      
      authDebug('TokenManager', `Scheduled refresh for ${type} token in ${Math.floor(timeUntilRefresh / 1000)} seconds`);
    } else {
      // Token is already expired or too close to expiration, refresh now
      this.refreshToken(type);
    }
    
    // Synchronize with store
    this.syncToStore();
  }
  
  /**
   * Remove a token
   * @param type Token type to remove
   */
  public removeToken(type: TokenType) {
    // Clear any refresh timer
    if (this.refreshTimers.has(type)) {
      clearTimeout(this.refreshTimers.get(type));
      this.refreshTimers.delete(type);
    }
    
    // Remove token
    this.tokens.delete(type);
    
    // Synchronize with store
    this.syncToStore();
    
    authDebug('TokenManager', `Removed ${type} token`);
  }
  
  /**
   * Clear all tokens (for logout)
   */
  public clearAllTokens() {
    // Clear all refresh timers
    this.refreshTimers.forEach((timer) => clearTimeout(timer));
    this.refreshTimers.clear();
    
    // Clear all tokens
    this.tokens.clear();
    
    // Clear all refresh flags
    this.refreshInProgress.clear();
    
    authDebug('TokenManager', 'Cleared all tokens');
  }
  
  /**
   * Refresh a specific token
   * @param type Token type to refresh
   */
  public async refreshToken(type: TokenType) {
    // Skip if refresh already in progress
    if (this.refreshInProgress.get(type)) {
      authDebug('TokenManager', `Refresh already in progress for ${type}`);
      return;
    }
    
    // Mark refresh in progress
    this.refreshInProgress.set(type, true);
    
    try {
      authDebug('TokenManager', `Refreshing ${type} token`);
      
      // Different refresh strategies based on token type
      switch (type) {
        case TokenType.WS_TOKEN:
          const wsToken = await getWebSocketToken();
          if (wsToken) {
            this.setToken(
              TokenType.WS_TOKEN, 
              wsToken, 
              this.estimateExpiration(wsToken, 1), // WS tokens usually valid for 1 day
              'refresh'
            );
            authDebug('TokenManager', 'WebSocket token refreshed successfully');
          } else {
            authDebug('TokenManager', 'Failed to refresh WebSocket token');
          }
          break;
          
        case TokenType.JWT:
          // JWT tokens are usually refreshed with a refresh token
          const refreshToken = this.getToken(TokenType.REFRESH);
          if (refreshToken) {
            // TODO: Implement JWT refresh with refresh token
            // This would typically call an API endpoint
            authDebug('TokenManager', 'JWT refresh not yet implemented');
          } else {
            authDebug('TokenManager', 'No refresh token available for JWT refresh');
          }
          break;
          
        case TokenType.SESSION:
          // Session tokens are usually managed by cookies, no explicit refresh
          authDebug('TokenManager', 'Session token refresh not applicable');
          break;
          
        default:
          authDebug('TokenManager', `No refresh strategy for ${type}`);
      }
    } catch (error) {
      authDebug('TokenManager', `Error refreshing ${type} token`, { error });
    } finally {
      // Clear in-progress flag
      this.refreshInProgress.set(type, false);
    }
  }
  
  /**
   * Sync tokens to the global store
   */
  private syncToStore() {
    try {
      // Skip if window is not defined (SSR)
      if (typeof window === 'undefined') return;
      
      const store = useStore.getState();
      const user = store?.user;
      if (!user || !store.setUser) return;
      
      // Get current token values
      const jwt = this.getToken(TokenType.JWT);
      const wsToken = this.getToken(TokenType.WS_TOKEN);
      const sessionToken = this.getToken(TokenType.SESSION);
      const refreshToken = this.getToken(TokenType.REFRESH);
      
      // Only update the store if any token has changed
      // Get the current refresh token from the user object if it exists
      const userRefreshToken = (user as any).refreshToken;
      
      if (
        jwt !== user.jwt || 
        wsToken !== user.wsToken || 
        sessionToken !== user.session_token ||
        refreshToken !== userRefreshToken
      ) {
        // Create updated user object
        const updatedUser = {
          ...user,
          jwt: jwt || undefined,
          wsToken: wsToken || undefined,
          session_token: sessionToken || undefined,
        };
        
        // Add the refresh token if needed
        if (refreshToken !== userRefreshToken) {
          (updatedUser as any).refreshToken = refreshToken || undefined;
        }
        
        store.setUser(updatedUser);
        
        authDebug('TokenManager', 'Updated user tokens in store');
      }
    } catch (error) {
      authDebug('TokenManager', 'Error synchronizing tokens to store:', error instanceof Error ? error.message : String(error));
    }
  }
  
  /**
   * Get the best available token for authentication
   * @returns The best available token or null if none available
   */
  public getBestAvailableToken(): string | null {
    // Priority order: WS Token, JWT, Session Token
    return (
      this.getToken(TokenType.WS_TOKEN) || 
      this.getToken(TokenType.JWT) || 
      this.getToken(TokenType.SESSION)
    );
  }
  
  /**
   * Get all valid tokens with their metadata
   * @returns Map of token type to token info
   */
  public getAllTokens(): Map<TokenType, TokenInfo> {
    // Filter out expired tokens
    const now = Date.now();
    const validTokens = new Map<TokenType, TokenInfo>();
    
    this.tokens.forEach((info, type) => {
      if (info.expiresAt > now) {
        validTokens.set(type, info);
      }
    });
    
    return validTokens;
  }
}

// Export a singleton instance
export const TokenManager = new TokenManagerService();

// Export a hook to use the token manager
export function useTokenManager() {
  return TokenManager;
}