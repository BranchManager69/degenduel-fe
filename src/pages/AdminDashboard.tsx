import React, { useEffect, useState } from "react";
import { ContestManagement } from "../components/admin/ContestManagement";
import { EditContestModal } from "../components/admin/EditContestModal";
import { PlatformStats } from "../components/admin/PlatformStats";
import { RecentActivity } from "../components/admin/RecentActivity";
import { UserBalanceManagement } from "../components/admin/UserBalanceManagement";
import { CreateContestButton } from "../components/contests/CreateContestButton";
import { ddApi } from "../services/dd-api";
import { useStore } from "../store/useStore";
import { Contest, User } from "../types";
import {
  ActivitiesResponse,
  Activity,
  ContestsResponse,
  PlatformStats as IPlatformStats,
} from "../types/admin";

interface ActivityWithDate extends Omit<Activity, "created_at"> {
  created_at: Date;
}

export const AdminDashboard: React.FC = () => {
  const user = useStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contests, setContests] = useState<Contest[]>([]);
  const [platformStats, setPlatformStats] = useState<IPlatformStats | null>(
    null
  );
  const [recentActivities, setRecentActivities] = useState<ActivityWithDate[]>(
    []
  );
  const [editingContest, setEditingContest] = useState<Contest | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  const loadDashboardData = async () => {
    if (!user?.is_admin) return;

    try {
      setLoading(true);
      setError(null);

      console.log("Fetching admin dashboard data...");

      try {
        const response = await ddApi.admin.getContests();
        const contestsResponse = {
          contests: response.contests || [],
          pagination: {
            total: response.contests?.length || 0,
            limit: 10,
            offset: 0,
          },
        } as ContestsResponse;

        console.log("Contests loaded:", contestsResponse);
        setContests(contestsResponse.contests);
      } catch (err) {
        console.error("Failed to load contests:", err);
        throw new Error("Failed to load contests");
      }

      try {
        const statsResponse = await ddApi.admin.getPlatformStats();
        console.log("Platform stats loaded:", statsResponse);
        const statsData = {
          ...statsResponse,
          totalUsers: Number(statsResponse.totalUsers),
          activeContests: Number(statsResponse.activeContests),
          totalVolume: Number(statsResponse.totalVolume),
          totalPrizesPaid: Number(statsResponse.totalPrizesPaid),
          dailyActiveUsers: Number(statsResponse.dailyActiveUsers),
          userGrowth: Number(statsResponse.userGrowth),
          volumeGrowth: Number(statsResponse.volumeGrowth),
        } as IPlatformStats;
        setPlatformStats(statsData);
      } catch (err) {
        console.error("Failed to load platform stats:", err);
        throw new Error("Failed to load platform statistics");
      }

      try {
        const response = await ddApi.admin.getRecentActivities();
        const activitiesResponse = {
          activities: response.activities || [],
          pagination: {
            total: response.activities?.length || 0,
            limit: 50,
            offset: 0,
          },
        } as ActivitiesResponse;

        console.log("Activities loaded:", activitiesResponse);

        const processedActivities = activitiesResponse.activities.map(
          (activity: Activity) => {
            // Use timestamp if created_at is not available
            const dateStr = activity.created_at || activity.timestamp;
            let date: Date;
            try {
              date = new Date(dateStr);
              if (isNaN(date.getTime())) {
                throw new Error("Invalid date");
              }
            } catch (err) {
              console.warn(
                `Invalid date for activity ${activity.id}:`,
                dateStr
              );
              date = new Date(); // Fallback to current time
            }
            return {
              ...activity,
              created_at: date,
            };
          }
        );
        setRecentActivities(processedActivities);
      } catch (err) {
        console.error("Failed to load activities:", err);
        throw new Error("Failed to load recent activities");
      }

      try {
        const usersResponse = await ddApi.users.getAll();
        console.log("Users response:", usersResponse);

        setUsers(Array.isArray(usersResponse) ? usersResponse : []);
      } catch (err) {
        console.error("Failed to load users:", err);
        throw new Error("Failed to load users");
      }
    } catch (err) {
      console.error("Dashboard loading error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user?.is_admin]);

  const handleEditContest = (id: number) => {
    const contest = contests.find((c) => c.id === id);
    if (contest) {
      setEditingContest(contest);
    }
  };

  const handleSaveContest = async (
    contestId: number,
    data: Partial<Contest>
  ) => {
    try {
      console.log("Updating contest:", {
        contestId,
        data: JSON.stringify(data, null, 2),
      });

      const response = await ddApi.admin.updateContest(
        contestId.toString(),
        data
      );
      console.log("Update successful:", response);

      // Refresh contests after update
      await loadDashboardData();
      setEditingContest(null); // Close modal on success
    } catch (err) {
      console.error("Failed to update contest:", {
        contestId,
        data,
        error:
          err instanceof Error
            ? {
                message: err.message,
                stack: err.stack,
              }
            : err,
      });

      // You might want to show an error message to the user here
      throw err;
    }
  };

  const handleDeleteContest = async (id: number) => {
    try {
      await ddApi.admin.deleteContest(id.toString());
      const response = await ddApi.admin.getContests();
      setContests(response.contests || []);
    } catch (err) {
      console.error("Failed to delete contest:", err);
    }
  };

  const handleContestCreated = async () => {
    try {
      // Refresh all dashboard data since contest creation affects multiple stats
      await loadDashboardData();
      console.log("Dashboard refreshed after contest creation");
    } catch (err) {
      console.error("Failed to refresh dashboard after contest creation:", err);
    }
  };

  if (!user?.is_admin) {
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
        <h2 className="text-2xl font-bold text-gray-100">
          Loading dashboard...
        </h2>
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
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Admin Dashboard</h1>
          <p className="text-gray-400">
            Manage contests and monitor platform activity
          </p>
        </div>
        <CreateContestButton onContestCreated={handleContestCreated} />
      </div>

      <div className="space-y-8">
        {platformStats &&
          typeof platformStats.totalVolume === "number" &&
          typeof platformStats.totalPrizesPaid === "number" && (
            <PlatformStats
              totalUsers={Number(platformStats.totalUsers)}
              activeContests={Number(platformStats.activeContests)}
              totalVolume={Number(platformStats.totalVolume)}
              totalPrizesPaid={Number(platformStats.totalPrizesPaid)}
              dailyActiveUsers={Number(platformStats.dailyActiveUsers)}
              userGrowth={Number(platformStats.userGrowth)}
              volumeGrowth={Number(platformStats.volumeGrowth)}
            />
          )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ContestManagement
              contests={contests}
              onEditContest={(id: string) => handleEditContest(parseInt(id))}
              onDeleteContest={(id: string) =>
                handleDeleteContest(parseInt(id))
              }
            />
          </div>
          <div className="space-y-8">
            <UserBalanceManagement users={users} />
            <RecentActivity
              activities={recentActivities.filter(
                (activity) =>
                  activity.created_at instanceof Date &&
                  !isNaN(activity.created_at.getTime())
              )}
            />
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
