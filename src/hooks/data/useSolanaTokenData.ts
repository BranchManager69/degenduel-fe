// src/hooks/useSolanaTokenData.ts

/**
 * 
 * useSolanaTokenData Hook
 * 
 * Hook for fetching token data directly from the Solana blockchain.
 * This supplements the WebSocket-based token data with real-time on-chain data.
 * Now supports both token metadata and user token balance.
 * 
 * ⚠️ HOOK CLARIFICATION ⚠️
 * This hook is specifically for ON-CHAIN Solana token data, not market price data.
 * 
 * This hook serves a different purpose than:
 * - useTokenData.ts - General market data via WebSocket (original)
 * - topic-hooks/useTokenData.ts - Market data via v69 WebSocket architecture
 * - useStandardizedTokenData.ts - Standardized UI data processing for components
 * 
 * @author BranchManager69
 * @created 2025-04-24
 * @updated 2025-04-25 - Added user balance support
 * @updated 2025-04-29 - Added clarification about hook purpose
 * @updated 2025-04-30 - Added info about DD-RPC v2.0
 */

import { PublicKey, TokenAccountsFilter } from '@solana/web3.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { config } from '../../config/config';
import { useSolanaConnection } from '../../contexts/SolanaConnectionContext';
import { useStore } from '../../store/useStore';

// Create a singleton cache that persists across component instances but can be cleaned up
class TokenDataCache {
  private static instance: TokenDataCache;
  private invalidMints = new Set<string>();
  private validData = new Map<string, any>();

  static getInstance() {
    if (!TokenDataCache.instance) {
      TokenDataCache.instance = new TokenDataCache();
    }
    return TokenDataCache.instance;
  }

  isInvalid(mint: string): boolean {
    return this.invalidMints.has(mint);
  }

  markInvalid(mint: string): void {
    this.invalidMints.add(mint);
  }

  getCachedData(mint: string): any {
    return this.validData.get(mint);
  }

  setCachedData(mint: string, data: any): void {
    this.validData.set(mint, data);
  }

  clear(): void {
    this.invalidMints.clear();
    this.validData.clear();
  }
}

// old interface (use Token instead)
export interface TokenData {
  mintAddress: string;
  supply: string;
  decimals: number;
  symbol?: string;
  name?: string;
  logo?: string;
  holders?: number;
  price?: number;
  marketCap?: number;
  volume24h?: number;
  userBalance?: number; // User's balance of this token
  error?: string;
}

/**
 * useSolanaTokenData Hook
 * 
 * Hook for fetching token data directly from the Solana blockchain.
 * This supplements the WebSocket-based token data with real-time on-chain data.
 * Now supports both token metadata and user token balance.
 * 
 * @author BranchManager69
 * @created 2025-04-24
 * @updated 2025-04-25 - Added user balance support
 * @updated 2025-04-29 - Added clarification about hook purpose
 * @updated 2025-04-30 - Added info about DD-RPC
 */

export function useSolanaTokenData(
  mintAddress?: string,
  walletAddress?: string,
  refetchInterval?: number
): {
  tokenData: TokenData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const { connection, connectionTier } = useSolanaConnection();
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const user = useStore(state => state.user);

  // If no wallet address is provided, use the current user's wallet address
  const effectiveWalletAddress = walletAddress || user?.wallet_address;

  // FIXED: Add authentication guard - only fetch wallet balance if user is authenticated
  const isAuthenticated = !!user?.wallet_address;

  // Default to use the DegenDuel token address from config if none provided
  const effectiveMintAddress = mintAddress || config.SOLANA.DEGEN_TOKEN_ADDRESS;

  // Memoize on mint address to prevent repeated processing of same invalid mints
  const cacheKey = useMemo(() => effectiveMintAddress, [effectiveMintAddress]);

  // Early validation with caching to prevent repeated processing
  const validationResult = useMemo(() => {
    if (!effectiveMintAddress) {
      return { valid: false, error: 'No mint address provided' } as const;
    }

    // Check if we've already determined this mint is invalid
    if (TokenDataCache.getInstance().isInvalid(effectiveMintAddress)) {
      return { valid: false, error: `Invalid mint address: ${effectiveMintAddress}` } as const;
    }

    // Check if we have cached valid data
    if (TokenDataCache.getInstance().getCachedData(effectiveMintAddress)) {
      return { valid: true, cached: TokenDataCache.getInstance().getCachedData(effectiveMintAddress) } as const;
    }

    // Validate the mint address
    try {
      const mintPubkey = new PublicKey(effectiveMintAddress);
      return { valid: true, mintPubkey } as const;
    } catch {
      console.warn(`[useSolanaTokenData] "${effectiveMintAddress}" is not base-58; skipping.`);
      TokenDataCache.getInstance().markInvalid(effectiveMintAddress);
      return { valid: false, error: `Invalid mint address: ${effectiveMintAddress}` } as const;
    }
  }, [cacheKey]);

  // Function to fetch token data
  const fetchTokenData = useCallback(async () => {
    // Early return for validation failures
    if (!validationResult.valid) {
      setError(validationResult.error);
      setIsLoading(false);
      return;
    }

    // Return cached data if available
    if (validationResult.cached) {
      setTokenData(validationResult.cached);
      setIsLoading(false);
      return;
    }

    // FIXED: If wallet address is requested but user is not authenticated, skip wallet balance fetch
    const skipWalletBalance = effectiveWalletAddress && !isAuthenticated;

    setIsLoading(true);
    setError(null);

    try {
      const mintPubkey = validationResult.mintPubkey!;

      // Fetch token supply and decimals
      const tokenSupply = await connection.getTokenSupply(mintPubkey);

      // Calculate approximate holder count - this is an expensive operation so only do it
      // for admin tier connections or periodically cache the result
      let holders = undefined;
      if (connectionTier === 'admin') {
        try {
          // Configure filter to look for all token accounts
          const filter: TokenAccountsFilter = {
            programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') // Token Program ID
          };

          // Get all accounts that hold this token
          const tokenAccounts = await connection.getTokenAccountsByOwner(
            mintPubkey,
            filter
          );

          holders = tokenAccounts.value.length;
        } catch (holderError) {
          console.warn('Error fetching token holders:', holderError);
          // This is non-critical, so continue without holder data
        }
      }

      // Basic token data
      const newTokenData: TokenData = {
        mintAddress: effectiveMintAddress!,
        supply: tokenSupply.value.amount,
        decimals: tokenSupply.value.decimals,
        holders,
        symbol: effectiveMintAddress === config.SOLANA.DEGEN_TOKEN_ADDRESS ? 'DEGEN' : 'Unknown'
      };

      // If a wallet address is provided and user is authenticated, fetch token balance for that wallet
      if (effectiveWalletAddress && !skipWalletBalance) {
        try {
          // Validate wallet address with defensive handling
          let walletPubkey: PublicKey;
          try {
            walletPubkey = new PublicKey(effectiveWalletAddress);
          } catch (walletPubkeyError) {
            console.warn('[useSolanaTokenData] Invalid wallet address:', effectiveWalletAddress, walletPubkeyError);
            throw new Error(`Invalid wallet address: ${effectiveWalletAddress}`);
          }

          // Attempt to get token accounts owned by this wallet
          const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
            walletPubkey,
            { mint: mintPubkey }
          );

          // If token accounts found, extract balance
          if (tokenAccounts.value.length > 0) {
            const tokenAccount = tokenAccounts.value[0].account.data;
            if ('parsed' in tokenAccount) {
              const parsedData = tokenAccount.parsed;
              if (parsedData.info?.tokenAmount?.uiAmount !== undefined) {
                newTokenData.userBalance = parsedData.info.tokenAmount.uiAmount;
              }
            }
          } else {
            // User has no tokens of this type
            newTokenData.userBalance = 0;
          }
        } catch (walletError) {
          console.warn('Error fetching token balance for wallet:', walletError);
          // This is non-critical, continue without balance data
        }
      }

      // Cache the valid data
      TokenDataCache.getInstance().setCachedData(effectiveMintAddress!, newTokenData);

      // Update state
      setTokenData(newTokenData);
      setIsLoading(false);

    } catch (err) {
      console.error('Error fetching token data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error fetching token data');
      setIsLoading(false);
    }
  }, [validationResult, connection, connectionTier, effectiveWalletAddress, isAuthenticated, effectiveMintAddress]);

  // Fetch data on mount and when addresses change
  useEffect(() => {
    fetchTokenData();

    // Set up interval for refreshing data if requested
    if (refetchInterval && refetchInterval > 0) {
      const intervalId = setInterval(fetchTokenData, refetchInterval);
      return () => clearInterval(intervalId);
    }
  }, [fetchTokenData, refetchInterval]);

  return {
    tokenData,
    isLoading,
    error,
    refetch: fetchTokenData
  };
}

// Helper hook to fetch data for multiple tokens
export function useMultipleTokensData(mintAddresses: string[]): {
  tokensData: Record<string, TokenData>;
  isLoading: boolean;
  errors: Record<string, string>;
  refetch: () => Promise<void>;
} {
  const { connection } = useSolanaConnection();
  const [tokensData, setTokensData] = useState<Record<string, TokenData>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Function to fetch data for multiple tokens
  const fetchAllTokensData = useCallback(async () => {
    if (!mintAddresses.length) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const newTokensData: Record<string, TokenData> = {};
    const newErrors: Record<string, string> = {};

    // Use Promise.all to fetch all token data in parallel
    await Promise.all(
      mintAddresses.map(async (address) => {
        try {
          // Validate mint address with defensive handling
          let mintPubkey: PublicKey;
          try {
            mintPubkey = new PublicKey(address);
          } catch (pubkeyError) {
            console.warn('[useMultipleTokensData] Invalid mint address:', address, pubkeyError);
            // Store error but with minimal data and continue with other tokens
            newTokensData[address] = {
              mintAddress: address,
              supply: '0',
              decimals: 0,
              error: `Invalid mint address: ${address}`
            };
            newErrors[address] = `Invalid mint address: ${address}`;
            return; // Skip this token and continue with others
          }

          // Fetch token supply and decimals
          const tokenSupply = await connection.getTokenSupply(mintPubkey);

          // Store basic token data
          newTokensData[address] = {
            mintAddress: address,
            supply: tokenSupply.value.amount,
            decimals: tokenSupply.value.decimals
          };
        } catch (err) {
          console.error(`Error fetching data for token ${address}:`, err);
          newErrors[address] = err instanceof Error ? err.message : 'Unknown error';

          // Store error but with minimal data
          newTokensData[address] = {
            mintAddress: address,
            supply: '0',
            decimals: 0,
            error: err instanceof Error ? err.message : 'Unknown error'
          };
        }
      })
    );

    setTokensData(newTokensData);
    setErrors(newErrors);
    setIsLoading(false);
  }, [mintAddresses, connection]);

  // Fetch data on mount and when addresses change
  useEffect(() => {
    fetchAllTokensData();
  }, [fetchAllTokensData]);

  return {
    tokensData,
    isLoading,
    errors,
    refetch: fetchAllTokensData
  };
}