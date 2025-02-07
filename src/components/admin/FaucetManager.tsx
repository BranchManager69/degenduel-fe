// src/components/admin/FaucetManager.tsx

import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { ddApi } from "../../services/dd-api";

interface TransactionStats {
  total: number;
  successful: number;
  failed: number;
  totalAmount: number;
  byType: {
    [key: string]: {
      count: number;
      amount: number;
      successful: number;
      failed: number;
    };
  };
  timeframe: string;
}

interface SystemHealth {
  status: "healthy" | "error";
  timestamp: Date;
  faucet: {
    balance: number;
    canFundUsers: number;
    address: string;
  };
  network: {
    version: string;
    endpoint: string;
    commitment: string;
  };
  database: string;
  walletGeneration: string;
  encryption: string;
}

interface Warning {
  level: "critical" | "warning";
  message: string;
  details: string;
}

interface DashboardData {
  timestamp: Date;
  faucet: {
    balance: number;
    canFundUsers: number;
  };
  system: SystemHealth;
  transactions: {
    recent: any[];
    stats: {
      "24h": TransactionStats;
      "7d": TransactionStats;
    };
  };
  warnings: Warning[];
  fees: {
    BASE_FEE: number;
    RENT_EXEMPTION: number;
  };
}

export const FaucetManager: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<"24h" | "7d">(
    "24h"
  );

  const fetchDashboardData = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const response = await ddApi.fetch("/admin/faucet/dashboard");
      const data = await response.json();

      if (data.success) {
        setDashboardData(data.data);
      } else {
        throw new Error(data.message || "Failed to fetch dashboard data");
      }
    } catch (err) {
      setError("Failed to fetch faucet dashboard data");
      console.error(err);
      toast.error("Failed to fetch faucet dashboard data");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-400 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!dashboardData) return null;

  const stats = dashboardData.transactions.stats[selectedTimeframe];

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-100">Faucet Manager</h2>
        <button
          onClick={fetchDashboardData}
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

      {/* System Status and Warnings */}
      {dashboardData.warnings.length > 0 && (
        <div className="space-y-2">
          {dashboardData.warnings.map((warning, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                warning.level === "critical"
                  ? "bg-red-500/10 border-red-500/20 text-red-400"
                  : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-xl">
                  {warning.level === "critical" ? "⚠️" : "⚡"}
                </span>
                <div>
                  <h3 className="font-medium">{warning.message}</h3>
                  <p className="text-sm opacity-80">{warning.details}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Faucet Balance */}
        <div className="bg-dark-300/30 rounded-lg p-4 border border-dark-300">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">💰</span>
            <h3 className="text-sm text-gray-400">Faucet Balance</h3>
          </div>
          <p className="text-2xl font-semibold text-gray-100">
            {dashboardData.faucet.balance.toFixed(4)} SOL
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Can fund {dashboardData.faucet.canFundUsers} more users
          </p>
        </div>

        {/* Transaction Success Rate */}
        <div className="bg-dark-300/30 rounded-lg p-4 border border-dark-300">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">📊</span>
            <h3 className="text-sm text-gray-400">Success Rate</h3>
          </div>
          <p className="text-2xl font-semibold text-gray-100">
            {((stats.successful / stats.total) * 100).toFixed(1)}%
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {stats.successful} of {stats.total} transactions
          </p>
        </div>

        {/* Total Amount Distributed */}
        <div className="bg-dark-300/30 rounded-lg p-4 border border-dark-300">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🔄</span>
            <h3 className="text-sm text-gray-400">Total Distributed</h3>
          </div>
          <p className="text-2xl font-semibold text-gray-100">
            {stats.totalAmount.toFixed(4)} SOL
          </p>
          <p className="text-sm text-gray-400 mt-1">
            In the last {selectedTimeframe}
          </p>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-dark-300/30 rounded-lg p-4 border border-dark-300">
        <h3 className="text-lg font-medium text-gray-100 mb-4 flex items-center gap-2">
          <span className="text-xl">🔧</span>
          System Health
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-400">Network</p>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  dashboardData.system.status === "healthy"
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              />
              <p className="text-gray-100">
                {dashboardData.system.network.version}
              </p>
            </div>
            <p className="text-xs text-gray-500">
              {dashboardData.system.network.endpoint}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-400">Database</p>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  dashboardData.system.database === "healthy"
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              />
              <p className="text-gray-100">{dashboardData.system.database}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-400">Wallet Generation</p>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  dashboardData.system.walletGeneration === "healthy"
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              />
              <p className="text-gray-100">
                {dashboardData.system.walletGeneration}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-dark-300/30 rounded-lg p-4 border border-dark-300">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-100 flex items-center gap-2">
            <span className="text-xl">📝</span>
            Recent Transactions
          </h3>
          <div className="flex gap-2">
            {["24h", "7d"].map((timeframe) => (
              <button
                key={timeframe}
                onClick={() => setSelectedTimeframe(timeframe as "24h" | "7d")}
                className={`px-3 py-1 rounded-lg text-sm ${
                  selectedTimeframe === timeframe
                    ? "bg-brand-500 text-white"
                    : "bg-dark-400/30 text-gray-400 hover:text-gray-300"
                }`}
              >
                {timeframe}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-400">
                <th className="pb-2">Time</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Amount</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="text-gray-100">
              {dashboardData.transactions.recent.map((tx, index) => (
                <tr key={index} className="border-t border-dark-400/30 text-sm">
                  <td className="py-2">
                    {new Date(tx.timestamp).toLocaleTimeString()}
                  </td>
                  <td>{tx.type}</td>
                  <td>{tx.amount} SOL</td>
                  <td>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        tx.status === "success"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fee Information */}
      <div className="bg-dark-300/30 rounded-lg p-4 border border-dark-300">
        <h3 className="text-lg font-medium text-gray-100 mb-4 flex items-center gap-2">
          <span className="text-xl">💸</span>
          Fee Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-400">Base Fee</p>
            <p className="text-lg text-gray-100">
              {dashboardData.fees.BASE_FEE} SOL
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Rent Exemption</p>
            <p className="text-lg text-gray-100">
              {dashboardData.fees.RENT_EXEMPTION} SOL
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
