// src/pages/public/general/PublicProfile.tsx

/**
 * This page is used to display a public profile.
 * 
 * @author @BranchManager69
 * @since 2025-04-02
 */

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { AchievementsSection } from "../../../components/achievements/AchievementsSection";
import { UserProgress } from "../../../components/achievements/UserProgress";
import { BanOnSightButton } from "../../../components/admin/BanOnSightButton";
import { CopyToClipboard } from "../../../components/common/CopyToClipboard";
import { ErrorMessage } from "../../../components/common/ErrorMessage";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { AuthDebugPanel } from "../../../components/debug";
import { ContestHistory } from "../../../components/profile/contest-history/ContestHistory";
import SocialAccountsPanel from "../../../components/profile/SocialAccountsPanel";
import UserProfileExtras from "../../../components/UserProfileExtras";

// Import and extend the ContestEntry type from ContestHistory
import { ContestEntry as BaseContestEntry } from "../../../components/profile/contest-history/ContestHistory";

// Extend ContestEntry with a status field
interface EnhancedContestEntry extends Omit<BaseContestEntry, 'contest_id' | 'portfolio_return' | 'rank'> {
  contest_id: number;
  portfolio_return: string;
  rank: string;
  status?: string;
}

// Use the existing type name for compatibility
type ContestEntry = EnhancedContestEntry;

import { useMigratedAuth } from "../../../hooks/auth/useMigratedAuth";
import { ddApi, formatBonusPoints } from "../../../services/dd-api";
import { useStore } from "../../../store/useStore";
import { UserData, UserStats as UserStatsType } from "../../../types/profile";

// Map History Response - Filter out cancelled contests
const mapHistoryResponse = (entry: any): ContestEntry | null => {
  // Skip cancelled contests
  if (entry.status === "cancelled") return null;
  
  return {
    contest_id: Number(entry.contest_id),
    contest_name: entry.contest_name,
    start_time: entry.start_time,
    end_time: entry.end_time,
    portfolio_return: typeof entry.portfolio_return === 'number' 
      ? entry.portfolio_return.toString() + '%'
      : entry.portfolio_return,
    rank: typeof entry.rank === 'number'
      ? entry.rank.toString()
      : entry.rank,
    status: entry.status || "completed", // Default to completed if no status
  };
};

// Loading State
interface LoadingState {
  user: boolean;
  stats: boolean;
  achievements: boolean;
  history: boolean;
}

// Error State
interface ErrorState {
  user: string | null;
  stats: string | null;
  achievements: string | null;
  history: string | null;
}

// Public Profile
export const PublicProfile: React.FC = () => {
  const { identifier } = useParams();
  const { maintenanceMode } = useStore();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userStats, setUserStats] = useState<UserStatsType | null>(null);
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

  // Use useMigratedAuth hook for role checks
  const { isAdministrator } = useMigratedAuth();

  // Helper to determine if a string is likely a Solana wallet address
  // Simple length-based heuristic - Solana addresses are much longer than usernames
  const isWalletAddress = (str: string) => {
    if (!str) return false;
    // If it's 21+ characters, treat it as a wallet address attempt
    return str.length >= 21;
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
        // Determine if we're looking up by wallet address or username
        const isWallet = isWalletAddress(identifier);
        let userResponse;

        try {
          // Use the same endpoint for both - the backend should handle both types
          userResponse = await ddApi.users.getOne(identifier);

          // If we got here, the lookup succeeded
          console.log("[PublicProfile] User data fetched successfully");
        } catch (err) {
          console.error("[PublicProfile] Error fetching user data:", err);
          
          // Set a specific error message based on identifier type
          setError((prev) => ({
            ...prev,
            user: isWallet 
              ? "Wallet address not found" 
              : "Username not found"
          }));
          
          // Stop further processing
          setLoading((prev) => ({
            ...prev,
            user: false,
            stats: false,
            achievements: false,
            history: false,
          }));
          return;
        }

        const balanceResponse = await ddApi.balance.get(
          userResponse.wallet_address,
        );

        setUserData({
          wallet_address: userResponse.wallet_address,
          nickname: userResponse.nickname || null, // Ensure null instead of undefined
          rank_score: userResponse.rank_score || 0, // Ensure number instead of undefined
          created_at: userResponse.created_at || "", // Ensure string instead of undefined
          bonusBalance: formatBonusPoints(balanceResponse.balance),
          is_banned: userResponse.is_banned ?? false,
          ban_reason: userResponse.ban_reason ?? null,
        });

        // Load stats
        setLoading((prev) => ({ ...prev, stats: true }));
        setError((prev) => ({ ...prev, stats: null }));
        const statsResponse = await ddApi.stats.getOverall(
          userResponse.wallet_address,
        );
        setUserStats(statsResponse);

        // Load contest history
        setLoading((prev) => ({ ...prev, history: true }));
        setError((prev) => ({ ...prev, history: null }));
        const historyResponse = await ddApi.stats.getHistory(
          userResponse.wallet_address,
          10,
          0,
        );
        // Filter out cancelled contests and nulls
        const mappedHistory = historyResponse
          .map((entry: any) => mapHistoryResponse(entry))
          .filter((entry: ContestEntry | null): entry is ContestEntry => entry !== null);
        setContestHistory(mappedHistory);
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
                <div className="absolute -bottom-2 -right-2 bg-brand-500 rounded-full px-3 py-1 text-sm font-bold text-white shadow-lg border border-brand-400 transform group-hover:scale-110 transition-transform duration-300 flex items-center gap-1.5">
                  <span className="text-xs text-brand-200">Rank</span>
                  <span className="text-white font-cyber">
                    #{userData.rank_score}
                  </span>
                </div>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-3">
                  <h1 className="text-5xl font-black bg-gradient-to-r from-brand-300 via-brand-400 to-brand-500 text-transparent bg-clip-text animate-gradient-x">
                    {userData.nickname || "Anon Degen"}
                  </h1>

                  {/* Admin controls - only shown if user has admin role */}
                  {isAdministrator && !userData.is_banned && (
                    <BanOnSightButton
                      user={{
                        wallet_address: userData.wallet_address,
                        nickname: userData.nickname ?? undefined,
                        is_banned: userData.is_banned,
                        role: userData.role ?? 'user',
                      }}
                      variant="icon"
                      size="lg"
                      className="ml-2"
                      onSuccess={() => window.location.reload()}
                    />
                  )}
                </div>

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

              {/* User Progress Section */}
              <div className="mt-8 max-w-3xl mx-auto">
                <UserProgress />
              </div>

              {/* Social Accounts */}
              <div className="mt-8 max-w-3xl mx-auto">
                <h3 className="text-xl font-bold mb-4 text-gray-200">
                  Social Accounts
                </h3>
                <SocialAccountsPanel />
              </div>

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
              <AchievementsSection walletAddress={userData?.wallet_address} />
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

      {/* Admin-only wallet tracking - only added for admins/superadmins */}
      {userData && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <UserProfileExtras 
            walletAddress={userData.wallet_address}
            nickname={userData.nickname || undefined}
            showWalletSelector={true}
            compareMode={true}
          />
        </div>
      )}

      {/* Auth Debug Panel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AuthDebugPanel />
      </div>
    </div>
  );
};
