import React, { useEffect, useState } from "react";
import { ContestManagement } from "../components/admin/ContestManagement";
import { EditContestModal } from "../components/admin/EditContestModal";
import { PlatformStats } from "../components/admin/PlatformStats";
import { RecentActivity } from "../components/admin/RecentActivity";
import { UserBalanceManagement } from "../components/admin/UserBalanceManagement";
import { Card } from "../components/ui/Card";
import { ddApi } from "../services/dd-api";
import type {
  Contest,
  PlatformStats as PlatformStatsType,
  User,
} from "../types";
import { ActivitiesResponse, ContestsResponse } from "../types/admin";

// Define an interface for activities with Date objects
interface ActivityWithDate {
  id: string;
  type: "contest_join" | "contest_complete" | "user_register";
  timestamp: string;
  details: string;
  created_at: Date;
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<PlatformStatsType | null>(null);
  const [activities, setActivities] = useState<ActivityWithDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  const [editingContest, setEditingContest] = useState<Contest | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log("Starting API calls...");

      let statsData = null;
      let activityResponse = null;
      let usersResponse = null;
      let contestsResponse = null;

      // Debug each API call individually
      try {
        statsData = await ddApi.stats.getPlatformStats();
        console.log("✅ Stats API Response:", statsData);
      } catch (e) {
        console.error("❌ Stats API failed:", e);
      }

      try {
        activityResponse = await ddApi.stats.getRecentActivity();
        console.log("✅ Activities API Response:", activityResponse);
      } catch (e) {
        console.error("❌ Activities API failed:", e);
      }

      try {
        usersResponse = await ddApi.users.getAll();
        console.log("✅ Users API Response:", usersResponse);

        if (Array.isArray(usersResponse)) {
          console.log(`📊 Found ${usersResponse.length} users:`, usersResponse);
          setUsers(usersResponse);
        } else if (
          usersResponse &&
          typeof usersResponse === "object" &&
          "users" in usersResponse
        ) {
          // Handle case where users might be nested in a 'users' property
          const usersList = (usersResponse as { users: User[] }).users;
          console.log(
            `📊 Found ${usersList.length} users in nested response:`,
            usersList
          );
          setUsers(usersList);
        } else {
          console.error("❌ Unexpected users data format:", usersResponse);
          setUsers([]);
        }
      } catch (e) {
        console.error("❌ Users API failed:", e);
        setUsers([]);
      }

      try {
        contestsResponse = await ddApi.contests.getAll();
        console.log("✅ Contests API Raw Response:", contestsResponse);

        // Handle contests data with better error checking
        let contestsData: Contest[];
        if (
          "contests" in contestsResponse &&
          Array.isArray(
            (contestsResponse as unknown as ContestsResponse).contests
          )
        ) {
          contestsData = (contestsResponse as unknown as ContestsResponse)
            .contests;
          console.log("📊 Using paginated contests response:", contestsData);
        } else if (Array.isArray(contestsResponse)) {
          contestsData = contestsResponse as Contest[];
          console.log("📊 Using direct contests array:", contestsData);
        } else {
          console.error(
            "❌ Unexpected contests data format:",
            contestsResponse
          );
          contestsData = [];
        }

        if (contestsData.length === 0) {
          console.warn("⚠️ No contests found in response");
        }

        // Map contests with validation
        const mappedContests = contestsData.map((contest: Partial<Contest>) => {
          const mappedContest = {
            ...contest,
            id:
              typeof contest.id === "string"
                ? parseInt(contest.id, 10)
                : contest.id || 0,
            name: contest.name || "Untitled Contest",
            description: contest.description || "",
            entry_fee: contest.entry_fee || "0",
            prize_pool: contest.prize_pool || "0",
            current_prize_pool: contest.current_prize_pool,
            start_time: contest.start_time || new Date().toISOString(),
            end_time: contest.end_time || new Date().toISOString(),
            entry_deadline: contest.entry_deadline,
            allowed_buckets: contest.allowed_buckets || [],
            participant_count: contest.participant_count || 0,
            last_entry_time: contest.last_entry_time,
            status: contest.status || "pending",
            cancelled_at: contest.cancelled_at,
            cancellation_reason: contest.cancellation_reason,
            settings: {
              ...(contest.settings || {}),
              difficulty: contest.settings?.difficulty || "guppy",
              min_trades: contest.settings?.min_trades || 0,
              max_participants: contest.settings?.max_participants || 0,
              min_participants: contest.settings?.min_participants || 0,
              token_types: contest.settings?.token_types || [],
              rules: contest.settings?.rules || [],
            },
            created_at: contest.created_at || new Date().toISOString(),
            updated_at: contest.updated_at || new Date().toISOString(),
            is_participating: contest.is_participating || false,
            participants: contest.participants || [],
            contest_code: contest.contest_code || "",
          };
          console.log(`📝 Mapped contest ${mappedContest.id}:`, mappedContest);
          return mappedContest;
        });

        console.log("✅ Final contests array:", mappedContests);
        setContests(mappedContests);
      } catch (e) {
        console.error("❌ Contests API failed:", e);
      }

      // Handle activities data
      let rawActivities: any[];
      if (
        activityResponse &&
        "activities" in activityResponse &&
        Array.isArray((activityResponse as ActivitiesResponse).activities)
      ) {
        rawActivities = (activityResponse as ActivitiesResponse).activities;
      } else if (Array.isArray(activityResponse)) {
        rawActivities = activityResponse;
      } else {
        rawActivities = [];
      }

      if (Array.isArray(rawActivities)) {
        setActivities(
          rawActivities.map((activity) => ({
            ...activity,
            created_at: activity.timestamp
              ? new Date(activity.timestamp)
              : new Date(),
            id: activity.id,
            type: activity.type,
            details: activity.details || "No details available",
            timestamp: activity.timestamp || new Date().toISOString(),
          }))
        );
      }

      // Handle users and stats data
      if (Array.isArray(usersResponse)) {
        setUsers(usersResponse);
      }

      if (statsData) {
        console.log("Setting stats with data:", statsData);
        setStats(statsData);
      } else {
        console.warn("No stats data received, using defaults");
        setStats({
          totalUsers: 0,
          activeContests: 0,
          totalVolume: "0",
          totalPrizesPaid: "0",
          dailyActiveUsers: 0,
          userGrowth: 0,
          volumeGrowth: 0,
        });
      }

      setError(null);
    } catch (error) {
      console.error("Detailed error in fetchDashboardData:", error);
      if (error instanceof Error) {
        setError(`Failed to load dashboard data: ${error.message}`);
      } else {
        setError("Failed to load dashboard data. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Set up auto-refresh every 5 minutes
    const refreshInterval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, []);

  const handleEditContest = (id: string) => {
    const contest = contests.find((c) => String(c.id) === id);
    if (contest) {
      setEditingContest(contest);
    }
  };

  const handleDeleteContest = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this contest?")) {
      try {
        await ddApi.admin.deleteContest(id);
        await fetchDashboardData();
      } catch (error) {
        console.error("Failed to delete contest:", error);
      }
    }
  };

  const handleSaveContest = async (
    contestId: number,
    data: Partial<Contest>
  ) => {
    try {
      await ddApi.admin.updateContest(String(contestId), data);
      await fetchDashboardData();
      setEditingContest(null);
    } catch (error) {
      console.error("Failed to update contest:", error);
      throw error;
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100">Admin Dashboard</h1>
          <p className="text-gray-400 mt-2">
            Manage contests, users, and monitor platform activity
          </p>
        </div>

        {error && (
          <Card className="mb-8 bg-red-500/10 border-red-500/20">
            <div className="p-4">
              <p className="text-red-400">{error}</p>
            </div>
          </Card>
        )}

        {/* Platform Stats */}
        {stats && (
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

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Contest Management */}
          <div className="lg:col-span-2">
            <ContestManagement
              contests={contests}
              onEditContest={handleEditContest}
              onDeleteContest={handleDeleteContest}
              onContestCreated={fetchDashboardData}
            />
          </div>

          {/* Recent Activity Feed */}
          <div className="space-y-8">
            <RecentActivity activities={activities} />
            <UserBalanceManagement users={users} />
          </div>
        </div>
      </div>

      {/* Edit Contest Modal */}
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
