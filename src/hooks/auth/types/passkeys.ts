// src/hooks/auth/types/passkeys.ts

/**
 * Type definitions for Passkey/WebAuthn and QR code authentication
 * 
 * @author Claude
 * @created 2025-05-09
 */

/**
 * Type for a Biometric Credential
 */
export interface BiometricCredential {
  id: string;
  name: string;
  device_type: 'mobile' | 'desktop' | 'tablet' | string;
  created_at: string;
  last_used: string | null;
}

/**
 * Response from the biometric registration options endpoint
 */
export interface BiometricRegistrationOptionsResponse {
  challenge: string;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{
    type: string;
    alg: number;
  }>;
  timeout: number;
  excludeCredentials?: Array<{
    id: string;
    type: string;
    transports?: string[];
  }>;
}

/**
 * Response from the biometric registration verification endpoint
 */
export interface BiometricRegistrationVerifyResponse {
  success: boolean;
  credentialId: string;
  error?: string;
}

/**
 * Response from the biometric authentication options endpoint
 */
export interface BiometricAuthenticationOptionsResponse {
  challenge: string;
  allowCredentials: Array<{
    id: string;
    type: string;
    transports?: string[];
  }>;
  timeout: number;
  userVerification?: string;
}

/**
 * Response from the biometric authentication verification endpoint
 */
export interface BiometricAuthenticationVerifyResponse {
  verified: boolean;
  user?: {
    id: number;
    wallet_address: string;
    role: string;
    nickname: string;
  };
  token?: string;
  auth_method: string;
  error?: string;
}

/**
 * QR Code authentication types
 */

/**
 * Response from the QR code generation endpoint
 */
export interface QRCodeGenerationResponse {
  qrCode: string;
  sessionToken: string;
  expiresAt: string;
}

/**
 * Response from the QR code poll endpoint
 */
export interface QRCodePollResponse {
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  expiresAt: string;
}

/**
 * Response from the QR code verification endpoint
 */
export interface QRCodeVerificationResponse {
  success: boolean;
  message: string;
}

/**
 * Response from the QR code completion endpoint
 */
export interface QRCodeCompletionResponse {
  verified: boolean;
  user?: {
    id: number;
    wallet_address: string;
    role: string;
    nickname: string;
  };
  token?: string;
  auth_method: string;
  error?: string;
}