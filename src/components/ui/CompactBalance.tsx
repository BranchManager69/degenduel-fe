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
  showLabels?: boolean;
}

export const CompactBalance: React.FC<CompactBalanceProps> = ({
  walletAddress,
  className = "",
  showLabels = true
}) => {
  return (
    <div className={`flex items-center gap-1.5 text-xs ${className}`}>
      {/* SOL Balance */}
      <div className="flex items-center gap-1 px-2 py-1 bg-gray-800/60 rounded-full border border-gray-700/50">
        {showLabels && <span className="text-gray-400 text-[10px]">SOL</span>}
        <div className="text-white font-medium">
          <SolanaWalletDisplay 
            walletAddress={walletAddress} 
            compact={true}
            className="text-[11px]"
          />
        </div>
      </div>
      
      {/* DegenDuel Token */}
      <div className="flex items-center gap-1 px-2 py-1 bg-brand-800/60 rounded-full border border-brand-700/50">
        {showLabels && <span className="text-brand-400 text-[10px]">DD</span>}
        <div className="text-brand-200 font-medium">
          <SolanaTokenDisplay 
            mintAddress={config.SOLANA.DEGEN_TOKEN_ADDRESS}
            walletAddress={walletAddress}
            compact={true}
            className="text-[11px]"
          />
        </div>
      </div>
    </div>
  );
};