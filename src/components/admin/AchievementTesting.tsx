import React, { useState } from "react";

import { useStore } from "../../store/useStore";

const ACHIEVEMENT_TIERS = [
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "DIAMOND",
  "TRANSCENDENT",
] as const;

export const AchievementTesting: React.FC = () => {
  const { addAchievement, updateUserProgress, addCelebration } = useStore();
  const [xpAmount, setXpAmount] = useState(100);

  const simulateAchievement = (tier: (typeof ACHIEVEMENT_TIERS)[number]) => {
    addAchievement({
      id: `test-${Date.now()}`,
      tier,
      xp_awarded: 100,
      achieved_at: new Date().toISOString(),
      context: { test: true },
    });
  };

  const simulateXpGain = () => {
    updateUserProgress({
      level: Math.floor(xpAmount / 1000) + 1,
      experiencePoints: xpAmount,
      nextLevelThreshold: (Math.floor(xpAmount / 1000) + 1) * 1000,
      tierProgress: {
        achievements: {
          bronze: 5,
          silver: 3,
          gold: 2,
          platinum: 1,
          diamond: 0,
        },
      },
    });
  };

  const simulateLevelUp = () => {
    const newLevel = Math.floor(Math.random() * 10) + 2;
    addCelebration({
      type: "level_up",
      data: {
        newLevel,
        newTier: newLevel % 10 === 0 ? "GOLD" : undefined,
      },
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-xl font-bold mb-4">Achievement Testing</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {ACHIEVEMENT_TIERS.map((tier) => (
            <button
              key={tier}
              onClick={() => simulateAchievement(tier)}
              className="px-4 py-2 bg-dark-300 hover:bg-dark-400 rounded-lg transition-colors"
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">XP Testing</h2>
        <div className="flex gap-4 items-center">
          <input
            type="number"
            value={xpAmount}
            onChange={(e) => setXpAmount(Number(e.target.value))}
            className="bg-dark-300 rounded-lg px-4 py-2 w-32"
          />
          <button
            onClick={simulateXpGain}
            className="px-4 py-2 bg-dark-300 hover:bg-dark-400 rounded-lg transition-colors"
          >
            Set XP
          </button>
          <button
            onClick={simulateLevelUp}
            className="px-4 py-2 bg-dark-300 hover:bg-dark-400 rounded-lg transition-colors"
          >
            Simulate Level Up
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Current Achievements Grid</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-dark-300/50 rounded-lg flex items-center justify-center"
            >
              <span className="text-4xl opacity-50">🏆</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
