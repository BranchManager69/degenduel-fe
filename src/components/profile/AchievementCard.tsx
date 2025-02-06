import React, { useState } from "react";

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
  const [isHovered, setIsHovered] = useState(false);

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
    <div
      className="group relative h-32 perspective-1000 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Holographic glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/30 to-brand-400/0 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500" />

      <div
        className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
          isHovered ? "rotate-y-12" : ""
        }`}
      >
        <div className="absolute inset-0 bg-dark-200/50 backdrop-blur-sm border border-dark-300/20 rounded-lg overflow-hidden">
          {/* Animated scan line */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-400/10 to-transparent opacity-0 group-hover:opacity-100 animate-scan-fast" />

          {/* Holographic grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(99,102,241,0.05)_45%,rgba(99,102,241,0.05)_55%,transparent_100%)] bg-[length:4px_4px] opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative p-4 h-full">
            <div className="flex items-start space-x-4 h-full">
              {/* Floating achievement icon */}
              <div className="relative">
                <div className="text-4xl transform group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-300">
                  {getAchievementIcon(achievement.achievement)}
                </div>
                {/* Icon glow effect */}
                <div className="absolute inset-0 bg-brand-400/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              <div className="flex-1 space-y-2">
                {/* Achievement name with glitch effect */}
                <h4 className="text-lg font-semibold text-gray-100 group-hover:text-brand-300 transition-colors relative">
                  <span className="relative z-10 group-hover:animate-glitch">
                    {achievement.display_name}
                  </span>
                  {/* Text shadow effect */}
                  <span className="absolute -left-[1px] top-[1px] text-brand-400/50 z-0 hidden group-hover:block">
                    {achievement.display_name}
                  </span>
                </h4>

                {/* Achievement date with cyber effect */}
                <p className="text-sm text-gray-400 font-mono tracking-wide group-hover:text-brand-400 transition-colors">
                  <span className="inline-block group-hover:animate-pulse">
                    &lt;
                  </span>
                  {formatDate(achievement.achieved_at)}
                  <span className="inline-block group-hover:animate-pulse">
                    /&gt;
                  </span>
                </p>

                {/* Digital particles effect */}
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-1 h-1 bg-brand-400/50 rounded-full animate-ping" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
