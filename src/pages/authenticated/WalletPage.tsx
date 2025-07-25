import React from 'react';
import { DuelBalanceChart } from '../../components/DuelBalanceChart';
import { DuelSnapshotChart } from '../../components/DuelSnapshotChart';
import { DuelSnapshotTable } from '../../components/DuelSnapshotTable';
import { RevenueShareDiagram } from '../../components/RevenueShareDiagram';
import { WalletPortfolioTable } from '../../components/WalletPortfolioTable';
import { useStore } from '../../store/useStore';

/**
 * Wallet Page Component
 * 
 * Displays the user's wallet balances and transactions with direct blockchain data
 * 
 * @updated 2025-04-25 - Using new Solana components with direct blockchain access
 */
const WalletPage: React.FC = () => {
  const { user } = useStore();
  const walletAddress = user?.wallet_address;

  if (!walletAddress) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-400 text-center">
          <p className="text-xl mb-2">No wallet connected</p>
          <p className="text-sm">Please connect your wallet to view your balances</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-4">Degen Dividends</h1>
      
      {/* Revenue Share Diagram */}
      <RevenueShareDiagram />
      
      {/* Profile Header */}
      <div className="flex items-center gap-3 mb-8">
        {user?.profile_image_url && (
          <img 
            src={user.profile_image_url} 
            alt={user.nickname || ''}
            className="w-14 h-14 rounded-full border-2 border-brand-500/30"
          />
        )}
        <div>
          <div className="flex items-center gap-3">
            <p className="text-xl font-medium text-white">
              {user?.nickname || 'Unknown'}
            </p>
            {walletAddress && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(walletAddress);
                  // You might want to add a toast notification here
                }}
                className="text-gray-400 hover:text-gray-300 transition-colors flex items-center gap-1 text-sm font-mono bg-dark-300/50 px-2 py-1 rounded"
              >
                {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="font-mono text-brand-400">LVL {user?.user_level?.level_number || 0}</span>
            <span className="text-gray-400">{(user?.experience_points || 0).toLocaleString()} XP</span>
            <span className="text-amber-400 font-medium">
              {user?.user_level?.title || 'Unranked'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Charts - side by side on wider screens */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* DUEL Holdings Over Time */}
        <div className="bg-dark-200/60 backdrop-blur-sm rounded-lg border border-gray-700/30 shadow-lg p-6">
          <DuelBalanceChart height={400} />
        </div>
        
        {/* DUEL Snapshot Chart */}
        <div className="bg-dark-200/60 backdrop-blur-sm rounded-lg border border-gray-700/30 shadow-lg p-6">
          <DuelSnapshotChart height={400} />
        </div>
      </div>
      
      {/* Snapshot Data Table */}
      <div className="mt-8">
        <DuelSnapshotTable />
      </div>
      
      {/* Portfolio Holdings Table */}
      <div className="mt-8 bg-dark-200/60 backdrop-blur-sm rounded-lg border border-gray-700/30 shadow-lg p-6">
        <WalletPortfolioTable />
      </div>
    </div>
  );
};

export default WalletPage;