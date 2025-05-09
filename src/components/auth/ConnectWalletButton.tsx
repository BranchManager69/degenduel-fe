// src/components/auth/ConnectWalletButton.tsx

/**
 * Connect Wallet Button Component
 * 
 * @description A button component that handles wallet connection through the unified auth system.
 * Integrates with Solana Kit and unified authentication to provide wallet login functionality.
 * 
 * @author Claude
 * @version 1.0.0
 * @created 2025-05-09
 */

import { useSignMessage } from '@solana/react';
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
    currentAccount
  } = useSolanaKitWallet();

  // Get the signMessage function from the @solana/react hook.
  // This hook needs the currentAccount. It might return a non-functional version if currentAccount is null/undefined.
  const walletSignMessageFn = useSignMessage(currentAccount!);
  // We use currentAccount! assuming that when handleConnectWallet is called, currentAccount will be defined.
  // A more robust solution might involve ensuring walletSignMessageFn is only called when currentAccount is defined,
  // or the hook useSignMessage gracefully handles a null/undefined account.

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
    try {
      setIsLoading(true);
      setError(null);
      
      // Show wallet selector if not connected yet
      if (!isWalletConnected && availableWallets.length > 0) {
        const wallet = availableWallets[0];
        await connectWallet(wallet);
      }
      
      // If the wallet is connected and we have a public key, proceed with authentication
      // currentAccount should be updated by connectWallet by this point.
      if (publicKey && currentAccount) { // Added currentAccount check here for safety
        const walletAddress = publicKey.toString();
        
        await getChallengeNonce(walletAddress);
        
        const signMessage = async (messageToSign: Uint8Array) => {
          if (!currentAccount) { // Defensive check
            throw new Error('No wallet account available for signing');
          }
          // walletSignMessageFn is created using currentAccount from the component's scope.
          // Ensure it's valid before use.
          if (typeof walletSignMessageFn !== 'function') {
            throw new Error('Wallet signMessage function not available from useSignMessage hook.');
          }
          
          try {
            // Use the signMessage function from the useSignMessage hook
            // It expects an object: { message: Uint8Array }
            // It returns a Promise of an object: { signature: Uint8Array, signedMessage?: Uint8Array }
            const { signature: resultSignature } = await walletSignMessageFn({ message: messageToSign });
            
            console.log('Message signed by wallet. Signature:', resultSignature);
            return { signature: resultSignature };

          } catch (error) {
            console.error('Error signing message with wallet:', error);
            throw new Error('Failed to sign message with wallet');
          }
        };
        
        await auth.loginWithWallet(walletAddress, signMessage);
        
        onSuccess?.();
      } else {
        throw new Error('Wallet connected but no public key or current account available');
      }
    } catch (err) {
      console.error('Wallet connection error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown wallet connection error';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [auth, availableWallets, connectWallet, currentAccount, isWalletConnected, onError, onSuccess, publicKey, walletSignMessageFn]);

  // Handle disconnecting the wallet
  const handleDisconnectWallet = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Disconnect from wallet
      await disconnectWallet();
      
      // Also log out from the auth system
      await auth.logout();
      
    } catch (err) {
      console.error('Wallet disconnection error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown wallet disconnection error';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [auth, disconnectWallet]);

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
        onClick={isWalletConnected ? handleDisconnectWallet : handleConnectWallet}
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
        ) : isWalletConnected ? (
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