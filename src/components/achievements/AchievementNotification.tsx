import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect } from "react";

import { useStore } from "../../store/useStore";

type AchievementTier =
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "PLATINUM"
  | "DIAMOND"
  | "TRANSCENDENT";

const TIER_COLORS: Record<AchievementTier, string> = {
  BRONZE: "#CD7F32",
  SILVER: "#C0C0C0",
  GOLD: "#FFD700",
  PLATINUM: "#E5E4E2",
  DIAMOND: "#B9F2FF",
  TRANSCENDENT: "#FF00FF",
};

const NOTIFICATION_DURATION = 5000; // 5 seconds

interface AchievementData {
  tier: AchievementTier;
  description: string;
  xp_awarded: number;
}

interface LevelUpData {
  newLevel: number;
  newTier?: string;
}

export const AchievementNotification: React.FC = () => {
  const { achievements, clearCelebration } = useStore();
  
  // Add null check to avoid destructuring undefined
  const pendingCelebrations = achievements?.pendingCelebrations || [];

  useEffect(() => {
    if (pendingCelebrations.length > 0) {
      const celebration = pendingCelebrations[0];
      const timer = setTimeout(() => {
        clearCelebration(celebration.timestamp);
      }, NOTIFICATION_DURATION);

      return () => clearTimeout(timer);
    }
  }, [pendingCelebrations, clearCelebration]);

  return (
    <AnimatePresence>
      {pendingCelebrations.slice(0, 3).map((celebration, index) => (
        <motion.div
          key={celebration.timestamp}
          initial={{ opacity: 0, y: -50, x: "-50%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed left-1/2 top-4 z-50"
          style={{ marginTop: `${index * 80}px` }}
        >
          {celebration.type === "achievement" ? (
            <div
              className="bg-dark-200/95 backdrop-blur-sm border rounded-lg shadow-lg p-4 flex items-center gap-4"
              style={{
                borderColor:
                  TIER_COLORS[(celebration.data as AchievementData).tier],
                boxShadow: `0 0 20px ${
                  TIER_COLORS[(celebration.data as AchievementData).tier]
                }40`,
              }}
            >
              <div className="text-4xl">🏆</div>
              <div>
                <div className="font-bold text-white">
                  Achievement Unlocked!
                </div>
                <div className="text-sm text-gray-300">
                  {(celebration.data as AchievementData).description}
                </div>
                <div className="text-xs text-brand-400">
                  +{(celebration.data as AchievementData).xp_awarded} XP
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-dark-200/95 backdrop-blur-sm border border-brand-500/50 rounded-lg shadow-lg p-4 flex items-center gap-4">
              <div className="text-4xl">⭐</div>
              <div>
                <div className="font-bold text-white">Level Up!</div>
                <div className="text-sm text-gray-300">
                  Reached Level {(celebration.data as LevelUpData).newLevel}
                </div>
                {(celebration.data as LevelUpData).newTier && (
                  <div className="text-xs text-brand-400">
                    Advanced to {(celebration.data as LevelUpData).newTier}{" "}
                    Tier!
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </AnimatePresence>
  );
};
