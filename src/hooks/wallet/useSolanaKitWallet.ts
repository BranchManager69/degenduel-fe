// src/hooks/wallet/useSolanaKitWallet.ts (Conceptual Shell)

import { type Address } from '@solana/addresses';
import { useWalletAccountTransactionSendingSigner } from '@solana/react';
import {
  addSignersToTransactionMessage,
  signTransactionMessageWithSigners,
} from '@solana/signers';
import {
  compileTransactionMessage,
  type ITransactionMessageWithFeePayer,
  type TransactionMessage,
  type TransactionMessageWithBlockhashLifetime,
  type TransactionMessageWithDurableNonceLifetime
} from '@solana/transaction-messages';
import {
  StandardConnect,
  StandardConnectFeature,
  StandardDisconnect,
  StandardDisconnectFeature
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

  const connect = useCallback(async (walletToConnect: UiWallet) => {
    if (isConnectingLocal || (isConnected && selectedWalletInternal?.name === walletToConnect.name)) return;
    setIsConnectingLocal(true);
    try {
      const connectFeature = walletToConnect.features[StandardConnect] as StandardConnectFeature[typeof StandardConnect] | undefined;
      if (!connectFeature) {
        throw new Error('Wallet does not support standard:connect feature.');
      }
      await connectFeature.connect();
      setSelectedWalletInternal(walletToConnect); 
    } catch (error) {
      console.error(`[useSolanaKitWallet] Failed to connect to ${walletToConnect.name}:`, error);
      setSelectedWalletInternal(null); 
    } finally {
      setIsConnectingLocal(false);
    }
  }, [isConnectingLocal, isConnected, selectedWalletInternal, availableWallets]);

  const disconnect = useCallback(async () => { 
    if (isDisconnectingLocal || !selectedWalletInternal) return;
    setIsDisconnectingLocal(true);
    try {
      const disconnectFeature = selectedWalletInternal.features[StandardDisconnect] as StandardDisconnectFeature[typeof StandardDisconnect] | undefined;
      if (!disconnectFeature) {
        console.warn('Wallet does not support standard:disconnect feature, clearing local state.');
      } else {
        await disconnectFeature.disconnect();
      }
      setSelectedWalletInternal(null);
    } catch (error) {
      console.error("[useSolanaKitWallet] Failed to disconnect wallet:", error);
    } finally {
      setIsDisconnectingLocal(false);
    }
  }, [isDisconnectingLocal, selectedWalletInternal]);

  // SIGN AND SEND TXN
  const signAndSendTransaction = useCallback(
    async (getTransactionMessage: () => FullyPreparedTransactionMessage): Promise<string> => {
      if (!transactionSigner) throw new Error('Signer not available.');
      if (!rpcClient) throw new Error('RPC client not available for send.');

      console.log("[useSolanaKitWallet] Preparing to sign and send transaction...");
      
      let unsignedMsg = getTransactionMessage(); 

      console.log("[useSolanaKitWallet] TransactionMessage (fully prepared) received, signing and sending...");

      const msgWithSigner = addSignersToTransactionMessage([transactionSigner], unsignedMsg);
      const signedMsg = await signTransactionMessageWithSigners(msgWithSigner);
      const wireTx = compileTransactionMessage(signedMsg);
      
      // 4. Broadcast through YOUR jwtRpc transport
      const signature = await rpcClient.sendTransaction(wireTx).send();

      return typeof signature === 'string' ? signature : bs58.encode(signature);
    },
    [transactionSigner, rpcClient]
  );

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