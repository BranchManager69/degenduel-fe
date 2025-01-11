// src/pages/AdminDashboard.tsx
import React, { useEffect, useState } from "react";
import { ContestList } from "../components/admin/ContestList";
import { CreateContestButton } from "../components/admin/CreateContestButton";
import { EditContestModal } from "../components/admin/EditContestModal";
import { PlatformStats } from "../components/admin/PlatformStats";
import { RecentActivity } from "../components/admin/RecentActivity";
import { UserBalanceManagement } from "../components/admin/UserBalanceManagement";
import LogViewer from "../components/LogViewer";
import { ddApi } from "../services/dd-api";
import type {
  Contest,
  PlatformStats as PlatformStatsType,
  User,
} from "../types";

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<PlatformStatsType | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  const [editingContest, setEditingContest] = useState<Contest | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, activitiesData, usersResponse, contestsData] =
          await Promise.all([
            ddApi.stats.getPlatformStats(),
            ddApi.stats.getRecentActivity(),
            ddApi.users.getAll(),
            ddApi.contests.getAll(),
          ]);

        console.log("Raw usersResponse:", usersResponse);

        setStats(statsData);
        setActivities(
          activitiesData.map((activity: any) => ({
            ...activity,
            created_at: new Date(activity.timestamp),
          }))
        );
        setUsers(usersResponse || []);
        setContests(contestsData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleEditContest = (id: string) => {
    const contest = contests.find((c: Contest) => String(c.id) === id);
    if (contest) {
      setEditingContest(contest);
    }
  };

  const handleSaveContest = async (
    contestId: number,
    data: Partial<Contest>
  ) => {
    try {
      await ddApi.admin.updateContest(String(contestId), data);
      const updatedContests = await ddApi.contests.getAll();
      setContests(updatedContests);
      setEditingContest(null);
    } catch (error) {
      console.error("Failed to update contest:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-100">Admin Dashboard</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {showLogs ? "Hide Logs" : "Show Logs"}
          </button>
          <CreateContestButton />
        </div>
      </div>

      {/* Log Viewer Section */}
      {showLogs && (
        <div className="mb-8 bg-gray-800 rounded-lg shadow-lg">
          <div className="p-4">
            <h2 className="text-xl font-bold text-gray-100 mb-4">
              System Logs
            </h2>
            <LogViewer />
          </div>
        </div>
      )}

      {/* Platform Stats */}
      {!loading && stats && (
        <div className="mb-8">
          <PlatformStats
            totalUsers={stats.totalUsers}
            activeContests={stats.activeContests}
            totalVolume={Number(stats.totalVolume)}
            totalPrizesPaid={Number(stats.totalPrizesPaid)}
            dailyActiveUsers={stats.dailyActiveUsers}
            userGrowth={stats.userGrowth}
            volumeGrowth={stats.volumeGrowth}
          />
        </div>
      )}

      {/* User Balance Management */}
      <div className="mb-8">
        <UserBalanceManagement users={users} />
      </div>

      {/* Recent Activity */}
      <div className="mb-8">
        <RecentActivity activities={activities} />
      </div>

      {/* Contest List */}
      <ContestList contests={contests} onEditContest={handleEditContest} />

      {editingContest && (
        <EditContestModal
          contest={editingContest}
          isOpen={!!editingContest}
          onClose={() => setEditingContest(null)}
          onSave={handleSaveContest}
        />
      )}
    </div>
  );
};
