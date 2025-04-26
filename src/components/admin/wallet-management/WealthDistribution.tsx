import { SummaryPanel } from './SummaryPanel';
import type { Wallet } from './types';

interface WealthDistributionProps {
  wallets: Wallet[];
  showSummary?: boolean;
}

export function WealthDistribution({ wallets, showSummary = false }: WealthDistributionProps) {
  // Calculate total values
  const totalTokenBalance = wallets.reduce((sum, wallet) => sum + parseFloat(wallet.tokenBalance), 0);
  const totalSolBalance = wallets.reduce((sum, wallet) => sum + parseFloat(wallet.solBalance), 0);
  
  // Sort wallets by token balance for display
  const sortedWallets = [...wallets].sort((a, b) => parseFloat(b.tokenBalance) - parseFloat(a.tokenBalance));
  
  // Calculate percentages
  const walletPercentages = sortedWallets.map(wallet => ({
    name: wallet.name,
    tokenPercentage: (parseFloat(wallet.tokenBalance) / totalTokenBalance) * 100,
    solPercentage: (parseFloat(wallet.solBalance) / totalSolBalance) * 100
  }));
  
  // Colors for the chart
  const colors = [
    'bg-brand-500', 'bg-cyan-500', 'bg-purple-500', 'bg-emerald-500', 
    'bg-amber-500', 'bg-red-500', 'bg-blue-500', 'bg-fuchsia-500'
  ];

  return (
    <div className="space-y-6">
      {showSummary && <SummaryPanel wallets={wallets} />}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Token Distribution */}
        <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-4 border border-dark-400">
          <h3 className="text-lg font-medium text-gray-200 mb-4">Token Distribution</h3>
          
          <div className="h-6 flex rounded-full overflow-hidden mb-2">
            {walletPercentages.map((wallet, index) => (
              <div
                key={index}
                className={`${colors[index % colors.length]} relative group`}
                style={{ width: `${wallet.tokenPercentage}%` }}
              >
                <div className="opacity-0 group-hover:opacity-100 absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-2 bg-dark-400 rounded text-xs text-white whitespace-nowrap transition-opacity z-10">
                  {wallet.name}: {wallet.tokenPercentage.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
          
          <div className="space-y-3">
            {walletPercentages.map((wallet, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]} mr-2`}></div>
                <div className="flex-1 text-gray-300 text-sm">{wallet.name}</div>
                <div className="text-gray-400 text-sm">{wallet.tokenPercentage.toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* SOL Distribution */}
        <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-4 border border-dark-400">
          <h3 className="text-lg font-medium text-gray-200 mb-4">SOL Distribution</h3>
          
          <div className="h-6 flex rounded-full overflow-hidden mb-2">
            {walletPercentages.map((wallet, index) => (
              <div
                key={index}
                className={`${colors[index % colors.length]} relative group`}
                style={{ width: `${wallet.solPercentage}%` }}
              >
                <div className="opacity-0 group-hover:opacity-100 absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-2 bg-dark-400 rounded text-xs text-white whitespace-nowrap transition-opacity z-10">
                  {wallet.name}: {wallet.solPercentage.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
          
          <div className="space-y-3">
            {walletPercentages.map((wallet, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]} mr-2`}></div>
                <div className="flex-1 text-gray-300 text-sm">{wallet.name}</div>
                <div className="text-gray-400 text-sm">{wallet.solPercentage.toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}