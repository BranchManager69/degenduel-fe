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

import { useSignMessage } from '@solana/react'; // Explicitly import UiWalletAccount if needed for type clarity
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
  
  // Use the migrated auth hook which provides unified auth functionality
  const auth = useMigratedAuth();
  
  // Use the Solana Kit wallet hook for wallet interaction
  const {
    availableWallets,
    isConnected: isWalletConnected,
    isConnecting: isWalletConnecting,
    connect: connectWallet,
    disconnect: disconnectWallet,
    publicKey,
    currentAccount // This is UiWalletAccount | undefined
  } = useSolanaKitWallet();

  // Call useSignMessage conditionally based on currentAccount's presence.
  // walletSignMessageFn will be undefined if currentAccount is undefined.
  const walletSignMessageFn = currentAccount ? useSignMessage(currentAccount) : undefined;

  // Get a challenge nonce from the server
  const getChallengeNonce = async (walletAddress: string): Promise<string> => {
    try {
      const response = await axios.get(`/auth/challenge?wallet=${walletAddress}`);
      return response.data.nonce;
    } catch (error) {
      console.error('Error getting challenge nonce:', error);
      throw new Error('Failed to get challenge nonce');
    }
  };

  // Handle connecting and authenticating with the wallet
  const handleConnectWallet = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // We will use publicKey and currentAccount directly from the useSolanaKitWallet hook.
      // Their values will be from the render in which this callback was created.

      if (!isWalletConnected || !currentAccount) { // Check currentAccount directly
        if (availableWallets.length > 0) {
          await connectWallet(availableWallets[0]);
          // After connectWallet, the hook state (publicKey, currentAccount) will update,
          // leading to a re-render. If login needs to proceed automatically after connection,
          // an effect reacting to publicKey/currentAccount changes might be more robust.
          // For this direct click flow, we'll proceed, and the *next* click might have the updated state
          // or the UI re-renders allowing a subsequent action with the connected wallet.
          // If connectWallet() itself updated publicKey/currentAccount used in *this* specific
          // callback instance (e.g., if it returned them), we could use that.
          // For now, if we just connected, we might want to return and let the user click again
          // once the UI reflects the connected state, or handle the login in an effect.
          // To keep this simple, we will check publicKey *after* this block.
        } else {
          throw new Error("No wallets available to connect.");
        }
      }
      
      // If already authenticated with the current publicKey from the hook, avoid re-login.
      if (auth.user?.wallet_address && auth.user.wallet_address === publicKey?.toString()) {
         console.log("ConnectWalletButton: Already authenticated with this wallet.");
         onSuccess?.();
         setIsLoading(false);
         return;
      }

      // Crucial: Check publicKey *after* the connection attempt.
      // This publicKey is from the hook's state in the *current render*.
      if (publicKey) {
        const walletAddress = publicKey.toString();
        await getChallengeNonce(walletAddress);

        const signMessageWrapper = async (messageToSign: Uint8Array) => {
          if (!walletSignMessageFn) { // This walletSignMessageFn is also from the current render
            console.error('ConnectWalletButton: signMessage function is not available. `currentAccount` might have been undefined or hook state not updated yet.');
            throw new Error('Cannot sign message: Wallet signing function unavailable.');
          }
          const { signature } = await walletSignMessageFn({ message: messageToSign });
          return { signature };
        };

        await auth.loginWithWallet(walletAddress, signMessageWrapper);
        onSuccess?.();
      } else {
        // This means publicKey is still not available from the hook, even after an attempt to connect.
        // This could happen if connectWallet was called but the re-render with new publicKey hasn't happened yet,
        // or if the connection failed silently within connectWallet and didn't update publicKey.
        console.warn("ConnectWalletButton: publicKey is not available after connection attempt. The user might need to click again or there was an issue updating wallet state.");
        throw new Error('Wallet public key not available. If you just connected, please try signing in again.');
      }
    } catch (err) {
      console.error('ConnectWalletButton: Error during wallet connection/login:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [
    auth, 
    availableWallets, 
    connectWallet, 
    publicKey, 
    currentAccount, 
    isWalletConnected, 
    onSuccess, 
    onError,
    walletSignMessageFn 
  ]);

  // Handle disconnecting the wallet
  const handleDisconnectWallet = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await disconnectWallet();
      await auth.logout();
    } catch (err) {
      console.error('ConnectWalletButton: Error during disconnect:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect.';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [auth, disconnectWallet, onError]);

  // Button size classes
  const sizeClasses = {
    sm: 'text-xs py-1 px-2',
    md: 'text-sm py-2 px-4',
    lg: 'text-base py-3 px-6'
  };

  // Get the wallet address to display (shortened version)
  const shortenedAddress = publicKey 
    ? `${publicKey.toString().slice(0, 6)}...${publicKey.toString().slice(-4)}`
    : '';

  return (
    <div className={`flex flex-col ${className}`}>
      <Button
        variant="gradient"
        className={`w-full font-cyber flex items-center justify-center ${sizeClasses[size]}`}
        onClick={isWalletConnected && publicKey ? handleDisconnectWallet : handleConnectWallet}
        disabled={isLoading || isWalletConnecting}
      >
        {isLoading || isWalletConnecting ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {isWalletConnecting ? 'Connecting...' : 'Processing...'}
          </>
        ) : isWalletConnected && publicKey ? (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
            {shortenedAddress}
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
            Connect Wallet
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
