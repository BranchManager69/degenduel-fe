import React, { useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { FaDiscord } from "react-icons/fa";

import { authDebug } from "../../config/config";
import { useMigratedAuth } from "../../hooks/auth/useMigratedAuth";
import { Button } from "../ui/Button";

interface DiscordLoginButtonProps {
  linkMode?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * Discord Login Button Component
 *
 * Two modes of operation:
 * 1. When user is not logged in - Shown on login page as alternative login option
 * 2. When user is logged in - Shown on profile page to link Discord account
 *
 * @param {Object} props - Component props
 * @param {boolean} props.linkMode - True if button is used to link account, false for login
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onClick - Optional callback when button is clicked
 */
const DiscordLoginButton: React.FC<DiscordLoginButtonProps> = ({ 
  linkMode = false, 
  className = "",
  onClick
}) => {
  const {
    user, 
    isLoading, 
    linkDiscord,
    // isDiscordLinked, // TODO: Use this to show link status
  } = useMigratedAuth();
  
  const [isProcessing, setIsProcessing] = React.useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Check if Discord is already linked (for future use)
  // const actualIsDiscordLinked = isDiscordLinked();

  const handleDiscordAuth = async () => {
    authDebug('DiscordBtn', 'Discord button clicked', { linkMode, hasUser: !!user });
    if (onClick) onClick();
    
    setIsProcessing(true);
    try {
      let redirectUrl: string;
      
      if (linkMode || user) {
        // For linking mode or authenticated users
        redirectUrl = await linkDiscord();
      } else {
        // For login mode (no authenticated user) - redirect to login endpoint
        redirectUrl = '/api/auth/discord/login';
      }
      
      if (redirectUrl) {
        authDebug('DiscordBtn', `Redirecting to Discord for ${linkMode ? 'linking' : 'login'}`, { redirectUrl });
        window.location.href = redirectUrl;
      } else {
        const errorMsg = `Failed to initiate Discord ${linkMode ? 'linking' : 'login'} - no redirect URL`;
        authDebug('DiscordBtn', errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      authDebug('DiscordBtn', `Error during Discord ${linkMode ? 'linking' : 'login'}`, error);
      const errorMsg = error instanceof Error ? error.message : `Failed to ${linkMode ? 'link' : 'login with'} Discord`;
      toast.error(errorMsg);
    } finally {
      if (isMounted.current) {
        setIsProcessing(false);
      }
    }
  };

  // Handle URL parameters for Discord auth feedback
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let urlModified = false;

    // Show toast if discord=pending is in URL (for non-link, non-user scenarios)
    if (params.get("discord") === "pending" && !linkMode && !user) {
      authDebug('DiscordBtn', 'Found discord=pending parameter, showing toast');
      toast.error("Please connect your wallet to complete logging in with Discord.");
      // NOTE: We are NOT deleting `discord=pending` here. 
      // This parameter might be observed by other parts of the application for a brief period.
      // This component should only clear parameters it is terminally responsible for (e.g., `discord_linked`).
    }
    
    // Handle successful linking indication
    if (params.get("discord_linked") === "true") {
      authDebug('DiscordBtn', 'Found discord_linked=true parameter, showing success toast');
      toast.success("Discord account linked successfully!");
      params.delete("discord_linked"); // Clean up this specific parameter
      urlModified = true;
    }

    // If any parameters relevant to this component were processed and deleted, update the URL
    if (urlModified) {
      const newSearch = params.toString();
      const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}${window.location.hash}`;
      window.history.replaceState({}, "", newUrl);
      authDebug('DiscordBtn', 'URL parameters processed and relevant ones cleaned.', { newSearch });
    }
  }, [user, linkMode]); // Dependencies ensure this runs on mount and when user/linkMode change.

  return (
    <Button
      onClick={handleDiscordAuth}
      variant={linkMode ? "outline" : "secondary"}
      className={`flex items-center justify-center gap-2 font-bold ${className}`}
      aria-label={linkMode ? "Link Discord Account" : "Login with Discord"}
      disabled={isLoading || isProcessing}
    >
      {isLoading || isProcessing ? (
        <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full" />
      ) : (
        <FaDiscord className="text-[#5865F2]" />
      )}
      {linkMode ? "Link Discord" : "Discord"}
    </Button>
  );
};

export default DiscordLoginButton; 