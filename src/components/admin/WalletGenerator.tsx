import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { ddApi } from "../../services/dd-api";

interface WalletData {
  publicKey: string;
  timestamp: number;
  purpose?: string;
  is_active: boolean;
}

interface CacheStats {
  size: number;
  maxSize: number;
  hitRate: number;
  missRate: number;
}

interface SystemMetrics {
  generationSuccessRate: number;
  averageLatency: number;
  errorRate: number;
  totalWallets: number;
  activeWallets: number;
}

export const WalletGenerator: React.FC = () => {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newWalletIdentifier, setNewWalletIdentifier] = useState("");
  const [newWalletPurpose, setNewWalletPurpose] = useState("");

  const fetchWalletData = async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      const [walletsResponse, statsResponse, metricsResponse] =
        await Promise.all([
          ddApi.fetch("/admin/wallets/list"),
          ddApi.fetch("/admin/wallets/cache-stats"),
          ddApi.fetch("/admin/wallets/metrics"),
        ]);

      const [walletsData, statsData, metricsData] = await Promise.all([
        walletsResponse.json(),
        statsResponse.json(),
        metricsResponse.json(),
      ]);

      if (walletsData.success) setWallets(walletsData.data);
      if (statsData.success) setCacheStats(statsData.data);
      if (metricsData.success) setMetrics(metricsData.data);
    } catch (err) {
      setError("Failed to fetch wallet data");
      console.error(err);
      toast.error("Failed to fetch wallet data");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const generateNewWallet = async () => {
    if (!newWalletIdentifier.trim()) {
      toast.error("Please provide a wallet identifier");
      return;
    }

    try {
      const response = await ddApi.fetch("/admin/wallets/generate", {
        method: "POST",
        body: JSON.stringify({
          identifier: newWalletIdentifier,
          purpose: newWalletPurpose || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Wallet generated successfully");
        setNewWalletIdentifier("");
        setNewWalletPurpose("");
        fetchWalletData();
      } else {
        throw new Error(data.message || "Failed to generate wallet");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate wallet");
    }
  };

  useEffect(() => {
    fetchWalletData();
    const interval = setInterval(fetchWalletData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-100">
          Wallet Generator
        </h2>
        <button
          onClick={fetchWalletData}
          disabled={isRefreshing}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 
            ${
              isRefreshing
                ? "bg-brand-500/50"
                : "bg-brand-500 hover:bg-brand-600"
            }
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
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Generate New Wallet Form */}
      <div className="bg-dark-300/30 rounded-lg p-4 border border-dark-300">
        <h3 className="text-lg font-medium text-gray-100 mb-4 flex items-center gap-2">
          <span className="text-xl">🔑</span>
          Generate New Wallet
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm text-gray-400">
              Wallet Identifier
            </label>
            <input
              type="text"
              value={newWalletIdentifier}
              onChange={(e) => setNewWalletIdentifier(e.target.value)}
              placeholder="Enter unique identifier"
              className="w-full px-3 py-2 bg-dark-400/30 border border-dark-400 rounded-lg text-gray-100 placeholder-gray-500"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-gray-400">
              Purpose (Optional)
            </label>
            <input
              type="text"
              value={newWalletPurpose}
              onChange={(e) => setNewWalletPurpose(e.target.value)}
              placeholder="Enter wallet purpose"
              className="w-full px-3 py-2 bg-dark-400/30 border border-dark-400 rounded-lg text-gray-100 placeholder-gray-500"
            />
          </div>
        </div>
        <button
          onClick={generateNewWallet}
          className="mt-4 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
        >
          Generate Wallet
        </button>
      </div>

      {/* System Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-dark-300/30 rounded-lg p-4 border border-dark-300">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">📈</span>
              <h3 className="text-sm text-gray-400">Success Rate</h3>
            </div>
            <p className="text-2xl font-semibold text-gray-100">
              {metrics.generationSuccessRate.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Generation success rate
            </p>
          </div>

          <div className="bg-dark-300/30 rounded-lg p-4 border border-dark-300">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">⚡</span>
              <h3 className="text-sm text-gray-400">Average Latency</h3>
            </div>
            <p className="text-2xl font-semibold text-gray-100">
              {metrics.averageLatency.toFixed(2)}ms
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Generation response time
            </p>
          </div>

          <div className="bg-dark-300/30 rounded-lg p-4 border border-dark-300">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🎯</span>
              <h3 className="text-sm text-gray-400">Total Wallets</h3>
            </div>
            <p className="text-2xl font-semibold text-gray-100">
              {metrics.totalWallets}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {metrics.activeWallets} active
            </p>
          </div>
        </div>
      )}

      {/* Cache Statistics */}
      {cacheStats && (
        <div className="bg-dark-300/30 rounded-lg p-4 border border-dark-300">
          <h3 className="text-lg font-medium text-gray-100 mb-4 flex items-center gap-2">
            <span className="text-xl">📊</span>
            Cache Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-400">Cache Size</p>
              <p className="text-lg text-gray-100">
                {cacheStats.size} / {cacheStats.maxSize}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Hit Rate</p>
              <p className="text-lg text-gray-100">
                {(cacheStats.hitRate * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Miss Rate</p>
              <p className="text-lg text-gray-100">
                {(cacheStats.missRate * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Wallet List */}
      <div className="bg-dark-300/30 rounded-lg p-4 border border-dark-300">
        <h3 className="text-lg font-medium text-gray-100 mb-4 flex items-center gap-2">
          <span className="text-xl">💼</span>
          Generated Wallets
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-400">
                <th className="pb-2">Public Key</th>
                <th className="pb-2">Purpose</th>
                <th className="pb-2">Generated At</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="text-gray-100">
              {wallets.map((wallet, index) => (
                <tr key={index} className="border-t border-dark-400/30 text-sm">
                  <td className="py-2 font-mono">{wallet.publicKey}</td>
                  <td>{wallet.purpose || "-"}</td>
                  <td>{new Date(wallet.timestamp).toLocaleString()}</td>
                  <td>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        wallet.is_active
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {wallet.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
