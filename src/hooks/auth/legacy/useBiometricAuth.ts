import { useCallback, useEffect, useState } from 'react';
import { authDebug } from '../../../config/config';
import BiometricAuthService from '../../../services/BiometricAuthService';
import { useStore } from '../../../store/useStore';

/**
 * Hook for biometric authentication functionality
 */
export const useBiometricAuth = () => {
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const user = useStore(state => state.user);
  
  // Check if biometric auth is available in this browser
  useEffect(() => {
    const available = BiometricAuthService.canUseBiometrics();
    setIsAvailable(available);
    
    // If available and user is logged in, check if they have registered credentials
    if (available && user?.wallet_address) {
      checkRegistrationStatus(user.wallet_address);
    }
  }, [user?.wallet_address]);
  
  // Check if the user has registered credentials
  const checkRegistrationStatus = useCallback(async (userId: string) => {
    try {
      const hasCredential = await BiometricAuthService.hasRegisteredCredential(userId);
      setIsRegistered(hasCredential);
      return hasCredential;
    } catch (error) {
      authDebug('BiometricAuth', 'Error checking registration status', error);
      setIsRegistered(false);
      return false;
    }
  }, []);
  
  // Register a new credential
  const registerCredential = useCallback(async (
    userId: string, 
    username: string,
    options?: { 
      nickname?: string;
      authenticatorType?: 'platform' | 'cross-platform';
    }
  ): Promise<boolean> => {
    if (!isAvailable) {
      setError('Biometric authentication is not available in this browser');
      return false;
    }
    
    setIsRegistering(true);
    setError(null);
    
    try {
      // Pass optional parameters to the service
      const nickname = options?.nickname || username;
      const authenticatorType = options?.authenticatorType || 'platform';
      
      await BiometricAuthService.registerCredential(
        userId, 
        nickname,
        { authenticatorType }
      );
      
      setIsRegistered(true);
      authDebug('BiometricAuth', 'Credential registered successfully');
      return true;
    } catch (error) {
      authDebug('BiometricAuth', 'Error registering credential', error);
      setError(error instanceof Error ? error.message : String(error));
      return false;
    } finally {
      setIsRegistering(false);
    }
  }, [isAvailable]);
  
  // Authenticate with biometric credential
  const authenticate = useCallback(async (userId: string): Promise<boolean> => {
    if (!isAvailable) {
      setError('Biometric authentication is not available in this browser');
      return false;
    }
    
    if (!isRegistered) {
      setError('No biometric credential registered');
      return false;
    }
    
    setIsAuthenticating(true);
    setError(null);
    
    try {
      await BiometricAuthService.authenticate(userId);
      authDebug('BiometricAuth', 'Authenticated successfully with biometrics');
      return true;
    } catch (error) {
      authDebug('BiometricAuth', 'Error authenticating with biometrics', error);
      setError(error instanceof Error ? error.message : String(error));
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, [isAvailable, isRegistered]);
  
  return {
    isAvailable,
    isRegistered,
    isRegistering,
    isAuthenticating,
    error,
    registerCredential,
    authenticate,
    checkRegistrationStatus
  };
};

export default useBiometricAuth;