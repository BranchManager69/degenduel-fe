import React, { useRef } from "react";
import { toast } from "react-hot-toast";

import { authDebug } from "../../config/config";
import { useMigratedAuth } from "../../hooks/auth/useMigratedAuth";
import { Button } from "../ui/Button";

interface TelegramLoginButtonProps {
  linkMode?: boolean;
  className?: string;
  onClick?: () => void;
  onSuccess?: () => void;
  iconOnly?: boolean;
}

/**
 * Telegram Login Button Component
 *
 * Two modes of operation:
 * 1. When user is not logged in - Shows instruction to use Telegram for login
 * 2. When user is logged in - Generates secure linking token and shows link
 *
 * @param {Object} props - Component props
 * @param {boolean} props.linkMode - True if button is used to link account, false for login
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onClick - Optional callback when button is clicked
 * @param {Function} props.onSuccess - Optional callback when linking is successful
 */
const TelegramLoginButton: React.FC<TelegramLoginButtonProps> = ({ 
  linkMode = false, 
  className = "",
  onClick,
  onSuccess,
  iconOnly = false
}) => {
  const {
    user, 
    isLoading, 
    linkTelegram,
    isTelegramLinked
  } = useMigratedAuth();
  
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [linkingUrl, setLinkingUrl] = React.useState<string | null>(null);
  const isMounted = useRef(true);

  // FIXED: ALL useEffect hooks MUST be called before any conditional logic
  React.useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // FIXED: Move URL parameter checking useEffect BEFORE early returns
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    authDebug('TelegramBtn', 'Checking URL parameters in button component', { 
      params: Object.fromEntries(urlParams.entries()), linkMode, hasUser: !!user
    });
    
    if (urlParams.get("telegram_linked") === "true") {
      authDebug('TelegramBtn', 'Found telegram_linked=true parameter, showing success toast');
      toast.success("Telegram account linked successfully!");
      const storedRedirectPath = localStorage.getItem("auth_redirect_path");
      authDebug('TelegramBtn', 'Checking for stored redirect path', { hasStoredPath: !!storedRedirectPath, path: storedRedirectPath || 'none' });
      const url = new URL(window.location.href);
      url.searchParams.delete("telegram_linked");
      window.history.replaceState({}, "", url);
      authDebug('TelegramBtn', 'Removed telegram_linked parameter from URL');
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    }
  }, [user, linkMode, onSuccess]);

  // Check if user already has Telegram linked - AFTER all hooks
  const actualIsTelegramLinked = user && isTelegramLinked && isTelegramLinked();

  const handleTelegramAuth = async () => {
    if (onClick) {
      onClick();
    }

    if (isProcessing || isLoading) return;
    
    setIsProcessing(true);
    
    try {
      authDebug('TelegramBtn', 'Starting Telegram auth', { linkMode, hasUser: !!user });

      if (linkMode && user) {
        // For authenticated users, use the linkTelegram method which should generate a token
        if (linkTelegram) {
          const redirectUrl = await linkTelegram();
          if (redirectUrl) {
            setLinkingUrl(redirectUrl);
            toast.success("Telegram linking URL generated! Click the link below to connect.");
          } else {
            toast.error("Failed to generate Telegram linking URL");
          }
        } else {
          toast.error("Telegram linking is not available");
        }
      } else {
        // For non-authenticated users, show instruction
        toast("Please connect your wallet first, then link your Telegram account", {
          duration: 5000,
          icon: "ℹ️"
        });
      }
    } catch (error: any) {
      const specificErrorMessage = "Must be authenticated to link Telegram account";
      let displayMessage = (error instanceof Error && error.message) 
                             ? error.message 
                             : `An error occurred during Telegram ${linkMode ? 'linking' : 'login'}`;
      
      // Check for specific status codes in error response
      const statusCode = error?.response?.data?.status;
      const errorMessage = error?.response?.data?.message;
      
      authDebug('TelegramBtn', 'Error in handleTelegramAuth', { 
        errorMessage: displayMessage, 
        statusCode,
        backendMessage: errorMessage,
        originalError: error 
      });

      // Handle specific status codes with user-friendly messages
      if (statusCode) {
        switch (statusCode) {
          case 'not_linked':
            displayMessage = "This Telegram account is not linked to any wallet. Please connect your wallet first.";
            break;
          case 'user_not_found':
            displayMessage = "User account not found. Please try connecting your wallet again.";
            break;
          case 'wallet_required':
            displayMessage = "Please connect your wallet first to link your Telegram account.";
            break;
          case 'error':
            displayMessage = errorMessage || "An error occurred during Telegram authentication.";
            break;
          default:
            displayMessage = errorMessage || displayMessage;
        }
      }

      if (error instanceof Error && error.message === specificErrorMessage) {
        toast.error("Your session is not valid for linking. You'll be logged out.");
        // Note: Could add logout logic here if needed
      } else {
        toast.error(displayMessage);
      }
      console.error("[Telegram] Auth error:", error);
    } finally {
      if (isMounted.current) {
         setIsProcessing(false);
      }
    }
  };

  // FIXED: All conditional logic/early returns AFTER hooks
  // Don't show link button if user is not authenticated
  if (linkMode && !user) {
    return null;
  }
  
  // Don't show link button if user already has Telegram linked
  if (linkMode && actualIsTelegramLinked) {
    return null;
  }

  // If we have a linking URL, show it
  if (linkingUrl) {
    return (
      <div className={`space-y-3 ${className}`}>
        <Button
          onClick={() => window.open(linkingUrl, '_blank')}
          variant="outline"
          className="flex items-center justify-center gap-2 font-bold w-full"
          aria-label="Open Telegram Link"
        >
          <svg className="w-4 h-4 text-[#0088cc]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12a12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472c-.18 1.898-.962 6.502-1.36 8.627c-.168.9-.499 1.201-.82 1.23c-.696.065-1.225-.46-1.9-.902c-1.056-.693-1.653-1.124-2.678-1.8c-1.185-.78-.417-1.21.258-1.91c.177-.184 3.247-2.977 3.307-3.23c.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345c-.48.33-.913.49-1.302.48c-.428-.008-1.252-.241-1.865-.44c-.752-.245-1.349-.374-1.297-.789c.027-.216.325-.437.893-.663c3.498-1.524 5.83-2.529 6.998-3.014c3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
          Open Telegram Link
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Click the link above to complete Telegram linking
        </p>
      </div>
    );
  }

  return (
    <Button
      onClick={handleTelegramAuth}
      variant={linkMode ? "outline" : "secondary"}
      className={`flex items-center justify-center gap-2 font-bold ${className}`}
      aria-label={linkMode ? "Link Telegram Account" : "Login with Telegram"}
      disabled={isLoading || isProcessing}
    >
      {isLoading || isProcessing ? (
        <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full" />
      ) : (
        <svg className="w-4 h-4 text-[#0088cc]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12a12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472c-.18 1.898-.962 6.502-1.36 8.627c-.168.9-.499 1.201-.82 1.23c-.696.065-1.225-.46-1.9-.902c-1.056-.693-1.653-1.124-2.678-1.8c-1.185-.78-.417-1.21.258-1.91c.177-.184 3.247-2.977 3.307-3.23c.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345c-.48.33-.913.49-1.302.48c-.428-.008-1.252-.241-1.865-.44c-.752-.245-1.349-.374-1.297-.789c.027-.216.325-.437.893-.663c3.498-1.524 5.83-2.529 6.998-3.014c3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      )}
      {!iconOnly && (linkMode ? "Link Telegram" : "Telegram")}
    </Button>
  );
};

export default TelegramLoginButton;