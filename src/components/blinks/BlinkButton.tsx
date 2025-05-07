// src/components/blinks/BlinkButton.tsx

/**
 * BlinkButton component
 * 
 * @description This component is used to display the blink button
 * 
 * @author @BranchManager69
 * @version 1.9.0
 * @created 2025-04-30
 * @updated 2025-05-07
 */

import React, { useEffect, useState } from 'react';
import { useSolanaKitWallet } from '../../hooks/wallet/useSolanaKitWallet'; // Import the useSolanaKitWallet hook

// Define the BlinkMetadata interface
interface BlinkMetadata {
  title: string;
  description: string;
  icon?: string;
  label: string;
}

// Define the BlinkButtonProps interface
interface BlinkButtonProps {
  blinkUrl: string;
  params?: Record<string, string>;
  className?: string;
  label?: string;
  onSuccess?: (signature: string) => void;
  onError?: (error: Error) => void;
}

// Define the BlinkButton component
export const BlinkButton: React.FC<BlinkButtonProps> = ({
  blinkUrl,
  params = {},
  className = '',
  label,
  onSuccess,
  onError
}) => {
  const { 
    publicKey, 
    isConnected,
    isConnecting,
    connect, 
    signAndSendTransaction, 
  } = useSolanaKitWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [metadata, setMetadata] = useState<BlinkMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch metadata for this blink
  useEffect(() => {
    async function fetchMetadata() {
      try {
        // Convert params to URL query params
        const queryParams = new URLSearchParams(params).toString();
        const url = `${blinkUrl}${queryParams ? `?${queryParams}` : ''}`;
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch blink metadata: ${response.statusText}`);
        }
        
        const data = await response.json();
        setMetadata(data);
      } catch (err) {
        console.error('Error fetching blink metadata:', err);
        setError('Failed to load action details');
        onError?.(err as Error);
      }
    }
    
    fetchMetadata();
  }, [blinkUrl, params]);

  // Define the handleClick function
  const handleClick = async () => {
    // Check if this is a view-only action (for active or completed contests)
    const isViewOnlyAction = blinkUrl.includes('/view-contest') || blinkUrl.includes('/view-results');
    
    if (isViewOnlyAction) {
      // For view-only actions, we don't need a transaction
      setIsLoading(true);
      
      try {
        // Just call onSuccess with empty signature for navigation
        onSuccess?.('view-only');
      } catch (err) {
        console.error('Error executing view action:', err);
        setError((err as Error).message || 'Failed to execute action');
        onError?.(err as Error);
      } finally {
        setIsLoading(false);
      }
      return;
    }
    
    // For transaction-based actions (like joining a contest)
    if (!isConnected) {
      try {
        setIsLoading(true);
        console.warn("BlinkButton: Wallet not connected, connect() call skipped. User needs to connect via WalletMultiButton.");
        setError('Please connect your wallet first using the main connect button.');
      } catch (err) {
        setError('Failed to connect wallet');
        onError?.(err as Error);
        setIsLoading(false);
        return;
      }
    }
    
    if (!publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request the transaction from the blink API
      const response = await fetch(blinkUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          account: publicKey,
          params
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate transaction: ${response.statusText}`);
      }

      // Get the full response with all fields
      const data = await response.json();
      const { transaction, message } = data;

      // Log the portfolio details if present (useful for debugging)
      if (data.portfolio_summary) {
        console.log('Portfolio Summary:', data.portfolio_summary);
        console.log('Portfolio Source:', data.portfolio_source);
      }

      // Handle different transaction encoding formats
      // Newer backend returns base64, older code might return base58
      let processedTransaction = transaction;
      
      // Check if transaction is base64 encoded (standard for real @solana/web3.js transactions)
      const isBase64 = /^[A-Za-z0-9+/=]+$/.test(transaction) && 
                       (transaction.includes('+') || transaction.includes('/') || transaction.includes('='));
                       
      // Check if transaction is base58 encoded (older format)
      const isBase58 = /^[1-9A-HJ-NP-Za-km-z]+$/.test(transaction);
      
      if (isBase64) {
        // Base64 format - this is the new standard format from real transactions
        console.log('Using base64 encoded transaction');
      } else if (isBase58) {
        // Base58 format - convert if needed for your wallet adapter
        console.log('Using base58 encoded transaction');
      } else {
        console.warn('Unknown transaction format - attempting to use as-is');
      }

      // Actually sign and send the transaction using the Solana wallet
      // Pass the message for better wallet UX if available
      /* Commenting out due to type mismatch with useSolanaKitWallet.signAndSendTransaction
         This needs a new approach: either Blink API changes or useSolanaKitWallet gets a method 
         to sign/send pre-serialized transactions, or BlinkButton deserializes and rebuilds.
      const result = await signAndSendTransaction(
        processedTransaction, 
        message ? { message } : undefined
      );
      */
      // For now, let's throw an error indicating this is not implemented with the new hook
      throw new Error("BlinkButton: signAndSendTransaction with pre-serialized tx not yet adapted for useSolanaKitWallet.");
      
      // Return the real signature
      // onSuccess?.(result); // Changed from result.signature
    } catch (err) {
      console.error('Error executing blink:', err);
      setError((err as Error).message || 'Failed to execute action');
      onError?.(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  // Define the render logic for the button
  if (!metadata && !error) {
    return (
      <button 
        className={`px-4 py-2 bg-gray-700 text-gray-300 rounded-md ${className}`}
        disabled
      >
        Loading...
      </button>
    );
  }

  // Define the render logic for the error
  if (error) {
    return (
      <button 
        className={`px-4 py-2 bg-red-700 text-white rounded-md ${className}`}
        onClick={() => setError(null)}
      >
        {error}
      </button>
    );
  }

  // Define the render logic for the button
  return (
    // Start of button component
    <button
      className={`px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors ${isLoading || isConnecting ? 'opacity-75 cursor-not-allowed' : ''} ${className}`}
      onClick={handleClick}
      disabled={isLoading || isConnecting}
    >
      {/* Start of button label */}
      {isLoading || isConnecting ?
        (isConnecting ? 'Connecting...' : 'Processing...') :
        (!isConnected ? 'Connect Wallet' : (label || metadata?.label || 'Execute'))}
    </button>
  );
};