/**
 * authTokenManagerService.ts
 * 
 * This service centralizes token management for all authentication methods.
 * It handles token storage, retrieval, refreshing, and synchronization across auth methods.
 */

// import { TokenType } from '@/services'; // Remove incorrect/circular import
import { authDebug } from '../config/config';
import { useStore } from '../store/useStore';
import { getWebSocketToken } from './api/auth';
// import { TokenInfo } from '@/hooks/websocket'; // Remove unused/incorrect import

// Define token types (Rename back to TokenType, but ensure EXPORTED)
export enum TokenType { // Renamed back and EXPORTED
  JWT = 'jwt',           // Standard JWT token  
  WS_TOKEN = 'wsToken',  // WebSocket-specific token
  SESSION = 'session_token', // Session token
  // REFRESH = 'refreshToken' // REMOVED
}

// Token information interface (Rename back to TokenInfo, but ensure EXPORTED)
export interface TokenInfo { // Renamed back and EXPORTED
  value: string;
  expiresAt: number; // Timestamp when token expires
  type: TokenType; // Use the corrected TokenType enum
  source: string; // Which auth method provided this token (wallet, privy, twitter)
}

// Token manager class
class TokenManagerService {
  // Remove internal state map for tokens
  // private tokens: Map<TokenType, TokenInfo> = new Map(); 
  
  // Keep refreshTimers and refreshInProgress as they manage behavior, not state
  private refreshTimers: Map<TokenType, NodeJS.Timeout> = new Map();
  private refreshInProgress: Map<TokenType, boolean> = new Map();
  
  private refreshBuffer: number = 60 * 1000; 
  
  constructor() {
    if (typeof window !== 'undefined') {
      // Remove syncFromStore call - Zustand hydration handles persistence
      // this.syncFromStore(); 
      (window as any).debugTokens = () => this.debugTokens();
    }
  }
  
  public debugTokens() {
    const tokenInfo: Record<string, any> = {};
    const user = useStore.getState().user;

    // Iterate over TokenType enum values to check store state
    for (const type of Object.values(TokenType)) {
        let tokenValue: string | undefined;
        // Explicit mapping for debug output
        switch (type) {
            case TokenType.JWT: tokenValue = user?.jwt; break;
            case TokenType.WS_TOKEN: tokenValue = user?.wsToken; break;
            case TokenType.SESSION: tokenValue = user?.session_token; break;
            // case TokenType.REFRESH: tokenValue = user?.refreshToken; break; // REMOVE THIS LINE
        }

        if (tokenValue) {
            // Estimate expiration (REFRESH defaultDays removed)
            const expiresAt = this.estimateExpiration(tokenValue, 1);
            const expiresIn = expiresAt - Date.now();
            const timeLeft = expiresIn > 0 ? 
                `${Math.floor(expiresIn / 60000)}m ${Math.floor((expiresIn % 60000) / 1000)}s` : 
                'Expired';

            tokenInfo[type] = {
                source: 'store',
                tokenLength: tokenValue.length,
                expiresAt: new Date(expiresAt).toISOString(),
                expiresIn: timeLeft,
                hasRefreshTimer: this.refreshTimers.has(type),
                refreshInProgress: this.refreshInProgress.get(type) || false
            };
        } else {
             tokenInfo[type] = {
                source: 'store',
                tokenLength: 0,
                expiresAt: 'N/A',
                expiresIn: 'N/A',
                hasRefreshTimer: this.refreshTimers.has(type),
                refreshInProgress: this.refreshInProgress.get(type) || false
            };
        }
    }
    
    authDebug('TokenManagerService', 'Token information (from store):', tokenInfo);
    return tokenInfo;
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
      authDebug('TokenManagerService', `Error estimating token expiration: ${e instanceof Error ? e.message : String(e)}`);
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
    const user = useStore.getState().user;
    if (!user) return null;

    let tokenValue: string | undefined;
    switch (type) {
        case TokenType.JWT: tokenValue = user.jwt; break;
        case TokenType.WS_TOKEN: tokenValue = user.wsToken; break;
        case TokenType.SESSION: tokenValue = user.session_token; break;
        // case TokenType.REFRESH: tokenValue = user.refreshToken; break; // REMOVE THIS LINE
        default: 
          authDebug('TokenManagerService', `getToken called with invalid type: ${type}`);
          return null;
    }

    if (!tokenValue) return null;

    const expiresAt = this.estimateExpiration(tokenValue, 1); // Removed REFRESH specific day count
    const isExpired = expiresAt <= Date.now();

    if (isExpired) {
      authDebug('TokenManagerService', `Token ${type} expired, attempting refresh`);
      // Trigger refresh asynchronously, don't wait for it
      this.refreshToken(type).catch(err => 
          authDebug('TokenManagerService', `Async refresh trigger failed for ${type}`, err)
      );
      return null; // Return null for expired token
    }

    return tokenValue; // Return valid token
  }
  
  /**
   * Set a token with expiration information
   * @param type Token type
   * @param value Token value
   * @param expiresAt Expiration timestamp
   * @param source Source of the token (auth method)
   */
  public setToken(type: TokenType, value: string, expiresAt: number, source: string) {
    const { user, setUser } = useStore.getState();
    if (!user || !setUser) {
      authDebug('TokenManagerService', 'Cannot set token, user or setUser not found in store');
      return;
    }

    const updatedUser = { ...user };

    switch (type) {
        case TokenType.JWT:
            updatedUser.jwt = value;
            break;
        case TokenType.WS_TOKEN:
            updatedUser.wsToken = value;
            break;
        case TokenType.SESSION:
            updatedUser.session_token = value;
            break;
        // case TokenType.REFRESH: updatedUser.refreshToken = value; break; // REMOVE THIS LINE
        default:
            authDebug('TokenManagerService', `Cannot set token, invalid type enum: ${type}`);
            return;
    }
    
    setUser(updatedUser);
    authDebug('TokenManagerService', `Set ${type} token in store from source: ${source}`);

    // --- Manage Refresh Timer --- 
    // Clear any existing refresh timer
    if (this.refreshTimers.has(type)) {
      clearTimeout(this.refreshTimers.get(type)!);
      this.refreshTimers.delete(type);
    }
    
    // Calculate when to refresh (before expiration)
    const now = Date.now();
    const timeUntilRefresh = Math.max(0, expiresAt - now - this.refreshBuffer);
    
    // Schedule refresh
    if (timeUntilRefresh > 0) {
      this.refreshTimers.set(type, setTimeout(() => {
        this.refreshToken(type);
      }, timeUntilRefresh));
      
      authDebug('TokenManagerService', `Scheduled refresh for ${type} token in ${Math.floor(timeUntilRefresh / 1000)} seconds`);
    } else if (!this.refreshInProgress.get(type)) {
      // Token is already expired or too close to expiration, refresh now if not already refreshing
      authDebug('TokenManagerService', `Token ${type} expiration is immediate or past, refreshing now.`);
      this.refreshToken(type).catch(err => 
          authDebug('TokenManagerService', `Immediate refresh trigger failed for ${type}`, err)
      );
    }
  }
  
  /**
   * Remove a token
   * @param type Token type to remove
   */
  public removeToken(type: TokenType) {
    const { user, setUser } = useStore.getState();
     if (!user || !setUser) {
      authDebug('TokenManagerService', 'Cannot remove token, user or setUser not found in store');
      return;
    }

    const updatedUser = { ...user };
    let propertySetToUndefined = false;

    switch (type) {
        case TokenType.JWT: updatedUser.jwt = undefined; propertySetToUndefined = true; break;
        case TokenType.WS_TOKEN: updatedUser.wsToken = undefined; propertySetToUndefined = true; break;
        case TokenType.SESSION: updatedUser.session_token = undefined; propertySetToUndefined = true; break;
        // case TokenType.REFRESH: updatedUser.refreshToken = undefined; propertySetToUndefined = true; break; // REMOVE THIS LINE
        default:
            authDebug('TokenManagerService', `Cannot remove token, invalid type enum: ${type}`);
            return;
    }

    if (propertySetToUndefined) {
        setUser(updatedUser);
        authDebug('TokenManagerService', `Removed ${type} token from store`);
    }

    // Clear any refresh timer
    if (this.refreshTimers.has(type)) {
      clearTimeout(this.refreshTimers.get(type)!);
      this.refreshTimers.delete(type);
    }
  }
  
  /**
   * Clear all tokens (for logout)
   */
  public clearAllTokens() {
    const { user, setUser } = useStore.getState();
    if (!user || !setUser) {
      authDebug('TokenManagerService', 'Cannot clear tokens, user or setUser not found in store');
      return;
    }

    // Create updated user object setting tokens to undefined
    const updatedUser = {
        ...user,
        jwt: undefined,
        wsToken: undefined,
        session_token: undefined,
        // refreshToken: undefined, // REMOVED
    };
    setUser(updatedUser);

    // Clear all refresh timers
    this.refreshTimers.forEach((timer) => clearTimeout(timer));
    this.refreshTimers.clear();
    // Clear all refresh flags
    this.refreshInProgress.clear();
    
    authDebug('TokenManagerService', 'Cleared all tokens from store and timers');
  }
  
  /**
   * Refresh a specific token
   * @param type Token type to refresh
   */
  public async refreshToken(type: TokenType) {
    if (this.refreshInProgress.get(type)) {
      authDebug('TokenManagerService', `Refresh already in progress for ${type}`);
      return;
    }
    this.refreshInProgress.set(type, true);
    
    try {
      authDebug('TokenManagerService', `Refreshing ${type} token`);
      
      // Which token to refresh?
      switch (type) {
        // (1) WebSocket Token
        case TokenType.WS_TOKEN:
          const wsToken = await getWebSocketToken();
          if (wsToken) {
            this.setToken(TokenType.WS_TOKEN, wsToken, this.estimateExpiration(wsToken, 1), 'refresh');
            authDebug('TokenManagerService', 'WebSocket token refreshed successfully');
          } else {
            authDebug('TokenManagerService', 'Failed to refresh WebSocket token');
            const jwt = this.getToken(TokenType.JWT); 
            if (jwt) {
              authDebug('TokenManagerService', 'Using JWT as fallback after WebSocket token refresh failure');
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('token-refresh-fallback', {
                  detail: { type: 'JWT', source: 'TokenManagerService' }
                }));
              }
            }
          }
          break;

        // (2) JWT Token
        case TokenType.JWT:
           // JWT refresh is handled automatically by the HTTP client interceptor via HttpOnly cookies.
           // This function should ideally not be called for JWT.
           authDebug('TokenManagerService', 'JWT refresh called, but should be handled by interceptor.');
           // We could potentially trigger a checkAuth here to sync state if needed, but usually not necessary.
           // await authService.checkAuth(); 
          break;

        // (3) Session Token
        case TokenType.SESSION:
          authDebug('TokenManagerService', 'Session token refresh not applicable via this method.');
          break;
        
        // (4) Refresh Token
        // REFRESH case is removed as TokenType.REFRESH enum is removed
          
        // (5) Default
        default:
          authDebug('TokenManagerService', `No refresh strategy for ${type}`);
      }
    } catch (error) {
      authDebug('TokenManagerService', `Error refreshing ${type} token`, { error });
    } finally {
      // Reset refresh in progress flag
      this.refreshInProgress.set(type, false);
    }
  }
}

// Export a singleton instance using camelCase
export const tokenManagerService = new TokenManagerService();

// Export a hook to use the token manager (optional, direct import is fine)
export function useTokenManager() {
  return tokenManagerService;
}