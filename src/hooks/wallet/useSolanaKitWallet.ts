// src/hooks/wallet/useSolanaKitWallet.ts (Conceptual Shell)

import { type Address } from '@solana/addresses';
import { useWalletAccountTransactionSendingSigner } from '@solana/react';
import {
  addSignersToTransactionMessage,
  signTransactionMessageWithSigners,
} from '@solana/signers';
import {
  //getBase64EncodedWireTransaction,
  type ITransactionMessageWithFeePayer,
  //type SignedTransactionMessage,
  type TransactionMessage,
  type TransactionMessageWithBlockhashLifetime,
  type TransactionMessageWithDurableNonceLifetime,
} from '@solana/transaction-messages';
import {
  getBase64EncodedWireTransaction,
  type FullySignedTransaction,
  type TransactionWithLifetime,
} from '@solana/transactions';
import {
  StandardConnect,
  StandardDisconnect,
  type StandardConnectFeature,
  type StandardDisconnectFeature,
} from '@wallet-standard/features';
import bs58 from 'bs58';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  useWallets,
  type UiWallet,
  type UiWalletAccount,
} from '@wallet-standard/react-core';

import console from 'console';
import { useDegenDuelRpc, type RpcContextType } from '../../App';

// The message builder must return a message that includes feePayer, instructions, and one type of lifetime constraint.
export type FullyPreparedTransactionMessage = TransactionMessage & 
  ITransactionMessageWithFeePayer<Address> & 
  (TransactionMessageWithBlockhashLifetime | TransactionMessageWithDurableNonceLifetime);

// Interface for what the hook will expose
export interface UseSolanaKitWalletHook {
  availableWallets: readonly UiWallet[];
  selectedWallet: UiWallet | null;
  currentAccount: UiWalletAccount | undefined;
  publicKey: Address | null;
  isConnected: boolean;
  isConnecting: boolean;
  isDisconnecting: boolean;
  connect: (wallet: UiWallet) => Promise<void>;
  disconnect: () => Promise<void>; // Changed: disconnects the current selected wallet
  signAndSendTransaction: (getTransactionMessage: () => FullyPreparedTransactionMessage) => Promise<string>; // Now returns base58 string signature
}

export function useSolanaKitWallet(): UseSolanaKitWalletHook {
  const rpcContext = useDegenDuelRpc(); 
  const { rpcClient, endpoint } = rpcContext as RpcContextType;

  const availableWallets = useWallets();

  const [selectedWalletInternal, setSelectedWalletInternal] = useState<UiWallet | null>(null);
  const [currentAccountInternal, setCurrentAccountInternal] = useState<UiWalletAccount | undefined>(undefined);
  
  // Local states to reflect the status from useConnect/useDisconnect hooks
  const [isConnectingLocal, setIsConnectingLocal] = useState(false);
  const [isDisconnectingLocal, setIsDisconnectingLocal] = useState(false);

  useEffect(() => {
    if (selectedWalletInternal && selectedWalletInternal.accounts.length > 0) {
      if (currentAccountInternal?.address !== selectedWalletInternal.accounts[0].address) {
        setCurrentAccountInternal(selectedWalletInternal.accounts[0]);
        console.log('[useSolanaKitWallet] Account set:', selectedWalletInternal.accounts[0].address);
      }
    } else if (selectedWalletInternal && selectedWalletInternal.accounts.length === 0 && currentAccountInternal) {
      setCurrentAccountInternal(undefined); 
       console.log('[useSolanaKitWallet] Wallet selected, but no accounts. Account cleared.');
    } else if (!selectedWalletInternal && currentAccountInternal) {
      setCurrentAccountInternal(undefined);
      console.log('[useSolanaKitWallet] No wallet selected. Account cleared.');
    }
  }, [selectedWalletInternal, selectedWalletInternal?.accounts, currentAccountInternal]);

  const chainForSigner = useMemo(() => {
    if (endpoint.includes('devnet')) return 'solana:devnet';
    if (endpoint.includes('testnet')) return 'solana:testnet';
    return 'solana:mainnet';
  }, [endpoint]);

  const transactionSigner = currentAccountInternal ? useWalletAccountTransactionSendingSigner(currentAccountInternal, chainForSigner) : undefined;

  const publicKey = useMemo(() => currentAccountInternal?.address as Address | null ?? null, [currentAccountInternal]);
  const isConnected = useMemo(() => !!currentAccountInternal && !!selectedWalletInternal, [currentAccountInternal, selectedWalletInternal]);

  // Connect
  const connect = useCallback(async (walletToConnect: UiWallet) => {
    if (isConnectingLocal || (isConnected && selectedWalletInternal?.name === walletToConnect.name)) return;
    // Update local state to reflect that connection is in progress
    setIsConnectingLocal(true);
    // --- Attempt to connect to the wallet
    try {
      const connectFeature = walletToConnect.features[StandardConnect] as StandardConnectFeature[typeof StandardConnect] | undefined;
      if (!connectFeature?.connect) {
        throw new Error('Wallet does not support standard:connect feature or feature is malformed.');
      }
      await connectFeature.connect();
      setSelectedWalletInternal(walletToConnect); 
    } catch (error) {
      console.error(`[useSolanaKitWallet] Failed to connect to ${walletToConnect.name}:`, error);
      setSelectedWalletInternal(null); 
    } finally {
      setIsConnectingLocal(false);
    }
    // --- Connection attempt at the wallet is complete
  }, [isConnectingLocal, isConnected, selectedWalletInternal, availableWallets]);

  // Disconnect
  const disconnect = useCallback(async () => { 
    if (isDisconnectingLocal || !selectedWalletInternal) return;
    // Update local state to reflect that disconnection is in progress
    setIsDisconnectingLocal(true);
    // --- Attempt to disconnect from the wallet
    try {
      const disconnectFeature = selectedWalletInternal.features[StandardDisconnect] as StandardDisconnectFeature[typeof StandardDisconnect] | undefined;
      if (!disconnectFeature?.disconnect) {
        console.warn('Wallet does not support standard:disconnect feature or feature is malformed, clearing local state.');
        setSelectedWalletInternal(null);
      } else {
        await disconnectFeature.disconnect();
        setSelectedWalletInternal(null);
      }
    } catch (error) {
      console.error("[useSolanaKitWallet] Failed to disconnect wallet:", error);
      setSelectedWalletInternal(null);
    } finally {
      setIsDisconnectingLocal(false);
    }
    // --- Disconnect attempt at the wallet is complete
  }, [isDisconnectingLocal, selectedWalletInternal]);

  // Sign and send transaction
  const signAndSendTransaction = useCallback(
    
    // Get the transaction message to sign and send
    async (getTransactionMessage: () => FullyPreparedTransactionMessage): Promise<string> => {
      // Check if the transaction signer is available
      if (!transactionSigner) throw new Error('Signer not available.');
      // Check if the RPC client is available
      if (!rpcClient) throw new Error('RPC client not available for send.');

      // Get the transaction message to sign and send
      console.log("[useSolanaKitWallet] Preparing to sign and send transaction...");
      let unsignedMsg = getTransactionMessage(); 
      console.log("[useSolanaKitWallet] TransactionMessage (fully prepared) received, signing and sending...");

      // Add the signer to the transaction message
      const msgWithSigner = addSignersToTransactionMessage([transactionSigner], unsignedMsg);
      // Sign the transaction message
      const signedTxObject: Readonly<FullySignedTransaction & TransactionWithLifetime> = 
        await signTransactionMessageWithSigners(msgWithSigner);
      // Get base64 encoded wire transaction
      const wireTx = getBase64EncodedWireTransaction(signedTxObject);
      // Broadcast through the RPC client
      const signature = await rpcClient.sendTransaction(wireTx, { encoding: 'base64' }).send();
      // Return the signature
      return typeof signature === 'string' ? signature : bs58.encode(signature);
    },
    [transactionSigner, rpcClient]
  );

  // Return the hook
  return {
    availableWallets,
    selectedWallet: selectedWalletInternal,
    currentAccount: currentAccountInternal,
    publicKey,
    isConnected,
    isConnecting: isConnectingLocal,
    isDisconnecting: isDisconnectingLocal,
    connect,
    disconnect,
    signAndSendTransaction, 
  };
} 