// src/components/auth/ConnectWalletButton.tsx

/**
 * Connect Wallet Button Component
 * 
 * @description A button component that handles wallet connection through the unified auth system.
 * Integrates with Solana Kit and unified authentication to provide wallet login functionality.
 * 
 * @author Claude
 * @version 1.0.1
 * @created 2025-05-09
 * @updated 2025-05-11 - Corrected useSignMessage call and restored button UI
 */

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
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
  
  const auth = useMigratedAuth();
  const { 
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

  // This component now just handles authentication, not connection
  // Connection is handled by WalletMultiButton

  const handleAuthenticate = useCallback(async () => {
    if (!connected || !publicKey || !signMessage) {
      setError("Wallet not connected.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const walletAddress = publicKey.toBase58();

      if (auth.user?.wallet_address && auth.user.wallet_address === walletAddress) {
         console.log("ConnectWalletButton: Already authenticated with this DegenDuel account for this wallet.");
         onSuccess?.();
         setIsLoading(false);
         return;
      }

      await getChallengeNonce(walletAddress);

      const signMessageWrapper = async (messageToSign: Uint8Array) => {
        if (!signMessage) {
          throw new Error('Wallet signing function not available.');
        }
        const signature = await signMessage(messageToSign);
        return { signature }; 
      };

      await auth.loginWithWallet(walletAddress, signMessageWrapper);
      onSuccess?.();
    } catch (err) {
      console.error('ConnectWalletButton: Error during authentication:', err);
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

  const sizeClasses = {
    sm: 'text-xs py-1 px-2',
    md: 'text-sm py-2 px-4',
    lg: 'text-base py-3 px-6'
  };

  const shortenedAddress = publicKey 
    ? `${publicKey.toBase58().slice(0, 6)}...${publicKey.toBase58().slice(-4)}`
    : '';

  // If wallet not connected, show WalletMultiButton with consistent styling
  if (!connected || !publicKey) {
    return (
      <div className={`flex flex-col ${className}`}>
        <div className="w-full h-12 flex items-center justify-center">
          <WalletMultiButton 
            style={{
              width: '100%',
              height: '100%',
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.875rem',
              padding: '0.5rem 1rem',
              borderRadius: '0',
              boxShadow: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontFamily: 'inherit'
            }}
          />
        </div>
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
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
            {buttonText}
          </>
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
