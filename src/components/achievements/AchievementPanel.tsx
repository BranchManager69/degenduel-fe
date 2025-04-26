'use client';

import { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
/**
 * Custom Progress component for achievement tracking
 * Features gradient backgrounds, animations, and tier-specific styling
 */
const Progress = ({ value, variant }: { value: number, variant?: string }) => {
  // Get tier-specific styles
  const getProgressStyles = (variant?: string) => {
    const styles = {
      background: '',
      shadow: '',
      animation: ''
    };
    
    switch (variant) {
      case 'bronze':
        styles.background = 'bg-gradient-to-r from-amber-700 to-yellow-600';
        styles.shadow = 'shadow-amber-700/40';
        break;
      case 'silver':
        styles.background = 'bg-gradient-to-r from-gray-400 to-gray-300';
        styles.shadow = 'shadow-gray-400/40';
        break;
      case 'gold':
        styles.background = 'bg-gradient-to-r from-yellow-500 to-amber-300';
        styles.shadow = 'shadow-yellow-500/40';
        break;
      case 'platinum':
        styles.background = 'bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300';
        styles.shadow = 'shadow-white/30';
        break;
      case 'diamond':
        styles.background = 'bg-gradient-to-r from-cyan-300 via-blue-200 to-cyan-300';
        styles.shadow = 'shadow-cyan-300/40';
        break;
      default:
        styles.background = 'bg-gradient-to-r from-brand-600 to-brand-400';
        styles.shadow = 'shadow-brand-500/40';
    }
    
    return styles;
  };
  
  const { background, shadow } = getProgressStyles(variant);
  
  return (
    <div className="relative w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div 
        className={`absolute top-0 left-0 h-full ${background} rounded-full transition-all duration-500 ease-out shadow-lg ${shadow}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      >
        {/* Add subtle animation with pseudo-element */}
        {value > 30 && (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 opacity-30 animate-pulse-slow"></div>
          </div>
        )}
      </div>
      
      {/* Progress marker dots for visual interest */}
      <div className="absolute inset-0 flex items-center">
        {[25, 50, 75].map(marker => (
          <div 
            key={marker} 
            className={`absolute w-1 h-1 rounded-full bg-white/50 transition-opacity duration-300 ${value >= marker ? 'opacity-100' : 'opacity-30'}`} 
            style={{ left: `${marker}%` }}
          ></div>
        ))}
      </div>
    </div>
  );
};

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';

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

// Add type for badge variants based on Badge component's supported variants
type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'gold' | 'success' | 'warning' | 'error';
type TierVariant = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';


export default function AchievementPanel() {
  const user = useStore(state => state.user);
  const walletAddress = user?.wallet_address;
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [summary, setSummary] = useState<AchievementSummary | null>(null);
  const [levelProgress, setLevelProgress] = useState<LevelProgress | null>(null);
  // No need to track activeTab manually since Tabs component handles it internally
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!walletAddress) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch achievements and level data in parallel
        const [achievementsData, levelData] = await Promise.all([
          fetch(`/api/users/${walletAddress}/achievements`).then(res => res.json()),
          fetch(`/api/users/${walletAddress}/level`).then(res => res.json())
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
  }, [walletAddress]);

  /**
   * Enhanced badge styling with custom classes for each tier
   * Returns both a valid badge variant and custom CSS classes
   */
  const getTierStyling = (tier: string): { variant: BadgeVariant, className: string } => {
    const lowerTier = tier.toLowerCase();
    
    // Map each tier to a valid badge variant and add spectacular styling
    const tierStyles: Record<string, { variant: BadgeVariant, className: string }> = {
      'bronze': { 
        variant: 'secondary',
        className: 'bg-gradient-to-r from-amber-700 to-yellow-600 text-white font-bold shadow-md shadow-amber-700/30 border border-amber-600'
      },
      'silver': { 
        variant: 'default',
        className: 'bg-gradient-to-r from-gray-400 to-gray-300 text-dark-900 font-bold shadow-md shadow-gray-400/30 border border-gray-300'
      },
      'gold': { 
        variant: 'gold',
        className: 'bg-gradient-to-r from-yellow-500 to-amber-300 text-dark-900 font-bold shadow-md shadow-yellow-500/30 border border-yellow-400'
      },
      'platinum': { 
        variant: 'warning',
        className: 'bg-gradient-to-r from-gray-300 via-white to-gray-300 text-dark-900 font-bold shadow-md shadow-white/30 border border-gray-200'
      },
      'diamond': { 
        variant: 'success',
        className: 'bg-gradient-to-r from-cyan-300 via-blue-200 to-cyan-300 text-dark-900 font-bold shadow-md shadow-cyan-300/30 border border-cyan-200'
      }
    };
    
    return tierStyles[lowerTier] || { variant: 'default', className: '' };
  };

  if (!walletAddress || loading) {
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
        defaultValue="overview"
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
                    <Badge variant={getTierStyling(tier).variant} className={getTierStyling(tier).className}>{count}</Badge>
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
                    variant={getTierStyling(achievement.tier).variant}
                    className={`bg-[${achievement.achievement_tiers.color_hex}]`}
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
                    variant={tier.toLowerCase() as TierVariant}
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