import React from "react";
import { toast } from "react-hot-toast";
import { FaTwitter } from "react-icons/fa";

import { useAuthContext } from "../../contexts/AuthContext";
import { useTwitterAuth } from "../../contexts/TwitterAuthContext";
import { Button } from "../ui/Button";
import { authDebug } from "../../config/config";

interface TwitterLoginButtonProps {
  linkMode?: boolean;
  className?: string;
  onClick?: () => void;
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
  onClick
}) => {
  const { user } = useAuthContext();
  const { 
    login, 
    linkAccount, 
    isTwitterLinked, 
    isLoading 
  } = useTwitterAuth();
  
  const [isLinking, setIsLinking] = React.useState(false);

  // Handle Twitter auth based on mode
  const handleTwitterAuth = async () => {
    authDebug('TwitterBtn', 'Twitter button clicked', { linkMode, hasUser: !!user });
    
    // Call the external onClick handler if provided
    if (onClick) onClick();
    
    if (linkMode && user) {
      // Link existing account
      authDebug('TwitterBtn', 'Starting account linking flow', { userId: user.id });
      setIsLinking(true);
      try {
        const success = await linkAccount();
        if (success) {
          authDebug('TwitterBtn', 'Twitter account linked successfully');
          toast.success("Twitter account linked successfully");
        } else {
          authDebug('TwitterBtn', 'Failed to link Twitter account');
          toast.error("Failed to link Twitter account");
        }
      } catch (error) {
        authDebug('TwitterBtn', 'Error linking Twitter account', { error });
        toast.error("An error occurred while linking your Twitter account");
        console.error("[Twitter] Link error:", error);
      } finally {
        setIsLinking(false);
      }
    } else {
      // Normal login flow
      authDebug('TwitterBtn', 'Starting Twitter login flow');
      login();
    }
  };

  // If in link mode, we need to be logged in
  if (linkMode && !user) {
    return null;
  }
  
  // If in link mode and Twitter is already linked, don't show the button
  if (linkMode && isTwitterLinked) {
    return null;
  }

  // Check URL parameters for Twitter auth status
  React.useEffect(() => {
    // This is also handled by the TwitterAuthContext, but we show toasts here
    const urlParams = new URLSearchParams(window.location.search);
    
    authDebug('TwitterBtn', 'Checking URL parameters in button component', { 
      params: Object.fromEntries(urlParams.entries()),
      linkMode,
      hasUser: !!user
    });
    
    if (!linkMode && !user && urlParams.get("twitter") === "pending") {
      authDebug('TwitterBtn', 'Found twitter=pending parameter, showing toast');
      toast.error("Please connect your wallet to complete Twitter linking");
    }
    
    if (urlParams.get("twitter_linked") === "true") {
      authDebug('TwitterBtn', 'Found twitter_linked=true parameter, showing success toast');
      toast.success("Twitter account linked successfully!");
      
      // Check for stored redirect path - don't remove it, just check
      const storedRedirectPath = localStorage.getItem("auth_redirect_path");
      authDebug('TwitterBtn', 'Checking for stored redirect path', { 
        hasStoredPath: !!storedRedirectPath,
        path: storedRedirectPath || 'none'
      });
      
      // Remove the query parameter to prevent showing toast on refresh
      // But don't remove the stored path - it will be used by LoginPage
      const url = new URL(window.location.href);
      url.searchParams.delete("twitter_linked");
      window.history.replaceState({}, "", url);
      authDebug('TwitterBtn', 'Removed twitter_linked parameter from URL');
    }
  }, [user, linkMode]);

  return (
    <Button
      onClick={handleTwitterAuth}
      variant={linkMode ? "outline" : "secondary"}
      className={`flex items-center justify-center gap-2 ${className}`}
      aria-label={linkMode ? "Link Twitter Account" : "Login with Twitter"}
      disabled={isLoading || isLinking}
    >
      {isLoading || isLinking ? (
        <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full" />
      ) : (
        <FaTwitter className="text-[#1DA1F2]" />
      )}
      {linkMode ? "Link Twitter" : "Twitter"}
    </Button>
  );
};

export default TwitterLoginButton;