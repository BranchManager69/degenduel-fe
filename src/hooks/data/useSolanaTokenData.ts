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
import { useCallback, useEffect, useState } from 'react';
import { config } from '../../config/config';
import { useSolanaConnection } from '../../contexts/SolanaConnectionContext';
import { useStore } from '../../store/useStore';

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
  
  // Default to use the DegenDuel token address from config if none provided
  const effectiveMintAddress = mintAddress || config.SOLANA.DEGEN_TOKEN_ADDRESS;

  // Function to fetch token data
  const fetchTokenData = useCallback(async () => {
    if (!effectiveMintAddress) {
      setError('No mint address provided');
      setIsLoading(false);
      return;
    }

    // Don't fetch if no user is authenticated (avoids 403 errors on public tier)
    if (!user?.wallet_address) {
      setTokenData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Validate mint address
      const mintPubkey = new PublicKey(effectiveMintAddress);
      
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
        mintAddress: effectiveMintAddress,
        supply: tokenSupply.value.amount,
        decimals: tokenSupply.value.decimals,
        holders,
        symbol: effectiveMintAddress === config.SOLANA.DEGEN_TOKEN_ADDRESS ? 'DEGEN' : 'Unknown'
      };
      
      // If a wallet address is provided, fetch token balance for that wallet
      if (effectiveWalletAddress) {
        try {
          // Attempt to get token accounts owned by this wallet
          const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
            new PublicKey(effectiveWalletAddress),
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
      
      // Update state
      setTokenData(newTokenData);
      setIsLoading(false);
      
    } catch (err) {
      console.error('Error fetching token data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error fetching token data');
      setIsLoading(false);
    }
  }, [effectiveMintAddress, connection, connectionTier, effectiveWalletAddress]);

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
          // Validate mint address
          const mintPubkey = new PublicKey(address);
          
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