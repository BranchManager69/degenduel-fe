import React, { useEffect, useState } from "react";

import { ContestHistoryList } from "./ContestHistoryList";
import { useStore } from "../../../store/useStore";
import { UserPortfolio } from "../../../types/profile";
import { ErrorMessage } from "../../common/ErrorMessage";
import { LoadingSpinner } from "../../common/LoadingSpinner";

export const ContestHistorySection: React.FC = () => {
  const { user, maintenanceMode } = useStore();
  const [portfolios, setPortfolios] = useState<UserPortfolio[]>([]);
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
        
        // Use the comprehensive portfolios endpoint
        const response = await fetch(`/api/portfolios/user/${user.wallet_address}`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          // Sort by contest start time descending (most recent first)
          const sortedPortfolios = data.portfolios.sort((a: UserPortfolio, b: UserPortfolio) => {
            return new Date(b.contest.start_time).getTime() - new Date(a.contest.start_time).getTime();
          });
          setPortfolios(sortedPortfolios.slice(0, 10)); // Limit to 10 most recent
        } else {
          const errorData = await response.json();
          setError(errorData.message || "Failed to load contest history");
        }
      } catch (err) {
        if (err instanceof Response && err.status === 503) {
          // Maintenance mode response, don't set error
          return;
        }
        setError(
          err instanceof Error ? err.message : "Failed to load contest history",
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
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/5 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream-responsive" />
        <ErrorMessage message={error} className="animate-glitch" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-dark-300/20 bg-dark-200/30">
      {portfolios.length === 0 ? (
        <div className="p-6">
          <div className="text-center space-y-3">
            <div className="text-3xl">⚔️</div>
            <div>
              <h3 className="text-lg font-semibold text-brand-300 mb-1">
                No Duels Yet
              </h3>
              <p className="text-gray-400 text-sm">
                Ready to test your trading skills? Join your first duel and start climbing the ranks!
              </p>
            </div>
          </div>
        </div>
      ) : (
        <ContestHistoryList portfolios={portfolios} />
      )}
    </div>
  );
};
