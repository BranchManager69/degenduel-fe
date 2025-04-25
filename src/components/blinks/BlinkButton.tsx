import React, { useState, useEffect } from 'react';
import { useSolanaWallet } from '../../hooks/useSolanaWallet';

interface BlinkMetadata {
  title: string;
  description: string;
  icon?: string;
  label: string;
}

interface BlinkButtonProps {
  blinkUrl: string;
  params?: Record<string, string>;
  className?: string;
  label?: string;
  onSuccess?: (signature: string) => void;
  onError?: (error: Error) => void;
}

export const BlinkButton: React.FC<BlinkButtonProps> = ({
  blinkUrl,
  params = {},
  className = '',
  label,
  onSuccess,
  onError
}) => {
  const { publicKey, connected, connecting, connect, signAndSendTransaction } = useSolanaWallet();
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
    if (!connected) {
      try {
        setIsLoading(true);
        await connect();
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

      const { transaction } = await response.json();

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
      const result = await signAndSendTransaction(processedTransaction);
      
      // Return the real signature
      onSuccess?.(result.signature);
    } catch (err) {
      console.error('Error executing blink:', err);
      setError((err as Error).message || 'Failed to execute action');
      onError?.(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <button
      className={`px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors ${isLoading || connecting ? 'opacity-75 cursor-not-allowed' : ''} ${className}`}
      onClick={handleClick}
      disabled={isLoading || connecting}
    >
      {isLoading || connecting ? 
        (connecting ? 'Connecting...' : 'Processing...') : 
        (!connected ? 'Connect Wallet' : (label || metadata?.label || 'Execute'))}
    </button>
  );
};