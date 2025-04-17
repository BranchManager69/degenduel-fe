import { Wallet, CircleDollarSign } from 'lucide-react';
import type { Wallet as WalletType } from './types';
import { formatToken, formatSol, TOTAL_SUPPLY } from './config';

interface SummaryPanelProps {
  wallets: WalletType[];
}

export function SummaryPanel({ wallets }: SummaryPanelProps) {
  const totalTokenBalance = wallets.reduce((sum, wallet) => sum + parseFloat(wallet.tokenBalance), 0);
  const totalSolBalance = wallets.reduce((sum, wallet) => sum + parseFloat(wallet.solBalance), 0);
  const totalTokenValue = wallets.reduce((sum, wallet) => sum + parseFloat(wallet.tokenValue), 0);
  const totalValue = totalTokenValue + totalSolBalance;

  const stats = [
    { label: 'Total Token Balance', value: formatToken(totalTokenBalance.toFixed(2)), icon: CircleDollarSign },
    { label: 'Total SOL Balance', value: formatSol(totalSolBalance.toFixed(2)), icon: Wallet },
    { label: 'Total Value (in SOL)', value: formatSol(totalValue.toFixed(2)), icon: CircleDollarSign, 
      subtext: `${((totalTokenBalance / TOTAL_SUPPLY) * 100).toFixed(2)}% of total supply` },
  ];

  return (
    <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg border border-dark-400 p-6">
      <h2 className="text-xl font-semibold text-gray-200 mb-4">Portfolio Summary</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="p-2 bg-brand-500/10 rounded-lg">
              <stat.icon className="w-6 h-6 text-brand-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">{stat.label}</p>
              <p className="text-lg font-semibold text-gray-200">{stat.value}</p>
              {stat.subtext && <p className="text-xs text-gray-500">{stat.subtext}</p>}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <div className="h-4 bg-dark-400 rounded-full overflow-hidden">
          <div 
            className="h-full bg-brand-500"
            style={{ 
              width: `${(totalTokenValue / totalValue) * 100}%`
            }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-400">
          <span>Token Value: {((totalTokenValue / totalValue) * 100).toFixed(1)}%</span>
          <span>SOL: {((totalSolBalance / totalValue) * 100).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}