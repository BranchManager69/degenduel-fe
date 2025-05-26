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
  const [hasCheckedRegistration, setHasCheckedRegistration] = useState<boolean>(false);

  const user = useStore(state => state.user);

  // Only check if biometric auth is available in this browser
  useEffect(() => {
    // Just check if WebAuthn exists - let the button handle detailed checks
    const available = typeof window !== 'undefined' &&
      !!window.PublicKeyCredential &&
      !!navigator.credentials;
    setIsAvailable(available);

    // Clear registration status when user logs out
    if (!user?.wallet_address) {
      setIsRegistered(false);
      setHasCheckedRegistration(false);
    }
  }, [user?.wallet_address]);

  // Helper function to determine if user is fully authenticated
  const isUserFullyAuthenticated = (user: any): boolean => {
    // User should have both wallet_address and some form of authentication token
    return !!(user?.wallet_address && (user?.jwt || user?.session_token || user?.authenticated));
  };

  // Manual check for registration status - only called when explicitly needed
  const checkRegistrationStatus = useCallback(async (userId?: string): Promise<boolean> => {
    const userIdToCheck = userId || user?.wallet_address;

    if (!userIdToCheck) {
      authDebug('BiometricAuth', 'No user ID provided for registration check');
      setIsRegistered(false);
      return false;
    }

    if (!isUserFullyAuthenticated(user)) {
      authDebug('BiometricAuth', 'User not fully authenticated, skipping biometric check');
      setIsRegistered(false);
      return false;
    }

    try {
      authDebug('BiometricAuth', 'Manually checking registration status for authenticated user', { userId: userIdToCheck });
      const hasCredential = await BiometricAuthService.hasRegisteredCredential(userIdToCheck);
      setIsRegistered(hasCredential);
      setHasCheckedRegistration(true);
      return hasCredential;
    } catch (error) {
      authDebug('BiometricAuth', 'Error checking registration status', error);
      setIsRegistered(false);
      setHasCheckedRegistration(true);
      return false;
    }
  }, [user]);

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
      setHasCheckedRegistration(true);
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

    // Check registration status first if we haven't already
    if (!hasCheckedRegistration) {
      await checkRegistrationStatus(userId);
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
  }, [isAvailable, isRegistered, hasCheckedRegistration, checkRegistrationStatus]);

  return {
    isAvailable,
    isRegistered,
    isRegistering,
    isAuthenticating,
    error,
    hasCheckedRegistration,
    registerCredential,
    authenticate,
    checkRegistrationStatus // Now requires manual call
  };
};

export default useBiometricAuth;