/**
 * Compact Balance Display Component
 * 
 * Shows wallet balances in a minimal, sleek format with K/M/B abbreviations.
 * Designed for header/navigation use where space is limited.
 */

import React from 'react';
import { config } from '../../config/config';
import SolanaTokenDisplay from '../SolanaTokenDisplay';
import SolanaWalletDisplay from '../SolanaWalletDisplay';

interface CompactBalanceProps {
  walletAddress: string;
  className?: string;
}

export const CompactBalance: React.FC<CompactBalanceProps> = ({
  walletAddress,
  className = ""
}) => {
  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      {/* SOL Balance - Enhanced Design */}
      <div className="group relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Main container */}
        <div className="relative px-2.5 py-1 bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-sm rounded-full border border-gray-600/30 group-hover:border-orange-400/40 transition-all duration-300">
          <div className="text-white">
            <SolanaWalletDisplay 
              walletAddress={walletAddress} 
              compact={true}
              className="text-[11px]"
            />
          </div>
        </div>
      </div>
      
      {/* DegenDuel Token - Enhanced Design */}
      <div className="group relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Main container */}
        <div className="relative px-2.5 py-1 bg-gradient-to-r from-purple-900/90 to-purple-800/90 backdrop-blur-sm rounded-full border border-purple-600/30 group-hover:border-purple-400/40 transition-all duration-300">
          <div className="text-purple-100">
            <SolanaTokenDisplay 
              mintAddress={config.SOLANA.DEGEN_TOKEN_ADDRESS}
              walletAddress={walletAddress}
              compact={true}
              className="text-[11px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};