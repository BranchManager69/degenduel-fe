// src/services/BiometricAuthService.ts

/**
 * BiometricAuthService.ts
 * 
 * @description This file contains the BiometricAuthService class, which is used to handle WebAuthn operations for biometric authentication.
 * 
 * @author @BranchManager69
 * @version 1.8.0
 * @created 2025-04-02
 * @updated 2025-04-02
 */

// Auth verbosity
import { authDebug } from '../config/config';
// Biometric Auth API
import {
  checkBiometricCredentialStatus,
  getBiometricAuthenticationOptions,
  getBiometricRegistrationOptions,
  verifyBiometricAuthentication,
  verifyBiometricRegistration
} from './api/auth';
// Token Manager Service
import { tokenManagerService, TokenType } from './tokenManagerService';

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
    // Check if WebAuthn is available in this browser - be more permissive
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
   * @param options Additional options for registration
   * @returns Promise resolving to the credential ID if successful
   */
  public async registerCredential(
    userId: string,
    username: string,
    options?: {
      nickname?: string;
      authenticatorType?: 'platform' | 'cross-platform';
    }
  ): Promise<string> {
    if (!this.isAvailable) {
      throw new Error('WebAuthn is not available in this browser');
    }

    try {
      // Step 1: Get challenge from server
      const nickname = options?.nickname || username;
      const authenticatorType = options?.authenticatorType || 'platform';

      // Get registration options from server
      const challengeResponse = await this.getRegistrationChallenge(userId, {
        nickname,
        authenticatorType
      });

      const publicKeyOptions = this.prepareRegistrationOptions(
        challengeResponse,
        username,
        authenticatorType
      );

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

      // Handle specific WebAuthn errors for better user experience
      if (error instanceof Error) {
        if (error.name === 'NotSupportedError') {
          throw new Error('Your device does not support the requested authentication method');
        } else if (error.name === 'NotAllowedError') {
          throw new Error('Authentication was cancelled or timed out');
        } else if (error.name === 'SecurityError') {
          throw new Error('The operation is insecure (the hostname might not be valid)');
        }
      }

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
  private async getRegistrationChallenge(
    userId: string,
    options?: {
      nickname?: string;
      authenticatorType?: 'platform' | 'cross-platform';
    }
  ): Promise<any> {
    const nickname = options?.nickname;
    const authenticatorType = options?.authenticatorType || 'platform';

    return await getBiometricRegistrationOptions(userId, {
      nickname,
      authenticatorType
    });
  }

  /**
   * Prepare registration options for WebAuthn
   */
  private prepareRegistrationOptions(
    challengeResponse: any,
    username: string,
    authenticatorType: 'platform' | 'cross-platform' = 'platform'
  ): PublicKeyCredentialCreationOptions {
    // Convert base64 challenge to ArrayBuffer
    const challenge = this.base64UrlToArrayBuffer(challengeResponse.challenge);

    // Base options
    const options: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: challengeResponse.rp || {
        name: 'DegenDuel',
        id: window.location.hostname
      },
      user: {
        id: this.base64UrlToArrayBuffer(challengeResponse.userId || challengeResponse.user?.id),
        name: username,
        displayName: challengeResponse.user?.displayName || username
      },
      pubKeyCredParams: challengeResponse.pubKeyCredParams || [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 } // RS256
      ],
      timeout: challengeResponse.timeout || 60000,
      attestation: 'direct',
      authenticatorSelection: {
        authenticatorAttachment: authenticatorType,
        userVerification: 'preferred',
        requireResidentKey: false
      }
    };

    // Include excludeCredentials if provided by server
    if (challengeResponse.excludeCredentials && Array.isArray(challengeResponse.excludeCredentials)) {
      options.excludeCredentials = challengeResponse.excludeCredentials.map((cred: any) => ({
        id: this.base64UrlToArrayBuffer(cred.id),
        type: 'public-key',
        transports: cred.transports || ['internal']
      }));
    }

    return options;
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
      tokenManagerService.setToken(
        TokenType.JWT,
        response.token,
        tokenManagerService.estimateExpiration(response.token),
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