// src/components/auth/BiometricAuthButton.tsx

/**
 * BiometricAuthButton.tsx
 * 
 * This file contains the BiometricAuthButton component, which is used to display the biometric authentication button.
 * 
 * @author @BranchManager69
 * @last-modified 2025-04-02
 */

import React, { useState, useEffect } from 'react';
import { authDebug } from '../../config/config';
import useBiometricAuth from '../../hooks/useBiometricAuth';
import { useStore } from '../../store/useStore';

/**
 * BiometricAuthButtonProps
 * 
 * This interface defines the props for the BiometricAuthButton component.
 */
interface BiometricAuthButtonProps {
  mode?: 'register' | 'authenticate';
  className?: string;
  buttonStyle?: 'default' | 'minimal' | 'icon-only';
  authenticatorType?: 'platform' | 'cross-platform';
  nickname?: string;
  walletAddress?: string;
  showAvailabilityIndicator?: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onAvailabilityChange?: (isAvailable: boolean) => void;
}

/**
 * BiometricAuthButton - A component for biometric authentication
 * 
 * This component provides a button for registering biometric credentials
 * or authenticating with existing credentials.
 */
const BiometricAuthButton: React.FC<BiometricAuthButtonProps> = ({
  mode = 'authenticate',
  className = '',
  buttonStyle = 'default',
  authenticatorType = 'platform',
  nickname,
  walletAddress,
  showAvailabilityIndicator = false,
  onSuccess,
  onError,
  onAvailabilityChange
}) => {
  const { 
    isAvailable,
    isRegistered,
    isRegistering,
    isAuthenticating,
    error,
    registerCredential,
    authenticate,
    checkRegistrationStatus
  } = useBiometricAuth();
  
  const user = useStore(state => state.user);
  const [showError, setShowError] = useState<string | null>(null);
  const [isPlatformAuthenticatorAvailable, setIsPlatformAuthenticatorAvailable] = useState<boolean | null>(null);
  
  // Get wallet address from props or user object
  const effectiveWalletAddress = walletAddress || user?.wallet_address;
  const effectiveNickname = nickname || user?.nickname || effectiveWalletAddress;
  
  // Check if platform authenticator is available (Face ID, Touch ID, Windows Hello)
  useEffect(() => {
    async function checkPlatformAuthenticator() {
      if (window.PublicKeyCredential && 
          PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
        try {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setIsPlatformAuthenticatorAvailable(available);
          if (onAvailabilityChange) {
            onAvailabilityChange(available);
          }
        } catch (err) {
          console.error("Error checking platform authenticator:", err);
          setIsPlatformAuthenticatorAvailable(false);
          if (onAvailabilityChange) {
            onAvailabilityChange(false);
          }
        }
      } else {
        setIsPlatformAuthenticatorAvailable(false);
        if (onAvailabilityChange) {
          onAvailabilityChange(false);
        }
      }
    }
    
    checkPlatformAuthenticator();
  }, [onAvailabilityChange]);
  
  // Check if user has registered credentials when wallet address changes
  useEffect(() => {
    if (effectiveWalletAddress && isAvailable) {
      checkRegistrationStatus(effectiveWalletAddress);
    }
  }, [effectiveWalletAddress, isAvailable, checkRegistrationStatus]);
  
  // Determine if button should be enabled
  const isEnabled = isAvailable && !isRegistering && !isAuthenticating && (
    mode === 'register' ? 
      (!isRegistered && (authenticatorType !== 'platform' || isPlatformAuthenticatorAvailable)) : 
      isRegistered
  );
  
  // Handle button click
  const handleClick = async () => {
    if (!isEnabled || !effectiveWalletAddress) {
      // Show appropriate error message
      const errorMsg = !effectiveWalletAddress ? 
        'Please enter a wallet address' : 
        'Biometric authentication is not available';
      setShowError(errorMsg);
      onError?.(errorMsg);
      return;
    }
    
    setShowError(null);
    
    try {
      if (mode === 'register') {
        // Register new credential with optional authenticator type
        const registrationOptions = {
          authenticatorType,
          nickname: effectiveNickname
        };
        
        authDebug('BiometricAuth', 'Registering with options:', registrationOptions);
        
        // Make sure wallet address is defined
        if (!effectiveWalletAddress) {
          throw new Error('Wallet address is required for registration');
        }
        
        const success = await registerCredential(
          effectiveWalletAddress, 
          effectiveNickname || effectiveWalletAddress
        );
        
        if (success) {
          authDebug('BiometricAuth', 'Successfully registered biometric credential');
          onSuccess?.();
        } else if (error) {
          setShowError(error);
          onError?.(error);
        }
      } else {
        // Authenticate with existing credential
        if (!effectiveWalletAddress) {
          throw new Error('Wallet address is required for authentication');
        }
        
        const success = await authenticate(effectiveWalletAddress);
        
        if (success) {
          authDebug('BiometricAuth', 'Successfully authenticated with biometrics');
          onSuccess?.();
        } else if (error) {
          setShowError(error);
          onError?.(error);
        }
      }
    } catch (err) {
      // Handle specific WebAuthn errors
      let errorMessage = '';
      
      if (err instanceof Error) {
        if (err.name === 'NotSupportedError') {
          errorMessage = 'Your device does not support biometric authentication';
        } else if (err.name === 'NotAllowedError') {
          errorMessage = 'Authentication was cancelled';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Authentication timed out. Please try again.';
        } else {
          errorMessage = err.message;
        }
      } else {
        errorMessage = String(err);
      }
      
      setShowError(errorMessage);
      onError?.(errorMessage);
    }
  };
  
  // If showAvailabilityIndicator is false and biometric auth is not available, don't render anything
  if (!isAvailable && !showAvailabilityIndicator) {
    return null;
  }
  
  // Icon component for biometric auth
  const BiometricIcon = () => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={buttonStyle === 'icon-only' ? 'w-6 h-6' : 'w-5 h-5 mr-2'}
    >
      <path d="M7 3C4.239 3 2 5.239 2 8V16C2 18.761 4.239 21 7 21H17C19.761 21 22 18.761 22 16V8C22 5.239 19.761 3 17 3H7ZM11.29 17.71C11.105 17.895 10.851 18 10.586 18C10.321 18 10.066 17.895 9.881 17.71C9.696 17.525 9.591 17.271 9.591 17.006C9.591 16.741 9.696 16.487 9.881 16.302L10.172 16.011C9.002 15.586 8.184 14.509 8.055 13.197C8.018 12.731 8 11.562 8 10C8 8.409 9.409 7 11 7H13C14.591 7 16 8.409 16 10C16 10.369 15.99 11.248 15.974 12L15.472 11.498C15.287 11.313 15.033 11.208 14.768 11.208C14.503 11.208 14.249 11.313 14.064 11.498C13.879 11.683 13.774 11.937 13.774 12.202C13.774 12.467 13.879 12.721 14.064 12.906L16.298 15.14C16.481 15.321 16.73 15.422 16.99 15.422C17.25 15.422 17.499 15.321 17.682 15.14L19.916 12.906C20.101 12.721 20.206 12.467 20.206 12.202C20.206 11.937 20.101 11.683 19.916 11.498C19.731 11.313 19.477 11.208 19.212 11.208C18.947 11.208 18.693 11.313 18.508 11.498L17.974 12.032C17.991 11.182 18 10.376 18 10C18 7.306 15.694 5 13 5H11C8.306 5 6 7.306 6 10C6 11.607 6.019 12.831 6.063 13.423C6.252 15.329 7.476 16.902 9.152 17.551L9.883 16.82C10.068 16.635 10.322 16.53 10.587 16.53C10.852 16.53 11.106 16.635 11.291 16.82C11.476 17.005 11.581 17.259 11.581 17.524C11.581 17.789 11.476 18.043 11.291 18.228L11.29 17.71V17.71Z" />
    </svg>
  );
  
  // Loading spinner component
  const LoadingSpinner = () => (
    <svg className={`animate-spin ${buttonStyle === 'icon-only' ? 'h-6 w-6' : '-ml-1 mr-2 h-4 w-4'} text-white`} 
      xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
  
  /**
   * Get button text based on mode and state
   */
  const getButtonText = () => {
    if (isRegistering) {
      return "Registering...";
    }
    if (isAuthenticating) {
      return "Authenticating...";
    }
    
    if (mode === 'register') {
      if (isRegistered) {
        return "Biometrics Registered";
      } else if (buttonStyle === 'minimal') {
        return "Register";
      } else {
        return "Register Biometrics";
      }
    } else {
      if (buttonStyle === 'minimal') {
        return "Sign in";
      } else {
        return "Sign in with Biometrics";
      }
    }
  };
  
  /**
   * Get appropriate button classes based on style and state
   */
  const getButtonClasses = () => {
    // Base classes
    let classes = 'flex items-center justify-center transition-colors duration-200 ';
    
    // Style-specific classes
    if (buttonStyle === 'icon-only') {
      classes += 'p-2 rounded-full ';
    } else {
      classes += 'px-4 py-2 rounded-lg ';
    }
    
    // State-specific classes
    if (!isEnabled) {
      classes += 'bg-gray-300 text-gray-500 cursor-not-allowed ';
    } else if (mode === 'register') {
      classes += 'bg-blue-600 hover:bg-blue-700 text-white ';
    } else {
      classes += 'bg-green-600 hover:bg-green-700 text-white ';
    }
    
    // Add any custom classes
    classes += className;
    
    return classes;
  };
  
  // Render the "not available" notice when appropriate
  if (!isAvailable && showAvailabilityIndicator) {
    return (
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center px-4 py-2 rounded-lg bg-gray-200 text-gray-500">
          <BiometricIcon />
          <span>Biometric auth not available</span>
        </div>
        {authenticatorType === 'platform' && isPlatformAuthenticatorAvailable === false && (
          <div className="mt-2 text-xs text-gray-500">
            Your device doesn't support Face ID, Touch ID, or Windows Hello
          </div>
        )}
      </div>
    );
  }
  
  // Render the normal button
  return (
    <div className="flex flex-col items-center">
      {/* Button for registering or authenticating with biometrics */}
      <button
        onClick={handleClick}
        disabled={!isEnabled}
        className={getButtonClasses()}
        title={buttonStyle === 'icon-only' ? getButtonText() : undefined}
      >
        {/* Icon */}
        {isRegistering || isAuthenticating ? <LoadingSpinner /> : <BiometricIcon />}
        
        {/* Text (hidden for icon-only style) */}
        {buttonStyle !== 'icon-only' && (
          <span>{getButtonText()}</span>
        )}
      </button>
      
      {/* If there is an error, show an error message */}
      {showError && (
        <div className="mt-2 text-sm text-red-600">
          {showError}
        </div>
      )}
    </div>
  );
};

export default BiometricAuthButton;