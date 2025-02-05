// src/pages/public/GlobalRankings.tsx

import { useEffect, useState } from "react";
import { ddApi, formatBonusPoints } from "../../services/dd-api";
import type { GlobalRankingEntry } from "../../types/leaderboard";

const REFRESH_INTERVAL = 30000; // 30 seconds
const PAGE_SIZE = 10;

export const GlobalRankings = () => {
  const [rankings, setRankings] = useState<GlobalRankingEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRankings = async () => {
    try {
      setError(null);
      const data = await ddApi.leaderboard.getGlobalRankings(
        PAGE_SIZE,
        page * PAGE_SIZE
      );
      setRankings(data.rankings);
      setTotal(data.total);
    } catch (err) {
      setError("Failed to load rankings. Please try again later.");
      console.error("Error fetching rankings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
    const interval = setInterval(fetchRankings, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [page]);

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
        <h1 className="text-3xl font-bold text-gray-100 mb-4 relative group">
          <span className="relative z-10 group-hover:animate-glitch">
            Global Rankings
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
        </h1>
        <div className="text-center py-8 text-gray-400 animate-cyber-pulse">
          Loading rankings...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-100 mb-4 relative group">
          <span className="relative z-10 group-hover:animate-glitch">
            Global Rankings
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
        </h1>
        <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-8 text-center relative group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
          <div className="text-red-400 mb-2 animate-glitch relative z-10">
            {error}
          </div>
          <p className="text-gray-400 relative z-10">Please try again later.</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-8 relative group">
        <h1 className="text-3xl font-bold text-gray-100 mb-4 relative">
          <span className="relative z-10 group-hover:animate-glitch">
            Global Rankings
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
        </h1>
        <p className="text-gray-400 group-hover:animate-cyber-pulse">
          View the top traders ranked by their performance across all contests.
        </p>
      </div>

      <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="overflow-x-auto relative">
          <table className="min-w-full divide-y divide-dark-300">
            <thead className="bg-dark-300/50">
              <tr>
                {[
                  "Rank",
                  "Player",
                  "Rating",
                  "Highest Rating",
                  "Trend",
                  "Avg Position",
                  "Total Contests",
                  "Total Earnings",
                ].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-4 text-left text-sm font-medium text-gray-400 group-hover:text-brand-400 transition-colors"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-300 bg-dark-200/30">
              {rankings.map((entry) => (
                <tr
                  key={entry.wallet_address}
                  className="hover:bg-dark-300/50 transition-colors group/row"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-100 group-hover/row:animate-cyber-pulse">
                        #{entry.rank}
                      </span>
                      <span className="text-sm text-gray-400 group-hover/row:text-brand-400 transition-colors">
                        (Top {entry.percentile.toFixed(1)}%)
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col group-hover/row:animate-cyber-scan">
                      <span className="text-gray-100">{entry.nickname}</span>
                      <span className="text-sm text-gray-400">
                        {entry.wallet_address.slice(0, 6)}...
                        {entry.wallet_address.slice(-4)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-100 group-hover/row:animate-neon-flicker">
                    {formatBonusPoints(entry.rank_score)}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-100 group-hover/row:animate-neon-flicker">
                    {formatBonusPoints(entry.highest_rank_score)}
                  </td>
                  <td
                    className={`px-6 py-4 text-right ${getTrendColor(
                      entry.trend
                    )} group-hover/row:animate-glitch`}
                  >
                    {entry.trend}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-100 group-hover/row:animate-cyber-pulse">
                    {formatAvgPosition(entry.avg_position)}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-100 group-hover/row:animate-cyber-pulse">
                    {entry.total_contests}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-brand-400 font-medium group-hover/row:animate-neon-flicker">
                      {parseInt(entry.total_earnings).toLocaleString()} pts
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Pagination */}
      <div className="flex justify-between items-center mt-6">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className={`px-4 py-2 rounded-lg font-medium transition-all relative group overflow-hidden ${
            page === 0
              ? "bg-dark-300 text-gray-600 cursor-not-allowed"
              : "bg-brand-500 text-white hover:bg-brand-600"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 via-brand-500/20 to-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />
          <span className="relative group-hover:animate-glitch">Previous</span>
        </button>
        <span className="text-gray-400 group-hover:animate-cyber-pulse">
          Page {page + 1} of {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1}
          className={`px-4 py-2 rounded-lg font-medium transition-all relative group overflow-hidden ${
            page >= totalPages - 1
              ? "bg-dark-300 text-gray-600 cursor-not-allowed"
              : "bg-brand-500 text-white hover:bg-brand-600"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 via-brand-500/20 to-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />
          <span className="relative group-hover:animate-glitch">Next</span>
        </button>
      </div>
    </div>
  );
};
