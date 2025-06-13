// src/hooks/auth/useQRCodeAuth.ts

/**
 * @deprecated This hook is deprecated and will be removed in a future version.
 * No components are using this hook.
 * 
 * Hook for QR code authentication
 * 
 * Provides functionality for QR code-based authentication including
 * generating QR codes, polling for status, and completing the auth flow.
 * 
 * @author Claude
 * @created 2025-05-09
 */

import { useCallback, useEffect, useState } from 'react';
import { authDebug } from '../../config/config';
import {
  cancelQRCodeAuth,
  completeQRCodeAuth,
  generateQRCode,
  pollQRCodeStatus
} from '../../services/api/qrAuth';

interface UseQRCodeAuthProps {
  autoGenerate?: boolean;
  pollInterval?: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface UseQRCodeAuthReturn {
  qrCodeUrl: string | null;
  sessionToken: string | null;
  expiresAt: string | null;
  status: 'pending' | 'approved' | 'completed' | 'cancelled' | 'expired' | 'idle';
  error: string | null;
  isLoading: boolean;
  generate: () => Promise<string | null>;
  cancel: () => Promise<void>;
}

/**
 * @deprecated This hook is deprecated and will be removed in a future version.
 * No components are using this hook.
 */
export const useQRCodeAuth = ({
  autoGenerate = true,
  pollInterval = 2000,
  onSuccess,
  onError
}: UseQRCodeAuthProps = {}): UseQRCodeAuthReturn => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'approved' | 'completed' | 'cancelled' | 'expired' | 'idle'>(
    autoGenerate ? 'pending' : 'idle'
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(autoGenerate);
  const [pollingIntervalId, setPollingIntervalId] = useState<NodeJS.Timeout | null>(null);

  // Generate QR code
  const generate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setStatus('pending');
    
    try {
      const { qrCode, sessionToken, expiresAt } = await generateQRCode();
      
      setQrCodeUrl(qrCode);
      setSessionToken(sessionToken);
      setExpiresAt(expiresAt);
      
      authDebug('QRCodeAuth', 'QR code generated', { sessionToken, expiresAt });
      
      return sessionToken;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      authDebug('QRCodeAuth', 'Error generating QR code', error);
      
      setError(errorMessage);
      setStatus('idle');
      
      if (onError) onError(errorMessage);
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  // Poll for status
  const startPolling = useCallback((token: string) => {
    // Clear any existing interval
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
    }
    
    // Start new polling interval
    const intervalId = setInterval(async () => {
      try {
        // Check if token is expired
        if (expiresAt && new Date(expiresAt) < new Date()) {
          setStatus('expired');
          clearInterval(intervalId);
          return;
        }
        
        const { status: newStatus, expiresAt: newExpiresAt } = await pollQRCodeStatus(token);
        
        authDebug('QRCodeAuth', 'Status poll result', { status: newStatus, expiresAt: newExpiresAt });
        
        setStatus(newStatus);
        if (newExpiresAt) setExpiresAt(newExpiresAt);
        
        // If status is approved, complete the authentication
        if (newStatus === 'approved') {
          try {
            const result = await completeQRCodeAuth(token);
            
            if (result.verified) {
              setStatus('completed');
              if (onSuccess) onSuccess();
            } else {
              throw new Error('Authentication verification failed');
            }
          } catch (completeError) {
            const errorMessage = completeError instanceof Error 
              ? completeError.message 
              : 'Failed to complete authentication';
            
            setError(errorMessage);
            if (onError) onError(errorMessage);
          }
        }
        
        // If status is completed or cancelled, stop polling
        if (newStatus === 'completed' || newStatus === 'cancelled') {
          clearInterval(intervalId);
        }
      } catch (error) {
        // If polling fails, log error but don't stop polling
        authDebug('QRCodeAuth', 'Error polling status', error);
      }
    }, pollInterval);
    
    setPollingIntervalId(intervalId);
    
    return () => clearInterval(intervalId);
  }, [expiresAt, onError, onSuccess, pollInterval, pollingIntervalId]);

  // Cancel QR code authentication
  const cancel = useCallback(async () => {
    if (!sessionToken) return;
    
    try {
      await cancelQRCodeAuth(sessionToken);
      
      authDebug('QRCodeAuth', 'Authentication cancelled');
      
      setStatus('cancelled');
      setQrCodeUrl(null);
      setSessionToken(null);
      
      // Clear polling interval
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
        setPollingIntervalId(null);
      }
    } catch (error) {
      authDebug('QRCodeAuth', 'Error cancelling authentication', error);
    }
  }, [sessionToken, pollingIntervalId]);

  // Auto-generate QR code on mount if enabled
  useEffect(() => {
    if (autoGenerate) {
      generate().then(token => {
        if (token) startPolling(token);
      });
    }
    
    // Clean up on unmount
    return () => {
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
      }
      
      if (sessionToken && ['pending', 'approved'].includes(status)) {
        cancel();
      }
    };
  }, []);

  // Start polling when session token changes
  useEffect(() => {
    if (sessionToken && status === 'pending') {
      startPolling(sessionToken);
    }
  }, [sessionToken, startPolling]);

  // Check for expiration
  useEffect(() => {
    if (expiresAt && status === 'pending') {
      const checkExpiration = () => {
        if (new Date(expiresAt) < new Date()) {
          setStatus('expired');
          
          // Clear polling interval
          if (pollingIntervalId) {
            clearInterval(pollingIntervalId);
            setPollingIntervalId(null);
          }
        }
      };
      
      // Check immediately
      checkExpiration();
      
      // Set up interval to check periodically
      const expirationInterval = setInterval(checkExpiration, 1000);
      
      return () => clearInterval(expirationInterval);
    }
  }, [expiresAt, status, pollingIntervalId]);

  return {
    qrCodeUrl,
    sessionToken,
    expiresAt,
    status,
    error,
    isLoading,
    generate,
    cancel
  };
};

export default useQRCodeAuth;