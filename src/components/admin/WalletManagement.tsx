import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { ddApi } from "../../services/dd-api";

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

export const WalletManagement: React.FC<WalletManagementProps> = ({
  refreshInterval = 60000,
  autoRefresh = true,
}) => {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [totalBalance, setTotalBalance] = useState<TotalBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchWalletData = async () => {
    try {
      setError(null);
      setIsRefreshing(true);

      const [walletsResponse, balanceResponse] = await Promise.all([
        ddApi.fetch("/admin/wallets/contest-wallets"),
        ddApi.fetch("/admin/wallets/total-sol-balance"),
      ]);

      const [walletsData, balanceData] = await Promise.all([
        walletsResponse.json(),
        balanceResponse.json(),
      ]);

      if (walletsData.success && Array.isArray(walletsData.data)) {
        setWallets(walletsData.data);
      }

      if (balanceData.success && balanceData.data) {
        setTotalBalance(balanceData.data);
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

  useEffect(() => {
    fetchWalletData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchWalletData, refreshInterval);
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
          Wallet Management
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
                <div
                  className={`px-3 py-1 rounded-full text-sm border 
                  ${
                    wallet.status === "active"
                      ? "bg-green-500/20 text-green-400 border-green-500/50"
                      : "bg-brand-500/20 text-brand-400 border-brand-500/50"
                  }`}
                >
                  {wallet.status.toUpperCase()}
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
    </div>
  );
};
