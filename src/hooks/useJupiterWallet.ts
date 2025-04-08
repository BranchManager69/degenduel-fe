/**
 * Jupiter Wallet Hook
 * This hook provides a wrapper around Jupiter's wallet adapter, making it compatible
 * with the existing wallet interface used in the application.
 */
import { useWallet as useJupiterWalletAdapter } from '@jup-ag/wallet-adapter';
import { useCallback } from 'react';

// Define the SignMessageOutput type based on actual return value
export type SignMessageOutput = Uint8Array;

export interface UseJupiterWalletReturn {
  // Connection State
  isConnected: boolean;
  isConnecting: boolean;
  walletAddress: string | null;
  
  // Action methods
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: Uint8Array) => Promise<SignMessageOutput>;
  
  // Wallet metadata
  walletName: string | null;
  availableWallets: any[];
}

/**
 * Hook for interacting with Jupiter's wallet adapter
 * This provides a compatibility layer over Jupiter's wallet adapter
 * to make it work with our existing application.
 */
export function useJupiterWallet(): UseJupiterWalletReturn {
  // Create a try/catch block to handle errors in the hook itself
  try {
    const {
      connecting,
      connected,
      publicKey,
      disconnect: jupiterDisconnect,
      connect: jupiterConnect,
      wallet,
      wallets,
      signMessage: jupiterSignMessage
    } = useJupiterWalletAdapter();

  // Convert publicKey to string format expected by our app
  const walletAddress = publicKey?.toString() || null;
  
  // Wrap the connect method to handle our app-specific flow
  const connect = useCallback(async () => {
    try {
      // We'll let the UnifiedWalletButton handle wallet selection
      // This method should now only be called after a wallet is selected
      
      if (!wallet) {
        console.log("No wallet selected, connection should be initiated via UnifiedWalletButton");
        throw new Error("No wallet selected");
      }
      
      await jupiterConnect();
      console.log("Jupiter wallet connected successfully");
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw error;
    }
  }, [wallet, jupiterConnect]);
  
  // Wrap the disconnect method
  const disconnect = useCallback(async () => {
    try {
      await jupiterDisconnect();
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
      throw error;
    }
  }, [jupiterDisconnect]);
  
  // Wrap the signMessage method
  const signMessage = useCallback(async (message: Uint8Array): Promise<SignMessageOutput> => {
    if (!connected || !publicKey) {
      throw new Error("Wallet not connected");
    }
    
    if (!jupiterSignMessage) {
      throw new Error("Wallet does not support message signing");
    }
    
    try {
      return await jupiterSignMessage(message);
    } catch (error) {
      console.error("Failed to sign message:", error);
      throw error;
    }
  }, [connected, publicKey, jupiterSignMessage]);
  
  return {
    isConnected: connected,
    isConnecting: connecting,
    walletAddress,
    connect,
    disconnect,
    signMessage,
    walletName: wallet?.adapter.name || null,
    availableWallets: wallets || [],
  };
  } catch (error) {
    // Fallback values when the wallet adapter is not available/properly initialized
    console.warn("Jupiter wallet adapter not available, using fallback values", error);
    
    // Define no-op functions
    const noOpConnect = async () => {
      console.warn("Wallet adapter not available");
      throw new Error("Wallet adapter not available");
    };
    
    const noOpDisconnect = async () => {
      console.warn("Wallet adapter not available");
    };
    
    const noOpSignMessage = async () => {
      console.warn("Wallet adapter not available");
      throw new Error("Wallet adapter not available");
    };
    
    // Return fallback values
    return {
      isConnected: false,
      isConnecting: false,
      walletAddress: null,
      connect: noOpConnect,
      disconnect: noOpDisconnect,
      signMessage: noOpSignMessage,
      walletName: null,
      availableWallets: [],
    };
  }
}