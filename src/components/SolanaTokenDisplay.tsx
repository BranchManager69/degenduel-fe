// src/components/SolanaTokenDisplay.tsx

/**
 * SolanaTokenDisplay Component
 * 
 * A component that displays token data fetched directly from the Solana blockchain.
 * Supports both detailed and compact display modes.
 * 
 * @author BranchManager69
 * @created 2025-04-24
 * @updated 2025-04-25 - Added compact mode for user menu
 */

import React from 'react';
import { useSolanaTokenData } from '../hooks/data/useSolanaTokenData';
import { AnimatedFormattedNumber, formatTokenBalance } from './ui/AnimatedFormattedNumber';

interface SolanaTokenDisplayProps {
  mintAddress?: string;
  walletAddress?: string;  // Optional wallet address for balance lookup
  showSupply?: boolean;
  showHolders?: boolean;
  compact?: boolean;       // Compact mode for headers and menus
  className?: string;
}

export const SolanaTokenDisplay: React.FC<SolanaTokenDisplayProps> = ({
  mintAddress,
  walletAddress,
  showSupply = true,
  showHolders = true,
  compact = false,
  className = '',
}) => {
  const { tokenData, isLoading, error, refetch } = useSolanaTokenData(mintAddress, walletAddress);

  // Format large numbers with commas
  const formatNumber = (value: string | number): string => {
    if (typeof value === 'string') {
      return parseInt(value, 10).toLocaleString();
    }
    return value.toLocaleString();
  };

  // Format token supply with decimals
  const formatSupply = (supply: string, decimals: number): string => {
    const amount = parseInt(supply, 10) / Math.pow(10, decimals);
    return amount.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };


  // Compact display for headers and menus
  if (compact) {
    const handleClick = () => {
      // Navigate to wallet page or show token details
      if (typeof window !== 'undefined') {
        window.location.href = '/wallet';
      }
    };

    return (
      <button 
        onClick={handleClick}
        className="token-balance-compact cursor-pointer hover:bg-purple-800/50 rounded px-1 py-0.5 transition-colors"
        title="Click to view wallet details"
      >
        {isLoading ? (
          <span className="loading text-gray-400 font-sans">...</span>
        ) : error ? (
          <span className="disconnected text-gray-500 font-sans">--</span>
        ) : tokenData ? (
          <span className="balance text-white font-sans">
            {tokenData.userBalance !== undefined 
              ? <span className="font-medium">
                  <AnimatedFormattedNumber 
                    value={parseFloat(tokenData.userBalance.toString())} 
                    formatter={formatTokenBalance}
                    showChangeColor={true}
                  />
                </span>
              : <span className="font-medium">0</span>}
          </span>
        ) : (
          <span className="disconnected text-gray-500 font-sans">--</span>
        )}
      </button>
    );
  }

  // Standard detailed display
  return (
    <div className={`bg-dark-200/50 rounded-lg border border-dark-300 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-md font-semibold text-white flex items-center">
          <span>🪙</span>
          <span className="ml-2">Token Information</span>
        </h3>
        
        <button
          onClick={() => refetch()}
          className="text-xs bg-dark-400/50 hover:bg-dark-400 text-gray-300 rounded px-2 py-1 flex items-center"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </span>
          ) : (
            <span className="flex items-center">
              <svg className="w-3 h-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </span>
          )}
        </button>
      </div>

      {error ? (
        <div className="bg-red-900/20 border border-red-800/30 rounded p-3 text-red-300 text-sm">
          Error fetching token data: {error}
        </div>
      ) : isLoading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-700/50 rounded w-3/4"></div>
          <div className="h-4 bg-gray-700/50 rounded w-1/2"></div>
          <div className="h-4 bg-gray-700/50 rounded w-2/3"></div>
        </div>
      ) : tokenData ? (
        <div className="space-y-3">
          {/* User Balance (if wallet address provided) */}
          {tokenData.userBalance !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Your Balance:</span>
              <span className="text-white text-sm font-semibold">
                {formatNumber(tokenData.userBalance)}
                {tokenData.symbol ? ` ${tokenData.symbol}` : ''}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Token Address:</span>
            <a
              href={`https://solscan.io/token/${tokenData.mintAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-brand-300 hover:text-brand-200 font-mono flex items-center"
            >
              {`${tokenData.mintAddress.substring(0, 5)}...${tokenData.mintAddress.substring(tokenData.mintAddress.length - 5)}`}
              <svg className="w-3 h-3 ml-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          {showSupply && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Total Supply:</span>
              <span className="text-white text-sm font-semibold">
                {formatSupply(tokenData.supply, tokenData.decimals)} tokens
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Decimals:</span>
            <span className="text-white text-sm">{tokenData.decimals}</span>
          </div>

          {showHolders && tokenData.holders !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Holders:</span>
              <span className="text-white text-sm">{formatNumber(tokenData.holders)}</span>
            </div>
          )}

          {tokenData.symbol && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Symbol:</span>
              <span className="text-white text-sm">{tokenData.symbol}</span>
            </div>
          )}

          {tokenData.name && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Name:</span>
              <span className="text-white text-sm">{tokenData.name}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-400">
          No token data available
        </div>
      )}
    </div>
  );
};

export default SolanaTokenDisplay;