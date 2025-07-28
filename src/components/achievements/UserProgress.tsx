import React, { useEffect, useState } from "react";

import { ddApi } from "../../services/dd-api";
import { UserLevel } from "../../services/userService";
import { useStore } from "../../store/useStore";

// Define tier colors for visual representation
const TIER_COLORS = {
  bronze: "from-amber-700 to-amber-500",
  silver: "from-gray-400 to-gray-300",
  gold: "from-yellow-500 to-yellow-300",
  platinum: "from-cyan-500 to-cyan-300",
  diamond: "from-violet-500 to-violet-300",
};

interface UserProgressProps {
  walletAddress?: string; // Optional for public profiles
}

export const UserProgress: React.FC<UserProgressProps> = ({
  walletAddress,
}) => {
  const { user } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [levelData, setLevelData] = useState<UserLevel | null>(null);

  useEffect(() => {
    // Use provided wallet address or fall back to logged-in user
    const targetWallet = walletAddress || user?.wallet_address;

    if (!targetWallet) {
      setLoading(false);
      return;
    }

    const fetchLevelData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use our new getUserLevel API function
        const userData = await ddApi.users.getUserLevel(targetWallet);
        setLevelData(userData);
      } catch (err) {
        console.error("Error fetching user level data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load user progress",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLevelData();
  }, [walletAddress, user?.wallet_address]);

  if (loading) {
    return (
      <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg border border-dark-300/20 p-6 animate-pulse">
        <div className="h-4 bg-dark-300/50 rounded w-1/3 mb-4"></div>
        <div className="h-2 bg-dark-300/50 rounded w-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg border border-red-500/20 p-6">
        <p className="text-red-400">Failed to load user progress</p>
      </div>
    );
  }

  if (!levelData) {
    return (
      <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg border border-dark-300/20 p-6">
        <p className="text-gray-400">No progress data available</p>
      </div>
    );
  }

  const { current_level, experience, achievements } = levelData;

  return (
    <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg border border-dark-300/20 p-6 group relative overflow-hidden">
      {/* Fancy background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      {/* Level Badge and Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 relative">
        <div className="flex items-center gap-4">
          {/* Level Badge with Image if available */}
          <div className="relative">
            <div className="h-16 w-16 rounded-full bg-gradient-to-r from-brand-400 to-brand-600 flex items-center justify-center">
              {current_level.icon_url ? (
                <img
                  src={current_level.icon_url}
                  alt={`Level ${current_level.level_number}`}
                  className="h-14 w-14 rounded-full object-cover"
                  onError={(e) => {
                    // If image fails to load, show the level number
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {current_level.level_number}
                </span>
              )}
            </div>

            {/* Level number overlay */}
            <div className="absolute -bottom-2 -right-2 h-6 w-6 rounded-full bg-dark-100 border border-brand-400 flex items-center justify-center">
              <span className="text-xs font-bold text-brand-400">
                {current_level.level_number}
              </span>
            </div>
          </div>

          {/* Level Info */}
          <div>
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-brand-600">
              {current_level.title}
            </h3>
            <p className="text-sm text-gray-400">
              {current_level.class_name} Class
            </p>
          </div>
        </div>

        {/* XP Counter */}
        <div className="mt-4 md:mt-0 bg-dark-300/30 px-4 py-2 rounded-lg border border-dark-300/20">
          <p className="text-xs text-gray-400">Experience Points</p>
          <div className="flex items-end gap-1">
            <p className="text-lg font-bold text-white">
              {experience.current.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mb-0.5">
              / {experience.next_level_at.toLocaleString()} XP
            </p>
          </div>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="space-y-2 mb-6">
        <div className="h-3 bg-dark-300/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-1000 animate-pulse-slow"
            style={{ width: `${experience.percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>Current Level</span>
          <span>
            {Math.floor(experience.percentage)}% progress to Level {current_level.level_number + 1}
          </span>
        </div>
      </div>

      {/* Achievement Progress Section */}
      <div className="mt-6 space-y-4">
        <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
          <span>🏆</span>
          <span>Achievement Progress</span>
        </h4>
        <div className="grid grid-cols-5 gap-3">
          {Object.entries(achievements).map(([tier, { current, required }]) => (
            <div key={tier} className="relative group/tier overflow-hidden">
              <div
                className={`text-center p-3 rounded bg-dark-300/30 border border-dark-300/20 transition-all duration-300 group-hover/tier:border-${tier}-500/40`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover/tier:opacity-100 transition-opacity duration-500"></div>

                {/* Tier Name */}
                <div
                  className={`text-xs font-medium mb-1 uppercase text-transparent bg-clip-text bg-gradient-to-r ${TIER_COLORS[tier as keyof typeof TIER_COLORS]}`}
                >
                  {tier}
                </div>

                {/* Count with Progress Indicator */}
                <div className="relative">
                  <div className="text-lg font-bold text-white">
                    {current}
                    {required > 0 && (
                      <span className="text-xs text-gray-400">/{required}</span>
                    )}
                  </div>

                  {/* Progress circle for tiers with requirements */}
                  {required > 0 && (
                    <div className="absolute -top-1 -right-1 h-5 w-5">
                      <svg viewBox="0 0 36 36" className="w-full h-full">
                        <path
                          d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#444"
                          strokeWidth="3"
                          strokeDasharray="100, 100"
                        />
                        <path
                          d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke={
                            tier === "bronze"
                              ? "#B87333"
                              : tier === "silver"
                                ? "#C0C0C0"
                                : tier === "gold"
                                  ? "#FFD700"
                                  : tier === "platinum"
                                    ? "#E5E4E2"
                                    : "#B9F2FF"
                          }
                          strokeWidth="3"
                          strokeDasharray={`${(current / required) * 100}, 100`}
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
