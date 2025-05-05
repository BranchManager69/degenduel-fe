// src/hooks/useSolanaWallet.ts

/**
 * Use Solana Wallet Hook
 * 
 * Hook to detect and interact with Solana wallets in the browser
 * 
 * @author BranchManager69
 * @version 1.9.0
 * @created 2025-02-14
 * @updated 2025-05-03
 */

import { useEffect, useState } from 'react';

/**
 * Solana wallet adapter type
 * 
 * @typedef {Object} SolanaWalletAdapter
 * @property {string | null} publicKey - The public key of the wallet
 * @property {boolean} connected - Whether the wallet is connected
 * @property {boolean} connecting - Whether the wallet is connecting
 * @property {function} disconnect - Disconnect from the wallet
 * @property {function} connect - Connect to the wallet
 * @property {function} signAndSendTransaction - Sign and send a transaction
 */
export type SolanaWalletAdapter = {
  publicKey: string | null;
  connected: boolean;
  connecting: boolean;
  disconnect: () => Promise<void>;
  connect: () => Promise<void>;
  signAndSendTransaction: (
    serializedTransaction: string,
    options?: { message?: string }
  ) => Promise<{signature: string}>;
};

/**
 * Detect and interact with Solana wallets in the browser
 * This hook specifically targets modern Solana wallet adapters for blinks functionality
 * 
 * @returns {SolanaWalletAdapter} The wallet adapter
 */
export function useSolanaWallet() {
  const [walletAdapter, setWalletAdapter] = useState<SolanaWalletAdapter | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize wallet and check if it's installed
  useEffect(() => {
    
    // Detect wallet
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
            signAndSendTransaction: async (
              serializedTransaction: string,
              options?: { message?: string }
            ) => {
              try {
                if (!window.solana) {
                  throw new Error('No Solana wallet found');
                }
                
                // Pass the transaction and message to the wallet's signAndSendTransaction method
                const result = await window.solana.signAndSendTransaction({
                  transaction: serializedTransaction,
                  message: options?.message
                });
                
                return { signature: result.signature };
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

  // Sign and send transaction with optional options
  const signAndSendTransaction = async (
    serializedTransaction: string,
    options?: { message?: string }
  ) => {
    if (!walletAdapter || !connected) {
      const notConnectedError = new Error('Wallet not connected');
      setError(notConnectedError);
      throw notConnectedError;
    }
    
    try {
      // Pass both transaction and options to the wallet adapter
      return await walletAdapter.signAndSendTransaction(serializedTransaction, options);
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

// Add typings for the window object (used by the wallet adapter)
declare global {
  interface Window {
    solana?: {
      isConnected: boolean;
      publicKey?: { toString: () => string };
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      disconnect: () => Promise<void>;
      signAndSendTransaction: (options: {transaction: any, message?: string}) => Promise<{ signature: string }>;
    };
  }
}