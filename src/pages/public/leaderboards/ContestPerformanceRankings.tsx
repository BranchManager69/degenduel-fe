// src/pages/public/leaderboards/ContestPerformanceRankings.tsx

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ddApi } from "../../../services/dd-api";
import type {
  ContestPerformanceEntry,
  TimeFrame,
} from "../../../types/leaderboard";

// Constants
const REFRESH_INTERVAL = 30000; // 30 seconds
const PAGE_SIZE = 10;
const timeframeLabels: Record<TimeFrame, string> = {
  all: "All Time",
  month: "This Month",
  week: "This Week",
};

// Contest performance rankings page
export const ContestPerformance = () => {
  const [rankings, setRankings] = useState<ContestPerformanceEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [timeframe, setTimeframe] = useState<TimeFrame>("month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch rankings
  const fetchRankings = async () => {
    // Reset loading state
    setLoading(true);
    // Reset error state
    setError(null);

    // Fetch rankings
    try {
      const data = await ddApi.leaderboard.getContestPerformance(
        timeframe,
        PAGE_SIZE,
        page * PAGE_SIZE
      );
      // Update rankings
      setRankings(data.rankings);
      // Update total number of rankings
      setTotal(data.total);
    } catch (err) {
      // Set error message
      setError(
        "Contest performance rankings are not available yet. Please check back later."
      );
      // Log error
      console.error("Error fetching rankings:", err);
    } finally {
      // Reset loading state
      setLoading(false);
    }
  };

  // Fetch rankings on mount and refresh interval
  useEffect(() => {
    fetchRankings();
    const interval = setInterval(fetchRankings, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [page, timeframe]);

  // Helper function to get trend color
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

  // Helper function to format average position
  const formatAvgPosition = (avg: number | null) => {
    if (avg === null) return "-";
    return avg.toFixed(1);
  };

  // Loading state
  if (loading && rankings.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-100 mb-4 relative group">
          <span className="relative z-10 group-hover:animate-glitch">
            Degen Rankings
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
        </h1>
        <div className="text-center py-8 text-gray-400 animate-cyber-pulse">
          Loading Degen Rankings...
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-100 mb-4 relative group">
          <span className="relative z-10 group-hover:animate-glitch">
            Degen Rankings
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
        </h1>
        <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-8 text-center relative group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
          <div className="text-red-400 mb-4 animate-glitch relative z-10">
            {error}
          </div>

          <div className="text-gray-400 relative z-10">
            Degen Rankings will be available soon. Until then, check out the{" "}
            <Link
              to="/rankings/global"
              className="text-brand-400 hover:text-brand-300 group-hover:animate-cyber-pulse"
            >
              Global Leaderboard
            </Link>
            to see the DDPoint leaders.
          </div>
        </div>
      </div>
    );
  }

  // Calculate total pages of rankings
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Render the Degen Rankings page
  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8 relative group">
        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-100 mb-4 relative">
          <span className="relative z-10 group-hover:animate-glitch">
            Degen Rankings
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
        </h1>
        {/* Description */}
        <p className="text-gray-400 group-hover:animate-cyber-pulse">
          Degen Rankings are calculated based on true performance and
          competitive win rates.
        </p>
      </div>

      {/* Timeframe selector */}
      <div className="flex justify-end mb-6">
        <div className="flex gap-2">
          {Object.entries(timeframeLabels).map(([value, label]) => (
            <button
              key={value}
              onClick={() => {
                setTimeframe(value as TimeFrame);
                setPage(0);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all relative group overflow-hidden ${
                timeframe === value
                  ? "bg-brand-500 text-white"
                  : "bg-dark-300 text-gray-400 hover:bg-dark-400"
              }`}
            >
              {/* Timeframe button */}
              <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 via-brand-500/20 to-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />
              {/* Timeframe button label */}
              <span className="relative z-10 group-hover:animate-glitch">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Degen Rankings table */}
      <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg overflow-hidden relative group">
        {/* Table background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {/* Table container */}
        <div className="overflow-x-auto relative">
          {/* Table */}
          <table className="min-w-full divide-y divide-dark-300">
            {/* Table header */}
            <thead className="bg-dark-300/50">
              {/* Table header row */}
              <tr>
                {/* Table header cells */}
                {[
                  "Rank",
                  "Player",
                  "Win Rate",
                  "Contests Won",
                  "Win Streak",
                  "Avg Position",
                  "Trend",
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

            {/* Table body */}
            <tbody className="divide-y divide-dark-300 bg-dark-200/30">
              {/* Table body rows */}
              {rankings.map((entry) => (
                <tr
                  key={entry.wallet_address}
                  className="hover:bg-dark-300/50 transition-colors group/row"
                >
                  {/* Table body cells */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {/* Table body cell content */}
                    <div className="flex items-center space-x-2">
                      {/* Rank */}
                      <span className="text-gray-100 group-hover/row:animate-cyber-pulse">
                        #{entry.rank}
                      </span>

                      {/* Percentile */}
                      <span className="text-sm text-gray-400 group-hover/row:text-brand-400 transition-colors">
                        (Top {entry.percentile.toFixed(1)}%)
                      </span>
                    </div>
                  </td>

                  {/* Player */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col group-hover/row:animate-cyber-scan">
                      {/* Player name */}
                      <span className="text-gray-100">{entry.nickname}</span>

                      {/* Player wallet address */}
                      <span className="text-sm text-gray-400">
                        {entry.wallet_address.slice(0, 6)}...
                        {entry.wallet_address.slice(-4)}
                      </span>
                    </div>
                  </td>

                  {/* Win rate */}
                  <td className="px-6 py-4 text-right text-gray-100 group-hover/row:animate-neon-flicker">
                    {entry.win_rate.toFixed(1)}%
                  </td>

                  {/* Contests won */}
                  <td className="px-6 py-4 text-right text-gray-100 group-hover/row:animate-cyber-pulse">
                    {entry.contests_won} / {entry.total_contests}
                  </td>

                  {/* Win streak */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      {/* Current win streak */}
                      <span className="text-gray-100 group-hover/row:animate-cyber-pulse">
                        {entry.current_win_streak}
                      </span>

                      {/* Personal best win streak */}
                      {entry.current_win_streak === entry.longest_win_streak ? (
                        <span
                          className="text-yellow-500 group-hover/row:animate-neon-flicker"
                          title="Personal Best"
                        >
                          ★
                        </span>
                      ) : (
                        <span className="text-gray-400 group-hover/row:text-brand-400 transition-colors">
                          (Best: {entry.longest_win_streak})
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Avg position */}
                  <td className="px-6 py-4 text-right text-gray-100 group-hover/row:animate-cyber-pulse">
                    {formatAvgPosition(entry.avg_position)}
                  </td>

                  {/* Trend */}
                  <td
                    className={`px-6 py-4 text-right ${getTrendColor(
                      entry.trend
                    )} group-hover/row:animate-glitch`}
                  >
                    {entry.trend}
                  </td>

                  {/* Total earnings */}
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
