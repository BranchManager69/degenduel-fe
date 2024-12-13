import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: string;
  progress?: number;
  hint?: string;
}

const RARITY_STYLES = {
  common: 'from-gray-400 to-gray-500',
  rare: 'from-blue-400 to-blue-500',
  epic: 'from-purple-400 to-purple-500',
  legendary: 'from-brand-400 to-brand-600',
};

export const AchievementCard: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const isUnlocked = !!achievement.unlockedAt;
  const rarityGradient = RARITY_STYLES[achievement.rarity];

  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Card className={`relative overflow-hidden transition-all duration-300 transform hover:scale-105 ${
        isUnlocked 
          ? 'bg-dark-200/50 backdrop-blur-sm border-dark-300' 
          : 'bg-dark-300/50 opacity-60'
      }`}>
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className={`relative text-4xl rounded-lg p-2 ${
              isUnlocked 
                ? `bg-gradient-to-br ${rarityGradient}` 
                : 'bg-dark-400'
            }`}>
              {achievement.icon}
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shine" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-100">
                {achievement.title}
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                {achievement.description}
              </p>
              {achievement.progress !== undefined && !isUnlocked && (
                <div className="mt-2">
                  <div className="h-1.5 bg-dark-400 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full bg-gradient-to-r ${rarityGradient}`}
                      style={{ width: `${achievement.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {achievement.progress}% Complete
                  </p>
                </div>
              )}
              {isUnlocked && (
                <p className="text-xs text-gray-500 mt-2">
                  Unlocked on {new Date(achievement.unlockedAt!).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tooltip */}
      {showTooltip && achievement.hint && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-dark-400 rounded-lg text-sm text-gray-200 whitespace-nowrap opacity-0 animate-fade-in">
          {achievement.hint}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-8 border-transparent border-t-dark-400" />
        </div>
      )}
    </div>
  );
};