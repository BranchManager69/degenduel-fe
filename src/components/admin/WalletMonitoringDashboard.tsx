import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { ddApi } from "../../services/dd-api";

// Types
interface WalletMonitoringDashboard {
  summary: {
    totalUsers: number;
    trackedUsers: number;
    trackingCoverage: number;
    totalWallets: number;
    totalBalanceSOL: number;
    totalValueUSD: number;
    serviceStatus: "running" | "stopped";
    checksPerHour: number;
    balanceCheckSuccess: number;
    balanceCheckTotal: number;
  };
  balanceDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
  topWallets: {
    walletAddress: string;
    balance: string;
    lastUpdated: string;
    nickname?: string;
    isHighValue: boolean;
  }[];
  recentChecks: {
    walletAddress: string;
    balance: string;
    timestamp: string;
    status: "success" | "error";
    errorMessage?: string;
  }[];
  settings: {
    queriesPerHour: number;
    minCheckIntervalMs: number;
    maxCheckIntervalMs: number;
    effectiveCheckIntervalMs: number;
  };
}

interface BalanceHistoryDataPoint {
  timestamp: string;
  balance: string;
}

// Main Component
export const WalletMonitoringDashboard: React.FC = () => {
  // State
  const [dashboardData, setDashboardData] =
    useState<WalletMonitoringDashboard | null>(null);
  const [balanceHistory, setBalanceHistory] = useState<
    BalanceHistoryDataPoint[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    queriesPerHour: 1500,
    minCheckIntervalMs: 60000,
    maxCheckIntervalMs: 1800000,
  });
  const [forceCheckAddress, setForceCheckAddress] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (selectedWallet) {
      fetchWalletHistory(selectedWallet);
    }
  }, [selectedWallet]);

  // Functions
  const fetchDashboardData = async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      const response = await ddApi.fetch(
        "/api/superadmin/wallet-monitoring/dashboard",
      );
      const data = await response.json();

      if (data) {
        setDashboardData(data);

        // If we have a selected wallet already, update its history
        if (selectedWallet) {
          fetchWalletHistory(selectedWallet);
        }
      } else {
        throw new Error("Failed to fetch dashboard data");
      }
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch dashboard data",
      );
      toast.error("Failed to load monitoring dashboard");

      // Use fallback data if needed for development
      setDummyData();
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  const fetchWalletHistory = async (walletAddress: string) => {
    try {
      const response = await ddApi.fetch(
        `/api/superadmin/wallet-monitoring/history/${walletAddress}`,
      );
      const data = await response.json();

      if (data.history) {
        setBalanceHistory(data.history);
      } else {
        throw new Error("Failed to fetch wallet history");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load wallet history");
      setBalanceHistory([]);
    }
  };

  const updateServiceSettings = async () => {
    try {
      const response = await ddApi.fetch(
        "/api/superadmin/wallet-monitoring/settings",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            settings: settingsForm,
          }),
        },
      );

      const data = await response.json();

      if (data.settings) {
        toast.success("Monitoring settings updated");
        setSettingsOpen(false);

        // Update dashboard with new settings
        setDashboardData((prev) =>
          prev
            ? {
                ...prev,
                settings: data.settings,
              }
            : null,
        );
      } else {
        throw new Error("Failed to update settings");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update settings");
    }
  };

  const toggleServiceStatus = async () => {
    if (!dashboardData) return;

    const newStatus =
      dashboardData.summary.serviceStatus === "running" ? "stopped" : "running";

    try {
      const response = await ddApi.fetch(
        `/api/superadmin/wallet-monitoring/${newStatus === "running" ? "start" : "stop"}`,
        {
          method: "POST",
        },
      );

      const data = await response.json();

      if (data.success) {
        toast.success(`Monitoring service ${newStatus}`);

        // Update local state
        setDashboardData((prev) =>
          prev
            ? {
                ...prev,
                summary: {
                  ...prev.summary,
                  serviceStatus: newStatus as "running" | "stopped",
                },
              }
            : null,
        );
      } else {
        throw new Error(`Failed to ${newStatus} service`);
      }
    } catch (err) {
      console.error(err);
      toast.error(`Failed to ${newStatus} monitoring service`);
    }
  };

  const forceCheckWallet = async () => {
    if (!forceCheckAddress) {
      toast.error("Please enter a wallet address");
      return;
    }

    try {
      const response = await ddApi.fetch(
        `/api/superadmin/wallet-monitoring/check/${forceCheckAddress}`,
        {
          method: "POST",
        },
      );

      const data = await response.json();

      if (data.status === "success") {
        toast.success(`Successfully checked wallet: ${data.balance} SOL`);
        fetchDashboardData(); // Refresh to get the updated check in the feed
      } else {
        throw new Error("Check failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to check wallet");
    }
  };

  const setDummyData = () => {
    // Simplified dummy data for development
    const dummyDashboard: WalletMonitoringDashboard = {
      summary: {
        totalUsers: 235,
        trackedUsers: 197,
        trackingCoverage: 83.8,
        totalWallets: 412,
        totalBalanceSOL: 5230.75,
        totalValueUSD: 367240.25,
        serviceStatus: "running",
        checksPerHour: 450,
        balanceCheckSuccess: 19872,
        balanceCheckTotal: 20000,
      },
      balanceDistribution: [
        { range: "0-1 SOL", count: 145, percentage: 35.2 },
        { range: "1-10 SOL", count: 198, percentage: 48.1 },
        { range: "10-100 SOL", count: 57, percentage: 13.8 },
        { range: "100+ SOL", count: 12, percentage: 2.9 },
      ],
      topWallets: [
        {
          walletAddress: "HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrn",
          balance: "543.21",
          lastUpdated: "2025-02-25T14:35:22Z",
          nickname: "Treasury A",
          isHighValue: true,
        },
        {
          walletAddress: "5KKsGEGZtqGGBGpuTK6J2cGZg6NwTjjJRzUHGKPMuVRJ",
          balance: "289.54",
          lastUpdated: "2025-02-25T14:30:18Z",
          isHighValue: true,
        },
        {
          walletAddress: "DEuG7Gph4mUN3tP3PZPfP9pYK6Y1r3XegcLMj7cZGYKq",
          balance: "156.78",
          lastUpdated: "2025-02-25T14:25:05Z",
          isHighValue: true,
        },
        {
          walletAddress: "2YsVPJrjK5RkHxCBR9ayjkWdVQRQsCvYmZhJ6pYHvZ8B",
          balance: "98.45",
          lastUpdated: "2025-02-25T14:28:12Z",
          nickname: "Contest Pool",
          isHighValue: false,
        },
        {
          walletAddress: "8j5LaKgGMTFJG4qQTNhYH3gYMPJ2ZxBCMWKCkJq9D4uV",
          balance: "75.32",
          lastUpdated: "2025-02-25T14:32:45Z",
          isHighValue: false,
        },
      ],
      recentChecks: [
        {
          walletAddress: "HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrn",
          balance: "543.21",
          timestamp: "2025-02-25T14:35:22Z",
          status: "success",
        },
        {
          walletAddress: "5KKsGEGZtqGGBGpuTK6J2cGZg6NwTjjJRzUHGKPMuVRJ",
          balance: "289.54",
          timestamp: "2025-02-25T14:30:18Z",
          status: "success",
        },
        {
          walletAddress: "DEuG7Gph4mUN3tP3PZPfP9pYK6Y1r3XegcLMj7cZGYKq",
          balance: "error",
          timestamp: "2025-02-25T14:29:55Z",
          status: "error",
          errorMessage: "Rate limit exceeded",
        },
        {
          walletAddress: "2YsVPJrjK5RkHxCBR9ayjkWdVQRQsCvYmZhJ6pYHvZ8B",
          balance: "98.45",
          timestamp: "2025-02-25T14:28:12Z",
          status: "success",
        },
        {
          walletAddress: "8j5LaKgGMTFJG4qQTNhYH3gYMPJ2ZxBCMWKCkJq9D4uV",
          balance: "75.32",
          timestamp: "2025-02-25T14:32:45Z",
          status: "success",
        },
      ],
      settings: {
        queriesPerHour: 1500,
        minCheckIntervalMs: 60000,
        maxCheckIntervalMs: 1800000,
        effectiveCheckIntervalMs: 600000,
      },
    };

    const dummyHistory: BalanceHistoryDataPoint[] = [
      { timestamp: "2025-02-20T00:00:00Z", balance: "520.15" },
      { timestamp: "2025-02-21T00:00:00Z", balance: "525.82" },
      { timestamp: "2025-02-22T00:00:00Z", balance: "530.44" },
      { timestamp: "2025-02-23T00:00:00Z", balance: "535.67" },
      { timestamp: "2025-02-24T00:00:00Z", balance: "540.12" },
      { timestamp: "2025-02-25T00:00:00Z", balance: "543.21" },
    ];

    setDashboardData(dummyDashboard);
    setBalanceHistory(dummyHistory);
  };

  // Helper function for formatting dates
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // Helper function for short wallet addresses
  const shortenAddress = (address: string): string => {
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 rounded-full border-4 border-brand-500/30 border-t-brand-500 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-cyber tracking-wider bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
            WALLET MONITORING SYSTEM
          </h1>
          <p className="text-gray-400 mt-1 font-mono">
            SUPERADMIN_WALLET_MONITORING_INTERFACE
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={isRefreshing}
            className={`px-3 py-1.5 rounded-lg border border-brand-500/30 
              ${isRefreshing ? "bg-brand-500/10" : "bg-dark-200/50 hover:bg-brand-500/10"} 
              text-brand-400 transition-colors flex items-center gap-2`}
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
            onClick={() => setSettingsOpen(true)}
            className="px-3 py-1.5 rounded-lg border border-cyber-500/30 bg-dark-200/50 hover:bg-cyber-500/10 text-cyber-400 transition-colors flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Settings
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      {dashboardData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Balance */}
          <div className="col-span-2 bg-dark-200/50 backdrop-blur-sm border border-brand-500/20 rounded-lg p-4">
            <div className="text-sm text-gray-400 font-normal mb-1">
              Total SOL Monitored
            </div>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-brand-400">
                {dashboardData.summary.totalBalanceSOL.toFixed(2)}
              </span>
              <span className="ml-1 text-gray-400">SOL</span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              ${dashboardData.summary.totalValueUSD.toLocaleString()}
            </div>
          </div>

          {/* User Coverage */}
          <div className="bg-dark-200/50 backdrop-blur-sm border border-brand-500/20 rounded-lg p-4">
            <div className="text-sm text-gray-400 font-normal mb-1">
              User Coverage
            </div>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-brand-400">
                {dashboardData.summary.trackingCoverage.toFixed(1)}%
              </span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {dashboardData.summary.trackedUsers} /{" "}
              {dashboardData.summary.totalUsers} users
            </div>
            <div className="w-full bg-dark-300/50 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-brand-500 h-full rounded-full"
                style={{ width: `${dashboardData.summary.trackingCoverage}%` }}
              ></div>
            </div>
          </div>

          {/* Service Status */}
          <div className="bg-dark-200/50 backdrop-blur-sm border border-brand-500/20 rounded-lg p-4">
            <div className="text-sm text-gray-400 font-normal mb-2">
              Monitoring Service
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div
                  className={`h-3 w-3 rounded-full mr-2 ${
                    dashboardData.summary.serviceStatus === "running"
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                ></div>
                <span
                  className={
                    dashboardData.summary.serviceStatus === "running"
                      ? "text-green-400"
                      : "text-red-400"
                  }
                >
                  {dashboardData.summary.serviceStatus === "running"
                    ? "RUNNING"
                    : "STOPPED"}
                </span>
              </div>
              <button
                onClick={toggleServiceStatus}
                className={`px-2 py-1 text-xs rounded ${
                  dashboardData.summary.serviceStatus === "running"
                    ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                    : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                }`}
              >
                {dashboardData.summary.serviceStatus === "running"
                  ? "Stop"
                  : "Start"}
              </button>
            </div>
            <div className="mt-2">
              <div className="text-xs text-gray-500">Check frequency:</div>
              <div className="text-sm text-gray-300">
                {(
                  dashboardData.settings.effectiveCheckIntervalMs / 60000
                ).toFixed(1)}{" "}
                minutes
              </div>
            </div>
          </div>
        </div>
      )}

      {error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      ) : (
        dashboardData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Balance Distribution Chart */}
              <div className="bg-dark-200/50 backdrop-blur-sm border border-brand-500/20 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  Balance Distribution
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {dashboardData.balanceDistribution.map((segment, index) => {
                    // Use different colors for different segments
                    const colors = [
                      "from-cyan-500 to-cyan-400",
                      "from-emerald-500 to-emerald-400",
                      "from-amber-500 to-amber-400",
                      "from-purple-500 to-purple-400",
                    ];

                    return (
                      <div key={segment.range} className="text-center">
                        <div
                          className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-2"
                          style={{
                            background: `conic-gradient(from 0deg, ${index * 90}deg, transparent 0, transparent 100%)`,
                          }}
                        >
                          <div
                            className={`bg-gradient-to-b ${colors[index]} w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-dark-800`}
                          >
                            {segment.percentage}%
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {segment.range}
                        </div>
                        <div className="text-sm text-gray-300">
                          {segment.count} wallets
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Balance History Chart */}
              {selectedWallet && balanceHistory.length > 0 && (
                <div className="bg-dark-200/50 backdrop-blur-sm border border-brand-500/20 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-200">
                      Balance History
                    </h3>
                    <div className="text-sm text-gray-400">
                      {selectedWallet.substring(0, 6)}...
                      {selectedWallet.substring(selectedWallet.length - 6)}
                    </div>
                  </div>

                  {/* Basic Chart Visualization */}
                  <div className="h-64 relative">
                    {/* This would be replaced with a proper Chart component */}
                    <div className="absolute inset-0 flex items-end">
                      {balanceHistory.map((point, index) => {
                        const height = `${(parseFloat(point.balance) / Math.max(...balanceHistory.map((p) => parseFloat(p.balance)))) * 100}%`;
                        return (
                          <div
                            key={index}
                            className="flex-1 flex flex-col items-center"
                          >
                            <div
                              className="w-full bg-gradient-to-t from-brand-500/30 to-brand-500/10 rounded-t"
                              style={{ height }}
                            >
                              <div className="h-1 w-full bg-brand-500"></div>
                            </div>
                            <div className="text-xs text-gray-400 mt-1 rotate-45 origin-top-left">
                              {new Date(point.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Y-axis labels */}
                    <div className="absolute left-0 inset-y-0 flex flex-col justify-between pointer-events-none">
                      <div className="text-xs text-gray-500">
                        {Math.max(
                          ...balanceHistory.map((p) => parseFloat(p.balance)),
                        ).toFixed(2)}{" "}
                        SOL
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.min(
                          ...balanceHistory.map((p) => parseFloat(p.balance)),
                        ).toFixed(2)}{" "}
                        SOL
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Force Check Tool */}
              <div className="bg-dark-200/50 backdrop-blur-sm border border-brand-500/20 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  Force Check Wallet
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={forceCheckAddress}
                    onChange={(e) => setForceCheckAddress(e.target.value)}
                    placeholder="Enter wallet address..."
                    className="flex-1 bg-dark-300/50 border border-dark-400 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                  />
                  <button
                    onClick={forceCheckWallet}
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
                  >
                    Check Now
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Top Wallets */}
              <div className="bg-dark-200/50 backdrop-blur-sm border border-brand-500/20 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  Top Wallets
                </h3>
                <div className="space-y-3">
                  {dashboardData.topWallets.map((wallet) => (
                    <div
                      key={wallet.walletAddress}
                      onClick={() => setSelectedWallet(wallet.walletAddress)}
                      className={`p-3 rounded-lg ${
                        selectedWallet === wallet.walletAddress
                          ? "bg-brand-500/20 border border-brand-500/30"
                          : "bg-dark-300/30 border border-dark-400/30 hover:bg-dark-300/50"
                      } cursor-pointer transition-colors`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2 w-2 rounded-full ${wallet.isHighValue ? "bg-amber-500" : "bg-gray-500"}`}
                          ></div>
                          <span className="text-gray-300 font-medium">
                            {wallet.nickname ||
                              shortenAddress(wallet.walletAddress)}
                          </span>
                        </div>
                        <span className="text-brand-400 font-semibold">
                          {wallet.balance} SOL
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Last updated: {formatDate(wallet.lastUpdated)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Checks Feed */}
              <div className="bg-dark-200/50 backdrop-blur-sm border border-brand-500/20 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  Recent Checks
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                  {dashboardData.recentChecks.map((check, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded border ${
                        check.status === "success"
                          ? "bg-green-500/5 border-green-500/20"
                          : "bg-red-500/5 border-red-500/20"
                      }`}
                    >
                      <div className="flex justify-between">
                        <div className="text-sm text-gray-300">
                          {shortenAddress(check.walletAddress)}
                        </div>
                        <div
                          className={`text-sm ${
                            check.status === "success"
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {check.status === "success"
                            ? `${check.balance} SOL`
                            : "Error"}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(check.timestamp)}
                      </div>

                      {check.errorMessage && (
                        <div className="text-xs text-red-400 mt-1">
                          {check.errorMessage}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Success Rate */}
              <div className="bg-dark-200/50 backdrop-blur-sm border border-brand-500/20 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-200 mb-2">
                  Success Rate
                </h3>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold text-brand-400">
                    {(
                      (dashboardData.summary.balanceCheckSuccess /
                        dashboardData.summary.balanceCheckTotal) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div className="text-sm text-gray-500 mb-2">
                  {dashboardData.summary.balanceCheckSuccess} /{" "}
                  {dashboardData.summary.balanceCheckTotal} checks successful
                </div>
                <div className="w-full bg-dark-300/50 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-brand-500 h-full rounded-full"
                    style={{
                      width: `${(dashboardData.summary.balanceCheckSuccess / dashboardData.summary.balanceCheckTotal) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-dark-200 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">
              Monitoring Settings
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Queries Per Hour
                </label>
                <input
                  type="number"
                  min="10"
                  max="5000"
                  value={settingsForm.queriesPerHour}
                  onChange={(e) =>
                    setSettingsForm((prev) => ({
                      ...prev,
                      queriesPerHour: parseInt(e.target.value) || 1500,
                    }))
                  }
                  className="w-full bg-dark-300 rounded px-3 py-2 text-gray-100 border border-dark-400 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum API calls per hour
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Minimum Check Interval (ms)
                </label>
                <input
                  type="number"
                  min="5000"
                  max="300000"
                  step="1000"
                  value={settingsForm.minCheckIntervalMs}
                  onChange={(e) =>
                    setSettingsForm((prev) => ({
                      ...prev,
                      minCheckIntervalMs: parseInt(e.target.value) || 60000,
                    }))
                  }
                  className="w-full bg-dark-300 rounded px-3 py-2 text-gray-100 border border-dark-400 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum time between checks for high-priority wallets
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Maximum Check Interval (ms)
                </label>
                <input
                  type="number"
                  min="300000"
                  max="86400000"
                  step="60000"
                  value={settingsForm.maxCheckIntervalMs}
                  onChange={(e) =>
                    setSettingsForm((prev) => ({
                      ...prev,
                      maxCheckIntervalMs: parseInt(e.target.value) || 1800000,
                    }))
                  }
                  className="w-full bg-dark-300 rounded px-3 py-2 text-gray-100 border border-dark-400 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum time between checks for low-priority wallets
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setSettingsOpen(false)}
                className="px-4 py-2 rounded-lg bg-dark-300 hover:bg-dark-400 text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={updateServiceSettings}
                className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
