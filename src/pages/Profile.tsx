import React, { useEffect, useState } from "react";
import { AchievementCard } from "../components/profile/AchievementCard";
import { ContestHistory } from "../components/profile/ContestHistory";
import { ProfileHeader } from "../components/profile/ProfileHeader";
import { UserStats } from "../components/profile/UserStats";
import { ddApi } from "../services/dd-api";
import { useStore } from "../store/useStore";

export const Profile: React.FC = () => {
  const { user, setUser } = useStore();
  const [userData, setUserData] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfileData = async () => {
      if (!user?.wallet_address) return;

      try {
        setLoading(true);
        const [userResponse, statsResponse, achievementsResponse] =
          await Promise.all([
            ddApi.users.getOne(user.wallet_address),
            ddApi.stats.getOverall(user.wallet_address),
            ddApi.stats.getAchievements(user.wallet_address),
          ]);

        setUserData(userResponse);
        setUserStats(statsResponse);
        setAchievements(achievementsResponse);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load profile data"
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [user?.wallet_address]);

  const handleUpdateNickname = async (newNickname: string) => {
    if (!user?.wallet_address) return;

    try {
      await ddApi.users.update(user.wallet_address, newNickname);
      setUserData((prev: typeof userData) => ({
        ...prev,
        nickname: newNickname,
      }));
      setUser({ ...user, nickname: newNickname });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update nickname"
      );
      throw err;
    }
  };

  if (!user) {
    return <div>Connect your wallet to view your profile</div>;
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!userData || !userStats) return <div>No data available</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        <ProfileHeader
          address={userData.wallet_address}
          username={userData.nickname ?? "Anonymous"}
          rankScore={userData.rank_score}
          joinDate={new Date(userData.created_at).toLocaleDateString()}
          onUpdateNickname={handleUpdateNickname}
        />

        <UserStats
          totalWinnings={userStats?.total_earnings ?? 0}
          contestsPlayed={userStats?.total_contests ?? 0}
          contestsWon={userStats?.total_wins ?? 0}
          winRate={userStats?.win_rate ?? 0}
          averageReturn={userStats?.average_return ?? 0}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-100">Achievements</h2>
            <div className="grid grid-cols-1 gap-4">
              {achievements.length > 0 ? (
                achievements.map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                  />
                ))
              ) : (
                <div className="text-gray-400">No achievements yet</div>
              )}
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
