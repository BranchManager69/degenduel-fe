// src/services/authenticationService.ts
//
// NOTE: There are multiple auth service files that handle different authentication flows:
// - authService.ts (lowercase, deprecated)
// - AuthService.ts (uppercase, new unified system)
// - authenticationService.ts (this file, deprecated wallet auth)
//
// To avoid confusion, use imports from services/index.ts which handles these differences
// and use the new unified AuthService.ts for all new code.

/**
 * DEPRECATED Authentication Service
 * 
 * Centralizes wallet authentication flow for both Jupiter and original wallet implementations
 * 
 * @deprecated This service is deprecated and will be removed in the next release.
 * Please use the unified AuthService from AuthService.ts instead.
 * See UNIFIED_AUTH_SYSTEM_README.md for detailed migration instructions.
 * 
 * This is one of THREE separate authentication services in the codebase.
 * This specific file handles wallet authentication.
 * The complete auth system has been consolidated into the unified AuthService.
 * 
 * @author @BranchManager69
 * @last-modified 2025-05-05
 */

// Display warning in console
console.warn(
  "%c[DEPRECATED] authenticationService.ts is deprecated and will be removed in a future release. " +
  "Please use the unified AuthService from AuthService.ts instead. " +
  "See UNIFIED_AUTH_SYSTEM_README.md for detailed migration instructions.",
  "color: red; font-weight: bold; background-color: yellow; padding: 2px 4px;"
);

// Custom type definition for SignMessageOutput
interface SignMessageOutput {
  signatureBytes?: Uint8Array;
  signature?: Uint8Array;
}
import axios from 'axios';
import { authDebug } from '../config/config';
import { TokenManager, TokenType } from './TokenManager';

/**
 * Authenticate with wallet by signing a message
 * 
 * @deprecated Use authService.loginWithWallet() from the unified auth system
 * @param walletAddress The wallet address to authenticate
 * @param signMessage Function to sign a message with the wallet
 * @returns Authentication response including token and user data
 */
export async function authenticateWithWallet(
  walletAddress: string,
  signMessage: (message: Uint8Array) => Promise<SignMessageOutput | any>
) {
  console.warn(
    "[DEPRECATED] authenticateWithWallet is deprecated. " +
    "Use authService.loginWithWallet() from the unified auth system instead."
  );
  console.log('[AUTH DEBUG] Starting wallet authentication process for address:', walletAddress);
  try {
    // Get auth nonce from the backend
    console.log('[AUTH DEBUG] Requesting challenge from /api/auth/challenge');
    const nonceResponse = await axios.get('/api/auth/challenge', { 
      params: { wallet: walletAddress },  // Correct parameter name is 'wallet' not 'walletAddress'
      withCredentials: true,
    });
    
    console.log('[AUTH DEBUG] Challenge response:', nonceResponse);
    // The server might return nonce or challenge, so we'll check for both
    const nonce = nonceResponse.data.nonce || nonceResponse.data.challenge;
    authDebug('authenticationService', 'Received challenge for authentication', { nonce });
    
    // Create message to sign - use the same format as the existing implementation
    const message = `DegenDuel Authentication\nWallet: ${walletAddress}\nNonce: ${nonce}\nTimestamp: ${Date.now()}`;
    const encodedMessage = new TextEncoder().encode(message);
    console.log('[AUTH DEBUG] Created message to sign:', message);
    
    // Sign the message - handle both Jupiter and original wallet formats
    console.log('[AUTH DEBUG] Requesting wallet signature...');
    const signatureResult = await signMessage(encodedMessage);
    console.log('[AUTH DEBUG] Signature result received:', signatureResult);
    
    // Extract signature based on the format returned
    let signature;
    if (signatureResult.signatureBytes) {
      // Jupiter wallet format
      console.log('[AUTH DEBUG] Detected Jupiter wallet signature format');
      signature = Array.from(signatureResult.signatureBytes);
    } else if (signatureResult.signature) {
      // Legacy format - signature directly provided
      console.log('[AUTH DEBUG] Detected legacy signature format');
      signature = Array.from(signatureResult.signature);
    } else {
      // Fallback for other wallet implementations
      console.log('[AUTH DEBUG] Using fallback signature format');
      signature = Array.from(signatureResult);
    }
    
    authDebug('authenticationService', 'Message signed successfully', { 
      messageLength: message.length, 
      signatureLength: signature.length
    });
    console.log('[AUTH DEBUG] Signature extracted, length:', signature.length);
    
    // Verify signature with the backend
    console.log('[AUTH DEBUG] Sending verification request to /api/auth/verify-wallet');
    console.log('[AUTH DEBUG] Request payload:', {
      wallet: walletAddress,
      signature: `[Array of ${signature.length} bytes]`,
      messagePreview: message.substring(0, 50) + '...'
    });
    
    let authResponse;
    try {
      authResponse = await axios.post('/api/auth/verify-wallet', {
        wallet: walletAddress,
        signature,
        message,
      }, { 
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Debug': 'true',
          'Origin': window.location.origin,
        },
      });
      
      console.log('[AUTH DEBUG] Verification response:', authResponse);
      const { token, user } = authResponse.data;
      console.log('[AUTH DEBUG] Token received:', token ? 'Yes (length: ' + token.length + ')' : 'No');
      console.log('[AUTH DEBUG] User data received:', user ? 'Yes' : 'No');
      
      // Store tokens in TokenManager
      if (token) {
        console.log('[AUTH DEBUG] Storing token in TokenManager');
        // Store JWT token
        TokenManager.setToken(
          TokenType.JWT, 
          token,
          TokenManager.estimateExpiration(token),
          'wallet-authentication'
        );
        
        // Get WebSocket token if needed - this will be handled by TokenManager's refresh mechanism
        console.log('[AUTH DEBUG] Requesting WebSocket token refresh');
        TokenManager.refreshToken(TokenType.WS_TOKEN);
      } else {
        console.warn('[AUTH DEBUG] No token received from authentication response');
      }
      
      authDebug('authenticationService', 'Authentication successful', {
        hasToken: !!token,
        hasUser: !!user,
        userWallet: user?.wallet_address,
      });
    } catch (verifyError: any) {
      console.error('[AUTH DEBUG] Verification request failed:', verifyError);
      console.log('[AUTH DEBUG] Error details:', {
        message: verifyError.message || 'Unknown error',
        status: verifyError.response?.status,
        statusText: verifyError.response?.statusText,
        data: verifyError.response?.data,
        url: verifyError.config?.url,
        method: verifyError.config?.method
      });
      throw verifyError;
    }
    
    console.log('[AUTH DEBUG] Authentication process completed successfully');
    return authResponse.data;
  } catch (error: any) {
    console.error('[AUTH DEBUG] Authentication process failed at top level:', error);
    console.log('[AUTH DEBUG] Error details:', {
      message: error.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      url: error?.config?.url,
      phase: error.phase || 'unknown',
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    });
    
    authDebug('authenticationService', 'Authentication failed', {
      walletAddress,
      error: error.message,
      response: error.response?.data,
    });
    throw error;
  }
}