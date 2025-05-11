// src/hooks/wallet/useSolanaKitWallet.ts

/**
 * Solana Kit Wallet Hook
 *
 * @description This file contains the useSolanaKitWallet hook, THE way to connect and disconnect from a Solana wallet.
 * @author BranchManager69
 * @version v2.0.2
 * @created 2025-05-06
 * @updated 2025-05-11
 */

// ─────────────────────────────────── Imports ──────────────────────────────
import { type Address } from '@solana/addresses';

// Transaction‑message primitives (versions, fee payer, lifetimes)
import {
  ITransactionMessageWithFeePayer,
  type TransactionMessage,
  type TransactionMessageWithBlockhashLifetime,
  type TransactionMessageWithDurableNonceLifetime,
} from '@solana/transaction-messages';

// Instruction & meta generics
import {
  AccountRole,
  type IAccountLookupMeta,
  type IAccountMeta,
  type IInstruction
} from '@solana/instructions';

import type { WalletName } from '@solana/wallet-adapter-base';
import type { Wallet, WalletContextState } from '@solana/wallet-adapter-react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useCallback, useMemo } from 'react';

import {
  AddressLookupTableAccount,
  MessageV0,
  PublicKey,
  TransactionInstruction,
  VersionedTransaction,
} from '@solana/web3.js';

import { Buffer } from 'buffer';

import { useSolanaConnection } from '../../contexts/SolanaConnectionContext';

// ────────────────────────────── Types ─────────────────────────────────────

// Helper type for Legacy Instructions. IInstruction provides optional `accounts` and `data`.
// `programAddress` is specific to legacy.
export type AppLegacyInstruction = IInstruction<Address> & {
  programAddress: Address;
  accounts?: Readonly<Array<IAccountMeta<Address>>>; // Explicitly IAccountMeta for legacy
  data?: Uint8Array;
};

// Helper type for V0 Instructions. IInstruction provides `programAddressIndex`.
export type AppV0Instruction = IInstruction<Address> & {
  programAddressIndex: number; // V0 must have this
  accounts?: Readonly<Array<IAccountMeta<Address> | IAccountLookupMeta<Address>>>;
  data?: Uint8Array;
};

export type FullyPreparedTransactionMessage = 
  TransactionMessage & // Base from @solana/transaction-messages
  ITransactionMessageWithFeePayer<Address> & 
  (TransactionMessageWithBlockhashLifetime | TransactionMessageWithDurableNonceLifetime) & 
  ({
    version: 'legacy';
    instructions: Readonly<Array<AppLegacyInstruction>>;
  } | {
    version: 0;
    instructions: Readonly<Array<AppV0Instruction>>;
    staticAccountKeys: Readonly<Array<Address>>;
    addressTableLookups?: Readonly<Array<{
        accountKey: Address;
        writableIndexes: Readonly<Array<number>>;
        readonlyIndexes: Readonly<Array<number>>;
    }>>;
  });

export interface UseSolanaKitWalletHook {
  availableWallets: readonly Wallet[]; 
  selectedWallet: WalletContextState['wallet']; 
  publicKey: PublicKey | null; 
  publicKeyBase58: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isDisconnecting: boolean;
  connect: (wallet: Wallet) => Promise<void>;
  disconnect: () => Promise<void>;
  signAndSendTransaction: (getMsg: () => FullyPreparedTransactionMessage) => Promise<string>; 
  signAndSendBlinkTransaction: (base64: string) => Promise<string>;
}

// ────────────────────────────── Helpers ───────────────────────────────────
// Assuming Address from @solana/addresses, when part of a library structure like IAccountMeta<Address>,
// might be an object { address: string }, while standalone Address might be a branded string.
// This helper tries to accommodate both for `new PublicKey()`.
const addrToString = (addrInput: Address | { address: Address }): string => {
    if (typeof addrInput === 'string') return addrInput; // It's already the string (branded Address)
    if (addrInput && typeof addrInput.address === 'string') return addrInput.address; // It's an object { address: string_Address }
    throw new Error('Invalid Address structure for addrToString');
};

// ────────────────────────────── Hook ──────────────────────────────────────
export function useSolanaKitWallet(): UseSolanaKitWalletHook {
  // Ensure SolanaConnectionContext side‑effects run (even if we don't use endpoint)
  useSolanaConnection();

  const { connection } = useConnection();
  const walletAdapter = useWallet();

  const {
    select,
    disconnect: adapterDisconnect,
    connected: adapterConnected,
    publicKey: adapterPubKey,
    wallet: adapterSelectedWallet,
    wallets: adapterWallets,
    connecting,
    disconnecting,
    signTransaction: adapterSignTx,
  } = walletAdapter;

  const publicKey = adapterPubKey;
  const publicKeyBase58 = useMemo(
    () => publicKey?.toBase58() ?? null,
    [publicKey],
  );

  // ───────── Connect / disconnect ─────────
  const connectWallet = useCallback(
    async (wallet: Wallet) => {
      if (connecting || adapterConnected) return;
      try {
        select(wallet.adapter.name as WalletName<string>); 
      } catch (err) {
        console.error('[useSolanaKitWallet] connect error', err);
        select(null);
      }
    },
    [connecting, adapterConnected, select],
  );

  const disconnectWallet = useCallback(async () => {
    if (disconnecting || !adapterConnected) return;
    try {
      await adapterDisconnect();
    } catch (err) {
      console.error('[useSolanaKitWallet] disconnect error', err);
    }
  }, [disconnecting, adapterConnected, adapterDisconnect]);

  // ───────── Tx helpers ─────────
  const signAndSendTransaction = useCallback(
    async (getMsg: () => FullyPreparedTransactionMessage): Promise<string> => {
      if (!publicKey || !adapterSignTx || !connection)
        throw new Error('Wallet not ready');

      const txMsg = getMsg();
      const { blockhash } = await connection.getLatestBlockhash();
      const feePayer = new PublicKey(addrToString(txMsg.feePayer));

      let resolvedInstructions: TransactionInstruction[];

      if (txMsg.version === 'legacy') {
        const legacyInstructions = txMsg.instructions as Readonly<Array<AppLegacyInstruction>>;
        resolvedInstructions = legacyInstructions.map((ix: AppLegacyInstruction) => {
          if (!ix.programAddress) throw new Error('Legacy instruction missing programAddress');
          const programId = new PublicKey(addrToString(ix.programAddress));
          const keys = (ix.accounts || []).map((acc: IAccountMeta<Address>) => ({
            pubkey: new PublicKey(addrToString(acc.address)),
            isSigner: acc.role === AccountRole.READONLY_SIGNER || acc.role === AccountRole.WRITABLE_SIGNER,
            isWritable: acc.role === AccountRole.WRITABLE || acc.role === AccountRole.WRITABLE_SIGNER,
          }));
          const data = Buffer.from(ix.data || new Uint8Array());
          return new TransactionInstruction({ programId, keys, data });
        });
      } else { // V0 transaction
        const v0Instructions = txMsg.instructions as Readonly<Array<AppV0Instruction>>;
        if (!txMsg.staticAccountKeys) { 
            throw new Error("staticAccountKeys is undefined for V0 transaction message.");
        }
        resolvedInstructions = v0Instructions.map((ix: AppV0Instruction) => {
          if (ix.programAddressIndex === undefined) throw new Error('V0 instruction missing programAddressIndex');
          if (!txMsg.staticAccountKeys || !txMsg.staticAccountKeys[ix.programAddressIndex]) throw new Error('Invalid programAddressIndex');
          const programId = new PublicKey(addrToString(txMsg.staticAccountKeys[ix.programAddressIndex]));
          
          const keys = (ix.accounts || []).map((acc: IAccountMeta<Address> | IAccountLookupMeta<Address>) => {
            let pubkey: PublicKey;
            let isSigner: boolean;
            let isWritable: boolean;

            if ('address' in acc && 'role' in acc ) { // It's an IAccountMeta<Address>
              pubkey = new PublicKey(addrToString(acc.address));
              isSigner = acc.role === AccountRole.READONLY_SIGNER || acc.role === AccountRole.WRITABLE_SIGNER;
              isWritable = acc.role === AccountRole.WRITABLE || acc.role === AccountRole.WRITABLE_SIGNER;
            } else if ('addressLookupTableAccountAddress' in acc) { // It's an IAccountLookupMeta<Address>
              throw new Error('Direct mapping of IAccountLookupMeta in V0 instruction accounts needs ALT resolution for web3.js TransactionInstruction keys.');
            } else {
              throw new Error('Unknown account meta type in V0 instruction accounts array');
            }
            return { pubkey, isSigner, isWritable };
          });
          const data = Buffer.from(ix.data || new Uint8Array());
          return new TransactionInstruction({ programId, keys, data });
        });
      }

      let altAccounts_web3js: AddressLookupTableAccount[] | undefined = undefined;
      if (txMsg.version === 0 && txMsg.addressTableLookups && txMsg.addressTableLookups.length > 0) {
        altAccounts_web3js = await Promise.all(
          txMsg.addressTableLookups.map(async (lookup: { accountKey: Address; writableIndexes: readonly number[]; readonlyIndexes: readonly number[]; }) => {
            const accountKey = new PublicKey(addrToString(lookup.accountKey));
            const accountInfo = await connection.getAccountInfo(accountKey);
            if (!accountInfo) throw new Error(`ALT not found: ${addrToString(lookup.accountKey)}`);
            return new AddressLookupTableAccount({
              key: accountKey,
              state: AddressLookupTableAccount.deserialize(accountInfo.data),
            });
          })
        );
      }

      const message = MessageV0.compile({
        payerKey: feePayer,
        recentBlockhash: blockhash,
        instructions: resolvedInstructions,
        addressLookupTableAccounts: altAccounts_web3js,
      });

      const vtx = new VersionedTransaction(message);
      const signed = await adapterSignTx(vtx);
      const sig = await connection.sendRawTransaction(signed.serialize());
      return sig;
    },
    [connection, publicKey, adapterSignTx],
  );

  const signAndSendBlinkTransaction = useCallback(
    async (b64: string): Promise<string> => {
      if (!publicKey || !adapterSignTx || !connection)
        throw new Error('Wallet not ready');

      const tx = VersionedTransaction.deserialize(Buffer.from(b64, 'base64'));
      const signed = await adapterSignTx(tx);
      return connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: true,
      });
    },
    [connection, publicKey, adapterSignTx],
  );

  // ────────────────────────────── Return API ──────────────────────────────
  return {
    availableWallets: adapterWallets,
    selectedWallet: adapterSelectedWallet,
    publicKey,
    publicKeyBase58,
    isConnected: adapterConnected,
    isConnecting: connecting,
    isDisconnecting: disconnecting,
    connect: connectWallet,
    disconnect: disconnectWallet,
    signAndSendTransaction,
    signAndSendBlinkTransaction,
  };
}
