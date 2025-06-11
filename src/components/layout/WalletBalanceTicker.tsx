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
import { AnimatedNumber } from "../ui/AnimatedNumber";

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
  }, [walletAddress, isAdapterConnected]);
  
  // No need for manual formatting anymore, AnimatedNumber handles it
  
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
    // Clean up error messages for production
    const isProduction = import.meta.env.PROD || window.location.hostname === 'degenduel.me';
    const displayError = error 
      ? (isProduction ? "Wallet data unavailable" : "WALLET DATA ERROR")
      : (isProduction ? "Connect wallet" : "WALLET NOT CONNECTED");
    
    return (
      <div className={containerClasses}>
        <div className={`flex items-center justify-center space-x-3 ${isCompact ? 'h-6' : 'h-8'}`}>
          <span className="font-mono text-red-400">
            <span className="animate-ping inline-block h-2 w-2 rounded-full bg-red-500 opacity-75 mr-2"></span>
            {displayError}
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
      <div className={containerClasses} style={{ backgroundColor: 'red', visibility: 'visible', display: 'block', opacity: 1 }}>
        <div className={`flex items-center justify-center ${isCompact ? 'h-6' : 'h-8'}`} style={{ backgroundColor: 'blue', color: 'white' }}>
          <span className="text-white">WALLET TICKER TEST - Connect wallet to view balances</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className={containerClasses}>
      {/* Enhanced background with animated gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-dark-200/40 to-cyan-900/20 animate-pulse" />
        
        {/* Flowing light effect */}
        <div className="absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-purple-400/30 via-cyan-400/30 to-transparent animate-pulse" />
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/30 via-purple-400/30 to-transparent animate-pulse" />
        </div>
        
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent" />
      </div>
      
      {/* Content container */}
      <div className={contentClasses}>
        {/* SOL Balance Item - Enhanced */}
        <div className="group relative inline-flex items-center space-x-3 hover:bg-gradient-to-r hover:from-orange-900/20 hover:to-yellow-900/20 px-3 py-1.5 rounded-lg transition-all duration-300 cursor-pointer border border-transparent hover:border-orange-400/20"
             onClick={() => window.location.href = '/wallet'}
             title="Click to view wallet details">
          
          {/* SOL icon indicator */}
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <div className="w-2 h-2 bg-gradient-to-r from-orange-400 to-yellow-500 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-2 h-2 bg-gradient-to-r from-orange-400 to-yellow-500 rounded-full blur-sm opacity-70" />
            </div>
            <span className="font-mono text-orange-300 group-hover:text-orange-200 font-semibold tracking-wider text-xs">
              SOL
            </span>
          </div>
          
          <span className="font-mono font-bold text-white group-hover:text-orange-100 transition-colors">
            <AnimatedNumber 
              value={balance?.sol_balance || 0} 
              decimals={3}
              showChangeColor={true}
            />
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
            className="group relative inline-flex items-center space-x-2 hover:bg-dark-300/50 px-2 py-1 rounded transition-all cursor-pointer"
            onClick={() => window.location.href = '/wallet'}
            title="Click to view wallet details"
          >
            <span className="font-mono text-cyan-400 group-hover:text-cyan-300 font-medium">
              {token.symbol}
            </span>
            <span className="font-medium text-gray-300 group-hover:text-gray-200">
              <AnimatedNumber 
                value={token.balance} 
                decimals={token.balance > 1000 ? 0 : 2}
                showChangeColor={true}
              />
            </span>
            {token.value_usd && (
              <span className="text-gray-400 group-hover:text-gray-300">
                ($<AnimatedNumber 
                  value={token.value_usd} 
                  decimals={2}
                  showChangeColor={true}
                />)
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