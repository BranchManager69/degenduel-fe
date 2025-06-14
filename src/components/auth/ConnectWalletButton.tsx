// src/components/auth/ConnectWalletButton.tsx

/**
 * Connect Wallet Button Component
 * 
 * @description A button component that handles wallet connection through the unified auth system.
 * Integrates with Solana Kit and unified authentication to provide wallet login functionality.
 * 
 * @author Claude
 * @version 1.0.2
 * @created 2025-05-09
 * @updated 2025-05-24 - Updated to match uniform button styling
 */

import { WalletName, WalletReadyState } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import axios from 'axios';
import React, { useCallback, useState } from 'react';
import { useMigratedAuth } from '../../hooks/auth/useMigratedAuth';
import { Button } from '../ui/Button';

interface ConnectWalletButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const ConnectWalletButton: React.FC<ConnectWalletButtonProps> = ({
  className = '',
  size = 'md',
  onSuccess,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWalletOptions, setShowWalletOptions] = useState(false);
  
  const auth = useMigratedAuth();
  const {
    wallets,
    select,
    connect,
    publicKey,
    connected,
    connecting,
    disconnect,
    signMessage
  } = useWallet();

  const getChallengeNonce = async (walletAddress: string): Promise<string> => {
    try {
      const response = await axios.get(`/auth/challenge?wallet=${walletAddress}`);
      return response.data.nonce;
    } catch (error) {
      console.error('Error getting challenge nonce:', error);
      throw new Error('Failed to get challenge nonce');
    }
  };

  const handleWalletSelect = useCallback(async (walletName: WalletName) => {
    setShowWalletOptions(false);
    setIsLoading(true);
    setError(null);

    try {
      select(walletName);
      await connect();
    } catch (err) {
      console.error('Error selecting wallet:', err);
      setError('Failed to select wallet');
      setIsLoading(false);
    }
  }, [select, connect]);

  const handleAuthenticate = useCallback(async () => {
    console.log('ConnectWalletButton: handleAuthenticate called', {
      connected,
      publicKey: publicKey?.toBase58(),
      signMessage: !!signMessage,
      authIsAuthenticated: auth.isAuthenticated,
      authUser: auth.user?.wallet_address
    });

    if (!connected || !publicKey || !signMessage) {
      console.log('ConnectWalletButton: Wallet not ready for authentication', {
        connected,
        publicKey: !!publicKey,
        signMessage: !!signMessage
      });
      setError("Wallet not connected.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const walletAddress = publicKey.toBase58();
      console.log('ConnectWalletButton: Starting authentication for', walletAddress);

      if (auth.user?.wallet_address && auth.user.wallet_address === walletAddress) {
         console.log("ConnectWalletButton: Already authenticated with this DegenDuel account for this wallet.");
         onSuccess?.();
         setIsLoading(false);
         return;
      }

      console.log('ConnectWalletButton: Getting challenge nonce...');
      await getChallengeNonce(walletAddress);

      const signMessageWrapper = async (messageToSign: Uint8Array) => {
        if (!signMessage) {
          throw new Error('Wallet signing function not available.');
        }
        console.log('ConnectWalletButton: Signing message...');
        const signature = await signMessage(messageToSign);
        console.log('ConnectWalletButton: Message signed successfully');
        return { signature }; 
      };

      console.log('ConnectWalletButton: Calling auth.loginWithWallet...');
      const result = await auth.loginWithWallet(walletAddress, signMessageWrapper);
      console.log('ConnectWalletButton: Authentication successful!', { user: result });
      onSuccess?.();
    } catch (err) {
      console.error('ConnectWalletButton: Error during authentication:', err);
      console.error('ConnectWalletButton: Error details:', {
        message: err instanceof Error ? err.message : String(err),
        response: (err as any)?.response?.data,
        status: (err as any)?.response?.status,
        statusText: (err as any)?.response?.statusText
      });
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during authentication.';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [
    auth, 
    publicKey, 
    connected, 
    signMessage,
    onSuccess, 
    onError
  ]);

  const handleLogout = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await auth.logout();
      await disconnect();
      console.log("ConnectWalletButton: Logout successful.");
    } catch (err) {
      console.error('ConnectWalletButton: Error during logout:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to logout.';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [auth, disconnect, onError]);

  // Build correct deep link URLs as per official wallet documentation
  const buildBrowseLink = useCallback((base: 'phantom' | 'solflare', dappUrl: string) => {
    const encoded = encodeURIComponent(dappUrl);
    const encodedRef = encodeURIComponent(window.location.origin);
    return base === 'phantom'
      ? `https://phantom.app/ul/browse/${encoded}?ref=${encodedRef}`
      : `https://solflare.com/ul/v1/browse/${encoded}?ref=${encodedRef}`;
  }, []);

  // Mobile wallet deep link using proper universal links and iframe detection
  const tryMobileWalletDeepLink = useCallback(() => {
    const currentUrl = window.location.href;
    
    // Create hidden iframe for deep link detection (recommended by Phantom docs)
    const testAppInstalled = (deepLinkUrl: string) => {
      return new Promise<boolean>((resolve) => {
        let resolved = false;
        
        // Create hidden iframe to test deep link
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = deepLinkUrl;
        document.body.appendChild(iframe);
        
        // Use visibilitychange for better detection accuracy
        const handleVisibilityChange = () => {
          if (document.hidden && !resolved) {
            resolved = true;
            resolve(true);
          }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Fallback timeout (3s as recommended for better mobile compatibility)
        setTimeout(() => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          if (iframe.parentNode) {
            document.body.removeChild(iframe);
          }
          if (!resolved) {
            resolved = true;
            resolve(false);
          }
        }, 3000);
      });
    };
    
    // Try Phantom first with proper universal link
    const phantomDeepLink = buildBrowseLink('phantom', currentUrl);
    
    testAppInstalled(phantomDeepLink).then(phantomInstalled => {
      if (phantomInstalled) {
        console.log('Phantom app detected and opened');
        return;
      }
      
      // Try Solflare if Phantom not installed
      const solflareDeepLink = buildBrowseLink('solflare', currentUrl);
      
      testAppInstalled(solflareDeepLink).then(solflareInstalled => {
        if (solflareInstalled) {
          console.log('Solflare app detected and opened');
          return;
        }
        
        // Neither installed, redirect to Phantom download as fallback
        window.open('https://phantom.app/download', '_blank');
      });
    });
  }, [buildBrowseLink]);

  // Auto-authenticate when wallet connects
  React.useEffect(() => {
    console.log('ConnectWalletButton: Auto-auth effect triggered', {
      connected,
      publicKey: publicKey?.toBase58(),
      authIsAuthenticated: auth.isAuthenticated,
      isLoading,
      shouldTriggerAuth: connected && publicKey && !auth.isAuthenticated && !isLoading
    });
    
    if (connected && publicKey && !auth.isAuthenticated && !isLoading) {
      console.log('ConnectWalletButton: Triggering auto-authentication');
      handleAuthenticate();
    }
  }, [connected, publicKey, auth.isAuthenticated, isLoading, handleAuthenticate]);

  const sizeClasses = {
    sm: 'text-xs py-1 px-2',
    md: 'text-sm py-2 px-4',
    lg: 'text-base py-3 px-6'
  };

  const shortenedAddress = publicKey 
    ? `${publicKey.toBase58().slice(0, 6)}...${publicKey.toBase58().slice(-4)}`
    : '';

  // If wallet not connected, show our custom wallet selection
  if (!connected || !publicKey) {
    return (
      <div className={`relative ${className}`}>
        <Button
          variant="gradient"
          className={`w-full font-bold flex items-center justify-center ${sizeClasses[size]}`}
          onClick={() => {
            // Use proper wallet detection that includes Loadable state
            const detectedWallets = wallets.filter(wallet => 
              wallet.readyState !== WalletReadyState.Unsupported &&
              wallet.readyState !== WalletReadyState.NotDetected
            );
            
            // If no wallets detected, try deep linking to mobile wallet apps
            if (detectedWallets.length === 0) {
              const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
              if (isMobile) {
                tryMobileWalletDeepLink();
                return;
              }
            }
            
            if (detectedWallets.length === 1) {
              handleWalletSelect(detectedWallets[0].adapter.name);
            } else {
              setShowWalletOptions(!showWalletOptions);
            }
          }}
          disabled={isLoading || connecting}
        >
          {(isLoading || connecting) ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            </>
          ) : (
            <>
              {(() => {
                const detectedWallets = wallets.filter(wallet => 
                  wallet.readyState !== WalletReadyState.Unsupported &&
                  wallet.readyState !== WalletReadyState.NotDetected
                );
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                
                if (detectedWallets.length === 0 && isMobile) {
                  return "Open Wallet App";
                }
                return "Connect Wallet";
              })()}
              {wallets.filter(wallet => 
                wallet.readyState !== WalletReadyState.Unsupported &&
                wallet.readyState !== WalletReadyState.NotDetected
              ).length > 1 && (
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </>
          )}
        </Button>

        {/* Wallet Options Dropdown */}
        {showWalletOptions && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-dark-400/90 backdrop-blur-sm border border-brand-500/30 rounded-md shadow-xl z-50 max-h-60 overflow-y-auto">
            {wallets.filter(wallet => 
              wallet.readyState !== WalletReadyState.Unsupported &&
              wallet.readyState !== WalletReadyState.NotDetected
            ).map((wallet) => (
              <button
                key={wallet.adapter.name}
                onClick={() => handleWalletSelect(wallet.adapter.name)}
                className="w-full px-3 py-2 text-left hover:bg-dark-300/50 transition-colors duration-200 flex items-center gap-3 text-white font-medium"
              >
                <img 
                  src={wallet.adapter.icon} 
                  alt={wallet.adapter.name}
                  className="w-6 h-6"
                />
                {wallet.adapter.name}
                {wallet.readyState === WalletReadyState.Loadable && (
                  <span className="text-xs ml-auto text-blue-400">Loadable</span>
                )}
              </button>
            ))}
            {wallets.filter(wallet => wallet.readyState === WalletReadyState.NotDetected).length > 0 && (
              <>
                <div className="px-3 py-1 text-xs text-gray-400 border-t border-dark-300/50 mt-1">
                  Not Installed
                </div>
                {wallets.filter(wallet => wallet.readyState === WalletReadyState.NotDetected).map((wallet) => (
                  <button
                    key={wallet.adapter.name}
                    onClick={() => window.open(wallet.adapter.url, '_blank')}
                    className="w-full px-3 py-2 text-left hover:bg-dark-300/50 transition-colors duration-200 flex items-center gap-3 text-gray-400 font-medium"
                  >
                    <img 
                      src={wallet.adapter.icon} 
                      alt={wallet.adapter.name}
                      className="w-6 h-6 opacity-50"
                    />
                    {wallet.adapter.name}
                    <span className="text-xs ml-auto">Install</span>
                  </button>
                ))}
              </>
            )}
          </div>
        )}

        {error && (
          <div className="mt-2 text-xs text-red-500">
            {error}
          </div>
        )}
      </div>
    );
  }

  // Wallet is connected, show auth/logout button
  let buttonText: string;
  let buttonOnClick: () => void;
  
  if (auth.isAuthenticated && auth.user?.wallet_address === publicKey.toBase58()) {
    buttonText = `Disconnect ${shortenedAddress}`;
    buttonOnClick = handleLogout;
  } else {
    buttonText = `Sign In as ${shortenedAddress}`;
    buttonOnClick = handleAuthenticate;
  }

  const isDisabled = isLoading || connecting;

  if (isLoading) {
    buttonText = 'Processing...';
  } else if (connecting) {
    buttonText = 'Connecting...';
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <Button
        variant="gradient"
        className={`w-full font-bold flex items-center justify-center ${sizeClasses[size]}`}
        onClick={buttonOnClick}
        disabled={isDisabled}
      >
        {(isLoading || connecting) ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {buttonText}
          </>
        ) : (
          buttonText
        )}
      </Button>
      {error && (
        <div className="mt-2 text-xs text-red-500">
          {error}
        </div>
      )}
    </div>
  );
};

export default ConnectWalletButton;
