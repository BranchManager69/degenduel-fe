import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { ddApi } from "../../services/dd-api";

interface ContestPerformanceData {
  contest_id: number;
  contest_code: string;
  status: string;
  total_participants: number;
  refunded_count: number;
  winners_paid_count: number;
  total_entry_amount: string;
  total_prize_amount: string;
  total_refund_amount: string;
  total_transactions: number;
  failed_transactions: number;
}

interface ContestPerformanceProps {
  refreshInterval?: number;
  autoRefresh?: boolean;
}

export const ContestPerformance: React.FC<ContestPerformanceProps> = ({
  refreshInterval = 300000, // 5 minutes
  autoRefresh = true,
}) => {
  const [performanceData, setPerformanceData] = useState<
    ContestPerformanceData[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPerformanceData = async () => {
    try {
      setError(null);
      setIsRefreshing(true);
      const response = await ddApi.fetch("/admin/contests/metrics");
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setPerformanceData(data.data);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      setError("Failed to fetch performance metrics");
      console.error(err);
      toast.error("Failed to fetch performance metrics");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchPerformanceData, refreshInterval);
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
          Contest Performance
        </h2>
        <button
          onClick={fetchPerformanceData}
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
        <div className="grid grid-cols-1 gap-4">
          {performanceData.map((contest) => (
            <div
              key={contest.contest_id}
              className="bg-dark-300/30 rounded-lg p-4 border border-dark-300"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-100">
                    {contest.contest_code}
                  </h3>
                  <p className="text-sm text-gray-400">
                    ID: {contest.contest_id}
                  </p>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-sm border 
                  ${
                    contest.status === "completed"
                      ? "bg-green-500/20 text-green-400 border-green-500/50"
                      : "bg-brand-500/20 text-brand-400 border-brand-500/50"
                  }`}
                >
                  {contest.status.toUpperCase()}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Total Participants</p>
                  <p className="text-gray-100">{contest.total_participants}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Winners Paid</p>
                  <p className="text-gray-100">{contest.winners_paid_count}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Refunded</p>
                  <p className="text-gray-100">{contest.refunded_count}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Transactions</p>
                  <p className="text-gray-100">{contest.total_transactions}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Entry Amount</p>
                  <p className="text-gray-100">
                    {contest.total_entry_amount} SOL
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Prize Amount</p>
                  <p className="text-gray-100">
                    {contest.total_prize_amount} SOL
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Refund Amount</p>
                  <p className="text-gray-100">
                    {contest.total_refund_amount} SOL
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Failed Transactions</p>
                  <p
                    className={`${
                      contest.failed_transactions > 0
                        ? "text-red-400"
                        : "text-gray-100"
                    }`}
                  >
                    {contest.failed_transactions}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
