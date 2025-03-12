import React, { useState } from "react";

import { Achievement } from "../../types/profile";

interface AchievementCardProps {
  achievement: Achievement;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Get rarity-based styles
  const getRarityStyles = () => {
    switch (achievement.rarity) {
      case "legendary":
        return {
          border: "border-amber-500/50",
          glow: "from-amber-500/20 via-amber-400/30 to-amber-300/20",
          text: "bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300",
          scanline: "from-amber-400/0 via-amber-300/20 to-amber-400/0",
          particle: "bg-amber-400/50",
          accent: "amber",
        };
      case "epic":
        return {
          border: "border-purple-500/50",
          glow: "from-purple-500/20 via-purple-400/30 to-purple-300/20",
          text: "bg-gradient-to-r from-purple-300 via-fuchsia-200 to-purple-300",
          scanline: "from-purple-400/0 via-purple-300/20 to-purple-400/0",
          particle: "bg-purple-400/50",
          accent: "purple",
        };
      case "rare":
        return {
          border: "border-blue-500/50",
          glow: "from-blue-500/20 via-blue-400/30 to-blue-300/20",
          text: "bg-gradient-to-r from-blue-300 via-cyan-200 to-blue-300",
          scanline: "from-blue-400/0 via-blue-300/20 to-blue-400/0",
          particle: "bg-blue-400/50",
          accent: "blue",
        };
      default:
        return {
          border: "border-brand-500/50",
          glow: "from-brand-500/20 via-brand-400/30 to-brand-300/20",
          text: "bg-gradient-to-r from-brand-300 via-cyan-200 to-brand-300",
          scanline: "from-brand-400/0 via-brand-300/20 to-brand-400/0",
          particle: "bg-brand-400/50",
          accent: "brand",
        };
    }
  };

  const styles = getRarityStyles();

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
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      className={`group relative h-32 perspective-1000 cursor-pointer ${
        isHovered ? "z-10" : "z-0"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Outer glow effect */}
      <div
        className={`absolute -inset-1 bg-gradient-to-r ${styles.glow} rounded-lg blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500 animate-pulse-slow`}
      />

      {/* Achievement card container */}
      <div
        className={`relative w-full h-full transition-all duration-500 transform-gpu ${
          isHovered ? "scale-[1.02]" : "scale-100"
        }`}
      >
        <div
          className={`absolute inset-0 bg-dark-200/80 backdrop-blur-sm ${styles.border} rounded-lg overflow-hidden`}
        >
          {/* Animated scan lines */}
          <div className="absolute inset-0">
            <div
              className={`absolute inset-0 bg-gradient-to-b ${styles.scanline} opacity-0 group-hover:opacity-100 animate-scan-fast`}
            />
            <div
              className={`absolute inset-0 bg-gradient-to-r ${styles.scanline} opacity-0 group-hover:opacity-100 animate-scan`}
            />
          </div>

          {/* Holographic grid background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:4px_4px] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div
              className={`absolute inset-0 bg-gradient-to-br ${styles.glow} opacity-0 group-hover:opacity-30 transition-opacity duration-500`}
            />
          </div>

          {/* Content container */}
          <div className="relative p-4 h-full">
            <div className="flex items-start space-x-4 h-full">
              {/* Icon section */}
              <div className="relative">
                <div
                  className={`text-4xl transform transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1 ${
                    isHovered ? "animate-float-slow" : ""
                  }`}
                >
                  {getAchievementIcon(achievement.achievement)}
                </div>
                {/* Icon glow */}
                <div
                  className={`absolute inset-0 bg-${styles.accent}-400/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />
              </div>

              {/* Text content */}
              <div className="flex-1 space-y-2">
                {/* Achievement name */}
                <div className="relative">
                  {/* Rarity badge */}
                  {achievement.rarity && (
                    <div
                      className={`absolute -top-1 -right-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-${styles.accent}-500/20 text-${styles.accent}-300 border border-${styles.accent}-500/30`}
                    >
                      {achievement.rarity}
                    </div>
                  )}

                  <h4 className="text-lg font-bold text-gray-100 group-hover:text-white transition-colors">
                    <span
                      className={`${styles.text} bg-clip-text text-transparent relative z-10 group-hover:animate-pulse-slow`}
                    >
                      {achievement.description}
                    </span>
                  </h4>
                </div>

                {/* Achievement date */}
                <p className="text-sm font-mono tracking-wide text-gray-400 group-hover:text-gray-300 transition-colors flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-gray-500 group-hover:bg-gray-400 animate-pulse" />
                  {formatDate(achievement.earned_at)}
                </p>

                {/* Particle effects */}
                <div className="absolute bottom-2 right-2">
                  <div className="relative">
                    <div
                      className={`w-1 h-1 rounded-full ${styles.particle} animate-ping`}
                    />
                    <div
                      className={`absolute inset-0 w-1 h-1 rounded-full ${styles.particle} animate-pulse`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
