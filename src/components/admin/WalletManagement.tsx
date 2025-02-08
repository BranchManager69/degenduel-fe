import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

interface WalletData {
  id: number;
  wallet_address: string;
  contest_id: number;
  contest_code: string;
  status: string;
  solBalance: number;
  tokens: {
    mint: string;
    balance: string;
    address: string;
  }[];
}

interface TotalBalance {
  totalSOL: number;
  totalLamports: number;
  walletCount: number;
}

interface WalletManagementProps {
  refreshInterval?: number;
  autoRefresh?: boolean;
}

interface WalletGenerationOptions {
  count: number;
  initialBalance: number;
  purpose: 'contest' | 'faucet' | 'admin';
  label?: string;
}

export const WalletManagement: React.FC<WalletManagementProps> = ({
  refreshInterval = 60000,
  autoRefresh = true,
}) => {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [totalBalance, setTotalBalance] = useState<TotalBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generationOptions, setGenerationOptions] = useState<WalletGenerationOptions>({
    count: 1,
    initialBalance: 0.1,
    purpose: 'contest',
    label: ''
  });

  const fetchWalletData = async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      const [walletsResponse, statsResponse, metricsResponse] =
        await Promise.all([
          fetch("/api/admin/wallets/contest-wallets"),
          fetch("/api/admin/wallets/cache-stats"),
          fetch("/api/admin/wallets/metrics"),
      ]);

      const [walletsData, statsData, metricsData] = await Promise.all([
        walletsResponse.json(),
        statsResponse.json(),
        metricsResponse.json(),
      ]);

      if (walletsData.success) setWallets(walletsData.data);
      if (statsData.success) setTotalBalance(statsData.data);
      if (metricsData.success) {
        // Handle metrics data
      }
    } catch (err) {
      setError("Failed to fetch wallet data");
      console.error(err);
      toast.error("Failed to fetch wallet data");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const generateWallets = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const response = await fetch("/api/admin/wallets/generate", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...generationOptions,
          initialBalance: generationOptions.initialBalance * 1e9 // Convert to lamports
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Successfully generated ${generationOptions.count} wallet(s)`);
        fetchWalletData(); // Refresh the list
        setShowGenerateModal(false);
      } else {
        throw new Error(data.error || 'Failed to generate wallets');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate wallets');
      toast.error('Failed to generate wallets');
    } finally {
      setIsGenerating(false);
    }
  };

  const updateWalletStatus = async (walletId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/wallets/${walletId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Wallet status updated');
        fetchWalletData(); // Refresh the list
      } else {
        throw new Error(data.error || 'Failed to update wallet status');
      }
    } catch (err) {
      toast.error('Failed to update wallet status');
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchWalletData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Generate Wallet Modal
  const GenerateWalletModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-200 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-100 mb-4">Generate New Wallets</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Number of Wallets</label>
            <input
              type="number"
              min="1"
              max="50"
              value={generationOptions.count}
              onChange={(e) => setGenerationOptions(prev => ({
                ...prev,
                count: Math.min(50, Math.max(1, parseInt(e.target.value) || 1))
              }))}
              className="w-full bg-dark-300 rounded px-3 py-2 text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Initial Balance (SOL)</label>
            <input
              type="number"
              min="0.001"
              step="0.001"
              value={generationOptions.initialBalance}
              onChange={(e) => setGenerationOptions(prev => ({
                ...prev,
                initialBalance: parseFloat(e.target.value) || 0
              }))}
              className="w-full bg-dark-300 rounded px-3 py-2 text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Purpose</label>
            <select
              value={generationOptions.purpose}
              onChange={(e) => setGenerationOptions(prev => ({
                ...prev,
                purpose: e.target.value as WalletGenerationOptions['purpose']
              }))}
              className="w-full bg-dark-300 rounded px-3 py-2 text-gray-100"
            >
              <option value="contest">Contest</option>
              <option value="faucet">Faucet</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Label (Optional)</label>
            <input
              type="text"
              value={generationOptions.label}
              onChange={(e) => setGenerationOptions(prev => ({
                ...prev,
                label: e.target.value
              }))}
              className="w-full bg-dark-300 rounded px-3 py-2 text-gray-100"
              placeholder="e.g., Tournament #123"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setShowGenerateModal(false)}
            className="px-4 py-2 rounded-lg bg-dark-300 hover:bg-dark-400 text-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={generateWallets}
            disabled={isGenerating}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 
              ${isGenerating ? 'bg-brand-500/50' : 'bg-brand-500 hover:bg-brand-600'}
              text-white transition-colors`}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              'Generate'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-100">
          Wallet Management
        </h2>
        <div className="flex gap-3">
          <button
            onClick={fetchWalletData}
            disabled={isRefreshing}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 
              ${isRefreshing ? 'bg-brand-500/50' : 'bg-brand-500 hover:bg-brand-600'}
              text-white transition-colors`}
          >
            <svg
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
          
          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Generate Wallets
          </button>
        </div>
      </div>

      {/* Total Balance Overview */}
      {totalBalance && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-dark-300/30 rounded-lg p-4 border border-dark-300">
            <p className="text-sm text-gray-400">Total SOL Balance</p>
            <p className="text-2xl font-semibold text-gray-100">
              {totalBalance.totalSOL.toFixed(2)} SOL
            </p>
          </div>
          <div className="bg-dark-300/30 rounded-lg p-4 border border-dark-300">
            <p className="text-sm text-gray-400">Total Lamports</p>
            <p className="text-2xl font-semibold text-gray-100">
              {totalBalance.totalLamports.toLocaleString()}
            </p>
          </div>
          <div className="bg-dark-300/30 rounded-lg p-4 border border-dark-300">
            <p className="text-sm text-gray-400">Total Wallets</p>
            <p className="text-2xl font-semibold text-gray-100">
              {totalBalance.walletCount}
            </p>
          </div>
        </div>
      )}

      {error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {wallets.map((wallet) => (
            <div
              key={wallet.id}
              className="bg-dark-300/30 rounded-lg p-4 border border-dark-300"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-100">
                    Contest: {wallet.contest_code}
                  </h3>
                  <p className="text-sm text-gray-400 break-all">
                    Wallet: {wallet.wallet_address}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={wallet.status}
                    onChange={(e) => updateWalletStatus(wallet.id, e.target.value)}
                    className={`px-3 py-1 rounded-full text-sm border bg-dark-400
                      ${wallet.status === 'active' 
                        ? 'border-green-500/50 text-green-400' 
                        : 'border-brand-500/50 text-brand-400'}`}
                  >
                    <option value="active">ACTIVE</option>
                    <option value="inactive">INACTIVE</option>
                    <option value="reserved">RESERVED</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400">SOL Balance</p>
                  <p className="text-gray-100">{wallet.solBalance} SOL</p>
                </div>

                {wallet.tokens.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Token Balances</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {wallet.tokens.map((token) => (
                        <div
                          key={token.mint}
                          className="bg-dark-400/30 p-2 rounded border border-dark-400"
                        >
                          <p className="text-xs text-gray-400 break-all">
                            {token.mint}
                          </p>
                          <p className="text-sm text-gray-100">
                            Balance: {token.balance}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generate Wallet Modal */}
      {showGenerateModal && <GenerateWalletModal />}
    </div>
  );
};
