// src/services/BiometricAuthService.ts

/**
 * BiometricAuthService.ts
 * 
 * This file contains the BiometricAuthService class, which is used to handle WebAuthn operations for biometric authentication.
 * 
 * @author @BranchManager69
 * @last-modified 2025-04-02
 */

import { authDebug } from '../config/config';
import {
  checkBiometricCredentialStatus,
  getBiometricAuthenticationOptions,
  getBiometricRegistrationOptions,
  verifyBiometricAuthentication,
  verifyBiometricRegistration
} from './api/auth';
import { TokenManager, TokenType } from './TokenManager';

/**
 * BiometricAuthService - Handles WebAuthn operations for biometric authentication
 * 
 * This service provides methods for registering and verifying biometric credentials
 * using the Web Authentication API (WebAuthn).
 */
export class BiometricAuthService {
  private static instance: BiometricAuthService;
  private isAvailable: boolean = false;

  constructor() {
    // Check if WebAuthn is available in this browser
    this.isAvailable = typeof window !== 'undefined' && 
                      !!window.PublicKeyCredential && 
                      !!navigator.credentials;
    
    if (this.isAvailable) {
      authDebug('BiometricAuth', 'WebAuthn is available in this browser');
    } else {
      authDebug('BiometricAuth', 'WebAuthn is NOT available in this browser');
    }
    
    // Add to window for debugging
    if (typeof window !== 'undefined') {
      (window as any).debugBiometricAuth = () => this.debugInfo();
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): BiometricAuthService {
    if (!BiometricAuthService.instance) {
      BiometricAuthService.instance = new BiometricAuthService();
    }
    return BiometricAuthService.instance;
  }

  /**
   * Check if biometric authentication is available
   */
  public canUseBiometrics(): boolean {
    return this.isAvailable;
  }

  /**
   * Register a new biometric credential
   * 
   * @param userId User ID to associate with the credential
   * @param username User's display name
   * @returns Promise resolving to the credential ID if successful
   */
  public async registerCredential(userId: string, username: string): Promise<string> {
    if (!this.isAvailable) {
      throw new Error('WebAuthn is not available in this browser');
    }

    try {
      // Step 1: Get challenge from server
      const challengeResponse = await this.getRegistrationChallenge(userId);
      const publicKeyOptions = this.prepareRegistrationOptions(challengeResponse, username);
      
      // Step 2: Create credential
      authDebug('BiometricAuth', 'Creating credential with options:', publicKeyOptions);
      const credential = await navigator.credentials.create({
        publicKey: publicKeyOptions
      }) as PublicKeyCredential;
      
      if (!credential) {
        throw new Error('Failed to create credential');
      }

      // Step 3: Send credential to server for verification
      const attestationResponse = this.prepareAttestationResponse(credential);
      const verificationResponse = await this.verifyRegistration(attestationResponse);
      
      authDebug('BiometricAuth', 'Credential registered successfully', verificationResponse);
      return verificationResponse.credentialId;
    } catch (error) {
      authDebug('BiometricAuth', 'Error registering credential', error);
      throw error;
    }
  }

  /**
   * Authenticate using a biometric credential
   * 
   * @param userId User ID associated with the credential
   * @returns Promise resolving to the authentication token if successful
   */
  public async authenticate(userId: string): Promise<string> {
    if (!this.isAvailable) {
      throw new Error('WebAuthn is not available in this browser');
    }

    try {
      // Step 1: Get challenge from server
      const challengeResponse = await this.getAuthenticationChallenge(userId);
      const publicKeyOptions = this.prepareAuthenticationOptions(challengeResponse);
      
      // Step 2: Get credential
      authDebug('BiometricAuth', 'Getting credential with options:', publicKeyOptions);
      const assertion = await navigator.credentials.get({
        publicKey: publicKeyOptions
      }) as PublicKeyCredential;
      
      if (!assertion) {
        throw new Error('Failed to get credential');
      }

      // Step 3: Send assertion to server for verification
      const assertionResponse = this.prepareAssertionResponse(assertion);
      const verificationResponse = await this.verifyAuthentication(assertionResponse);
      
      authDebug('BiometricAuth', 'Authentication successful', verificationResponse);
      return verificationResponse.token;
    } catch (error) {
      authDebug('BiometricAuth', 'Error authenticating', error);
      throw error;
    }
  }

  /**
   * Check if a user has registered credentials
   * 
   * @param userId User ID to check
   * @returns Promise resolving to true if user has credentials
   */
  public async hasRegisteredCredential(userId: string): Promise<boolean> {
    try {
      return await checkBiometricCredentialStatus(userId);
    } catch (error) {
      authDebug('BiometricAuth', 'Error checking registered credential', error);
      return false;
    }
  }

  /**
   * Get registration challenge from server
   */
  private async getRegistrationChallenge(userId: string): Promise<any> {
    return await getBiometricRegistrationOptions(userId);
  }

  /**
   * Prepare registration options for WebAuthn
   */
  private prepareRegistrationOptions(challengeResponse: any, username: string): PublicKeyCredentialCreationOptions {
    // Convert base64 challenge to ArrayBuffer
    const challenge = this.base64UrlToArrayBuffer(challengeResponse.challenge);
    
    return {
      challenge,
      rp: {
        name: 'DegenDuel',
        id: window.location.hostname
      },
      user: {
        id: this.base64UrlToArrayBuffer(challengeResponse.userId),
        name: username,
        displayName: username
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 } // RS256
      ],
      timeout: 60000,
      attestation: 'direct',
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'preferred',
        requireResidentKey: false
      }
    };
  }

  /**
   * Prepare attestation response for server
   */
  private prepareAttestationResponse(credential: PublicKeyCredential): any {
    const attestationResponse = credential.response as AuthenticatorAttestationResponse;
    
    return {
      id: credential.id,
      rawId: this.arrayBufferToBase64Url(credential.rawId),
      type: credential.type,
      response: {
        attestationObject: this.arrayBufferToBase64Url(attestationResponse.attestationObject),
        clientDataJSON: this.arrayBufferToBase64Url(attestationResponse.clientDataJSON)
      }
    };
  }

  /**
   * Verify registration with server
   */
  private async verifyRegistration(attestationResponse: any): Promise<any> {
    return await verifyBiometricRegistration(attestationResponse);
  }

  /**
   * Get authentication challenge from server
   */
  private async getAuthenticationChallenge(userId: string): Promise<any> {
    return await getBiometricAuthenticationOptions(userId);
  }

  /**
   * Prepare authentication options for WebAuthn
   */
  private prepareAuthenticationOptions(challengeResponse: any): PublicKeyCredentialRequestOptions {
    // Convert base64 challenge to ArrayBuffer
    const challenge = this.base64UrlToArrayBuffer(challengeResponse.challenge);
    
    // Convert allowCredentials if present
    const allowCredentials = challengeResponse.allowCredentials 
      ? challengeResponse.allowCredentials.map((credential: any) => ({
          id: this.base64UrlToArrayBuffer(credential.id),
          type: 'public-key',
          transports: credential.transports || ['internal']
        }))
      : [];
    
    return {
      challenge,
      timeout: 60000,
      rpId: window.location.hostname,
      allowCredentials,
      userVerification: 'preferred'
    };
  }

  /**
   * Prepare assertion response for server
   */
  private prepareAssertionResponse(credential: PublicKeyCredential): any {
    const assertionResponse = credential.response as AuthenticatorAssertionResponse;
    
    return {
      id: credential.id,
      rawId: this.arrayBufferToBase64Url(credential.rawId),
      type: credential.type,
      response: {
        authenticatorData: this.arrayBufferToBase64Url(assertionResponse.authenticatorData),
        clientDataJSON: this.arrayBufferToBase64Url(assertionResponse.clientDataJSON),
        signature: this.arrayBufferToBase64Url(assertionResponse.signature),
        userHandle: assertionResponse.userHandle 
          ? this.arrayBufferToBase64Url(assertionResponse.userHandle) 
          : null
      }
    };
  }

  /**
   * Verify authentication with server
   */
  private async verifyAuthentication(assertionResponse: any): Promise<any> {
    const response = await verifyBiometricAuthentication(assertionResponse);
    
    // Store tokens in TokenManager if available
    if (response.token) {
      TokenManager.setToken(
        TokenType.JWT, 
        response.token, 
        TokenManager.estimateExpiration(response.token), 
        'biometric'
      );
    }
    
    return response;
  }

  /**
   * Debug information
   */
  public debugInfo(): Record<string, any> {
    const info = {
      isAvailable: this.isAvailable,
      platformAuthenticatorAvailable: false,
      userVerifying: false,
      supportedAlgorithms: []
    };

    // Check if platform authenticator is available
    if (this.isAvailable && window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(available => {
          info.platformAuthenticatorAvailable = available;
          authDebug('BiometricAuth', `Platform authenticator available: ${available}`);
        })
        .catch(error => {
          authDebug('BiometricAuth', 'Error checking platform authenticator:', error);
        });
    }

    authDebug('BiometricAuth', 'Debug information:', info);
    return info;
  }

  /**
   * Utility: Convert ArrayBuffer to Base64URL string
   */
  private arrayBufferToBase64Url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * Utility: Convert Base64URL string to ArrayBuffer
   */
  private base64UrlToArrayBuffer(base64Url: string): ArrayBuffer {
    const paddedBase64 = base64Url
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // Add padding if needed
    const padding = paddedBase64.length % 4;
    const padded = padding 
      ? paddedBase64 + '===='.substring(0, 4 - padding) 
      : paddedBase64;
    
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    return bytes.buffer;
  }
}

export default BiometricAuthService.getInstance();