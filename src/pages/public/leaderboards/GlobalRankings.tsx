// src/pages/public/leaderboards/GlobalRankings.tsx

import { useEffect, useState } from "react";

import { ddApi, formatBonusPoints } from "../../../services/dd-api";
import type { GlobalRankingEntry } from "../../../types/leaderboard";

const PAGE_SIZE = 10;

export const GlobalRankings = () => {
  const [rankings, setRankings] = useState<GlobalRankingEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  const fetchRankings = async () => {
    try {
      setError(null);

      // First check maintenance mode
      try {
        const isInMaintenance = await ddApi.admin.checkMaintenanceMode();
        setIsMaintenanceMode(isInMaintenance);

        // If in maintenance mode, don't fetch rankings
        if (isInMaintenance) {
          setError(
            "⚙️ DegenDuel is currently undergoing scheduled maintenance. Please try again later.",
          );
          setLoading(false);
          return;
        }
      } catch (maintenanceErr) {
        console.error("Error checking maintenance mode:", maintenanceErr);
        // Continue anyway, as this is just a check
      }

      try {
        const data = await ddApi.leaderboard.getGlobalRankings(
          PAGE_SIZE,
          page * PAGE_SIZE,
        );

        if (!data || !data.rankings) {
          throw new Error("Invalid data format received from API");
        }

        setRankings(data.rankings);
        setTotal(data.total || 0);
      } catch (dataErr) {
        if (dataErr instanceof Error && dataErr.message.includes("503")) {
          setIsMaintenanceMode(true);
          setError(
            "⚙️ DegenDuel is currently undergoing scheduled maintenance. Please try again later.",
          );
        } else {
          setError("Failed to load rankings. Please try again later.");
          console.error("Error fetching rankings data:", dataErr);
        }
      }
    } catch (err) {
      // Catch-all error handler
      setError("Failed to load rankings. Please try again later.");
      console.error("Fatal error in fetchRankings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();

    // Set up periodic maintenance check
    const maintenanceCheckInterval = setInterval(async () => {
      try {
        const isInMaintenance = await ddApi.admin.checkMaintenanceMode();
        setIsMaintenanceMode(isInMaintenance);
        if (isInMaintenance) {
          setError(
            "⚙️ DegenDuel is currently undergoing scheduled maintenance. Please try again later.",
          );
        }
      } catch (err) {
        console.error("Failed to check maintenance status:", err);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(maintenanceCheckInterval);
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-100 mb-4 relative group">
          <span className="relative z-10">Global Rankings</span>
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </h1>
        <div className="text-center py-8 text-gray-400">
          Loading rankings...
        </div>
      </div>
    );
  }

  if (isMaintenanceMode) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-100 mb-4 relative group">
          <span className="relative z-10 group-hover:animate-glitch">
            Global Rankings
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
        </h1>
        <div className="text-center p-8 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
          <div className="flex items-center justify-center gap-2 text-yellow-400">
            <span className="animate-pulse">⚠</span>
            <span>
              ⚙️ DegenDuel is currently undergoing scheduled maintenance. Please
              try again later.
            </span>
            <span className="animate-pulse">⚠</span>
          </div>
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

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Handle the case where rankings is empty but there's no error
  if (rankings.length === 0 && !loading && !error) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8 relative group">
          <h1 className="text-3xl font-bold text-gray-100 mb-4 relative">
            <span className="relative z-10">Global Rankings</span>
            <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </h1>
          <p className="text-gray-400">
            View the top traders ranked by their performance across all
            contests.
          </p>
        </div>

        <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-8 text-center">
          <p className="text-gray-400 text-lg">
            No ranking data available yet.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Check back soon as players complete more contests!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-8 relative group">
        <h1 className="text-3xl font-bold text-gray-100 mb-4 relative">
          <span className="relative z-10">Global Rankings</span>
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </h1>
        <p className="text-gray-400">
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
                      <span className="text-gray-100">#{entry.rank}</span>
                      <span className="text-sm text-gray-400 group-hover/row:text-brand-400 transition-colors">
                        (Top {entry.percentile?.toFixed(1) || "0.0"}%)
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-gray-100">
                        {entry.nickname || "Anonymous"}
                      </span>
                      <span className="text-sm text-gray-400">
                        {entry.wallet_address?.slice(0, 6) || ""}...
                        {entry.wallet_address?.slice(-4) || ""}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-100">
                    {formatBonusPoints(entry.rank_score || 0)}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-100">
                    {formatBonusPoints(entry.highest_rank_score || 0)}
                  </td>
                  <td
                    className={`px-6 py-4 text-right ${getTrendColor(
                      entry.trend || "→",
                    )}`}
                  >
                    {entry.trend || "→"}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-100">
                    {formatAvgPosition(entry.avg_position)}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-100">
                    {entry.total_contests || 0}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-brand-400 font-medium">
                      {parseInt(entry.total_earnings || "0").toLocaleString()}{" "}
                      pts
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
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 via-brand-500/20 to-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <span className="relative">Previous</span>
        </button>
        <span className="text-gray-400">
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
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 via-brand-500/20 to-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <span className="relative">Next</span>
        </button>
      </div>
    </div>
  );
};
