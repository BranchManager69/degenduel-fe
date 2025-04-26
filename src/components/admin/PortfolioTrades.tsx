import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { ddApi } from "../../services/dd-api";

interface TradeData {
  trade_id: string;
  portfolio_id: number;
  token_mint: string;
  token_name: string;
  trade_type: "buy" | "sell";
  amount: string;
  price_sol: string;
  timestamp: string;
  status: "pending" | "completed" | "failed";
  transaction_signature?: string;
}

interface TradeStats {
  total_trades: number;
  total_volume_sol: string;
  successful_trades: number;
  failed_trades: number;
  average_trade_size: string;
}

interface PortfolioTradesProps {
  refreshInterval?: number;
  autoRefresh?: boolean;
}

export const PortfolioTrades: React.FC<PortfolioTradesProps> = ({
  refreshInterval = 30000,
  autoRefresh = true,
}) => {
  const [trades, setTrades] = useState<TradeData[]>([]);
  const [tradeStats, setTradeStats] = useState<TradeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTradeData = async () => {
    try {
      setError(null);
      setIsRefreshing(true);

      const [tradesResponse, statsResponse] = await Promise.all([
        ddApi.fetch("/admin/portfolio/trades/recent"),
        ddApi.fetch("/admin/portfolio/trades/stats"),
      ]);

      const [tradesData, statsData] = await Promise.all([
        tradesResponse.json(),
        statsResponse.json(),
      ]);

      if (tradesData.success && Array.isArray(tradesData.trades)) {
        setTrades(tradesData.trades);
      }

      if (statsData.success && statsData.stats) {
        setTradeStats(statsData.stats);
      }
    } catch (err) {
      setError("Failed to fetch trade data");
      console.error(err);
      toast.error("Failed to fetch trade data");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTradeData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchTradeData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const getStatusBadgeClass = (status: TradeData["status"]) => {
    const badges = {
      pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
      completed: "bg-green-500/20 text-green-400 border-green-500/50",
      failed: "bg-red-500/20 text-red-400 border-red-500/50",
    };
    return badges[status];
  };

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
          Portfolio Trades
        </h2>
        <button
          onClick={fetchTradeData}
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
          {/* Trade Statistics */}
          {tradeStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-dark-300/30 rounded-lg p-4 border border-dark-300">
                <p className="text-sm text-gray-400">Total Trades</p>
                <p className="text-2xl font-semibold text-gray-100">
                  {tradeStats.total_trades}
                </p>
              </div>
              <div className="bg-dark-300/30 rounded-lg p-4 border border-dark-300">
                <p className="text-sm text-gray-400">Total Volume</p>
                <p className="text-2xl font-semibold text-gray-100">
                  {tradeStats.total_volume_sol} SOL
                </p>
              </div>
              <div className="bg-dark-300/30 rounded-lg p-4 border border-dark-300">
                <p className="text-sm text-gray-400">Success Rate</p>
                <p className="text-2xl font-semibold text-gray-100">
                  {(
                    (tradeStats.successful_trades / tradeStats.total_trades) *
                    100
                  ).toFixed(1)}
                  %
                </p>
              </div>
              <div className="bg-dark-300/30 rounded-lg p-4 border border-dark-300">
                <p className="text-sm text-gray-400">Failed Trades</p>
                <p className="text-2xl font-semibold text-gray-100">
                  {tradeStats.failed_trades}
                </p>
              </div>
              <div className="bg-dark-300/30 rounded-lg p-4 border border-dark-300">
                <p className="text-sm text-gray-400">Avg Trade Size</p>
                <p className="text-2xl font-semibold text-gray-100">
                  {tradeStats.average_trade_size} SOL
                </p>
              </div>
            </div>
          )}

          {/* Recent Trades */}
          <div className="bg-dark-300/30 rounded-lg border border-dark-300">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-300">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                      Portfolio ID
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                      Token
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                      Type
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">
                      Price (SOL)
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-400">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-300">
                  {trades.map((trade) => (
                    <tr key={trade.trade_id} className="hover:bg-dark-400/30">
                      <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">
                        {new Date(trade.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {trade.portfolio_id}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <span className="text-gray-300">
                            {trade.token_name}
                          </span>
                          <span className="text-xs text-gray-500 block">
                            {trade.token_mint.slice(0, 8)}...
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`${
                            trade.trade_type === "buy"
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {trade.trade_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300 text-right">
                        {trade.amount}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300 text-right">
                        {trade.price_sol}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex justify-center">
                          <span
                            className={`px-2 py-1 rounded-full text-xs border ${getStatusBadgeClass(
                              trade.status,
                            )}`}
                          >
                            {trade.status.toUpperCase()}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
