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
    // Safely access wallet adapter values with defensive coding
    // If the provider isn't available yet, these will be undefined
    let connecting = false;
    let connected = false;
    let publicKey = null;
    let jupiterDisconnect = async () => {};
    let jupiterConnect = async () => {};
    let wallet = null;
    let wallets: any[] = [];
    let jupiterSignMessage = null;
    
    try {
      // IMPORTANT: Instead of directly accessing the adapter properties which can throw errors,
      // we'll use a more defensive approach where we first check if the adapter exists
      
      // Create a safe wrapper function to access adapter properties
      const safeGet = (obj: any, prop: string, fallback: any) => {
        if (!obj) return fallback;
        try {
          const value = obj[prop];
          return value !== undefined ? value : fallback;
        } catch (e) {
          return fallback;
        }
      };
      
      // Try to get the adapter object without accessing its properties
      // Do this in a way that doesn't throw when no provider exists
      let adapter = null;
      
      // Detect if the WalletProvider exists in the React context tree
      const hasWalletProvider = typeof window !== 'undefined' && 
                               (window as any)?.__JUP_WALLET_PROVIDER_EXISTS === true;
      
      if (hasWalletProvider) {
        try {
          adapter = useJupiterWalletAdapter();
          // Only set window flag to true if we successfully get an adapter
          (window as any).__JUP_WALLET_ADAPTER_INITIALIZED = true;
        } catch (e) {
          // Silent failure - don't log warning every time
          adapter = null;
        }
      }
      
      // Now safely access each property with fallbacks
      connecting = safeGet(adapter, 'connecting', false);
      connected = safeGet(adapter, 'connected', false);
      publicKey = safeGet(adapter, 'publicKey', null);
      jupiterDisconnect = safeGet(adapter, 'disconnect', async () => {});
      jupiterConnect = safeGet(adapter, 'connect', async () => {});
      wallet = safeGet(adapter, 'wallet', null);
      wallets = safeGet(adapter, 'wallets', []);
      jupiterSignMessage = safeGet(adapter, 'signMessage', null);
      
      // Don't log successful adapter access to avoid console spam
      // The message was previously causing excessive log entries
    } catch (adapterError) {
      // Don't crash here - gracefully fall back
      console.warn("[Jupiter Wallet] Error in adapter access, using fallbacks");
    }

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