// src/pages/authenticated/Profile.tsx

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { AchievementCard } from "../../components/profile/AchievementCard";
import {
  ContestEntry,
  ContestHistory,
} from "../../components/profile/ContestHistory";
import { ProfileHeader } from "../../components/profile/ProfileHeader";
import { UserStats } from "../../components/profile/UserStats";
import { ddApi, formatBonusPoints } from "../../services/dd-api";
import { useStore } from "../../store/useStore";
import {
  Achievement,
  UserData,
  UserStats as UserStatsType,
} from "../../types/profile";

// TODO: Move to a separate file
interface LoadingState {
  user: boolean;
  stats: boolean;
  achievements: boolean;
  history: boolean;
}

// TODO: Move to a separate file
interface ErrorState {
  user: string | null;
  stats: string | null;
  achievements: string | null;
  history: string | null;
}

// Map History Response
// Helper: map the history response to the ContestEntry type
const mapHistoryResponse = (entry: any) => ({
  contest_id: entry.contest_id,
  contest_name: entry.contest_name,
  start_time: entry.start_time,
  end_time: entry.end_time,
  portfolio_return: entry.portfolio_return,
  rank: entry.rank,
});

// Profile Page
export const Profile: React.FC = () => {
  const { user, setUser, maintenanceMode } = useStore();
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

      // Only set loading true if we're actually going to load data
      if (!maintenanceMode) {
        setLoading({
          user: true,
          stats: true,
          achievements: true,
          history: true,
        });
      }
      setError({ user: null, stats: null, achievements: null, history: null });

      if (maintenanceMode) {
        // If in maintenance mode, set all loading to false and don't attempt API calls
        setLoading({
          user: false,
          stats: false,
          achievements: false,
          history: false,
        });
        return;
      }

      // Load user data and balance in parallel
      try {
        const [userResponse, balanceResponse] = await Promise.all([
          ddApi.users.getOne(user.wallet_address),
          ddApi.balance.get(user.wallet_address),
        ]);

        console.log("User Response:", userResponse); // Debug log

        setUserData({
          wallet_address: userResponse.wallet_address,
          nickname: userResponse.nickname,
          rank_score: userResponse.rank_score,
          created_at: userResponse.created_at,
          bonusBalance: formatBonusPoints(balanceResponse.balance),
          is_banned: userResponse.is_banned ?? false,
          ban_reason: userResponse.ban_reason ?? null,
        });

        console.log("Set User Data:", {
          wallet_address: userResponse.wallet_address,
          nickname: userResponse.nickname,
          rank_score: userResponse.rank_score,
          created_at: userResponse.created_at,
          bonusBalance: formatBonusPoints(balanceResponse.balance),
          is_banned: userResponse.is_banned ?? false,
          ban_reason: userResponse.ban_reason ?? null,
        });
      } catch (err) {
        if (err instanceof Response && err.status === 503) {
          // Maintenance mode response, don't set error
          return;
        }
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
  }, [user?.wallet_address, maintenanceMode]);

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

  // Recyclable Maintenance Indicator
  const MaintenanceIndicator = () => (
    <div className="p-4 rounded-lg border border-yellow-400/20 bg-yellow-400/5 relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 via-yellow-400/5 to-yellow-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="flex items-center justify-center space-x-2">
        <span className="text-yellow-400 animate-pulse">⚙️</span>
        <p className="text-yellow-400 text-center font-mono">Unavailable</p>
        <span className="text-yellow-400 animate-pulse">⚙️</span>
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
          <h2 className="text-xl font-semibold text-gray-200 group-hover:animate-glitch">
            Connect Your Wallet
          </h2>
          <p className="mt-2 text-gray-400 group-hover:animate-cyber-pulse">
            Connect your wallet to view your profile
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Cosmic effects container */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Solar flares */}
        <div className="absolute -top-[300px] right-[5%] w-[800px] h-[800px] bg-gradient-to-r from-brand-500/5 via-purple-500/10 to-transparent rounded-full blur-[120px] animate-pulse-slow" />
        <div
          className="absolute -bottom-[200px] left-[10%] w-[600px] h-[600px] bg-gradient-to-l from-brand-500/5 via-purple-500/10 to-transparent rounded-full blur-[100px] animate-pulse-slow"
          style={{ animationDelay: "-2s" }}
        />

        {/* Star field */}
        <div
          className="absolute inset-0 animate-float"
          style={{ animationDuration: "15s" }}
        >
          <div
            className="absolute h-1 w-1 bg-white/20 rounded-full top-[15%] left-[35%] animate-sparkle"
            style={{ animationDelay: "-2s" }}
          />
          <div
            className="absolute h-1 w-1 bg-white/30 rounded-full top-[45%] left-[75%] animate-sparkle"
            style={{ animationDelay: "-1s" }}
          />
          <div
            className="absolute h-1 w-1 bg-white/20 rounded-full top-[65%] left-[25%] animate-sparkle"
            style={{ animationDelay: "-3s" }}
          />
          <div
            className="absolute h-1 w-1 bg-white/30 rounded-full top-[85%] left-[65%] animate-sparkle"
            style={{ animationDelay: "-4s" }}
          />
        </div>

        {/* Energy waves */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-500/5 to-transparent animate-scan-fast opacity-20"
            style={{ animationDuration: "10s" }}
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent animate-scan-vertical opacity-20"
            style={{ animationDuration: "15s" }}
          />
        </div>
      </div>

      {/* Profile Container */}
      <div className="relative space-y-8">
        {/* User Data Section */}
        {loading.user ? (
          <div className="h-32 flex items-center justify-center">
            <LoadingSpinner size="lg" className="animate-cyber-pulse" />
          </div>
        ) : maintenanceMode ? (
          <MaintenanceIndicator />
        ) : error.user ? (
          <div className="relative group">
            <ErrorMessage
              message={error.user}
              onRetry={() => window.location.reload()}
              className="animate-glitch"
            />
          </div>
        ) : userData ? (
          <div className="relative group overflow-hidden rounded-lg backdrop-blur-sm border border-dark-300/20">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative">
              <Link
                to={`/profile/${userData.nickname || userData.wallet_address}`}
                className="absolute top-2 right-2 px-3 py-1.5 backdrop-blur-sm border border-brand-500/20 hover:border-brand-500/50 rounded flex items-center gap-2 transition-all duration-200 group/link"
              >
                <span className="text-sm text-gray-300 group-hover/link:text-brand-400 transition-colors">
                  View Public Profile
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-gray-400 group-hover/link:text-brand-400 transition-colors"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path
                    fillRule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
              <ProfileHeader
                address={userData.wallet_address}
                username={userData.nickname || userData.wallet_address}
                rankScore={userData.rank_score}
                joinDate={new Date(userData.created_at).toLocaleDateString()}
                bonusBalance={userData.bonusBalance}
                onUpdateNickname={handleUpdateNickname}
                isUpdating={isUpdatingNickname}
                isBanned={userData.is_banned ?? false}
                banReason={userData.ban_reason ?? null}
              />
            </div>
          </div>
        ) : null}

        {/* User Stats Section */}
        {loading.stats ? (
          <div className="h-32 flex items-center justify-center">
            <LoadingSpinner size="lg" className="animate-cyber-pulse" />
          </div>
        ) : maintenanceMode ? (
          <MaintenanceIndicator />
        ) : error.stats ? (
          <div className="border border-red-500/20 rounded-lg p-4 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/5 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
            <p className="text-red-400 text-center animate-glitch">
              {error.stats}
            </p>
          </div>
        ) : userStats ? (
          <div className="relative group overflow-hidden rounded-lg backdrop-blur-sm border border-dark-300/20">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <UserStats
              totalWinnings={userStats.total_earnings}
              contestsPlayed={userStats.total_contests}
              contestsWon={userStats.total_wins}
              winRate={userStats.win_rate}
              averageReturn={userStats.average_return}
            />
          </div>
        ) : null}

        {/* Two Column Layout for Achievements and History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Achievements Column */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold font-cyber tracking-wide bg-gradient-to-r from-purple-400 via-brand-400 to-purple-500 text-transparent bg-clip-text relative group">
              Achievements
              <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 to-transparent blur-xl animate-pulse-slow" />
            </h2>

            {loading.achievements ? (
              <div className="h-32 flex items-center justify-center">
                <LoadingSpinner size="lg" className="animate-cyber-pulse" />
              </div>
            ) : maintenanceMode ? (
              <MaintenanceIndicator />
            ) : error.achievements ? (
              <div className="border border-red-500/20 rounded-lg p-4 relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/5 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
                <p className="text-red-400 text-center animate-glitch">
                  {error.achievements}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {achievements.length > 0 ? (
                  achievements.map((achievement) => (
                    <div
                      key={achievement.achievement}
                      className="relative group backdrop-blur-sm border border-dark-300/20 rounded-lg overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <AchievementCard achievement={achievement} />
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-lg border border-dark-300/20 backdrop-blur-sm relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <p className="text-gray-400 text-center group-hover:animate-cyber-pulse">
                      No achievements yet. Keep playing!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Contest History Column */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold font-cyber tracking-wide bg-gradient-to-r from-purple-400 via-brand-400 to-purple-500 text-transparent bg-clip-text relative group">
              Contest History
              <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 to-transparent blur-xl animate-pulse-slow" />
            </h2>

            {loading.history ? (
              <div className="h-32 flex items-center justify-center">
                <LoadingSpinner size="lg" className="animate-cyber-pulse" />
              </div>
            ) : maintenanceMode ? (
              <MaintenanceIndicator />
            ) : error.history ? (
              <div className="border border-red-500/20 rounded-lg p-4 relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/5 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
                <p className="text-red-400 text-center animate-glitch">
                  {error.history}
                </p>
              </div>
            ) : (
              <div className="relative group backdrop-blur-sm border border-dark-300/20 rounded-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <ContestHistory contests={contestHistory} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
