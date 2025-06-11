import React from "react";

import { Achievement } from "../../types/profile";

interface AchievementCardProps {
  achievement: Achievement;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
}) => {

  const getAchievementIcon = (type: string) => {
    if (achievement.icon) return achievement.icon;

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
    if (!dateStr) return "Recently earned";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Recently earned";
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Recently earned";
    }
  };


  return (
    <div className="block p-4 hover:bg-dark-300/20 transition-colors relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl">
            {getAchievementIcon(achievement.achievement)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-gray-200 font-medium group-hover:text-brand-400 transition-colors">
                {achievement.description || "Achievement"}
              </h3>
              {achievement.rarity && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                  achievement.rarity === "legendary" 
                    ? "bg-amber-500/20 text-amber-400 border-amber-500/30" 
                    : achievement.rarity === "epic"
                      ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                      : achievement.rarity === "rare"
                        ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                }`}>
                  {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400">
              Earned {formatDate(achievement.earned_at)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
