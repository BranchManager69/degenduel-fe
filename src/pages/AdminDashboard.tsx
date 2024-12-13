import React from 'react';
import { ContestManagement } from '../components/admin/ContestManagement';
import { PlatformStats } from '../components/admin/PlatformStats';
import { RecentActivity } from '../components/admin/RecentActivity';
import { useStore } from '../store/useStore';

export const AdminDashboard: React.FC = () => {
  const user = useStore(state => state.user);

  // Placeholder data
  const contests = [
    {
      id: '1',
      name: 'Daily SOL Tournament',
      difficulty: 'dolphin' as const,
      entryFee: 10,
      prizePool: 1000,
      startTime: new Date(Date.now() + 3600000),
      endTime: new Date(Date.now() + 7200000),
      participants: 45,
      maxParticipants: 100,
      status: 'open' as const,
    },
    {
      id: '2',
      name: 'Weekly Crypto Challenge',
      difficulty: 'shark' as const,
      entryFee: 25,
      prizePool: 2500,
      startTime: new Date(Date.now() + 86400000),
      endTime: new Date(Date.now() + 172800000),
      participants: 75,
      maxParticipants: 150,
      status: 'open' as const,
    },
  ];

  const platformStats = {
    totalUsers: 1250,
    activeContests: 8,
    totalVolume: 125000,
    dailyActiveUsers: 450,
    userGrowth: 12.5,
    volumeGrowth: 8.3,
  };

  const recentActivities = [
    {
      id: '1',
      type: 'contest_join' as const,
      timestamp: new Date().toISOString(),
      details: 'User crypto_king joined Daily SOL Tournament',
    },
    {
      id: '2',
      type: 'contest_complete' as const,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      details: 'Weekly Crypto Challenge #12 completed',
    },
    {
      id: '3',
      type: 'user_register' as const,
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      details: 'New user moon_walker registered',
    },
  ];

  const handleEditContest = (id: string) => {
    console.log('Edit contest:', id);
  };

  const handleDeleteContest = (id: string) => {
    console.log('Delete contest:', id);
  };

  if (!user?.isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-100">
          Access Denied: Admin privileges required
        </h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100">Admin Dashboard</h1>
        <p className="text-gray-400">Manage contests and monitor platform activity</p>
      </div>

      <div className="space-y-8">
        <PlatformStats {...platformStats} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ContestManagement
              contests={contests}
              onEditContest={handleEditContest}
              onDeleteContest={handleDeleteContest}
            />
          </div>
          <div>
            <RecentActivity activities={recentActivities} />
          </div>
        </div>
      </div>
    </div>
  );
};