'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { useWallet } from '../../hooks/useWallet';

interface Achievement {
  id: number;
  type: string;
  category: string;
  tier: string;
  achieved_at: string;
  xp_awarded: number;
  context: any;
  achievement_categories: {
    name: string;
    description: string;
  };
  achievement_tiers: {
    name: string;
    color_hex: string;
    points: number;
  };
}

interface AchievementSummary {
  total: number;
  by_tier: {
    BRONZE: number;
    SILVER: number;
    GOLD: number;
    PLATINUM: number;
    DIAMOND: number;
  };
  by_category: {
    CONTESTS: number;
    TRADING: number;
    SOCIAL: number;
    PROGRESSION: number;
  };
}

interface Level {
  level_number: number;
  class_name: string;
  title: string;
  icon_url: string;
}

interface LevelProgress {
  current_level: Level;
  next_level: Level | null;
  experience: {
    current: number;
    next_level_at: number;
    percentage: number;
  };
  achievements: {
    bronze: { current: number; required: number };
    silver: { current: number; required: number };
    gold: { current: number; required: number };
    platinum: { current: number; required: number };
    diamond: { current: number; required: number };
  };
}

// Add type for badge variants
type BadgeVariant = 'default' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'secondary' | 'destructive' | 'outline';

export default function AchievementPanel() {
  const { wallet } = useWallet();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [summary, setSummary] = useState<AchievementSummary | null>(null);
  const [levelProgress, setLevelProgress] = useState<LevelProgress | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wallet) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch achievements and level data in parallel
        const [achievementsData, levelData] = await Promise.all([
          fetch(`/api/users/${wallet}/achievements`).then(res => res.json()),
          fetch(`/api/users/${wallet}/level`).then(res => res.json())
        ]);

        setAchievements(achievementsData.achievements);
        setSummary(achievementsData.summary);
        setLevelProgress(levelData);
      } catch (error) {
        console.error('Failed to fetch achievement data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [wallet]);

  // Helper function to ensure tier name is a valid badge variant
  const getTierVariant = (tier: string): BadgeVariant => {
    const lowerTier = tier.toLowerCase() as BadgeVariant;
    return ['bronze', 'silver', 'gold', 'platinum', 'diamond'].includes(lowerTier) ? lowerTier : 'default';
  };

  if (!wallet || loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Level Progress Section */}
      {levelProgress && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold">{levelProgress.current_level.title}</h3>
              <p className="text-gray-500">Level {levelProgress.current_level.level_number}</p>
            </div>
            <img 
              src={levelProgress.current_level.icon_url} 
              alt={levelProgress.current_level.title}
              className="w-16 h-16"
            />
          </div>

          {/* XP Progress */}
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span>XP Progress</span>
              <span>{levelProgress.experience.current} / {levelProgress.experience.next_level_at}</span>
            </div>
            <Progress value={levelProgress.experience.percentage} />
          </div>

          {/* Next Level Preview */}
          {levelProgress.next_level && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Next Level:</p>
              <div className="flex items-center mt-2">
                <img 
                  src={levelProgress.next_level.icon_url} 
                  alt={levelProgress.next_level.title}
                  className="w-8 h-8 mr-3"
                />
                <div>
                  <p className="font-semibold">{levelProgress.next_level.title}</p>
                  <p className="text-sm text-gray-500">Level {levelProgress.next_level.level_number}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Achievement Tabs */}
      <Tabs 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {summary && (
            <div className="space-y-6">
              {/* Total Achievements */}
              <div className="text-center">
                <h4 className="text-3xl font-bold">{summary.total}</h4>
                <p className="text-gray-500">Total Achievements</p>
              </div>

              {/* Achievement Tiers */}
              <div className="grid grid-cols-5 gap-4">
                {Object.entries(summary.by_tier).map(([tier, count]) => (
                  <div key={tier} className="text-center">
                    <Badge variant={getTierVariant(tier)}>{count}</Badge>
                    <p className="text-sm mt-1">{tier}</p>
                  </div>
                ))}
              </div>

              {/* Categories */}
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(summary.by_category).map(([category, count]) => (
                  <div key={category} className="p-4 bg-gray-50 rounded-lg">
                    <h5 className="font-semibold">{category}</h5>
                    <p className="text-2xl font-bold mt-1">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="achievements" className="mt-6">
          <div className="space-y-4">
            {achievements.map((achievement) => (
              <div 
                key={achievement.id} 
                className="p-4 bg-white border rounded-lg shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{achievement.type}</h4>
                    <p className="text-sm text-gray-500">
                      {achievement.achievement_categories.description}
                    </p>
                  </div>
                  <Badge 
                    variant={getTierVariant(achievement.tier)}
                    style={{ backgroundColor: achievement.achievement_tiers.color_hex }}
                  >
                    {achievement.tier}
                  </Badge>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  <span>+{achievement.xp_awarded} XP</span>
                  <span className="mx-2">•</span>
                  <span>{new Date(achievement.achieved_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="requirements" className="mt-6">
          {levelProgress && (
            <div className="space-y-6">
              {Object.entries(levelProgress.achievements).map(([tier, { current, required }]) => (
                <div key={tier} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="capitalize">{tier}</span>
                    <span>{current} / {required}</span>
                  </div>
                  <Progress 
                    value={Math.min((current / required) * 100, 100)}
                    variant={tier as 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'}
                  />
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
} 