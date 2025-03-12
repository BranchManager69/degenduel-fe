import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { ddApi } from "../../services/dd-api";

interface PoolStats {
  total_wallets: number;
  available_wallets: number;
  available_by_pattern: Record<string, number>;
}

interface PoolAlert {
  pattern: string;
  remaining: number;
  status: "low" | "depleted";
}

interface PoolPattern {
  pattern: string;
  available: number;
}

interface VanityWalletPoolProps {
  refreshInterval?: number;
  autoRefresh?: boolean;
}

export const VanityWalletPool: React.FC<VanityWalletPoolProps> = ({
  refreshInterval = 60000,
  autoRefresh = true,
}) => {
  const [poolStats, setPoolStats] = useState<PoolStats | null>(null);
  const [poolAlerts, setPoolAlerts] = useState<PoolAlert[]>([]);
  const [poolPatterns, setPoolPatterns] = useState<PoolPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPoolData = async () => {
    try {
      setError(null);
      setIsRefreshing(true);

      const [statsResponse, alertsResponse, patternsResponse] =
        await Promise.all([
          ddApi.fetch("/admin/vanity-wallets/pool/stats"),
          ddApi.fetch("/admin/vanity-wallets/pool/alerts"),
          ddApi.fetch("/admin/vanity-wallets/pool/patterns"),
        ]);

      const [statsData, alertsData, patternsData] = await Promise.all([
        statsResponse.json(),
        alertsResponse.json(),
        patternsResponse.json(),
      ]);

      if (statsData.success && statsData.stats) {
        setPoolStats(statsData.stats);
      }

      if (alertsData.success && Array.isArray(alertsData.alerts)) {
        setPoolAlerts(alertsData.alerts);
      }

      if (patternsData.success && Array.isArray(patternsData.patterns)) {
        setPoolPatterns(patternsData.patterns);
      }
    } catch (err) {
      setError("Failed to fetch pool data");
      console.error(err);
      toast.error("Failed to fetch pool data");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPoolData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchPoolData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

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
          Vanity Wallet Pool
        </h2>
        <button
          onClick={fetchPoolData}
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

      {error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pool Statistics */}
          {poolStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-dark-300/30 rounded-lg p-4 border border-dark-300">
                <p className="text-sm text-gray-400">Total Wallets</p>
                <p className="text-2xl font-semibold text-gray-100">
                  {poolStats.total_wallets}
                </p>
              </div>
              <div className="bg-dark-300/30 rounded-lg p-4 border border-dark-300">
                <p className="text-sm text-gray-400">Available Wallets</p>
                <p className="text-2xl font-semibold text-gray-100">
                  {poolStats.available_wallets}
                </p>
              </div>
              <div className="bg-dark-300/30 rounded-lg p-4 border border-dark-300">
                <p className="text-sm text-gray-400">Utilization</p>
                <p className="text-2xl font-semibold text-gray-100">
                  {(
                    (poolStats.available_wallets / poolStats.total_wallets) *
                    100
                  ).toFixed(1)}
                  %
                </p>
              </div>
            </div>
          )}

          {/* Pool Alerts */}
          {poolAlerts.length > 0 && (
            <div className="bg-dark-300/30 rounded-lg p-4 border border-dark-300">
              <h3 className="text-lg font-medium text-gray-100 mb-4">Alerts</h3>
              <div className="space-y-2">
                {poolAlerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      alert.status === "depleted"
                        ? "bg-red-500/10 border-red-500/20 text-red-400"
                        : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>Pattern: {alert.pattern}</span>
                      <span>
                        {alert.remaining} wallet{alert.remaining !== 1 && "s"}{" "}
                        remaining
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pattern Distribution */}
          {poolPatterns.length > 0 && (
            <div className="bg-dark-300/30 rounded-lg p-4 border border-dark-300">
              <h3 className="text-lg font-medium text-gray-100 mb-4">
                Pattern Distribution
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {poolPatterns.map((pattern, index) => (
                  <div
                    key={index}
                    className="bg-dark-400/30 p-4 rounded-lg border border-dark-400"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-brand-400 font-mono">
                        {pattern.pattern}
                      </span>
                      <span className="text-gray-100">
                        {pattern.available} available
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
