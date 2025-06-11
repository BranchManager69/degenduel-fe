import React, { memo } from "react";

import { AchievementCard } from "./AchievementCard";
import { Achievement } from "../../types/profile";

interface AchievementsListProps {
  achievements: Achievement[];
}

export const AchievementsList: React.FC<AchievementsListProps> = memo(({
  achievements,
}) => {
  if (achievements.length === 0) {
    return (
      <div className="p-6 rounded-lg border border-dark-300/20 bg-dark-200/30">
        <div className="text-center space-y-3">
          <div className="text-3xl">🏆</div>
          <div>
            <h3 className="text-lg font-semibold text-brand-300 mb-1">
              No Achievements Yet
            </h3>
            <p className="text-gray-400 text-sm">
              Start competing in contests to earn achievements and unlock rewards!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-dark-300/20">
      {achievements.map((achievement) => (
        <AchievementCard key={achievement.achievement} achievement={achievement} />
      ))}
    </div>
  );
});

AchievementsList.displayName = 'AchievementsList';
