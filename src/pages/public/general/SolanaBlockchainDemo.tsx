/**
 * SolanaBlockchainDemo Page
 * 
 * This page demonstrates direct blockchain data retrieval using the Solana connection provider.
 * It showcases both token data and wallet data fetched directly from Solana.
 * 
 * @author Claude
 * @created 2025-04-24
 */

import React, { useState } from 'react';
import SolanaTokenDisplay from '../../../components/SolanaTokenDisplay';
import SolanaWalletDisplay from '../../../components/SolanaWalletDisplay';
import { useSolanaConnection } from '../../../contexts/SolanaConnectionContext';

const SolanaBlockchainDemo: React.FC = () => {
  const { connectionTier, rpcEndpoint } = useSolanaConnection();
  const [mintAddress, setMintAddress] = useState<string>('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC by default
  const [walletAddress, setWalletAddress] = useState<string>('9vYWHBPz817wJdQpE6QNZ4seazMnKTRfSgSjzLQSbFeT'); // Sample wallet
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">Solana Blockchain Demo</h1>
      
      {/* RPC Connection Status */}
      <div className="bg-dark-200/50 rounded-lg border border-dark-300 p-4 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">RPC Connection Status</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Connection Tier:</span>
            <span className={`font-semibold ${
              connectionTier === 'admin' 
                ? 'text-purple-400' 
                : connectionTier === 'user' 
                  ? 'text-blue-400' 
                  : 'text-gray-400'
            }`}>
              {connectionTier.charAt(0).toUpperCase() + connectionTier.slice(1)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">RPC Endpoint:</span>
            <span className="text-brand-300 font-mono text-sm">{rpcEndpoint}</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Token Data Section */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Token Data</h2>
          <div className="bg-dark-200/50 rounded-lg border border-dark-300 p-4 mb-4">
            <label className="block text-gray-400 mb-2">Token Mint Address:</label>
            <div className="flex">
              <input
                type="text"
                value={mintAddress}
                onChange={(e) => setMintAddress(e.target.value)}
                className="flex-1 bg-dark-300 border border-dark-400 rounded-l px-3 py-2 text-white"
                placeholder="Enter token mint address"
              />
              <button
                onClick={() => setMintAddress('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')}
                className="bg-brand-900/50 text-brand-300 px-3 py-2 rounded-r border border-brand-700/50"
                title="Set to USDC address"
              >
                USDC
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Try with different tokens: USDC, SOL, or any SPL token address
            </div>
          </div>
          
          <SolanaTokenDisplay
            mintAddress={mintAddress}
            showSupply={true}
            showHolders={connectionTier === 'admin'}
          />
        </div>
        
        {/* Wallet Data Section */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Wallet Data</h2>
          <div className="bg-dark-200/50 rounded-lg border border-dark-300 p-4 mb-4">
            <label className="block text-gray-400 mb-2">Wallet Address:</label>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
              placeholder="Enter wallet address"
            />
            <div className="mt-2 text-xs text-gray-500">
              Enter any Solana wallet address to view its details and transactions
            </div>
          </div>
          
          <SolanaWalletDisplay
            walletAddress={walletAddress}
            showTokens={true}
            showTransactions={true}
          />
        </div>
      </div>
      
      <div className="mt-8 bg-dark-200/50 rounded-lg border border-dark-300 p-4">
        <h2 className="text-xl font-semibold text-white mb-4">About This Demo</h2>
        <p className="text-gray-300 mb-3">
          This page demonstrates direct interaction with the Solana blockchain using our tiered RPC proxy system. The system automatically selects the appropriate RPC endpoint based on your user role:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li><strong className="text-gray-200">Public Tier:</strong> Limited to 10 requests per minute, available to all visitors even without login.</li>
          <li><strong className="text-blue-300">User Tier:</strong> Standard rate limit of 120 requests per minute, available to authenticated users.</li>
          <li><strong className="text-purple-300">Admin Tier:</strong> High-volume tier with 1000 requests per minute, available to admin users.</li>
        </ul>
        <p className="text-gray-300 mt-3">
          All blockchain data is fetched in real-time directly from the Solana network through our secure RPC proxy, which protects our API keys while ensuring optimal performance.
        </p>
      </div>
    </div>
  );
};

export default SolanaBlockchainDemo;