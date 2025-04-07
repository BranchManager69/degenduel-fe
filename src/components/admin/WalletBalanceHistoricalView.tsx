// src/components/admin/WalletBalanceHistoricalView.tsx

import React, { useState } from 'react';
import HistoricalPerformanceChart from './HistoricalPerformanceChart';
import { useUnifiedWebSocket } from '../../hooks/websocket/useUnifiedWebSocket';

interface WalletBalanceHistoricalViewProps {
  className?: string;
}

export const WalletBalanceHistoricalView: React.FC<WalletBalanceHistoricalViewProps> = ({
  className = '',
}) => {
  const [activeView, setActiveView] = useState<string>('total');
  const [searchWallet, setSearchWallet] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  // Provide required parameters to useUnifiedWebSocket hook
  const { isConnected, isAuthenticated, request } = useUnifiedWebSocket(
    'wallet-historical-view', // Unique ID for this component
    ['DATA'], // Message types to listen for
    () => {} // Empty callback since we're not using the subscription directly
  );
  
  const views = [
    { id: 'total', label: 'Total Platform Balance' },
    { id: 'average', label: 'Average User Balance' },
    { id: 'top', label: 'Top 10 Wallets' },
    { id: 'specific', label: 'Specific Wallet' },
  ];
  
  const handleSearch = async () => {
    if (!searchWallet || !isConnected || !isAuthenticated) return;
    
    setIsSearching(true);
    
    try {
      // Check if wallet exists first with proper type assertion
      const walletExists = await request('admin', 'wallet-balance/exists', { 
        wallet: searchWallet 
      }) as unknown as { 
        success: boolean; 
        data: { exists: boolean } 
      };
      
      // Add type check to validate response format before accessing properties
      if (!walletExists || typeof walletExists !== 'object' || !('success' in walletExists) || 
          !('data' in walletExists) || !walletExists.success || 
          !walletExists.data || !walletExists.data.exists) {
        throw new Error('Wallet not found or has no balance history');
      }
      
      // If wallet exists, switch to specific wallet view
      setActiveView('specific');
    } catch (error) {
      console.error('Error searching for wallet:', error);
      
      // Show error toast or notification
      // toast.error(error instanceof Error ? error.message : 'Error searching for wallet'); 
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="bg-dark-200/50 backdrop-blur-sm border border-brand-500/20 rounded-lg p-4">
        <h2 className="text-xl font-bold font-cyber tracking-wider bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent mb-4">
          WALLET BALANCE HISTORY
        </h2>
        
        <div className="mb-4">
          <p className="text-gray-300">
            Track how user wallet balances have changed over time. Monitor platform growth, individual users, or specific wallet activity.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeView === view.id
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                  : 'bg-dark-300/50 text-gray-400 border border-dark-400/30 hover:bg-dark-300/80'
              }`}
            >
              {view.label}
            </button>
          ))}
        </div>
        
        {/* Wallet search input for specific wallet view */}
        {activeView === 'specific' && (
          <div className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchWallet}
                onChange={(e) => setSearchWallet(e.target.value)}
                placeholder="Enter wallet address..."
                className="flex-1 bg-dark-300/50 border border-dark-400/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
              />
              <button
                onClick={handleSearch}
                disabled={!searchWallet || isSearching || !isConnected || !isAuthenticated}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  !searchWallet || isSearching || !isConnected || !isAuthenticated
                    ? 'bg-brand-500/20 text-brand-400/50 cursor-not-allowed'
                    : 'bg-brand-500/30 hover:bg-brand-500/40 text-brand-300'
                }`}
              >
                {isSearching ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin mr-2"></div>
                    Searching...
                  </div>
                ) : (
                  'Search'
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter a wallet address to view its balance history
            </p>
          </div>
        )}
        
        <HistoricalPerformanceChart
          title={
            activeView === 'total' ? 'Total Platform Balance' :
            activeView === 'average' ? 'Average User Balance' :
            activeView === 'top' ? 'Top 10 Wallets by Balance' :
            `Wallet Balance: ${searchWallet.slice(0, 6)}...${searchWallet.slice(-4)}`
          }
          description={
            activeView === 'specific' 
              ? 'Balance history for the specified wallet address'
              : 'SOL balances tracked over time across the platform'
          }
          dataType="wallet-balances"
          yAxisLabel="Balance (SOL)"
          yAxisValueFormatter={(value) => `${value.toFixed(2)}`}
        />
      </div>
      
      {/* Balance Insights Panel */}
      <div className="bg-dark-200/50 backdrop-blur-sm border border-brand-500/20 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-200 mb-3">
          Balance Insights
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-dark-300/50 rounded-lg p-3 border border-dark-400/50">
            <h4 className="text-brand-400 font-medium text-sm mb-2">Platform Growth</h4>
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold text-brand-300">+12.4%</span>
              <span className="text-xs text-gray-400">last 30 days</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Total SOL balance across all monitored wallets has increased by 12.4% in the last month.
            </p>
          </div>
          
          <div className="bg-dark-300/50 rounded-lg p-3 border border-dark-400/50">
            <h4 className="text-amber-400 font-medium text-sm mb-2">Top Users Trend</h4>
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold text-amber-300">+5.7%</span>
              <span className="text-xs text-gray-400">weekly average</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              High-value users (top 10% by balance) showed consistent growth of 5.7% per week.
            </p>
          </div>
          
          <div className="bg-dark-300/50 rounded-lg p-3 border border-dark-400/50">
            <h4 className="text-emerald-400 font-medium text-sm mb-2">New User Activity</h4>
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold text-emerald-300">42</span>
              <span className="text-xs text-gray-400">new active wallets</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              42 new user wallets became active with significant balances in the last 7 days.
            </p>
          </div>
          
          <div className="bg-dark-300/50 rounded-lg p-3 border border-dark-400/50">
            <h4 className="text-purple-400 font-medium text-sm mb-2">Highest Balance Change</h4>
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold text-purple-300">+621.5 SOL</span>
              <span className="text-xs text-gray-400">single wallet, 24h</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              The largest 24-hour balance increase was 621.5 SOL in a single wallet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletBalanceHistoricalView;