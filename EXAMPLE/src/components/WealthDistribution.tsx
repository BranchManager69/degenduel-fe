import React, { useMemo, useState } from 'react';
import { BarChart2, ArrowUpDown, Wallet as LucideWallet, CircleDollarSign, TrendingUp } from 'lucide-react';
import type { Wallet } from '../types';
import { TOKEN_TICKER, formatToken, formatSol, formatUsd, TOTAL_SUPPLY, SOL_TO_USD } from '../config';

type SortField = 'name' | 'tokenBalance' | 'tokenValue' | 'solValue' | 'total' | 'percentage';
type SortDirection = 'asc' | 'desc';

interface WealthDistributionProps {
  wallets: Wallet[];
  showSummary?: boolean;
}

export function WealthDistribution({ wallets, showSummary = false }: WealthDistributionProps) {
  const [sortField, setSortField] = useState<SortField>('total');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const totalTokenBalance = wallets.reduce((sum, wallet) => sum + parseFloat(wallet.tokenBalance), 0);
  const totalSolBalance = wallets.reduce((sum, wallet) => sum + parseFloat(wallet.solBalance), 0);
  const totalTokenValue = wallets.reduce((sum, wallet) => sum + parseFloat(wallet.tokenValue), 0);
  const totalValue = totalTokenValue + totalSolBalance;
  const totalValueUsd = totalValue * SOL_TO_USD;

  const [hoveredWallet, setHoveredWallet] = useState<string | null>(null);

  const distribution = useMemo(() => {
    const data = wallets.map(wallet => ({
      name: wallet.name,
      tokenValue: parseFloat(wallet.tokenValue),
      solValue: parseFloat(wallet.solBalance),
      total: parseFloat(wallet.tokenValue) + parseFloat(wallet.solBalance),
      totalUsd: (parseFloat(wallet.tokenValue) + parseFloat(wallet.solBalance)) * SOL_TO_USD,
      tokenPercentage: (parseFloat(wallet.tokenValue) / (parseFloat(wallet.tokenValue) + parseFloat(wallet.solBalance))) * 100,
      tokenBalance: parseFloat(wallet.tokenBalance),
    }));

    const totalValue = data.reduce((sum, w) => sum + w.total, 0);
    return data.map(w => ({
      ...w,
      percentage: (w.total / totalValue) * 100
    }));
  }, [wallets]);

  const sortedDistribution = useMemo(() => {
    return [...distribution].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'tokenBalance':
          comparison = a.tokenBalance - b.tokenBalance;
          break;
        case 'tokenValue':
          comparison = a.tokenValue - b.tokenValue;
          break;
        case 'solValue':
          comparison = a.solValue - b.solValue;
          break;
        case 'total':
          comparison = a.total - b.total;
          break;
        case 'percentage':
          comparison = a.percentage - b.percentage;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [distribution, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortButton = ({ field, children }: { field: SortField, children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
    >
      {children}
      <ArrowUpDown className={`w-4 h-4 ${sortField === field ? 'text-indigo-600' : 'text-gray-400'}`} />
    </button>
  );

  const summaryStats = [
    { 
      label: 'Total Token Balance', 
      value: formatToken(totalTokenBalance.toFixed(2)), 
      subValue: formatUsd((totalTokenValue * SOL_TO_USD).toFixed(2)), 
      icon: CircleDollarSign,
      subtext: `${((totalTokenBalance / TOTAL_SUPPLY) * 100).toFixed(2)}% of total supply`
    },
    { 
      label: 'Total SOL Balance', 
      value: formatSol(totalSolBalance.toFixed(2)), 
      subValue: formatUsd((totalSolBalance * SOL_TO_USD).toFixed(2)),
      icon: LucideWallet 
    },
    { 
      label: 'Total Portfolio Value', 
      value: formatSol(totalValue.toFixed(2)), 
      subValue: formatUsd(totalValueUsd.toFixed(2)),
      icon: CircleDollarSign
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <BarChart2 className="w-6 h-6 text-indigo-600" />
        </div>
        <h2 className="text-xl font-semibold">Portfolio Overview</h2>
      </div>

      {showSummary && (
        <div className="space-y-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {summaryStats.map((stat, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <stat.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.subValue}</p>
                  {stat.subtext && <p className="text-xs text-gray-500">{stat.subtext}</p>}
                </div>
              </div>
            ))}
          </div>
          
          {/* Portfolio Distribution Visualization */}
          <div className="bg-white rounded-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Portfolio Distribution</h3>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-indigo-600 rounded-sm" />
                  <span className="text-gray-600">Token Value</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-gray-200 rounded-sm" />
                  <span className="text-gray-600">SOL Value</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {sortedDistribution.map((wallet) => (
                <div 
                  key={wallet.name}
                  className="space-y-2"
                  onMouseEnter={() => setHoveredWallet(wallet.name)}
                  onMouseLeave={() => setHoveredWallet(null)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded transition-colors ${
                        hoveredWallet === wallet.name ? 'bg-indigo-100' : 'bg-gray-100'
                      }`}>
                        <TrendingUp className={`w-4 h-4 ${
                          hoveredWallet === wallet.name ? 'text-indigo-600' : 'text-gray-500'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{wallet.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatSol((wallet.tokenValue + wallet.solValue).toFixed(2))}
                          <span className="mx-1">•</span>
                          {formatUsd(wallet.totalUsd.toFixed(2))}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{wallet.percentage.toFixed(1)}%</p>
                      <p className="text-sm text-gray-500">of portfolio</p>
                    </div>
                  </div>
                  
                  {/* Stacked Bar */}
                  <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-indigo-600 transition-all duration-200"
                      style={{ width: `${wallet.tokenPercentage}%` }}
                    />
                  </div>
                  
                  {/* Value Breakdown */}
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>
                      Token: {formatSol(wallet.tokenValue.toFixed(2))} ({wallet.tokenPercentage.toFixed(1)}%)
                    </span>
                    <span>
                      SOL: {formatSol(wallet.solValue.toFixed(2))} ({(100 - wallet.tokenPercentage).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4">
                <SortButton field="name">Wallet</SortButton>
              </th>
              <th className="text-right py-3 px-4">
                <SortButton field="tokenBalance">{TOKEN_TICKER} Balance</SortButton>
              </th>
              <th className="text-right py-3 px-4">
                <SortButton field="tokenValue">{TOKEN_TICKER} Value</SortButton>
              </th>
              <th className="text-right py-3 px-4">
                <SortButton field="solValue">SOL Balance</SortButton>
              </th>
              <th className="text-right py-3 px-4">
                <SortButton field="total">Total Value</SortButton>
              </th>
              <th className="text-right py-3 px-4">
                <SortButton field="percentage">% of Portfolio</SortButton>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedDistribution.map((wallet) => (
              <tr key={wallet.name} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">{wallet.name}</td>
                <td className="text-right py-3 px-4 font-mono">
                  {wallet.tokenBalance.toFixed(2)}
                </td>
                <td className="text-right py-3 px-4 font-mono">
                  {formatSol(wallet.tokenValue.toFixed(2))}
                </td>
                <td className="text-right py-3 px-4 font-mono">
                  {formatSol(wallet.solValue.toFixed(2))}
                </td>
                <td className="text-right py-3 px-4 font-mono">
                  {formatSol((wallet.tokenValue + wallet.solValue).toFixed(2))}
                </td>
                <td className="text-right py-3 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600"
                        style={{ width: `${wallet.percentage}%` }}
                      />
                    </div>
                    <span>{wallet.percentage.toFixed(1)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default WealthDistribution;