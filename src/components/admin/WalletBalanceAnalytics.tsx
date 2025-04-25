import React, { useEffect, useState, useMemo } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

// Types for wallet balances
interface WalletBalance {
  id: number;
  wallet_address: string;
  nickname: string | null;
  username: string | null;
  role: string;
  experience_points: number;
  balance_lamports: string;
  balance_sol: number;
  last_updated: string;
}

interface WalletBalancePagination {
  page: number;
  limit: number;
  totalBalances: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface WalletBalanceSummary {
  totalWallets: number;
  nonZeroWallets: number;
  zeroWallets: number;
  totalSol: number;
  avgSol: number;
}

interface WalletBalancesResponse {
  success: boolean;
  balances: WalletBalance[];
  pagination: WalletBalancePagination;
  summary: WalletBalanceSummary;
  error?: string;
}

// Interface to define sorting options
interface SortOption {
  label: string;
  value: string;
  direction: 'asc' | 'desc';
}

// Define balance tiers for color coding and distribution chart
const BALANCE_TIERS = [
  { name: 'Zero', min: 0, max: 0, color: 'gray-500' },
  { name: 'Micro', min: 0.000001, max: 0.1, color: 'blue-500' },
  { name: 'Small', min: 0.1, max: 1, color: 'green-500' },
  { name: 'Medium', min: 1, max: 10, color: 'yellow-500' },
  { name: 'Large', min: 10, max: 100, color: 'orange-500' },
  { name: 'Whale', min: 100, max: Infinity, color: 'red-500' }
];

// Get tier for a given balance
const getBalanceTier = (balance: number) => {
  if (balance === 0) return BALANCE_TIERS[0];
  for (const tier of BALANCE_TIERS.slice(1)) {
    if (balance >= tier.min && balance < tier.max) {
      return tier;
    }
  }
  return BALANCE_TIERS[BALANCE_TIERS.length - 1];
};

export const WalletBalanceAnalytics: React.FC = () => {
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);
  const [pagination, setPagination] = useState<WalletBalancePagination | null>(null);
  const [summary, setSummary] = useState<WalletBalanceSummary | null>(null);
  const [nonZeroOnly, setNonZeroOnly] = useState(false);
  const [sortBy, setSortBy] = useState<string>('balance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshingCache, setIsRefreshingCache] = useState(false);
  const [cacheRefreshMessage, setCacheRefreshMessage] = useState<string | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<WalletBalance | null>(null);

  // Sorting options
  const sortOptions: SortOption[] = [
    { label: 'Balance (High to Low)', value: 'balance', direction: 'desc' },
    { label: 'Balance (Low to High)', value: 'balance', direction: 'asc' },
    { label: 'Username (A-Z)', value: 'username', direction: 'asc' },
    { label: 'Username (Z-A)', value: 'username', direction: 'desc' },
    { label: 'Recently Updated', value: 'updated', direction: 'desc' },
    { label: 'Least Recently Updated', value: 'updated', direction: 'asc' }
  ];

  // Fetch wallet balances from API
  const fetchBalances = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        nonZeroOnly: nonZeroOnly.toString(),
        sortBy: sortBy,
        sortOrder: sortOrder
      });
      
      const response = await fetch(`/api/admin/wallet-monitoring/current-balances?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch wallet balances: ${response.status}`);
      }
      
      const responseData = await response.json();
      
      // Type check for response format
      if (!responseData || typeof responseData !== 'object' || !('success' in responseData)) {
        throw new Error('Invalid response format from server');
      }
      
      const data = responseData as WalletBalancesResponse;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load wallet balances');
      }
      
      setBalances(data.balances);
      setPagination(data.pagination);
      setSummary(data.summary);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wallet balances');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when parameters change
  useEffect(() => {
    fetchBalances();
  }, [page, limit, nonZeroOnly, sortBy, sortOrder]);

  // Calculate percentiles for all wallets
  const balancePercentiles = useMemo(() => {
    if (!balances.length || !summary) return new Map();
    
    // Create a sorted copy of balances by SOL amount (ascending)
    const sortedBalances = [...balances].sort((a, b) => a.balance_sol - b.balance_sol);
    
    // Calculate percentile for each wallet
    const percentileMap = new Map();
    sortedBalances.forEach((wallet, index) => {
      // Calculate percentile (0-100)
      const percentile = Math.round((index / (sortedBalances.length - 1)) * 100);
      percentileMap.set(wallet.id, percentile);
    });
    
    return percentileMap;
  }, [balances, summary]);
  
  // Calculate distribution data for chart
  const distributionData = useMemo(() => {
    if (!balances.length || !summary) return [];
    
    const tierCounts = BALANCE_TIERS.map(tier => ({
      ...tier,
      count: 0,
      percentage: 0
    }));
    
    // Count balances in each tier
    balances.forEach(wallet => {
      const tier = getBalanceTier(wallet.balance_sol);
      const tierIndex = BALANCE_TIERS.findIndex(t => t.name === tier.name);
      if (tierIndex >= 0) {
        tierCounts[tierIndex].count++;
      }
    });
    
    // Calculate percentages based on visible data
    const totalVisible = balances.length;
    tierCounts.forEach(tier => {
      tier.percentage = totalVisible > 0 ? (tier.count / totalVisible) * 100 : 0;
    });
    
    return tierCounts;
  }, [balances, summary]);

  // Handle pagination
  const handleNextPage = () => {
    if (pagination?.hasNextPage) {
      setPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (pagination?.hasPrevPage) {
      setPage(prev => prev - 1);
    }
  };

  // Handle sorting change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOption = sortOptions.find(option => 
      `${option.value}_${option.direction}` === e.target.value
    );
    
    if (selectedOption) {
      setSortBy(selectedOption.value);
      setSortOrder(selectedOption.direction);
      setPage(1); // Reset to first page when changing sort
    }
  };

  // Format wallet address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Refresh cache function
  const refreshCache = async () => {
    setIsRefreshingCache(true);
    setCacheRefreshMessage(null);
    
    try {
      const response = await fetch('/api/admin/wallet-monitoring/refresh-cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to refresh cache');
      }
      
      setCacheRefreshMessage(data.message || 'Cache refreshed successfully');
      
      // Refresh the data after cache update
      fetchBalances();
      
      // Clear the success message after 5 seconds
      setTimeout(() => {
        setCacheRefreshMessage(null);
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh cache');
    } finally {
      setIsRefreshingCache(false);
    }
  };

  // Export current data to CSV
  const exportToCSV = () => {
    if (!balances.length) return;
    
    setIsExporting(true);
    
    try {
      // Create CSV header row
      const headers = ['Wallet Address', 'Nickname', 'Username', 'Role', 'XP', 'Balance (SOL)', 'Last Updated'];
      
      // Create CSV content rows
      const csvRows = [
        headers.join(','),
        ...balances.map(wallet => [
          `"${wallet.wallet_address}"`, // Wrap in quotes to handle commas
          `"${wallet.nickname || ''}"`,
          `"${wallet.username || ''}"`,
          `"${wallet.role}"`,
          wallet.experience_points,
          wallet.balance_sol,
          wallet.last_updated
        ].join(','))
      ];
      
      // Combine rows into CSV content
      const csvContent = csvRows.join('\n');
      
      // Create a blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `wallet_balances_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export CSV:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-dark-200/50 backdrop-blur-sm border border-dark-300 rounded-lg">
      <div className="p-4 border-b border-dark-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-white flex items-center">
            <span className="text-xl mr-2">💰</span> Wallet Balances
          </h2>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={fetchBalances} 
              className="text-xs text-cyber-400 hover:text-cyber-300 flex items-center bg-dark-300/50 px-2 py-1 rounded"
              disabled={loading}
            >
              <span className="mr-1">↻</span> Refresh
            </button>
            <button
              onClick={refreshCache}
              disabled={isRefreshingCache}
              className="text-xs bg-purple-900/30 text-purple-300 hover:bg-purple-900/50 px-2 py-1 rounded flex items-center border border-purple-700/30"
            >
              <span className="mr-1">🔄</span> Refresh Cache
              {isRefreshingCache && <span className="ml-1 w-3 h-3 border-2 border-t-transparent border-purple-400 rounded-full animate-spin"></span>}
            </button>
            <button
              onClick={exportToCSV}
              disabled={isExporting || !balances.length}
              className="text-xs bg-emerald-900/30 text-emerald-300 hover:bg-emerald-900/50 px-2 py-1 rounded flex items-center border border-emerald-700/30"
            >
              <span className="mr-1">📊</span> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Summary Dashboard */}
      {summary && (
        <div className="p-4 border-b border-dark-300 bg-dark-300/20">
          <div className="mb-2 text-xs text-gray-400">
            Balance rankings show each wallet's position: <span className="text-emerald-500">Top %</span> indicates higher balances, <span className="text-amber-500">Bottom %</span> indicates lower balances.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Wallet Distribution Card */}
            <div className="bg-dark-300/50 rounded-lg p-3 border border-dark-400">
              <div className="flex justify-between items-center mb-1">
                <div className="text-sm text-gray-300 font-semibold">Wallet Distribution</div>
                <div className="text-sm font-bold text-white">{summary.totalWallets.toLocaleString()} Total</div>
              </div>
              
              {/* Progress Bar */}
              <div className="h-5 bg-dark-800/50 rounded-md overflow-hidden flex mb-2 border border-dark-400">
                <div 
                  className="h-full bg-brand-500/70 relative group flex items-center justify-center"
                  style={{ width: `${Math.max(1, (summary.nonZeroWallets / summary.totalWallets) * 100)}%` }}
                >
                  {(summary.nonZeroWallets / summary.totalWallets) * 100 > 15 && (
                    <span className="text-xs text-white font-semibold">
                      {summary.nonZeroWallets.toLocaleString()} Non-Zero
                    </span>
                  )}
                  <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 transform -translate-x-1/2 bg-dark-800 text-white text-xs rounded px-2 py-1 mb-1 whitespace-nowrap transition-opacity z-10">
                    {summary.nonZeroWallets.toLocaleString()} Non-Zero Wallets ({((summary.nonZeroWallets / summary.totalWallets) * 100).toFixed(1)}%)
                  </div>
                </div>
                <div 
                  className="h-full bg-gray-500/70 relative group flex items-center justify-center"
                  style={{ width: `${(summary.zeroWallets / summary.totalWallets) * 100}%` }}
                >
                  {(summary.zeroWallets / summary.totalWallets) * 100 > 15 && (
                    <span className="text-xs text-white font-semibold">
                      {summary.zeroWallets.toLocaleString()} Zero
                    </span>
                  )}
                  <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 transform -translate-x-1/2 bg-dark-800 text-white text-xs rounded px-2 py-1 mb-1 whitespace-nowrap transition-opacity z-10">
                    {summary.zeroWallets.toLocaleString()} Zero Wallets ({((summary.zeroWallets / summary.totalWallets) * 100).toFixed(1)}%)
                  </div>
                </div>
              </div>
            </div>
            
            {/* Balance Card */}
            <div className="bg-dark-300/50 rounded-lg p-3 border border-dark-400">
              <div className="text-sm text-gray-300 font-semibold mb-1">Balance Summary</div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Total SOL</div>
                  <div className="text-xl font-bold text-brand-400 whitespace-nowrap">{summary.totalSol.toFixed(1)} SOL</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Average Balance</div>
                  <div className="text-xl font-bold text-brand-400 whitespace-nowrap">{summary.avgSol.toFixed(1)} SOL</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Balance Tiers Progress Bar - Horizontal and below cards */}
          <div className="mb-1 flex justify-between items-center">
            <div className="text-sm text-gray-300 font-semibold">Balance Tiers</div>
            <div className="text-xs text-gray-400">
              {distributionData.reduce((total, tier) => total + tier.count, 0)} wallets total
            </div>
          </div>
          
          <div className="h-8 bg-dark-800/50 rounded-md overflow-hidden flex border border-dark-400">
            {distributionData.map((tier) => (
              <div
                key={tier.name}
                className={`h-full bg-${tier.color}/70 relative group flex items-center justify-center`}
                style={{ width: `${Math.max(0.5, tier.percentage)}%` }}
              >
                {tier.percentage > 8 && (
                  <div className="text-xs text-white font-semibold">
                    {tier.name}
                  </div>
                )}
                <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 transform -translate-x-1/2 bg-dark-800 text-white text-xs rounded px-2 py-1 mb-1 whitespace-nowrap z-10 transition-opacity">
                  {tier.name}: {tier.count} wallets ({tier.percentage.toFixed(1)}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="p-4 border-b border-dark-300">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={nonZeroOnly}
                onChange={(e) => {
                  setNonZeroOnly(e.target.checked);
                  setPage(1); // Reset to first page
                }}
                className="form-checkbox h-4 w-4 text-brand-500 rounded"
              />
              Non-zero balances only
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Show:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1); // Reset to first page
                }}
                className="bg-dark-300 border border-dark-400 rounded text-sm text-gray-300 px-2 py-1"
              >
                <option value={10}>10</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
                <option value={500}>500</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Sort by:</span>
            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={handleSortChange}
              className="bg-dark-300 border border-dark-400 rounded text-sm text-gray-300 px-2 py-1 min-w-[180px]"
            >
              {sortOptions.map(option => (
                <option
                  key={`${option.value}_${option.direction}`}
                  value={`${option.value}_${option.direction}`}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-900/20 border-b border-red-800 text-red-300 text-sm">
          {error}
        </div>
      )}
      
      {/* Cache Refresh Message */}
      {cacheRefreshMessage && (
        <div className="p-4 bg-purple-900/20 border-b border-purple-800 text-purple-300 text-sm">
          {cacheRefreshMessage}
        </div>
      )}

      {/* Wallet Balance Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-brand-300 rounded-full animate-spin"></div>
          </div>
        ) : balances.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No wallets found
          </div>
        ) : (
          <table className="min-w-full divide-y divide-dark-300">
            <thead className="bg-dark-300/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Wallet</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User Info</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Balance (Rank)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Updated</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-300/50">
              {balances.map((wallet) => {
                const tier = getBalanceTier(wallet.balance_sol);
                return (
                  <tr 
                    key={wallet.id} 
                    className="hover:bg-dark-300/30 transition-colors"
                    onClick={() => setSelectedWallet(wallet)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <a 
                        href={`https://solscan.io/account/${wallet.wallet_address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="font-mono text-sm text-brand-300 hover:text-brand-200 hover:underline flex items-center"
                      >
                        {formatAddress(wallet.wallet_address)}
                        <span className="ml-1 text-xs opacity-70">↗</span>
                      </a>
                    </td>
                    <td className="px-4 py-3 cursor-pointer">
                      {wallet.nickname && (
                        <div className="text-gray-200 text-sm">{wallet.nickname}</div>
                      )}
                      {wallet.username && (
                        <div className="text-gray-400 text-xs">{wallet.username}</div>
                      )}
                      {!wallet.nickname && !wallet.username && (
                        <div className="text-gray-500 text-sm italic">Unknown user</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right cursor-pointer">
                      <div className={`text-${tier.color} font-mono text-sm`}>
                        {wallet.balance_sol.toFixed(wallet.balance_sol < 0.001 ? 6 : 3)} SOL
                      </div>
                      <div className="text-xs font-mono">
                        {balancePercentiles.has(wallet.id) ? 
                          (balancePercentiles.get(wallet.id) >= 50 ? 
                            <span className="text-emerald-500">Top {100-balancePercentiles.get(wallet.id)}%</span> : 
                            <span className="text-amber-500">Bottom {balancePercentiles.get(wallet.id)}%</span>)
                          : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap cursor-pointer">
                      <div className="text-gray-300 text-sm">
                        {formatDistanceToNow(new Date(wallet.last_updated), { addSuffix: true })}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {format(new Date(wallet.last_updated), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedWallet(wallet);
                        }}
                        className="text-xs bg-brand-900/30 text-brand-300 hover:bg-brand-900/50 px-2 py-1 rounded"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="p-4 border-t border-dark-300 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Showing {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.totalBalances)} of {pagination.totalBalances} wallets
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrevPage}
              disabled={!pagination.hasPrevPage}
              className={`px-3 py-1 text-sm rounded border ${
                pagination.hasPrevPage
                  ? 'border-brand-500 bg-brand-900/20 text-brand-400 hover:bg-brand-900/40'
                  : 'border-gray-700 bg-gray-900/20 text-gray-600 cursor-not-allowed'
              }`}
            >
              ← Previous
            </button>
            <span className="px-3 py-1 text-sm bg-dark-300/50 border border-dark-400 rounded">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={!pagination.hasNextPage}
              className={`px-3 py-1 text-sm rounded border ${
                pagination.hasNextPage
                  ? 'border-brand-500 bg-brand-900/20 text-brand-400 hover:bg-brand-900/40'
                  : 'border-gray-700 bg-gray-900/20 text-gray-600 cursor-not-allowed'
              }`}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Wallet Details Modal */}
      <AnimatePresence>
        {selectedWallet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedWallet(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-dark-200/90 border border-brand-500/20 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">Wallet Details</h3>
                    <a 
                      href={`https://solscan.io/account/${selectedWallet.wallet_address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-brand-300 hover:text-brand-200 font-mono mt-1 break-all inline-flex items-center"
                    >
                      {selectedWallet.wallet_address}
                      <span className="ml-1 text-xs">↗</span>
                    </a>
                  </div>
                  <button 
                    onClick={() => setSelectedWallet(null)}
                    className="text-gray-400 hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* User Information */}
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Username</div>
                      <div className="text-lg text-white">
                        {selectedWallet.username || '-'}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Nickname</div>
                      <div className="text-lg text-white">
                        {selectedWallet.nickname || '-'}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Role</div>
                      <div className="text-lg text-white capitalize">
                        {selectedWallet.role}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Experience Points</div>
                      <div className="text-lg text-white">
                        {selectedWallet.experience_points.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Balance Information */}
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">SOL Balance</div>
                      <div className="text-xl font-bold text-brand-400 whitespace-nowrap">
                        {selectedWallet.balance_sol.toFixed(6)} SOL
                      </div>
                      {balancePercentiles.has(selectedWallet.id) && (
                        <div className="text-sm mt-1">
                          {balancePercentiles.get(selectedWallet.id) >= 50 ? 
                            <span className="text-emerald-500 font-semibold">Top {100-balancePercentiles.get(selectedWallet.id)}%</span> : 
                            <span className="text-amber-500 font-semibold">Bottom {balancePercentiles.get(selectedWallet.id)}%</span>} of all wallets
                        </div>
                      )}
                    </div>
                    
                    
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Balance Tier</div>
                      <div className={`text-lg text-${getBalanceTier(selectedWallet.balance_sol).color} font-semibold`}>
                        {getBalanceTier(selectedWallet.balance_sol).name}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Last Updated</div>
                      <div className="text-lg text-white">
                        {formatDistanceToNow(new Date(selectedWallet.last_updated), { addSuffix: true })}
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(selectedWallet.last_updated), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex justify-end gap-3">
                  <button 
                    onClick={() => window.open(`https://solscan.io/account/${selectedWallet.wallet_address}`, '_blank')}
                    className="px-4 py-2 text-sm border border-brand-500/30 bg-brand-900/20 text-brand-300 rounded-lg hover:bg-brand-900/30 flex items-center"
                  >
                    <span>View on Solscan</span>
                    <span className="ml-1">↗</span>
                  </button>
                  <button 
                    onClick={() => setSelectedWallet(null)}
                    className="px-4 py-2 text-sm border border-gray-600 bg-dark-300 text-gray-300 rounded-lg hover:bg-dark-400"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WalletBalanceAnalytics;