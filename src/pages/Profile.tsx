import React, { useEffect, useState } from "react";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { AchievementCard } from "../components/profile/AchievementCard";
import {
  ContestEntry,
  ContestHistory,
} from "../components/profile/ContestHistory";
import { ProfileHeader } from "../components/profile/ProfileHeader";
import { UserStats } from "../components/profile/UserStats";
import { ddApi, formatBonusPoints } from "../services/dd-api";
import { useStore } from "../store/useStore";
import {
  Achievement,
  UserData,
  UserStats as UserStatsType,
} from "../types/profile";

interface LoadingState {
  user: boolean;
  stats: boolean;
  achievements: boolean;
  history: boolean;
}

interface ErrorState {
  user: string | null;
  stats: string | null;
  achievements: string | null;
  history: string | null;
}

const mapHistoryResponse = (entry: any) => ({
  contest_id: entry.contest_id,
  contest_name: entry.contest_name,
  start_time: entry.start_time,
  end_time: entry.end_time,
  portfolio_return: entry.portfolio_return,
  rank: entry.rank,
});

export const Profile: React.FC = () => {
  const { user, setUser } = useStore();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userStats, setUserStats] = useState<UserStatsType | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [contestHistory, setContestHistory] = useState<ContestEntry[]>([]);
  const [loading, setLoading] = useState<LoadingState>({
    user: true,
    stats: true,
    achievements: true,
    history: true,
  });
  const [error, setError] = useState<ErrorState>({
    user: null,
    stats: null,
    achievements: null,
    history: null,
  });
  const [isUpdatingNickname, setIsUpdatingNickname] = useState(false);

  useEffect(() => {
    const loadProfileData = async () => {
      if (!user?.wallet_address) return;

      // Reset states
      setLoading({
        user: true,
        stats: true,
        achievements: true,
        history: true,
      });
      setError({ user: null, stats: null, achievements: null, history: null });

      // Load user data and balance in parallel
      try {
        const [userResponse, balanceResponse] = await Promise.all([
          ddApi.users.getOne(user.wallet_address),
          ddApi.balance.get(user.wallet_address),
        ]);

        setUserData({
          ...userResponse,
          bonusBalance: formatBonusPoints(balanceResponse.balance),
        });
      } catch (err) {
        setError((prev) => ({
          ...prev,
          user: err instanceof Error ? err.message : "Failed to load user data",
        }));
      } finally {
        setLoading((prev) => ({ ...prev, user: false }));
      }

      // Load stats
      try {
        const statsResponse = await ddApi.stats.getOverall(user.wallet_address);
        setUserStats(statsResponse);
      } catch (err) {
        setError((prev) => ({
          ...prev,
          stats: err instanceof Error ? err.message : "Failed to load stats",
        }));
      } finally {
        setLoading((prev) => ({ ...prev, stats: false }));
      }

      // Load achievements
      try {
        const achievementsResponse = await ddApi.stats.getAchievements(
          user.wallet_address
        );
        setAchievements(achievementsResponse);
      } catch (err) {
        setError((prev) => ({
          ...prev,
          achievements:
            err instanceof Error ? err.message : "Failed to load achievements",
        }));
      } finally {
        setLoading((prev) => ({ ...prev, achievements: false }));
      }

      // Load contest history
      try {
        const historyResponse = await ddApi.stats.getHistory(
          user.wallet_address,
          10,
          0
        );
        setContestHistory(historyResponse.map(mapHistoryResponse));
      } catch (err) {
        setError((prev) => ({
          ...prev,
          history:
            err instanceof Error
              ? err.message
              : "Failed to load contest history",
        }));
      } finally {
        setLoading((prev) => ({ ...prev, history: false }));
      }
    };

    loadProfileData();
  }, [user?.wallet_address]);

  const handleUpdateNickname = async (newNickname: string) => {
    if (!user?.wallet_address) return;

    try {
      setIsUpdatingNickname(true);
      setError((prev) => ({ ...prev, user: null }));

      await ddApi.users.update(user.wallet_address, newNickname);
      setUserData((prev) =>
        prev
          ? {
              ...prev,
              nickname: newNickname,
            }
          : null
      );
      setUser({ ...user, nickname: newNickname });
    } catch (err) {
      setError((prev) => ({
        ...prev,
        user: err instanceof Error ? err.message : "Failed to update nickname",
      }));
      throw err;
    } finally {
      setIsUpdatingNickname(false);
    }
  };

  if (!user) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-200">
            Connect Your Wallet
          </h2>
          <p className="mt-2 text-gray-400">
            Connect your wallet to view your profile
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {loading.user ? (
          <div className="h-32 flex items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : error.user ? (
          <ErrorMessage
            message={error.user}
            onRetry={() => window.location.reload()}
          />
        ) : userData ? (
          <ProfileHeader
            address={userData.wallet_address}
            username={userData.nickname ?? "Anonymous"}
            rankScore={userData.rank_score}
            joinDate={new Date(userData.created_at).toLocaleDateString()}
            bonusBalance={userData.bonusBalance ?? "0 pts"}
            onUpdateNickname={handleUpdateNickname}
            isUpdating={isUpdatingNickname}
          />
        ) : null}

        {loading.stats ? (
          <div className="h-32 flex items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : error.stats ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-400 text-center">{error.stats}</p>
          </div>
        ) : userStats ? (
          <UserStats
            totalWinnings={userStats.total_earnings}
            contestsPlayed={userStats.total_contests}
            contestsWon={userStats.total_wins}
            winRate={userStats.win_rate}
            averageReturn={userStats.average_return}
          />
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-100">Achievements</h2>
            {loading.achievements ? (
              <div className="h-32 flex items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : error.achievements ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400 text-center">{error.achievements}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {achievements.length > 0 ? (
                  achievements.map((achievement) => (
                    <AchievementCard
                      key={achievement.achievement}
                      achievement={achievement}
                    />
                  ))
                ) : (
                  <div className="p-4 rounded-lg border border-gray-700 bg-gray-800/50">
                    <p className="text-gray-400 text-center">
                      No achievements yet. Keep playing!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            {loading.history ? (
              <div className="h-32 flex items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : error.history ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400 text-center">{error.history}</p>
              </div>
            ) : (
              <ContestHistory contests={contestHistory} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
