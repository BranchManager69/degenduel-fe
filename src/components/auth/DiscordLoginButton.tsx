import React, { useEffect, useRef } from "react";
import { toast } from "react-hot-toast";

import { authDebug } from "../../config/config";
import { useMigratedAuth } from "../../hooks/auth/useMigratedAuth";
import { Button } from "../ui/Button";

interface DiscordLoginButtonProps {
  linkMode?: boolean;
  className?: string;
  onClick?: () => void;
  iconOnly?: boolean;
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
  onClick,
  iconOnly = false
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
        <svg className="w-4 h-4 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.197.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
        </svg>
      )}
      {!iconOnly && (linkMode ? "Link Discord" : "Discord")}
    </Button>
  );
};

export default DiscordLoginButton; 