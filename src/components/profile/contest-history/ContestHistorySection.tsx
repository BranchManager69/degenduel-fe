import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { ddApi } from "../../../services/dd-api";
import { useStore } from "../../../store/useStore";
import { ContestHistoryEntry } from "../../../types/profile";
import { ErrorMessage } from "../../common/ErrorMessage";
import { LoadingSpinner } from "../../common/LoadingSpinner";
import { ContestHistoryList } from "./ContestHistoryList";

export const ContestHistorySection: React.FC = () => {
  const { user, maintenanceMode } = useStore();
  const [contestHistory, setContestHistory] = useState<ContestHistoryEntry[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContestHistory = async () => {
      if (!user?.wallet_address || maintenanceMode) {
        setLoading(false);
        return;
      }

      try {
        setError(null);
        const response = await ddApi.stats.getHistory(
          user.wallet_address,
          10,
          0
        );

        // Handle the new response structure
        if (response.success) {
          // Map the API response data to match the ContestHistoryEntry type
          const mappedHistory = response.data.map((entry: any) => ({
            contest_id: entry.contest_id.toString(),
            contest_name: entry.contest_name,
            start_time: entry.start_time,
            end_time: entry.end_time,
            portfolio_return: Number(entry.portfolio_return),
            rank: Number(entry.rank),
          }));
          setContestHistory(mappedHistory);
        } else {
          setError(response.message || "Failed to load contest history");
        }
      } catch (err) {
        if (err instanceof Response && err.status === 503) {
          // Maintenance mode response, don't set error
          return;
        }
        setError(
          err instanceof Error ? err.message : "Failed to load contest history"
        );
      } finally {
        setLoading(false);
      }
    };

    loadContestHistory();
  }, [user?.wallet_address, maintenanceMode]);

  if (loading) {
    return (
      <div className="h-32 flex items-center justify-center bg-dark-200/50 backdrop-blur-sm rounded-lg border border-dark-300/20">
        <LoadingSpinner size="lg" className="animate-cyber-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-500/20 rounded-lg p-4 relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/5 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
        <ErrorMessage message={error} className="animate-glitch" />
      </div>
    );
  }

  return (
    <div className="relative group overflow-hidden rounded-lg backdrop-blur-sm border border-dark-300/20">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative">
        {contestHistory.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-8 rounded-lg border border-dark-300/20 backdrop-blur-sm relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Empty state content */}
            <div className="relative text-center space-y-4">
              <div className="text-4xl animate-bounce">⚔️</div>
              <div>
                <h3 className="text-xl font-cyber text-brand-300 mb-2">
                  No Duels Yet
                </h3>
                <p className="text-gray-400 group-hover:animate-cyber-pulse">
                  Ready to test your trading skills? Join your first duel and
                  start climbing the ranks!
                </p>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-brand-500/20 to-transparent" />
                <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-brand-500/20 to-transparent" />
              </div>
            </div>
          </motion.div>
        ) : (
          <ContestHistoryList history={contestHistory} />
        )}
      </div>
    </div>
  );
};
