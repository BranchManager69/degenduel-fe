import React, { useEffect, useState } from "react";
import { FaFingerprint } from "react-icons/fa";
import { toast } from "react-hot-toast";

import { authDebug } from "../../config/config";
import { useMigratedAuth } from "../../hooks/auth/useMigratedAuth";
import { Button } from "../ui/Button";

interface BiometricAuthButtonProps {
  // New interface (preferred)
  linkMode?: boolean;
  className?: string;
  onClick?: () => void;
  
  // Legacy interface (for backward compatibility)
  mode?: 'register' | 'authenticate';
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
 * Biometric Authentication Button Component
 *
 * Two modes of operation:
 * 1. When user is not logged in - Shown on login page as alternative login option
 * 2. When user is logged in - Shown on profile page to link passkey
 *
 * @param {Object} props - Component props
 * @param {boolean} props.linkMode - True if button is used to link passkey, false for login
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onClick - Optional callback when button is clicked
 */
const BiometricAuthButton: React.FC<BiometricAuthButtonProps> = ({ 
  // New interface props
  linkMode, 
  className = "",
  onClick,
  
  // Legacy interface props
  mode,
  buttonStyle = 'default',
  onSuccess,
  onError,
  onAvailabilityChange,
  showAvailabilityIndicator = false
}) => {
  // Determine the actual mode - prefer new interface over legacy
  const actualLinkMode = linkMode !== undefined ? linkMode : mode === 'register';
  const actualButtonStyle = buttonStyle || 'default';
  const {
    user, 
    isLoading, 
    linkPasskey,
    // isPasskeyLinked, // TODO: Use this to show link status
  } = useMigratedAuth();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  // Check WebAuthn availability
  useEffect(() => {
    const checkAvailability = () => {
      const available = typeof window !== 'undefined' && 
                       !!window.PublicKeyCredential && 
                       !!navigator.credentials;
      setIsAvailable(available);
      
      // Call legacy callback if provided
      if (onAvailabilityChange) {
        onAvailabilityChange(available);
      }
    };
    
    checkAvailability();
  }, [onAvailabilityChange]);

  // Check if passkey is already linked (for future use)
  // const actualIsPasskeyLinked = isPasskeyLinked();

  const handlePasskeyAuth = async () => {
    authDebug('PasskeyBtn', 'Passkey button clicked', { actualLinkMode, hasUser: !!user });
    if (onClick) onClick();
    
    if (!isAvailable) {
      const errorMsg = 'Passkey authentication is not available on this device';
      toast.error(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }
    
    setIsProcessing(true);
    try {
      if (actualLinkMode || user) {
        // For linking mode or authenticated users
        await linkPasskey();
        setTimeout(() => {
          toast.success('Passkey linked successfully!');
        }, 0);
        if (onSuccess) onSuccess();
      } else {
        // For login mode (no authenticated user) - redirect to login endpoint
        window.location.href = '/api/auth/passkey/login';
      }
    } catch (error) {
      authDebug('PasskeyBtn', `Error during passkey ${actualLinkMode ? 'linking' : 'login'}`, error);
      const errorMsg = error instanceof Error ? error.message : `Failed to ${actualLinkMode ? 'link' : 'login with'} passkey`;
      setTimeout(() => {
        toast.error(errorMsg);
      }, 0);
      if (onError) onError(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle URL parameters for passkey auth feedback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let urlModified = false;

    // Show toast if passkey=pending is in URL (for non-link, non-user scenarios)
    if (params.get("passkey") === "pending" && !actualLinkMode && !user) {
      authDebug('PasskeyBtn', 'Found passkey=pending parameter, showing toast');
      toast.error("Please connect your wallet to complete logging in with passkey.");
    }
    
    // Handle successful linking indication
    if (params.get("passkey_linked") === "true") {
      authDebug('PasskeyBtn', 'Found passkey_linked=true parameter, showing success toast');
      toast.success("Passkey linked successfully!");
      params.delete("passkey_linked");
      urlModified = true;
    }

    // If any parameters relevant to this component were processed and deleted, update the URL
    if (urlModified) {
      const newSearch = params.toString();
      const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}${window.location.hash}`;
      window.history.replaceState({}, "", newUrl);
      authDebug('PasskeyBtn', 'URL parameters processed and relevant ones cleaned.', { newSearch });
    }
  }, [user, actualLinkMode]);

  // Don't render if not available (unless showAvailabilityIndicator is true)
  if (!isAvailable && !showAvailabilityIndicator) {
    return null;
  }
  
  // Show availability indicator if requested and not available
  if (!isAvailable && showAvailabilityIndicator) {
    return (
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center px-4 py-2 rounded-lg bg-gray-200 text-gray-500">
          <FaFingerprint className="mr-2" />
          <span>Passkey auth not available</span>
        </div>
      </div>
    );
  }

  // Determine button text based on mode and style
  const getButtonText = () => {
    if (actualLinkMode) {
      return actualButtonStyle === 'icon-only' ? '' : 'Link Passkey';
    } else {
      return actualButtonStyle === 'icon-only' ? '' : 'Passkey';
    }
  };

  return (
    <Button
      onClick={handlePasskeyAuth}
      variant={actualLinkMode ? "outline" : "secondary"}
      className={`flex items-center justify-center gap-2 font-bold ${
        actualButtonStyle === 'icon-only' ? 'p-2' : ''
      } ${className}`}
      aria-label={actualLinkMode ? "Link Passkey" : "Login with Passkey"}
      disabled={isLoading || isProcessing}
    >
      {isLoading || isProcessing ? (
        <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full" />
      ) : (
        <FaFingerprint className="text-blue-500" />
      )}
      {getButtonText()}
    </Button>
  );
};

export default BiometricAuthButton;