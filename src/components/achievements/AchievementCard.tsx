import React from "react";

import { Achievement } from "../../types/profile";

interface AchievementCardProps {
  achievement: Achievement;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
}) => {


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
    <div className="block p-4 transition-colors relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative flex items-center justify-between">
        <div className="flex-1">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-gray-200 via-white to-gray-200 bg-clip-text text-transparent group-hover:from-brand-300 group-hover:via-cyan-200 group-hover:to-brand-300 transition-all duration-300">
              {achievement.description || "Achievement"}
            </h3>
            <p className="text-sm text-gray-400">
              Earned {formatDate(achievement.earned_at)}
            </p>
          </div>
        </div>
        {achievement.rarity && (
          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border-2 ${
            achievement.rarity === "legendary" 
              ? "bg-gradient-to-r from-amber-900/50 to-orange-900/50 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(251,191,36,0.3)]" 
              : achievement.rarity === "epic"
                ? "bg-gradient-to-r from-purple-900/50 to-pink-900/50 text-purple-300 border-purple-500/50 shadow-[0_0_8px_rgba(168,85,247,0.3)]"
                : achievement.rarity === "rare"
                  ? "bg-gradient-to-r from-blue-900/50 to-cyan-900/50 text-blue-300 border-blue-500/50 shadow-[0_0_6px_rgba(59,130,246,0.3)]"
                  : "bg-gradient-to-r from-gray-800/50 to-gray-700/50 text-gray-300 border-gray-600/50"
          }`}>
            {achievement.rarity === "basic" ? "STARTER" : achievement.rarity.toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
};
