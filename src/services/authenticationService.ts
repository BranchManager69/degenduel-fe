// src/services/authenticationService.ts

/**
 * Authentication Service
 * 
 * Centralizes wallet authentication flow for both Jupiter and original wallet implementations
 * 
 * @author @BranchManager69
 * @last-modified 2025-04-02
 */

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
 * @param walletAddress The wallet address to authenticate
 * @param signMessage Function to sign a message with the wallet
 * @returns Authentication response including token and user data
 */
export async function authenticateWithWallet(
  walletAddress: string,
  signMessage: (message: Uint8Array) => Promise<SignMessageOutput | any>
) {
  try {
    // Get auth nonce from the backend
    const nonceResponse = await axios.get('/api/auth/nonce', { 
      params: { walletAddress },
      withCredentials: true,
    });
    
    const { nonce } = nonceResponse.data;
    authDebug('authenticationService', 'Received nonce for authentication', { nonce });
    
    // Create message to sign - use the same format as the existing implementation
    const message = `DegenDuel Authentication\nWallet: ${walletAddress}\nNonce: ${nonce}\nTimestamp: ${Date.now()}`;
    const encodedMessage = new TextEncoder().encode(message);
    
    // Sign the message - handle both Jupiter and original wallet formats
    const signatureResult = await signMessage(encodedMessage);
    
    // Extract signature based on the format returned
    let signature;
    if (signatureResult.signatureBytes) {
      // Jupiter wallet format
      signature = Array.from(signatureResult.signatureBytes);
    } else if (signatureResult.signature) {
      // Legacy format - signature directly provided
      signature = Array.from(signatureResult.signature);
    } else {
      // Fallback for other wallet implementations
      signature = Array.from(signatureResult);
    }
    
    authDebug('authenticationService', 'Message signed successfully', { 
      messageLength: message.length, 
      signatureLength: signature.length
    });
    
    // Verify signature with the backend
    const authResponse = await axios.post('/api/auth/verify-wallet', {
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
    
    const { token, user } = authResponse.data;
    
    // Store tokens in TokenManager
    if (token) {
      // Store JWT token
      TokenManager.setToken(
        TokenType.JWT, 
        token,
        TokenManager.estimateExpiration(token),
        'wallet-authentication'
      );
      
      // Get WebSocket token if needed - this will be handled by TokenManager's refresh mechanism
      TokenManager.refreshToken(TokenType.WS_TOKEN);
    }
    
    authDebug('authenticationService', 'Authentication successful', {
      hasToken: !!token,
      hasUser: !!user,
      userWallet: user?.wallet_address,
    });
    
    return authResponse.data;
  } catch (error: any) {
    authDebug('authenticationService', 'Authentication failed', {
      walletAddress,
      error: error.message,
      response: error.response?.data,
    });
    throw error;
  }
}