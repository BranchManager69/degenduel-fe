import React, { useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { FaTwitter } from "react-icons/fa";

import { authDebug } from "../../config/config";
import { useMigratedAuth } from "../../hooks/auth/useMigratedAuth";
import { Button } from "../ui/Button";

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
  const {
    user, 
    isLoading, 
    linkTwitter,
    isTwitterLinked,
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
      const redirectUrl = await linkTwitter();
      if (redirectUrl) {
        authDebug('TwitterBtn', `Redirecting to Twitter for ${linkMode ? 'linking' : 'login'}`, { redirectUrl });
        window.location.href = redirectUrl;
      } else {
        const errorMsg = `Failed to initiate Twitter ${linkMode ? 'linking' : 'login'} - no redirect URL`;
        authDebug('TwitterBtn', errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      const errorMsg = `An error occurred during Twitter ${linkMode ? 'linking' : 'login'}`;
      authDebug('TwitterBtn', errorMsg, { error });
      toast.error(errorMsg);
      console.error("[Twitter] Auth error:", error);
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
      authDebug('TwitterBtn', 'Found twitter=pending parameter, showing toast');
      toast.error("Please connect your wallet to complete logging in with Twitter.");
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
    }
  }, [user, linkMode]);

  return (
    <Button
      onClick={handleTwitterAuth}
      variant={linkMode ? "outline" : "secondary"}
      className={`flex items-center justify-center gap-2 ${className}`}
      aria-label={linkMode ? "Link Twitter Account" : "Login with Twitter"}
      disabled={isLoading || isProcessing}
    >
      {isLoading || isProcessing ? (
        <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full" />
      ) : (
        <FaTwitter className="text-[#1DA1F2]" />
      )}
      {linkMode ? "Link Twitter" : "Twitter"}
    </Button>
  );
};

export default TwitterLoginButton;