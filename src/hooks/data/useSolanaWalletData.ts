// src/hooks/useSolanaWalletData.ts

/**
 * useSolanaWalletData Hook
 * 
 * Hook for fetching wallet data directly from the Solana blockchain.
 * This provides real-time balance and transaction information for Solana wallets.
 * 
 * @author @BranchManager69
 * @created 2025-04-24
 * @updated 2025-04-28 - [ongoing fixes; TBA]
 */

import { ParsedAccountData, ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js';
import { useCallback, useEffect, useState } from 'react';
import { useSolanaConnection } from '../../contexts/SolanaConnectionContext';
import { useStore } from '../../store/useStore';

// Config
import { config } from '../../config/config';
const DEGENDUEL_RPC_BASE_URL = config.SOLANA.RPC_BASE_URL;
console.log('[Solana] DegenDuel RPC:', DEGENDUEL_RPC_BASE_URL);

export interface SolanaTransaction {
  signature: string;
  timestamp: number | null;
  successful: boolean;
  fee: number;
  blockhash: string;
  slot: number;
  senders: string[];
  receivers: string[];
  amount?: number;
  error?: string;
}

export interface TokenBalance {
  mint: string;
  balance: string;
  decimals: number;
  uiBalance: number;
}

export interface SolanaWalletData {
  address: string;
  balance: number; // SOL balance
  tokenBalances: TokenBalance[];
  recentTransactions: SolanaTransaction[];
}

export function useSolanaWalletData(walletAddress?: string): {
  walletData: SolanaWalletData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const { connection } = useSolanaConnection();
  const [walletData, setWalletData] = useState<SolanaWalletData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Get user's wallet address from store if not provided
  const user = useStore(state => state.user);
  const effectiveWalletAddress = walletAddress || user?.wallet_address;

  // FIXED: Add authentication guard - only make API calls if user is authenticated
  const isAuthenticated = !!user?.wallet_address;

  // Function to fetch wallet data
  const fetchWalletData = useCallback(async () => {
    // FIXED: Skip API calls if user is not authenticated
    if (!isAuthenticated) {
      setWalletData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (!effectiveWalletAddress) {
      setError('No wallet address provided');
      setIsLoading(false);
      return;
    }

    // For the SolanaWalletData hook, we need a wallet address to query
    // But we should allow querying any wallet address, not just the authenticated user's
    // The public tier should be able to query wallet data with rate limits

    setIsLoading(true);
    setError(null);

    try {
      // Validate wallet address
      const pubkey = new PublicKey(effectiveWalletAddress);

      // Fetch SOL balance (in lamports)
      const balance = await connection.getBalance(pubkey);

      // Convert lamports to SOL
      const solBalance = balance / 1_000_000_000; // 1 SOL = 10^9 lamports

      // Fetch token accounts owned by this wallet
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        pubkey,
        { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
      );

      // Process token balances
      const tokenBalances: TokenBalance[] = tokenAccounts.value.map(account => {
        const data = account.account.data as ParsedAccountData;
        const info = data.parsed.info;

        return {
          mint: info.mint,
          balance: info.tokenAmount.amount,
          decimals: info.tokenAmount.decimals,
          uiBalance: info.tokenAmount.uiAmount
        };
      });

      // Fetch recent transactions (limit to 10 for performance)
      const signatures = await connection.getSignaturesForAddress(pubkey, { limit: 10 });

      // Get transaction details
      const transactions: SolanaTransaction[] = [];

      // Process in batches of 3 to avoid rate limits
      const batchSize = 3;
      for (let i = 0; i < signatures.length; i += batchSize) {
        const batch = signatures.slice(i, i + batchSize);

        // Fetch transaction details in parallel
        const txDetails = await Promise.all(
          batch.map(async (sig) => {
            try {
              const tx = await connection.getParsedTransaction(sig.signature, {
                maxSupportedTransactionVersion: 0
              });

              if (!tx) {
                return {
                  signature: sig.signature,
                  timestamp: sig.blockTime || null,
                  successful: false,
                  fee: 0,
                  blockhash: '',
                  slot: sig.slot,
                  senders: [],
                  receivers: [],
                  error: 'Transaction details not found'
                };
              }

              return {
                signature: sig.signature,
                timestamp: tx.blockTime || null,
                successful: tx.meta?.err === null,
                fee: tx.meta?.fee || 0,
                blockhash: tx.transaction.message.recentBlockhash || '',
                slot: tx.slot,
                // Extract senders and receivers from transaction
                senders: extractAddresses(tx, 'sender'),
                receivers: extractAddresses(tx, 'receiver')
              };
            } catch (txError) {
              console.error(`Error fetching transaction ${sig.signature}:`, txError);
              return {
                signature: sig.signature,
                timestamp: sig.blockTime || null,
                successful: false,
                fee: 0,
                blockhash: '',
                slot: sig.slot,
                senders: [],
                receivers: [],
                error: txError instanceof Error ? txError.message : 'Unknown error'
              };
            }
          })
        );

        transactions.push(...txDetails);
      }

      // Update state with wallet data
      setWalletData({
        address: effectiveWalletAddress,
        balance: solBalance,
        tokenBalances,
        recentTransactions: transactions
      });

      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error fetching wallet data');
      setIsLoading(false);
    }
  }, [effectiveWalletAddress, connection, isAuthenticated]);

  // Helper function to extract addresses from transaction
  const extractAddresses = (tx: ParsedTransactionWithMeta, role: 'sender' | 'receiver'): string[] => {
    const addresses = new Set<string>();

    // Process instructions
    tx.transaction.message.instructions.forEach(ix => {
      if ('parsed' in ix && ix.parsed && 'type' in ix.parsed) {
        // Handle SPL token transfers
        if (ix.parsed.type === 'transfer') {
          if (role === 'sender' && ix.parsed.info.source) {
            addresses.add(ix.parsed.info.source);
          } else if (role === 'receiver' && ix.parsed.info.destination) {
            addresses.add(ix.parsed.info.destination);
          }
        }
      }
    });

    // Process SOL transfers from message accounts and inner instructions
    if (tx.meta && tx.meta.innerInstructions) {
      tx.meta.innerInstructions.forEach(inner => {
        inner.instructions.forEach(ix => {
          if ('parsed' in ix && ix.parsed && 'type' in ix.parsed) {
            if (ix.parsed.type === 'transfer') {
              if (role === 'sender' && ix.parsed.info.source) {
                addresses.add(ix.parsed.info.source);
              } else if (role === 'receiver' && ix.parsed.info.destination) {
                addresses.add(ix.parsed.info.destination);
              }
            }
          }
        });
      });
    }

    return Array.from(addresses);
  };

  // Fetch data on mount and when wallet address changes
  useEffect(() => {
    if (effectiveWalletAddress) {
      fetchWalletData();
    }
  }, [fetchWalletData, effectiveWalletAddress]);

  return {
    walletData,
    isLoading,
    error,
    refresh: fetchWalletData
  };
}