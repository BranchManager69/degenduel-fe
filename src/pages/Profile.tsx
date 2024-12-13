import React, { useState, useEffect } from 'react';
import { UserStats } from '../components/profile/UserStats';
import { ContestHistory } from '../components/profile/ContestHistory';
import { AchievementCard } from '../components/profile/AchievementCard';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { useStore } from '../store/useStore';
import { getAllSNSNames } from '../lib/sns';

export const Profile: React.FC = () => {
  const user = useStore(state => state.user);
  const [snsNames, setSNSNames] = useState<string[]>([]);
  const [selectedSNS, setSelectedSNS] = useState('');

  useEffect(() => {
    if (user?.address) {
      getAllSNSNames(user.address).then(names => {
        setSNSNames(names);
        setSelectedSNS(names[0] || '');
      });
    }
  }, [user?.address]);

  const achievements = [
    {
      id: '1',
      title: 'First Victory',
      description: 'Win your first contest',
      icon: '🏆',
      rarity: 'common',
      unlockedAt: '2024-01-15',
    },
    {
      id: '2',
      title: 'High Roller',
      description: 'Enter a contest with $100+ entry fee',
      icon: '💎',
      rarity: 'rare',
      unlockedAt: '2024-01-20',
    },
    {
      id: '3',
      title: 'Diamond Hands',
      description: 'Achieve 100% portfolio return in a single contest',
      icon: '💪',
      rarity: 'epic',
      progress: 75,
      hint: 'HODL like your life depends on it!',
    },
    {
      id: '4',
      title: 'Whale Alert',
      description: 'Win a Whale difficulty contest',
      icon: '🐋',
      rarity: 'legendary',
      progress: 30,
      hint: 'Only the bravest traders dare to swim with whales...',
    },
    {
      id: '5',
      title: 'Meme Lord',
      description: 'Win a contest using only meme tokens',
      icon: '🐕',
      rarity: 'epic',
      hint: 'Who let the DOGE out?',
    },
    {
      id: '6',
      title: 'Perfect Week',
      description: 'Win contests 7 days in a row',
      icon: '📅',
      rarity: 'legendary',
      hint: 'Consistency is key!',
    },
    {
      id: '7',
      title: 'Social Butterfly',
      description: 'Link your Twitter account',
      icon: '🦋',
      rarity: 'common',
      hint: 'Connect with fellow degens',
    },
    {
      id: '8',
      title: 'Early Bird',
      description: 'Join the platform during beta',
      icon: '🐣',
      rarity: 'rare',
      unlockedAt: '2024-01-01',
    },
    {
      id: '9',
      title: 'Phoenix Trader',
      description: 'Recover from -50% to win a contest',
      icon: '🔥',
      rarity: 'legendary',
      hint: 'Rise from the ashes...',
    },
    {
      id: '10',
      title: 'Shark Week',
      description: 'Win 3 Shark difficulty contests',
      icon: '🦈',
      rarity: 'epic',
      progress: 33,
    },
    {
      id: '11',
      title: 'Lucky Charm',
      description: '???',
      icon: '🍀',
      rarity: 'legendary',
      hint: 'Some secrets are better left unknown...',
    },
    {
      id: '12',
      title: 'Speed Demon',
      description: 'Fill your portfolio in under 10 seconds',
      icon: '⚡',
      rarity: 'rare',
      hint: 'Gotta go fast!',
    },
    {
      id: '13',
      title: 'Diamond League',
      description: 'Maintain 80%+ win rate for 30 days',
      icon: '💎',
      rarity: 'legendary',
      hint: 'The pinnacle of trading excellence',
    },
    {
      id: '14',
      title: 'Night Owl',
      description: '???',
      icon: '🦉',
      rarity: 'epic',
      hint: 'The market never sleeps...',
    },
    {
      id: '15',
      title: 'Prophecy',
      description: 'Predict the exact final value',
      icon: '🔮',
      rarity: 'legendary',
      hint: 'What are the odds?',
    },
  ] as const;

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-100">Connect your wallet to view your profile</h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        <ProfileHeader
          address={user.address}
          username={user.username}
          snsNames={snsNames}
          onSNSSelect={setSelectedSNS}
          selectedSNS={selectedSNS}
        />

        <UserStats
          totalWinnings={user.totalWinnings}
          contestsPlayed={user.contestsPlayed}
          contestsWon={user.contestsWon}
          winRate={(user.contestsWon / user.contestsPlayed) * 100}
          averageReturn={15.7}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-100">Achievements</h2>
            <div className="grid grid-cols-1 gap-4">
              {achievements.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </div>
          <div>
            <ContestHistory contests={[]} />
          </div>
        </div>
      </div>
    </div>
  );
};