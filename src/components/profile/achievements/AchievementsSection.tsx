import React, { useEffect, useState } from "react";

import { AchievementsList } from "./AchievementsList";
import { ddApi } from "../../../services/dd-api";
import { useStore } from "../../../store/useStore";
import { Achievement } from "../../../types/profile";
import { ErrorMessage } from "../../common/ErrorMessage";
import { LoadingSpinner } from "../../common/LoadingSpinner";

export const AchievementsSection: React.FC = () => {
  const { user, maintenanceMode } = useStore();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAchievements = async () => {
      if (!user?.wallet_address || maintenanceMode) {
        setLoading(false);
        return;
      }

      try {
        setError(null);
        const achievementsResponse = await ddApi.stats.getAchievements(
          user.wallet_address,
        );
        setAchievements(achievementsResponse);
      } catch (err) {
        if (err instanceof Response && err.status === 503) {
          // Maintenance mode response, don't set error
          return;
        }
        setError(
          err instanceof Error ? err.message : "Failed to load achievements",
        );
      } finally {
        setLoading(false);
      }
    };

    loadAchievements();
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
    <div className="relative group overflow-hidden rounded-lg backdrop-blur-sm border border-dark-300/20">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative">
        <AchievementsList achievements={achievements} />
      </div>
    </div>
  );
};
