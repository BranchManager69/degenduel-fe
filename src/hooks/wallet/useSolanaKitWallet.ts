// src/hooks/wallet/useSolanaKitWallet.ts

/**
 * Solana Kit Wallet Hook
 * 
 * @description This file contains the useSolanaKitWallet hook, THE way to connect and disconnect from a Solana wallet.
 *
 * @author BranchManager69
 * @version v2.0.1
 * @created 2025-05-06
 * @updated 2025-05-07
 */

import { address, type Address } from '@solana/addresses';
import { useWalletAccountTransactionSendingSigner } from '@solana/react';
import { blockhash as createBlockhash } from '@solana/rpc-types';
import {
  addSignersToTransactionMessage,
  signTransactionMessageWithSigners
} from '@solana/signers';
import {
  decompileTransactionMessage,
  type CompiledTransactionMessage,
  type ITransactionMessageWithFeePayer,
  type TransactionMessage,
  type TransactionMessageWithBlockhashLifetime,
  type TransactionMessageWithDurableNonceLifetime,
} from '@solana/transaction-messages';
import {
  compileTransaction,
  getBase64EncodedWireTransaction,
  type FullySignedTransaction,
  type TransactionWithLifetime
} from '@solana/transactions';
import {
  StandardConnect,
  StandardDisconnect
} from '@wallet-standard/features';
import {
  useWallets,
  type UiWallet,
  type UiWalletAccount,
} from '@wallet-standard/react-core';
import bs58 from 'bs58';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { VersionedTransaction, type MessageAddressTableLookup, type MessageCompiledInstruction, type MessageV0, type CompiledInstruction as W3JSCompiledInstruction } from '@solana/web3.js';
import { Buffer } from 'buffer/';
import { useDegenDuelRpc, type RpcContextType } from '../../App';

// Local definition for the instruction structure expected by @solana/transaction-messages' CompiledTransactionMessage
type TMCompiledInstruction = Readonly<{
    accountIndices?: number[];
    data?: Readonly<Uint8Array>;
    programAddressIndex: number;
}>;

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
  signAndSendBlinkTransaction: (base64TransactionString: string) => Promise<string>; // New method for Blinks
}

// Function to use the SolanaKitWallet hook
export function useSolanaKitWallet(): UseSolanaKitWalletHook {
  const rpcContext = useDegenDuelRpc(); 
  const { rpcClient, endpoint } = rpcContext as RpcContextType;

  const availableWallets = useWallets();

  const [selectedWalletInternal, setSelectedWalletInternal] = useState<UiWallet | null>(null);
  const [currentAccountInternal, setCurrentAccountInternal] = useState<UiWalletAccount | undefined>(undefined);
  
  // Local states to reflect the status from useConnect/useDisconnect hooks
  const [isConnectingLocal, setIsConnectingLocal] = useState(false);
  const [isDisconnectingLocal, setIsDisconnectingLocal] = useState(false);

  // Effect to set the current account
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

  // Effect to set the chain for the signer
  const chainForSigner = useMemo(() => {
    if (endpoint.includes('devnet')) return 'solana:devnet';
    if (endpoint.includes('testnet')) return 'solana:testnet';
    return 'solana:mainnet';
  }, [endpoint]);

  // Effect to set the transaction signer
  const transactionSigner = currentAccountInternal ? useWalletAccountTransactionSendingSigner(currentAccountInternal, chainForSigner) : undefined;

  // Effect to set the public key
  const publicKey = useMemo(() => currentAccountInternal?.address as Address | null ?? null, [currentAccountInternal]);
  // Effect to set the connection status
  const isConnected = useMemo(() => !!currentAccountInternal && !!selectedWalletInternal, [currentAccountInternal, selectedWalletInternal]);

  // Connect
  const connect = useCallback(async (walletToConnect: UiWallet) => {
    if (isConnectingLocal || (isConnected && selectedWalletInternal?.name === walletToConnect.name)) return;
    // Update local state to reflect that connection is in progress
    setIsConnectingLocal(true);
    // --- Attempt to connect to the wallet
    try {
      // Ensure the wallet supports the `standard:connect` feature before attempting to connect.
      if ((walletToConnect.features as Record<string, any>)[StandardConnect]) {
        await (walletToConnect.features as Record<string, any>)[StandardConnect].connect();
        setSelectedWalletInternal(walletToConnect);
      } else {
        throw new Error('Wallet does not support standard:connect feature.');
      }
    } catch (error) {
      // If the connection fails, clear the selected wallet and update the local state to reflect that connection is complete
      console.error(`[useSolanaKitWallet] Failed to connect to ${walletToConnect.name}:`, error);
      setSelectedWalletInternal(null); 
    } finally {
      // Update the local state to reflect that connection is complete
      setIsConnectingLocal(false);
    }
    // --- Connection attempt at the wallet is complete
  }, [isConnectingLocal, isConnected, selectedWalletInternal, availableWallets]);

  // Disconnect
  const disconnect = useCallback(async () => { 
    // If the disconnection is already in progress or the selected wallet is not available, return
    if (isDisconnectingLocal || !selectedWalletInternal) return;
    // Update local state to reflect that disconnection is in progress
    setIsDisconnectingLocal(true);
    // --- Attempt to disconnect from the wallet
    try {
      // Ensure the wallet supports the `standard:disconnect` feature before attempting to disconnect.
      if (
        selectedWalletInternal &&
        (selectedWalletInternal.features as Record<string, any>)[StandardDisconnect]
      ) {
        await (selectedWalletInternal.features as Record<string, any>)[StandardDisconnect].disconnect();
        setSelectedWalletInternal(null);
      } else {
        console.warn('Wallet does not support standard:disconnect feature or no wallet selected, clearing local state.');
        setSelectedWalletInternal(null); // Ensure wallet is cleared if feature not present
      }
    } catch (error) {
      // If the disconnection fails, clear the selected wallet and update the local state to reflect that disconnection is complete
      console.error("[useSolanaKitWallet] Failed to disconnect wallet:", error);
      setSelectedWalletInternal(null);
    } finally {
      // Update the local state to reflect that disconnection is complete
      setIsDisconnectingLocal(false);
    }
    // --- Disconnect attempt at the wallet is complete
  }, [isDisconnectingLocal, selectedWalletInternal]);

  // Sign and send transaction
  const signAndSendTransaction = useCallback(
    async (getTransactionMessage: () => FullyPreparedTransactionMessage): Promise<string> => {
      if (!transactionSigner) throw new Error('Signer not available.');
      if (!rpcClient) throw new Error('RPC client not available for send.');
      console.log("[useSolanaKitWallet] Preparing to sign and send transaction...");
      let unsignedMsg = getTransactionMessage(); 
      console.log("[useSolanaKitWallet] TransactionMessage (fully prepared) received, signing and sending...");
      // transactionSigner should be compatible with (PartialSigner | ModifyingSigner)
      const msgWithSigner = addSignersToTransactionMessage([transactionSigner], unsignedMsg);
      const signedTxObject: Readonly<FullySignedTransaction & TransactionWithLifetime> = 
        await signTransactionMessageWithSigners(msgWithSigner);
      // Get the base64 encoded wire transaction from the FullySignedTransaction
      const base64WireTransaction = getBase64EncodedWireTransaction(signedTxObject);
      // Broadcast through the RPC client
      const signature = await rpcClient.sendTransaction(
        base64WireTransaction, 
        { encoding: 'base64' } // Specify encoding as per YOU_WILL_ACCOMPLISH_SUCCESS.md (4b)
      ).send();
      // Return the signature
      return typeof signature === 'string' ? signature : bs58.encode(signature);
    },
    [transactionSigner, rpcClient]
  );

  // New method to sign and send a pre-serialized Blink transaction
  const signAndSendBlinkTransaction = useCallback(
    async (base64TransactionString: string): Promise<string> => {
      if (!transactionSigner) throw new Error('Transaction signer not available for Blink.');
      if (!publicKey) throw new Error('Public key not available for Blink.');

      console.log("[useSolanaKitWallet] Processing Blink transaction (v12: type refinements)...");

      // Deserialize the base64 transaction string
      const transactionBytes = Buffer.from(base64TransactionString, 'base64');
      // Deserialize the transaction into a VersionedTransaction object
      const vtx = VersionedTransaction.deserialize(transactionBytes);

      // Decompile the compiled transaction message
      let compiledMessageForDecompile: CompiledTransactionMessage;
      // Get the static accounts
      const staticAccounts = vtx.message.staticAccountKeys.map(pk => address(pk.toBase58()));
      // Get the header
      const web3jsHeader = vtx.message.header;
      // Convert the header to the expected format
      const tmHeader = {
          numSignerAccounts: web3jsHeader.numRequiredSignatures,
          numReadonlySignerAccounts: web3jsHeader.numReadonlySignedAccounts,
          numReadonlyNonSignerAccounts: web3jsHeader.numReadonlyUnsignedAccounts,
      };
      // Get the lifetime token if it exists
      if (!vtx.message.recentBlockhash) {
        throw new Error('Transaction message is missing recentBlockhash.');
      }
      // Create the lifetime token (get recentBlockhash from the transaction)
      const lifetimeToken = createBlockhash(vtx.message.recentBlockhash);

      // Get the instructions (TMCompiledInstruction[])
      let tmInstructions: TMCompiledInstruction[];

      // If the transaction is a legacy transaction
      if (vtx.message.version === 'legacy') {
        // Get the instructions
        const web3Instructions = vtx.message.instructions;
        // Convert the instructions to the expected format (TMCompiledInstruction[])
        tmInstructions = web3Instructions.map((ix: W3JSCompiledInstruction) => ({
            programAddressIndex: ix.programIdIndex,
            accountIndices: ix.accounts,
            data: Buffer.from(ix.data, 'base64'),
        }));
        // Compile the message
        compiledMessageForDecompile = {
          version: 'legacy',
          header: tmHeader,
          staticAccounts,
          instructions: tmInstructions,
          lifetimeToken: lifetimeToken,
        };
      } else { // Version 0
        // Get the instructions
        const v0Message = vtx.message as MessageV0;
        const web3CompiledInstructions = v0Message.compiledInstructions;
        // Convert the instructions to the expected format (TMCompiledInstruction)
        tmInstructions = web3CompiledInstructions.map((ix: MessageCompiledInstruction) => ({
            programAddressIndex: ix.programIdIndex,
            accountIndices: ix.accountKeyIndexes,
            data: ix.data,
        }));
        // Get the address table lookups
        const tmAddressTableLookups = v0Message.addressTableLookups.map((lookup: MessageAddressTableLookup) => ({
            lookupTableAddress: address(lookup.accountKey.toBase58()),
            readableIndices: Array.from(lookup.readonlyIndexes),
            writableIndices: Array.from(lookup.writableIndexes),
        }));
        // Compile the message for decompilation
        compiledMessageForDecompile = {
          version: 0,
          header: tmHeader,
          staticAccounts,
          instructions: tmInstructions,
          lifetimeToken: lifetimeToken,
          addressTableLookups: tmAddressTableLookups,
        };
      }
      // Decompile the message
      const decompiledMessage = decompileTransactionMessage(compiledMessageForDecompile, {
        // addressLookupTableAccounts: undefined 
      });

      const compiledTxForSigner = compileTransaction(decompiledMessage);

      const signedTransactionSignatures = await transactionSigner.signAndSendTransactions([
        compiledTxForSigner 
      ]);

      if (!signedTransactionSignatures || signedTransactionSignatures.length === 0) {
        throw new Error('Blink transaction not signed or sent, no signature returned.');
      }

      const finalSignature = bs58.encode(signedTransactionSignatures[0]);
      console.log("[useSolanaKitWallet] Blink transaction signed and sent (v12), signature:", finalSignature);
      return finalSignature;
    },
    [transactionSigner, publicKey, rpcClient] 
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
    signAndSendBlinkTransaction,
  };
} 