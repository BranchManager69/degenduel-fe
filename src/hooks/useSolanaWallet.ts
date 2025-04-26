import { useState, useEffect } from 'react';

export type SolanaWalletAdapter = {
  publicKey: string | null;
  connected: boolean;
  connecting: boolean;
  disconnect: () => Promise<void>;
  connect: () => Promise<void>;
  signAndSendTransaction: (serializedTransaction: string) => Promise<{signature: string}>;
};

/**
 * Detect and interact with Solana wallets in the browser
 * This hook specifically targets modern Solana wallet adapters for blinks functionality
 */
export function useSolanaWallet() {
  const [walletAdapter, setWalletAdapter] = useState<SolanaWalletAdapter | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize wallet and check if it's installed
  useEffect(() => {
    const detectWallet = async () => {
      try {
        // Check if window.solana is available (Phantom, Backpack, etc.)
        if (window.solana) {
          console.log('[Solana Wallet] Detected window.solana wallet');
          
          // Basic adapter for window.solana style wallets
          const adapter: SolanaWalletAdapter = {
            publicKey: window.solana.publicKey?.toString() || null,
            connected: window.solana.isConnected,
            connecting: false,
            disconnect: async () => {
              if (window.solana) {
                await window.solana.disconnect();
              }
              setPublicKey(null);
              setConnected(false);
            },
            connect: async () => {
              try {
                if (!window.solana) {
                  throw new Error('No Solana wallet found');
                }
                setConnecting(true);
                await window.solana.connect();
                setPublicKey(window.solana.publicKey?.toString() || null);
                setConnected(window.solana.isConnected);
              } catch (e) {
                console.error('[Solana Wallet] Connection error:', e);
                setError(e as Error);
                throw e;
              } finally {
                setConnecting(false);
              }
            },
            signAndSendTransaction: async (serializedTransaction: string) => {
              try {
                // In reality, you'd deserialize the transaction first
                // For now, we're just simulating the functionality
                if (!window.solana) {
                  throw new Error('No Solana wallet found');
                }
                const result = await window.solana.signAndSendTransaction({
                  transaction: serializedTransaction
                });
                return { signature: result.signature || 'mock_signature' };
              } catch (e) {
                console.error('[Solana Wallet] Transaction error:', e);
                throw e;
              }
            }
          };
          
          setWalletAdapter(adapter);
          setPublicKey(adapter.publicKey);
          setConnected(adapter.connected);
        } 
        // You can add other wallet detections here (Solflare, etc.)
        else {
          console.log('[Solana Wallet] No supported wallet detected');
          setWalletAdapter(null);
        }
      } catch (e) {
        console.error('[Solana Wallet] Detection error:', e);
        setError(e as Error);
      }
    };

    detectWallet();
    
    // Handle wallet changes
    const handleWalletChange = () => {
      detectWallet();
    };
    
    // Listen for wallet changes
    window.addEventListener('solana#initialized', handleWalletChange);
    window.addEventListener('solana#disconnected', handleWalletChange);
    
    return () => {
      window.removeEventListener('solana#initialized', handleWalletChange);
      window.removeEventListener('solana#disconnected', handleWalletChange);
    };
  }, []);

  // Connect to wallet
  const connect = async () => {
    if (!walletAdapter) {
      const noWalletError = new Error('No Solana wallet found. Please install a wallet extension.');
      setError(noWalletError);
      throw noWalletError;
    }
    
    try {
      await walletAdapter.connect();
    } catch (e) {
      setError(e as Error);
      throw e;
    }
  };

  // Disconnect from wallet
  const disconnect = async () => {
    if (walletAdapter && connected) {
      try {
        await walletAdapter.disconnect();
      } catch (e) {
        setError(e as Error);
        throw e;
      }
    }
  };

  // Sign and send transaction
  const signAndSendTransaction = async (serializedTransaction: string) => {
    if (!walletAdapter || !connected) {
      const notConnectedError = new Error('Wallet not connected');
      setError(notConnectedError);
      throw notConnectedError;
    }
    
    try {
      return await walletAdapter.signAndSendTransaction(serializedTransaction);
    } catch (e) {
      setError(e as Error);
      throw e;
    }
  };

  return {
    publicKey,
    connected,
    connecting,
    error,
    connect,
    disconnect,
    signAndSendTransaction,
    walletAdapter
  };
}

// Add typings for the window object
declare global {
  interface Window {
    solana?: {
      isConnected: boolean;
      publicKey?: { toString: () => string };
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      disconnect: () => Promise<void>;
      signAndSendTransaction: (options: {transaction: any}) => Promise<{ signature: string }>;
    };
  }
}