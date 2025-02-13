// src/pages/public/general/PublicProfile.tsx

import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CopyToClipboard } from "../../../components/common/CopyToClipboard";
import { ErrorMessage } from "../../../components/common/ErrorMessage";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { AchievementCard } from "../../../components/profile/AchievementCard";
import {
  ContestEntry,
  ContestHistory,
} from "../../../components/profile/ContestHistory";
import { ddApi, formatBonusPoints } from "../../../services/dd-api";
import { useStore } from "../../../store/useStore";
import {
  Achievement,
  UserData,
  UserStats as UserStatsType,
} from "../../../types/profile";

// Map History Response
const mapHistoryResponse = (entry: any) => ({
  contest_id: entry.contest_id,
  contest_name: entry.contest_name,
  start_time: entry.start_time,
  end_time: entry.end_time,
  portfolio_return: entry.portfolio_return,
  rank: entry.rank,
});

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

export const PublicProfile: React.FC = () => {
  const { identifier } = useParams();
  const { maintenanceMode } = useStore();
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

  // Helper to determine if a string is likely a Solana wallet address
  // TODO: FIX THIS BULLSHIT
  const isWalletAddress = (str: string) => {
    // Base58 check (Solana addresses are base58 encoded)
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return base58Regex.test(str);
  };

  useEffect(() => {
    if (!identifier || maintenanceMode) return;

    const loadProfileData = async () => {
      if (maintenanceMode) {
        setLoading({
          user: false,
          stats: false,
          achievements: false,
          history: false,
        });
        return;
      }

      // Load user data and balance
      setLoading((prev) => ({ ...prev, user: true }));
      setError((prev) => ({ ...prev, user: null }));

      try {
        // Try to get user data based on the identifier type
        const isWallet = isWalletAddress(identifier);
        let userResponse;

        try {
          userResponse = await ddApi.users.getOne(identifier);
        } catch (err) {
          // If the first attempt fails and it's not a wallet address,
          // we might need to try a different API endpoint or handle the error
          if (!isWallet) {
            setError((prev) => ({
              ...prev,
              user: "User not found",
            }));
            return;
          }
          throw err;
        }

        const balanceResponse = await ddApi.balance.get(
          userResponse.wallet_address
        );

        setUserData({
          wallet_address: userResponse.wallet_address,
          nickname: userResponse.nickname,
          rank_score: userResponse.rank_score,
          created_at: userResponse.created_at,
          bonusBalance: formatBonusPoints(balanceResponse.balance),
          is_banned: userResponse.is_banned ?? false,
          ban_reason: userResponse.ban_reason ?? null,
        });

        // Load stats
        setLoading((prev) => ({ ...prev, stats: true }));
        setError((prev) => ({ ...prev, stats: null }));
        const statsResponse = await ddApi.stats.getOverall(
          userResponse.wallet_address
        );
        setUserStats(statsResponse);

        // Load achievements
        setLoading((prev) => ({ ...prev, achievements: true }));
        setError((prev) => ({ ...prev, achievements: null }));
        const achievementsResponse = await ddApi.stats.getAchievements(
          userResponse.wallet_address
        );
        setAchievements(achievementsResponse);

        // Load contest history
        setLoading((prev) => ({ ...prev, history: true }));
        setError((prev) => ({ ...prev, history: null }));
        const historyResponse = await ddApi.stats.getHistory(
          userResponse.wallet_address,
          10,
          0
        );
        setContestHistory(historyResponse.map(mapHistoryResponse));
      } catch (err: any) {
        setError((prev) => ({
          ...prev,
          user: err.response?.data?.message || "Failed to load user data",
        }));
      } finally {
        setLoading((prev) => ({
          ...prev,
          user: false,
          stats: false,
          achievements: false,
          history: false,
        }));
      }
    };

    loadProfileData();
  }, [identifier, maintenanceMode]);

  // In the render method, we'll hide the wallet address if the identifier wasn't a wallet address
  const shouldShowWalletAddress = isWalletAddress(identifier || "");

  // Maintenance Indicator Component
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

  if (!identifier) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-200">
            Invalid Profile
          </h2>
          <p className="mt-2 text-gray-400">This profile does not exist</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Header Section */}
      <div className="relative bg-dark-200/50 backdrop-blur-lg border-b border-dark-300/50 overflow-hidden">
        {/* Animated background effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-brand-500/10 via-transparent to-brand-500/5" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(74,22,220,0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(74,22,220,0.15),transparent_50%)] animate-pulse" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
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
            <div className="text-center space-y-6">
              {/* Profile Picture */}
              <div className="relative inline-block">
                <div className="h-32 w-32 rounded-full bg-brand-500/20 flex items-center justify-center border-2 border-brand-500/30 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <span className="text-6xl transform group-hover:scale-110 transition-transform duration-300">
                    {userData.is_banned ? "🚫" : "👤"}
                  </span>
                </div>
                {/* Rank indicator */}
                <div className="absolute -bottom-2 -right-2 bg-brand-500/90 rounded-full px-3 py-1 text-sm font-bold text-white shadow-lg border border-brand-400/50">
                  Rank #{userData.rank_score}
                </div>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <h1 className="text-5xl font-black bg-gradient-to-r from-brand-300 via-brand-400 to-brand-500 text-transparent bg-clip-text animate-gradient-x">
                  {userData.nickname || "Anonymous Trader"}
                </h1>
                {shouldShowWalletAddress && (
                  <div className="flex items-center justify-center gap-2">
                    <CopyToClipboard
                      text={userData.wallet_address}
                      className="group inline-flex items-center gap-2 px-3 py-1.5 bg-dark-300/50 rounded-full hover:bg-dark-300 transition-colors"
                    >
                      <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors font-mono">
                        {userData.wallet_address.slice(0, 4)}...
                        {userData.wallet_address.slice(-4)}
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-gray-400 group-hover:text-brand-400 transition-colors"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                      </svg>
                    </CopyToClipboard>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              {userStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto mt-8">
                  <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-4 border border-dark-300/50">
                    <div className="text-2xl font-bold text-brand-400">
                      {userStats.total_contests}
                    </div>
                    <div className="text-sm text-gray-400">Contests Played</div>
                  </div>
                  <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-4 border border-dark-300/50">
                    <div className="text-2xl font-bold text-brand-400">
                      {userStats.total_wins}
                    </div>
                    <div className="text-sm text-gray-400">Contests Won</div>
                  </div>
                  <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-4 border border-dark-300/50">
                    <div className="text-2xl font-bold text-brand-400">
                      {userStats.win_rate}%
                    </div>
                    <div className="text-sm text-gray-400">Win Rate</div>
                  </div>
                  <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-4 border border-dark-300/50">
                    <div className="text-2xl font-bold text-brand-400">
                      {userStats.average_return}%
                    </div>
                    <div className="text-sm text-gray-400">Avg. Return</div>
                  </div>
                </div>
              )}

              {/* Join Date */}
              <div className="text-sm text-gray-400">
                Member since{" "}
                {new Date(userData.created_at).toLocaleDateString()}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Achievements Section */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-100 flex items-center gap-2">
              <span>🏆</span>
              <span>Achievements</span>
            </h2>
            {loading.achievements ? (
              <div className="h-32 flex items-center justify-center">
                <LoadingSpinner size="lg" className="animate-cyber-pulse" />
              </div>
            ) : maintenanceMode ? (
              <MaintenanceIndicator />
            ) : error.achievements ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400 text-center">{error.achievements}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {achievements.length > 0 ? (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: {},
                      visible: {
                        transition: {
                          staggerChildren: 0.1,
                        },
                      },
                    }}
                    className="grid grid-cols-1 gap-4"
                  >
                    {achievements.map((achievement, index) => (
                      <motion.div
                        key={achievement.achievement}
                        variants={{
                          hidden: {
                            opacity: 0,
                            y: 20,
                            scale: 0.95,
                          },
                          visible: {
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            transition: {
                              type: "spring",
                              stiffness: 100,
                              damping: 15,
                              mass: 1,
                            },
                          },
                        }}
                        className="relative group"
                      >
                        {/* Achievement connector lines */}
                        {index > 0 && (
                          <div className="absolute -top-4 left-1/2 w-px h-4 bg-gradient-to-b from-brand-500/0 via-brand-500/20 to-brand-500/0" />
                        )}

                        <AchievementCard achievement={achievement} />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="p-8 rounded-lg border border-dark-300/20 backdrop-blur-sm relative group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Empty state content */}
                    <div className="relative text-center space-y-4">
                      <div className="text-4xl animate-bounce">🏆</div>
                      <div>
                        <h3 className="text-xl font-cyber text-brand-300 mb-2">
                          No Achievements Yet
                        </h3>
                        <p className="text-gray-400 group-hover:animate-cyber-pulse">
                          This user hasn't earned any achievements yet.
                        </p>
                      </div>

                      {/* Decorative elements */}
                      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-brand-500/20 to-transparent" />
                        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-brand-500/20 to-transparent" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Contest History Section */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-100 flex items-center gap-2">
              <span>📊</span>
              <span>Contest History</span>
            </h2>
            {loading.history ? (
              <div className="h-32 flex items-center justify-center">
                <LoadingSpinner size="lg" className="animate-cyber-pulse" />
              </div>
            ) : maintenanceMode ? (
              <MaintenanceIndicator />
            ) : error.history ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400 text-center">{error.history}</p>
              </div>
            ) : (
              <div className="relative group overflow-hidden rounded-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <ContestHistory contests={contestHistory} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
