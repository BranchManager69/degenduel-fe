import React from 'react';
import { DuelBalanceChart } from '../../components/DuelBalanceChart';
import { DuelSnapshotChart } from '../../components/DuelSnapshotChart';
import { DuelSnapshotTable } from '../../components/DuelSnapshotTable';
import { ProfileHeader } from '../../components/ProfileHeader';
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

  if (!user?.wallet_address) {
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
      {/* Header with title and profile */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-white">Degen Dividends</h1>
        <ProfileHeader user={user} />
      </div>
      
      {/* Revenue Share Diagram */}
      <RevenueShareDiagram />
      
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