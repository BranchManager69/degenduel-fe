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

import { useWallet } from "@solana/wallet-adapter-react"; // Import adapter's useWallet directly for signMessage
import axios from 'axios';
import React, { useCallback, useState } from 'react';
import { useMigratedAuth } from '../../hooks/auth/useMigratedAuth';
import { useSolanaKitWallet } from '../../hooks/wallet/useSolanaKitWallet';
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
    isConnected: isWalletAdapterConnected,
    isConnecting: isWalletAdapterConnecting,
    publicKey,
    availableWallets,
    connect: connectWallet
  } = useSolanaKitWallet();

  const { signMessage: adapterSignMessage } = useWallet();

  const getChallengeNonce = async (walletAddress: string): Promise<string> => {
    try {
      const response = await axios.get(`/auth/challenge?wallet=${walletAddress}`);
      return response.data.nonce;
    } catch (error) {
      console.error('Error getting challenge nonce:', error);
      throw new Error('Failed to get challenge nonce');
    }
  };

  const handleConnectAndSignIn = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // If wallet is not connected, try to connect first
      if (!isWalletAdapterConnected || !publicKey) {
        // Try to connect to the first available wallet (usually Phantom)
        const preferredWallet = availableWallets.find(w => 
          w.adapter.name.toLowerCase().includes('phantom') ||
          w.adapter.name.toLowerCase().includes('solflare')
        ) || availableWallets[0];
        
        if (!preferredWallet) {
          setError("No compatible wallets found. Please install Phantom or Solflare.");
          setIsLoading(false);
          return;
        }
        
        await connectWallet(preferredWallet);
        
        // Wait a moment for the connection to be established
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if connection was successful
        if (!isWalletAdapterConnected || !publicKey) {
          setError("Failed to connect wallet. Please try again.");
          setIsLoading(false);
          return;
        }
      }
      
      const walletAddress = publicKey.toBase58();

      if (auth.user?.wallet_address && auth.user.wallet_address === walletAddress) {
         console.log("ConnectWalletButton: Already authenticated with this DegenDuel account for this wallet.");
         onSuccess?.();
         setIsLoading(false);
         return;
      }

      await getChallengeNonce(walletAddress);

      const signMessageWrapper = async (messageToSign: Uint8Array) => {
        if (!adapterSignMessage) {
          console.error('ConnectWalletButton: adapterSignMessage function is not available.');
          throw new Error('Cannot sign message: Wallet signing function unavailable.');
        }
        const signature = await adapterSignMessage(messageToSign);
        return { signature }; 
      };

      await auth.loginWithWallet(walletAddress, signMessageWrapper);
      onSuccess?.();
    } catch (err) {
      console.error('ConnectWalletButton: Error during wallet connection/sign-in:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during connection/sign-in.';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [
    auth, 
    publicKey, 
    isWalletAdapterConnected, 
    onSuccess, 
    onError,
    adapterSignMessage,
    availableWallets,
    connectWallet
  ]);

  const handleDegenDuelLogout = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await auth.logout();
      console.log("ConnectWalletButton: DegenDuel logout successful.");
    } catch (err) {
      console.error('ConnectWalletButton: Error during DegenDuel logout:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to logout.';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [auth, onError]);

  const sizeClasses = {
    sm: 'text-xs py-1 px-2',
    md: 'text-sm py-2 px-4',
    lg: 'text-base py-3 px-6'
  };

  const shortenedAddress = publicKey 
    ? `${publicKey.toBase58().slice(0, 6)}...${publicKey.toBase58().slice(-4)}`
    : '';

  let buttonText = "Connect Wallet";
  let buttonOnClick = handleConnectAndSignIn;
  let isDisabled = isLoading || isWalletAdapterConnecting;

  if (isWalletAdapterConnected && publicKey) {
    if (auth.isAuthenticated && auth.user?.wallet_address === publicKey.toBase58()) {
      buttonText = `Disconnect ${shortenedAddress}`;
      buttonOnClick = handleDegenDuelLogout;
    } else {
      buttonText = `Sign In as ${shortenedAddress}`;
      buttonOnClick = handleConnectAndSignIn;
    }
  }

  if (isLoading || isWalletAdapterConnecting) {
    buttonText = isWalletAdapterConnecting ? 'Connecting Wallet...' : 'Processing...';
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <Button
        variant="gradient"
        className={`w-full font-cyber flex items-center justify-center ${sizeClasses[size]}`}
        onClick={buttonOnClick}
        disabled={isDisabled}
      >
        {isLoading || isWalletAdapterConnecting ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {buttonText}
          </>
        ) : (
          <>
            {isWalletAdapterConnected && publicKey && <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>}
            {!isWalletAdapterConnected && !publicKey && <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg> }
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
