import React, { useState, useEffect } from 'react';
import { ContestManagement } from '../components/admin/ContestManagement';
import { PlatformStats } from '../components/admin/PlatformStats';
import { RecentActivity } from '../components/admin/RecentActivity';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import { Contest, PlatformStats as IPlatformStats, Activity } from '../types/admin';
import { EditContestModal } from '../components/admin/EditContestModal';

export const AdminDashboard: React.FC = () => {
  const user = useStore(state => state.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contests, setContests] = useState<Contest[]>([]);
  const [platformStats, setPlatformStats] = useState<IPlatformStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [editingContest, setEditingContest] = useState<Contest | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.isAdmin) return;

      try {
        setLoading(true);
        const [contestsData, statsData, activitiesData] = await Promise.all([
          api.admin.getContests(),
          api.admin.getPlatformStats(),
          api.admin.getRecentActivities(),
        ]);

        setContests(contestsData);
        setPlatformStats(statsData);
        setRecentActivities(activitiesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.isAdmin]);

  const handleEditContest = (id: string) => {
    const contest = contests.find(c => c.id === id);
    if (contest) {
      setEditingContest(contest);
    }
  };

  const handleSaveContest = async (contestId: string, data: Partial<Contest>) => {
    try {
      await api.admin.updateContest(contestId, data);
      const updatedContests = await api.admin.getContests();
      setContests(updatedContests);
      setEditingContest(null);
    } catch (err) {
      throw new Error('Failed to update contest');
    }
  };

  const handleDeleteContest = async (id: string) => {
    try {
      await api.admin.deleteContest(id);
      // Refresh contests after deletion
      const updatedContests = await api.admin.getContests();
      setContests(updatedContests);
    } catch (err) {
      console.error('Failed to delete contest:', err);
    }
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-100">Loading dashboard...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold text-red-500">Error: {error}</h2>
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
        {platformStats && <PlatformStats {...platformStats} />}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ContestManagement
              contests={contests.map(contest => ({
                ...contest,
                startTime: new Date(contest.startTime),
                endTime: new Date(contest.endTime),
              }))}
              onEditContest={handleEditContest}
              onDeleteContest={handleDeleteContest}
            />
          </div>
          <div>
            <RecentActivity activities={recentActivities} />
          </div>
        </div>
      </div>

      <EditContestModal
        contest={editingContest}
        isOpen={!!editingContest}
        onClose={() => setEditingContest(null)}
        onSave={handleSaveContest}
      />
    </div>
  );
};