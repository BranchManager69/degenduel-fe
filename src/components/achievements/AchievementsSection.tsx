import React, { useEffect, useState } from "react";

import { AchievementsList } from "./AchievementsList";
import { ddApi } from "../../services/dd-api";
import { useStore } from "../../store/useStore";
import { Achievement } from "../../types/profile";
import { ErrorMessage } from "../common/ErrorMessage";
import { LoadingSpinner } from "../common/LoadingSpinner";

interface AchievementsSectionProps {
  walletAddress?: string; // Optional for public profiles
  className?: string;
}

export const AchievementsSection: React.FC<AchievementsSectionProps> = ({
  walletAddress,
  className = "",
}) => {
  const { user, maintenanceMode } = useStore();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAchievements = async () => {
      // Use provided wallet address or fall back to logged-in user
      const targetWallet = walletAddress || user?.wallet_address;

      if (!targetWallet || maintenanceMode) {
        setLoading(false);
        return;
      }

      try {
        setError(null);
        const achievementsResponse =
          await ddApi.stats.getAchievements(targetWallet);
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
  }, [walletAddress, user?.wallet_address, maintenanceMode]);

  if (loading) {
    return (
      <div
        className={`h-32 flex items-center justify-center bg-dark-200/50 backdrop-blur-sm rounded-lg border border-dark-300/20 ${className}`}
      >
        <LoadingSpinner size="lg" className="animate-cyber-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`border border-red-500/20 rounded-lg p-4 relative group ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/5 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream-responsive" />
        <ErrorMessage message={error} className="animate-glitch" />
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-dark-300/20 bg-dark-200/30 ${className}`}>
      <AchievementsList achievements={achievements} />
    </div>
  );
};
