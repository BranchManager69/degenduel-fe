import React from "react";
import { Card } from "../ui/Card";

export interface Achievement {
  achievement: string;
  achieved_at: string;
  display_name: string;
}

interface AchievementCardProps {
  achievement: Achievement;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
}) => {
  const getAchievementIcon = (type: string) => {
    switch (type) {
      case "first_contest":
        return "🎯";
      case "three_contests":
        return "🎲";
      case "five_contests":
        return "🏆";
      default:
        return "🌟";
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300 p-4">
      <div className="flex items-center space-x-4">
        <div className="text-3xl">
          {getAchievementIcon(achievement.achievement)}
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-100">
            {achievement.display_name}
          </h4>
          <p className="text-sm text-gray-400">
            Achieved on {formatDate(achievement.achieved_at)}
          </p>
        </div>
      </div>
    </Card>
  );
};
