import React from 'react';
import TokenBalance from '../../components/TokenBalance';
import SolanaBalance from '../../components/SolanaBalance';
import { useStore } from '../../store/useStore';

/**
 * Wallet Page Component
 * 
 * Displays the user's wallet balances and transactions
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
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Your Wallet</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Solana Balance Card */}
        <div className="bg-dark-200/60 backdrop-blur-sm rounded-lg border border-brand-500/20 shadow-lg p-6">
          <SolanaBalance walletAddress={walletAddress} />
        </div>
        
        {/* Token Balances Card */}
        <div className="bg-dark-200/60 backdrop-blur-sm rounded-lg border border-brand-500/20 shadow-lg p-6">
          <TokenBalance walletAddress={walletAddress} />
        </div>
      </div>
      
      {/* Transactions section could be added here in the future */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold text-white mb-6">Recent Transactions</h2>
        <div className="bg-dark-200/60 backdrop-blur-sm rounded-lg border border-brand-500/20 shadow-lg p-6">
          <p className="text-gray-400 text-center py-10">
            Transaction history coming soon
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;