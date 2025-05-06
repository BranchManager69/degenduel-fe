// src/hooks/wallet/useSolanaKitWallet.ts (Conceptual Shell)

import { type Address } from '@solana/addresses';
import { useWalletAccountTransactionSendingSigner } from '@solana/react';
import { signAndSendTransactionMessageWithSigners } from '@solana/signers';
import { compileTransaction, type TransactionMessage } from '@solana/transactions';
import {
    useConnect,
    useDisconnect,
    useWallets,
    type UiWallet, // Exported from @wallet-standard/react-core
    type UiWalletAccount // Exported from @wallet-standard/react-core
} from '@wallet-standard/react-core';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDegenDuelRpc } from '../../App'; // Assuming RpcContext is exported from App.tsx

// Interface for what the hook will expose
export interface UseSolanaKitWalletHook {
  availableWallets: readonly UiWallet[];
  selectedWallet: UiWallet | null;
  selectedAccount: UiWalletAccount | undefined;
  publicKey: Address | null;
  isConnected: boolean;
  isConnecting: boolean;
  isDisconnecting: boolean;
  connect: (wallet: UiWallet) => Promise<void>;
  disconnect: () => Promise<void>; // Disconnects the currently selected wallet
  signAndSendTransaction: (getTransactionMessage: () => TransactionMessage) => Promise<string>;
  // TODO: Add signMessage if needed, using useWalletAccountMessageSigner
}

export function useSolanaKitWallet(): UseSolanaKitWalletHook {
  const rpcContext = useDegenDuelRpc(); // Use the custom hook for better null handling
  const { rpcClient, endpoint } = rpcContext; // rpcClient can be null if not ready

  const allAvailableWallets = useWallets();
  
  // Manage the truly *selected and connected* wallet and its primary account
  const [currentWallet, setCurrentWallet] = useState<UiWallet | null>(null);
  const [currentAccount, setCurrentAccount] = useState<UiWalletAccount | undefined>(undefined);

  // These hooks return a tuple: [actionInProgress: boolean, actionFunction: (wallet: UiWallet) => Promise<void>]
  // The actionFunction is then called with the specific wallet.
  const [isConnectingActual, connectWalletFnProvided] = useConnect();
  const [isDisconnectingActual, disconnectWalletFnProvided] = useDisconnect();

  // Update currentAccount when currentWallet's accounts change (after connect/disconnect)
  useEffect(() => {
    if (currentWallet && currentWallet.accounts.length > 0) {
      // Defaulting to the first account. UI could allow selecting if multiple.
      if (currentAccount?.address !== currentWallet.accounts[0].address) {
        setCurrentAccount(currentWallet.accounts[0]);
      }
    } else if (currentWallet && currentWallet.accounts.length === 0 && currentAccount) {
      // Wallet still selected, but accounts array is empty (e.g., after some disconnects/event race)
      setCurrentAccount(undefined); 
    } else if (!currentWallet && currentAccount) {
      // No wallet selected, clear account
      setCurrentAccount(undefined);
    }
  }, [currentWallet, currentWallet?.accounts, currentAccount]); // Rerun if wallet or its accounts array changes

  // Get a transaction sending signer for the selected account
  // Chain should be dynamic based on your app's needs/config (e.g. rpcContext.endpoint type)
  const chainForSigner = useMemo(() => {
    if (endpoint.includes('devnet')) return 'solana:devnet';
    if (endpoint.includes('testnet')) return 'solana:testnet';
    return 'solana:mainnet'; // Default or infer from endpoint more robustly
  }, [endpoint]);

  const transactionSendingSigner = currentAccount ? useWalletAccountTransactionSendingSigner(currentAccount, chainForSigner) : undefined;

  const publicKey = useMemo(() => currentAccount?.address as Address | null ?? null, [currentAccount]);
  const isConnected = useMemo(() => !!currentAccount && !!currentWallet, [currentAccount, currentWallet]);

  const connect = useCallback(async (walletToConnect: UiWallet) => {
    if (isConnectingActual || (isConnected && currentWallet?.name === walletToConnect.name)) return;
    try {
      console.log(`[useSolanaKitWallet] Connecting to ${walletToConnect.name}...`);
      await connectWalletFnProvided(walletToConnect); // Call the function from the hook
      const updatedWallet = allAvailableWallets.find(w => w.name === walletToConnect.name);
      if (updatedWallet && updatedWallet.accounts.length > 0) {
        setCurrentWallet(updatedWallet);
        console.log(`[useSolanaKitWallet] Connected to ${updatedWallet.name}, account: ${updatedWallet.accounts[0].address}`);
      } else if (updatedWallet) {
        setCurrentWallet(updatedWallet); 
        console.warn(`[useSolanaKitWallet] Connected to ${updatedWallet.name}, but no accounts immediately available.`);
      } else {
        // This can happen if allAvailableWallets hasn't updated yet after connect returns.
        // The useEffect listening to currentWallet.accounts should eventually pick it up if the wallet object itself updates.
        // Or, Wallet Standard connect might directly return accounts - this needs to be verified by research.
        // For now, we assume the wallet object in allAvailableWallets gets its .accounts property updated.
        console.warn("[useSolanaKitWallet] Wallet not found in allAvailableWallets immediately after connect, or no accounts.");
        // Attempt to set currentWallet anyway, hoping accounts array populates.
        setCurrentWallet(walletToConnect);
      }
    } catch (error) {
      console.error("[useSolanaKitWallet] Failed to connect wallet:", error);
      setCurrentWallet(null); 
    }
  }, [connectWalletFnProvided, isConnectingActual, isConnected, currentWallet, allAvailableWallets]);

  const disconnect = useCallback(async () => {
    if (isDisconnectingActual || !currentWallet) return;
    try {
      console.log(`[useSolanaKitWallet] Disconnecting from ${currentWallet.name}...`);
      await disconnectWalletFnProvided(currentWallet); // Call the function from the hook
      setCurrentWallet(null); 
      console.log("[useSolanaKitWallet] Disconnected.");
    } catch (error) {
      console.error("[useSolanaKitWallet] Failed to disconnect wallet:", error);
    }
  }, [disconnectWalletFnProvided, isDisconnectingActual, currentWallet]);

  const signAndSendTransaction = useCallback(
    async (getTransactionMessage: () => TransactionMessage): Promise<string> => {
      if (!transactionSendingSigner) throw new Error('Wallet not connected or signer not available.');
      if (!rpcClient) throw new Error('RPC client not available.');

      console.log("[useSolanaKitWallet] Preparing to sign and send transaction...");
      const txMessage = getTransactionMessage();
      const compiledTx = compileTransaction(txMessage);
      console.log("[useSolanaKitWallet] Transaction compiled, signing and sending...");

      const { signature } = await signAndSendTransactionMessageWithSigners(
        rpcClient, 
        compiledTx,
        [transactionSendingSigner] // No longer casting, TS should infer compatibility
      );
      console.log("[useSolanaKitWallet] Transaction sent, signature (Uint8Array):");
      // TODO: Convert Uint8Array signature to base58 string for typical use.
      // For now, returning a placeholder or a simple representation.
      return `SIGNATURE_PLACEHOLDER_FOR_BYTE_ARRAY_${signature.byteLength}`;
    },
    [transactionSendingSigner, rpcClient]
  );

  return {
    availableWallets: allAvailableWallets,
    selectedWallet: currentWallet,
    selectedAccount: currentAccount,
    publicKey,
    isConnected,
    isConnecting: isConnectingActual,
    isDisconnecting: isDisconnectingActual,
    connect,
    disconnect,
    signAndSendTransaction,
  };
} 