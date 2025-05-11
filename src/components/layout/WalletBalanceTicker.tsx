// src/components/layout/WalletBalanceTicker.tsx

/**
 * Wallet Balance Ticker Component
 * 
 * @description Displays a real-time ticker with wallet balances in the header.
 * Now uses @solana/wallet-adapter-react to determine the wallet address.
 * Still uses the v69 Unified WebSocket System (via custom useWallet hook) for live balance updates.
 * 
 * @author BranchManager69
 * @version 2.0.0
 * @created 2025-04-28
 * @updated 2025-05-12
 */

import { useWallet as useSolanaWalletAdapter } from "@solana/wallet-adapter-react"; // Renamed to avoid conflict
import React, { useEffect, useMemo } from "react";
import { useWallet as useCustomDegenWallet } from "../../hooks/websocket/topic-hooks/useWallet"; // Your custom hook
// import { useStore } from "../../store/useStore"; // No longer needed for walletAddress

interface WalletBalanceTickerProps {
  isCompact?: boolean;
}

export const WalletBalanceTicker: React.FC<WalletBalanceTickerProps> = ({
  isCompact = false,
}) => {
  // Get the connected public key from the Solana Wallet Adapter
  const { publicKey: adapterPublicKey, connected: isAdapterConnected } = useSolanaWalletAdapter();
  const walletAddress = useMemo(() => adapterPublicKey?.toBase58() || null, [adapterPublicKey]);
  
  // Use your custom wallet hook to get all wallet data for the adapter-connected address
  const {
    balance,
    isLoading,
    refreshWallet,
    error
  } = useCustomDegenWallet(walletAddress ? walletAddress : undefined); // Explicitly pass undefined if walletAddress is null

  // Effect to refresh wallet data when the connected wallet address changes
  useEffect(() => {
    if (walletAddress && isAdapterConnected) {
      refreshWallet();
    }
  }, [walletAddress, isAdapterConnected, refreshWallet]);
  
  // Format SOL balance
  const formattedSolBalance = useMemo(() => {
    if (!balance) return '0.000';
    return balance.sol_balance.toFixed(3);
  }, [balance]);
  
  // Get top tokens by value
  const topTokens = useMemo(() => {
    if (!balance || !balance.tokens || balance.tokens.length === 0) return [];
    
    // Sort tokens by USD value (if available) or balance
    return [...balance.tokens]
      .sort((a, b) => {
        // If USD value is available, sort by that
        if (a.value_usd && b.value_usd) {
          return b.value_usd - a.value_usd;
        }
        // Otherwise sort by raw balance
        return b.balance - a.balance;
      })
      .slice(0, 3); // Show top 3 tokens
  }, [balance]);
  
  // CSS classes based on compact mode
  const containerClasses = `
    relative w-full overflow-hidden
    bg-dark-200/60 backdrop-blur-sm border-y border-dark-300
    ${isCompact ? 'h-6' : 'h-8'}
  `;
  
  const contentClasses = `
    flex items-center space-x-6 px-4
    ${isCompact ? 'text-[10px]' : 'text-xs'}
  `;
  
  // Handle loading state - consider both adapter connection and WebSocket loading
  if (isLoading || (isAdapterConnected && !walletAddress && !balance)) { // Show loading if adapter connected but address/balance not yet resolved
    return (
      <div className={containerClasses}>
        <div className={`animate-pulse bg-dark-300/50 ${isCompact ? 'h-6' : 'h-8'}`} />
      </div>
    );
  }
  
  // Handle adapter not connected or WebSocket errors
  if (!isAdapterConnected || error) {
    return (
      <div className={containerClasses}>
        <div className={`flex items-center justify-center space-x-3 ${isCompact ? 'h-6' : 'h-8'}`}>
          <span className="font-mono text-red-400">
            <span className="animate-ping inline-block h-2 w-2 rounded-full bg-red-500 opacity-75 mr-2"></span>
            {error ? "WALLET DATA ERROR" : "WALLET NOT CONNECTED"}
          </span>
          {error && (
            <button 
              onClick={refreshWallet}
              className="bg-red-900/30 hover:bg-red-800/30 border border-red-500/20 rounded text-[10px] px-1.5 py-0.5 flex items-center justify-center text-red-300"
            >
              RETRY
            </button>
          )}
        </div>
      </div>
    );
  }
  
  // Handle no balances (adapter connected, but balance data isn't available from WebSocket yet)
  if (!balance) {
    return (
      <div className={containerClasses}>
        <div className={`flex items-center justify-center ${isCompact ? 'h-6' : 'h-8'}`}>
          <span className="text-gray-400">Connect wallet to view balances</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className={containerClasses}>
      {/* Soft background glow effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 to-cyan-800/5 opacity-50" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
      </div>
      
      {/* Content container */}
      <div className={contentClasses}>
        {/* SOL Balance Item */}
        <div className="group relative inline-flex items-center space-x-2 hover:bg-dark-300/50 px-2 py-1 rounded transition-all">
          <span className="font-mono text-purple-400 group-hover:text-purple-300 font-medium">
            SOL
          </span>
          <span className="font-medium text-gray-300 group-hover:text-gray-200">
            {formattedSolBalance}
          </span>
        </div>
        
        {/* Divider */}
        {topTokens.length > 0 && (
          <div className="inline-flex items-center gap-2">
            <span className="h-4 w-0.5 bg-gradient-to-b from-purple-400/50 to-cyan-400/50 rounded-full" />
          </div>
        )}
        
        {/* Token Balance Items */}
        {topTokens.map((token) => (
          <div 
            key={token.symbol}
            className="group relative inline-flex items-center space-x-2 hover:bg-dark-300/50 px-2 py-1 rounded transition-all"
          >
            <span className="font-mono text-cyan-400 group-hover:text-cyan-300 font-medium">
              {token.symbol}
            </span>
            <span className="font-medium text-gray-300 group-hover:text-gray-200">
              {token.balance.toLocaleString(undefined, { 
                maximumFractionDigits: token.balance > 1000 ? 0 : 2 
              })}
            </span>
            {token.value_usd && (
              <span className="text-gray-400 group-hover:text-gray-300">
                (${token.value_usd.toFixed(2)})
              </span>
            )}
          </div>
        ))}
        
        {/* Refresh button */}
        <button
          onClick={refreshWallet}
          className="ml-auto bg-dark-400/30 hover:bg-dark-400/40 border border-purple-500/20 rounded text-[10px] px-1.5 py-0.5 flex items-center text-purple-300"
          title="Refresh wallet balances"
        >
          <span className="inline-block mr-0.5">↻</span>
          REFRESH
        </button>
      </div>
    </div>
  );
};

export default WalletBalanceTicker;