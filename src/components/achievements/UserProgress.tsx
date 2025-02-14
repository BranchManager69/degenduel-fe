import React from "react";
import { useStore } from "../../store/useStore";

const TIER_NAMES = {
  1: "NOVICE",
  11: "CONTENDER",
  21: "CHALLENGER",
  31: "MASTER",
  41: "LEGEND",
};

export const UserProgress: React.FC = () => {
  const { achievements } = useStore();
  const { userProgress } = achievements;

  if (!userProgress) {
    return (
      <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg border border-dark-300/20 p-6 animate-pulse">
        <div className="h-4 bg-dark-300/50 rounded w-1/3 mb-4"></div>
        <div className="h-2 bg-dark-300/50 rounded w-full"></div>
      </div>
    );
  }

  const currentTier = Object.entries(TIER_NAMES).reduce(
    (acc, [level, name]) => {
      if (userProgress.level >= parseInt(level)) {
        return name;
      }
      return acc;
    },
    "NOVICE"
  );

  const xpProgress = (
    (userProgress.experiencePoints / userProgress.nextLevelThreshold) *
    100
  ).toFixed(1);

  return (
    <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg border border-dark-300/20 p-6">
      {/* Level and Tier Display */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-2xl font-bold text-white">
            Level {userProgress.level}
          </h3>
          <p className="text-sm text-brand-400">{currentTier} Tier</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Total XP</p>
          <p className="text-lg font-bold text-white">
            {userProgress.experiencePoints.toLocaleString()}
          </p>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="space-y-2">
        <div className="h-2 bg-dark-300 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-500"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>{userProgress.experiencePoints.toLocaleString()} XP</span>
          <span>{userProgress.nextLevelThreshold.toLocaleString()} XP</span>
        </div>
      </div>

      {/* Achievement Progress */}
      <div className="mt-6 space-y-4">
        <h4 className="text-sm font-medium text-gray-300">
          Achievement Progress
        </h4>
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(userProgress.tierProgress.achievements).map(
            ([tier, count]) => (
              <div
                key={tier}
                className="text-center p-2 rounded bg-dark-300/30 border border-dark-300/20"
              >
                <div className="text-xs text-gray-400 mb-1">{tier}</div>
                <div className="text-lg font-bold text-white">{count}</div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
