import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../ui/Card';
import { LoadingSpinner } from '../common/LoadingSpinner';
import ConnectWalletButton from './ConnectWalletButton';
import TwitterLoginButton from './TwitterLoginButton';
import { useMigratedAuth } from '../../hooks/auth/useMigratedAuth';
import { getTwitterStatus, completeTwitterPendingLink } from '../../services/api/auth';
import { toast } from '../toast';
import { authDebug } from '../../config/config';

interface SmartTwitterAuthProps {
  className?: string;
  redirectPath?: string;
  onSuccess?: () => void;
}

export const SmartTwitterAuth: React.FC<SmartTwitterAuthProps> = ({ 
  className = '', 
  redirectPath,
  onSuccess 
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useMigratedAuth();
  
  const [state, setState] = useState({
    isChecking: true,
    hasTwitterLinked: false,
    twitterUsername: '',
    isPendingLink: false,
    pendingTwitterId: '',
    showWalletConnect: false,
  });

  // Check for pending Twitter link on mount
  useEffect(() => {
    const checkPendingState = async () => {
      const action = searchParams.get('action');
      const twitterParam = searchParams.get('twitter');
      const twitterId = searchParams.get('twitter_id');
      
      authDebug('SmartTwitterAuth', 'Checking URL params', { 
        action, 
        twitterParam, 
        twitterId,
        hasUser: !!user 
      });

      if (action === 'connect-wallet' && twitterParam === 'pending') {
        setState(prev => ({
          ...prev,
          isPendingLink: true,
          pendingTwitterId: twitterId || '',
          showWalletConnect: true,
          isChecking: false
        }));
        
        // Show informative message
        toast.info(
          "Almost there! Connect your wallet to complete Twitter login",
          { duration: 5000 }
        );
      } else {
        // Normal flow - check user's Twitter status
        if (user) {
          checkUserTwitterStatus();
        } else {
          setState(prev => ({ ...prev, isChecking: false }));
        }
      }
    };

    checkPendingState();
  }, [searchParams, user]);

  // Check if the current user has Twitter linked
  const checkUserTwitterStatus = async () => {
    try {
      setState(prev => ({ ...prev, isChecking: true }));
      const status = await getTwitterStatus();
      
      authDebug('SmartTwitterAuth', 'Twitter status check', status);
      
      setState(prev => ({
        ...prev,
        hasTwitterLinked: status.hasTwitterLinked,
        twitterUsername: status.twitterUsername || '',
        isChecking: false
      }));
    } catch (error) {
      console.error('Failed to check Twitter status:', error);
      setState(prev => ({ ...prev, isChecking: false }));
    }
  };

  // Handle successful wallet connection
  const handleWalletConnected = async () => {
    authDebug('SmartTwitterAuth', 'Wallet connected, handling pending state', {
      isPendingLink: state.isPendingLink,
      pendingTwitterId: state.pendingTwitterId
    });

    if (state.isPendingLink) {
      // Auto-link Twitter after wallet connection
      toast.success("Wallet connected! Now linking your Twitter account...");
      
      // Clear the pending state from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('action');
      url.searchParams.delete('twitter');
      url.searchParams.delete('twitter_id');
      window.history.replaceState({}, '', url);
      
      try {
        // Complete the pending Twitter link
        const result = await completeTwitterPendingLink();
        
        if (result.success) {
          toast.success(`Twitter account @${result.twitter_username} linked successfully!`);
          
          // Update the state to reflect the successful link
          setState(prev => ({
            ...prev,
            hasTwitterLinked: true,
            twitterUsername: result.twitter_username || '',
            isPendingLink: false
          }));
          
          // Navigate after a brief delay
          setTimeout(() => {
            if (redirectPath) {
              navigate(redirectPath);
            } else {
              navigate('/profile');
            }
          }, 1000);
        } else {
          toast.error(result.message || "Failed to link Twitter account");
          setState(prev => ({ ...prev, isPendingLink: false }));
        }
      } catch (error) {
        console.error('Failed to complete Twitter pending link:', error);
        toast.error("Failed to link Twitter account. Please try again.");
        setState(prev => ({ ...prev, isPendingLink: false }));
      }
    }
  };

  // Handle Twitter link success
  const handleTwitterLinkSuccess = () => {
    toast.success("Twitter account linked successfully!");
    checkUserTwitterStatus();
    if (onSuccess) onSuccess();
  };

  // Loading state
  if (authLoading || state.isChecking) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <LoadingSpinner />
      </div>
    );
  }

  // Pending link state - show wallet connection
  if (state.isPendingLink && !user) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">
              Complete Your Twitter Login
            </h3>
            <p className="text-sm text-muted-foreground">
              Connect your wallet to finish linking your Twitter account
            </p>
          </div>
          
          <ConnectWalletButton 
            className="w-full"
            onSuccess={handleWalletConnected}
          />
          
          <p className="text-xs text-center text-muted-foreground">
            Your Twitter account will be automatically linked after connecting
          </p>
        </div>
      </Card>
    );
  }

  // User is authenticated
  if (user) {
    // Twitter already linked
    if (state.hasTwitterLinked) {
      return (
        <div className={`flex items-center gap-2 ${className}`}>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 rounded-lg">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
            </svg>
            <span className="text-sm font-medium">
              @{state.twitterUsername}
            </span>
          </div>
        </div>
      );
    }

    // Show link Twitter button
    return (
      <TwitterLoginButton
        linkMode={true}
        className={className}
        onSuccess={handleTwitterLinkSuccess}
      />
    );
  }

  // Not authenticated - show smart login flow
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col gap-3">
        {/* Primary action: Connect wallet */}
        <ConnectWalletButton 
          className="w-full"
          onSuccess={handleWalletConnected}
        />
        
        {/* Secondary action: Login with Twitter */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or
            </span>
          </div>
        </div>
        
        <TwitterLoginButton
          linkMode={false}
          className="w-full"
        />
        
        <p className="text-xs text-center text-muted-foreground">
          New users: Connect wallet first, then link Twitter
        </p>
      </div>
    </div>
  );
};