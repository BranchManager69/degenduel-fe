// src/services/api/qrAuth.ts

/**
 * QR Code Authentication API Service
 * 
 * Provides API functions for QR code-based authentication flow
 * 
 * @author Claude
 * @created 2025-05-09
 */

import axios from 'axios';
import { API_URL, DDAPI_DEBUG_MODE } from '../../config/config';
import { useStore } from '../../store/useStore';

/**
 * Generate a QR code for authentication
 * @returns The QR code data, session token, and expiration time
 */
export const generateQRCode = async (): Promise<{
  qrCode: string;
  sessionToken: string;
  expiresAt: string;
}> => {
  try {
    const response = await axios.post(`${API_URL}/auth/qr/generate`, {}, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      withCredentials: true
    });
    
    if (DDAPI_DEBUG_MODE === 'true') {
      console.log('[QRAuth] Generated QR code:', {
        token: response.data.sessionToken,
        expires: response.data.expiresAt
      });
    }
    
    return {
      qrCode: response.data.qrCode,
      sessionToken: response.data.sessionToken,
      expiresAt: response.data.expiresAt
    };
  } catch (error: any) {
    console.error('[QRAuth] Failed to generate QR code:', {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data
    });
    
    throw new Error(
      error?.response?.data?.message || 
      error?.message || 
      'Failed to generate QR code'
    );
  }
};

/**
 * Poll for QR code authentication status
 * @param token The session token to check
 * @returns The current status and expiration time
 */
export const pollQRCodeStatus = async (token: string): Promise<{
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  expiresAt: string;
}> => {
  try {
    const response = await axios.get(`${API_URL}/auth/qr/poll/${token}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      withCredentials: true
    });
    
    if (DDAPI_DEBUG_MODE === 'true') {
      console.log('[QRAuth] Poll status:', response.data);
    }
    
    return {
      status: response.data.status,
      expiresAt: response.data.expiresAt
    };
  } catch (error: any) {
    console.error('[QRAuth] Failed to poll QR code status:', {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data
    });
    
    throw new Error(
      error?.response?.data?.message || 
      error?.message || 
      'Failed to poll QR code status'
    );
  }
};

/**
 * Complete the QR code authentication process
 * @param token The session token to complete
 * @returns The authenticated user and token
 */
export const completeQRCodeAuth = async (token: string): Promise<{
  verified: boolean;
  user: any;
  token: string;
  auth_method: string;
}> => {
  try {
    const response = await axios.post(`${API_URL}/auth/qr/complete/${token}`, {}, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      withCredentials: true
    });
    
    if (DDAPI_DEBUG_MODE === 'true') {
      console.log('[QRAuth] Authentication completed:', response.data);
    }
    
    // Update the user in the store if available
    if (response.data.verified && response.data.user) {
      const store = useStore.getState();
      store.setUser({
        ...response.data.user,
        jwt: response.data.token
      });
    }
    
    return response.data;
  } catch (error: any) {
    console.error('[QRAuth] Failed to complete authentication:', {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data
    });
    
    throw new Error(
      error?.response?.data?.message || 
      error?.message || 
      'Failed to complete authentication'
    );
  }
};

/**
 * Cancel a QR code authentication session
 * @param token The session token to cancel
 * @returns Success status and message
 */
export const cancelQRCodeAuth = async (token: string): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const response = await axios.post(`${API_URL}/auth/qr/cancel/${token}`, {}, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      withCredentials: true
    });
    
    if (DDAPI_DEBUG_MODE === 'true') {
      console.log('[QRAuth] Authentication cancelled:', response.data);
    }
    
    return response.data;
  } catch (error: any) {
    console.error('[QRAuth] Failed to cancel authentication:', {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data
    });
    
    // Return a default response even on error
    return {
      success: false,
      message: error?.response?.data?.message || error?.message || 'Failed to cancel authentication'
    };
  }
};

/**
 * Verify a QR code on mobile device
 * This is called by the mobile app to verify the QR code
 * @param token The session token to verify
 * @param mobileToken The mobile device's authentication token
 * @returns Success status and message
 */
export const verifyQRCodeOnMobile = async (
  token: string,
  mobileToken: string
): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const response = await axios.post(`${API_URL}/auth/qr/verify/${token}`, {}, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${mobileToken}`
      }
    });
    
    if (DDAPI_DEBUG_MODE === 'true') {
      console.log('[QRAuth] QR code verified on mobile:', response.data);
    }
    
    return response.data;
  } catch (error: any) {
    console.error('[QRAuth] Failed to verify QR code on mobile:', {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data
    });
    
    throw new Error(
      error?.response?.data?.message || 
      error?.message || 
      'Failed to verify QR code'
    );
  }
};