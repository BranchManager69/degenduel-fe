import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type {
  ContestPerformanceEntry,
  TimeFrame,
} from "../services/api/leaderboard";
import { ddApi } from "../services/api/leaderboard";

const REFRESH_INTERVAL = 30000; // 30 seconds
const PAGE_SIZE = 10;

const timeframeLabels: Record<TimeFrame, string> = {
  all: "All Time",
  month: "This Month",
  week: "This Week",
};

export const ContestPerformance = () => {
  const [rankings, setRankings] = useState<ContestPerformanceEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [timeframe, setTimeframe] = useState<TimeFrame>("month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRankings = async () => {
    try {
      setError(null);
      const data = await ddApi.leaderboard.getContestPerformance(
        timeframe,
        PAGE_SIZE,
        page * PAGE_SIZE
      );
      setRankings(data.rankings);
      setTotal(data.total);
    } catch (err) {
      setError(
        "Contest performance rankings are not available yet. Please check back later."
      );
      console.error("Error fetching rankings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
    const interval = setInterval(fetchRankings, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [page, timeframe]);

  const getTrendColor = (trend: "↑" | "↓" | "→") => {
    switch (trend) {
      case "↑":
        return "text-green-500";
      case "↓":
        return "text-red-500";
      default:
        return "text-gray-400";
    }
  };

  const formatAvgPosition = (avg: number | null) => {
    if (avg === null) return "-";
    return avg.toFixed(1);
  };

  if (loading && rankings.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-white mb-4">
          Contest Performance Rankings
        </h1>
        <div className="text-center py-8 text-gray-400">
          Loading rankings...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-white mb-4">
          Contest Performance Rankings
        </h1>
        <div className="bg-gray-800/50 rounded-lg p-8 text-center">
          <div className="text-red-400 mb-4">{error}</div>
          <div className="text-gray-400">
            This feature will be available soon. In the meantime, you can check
            out the{" "}
            <Link
              to="/rankings/global"
              className="text-purple-400 hover:text-purple-300"
            >
              Global Rankings
            </Link>
            .
          </div>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">
          Contest Performance Rankings
        </h1>
        <p className="text-gray-400">
          View the top traders ranked by their contest performance and win
          rates.
        </p>
      </div>

      <div className="flex justify-end mb-6">
        <div className="flex gap-2">
          {Object.entries(timeframeLabels).map(([value, label]) => (
            <button
              key={value}
              onClick={() => {
                setTimeframe(value as TimeFrame);
                setPage(0);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeframe === value
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">
                  Rank
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">
                  Player
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">
                  Win Rate
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">
                  Contests Won
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">
                  Win Streak
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">
                  Avg Position
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">
                  Trend
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">
                  Total Earnings
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 bg-gray-800/30">
              {rankings.map((entry) => (
                <tr
                  key={entry.wallet_address}
                  className="hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-white">
                    #{entry.rank}{" "}
                    <span className="text-sm text-gray-400">
                      (Top {entry.percentile.toFixed(1)}%)
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-white">{entry.nickname}</span>
                      <span className="text-sm text-gray-400">
                        {entry.wallet_address.slice(0, 6)}...
                        {entry.wallet_address.slice(-4)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-white">
                    {entry.win_rate.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 text-right text-white">
                    {entry.contests_won} / {entry.total_contests}
                  </td>
                  <td className="px-6 py-4 text-right text-white">
                    {entry.current_win_streak}
                    {entry.current_win_streak === entry.longest_win_streak ? (
                      <span
                        className="text-yellow-500 ml-1"
                        title="Personal Best"
                      >
                        ★
                      </span>
                    ) : (
                      <span className="text-gray-400 ml-1">
                        (Best: {entry.longest_win_streak})
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-white">
                    {formatAvgPosition(entry.avg_position)}
                  </td>
                  <td
                    className={`px-6 py-4 text-right ${getTrendColor(
                      entry.trend
                    )}`}
                  >
                    {entry.trend}
                  </td>
                  <td className="px-6 py-4 text-right text-white">
                    {parseInt(entry.total_earnings).toLocaleString()} pts
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            page === 0
              ? "bg-gray-800 text-gray-600"
              : "bg-purple-600 text-white hover:bg-purple-700"
          }`}
        >
          Previous
        </button>
        <span className="text-gray-400">
          Page {page + 1} of {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            page >= totalPages - 1
              ? "bg-gray-800 text-gray-600"
              : "bg-purple-600 text-white hover:bg-purple-700"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};
