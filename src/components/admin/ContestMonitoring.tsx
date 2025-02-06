import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { ddApi } from "../../services/dd-api";

interface ContestMonitoringData {
  id: number;
  contest_code: string;
  status: string;
  start_time: string;
  end_time: string;
  prize_pool: string;
  participant_count: number;
  min_entry: string;
  max_entry: string;
  total_entries: string;
  contest_wallet: string;
  wallet_balance: string;
  state_check: "SHOULD_START" | "SHOULD_END" | "SHOULD_AUTO_CANCEL" | "OK";
}

interface ContestMonitoringProps {
  refreshInterval?: number;
  autoRefresh?: boolean;
}

export const ContestMonitoring: React.FC<ContestMonitoringProps> = ({
  refreshInterval = 60000,
  autoRefresh = true,
}) => {
  const [monitoringData, setMonitoringData] = useState<ContestMonitoringData[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMonitoringData = async () => {
    try {
      setError(null);
      setIsRefreshing(true);
      const response = await ddApi.fetch("/admin/contests/monitoring");
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setMonitoringData(data.data);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      setError("Failed to fetch monitoring data");
      console.error(err);
      toast.error("Failed to fetch monitoring data");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchMonitoringData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const getStateCheckBadge = (
    stateCheck: ContestMonitoringData["state_check"]
  ) => {
    const badges = {
      SHOULD_START: "bg-green-500/20 text-green-400 border-green-500/50",
      SHOULD_END: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
      SHOULD_AUTO_CANCEL: "bg-red-500/20 text-red-400 border-red-500/50",
      OK: "bg-brand-500/20 text-brand-400 border-brand-500/50",
    };

    return badges[stateCheck] || badges.OK;
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
          Contest Monitoring
        </h2>
        <button
          onClick={fetchMonitoringData}
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
          {monitoringData.map((contest) => (
            <div
              key={contest.id}
              className="bg-dark-300/30 rounded-lg p-4 border border-dark-300"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-100">
                    {contest.contest_code}
                  </h3>
                  <p className="text-sm text-gray-400">ID: {contest.id}</p>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-sm border ${getStateCheckBadge(
                    contest.state_check
                  )}`}
                >
                  {contest.state_check.replace(/_/g, " ")}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <p className="text-gray-100">{contest.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Prize Pool</p>
                  <p className="text-gray-100">{contest.prize_pool} SOL</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Participants</p>
                  <p className="text-gray-100">{contest.participant_count}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Entries</p>
                  <p className="text-gray-100">{contest.total_entries} SOL</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Start Time</p>
                  <p className="text-gray-100">
                    {new Date(contest.start_time).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">End Time</p>
                  <p className="text-gray-100">
                    {new Date(contest.end_time).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Entry Range</p>
                  <p className="text-gray-100">
                    {contest.min_entry} - {contest.max_entry} SOL
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Wallet Balance</p>
                  <p className="text-gray-100">{contest.wallet_balance} SOL</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
