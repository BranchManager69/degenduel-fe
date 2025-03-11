import React from 'react';
import { toast } from 'react-hot-toast';
import { FaTwitter } from 'react-icons/fa';
import { useAuthContext } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';

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
 */
const TwitterLoginButton = ({ linkMode = false, className = '' }) => {
  const { user } = useAuthContext();
  
  // Only show Twitter login option if user has previously linked a Twitter account
  // (when not in link mode)
  const handleTwitterAuth = () => {
    // Redirect to the Twitter OAuth endpoint
    window.location.href = '/api/auth/twitter/login';
  };

  // If in link mode, we need to be logged in
  if (linkMode && !user) {
    return null;
  }

  // If not in link mode and user not logged in, check URL for Twitter pending state
  React.useEffect(() => {
    if (!linkMode && !user) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('twitter') === 'pending') {
        toast.error('Please connect your wallet to complete Twitter linking');
      }
    }
    
    // Check for twitter_linked success parameter
    if (user) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('twitter_linked') === 'true') {
        toast.success('Twitter account linked successfully!');
        
        // Remove the query parameter to prevent showing the toast on refresh
        const url = new URL(window.location.href);
        url.searchParams.delete('twitter_linked');
        window.history.replaceState({}, '', url);
      }
    }
  }, [user, linkMode]);

  return (
    <Button
      onClick={handleTwitterAuth}
      variant={linkMode ? "outline" : "secondary"}
      className={`flex items-center justify-center gap-2 ${className}`}
      aria-label={linkMode ? "Link Twitter Account" : "Login with Twitter"}
    >
      <FaTwitter className="text-[#1DA1F2]" />
      {linkMode ? 'Link Twitter Account' : 'Login with Twitter'}
    </Button>
  );
};

export default TwitterLoginButton; 