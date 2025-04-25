/**
 * SolanaWalletDisplay Component
 * 
 * A component that displays wallet data fetched directly from the Solana blockchain.
 * Supports both detailed and compact display modes.
 * 
 * @author Claude
 * @created 2025-04-24
 * @updated 2025-04-25 - Added compact mode for user menu and header displays
 */

import React, { useState } from 'react';
import { useSolanaWalletData } from '../hooks/useSolanaWalletData';
import { format } from 'date-fns';

interface SolanaWalletDisplayProps {
  walletAddress?: string;
  showTokens?: boolean;
  showTransactions?: boolean;
  compact?: boolean;       // Compact mode for headers and menus
  className?: string;
}

export const SolanaWalletDisplay: React.FC<SolanaWalletDisplayProps> = ({
  walletAddress,
  showTokens = true,
  showTransactions = true,
  compact = false,
  className = '',
}) => {
  const { walletData, isLoading, error, refresh } = useSolanaWalletData(walletAddress);
  const [activeTab, setActiveTab] = useState<'overview' | 'tokens' | 'transactions'>('overview');

  // Format wallet address for display
  const formatAddress = (address: string): string => {
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  // Format SOL balance
  const formatSOL = (balance: number): string => {
    return balance.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 });
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number | null): string => {
    if (timestamp === null) return 'Unknown';
    return format(new Date(timestamp * 1000), 'MMM d, yyyy h:mm a');
  };

  // Compact display for headers and menus
  if (compact) {
    if (!walletAddress) {
      return <div className="solana-balance-compact"><span className="disconnected">--</span></div>;
    }
    
    return (
      <div className="solana-balance-compact">
        {isLoading ? (
          <span className="loading">...</span>
        ) : error ? (
          <span className="disconnected">--</span>
        ) : walletData ? (
          <span className="balance">{formatSOL(walletData.balance)} SOL</span>
        ) : (
          <span className="disconnected">--</span>
        )}
      </div>
    );
  }

  // Show error message if no wallet address provided for detailed view
  if (!walletAddress && !compact) {
    return (
      <div className={`bg-dark-200/50 rounded-lg border border-dark-300 p-4 ${className}`}>
        <div className="text-center text-gray-400 py-4">
          No wallet address provided
        </div>
      </div>
    );
  }

  // Standard detailed display
  return (
    <div className={`bg-dark-200/50 rounded-lg border border-dark-300 ${className}`}>
      <div className="p-4 border-b border-dark-300">
        <div className="flex items-center justify-between">
          <h3 className="text-md font-semibold text-white flex items-center">
            <span>👛</span>
            <span className="ml-2">Wallet Information</span>
          </h3>
          
          <button
            onClick={() => refresh()}
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
      </div>

      {error ? (
        <div className="p-4">
          <div className="bg-red-900/20 border border-red-800/30 rounded p-3 text-red-300 text-sm">
            Error fetching wallet data: {error}
          </div>
        </div>
      ) : isLoading ? (
        <div className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-700/50 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700/50 rounded w-1/2"></div>
            <div className="h-4 bg-gray-700/50 rounded w-2/3"></div>
          </div>
        </div>
      ) : walletData ? (
        <>
          {/* Tabs */}
          <div className="border-b border-dark-300">
            <div className="flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'overview'
                    ? 'text-brand-300 border-b-2 border-brand-500'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Overview
              </button>
              
              {showTokens && (
                <button
                  onClick={() => setActiveTab('tokens')}
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'tokens'
                      ? 'text-brand-300 border-b-2 border-brand-500'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Tokens {walletData.tokenBalances.length > 0 && `(${walletData.tokenBalances.length})`}
                </button>
              )}
              
              {showTransactions && (
                <button
                  onClick={() => setActiveTab('transactions')}
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'transactions'
                      ? 'text-brand-300 border-b-2 border-brand-500'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Transactions {walletData.recentTransactions.length > 0 && `(${walletData.recentTransactions.length})`}
                </button>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {activeTab === 'overview' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Wallet Address:</span>
                  <a
                    href={`https://solscan.io/account/${walletData.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-brand-300 hover:text-brand-200 font-mono flex items-center"
                  >
                    {walletData.address}
                    <svg className="w-3 h-3 ml-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">SOL Balance:</span>
                  <span className="text-white text-sm font-semibold">
                    {formatSOL(walletData.balance)} SOL
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Token Types:</span>
                  <span className="text-white text-sm">
                    {walletData.tokenBalances.length}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Recent Transactions:</span>
                  <span className="text-white text-sm">
                    {walletData.recentTransactions.length}
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'tokens' && (
              <div>
                {walletData.tokenBalances.length === 0 ? (
                  <div className="text-center py-6 text-gray-400">
                    No tokens found for this wallet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {walletData.tokenBalances.map((token) => (
                      <div key={token.mint} className="bg-dark-300/40 rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <a
                            href={`https://solscan.io/token/${token.mint}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-brand-300 hover:text-brand-200 font-mono flex items-center mb-1"
                          >
                            {formatAddress(token.mint)}
                            <svg className="w-3 h-3 ml-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                          <div className="text-xs text-gray-400">
                            Decimals: {token.decimals}
                          </div>
                        </div>
                        <div className="text-white text-sm font-semibold">
                          {token.uiBalance === 0 
                            ? '0'
                            : token.uiBalance < 0.001 
                              ? '< 0.001' 
                              : token.uiBalance.toLocaleString(undefined, {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: token.uiBalance < 0.1 ? 6 : 4,
                                })
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'transactions' && (
              <div>
                {walletData.recentTransactions.length === 0 ? (
                  <div className="text-center py-6 text-gray-400">
                    No recent transactions found
                  </div>
                ) : (
                  <div className="space-y-2">
                    {walletData.recentTransactions.map((tx) => (
                      <div key={tx.signature} className="bg-dark-300/40 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <a
                            href={`https://solscan.io/tx/${tx.signature}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-brand-300 hover:text-brand-200 font-mono flex items-center"
                          >
                            {formatAddress(tx.signature)}
                            <svg className="w-3 h-3 ml-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              tx.successful
                                ? 'bg-green-900/30 text-green-400'
                                : 'bg-red-900/30 text-red-400'
                            }`}
                          >
                            {tx.successful ? 'Success' : 'Failed'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                          <div>
                            <span className="text-gray-400">Time:</span>
                            <span className="text-white ml-2">
                              {tx.timestamp ? formatTimestamp(tx.timestamp) : 'Unknown'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Fee:</span>
                            <span className="text-white ml-2">
                              {(tx.fee / 1_000_000_000).toFixed(6)} SOL
                            </span>
                          </div>
                        </div>

                        {tx.error && (
                          <div className="text-xs text-red-400 bg-red-900/20 rounded p-1 mb-2">
                            Error: {tx.error}
                          </div>
                        )}

                        {(tx.senders.length > 0 || tx.receivers.length > 0) && (
                          <div className="text-xs grid grid-cols-2 gap-2">
                            {tx.senders.length > 0 && (
                              <div>
                                <div className="text-gray-400 mb-1">Sender(s):</div>
                                <div className="space-y-1">
                                  {tx.senders.map((sender, index) => (
                                    <div key={index} className="font-mono bg-dark-400/30 p-1 rounded truncate">
                                      {sender}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {tx.receivers.length > 0 && (
                              <div>
                                <div className="text-gray-400 mb-1">Receiver(s):</div>
                                <div className="space-y-1">
                                  {tx.receivers.map((receiver, index) => (
                                    <div key={index} className="font-mono bg-dark-400/30 p-1 rounded truncate">
                                      {receiver}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="p-4 text-center py-6 text-gray-400">
          No wallet data available
        </div>
      )}
    </div>
  );
};

export default SolanaWalletDisplay;