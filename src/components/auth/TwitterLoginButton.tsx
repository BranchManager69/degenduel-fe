import React, { useEffect, useRef } from "react";
import { toast } from "react-hot-toast";

import { authDebug } from "../../config/config";
import { useMigratedAuth } from "../../hooks/auth/useMigratedAuth";
import { getTwitterAuthUrl } from "../../services/api/auth";
import { Button } from "../ui/Button";

interface TwitterLoginButtonProps {
  linkMode?: boolean;
  className?: string;
  onClick?: () => void;
  onSuccess?: () => void;
  iconOnly?: boolean;
}

/**
 * Twitter Login Button Component
 *
 * Two modes of operation:
 * 1. When user is not logged in - Shown on login page as alternative login option
 * 2. When user is logged in - Shown on profile page to link Twitter account
 *
 * @param {Object} props - Component props
 * @param {boolean} props.linkMode - True if button is used to link account, false for login
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onClick - Optional callback when button is clicked
 */
const TwitterLoginButton: React.FC<TwitterLoginButtonProps> = ({ 
  linkMode = false, 
  className = "",
  onClick,
  onSuccess,
  iconOnly = false
}) => {
  const {
    user, 
    isLoading, 
    linkTwitter,
    isTwitterLinked,
    logout,
  } = useMigratedAuth();
  
  const [isProcessing, setIsProcessing] = React.useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const actualIsTwitterLinked = isTwitterLinked();

  const handleTwitterAuth = async () => {
    authDebug('TwitterBtn', 'Twitter button clicked', { linkMode, hasUser: !!user });
    if (onClick) onClick();
    
    setIsProcessing(true);
    try {
      let redirectUrl: string;
      
      if (linkMode || user) {
        // For linking mode or authenticated users, use linkTwitter
        redirectUrl = await linkTwitter();
      } else {
        // For login mode (no authenticated user), use direct Twitter login URL
        redirectUrl = await getTwitterAuthUrl();
      }
      
      if (redirectUrl) {
        authDebug('TwitterBtn', `Redirecting to Twitter for ${linkMode ? 'linking' : 'login'}`, { redirectUrl });
        window.location.href = redirectUrl;
      } else {
        const errorMsg = `Failed to initiate Twitter ${linkMode ? 'linking' : 'login'} - no redirect URL`;
        authDebug('TwitterBtn', errorMsg);
        toast.error(errorMsg);
      }
    } catch (error: any) {
      const specificErrorMessage = "Must be authenticated to link Twitter account";
      let displayMessage = (error instanceof Error && error.message) 
                             ? error.message 
                             : `An error occurred during Twitter ${linkMode ? 'linking' : 'login'}`;
      
      // Check for specific status codes in error response
      const statusCode = error?.response?.data?.status;
      const errorMessage = error?.response?.data?.message;
      
      authDebug('TwitterBtn', 'Error in handleTwitterAuth', { 
        errorMessage: displayMessage, 
        statusCode,
        backendMessage: errorMessage,
        originalError: error 
      });

      // Handle specific status codes with user-friendly messages
      if (statusCode) {
        switch (statusCode) {
          case 'not_linked':
            displayMessage = "This Twitter account is not linked to any wallet. Please connect your wallet first.";
            break;
          case 'user_not_found':
            displayMessage = "User account not found. Please try connecting your wallet again.";
            break;
          case 'wallet_required':
            displayMessage = "Please connect your wallet first to link your Twitter account.";
            break;
          case 'error':
            displayMessage = errorMessage || "An error occurred during Twitter authentication.";
            break;
          default:
            displayMessage = errorMessage || displayMessage;
        }
      }

      if (error instanceof Error && error.message === specificErrorMessage) {
        toast.error("Your session is not valid for linking. You'll be logged out.");
        // Attempt to logout to clear the invalid session
        try {
          await logout(); // Call the logout function
          toast.success("You have been logged out. Please sign in again to link your account.");
        } catch (logoutError) {
          authDebug('TwitterBtn', 'Error during automatic logout after link failure', { logoutError });
          toast.error("Attempted to clear session but failed. Please try logging out manually.");
        }
      } else {
        toast.error(displayMessage);
      }
      console.error("[Twitter] Auth error:", error); // This will still log the full error object
    } finally {
      if (isMounted.current) {
         setIsProcessing(false);
      }
    }
  };

  if (linkMode && !user) {
    return null;
  }
  
  if (linkMode && actualIsTwitterLinked) {
    return null;
  }

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    authDebug('TwitterBtn', 'Checking URL parameters in button component', { 
      params: Object.fromEntries(urlParams.entries()), linkMode, hasUser: !!user
    });
    if (!linkMode && !user && urlParams.get("twitter") === "pending") {
      authDebug('TwitterBtn', 'Found twitter=pending parameter, showing informative toast');
      toast("Almost there! Connect your wallet to complete Twitter login", {
        duration: 5000,
        icon: "ℹ️"
      });
    }
    if (urlParams.get("twitter_linked") === "true") {
      authDebug('TwitterBtn', 'Found twitter_linked=true parameter, showing success toast');
      toast.success("Twitter account linked successfully!");
      const storedRedirectPath = localStorage.getItem("auth_redirect_path");
      authDebug('TwitterBtn', 'Checking for stored redirect path', { hasStoredPath: !!storedRedirectPath, path: storedRedirectPath || 'none' });
      const url = new URL(window.location.href);
      url.searchParams.delete("twitter_linked");
      window.history.replaceState({}, "", url);
      authDebug('TwitterBtn', 'Removed twitter_linked parameter from URL');
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    }
  }, [user, linkMode, onSuccess]);

  return (
    <Button
      onClick={handleTwitterAuth}
      variant={linkMode ? "outline" : "secondary"}
      className={`flex items-center justify-center gap-2 font-bold ${className}`}
      aria-label={linkMode ? "Link Twitter Account" : "Login with Twitter"}
      disabled={isLoading || isProcessing}
    >
      {isLoading || isProcessing ? (
        <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full" />
      ) : (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      )}
      {!iconOnly && (linkMode ? "Link X" : "X")}
    </Button>
  );
};

export default TwitterLoginButton;