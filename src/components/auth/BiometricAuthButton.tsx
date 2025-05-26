// src/components/auth/BiometricAuthButton.tsx

/**
 * BiometricAuthButton.tsx
 * 
 * Enhanced biometric authentication button using the SimpleWebAuthn library
 * which provides a simplified API for working with WebAuthn.
 * 
 * @author @BranchManager69
 * @last-modified 2025-04-07
 */

import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import React, { useEffect, useState } from 'react';
import { API_URL, authDebug } from '../../config/config';
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
  forcePlatformAuth?: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onAvailabilityChange?: (isAvailable: boolean) => void;
}

/**
 * BiometricAuthButton - A component for biometric authentication
 * 
 * This component provides a button for registering biometric credentials
 * or authenticating with existing credentials using the WebAuthn API
 * through the SimpleWebAuthn library.
 */
const BiometricAuthButton: React.FC<BiometricAuthButtonProps> = ({
  mode = 'authenticate',
  className = '',
  buttonStyle = 'default',
  authenticatorType = 'platform',
  nickname,
  walletAddress,
  showAvailabilityIndicator = false,
  forcePlatformAuth = false,
  onSuccess,
  onError,
  onAvailabilityChange
}) => {
  const user = useStore(state => state.user);
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPlatformAuthenticatorAvailable, setIsPlatformAuthenticatorAvailable] = useState<boolean | null>(null);
  
  // Get wallet address from props or user object
  const effectiveWalletAddress = walletAddress || user?.wallet_address;
  const effectiveNickname = nickname || user?.nickname || effectiveWalletAddress;
  
  // Check if WebAuthn is available in this browser
  useEffect(() => {
    const checkWebAuthnAvailability = () => {
      const available = typeof window !== 'undefined' && 
                       !!window.PublicKeyCredential && 
                       !!navigator.credentials;
      
      setIsAvailable(available);
      
      if (onAvailabilityChange) {
        onAvailabilityChange(available);
      }
      
      return available;
    };
    
    checkWebAuthnAvailability();
  }, [onAvailabilityChange]);
  
  // Check if platform authenticator is available (Face ID, Touch ID, Windows Hello)
  useEffect(() => {
    async function checkPlatformAuthenticator() {
      if (window.PublicKeyCredential && 
          PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
        try {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setIsPlatformAuthenticatorAvailable(available);
          authDebug('BiometricAuth', 'Platform authenticator availability check:', { 
            available, 
            userAgent: navigator.userAgent,
            isInWebView: /iPhone|iPad.*AppleWebKit(?!.*Safari)/i.test(navigator.userAgent)
          });
        } catch (err) {
          console.error("Error checking platform authenticator:", err);
          authDebug('BiometricAuth', 'Platform authenticator check failed, treating as available for mobile devices', err);
          
          // On mobile devices, assume platform authenticator is available even if detection fails
          // This handles webview scenarios where the API might not work correctly
          const isMobileDevice = /iPhone|iPad|Android/i.test(navigator.userAgent);
          setIsPlatformAuthenticatorAvailable(isMobileDevice ? true : false);
        }
      } else {
        authDebug('BiometricAuth', 'Platform authenticator API not available');
        setIsPlatformAuthenticatorAvailable(false);
      }
    }
    
    checkPlatformAuthenticator();
  }, []);
  
  // Check if user has registered credentials
  useEffect(() => {
    async function checkHasCredentials() {
      if (!effectiveWalletAddress || !isAvailable) return;
      
      try {
        const response = await fetch(`${API_URL}/auth/passkey/credentials?userId=${encodeURIComponent(effectiveWalletAddress)}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsRegistered(!!data.hasCredential);
        }
      } catch (error) {
        console.error("Error checking for passkey credentials:", error);
        setIsRegistered(false);
      }
    }
    
    if (effectiveWalletAddress && isAvailable) {
      checkHasCredentials();
    }
  }, [effectiveWalletAddress, isAvailable]);
  
  // Determine if button should be enabled
  const isEnabled = isAvailable && !isLoading && (
    mode === 'register' ? 
      (!isRegistered && (
        authenticatorType !== 'platform' || 
        isPlatformAuthenticatorAvailable || 
        isPlatformAuthenticatorAvailable === null || // Allow when detection is uncertain
        forcePlatformAuth // Allow manual override
      )) : 
      isRegistered
  );
  
  // Handle passkey registration (linking)
  const handleRegistration = async () => {
    if (!effectiveWalletAddress) {
      const error = 'Please enter a wallet address';
      setErrorMessage(error);
      onError?.(error);
      return;
    }
    
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      // 1. Get options from server
      const optionsResponse = await fetch(`${API_URL}/auth/passkey/link-options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: effectiveWalletAddress,
          nickname: effectiveNickname,
          authenticatorType
        }),
        credentials: 'include'
      });
      
      if (!optionsResponse.ok) {
        const errorData = await optionsResponse.json();
        throw new Error(errorData.message || 'Failed to get passkey registration options');
      }
      
      const options = await optionsResponse.json();
      
      authDebug('PasskeyAuth', 'Registration options:', options);
      
      const attestation = await startRegistration(options);
      const deviceInfo = getDeviceInfo();
      
      // 3. Send the result back to your server for verification
      const verifyResponse = await fetch(`${API_URL}/auth/passkey/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...attestation,
          deviceName: deviceInfo.name,
          deviceType: deviceInfo.type
        }),
        credentials: 'include'
      });
      
      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.message || 'Passkey registration failed');
      }
      
      const verifyResult = await verifyResponse.json();
      
      if (verifyResult.success) {
        authDebug('PasskeyAuth', 'Registration successful:', verifyResult);
        setIsRegistered(true);
        onSuccess?.();
      } else {
        throw new Error(verifyResult.error || 'Passkey registration failed');
      }
    } catch (error) {
      authDebug('PasskeyAuth', 'Registration error:', error);
      
      let errorMsg = '';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMsg = 'You canceled passkey registration';
        } else if (error.name === 'NotSupportedError') {
          const isInWebView = /iPhone|iPad.*AppleWebKit(?!.*Safari)/i.test(navigator.userAgent);
          if (isInWebView) {
            errorMsg = 'Passkey authentication may not work in this app. Try opening in Safari browser for best results.';
          } else {
            errorMsg = 'Your device doesn\'t support passkey authentication';
          }
        } else if (error.name === 'SecurityError') {
          errorMsg = 'Security error occurred. Please ensure you\'re on a secure connection (HTTPS).';
        } else {
          errorMsg = error.message;
        }
      } else {
        errorMsg = String(error);
      }
      setErrorMessage(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle passkey authentication (login)
  const handleAuthentication = async () => {
    if (!effectiveWalletAddress) {
      const error = 'Please enter a wallet address';
      setErrorMessage(error);
      onError?.(error);
      return;
    }
    
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      // 1. Get options from server
      const optionsResponse = await fetch(`${API_URL}/auth/passkey/login-options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: effectiveWalletAddress })
      });
      
      if (!optionsResponse.ok) {
        const errorData = await optionsResponse.json();
        if (errorData.error === 'no_credentials') {
          throw new Error('No passkey credentials found. Please register first.');
        }
        throw new Error(errorData.message || 'Failed to get passkey authentication options');
      }
      
      const options = await optionsResponse.json();
      authDebug('PasskeyAuth', 'Authentication options:', options);
      const assertion = await startAuthentication(options);
      
      // 3. Send the result back to your server for verification
      const verifyResponse = await fetch(`${API_URL}/auth/passkey/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...assertion,
          userId: effectiveWalletAddress
        })
      });
      
      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.message || 'Passkey authentication failed');
      }
      
      const authResult = await verifyResponse.json();
      if (authResult.verified) {
        authDebug('PasskeyAuth', 'Authentication successful:', authResult);
        if (authResult.user) {
          useStore.getState().setUser(authResult.user);
        }
        onSuccess?.();
      } else {
        throw new Error(authResult.error || 'Passkey authentication failed');
      }
    } catch (error) {
      authDebug('PasskeyAuth', 'Authentication error:', error);
      let errorMsg = '';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMsg = 'You canceled passkey authentication';
        } else if (error.name === 'InvalidStateError') {
          errorMsg = 'No registered passkey found. Try another device or method.';
        } else {
          errorMsg = error.message;
        }
      } else {
        errorMsg = String(error);
      }
      setErrorMessage(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle button click depending on mode
  const handleClick = async () => {
    if (!isEnabled) return;
    
    if (mode === 'register') {
      await handleRegistration();
    } else {
      await handleAuthentication();
    }
  };
  
  // Helper functions for device information
  const getDeviceInfo = () => {
    const userAgent = navigator.userAgent;
    let deviceName = 'Unknown Device';
    let deviceType = 'desktop';
    
    if (/iPhone/.test(userAgent)) {
      deviceName = 'iPhone';
      deviceType = 'mobile';
    } else if (/iPad/.test(userAgent)) {
      deviceName = 'iPad';
      deviceType = 'tablet';
    } else if (/Mac/.test(userAgent)) {
      deviceName = 'Mac';
      deviceType = 'desktop';
    } else if (/Windows/.test(userAgent)) {
      deviceName = 'Windows PC';
      deviceType = 'desktop';
    } else if (/Android.*Mobile/.test(userAgent)) {
      deviceName = 'Android Phone';
      deviceType = 'mobile';
    } else if (/Android/.test(userAgent)) {
      deviceName = 'Android Tablet';
      deviceType = 'tablet';
    } else if (/Linux/.test(userAgent)) {
      deviceName = 'Linux Device';
      deviceType = 'desktop';
    }
    
    return { name: deviceName, type: deviceType };
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
      {/* Fingerprint icon */}
      <path d="M17.81 4.47c-.08 0-.16-.02-.23-.06C15.66 3.42 14 3 12.01 3c-1.98 0-3.86.47-5.57 1.41-.24.13-.54.04-.68-.2-.13-.24-.04-.55.2-.68C7.82 2.52 9.86 2 12.01 2c2.13 0 3.99.47 6.03 1.52.25.13.34.43.21.67-.09.18-.26.28-.44.28zM3.5 9.72c-.1 0-.2-.03-.29-.09-.23-.16-.28-.47-.12-.7.99-1.4 2.25-2.5 3.75-3.27C9.98 4.04 14 4.03 17.15 5.65c1.5.77 2.76 1.86 3.75 3.25.16.22.11.54-.12.7-.23.16-.54.11-.7-.12-.9-1.26-2.04-2.25-3.39-2.94-2.87-1.47-6.54-1.47-9.4.01-1.36.7-2.5 1.7-3.4 2.96-.08.14-.23.21-.39.21z"/>
      <path d="M9.75 21.79c-.13 0-.26-.05-.35-.15-.87-.87-1.34-1.43-2.01-2.64-.69-1.24-1.07-2.65-1.07-4.14v-.24c0-.14.06-.28.16-.38.1-.1.24-.15.38-.15.28 0 .5.22.5.5v.27c0 1.31.33 2.56.98 3.68.67 1.15 1.06 1.64 1.85 2.43.19.2.19.51 0 .71-.1.09-.22.15-.35.15z"/>
      <path d="M16.92 19.94c-.19 0-.37-.09-.49-.26-.47-.66-.7-1.19-.70-1.85 0-.66.25-1.24.75-1.75.5-.5 1.09-.75 1.75-.75.66 0 1.24.25 1.75.75.5.5.75 1.09.75 1.75 0 .66-.25 1.24-.75 1.75-.5.5-1.09.75-1.75.75-.66 0-1.24-.25-1.75-.75-.12-.12-.12-.31 0-.43.12-.12.31-.12.43 0 .37.37.86.56 1.32.56.46 0 .95-.19 1.32-.56.37-.37.56-.86.56-1.32 0-.46-.19-.95-.56-1.32-.37-.37-.86-.56-1.32-.56-.46 0-.95.19-1.32.56-.37.37-.56.86-.56 1.32 0 .5.18.94.55 1.31.17.17.17.43 0 .6-.08.08-.19.13-.29.13z"/>
      <path d="M14.91 22c-.04 0-.09-.01-.13-.02-1.59-.44-2.63-1.03-3.72-2.1-1.4-1.39-2.17-3.24-2.17-5.22 0-1.62 1.38-2.94 3.08-2.94 1.7 0 3.08 1.32 3.08 2.94 0 1.07.93 1.94 2.08 1.94s2.08-.87 2.08-1.94c0-3.77-3.25-6.83-7.25-6.83-2.84 0-5.44 1.58-6.61 4.03-.39.81-.59 1.76-.59 2.8 0 .78.07 2.01.67 3.61.1.26-.03.55-.29.64-.26.1-.55-.04-.64-.29-.49-1.31-.73-2.61-.73-3.96 0-1.2.23-2.29.68-3.24 1.33-2.79 4.28-4.6 7.51-4.6 4.55 0 8.25 3.51 8.25 7.83 0 1.62-1.38 2.94-3.08 2.94s-3.08-1.32-3.08-2.94c0-1.07-.93-1.94-2.08-1.94s-2.08.87-2.08 1.94c0 1.71.66 3.31 1.87 4.51.95.94 1.86 1.46 3.27 1.85.27.07.42.35.35.61-.05.23-.26.38-.48.38z"/>
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
    if (isLoading) {
      return mode === 'register' ? "Registering..." : "Authenticating...";
    }
    
    if (mode === 'register') {
      if (isRegistered) {
        return "Passkey Registered";
      } else if (buttonStyle === 'minimal') {
        return "Register Passkey";
      } else {
        return "Register Passkey";
      }
    } else {
      if (buttonStyle === 'minimal') {
        return "Sign in with Passkey";
      } else {
        return "Use Passkey";
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
          <span>Passkey auth not available</span>
        </div>
        {authenticatorType === 'platform' && isPlatformAuthenticatorAvailable === false && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            {/iPhone|iPad.*AppleWebKit(?!.*Safari)/i.test(navigator.userAgent) ? (
              <span>
                Face ID may not work in this app.<br />
                Try opening in Safari for best results.
              </span>
            ) : (
              <span>Your device doesn't support Face ID, Touch ID, or Windows Hello</span>
            )}
          </div>
        )}
      </div>
    );
  }
  
  // Render the normal button
  return (
    <div className="flex flex-col items-center">
      {/* Debug information - only shown when authDebug is available */}
      {typeof authDebug === 'function' && (
        <div className="mb-2 text-xs text-gray-400 text-center max-w-xs">
          <div>WebAuthn: {isAvailable ? '✅' : '❌'}</div>
          <div>Platform Auth: {isPlatformAuthenticatorAvailable === null ? '❓' : isPlatformAuthenticatorAvailable ? '✅' : '❌'}</div>
          <div>Registered: {isRegistered ? '✅' : '❌'}</div>
          <div>Enabled: {isEnabled ? '✅' : '❌'}</div>
          {forcePlatformAuth && <div className="text-yellow-400">🔓 Force Platform Auth: ON</div>}
          {/iPhone|iPad/i.test(navigator.userAgent) && (
            <div className="text-orange-400">
              📱 iOS Device - WebView: {/iPhone|iPad.*AppleWebKit(?!.*Safari)/i.test(navigator.userAgent) ? 'Yes' : 'No'}
            </div>
          )}
        </div>
      )}
      
      {/* Button for registering or authenticating with biometrics */}
      <button
        onClick={handleClick}
        disabled={!isEnabled}
        className={getButtonClasses()}
        title={buttonStyle === 'icon-only' ? getButtonText() : undefined}
      >
        {/* Icon */}
        {isLoading ? <LoadingSpinner /> : <BiometricIcon />}
        
        {/* Text (hidden for icon-only style) */}
        {buttonStyle !== 'icon-only' && (
          <span>{getButtonText()}</span>
        )}
      </button>
      
      {/* If there is an error, show an error message */}
      {errorMessage && (
        <div className="mt-2 text-sm text-red-600">
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default BiometricAuthButton;